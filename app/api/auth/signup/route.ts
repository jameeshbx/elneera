import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { getWelcomeEmail } from "@/emails/welcome-email";
import { USER_TYPES } from "@/types/user";

const prisma = new PrismaClient();

// Define UserType based on your Prisma schema enum values
type UserType = 
  | 'USER'
  | 'AGENCY_ADMIN'
  | 'AGENCY_MANAGER'
  | 'TEAM_LEAD'
  | 'EXECUTIVE'
  | 'DMC'
  | 'AGENCY'
  | 'CUSTOMER'
  | 'TEKKING_MYLES'
  | 'MANAGER'
  | 'TL'
  | 'SUPER_ADMIN'
  | 'ADMIN';

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  userType: z.enum(USER_TYPES, {
    message: `User type must be one of: ${USER_TYPES.join(", ")}`
  }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const validatedData = signupSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create user with proper typing for Prisma
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        userType: validatedData.userType as UserType, // Cast to UserType
        profileCompleted: validatedData.userType === 'AGENCY_ADMIN' ? false : true,
        companyName: validatedData.companyName,
        businessType: 'AGENCY',
        emailVerified: null,
        status: 'ACTIVE',
      },
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    void password; // Explicitly mark as unused

    try {
      // Send welcome email
      const emailData = getWelcomeEmail(validatedData.name);
      await sendEmail({
        to: validatedData.email,
        subject: emailData.subject,
        html: emailData.html,
        attachments: []
      });

      console.log("Welcome email sent successfully");
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail the signup if email sending fails
    }

    console.log("User created successfully");
    return NextResponse.json(
      { 
        success: true, 
        user: userWithoutPassword 
      },
      { status: 200 }
    );
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}