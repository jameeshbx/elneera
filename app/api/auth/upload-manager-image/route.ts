import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";
import { S3Service } from "@/lib/s3-service";

// POST request to upload manager's profile image
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("profileImage") as File;
  const managerId = formData.get("managerId") as string;

  if (!file || !managerId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files allowed" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be < 5MB" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${randomUUID()}-${file.name}`;
    
    // Upload to S3 using static method
    const fileInfo = await S3Service.uploadFile(
      buffer,
      fileName,
      file.type,
      "manager-profiles" // Store in manager-profiles folder in S3
    );

    // Store file metadata in database
    const fileEntry = await prisma.file.create({
      data: {
        name: file.name,
        size: file.size,
        type: file.type,
        url: fileInfo.url, // Store the full S3 URL
      },
    });

    // Update manager with the new profile image
    await prisma.manager.update({
      where: { id: managerId },
      data: {
        profileId: fileEntry.id,
      },
    });

    return NextResponse.json({ 
      imageUrl: fileInfo.url,
      fileId: fileEntry.id
    }, { status: 200 });
  } catch (error) {
    console.error("Manager image upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" }, 
      { status: 500 }
    );
  }
}
