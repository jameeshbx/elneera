// app/api/dmc-payment/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { Prisma, PrismaClient } from "@prisma/client"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

const prisma = new PrismaClient()

// GET handler to fetch payment details
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const enquiryId = searchParams.get("enquiryId")
  const dmcId = searchParams.get("dmcId")

  try {
    const whereClause: {
      enquiryId?: string;
      dmcId?: string;
    } = {}

    if (enquiryId) {
      whereClause.enquiryId = enquiryId
    }

    if (dmcId) {
      whereClause.dmcId = dmcId
    }

    if (!enquiryId && !dmcId) {
      return NextResponse.json({ error: "Either Enquiry ID or DMC ID is required" }, { status: 400 })
    }

    const payments = await prisma.dmcPayment.findMany({
      where: whereClause,
      include: {
        dmc: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        enquiry: {
          select: {
            id: true,
            name: true,
            email: true,
            currency: true,
          },
        },
        receiptFile: {
          select: {
            id: true,
            url: true,
            name: true,
            size: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(payments, { status: 200 })
  } catch (error) {
    console.error("Error fetching DMC payments:", error)
    return NextResponse.json({ error: "Failed to fetch payment details" }, { status: 500 })
  }
}

// POST handler to save payment details
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type")

    let dmcId = ""
    let enquiryId = ""
    let paymentData: {
      amountPaid: string
      paymentDate: string
      transactionId: string | null
      paymentChannel: string
      paymentStatus: string
      totalCost: string
      currency: string
      selectedBank?: string
      dmcName?: string
      upiId?: string
    } = {
      amountPaid: "",
      paymentDate: new Date().toISOString(),
      transactionId: null,
      paymentChannel: "Bank transfer ( manual entry )",
      paymentStatus: "PENDING",
      totalCost: "0",
      currency: "USD",
    }

    let receiptFileId: string | null = null
    let receiptUrl: string | null = null

    if (contentType?.includes("multipart/form-data")) {
      const formData = await req.formData()
      const file = formData.get("receipt") as File | null

      // Handle file upload if exists
      if (file && file.size > 0) {
        try {
          // Generate a unique filename to avoid conflicts
          const timestamp = Date.now()
          const fileExtension = file.name.split('.').pop()
          const uniqueFileName = `payment-receipt-${timestamp}.${fileExtension}`
          
          // Convert file to buffer
          const bytes = await file.arrayBuffer()
          const buffer = Buffer.from(bytes)
          
          // Create uploads directory if it doesn't exist
          const uploadsDir = join(process.cwd(), 'public/uploads/payments')
          try {
            await mkdir(uploadsDir, { recursive: true })
          } catch {
            console.log('Uploads directory already exists or cannot be created')
          }
          
          // Save file to filesystem
          const filePath = join(uploadsDir, uniqueFileName)
          await writeFile(filePath, buffer)
          
          // Create URL for the file
          const fileUrl = `/uploads/payments/${uniqueFileName}`
          
          // Save file record in database
          const savedFile = await prisma.file.create({
            data: {
              name: file.name,
              type: file.type,
              size: file.size,
              url: fileUrl,
            },
          })

          receiptFileId = savedFile.id
          receiptUrl = fileUrl
          
          console.log("File saved successfully:", { id: savedFile.id, url: savedFile.url })
        } catch (fileError) {
          console.error("Error saving file:", fileError)
          return NextResponse.json(
            { error: "Failed to save file", details: String(fileError) },
            { status: 500 }
          )
        }
      }

      // Get other form data
      dmcId = formData.get("dmcId") as string
      enquiryId = formData.get("enquiryId") as string

      // Update payment data with form values
      paymentData = {
        amountPaid: (formData.get("amountPaid") as string) || "0",
        paymentDate: (formData.get("paymentDate") as string) || new Date().toISOString(),
        transactionId: (formData.get("transactionId") as string) || null,
        paymentChannel: (formData.get("paymentChannel") as string) || "Bank transfer ( manual entry )",
        paymentStatus: (formData.get("paymentStatus") as string) || "PENDING",
        totalCost: (formData.get("totalCost") as string) || "0",
        currency: (formData.get("currency") as string) || "USD",
        selectedBank: (formData.get("selectedBank") as string) || undefined,
        dmcName: (formData.get("dmcName") as string) || "",
        upiId: (formData.get("upiId") as string) || undefined,
      }
    } else {
      // Handle JSON request
      const data = await req.json()
      dmcId = data.dmcId
      enquiryId = data.enquiryId
      paymentData = {
        ...paymentData,
        ...data,
        transactionId: data.transactionId || null,
        selectedBank: data.selectedBank || undefined,
        dmcName: data.dmcName || "",
        upiId: data.upiId || undefined,
      }
    }

    if (!dmcId || !enquiryId) {
      return NextResponse.json({ error: "DMC ID and Enquiry ID are required" }, { status: 400 })
    }

    const statusMap: Record<string, 'PENDING' | 'PARTIAL' | 'PAID'> = {
      'Partial': "PARTIAL",
      'partial': "PARTIAL",
      'PARTIAL': "PARTIAL",
      'Paid': "PAID", 
      'paid': "PAID",
      'PAID': "PAID",
      'Pending': "PENDING",
      'pending': "PENDING",
      'PENDING': "PENDING"
    }

    const mappedStatus = (statusMap[paymentData.paymentStatus] || "PENDING") as 'PENDING' | 'PARTIAL' | 'PAID'

    // Create invoice object with all payment form details
    const invoiceData = {
      dmcName: paymentData.dmcName,
      itineraryReference: `ITN-${Date.now()}`,
      totalCost: Number.parseFloat(paymentData.totalCost) || 0,
      amountPaid: Number.parseFloat(paymentData.amountPaid) || 0,
      paymentDate: paymentData.paymentDate,
      remainingBalance: Math.max(
        0,
        (Number.parseFloat(paymentData.totalCost) || 0) - (Number.parseFloat(paymentData.amountPaid) || 0)
      ),
      paymentStatus: mappedStatus,
      paymentChannel: paymentData.paymentChannel,
      transactionId: paymentData.transactionId,
      selectedBank: paymentData.selectedBank,
      currency: paymentData.currency,
      upiId: paymentData.upiId,
      generatedAt: new Date().toISOString(),
      enquiryId: enquiryId,
      dmcId: dmcId
    }


    // Prepare the payment data with proper typing for Prisma create
    const paymentCreateData: Prisma.DmcPaymentUncheckedCreateInput = {
      dmcId,
      enquiryId,
      itineraryReference: invoiceData.itineraryReference,
      totalCost: invoiceData.totalCost,
      amountPaid: invoiceData.amountPaid,
      remainingBalance: invoiceData.remainingBalance,
      paymentDate: new Date(paymentData.paymentDate || new Date()),
      paymentStatus: mappedStatus,
      paymentChannel: paymentData.paymentChannel || "Bank transfer ( manual entry )",
      transactionId: paymentData.transactionId,
      selectedBank: paymentData.selectedBank,
      invoice: invoiceData as unknown as Prisma.InputJsonValue, // Cast to Prisma's JSON type
    }

    // Add receipt fields
    paymentCreateData.receiptUrl = receiptUrl || null
    paymentCreateData.receiptFileId = receiptFileId || null

    const newPayment = await prisma.dmcPayment.create({
      data: paymentCreateData,
      include: {
        dmc: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        enquiry: {
          select: {
            id: true,
            name: true,
            email: true,
            currency: true,
          },
        },
        receiptFile: receiptFileId ? {
          select: {
            id: true,
            url: true,
            name: true,
            size: true,
            type: true,
          },
        } : false,
      },
    })

    return NextResponse.json(newPayment, { status: 201 })
  } catch (error) {
    console.error("Error creating DMC payment:", error)
    return NextResponse.json(
      {
        error: "Failed to save payment details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}