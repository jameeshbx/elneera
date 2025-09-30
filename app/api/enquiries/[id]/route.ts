import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

// GET - Fetch single enquiry by ID (only if it belongs to the user)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params
    const userId = session.user.id;

    if (!userId) {
      return NextResponse.json({ error: "No userId found for user" }, { status: 403 });
    }

    const enquiry = await prisma.enquiries.findFirst({
      where: { 
        id,
        userId: userId // Only fetch if belongs to this user
      },
    })

    if (!enquiry) {
      return NextResponse.json({ error: "Enquiry not found or not authorized" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: enquiry,
    })
  } catch (error) {
    console.error("Error fetching enquiry:", error)
    return NextResponse.json({ error: "Failed to fetch enquiry" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - Update enquiry (only if it belongs to the user)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params
    const body = await request.json()
    const userId = session.user.id;

    if (!userId) {
      return NextResponse.json({ error: "No userId found for user" }, { status: 403 });
    }

    // Check if enquiry exists and belongs to this user
    const existingEnquiry = await prisma.enquiries.findFirst({
      where: { 
        id,
        userId: userId
      }
    });

    if (!existingEnquiry) {
      return NextResponse.json({ error: "Enquiry not found or not authorized" }, { status: 404 });
    }

    const updatedEnquiry = await prisma.enquiries.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Enquiry updated successfully",
      data: updatedEnquiry,
    })
  } catch (error) {
    console.error("Error updating enquiry:", error)
    return NextResponse.json({ error: "Failed to update enquiry" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - Delete enquiry (only if it belongs to the user)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params
    const userId = session.user.id;

    if (!userId) {
      return NextResponse.json({ error: "No userId found for user" }, { status: 403 });
    }

    // Check if enquiry exists and belongs to this user
    const existingEnquiry = await prisma.enquiries.findFirst({
      where: { 
        id,
        userId: userId
      }
    });

    if (!existingEnquiry) {
      return NextResponse.json({ error: "Enquiry not found or not authorized" }, { status: 404 });
    }

    await prisma.enquiries.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: "Enquiry deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting enquiry:", error)
    return NextResponse.json({ error: "Failed to delete enquiry" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}