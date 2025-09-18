// lib/dmc-email.ts - Updated to use your existing SMTP configuration
import nodemailer from 'nodemailer'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface EmailAttachment {
  filename: string
  path: string
  contentType: string
}

interface EmailOptions {
  to: string
  cc?: string
  bcc?: string
  subject: string
  html: string
  attachments?: EmailAttachment[]
}

interface EmailResult {
  sent: boolean
  success: boolean
  messageId?: string
  error?: string
}

// Fixed transporter creation using your existing env variables
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  console.log('SMTP Configuration:', {
    host,
    user: user ? '***' + user.slice(-10) : 'undefined',
    pass: pass ? '***' : 'undefined',
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE
  });

  if (!host || !user || !pass) {
    throw new Error(`SMTP configuration missing. Check SMTP_HOST (${host ? 'OK' : 'MISSING'}), SMTP_USER (${user ? 'OK' : 'MISSING'}), SMTP_PASS (${pass ? 'OK' : 'MISSING'})`);
  }

  return nodemailer.createTransport({
    host: host,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: user,
      pass: pass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = createTransporter()
  }

  // Generic send email method with better error handling
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      console.log(`Attempting to send email to: ${options.to}`);
      
      // Verify transporter configuration
      await this.transporter.verify();
      console.log('SMTP connection verified successfully');

      const from = process.env.SMTP_FROM || process.env.SMTP_USER;

      const mailOptions = {
        from: `"Travel Agency" <${from}>`,
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments,
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log("Email sent successfully:", result.messageId);

      return {
        sent: true,
        success: true,
        messageId: result.messageId,
      }
    } catch (error) {
      console.error('Error sending email:', error)
      
      // Better error messages for common Gmail issues
      if (error instanceof Error) {
        if (error.message.includes('Invalid login')) {
          return {
            sent: false,
            success: false,
            error: 'Gmail authentication failed. Please check if you are using an App Password instead of your regular password.'
          }
        }
        if (error.message.includes('Connection timeout')) {
          return {
            sent: false,
            success: false,
            error: 'SMTP connection timeout. Please check your network connection and SMTP settings.'
          }
        }
        if (error.message.includes('ENOTFOUND')) {
          return {
            sent: false,
            success: false,
            error: 'SMTP host not found. Please verify your SMTP_HOST setting.'
          }
        }
      }
      
      return {
        sent: false,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error',
      }
    }
  }

  // Send itinerary to DMC - Email 1
  async sendItineraryToDMC(
    dmcEmail: string,
    dmcName: string,
    enquiryId: string,
    customerName: string,
    destinations: string,
    pdfPath?: string
  ): Promise<EmailResult> {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4ECDC4; }
        .cta-button { background: #4ECDC4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; margin: 20px 0; }
        .footer { background: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
        .highlight { background: #e8f5f4; padding: 15px; border-radius: 6px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌍 New Itinerary Request</h1>
            <p>Opportunity for Partnership</p>
        </div>
        
        <div class="content">
            <p>Dear <strong>${dmcName}</strong>,</p>
            
            <p>We hope this email finds you well. We have an exciting travel request that matches your expertise and would love to partner with you.</p>
            
            <div class="info-box">
                <h3>📋 Request Details</h3>
                <p><strong>Enquiry ID:</strong> ${enquiryId}</p>
                <p><strong>Customer:</strong> ${customerName}</p>
                <p><strong>Destinations:</strong> ${destinations}</p>
                <p><strong>Date Generated:</strong> ${new Date().toLocaleDateString()}</p>
            </div>

            <div class="highlight">
                <h4>📎 What's Attached?</h4>
                <p>Please find the detailed itinerary document attached to this email containing:</p>
                <ul>
                    <li>Complete travel requirements</li>
                    <li>Customer preferences and budget</li>
                    <li>Specific destination details</li>
                    <li>Timeline expectations</li>
                </ul>
            </div>

            <div class="info-box">
                <h4>🎯 Next Steps</h4>
                <ol>
                    <li><strong>Review</strong> the attached itinerary carefully</li>
                    <li><strong>Prepare</strong> your detailed quotation</li>
                    <li><strong>Submit</strong> your competitive quote within 48 hours</li>
                </ol>
            </div>

            <p>We value our partnership and look forward to your competitive quotation. Your expertise in <strong>${destinations}</strong> makes you an ideal partner for this request.</p>
            
            <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dmc/quote-response?enquiryId=${enquiryId}" class="cta-button">Submit Your Quote</a>
            </div>
        </div>
        
        <div class="footer">
            <h4>📞 Need Assistance?</h4>
            <p>If you have any questions about this request, please don't hesitate to contact our team.</p>
            <p><strong>Best regards,</strong><br>Your Travel Partnership Team</p>
        </div>
    </div>
</body>
</html>`

    return this.sendEmail({
      to: dmcEmail,
      subject: `🌍 New Itinerary Request - ${enquiryId} | ${destinations}`,
      html,
      attachments: pdfPath
        ? [
            {
              filename: `itinerary-${enquiryId}.pdf`,
              path: pdfPath,
              contentType: 'application/pdf',
            },
          ]
        : undefined,
    })
  }

  // Send quote to customer - Email 2
  async sendQuoteToCustomer(
    customerEmail: string,
    customerName: string,
    enquiryId: string,
    destinations: string,
    totalPrice: number,
    currency: string = 'USD',
    pdfPath?: string
  ): Promise<EmailResult> {
    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
        .price-highlight { font-size: 2.5em; font-weight: bold; margin: 20px 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .content { background: #f9f9f9; padding: 30px; }
        .trip-summary { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .price-box { background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .cta-button { background: #e74c3c; color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; display: inline-block; margin: 20px 0; font-weight: bold; box-shadow: 0 4px 15px rgba(231, 76, 60, 0.4); }
        .footer { background: #2c3e50; color: white; padding: 25px; text-align: center; border-radius: 0 0 10px 10px; }
        .highlight { background: #fff3cd; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid 'ffc107'; }
        .feature-list { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .feature-item { background: white; padding: 15px; border-radius: 6px; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Your Dream Trip Quote is Ready!</h1>
            <div class="price-highlight">${currency} ${totalPrice}</div>
            <p>Customized exclusively for you</p>
        </div>
        
        <div class="content">
            <p>Dear <strong>${customerName}</strong>,</p>
            
            <p>We're thrilled to share your personalized travel quote! Our team has carefully crafted an amazing experience for your journey to <strong>${destinations}</strong>.</p>
            
            <div class="trip-summary">
                <h3>🗺️ Your Trip Summary</h3>
                <div class="feature-list">
                    <div class="feature-item">
                        <h4>🏨 Accommodation</h4>
                        <p>Premium hotels selected for comfort</p>
                    </div>
                    <div class="feature-item">
                        <h4>🚗 Transportation</h4>
                        <p>Convenient and comfortable transfers</p>
                    </div>
                    <div class="feature-item">
                        <h4>🎯 Activities</h4>
                        <p>Exciting experiences and tours</p>
                    </div>
                    <div class="feature-item">
                        <h4>🍽️ Dining</h4>
                        <p>Carefully selected meal arrangements</p>
                    </div>
                </div>
            </div>

            <div class="price-box">
                <h3>💰 Total Package Price</h3>
                <div style="font-size: 2em; margin: 10px 0;">${currency} ${totalPrice}</div>
                <p>✅ All-inclusive | 🕐 Valid until ${validUntil}</p>
            </div>

            <div class="highlight">
                <h4>📎 What's Included in Your Quote?</h4>
                <p>Your detailed quote document (attached) contains:</p>
                <ul>
                    <li>Complete day-by-day itinerary</li>
                    <li>Accommodation details and amenities</li>
                    <li>Transportation arrangements</li>
                    <li>Activity descriptions and inclusions</li>
                    <li>Terms and conditions</li>
                </ul>
            </div>

            <div style="text-align: center;">
                <p><strong>Ready to make memories?</strong></p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/customer/booking?enquiryId=${enquiryId}" class="cta-button">🚀 Book This Trip Now</a>
                <p style="margin: 20px 0; color: #666;">or call us to discuss your options</p>
            </div>

            <div class="highlight">
                <h4>⚡ Limited Time Offer</h4>
                <p>This quote is valid until <strong>${validUntil}</strong>. Book now to secure your dream vacation at this amazing price!</p>
            </div>
        </div>
        
        <div class="footer">
            <h4>🤝 Why Choose Us?</h4>
            <p>✓ 24/7 Support | ✓ Best Price Guarantee | ✓ Instant Booking</p>
            <p><strong>Questions? We're here to help!</strong><br>
            Contact our travel experts for personalized assistance.</p>
            <p><em>Enquiry ID: ${enquiryId}</em></p>
        </div>
    </div>
</body>
</html>`

    return this.sendEmail({
      to: customerEmail,
      subject: `🌟 Your ${destinations} Travel Quote - ${currency} ${totalPrice} | Valid Until ${validUntil}`,
      html,
      attachments: pdfPath
        ? [
            {
              filename: `travel-quote-${enquiryId}.pdf`,
              path: pdfPath,
              contentType: 'application/pdf',
            },
          ]
        : undefined,
    })
  }

  // Log email activity
  async logEmailActivity(
    sharedCustomerPdfId: string,
    recipientEmail: string,
    recipientName: string,
    subject: string,
    emailType: 'ITINERARY_SHARE' | 'CANCELLATION_NOTICE' | 'POLICY_UPDATE' | 'REMINDER',
    status: 'PENDING' | 'SENT' | 'DELIVERED' | 'OPENED' | 'FAILED' | 'BOUNCED',
    errorMessage?: string
  ) {
    try {
      await prisma.emailLog.create({
        data: {
          sharedCustomerPdfId,
          recipientEmail,
          recipientName,
          subject,
          emailType,
          status,
          sentAt: status === 'SENT' ? new Date() : null,
          errorMessage,
        },
      })
    } catch (error) {
      console.error('Error logging email activity:', error)
    }
  }

  // Send booking confirmation
  async sendBookingConfirmation(
    customerEmail: string,
    customerName: string,
    enquiryId: string
  ): Promise<EmailResult> {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #27ae60 0%, '2ecc71' 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; }
        .confirmation-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        .booking-id { font-size: 2em; font-weight: bold; color: #27ae60; margin: 15px 0; }
        .footer { background: #2c3e50; color: white; padding: 25px; text-align: center; border-radius: 0 0 10px 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎊 Booking Confirmed!</h1>
            <p>Your adventure awaits</p>
        </div>
        
        <div class="content">
            <p>Dear <strong>${customerName}</strong>,</p>
            
            <div class="confirmation-box">
                <h3>✅ Your booking is confirmed!</h3>
                <div class="booking-id">#${enquiryId}</div>
                <p>Keep this confirmation number for your records</p>
            </div>
            
            <p>We're excited to help you create unforgettable memories. You'll receive detailed information about your trip soon.</p>
        </div>
        
        <div class="footer">
            <p><strong>Thank you for choosing us!</strong><br>Your Travel Team</p>
        </div>
    </div>
</body>
</html>`

    return this.sendEmail({
      to: customerEmail,
      subject: `🎉 Booking Confirmed - ${enquiryId} | Your Trip is Secured!`,
      html,
    })
  }

  // Send payment reminder to DMC
  async sendPaymentReminderToDMC(
    dmcEmail: string,
    dmcName: string,
    enquiryId: string,
    amount: number,
    dueDate: string
  ): Promise<EmailResult> {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; }
        .payment-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f39c12; }
        .amount { font-size: 2em; font-weight: bold; color: #e67e22; text-align: center; margin: 15px 0; }
        .footer { background: #2c3e50; color: white; padding: 25px; text-align: center; border-radius: 0 0 10px 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💰 Payment Due</h1>
            <p>Booking: ${enquiryId}</p>
        </div>
        
        <div class="content">
            <p>Dear <strong>${dmcName}</strong>,</p>
            
            <div class="payment-box">
                <h3>Payment Details</h3>
                <div class="amount">$${amount}</div>
                <p><strong>Due Date:</strong> ${dueDate}</p>
                <p><strong>Booking Reference:</strong> ${enquiryId}</p>
            </div>
            
            <p>Please process the payment by the due date to avoid any service interruptions.</p>
        </div>
        
        <div class="footer">
            <p>Questions? Contact our finance team.<br><strong>Travel Partnership Team</strong></p>
        </div>
    </div>
</body>
</html>`

    return this.sendEmail({
      to: dmcEmail,
      subject: `💰 Payment Due - $${amount} | Booking ${enquiryId}`,
      html,
    })
  }
}

// Export singleton instance
export const emailService = new EmailService()

// Export individual functions for direct use
export const sendEmail = (options: EmailOptions) => emailService.sendEmail(options)

// Export additional utility functions
export const sendItineraryToDMC = (
  dmcEmail: string,
  dmcName: string,
  enquiryId: string,
  customerName: string,
  destinations: string,
  pdfPath?: string
) => emailService.sendItineraryToDMC(dmcEmail, dmcName, enquiryId, customerName, destinations, pdfPath)

export const sendQuoteToCustomer = (
  customerEmail: string,
  customerName: string,
  enquiryId: string,
  destinations: string,
  totalPrice: number,
  currency?: string,
  pdfPath?: string
) => emailService.sendQuoteToCustomer(customerEmail, customerName, enquiryId, destinations, totalPrice, currency, pdfPath)

// Export types for use in other modules
export type { EmailOptions, EmailResult, EmailAttachment }