import { type NextRequest, NextResponse } from "next/server"
import nodemailer from 'nodemailer'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id") // This should be agencyId

    if (!id) {
      return NextResponse.json({ error: "Agency ID is required" }, { status: 400 })
    }

    const bankDetailsResponse = await fetch(`${request.nextUrl.origin}/api/auth/add-bank-details?agencyId=${id}`)

    if (!bankDetailsResponse.ok) {
      throw new Error("Failed to fetch bank details from add-bank-details API")
    }

    const bankDetailsData = await bankDetailsResponse.json()

    const customerPaymentData = {
      success: true,
      data: {
        // Bank details from agency-payment-method table
        bankAccounts: bankDetailsData.paymentMethod?.bank || [],
        upiProvider: bankDetailsData.paymentMethod?.upiProvider || "",
        identifier: bankDetailsData.paymentMethod?.identifier || "",
        paymentLink: bankDetailsData.paymentMethod?.paymentLink || "",
        qrCode: bankDetailsData.paymentMethod?.qrCode || null,
        // Additional customer payment specific data can be added here
        agencyId: id,
      },
    }

    return NextResponse.json(customerPaymentData)
  } catch (error) {
    console.error("Error fetching customer payments:", error)
    return NextResponse.json({ error: "Failed to fetch customer payments" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // This would typically involve saving to a customer_payment table
    console.log("Saving customer payment data:", body)

    return NextResponse.json({
      success: true,
      message: "Customer payment updated successfully",
    })
  } catch (error) {
    console.error("Error updating customer payment:", error)
    return NextResponse.json({ error: "Failed to update customer payment" }, { status: 500 })
  }
}

// Add email sending functionality to the same route
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    console.log("Received email request:", body);

    // Validate required fields
    if (!body.to || !body.subject || !body.html) {
      console.error("Missing required fields:", body);
      return NextResponse.json(
        { 
          success: false,
          error: "Missing required fields: to, subject, or html",
          received: body
        },
        { status: 400 }
      );
    }

    const { to, subject, html } = body;

    // Create transporter using environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log("SMTP connection verified");
    } catch (error) {
      console.error("SMTP connection failed:", error);
      return NextResponse.json(
        { 
          success: false,
          error: "SMTP configuration error",
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }

    // Send mail
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });

    console.log("Email sent successfully:", info.messageId);

    return NextResponse.json({ 
      success: true,
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}