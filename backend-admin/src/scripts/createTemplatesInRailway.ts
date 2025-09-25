import mongoose from 'mongoose';
import { EmailTemplate } from '../models/EmailTemplate';

async function createTemplatesInRailway() {
  try {
    console.log('🔄 Creating email templates in Railway database...');
    
    // Connect to Railway MongoDB
    const mongoUri = 'mongodb+srv://administrator-booking:mOqM183APIf4b9Rw@airportshuttletpa.wapwkji.mongodb.net/?retryWrites=true&w=majority&appName=airportshuttletpa';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to Railway MongoDB');
    
    // Check if templates already exist
    const existingTemplates = await EmailTemplate.find();
    console.log('📧 Existing templates in Railway:', existingTemplates.length);
    
    if (existingTemplates.length > 0) {
      console.log('⚠️ Templates already exist in Railway. Deleting them first...');
      await EmailTemplate.deleteMany({});
      console.log('✅ Deleted existing templates');
    }
    
    // Create Confirmation template
    console.log('📧 Creating Confirmation template...');
    const confirmationTemplate = new EmailTemplate({
      name: 'Confirmation',
      subject: 'Booking Confirmation {{confirmationNumber}}',
      htmlContent: `<h1>Booking Confirmation ✈️ Airport Shuttle TPA</h1>
<h2>Booking Confirmation {{confirmationNumber}}</h2>
<p>Dear {{customerName}},</p>
<p>Thank you for choosing Airport Shuttle TPA for your transportation needs. Your booking has been confirmed!</p>

<h3>Trip Details:</h3>
<ul>
  <li><strong>Pickup Location:</strong> {{pickupLocation}}</li>
  <li><strong>Drop-off Location:</strong> {{dropoffLocation}}</li>
  <li><strong>Date:</strong> {{pickupDate}}</li>
  <li><strong>Time:</strong> {{pickupTime}}</li>
  <li><strong>Passengers:</strong> {{passengers}}</li>
  <li><strong>Vehicle Type:</strong> {{vehicleType}}</li>
  <li><strong>Total Price:</strong> {{totalPrice}}</li>
</ul>

<h3>Contact Information:</h3>
<p><strong>Company:</strong> {{companyName}}<br>
<strong>Phone:</strong> {{companyPhone}}<br>
<strong>Email:</strong> {{companyEmail}}<br>
<strong>Website:</strong> {{companyWebsite}}</p>

<p>If you have any questions or need to make changes to your booking, please contact us at {{companyPhone}} or {{companyEmail}}.</p>

<p>Thank you for choosing Airport Shuttle TPA!</p>
<p>Safe travels!</p>`,
      textContent: `Booking Confirmation {{confirmationNumber}}

Dear {{customerName}},

Thank you for choosing Airport Shuttle TPA for your transportation needs. Your booking has been confirmed!

Trip Details:
- Pickup Location: {{pickupLocation}}
- Drop-off Location: {{dropoffLocation}}
- Date: {{pickupDate}}
- Time: {{pickupTime}}
- Passengers: {{passengers}}
- Vehicle Type: {{vehicleType}}
- Total Price: {{totalPrice}}

Contact Information:
Company: {{companyName}}
Phone: {{companyPhone}}
Email: {{companyEmail}}
Website: {{companyWebsite}}

If you have any questions or need to make changes to your booking, please contact us at {{companyPhone}} or {{companyEmail}}.

Thank you for choosing Airport Shuttle TPA!
Safe travels!`,
      type: 'confirmation',
      isActive: true,
      variables: [
        '{{customerName}}',
        '{{customerFirstName}}',
        '{{customerLastName}}',
        '{{customerEmail}}',
        '{{customerPhone}}',
        '{{confirmationNumber}}',
        '{{pickupLocation}}',
        '{{dropoffLocation}}',
        '{{pickupDate}}',
        '{{pickupTime}}',
        '{{passengers}}',
        '{{vehicleType}}',
        '{{totalPrice}}',
        '{{companyName}}',
        '{{companyPhone}}',
        '{{companyEmail}}',
        '{{companyWebsite}}'
      ]
    });
    
    await confirmationTemplate.save();
    console.log('✅ Created Confirmation template');
    
    // Create Receipt template
    console.log('📧 Creating Receipt template...');
    const receiptTemplate = new EmailTemplate({
      name: 'Receipt',
      subject: 'Payment Receipt {{confirmationNumber}}',
      htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Receipt {{confirmationNumber}}</title>
</head>
<body>
  <h1>Payment Receipt ✈️ Airport Shuttle TPA</h1>
  <h2>Payment Receipt {{confirmationNumber}}</h2>
  <p>Dear {{customerName}},</p>
  <p>Thank you for your payment. Here is your receipt:</p>

  <h3>Payment Details:</h3>
  <ul>
    <li><strong>Confirmation Number:</strong> {{confirmationNumber}}</li>
    <li><strong>Amount Paid:</strong> {{totalPrice}}</li>
    <li><strong>Payment Method:</strong> Credit Card</li>
    <li><strong>Date:</strong> {{pickupDate}}</li>
  </ul>

  <h3>Trip Details:</h3>
  <ul>
    <li><strong>Pickup Location:</strong> {{pickupLocation}}</li>
    <li><strong>Drop-off Location:</strong> {{dropoffLocation}}</li>
    <li><strong>Time:</strong> {{pickupTime}}</li>
    <li><strong>Passengers:</strong> {{passengers}}</li>
    <li><strong>Vehicle Type:</strong> {{vehicleType}}</li>
  </ul>

  <h3>Contact Information:</h3>
  <p><strong>Company:</strong> {{companyName}}<br>
  <strong>Phone:</strong> {{companyPhone}}<br>
  <strong>Email:</strong> {{companyEmail}}<br>
  <strong>Website:</strong> {{companyWebsite}}</p>

  <p>If you have any questions about this receipt, please contact us at {{companyPhone}} or {{companyEmail}}.</p>

  <p>Thank you for choosing Airport Shuttle TPA!</p>
</body>
</html>`,
      textContent: `Payment Receipt {{confirmationNumber}}

Dear {{customerName}},

Thank you for your payment. Here is your receipt:

Payment Details:
- Confirmation Number: {{confirmationNumber}}
- Amount Paid: {{totalPrice}}
- Payment Method: Credit Card
- Date: {{pickupDate}}

Trip Details:
- Pickup Location: {{pickupLocation}}
- Drop-off Location: {{dropoffLocation}}
- Time: {{pickupTime}}
- Passengers: {{passengers}}
- Vehicle Type: {{vehicleType}}

Contact Information:
Company: {{companyName}}
Phone: {{companyPhone}}
Email: {{companyEmail}}
Website: {{companyWebsite}}

If you have any questions about this receipt, please contact us at {{companyPhone}} or {{companyEmail}}.

Thank you for choosing Airport Shuttle TPA!`,
      type: 'receipt',
      isActive: true,
      variables: [
        '{{customerName}}',
        '{{customerFirstName}}',
        '{{customerLastName}}',
        '{{customerEmail}}',
        '{{customerPhone}}',
        '{{confirmationNumber}}',
        '{{pickupLocation}}',
        '{{dropoffLocation}}',
        '{{pickupDate}}',
        '{{pickupTime}}',
        '{{passengers}}',
        '{{vehicleType}}',
        '{{totalPrice}}',
        '{{companyName}}',
        '{{companyPhone}}',
        '{{companyEmail}}',
        '{{companyWebsite}}'
      ]
    });
    
    await receiptTemplate.save();
    console.log('✅ Created Receipt template');
    
    // Verify the creation
    const finalTemplates = await EmailTemplate.find();
    console.log('🎉 Successfully created', finalTemplates.length, 'templates in Railway');
    
    if (finalTemplates.length > 0) {
      console.log('📋 Railway templates:');
      finalTemplates.forEach((template, index) => {
        console.log(`  ${index + 1}. Name: "${template.name}", Type: "${template.type}", Active: ${template.isActive}`);
      });
    }
    
    console.log('🎉 Email templates created successfully in Railway!');
    
  } catch (error) {
    console.error('❌ Error creating templates in Railway:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from Railway MongoDB');
  }
}

// Run the script
createTemplatesInRailway();
