import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number.parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export interface EmailOptions {
  to: string
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    path: string
  }>
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("Email credentials not configured")
      return false
    }

    const mailOptions = {
      from: process.env.SMTP_USER,
      ...options,
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error("Error sending email:", error)
    return false
  }
}
