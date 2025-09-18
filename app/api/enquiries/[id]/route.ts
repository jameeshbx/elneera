import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET - Fetch single enquiry by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const enquiry = await prisma.enquiries.findUnique({
      where: { id },
    })

    if (!enquiry) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 })
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

// PUT - Update enquiry
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const updatedEnquiry = await prisma.enquiries.update({
      where: { id },
      data: body,
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
