import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const enquiryId = searchParams.get("id");

    if (!enquiryId) {
      return NextResponse.json({ 
        success: false,
        error: "Enquiry ID is required" 
      }, { status: 400 });
    }

    console.log("Public access request for enquiry:", enquiryId);
    
    const enquiry = await prisma.enquiries.findUnique({
      where: { id: enquiryId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        locations: true,
        estimatedDates: true,
        numberOfTravellers: true,
        currency: true,
        // Only include fields that should be publicly visible
      }
    });
    
    if (!enquiry) {
      return NextResponse.json({ 
        success: false,
        error: "Enquiry not found" 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: enquiry
    });
  } catch (error) {
    console.error("Error fetching public enquiry:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch enquiry",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}