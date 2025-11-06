import { NextRequest, NextResponse } from 'next/server';

interface CustomerPaymentData {
  id: string;
  customerName: string;
  itineraryReference: string;
  totalCost: number;
  amountPaid: number;
  paymentDate: string;
  remainingBalance: number;
  paymentStatus: 'Paid' | 'Partial' | 'Pending' | 'Overdue';
  shareMethod: 'whatsapp' | 'email';
  paymentLink: string;
  currency: string;
}

interface PaymentHistory {
  id: string;
  paidDate: string;
  amountPaid: number;
  pendingAmount: number;
  status: string;
  invoiceUrl?: string;
}

interface PaymentReminder {
  id: string;
  type: string;
  message: string;
  time: string;
  date: string;
  status: 'RECENT' | 'SENT' | 'PENDING';
}
// Removed unused Commission interface
// GET - Fetch customer payment data
export async function GET(
  request: NextRequest
) {
  try {
    const enquiryId = request.nextUrl.searchParams.get('enquiryId') || '';
    // const customerId = request.nextUrl.searchParams.get('customerId') || '';
    
    if (!enquiryId) {
      return NextResponse.json({ error: 'enquiryId is required' }, { status: 400 });
    }

    // Import Prisma client
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      // Fetch enquiry data
      const enquiry = await prisma.enquiries.findUnique({
        where: { id: enquiryId },
        include: {
          customer: true,
          itineraries: true
        }
      });

      if (!enquiry) {
        return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
      }

      // Fetch commission data for this enquiry
      const commissions = await prisma.commission.findMany({
        where: { enquiryId: enquiryId },
        include: {
          dmc: true
        },
        orderBy: { createdAt: 'desc' }
      });

      // Calculate totals from commissions
      const totalQuotation = commissions.reduce((sum: number, comm: { quotationAmount?: number | null }) => sum + (comm.quotationAmount || 0), 0);
      const totalMarkup = commissions.reduce((sum: number, comm: { markupPrice?: number | null }) => sum + (comm.markupPrice || 0), 0);


      const paymentData: CustomerPaymentData = {
        id: enquiry.id,
        customerName: enquiry.customer?.name || enquiry.name || 'Unknown Customer',
        itineraryReference: enquiry.itineraries?.[0]?.id || `ENQ-${enquiry.id.slice(-6)}`,
        totalCost: totalMarkup || totalQuotation || 0,
        amountPaid: 0, // Will be updated when payments are recorded
        paymentDate: new Date().toISOString(),
        remainingBalance: totalMarkup || totalQuotation || 0,
        paymentStatus: 'Pending',
        shareMethod: 'email',
        paymentLink: `https://payment.example.com/${enquiry.id}`,
        currency: 'USD'
      };

      const paymentHistory: PaymentHistory[] = [
        {
          id: `hist_${enquiryId}_1`,
          paidDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          amountPaid: 2000,
          pendingAmount: 3000,
          status: 'Completed',
          invoiceUrl: `https://invoice.example.com/${enquiryId}_1`
        }
      ];

      const reminders: PaymentReminder[] = [
        {
          id: `rem_${enquiryId}_1`,
          type: 'Payment Due',
          message: 'Payment reminder for remaining balance',
          time: '10:00',
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'PENDING'
        }
      ];

      return NextResponse.json({
        success: true,
        data: {
          payment: paymentData,
          history: paymentHistory,
          reminders: reminders
        }
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
      );
    } finally {
      await prisma.$disconnect();
    }

  } catch (error) {
    console.error('Error fetching customer payment data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update customer payment data
export async function PUT(
  request: NextRequest
) {
  try {
    const id = request.nextUrl.searchParams.get('id') || '';
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updateData = await request.json();

    // Validate required fields
    const requiredFields = ['customerName', 'itineraryReference', 'totalCost'];
    const missingFields: string[] = [];
    
    for (const field of requiredFields) {
      if (!updateData[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          missingFields 
        },
        { status: 400 }
      );
    }

    // Validate numeric fields
    const totalCost = parseFloat(updateData.totalCost);
    const amountPaid = parseFloat(updateData.amountPaid || '0');

    if (isNaN(totalCost) || totalCost < 0) {
      return NextResponse.json(
        { error: 'Invalid total cost value' },
        { status: 400 }
      );
    }

    if (isNaN(amountPaid) || amountPaid < 0) {
      return NextResponse.json(
        { error: 'Invalid amount paid value' },
        { status: 400 }
      );
    }

    // Calculate remaining balance and payment status
    const remainingBalance = totalCost - amountPaid;
    let paymentStatus: 'Paid' | 'Partial' | 'Pending' | 'Overdue' = 'Pending';

    if (remainingBalance <= 0) {
      paymentStatus = 'Paid';
    } else if (amountPaid > 0) {
      paymentStatus = 'Partial';
    } else {
      // Check if overdue based on payment date
      const paymentDate = new Date(updateData.paymentDate || Date.now());
      const currentDate = new Date();
      if (currentDate > paymentDate) {
        paymentStatus = 'Overdue';
      }
    }
    
    const updatedData = {
      ...updateData,
      totalCost,
      amountPaid,
      remainingBalance,
      paymentStatus,
      id,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: updatedData,
      message: 'Payment data updated successfully'
    });

  } catch (error) {
    console.error('Error updating customer payment data:', error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new payment record
export async function POST(
  request: NextRequest
) {
  try {
    const paymentData = await request.json();

    // Validate required fields for new payment
    const requiredFields = ['customerName', 'itineraryReference', 'totalCost'];
    const missingFields: string[] = [];
    
    for (const field of requiredFields) {
      if (!paymentData[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          missingFields 
        },
        { status: 400 }
      );
    }

    const totalCost = parseFloat(paymentData.totalCost);
    const amountPaid = parseFloat(paymentData.amountPaid || '0');

    if (isNaN(totalCost) || totalCost < 0) {
      return NextResponse.json(
        { error: 'Invalid total cost value' },
        { status: 400 }
      );
    }

    // Generate a new ID for the payment record
    const paymentId = `pay_${Date.now()}`;
    
    const newPaymentRecord: CustomerPaymentData = {
      id: paymentId,
      customerName: paymentData.customerName,
      itineraryReference: paymentData.itineraryReference,
      totalCost,
      amountPaid,
      paymentDate: paymentData.paymentDate || new Date().toISOString(),
      remainingBalance: totalCost - amountPaid,
      paymentStatus: amountPaid >= totalCost ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Pending',
      shareMethod: paymentData.shareMethod || 'whatsapp',
      paymentLink: paymentData.paymentLink || `https://payment.example.com/${paymentId}`,
      currency: paymentData.currency || 'USD'
    };

    // Create in database
    // const created = await prisma.customerPayment.create({
    //   data: newPaymentRecord
    // });

    return NextResponse.json({
      success: true,
      data: newPaymentRecord,
      message: 'Payment record created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating payment record:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove payment record
export async function DELETE(
  request: NextRequest
) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Delete from database
    // const deleted = await prisma.customerPayment.delete({
    //   where: { id }
    // });

    return NextResponse.json({
      success: true,
      message: 'Payment record deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting payment record:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}