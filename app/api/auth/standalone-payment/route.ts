import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient, PaymentMethodType } from "@prisma/client"

const prisma = new PrismaClient()

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

const fileToDataUrl = async (file: File): Promise<string> => {
  const buf = Buffer.from(await file.arrayBuffer())
  const base64 = buf.toString("base64")
  return `data:${file.type || "application/octet-stream"};base64,${base64}`
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
      const dataUrl = await fileToDataUrl(qrFile)
      const fileRow = await prisma.file.create({
        data: {
          url: dataUrl,
          name: qrFile.name || "qr-code",
          size: Number(qrFile.size || 0),
          type: qrFile.type || "application/octet-stream",
        },
      })
      const existing = await prisma.paymentMethod.findFirst({
        where: { dmcId, type: PaymentMethodType.QR_CODE },
      })
      if (existing) {
        await prisma.paymentMethod.update({
          where: { id: existing.id },
          data: {
            name: "QR Code",
            qrCodeId: fileRow.id,
            identifier: fileRow.id,
            dmcId, // Ensure dmcId is updated
            isActive: true,
          },
        })
      } else {
        await prisma.paymentMethod.create({
          data: {
            type: PaymentMethodType.QR_CODE,
            dmcId, // Ensure dmcId is stored
            name: "QR Code",
            qrCodeId: fileRow.id,
            identifier: fileRow.id,
            isActive: true,
          },
        })
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
      const dataUrl = await fileToDataUrl(qrFile)
      const fileRow = await prisma.file.create({
        data: {
          url: dataUrl,
          name: qrFile.name || "qr-code",
          size: Number(qrFile.size || 0),
          type: qrFile.type || "application/octet-stream",
        },
      })
      const existing = await prisma.paymentMethod.findFirst({
        where: { dmcId, type: PaymentMethodType.QR_CODE },
      })
      if (existing) {
        await prisma.paymentMethod.update({
          where: { id: existing.id },
          data: {
            name: "QR Code",
            qrCodeId: fileRow.id,
            identifier: fileRow.id,
            dmcId,
            isActive: true,
          },
        })
      } else {
        await prisma.paymentMethod.create({
          data: {
            type: PaymentMethodType.QR_CODE,
            dmcId,
            name: "QR Code",
            qrCodeId: fileRow.id,
            identifier: fileRow.id,
            isActive: true,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment methods updated successfully",
    })
  } catch (error) {
    console.error("Error updating payment methods:", error)
    return NextResponse.json({ error: "Failed to update payment methods" }, { status: 500 })
  }
}