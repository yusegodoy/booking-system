import { IBooking } from '../models/Booking';

export interface GlobalVariable {
  key: string;
  value: string;
  description: string;
}

export class GlobalVariablesService {
  /**
   * Generate global variables from a booking
   */
  static generateGlobalVariables(booking: IBooking): Record<string, string> {
    const variables: Record<string, string> = {};

    // Basic trip information
    variables.PU_DATE = booking.tripInfo.pickupDate || booking.tripInfo.date;
    variables.PU_TIME = `${booking.tripInfo.pickupHour}:${booking.tripInfo.pickupMinute} ${booking.tripInfo.pickupPeriod}`;
    variables.PU = booking.tripInfo.pickup;
    variables.DO = booking.tripInfo.dropoff;
    
    // Trip type information
    variables.TRIP_TYPE = this.determineTripType(booking.tripInfo.pickup, booking.tripInfo.dropoff);
    variables.TRIP_TYPE_DESCRIPTION = this.getTripTypeDescription(variables.TRIP_TYPE);

    // Return information (for round trips)
    if (booking.tripInfo.roundTrip && booking.tripInfo.returnDate) {
      variables.RT_DATE = booking.tripInfo.returnDate;
      variables.RT_TIME = `${booking.tripInfo.returnHour}:${booking.tripInfo.returnMinute} ${booking.tripInfo.returnPeriod}`;
      variables.RT = booking.tripInfo.dropoff; // Return location is usually the same as pickup
    }

    // Passenger and luggage information
    variables.PASSENGERS = booking.tripInfo.passengers.toString();
    variables.CHECKED_LUGGAGE = booking.tripInfo.checkedLuggage.toString();
    variables.CARRY_ON = booking.tripInfo.carryOn.toString();
    variables.INFANT_SEATS = booking.tripInfo.infantSeats.toString();
    variables.TODDLER_SEATS = booking.tripInfo.toddlerSeats.toString();
    variables.BOOSTER_SEATS = booking.tripInfo.boosterSeats.toString();
    variables.TOTAL_CHILD_SEATS = (
      booking.tripInfo.infantSeats + 
      booking.tripInfo.toddlerSeats + 
      booking.tripInfo.boosterSeats
    ).toString();

    // Flight information
    variables.FLIGHT = booking.tripInfo.flight || '';
    variables.MEET_OPTION = booking.tripInfo.meetOption || '';
    variables.RETURN_FLIGHT = booking.tripInfo.returnFlight || '';

    // Customer information
    variables.CUSTOMER_NAME = `${booking.userData.firstName} ${booking.userData.lastName}`;
    variables.CUSTOMER_EMAIL = booking.userData.email;
    variables.CUSTOMER_PHONE = booking.userData.phone;
    variables.SPECIAL_INSTRUCTIONS = booking.userData.specialInstructions || 'None';
    variables.GREETING_SIGN = booking.greetingSign || '';

    // Vehicle and service information
    variables.VEHICLE_TYPE = booking.vehicleType || 'Standard Vehicle';
    variables.SERVICE_TYPE = booking.serviceType || 'Standard Service';
    variables.TIME_ZONE = booking.timeZone || '';

    // Pricing information
    variables.BASE_PRICE = booking.calculatedPrice ? `$${booking.calculatedPrice.toFixed(2)}` : '$0.00';
    variables.BOOKING_FEE = booking.bookingFee ? `$${booking.bookingFee.toFixed(2)}` : '$0.00';
    variables.CHILD_SEATS_CHARGE = booking.childSeatsCharge ? `$${booking.childSeatsCharge.toFixed(2)}` : '$0.00';
    variables.DISCOUNT_PERCENTAGE = booking.discountPercentage ? `${booking.discountPercentage}%` : '0%';
    variables.DISCOUNT_FIXED = booking.discountFixed ? `$${booking.discountFixed.toFixed(2)}` : '$0.00';
    variables.ROUND_TRIP_DISCOUNT = booking.roundTripDiscount ? `$${booking.roundTripDiscount.toFixed(2)}` : '$0.00';
    variables.GRATUITY_PERCENTAGE = booking.gratuityPercentage ? `${booking.gratuityPercentage}%` : '0%';
    variables.GRATUITY_FIXED = booking.gratuityFixed ? `$${booking.gratuityFixed.toFixed(2)}` : '$0.00';
    variables.TAXES_PERCENTAGE = booking.taxesPercentage ? `${booking.taxesPercentage}%` : '0%';
    variables.TAXES_FIXED = booking.taxesFixed ? `$${booking.taxesFixed.toFixed(2)}` : '$0.00';
    variables.CREDIT_CARD_FEE_PERCENTAGE = booking.creditCardFeePercentage ? `${booking.creditCardFeePercentage}%` : '0%';
    variables.CREDIT_CARD_FEE_FIXED = booking.creditCardFeeFixed ? `$${booking.creditCardFeeFixed.toFixed(2)}` : '$0.00';
    variables.CALCULATED_PRICE = booking.calculatedPrice ? `$${booking.calculatedPrice.toFixed(2)}` : '$0.00';
    variables.TOTAL_PRICE = `$${booking.totalPrice.toFixed(2)}`;

    // Payment and booking information
    variables.PAYMENT_METHOD = booking.paymentMethod;
    variables.CHECKOUT_TYPE = booking.checkoutType;
    variables.BOOKING_STATUS = booking.status;
    variables.CONFIRMATION_NUMBER = booking.outboundConfirmationNumber;
    variables.RETURN_CONFIRMATION_NUMBER = booking.returnConfirmationNumber || '';

    // Route information
    variables.STOPS = booking.tripInfo.stops.length > 0 
      ? booking.tripInfo.stops.join(', ') 
      : 'No additional stops';
    variables.TOTAL_DISTANCE = ''; // Will be populated from route calculation
    variables.TOTAL_DURATION = ''; // Will be populated from route calculation

    // Assignment information
    variables.ASSIGNED_DRIVER = booking.assignedDriver || '';
    variables.ASSIGNED_VEHICLE = booking.assignedVehicle ? booking.assignedVehicle.toString() : '';
    variables.NOTES = booking.notes || '';
    variables.DISPATCH_NOTES = booking.dispatchNotes || '';

    // Communication preferences
    variables.SEND_CONFIRMATIONS = booking.sendConfirmations || '';
    variables.CHANGE_NOTIFICATIONS = booking.changeNotifications || '';

    // Timestamps
    variables.CREATED_AT = booking.createdAt ? new Date(booking.createdAt).toLocaleString() : '';
    variables.UPDATED_AT = booking.updatedAt ? new Date(booking.updatedAt).toLocaleString() : '';

    // Round trip specific
    variables.IS_ROUND_TRIP = booking.tripInfo.roundTrip ? 'Yes' : 'No';

    return variables;
  }

