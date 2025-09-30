import { NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';

// This endpoint handles agency rejection
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

    // Update the agency status to REJECTED and include the creator data
    const updatedAgency = await prisma.agencyForm.update({
      where: { id: agencyId },
      data: { status: 'REJECTED' },
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

    // Log the rejection with creator's information
    console.log(`Agency ${updatedAgency.id} rejected for user ${updatedAgency.creator?.email || 'unknown'}`);
    
    // In a real app, you would also want to:
    // 1. Send a notification email to the agency using updatedAgency.creator.email
    // 2. Log the rejection reason (you might want to add a reason field)

    // Redirect to a rejection page
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/agency-rejected',
      },
    });
  } catch (error) {
    console.error('Error rejecting agency:', error);
    return NextResponse.json(
      { error: 'Failed to reject agency' },
      { status: 500 }
    );
  }
}
