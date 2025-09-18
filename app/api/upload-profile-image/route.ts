import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the form data
    const formData = await request.formData()
    const file = formData.get("profileImage") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const validImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!validImageTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Please upload JPEG, PNG, GIF, or WEBP images only.",
        },
        { status: 400 },
      )
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: "File size too large. Please upload images smaller than 5MB.",
        },
        { status: 400 },
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profileImage: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create a unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop()
    const fileName = `profile-${user.id}-${timestamp}.${fileExtension}`

    // For this example, we'll use a simple base64 data URL approach
    // In production, you'd want to use a proper file storage service like AWS S3, Cloudinary, etc.
    const base64String = buffer.toString("base64")
    const dataUrl = `data:${file.type};base64,${base64String}`

    let fileRecord
    if (user.profileImage) {
      // Update existing profile image file
      fileRecord = await prisma.file.update({
        where: { id: user.profileImage.id },
        data: {
          url: dataUrl,
          name: fileName,
          size: file.size,
          type: file.type,
          updatedAt: new Date(),
        },
      })
    } else {
      // Create new file record and link to user
      fileRecord = await prisma.file.create({
        data: {
          url: dataUrl,
          name: fileName,
          size: file.size,
          type: file.type,
        },
      })

      // Update user to link the new profile image
      await prisma.user.update({
        where: { id: user.id },
        data: {
          profileImgId: fileRecord.id,
        },
      })
    }

    return NextResponse.json({
      success: true,
      imageUrl: fileRecord.url,
      message: "Profile image uploaded successfully",
    })
  } catch (error) {
    console.error("Error uploading profile image:", error)
    return NextResponse.json(
      {
        error: "Internal server error. Please try again later.",
      },
      { status: 500 },
    )
  }
}