  /**
   * Update global variables for a booking
   */
  static async updateGlobalVariables(bookingId: string): Promise<void> {
    try {
      const { Booking } = await import('../models/Booking');
      const booking = await Booking.findById(bookingId);
      
      if (!booking) {
        throw new Error('Booking not found');
      }

      const globalVariables = this.generateGlobalVariables(booking);
      
      await Booking.findByIdAndUpdate(bookingId, {
        globalVariables: globalVariables
      });

      console.log(`Global variables updated for booking ${bookingId}`);
    } catch (error) {
      console.error('Error updating global variables:', error);
      throw error;
    }
  }

  /**
   * Update a specific variable for a booking
   */
  static async updateSpecificVariable(bookingId: string, variableKey: string, value: string): Promise<void> {
    try {
      const { Booking } = await import('../models/Booking');
      const booking = await Booking.findById(bookingId);
      
      if (!booking) {
        throw new Error('Booking not found');
      }

      // Get current global variables
      let currentVariables: Record<string, string> = {};
      if (booking.globalVariables) {
        if (booking.globalVariables instanceof Map) {
          booking.globalVariables.forEach((val, key) => {
            currentVariables[key] = val;
          });
        } else {
          // Ensure all values are strings
          Object.entries(booking.globalVariables).forEach(([key, val]) => {
            currentVariables[key] = val || '';
          });
        }
      }

      // Update the specific variable
      currentVariables[variableKey] = value;

      // Update the booking with the new variable
      await Booking.findByIdAndUpdate(bookingId, {
        globalVariables: currentVariables
      });

      console.log(`Variable ${variableKey} updated for booking ${bookingId}: ${value}`);
    } catch (error) {
      console.error('Error updating specific variable:', error);
      throw error;
    }
  }

