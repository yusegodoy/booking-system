import { Request, Response } from 'express';
import { Booking } from '../models/Booking';
import { User } from '../models/User';
import { Customer } from '../models/Customer';
import { GlobalVariablesService } from '../services/globalVariablesService';
import googleCalendarService from '../services/googleCalendarService';

// Get all bookings (excluding deleted ones)
export const getAllBookings = async (req: Request, res: Response) => {
  try {
    // Explicitly filter out deleted bookings
    const bookings = await Booking.find({ 
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    })
      // .populate('userId', 'firstName lastName email') // No existe userId, así que quitamos el populate
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error: (error as Error).message });
  }
};

// Get a single booking by ID
export const getBookingById = async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    return res.json(booking);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching booking', error: (error as Error).message });
  }
};

// Update booking status
export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const validStatuses = ['Pending', 'Unassigned', 'Assigned', 'On the way', 'Arrived', 'Customer in car', 'Customer dropped off', 'Customer dropped off - Pending payment', 'Done', 'No Show', 'Canceled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be one of: Pending, Unassigned, Assigned, On the way, Arrived, Customer in car, Customer dropped off, Customer dropped off - Pending payment, Done, No Show, Canceled' });
    }
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    return res.json(booking);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating booking status', error: (error as Error).message });
  }
};

// Update booking details
export const updateBooking = async (req: Request, res: Response) => {
  try {
    const bookingId = req.params.id;
    const updateData = req.body;
    
    console.log('Updating booking with data:', {
      bookingId,
      priceData: {
        totalPrice: updateData.totalPrice,
        calculatedPrice: updateData.calculatedPrice,
        bookingFee: updateData.bookingFee,
        childSeatsCharge: updateData.childSeatsCharge,
        discountPercentage: updateData.discountPercentage,
        discountFixed: updateData.discountFixed,
        roundTripDiscount: updateData.roundTripDiscount,
        gratuityPercentage: updateData.gratuityPercentage,
        gratuityFixed: updateData.gratuityFixed,
        taxesPercentage: updateData.taxesPercentage,
        taxesFixed: updateData.taxesFixed,
        creditCardFeePercentage: updateData.creditCardFeePercentage,
        creditCardFeeFixed: updateData.creditCardFeeFixed
      }
    });
    
    // Remove _id from update data to avoid conflicts
    delete updateData._id;
    
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Update global variables after booking update
    try {
      await GlobalVariablesService.updateGlobalVariables(bookingId);
      console.log(`Global variables updated for booking ${bookingId}`);
    } catch (globalVarError) {
      console.error('Error updating global variables:', globalVarError);
      // Don't fail the entire request if global variables update fails
    }
    
    return res.json(booking);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating booking', error: (error as Error).message });
  }
};

// Soft delete a booking (move to trash)
export const deleteBooking = async (req: Request, res: Response) => {
  try {
    // First, get the booking to check if it has a Google Calendar event
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Delete Google Calendar event if it exists
    if (booking.googleCalendarEventId) {
      try {
        await googleCalendarService.deleteEventFromCalendar(booking);
        console.log(`Google Calendar event deleted for booking ${booking._id}`);
      } catch (calendarError) {
        console.error('Error deleting Google Calendar event:', calendarError);
        // Continue with deletion even if calendar deletion fails
      }
    }
    
    // Now do the soft delete
    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: (req as any).user?.id || 'unknown'
      },
      { new: true }
    );
    
    return res.json({ message: 'Booking moved to trash successfully', booking: updatedBooking });
  } catch (error) {
    return res.status(500).json({ message: 'Error moving booking to trash', error: (error as Error).message });
  }
};

// Get deleted bookings (trash)
export const getDeletedBookings = async (req: Request, res: Response) => {
  try {
    const deletedBookings = await Booking.find({ isDeleted: true })
      .sort({ deletedAt: -1 });

    res.json(deletedBookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching deleted bookings', error: (error as Error).message });
  }
};

// Restore a deleted booking
export const restoreBooking = async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: false,
        deletedAt: undefined,
        deletedBy: undefined
      },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    return res.json({ message: 'Booking restored successfully', booking });
  } catch (error) {
    return res.status(500).json({ message: 'Error restoring booking', error: (error as Error).message });
  }
};

// Permanently delete a booking (from trash)
export const permanentlyDeleteBooking = async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    return res.json({ message: 'Booking permanently deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error permanently deleting booking', error: (error as Error).message });
  }
};

