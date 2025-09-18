//app/api/auth/add-bank-details/route.ts

import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

type BankDetails = {
  accountHolderName?: string;
  bankName?: string;
  branchName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankCountry?: string;
  currency?: string;
  notes?: string;
};

type PaymentMethodResponse = {
  bank: BankDetails[];
  upiProvider: string;
  identifier: string;
  paymentLink: string;
  qrCode: { url: string; name: string } | null;
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get("agencyId");

    if (!agencyId) {
      return NextResponse.json({ error: "Agency ID is required" }, { status: 400 });
    }

    try {
      // Get the most recent active payment method for each type
      const [latestBank, latestUpi, latestPaymentLink, latestQrCode] = await Promise.all([
        // Latest bank account
        prisma.agencyPaymentMethod.findFirst({
          where: { 
            agencyId,
            type: 'BANK_ACCOUNT',
            isActive: true
          },
          orderBy: { updatedAt: 'desc' },
        }),
        // Latest UPI
        prisma.agencyPaymentMethod.findFirst({
          where: { 
            agencyId,
            type: 'UPI',
            isActive: true
          },
          orderBy: { updatedAt: 'desc' },
        }),
        // Latest payment link
        prisma.agencyPaymentMethod.findFirst({
          where: { 
            agencyId,
            type: 'PAYMENT_GATEWAY',
            isActive: true,
            paymentLink: { not: null }
          },
          orderBy: { updatedAt: 'desc' },
        }),
        // Latest QR code
        prisma.agencyPaymentMethod.findFirst({
          where: { 
            agencyId,
            type: 'QR_CODE',
            isActive: true,
            qrCode: { isNot: null }
          },
          include: { qrCode: true },
          orderBy: { updatedAt: 'desc' },
        }),
      ]);

      // Process bank accounts
      const bankAccounts: BankDetails[] = [];
      if (latestBank?.bank) {
        try {
          const bankData = typeof latestBank.bank === 'string' 
            ? JSON.parse(latestBank.bank) 
            : latestBank.bank;
          
          if (Array.isArray(bankData)) {
            bankAccounts.push(...bankData);
          } else if (typeof bankData === 'object') {
            bankAccounts.push(bankData);
          }
        } catch (error) {
          console.error('Error parsing bank data:', error);
        }
      }

      const response: PaymentMethodResponse = {
        bank: bankAccounts,
        upiProvider: latestUpi?.upiProvider || "",
        identifier: latestUpi?.identifier || "",
        paymentLink: latestPaymentLink?.paymentLink || "",
        qrCode: latestQrCode?.qrCode ? {
          url: latestQrCode.qrCode.url,
          name: latestQrCode.qrCode.name || 'QR Code'
        } : null,
      };

      console.log('Processed response:', JSON.stringify({ paymentMethod: response }, null, 2));
      return NextResponse.json({ paymentMethod: response });
      
    } catch (error) {
      console.error('Error in GET /api/auth/add-bank-details:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payment methods' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in GET /api/auth/add-bank-details:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}


async function processPaymentRequest(request: NextRequest, isUpdate = false) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const contentType = request.headers.get("content-type") || ""
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Content-Type must be multipart/form-data" }, { status: 400 })
    }

    const formData = await request.formData()
    const agencyId = formData.get("agencyId") as string

    if (!agencyId) {
      return NextResponse.json({ error: "Agency ID is required" }, { status: 400 })
    }

    const bankData = formData.get("bank") as string
    const upiProvider = formData.get("upiProvider") as string
    const upiId = formData.get("upiId") as string
    const paymentLink = formData.get("paymentLink") as string
    const qrFile = formData.get("qrCode") as File | null

    let banks = []
    if (bankData && bankData !== "undefined" && bankData !== "null") {
      try {
        banks = JSON.parse(bankData)
      } catch (parseError) {
        console.error("Error parsing bank data:", parseError)
        return NextResponse.json(
          {
            error: "Invalid bank data format",
            details: "Bank data must be valid JSON",
          },
          { status: 400 },
        )
      }
    }

    let qrCodeFile = null

    if (qrFile && qrFile.size > 0) {
      const buffer = Buffer.from(await qrFile.arrayBuffer())
      const base64 = buffer.toString("base64")
      const dataUrl = `data:${qrFile.type};base64,${base64}`

      qrCodeFile = await prisma.file.create({
        data: {
          url: dataUrl,
          name: qrFile.name,
          size: qrFile.size,
          type: qrFile.type,
        },
      })
    }

    if (isUpdate) {
      await prisma.agencyPaymentMethod.updateMany({
        where: { agencyId },
        data: { isActive: false },
      })
    }

    const paymentMethodsToCreate = []

    if (banks.length > 0) {
      for (const bank of banks) {
        paymentMethodsToCreate.push({
          agencyId,
          type: "BANK_ACCOUNT" as const,
          name: bank.bankName || null, // Map bank name to name field
          identifier: bank.accountNumber || null, // Map account number to identifier
          cardHolder: bank.accountHolderName || null, // Map account holder to cardHolder field
          notes: bank.notes || null, // Map notes field
          bank: bank, // Store complete bank object as JSON
          isActive: true,
        })
      }
    }

    if (upiId && upiProvider) {
      paymentMethodsToCreate.push({
        agencyId,
        type: "UPI" as const,
        name: `${upiProvider} - ${upiId}`, // Create descriptive name
        upiProvider,
        identifier: upiId, // Map UPI ID to identifier field
        isActive: true,
      })
    }

    if (paymentLink) {
      paymentMethodsToCreate.push({
        agencyId,
        type: "PAYMENT_GATEWAY" as const,
        name: "Payment Gateway Link", // Add descriptive name
        paymentLink,
        identifier: paymentLink, // Store link in identifier as well
        isActive: true,
      })
    }

    if (qrCodeFile) {
      paymentMethodsToCreate.push({
        agencyId,
        type: "QR_CODE" as const,
        name: `QR Code - ${qrCodeFile.name}`, // Add descriptive name
        qrCodeId: qrCodeFile.id,
        identifier: qrCodeFile.name, // Store filename as identifier
        isActive: true,
      })
    }

    if (paymentMethodsToCreate.length > 0) {
      await prisma.agencyPaymentMethod.createMany({
        data: paymentMethodsToCreate,
      })
    }

    console.log(`${isUpdate ? "Updated" : "Saved"} payment methods:`, {
      agencyId,
      banksCount: banks.length,
      upiProvider,
      upiId,
      paymentLink,
      hasQrFile: !!qrFile,
      qrFileName: qrFile?.name,
    })

    return NextResponse.json({
      success: true,
      message: `Payment methods ${isUpdate ? "updated" : "saved"} successfully`,
      data: {
        agencyId,
        banks,
        upiProvider,
        upiId,
        paymentLink,
        qrCode: qrCodeFile
          ? {
              url: qrCodeFile.url,
              name: qrCodeFile.name,
            }
          : null,
      },
    })
  } catch (error) {
    console.error(`Error ${isUpdate ? "updating" : "saving"} payment methods:`, error)

    return NextResponse.json(
      {
        error: `Failed to ${isUpdate ? "update" : "save"} payment methods`,
        details: error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  return processPaymentRequest(request, false)
}

export async function PUT(request: NextRequest) {
  return processPaymentRequest(request, true)
}
