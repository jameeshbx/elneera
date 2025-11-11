import {  NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import prisma from "@/lib/prisma"

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Fetch the agency's business license path from database
    const agency = await prisma.agencyForm.findUnique({
      where: { id: session.user.id },
      select: { businessLicensePath: true }
    })

    if (!agency?.businessLicensePath) {
      return NextResponse.json(
        { error: "No business license found" },
        { status: 404 }
      )
    }

    // Extract the S3 key from the full URL
    // If it's a full URL like: https://bucket.s3.region.amazonaws.com/path/file.pdf
    let s3Key = agency.businessLicensePath
    
    if (s3Key.includes('.amazonaws.com/')) {
      s3Key = s3Key.split('.amazonaws.com/')[1]
    } else if (s3Key.includes('.com/')) {
      s3Key = s3Key.split('.com/')[1]
    }

    // Generate a fresh presigned URL (valid for 1 hour)
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: s3Key,
    })

    const downloadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    })

    // Extract filename
    const filename = s3Key.split('/').pop() || 'business-license.pdf'

    return NextResponse.json({
      downloadUrl,
      filename,
    })
  } catch (error) {
    console.error("Error generating download URL:", error)
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    )
  }
}