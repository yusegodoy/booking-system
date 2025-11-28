import { Resend } from 'resend';
import { EmailConfig } from '../models/EmailConfig';
import { EmailTemplate } from '../models/EmailTemplate';
import { EmailVariable } from '../models/EmailVariable';
import { IBooking } from '../models/Booking';
import { SimpleTemplateProcessor } from './simpleTemplateProcessor';
import { DEFAULT_LOGO_DATA_URL } from '../assets/defaultLogoData';
import path from 'path';
import fs from 'fs';

export interface EmailAttachment {
  filename: string;
  content: string;
  contentType?: string;
  path?: string;
  cid?: string;
  content_id?: string; // Resend uses content_id for inline attachments
  disposition?: 'inline' | 'attachment';
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text: string;
  cc?: string[];
  attachments?: EmailAttachment[];
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

class ResendEmailService {
  private resend: Resend | null = null;
  private config: any = null;
  private fromEmail: string = '';

  async initialize() {
    try {
      // Get Resend API key from environment
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        console.log('❌ RESEND_API_KEY not found in environment variables');
        console.log('Please set RESEND_API_KEY in Railway environment variables');
        return false;
      }

      // Get email config from database
      this.config = await EmailConfig.findOne({ isActive: true });
      if (!this.config) {
        console.log('No active email configuration found');
        return false;
      }

      // Use verified domain from Resend
      this.fromEmail = this.config.fromEmail || 'info@airportshuttletpa.com';

      console.log('🚀 Initializing Resend email service:', {
        apiKey: apiKey.substring(0, 8) + '...',
        fromEmail: this.fromEmail,
        service: 'Resend (Railway compatible)'
      });

      this.resend = new Resend(apiKey);

      // Verify API key by sending a test ping (optional)
      try {
        // Note: Resend doesn't have a verify method, so we'll just test the connection
        console.log('✅ Resend service initialized successfully');
        console.log('📧 Ready to send emails via Resend API');
      } catch (error) {
        console.error('❌ Failed to verify Resend API key:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Resend email service:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      return false;
    }
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      if (!this.resend) {
        console.error('Resend email service not initialized');
        return false;
      }

      console.log('📤 Sending email via Resend:', {
        to: emailData.to,
        subject: emailData.subject,
        from: this.fromEmail
      });

      // Transform attachments for Resend API format
      const resendAttachments = emailData.attachments?.map(att => {
        const resendAtt: any = {
          filename: att.filename,
          content: att.content
        };
        
        // For inline attachments, use content_id (Resend's format)
        // Resend requires content_id (not cid) for inline attachments
        if (att.disposition === 'inline') {
          const contentId = att.content_id || att.cid;
          if (contentId) {
            resendAtt.content_id = contentId;
            console.log('✅ Setting content_id for inline attachment:', contentId);
          } else {
            console.warn('⚠️ Inline attachment missing content_id/cid');
          }
        }
        
        return resendAtt;
      }) || [];
      
      if (resendAttachments.length > 0) {
        console.log('📎 Sending email with', resendAttachments.length, 'attachment(s)');
      }

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: emailData.to,
        cc: emailData.cc || [],
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        attachments: resendAttachments.length > 0 ? resendAttachments : undefined
      });

      console.log('✅ Email sent successfully via Resend:', result.data?.id);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email via Resend:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
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

      // Try to build inline logo attachment (preferred for emails)
      // First try logoDataUrl (base64), then try to read file and convert to base64, then fallback to public URL
      let logoForAttachment = variables.logoDataUrl;
      
      // If logoDataUrl is not available but we have a relative path, try to read the file
      if (!logoForAttachment || logoForAttachment === DEFAULT_LOGO_DATA_URL) {
        const logoPath = variables.logoUrl || variables.logoPublicUrl;
        if (logoPath && !logoPath.startsWith('http') && !logoPath.startsWith('data:') && !logoPath.startsWith('cid:')) {
          // Try to read the file and convert to base64
          const dataUrl = this.buildLogoDataUrl(logoPath);
          if (dataUrl && dataUrl !== DEFAULT_LOGO_DATA_URL) {
            logoForAttachment = dataUrl;
          }
        }
      }
      
