import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { dmcPaymentNotificationTemplate } from "@/lib/email-templates"

export async function POST(req: NextRequest) {
  try {
    console.log("Received email request")

    // Parse the form data
    const formData = await req.formData()
    const to = formData.get("to") as string
    const subject = formData.get("subject") as string
    const paymentDetailsStr = formData.get("paymentDetails") as string
    const fileData = formData.get("file") as unknown as File | null

    console.log("Form data received:", { to, subject, hasFile: !!fileData })

    if (!to || !subject || !paymentDetailsStr) {
      console.error("Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Parse payment details
    let paymentDetails
    try {
      paymentDetails = JSON.parse(paymentDetailsStr)
      console.log("Parsed payment details:", paymentDetails)
    } catch (e) {
      console.error("Error parsing payment details:", e)
      return NextResponse.json({ error: "Invalid payment details format" }, { status: 400 })
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error("Email server configuration is missing")
      return NextResponse.json(
        {
          error:
            "Email server configuration is missing. Please set SMTP_USER and SMTP_PASSWORD environment variables.",
        },
        { status: 500 },
      )
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === "production",
      },
    })

    try {
      await transporter.verify()
      console.log("Email transporter verified successfully")
    } catch (verifyError) {
      console.error("Email transporter verification failed:", verifyError)
      return NextResponse.json(
        {
          error: "Email server configuration is invalid",
          details: verifyError instanceof Error ? verifyError.message : "Unknown error",
        },
        { status: 500 },
      )
    }

    // Prepare email template data with proper defaults
    const templateData = {
      dmcName: paymentDetails.dmcName || 'N/A',
      itineraryReference: paymentDetails.itineraryReference || 'N/A',
      enquiryId: paymentDetails.enquiryId || 'N/A',
      totalCost: paymentDetails.totalCost || 0,
      amountPaid: paymentDetails.amountPaid || 0,
      paymentDate: paymentDetails.paymentDate ? new Date(paymentDetails.paymentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      remainingBalance: paymentDetails.remainingBalance || 0,
      paymentStatus: paymentDetails.paymentStatus || 'PENDING',
      paymentChannel: paymentDetails.paymentChannel || 'N/A',
      transactionId: paymentDetails.transactionId || 'N/A',
      currency: paymentDetails.currency || 'USD',
      upiId: (paymentDetails.paymentChannel === 'UPI' && paymentDetails.upiId) ? paymentDetails.upiId : undefined,
    }

    console.log("Sending email with template data:", templateData)

    // Prepare email options
    const mailOptions: nodemailer.SendMailOptions = {
      from: `${process.env.SMTP_FROM || "Trekking B2B"} <${process.env.SMTP_USER || process.env.SMTP_USER}>`,
      to,
      subject,
      html: dmcPaymentNotificationTemplate(templateData),
    }

    if (fileData && fileData.size > 0) {
      try {
        console.log("Processing file attachment:", fileData.name, fileData.size, "bytes")
        const bytes = await fileData.arrayBuffer()
        const buffer = Buffer.from(bytes)

        mailOptions.attachments = [
          {
            filename: fileData.name || "receipt.pdf",
            content: buffer,
            contentType: fileData.type || "application/octet-stream",
          },
        ]
        console.log("File attachment added to email successfully")
      } catch (fileError) {
        console.error("Error processing file attachment:", fileError)
        return NextResponse.json(
          {
            error: "Failed to process file attachment",
            details: fileError instanceof Error ? fileError.message : "Unknown file error",
          },
          { status: 400 },
        )
      }
    }

    // Send email
    console.log("Sending email...")
    const info = await transporter.sendMail(mailOptions)
    console.log("Email sent successfully:", info.messageId)

    return NextResponse.json(
      {
        message: "Email sent successfully",
        messageId: info.messageId,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error sending email:", error)

    let errorMessage = "Unknown error occurred while sending email"
    let errorDetails = ""

    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = error.stack || ""

      // Handle specific nodemailer errors
      if (error.message.includes("Invalid login")) {
        errorMessage = "Email authentication failed. Please check EMAIL_SERVER_USER and EMAIL_SERVER_PASSWORD."
      } else if (error.message.includes("ECONNREFUSED")) {
        errorMessage = "Cannot connect to email server. Please check EMAIL_SERVER_HOST and EMAIL_SERVER_PORT."
      }
    }

    console.error("Error details:", {
      message: errorMessage,
      stack: errorDetails,
    })

    return NextResponse.json(
      {
        error: "Failed to send email",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}