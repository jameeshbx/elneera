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

// GET: Check if agency form exists for the current user
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
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ 
      exists: !!agencyForm,
      form: agencyForm 
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

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update agency form status
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

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await request.formData();
    
    // Extract form fields
    const name = formData.get("name") as string;
    const contactPerson = formData.get("contactPerson") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const pincode = formData.get("pincode") as string;
    const country = formData.get("country") as string;
    const agencyType = formData.get("agencyType") as string;
    const panNumber = formData.get("panNumber") as string;
    const panType = formData.get("panType") as string;
    const gstNumber = formData.get("gstNumber") as string;
    const businessLicense = formData.get("businessLicense") as File;
    const logo = formData.get("logo") as File;

    // Validate required fields
    if (!name || !contactPerson || !email || !phone || !address || !city || !state || !pincode || !country) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate enum values
    if (agencyType && !isValidAgencyType(agencyType)) {
      return NextResponse.json({ error: "Invalid agency type" }, { status: 400 });
    }

    if (panType && !isValidPanType(panType)) {
      return NextResponse.json({ error: "Invalid PAN type" }, { status: 400 });
    }

    // Handle file uploads
    let businessLicensePath = null;
    let logoPath = null;

    if (businessLicense && businessLicense.size > 0) {
      businessLicensePath = await saveFile(businessLicense, "licenses");
    }

    if (logo && logo.size > 0) {
      logoPath = await saveFile(logo, "logos");
    }

    // Check if agency form already exists
    const existingForm = await prisma.agencyForm.findFirst({
      where: { createdBy: user.id }
    });

    let agencyForm;
    if (existingForm) {
      // Update existing form
      const updateData: {
        name: string;
        contactPerson: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
        agencyType: AgencyType;
        panNumber: string;
        panType: PanType;
        gstNumber: string;
        status: string;
        businessLicensePath?: string;
        logoPath?: string;
      } = {
        name,
        contactPerson,
        email,
        phone,
        address,
        city,
        state,
        pincode,
        country,
        agencyType: agencyType as AgencyType,
        panNumber,
        panType: panType as PanType,
        gstNumber,
        status: "PENDING",
      };

      // Only update file paths if new files are provided
      if (businessLicensePath) {
        updateData.businessLicensePath = businessLicensePath;
      }
      if (logoPath) {
        updateData.logoPath = logoPath;
      }

      agencyForm = await prisma.agencyForm.update({
        where: { id: existingForm.id },
        data: updateData,
      });
    } else {
      // Create new form
      const createData: {
        name: string;
        contactPerson: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
        agencyType: AgencyType;
        panNumber: string;
        panType: PanType;
        gstNumber: string;
        createdBy: string;
        status: string;
        businessLicensePath?: string;
        logoPath?: string;
      } = {
        name,
        contactPerson,
        email,
        phone,
        address,
        city,
        state,
        pincode,
        country,
        agencyType: agencyType as AgencyType,
        panNumber,
        panType: panType as PanType,
        gstNumber,
        createdBy: user.id,
        status: "PENDING",
      };

      // Add file paths if provided
      if (businessLicensePath) {
        createData.businessLicensePath = businessLicensePath;
      }
      if (logoPath) {
        createData.logoPath = logoPath;
      }

      agencyForm = await prisma.agencyForm.create({
        data: createData,
      });
    }

    // Send approval email to admin
    try {
      const adminEmail = process.env.ADMIN_EMAIL || "admin@trekkingmiles.com";
      
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: adminEmail,
        subject: "New Agency Form Submission",
        html: agencyApprovalEmailTemplate({
          agencyId: agencyForm.id,
          agencyName: name,
          contactPerson,
          email,
          phoneNumber: phone,
          agencyType: agencyType || "OTHER",
          panNumber: panNumber || "",
          headquarters: address,
          registrationDate: new Date().toISOString(),
          status: "PENDING",
        }),
      });
    } catch (emailError) {
      console.error("Error sending approval email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      success: true,
      message: "Agency form submitted successfully",
      form: agencyForm 
    });
  } catch (error) {
    console.error("Error creating/updating agency form:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}