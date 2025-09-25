import nodemailer from 'nodemailer';
import { EmailConfig } from '../models/EmailConfig';
import { EmailTemplate } from '../models/EmailTemplate';
import { IBooking } from '../models/Booking';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text: string;
  cc?: string[];
}

export interface TemplateVariables {
  // Customer info
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  
  // Booking info
  bookingId: string;
  confirmationNumber: string;
  bookingDate: string;
  bookingTime: string;
  
  // Trip info
  pickupLocation: string;
  dropoffLocation: string;
  tripDate: string;
  tripTime: string;
  
  // Vehicle info
  vehicleType: string;
  vehicleCapacity: string;
  
  // Pricing
  basePrice: number;
  additionalFees: number;
  totalPrice: number;
  
  // Company info
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  
  // Custom variables
  [key: string]: any;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: any = null;

  async initialize() {
    try {
      // Use database configuration (managed through admin portal)
      this.config = await EmailConfig.findOne({});
      if (!this.config) {
        console.log('No email configuration found in database');
        console.log('Please configure email settings through the admin portal');
        return false;
      }

      // Check if password is configured
      if (!this.config.smtpPassword || this.config.smtpPassword.trim() === '') {
        console.log('Email configuration found but password is not set');
        console.log('Please set the SMTP password in the admin portal');
        return false;
      }

      console.log('Initializing email service with config:', {
        host: this.config.smtpHost,
        port: this.config.smtpPort,
        secure: this.config.smtpSecure,
        user: this.config.smtpUser,
        fromEmail: this.config.fromEmail,
        hasPassword: !!this.config.smtpPassword
      });

      console.log('Email transport security: using STARTTLS (like booking3)');

      this.transporter = nodemailer.createTransport({
        host: this.config.smtpHost,
        port: this.config.smtpPort,
        secure: false, // Use STARTTLS instead of SSL (copied from working booking3)
        requireTLS: true,
        auth: {
          user: this.config.smtpUser,
          pass: this.config.smtpPassword
        },
        // Add timeout and other options for better error handling
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000
      });

      // Verify connection
      if (this.transporter) {
        console.log('Verifying SMTP connection...');
        await this.transporter.verify();
        console.log('SMTP connection verified successfully');
      }
      
      console.log('Email service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      return false;
    }
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      if (!this.transporter || !this.config) {
        console.error('Email service not initialized');
        return false;
      }

      const mailOptions = {
        from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
        to: emailData.to,
        cc: emailData.cc || [],
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendTemplateEmail(
    templateName: string, 
    booking: IBooking, 
    toEmail: string,
    ccEmails: string[] = []
  ): Promise<boolean> {
    try {
      const template = await EmailTemplate.findOne({ 
        name: templateName, 
        isActive: true 
      });

      if (!template) {
        console.error(`Template not found: ${templateName}`);
        return false;
      }

      const variables = await this.extractVariablesFromBooking(booking);
      const subject = this.replaceVariables(template.subject, variables);
      const htmlContent = this.replaceVariables(template.htmlContent, variables);
      const textContent = this.replaceVariables(template.textContent, variables);

      // Add admin email to CC if not already included
      if (this.config?.adminEmail && !ccEmails.includes(this.config.adminEmail)) {
        ccEmails.push(this.config.adminEmail);
      }

      return await this.sendEmail({
        to: toEmail,
        subject,
        html: htmlContent,
        text: textContent,
        cc: ccEmails
      });
    } catch (error) {
      console.error('Failed to send template email:', error);
      return false;
    }
  }

  private async extractVariablesFromBooking(booking: IBooking): Promise<TemplateVariables> {
    // Get service agreement
    let serviceAgreement = '';
    try {
      const { ServiceAgreement } = await import('../models/ServiceAgreement');
      const agreement = await ServiceAgreement.findOne({ isActive: true });
      if (agreement) {
        serviceAgreement = agreement.htmlContent;
      }
    } catch (error) {
      console.error('Error fetching service agreement:', error);
    }

    // Get company information
    let companyInfo = {
      companyName: 'Airport Shuttle TPA',
      companyEmail: 'info@airportshuttletpa.com',
      companyPhone: '+1 (813) 555-0123',
      companyWebsite: 'https://airportshuttletpa.com',
      companyAddress: '123 Airport Blvd',
      companyCity: 'Tampa',
      companyState: 'FL',
      companyZipCode: '33607',
      companyCountry: 'USA',
      businessLicense: '',
      taxId: '',
      operatingHours: '24/7',
      emergencyContact: '+1 (813) 555-0123',
      logoUrl: '',
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
      accentColor: '#28a745',
      backgroundColor: '#ffffff',
      textColor: '#333333',
      facebookUrl: '',
      instagramUrl: '',
      twitterUrl: '',
      linkedinUrl: '',
      description: 'Professional airport transportation services in Tampa Bay area',
      missionStatement: 'To provide safe, reliable, and comfortable transportation services to our customers',
      termsOfService: '',
      privacyPolicy: ''
    };

    try {
      const { CompanyInfo } = await import('../models/CompanyInfo');
      const company = await CompanyInfo.findOne({ isActive: true });
      if (company) {
        companyInfo = {
          companyName: company.companyName,
          companyEmail: company.companyEmail,
          companyPhone: company.companyPhone,
          companyWebsite: company.companyWebsite,
          companyAddress: company.companyAddress,
          companyCity: company.companyCity,
          companyState: company.companyState,
          companyZipCode: company.companyZipCode,
          companyCountry: company.companyCountry,
          businessLicense: company.businessLicense,
          taxId: company.taxId,
          operatingHours: company.operatingHours,
          emergencyContact: company.emergencyContact,
          logoUrl: company.logoUrl,
          primaryColor: company.primaryColor,
          secondaryColor: company.secondaryColor,
          accentColor: company.accentColor,
          backgroundColor: company.backgroundColor,
          textColor: company.textColor,
          facebookUrl: company.facebookUrl,
          instagramUrl: company.instagramUrl,
          twitterUrl: company.twitterUrl,
          linkedinUrl: company.linkedinUrl,
          description: company.description,
          missionStatement: company.missionStatement,
          termsOfService: company.termsOfService,
          privacyPolicy: company.privacyPolicy
        };
      }
    } catch (error) {
      console.error('Error fetching company info:', error);
    }

    return {
      // Customer info
      customerName: `${booking.userData.firstName} ${booking.userData.lastName}`,
      customerEmail: booking.userData.email,
      customerPhone: booking.userData.phone,
      
      // Booking info
      bookingId: booking._id?.toString() || '',
      confirmationNumber: booking.outboundConfirmationNumber,
      bookingDate: new Date(booking.createdAt).toLocaleDateString(),
      bookingTime: new Date(booking.createdAt).toLocaleTimeString(),
      
      // Trip info
      pickupLocation: booking.tripInfo.pickupLocation || booking.tripInfo.pickup,
      dropoffLocation: booking.tripInfo.dropoffLocation || booking.tripInfo.dropoff,
      tripDate: booking.tripInfo.date,
      tripTime: `${booking.tripInfo.pickupHour}:${booking.tripInfo.pickupMinute} ${booking.tripInfo.pickupPeriod}`,
      
      // Vehicle info
      vehicleType: booking.vehicleType || 'Standard Vehicle',
      vehicleCapacity: booking.tripInfo.passengers.toString(),
      
      // Pricing
      basePrice: booking.totalPrice,
      additionalFees: 0,
      totalPrice: booking.totalPrice,
      
      // Company info
      companyName: companyInfo.companyName,
      companyEmail: companyInfo.companyEmail,
      companyPhone: companyInfo.companyPhone,
      companyWebsite: companyInfo.companyWebsite,
      companyAddress: companyInfo.companyAddress,
      companyCity: companyInfo.companyCity,
      companyState: companyInfo.companyState,
      companyZipCode: companyInfo.companyZipCode,
      companyCountry: companyInfo.companyCountry,
      fullAddress: `${companyInfo.companyAddress}, ${companyInfo.companyCity}, ${companyInfo.companyState} ${companyInfo.companyZipCode}, ${companyInfo.companyCountry}`,
      businessLicense: companyInfo.businessLicense,
      taxId: companyInfo.taxId,
      operatingHours: companyInfo.operatingHours,
      emergencyContact: companyInfo.emergencyContact,
      logoUrl: companyInfo.logoUrl,
      primaryColor: companyInfo.primaryColor,
      secondaryColor: companyInfo.secondaryColor,
      accentColor: companyInfo.accentColor,
      backgroundColor: companyInfo.backgroundColor,
      textColor: companyInfo.textColor,
      facebookUrl: companyInfo.facebookUrl,
      instagramUrl: companyInfo.instagramUrl,
      twitterUrl: companyInfo.twitterUrl,
      linkedinUrl: companyInfo.linkedinUrl,
      description: companyInfo.description,
      missionStatement: companyInfo.missionStatement,
      termsOfService: companyInfo.termsOfService,
      privacyPolicy: companyInfo.privacyPolicy,
      
      // Service Agreement
      serviceAgreement: serviceAgreement
    };
  }

  private replaceVariables(content: string, variables: TemplateVariables): string {
    let result = content;
    
    // Replace all variables in the format {{variableName}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'gi');
      result = result.replace(regex, String(value));
    });
    
    return result;
  }

  async sendConfirmationEmail(booking: IBooking): Promise<boolean> {
    return await this.sendTemplateEmail('confirmation', booking, booking.userData.email);
  }

  async sendReceiptEmail(booking: IBooking): Promise<boolean> {
    return await this.sendTemplateEmail('receipt', booking, booking.userData.email);
  }

  getAvailableVariables(): string[] {
    return [
      'customerName', 'customerEmail', 'customerPhone',
      'bookingId', 'confirmationNumber', 'bookingDate', 'bookingTime',
      'pickupLocation', 'dropoffLocation', 'tripDate', 'tripTime',
      'vehicleType', 'vehicleCapacity',
      'basePrice', 'additionalFees', 'totalPrice',
      'companyName', 'companyEmail', 'companyPhone', 'companyWebsite',
      'companyAddress', 'companyCity', 'companyState', 'companyZipCode', 'companyCountry',
      'fullAddress', 'businessLicense', 'taxId', 'operatingHours', 'emergencyContact',
      'logoUrl', 'primaryColor', 'secondaryColor', 'accentColor', 'backgroundColor', 'textColor',
      'facebookUrl', 'instagramUrl', 'twitterUrl', 'linkedinUrl',
      'description', 'missionStatement', 'termsOfService', 'privacyPolicy',
      'serviceAgreement'
    ];
  }
}

export const emailService = new EmailService();
