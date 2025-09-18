import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const enquiryId = searchParams.get("enquiryId");

    if (enquiryId) {
      // Fetch specific feedback for an enquiry
      const feedback = await prisma.feedback.findUnique({
        where: { enquiryId },
      });

      if (!feedback) {
        return NextResponse.json([], { status: 200 });
      }

      return NextResponse.json([feedback]); // Wrap single feedback in array
    } else {
       return NextResponse.json([], { status: 200 }); // Return empty array if no enquiryId provided
    }
  } catch (error) {
    console.error("GET /api/feedbacks error:", error);
    return NextResponse.json([], { status: 500 }); // Return empty array on error
  }
}

// POST: Save feedback details
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const {
      enquiryId,
      name,
      phone,
      email,
      destination,
      dateRange,
      overallExperience,
      accommodationQuality,
      transportTransfers,
      serviceFromTeam,
      travelAgain,
      additionalComments,
    } = data;

    if (!enquiryId || !name || !phone || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newFeedback = await prisma.feedback.create({
      data: {
        enquiryId,
        name,
        phone,
        email,
        destination,
        dateRange,
        overallExperience,
        accommodationQuality,
        transportTransfers,
        serviceFromTeam,
        travelAgain,
        additionalComments,
      },
    });

    return NextResponse.json(newFeedback, { status: 201 });
  } catch (error) {
    console.error("POST /api/feedbacks error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