      // If still no valid logo, use the public URL or default
      if (!logoForAttachment || logoForAttachment === DEFAULT_LOGO_DATA_URL) {
        logoForAttachment = variables.logoPublicUrl || variables.logoUrl || DEFAULT_LOGO_DATA_URL;
      }

      const inlineLogo = this.buildInlineLogoAttachment(logoForAttachment);
      const attachments: EmailAttachment[] = [];

      if (inlineLogo) {
        console.log('✅ Creating inline logo attachment with CID:', inlineLogo.cidReference);
        attachments.push(inlineLogo.attachment);
        const cidReference = inlineLogo.cidReference;
        variables.logoCid = cidReference;
        variables.logoUrl = cidReference;
        variables.companyLogoUrl = cidReference;
        variables.logoPublicUrl = cidReference;
        console.log('✅ Logo URL set to CID reference:', cidReference);
      } else {
        console.log('⚠️ Inline logo attachment failed, using public URL');
        // If inline attachment failed, use public URL
        // Make sure logoUrl is an absolute URL, not a relative path
        if (variables.logoUrl && !variables.logoUrl.startsWith('http') && !variables.logoUrl.startsWith('data:') && !variables.logoUrl.startsWith('cid:')) {
          variables.logoUrl = this.buildPublicLogoUrl(variables.logoUrl);
          variables.companyLogoUrl = variables.logoUrl;
          variables.logoPublicUrl = variables.logoUrl;
        }
      }
      
      // Use the SimpleTemplateProcessor for template processing with merged variables
      const processed = SimpleTemplateProcessor.processEmailTemplate(
        template.htmlContent, 
        template.textContent, 
        booking,
        variables as any
      );

      // Process subject with simple variable replacement for now
      const subject = this.replaceVariables(template.subject, variables);

      // Add admin email to CC if not already included
      if (this.config?.adminEmail && !ccEmails.includes(this.config.adminEmail)) {
        ccEmails.push(this.config.adminEmail);
      }

