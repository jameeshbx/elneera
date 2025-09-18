import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface WhereClause {
  itineraryId: string;
  enquiryId?: string;
}

// Removed unused BookingFeedbackData interface

export async function GET(request: NextRequest, { params }: { params: Promise<{ itineraryId: string }> }) {
  const { itineraryId } = await params;
  const { searchParams } = new URL(request.url);
  const enquiryId = searchParams.get('enquiryId');
  
  // Remove unused data creation in GET method

const whereClause: WhereClause = { itineraryId };
if (enquiryId) {
  whereClause.enquiryId = enquiryId;
}
  
  const feedbacks = await prisma.bookingFeedback.findMany({
    where: whereClause,
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ success: true, data: feedbacks });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ itineraryId: string }> }) {
  const { itineraryId } = await params;
  const { searchParams } = new URL(request.url);
  const enquiryId = searchParams.get('enquiryId');
  const body = await request.json();
  const { note } = body;
  
  const data: { itineraryId: string; note: string; enquiryId?: string } = { itineraryId, note };
  if (enquiryId) {
    data.enquiryId = enquiryId;
  }
  
  const feedback = await prisma.bookingFeedback.create({ data });
  return NextResponse.json({ success: true, data: feedback });
}