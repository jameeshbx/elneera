import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { S3Service } from "@/lib/s3-service"

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

    const isAuthorized = user.userType === "TRAVEL_AGENCY" || user.role === "ADMIN" || user.role === "SUPER_ADMIN"

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

    // Upload the logo to S3
    let logoUrl: string
    try {
      logoUrl = await uploadToS3(logoFile, "logos")
      console.log("Logo uploaded to S3:", logoUrl)
    } catch (uploadError) {
      console.error("S3 upload error:", uploadError)
      return NextResponse.json(
        { 
          error: "Failed to upload logo to storage",
          details: uploadError instanceof Error ? uploadError.message : "Unknown error"
        },
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

    // Update the agency form with the new logo URL
    const updatedAgencyForm = await prisma.agencyForm.update({
      where: { id: agencyForm.id },
      data: {
        logoPath: logoUrl,
        updatedAt: new Date(),
      }
    })

    // Return success response with the S3 URL
    return NextResponse.json({
      success: true,
      message: "Company logo updated successfully",
      logoUrl: logoUrl,
      data: {
        id: updatedAgencyForm.id,
        logoUrl: logoUrl,
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