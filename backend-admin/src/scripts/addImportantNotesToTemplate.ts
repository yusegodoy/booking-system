import mongoose from 'mongoose';
import { EmailTemplate } from '../models/EmailTemplate';

// Production MongoDB URI
const PRODUCTION_MONGODB_URI = "mongodb+srv://administrator-booking:mOqM183APIf4b9Rw@airportshuttletpa.wapwkji.mongodb.net/booking-admin?retryWrites=true&w=majority&appName=airportshuttletpa";

async function addImportantNotesToTemplate() {
  try {
    console.log('🔗 Connecting to PRODUCTION database...');
    
    await mongoose.connect(PRODUCTION_MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas Production');

    // Get the Confirmation Final template
    const template = await EmailTemplate.findOne({ name: 'Confirmation Final' });
    
    if (!template) {
      console.log('❌ Confirmation Final template not found');
      return;
    }

    console.log('📧 Adding Important Notes section to template...');

    // Update with enhanced template including Important Notes
    template.htmlContent = getUpdatedHTMLTemplate();
    template.textContent = getUpdatedTextTemplate();
    
    await template.save();
    console.log('✅ Template updated with Important Notes successfully');

    console.log('\n📧 Updated Template Details:');
    console.log('   - Name: Confirmation Final');
    console.log('   - HTML Content: ' + getUpdatedHTMLTemplate().length + ' characters');
    console.log('   - Text Content: ' + getUpdatedTextTemplate().length + ' characters');

    // Verify the template was updated
    const verifyTemplate = await EmailTemplate.findOne({ name: 'Confirmation Final' });
    if (verifyTemplate) {
      console.log('\n✅ Verification successful: Template updated with Important Notes');
      console.log(`   Updated: ${verifyTemplate.updatedAt}`);
    } else {
      console.log('\n❌ Verification failed: Template not found');
    }

  } catch (error) {
    console.error('❌ Error updating template:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

function getUpdatedHTMLTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation - Airport Shuttle TPA</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 20px;
        }
        
        .email-container {
            max-width: 700px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        /* Header Section */
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header h1 {
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .header .subtitle {
            font-size: 18px;
            opacity: 0.95;
            font-weight: 300;
        }
        
        .header .icon {
            font-size: 48px;
            margin-bottom: 15px;
            display: block;
        }
        
        /* Main Content */
        .content {
            padding: 50px 40px;
        }
        
        /* Confirmation Badge */
        .confirmation-badge {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 15px 30px;
            border-radius: 50px;
            display: inline-block;
            font-weight: 700;
            font-size: 16px;
            margin-bottom: 40px;
            box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        /* Greeting */
        .greeting {
            font-size: 24px;
            color: #2c3e50;
            margin-bottom: 30px;
            font-weight: 600;
        }
        
        .intro-text {
            font-size: 18px;
            color: #5a6c7d;
            margin-bottom: 40px;
            line-height: 1.7;
        }
        
        /* Booking Details Card */
        .booking-details {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 20px;
            padding: 35px;
            margin-bottom: 40px;
            border: 1px solid #e9ecef;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
        }
        
        .booking-details h3 {
            color: #667eea;
            font-size: 24px;
            margin-bottom: 30px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 25px;
        }
        
        .detail-item {
            background: white;
            padding: 20px;
            border-radius: 15px;
            border-left: 4px solid #667eea;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
            transition: transform 0.3s ease;
        }
        
        .detail-item:hover {
            transform: translateY(-2px);
        }
        
        .detail-label {
            font-weight: 700;
            color: #495057;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        
        .detail-value {
            color: #2c3e50;
            font-weight: 600;
            font-size: 16px;
        }
        
        .detail-value.highlight {
            color: #28a745;
            font-size: 20px;
            font-weight: 800;
        }
        
        /* Important Notice */
        .notice-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 20px;
            text-align: center;
            margin: 40px 0;
            box-shadow: 0 15px 35px rgba(102, 126, 234, 0.3);
        }
        
        .notice-section h4 {
            font-size: 22px;
            margin-bottom: 15px;
            font-weight: 700;
        }
        
        .notice-section p {
            font-size: 16px;
            opacity: 0.95;
            line-height: 1.6;
        }
        
        /* Contact Information */
        .contact-section {
            background: #f8f9fa;
            border-radius: 20px;
            padding: 35px;
            margin: 40px 0;
        }
        
        .contact-section h4 {
            color: #667eea;
            font-size: 22px;
            margin-bottom: 25px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .contact-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        
        .contact-item {
            background: white;
            padding: 20px;
            border-radius: 15px;
            display: flex;
            align-items: center;
            gap: 15px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
            transition: transform 0.3s ease;
        }
        
        .contact-item:hover {
            transform: translateY(-2px);
        }
        
        .contact-icon {
            font-size: 24px;
            color: #667eea;
        }
        
        .contact-text {
            font-weight: 600;
            color: #2c3e50;
        }
        
        /* Special Instructions */
        .special-instructions {
            background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
            border: 2px solid #ffc107;
            border-radius: 15px;
            padding: 25px;
            margin: 30px 0;
        }
        
        .special-instructions h4 {
            color: #856404;
            font-size: 18px;
            margin-bottom: 15px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .special-instructions p {
            color: #856404;
            font-weight: 500;
            line-height: 1.6;
        }
        
        /* Important Notes Section */
        .important-notes {
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            border: 2px solid #2196f3;
            border-radius: 20px;
            padding: 35px;
            margin: 40px 0;
        }
        
        .important-notes h4 {
            color: #1976d2;
            font-size: 24px;
            margin-bottom: 25px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .important-notes ul {
            list-style: none;
            padding: 0;
        }
        
        .important-notes li {
            background: white;
            margin-bottom: 15px;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
            border-left: 4px solid #2196f3;
        }
        
        .important-notes li strong {
            color: #1976d2;
            font-weight: 700;
            display: block;
            margin-bottom: 8px;
            font-size: 16px;
        }
        
        .important-notes li p {
            color: #424242;
            margin: 0;
            line-height: 1.5;
        }
        
        .important-notes .sub-item {
            margin-left: 20px;
            margin-top: 8px;
            color: #666;
        }
        
        /* Footer */
        .footer {
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        
        .footer h5 {
            font-size: 24px;
            margin-bottom: 15px;
            font-weight: 700;
        }
        
        .footer p {
            margin-bottom: 10px;
            opacity: 0.9;
        }
        
        .footer a {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
            transition: color 0.3s ease;
        }
        
        .footer a:hover {
            color: #764ba2;
        }
        
        .footer-links {
            margin: 20px 0;
        }
        
        .footer-links a {
            margin: 0 15px;
            padding: 10px 20px;
            background: rgba(102, 126, 234, 0.2);
            border-radius: 25px;
            display: inline-block;
            transition: all 0.3s ease;
        }
        
        .footer-links a:hover {
            background: rgba(102, 126, 234, 0.3);
            transform: translateY(-2px);
        }
        
        .footer-note {
            font-size: 12px;
            opacity: 0.7;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            
            .email-container {
                border-radius: 15px;
            }
            
            .header {
                padding: 30px 20px;
            }
            
            .header h1 {
                font-size: 28px;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .details-grid {
                grid-template-columns: 1fr;
                gap: 15px;
            }
            
            .contact-grid {
                grid-template-columns: 1fr;
            }
            
            .detail-item {
                padding: 15px;
            }
            
            .contact-item {
                padding: 15px;
            }
            
            .important-notes {
                padding: 25px;
            }
        }
        
        @media (max-width: 480px) {
            .header h1 {
                font-size: 24px;
            }
            
            .greeting {
                font-size: 20px;
            }
            
            .intro-text {
                font-size: 16px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="header-content">
                <div class="icon">🚗</div>
                <h1>Airport Shuttle TPA</h1>
                <p class="subtitle">Your trusted transportation partner</p>
            </div>
        </div>
        
        <!-- Main Content -->
        <div class="content">
            <div class="confirmation-badge">
                ✅ Booking Confirmed
            </div>
            
            <div class="greeting">
                Dear {{customerName}},
            </div>
            
            <p class="intro-text">
                Thank you for choosing Airport Shuttle TPA! Your booking has been confirmed and we're excited to serve you. 
                We're committed to providing you with a safe, comfortable, and reliable transportation experience.
            </p>
            
            <!-- Booking Details -->
            <div class="booking-details">
                <h3>📋 Booking Information</h3>
                
                <div class="details-grid">
                    <div class="detail-item">
                        <div class="detail-label">Confirmation Number</div>
                        <div class="detail-value highlight">{{confirmationNumber}}</div>
                    </div>
                    
                    <div class="detail-item">
                        <div class="detail-label">Total Price</div>
                        <div class="detail-value highlight">{{totalPrice}}</div>
                    </div>
                    
                    <div class="detail-item">
                        <div class="detail-label">Pickup Location</div>
                        <div class="detail-value">{{pickupLocation}}</div>
                    </div>
                    
                    <div class="detail-item">
                        <div class="detail-label">Drop-off Location</div>
                        <div class="detail-value">{{dropoffLocation}}</div>
                    </div>
                    
                    <div class="detail-item">
                        <div class="detail-label">Date & Time</div>
                        <div class="detail-value">{{pickupDate}} at {{pickupTime}}</div>
                    </div>
                    
                    <div class="detail-item">
                        <div class="detail-label">Passengers</div>
                        <div class="detail-value">{{passengers}} {{#if (eq passengers 1)}}person{{else}}people{{/if}}</div>
                    </div>
                    
                    <div class="detail-item">
                        <div class="detail-label">Vehicle Type</div>
                        <div class="detail-value">{{vehicleType}}</div>
                    </div>
                    
                    {{#if flightNumber}}
                    <div class="detail-item">
                        <div class="detail-label">Flight Number</div>
                        <div class="detail-value">{{flightNumber}}</div>
                    </div>
                    {{/if}}
                </div>
            </div>
            
            <!-- Important Notice -->
            <div class="notice-section">
                <h4>🎯 What's Next?</h4>
                <p>Our professional driver will contact you 30 minutes before your scheduled pickup time. 
                Please be ready at the designated location to ensure a smooth departure.</p>
            </div>
            
            <!-- Contact Information -->
            <div class="contact-section">
                <h4>📞 Need Help?</h4>
                
                <div class="contact-grid">
                    <div class="contact-item">
                        <div class="contact-icon">📱</div>
                        <div class="contact-text">Phone: {{companyPhone}}</div>
                    </div>
                    
                    <div class="contact-item">
                        <div class="contact-icon">✉️</div>
                        <div class="contact-text">Email: {{companyEmail}}</div>
                    </div>
                    
                    <div class="contact-item">
                        <div class="contact-icon">🌐</div>
                        <div class="contact-text">Website: {{companyWebsite}}</div>
                    </div>
                </div>
            </div>
            
            {{#if specialInstructions}}
            <div class="special-instructions">
                <h4>📝 Special Instructions</h4>
                <p>{{specialInstructions}}</p>
            </div>
            {{/if}}
            
            <!-- Important Notes Section -->
            <div class="important-notes">
                <h4>📋 Important Notes</h4>
                <ul>
                    <li>
                        <strong>Driver Assignment:</strong>
                        <p>Your driver will be assigned the night before your trip and will contact you upon arrival.</p>
                    </li>
                    <li>
                        <strong>Notifications:</strong>
                        <p>You'll receive SMS and email updates (tracking link included).</p>
                    </li>
                    <li>
                        <strong>Airport Pick-Up:</strong>
                        <p>Curbside pick-up by default; "meet & greet" inside baggage claim available upon request. International travelers can use WhatsApp (free Wi-Fi at TPA).</p>
                    </li>
                    <li>
                        <strong>Payments:</strong>
                        <p>Credit cards are charged 24h prior to the trip (receipt by email). Cash also accepted. To update a card, request a secure payment link.</p>
                    </li>
                    <li>
                        <strong>Gratuities:</strong>
                        <p>Not included. Tips are optional (cash or card).</p>
                    </li>
                    <li>
                        <strong>Cancellations:</strong>
                        <p>Free if made ≥24h before.</p>
                        <p class="sub-item">50% fee if within 24h (unless due to flight cancellation → full refund).</p>
                    </li>
                    <li>
                        <strong>Flights:</strong>
                        <p>We track your flight and adjust pick-up time when possible, but punctuality of new times is not guaranteed.</p>
                    </li>
                    <li>
                        <strong>Children:</strong>
                        <p>Guests must provide an approved car seat or rent one for $5 (infant, toddler, booster).</p>
                    </li>
                    <li>
                        <strong>Pets:</strong>
                        <p>Allowed with prior notice; cleaning fees may apply.</p>
                    </li>
                    <li>
                        <strong>Pick-Up Times:</strong>
                        <p>Times are estimates and may vary due to traffic or weather. No refunds for delays.</p>
                    </li>
                </ul>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <h5>Airport Shuttle TPA</h5>
            <p>Professional Transportation Services</p>
            
            <div class="footer-links">
                <a href="{{companyWebsite}}">Visit our website</a>
                <a href="mailto:{{companyEmail}}">Contact us</a>
            </div>
            
            <p class="footer-note">
                This is an automated message. Please do not reply to this email.<br>
                For immediate assistance, please call {{companyPhone}}
            </p>
        </div>
    </div>
</body>
</html>`;
}

function getUpdatedTextTemplate(): string {
  return `BOOKING CONFIRMATION - {{confirmationNumber}}

Dear {{customerName}},

Thank you for choosing Airport Shuttle TPA! Your booking has been confirmed and we're excited to serve you. We're committed to providing you with a safe, comfortable, and reliable transportation experience.

BOOKING INFORMATION:
==================
Confirmation Number: {{confirmationNumber}}
Total Price: {{totalPrice}}
Pickup Location: {{pickupLocation}}
Drop-off Location: {{dropoffLocation}}
Date & Time: {{pickupDate}} at {{pickupTime}}
Passengers: {{passengers}} {{#if (eq passengers 1)}}person{{else}}people{{/if}}
Vehicle Type: {{vehicleType}}
{{#if flightNumber}}Flight Number: {{flightNumber}}{{/if}}

WHAT'S NEXT?
============
Our professional driver will contact you 30 minutes before your scheduled pickup time. Please be ready at the designated location to ensure a smooth departure.

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

IMPORTANT NOTES:
===============

Driver Assignment: Your driver will be assigned the night before your trip and will contact you upon arrival.

Notifications: You'll receive SMS and email updates (tracking link included).

Airport Pick-Up: Curbside pick-up by default; "meet & greet" inside baggage claim available upon request. International travelers can use WhatsApp (free Wi-Fi at TPA).

Payments: Credit cards are charged 24h prior to the trip (receipt by email). Cash also accepted. To update a card, request a secure payment link.

Gratuities: Not included. Tips are optional (cash or card).

Cancellations:
- Free if made ≥24h before.
- 50% fee if within 24h (unless due to flight cancellation → full refund).

Flights: We track your flight and adjust pick-up time when possible, but punctuality of new times is not guaranteed.

Children: Guests must provide an approved car seat or rent one for $5 (infant, toddler, booster).

Pets: Allowed with prior notice; cleaning fees may apply.

Pick-Up Times: Times are estimates and may vary due to traffic or weather. No refunds for delays.

Thank you for choosing Airport Shuttle TPA!

Best regards,
The Airport Shuttle TPA Team

---
This is an automated message. Please do not reply to this email.
For immediate assistance, please call {{companyPhone}}`;
}

// Run the script
addImportantNotesToTemplate();
