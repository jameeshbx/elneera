import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { type ItineraryUpdateRequest } from "@/types/itinerary";

// PUT - Update itinerary
export async function PUT(request: NextRequest) {
  try {
    const data: ItineraryUpdateRequest = await request.json();
    const { id, editedContent } = data;

    if (!id) {
      return NextResponse.json(
        { error: "Itinerary ID is required" },
        { status: 400 }
      );
    }

    console.log("Updating itinerary with data:", {
      id,
      editedContent,
    });

    // Update the itinerary
    const updatedItinerary = await prisma.itineraries.update({
      where: { id },
      data: {
        isEdited: true,
        editedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Itinerary updated successfully",
      itinerary: updatedItinerary,
    });
  } catch (error) {
    console.error("Error updating itinerary:", error);
    return NextResponse.json(
      {
        error: "Failed to update itinerary",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}