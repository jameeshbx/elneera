// app/api/dmc-payment/invoice/[paymentId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Define the InvoiceData interface
interface InvoiceData {
  totalCost: number;
  amountPaid: number;
  remainingBalance: number;
  paymentStatus: string;
  paymentChannel: string;
  paymentDate: string | Date;
  transactionId?: string;
  selectedBank?: string;
  upiId?: string;
  currency: string;
  dmcName?: string;
}

// Type guard for InvoiceData
function isInvoiceData(data: unknown): data is InvoiceData {
  const d = data as InvoiceData;
  return (
    d !== null &&
    typeof d === "object" &&
    "totalCost" in d &&
    "amountPaid" in d &&
    "remainingBalance" in d &&
    "paymentStatus" in d &&
    "paymentChannel" in d &&
    "paymentDate" in d &&
    "currency" in d &&
    typeof d.totalCost === "number" &&
    typeof d.amountPaid === "number" &&
    typeof d.remainingBalance === "number" &&
    typeof d.paymentStatus === "string" &&
    typeof d.paymentChannel === "string" &&
    (typeof d.paymentDate === "string" || d.paymentDate instanceof Date) &&
    typeof d.currency === "string"
  );
}

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;

    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 }
      );
    }

    // Fetch payment details with invoice data
    const payment = await prisma.dmcPayment.findUnique({
      where: { id: paymentId },
      include: {
        dmc: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            headquarters: true,
          },
        },
        enquiry: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            currency: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    if (!payment.invoice) {
      return NextResponse.json(
        { error: "Invoice data not found for this payment" },
        { status: 404 }
      );
    }

    // Validate invoice data
    if (!isInvoiceData(payment.invoice)) {
      return NextResponse.json(
        { error: "Invalid invoice data format" },
        { status: 500 }
      );
    }

    const invoiceData = payment.invoice;

    // 🔹 Create a PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { height } = page.getSize();

    // Fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Helper function for text
    let cursorY = height - 50;
    const drawText = (text: string, x: number, size = 12, color = rgb(0, 0, 0)) => {
      page.drawText(text, {
        x,
        y: cursorY,
        size,
        font,
        color,
      });
      cursorY -= size + 6;
    };

    // Header
    page.drawText("PAYMENT INVOICE", {
      x: 200,
      y: height - 50,
      size: 20,
      font,
      color: rgb(0.1, 0.3, 0.6),
    });

    cursorY = height - 100;
    drawText(`Invoice #: ${payment.itineraryReference}`, 50);
    drawText(`Issue Date: ${new Date().toLocaleDateString()}`, 50);
    drawText(
      `Payment Date: ${new Date(invoiceData.paymentDate).toLocaleDateString()}`,
      50
    );
    drawText(`Enquiry ID: ${payment.enquiry.id.substring(0, 8)}`, 50);

    cursorY -= 40;

    // Payment Summary
    drawText("PAYMENT SUMMARY", 200, 16);

    drawText(`Total Cost: ${invoiceData.currency} ${invoiceData.totalCost.toFixed(2)}`, 50);
    drawText(`Amount Paid: ${invoiceData.currency} ${invoiceData.amountPaid.toFixed(2)}`, 50);
    drawText(`Remaining Balance: ${invoiceData.currency} ${invoiceData.remainingBalance.toFixed(2)}`, 50);

    cursorY -= 20;

    // Payment Method
    drawText("PAYMENT METHOD", 50, 14);
    drawText(`Channel: ${invoiceData.paymentChannel}`, 50);

    if (invoiceData.transactionId) {
      drawText(`Transaction ID: ${invoiceData.transactionId}`, 50);
    }
    if (invoiceData.selectedBank) {
      drawText(`Bank: ${invoiceData.selectedBank}`, 50);
    }
    if (invoiceData.upiId) {
      drawText(`UPI ID: ${invoiceData.upiId}`, 50);
    }

    cursorY -= 20;

    // Status
    drawText("STATUS:", 50, 14);
    drawText(invoiceData.paymentStatus, 50);

    cursorY -= 40;

    // Footer
    drawText(
      "This is a computer-generated invoice. No signature is required.",
      50,
      8,
      rgb(0.5, 0.5, 0.5)
    );

    // Save PDF to buffer
    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${payment.itineraryReference}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    return NextResponse.json(
      {
        error: "Failed to generate invoice PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}