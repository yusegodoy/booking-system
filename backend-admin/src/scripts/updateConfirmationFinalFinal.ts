import mongoose from 'mongoose';
import { EmailTemplate } from '../models/EmailTemplate';

// Production MongoDB URI
const PRODUCTION_MONGODB_URI = "mongodb+srv://administrator-booking:mOqM183APIf4b9Rw@airportshuttletpa.wapwkji.mongodb.net/booking-admin?retryWrites=true&w=majority&appName=airportshuttletpa";

async function updateConfirmationFinalFinal() {
  try {
    console.log('🔗 Connecting to PRODUCTION database...');
    
    await mongoose.connect(PRODUCTION_MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas Production');

    // Get the existing template
    const existingTemplate = await EmailTemplate.findOne({ name: 'Confirmation Final' });
    if (!existingTemplate) {
      console.log('❌ Confirmation Final template not found');
      return;
    }

    console.log('📧 Updating template with final improvements...');

    // Update with final template
    existingTemplate.htmlContent = getFinalHTMLTemplate();
    existingTemplate.textContent = getFinalTextTemplate();
    
    await existingTemplate.save();
    console.log('✅ Final Confirmation Final template updated successfully');

    console.log('\n📧 Final Template Details:');
    console.log('   - Name: Confirmation Final');
    console.log('   - HTML Content: ' + getFinalHTMLTemplate().length + ' characters');
    console.log('   - Text Content: ' + getFinalTextTemplate().length + ' characters');

    // Verify the template was updated
    const verifyTemplate = await EmailTemplate.findOne({ name: 'Confirmation Final' });
    if (verifyTemplate) {
      console.log('\n✅ Verification successful: Final template updated');
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

function getFinalHTMLTemplate(): string {
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
            line-height: 1.4;
            color: #2c3e50;
            background: #f8f9fa;
            padding: 15px;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        /* Header Section */
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px 20px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 5px;
        }
        
        .header .subtitle {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .header .icon {
            font-size: 32px;
            margin-bottom: 10px;
        }
        
        /* Main Content */
        .content {
            padding: 25px 20px;
        }
        
        /* Confirmation Badge */
        .confirmation-badge {
            background: #28a745;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            display: inline-block;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        /* Greeting */
        .greeting {
            font-size: 18px;
            color: #2c3e50;
            margin-bottom: 15px;
            font-weight: 600;
        }
        
        .intro-text {
            font-size: 14px;
            color: #5a6c7d;
            margin-bottom: 25px;
            line-height: 1.5;
        }
        
        /* Booking Details Card - Compact */
        .booking-details {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
            border: 1px solid #e9ecef;
        }
        
        .booking-details h3 {
            color: #667eea;
            font-size: 18px;
            margin-bottom: 15px;
            font-weight: 700;
        }
        
        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }
        
        .detail-item {
            background: white;
            padding: 12px;
            border-radius: 6px;
            border-left: 3px solid #667eea;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .detail-label {
            font-weight: 600;
            color: #495057;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        
        .detail-value {
            color: #2c3e50;
            font-weight: 600;
            font-size: 14px;
        }
        
        .detail-value.highlight {
            color: #28a745;
            font-size: 16px;
            font-weight: 700;
        }
        
        /* Important Notice - Compact */
        .notice-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }
        
        .notice-section h4 {
            font-size: 16px;
            margin-bottom: 8px;
            font-weight: 700;
        }
        
        .notice-section p {
            font-size: 13px;
            opacity: 0.95;
            line-height: 1.4;
        }
        
        /* Contact Information - Better Aligned */
        .contact-section {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .contact-section h4 {
            color: #667eea;
            font-size: 16px;
            margin-bottom: 15px;
            font-weight: 700;
        }
        
        .contact-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
        }
        
        .contact-item {
            background: white;
            padding: 12px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .contact-icon {
            font-size: 18px;
            color: #667eea;
            width: 20px;
            text-align: center;
            flex-shrink: 0;
        }
        
        .contact-text {
            font-weight: 600;
            color: #2c3e50;
            font-size: 13px;
        }
        
        /* Special Instructions - Compact */
        .special-instructions {
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
        }
        
        .special-instructions h4 {
            color: #856404;
            font-size: 14px;
            margin-bottom: 8px;
            font-weight: 700;
        }
        
        .special-instructions p {
            color: #856404;
            font-weight: 500;
            font-size: 13px;
            line-height: 1.4;
        }
        
        /* Important Notes Section - More Compact */
        .important-notes {
            background: #e3f2fd;
            border: 1px solid #2196f3;
            border-radius: 8px;
            padding: 18px;
            margin: 20px 0;
        }
        
        .important-notes h4 {
            color: #1976d2;
            font-size: 16px;
            margin-bottom: 12px;
            font-weight: 700;
        }
        
        .important-notes ul {
            list-style: none;
            padding: 0;
        }
        
        .important-notes li {
            background: white;
            margin-bottom: 6px;
            padding: 10px;
            border-radius: 5px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border-left: 3px solid #2196f3;
        }
        
        .important-notes li strong {
            color: #1976d2;
            font-weight: 700;
            display: block;
            margin-bottom: 3px;
            font-size: 12px;
        }
        
        .important-notes li p {
            color: #424242;
            margin: 0;
            line-height: 1.3;
            font-size: 11px;
        }
        
        .important-notes .sub-item {
            margin-left: 12px;
            margin-top: 3px;
            color: #666;
            font-size: 10px;
        }
        
        /* Footer - Compact */
        .footer {
            background: #2c3e50;
            color: white;
            padding: 20px;
            text-align: center;
        }
        
        .footer h5 {
            font-size: 16px;
            margin-bottom: 8px;
            font-weight: 700;
        }
        
        .footer p {
            margin-bottom: 8px;
            font-size: 12px;
            opacity: 0.9;
        }
        
        .footer a {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
        }
        
        .footer-links {
            margin: 15px 0;
        }
        
        .footer-links a {
            margin: 0 8px;
            padding: 6px 12px;
            background: rgba(102, 126, 234, 0.2);
            border-radius: 15px;
            display: inline-block;
            font-size: 12px;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            
            .email-container {
                border-radius: 8px;
            }
            
            .header {
                padding: 20px 15px;
            }
            
            .header h1 {
                font-size: 20px;
            }
            
            .content {
                padding: 20px 15px;
            }
            
            .details-grid {
                grid-template-columns: 1fr;
                gap: 8px;
            }
            
            .contact-grid {
                grid-template-columns: 1fr;
            }
            
            .detail-item {
                padding: 10px;
            }
            
            .contact-item {
                padding: 10px;
            }
            
            .important-notes {
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="icon">🚗</div>
            <h1>Airport Shuttle TPA</h1>
            <p class="subtitle">Your trusted transportation partner</p>
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
                <p>Our professional driver will contact you 30 minutes before your scheduled pickup time.</p>
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
                        <div class="contact-text">Website: AirportShuttleTPA.com</div>
                    </div>
                </div>
            </div>
            
            {{#if specialInstructions}}
            <div class="special-instructions">
                <h4>📝 Special Instructions</h4>
                <p>{{specialInstructions}}</p>
            </div>
            {{/if}}
            
            <!-- Important Notes Section - More Compact -->
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
                <a href="https://AirportShuttleTPA.com">Visit our website</a>
                <a href="mailto:{{companyEmail}}">Contact us</a>
            </div>
        </div>
    </div>
</body>
</html>`;
}

function getFinalTextTemplate(): string {
  return `BOOKING CONFIRMATION - {{confirmationNumber}}

Dear {{customerName}},

Thank you for choosing Airport Shuttle TPA! Your booking has been confirmed and we're excited to serve you.

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
Our professional driver will contact you 30 minutes before your scheduled pickup time.

CONTACT INFORMATION:
===================
Phone: {{companyPhone}}
Email: {{companyEmail}}
Website: AirportShuttleTPA.com

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
The Airport Shuttle TPA Team`;
}

// Run the script
updateConfirmationFinalFinal();
