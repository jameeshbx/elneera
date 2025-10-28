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
        designation: true,
        phoneNumber: true,
        phoneCountryCode: true,
        ownerName: true,
        email: true,
        companyPhone: true,
        companyPhoneCode: true,
        website: true,
        landingPageColor: true,
        gstRegistered: true,
        gstNumber: true,
        yearOfRegistration: true,
        panNumber: true,
        panType: true,
        headquarters: true,
        country: true,
        yearsOfOperation: true,
        status: true,
        agencyType: true,
        logoPath: true,
        businessLicensePath: true,
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

// PUT: Update agency form data
export async function PUT(request: NextRequest) {
  try {
    console.log('PUT request received for agency form update');
    
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

    // Get existing form data
    const existingForm = await prisma.agencyForm.findFirst({
      where: { 
        OR: [
          { createdBy: user.id },
          { agencyId: user.id }
        ]
      }
    });

    if (!existingForm) {
      return NextResponse.json({ error: "Agency form not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const updateData: Partial<AgencyFormUpdateData> = {};

    console.log('Processing form data entries...');

    // Process form data
    for (const [key, value] of formData.entries()) {
      console.log(`Processing field: ${key}`, typeof value === 'string' ? value : '[File]');
      
      // Skip file fields - we'll handle them separately
      if (key === 'logo' || key === 'businessLicense') {
        continue;
      }
      
      if (typeof value === 'string' && value.trim() !== '') {
        // Convert string 'true'/'false' to boolean for gstRegistered
        if (key === 'gstRegistered') {
          (updateData as { gstRegistered?: boolean }).gstRegistered = value === 'true';
        } else if (key === 'yearOfRegistration' && !isNaN(Number(value))) {
          // Handle numeric fields
          (updateData as { yearOfRegistration?: number }).yearOfRegistration = parseInt(value, 10);
        } else if (key === 'yearsOfOperation' && !isNaN(Number(value))) {
          (updateData as { yearsOfOperation?: number }).yearsOfOperation = parseInt(value, 10);
        } else {
          // For all other string fields
          (updateData as Record<string, string | number | boolean>)[key] = value;
        }
      }
    }

    console.log('Basic form data processed:', updateData);

    // Handle file uploads
    const logoEntry = formData.get('logo');
    const licenseEntry = formData.get('businessLicense');

    console.log('Logo entry type:', logoEntry instanceof File ? 'File' : typeof logoEntry);
    console.log('License entry type:', licenseEntry instanceof File ? 'File' : typeof licenseEntry);

    try {
      // Handle logo upload
      if (logoEntry instanceof File && logoEntry.size > 0) {
        console.log('Uploading new logo:', logoEntry.name, logoEntry.size, 'bytes');
        try {
          updateData.logoPath = await uploadToS3(logoEntry, 'agency-logos');
          console.log('Logo uploaded successfully:', updateData.logoPath);
        } catch (error) {
          console.error('Error uploading logo:', error);
          return NextResponse.json({ 
            error: 'Failed to upload logo. Please try again.',
            details: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 });
        }
      } else {
        console.log('No new logo file provided, keeping existing');
      }
      
      // Handle license upload
      if (licenseEntry instanceof File && licenseEntry.size > 0) {
        console.log('Uploading new license:', licenseEntry.name, licenseEntry.size, 'bytes');
        try {
          updateData.businessLicensePath = await uploadToS3(licenseEntry, 'business-licenses');
          console.log('License uploaded successfully:', updateData.businessLicensePath);
        } catch (error) {
          console.error('Error uploading business license:', error);
          // If logo was uploaded successfully but license fails, clean up the logo
          if (updateData.logoPath && updateData.logoPath !== existingForm.logoPath) {
            try {
              await S3Service.deleteFile(updateData.logoPath);
            } catch (cleanupError) {
              console.error('Error cleaning up logo after license upload failed:', cleanupError);
            }
          }
          return NextResponse.json({ 
            error: 'Failed to upload business license. Please try again.',
            details: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 });
        }
      } else {
        console.log('No new license file provided, keeping existing');
      }
    } catch (error) {
      console.error('Unexpected error during file uploads:', error);
      return NextResponse.json({ 
        error: 'An unexpected error occurred during file uploads',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    console.log('Final update data:', updateData);

    // Update the form data
    const updatedForm = await prisma.agencyForm.update({
      where: { id: existingForm.id },
      data: updateData,
    });

    console.log('Form updated successfully in database');

    // Send update notification email to admin
    try {
      const adminEmail = "anand@buyexchange.in";
      
      // Prepare attachments array
      const attachments = [];
      
      // Add business license as attachment if updated
      if (updateData.businessLicensePath) {
        const filename = updateData.businessLicensePath.split('/').pop() || 'business-license';
        attachments.push({
          filename,
          path: updateData.businessLicensePath,
          cid: 'businessLicense'
        });
      }

      // Add logo as attachment if updated
      if (updateData.logoPath) {
        const filename = updateData.logoPath.split('/').pop() || 'logo';
        attachments.push({
          filename,
          path: updateData.logoPath,
          cid: 'logo'
        });
      }

      const mailOptions = {
        from: `"Elneera" <${process.env.SMTP_USER || 'noreply@elneera.com'}>`,
        to: adminEmail,
        subject: `Updated Agency Details: ${updatedForm.name || 'Agency'}`,
        html: agencyApprovalEmailTemplate({
          agencyId: updatedForm.id,
          agencyName: updatedForm.name || 'Agency',
          contactPerson: updatedForm.contactPerson || 'Not provided',
          designation: updatedForm.designation || 'Not provided',
          email: updatedForm.email || 'Not provided',
          phoneNumber: updatedForm.phoneNumber || 'Not provided',
          phoneCountryCode: updatedForm.phoneCountryCode || '+91',
          ownerName: updatedForm.ownerName || 'Not provided',
          companyPhone: updatedForm.companyPhone || 'Not provided',
          companyPhoneCode: updatedForm.companyPhoneCode || '+91',
          website: updatedForm.website || 'Not provided',
          landingPageColor: updatedForm.landingPageColor || '#4ECDC4',
          gstRegistered: updatedForm.gstRegistered || false,
          gstNumber: updatedForm.gstNumber || 'Not provided',
          yearOfRegistration: updatedForm.yearOfRegistration?.toString() || 'Not provided',
          panNumber: updatedForm.panNumber || 'Not provided',
          panType: (updatedForm.panType as PanType) || 'INDIVIDUAL',
          headquarters: updatedForm.headquarters || 'Not provided',
          country: updatedForm.country || 'Not provided',
          yearsOfOperation: updatedForm.yearsOfOperation || 'Not provided',
          agencyType: updatedForm.agencyType || 'PRIVATE_LIMITED',
          registrationDate: updatedForm.createdAt?.toLocaleDateString() || new Date().toLocaleDateString(),
          status: updatedForm.status || 'PENDING',
          businessLicenseUrl: updatedForm.businessLicensePath || '',
          logoUrl: updatedForm.logoPath || ''
        }, true), // Pass true to indicate this is an update
        attachments
      };

      await transporter.sendMail(mailOptions);
      console.log('Update notification email sent to admin');
    } catch (emailError) {
      console.error('Error sending update notification email:', emailError);
      // Don't fail the request if email sending fails
    }

    return NextResponse.json({ 
      success: true,
      message: "Agency form updated successfully",
      data: updatedForm
    });
  } catch (error) {
    console.error("Error updating agency form:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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

    // Send approval email to admin (anand@buyexchange.in)
    try {
      const adminEmail = "anand@buyexchange.in";
      
      console.log("Sending approval email to:", adminEmail);
      console.log("SMTP Config:", {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER ? "***" : "not set"
      });

      // Prepare attachments array
      const attachments = [];
      
      // Add business license as attachment if available
      if (businessLicensePath) {
        const filename = businessLicensePath.split('/').pop() || 'business-license';
        attachments.push({
          filename,
          path: businessLicensePath,
          cid: 'businessLicense'
        });
      }

      // Add logo as attachment if available
      if (logoPath) {
        const filename = logoPath.split('/').pop() || 'logo';
        attachments.push({
          filename,
          path: logoPath,
          cid: 'logo'
        });
      }

      const mailOptions = {
        from: `"Elneera" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject: `🎉 New Agency Registration: ${name}`,
        html: agencyApprovalEmailTemplate({
          agencyId: agencyForm.id,
          agencyName: name,
          contactPerson,
          designation: designation || '',
          email,
          phoneNumber,
          phoneCountryCode: phoneCountryCode || '+91',
          ownerName,
          companyPhone,
          companyPhoneCode: companyPhoneCode || '+91',
          website,
          landingPageColor: landingPageColor || '#4ECDC4',
          gstRegistered,
          yearOfRegistration,
          panNumber: panNumber || '',
          panType: panType || '',
          gstNumber: gstNumber || '',
          headquarters,
          country: country || 'INDIA',
          yearsOfOperation,
          agencyType: agencyType || 'OTHER',
          registrationDate: new Date().toISOString(),
          status: 'PENDING',
          businessLicenseUrl: businessLicensePath || '',
          logoUrl: logoPath || ''
        }),
        attachments: attachments.length > 0 ? attachments : undefined
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