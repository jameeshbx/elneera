import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, BookingStatus } from "@prisma/client";

const prisma = new PrismaClient();

// Type guard to check if a string is a valid BookingStatus
function isBookingStatus(status: string): status is BookingStatus {
  return Object.values(BookingStatus).includes(status as BookingStatus);
}

// Helper function to safely parse booking status
function parseBookingStatus(status: unknown): BookingStatus {
  if (typeof status === 'string' && isBookingStatus(status)) {
    return status;
  }
  return 'PENDING'; // Default status
}

// Example API endpoint
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const enquiryId = searchParams.get('enquiryId');

  if (!enquiryId) {
    return NextResponse.json({ error: 'Enquiry ID is required' }, { status: 400 });
  }

  try {
    // Fetch data from your database, filtering by enquiryId
    const data = await prisma.bookingProgress.findMany({
      where: { enquiryId }
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    return NextResponse.json({ error: 'Failed to fetch booking details' }, { status: 500 });
  }
}


export async function POST(request: NextRequest, { params }: { params: Promise<{ itineraryId: string }> }) {
  const { itineraryId } = await params;
  const { searchParams } = new URL(request.url);
  const enquiryId = searchParams.get('enquiryId');
  const body = await request.json();
  const { date, service, status, dmcNotes } = body;
  
  // Parse and validate the status
  const statusValue = parseBookingStatus(status);
  
  // Prepare the data with proper typing
  const data = {
    itineraryId,
    date: new Date(date),
    service: String(service || ''),
    status: statusValue,
    dmcNotes: dmcNotes ? String(dmcNotes) : null,
    ...(enquiryId && { enquiryId })
  };
  
  const progress = await prisma.bookingProgress.create({ data });
  return NextResponse.json({ success: true, data: progress });
}
// /api/booking-progress/[itineraryId]/[id]/route.ts
export async function PUT(request: NextRequest, { params }: { params: Promise<{ itineraryId: string, id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { date, service, status, dmcNotes } = body;
  
  // Prepare update data with proper typing
  const updateData: {
    date?: Date;
    service?: string;
    status?: BookingStatus;
    dmcNotes?: string | null;
  } = {};

  if (date !== undefined) updateData.date = new Date(date);
  if (service !== undefined) updateData.service = String(service);
  if (status !== undefined) updateData.status = parseBookingStatus(status);
  if (dmcNotes !== undefined) updateData.dmcNotes = dmcNotes ? String(dmcNotes) : null;
  
  const progress = await prisma.bookingProgress.update({
    where: { id },
    data: updateData,
  });
  
  return NextResponse.json({ success: true, data: progress });
}