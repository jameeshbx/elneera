"use server"

import { PrismaClient } from "@prisma/client"
import { hash } from "bcrypt"
import { z } from "zod"

const prisma = new PrismaClient()

// Define Zod schema for password validation
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")

export async function resetPassword(token: string, newPassword: string) {
  try {
    console.log("Resetting password with token:", token)

    // Validate password with Zod
    const validationResult = passwordSchema.safeParse(newPassword)
    if (!validationResult.success) {
      return { success: false, error: validationResult.error.issues[0]?.message || "Invalid password format" }
    }

    // Find the password reset record
    const passwordReset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    })

    // Check if token exists and is valid
    if (!passwordReset) {
      console.error("Password reset token not found:", token)
      return { success: false, error: "Invalid or expired token" }
    }

    // Check if token is expired
    if (new Date() > passwordReset.expiresAt) {
      // Clean up expired token
      await prisma.passwordReset.delete({
        where: { id: passwordReset.id },
      })
      return { success: false, error: "Reset token has expired" }
    }

    // Hash the new password
    const hashedPassword = await hash(newPassword, 10)

    // Update the user's password
    await prisma.user.update({
      where: { id: passwordReset.userId },
      data: { password: hashedPassword },
    })

    // Delete the password reset token
    await prisma.passwordReset.delete({
      where: { id: passwordReset.id },
    })

    return { success: true }
  } catch (error) {
    console.error("Password reset error:", error)
    return { success: false, error: "Failed to reset password" }
  } finally {
    await prisma.$disconnect()
  }
}