  /**
   * Get global variables for a booking
   */
  static async getGlobalVariables(bookingId: string): Promise<Record<string, string>> {
    try {
      const { Booking } = await import('../models/Booking');
      const booking = await Booking.findById(bookingId);
      
      if (!booking) {
        throw new Error('Booking not found');
      }

      // If global variables don't exist, generate them
      if (!booking.globalVariables || Object.keys(booking.globalVariables).length === 0) {
        await this.updateGlobalVariables(bookingId);
        const updatedBooking = await Booking.findById(bookingId);
        return (updatedBooking?.globalVariables || {}) as Record<string, string>;
      }

      // Convert Mongoose Map to plain object
      const variables: Record<string, string> = {};
      if (booking.globalVariables instanceof Map) {
        booking.globalVariables.forEach((value, key) => {
          variables[key] = value;
        });
      } else {
        // If it's already a plain object
        Object.assign(variables, booking.globalVariables);
      }

      return variables;
    } catch (error) {
      console.error('Error getting global variables:', error);
      throw error;
    }
  }

  /**
   * Replace variables in a template string
   */
  static replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    
    // Replace variables in format {{VARIABLE_NAME}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    });

    return result;
  }

  /**
   * Get available variable keys and descriptions
   */
  static getAvailableVariables(): GlobalVariable[] {
    return [
      // Basic trip information
      { key: 'PU_DATE', value: '', description: 'Pickup date' },
      { key: 'PU_TIME', value: '', description: 'Pickup time' },
      { key: 'PU', value: '', description: 'Pickup location' },
      { key: 'DO', value: '', description: 'Drop off location' },
      { key: 'RT_DATE', value: '', description: 'Return date (for round trips)' },
      { key: 'RT_TIME', value: '', description: 'Return time (for round trips)' },
      { key: 'RT', value: '', description: 'Return location (for round trips)' },
      
      // Passenger and luggage information
      { key: 'PASSENGERS', value: '', description: 'Number of passengers' },
      { key: 'CHECKED_LUGGAGE', value: '', description: 'Number of checked luggage' },
      { key: 'CARRY_ON', value: '', description: 'Number of carry-on bags' },
      { key: 'INFANT_SEATS', value: '', description: 'Number of infant seats' },
      { key: 'TODDLER_SEATS', value: '', description: 'Number of toddler seats' },
      { key: 'BOOSTER_SEATS', value: '', description: 'Number of booster seats' },
      { key: 'TOTAL_CHILD_SEATS', value: '', description: 'Total child seats' },
      
      // Flight information
      { key: 'FLIGHT', value: '', description: 'Flight number' },
      { key: 'MEET_OPTION', value: '', description: 'Meet option' },
      { key: 'RETURN_FLIGHT', value: '', description: 'Return flight number' },
      
      // Customer information
      { key: 'CUSTOMER_NAME', value: '', description: 'Customer full name' },
      { key: 'CUSTOMER_EMAIL', value: '', description: 'Customer email' },
      { key: 'CUSTOMER_PHONE', value: '', description: 'Customer phone' },
      { key: 'SPECIAL_INSTRUCTIONS', value: '', description: 'Special instructions' },
      { key: 'GREETING_SIGN', value: '', description: 'Greeting sign' },
      
      // Vehicle and service information
      { key: 'VEHICLE_TYPE', value: '', description: 'Vehicle type' },
      { key: 'SERVICE_TYPE', value: '', description: 'Service type' },
      
      // Pricing information
      { key: 'BASE_PRICE', value: '', description: 'Base price' },
      { key: 'BOOKING_FEE', value: '', description: 'Booking fee' },
      { key: 'CHILD_SEATS_CHARGE', value: '', description: 'Child seats charge' },
      { key: 'DISCOUNT_PERCENTAGE', value: '', description: 'Discount percentage' },
      { key: 'DISCOUNT_FIXED', value: '', description: 'Fixed discount' },
      { key: 'ROUND_TRIP_DISCOUNT', value: '', description: 'Round trip discount' },
      { key: 'GRATUITY_PERCENTAGE', value: '', description: 'Gratuity percentage' },
      { key: 'GRATUITY_FIXED', value: '', description: 'Fixed gratuity' },
      { key: 'TAXES_PERCENTAGE', value: '', description: 'Taxes percentage' },
      { key: 'TAXES_FIXED', value: '', description: 'Fixed taxes' },
      { key: 'CREDIT_CARD_FEE_PERCENTAGE', value: '', description: 'Credit card fee percentage' },
      { key: 'CREDIT_CARD_FEE_FIXED', value: '', description: 'Fixed credit card fee' },
      { key: 'CALCULATED_PRICE', value: '', description: 'Calculated price' },
      { key: 'TOTAL_PRICE', value: '', description: 'Total price formatted' },
      
      // Payment and booking information
      { key: 'PAYMENT_METHOD', value: '', description: 'Payment method' },
      { key: 'CHECKOUT_TYPE', value: '', description: 'Checkout type' },
      { key: 'BOOKING_STATUS', value: '', description: 'Booking status' },
      { key: 'CONFIRMATION_NUMBER', value: '', description: 'Confirmation number' },
      { key: 'RETURN_CONFIRMATION_NUMBER', value: '', description: 'Return confirmation number' },
      
      // Route information
      { key: 'STOPS', value: '', description: 'Additional stops' },
      { key: 'TOTAL_DISTANCE', value: '', description: 'Total distance in miles' },
      { key: 'TOTAL_DURATION', value: '', description: 'Total duration' },
      
      // Assignment information
      { key: 'ASSIGNED_DRIVER', value: '', description: 'Assigned driver' },
      { key: 'ASSIGNED_VEHICLE', value: '', description: 'Assigned vehicle' },
      { key: 'NOTES', value: '', description: 'Notes' },
      { key: 'DISPATCH_NOTES', value: '', description: 'Dispatch notes' },
      
      // Communication preferences
      { key: 'SEND_CONFIRMATIONS', value: '', description: 'Send confirmations preference' },
      { key: 'CHANGE_NOTIFICATIONS', value: '', description: 'Change notifications preference' },
      
      // Timestamps
      { key: 'CREATED_AT', value: '', description: 'Created date/time' },
      { key: 'UPDATED_AT', value: '', description: 'Updated date/time' },
      
      // Round trip specific
      { key: 'IS_ROUND_TRIP', value: '', description: 'Is round trip (Yes/No)' },
      
      // Trip type information
      { key: 'TRIP_TYPE', value: '', description: 'Trip type (From Airport, To Airport, Point-to-point)' },
      { key: 'TRIP_TYPE_DESCRIPTION', value: '', description: 'Trip type description' }
    ];
  }

  /**
   * Determine trip type based on pickup and dropoff locations
   */
  private static determineTripType(pickup: string, dropoff: string): string {
    const pickupLower = pickup.toLowerCase();
    const dropoffLower = dropoff.toLowerCase();
    
    // Check for airport keywords
    const airportKeywords = [
      'airport', 'aeropuerto', 'tpa', 'tampa international', 'tampa airport',
      'mco', 'orlando international', 'orlando airport',
      'fll', 'fort lauderdale', 'fort lauderdale airport',
      'mia', 'miami international', 'miami airport',
      'jfk', 'new york', 'laguardia', 'newark',
      'lax', 'los angeles', 'burbank', 'ontario',
      'ord', 'ohare', 'chicago', 'midway',
      'dfw', 'dallas', 'fort worth',
      'atl', 'atlanta', 'hartsfield',
      'den', 'denver', 'stapleton',
      'phx', 'phoenix', 'sky harbor',
      'las', 'las vegas', 'mccarran',
      'clt', 'charlotte', 'douglas',
      'msp', 'minneapolis', 'st paul',
      'dtw', 'detroit', 'wayne county',
      'bwi', 'baltimore', 'washington',
      'iad', 'dulles', 'washington dulles',
      'dca', 'reagan', 'national',
      'sfo', 'san francisco', 'oakland',
      'sea', 'seattle', 'tacoma',
      'iah', 'houston', 'bush',
      'mco', 'orlando', 'sanford',
      'fll', 'fort lauderdale', 'hollywood',
      'pbi', 'west palm beach', 'palm beach'
    ];

    const isPickupAirport = airportKeywords.some(keyword => pickupLower.includes(keyword));
    const isDropoffAirport = airportKeywords.some(keyword => dropoffLower.includes(keyword));

    if (isPickupAirport && !isDropoffAirport) {
      return 'From Airport';
    } else if (!isPickupAirport && isDropoffAirport) {
      return 'To Airport';
    } else if (isPickupAirport && isDropoffAirport) {
      return 'Airport Transfer';
    } else {
      return 'Point-to-point';
    }
  }

  /**
   * Get description for trip type
   */
  private static getTripTypeDescription(tripType: string): string {
    switch (tripType) {
      case 'From Airport':
        return 'Transportation from airport to destination';
      case 'To Airport':
        return 'Transportation to airport from pickup location';
      case 'Airport Transfer':
        return 'Transportation between airports';
      case 'Point-to-point':
        return 'Transportation between two locations (non-airport)';
      default:
        return 'Standard transportation service';
    }
  }
} 