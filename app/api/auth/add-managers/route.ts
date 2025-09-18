import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, username, password, profileId } = body;

    if (!name || !phone || !email || !username || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newManager = await prisma.manager.create({
      data: {
        name,
        phone,
        email,
        username,
        password,
        status: "INACTIVE", // Ensure status is set
        profile: profileId
          ? {
              connect: {
                id: profileId,
              },
            }
          : undefined,
      },
    });

    return NextResponse.json(newManager, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating manager:", error);
    const errorMessage = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(
      { error: "Something went wrong", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const managers = await prisma.manager.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        phone: true, // Added phone since it's in your Manager interface
        username: true, // Added username since it's in your Manager interface
        createdAt: true, // Useful for "last logged in" display
        profile: {
          select: {
            url: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc' // Optional: sort by newest first
      }
    });

    const formattedManagers = managers.map(manager => ({
      id: manager.id,
      name: manager.name,
      email: manager.email,
      username: manager.username,
      phone: manager.phone,
      status: manager.status,
      profileImage: manager.profile?.url || null,
      lastLoggedIn: manager.createdAt.toLocaleDateString() // Format date as string
    }));

    return NextResponse.json(formattedManagers);
  } catch (error: unknown) {
    console.error("Error fetching managers:", error);
    const errorMessage = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(
      { error: "Failed to fetch managers", details: errorMessage },
      { status: 500 }
    );
  }
}