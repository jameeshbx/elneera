import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

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

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `${randomUUID()}-${file.name}`;
  const filePath = path.join(process.cwd(), "public/uploads", fileName);
  const imageUrl = `/uploads/${fileName}`;

  try {
    await writeFile(filePath, buffer);

    const fileEntry = await prisma.file.create({
      data: {
        name: file.name,
        size: file.size,
        type: file.type,
        url: imageUrl,
      },
    });

    await prisma.manager.update({
      where: { id: managerId },
      data: {
        profileId: fileEntry.id,
      },
    });

    return NextResponse.json({ imageUrl }, { status: 200 });
  } catch (error) {
    console.error("Manager image upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
