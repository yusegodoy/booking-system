import Handlebars from 'handlebars';
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

export class TemplateProcessor {
  private static instance: TemplateProcessor;
  private handlebars: typeof Handlebars;

  private constructor() {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  public static getInstance(): TemplateProcessor {
    if (!TemplateProcessor.instance) {
      TemplateProcessor.instance = new TemplateProcessor();
    }
    return TemplateProcessor.instance;
  }

  private registerHelpers(): void {
    // Helper for conditional display
    this.handlebars.registerHelper('if', function(conditional, options) {
      if (conditional) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    });

    // Helper for pluralization
    this.handlebars.registerHelper('pluralize', function(count, singular, plural) {
      return count === 1 ? singular : plural;
    });

    // Helper for formatting currency
    this.handlebars.registerHelper('currency', function(amount) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    });

    // Helper for formatting date
    this.handlebars.registerHelper('formatDate', function(date, format) {
      const d = new Date(date);
      if (format === 'long') {
        return d.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      return d.toLocaleDateString();
    });

    // Helper for formatting time
    this.handlebars.registerHelper('formatTime', function(hour, minute, period) {
      return `${hour}:${minute} ${period}`;
    });
  }

  public processTemplate(template: string, data: TemplateData): string {
    try {
      const compiledTemplate = this.handlebars.compile(template);
      return compiledTemplate(data);
    } catch (error) {
      console.error('Error processing template:', error);
      return template; // Return original template if processing fails
    }
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
    const processor = TemplateProcessor.getInstance();
    const data = TemplateProcessor.extractDataFromBooking(booking);
    
    return {
      html: processor.processTemplate(htmlContent, data),
      text: processor.processTemplate(textContent, data)
    };
  }
}