// Create a new booking
export const createBooking = async (req: Request, res: Response) => {
  try {
    const bookingData = req.body;
    
    // Generate confirmation number if not provided
    // Use consecutive numbering system instead of timestamp
    if (!bookingData.outboundConfirmationNumber) {
      let nextNumber = 10000;
      
      // Find the highest confirmation number in the database
      const lastBooking = await Booking.findOne(
        { outboundConfirmationNumber: { $exists: true } },
        { outboundConfirmationNumber: 1 },
        { sort: { outboundConfirmationNumber: -1 } }
      );

      if (lastBooking && lastBooking.outboundConfirmationNumber) {
        // Extract numeric part from confirmation number
        const confNumber = lastBooking.outboundConfirmationNumber.toString();
        const numericPart = parseInt(confNumber);
        if (!isNaN(numericPart) && numericPart >= 10000) {
          nextNumber = numericPart + 1;
        } else {
          // If it's not a pure number, try to extract numeric part from string
          const match = confNumber.match(/\d+/);
          if (match) {
            const extractedNumber = parseInt(match[0]);
            if (!isNaN(extractedNumber) && extractedNumber >= 10000) {
              nextNumber = extractedNumber + 1;
            }
          }
        }
      }

      // Double-check that this number doesn't already exist
      let attempts = 0;
      const maxAttempts = 100;
      let foundAvailableNumber = false;
      
      while (attempts < maxAttempts) {
        const existingBooking = await Booking.findOne({ 
          $or: [
            { outboundConfirmationNumber: nextNumber.toString() },
            { returnConfirmationNumber: nextNumber.toString() }
          ]
        });
        
        if (!existingBooking) {
          foundAvailableNumber = true;
          break;
        }
        
        nextNumber++;
        attempts++;
      }

      if (foundAvailableNumber && nextNumber <= 99999) {
        bookingData.outboundConfirmationNumber = nextNumber.toString();
        console.log(`✅ Generated consecutive confirmation number: ${bookingData.outboundConfirmationNumber}`);
      } else {
        // Fallback: use timestamp if we can't find a consecutive number
        console.warn('⚠️ Could not find consecutive confirmation number, using timestamp fallback');
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        bookingData.outboundConfirmationNumber = `BK${timestamp}${random}`;
      }
    }
    
    // Set default values for required fields if not provided
    if (!bookingData.status) {
      bookingData.status = 'Unassigned';
    }
    
    if (!bookingData.paymentMethod) {
      bookingData.paymentMethod = 'cash';
    }
    
    if (!bookingData.checkoutType) {
      bookingData.checkoutType = 'guest';
    }
    
    if (!bookingData.isLoggedIn) {
      bookingData.isLoggedIn = false;
    }
    
    console.log('Creating booking with data:', {
      outboundConfirmationNumber: bookingData.outboundConfirmationNumber,
      status: bookingData.status,
      paymentMethod: bookingData.paymentMethod
    });
    
    const booking = new Booking(bookingData);
    const savedBooking = await booking.save();
    
    // Handle customer creation/update based on customerId
    try {
      if (bookingData.userData && bookingData.userData.email) {
        let customer;
        
        // If customerId is provided, use existing customer
        if (bookingData.customerId) {
          customer = await Customer.findById(bookingData.customerId);
          if (customer) {
            // Update existing customer statistics
            customer.totalBookings += 1;
            customer.totalSpent += savedBooking.totalPrice;
            customer.lastBookingDate = new Date();
            await customer.save();
            console.log(`Updated existing customer (by ID): ${customer.email}`);
          } else {
            console.log(`Customer with ID ${bookingData.customerId} not found, will create new customer`);
          }
        }
        
        // If no customer found by ID or no customerId provided, create/update by email
        if (!customer) {
          const customerData = {
            firstName: bookingData.userData.firstName,
            lastName: bookingData.userData.lastName,
            email: bookingData.userData.email,
            phone: bookingData.userData.phone,
            isActive: true
          };
          
          // Check if customer already exists by email
          customer = await Customer.findOne({ email: customerData.email });
          
          if (customer) {
            // Update existing customer
            customer.totalBookings += 1;
            customer.totalSpent += savedBooking.totalPrice;
            customer.lastBookingDate = new Date();
            await customer.save();
            console.log(`Updated existing customer (by email): ${customer.email}`);
          } else {
            // Create new customer
            customer = new Customer({
              ...customerData,
              totalBookings: 1,
              totalSpent: savedBooking.totalPrice,
              lastBookingDate: new Date()
            });
            await customer.save();
            console.log(`Created new customer: ${customer.email}`);
          }
        }
        
        // Update the booking with the customer ID if not already set
        if (customer && !savedBooking.customerId) {
          savedBooking.customerId = customer._id as any;
          await savedBooking.save();
          console.log(`Updated booking with customer ID: ${customer._id}`);
        }
      }
    } catch (customerError) {
      console.error('Error creating/updating customer:', customerError);
      // Don't fail the entire request if customer creation fails
    }
    
    // If this is a roundtrip booking, automatically create a return booking
    let returnBooking = null;
    if (savedBooking.tripInfo?.roundTrip && 
        savedBooking.tripInfo?.returnDate && 
        savedBooking.tripInfo?.returnHour && 
        savedBooking.tripInfo?.returnMinute && 
        savedBooking.tripInfo?.returnPeriod) {
      try {
        console.log('🔄 Roundtrip detected, creating return booking automatically...');
        
        // Generate confirmation number for return if not provided
        let returnConfirmationNumber = bookingData.returnConfirmationNumber;
        if (!returnConfirmationNumber) {
          // Use the same logic as getNextConfirmationNumber to get consecutive number
          let nextNumber = 10000;
          
          // Find the highest confirmation number in the database
          const lastBooking = await Booking.findOne(
            { outboundConfirmationNumber: { $exists: true } },
            { outboundConfirmationNumber: 1 },
            { sort: { outboundConfirmationNumber: -1 } }
          );

          if (lastBooking && lastBooking.outboundConfirmationNumber) {
            // Extract numeric part from confirmation number
            // Handle both pure numeric (e.g., "10001") and string formats
            const confNumber = lastBooking.outboundConfirmationNumber.toString();
            const numericPart = parseInt(confNumber);
            if (!isNaN(numericPart) && numericPart >= 10000) {
              nextNumber = numericPart + 1;
            } else {
              // If it's not a pure number, try to extract numeric part from string like "BK10001"
              const match = confNumber.match(/\d+/);
              if (match) {
                const extractedNumber = parseInt(match[0]);
                if (!isNaN(extractedNumber) && extractedNumber >= 10000) {
                  nextNumber = extractedNumber + 1;
                }
              }
            }
          }

          // Double-check that this number doesn't already exist
          let attempts = 0;
          const maxAttempts = 100;
          let foundAvailableNumber = false;
          
          while (attempts < maxAttempts) {
            const existingBooking = await Booking.findOne({ 
              $or: [
                { outboundConfirmationNumber: nextNumber.toString() },
                { returnConfirmationNumber: nextNumber.toString() }
              ]
            });
            
            if (!existingBooking) {
              foundAvailableNumber = true;
              break;
            }
            
            nextNumber++;
            attempts++;
          }

          if (foundAvailableNumber && nextNumber <= 99999) {
            returnConfirmationNumber = nextNumber.toString();
            console.log(`✅ Generated consecutive return confirmation number: ${returnConfirmationNumber}`);
          } else {
            // Fallback: use timestamp if we can't find a consecutive number
            console.warn('⚠️ Could not find consecutive confirmation number, using timestamp fallback');
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 1000);
            returnConfirmationNumber = `BK${timestamp}${random}R`;
          }
        } else {
          console.log(`✅ Using provided return confirmation number: ${returnConfirmationNumber}`);
        }
        
        // Create return booking data with swapped locations
        const returnBookingData = {
          customerId: savedBooking.customerId,
          outboundConfirmationNumber: returnConfirmationNumber,
          tripInfo: {
            // Swap pickup and dropoff for return trip
            pickup: savedBooking.tripInfo.dropoff,
            dropoff: savedBooking.tripInfo.pickup,
            // Use return date and time
            date: savedBooking.tripInfo.returnDate,
            pickupDate: savedBooking.tripInfo.returnDate,
            pickupHour: savedBooking.tripInfo.returnHour,
            pickupMinute: savedBooking.tripInfo.returnMinute,
            pickupPeriod: savedBooking.tripInfo.returnPeriod,
            pickupLocation: savedBooking.tripInfo.dropoffLocation || savedBooking.tripInfo.dropoff,
            dropoffLocation: savedBooking.tripInfo.pickupLocation || savedBooking.tripInfo.pickup,
            // Copy passenger and vehicle info
            passengers: savedBooking.tripInfo.passengers,
            checkedLuggage: savedBooking.tripInfo.checkedLuggage || 0,
            carryOn: savedBooking.tripInfo.carryOn || 0,
            infantSeats: savedBooking.tripInfo.infantSeats || 0,
            toddlerSeats: savedBooking.tripInfo.toddlerSeats || 0,
            boosterSeats: savedBooking.tripInfo.boosterSeats || 0,
            flight: savedBooking.tripInfo.returnFlight || '',
            // Return trip is NOT a roundtrip itself
            roundTrip: false,
            returnDate: '',
            returnHour: '',
            returnMinute: '',
            returnPeriod: '',
            returnFlight: '',
            stops: [], // No stops for return trip by default
            tripType: savedBooking.tripInfo.tripType || 'Point-to-point',
            airportCode: savedBooking.tripInfo.airportCode,
            terminalGate: savedBooking.tripInfo.terminalGate,
            meetOption: savedBooking.tripInfo.meetOption
          },
          userData: savedBooking.userData,
          paymentMethod: savedBooking.paymentMethod,
          checkoutType: savedBooking.checkoutType,
          isLoggedIn: savedBooking.isLoggedIn,
          status: 'Pending',
          // Calculate return trip price
          // Use returnTripPrice from the original booking if available, with proportional payment discount
          totalPrice: (() => {
            let returnPrice = 0;
            
            // Use outboundPrice if available (price of outbound trip before discounts)
            const outboundPrice = savedBooking.outboundPrice || 
                                 (savedBooking.basePrice || 0) + 
                                 (savedBooking.distancePrice || 0) + 
                                 (savedBooking.stopsCharge || 0) + 
                                 (savedBooking.childSeatsCharge || 0);
            
            // If returnTripPrice is explicitly stored, use it
            if (savedBooking.returnTripPrice && savedBooking.returnTripPrice > 0) {
              returnPrice = savedBooking.returnTripPrice;
            } else {
              // Fallback: calculate return price from outbound price with roundtrip discount
              // This should match the calculation in pricingController
              const roundTripDiscountPercent = savedBooking.roundTripDiscount > 0 
                ? (savedBooking.roundTripDiscount / outboundPrice) * 100 
                : 5; // Default 5% if not available
              returnPrice = outboundPrice * (1 - roundTripDiscountPercent / 100);
            }
            
            // Calculate proportional payment discount for return trip
            const totalSubtotal = outboundPrice + returnPrice;
            if (totalSubtotal > 0 && savedBooking.paymentDiscount) {
              const returnProportion = returnPrice / totalSubtotal;
              const returnDiscount = savedBooking.paymentDiscount * returnProportion;
              returnPrice = returnPrice - returnDiscount;
            }
            
            return Math.round(returnPrice * 100) / 100;
          })(),
          calculatedPrice: (() => {
            // Same calculation for calculatedPrice field (store as number)
            const outboundPrice = savedBooking.outboundPrice || 
                                 (savedBooking.basePrice || 0) + 
                                 (savedBooking.distancePrice || 0) + 
                                 (savedBooking.stopsCharge || 0) + 
                                 (savedBooking.childSeatsCharge || 0);
            
            let returnPrice = 0;
            if (savedBooking.returnTripPrice && savedBooking.returnTripPrice > 0) {
              returnPrice = savedBooking.returnTripPrice;
            } else {
              // Calculate return price from outbound with roundtrip discount
              const roundTripDiscountPercent = savedBooking.roundTripDiscount > 0 
                ? (savedBooking.roundTripDiscount / outboundPrice) * 100 
                : 5;
              returnPrice = outboundPrice * (1 - roundTripDiscountPercent / 100);
            }
            
            const totalSubtotal = outboundPrice + returnPrice;
            if (totalSubtotal > 0 && savedBooking.paymentDiscount) {
              const returnProportion = returnPrice / totalSubtotal;
              const returnDiscount = savedBooking.paymentDiscount * returnProportion;
              returnPrice = returnPrice - returnDiscount;
            }
            
            return Math.round(returnPrice * 100) / 100;
          })(),
          bookingFee: savedBooking.bookingFee || 0,
          childSeatsCharge: savedBooking.childSeatsCharge || 0,
          discountPercentage: savedBooking.discountPercentage || 0,
          discountFixed: savedBooking.discountFixed || 0,
          roundTripDiscount: 0, // No discount for return trip itself
          gratuityPercentage: savedBooking.gratuityPercentage || 0,
          gratuityFixed: savedBooking.gratuityFixed || 0,
          taxesPercentage: savedBooking.taxesPercentage || 0,
          taxesFixed: savedBooking.taxesFixed || 0,
          creditCardFeePercentage: savedBooking.creditCardFeePercentage || 0,
          creditCardFeeFixed: savedBooking.creditCardFeeFixed || 0,
          basePrice: savedBooking.basePrice || 0,
          distancePrice: savedBooking.distancePrice || 0,
          surgeMultiplier: savedBooking.surgeMultiplier || 1,
          surgeName: savedBooking.surgeName || '',
          stopsCharge: 0, // No stops for return trip
          returnTripPrice: 0,
          subtotal: (() => {
            // Calculate return subtotal (return price before payment discount)
            const returnPrice = savedBooking.returnTripPrice || 0;
            return returnPrice;
          })(),
          finalTotal: (() => {
            // Calculate return final total (return price after payment discount)
            let returnPrice = savedBooking.returnTripPrice || 0;
            const outboundPrice = savedBooking.outboundPrice || 
                                 (savedBooking.basePrice || 0) + 
                                 (savedBooking.distancePrice || 0) + 
                                 (savedBooking.stopsCharge || 0) + 
                                 (savedBooking.childSeatsCharge || 0);
            const totalSubtotal = outboundPrice + returnPrice;
            if (totalSubtotal > 0 && savedBooking.paymentDiscount) {
              const returnProportion = returnPrice / totalSubtotal;
              const returnDiscount = savedBooking.paymentDiscount * returnProportion;
              returnPrice = returnPrice - returnDiscount;
            }
            return Math.round(returnPrice * 100) / 100;
          })(),
          paymentDiscount: savedBooking.paymentDiscount || 0,
          paymentDiscountDescription: savedBooking.paymentDiscountDescription || '',
          areaName: savedBooking.areaName || '',
          pricingMethod: savedBooking.pricingMethod || 'distance'
        };
        
        // Create and save return booking
        returnBooking = new Booking(returnBookingData);
        const savedReturnBooking = await returnBooking.save();
        
        console.log(`✅ Return booking created successfully: ${savedReturnBooking.outboundConfirmationNumber}`);
        
        // Generate global variables for return booking
        try {
          await GlobalVariablesService.updateGlobalVariables((savedReturnBooking._id as any).toString());
          console.log(`Global variables generated for return booking ${savedReturnBooking._id}`);
        } catch (globalVarError) {
          console.error('Error generating global variables for return booking:', globalVarError);
        }
        
        // Update customer statistics to include return booking
        if (savedBooking.customerId) {
          try {
            const customer = await Customer.findById(savedBooking.customerId);
            if (customer) {
              customer.totalBookings += 1;
              customer.totalSpent += savedReturnBooking.totalPrice;
              await customer.save();
              console.log(`Updated customer statistics to include return booking`);
            }
          } catch (customerError) {
            console.error('Error updating customer statistics for return booking:', customerError);
          }
        }
        
      } catch (returnBookingError) {
        console.error('❌ Error creating return booking:', returnBookingError);
        // Don't fail the entire request if return booking creation fails
        // The outbound booking was already created successfully
      }
    }
    
    // Generate global variables for the new booking
    try {
      await GlobalVariablesService.updateGlobalVariables((savedBooking._id as any).toString());
      console.log(`Global variables generated for new booking ${savedBooking._id}`);
    } catch (globalVarError) {
      console.error('Error generating global variables:', globalVarError);
      // Don't fail the entire request if global variables generation fails
    }
    
    // Send automatic emails if configured
    try {
      const EmailConfig = (await import('../models/EmailConfig')).EmailConfig;
      const { resendEmailService } = await import('../services/resendEmailService');
      
      const emailConfig = await EmailConfig.findOne({ isActive: true });
      
      if (emailConfig && emailConfig.isActive) {
        // Initialize email service
        await resendEmailService.initialize();
        
        // Send customer email if enabled
        if (emailConfig.autoSendCustomerEmail && emailConfig.customerEmailTemplate && savedBooking.userData?.email) {
          try {
            const success = await resendEmailService.sendTemplateEmail(
              emailConfig.customerEmailTemplate,
              savedBooking,
              savedBooking.userData.email,
              []
            );
            if (success) {
              console.log(`✅ Auto-sent customer email (${emailConfig.customerEmailTemplate}) to ${savedBooking.userData.email}`);
            } else {
              console.error(`❌ Failed to auto-send customer email to ${savedBooking.userData.email}`);
            }
          } catch (emailError) {
            console.error('Error sending customer email:', emailError);
            // Don't fail the booking creation if email fails
          }
        }
        
        // Send company email if enabled
        if (emailConfig.autoSendCompanyEmail && emailConfig.companyEmailTemplate && emailConfig.adminEmail) {
          try {
            const success = await resendEmailService.sendTemplateEmail(
              emailConfig.companyEmailTemplate,
              savedBooking,
              emailConfig.adminEmail,
              []
            );
            if (success) {
              console.log(`✅ Auto-sent company email (${emailConfig.companyEmailTemplate}) to ${emailConfig.adminEmail}`);
            } else {
              console.error(`❌ Failed to auto-send company email to ${emailConfig.adminEmail}`);
            }
          } catch (emailError) {
            console.error('Error sending company email:', emailError);
            // Don't fail the booking creation if email fails
          }
        }
      }
    } catch (emailConfigError) {
      console.error('Error checking email configuration:', emailConfigError);
      // Don't fail the booking creation if email config check fails
    }
    
    console.log('Booking created successfully:', savedBooking.outboundConfirmationNumber);
    
    // Return both bookings if return booking was created
    if (returnBooking) {
      return res.status(201).json({
        outboundBooking: savedBooking,
        returnBooking: returnBooking,
        message: 'Roundtrip booking created successfully with both outbound and return trips'
      });
    }
    
    return res.status(201).json(savedBooking);
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({ message: 'Error creating booking', error: (error as Error).message });
  }
};

