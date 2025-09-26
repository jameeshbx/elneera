// app/api/update-landing-color/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const isAuthorized = user.userType === "AGENCY_ADMIN" || user.role === "ADMIN" || user.role === "SUPER_ADMIN"

    if (!isAuthorized) {
      return NextResponse.json(
        { error: `Access denied. User type: ${user.userType}, Role: ${user.role}` },
        { status: 403 }
      )
    }

    const { landingPageColor } = await request.json()

    if (!landingPageColor || typeof landingPageColor !== 'string') {
      return NextResponse.json(
        { error: "Invalid landing page color" },
        { status: 400 }
      )
    }

    // Validate hex color format
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/
    if (!hexColorRegex.test(landingPageColor)) {
      return NextResponse.json(
        { error: "Invalid hex color format" },
        { status: 400 }
      )
    }

    // Find and update the agency form
    const agencyForm = await prisma.agencyForm.findFirst({
      where: { createdBy: user.id }
    })

    if (!agencyForm) {
      return NextResponse.json(
        { error: "Agency form not found" },
        { status: 404 }
      )
    }

    // Update the landing page color
    const updatedAgencyForm = await prisma.agencyForm.update({
      where: { id: agencyForm.id },
      data: {
        landingPageColor,
        updatedAt: new Date(),
      }
    })

    return NextResponse.json({
      success: true,
      message: "Landing page color updated successfully",
      data: {
        landingPageColor: updatedAgencyForm.landingPageColor
      }
    })

  } catch (error) {
    console.error("Update landing page color error:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}