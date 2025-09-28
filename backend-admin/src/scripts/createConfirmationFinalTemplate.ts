import mongoose from 'mongoose';
import { EmailTemplate } from '../models/EmailTemplate';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-admin';

async function createConfirmationFinalTemplate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if template already exists
    const existingTemplate = await EmailTemplate.findOne({ name: 'Confirmation Final' });
    if (existingTemplate) {
      console.log('⚠️ Template "Confirmation Final" already exists');
      console.log('Updating existing template...');
      
      // Update the existing template
      existingTemplate.htmlContent = getModernHTMLTemplate();
      existingTemplate.textContent = getModernTextTemplate();
      existingTemplate.subject = 'Booking Confirmation - {{confirmationNumber}}';
      existingTemplate.type = 'confirmation';
      existingTemplate.isActive = true;
      existingTemplate.variables = getTemplateVariables();
      
      await existingTemplate.save();
      console.log('✅ Template "Confirmation Final" updated successfully');
    } else {
      // Create new template
      const template = new EmailTemplate({
        name: 'Confirmation Final',
        subject: 'Booking Confirmation - {{confirmationNumber}}',
        htmlContent: getModernHTMLTemplate(),
        textContent: getModernTextTemplate(),
        type: 'confirmation',
        isActive: true,
        variables: getTemplateVariables()
      });

      await template.save();
      console.log('✅ Template "Confirmation Final" created successfully');
    }

    console.log('\n📧 Template Details:');
    console.log('   - Name: Confirmation Final');
    console.log('   - Type: confirmation');
    console.log('   - Active: true');
    console.log('   - Subject: Booking Confirmation - {{confirmationNumber}}');
    console.log('   - Variables: ' + getTemplateVariables().length + ' available');

  } catch (error) {
    console.error('❌ Error creating template:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

function getModernHTMLTemplate(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .confirmation-badge {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            display: inline-block;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 30px;
        }
        
        .greeting {
            font-size: 18px;
            color: #333;
            margin-bottom: 30px;
        }
        
        .booking-details {
            background-color: #f8f9fa;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 30px;
            border-left: 4px solid #667eea;
        }
        
        .booking-details h3 {
            color: #667eea;
            font-size: 20px;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e9ecef;
        }
        
        .detail-row:last-child {
            border-bottom: none;
        }
        
        .detail-label {
            font-weight: 600;
            color: #495057;
            flex: 1;
        }
        
        .detail-value {
            color: #333;
            font-weight: 500;
            text-align: right;
            flex: 1;
        }
        
        .highlight-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            margin: 30px 0;
        }
        
        .highlight-box h4 {
            font-size: 18px;
            margin-bottom: 8px;
        }
        
        .highlight-box p {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .contact-info {
            background-color: #f8f9fa;
            border-radius: 12px;
            padding: 25px;
            margin-top: 30px;
        }
        
        .contact-info h4 {
            color: #667eea;
            font-size: 18px;
            margin-bottom: 15px;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .contact-item:last-child {
            margin-bottom: 0;
        }
        
        .contact-icon {
            width: 20px;
            height: 20px;
            margin-right: 12px;
            color: #667eea;
        }
        
        .footer {
            background-color: #343a40;
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .footer p {
            margin-bottom: 10px;
        }
        
        .footer a {
            color: #667eea;
            text-decoration: none;
        }
        
        .footer a:hover {
            text-decoration: underline;
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 0;
                box-shadow: none;
            }
            
            .content {
                padding: 20px 15px;
            }
            
            .detail-row {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .detail-value {
                text-align: left;
                margin-top: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <h1>🚗 Airport Shuttle TPA</h1>
            <p>Your trusted transportation partner</p>
        </div>
        
        <!-- Main Content -->
        <div class="content">
            <div class="confirmation-badge">
                ✅ Booking Confirmed
            </div>
            
            <div class="greeting">
                Dear {{customerName}},
            </div>
            
            <p style="font-size: 16px; color: #666; margin-bottom: 30px;">
                Thank you for choosing Airport Shuttle TPA! Your booking has been confirmed and we're excited to serve you.
            </p>
            
            <!-- Booking Details -->
            <div class="booking-details">
                <h3>📋 Booking Information</h3>
                
                <div class="detail-row">
                    <span class="detail-label">Confirmation Number:</span>
                    <span class="detail-value"><strong>{{confirmationNumber}}</strong></span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Pickup Location:</span>
                    <span class="detail-value">{{pickupLocation}}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Drop-off Location:</span>
                    <span class="detail-value">{{dropoffLocation}}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Date & Time:</span>
                    <span class="detail-value">{{pickupDate}} at {{pickupTime}}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Passengers:</span>
                    <span class="detail-value">{{passengers}} {{passengers === '1' ? 'person' : 'people'}}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Vehicle Type:</span>
                    <span class="detail-value">{{vehicleType}}</span>
                </div>
                
                {{#if flightNumber}}
                <div class="detail-row">
                    <span class="detail-label">Flight Number:</span>
                    <span class="detail-value">{{flightNumber}}</span>
                </div>
                {{/if}}
                
                <div class="detail-row">
                    <span class="detail-label">Total Price:</span>
                    <span class="detail-value"><strong style="color: #28a745; font-size: 18px;">{{totalPrice}}</strong></span>
                </div>
            </div>
            
            <!-- Important Notice -->
            <div class="highlight-box">
                <h4>🎯 What's Next?</h4>
                <p>Our driver will contact you 30 minutes before pickup time. Please be ready at the designated location.</p>
            </div>
            
            <!-- Contact Information -->
            <div class="contact-info">
                <h4>📞 Need Help?</h4>
                
                <div class="contact-item">
                    <span class="contact-icon">📱</span>
                    <span>Phone: {{companyPhone}}</span>
                </div>
                
                <div class="contact-item">
                    <span class="contact-icon">✉️</span>
                    <span>Email: {{companyEmail}}</span>
                </div>
                
                <div class="contact-item">
                    <span class="contact-icon">🌐</span>
                    <span>Website: {{companyWebsite}}</span>
                </div>
            </div>
            
            {{#if specialInstructions}}
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin-top: 20px;">
                <h4 style="color: #856404; margin-bottom: 8px;">📝 Special Instructions:</h4>
                <p style="color: #856404; margin: 0;">{{specialInstructions}}</p>
            </div>
            {{/if}}
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p><strong>Airport Shuttle TPA</strong></p>
            <p>Professional Transportation Services</p>
            <p>
                <a href="{{companyWebsite}}">Visit our website</a> | 
                <a href="mailto:{{companyEmail}}">Contact us</a>
            </p>
            <p style="font-size: 12px; opacity: 0.8; margin-top: 15px;">
                This is an automated message. Please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>`;
}

function getModernTextTemplate(): string {
  return `
BOOKING CONFIRMATION - {{confirmationNumber}}

Dear {{customerName}},

Thank you for choosing Airport Shuttle TPA! Your booking has been confirmed and we're excited to serve you.

BOOKING INFORMATION:
==================
Confirmation Number: {{confirmationNumber}}
Pickup Location: {{pickupLocation}}
Drop-off Location: {{dropoffLocation}}
Date & Time: {{pickupDate}} at {{pickupTime}}
Passengers: {{passengers}} {{passengers === '1' ? 'person' : 'people'}}
Vehicle Type: {{vehicleType}}
{{#if flightNumber}}Flight Number: {{flightNumber}}{{/if}}
Total Price: {{totalPrice}}

WHAT'S NEXT?
============
Our driver will contact you 30 minutes before pickup time. Please be ready at the designated location.

CONTACT INFORMATION:
===================
Phone: {{companyPhone}}
Email: {{companyEmail}}
Website: {{companyWebsite}}

{{#if specialInstructions}}
SPECIAL INSTRUCTIONS:
====================
{{specialInstructions}}
{{/if}}

Thank you for choosing Airport Shuttle TPA!

Best regards,
The Airport Shuttle TPA Team

---
This is an automated message. Please do not reply to this email.
`;
}

function getTemplateVariables(): string[] {
  return [
    'customerName',
    'customerFirstName',
    'customerLastName',
    'customerEmail',
    'customerPhone',
    'confirmationNumber',
    'pickupLocation',
    'dropoffLocation',
    'pickupDate',
    'pickupTime',
    'passengers',
    'vehicleType',
    'totalPrice',
    'flightNumber',
    'airportCode',
    'terminalGate',
    'specialInstructions',
    'companyName',
    'companyPhone',
    'companyEmail',
    'companyWebsite'
  ];
}

// Run the script
createConfirmationFinalTemplate();
