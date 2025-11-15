// app/api/customer-payment/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { Prisma, PrismaClient } from "@prisma/client"
import { S3Service } from "@/lib/s3-service"
import nodemailer from 'nodemailer'

const prisma = new PrismaClient()

// GET handler - REMOVED customerId parameter
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const enquiryId = searchParams.get("enquiryId")

  try {
    if (!enquiryId) {
      return NextResponse.json({ error: "Enquiry ID is required" }, { status: 400 })
    }

    const payments = await prisma.customerPayment.findMany({
      where: { enquiryId },
      include: {
        enquiry: {
          select: {
            id: true,
            name: true,
            email: true,
            currency: true,
            agencyId: true,
            customerId: true,
            agency: {
              select: {
                id: true,
                name: true,
              },
            },
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
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

    return NextResponse.json({ success: true, data: payments }, { status: 200 })
  } catch (error) {
    console.error("Error fetching customer payments:", error)
    return NextResponse.json({ error: "Failed to fetch payment details" }, { status: 500 })
  }
}

// POST handler - REMOVED customerId handling
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type")

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
      customerName?: string
      upiId?: string
      itineraryReference?: string
    } = {
      amountPaid: "",
      paymentDate: new Date().toISOString(),
      transactionId: null,
      paymentChannel: "Bank transfer ( manual entry )",
      paymentStatus: "PENDING",
      totalCost: "0",
      currency: "USD",
      itineraryReference: "",
    }

    let receiptFileId: string | null = null
    let receiptUrl: string | null = null

    if (contentType?.includes("multipart/form-data")) {
      const formData = await req.formData()
      const file = formData.get("receipt") as File | null

      // Handle file upload if exists
      if (file && file.size > 0) {
        try {
          const timestamp = Date.now()
          const fileExtension = file.name.split('.').pop()
          const uniqueFileName = `customer-payment-receipt-${timestamp}.${fileExtension}`
          
          const bytes = await file.arrayBuffer()
          const buffer = Buffer.from(bytes)
          
          try {
            const fileInfo = await S3Service.uploadFile(
              buffer,
              uniqueFileName,
              file.type,
              'customer-payments'
            )
            
            const savedFile = await prisma.file.create({
              data: {
                name: file.name,
                type: file.type,
                size: file.size,
                url: fileInfo.url,
              },
            })

            receiptFileId = savedFile.id
            receiptUrl = fileInfo.url
            
            console.log("File uploaded to S3 successfully:", { 
              id: savedFile.id, 
              url: fileInfo.url 
            })
          } catch (fileError) {
            console.error("Error saving file to S3:", fileError)
            return NextResponse.json(
              { error: "Failed to save file to S3", details: String(fileError) },
              { status: 500 }
            )
          }
        } catch (error) {
          console.error("Error processing file upload:", error)
          return NextResponse.json(
            { error: "Failed to process file upload", details: String(error) },
            { status: 500 }
          )
        }
      }

      // Get form data - REMOVED customerId
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
        customerName: (formData.get("customerName") as string) || "",
        upiId: (formData.get("upiId") as string) || undefined,
        itineraryReference: (formData.get("itineraryReference") as string) || `ITN-${Date.now()}`,
      }
    } else {
      // Handle JSON request
      const data = await req.json()
      enquiryId = data.enquiryId
      // REMOVED: customerId extraction
      paymentData = {
        ...paymentData,
        ...data,
        transactionId: data.transactionId || null,
        selectedBank: data.selectedBank || undefined,
        customerName: data.customerName || "",
        upiId: data.upiId || undefined,
        itineraryReference: data.itineraryReference || `ITN-${Date.now()}`,
      }
    }

    // Updated validation - REMOVED customerId check
    if (!enquiryId) {
      return NextResponse.json({ 
        error: "Enquiry ID is required" 
      }, { status: 400 })
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

    // Create invoice object - REMOVED customerId
    const invoiceData = {
      customerName: paymentData.customerName,
      itineraryReference: paymentData.itineraryReference,
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
    }

    // Prepare payment data - REMOVED customerId
    const paymentCreateData: Prisma.CustomerPaymentUncheckedCreateInput = {
      enquiryId,
      itineraryReference: paymentData.itineraryReference || `ITN-${Date.now()}`,
      totalCost: invoiceData.totalCost,
      amountPaid: invoiceData.amountPaid,
      remainingBalance: invoiceData.remainingBalance,
      paymentDate: new Date(paymentData.paymentDate || new Date()),
      paymentStatus: mappedStatus,
      paymentChannel: paymentData.paymentChannel || "Bank transfer ( manual entry )",
      transactionId: paymentData.transactionId,
      selectedBank: paymentData.selectedBank,
      upiId: paymentData.upiId,
      invoice: invoiceData as unknown as Prisma.InputJsonValue,
    }

    // Add receipt fields
    paymentCreateData.receiptUrl = receiptUrl || null
    paymentCreateData.receiptFileId = receiptFileId || null

    const newPayment = await prisma.customerPayment.create({
      data: paymentCreateData,
      include: {
        enquiry: {
          select: {
            id: true,
            name: true,
            email: true,
            currency: true,
            agencyId: true,
            customerId: true,
            agency: {
              select: {
                id: true,
                name: true,
              },
            },
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
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

    // Send email notification - customer accessed through enquiry
    if (newPayment.enquiry?.customer?.email) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: newPayment.enquiry.customer.email,
          subject: `Payment Confirmation - ${paymentData.itineraryReference}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #183F30;">Payment Confirmation</h2>
              <p>Dear ${newPayment.enquiry.customer.name},</p>
              <p>Your payment has been received successfully.</p>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #183F30; margin-top: 0;">Payment Details:</h3>
                <p><strong>Itinerary Reference:</strong> ${paymentData.itineraryReference}</p>
                <p><strong>Amount Paid:</strong> ${paymentData.currency} ${paymentData.amountPaid}</p>
                <p><strong>Total Cost:</strong> ${paymentData.currency} ${paymentData.totalCost}</p>
                <p><strong>Remaining Balance:</strong> ${paymentData.currency} ${invoiceData.remainingBalance.toFixed(2)}</p>
                <p><strong>Payment Status:</strong> ${mappedStatus}</p>
                <p><strong>Payment Date:</strong> ${new Date(paymentData.paymentDate).toLocaleDateString()}</p>
              </div>
              
              <p>Thank you for your payment!</p>
              <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
            </div>
          `,
        });

        console.log("Payment confirmation email sent successfully");
      } catch (emailError) {
        console.error("Error sending payment email:", emailError);
        // Don't fail the request if email sending fails
      }
    }

    return NextResponse.json({ success: true, data: newPayment }, { status: 201 })
  } catch (error) {
    console.error("Error creating customer payment:", error)
    return NextResponse.json(
      {
        error: "Failed to save payment details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}