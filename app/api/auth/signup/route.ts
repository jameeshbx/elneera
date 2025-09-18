import { NextResponse } from "next/server";
import { PrismaClient, UserType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { getWelcomeEmail } from "@/emails/welcome-email";

const prisma = new PrismaClient();

import { USER_TYPES } from "@/types/user";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  userType: z.enum(USER_TYPES as unknown as [string, string, string], {
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
        companyName: validatedData.companyName,
       userType: validatedData.userType as UserType,
        businessType: 'AGENCY',
        role: validatedData.userType === 'AGENCY_ADMIN' ? 'ADMIN' : 'USER',
      },
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    void password; // Explicitly mark as unused

    try {
      // Send welcome email
      const emailContent = getWelcomeEmail(validatedData.name);
      await sendEmail({
        to: validatedData.email,
        subject: emailContent.subject,
        html: emailContent.html
      });
      console.log("Welcome email sent successfully");
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail the signup if email sending fails
    }

    console.log("User created successfully");
    return NextResponse.json(
      { 
        message: "User created successfully. Welcome email sent.", 
        user: userWithoutPassword 
      },
      { status: 201 }
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