      return await this.sendEmail({
        to: toEmail,
        subject,
        html: processed.html,
        text: processed.text,
        cc: ccEmails,
        attachments
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
      logoUrl: DEFAULT_LOGO_DATA_URL,
      logoPublicUrl: DEFAULT_LOGO_DATA_URL,
      logoDataUrl: DEFAULT_LOGO_DATA_URL,
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
        const normalizedLogoUrl = company.logoUrl || '';
        const logoPublicUrl = this.buildPublicLogoUrl(normalizedLogoUrl);
        const logoDataUrl = this.buildLogoDataUrl(normalizedLogoUrl);

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
          logoUrl: logoPublicUrl.startsWith('data:') ? logoDataUrl : normalizedLogoUrl || DEFAULT_LOGO_DATA_URL,
          logoPublicUrl,
          logoDataUrl,
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

    // Get vehicle type name if vehicleType is an ID
    let vehicleTypeName = booking.vehicleType || 'Standard Vehicle';
    if (booking.vehicleType) {
      // Check if vehicleType is an ObjectId (24 hex characters)
      const objectIdPattern = /^[0-9a-fA-F]{24}$/;
      if (objectIdPattern.test(String(booking.vehicleType))) {
        try {
          const { VehicleType } = await import('../models/VehicleType');
          const vehicleTypeDoc = await VehicleType.findById(booking.vehicleType);
          if (vehicleTypeDoc) {
            vehicleTypeName = vehicleTypeDoc.name;
            console.log(`✅ Found vehicle type name: ${vehicleTypeName} for ID: ${booking.vehicleType}`);
          } else {
            console.warn(`⚠️ VehicleType not found for ID: ${booking.vehicleType}`);
          }
        } catch (error) {
          console.error('Error fetching vehicle type:', error);
          // Keep the original value if lookup fails
        }
      }
      // If it's not an ObjectId, assume it's already a name
    }

    return {
      // Customer Information (from BookingEditor FormData)
      firstName: booking.userData.firstName || '',
      lastName: booking.userData.lastName || '',
      email: booking.userData.email || '',
      phone: booking.userData.phone || '',
      specialInstructions: booking.userData.specialInstructions || '',
      groupName: booking.groupName || '',
      occasion: booking.occasion || '',
      greetingSign: booking.greetingSign || '',
      timeZone: booking.timeZone || 'America/New_York',
      
      // Trip Information
      pickup: booking.tripInfo.pickup || booking.tripInfo.pickupLocation || '',
      dropoff: booking.tripInfo.dropoff || booking.tripInfo.dropoffLocation || '',
      date: booking.tripInfo.date || '',
      pickupDate: booking.tripInfo.pickupDate || booking.tripInfo.date || '',
      pickupHour: booking.tripInfo.pickupHour || '12',
      pickupMinute: booking.tripInfo.pickupMinute || '00',
      pickupPeriod: booking.tripInfo.pickupPeriod || 'AM',
      additionalStops: Array.isArray(booking.tripInfo.stops) ? booking.tripInfo.stops.join(', ') : (booking.tripInfo.stops || ''),
      routeDistance: '', // Not available in current IBooking interface
      routeDuration: '', // Not available in current IBooking interface
      passengers: booking.tripInfo.passengers || 1,
      
      // Luggage & Seats
      checkedLuggage: booking.tripInfo.checkedLuggage || 0,
      carryOn: booking.tripInfo.carryOn || 0,
      infantSeats: booking.tripInfo.infantSeats || 0,
      toddlerSeats: booking.tripInfo.toddlerSeats || 0,
      boosterSeats: booking.tripInfo.boosterSeats || 0,
      
      // Flight Information
      flight: booking.tripInfo.flight || '',
      airportCode: booking.tripInfo.airportCode || '',
      terminalGate: booking.tripInfo.terminalGate || '',
      meetOption: booking.tripInfo.meetOption || '',
      
      // Round Trip Information
      roundTrip: booking.tripInfo.roundTrip || false,
      returnDate: booking.tripInfo.returnDate || '',
      returnHour: booking.tripInfo.returnHour || '',
      returnMinute: booking.tripInfo.returnMinute || '',
      returnPeriod: booking.tripInfo.returnPeriod || '',
      returnFlight: booking.tripInfo.returnFlight || '',
      
      // Service & Vehicle
      serviceType: booking.serviceType || '',
      vehicleType: vehicleTypeName,
      
      // Payment and Status
      paymentMethod: booking.paymentMethod || '',
      checkoutType: booking.checkoutType || '',
      isLoggedIn: booking.isLoggedIn || false,
      status: booking.status || '',
      totalPrice: booking.totalPrice || 0,
      
      // Price Breakdown
      calculatedPrice: booking.calculatedPrice || booking.totalPrice || 0,
      bookingFee: booking.bookingFee || 0,
      childSeatsCharge: booking.childSeatsCharge || 0,
      discountPercentage: booking.discountPercentage || 0,
      discountFixed: booking.discountFixed || 0,
      roundTripDiscount: booking.roundTripDiscount || 0,
      gratuityPercentage: booking.gratuityPercentage || 0,
      gratuityFixed: booking.gratuityFixed || 0,
      taxesPercentage: booking.taxesPercentage || 0,
      taxesFixed: booking.taxesFixed || 0,
      creditCardFeePercentage: booking.creditCardFeePercentage || 0,
      creditCardFeeFixed: booking.creditCardFeeFixed || 0,
      
      // Backend Price Breakdown (using available fields)
      basePrice: booking.calculatedPrice || booking.totalPrice || 0,
      distancePrice: 0, // Not available in current IBooking interface
      stopsCharge: 0, // Not available in current IBooking interface
      returnTripPrice: booking.roundTripDiscount || 0,
      subtotal: booking.calculatedPrice || booking.totalPrice || 0,
      paymentDiscount: booking.discountFixed || 0,
      areaName: '', // Not available in current IBooking interface
      pricingMethod: '', // Not available in current IBooking interface
      distance: 0, // Not available in current IBooking interface
      surgeMultiplier: 1, // Not available in current IBooking interface
      surgeName: '', // Not available in current IBooking interface
      
      // Assignment
      assignedDriver: booking.assignedDriver || '',
      assignedVehicle: booking.assignedVehicle || '',
      notes: booking.notes || '',
      dispatchNotes: booking.dispatchNotes || '',
      
      // Notifications
      changeNotifications: booking.changeNotifications || '',
      
      // Booking Identifiers
      bookingId: booking._id?.toString() || '',
      confirmationNumber: booking.outboundConfirmationNumber || '',
      outboundConfirmationNumber: booking.outboundConfirmationNumber || '',
      returnConfirmationNumber: booking.returnConfirmationNumber || '',
      
      // Legacy variables for backward compatibility
      customerName: `${booking.userData.firstName} ${booking.userData.lastName}`,
      customerEmail: booking.userData.email || '',
      customerPhone: booking.userData.phone || '',
      bookingDate: new Date(booking.createdAt).toLocaleDateString(),
      bookingTime: new Date(booking.createdAt).toLocaleTimeString(),
      pickupLocation: booking.tripInfo.pickup || booking.tripInfo.pickupLocation || '',
      dropoffLocation: booking.tripInfo.dropoff || booking.tripInfo.dropoffLocation || '',
      tripDate: booking.tripInfo.date || '',
      tripTime: `${booking.tripInfo.pickupHour}:${booking.tripInfo.pickupMinute} ${booking.tripInfo.pickupPeriod}`,
      vehicleCapacity: booking.tripInfo.passengers?.toString() || '1',
      additionalFees: 0,
      
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
      logoUrl: companyInfo.logoDataUrl || companyInfo.logoPublicUrl || companyInfo.logoUrl,
      logoPublicUrl: companyInfo.logoPublicUrl || companyInfo.logoDataUrl || companyInfo.logoUrl,
      logoDataUrl: companyInfo.logoDataUrl,
      companyLogoUrl: companyInfo.logoDataUrl || companyInfo.logoPublicUrl || companyInfo.logoUrl,
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
    // Use the SimpleTemplateProcessor for template processing
    const processor = SimpleTemplateProcessor.getInstance();
    return processor.processTemplate(content, variables as any);
  }

  private buildPublicLogoUrl(relativePath: string): string {
    if (!relativePath) {
      return DEFAULT_LOGO_DATA_URL;
    }

    if (/^data:/i.test(relativePath)) {
      return relativePath;
    }

    if (/^https?:\/\//i.test(relativePath)) {
      return relativePath;
    }

    // Determine base URL based on environment
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const port = process.env.PORT || '5001';
    
    const candidates = [
      process.env.API_PUBLIC_URL,
      process.env.API_BASE_URL,
      process.env.BACKEND_PUBLIC_URL,
      process.env.BACKEND_URL,
      process.env.BACKEND_BASE_URL,
      process.env.FRONTEND_URL
    ];

    let baseUrl = candidates.find((value) => value && value.trim().length > 0)?.trim();
    
    // If no base URL found, use localhost for development or production URL for production
    if (!baseUrl) {
      if (isDevelopment) {
        baseUrl = `http://localhost:${port}`;
      } else {
        baseUrl = 'https://api.booking.airportshuttletpa.com';
      }
    }
    
    baseUrl = baseUrl.replace(/\/+$/, '');

    // Remove /api suffix if present
    if (baseUrl.endsWith('/api')) {
      baseUrl = baseUrl.slice(0, -4);
    }

    const sanitizedPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    const cacheBuster = encodeURIComponent(path.basename(relativePath || 'logo.png'));
    const combined = `${baseUrl}${sanitizedPath}?v=${cacheBuster}`;

    return combined.replace(/([^:]\/)\/+/g, '$1');
  }

  private buildLogoDataUrl(relativePath: string): string {
    if (!relativePath) {
      return DEFAULT_LOGO_DATA_URL;
    }

    if (/^data:/i.test(relativePath)) {
      return relativePath;
    }

    if (/^https?:\/\//i.test(relativePath)) {
      return DEFAULT_LOGO_DATA_URL;
    }

    const sanitized = relativePath.replace(/^\/+/, '');
    const absolutePath = path.resolve(__dirname, '..', '..', sanitized);

    if (!fs.existsSync(absolutePath)) {
      return DEFAULT_LOGO_DATA_URL;
    }

    try {
      const fileBuffer = fs.readFileSync(absolutePath);
      const extension = path.extname(absolutePath).toLowerCase();
      const contentTypeMap: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp'
      };
      const contentType = contentTypeMap[extension] || 'image/png';
      const base64 = fileBuffer.toString('base64');
      return `data:${contentType};base64,${base64}`;
    } catch (error) {
      console.error('Error building logo data URL:', error);
      return DEFAULT_LOGO_DATA_URL;
    }
  }

  private buildInlineLogoAttachment(dataUrl?: string | null): { attachment: EmailAttachment; cidReference: string } | null {
    if (!dataUrl || typeof dataUrl !== 'string') {
      return null;
    }

    const match = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl.trim());
    if (!match) {
      return null;
    }

    const contentType = match[1] || 'image/png';
    const base64Data = match[2].replace(/\s+/g, '');
    if (!base64Data) {
      return null;
    }

    const extension = this.getExtensionFromContentType(contentType);
    const cid = 'company-logo';

    return {
      attachment: {
        filename: `logo${extension}`,
        content: base64Data,
        contentType,
        cid,
        content_id: cid, // Resend uses content_id for inline attachments
        disposition: 'inline'
      },
      cidReference: `cid:${cid}`
    };
  }

