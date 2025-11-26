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
    if (!bookingData.outboundConfirmationNumber) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      bookingData.outboundConfirmationNumber = `BK${timestamp}${random}`;
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
      const resendEmailService = (await import('../services/resendEmailService')).default;
      
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