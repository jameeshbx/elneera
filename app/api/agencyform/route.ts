import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import nodemailer from "nodemailer"
import { agencyApprovalEmailTemplate } from "@/lib/email-templates"
import { PrismaClient } from '@prisma/client';
import { S3Service } from "@/lib/s3-service";

const prisma = new PrismaClient();

// Define enum values
const AGENCY_TYPES = [
  'PRIVATE_LIMITED', 'PROPRIETORSHIP', 'PARTNERSHIP', 'PUBLIC_LIMITED', 'LLP',
  'TOUR_OPERATOR', 'TRAVEL_AGENT', 'DMC', 'OTHER', 'ONLINE_TRAVEL_AGENCY',
  'CORPORATE_TRAVEL', 'ADVENTURE_TRAVEL', 'LUXURY_TRAVEL', 'BUDGET_TRAVEL', 'SPECIALIZED_TRAVEL'
] as const;

type AgencyType = typeof AGENCY_TYPES[number];

const PAN_TYPES = [
  'INDIVIDUAL', 'COMPANY', 'TRUST', 'OTHER', 'ASSOCIATION', 'HUF', 'GOVERNMENT', 'PARTNERSHIP'
] as const;

type PanType = typeof PAN_TYPES[number];

// Define proper types for agency form data
interface AgencyFormUpdateData {
  name: string;
  contactPerson: string;
  designation: string;
  phoneNumber: string;
  phoneCountryCode: string;
  ownerName: string;
  email: string;
  companyPhone: string;
  companyPhoneCode: string;
  website: string;
  landingPageColor: string;
  gstRegistered: boolean;
  yearOfRegistration: string;
  panNumber: string;
  headquarters: string;
  country: string;
  yearsOfOperation: string;
  status: string;
  agencyType?: AgencyType;
  panType?: PanType;
  gstNumber?: string;
  businessLicensePath?: string;
  logoPath?: string;
}

interface AgencyFormCreateData extends AgencyFormUpdateData {
  createdBy: string;
}

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

