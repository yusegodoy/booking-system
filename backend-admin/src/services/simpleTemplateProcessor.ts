import { IBooking } from '../models/Booking';

export interface TemplateData {
  // Customer info
  customerName: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  specialInstructions?: string;
  
  // Booking info
  confirmationNumber: string;
  returnConfirmationNumber?: string;
  
  // Trip info
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  passengers: number;
  flightNumber?: string;
  airportCode?: string;
  terminalGate?: string;
  
  // Vehicle info
  vehicleType: string;
  assignedVehicle?: string;
  
  // Pricing
  totalPrice: string;
  
  // Company info
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
}

export class SimpleTemplateProcessor {
  private static instance: SimpleTemplateProcessor;

  private constructor() {}

  public static getInstance(): SimpleTemplateProcessor {
    if (!SimpleTemplateProcessor.instance) {
      SimpleTemplateProcessor.instance = new SimpleTemplateProcessor();
    }
    return SimpleTemplateProcessor.instance;
  }

  public processTemplate(template: string, data: TemplateData): string {
    try {
      let result = template;
      
      // Replace simple variables
      Object.entries(data).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, String(value || ''));
      });
      
      // Handle conditional blocks manually
      result = this.processConditionals(result, data);
      
      return result;
    } catch (error) {
      console.error('Error processing template:', error);
      return template; // Return original template if processing fails
    }
  }

  private processConditionals(template: string, data: TemplateData): string {
    let result = template;
    
    // Handle {{#if flightNumber}}...{{/if}}
    const flightNumberRegex = /\{\{#if flightNumber\}\}([\s\S]*?)\{\{\/if\}\}/g;
    result = result.replace(flightNumberRegex, (match, content) => {
      return data.flightNumber ? content : '';
    });
    
    // Handle {{#if specialInstructions}}...{{/if}}
    const specialInstructionsRegex = /\{\{#if specialInstructions\}\}([\s\S]*?)\{\{\/if\}\}/g;
    result = result.replace(specialInstructionsRegex, (match, content) => {
      return data.specialInstructions ? content : '';
    });
    
    // Handle passenger pluralization - multiple patterns
    const passengerPatterns = [
      /\{\{passengers\}\} \{\{#if \(eq passengers 1\)\}\}person\{\{else\}\}people\{\{\/if\}\}/g,
      /\{\{passengers\}\} \{\{#if \(eq passengers 1\)\}\}person\{\{else\}\}people\{\{\/if\}\}/g,
      /\{\{passengers\}\} \{\{#if \(eq passengers 1\)\}\}person\{\{else\}\}people\{\{\/if\}\}/g
    ];
    
    passengerPatterns.forEach(pattern => {
      result = result.replace(pattern, (match) => {
        const plural = data.passengers === 1 ? 'person' : 'people';
        return `${data.passengers} ${plural}`;
      });
    });
    
    return result;
  }

  public static extractDataFromBooking(booking: IBooking): TemplateData {
    // Safely extract user data with fallbacks
    const userData = booking.userData || {};
    const tripInfo = booking.tripInfo || {};
    
    return {
      // Customer info
      customerName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
      customerFirstName: userData.firstName || '',
      customerLastName: userData.lastName || '',
      customerEmail: userData.email || '',
      customerPhone: userData.phone || '',
      specialInstructions: userData.specialInstructions || undefined,
      
      // Booking info
      confirmationNumber: booking.outboundConfirmationNumber || '',
      returnConfirmationNumber: booking.returnConfirmationNumber || undefined,
      
      // Trip info
      pickupLocation: tripInfo.pickup || '',
      dropoffLocation: tripInfo.dropoff || '',
      pickupDate: tripInfo.date ? new Date(tripInfo.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : '',
      pickupTime: `${tripInfo.pickupHour || ''}:${tripInfo.pickupMinute || ''} ${tripInfo.pickupPeriod || ''}`,
      passengers: tripInfo.passengers || 1,
      flightNumber: tripInfo.flight && tripInfo.flight.trim() !== '' ? tripInfo.flight : undefined,
      airportCode: tripInfo.airportCode || undefined,
      terminalGate: tripInfo.terminalGate || undefined,
      
      // Vehicle info
      vehicleType: booking.vehicleType || 'Standard Vehicle',
      assignedVehicle: booking.assignedVehicle ? String(booking.assignedVehicle) : undefined,
      
      // Pricing
      totalPrice: `$${(booking.totalPrice || 0).toFixed(2)}`,
      
      // Company info
      companyName: 'Airport Shuttle TPA',
      companyPhone: '+1 (305) 484-4910',
      companyEmail: 'info@airportshuttletpa.com',
      companyWebsite: 'https://booking.airportshuttletpa.com'
    };
  }

  public static processEmailTemplate(htmlContent: string, textContent: string, booking: IBooking): { html: string; text: string } {
    const processor = SimpleTemplateProcessor.getInstance();
    const data = SimpleTemplateProcessor.extractDataFromBooking(booking);
    
    return {
      html: processor.processTemplate(htmlContent, data),
      text: processor.processTemplate(textContent, data)
    };
  }
}
