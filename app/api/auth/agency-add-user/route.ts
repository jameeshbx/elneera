import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import {  PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/email";



// Create a single Prisma Client and reuse it
const globalForPrisma = global as unknown as { prisma: PrismaClient };
// Initialize Prisma Client
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});
// In development, prevent creating new instances on HMR
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
    // Check if file table exists, create if not
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
    // Check if user_form table exists, create if not
    try {
      await prisma.$executeRaw`SELECT 1 FROM "user_form" LIMIT 1`;
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
            "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
            "createdBy" TEXT NOT NULL,
            "resetToken" TEXT,
            "resetTokenExpiry" TIMESTAMP,
            CONSTRAINT fk_profile_image
              FOREIGN KEY ("profileImageId")
              REFERENCES "file"(id)
              ON DELETE SET NULL
          );
          
          CREATE INDEX "user_form_email_idx" ON "user_form"(email);
          CREATE INDEX "user_form_username_idx" ON "user_form"(username);
        `;
        console.log("✅ Created user_form table");
      } else {
        throw userFormError;
      }
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
  userType: string | null;  // Changed from string to string | null
  status: string;
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
import { getNewUserWelcomeEmail } from "@/emails/new-user-welcome";
export async function POST(req: Request) {
  try {
    console.log("=== Starting user creation process ===");
    
    // Test database connection first
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (dbError) {
      console.error('❌ Database connection error:', dbError);
      // Try to reconnect
      try {
        await prisma.$connect();
      } catch (reconnectError) {
        console.error('❌ Failed to reconnect to database:', reconnectError);
        return NextResponse.json({
          success: false,
          error: "Database connection error. Please try again later.",
          details: process.env.NODE_ENV === 'development' ? String(reconnectError) : undefined
        }, { status: 503 }); // Service Unavailable
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
    // Ensure tables exist before proceeding
    await ensureTablesExist();
    console.log("✅ Database tables verified");
    // Parse form data
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
    // Extract form data with proper type checking
    const name = formData.get('name')!.toString().trim();
    const phoneNumber = formData.get('phoneNumber')?.toString()?.trim() || '';
    const email = formData.get('email')!.toString().toLowerCase().trim();
    const password = formData.get('password')!.toString();
    const userType = formData.get('userType')!.toString();
    console.log("🔍 User type from form:", userType);

    // Validate the user type
    // Validate the user type - Updated to handle all possible user types
    const validUserTypes = ['MANAGER', 'EXECUTIVE', 'TEAM_LEAD', 'TL', 'AGENCY_ADMIN'];
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

   
    // Check if user already exists in user_form table
    const existingUserForm = await prisma.userForm.findUnique({
      where: { email },
    });

    
    // Check if user already exists in main user table
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });


    if (existingUserForm || existingUser) {
      console.log("ℹ️ User already exists with email:", email);

      // Generate reset token using a secure method
      const resetToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Generate unique filename
       
      let updatedUser;

        // Save file
        
      if (existingUserForm) {
        // Update existing user_form entry
        updatedUser = await prisma.userForm.update({
          where: { email },
          data: {
            name: name || existingUserForm.name,
            phoneNumber: phoneNumber || existingUserForm.phoneNumber,
            userType: userType,
            password: await hash(password, 10), // Update password
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
            createdAt: true,
            updatedAt: true,
          }
        });
      } else if (existingUser) {
        // If user exists in main table but not in user_form, handle accordingly
        // Create password reset for main user
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
            userType: userType as 'TEAM_LEAD' | 'EXECUTIVE' | 'MANAGER' | 'TL' | 'AGENCY_ADMIN',
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
        // Continue even if email fails
      }

      return NextResponse.json({
        success: true,
        message: 'User updated successfully. New credentials sent to email.',
        data: {
          id: updatedUser!.id,
          name: updatedUser!.name,
          email: updatedUser!.email,
          userType: updatedUser!.userType
        }
      });
    }



    // Create new user if not exists
    console.log("🔧 Creating new user...");

    // Generate password reset token using crypto.getRandomValues for browser compatibility
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const resetToken = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 24); // 24 hours from now

    // Create new user with hashed password in user_form table
    const newUser = await prisma.userForm.create({
      data: {
        name,
        phoneNumber,
        email,
       
        username: email, // Using email as username
        password: await hash(password, 10), // Hash password for security
        userType,
        status: 'ACTIVE',
        createdBy: session.user.id,
        resetToken,
        resetTokenExpiry
      },
     
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        createdAt: true
      }
    });


    console.log("✅ User created successfully:", newUser);

    // Send welcome email with login credentials
    const loginUrl = new URL('/login', process.env.NEXTAUTH_URL || 'http://localhost:3000');
    loginUrl.searchParams.set('email', email);

    const emailContent = getNewUserWelcomeEmail({
      name,
      email,
      password: password, // The plain password before hashing
      userType,
      loginUrl: loginUrl.toString()
    });

    try {
      // Send welcome email with credentials
      

      await sendEmail({
        to: email,
        subject: emailContent.subject,
        html: emailContent.html
      });

      // Send notification to admin for AGENCY_ADMIN signup
      if (userType === 'AGENCY_ADMIN') {
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
      // Continue even if email fails
    }

    // Return user data without password
   
    return NextResponse.json({
      success: true,
      message: 'User created successfully. Login credentials sent to email.',
      data: newUser
    });

  } catch (error: unknown) {
    console.error("❌ Error deleting user:", error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
    return NextResponse.json({
      error: errorMessage
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
export async function GET() {
  try {
    console.log("📄 Fetching users list...");
    
    // Ensure table exists before proceeding
    await ensureTablesExist();
    
    const users = await prisma.userForm.findMany({
      include: {
        profileImage: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`✅ Found ${users.length} users`);
    
    return NextResponse.json({
      success: true,
      data: users.map((user: User) => ({
        id: user.id,
        name: user.name || '',
        phoneNumber: user.phoneNumber || '',
        phoneExtension: user.phoneExtension,
        email: user.email,
        username: user.username,
        userType: user.userType || 'TEAM_LEAD',  // Provide default if null
        status: user.status,      
        createdAt: user.createdAt,
        profileImage: user.profileImage,
        maskedPassword: "•••••••"
      }))
    });
  } catch (error: unknown) {
    console.error("❌ Error fetching users:", error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
    return NextResponse.json({
      error: errorMessage
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    console.log("🗑️ Deleting user with ID:", id);
    // Check if user exists
    const user = await prisma.userForm.findUnique({
      where: { id },
      include: { profileImage: true }
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    // Delete user (this will also handle the foreign key relationship)
    await prisma.userForm.delete({
      where: { id }
    });
    console.log("✅ User deleted successfully");
    return NextResponse.json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error: unknown) {
    console.error("❌ Error deleting user:", error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
    return NextResponse.json({
      error: errorMessage
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

    export async function PATCH(req: Request) {
      try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id } = await req.json();
        
        if (!id) {
          return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }
        console.log("👁️ Revealing password for user ID:", id);
        // Verify user exists and get password
        const user = await prisma.userForm.findUnique({
          where: { id },
          select: {
            id: true,
            password: true,
            name: true
          }
        });
        if (!user) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

    // For security, we'll return a placeholder since the password is hashed
    // In a real scenario, you'd implement proper password reset functionality
    return NextResponse.json({
      success: true,
      data: {
        password: "••••••••" // Hashed password - return masked version
      }
    });

  } catch (error: unknown) {
    console.error("❌ Error revealing password:", error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to reveal password';
    return NextResponse.json({
      error: errorMessage
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { id, status } = body;
    
    if (!id || !status) {
      return NextResponse.json({ error: "ID and status are required" }, { status: 400 });
    }
    // Validate status
    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }
    console.log(`🔄 Updating user ${id} status to ${status}`);
    // Check if user exists
    const user = await prisma.userForm.findUnique({
      where: { id }
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    // Update user status
    const updatedUser = await prisma.userForm.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date()
      },
      include: {
        profileImage: true
      }
    });
    console.log("✅ User status updated successfully");
    return NextResponse.json({
      success: true,
      message: `User status changed to ${status}`,
      data: {
        ...updatedUser,
        password: undefined // Don't send password in response
      }
    });
  } catch (error: unknown) {
    console.error("❌ Error updating user status:", error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update user status';
    return NextResponse.json({
      error: errorMessage
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}