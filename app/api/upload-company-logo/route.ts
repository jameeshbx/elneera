import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { existsSync } from "fs"

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

    // Parse form data
    const formData = await request.formData()
    const logoFile = formData.get("companyLogo") as File

    if (!logoFile || !logoFile.size) {
      return NextResponse.json({ error: "No logo file provided" }, { status: 400 })
    }

    // Validate file type and size
    const validImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]
    if (!validImageTypes.includes(logoFile.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload JPEG, PNG, GIF, WEBP, or SVG images only." },
        { status: 400 }
      )
    }

    if (logoFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      )
    }

    // Save the new logo
    let logoPath: string
    try {
      logoPath = await saveFile(logoFile, "logos")
    } catch (uploadError) {
      console.error("File upload error:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload logo" },
        { status: 500 }
      )
    }

    // Update agency form with new logo
    const agencyForm = await prisma.agencyForm.findFirst({
      where: { createdBy: user.id }
    })

    if (!agencyForm) {
      return NextResponse.json(
        { error: "Agency form not found. Please complete your agency registration first." },
        { status: 404 }
      )
    }

    // Update the agency form with the new logo path
    const updatedAgencyForm = await prisma.agencyForm.update({
      where: { id: agencyForm.id },
      data: {
        logoPath,
        updatedAt: new Date(),
      }
    })

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Company logo updated successfully",
      logoUrl: logoPath,
      data: {
        id: updatedAgencyForm.id,
        logoUrl: logoPath,
      }
    })

  } catch (error) {
    console.error("Company logo upload error:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}