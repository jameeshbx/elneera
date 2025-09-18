import { NextRequest, NextResponse } from "next/server";
import { hash,  } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email, token, newPassword } = await req.json();

    if (!email || !token || !newPassword) {
      return NextResponse.json(
        { error: "Email, token, and new password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Hash the new password
    const hashedPassword = await hash(newPassword, 12);

    // Update password in User table
    await prisma.user.update({
      where: { email },
      data: { 
        password: hashedPassword,
      }
    });

    // Try to update UserForm if it exists
    try {
      await prisma.userForm.update({
        where: { email },
        data: { 
          password: hashedPassword,
          updatedAt: new Date()
        }
      });
    } catch  {
      console.log("UserForm not found or update failed, continuing...");
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
      role: user.role // Include role in response
    });

  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    if (!email || !token) {
      return NextResponse.json(
        { error: "Email and token are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.userForm.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, username: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // In a real implementation, you would validate the token
    // For now, we'll just return the user info
    return NextResponse.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error("Error validating reset token:", error);
    return NextResponse.json(
      { error: "Failed to validate token" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
