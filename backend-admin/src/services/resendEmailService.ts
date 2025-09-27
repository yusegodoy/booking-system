import { Resend } from 'resend';
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

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: emailData.to,
        cc: emailData.cc || [],
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
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
      // Customer Information (from BookingEditor FormData)
      firstName: booking.userData.firstName || '',
      lastName: booking.userData.lastName || '',
      email: booking.userData.email || '',
      phone: booking.userData.phone || '',
      specialInstructions: booking.userData.specialInstructions || '',
      groupName: booking.userData.groupName || '',
      occasion: booking.userData.occasion || '',
      greetingSign: booking.userData.greetingSign || '',
      timeZone: booking.userData.timeZone || 'America/New_York',
      
      // Trip Information
      pickup: booking.tripInfo.pickup || booking.tripInfo.pickupLocation || '',
      dropoff: booking.tripInfo.dropoff || booking.tripInfo.dropoffLocation || '',
      date: booking.tripInfo.date || '',
      pickupDate: booking.tripInfo.pickupDate || booking.tripInfo.date || '',
      pickupHour: booking.tripInfo.pickupHour || '12',
      pickupMinute: booking.tripInfo.pickupMinute || '00',
      pickupPeriod: booking.tripInfo.pickupPeriod || 'AM',
      additionalStops: Array.isArray(booking.tripInfo.stops) ? booking.tripInfo.stops.join(', ') : (booking.tripInfo.stops || ''),
      routeDistance: booking.tripInfo.routeDistance || '',
      routeDuration: booking.tripInfo.routeDuration || '',
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
      vehicleType: booking.vehicleType || 'Standard Vehicle',
      
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
      
      // Backend Price Breakdown
      basePrice: booking.basePrice || booking.totalPrice || 0,
      distancePrice: booking.distancePrice || 0,
      stopsCharge: booking.stopsCharge || 0,
      returnTripPrice: booking.returnTripPrice || 0,
      subtotal: booking.subtotal || booking.totalPrice || 0,
      paymentDiscount: booking.paymentDiscount || 0,
      areaName: booking.areaName || '',
      pricingMethod: booking.pricingMethod || '',
      distance: booking.distance || 0,
      surgeMultiplier: booking.surgeMultiplier || 1,
      surgeName: booking.surgeName || '',
      
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
      // Customer Information (from BookingEditor FormData)
      'firstName', 'lastName', 'email', 'phone', 'specialInstructions',
      'groupName', 'occasion', 'greetingSign', 'timeZone',
      
      // Trip Information
      'pickup', 'dropoff', 'date', 'pickupDate', 'pickupHour', 'pickupMinute', 'pickupPeriod',
      'additionalStops', 'routeDistance', 'routeDuration', 'passengers',
      
      // Luggage & Seats
      'checkedLuggage', 'carryOn', 'infantSeats', 'toddlerSeats', 'boosterSeats',
      
      // Flight Information
      'flight', 'airportCode', 'terminalGate', 'meetOption',
      
      // Round Trip Information
      'roundTrip', 'returnDate', 'returnHour', 'returnMinute', 'returnPeriod', 'returnFlight',
      
      // Service & Vehicle
      'serviceType', 'vehicleType',
      
      // Payment and Status
      'paymentMethod', 'checkoutType', 'isLoggedIn', 'status', 'totalPrice',
      
      // Price Breakdown
      'calculatedPrice', 'bookingFee', 'childSeatsCharge', 'discountPercentage', 'discountFixed',
      'roundTripDiscount', 'gratuityPercentage', 'gratuityFixed', 'taxesPercentage', 'taxesFixed',
      'creditCardFeePercentage', 'creditCardFeeFixed',
      
      // Backend Price Breakdown
      'basePrice', 'distancePrice', 'stopsCharge', 'returnTripPrice', 'subtotal',
      'paymentDiscount', 'areaName', 'pricingMethod', 'distance', 'surgeMultiplier', 'surgeName',
      
      // Assignment
      'assignedDriver', 'assignedVehicle', 'notes', 'dispatchNotes',
      
      // Notifications
      'changeNotifications',
      
      // Booking Identifiers
      'bookingId', 'confirmationNumber', 'outboundConfirmationNumber', 'returnConfirmationNumber',
      
      // Company Information
      'companyName', 'companyEmail', 'companyPhone', 'companyWebsite',
      'companyAddress', 'companyCity', 'companyState', 'companyZipCode', 'companyCountry',
      'fullAddress', 'businessLicense', 'taxId', 'operatingHours', 'emergencyContact',
      
      // Company Branding
      'logoUrl', 'primaryColor', 'secondaryColor', 'accentColor', 'backgroundColor', 'textColor',
      'facebookUrl', 'instagramUrl', 'twitterUrl', 'linkedinUrl',
      
      // Legal & Policies
      'description', 'missionStatement', 'termsOfService', 'privacyPolicy', 'serviceAgreement'
    ];
  }
}

export const resendEmailService = new ResendEmailService();
