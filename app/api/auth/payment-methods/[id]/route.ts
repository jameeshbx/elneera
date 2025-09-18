import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient, type Prisma } from "@prisma/client"

const prisma = new PrismaClient()

// Get a specific payment method
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id },
      include: {
        qrCode: true,
        dmc: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!paymentMethod) {
      return NextResponse.json({ error: "Payment method not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: paymentMethod,
    })
  } catch (error) {
    console.error("Error fetching payment method:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch payment method",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Update a payment method
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { type } = body

    let updateData: Prisma.PaymentMethodUpdateInput = {
      type,
      updatedAt: new Date(),
    }

    // Handle different payment method types
    switch (type) {
      case "BANK_ACCOUNT":
        updateData = {
          ...updateData,
          name: body.accountHolderName,
          identifier: body.accountNumber,
          notes: body.notes, // Keep only valid properties
        }
        break

    

      case "UPI":
        updateData = {
          ...updateData,
          name: body.upiProvider,
          identifier: body.upiId,
          upiProvider: body.upiProvider,
        }
        break

      case "PAYMENT_GATEWAY":
        updateData = {
          ...updateData,
          name: "Payment Gateway",
          identifier: body.paymentLink,
          paymentLink: body.paymentLink,
        }
        break
    }

    const paymentMethod = await prisma.paymentMethod.update({
      where: { id },
      data: updateData,
      include: {
        qrCode: true,
        dmc: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: paymentMethod,
      message: "Payment method updated successfully",
    })
  } catch (error) {
    console.error("Error updating payment method:", error)
    return NextResponse.json(
      {
        error: "Failed to update payment method",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Delete a specific payment method
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Soft delete by setting isActive to false
    const paymentMethod = await prisma.paymentMethod.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({
      success: true,
      data: paymentMethod,
      message: "Payment method deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting payment method:", error)
    return NextResponse.json(
      {
        error: "Failed to delete payment method",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
