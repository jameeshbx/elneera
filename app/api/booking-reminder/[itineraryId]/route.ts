import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
interface WhereClause {
  itineraryId: string;
  enquiryId?: string;
}

// Removed unused BookingReminderData interface

export async function GET(request: NextRequest, { params }: { params: Promise<{ itineraryId: string }> }) {
  const { itineraryId } = await params;
  const { searchParams } = new URL(request.url);
  const enquiryId = searchParams.get('enquiryId');
  
  const whereClause: WhereClause = { itineraryId };
  if (enquiryId) {
    whereClause.enquiryId = enquiryId;
  }
  
  const reminders = await prisma.booking_reminder.findMany({
    where: whereClause,
    orderBy: { date: "asc" },
  });
  return NextResponse.json({ success: true, data: reminders });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ itineraryId: string }> }) {
  const { itineraryId } = await params;
  const { searchParams } = new URL(request.url);
  const enquiryId = searchParams.get('enquiryId');
  const body = await request.json();
  const { date, note } = body;
  
  const data: { itineraryId: string; date: Date; note: string; enquiryId?: string } = { itineraryId, date: new Date(date), note };
  if (enquiryId) {
    data.enquiryId = enquiryId;
  }
  
  const reminder = await prisma.booking_reminder.create({ data });
  return NextResponse.json({ success: true, data: reminder });
}