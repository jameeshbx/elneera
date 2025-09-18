import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { feedbackFormEmailTemplate } from "@/lib/feedbackFormEmail";

export async function POST(req: NextRequest) {
  try {
    const { customerName, customerEmail, enquiryId } = await req.json();

    if (!customerName || !customerEmail || !enquiryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Debug environment variables
    console.log("SMTP Config:", {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      from: process.env.SMTP_FROM,
      hasPassword: !!process.env.SMTP_PASSWORD
    });

    const feedbackLink = `${process.env.NEXT_PUBLIC_APP_URL}/feedback?enquiryId=${enquiryId}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Test connection
    await transporter.verify();

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: customerEmail,
      subject: "We Value Your Feedback",
      html: feedbackFormEmailTemplate(customerName, feedbackLink),
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, feedbackLink });
  } catch (error) {
    console.error("Error sending feedback email:", error);
    return NextResponse.json({ 
      error: "Failed to send email", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}