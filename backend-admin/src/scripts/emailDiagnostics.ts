import mongoose from 'mongoose';
import { EmailConfig } from '../models/EmailConfig';
import net from 'net';
import dns from 'dns';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-admin';

interface DiagnosticResult {
  timestamp: string;
  step: string;
  success: boolean;
  data?: any;
  error?: string;
  duration?: number;
}

class EmailDiagnostics {
  private results: DiagnosticResult[] = [];

  private log(step: string, success: boolean, data?: any, error?: string, duration?: number) {
    const result: DiagnosticResult = {
      timestamp: new Date().toISOString(),
      step,
      success,
      data,
      error,
      duration
    };
    this.results.push(result);
    
    const status = success ? '✅' : '❌';
    console.log(`${status} ${step}${duration ? ` (${duration}ms)` : ''}`);
    if (data) console.log('   📊 Data:', JSON.stringify(data, null, 2));
    if (error) console.log('   🚨 Error:', error);
  }

  async runFullDiagnostics(): Promise<void> {
    console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO DE EMAIL');
    console.log('=' .repeat(60));

    try {
      // Step 1: Connect to MongoDB
      const start = Date.now();
      await mongoose.connect(MONGODB_URI);
      this.log('MongoDB Connection', true, { host: mongoose.connection.host }, undefined, Date.now() - start);

      // Step 2: Load email configuration
      const configStart = Date.now();
      const config = await EmailConfig.findOne({ isActive: true });
      if (!config) {
        this.log('Load Email Config', false, null, 'No active email configuration found');
        return;
      }
      this.log('Load Email Config', true, {
        host: config.smtpHost,
        port: config.smtpPort,
        user: config.smtpUser,
        secure: config.smtpSecure,
        hasPassword: !!config.smtpPassword
      }, undefined, Date.now() - configStart);

      // Step 3: DNS Resolution
      const dnsStart = Date.now();
      try {
        const dnsRecords = await dns.promises.lookup(config.smtpHost, { all: true });
        this.log('DNS Resolution', true, { records: dnsRecords }, undefined, Date.now() - dnsStart);
      } catch (dnsError: any) {
        this.log('DNS Resolution', false, null, dnsError.message, Date.now() - dnsStart);
      }

      // Step 4: TCP Connectivity Tests
      const portsToTest = [587, 465, 25];
      for (const port of portsToTest) {
        await this.testTcpConnection(config.smtpHost, port);
      }

      // Step 5: Nodemailer Transport Creation
      await this.testNodemailerTransport(config);

      // Step 6: SMTP Connection Test
      await this.testSmtpConnection(config);

    } catch (error: any) {
      this.log('General Error', false, null, error.message);
    } finally {
      await mongoose.disconnect();
      this.generateReport();
    }
  }

  private async testTcpConnection(host: string, port: number): Promise<void> {
    const start = Date.now();
    return new Promise((resolve) => {
      const socket = net.connect(port, host, () => {
        socket.end();
        this.log(`TCP Connection (${port})`, true, { host, port }, undefined, Date.now() - start);
        resolve();
      });

      socket.setTimeout(10000);
      socket.on('timeout', () => {
        socket.destroy(new Error('timeout'));
      });
      socket.on('error', (err) => {
        this.log(`TCP Connection (${port})`, false, { host, port }, err.message, Date.now() - start);
        resolve();
      });
    });
  }

  private async testNodemailerTransport(config: any): Promise<void> {
    const start = Date.now();
    try {
      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: false,
        requireTLS: true,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPassword
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 10000
      });

      this.log('Nodemailer Transport Creation', true, {
        host: config.smtpHost,
        port: config.smtpPort,
        secure: false,
        requireTLS: true
      }, undefined, Date.now() - start);
    } catch (error: any) {
      this.log('Nodemailer Transport Creation', false, null, error.message, Date.now() - start);
    }
  }

  private async testSmtpConnection(config: any): Promise<void> {
    const start = Date.now();
    try {
      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: false,
        requireTLS: true,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPassword
        },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 15000
      });

      await transporter.verify();
      this.log('SMTP Connection Test', true, { verified: true }, undefined, Date.now() - start);
    } catch (error: any) {
      this.log('SMTP Connection Test', false, null, error.message, Date.now() - start);
    }
  }

  private generateReport(): void {
    console.log('\n📋 REPORTE DE DIAGNÓSTICO');
    console.log('=' .repeat(60));
    
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    
    console.log(`✅ Exitosos: ${successful}`);
    console.log(`❌ Fallidos: ${failed}`);
    
    if (failed > 0) {
      console.log('\n🚨 FALLOS DETECTADOS:');
      this.results.filter(r => !r.success).forEach(result => {
        console.log(`   • ${result.step}: ${result.error}`);
      });
    }

    console.log('\n📊 DETALLES COMPLETOS:');
    console.log(JSON.stringify(this.results, null, 2));
  }
}

// Ejecutar diagnóstico
const diagnostics = new EmailDiagnostics();
diagnostics.runFullDiagnostics().catch(console.error);
