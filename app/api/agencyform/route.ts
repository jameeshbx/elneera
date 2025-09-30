import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import nodemailer from "nodemailer"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { existsSync } from "fs"
import { agencyApprovalEmailTemplate } from "@/lib/email-templates"
// Define enum values as string literals (fallback if Prisma enums don't exist)
const AGENCY_TYPES = [
  'PRIVATE_LIMITED', 'PROPRIETORSHIP', 'PARTNERSHIP', 'PUBLIC_LIMITED', 'LLP',
  'TOUR_OPERATOR', 'TRAVEL_AGENT', 'DMC', 'OTHER', 'ONLINE_TRAVEL_AGENCY',
  'CORPORATE_TRAVEL', 'ADVENTURE_TRAVEL', 'LUXURY_TRAVEL', 'BUDGET_TRAVEL', 'SPECIALIZED_TRAVEL'
] as const;

type AgencyType = typeof AGENCY_TYPES[number];

const PAN_TYPES = [
  'INDIVIDUAL', 'COMPANY', 'TRUST', 'OTHER', 'ASSOCIATION', 'HUF', 'GOVERNMENT'
] as const;

type PanType = typeof PAN_TYPES[number];



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

// Helper function to validate enum values
function isValidAgencyType(value: string): value is AgencyType {
  return AGENCY_TYPES.includes(value as AgencyType)
}

function isValidPanType(value: string): value is PanType {
  return PAN_TYPES.includes(value as PanType)
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find agency form for this user
    const agencyForm = await prisma.agencyForm.findFirst({
      where: { 
        OR: [
          { createdBy: user.id },  // Check createdBy
          { agencyId: user.id }    // Check agencyId
        ]
      },
      select: {
        id: true,
        name: true,
        contactPerson: true,
        email: true,
        status: true,
        // Add other fields you need
      },
    });

    if (!agencyForm) {
      return NextResponse.json({ data: null }, { status: 200 });
    }

    return NextResponse.json({ data: agencyForm }, { status: 200 });
  } catch (error) {
    console.error("Error fetching agency form:", error);
    return NextResponse.json(
      { error: "Failed to fetch agency form" },
      { status: 500 }
    );
  }
}

// PUT endpoint for updating agency status
// This is the old endpoint at /api/agencyform
// Keeping it for backward compatibility
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow admin users to update status
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, status } = await request.json();

    if (!id || !['ACTIVE', 'INACTIVE'].includes(status)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const updatedAgency = await prisma.agencyForm.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
      },
    });

    // If status is ACTIVE, create an Agency record if it doesn't exist
    if (status === 'ACTIVE') {
      const agency = await prisma.agency.findFirst({
        where: { name: updatedAgency.name }
      });

      if (!agency) {
        await prisma.agency.create({
          data: {
            name: updatedAgency.name,
            config: {},
            createdBy: user.id,
          },
        });
      }
    }

    return NextResponse.json({ success: true, data: updatedAgency });
  } catch (error) {
    console.error("Error updating agency status:", error);
    return NextResponse.json(
      { error: "Failed to update agency status" },
      { status: 500 }
    );
  }
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

    const isAuthorized = user.userType === "AGENCY_ADMIN" || user.role === "ADMIN" || user.role === "SUPER_ADMIN"

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

    // Validate and convert enum values using Prisma types
    if (!agencyTypeString || !isValidAgencyType(agencyTypeString)) {
      return NextResponse.json(
        { error: `Invalid agency type. Received: ${agencyTypeString}` },
        { status: 400 }
      );
    }
    const agencyType = agencyTypeString;

    if (!panTypeString || !isValidPanType(panTypeString)) {
      return NextResponse.json(
        { error: `Invalid PAN type. Received: ${panTypeString}` },
        { status: 400 }
      );
    }
    const panType = panTypeString;

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
          logoPath,
          businessLicensePath,
          agencyId: user.id,
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
          logoPath,
          businessLicensePath,
          agencyId: user.id,
          createdBy: user.id,
        }
      })
    }

    // Generate email HTML using the template with all agency details
    const emailHTML = agencyApprovalEmailTemplate({
      agencyId: agencyForm.id,
      agencyName: ownerName,
      contactPerson: contactPerson,
      email: email,
      phoneNumber: `${companyPhoneCode} ${companyPhone}`,
      agencyType: agencyType,
      website: website,
      gstNumber: gstRegistered ? gstNumber : undefined,
      panNumber: panNumber || 'Not provided',
      headquarters: headquarters,
      registrationDate: new Date().toISOString(),
      status: 'PENDING'
    });

    // Send email notification to admin and other recipients
    try {
      // Array of email recipients
      const recipients = [
        process.env.ADMIN_EMAIL,
        'anand@buyexchange.in',
        'amrutha@buyexchange.in'
      ];

      // Send email to each recipient
      await Promise.all(recipients.map(recipient => 
        transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: recipient,
          subject: `New Agency Registration - ${ownerName}`,
          html: emailHTML,
        })
      ));
    } catch (emailError) {
      console.error("Email sending error:", emailError)
      // Don't fail the request if email fails
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