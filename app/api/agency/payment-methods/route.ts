import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the current user's agency
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { agency: true }
    });

    if (!user?.agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    // Fetch all active payment methods for the agency
    const paymentMethods = await prisma.agencyPaymentMethod.findMany({
      where: { 
        agencyId: user.agency.id,
        isActive: true 
      },
      include: { 
        qrCode: true 
      },
      orderBy: { 
        updatedAt: 'desc' 
      },
    });

    // Process the payment methods
    const bankAccounts = [];
    let upiMethod = null;
    let qrCode = null;

    for (const method of paymentMethods) {
      if (method.type === 'BANK_ACCOUNT' && method.bank) {
        try {
          const bankData = typeof method.bank === 'string' 
            ? JSON.parse(method.bank)
            : method.bank;
          bankAccounts.push({
            ...bankData,
            id: method.id
          });
        } catch (error) {
          console.error('Error parsing bank data:', error);
        }
      } else if (method.type === 'UPI') {
        upiMethod = {
          id: method.id,
          provider: method.upiProvider || 'UPI',
          identifier: method.identifier || ''
        };
        
        if (method.qrCode) {
          qrCode = {
            url: method.qrCode.url,
            name: method.qrCode.name
          };
        }
      }
    }

    return NextResponse.json({
      bankAccounts,
      upiMethod,
      qrCode
    });

  } catch (error) {
    console.error('Error in GET /api/agency/payment-methods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}