// Get next available confirmation number
export const getNextConfirmationNumber = async (req: Request, res: Response) => {
  try {
    let nextNumber = 10000; // Start from 10000
    
    // Find the highest confirmation number in the database
    const lastBooking = await Booking.findOne(
      { outboundConfirmationNumber: { $exists: true } },
      { outboundConfirmationNumber: 1 },
      { sort: { outboundConfirmationNumber: -1 } }
    );

    if (lastBooking && lastBooking.outboundConfirmationNumber) {
      // Extract numeric part from confirmation number
      const numericPart = parseInt(lastBooking.outboundConfirmationNumber.toString());
      if (!isNaN(numericPart) && numericPart >= 10000) {
        nextNumber = numericPart + 1;
      }
    }

    // Double-check that this number doesn't already exist
    let attempts = 0;
    const maxAttempts = 100; // Prevent infinite loop
    let foundAvailableNumber = false;
    
    while (attempts < maxAttempts) {
      const existingBooking = await Booking.findOne({ 
        outboundConfirmationNumber: nextNumber.toString() 
      });
      
      if (!existingBooking) {
        // Number is available
        foundAvailableNumber = true;
        break;
      }
      
      // Number exists, try next one
      nextNumber++;
      attempts++;
    }

    // Ensure we don't exceed reasonable limits
    if (nextNumber > 99999) {
      return res.status(400).json({ 
        message: 'Maximum confirmation number reached. Please contact administrator.' 
      });
    }

    if (!foundAvailableNumber) {
      return res.status(500).json({ 
        message: 'Unable to find available confirmation number after multiple attempts.' 
      });
    }

    return res.json({ nextNumber });
  } catch (error) {
    console.error('Error getting next confirmation number:', error);
    return res.status(500).json({ 
      message: 'Error getting next confirmation number', 
      error: (error as Error).message 
    });
  }
};

// Get booking statistics
export const getBookingStats = async (req: Request, res: Response) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'Pending' });
    const unassignedBookings = await Booking.countDocuments({ status: 'Unassigned' });
    const confirmedBookings = await Booking.countDocuments({ status: 'Assigned' });
    const completedBookings = await Booking.countDocuments({ status: 'Done' });
    const cancelledBookings = await Booking.countDocuments({ status: 'Canceled' });
    
    // Get bookings for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentBookings = await Booking.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    res.json({
      total: totalBookings,
      pending: pendingBookings,
      unassigned: unassignedBookings,
      confirmed: confirmedBookings,
      completed: completedBookings,
      cancelled: cancelledBookings,
      recent: recentBookings
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching booking statistics', error: (error as Error).message });
  }
}; 