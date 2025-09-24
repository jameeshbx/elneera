import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { type ItineraryUpdateRequest } from "@/types/itinerary";


type ItineraryUpdateData = {
  isEdited: boolean;
  editedAt: Date;
  updatedAt: Date;
  editedContent?: string; // Optional since we only include it conditionally
};
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
      editedContent: editedContent ? "Content provided" : "No content",
    });

    // Test database connection first
    try {
      await prisma.$connect();
      console.log("Database connection successful");
    } catch (connectionError) {
      console.error("Database connection failed:", connectionError);
      return NextResponse.json(
        {
          error: "Database connection failed",
          details: "Unable to connect to the database. Please try again later.",
          suggestion: "Check your database configuration and network connection"
        },
        { status: 503 } // Service Unavailable
      );
    }

    // Check if itinerary exists first
    const existingItinerary = await prisma.itineraries.findUnique({
      where: { id },
      select: { id: true, isEdited: true, editedAt: true }
    });

    if (!existingItinerary) {
      return NextResponse.json(
        { error: "Itinerary not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: ItineraryUpdateData = {
  isEdited: true,
  editedAt: new Date(),
  updatedAt: new Date(),
};

    // Only include editedContent if it's provided
    if (editedContent !== undefined) {
  updateData.editedContent = editedContent;
}

    console.log("Update data:", updateData);

    // Update the itinerary
    const updatedItinerary = await prisma.itineraries.update({
      where: { id },
      data: updateData,
    });

    console.log("Itinerary updated successfully:", updatedItinerary.id);

    return NextResponse.json({
      success: true,
      message: "Itinerary updated successfully",
      itinerary: {
        id: updatedItinerary.id,
        isEdited: updatedItinerary.isEdited,
        editedAt: updatedItinerary.editedAt,
        updatedAt: updatedItinerary.updatedAt,
      },
    });

  } catch (error) {
    console.error("Error updating itinerary:", error);

    // Handle specific Prisma errors
    if (error instanceof Error) {
      // Database connection errors
      if (error.message.includes("Can't reach database server")) {
        return NextResponse.json(
          {
            error: "Database connection failed",
            details: "Unable to connect to the database server",
            suggestion: "Please check your internet connection and try again",
            retryable: true
          },
          { status: 503 }
        );
      }

      // Record not found errors
      if (error.message.includes("Record to update not found")) {
        return NextResponse.json(
          {
            error: "Itinerary not found",
            details: "The specified itinerary does not exist",
          },
          { status: 404 }
        );
      }

      // Validation errors
      if (error.message.includes("Invalid") || error.message.includes("validation")) {
        return NextResponse.json(
          {
            error: "Invalid data",
            details: error.message,
          },
          { status: 400 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        error: "Failed to update itinerary",
        details: error instanceof Error ? error.message : "Unknown error",
        retryable: true
      },
      { status: 500 }
    );
  } finally {
    // Always disconnect from Prisma
    await prisma.$disconnect();
  }
}