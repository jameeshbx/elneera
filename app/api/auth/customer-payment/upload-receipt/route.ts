import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Allowed file types
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"]

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const paymentId = formData.get("paymentId") as string

    // Validate required fields
    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    if (!paymentId) {
      return NextResponse.json({ success: false, error: "Payment ID is required" }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: "File size exceeds 10MB limit" }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Only PDF, JPG, PNG, and WebP files are allowed",
        },
        { status: 400 },
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop()
    const fileName = `receipt-${paymentId}-${timestamp}.${fileExtension}`

    // Upload to Vercel Blob
    const blob = await put(fileName, file, {
      access: "public",
      addRandomSuffix: false,
    })

    // TODO: Update database with receipt information
    // You would typically update your payment record here with the receipt URL
    // Example:
    // await updatePaymentReceipt(paymentId, {
    //   receiptUrl: blob.url,
    //   receiptFileName: fileName,
    //   uploadedAt: new Date().toISOString()
    // })

    return NextResponse.json({
      success: true,
      data: {
        receiptUrl: blob.url,
        fileName: fileName,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: new Date().toISOString(),
      },
      message: "Receipt uploaded successfully",
    })
  } catch (error) {
    console.error("Receipt upload error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload receipt. Please try again.",
      },
      { status: 500 },
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ success: false, error: "Method not allowed" }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ success: false, error: "Method not allowed" }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ success: false, error: "Method not allowed" }, { status: 405 })
}
