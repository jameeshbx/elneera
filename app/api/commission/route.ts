// api/commission/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET - Fetch commission details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const enquiryId = searchParams.get("enquiryId")
    const dmcId = searchParams.get("dmcId")

    if (!enquiryId) {
      return NextResponse.json({ error: "Enquiry ID is required" }, { status: 400 })
    }

    let commission;

    if (dmcId) {
      commission = await prisma.commission.findUnique({
        where: {
          enquiryId_dmcId: {
            enquiryId: enquiryId,
            dmcId: dmcId,
          },
        },
        include: {
          enquiry: { select: { name: true, locations: true, email: true } },
          dmc: { select: { id: true, name: true, email: true, contactPerson: true } },
        },
      });
    } else {
      commission = await prisma.commission.findFirst({
        where: {
          enquiryId: enquiryId,
        },
        include: {
          enquiry: { select: { name: true, locations: true, email: true } },
          dmc: { select: { id: true, name: true, email: true, contactPerson: true } },
        },
      });
    }

    if (!commission) {
      return NextResponse.json({ error: "Commission not found" }, { status: 404 })
    }

    return NextResponse.json(commission);
  } catch (error) {
    console.error("Error fetching commission:", error)
    return NextResponse.json({ error: "Failed to fetch commission" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Create new commission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      enquiryId,
      dmcId,
      quotationAmount,
      commissionType,
      commissionAmount,
      markupPrice,
      comments,
    } = body

    if (!enquiryId || !dmcId || !quotationAmount || !commissionType || !commissionAmount || !markupPrice) {
      return NextResponse.json(
        { error: "All commission fields are required" },
        { status: 400 }
      )
    }

    // Verify enquiry exists
    const enquiry = await prisma.enquiries.findUnique({
      where: { id: enquiryId },
      select: { id: true, name: true },
    })

    if (!enquiry) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 })
    }

    // Verify DMC exists
    const dmc = await prisma.dMCForm.findUnique({
      where: { id: dmcId },
      select: { id: true, name: true },
    })

    if (!dmc) {
      return NextResponse.json({ error: "DMC not found" }, { status: 404 })
    }

    const commission = await prisma.commission.create({
      data: {
        enquiryId,
        dmcId,
        quotationAmount: parseFloat(quotationAmount),
        commissionType: commissionType as "FLAT" | "PERCENTAGE",
        commissionAmount: parseFloat(commissionAmount),
        markupPrice: parseFloat(markupPrice),
        comments,
      },
      include: {
        enquiry: {
          select: {
            name: true,
            locations: true,
            email: true,
          },
        },
        dmc: {
          select: {
            name: true,
            email: true,
            contactPerson: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: "Commission created successfully",
      data: commission,
    })
  } catch (error) {
    console.error("Error creating commission:", error)
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Commission already exists for this enquiry and DMC" },
        { status: 409 }
      )
    }
    
    return NextResponse.json({ error: "Failed to create commission" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - Update existing commission
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      enquiryId,
      dmcId,
      quotationAmount,
      commissionType,
      commissionAmount,
      markupPrice,
      comments,
    } = body

    if (id) {
      // Update by ID
      const commission = await prisma.commission.update({
        where: { id },
        data: {
          ...(quotationAmount && { quotationAmount: parseFloat(quotationAmount) }),
          ...(commissionType && { commissionType: commissionType as "FLAT" | "PERCENTAGE" }),
          ...(commissionAmount && { commissionAmount: parseFloat(commissionAmount) }),
          ...(markupPrice && { markupPrice: parseFloat(markupPrice) }),
          ...(comments !== undefined && { comments }),
          updatedAt: new Date(),
        },
        include: {
          enquiry: {
            select: {
              name: true,
              locations: true,
              email: true,
            },
          },
          dmc: {
            select: {
              name: true,
              email: true,
              contactPerson: true,
            },
          },
        },
      })

      return NextResponse.json({
        success: true,
        message: "Commission updated successfully",
        data: commission,
      })
    } else if (enquiryId && dmcId) {
      // Update by enquiry and DMC IDs (upsert)
      const commission = await prisma.commission.upsert({
        where: {
          enquiryId_dmcId: {
            enquiryId: enquiryId,
            dmcId: dmcId,
          },
        },
        create: {
          enquiryId,
          dmcId,
          quotationAmount: parseFloat(quotationAmount),
          commissionType: commissionType as "FLAT" | "PERCENTAGE",
          commissionAmount: parseFloat(commissionAmount),
          markupPrice: parseFloat(markupPrice),
          comments,
        },
        update: {
          quotationAmount: parseFloat(quotationAmount),
          commissionType: commissionType as "FLAT" | "PERCENTAGE",
          commissionAmount: parseFloat(commissionAmount),
          markupPrice: parseFloat(markupPrice),
          comments,
          updatedAt: new Date(),
        },
        include: {
          enquiry: {
            select: {
              name: true,
              locations: true,
              email: true,
            },
          },
          dmc: {
            select: {
              name: true,
              email: true,
              contactPerson: true,
            },
          },
        },
      })

      return NextResponse.json({
        success: true,
        message: "Commission updated successfully",
        data: commission,
      })
    } else {
      return NextResponse.json(
        { error: "Either ID or both enquiryId and dmcId are required" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Error updating commission:", error)
    return NextResponse.json({ error: "Failed to update commission" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - Remove commission
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const enquiryId = searchParams.get("enquiryId")
    const dmcId = searchParams.get("dmcId")

    if (id) {
      await prisma.commission.delete({
        where: { id },
      })
    } else if (enquiryId && dmcId) {
      await prisma.commission.delete({
        where: {
          enquiryId_dmcId: {
            enquiryId: enquiryId,
            dmcId: dmcId,
          },
        },
      })
    } else {
      return NextResponse.json(
        { error: "Either ID or both enquiryId and dmcId are required" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Commission deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting commission:", error)
    return NextResponse.json({ error: "Failed to delete commission" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}