// File upload helper for S3
async function uploadToS3(file: File, directory: string): Promise<string> {
  try {
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileName = `${directory}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    
    const s3File = await S3Service.uploadFile(
      fileBuffer,
      fileName,
      file.type || 'application/octet-stream',
      directory
    )
    
    return s3File.url
  } catch (error) {
    console.error(`Error uploading ${directory} to S3:`, error)
    throw new Error(`Failed to upload ${directory} to S3`)
  }
}

// Helper function to validate enum values
function isValidAgencyType(value: string): value is AgencyType {
  return AGENCY_TYPES.includes(value as AgencyType)
}

function isValidPanType(value: string): value is PanType {
  return PAN_TYPES.includes(value as PanType)
}

// GET: Check if agency form exists for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const agencyForm = await prisma.agencyForm.findFirst({
      where: { 
        OR: [
          { createdBy: user.id },
          { agencyId: user.id }
        ]
      },
      select: {
        id: true,
        name: true,
        contactPerson: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ 
      exists: !!agencyForm,
      data: agencyForm 
    });
  } catch (error) {
    console.error("Error checking agency form:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Update agency status
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = await request.json();

    if (!status || !['PENDING', 'ACTIVE', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatedForm = await prisma.agencyForm.updateMany({
      where: { 
        OR: [
          { createdBy: user.id },
          { agencyId: user.id }
        ]
      },
      data: { status },
    });

    return NextResponse.json({ 
      success: true,
      message: "Agency status updated successfully",
      updated: updatedForm.count
    });
  } catch (error) {
    console.error("Error updating agency status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create or update agency form
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await request.formData();
    
    // Extract form fields - MATCHING FRONTEND FIELD NAMES
    const name = formData.get("name") as string;
    const contactPerson = formData.get("contactPerson") as string;
    const designation = formData.get("designation") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const phoneCountryCode = formData.get("phoneCountryCode") as string;
    const ownerName = formData.get("ownerName") as string;
    const email = formData.get("email") as string;
    const companyPhone = formData.get("companyPhone") as string;
    const companyPhoneCode = formData.get("companyPhoneCode") as string;
    const website = formData.get("website") as string;
    const landingPageColor = formData.get("landingPageColor") as string;
    const gstRegistered = formData.get("gstRegistered") === "true";
    const gstNumber = formData.get("gstNumber") as string;
    const yearOfRegistration = formData.get("yearOfRegistration") as string;
    const panNumber = formData.get("panNumber") as string;
    const panType = formData.get("panType") as string;
    const headquarters = formData.get("headquarters") as string;
    const country = formData.get("country") as string;
    const yearsOfOperation = formData.get("yearsOfOperation") as string;
    const agencyType = formData.get("agencyType") as string;
    const businessLicense = formData.get("businessLicense") as File;
    const logo = formData.get("logo") as File;

    console.log("Received form data:", {
      name, contactPerson, email, phoneNumber, ownerName, 
      companyPhone, website, headquarters, country
    });

    // Validate required fields - MATCHING WHAT FRONTEND SENDS
    if (!name || !contactPerson || !email || !phoneNumber || !ownerName || 
        !companyPhone || !website || !headquarters || !country) {
      const missing = [];
      if (!name) missing.push("name");
      if (!contactPerson) missing.push("contactPerson");
      if (!email) missing.push("email");
      if (!phoneNumber) missing.push("phoneNumber");
      if (!ownerName) missing.push("ownerName");
      if (!companyPhone) missing.push("companyPhone");
      if (!website) missing.push("website");
      if (!headquarters) missing.push("headquarters");
      if (!country) missing.push("country");
      
      console.error("Missing required fields:", missing);
      return NextResponse.json({ 
        error: "Missing required fields", 
        details: `Missing: ${missing.join(", ")}` 
      }, { status: 400 });
    }

    // Validate enum values
    if (agencyType && !isValidAgencyType(agencyType)) {
      return NextResponse.json({ error: "Invalid agency type" }, { status: 400 });
    }

    if (panType && !isValidPanType(panType)) {
      return NextResponse.json({ error: "Invalid PAN type" }, { status: 400 });
    }

    // Handle file uploads to S3
    let businessLicensePath = null;
    let logoPath = null;

    try {
      if (businessLicense && businessLicense.size > 0) {
        businessLicensePath = await uploadToS3(businessLicense, "licenses");
        console.log("Business license uploaded to S3:", businessLicensePath);
      }

      if (logo && logo.size > 0) {
        logoPath = await uploadToS3(logo, "logos");
        console.log("Logo uploaded to S3:", logoPath);
      }
    } catch (error) {
      console.error("Error uploading files to S3:", error);
      // Continue with the rest of the operation even if file upload fails
    }

    // Check if agency form already exists
    const existingForm = await prisma.agencyForm.findFirst({
      where: { createdBy: user.id }
    });

    let agencyForm;
    if (existingForm) {
      // Update existing form
      const updateData: AgencyFormUpdateData = {
        name,
        contactPerson,
        designation,
        phoneNumber,
        phoneCountryCode: phoneCountryCode || "+91",
        ownerName,
        email,
        companyPhone,
        companyPhoneCode: companyPhoneCode || "+91",
        website,
        landingPageColor: landingPageColor || "#4ECDC4",
        gstRegistered,
        yearOfRegistration,
        panNumber,
        headquarters,
        country: country || "INDIA",
        yearsOfOperation,
        status: "PENDING",
      };

      // Add optional fields
      if (agencyType) updateData.agencyType = agencyType as AgencyType;
      if (panType) updateData.panType = panType as PanType;
      if (gstNumber) updateData.gstNumber = gstNumber;
      if (businessLicensePath) updateData.businessLicensePath = businessLicensePath;
      if (logoPath) updateData.logoPath = logoPath;

      agencyForm = await prisma.agencyForm.update({
        where: { id: existingForm.id },
        data: updateData,
      });
      
      console.log("Updated existing form:", agencyForm.id);
    } else {
      // Create new form
      const createData: AgencyFormCreateData = {
        name,
        contactPerson,
        designation,
        phoneNumber,
        phoneCountryCode: phoneCountryCode || "+91",
        ownerName,
        email,
        companyPhone,
        companyPhoneCode: companyPhoneCode || "+91",
        website,
        landingPageColor: landingPageColor || "#4ECDC4",
        gstRegistered,
        yearOfRegistration,
        panNumber,
        headquarters,
        country: country || "INDIA",
        yearsOfOperation,
        createdBy: user.id,
        status: "PENDING",
      };

      // Add optional fields
      if (agencyType) createData.agencyType = agencyType as AgencyType;
      if (panType) createData.panType = panType as PanType;
      if (gstNumber) createData.gstNumber = gstNumber;
      if (businessLicensePath) createData.businessLicensePath = businessLicensePath;
      if (logoPath) createData.logoPath = logoPath;

      agencyForm = await prisma.agencyForm.create({
        data: createData,
      });
      
      console.log("Created new form:", agencyForm.id);
    }

    // Send approval email to admin (anusree@buyexchange.in)
    try {
      const adminEmail = "anusree@buyexchange.in";
      
      console.log("Sending approval email to:", adminEmail);
      console.log("SMTP Config:", {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER ? "***" : "not set"
      });

      const mailOptions = {
        from: `"Elneera" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject: `🎉 New Agency Registration: ${name}`,
        html: agencyApprovalEmailTemplate({
          agencyId: agencyForm.id,
          agencyName: name,
          contactPerson,
          email,
          phoneNumber,
          agencyType: agencyType || "OTHER",
          panNumber: panNumber || "",
          headquarters,
          registrationDate: new Date().toISOString(),
          status: "PENDING",
        }),
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected
      });
      
    } catch (emailError) {
      const error = emailError as Error;
      console.error("Error sending approval email:", {
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        code: (error as NodeJS.ErrnoException)?.code,
      });
      // Continue with the request even if email fails
    }

    return NextResponse.json({ 
      success: true,
      message: "Agency form submitted successfully",
      data: agencyForm 
    });
  } catch (error) {
    console.error("Error creating/updating agency form:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}