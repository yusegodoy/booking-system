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
    
    // Handle passenger pluralization
    const passengerRegex = /\{\{passengers\}\} \{\{#if \(eq passengers 1\)\}\}person\{\{else\}\}people\{\{\/if\}\}/g;
    result = result.replace(passengerRegex, (match) => {
      const plural = data.passengers === 1 ? 'person' : 'people';
      return `${data.passengers} ${plural}`;
    });
    
    return result;
  }

  public static extractDataFromBooking(booking: IBooking): TemplateData {
    return {
      // Customer info
      customerName: `${booking.userData.firstName} ${booking.userData.lastName}`,
      customerFirstName: booking.userData.firstName,
      customerLastName: booking.userData.lastName,
      customerEmail: booking.userData.email,
      customerPhone: booking.userData.phone,
      specialInstructions: booking.userData.specialInstructions,
      
      // Booking info
      confirmationNumber: booking.outboundConfirmationNumber,
      returnConfirmationNumber: booking.returnConfirmationNumber,
      
      // Trip info
      pickupLocation: booking.tripInfo.pickup,
      dropoffLocation: booking.tripInfo.dropoff,
      pickupDate: new Date(booking.tripInfo.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      pickupTime: `${booking.tripInfo.pickupHour}:${booking.tripInfo.pickupMinute} ${booking.tripInfo.pickupPeriod}`,
      passengers: booking.tripInfo.passengers,
      flightNumber: booking.tripInfo.flight || undefined,
      airportCode: booking.tripInfo.airportCode || undefined,
      terminalGate: booking.tripInfo.terminalGate || undefined,
      
      // Vehicle info
      vehicleType: booking.vehicleType || 'Standard Vehicle',
      assignedVehicle: booking.assignedVehicle ? String(booking.assignedVehicle) : undefined,
      
      // Pricing
      totalPrice: `$${booking.totalPrice.toFixed(2)}`,
      
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
