import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient, PaymentMethodType } from "@prisma/client"
import { S3Service } from "@/lib/s3-service"

const prisma = new PrismaClient()

// File upload helper for S3
async function uploadToS3(file: File, directory: string): Promise<{ url: string; key: string }> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = `${directory}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    
    const fileInfo = await S3Service.uploadFile(
      buffer,
      fileName,
      file.type || 'application/octet-stream',
      directory
    )
    
    return {
      url: fileInfo.url,
      key: fileName
    }
  } catch (error) {
    console.error("Error uploading to S3:", error)
    throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

type BankAccount = {
  accountHolderName: string
  bankName: string
  branchName: string
  accountNumber: string
  ifscCode: string
  bankCountry: string
  currency: string
  notes?: string
}


export async function POST(request: NextRequest) {
  try {
    let dmcId = ""
    let banks: BankAccount[] = []
    let upiProvider = ""
    let upiId = ""
    let paymentLink = ""
    let qrFile: File | null = null

    // Support both JSON and FormData
    const contentType = request.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      const body = await request.json()
      dmcId = String(body.dmcId || "").trim()
      banks = Array.isArray(body.bank) ? body.bank : []
      upiProvider = String(body.upiProvider || "")
      upiId = String(body.upiId || "")
      paymentLink = String(body.paymentLink || "")
      // QR upload not supported in JSON
    } else {
      const formData = await request.formData()
      dmcId = String(formData.get("dmcId") || "").trim()
      try {
        const banksRaw = String(formData.get("bank") || "[]")
        banks = JSON.parse(banksRaw || "[]")
      } catch {
        banks = []
      }
      upiProvider = String(formData.get("upiProvider") || "")
      upiId = String(formData.get("upiId") || "")
      paymentLink = String(formData.get("paymentLink") || "")
      qrFile = (formData.get("qrCode") as File) || null
    }

    if (!dmcId) {
      return NextResponse.json({ error: "dmcId is required" }, { status: 400 })
    }

    // Save all banks as a single JSON array in the 'bank' field
    if (banks && banks.length > 0) {
      // Upsert (update if exists, else create) BANK_ACCOUNT PaymentMethod for this dmcId
      const existing = await prisma.paymentMethod.findFirst({
        where: { dmcId, type: PaymentMethodType.BANK_ACCOUNT },
      })
      if (existing) {
        await prisma.paymentMethod.update({
          where: { id: existing.id },
          data: { bank: banks },
        })
      } else {
        await prisma.paymentMethod.create({
          data: {
            type: PaymentMethodType.BANK_ACCOUNT,
            dmcId,
            bank: banks,
          },
        })
      }
    }

    // UPI
    if (upiId) {
      const existing = await prisma.paymentMethod.findFirst({
        where: { dmcId, type: PaymentMethodType.UPI },
      })
      if (existing) {
        await prisma.paymentMethod.update({
          where: { id: existing.id },
          data: {
            name: upiProvider || "UPI",
            identifier: upiId,
            upiProvider: upiProvider || null,
            isActive: true,
          },
        })
      } else {
        await prisma.paymentMethod.create({
          data: {
            type: PaymentMethodType.UPI,
            dmcId,
            name: upiProvider || "UPI",
            identifier: upiId,
            upiProvider: upiProvider || null,
            isActive: true,
          },
        })
      }
    }

    // Payment Gateway
    if (paymentLink) {
      const existing = await prisma.paymentMethod.findFirst({
        where: { dmcId, type: PaymentMethodType.PAYMENT_GATEWAY },
      })
      if (existing) {
        await prisma.paymentMethod.update({
          where: { id: existing.id },
          data: {
            name: "Payment Gateway",
            paymentLink,
            identifier: paymentLink,
            isActive: true,
          },
        })
      } else {
        await prisma.paymentMethod.create({
          data: {
            type: PaymentMethodType.PAYMENT_GATEWAY,
            dmcId,
            name: "Payment Gateway",
            paymentLink,
            identifier: paymentLink,
            isActive: true,
          },
        })
      }
    }

    // QR Code
    if (qrFile) {
      try {
        // Upload QR code to S3
        const { url: fileUrl, key: fileKey } = await uploadToS3(qrFile, 'payment-qr-codes')
        
        // Create file record in the database with available fields
        const fileRecord = await prisma.file.create({
          data: {
            name: qrFile.name || 'qr-code',
            url: fileUrl,
            size: qrFile.size,
            type: qrFile.type || 'application/octet-stream',
          },
        });

        // Check if QR code payment method already exists
        const existingQr = await prisma.paymentMethod.findFirst({
          where: { 
            dmcId, 
            type: PaymentMethodType.QR_CODE 
          },
          include: { qrCode: true }
        });

        // Prepare payment method data
        const paymentMethodData = {
          name: "QR Code Payment",
          identifier: fileKey,
          qrCodeId: fileRecord.id,
          isActive: true,
        };

        if (existingQr) {
          // Delete old QR code file from S3 if it exists
          if (existingQr.qrCode) {
            try {
              await S3Service.deleteFile(existingQr.qrCode.name);
              await prisma.file.delete({
                where: { id: existingQr.qrCode.id }
              });
            } catch (error) {
              console.error("Error cleaning up old QR code:", error);
              // Continue even if cleanup fails
            }
          }

          // Update existing payment method
          await prisma.paymentMethod.update({
            where: { id: existingQr.id },
            data: paymentMethodData,
          });
        } else {
          // Create new payment method
          await prisma.paymentMethod.create({
            data: {
              ...paymentMethodData,
              type: PaymentMethodType.QR_CODE,
              dmcId,
            },
          });
        }
      } catch (error) {
        console.error("Error processing QR code:", error);
        return NextResponse.json(
          { 
            error: "Failed to process QR code",
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment details saved successfully",
    })
  } catch (error) {
    console.error("Error saving payment details:", error)
    return NextResponse.json(
      {
        error: "Failed to save payment details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dmcId = searchParams.get("dmcId") || undefined

    const methods = dmcId
      ? await prisma.paymentMethod.findMany({
          where: { dmcId },
          include: { qrCode: true },
          orderBy: { createdAt: "desc" },
        })
      : []

    return NextResponse.json({ success: true, data: { methods } })
  } catch (error) {
    console.error("Error fetching payment details:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch payment details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    let dmcId = ""
    let banks: BankAccount[] = []
    let upiProvider = ""
    let upiId = ""
    let paymentLink = ""
    let qrFile: File | null = null

    const contentType = request.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      const body = await request.json()
      dmcId = String(body.dmcId || "").trim()
      banks = Array.isArray(body.bank) ? body.bank : []
      upiProvider = String(body.upiProvider || "")
      upiId = String(body.upiId || "")
      paymentLink = String(body.paymentLink || "")
    } else {
      const formData = await request.formData()
      dmcId = String(formData.get("dmcId") || "").trim()
      try {
        const banksRaw = String(formData.get("bank") || "[]")
        banks = JSON.parse(banksRaw || "[]")
      } catch {
        banks = []
      }
      upiProvider = String(formData.get("upiProvider") || "")
      upiId = String(formData.get("upiId") || "")
      paymentLink = String(formData.get("paymentLink") || "")
      qrFile = (formData.get("qrCode") as File) || null
    }

    if (!dmcId) {
      return NextResponse.json({ error: "dmcId is required" }, { status: 400 })
    }

    if (banks && banks.length > 0) {
      const existing = await prisma.paymentMethod.findFirst({
        where: { dmcId, type: PaymentMethodType.BANK_ACCOUNT },
      })
      if (existing) {
        await prisma.paymentMethod.update({
          where: { id: existing.id },
          data: { bank: banks },
        })
      } else {
        await prisma.paymentMethod.create({
          data: {
            type: PaymentMethodType.BANK_ACCOUNT,
            dmcId,
            bank: banks,
          },
        })
      }
    }

    if (upiId) {
      const existing = await prisma.paymentMethod.findFirst({
        where: { dmcId, type: PaymentMethodType.UPI },
      })
      if (existing) {
        await prisma.paymentMethod.update({
          where: { id: existing.id },
          data: {
            name: upiProvider || "UPI",
            identifier: upiId,
            upiProvider: upiProvider || null,
            isActive: true,
          },
        })
      } else {
        await prisma.paymentMethod.create({
          data: {
            type: PaymentMethodType.UPI,
            dmcId,
            name: upiProvider || "UPI",
            identifier: upiId,
            upiProvider: upiProvider || null,
            isActive: true,
          },
        })
      }
    }

    if (paymentLink) {
      const existing = await prisma.paymentMethod.findFirst({
        where: { dmcId, type: PaymentMethodType.PAYMENT_GATEWAY },
      })
      if (existing) {
        await prisma.paymentMethod.update({
          where: { id: existing.id },
          data: {
            name: "Payment Gateway",
            paymentLink,
            identifier: paymentLink,
            isActive: true,
          },
        })
      } else {
        await prisma.paymentMethod.create({
          data: {
            type: PaymentMethodType.PAYMENT_GATEWAY,
            dmcId,
            name: "Payment Gateway",
            paymentLink,
            identifier: paymentLink,
            isActive: true,
          },
        })
      }
    }

    if (qrFile) {
      try {
        console.log('Starting QR code processing for dmcId:', dmcId);
        
        // Upload QR code to S3
        const { url: fileUrl, key: fileKey } = await uploadToS3(qrFile, 'payment-qr-codes');
        console.log('File uploaded to S3:', { fileUrl, fileKey });
        
        // Create file record in the database with available fields
        const fileRecord = await prisma.file.create({
          data: {
            name: qrFile.name || 'qr-code',
            url: fileUrl,
            size: qrFile.size,
            type: qrFile.type || 'application/octet-stream',
          },
        });
        console.log('File record created:', fileRecord.id);

        // Check if QR code payment method already exists
        const existingQr = await prisma.paymentMethod.findFirst({
          where: { 
            dmcId, 
            type: PaymentMethodType.QR_CODE 
          },
          include: { qrCode: true }
        });

        console.log('Existing QR payment method:', existingQr ? 'found' : 'not found');

        // Prepare payment method data
        const paymentMethodData = {
          name: "QR Code Payment",
          identifier: fileKey,
          qrCodeId: fileRecord.id,
          isActive: true,
          dmcId,  // Make sure dmcId is included
        };

        if (existingQr && existingQr.id) {
          console.log('Updating existing payment method:', existingQr.id);
          
          // Delete old QR code file from S3 if it exists
          if (existingQr.qrCode) {
            try {
              console.log('Cleaning up old QR code file:', existingQr.qrCode.id);
              await S3Service.deleteFile(existingQr.qrCode.name);
              await prisma.file.delete({
                where: { id: existingQr.qrCode.id }
              });
              console.log('Old QR code file cleaned up successfully');
            } catch (error) {
              console.error("Error cleaning up old QR code:", error);
              // Continue even if cleanup fails
            }
          }
          
          // Update existing payment method using upsert to handle race conditions
          await prisma.paymentMethod.upsert({
            where: { id: existingQr.id },
            update: paymentMethodData,
            create: {
              ...paymentMethodData,
              type: PaymentMethodType.QR_CODE,
            },
          });
          console.log('Payment method updated successfully');
        } else {
          console.log('Creating new payment method');
          // Create new payment method if none exists
          await prisma.paymentMethod.create({
            data: {
              ...paymentMethodData,
              type: PaymentMethodType.QR_CODE,
            },
          });
          console.log('New payment method created');
        }

        return NextResponse.json({
          success: true,
          message: "QR code processed successfully",
          fileUrl
        });

      } catch (error) {
        console.error("Error processing QR code:", error);
        return NextResponse.json(
          { 
            success: false,
            error: "Failed to process QR code",
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    }

    // If no QR file was processed, return success
    return NextResponse.json({
      success: true,
      message: "No QR code to process"
    });

    return NextResponse.json({
      success: true,
      message: "Payment methods updated successfully",
    })
  } catch (error) {
    console.error("Error updating payment methods:", error)
    return NextResponse.json({ error: "Failed to update payment methods" }, { status: 500 })
  }
}