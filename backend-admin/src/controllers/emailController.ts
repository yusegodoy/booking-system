import { Request, Response } from 'express';
import { EmailConfig } from '../models/EmailConfig';
import { EmailTemplate } from '../models/EmailTemplate';
import { emailService } from '../services/emailService';

export const emailController = {
  // Email Configuration
  async getEmailConfig(req: Request, res: Response) {
    try {
      // Get active email configuration (like booking3)
      const config = await EmailConfig.findOne({ isActive: true });
      if (!config) {
        return res.status(404).json({ message: 'No email configuration found' });
      }
      
      console.log('📧 Loading email config from database:', {
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
        smtpUser: config.smtpUser,
        smtpSecure: config.smtpSecure,
        fromEmail: config.fromEmail,
        isActive: config.isActive,
        hasPassword: !!config.smtpPassword
      });
      
      // Don't send password in response
      const { smtpPassword, ...safeConfig } = config.toObject();
      return res.json(safeConfig);
    } catch (error) {
      console.error('Error getting email config:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  async updateEmailConfig(req: Request, res: Response) {
    try {
      const {
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPassword,
        smtpSecure,
        fromEmail,
        fromName,
        adminEmail,
        isActive
      } = req.body;

      console.log('📧 Updating email configuration:', {
        smtpHost,
        smtpPort,
        smtpUser,
        smtpSecure,
        fromEmail,
        isActive
      });

      // Find existing config or create new one (like booking3)
      let config = await EmailConfig.findOne({ isActive: true });
      
      if (!config) {
        console.log('📧 Creating new email configuration');
        config = new EmailConfig({
          smtpHost,
          smtpPort,
          smtpUser,
          smtpPassword,
          smtpSecure,
          fromEmail,
          fromName,
          adminEmail,
          isActive
        });
      } else {
        console.log('📧 Updating existing email configuration');
        config.smtpHost = smtpHost;
        config.smtpPort = smtpPort;
        config.smtpUser = smtpUser;
        if (smtpPassword) {
          config.smtpPassword = smtpPassword;
        }
        config.smtpSecure = smtpSecure;
        config.fromEmail = fromEmail;
        config.fromName = fromName;
        config.adminEmail = adminEmail;
        config.isActive = isActive;
      }

      await config.save();
      console.log('✅ Email configuration saved successfully');

      // Reinitialize email service if config is active
      if (isActive) {
        try {
          const emailInitialized = await emailService.initialize();
          if (!emailInitialized) {
            console.warn('Email service initialization failed, but configuration was saved');
          }
        } catch (error) {
          console.error('Error reinitializing email service:', error);
          // Don't fail the request if email service fails to initialize
        }
      }

      const { smtpPassword: _, ...safeConfig } = config.toObject();
      return res.json({ message: 'Email configuration updated successfully', config: safeConfig });
    } catch (error) {
      console.error('Error updating email config:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  async testEmailConfig(req: Request, res: Response) {
    try {
      const config = await EmailConfig.findOne({ isActive: true });
      if (!config) {
        return res.status(400).json({ message: 'No active email configuration found' });
      }

      console.log('Testing email config for:', config.adminEmail);

      const success = await emailService.initialize();
      if (!success) {
        console.error('Email service initialization failed');
        return res.status(400).json({ 
          message: 'Failed to initialize email service. Check your SMTP settings and try again.' 
        });
      }

      // Send test email
      const testResult = await emailService.sendEmail({
        to: config.adminEmail,
        subject: 'Test Email - Airport Shuttle TPA',
        html: '<h1>Test Email</h1><p>This is a test email to verify your email configuration.</p>',
        text: 'Test Email - This is a test email to verify your email configuration.'
      });

      if (testResult) {
        return res.json({ message: 'Test email sent successfully' });
      } else {
        return res.status(400).json({ message: 'Failed to send test email' });
      }
    } catch (error) {
      console.error('Error testing email config:', error);
      let errorMessage = 'Internal server error';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return res.status(500).json({ message: errorMessage });
    }
  },

  // Diagnostics: test DNS and TCP reachability to SMTP host/ports from server
  async runSmtpDiagnostics(req: Request, res: Response) {
    try {
      const config = await EmailConfig.findOne({});
      if (!config) {
        return res.status(404).json({ success: false, message: 'No email configuration found' });
      }

      const dns = await import('dns');
      const net = await import('net');

      const host = config.smtpHost || 'smtp.ionos.com';
      const ports = [587, 465, config.smtpPort].filter((v, i, a) => a.indexOf(v) === i);
      const results: any = { host, records: null, tests: [] };

      console.log('📡 SMTP diagnostics started for host:', host, 'ports:', ports);

      // DNS lookup
      try {
        const lookup = await (dns.promises as any).lookup(host, { all: true });
        results.records = lookup;
        console.log('📡 DNS lookup results:', lookup);
      } catch (e) {
        results.records = { error: (e as any)?.message || 'DNS lookup failed' };
        console.warn('⚠️  DNS lookup failed:', results.records);
      }

      // TCP connect helper
      const tryConnect = (port: number) => {
        return new Promise((resolve) => {
          const socket = new (net as any).Socket();
          const start = Date.now();
          let finished = false;

          const finish = (ok: boolean, info: any = {}) => {
            if (finished) return;
            finished = true;
            try { socket.destroy(); } catch {}
            resolve({ port, ok, ms: Date.now() - start, ...info });
          };

          socket.setTimeout(8000);
          socket.on('connect', () => finish(true));
          socket.on('timeout', () => finish(false, { error: 'timeout' }));
          socket.on('error', (err: any) => finish(false, { error: err?.code || err?.message }));
          socket.connect(port, host);
        });
      };

      for (const p of ports) {
        // eslint-disable-next-line no-await-in-loop
        const r: any = await tryConnect(p);
        results.tests.push(r);
        console.log('📡 Port test:', r);
      }

      console.log('✅ SMTP diagnostics finished');
      return res.json({
        success: true,
        info: {
          config: {
            host: config.smtpHost,
            port: config.smtpPort,
            secure: config.smtpSecure,
            user: config.smtpUser,
            hasPassword: !!config.smtpPassword,
            isActive: config.isActive
          },
          connectivity: results
        }
      });
    } catch (error) {
      console.error('SMTP diagnostics error:', error);
      return res.status(500).json({ success: false, message: 'Diagnostics failed' });
    }
  },

  // Email Templates
  async getEmailTemplates(req: Request, res: Response) {
    try {
      const templates = await EmailTemplate.find().sort({ createdAt: -1 });
      return res.json(templates);
    } catch (error) {
      console.error('Error getting email templates:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  async getEmailTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const template = await EmailTemplate.findById(id);
      
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }
      
      return res.json(template);
    } catch (error) {
      console.error('Error getting email template:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  async createEmailTemplate(req: Request, res: Response) {
    try {
      const {
        name,
        subject,
        htmlContent,
        textContent,
        type,
        isActive,
        variables
      } = req.body;

      const template = new EmailTemplate({
        name,
        subject,
        htmlContent,
        textContent,
        type,
        isActive,
        variables
      });

      await template.save();
      return res.status(201).json({ message: 'Template created successfully', template });
    } catch (error) {
      console.error('Error creating email template:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  async updateEmailTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const template = await EmailTemplate.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );

      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }

      return res.json({ message: 'Template updated successfully', template });
    } catch (error) {
      console.error('Error updating email template:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  async deleteEmailTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const template = await EmailTemplate.findByIdAndDelete(id);

      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }

      return res.json({ message: 'Template deleted successfully' });
    } catch (error) {
      console.error('Error deleting email template:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  async getAvailableVariables(req: Request, res: Response) {
    try {
      const variables = emailService.getAvailableVariables();
      return res.json(variables);
    } catch (error) {
      console.error('Error getting available variables:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Send emails
  async sendTemplateEmail(req: Request, res: Response) {
    try {
      const { bookingId, templateName, toEmail, ccEmails } = req.body;

      const booking = await require('../models/Booking').Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      const success = await emailService.sendTemplateEmail(
        templateName,
        booking,
        toEmail || booking.userData.email,
        ccEmails || []
      );

      if (success) {
        return res.json({ message: 'Email sent successfully' });
      } else {
        return res.status(400).json({ message: 'Failed to send email' });
      }
    } catch (error) {
      console.error('Error sending template email:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Test email template with sample data
  async testEmailTemplate(req: Request, res: Response) {
    try {
      const { templateId, testEmail } = req.body;

      if (!templateId) {
        return res.status(400).json({ message: 'Template ID is required' });
      }

      if (!testEmail) {
        return res.status(400).json({ message: 'Test email address is required' });
      }

      // Get the template
      const template = await EmailTemplate.findById(templateId);
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }

      // Check if email config is active
      const config = await EmailConfig.findOne({ isActive: true });
      if (!config) {
        return res.status(400).json({ message: 'No active email configuration found' });
      }

      // Initialize email service
      const success = await emailService.initialize();
      if (!success) {
        return res.status(400).json({ 
          message: 'Failed to initialize email service. Check your SMTP settings.' 
        });
      }

      // Create sample booking data for testing
      const sampleBooking = {
        _id: 'test-booking-id',
        outboundConfirmationNumber: 'TEST-001',
        userData: {
          firstName: 'John',
          lastName: 'Doe',
          email: testEmail,
          phone: '+1 (555) 123-4567'
        },
        tripInfo: {
          pickup: 'Tampa International Airport (TPA)',
          dropoff: 'Downtown Tampa Hotel',
          date: new Date().toISOString(),
          pickupHour: '14',
          pickupMinute: '30',
          pickupPeriod: 'PM',
          passengers: 2,
          checkedLuggage: 1,
          carryOn: 2,
          infantSeats: 0,
          toddlerSeats: 0,
          boosterSeats: 0,
          flight: 'AA1234',
          airportCode: 'TPA',
          terminalGate: 'Terminal A, Gate 12'
        },
        vehicleType: 'Standard Sedan',
        totalPrice: 45.00,
        status: 'Confirmed',
        paymentMethod: 'Credit Card',
        roundTrip: false,
        createdAt: new Date().toISOString()
      };

      // Replace variables in template content
      let processedSubject = template.subject;
      let processedHtmlContent = template.htmlContent;
      let processedTextContent = template.textContent;

      // Replace common variables
      const variables = {
        '{{customerName}}': `${sampleBooking.userData.firstName} ${sampleBooking.userData.lastName}`,
        '{{customerFirstName}}': sampleBooking.userData.firstName,
        '{{customerLastName}}': sampleBooking.userData.lastName,
        '{{customerEmail}}': sampleBooking.userData.email,
        '{{customerPhone}}': sampleBooking.userData.phone,
        '{{confirmationNumber}}': sampleBooking.outboundConfirmationNumber,
        '{{pickupLocation}}': sampleBooking.tripInfo.pickup,
        '{{dropoffLocation}}': sampleBooking.tripInfo.dropoff,
        '{{pickupDate}}': new Date(sampleBooking.tripInfo.date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        '{{pickupTime}}': `${sampleBooking.tripInfo.pickupHour}:${sampleBooking.tripInfo.pickupMinute} ${sampleBooking.tripInfo.pickupPeriod}`,
        '{{passengers}}': sampleBooking.tripInfo.passengers.toString(),
        '{{vehicleType}}': sampleBooking.vehicleType,
        '{{totalPrice}}': `$${sampleBooking.totalPrice.toFixed(2)}`,
        '{{flightNumber}}': sampleBooking.tripInfo.flight,
        '{{airportCode}}': sampleBooking.tripInfo.airportCode,
        '{{terminalGate}}': sampleBooking.tripInfo.terminalGate,
        '{{companyName}}': 'Airport Shuttle TPA',
        '{{companyPhone}}': '+1 (555) 123-4567',
        '{{companyEmail}}': 'info@airportshuttletpa.com',
        '{{companyWebsite}}': 'https://airportshuttletpa.com',
        '{{serviceAgreement}}': '<p><strong>Service Agreement:</strong> By using our service, you agree to our terms and conditions...</p>'
      };

      // Replace variables in subject
      Object.entries(variables).forEach(([variable, value]) => {
        processedSubject = processedSubject.replace(new RegExp(variable, 'g'), value);
        processedHtmlContent = processedHtmlContent.replace(new RegExp(variable, 'g'), value);
        processedTextContent = processedTextContent.replace(new RegExp(variable, 'g'), value);
      });

      // Send test email
      const testResult = await emailService.sendEmail({
        to: testEmail,
        subject: `[TEST] ${processedSubject}`,
        html: processedHtmlContent,
        text: processedTextContent
      });

      if (testResult) {
        return res.json({ 
          message: 'Test email sent successfully',
          testData: {
            templateName: template.name,
            testEmail: testEmail,
            processedSubject: `[TEST] ${processedSubject}`,
            variablesUsed: Object.keys(variables)
          }
        });
      } else {
        return res.status(400).json({ message: 'Failed to send test email' });
      }
    } catch (error) {
      console.error('Error testing email template:', error);
      let errorMessage = 'Internal server error';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return res.status(500).json({ message: errorMessage });
    }
  }
};
