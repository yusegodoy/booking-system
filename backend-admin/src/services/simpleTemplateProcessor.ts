import { IBooking } from '../models/Booking';
import { DEFAULT_LOGO_DATA_URL } from '../assets/defaultLogoData';

export interface TemplateData {
  [key: string]: string | number | boolean | undefined;
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
  companyLogoUrl?: string;
  logoUrl?: string;
  logoPublicUrl?: string;
  logoDataUrl?: string;
  logoCid?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
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
    
    // Handle {{#if flightNumber}}...{{/if}} and {{#if flight}}...{{/if}}
    const flightRegex = /\{\{#if\s+(flightNumber|flight)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    result = result.replace(flightRegex, (match, key, content) => {
      const value = key === 'flightNumber' 
        ? (data.flightNumber || data.flight) 
        : (data.flight || data.flightNumber);
      return value ? content : '';
    });
    
    // Handle {{#if specialInstructions}}...{{/if}} and {{#if notes}}...{{/if}}
    const specialInstructionsRegex = /\{\{#if\s+(specialInstructions|notes)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    result = result.replace(specialInstructionsRegex, (match, key, content) => {
      const value = key === 'notes' 
        ? (data.notes || data.specialInstructions) 
        : (data.specialInstructions || data.notes);
      return value ? content : '';
    });

    // Generic {{#if key}}...{{/if}} handler for simple truthy checks
    const genericIfRegex = /\{\{#if\s+([a-zA-Z0-9_]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    result = result.replace(genericIfRegex, (match, key, content) => {
      const value = data[key];
      return value ? content : '';
    });
    
    // Handle passenger pluralization - use a simpler approach
    // First replace the passengers variable
    if (typeof data.passengers !== 'undefined') {
      result = result.replace(/\{\{passengers\}\}/g, String(data.passengers));
    }
    
