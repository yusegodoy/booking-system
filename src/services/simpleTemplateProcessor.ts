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
}