  private getExtensionFromContentType(contentType: string): string {
    const normalized = contentType.toLowerCase();
    if (normalized.includes('svg')) return '.svg';
    if (normalized.includes('jpeg')) return '.jpg';
    if (normalized.includes('jpg')) return '.jpg';
    if (normalized.includes('webp')) return '.webp';
    if (normalized.includes('gif')) return '.gif';
    return '.png';
  }

  async sendConfirmationEmail(booking: IBooking): Promise<boolean> {
    return await this.sendTemplateEmail('confirmation', booking, booking.userData.email);
  }

  async sendReceiptEmail(booking: IBooking): Promise<boolean> {
    return await this.sendTemplateEmail('receipt', booking, booking.userData.email);
  }

  async getAvailableVariables(): Promise<string[]> {
    try {
      // Try to get variables from database first
      const dbVariables = await EmailVariable.find({ isActive: true }).sort({ category: 1, variableName: 1 });
      
      if (dbVariables.length > 0) {
        console.log(`📊 Loaded ${dbVariables.length} email variables from database`);
        return dbVariables.map(variable => variable.variableName);
      }
      
      // Fallback to hardcoded variables if database is empty
      console.log('⚠️  No variables found in database, using fallback hardcoded list');
      return this.getFallbackVariables();
      
    } catch (error) {
      console.error('❌ Error loading variables from database:', error);
      console.log('🔄 Using fallback hardcoded variables');
      return this.getFallbackVariables();
    }
  }

