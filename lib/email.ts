// lib/email.ts
import nodemailer from "nodemailer";
import fs from "fs";

export interface EmailAttachment {
  filename: string;
  path: string;
  contentType?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

interface EmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}
interface TransporterConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  tls: { 
    rejectUnauthorized: boolean;
  };
  connectionTimeout: number;
  greetingTimeout: number;
  socketTimeout: number;
  service?: string; // Optional for Gmail
}


// Enhanced transporter creation with better Gmail support
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS; // Support both variable names
  const port = parseInt(process.env.SMTP_PORT || "587");
  const secure = process.env.SMTP_SECURE === "true";
  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM;

  console.log('SMTP Configuration:', {
    host,
    user: user ? user.substring(0, 3) + '***' + user.slice(-10) : 'undefined',
    pass: pass ? '***' : 'undefined',
    port,
    secure,
    from
  });

  if (!host || !user || !pass) {
    throw new Error(`SMTP configuration missing. Check SMTP_HOST (${host ? 'OK' : 'MISSING'}), SMTP_USER (${user ? 'OK' : 'MISSING'}), SMTP_PASS (${pass ? 'OK' : 'MISSING'})`);
  }

  const config: TransporterConfig  = {
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: { 
      rejectUnauthorized: false 
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  };

  // Special handling for Gmail
  if (host.includes('gmail.com')) {
    config.service = 'gmail';
    console.log('Gmail detected - ensure you are using an App Password');
  }

  return nodemailer.createTransport(config);
};

// Enhanced email sending function with retry mechanism
export async function sendEmail({ to, subject, html, attachments }: EmailOptions): Promise<EmailResult> {
  let lastError = null;
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      console.log(`Email attempt ${attempts + 1} to:`, to);
      
      const transporter = createTransporter();
      
      // Verify transporter
      await transporter.verify();
      console.log('Email transporter verified successfully');

      // Validate email address
      if (!to || !to.includes('@')) {
        return {
          success: false,
          error: 'Invalid email address',
        };
      }

      // Check attachments
      const processedAttachments = [];
      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          if (att.path && !fs.existsSync(att.path)) {
            console.warn(`Attachment file not found: ${att.path}`);
            // Continue without this attachment instead of failing
            continue;
          }
          processedAttachments.push(att);
        }
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.EMAIL_FROM || 'Travel Team <noreply@travel-agency.com>',
        to,
        subject,
        html,
        attachments: processedAttachments.length > 0 ? processedAttachments : undefined,
      };

      const info = await transporter.sendMail(mailOptions);
      
      console.log('Email sent successfully:', {
        messageId: info.messageId,
        to,
        subject,
        attachmentCount: processedAttachments.length
      });

      transporter.close();
      
      return { 
        success: true, 
        messageId: info.messageId 
      };

    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      attempts++;
      
      console.error(`Email attempt ${attempts} failed:`, lastError);
      
      if (attempts < maxAttempts) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }
  }

  console.error('All email attempts failed:', lastError);
  return { 
    success: false, 
    error: lastError || undefined,
    messageId: undefined 
  };
}

// Test email function for debugging
export async function testEmailConnection(): Promise<EmailResult> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    transporter.close();
    console.log('Email connection test: SUCCESS');
    return { success: true, messageId: 'test-connection-success' };
  } catch (error) {
    console.error('Email connection test: FAILED', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Development email service for testing
export const sendTestEmail = async (options: EmailOptions): Promise<EmailResult> => {
  console.log('TEST EMAIL MODE - Email would be sent with:', {
    to: options.to,
    subject: options.subject,
    hasAttachments: !!options.attachments?.length,
    attachmentCount: options.attachments?.length || 0,
  });
  
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Always succeed in test mode
  return {
    success: true,
    messageId: `test-message-${Date.now()}`,
  };
};

// Use this in development if you don't have email configured
export const sendEmailDev = process.env.NODE_ENV === 'development' && process.env.USE_TEST_EMAIL === 'true' 
  ? sendTestEmail 
  : sendEmail;