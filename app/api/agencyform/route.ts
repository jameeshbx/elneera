import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import nodemailer from "nodemailer"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { existsSync } from "fs"
import { AgencyType, PanType } from "@prisma/client"

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

// File upload helper
async function saveFile(file: File, directory: string): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  
  const uploadDir = path.join(process.cwd(), "public", "uploads", directory)
  
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }
  
  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
  const filePath = path.join(uploadDir, fileName)
  
  await writeFile(filePath, buffer)
  
  return `/uploads/${directory}/${fileName}`
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const isAuthorized = user.userType === "AGENCY" || user.role === "ADMIN" || user.role === "SUPER_ADMIN"

    if (!isAuthorized) {
      return NextResponse.json(
        { error: `Access denied. User type: ${user.userType}, Role: ${user.role}` },
        { status: 403 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    
    // Extract and validate required fields
    const contactPerson = formData.get("contactPerson")?.toString()
    const agencyTypeString = formData.get("agencyType")?.toString()
    const designation = formData.get("designation")?.toString()
    const phoneCountryCode = formData.get("phoneCountryCode")?.toString() || "+91"
    const phoneNumber = formData.get("phoneNumber")?.toString()
    const ownerName = formData.get("ownerName")?.toString()
    const email = formData.get("email")?.toString()
    const companyPhoneCode = formData.get("companyPhoneCode")?.toString() || "+91"
    const companyPhone = formData.get("companyPhone")?.toString()
    const website = formData.get("website")?.toString()
    const landingPageColor = formData.get("landingPageColor")?.toString() || "#4ECDC4"
    const gstRegistered = formData.get("gstRegistered") === "true"
    const gstNumber = formData.get("gstNumber")?.toString()
    const yearOfRegistration = formData.get("yearOfRegistration")?.toString()
    const panNumber = formData.get("panNumber")?.toString()
    const panTypeString = formData.get("panType")?.toString()
    const headquarters = formData.get("headquarters")?.toString()
    const country = formData.get("country")?.toString() || "INDIA"
    const yearsOfOperation = formData.get("yearsOfOperation")?.toString()

    // Validate and convert enum values
    const agencyType = agencyTypeString as AgencyType
    const panType = panTypeString as PanType

    // Validate enum values
    if (!Object.values(AgencyType).includes(agencyType)) {
      return NextResponse.json(
        { error: "Invalid agency type" },
        { status: 400 }
      )
    }

    if (!Object.values(PanType).includes(panType)) {
      return NextResponse.json(
        { error: "Invalid PAN type" },
        { status: 400 }
      )
    }

    // Handle file uploads
    const logoFile = formData.get("logo") as File
    const businessLicenseFile = formData.get("businessLicense") as File

    if (!contactPerson || !agencyType || !designation || !phoneNumber || 
        !ownerName || !email || !companyPhone || !website || 
        !yearOfRegistration || !panNumber || !panType || !headquarters || 
        !yearsOfOperation || !logoFile || !businessLicenseFile) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    let logoPath = ""
    let businessLicensePath = ""

    try {
      // Save files directly to paths instead of creating File records
      logoPath = await saveFile(logoFile, "logos")
      businessLicensePath = await saveFile(businessLicenseFile, "licenses")

    } catch (uploadError) {
      console.error("File upload error:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload files" },
        { status: 500 }
      )
    }

    // Check if agency form already exists for this user
    const existingForm = await prisma.agencyForm.findFirst({
      where: { createdBy: user.id }
    })

    let agencyForm
    if (existingForm) {
      // Update existing form
      agencyForm = await prisma.agencyForm.update({
        where: { id: existingForm.id },
        data: {
          name: ownerName,
          contactPerson,
          agencyType,
          designation,
          phoneCountryCode,
          phoneNumber,
          ownerName,
          email,
          companyPhoneCode,
          companyPhone,
          website,
          landingPageColor,
          gstRegistered,
          gstNumber: gstRegistered ? gstNumber : null,
          yearOfRegistration,
          panNumber,
          panType,
          headquarters,
          country,
          yearsOfOperation,
          logoPath, // Use logoPath instead of logoId
          businessLicensePath, // Use businessLicensePath instead of businessLicenseId
          updatedAt: new Date(),
        }
      })
    } else {
      // Create new form
      agencyForm = await prisma.agencyForm.create({
        data: {
          name: ownerName,
          contactPerson,
          agencyType,
          designation,
          phoneCountryCode,
          phoneNumber,
          ownerName,
          email,
          companyPhoneCode,
          companyPhone,
          website,
          landingPageColor,
          gstRegistered,
          gstNumber: gstRegistered ? gstNumber : null,
          yearOfRegistration,
          panNumber,
          panType,
          headquarters,
          country,
          yearsOfOperation,
          logoPath, // Use logoPath instead of logoId
          businessLicensePath, // Use businessLicensePath instead of businessLicenseId
          createdBy: user.id,
        }
      })
    }

    // Send email notification to admin
    try {
      const emailHTML = `
        <h2>New Agency Registration</h2>
        <p><strong>User:</strong> ${user.name || user.email}</p>
        <p><strong>Contact Person:</strong> ${contactPerson}</p>
        <p><strong>Company:</strong> ${ownerName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${companyPhoneCode} ${companyPhone}</p>
        <p><strong>Agency Type:</strong> ${agencyType}</p>
        <p><strong>Website:</strong> ${website}</p>
        <p><strong>GST Registered:</strong> ${gstRegistered ? "Yes" : "No"}</p>
        ${gstRegistered && gstNumber ? `<p><strong>GST Number:</strong> ${gstNumber}</p>` : ""}
        <p><strong>PAN Number:</strong> ${panNumber}</p>
        <p><strong>Headquarters:</strong> ${headquarters}</p>
        <p><strong>Years of Operation:</strong> ${yearsOfOperation}</p>
        <p><strong>Registration Time:</strong> ${new Date().toLocaleString()}</p>
      `

      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: "amrutha@buyexchange.in",
        subject: `New Agency Registration - ${ownerName}`,
        html: emailHTML,
      })
    } catch (emailError) {
      console.error("Email sending error:", emailError)
      // Don't fail the request if email fails
    }

    // Send email notification to anusree@buyexchange.in
    const emailHtml = `
      <h2>New Agency Form Submission</h2>
      <p>A new agency form has been submitted with the following details:</p>
      <ul>
        <li><strong>Agency Name:</strong> ${agencyForm.name}</li>
        <li><strong>Contact Person:</strong> ${agencyForm.contactPerson}</li>
        <li><strong>Email:</strong> ${agencyForm.email}</li>
        <li><strong>Phone:</strong> ${agencyForm.phoneCountryCode} ${agencyForm.phoneNumber}</li>
        <li><strong>Agency Type:</strong> ${agencyForm.agencyType}</li>
        <li><strong>Website:</strong> ${agencyForm.website}</li>
        <li><strong>Submitted On:</strong> ${new Date().toLocaleString()}</li>
      </ul>
      <p>Please review the submission in the admin panel.</p>
    `;

    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: 'anusree@buyexchange.in',
        subject: `New Agency Submission: ${agencyForm.name}`,
        html: emailHtml
      });
      console.log('Notification email sent to anusree@buyexchange.in');
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
      // Don't fail the request if email sending fails
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Agency form submitted successfully",
      data: {
        id: agencyForm.id,
        name: agencyForm.name,
        contactPerson: agencyForm.contactPerson,
        agencyType: agencyForm.agencyType,
        email: agencyForm.email,
        logoUrl: agencyForm.logoPath,
        businessLicenseUrl: agencyForm.businessLicensePath,
      }
    })

  } catch (error) {
    console.error("Agency form submission error:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}