  private getFallbackVariables(): string[] {
    return [
      // Customer Information
      'firstName', 'lastName', 'email', 'phone', 'specialInstructions',
      
      // Trip Information
      'pickup', 'dropoff', 'pickupDate', 'pickupTime', 'passengers', 'flight',
      
      // Vehicle Information
      'vehicleType', 'assignedVehicle',
      
      // Pricing & Payment
      'totalPrice', 'paymentMethod',
      
      // Child Safety
      'infantSeats', 'toddlerSeats', 'boosterSeats',
      
      // Driver Assignment
      'assignedDriver',
      
      // Booking Details
      'confirmationNumber', 'bookingDate',
      
      // Company Information
      'companyName', 'companyPhone', 'companyEmail'
    ];
  }

  async getVariablesByCategory(): Promise<{[category: string]: any[]}> {
    try {
      const variables = await EmailVariable.find({ isActive: true }).sort({ category: 1, variableName: 1 });
      
      const categories: {[category: string]: any[]} = {};
      
      variables.forEach(variable => {
        if (!categories[variable.category]) {
          categories[variable.category] = [];
        }
        
        categories[variable.category].push({
          variableName: variable.variableName,
          codeField: variable.codeField,
          description: variable.description,
          dataType: variable.dataType,
          isRequired: variable.isRequired,
          exampleValue: variable.exampleValue
        });
      });
      
      return categories;
      
    } catch (error) {
      console.error('❌ Error loading variables by category:', error);
      return {};
    }
  }
}

export const resendEmailService = new ResendEmailService();