    // Then handle the conditional
    const conditionalRegex = /\{\{#if\s*\(eq\s*passengers\s*1\)\}\}person\{\{else\}\}people\{\{\/if\}\}/g;
    result = result.replace(conditionalRegex, (match) => {
      const plural = data.passengers === 1 ? 'person' : 'people';
      return plural;
    });
    
    return result;
  }

  public static extractDataFromBooking(booking: Partial<IBooking> | Record<string, any>): TemplateData {
    return SimpleTemplateProcessor.buildTemplateData(booking);
  }

  public static buildTemplateData(source: Partial<IBooking> | Record<string, any>, overrides: Record<string, any> = {}): TemplateData {
    const base = SimpleTemplateProcessor.createBaseTemplateData(source);
    return SimpleTemplateProcessor.mergeTemplateData(base, overrides);
  }

  public static processEmailTemplate(
    htmlContent: string,
    textContent: string,
    booking: IBooking,
    overrides: Record<string, any> = {}
  ): { html: string; text: string } {
    const processor = SimpleTemplateProcessor.getInstance();
    const data = SimpleTemplateProcessor.buildTemplateData(booking, overrides);
    
    return {
      html: processor.processTemplate(htmlContent, data),
      text: processor.processTemplate(textContent, data)
    };
  }

  private static createBaseTemplateData(source: Partial<IBooking> | Record<string, any>): TemplateData {
    const booking = source as Partial<IBooking>;
    const userData: any = (booking && booking.userData) || (source as any)?.userData || {};
    const tripInfo: any = (booking && booking.tripInfo) || (source as any)?.tripInfo || {};

    const firstName = userData.firstName || '';
    const lastName = userData.lastName || '';

    const providedPickupDate: string | undefined =
      (tripInfo.pickupDate as string) ||
      (tripInfo.date as string) ||
      (source as any)?.pickupDate ||
      undefined;

    const pickupHour = tripInfo.pickupHour ?? (source as any)?.pickupHour;
    const pickupMinute = tripInfo.pickupMinute ?? (source as any)?.pickupMinute;
    const pickupPeriod = tripInfo.pickupPeriod ?? (source as any)?.pickupPeriod;

    const fallbackTime = [pickupHour, pickupMinute].filter(Boolean).join(':');
    const computedPickupTime = (source as any)?.pickupTime 
      || (fallbackTime ? `${fallbackTime} ${pickupPeriod || ''}`.trim() : '');

    const base: TemplateData = {
      customerName: `${firstName} ${lastName}`.trim(),
      customerFirstName: firstName,
      customerLastName: lastName,
      customerEmail: userData.email || (source as any)?.customerEmail || '',
      customerPhone: userData.phone || (source as any)?.customerPhone || '',
      specialInstructions: userData.specialInstructions || (source as any)?.specialInstructions || (source as any)?.notes || undefined,

      confirmationNumber: booking?.outboundConfirmationNumber || (source as any)?.confirmationNumber || '',
      returnConfirmationNumber: booking?.returnConfirmationNumber || (source as any)?.returnConfirmationNumber,

      pickupLocation: tripInfo.pickupLocation || tripInfo.pickup || (source as any)?.pickupLocation || '',
      dropoffLocation: tripInfo.dropoffLocation || tripInfo.dropoff || (source as any)?.dropoffLocation || '',
      pickupDate: providedPickupDate
        ? new Date(providedPickupDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : '',
      pickupTime: computedPickupTime,
      passengers: Number(tripInfo.passengers ?? (source as any)?.passengers ?? 1),
      flightNumber: tripInfo.flight || (source as any)?.flightNumber || (source as any)?.flight || undefined,
      airportCode: tripInfo.airportCode || (source as any)?.airportCode || undefined,
      terminalGate: tripInfo.terminalGate || (source as any)?.terminalGate || undefined,

      vehicleType: booking?.vehicleType || (source as any)?.vehicleType || 'Standard Vehicle',
      assignedVehicle: booking?.assignedVehicle ? String(booking.assignedVehicle) : (source as any)?.assignedVehicle,

      totalPrice: SimpleTemplateProcessor.formatCurrency(
        (source as any)?.totalPrice ?? booking?.totalPrice ?? 0
      ),

      companyName: (source as any)?.companyName || 'Airport Shuttle TPA',
      companyPhone: (source as any)?.companyPhone || '+1 (305) 484-4910',
      companyEmail: (source as any)?.companyEmail || 'info@airportshuttletpa.com',
      companyWebsite: (source as any)?.companyWebsite || 'https://booking.airportshuttletpa.com',
      companyLogoUrl: (source as any)?.companyLogoUrl || (source as any)?.logoDataUrl || (source as any)?.logoPublicUrl || (source as any)?.logoUrl || DEFAULT_LOGO_DATA_URL,
      logoUrl: (source as any)?.logoUrl || (source as any)?.logoDataUrl || DEFAULT_LOGO_DATA_URL,
      logoPublicUrl: (source as any)?.logoPublicUrl || (source as any)?.logoUrl || (source as any)?.logoDataUrl || DEFAULT_LOGO_DATA_URL,
      logoDataUrl: (source as any)?.logoDataUrl || DEFAULT_LOGO_DATA_URL,
      logoCid: (source as any)?.logoCid,
      primaryColor: (source as any)?.primaryColor,
      secondaryColor: (source as any)?.secondaryColor,
      accentColor: (source as any)?.accentColor,
      backgroundColor: (source as any)?.backgroundColor || '#ffffff',
      textColor: (source as any)?.textColor
    };

    return base;
  }

  private static mergeTemplateData(base: TemplateData, overrides: Record<string, any>): TemplateData {
    const merged: TemplateData = { ...base };

    Object.entries(overrides || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      if (key === 'totalPrice') {
        merged.totalPrice = SimpleTemplateProcessor.formatCurrency(value);
      } else if (key === 'passengers') {
        merged.passengers = Number(value);
      } else if (key === 'pickupDate' && typeof value === 'string') {
        merged.pickupDate = value;
      } else if (key === 'pickupTime') {
        merged.pickupTime = String(value).replace(/\s+/g, ' ').trim();
      } else {
        merged[key] = value as any;
      }
    });

    const logoCandidate = (merged.logoDataUrl || merged.logoPublicUrl || merged.companyLogoUrl || merged.logoUrl || DEFAULT_LOGO_DATA_URL) as string | undefined;
    if (logoCandidate) {
      merged.logoUrl = merged.logoUrl || logoCandidate;
      merged.logoPublicUrl = merged.logoPublicUrl || logoCandidate;
      merged.companyLogoUrl = merged.companyLogoUrl || logoCandidate;
    }

    if (merged.pickupTime) {
      merged.pickupTime = String(merged.pickupTime).replace(/\s+/g, ' ').trim();
    }

    return merged;
  }

  private static formatCurrency(value: unknown): string {
    if (typeof value === 'number' && !isNaN(value)) {
      return `$${value.toFixed(2)}`;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();

      if (trimmed.length === 0) {
        return '$0.00';
      }

      return trimmed.startsWith('$') ? trimmed : `$${trimmed}`;
    }

    return '$0.00';
  }
}
