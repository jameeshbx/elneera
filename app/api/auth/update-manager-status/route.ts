import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// PATCH => Update manager status
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, status } = body

    // Validation
    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields: id and status" }, { status: 400 })
    }

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return NextResponse.json({ error: "Invalid status. Must be ACTIVE or INACTIVE" }, { status: 400 })
    }

    // Check if manager exists
    const existingManager = await prisma.manager.findUnique({
      where: { id },
    })

    if (!existingManager) {
      return NextResponse.json({ error: "Manager not found" }, { status: 404 })
    }

    // Update manager status
    const updatedManager = await prisma.manager.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        username: true,
        password: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(updatedManager)
  } catch (error: unknown) {
    console.error("Error updating manager status:", error)
    return NextResponse.json(
      { error: "Something went wrong", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}


