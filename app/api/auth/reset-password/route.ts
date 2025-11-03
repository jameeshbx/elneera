import { NextRequest, NextResponse } from "next/server";
import { hash,  } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// In app/api/auth/reset-password/route.ts
export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      );
    }

    // Find the password reset record
    const passwordReset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!passwordReset) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date() > passwordReset.expiresAt) {
      await prisma.passwordReset.delete({
        where: { id: passwordReset.id },
      });
      return NextResponse.json(
        { error: "Reset token has expired" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await hash(newPassword, 12);

    // Update the user's password
    await prisma.user.update({
      where: { id: passwordReset.userId },
      data: { password: hashedPassword },
    });

    // Delete the used token
    await prisma.passwordReset.delete({
      where: { id: passwordReset.id },
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
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
