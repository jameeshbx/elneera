import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { S3Service } from "@/lib/s3-service"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("qrCode") as File

    if (!file) {
      return NextResponse.json({ error: "No QR code file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, and GIF are allowed." }, { status: 400 })
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size too large. Maximum 5MB allowed." }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const filename = `qr_${timestamp}_${originalName}`
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Upload file to S3
    try {
      const fileInfo = await S3Service.uploadFile(
        buffer,
        filename,
        file.type,
        'qr-codes' // Store in qr-codes folder in S3
      )
      
      // Save file info to database
      const fileRecord = await prisma.file.create({
        data: {
          name: filename,
          url: fileInfo.url,
          size: file.size,
          type: file.type,
        },
      })

    // Create payment method record
    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        type: "QR_CODE",
        name: "QR Code Payment",
        identifier: filename,
        qrCodeId: fileRecord.id,
        isActive: true,
      },
      include: {
        qrCode: true,
      },
    })

      console.log("QR Code payment method saved:", paymentMethod)

      return NextResponse.json({
        success: true,
        data: paymentMethod,
        message: "QR code uploaded and saved successfully",
      })
    } catch (s3Error) {
      console.error("Error uploading file to S3:", s3Error)
      throw new Error(`Failed to upload file to S3: ${s3Error instanceof Error ? s3Error.message : 'Unknown error'}`)
    }
  } catch (error) {
    console.error("Error uploading QR code:", error)
    return NextResponse.json(
      {
        error: "Failed to upload QR code",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
