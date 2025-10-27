import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// This endpoint handles agency modification request
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');

    if (!agencyId) {
      return NextResponse.json(
        { error: 'Agency ID is required' },
        { status: 400 }
      );
    }

    // Update the agency status to MODIFY
    const updatedAgency = await prisma.agencyForm.update({
      where: { id: agencyId },
      data: { status: 'MODIFY' },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    console.log(`Agency ${updatedAgency.id} marked for modification by user ${updatedAgency.creator?.email || 'unknown'}`);
    
    // In a real app, you might want to:
    // 1. Send a notification email to the agency with modification instructions
    // 2. Log this action for audit purposes

    // Redirect to a success page
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/agency-modification-required',
      },
    });
  } catch (error) {
    console.error('Error processing modification request:', error);
    return NextResponse.json(
      { error: 'Failed to process modification request' },
      { status: 500 }
    );
  }
}
