import mongoose from 'mongoose';
import { EmailTemplate } from '../models/EmailTemplate';
import dotenv from 'dotenv';

dotenv.config();

const createDefaultTemplates = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-admin');
    console.log('Connected to MongoDB');

    // Check if templates already exist
    const existingTemplates = await EmailTemplate.find();
    if (existingTemplates.length > 0) {
      console.log('Email templates already exist, skipping creation');
      return;
    }

    // Confirmation Email Template
    const confirmationTemplate = new EmailTemplate({
      name: 'confirmation',
      subject: 'Booking Confirmation - {{confirmationNumber}}',
      htmlContent: 
        '<!DOCTYPE html>' +
        '<html>' +
        '<head>' +
          '<meta charset="utf-8">' +
          '<title>Booking Confirmation</title>' +
          '<style>' +
            'body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }' +
            '.container { max-width: 600px; margin: 0 auto; padding: 20px; }' +
            '.header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }' +
            '.content { padding: 20px; background-color: #f9f9f9; }' +
            '.booking-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }' +
            '.footer { background-color: #34495e; color: white; padding: 20px; text-align: center; }' +
            '.highlight { color: #e74c3c; font-weight: bold; }' +
          '</style>' +
        '</head>' +
        '<body>' +
          '<div class="container">' +
            '<div class="header">' +
              '<h1>🚗 Airport Shuttle TPA</h1>' +
              '<h2>Booking Confirmation</h2>' +
            '</div>' +
            '<div class="content">' +
              '<p>Dear {{customerName}},</p>' +
              '<p>Thank you for choosing Airport Shuttle TPA! Your booking has been confirmed.</p>' +
              '<div class="booking-details">' +
                '<h3>📋 Booking Details</h3>' +
                '<p><strong>Confirmation Number:</strong> <span class="highlight">{{confirmationNumber}}</span></p>' +
                '<p><strong>Booking Date:</strong> {{bookingDate}}</p>' +
                '<h3>🚗 Trip Information</h3>' +
                '<p><strong>Pickup Location:</strong> {{pickupLocation}}</p>' +
                '<p><strong>Dropoff Location:</strong> {{dropoffLocation}}</p>' +
                '<p><strong>Date:</strong> {{tripDate}}</p>' +
                '<p><strong>Time:</strong> {{tripTime}}</p>' +
                '<h3>🚐 Vehicle Information</h3>' +
                '<p><strong>Vehicle Type:</strong> {{vehicleType}}</p>' +
                '<p><strong>Capacity:</strong> {{vehicleCapacity}} passengers</p>' +
                '<h3>💰 Pricing</h3>' +
                '<p><strong>Base Price:</strong> ${{basePrice}}</p>' +
                '<p><strong>Additional Fees:</strong> ${{additionalFees}}</p>' +
                '<p><strong>Total Price:</strong> <span class="highlight">${{totalPrice}}</span></p>' +
              '</div>' +
              '<p><strong>Important Notes:</strong></p>' +
              '<ul>' +
                '<li>Please arrive 10 minutes before your scheduled pickup time</li>' +
                '<li>Have your confirmation number ready</li>' +
                '<li>Contact us immediately if you need to make changes</li>' +
              '</ul>' +
              '<p>If you have any questions, please contact us:</p>' +
              '<p>📧 {{companyEmail}} | 📞 {{companyPhone}}</p>' +
            '</div>' +
            '<div class="footer">' +
              '<p>Thank you for choosing Airport Shuttle TPA!</p>' +
              '<p>Safe travels! ✈️</p>' +
            '</div>' +
          '</div>' +
        '</body>' +
        '</html>',
      textContent: 
        'Booking Confirmation - {{confirmationNumber}}\n\n' +
        'Dear {{customerName}},\n\n' +
        'Thank you for choosing Airport Shuttle TPA! Your booking has been confirmed.\n\n' +
        'BOOKING DETAILS:\n' +
        'Confirmation Number: {{confirmationNumber}}\n' +
        'Booking Date: {{bookingDate}}\n\n' +
        'TRIP INFORMATION:\n' +
        'Pickup Location: {{pickupLocation}}\n' +
        'Dropoff Location: {{dropoffLocation}}\n' +
        'Date: {{tripDate}}\n' +
        'Time: {{tripTime}}\n\n' +
        'VEHICLE INFORMATION:\n' +
        'Vehicle Type: {{vehicleType}}\n' +
        'Capacity: {{vehicleCapacity}} passengers\n\n' +
        'PRICING:\n' +
        'Base Price: ${{basePrice}}\n' +
        'Additional Fees: ${{additionalFees}}\n' +
        'Total Price: ${{totalPrice}}\n\n' +
        'IMPORTANT NOTES:\n' +
        '- Please arrive 10 minutes before your scheduled pickup time\n' +
        '- Have your confirmation number ready\n' +
        '- Contact us immediately if you need to make changes\n\n' +
        'If you have any questions, please contact us:\n' +
        '{{companyEmail}} | {{companyPhone}}\n\n' +
        'Thank you for choosing Airport Shuttle TPA!\n' +
        'Safe travels!',
      type: 'confirmation',
      isActive: true,
      variables: [
        'customerName', 'confirmationNumber', 'bookingDate', 'pickupLocation', 
        'dropoffLocation', 'tripDate', 'tripTime', 'vehicleType', 'vehicleCapacity',
        'basePrice', 'additionalFees', 'totalPrice', 'companyEmail', 'companyPhone'
      ]
    });

    // Receipt Email Template
    const receiptTemplate = new EmailTemplate({
      name: 'receipt',
      subject: 'Payment Receipt - {{confirmationNumber}}',
      htmlContent: 
        '<!DOCTYPE html>' +
        '<html>' +
        '<head>' +
          '<meta charset="utf-8">' +
          '<title>Payment Receipt</title>' +
          '<style>' +
            'body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }' +
            '.container { max-width: 600px; margin: 0 auto; padding: 20px; }' +
            '.header { background-color: #27ae60; color: white; padding: 20px; text-align: center; }' +
            '.content { padding: 20px; background-color: #f9f9f9; }' +
            '.receipt { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; border: 2px solid #27ae60; }' +
            '.footer { background-color: #2ecc71; color: white; padding: 20px; text-align: center; }' +
            '.highlight { color: #27ae60; font-weight: bold; }' +
            '.amount { font-size: 24px; color: #27ae60; font-weight: bold; }' +
          '</style>' +
        '</head>' +
        '<body>' +
          '<div class="container">' +
            '<div class="header">' +
              '<h1>💰 Airport Shuttle TPA</h1>' +
              '<h2>Payment Receipt</h2>' +
            '</div>' +
            '<div class="content">' +
              '<p>Dear {{customerName}},</p>' +
              '<p>Thank you for your payment! Here is your receipt for your recent booking.</p>' +
              '<div class="receipt">' +
                '<h3>📄 Receipt Details</h3>' +
                '<p><strong>Receipt Date:</strong> {{bookingDate}}</p>' +
                '<p><strong>Confirmation Number:</strong> <span class="highlight">{{confirmationNumber}}</span></p>' +
                '<h3>🚗 Service Details</h3>' +
                '<p><strong>Service:</strong> Airport Shuttle Transportation</p>' +
                '<p><strong>From:</strong> {{pickupLocation}}</p>' +
                '<p><strong>To:</strong> {{dropoffLocation}}</p>' +
                '<p><strong>Date:</strong> {{tripDate}}</p>' +
                '<p><strong>Time:</strong> {{tripTime}}</p>' +
                '<h3>💰 Payment Breakdown</h3>' +
                '<p><strong>Base Price:</strong> ${{basePrice}}</p>' +
                '<p><strong>Additional Fees:</strong> ${{additionalFees}}</p>' +
                '<hr>' +
                '<p><strong>Total Amount Paid:</strong> <span class="amount">${{totalPrice}}</span></p>' +
                '<h3>📋 Booking Information</h3>' +
                '<p><strong>Vehicle Type:</strong> {{vehicleType}}</p>' +
                '<p><strong>Capacity:</strong> {{vehicleCapacity}} passengers</p>' +
              '</div>' +
              '<p><strong>Payment Status:</strong> <span class="highlight">PAID</span></p>' +
              '<p>This receipt serves as proof of payment for your booking. Please keep it for your records.</p>' +
              '<p>If you have any questions about this receipt, please contact us:</p>' +
              '<p>📧 {{companyEmail}} | 📞 {{companyPhone}}</p>' +
            '</div>' +
            '<div class="footer">' +
              '<p>Thank you for choosing Airport Shuttle TPA!</p>' +
              '<p>We look forward to serving you! 🚗</p>' +
            '</div>' +
          '</div>' +
        '</body>' +
        '</html>',
      textContent: 
        'Payment Receipt - {{confirmationNumber}}\n\n' +
        'Dear {{customerName}},\n\n' +
        'Thank you for your payment! Here is your receipt for your recent booking.\n\n' +
        'RECEIPT DETAILS:\n' +
        'Receipt Date: {{bookingDate}}\n' +
        'Confirmation Number: {{confirmationNumber}}\n\n' +
        'SERVICE DETAILS:\n' +
        'Service: Airport Shuttle Transportation\n' +
        'From: {{pickupLocation}}\n' +
        'To: {{dropoffLocation}}\n' +
        'Date: {{tripDate}}\n' +
        'Time: {{tripTime}}\n\n' +
        'PAYMENT BREAKDOWN:\n' +
        'Base Price: ${{basePrice}}\n' +
        'Additional Fees: ${{additionalFees}}\n' +
        'Total Amount Paid: ${{totalPrice}}\n\n' +
        'BOOKING INFORMATION:\n' +
        'Vehicle Type: {{vehicleType}}\n' +
        'Capacity: {{vehicleCapacity}} passengers\n\n' +
        'Payment Status: PAID\n\n' +
        'This receipt serves as proof of payment for your booking. Please keep it for your records.\n\n' +
        'If you have any questions about this receipt, please contact us:\n' +
        '{{companyEmail}} | {{companyPhone}}\n\n' +
        'Thank you for choosing Airport Shuttle TPA!\n' +
        'We look forward to serving you!',
      type: 'receipt',
      isActive: true,
      variables: [
        'customerName', 'confirmationNumber', 'bookingDate', 'pickupLocation', 
        'dropoffLocation', 'tripDate', 'tripTime', 'vehicleType', 'vehicleCapacity',
        'basePrice', 'additionalFees', 'totalPrice', 'companyEmail', 'companyPhone'
      ]
    });

    await confirmationTemplate.save();
    await receiptTemplate.save();

    console.log('Default email templates created successfully');
    console.log('- Confirmation template');
    console.log('- Receipt template');

  } catch (error) {
    console.error('Error creating default templates:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

createDefaultTemplates();
