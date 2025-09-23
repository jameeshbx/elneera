import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

// Create a single Prisma Client and reuse it
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});
if (process.env.NODE_ENV !== 'production') { 
  globalForPrisma.prisma = prisma;
}

type RouteParams = {
  id: string;
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<RouteParams> } // params is now a Promise
) {
  try {
    const { id } = await context.params; // Await the params promise
    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const user = await prisma.userForm.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        phoneNumber: true,
        status: true,
        createdAt: true,
        profileImage: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch user" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}