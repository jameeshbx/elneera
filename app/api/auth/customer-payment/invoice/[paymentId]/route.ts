// app/api/customer-payment/invoice/[paymentId]/route.ts
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
  customerName?: string;
  itineraryReference?: string;
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
    const payment = await prisma.customerPayment.findUnique({
      where: { id: paymentId },
      include: {
        enquiry: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            currency: true,
            agencyId: true,
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

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { height } = page.getSize();

    // Fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Helper function for text
    let cursorY = height - 50;
    const drawText = (text: string, x: number, size = 12, color = rgb(0, 0, 0), bold = false) => {
      page.drawText(text, {
        x,
        y: cursorY,
        size,
        font: bold ? fontBold : font,
        color,
      });
      cursorY -= size + 6;
    };

    // Header
    page.drawText("PAYMENT INVOICE", {
      x: 200,
      y: height - 50,
      size: 20,
      font: fontBold,
      color: rgb(0.1, 0.3, 0.6),
    });

    cursorY = height - 90;

    // Company/Agency Info - Get from enquiry relation
    const agencyName = payment.enquiry?.agency?.name || 'Agency';
    drawText(`Agency: ${agencyName}`, 50, 12, rgb(0, 0, 0), true);
    drawText(`Invoice #: ${payment.itineraryReference}`, 50);
    drawText(`Issue Date: ${new Date().toLocaleDateString()}`, 50);
    drawText(
      `Payment Date: ${new Date(invoiceData.paymentDate).toLocaleDateString()}`,
      50
    );

    cursorY -= 20;

    // Customer Information
    drawText("BILL TO:", 50, 14, rgb(0, 0, 0), true);
    drawText(`Customer Name: ${payment.enquiry?.customer?.name ?? ''}`, 50);
    drawText(`Email: ${payment.enquiry?.customer?.email ?? ''}`, 50);
    if (payment.enquiry?.customer?.phone) {
      drawText(`Phone: ${payment.enquiry.customer.phone}`, 50);
    }
    drawText(`Enquiry ID: ${payment.enquiry?.id?.substring(0, 8) ?? ''}`, 50);

    cursorY -= 30;

    // Payment Summary
    drawText("PAYMENT SUMMARY", 50, 16, rgb(0.1, 0.3, 0.6), true);
    cursorY -= 10;

    // Draw a box for payment summary
    page.drawRectangle({
      x: 40,
      y: cursorY - 80,
      width: 515,
      height: 90,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    });

    drawText(`Total Cost: ${invoiceData.currency} ${invoiceData.totalCost.toFixed(2)}`, 50, 12, rgb(0, 0, 0), true);
    drawText(`Amount Paid: ${invoiceData.currency} ${invoiceData.amountPaid.toFixed(2)}`, 50, 12, rgb(0, 0.5, 0), true);
    drawText(`Remaining Balance: ${invoiceData.currency} ${invoiceData.remainingBalance.toFixed(2)}`, 50, 12, rgb(0.8, 0, 0), true);

    cursorY -= 30;

    // Payment Method
    drawText("PAYMENT METHOD", 50, 14, rgb(0, 0, 0), true);
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

    // Payment Status
    drawText("PAYMENT STATUS:", 50, 14, rgb(0, 0, 0), true);
    const statusColor = 
      invoiceData.paymentStatus === 'PAID' ? rgb(0, 0.7, 0) :
      invoiceData.paymentStatus === 'PARTIAL' ? rgb(0.9, 0.6, 0) :
      rgb(0.8, 0, 0);
    drawText(invoiceData.paymentStatus, 50, 12, statusColor, true);

    cursorY -= 40;

    // Terms and Conditions
    drawText("TERMS & CONDITIONS:", 50, 12, rgb(0, 0, 0), true);
    drawText("1. Payment is non-refundable unless otherwise stated.", 50, 10);
    drawText("2. Any disputes must be raised within 7 days of receipt.", 50, 10);
    drawText("3. This invoice is subject to the terms of service.", 50, 10);

    // Footer
    cursorY = 60;
    page.drawLine({
      start: { x: 50, y: cursorY + 10 },
      end: { x: 545, y: cursorY + 10 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    
    drawText(
      "This is a computer-generated invoice. No signature is required.",
      50,
      8,
      rgb(0.5, 0.5, 0.5)
    );
    drawText(
      `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
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
        "Content-Disposition": `attachment; filename="customer-invoice-${payment.itineraryReference}.pdf"`,
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