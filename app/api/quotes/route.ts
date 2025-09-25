import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET - Fetch all quotes or filter by enquiryId/dmcId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const enquiryId = searchParams.get('enquiryId')
    const dmcId = searchParams.get('dmcId')
    const id = searchParams.get('id')

    let where = {}
    
    if (id) {
      where = { id }
    } else if (enquiryId && dmcId) {
      where = { enquiryId, dmcId }
    } else if (enquiryId) {
      where = { enquiryId }
    } else if (dmcId) {
      where = { dmcId }
    }

    const quotes = await prisma.quotes.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        dmc: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: quotes })
  } catch (error) {
    console.error('Error fetching quotes:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quotes' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Create a new quote
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.enquiryId || !body.dmcId || !body.amount ) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if a quote already exists for this enquiry and DMC
    const existingQuote = await prisma.quotes.findFirst({
      where: {
        enquiryId: body.enquiryId,
        dmcId: body.dmcId,
      },
    })

    if (existingQuote) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'A quote already exists for this enquiry and DMC',
          data: existingQuote
        },
        { status: 400 }
      )
    }

    // Create the new quote
    const quote = await prisma.quotes.create({
      data: {
        enquiryId: body.enquiryId,
        dmcId: body.dmcId,
        amount: parseFloat(body.amount),
        comments: body.comments || null,
        currency: body.currency || null,
        status: body.status || 'PENDING',
      },
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Quote created successfully',
      data: quote 
    })
  } catch (error) {
    console.error('Error creating quote:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create quote',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - Update an existing quote
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Quote ID is required' },
        { status: 400 }
      )
    }

    // Check if the quote exists
    const existingQuote = await prisma.quotes.findUnique({
      where: { id },
    })

    if (!existingQuote) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      )
    }

    // Define the update data type using Prisma's generated types
    type QuoteUpdateData = {
      enquiryId?: string;
      dmcId?: string;
      amount?: number;
      currency?: string | null;
      comments?: string | null;
      status?: string;
      updatedAt?: Date;
    };

    // Prepare the data to update
    const dataToUpdate: QuoteUpdateData = {}
    
    if (updateData.amount !== undefined) {
      dataToUpdate.amount = parseFloat(updateData.amount)
    }
    if (updateData.currency !== undefined) {
      dataToUpdate.currency = updateData.currency
    }
    if (updateData.comments !== undefined) {
      dataToUpdate.comments = updateData.comments
    }
    if (updateData.status !== undefined) {
      dataToUpdate.status = updateData.status
    }
    if (updateData.dmcId !== undefined) {
      dataToUpdate.dmcId = updateData.dmcId
    }

    // Update the quote
    const updatedQuote = await prisma.quotes.update({
      where: { id },
      data: dataToUpdate,
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Quote updated successfully',
      data: updatedQuote 
    })
  } catch (error) {
    console.error('Error updating quote:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update quote',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
