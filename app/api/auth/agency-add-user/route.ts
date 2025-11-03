import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { getNewUserWelcomeEmail } from "@/emails/new-user-welcome";
import { UserType } from "@prisma/client";

// Create a single Prisma Client and reuse it
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Type guard for Prisma errors
interface PrismaError extends Error {
  code?: string;
  meta?: {
    target?: string[];
  };
}

function isPrismaError(error: unknown): error is PrismaError {
  return typeof error === 'object' && error !== null && 'code' in error;
}

async function ensureTablesExist() {
  try {
    // Check if file table exists
    try {
      await prisma.$executeRaw`SELECT 1 FROM "file" LIMIT 1`;
    } catch (fileTableError) {
      if (isPrismaError(fileTableError) && fileTableError.code === 'P2021') {
        await prisma.$executeRaw`
          CREATE TABLE "file" (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            type TEXT NOT NULL,
            size INTEGER NOT NULL,
            "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
          );
        `;
        console.log("✅ Created file table");
      } else {
        throw fileTableError;
      }
    }

    // Check if user_form table exists
    try {
      await prisma.$executeRaw`SELECT 1 FROM "user_form" LIMIT 1`;
      console.log("✅ user_form table exists");
    } catch (userFormError) {
      if (isPrismaError(userFormError) && userFormError.code === 'P2021') {
        await prisma.$executeRaw`
          CREATE TABLE "user_form" (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            "phoneNumber" TEXT NOT NULL,
            "phoneExtension" TEXT NOT NULL DEFAULT '+91',
            email TEXT NOT NULL UNIQUE,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            "userType" TEXT NOT NULL DEFAULT 'TEAM_LEAD',
            "profileImageId" TEXT,
            status TEXT NOT NULL DEFAULT 'ACTIVE',
            "agencyId" TEXT,
            "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
            "createdBy" TEXT NOT NULL,
            "resetToken" TEXT,
            "resetTokenExpiry" TIMESTAMP,
            CONSTRAINT fk_profile_image
              FOREIGN KEY ("profileImageId")
              REFERENCES "file"(id)
              ON DELETE SET NULL,
            CONSTRAINT fk_agency
              FOREIGN KEY ("agencyId")
              REFERENCES "User"(id)
              ON DELETE SET NULL
          );
          
          CREATE INDEX "user_form_email_idx" ON "user_form"(email);
          CREATE INDEX "user_form_username_idx" ON "user_form"(username);
          CREATE INDEX "user_form_agencyId_idx" ON "user_form"("agencyId");
        `;
        console.log("✅ Created user_form table with agencyId");
      } else {
        throw userFormError;
      }
    }

    // Ensure agencyId column exists (for existing tables)
    try {
      const columnCheck = await prisma.$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'user_form' 
        AND column_name = 'agencyId'
      `;

      if (columnCheck.length === 0) {
        console.log("⚠️ agencyId column missing, adding it now...");
        
        await prisma.$executeRaw`
          ALTER TABLE "user_form" 
          ADD COLUMN "agencyId" TEXT;
        `;
        console.log("✅ Added agencyId column");

        await prisma.$executeRaw`
          ALTER TABLE "user_form"
          ADD CONSTRAINT fk_agency
          FOREIGN KEY ("agencyId")
          REFERENCES "User"(id)
          ON DELETE SET NULL;
        `;
        console.log("✅ Added foreign key constraint");

        await prisma.$executeRaw`
          CREATE INDEX "user_form_agencyId_idx" 
          ON "user_form"("agencyId");
        `;
        console.log("✅ Added agencyId index");
      } else {
        console.log("✅ agencyId column already exists");
      }
    } catch (alterError) {
      console.error("❌ Error checking/adding agencyId column:", alterError);
    }
  } catch (error) {
    console.error("❌ Error ensuring tables exist:", error);
    throw error;
  }
}

interface User {
  id: string;
  name: string | null;
  phoneNumber: string | null;
  phoneExtension: string;
  email: string | null;
  username: string | null;
  userType: string | null;
  status: string;
  agencyId: string | null;
  createdAt: Date;
  profileImage: {
    id: string;
    url: string;
    name: string;
    size: number;
    type: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}

// POST - Create new user
export async function POST(req: Request) {
  try {
    console.log("=== Starting user creation process ===");
    
    // Test database connection first
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log("✅ Database connection successful");
    } catch (dbError) {
      console.error('❌ Database connection error:', dbError);
      try {
        await prisma.$connect();
      } catch (reconnectError) {
        console.error('❌ Failed to reconnect to database:', reconnectError);
        return NextResponse.json({
          success: false,
          error: "Database connection error. Please try again later.",
          details: process.env.NODE_ENV === 'development' ? String(reconnectError) : undefined
        }, { status: 503 });
      }
    }
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log("❌ No session found");
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }
    console.log("✅ Session found for user:", session.user.id);

    const agencyAdminId = session.user.id;
    console.log("🏢 Agency Admin ID:", agencyAdminId);

    // Verify the user is an agency admin
    const agencyAdmin = await prisma.user.findUnique({
  where: { id: agencyAdminId },
  select: { 
    id: true, 
    userType: true,
    businessType: true 
  }
});

if (!agencyAdmin || !['AGENCY_ADMIN', 'TRAVEL_AGENCY'].includes(agencyAdmin.userType)){
  console.log("❌ User is not an agency admin");
  return NextResponse.json({
    success: false,
    error: "Only agency admins can create users"
  }, { status: 403 });
}

    console.log("✅ Verified agency admin status");
    
    await ensureTablesExist();
    console.log("✅ Database tables verified");
    
    const formData = await req.formData();
    console.log("Form data received:", Object.fromEntries(formData.entries()));
    
    // Validate required fields
    const requiredFields = ['name', 'email', 'password', 'userType'];
    const missingFields = requiredFields.filter(field => !formData.get(field)?.toString()?.trim());
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      }, { status: 400 });
    }
    
    const name = formData.get('name')!.toString().trim();
    const phoneNumber = formData.get('phoneNumber')?.toString()?.trim() || '';
    const email = formData.get('email')!.toString().toLowerCase().trim();
    const password = formData.get('password')!.toString();
    const userType = formData.get('userType')!.toString();
    console.log("🔍 User type from form:", userType);

    // Validate the user type
    // Validate the user type - Updated to handle all possible user types
    const validUserTypes = ['MANAGER', 'EXECUTIVE', 'TEAM_LEAD', 'TL', 'TRAVEL_AGENCY'];
    if (!userType || !validUserTypes.includes(userType)) {
      console.error("❌ Invalid user type received:", userType);
      return NextResponse.json(
        { error: `Invalid user type. Must be one of: ${validUserTypes.join(', ')}` }, 
        { status: 400 }
      );
    }
    
    console.log("✅ Validated user type:", userType);
    
    // Validation
    console.log("🔍 Validating form data...");
    
    if (!name?.trim()) {
      console.log("❌ Name validation failed");
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!phoneNumber?.trim()) {
      console.log("❌ Phone number validation failed");
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }
    if (!/^\d{10}$/.test(phoneNumber)) {
      console.log("❌ Phone number format validation failed");
      return NextResponse.json({ error: "Phone number must be 10 digits" }, { status: 400 });
    }
    if (!email?.trim()) {
      console.log("❌ Email validation failed");
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.log("❌ Email format validation failed");
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }
    if (!password || password.length < 8) {
      console.log("❌ Password validation failed");
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    console.log("✅ All validations passed");

    // Check if user already exists
    const existingUserForm = await prisma.userForm.findUnique({
      where: { email },
    });
    
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUserForm || existingUser) {
      console.log("ℹ️ User already exists with email:", email);

      // Generate reset token
      const resetToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      let updatedUser;

      if (existingUserForm) {
        console.log("🔄 Updating existing user_form with agencyId:", agencyAdminId);

        updatedUser = await prisma.userForm.update({
          where: { email },
          data: {
            name: name || existingUserForm.name,
            phoneNumber: phoneNumber || existingUserForm.phoneNumber,
            userType: userType,
            password: await hash(password, 10),
           agencyId: agencyAdminId,  // Use agencyId instead of agency
            updatedAt: new Date(),
            resetToken,
            resetTokenExpiry
          },
          select: {
            id: true,
            name: true,
            email: true,
            userType: true,
            phoneNumber: true,
            agencyId: true,
            createdAt: true,
            updatedAt: true,
          }
        });

        console.log("✅ User updated with agencyId:", updatedUser.agencyId);
      } else if (existingUser) {
        await prisma.passwordReset.upsert({
          where: { userId: existingUser.id },
          update: {
            token: resetToken,
            expiresAt: resetTokenExpiry
          },
          create: {
            token: resetToken,
            expiresAt: resetTokenExpiry,
            user: {
              connect: { id: existingUser.id }
            }
          }
        });

        updatedUser = await prisma.user.update({
          where: { email },
          data: {
            name: name || existingUser.name,
            phone: phoneNumber || existingUser.phone,
            userType: userType as 'TEAM_LEAD' | 'EXECUTIVE' | 'MANAGER' | 'TL' | 'TRAVEL_AGENCY',
            password: await hash(password, 10), // Update password
            updatedAt: new Date(),
            businessType: 'AGENCY'
          },
          select: {
            id: true,
            name: true,
            email: true,
            userType: true,
            phone: true,
            createdAt: true,
            updatedAt: true,
          }
        });
      }

      // Send updated credentials email
      try {
        const loginUrl = new URL('/login', process.env.NEXTAUTH_URL || 'http://localhost:3000');
        loginUrl.searchParams.set('email', email);

        await sendEmail({
          to: email,
          subject: 'Account Updated - New Login Credentials',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Account Updated!</h2>
              <p>Hello ${name},</p>
              <p>Your account has been updated by an administrator with new login credentials.</p>
              
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>New Password:</strong> ${password}</p>
                <p><strong>User Type:</strong> ${userType}</p>
              </div>
              
              <p>You can now log in to your account using the button below:</p>
              
              <div style="margin: 25px 0; text-align: center;">
                <a href="${loginUrl.toString()}" 
                   style="display: inline-block; background-color: #2563eb; color: white; 
                          padding: 12px 24px; text-decoration: none; border-radius: 6px;
                          font-weight: 600;">
                  Login to Your Account
                </a>
              </div>
              
              <p style="font-size: 14px; color: #64748b;">
                Or copy and paste this link in your browser:<br>
                <a href="${loginUrl.toString()}" style="color: #3b82f6; word-break: break-all;">
                  ${loginUrl.toString()}
                </a>
              </p>
              
              <p style="margin-top: 30px; font-size: 14px; color: #64748b;">
                For security reasons, please change your password after logging in.
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Error sending update email:', emailError);
      }

      return NextResponse.json({
        success: true,
        message: 'User updated successfully. New credentials sent to email.',
        data: {
          id: updatedUser!.id,
          name: updatedUser!.name,
          email: updatedUser!.email,
          userType: updatedUser!.userType,
          agencyId: 'agencyId' in updatedUser! ? updatedUser!.agencyId : null
        }
      });
    }

    // Create new user
    console.log("🔧 Creating new user with agency ID:", agencyAdminId);

    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const resetToken = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 24);

    const hashedPassword = await hash(password, 10);

    // Generate unique username
    const emailLocalPart = (email.split('@')[0] || '').toLowerCase().replace(/[^a-z0-9]/g, '') || `user${Date.now().toString().slice(-5)}`;
    let candidateUsername = emailLocalPart;
    let suffix = 0;

    while (true) {
      const existsInUserForm = await prisma.userForm.findFirst({ where: { username: candidateUsername } });
      if (!existsInUserForm) break;
      suffix += 1;
      candidateUsername = `${emailLocalPart}${suffix}`;
    }

    console.log('✅ Resolved unique username:', candidateUsername);

    // Verify agencyId is valid
    const agencyExists = await prisma.user.findUnique({
      where: { id: agencyAdminId },
      select: { id: true }
    });

    if (!agencyExists) {
      console.error("❌ Agency admin ID not found in User table:", agencyAdminId);
      return NextResponse.json({
        success: false,
        error: "Invalid agency admin ID"
      }, { status: 400 });
    }

    console.log("✅ Agency exists, proceeding with user creation");
    console.log("📝 Creating user for agency:", agencyAdminId);

    const newUser = await prisma.userForm.create({
      data: {
        name,
        phoneNumber,
        phoneExtension: '+91',
        email,
        username: candidateUsername,
        password: hashedPassword,
        userType,
        status: 'ACTIVE' as const,
        createdBy: agencyAdminId,
        agencyId: agencyAdminId,
        resetToken,
        resetTokenExpiry
      },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        agencyId: true,
        phoneNumber: true,
        phoneExtension: true,
        status: true,
        createdAt: true,
        profileImage: true
      }
    });

    console.log("✅ User created successfully:", newUser);
    console.log("✅ Agency ID stored:", newUser.agencyId);

    // Verify the agencyId was stored
    const verifyUser = await prisma.userForm.findUnique({
      where: { id: newUser.id },
      select: { id: true, agencyId: true, name: true }
    });

    console.log("🔍 Verification - User in DB:", verifyUser);

    if (!verifyUser?.agencyId) {
      console.error("⚠️ WARNING: agencyId is NULL in database after creation!");
    }

    // Send welcome email
    const loginUrl = new URL('/login', process.env.NEXTAUTH_URL || 'http://localhost:3000');
    loginUrl.searchParams.set('email', email);

    const emailContent = getNewUserWelcomeEmail({
      name,
      email,
      password: password,
      userType,
      loginUrl: loginUrl.toString()
    });

    try {
      await sendEmail({
        to: email,
        subject: emailContent.subject,
        html: emailContent.html
      });

      // Send notification to admin for TRAVEL_AGENCY signup
      if (userType === 'TRAVEL_AGENCY') {
        const adminEmail = 'anusree@buyexchange.in';
        const adminSubject = 'New Agency Admin Registration';
        const adminHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">New Agency Admin Registration</h2>
            <p>A new agency admin has been registered in the system:</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Phone:</strong> ${phoneNumber}</p>
              <p><strong>Registration Date:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p>Please review their registration in the admin panel and ensure appropriate permissions are set.</p>
          </div>
        `;

        await sendEmail({
          to: adminEmail,
          subject: adminSubject,
          html: adminHtml
        });
      }

    } catch (emailError) {
      console.error('Error sending email:', emailError);
    }

    // Also create main User record for login
    try {
      const upsertedUser = await prisma.user.upsert({
        where: { email },
        update: {
          name: name || undefined,
          password: hashedPassword,
          userType: userType as UserType,
          agencyId: agencyAdminId,
          updatedAt: new Date(),
          status: 'ACTIVE'
        },
        create: {
          email,
          password: hashedPassword,
          name: name || '',
          companyName: name || '',
          businessType: 'AGENCY',
          userType: userType as UserType,
          agencyId: agencyAdminId,
          status: 'ACTIVE'
        },
      });

      console.log('✅ Upserted main User record for login:', { id: upsertedUser.id, email: upsertedUser.email });
    } catch (upsertErr) {
      console.error('❌ Failed to upsert main User record:', upsertErr);
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully. Login credentials sent to email.',
      data: newUser
    });

  } catch (error: unknown) {
    console.error("❌ Error creating user:", error);
    
    if (isPrismaError(error)) {
      console.error("Prisma error code:", error.code);
      console.error("Prisma error meta:", error.meta);
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// GET - Fetch all users for the agency
export async function GET() {
  try {
    console.log("📄 Fetching users list...");
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    const agencyAdminId = session.user.id;
    console.log("🏢 Fetching users for agency:", agencyAdminId);
    
    await ensureTablesExist();
    
    // Fetch only users belonging to this agency
    const users = await prisma.userForm.findMany({
      where: {
        agencyId: agencyAdminId
      },
      include: {
        profileImage: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`✅ Found ${users.length} users for agency ${agencyAdminId}`);
    
    // Log sample to verify agencyId
    if (users.length > 0) {
      console.log("📊 Sample user:", {
        id: users[0].id,
        name: users[0].name,
        agencyId: users[0].agencyId
      });
    }
    
    return NextResponse.json({
      success: true,
      data: users.map((user: User) => ({
        id: user.id,
        name: user.name || '',
        phoneNumber: user.phoneNumber || '',
        phoneExtension: user.phoneExtension,
        email: user.email,
        username: user.username,
        userType: user.userType || 'TEAM_LEAD',
        status: user.status,
        agencyId: user.agencyId,
        createdAt: user.createdAt,
        profileImage: user.profileImage,
        maskedPassword: "•••••••"
      }))
    });
  } catch (error: unknown) {
    console.error("❌ Error fetching users:", error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PATCH - Reveal password (returns masked for security)
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 });
    }

    const { id } = await req.json();
    
    if (!id) {
      return NextResponse.json({ 
        success: false,
        error: "User ID is required" 
      }, { status: 400 });
    }

    console.log("👁️ Revealing password for user ID:", id);

    const user = await prisma.userForm.findUnique({
      where: { id },
      select: {
        id: true,
        password: true,
        name: true,
        agencyId: true
      }
    });

    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: "User not found" 
      }, { status: 404 });
    }

    if (user.agencyId !== session.user.id) {
      return NextResponse.json({ 
        success: false,
        error: "You can only view passwords for users in your agency" 
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        password: "••••••••" // For security, never return actual password
      }
    });

  } catch (error: unknown) {
    console.error("❌ Error revealing password:", error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to reveal password';
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}