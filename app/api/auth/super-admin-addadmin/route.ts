import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
import * as bcrypt from "bcryptjs";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

// Initialize Prisma Client
const prisma = new PrismaClient();

// Define Zod schema for input validation
const adminSchema = z.object({
  name: z.string()
    .trim()
    .regex(/^[A-Za-z\s]{2,}$/, "Name must contain only letters and spaces (min 2 chars)"),
  phone: z.string()
    .regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
  email: z.string().trim().email("Invalid email address"),
  username: z.string()
    .trim()
    .regex(/^[A-Za-z0-9._-]{3,}$/, "Username must be at least 3 characters (letters, numbers, ., _, -)"),
  password: z.string()
    .regex(/^(?=.[A-Za-z])(?=.\d)(?=.*[^A-Za-z0-9]).{8,}$/, "Password must be 8+ chars with letters, digits, and a special character"),
});

// GET endpoint to list admins
export async function GET() {
  try {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        username: true,
        status: true,
        profile: { select: { url: true } },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(admins, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Full error:", error);
    return NextResponse.json(
      { message: "Failed to fetch admins" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Patch end point 
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const parsed = z.object({
      id: z.string().uuid(),
      status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
    }).safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { id, status } = parsed.data;

    const updated = await prisma.admin.update({
      where: { id },
      data: { status },
      select: {
        id: true, name: true, phone: true, email: true, username: true,
        status: true, profile: { select: { url: true } }, createdAt: true
      },
    });

    return NextResponse.json(updated, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("PATCH error:", error);
    return NextResponse.json({ message: "Failed to update status" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}


// POST endpoint to create a new admin
export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Validate required fields
    if (!formData.get("name") || !formData.get("phone") || !formData.get("email") || 
        !formData.get("username") || !formData.get("password")) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    const name = formData.get("name") as string;
    const phone = ((formData.get("phone") as string) || "").replace(/\D/g, "");
    const email = formData.get("email") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const profileImage = formData.get("profile") as File | null;

    // Validate input using Zod
    const validation = adminSchema.safeParse({ name, phone, email, username, password });

    if (!validation.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Check for existing email or username
    const [existingAdminByEmail, existingAdminByUsername] = await Promise.all([
      prisma.admin.findUnique({ where: { email } }),
      prisma.admin.findUnique({ where: { username } })
    ]);

    if (existingAdminByEmail) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 409 }
      );
    }

    if (existingAdminByUsername) {
      return NextResponse.json(
        { message: "Username already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    let profileId: string | undefined = undefined;

    // Handle profile image upload if present

       if (profileImage && profileImage.size > 0) {
        const file = profileImage as File; // ensure non-null inside try/catch
        try {
          const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
          const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  
          if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ message: "File size must be less than 5MB" }, { status: 400 });
          }
          if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ message: "Only JPEG, PNG, and WebP images are allowed" }, { status: 400 });
          }
  
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
  
          let fileUrl: string;
          const storedName = `${uuidv4()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
  
          if (process.env.BLOB_READ_WRITE_TOKEN) {
            const blob = await put(`admin-profiles/${storedName}`, buffer, {
              access: "public",
              contentType: file.type,
            });
            fileUrl = blob.url;
          } else {
            const uploadDir = path.join(process.cwd(), "public", "uploads");
            await fs.mkdir(uploadDir, { recursive: true });
            const filePath = path.join(uploadDir, storedName);
            await fs.writeFile(filePath, buffer);
            fileUrl = `/uploads/${storedName}`;
          }
  
          const newFile = await prisma.file.create({
            data: {
              url: fileUrl,
              name: file.name,
              size: file.size,
              type: file.type,
            },
          });
          profileId = newFile.id;
        } catch (fileError) {
          console.error("Detailed file upload error (primary path):", fileError);
          // Fallback: write to public/uploads even if Blob branch failed
          try {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const storedName = `${uuidv4()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
            const uploadDir = path.join(process.cwd(), "public", "uploads");
            await fs.mkdir(uploadDir, { recursive: true });
            const filePath = path.join(uploadDir, storedName);
            await fs.writeFile(filePath, buffer);
            const localUrl = `/uploads/${storedName}`;
  
            const newFile = await prisma.file.create({
              data: {
                url: localUrl,
                name: file.name,
                size: file.size,
                type: file.type,
              },
            });
            profileId = newFile.id;
          } catch (fallbackError) {
            console.error("Fallback upload error:", fallbackError);
            return NextResponse.json(
              {
                message: "Failed to upload profile image",
                error: fallbackError instanceof Error ? fallbackError.message : "Unknown error",
              },
              { status: 500 }
            );
          }
        }
      }

    // Create new admin
    const newAdmin = await prisma.admin.create({
      data: {
        name,
        phone,
        email,
        username,
        password: hashedPassword,
        status: "INACTIVE",
        profileId,
        userId: uuidv4(),
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        username: true,
        status: true,
        profile: {
          select: {
            url: true
          }
        },
        createdAt: true
      }
    });

    return NextResponse.json(
      { 
        success: true,
        message: "Admin created successfully", 
        admin: newAdmin 
      },
      { 
        status: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error) {
    console.error("Full error:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Failed to create admin",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export const OPTIONS = async () => {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};