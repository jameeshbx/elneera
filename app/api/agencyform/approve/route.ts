import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// This endpoint handles agency approval
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

    // First get the current agency to check status
    const currentAgency = await prisma.agencyForm.findUnique({
      where: { id: agencyId },
      select: { status: true }
    });

    // If already approved, redirect to success page without changing anything
    if (currentAgency?.status === 'ACTIVE') {
      return new Response(null, {
        status: 302,
        headers: { Location: '/agency-approved' },
      });
    }

    // If already processed with a different status, redirect to appropriate page
    if (currentAgency?.status === 'REJECTED') {
      return new Response(null, {
        status: 302,
        headers: { Location: `/already-processed?status=${currentAgency.status}` },
      });
    }

    // Update the agency status to ACTIVE and include the creator data
    const updatedAgency = await prisma.agencyForm.update({
      where: { id: agencyId },
      data: { status: 'ACTIVE' },
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

    // Log the approval with creator's information
    console.log(`Agency ${updatedAgency.id} approved for user ${updatedAgency.creator?.email || 'unknown'}`);

    // In a real app, you would also want to:
    // 1. Send a confirmation email to the agency using updatedAgency.creator.email
    // 2. Create any necessary user accounts
    // 3. Set up any required permissions

    // Redirect to a success page
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/agency-approved',
      },
    });
  } catch (error) {
    console.error('Error approving agency:', error);
    return NextResponse.json(
      { error: 'Failed to approve agency' },
      { status: 500 }
    );
  }
}
