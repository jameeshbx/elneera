import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import  prisma  from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";


// Allowing only POST for image upload
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("profileImage") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

   // Validate file type
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
  }

     // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `${randomUUID()}-${file.name}`;
  const filePath = path.join(process.cwd(), "public/uploads", fileName);

  try {
    await writeFile(filePath, buffer);

    // Optionally update user profile in DB with this image
    const imageUrl = `/uploads/${fileName}`;

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        // Add profileImage field in model if not already there
        // Example: profileImage: imageUrl
      }
    });

    return NextResponse.json({ imageUrl }, { status: 200 });
  } catch (error) {
    console.error("Error saving file:", error);
    return NextResponse.json({ error: "Failed to save file" }, { status: 500 });
  }
}

