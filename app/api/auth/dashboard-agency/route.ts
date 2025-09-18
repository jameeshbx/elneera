import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// Helper function to generate booking ID from enquiry ID
function generateBookingId(enquiryId: string): string {
  // Extract last 4 characters of enquiry ID and prefix with 'B'
  const suffix = enquiryId.slice(-3);
  return `B${suffix}`;
}

// Helper function to determine payment status based on enquiry status
function getPaymentStatus(status: string): string {
  switch (status) {
    case "completed":
      return "PMD";
    case "cancelled":
      return "REFUNDED";
    case "payment_forex":
    case "trip_in_progress":
      return "PMD";
    case "booking_progress":
    case "booking_request":
      return "PARTIAL";
    default:
      return "UNPAID";
  }
}

// Helper function to determine booking status based on enquiry status
function getBookingStatus(status: string): { status: string; color: string } {
  switch (status) {
    case "completed":
      return { status: "Confirmed", color: "green" };
    case "cancelled":
      return { status: "Cancelled", color: "red" };
    case "trip_in_progress":
    case "payment_forex":
      return { status: "Confirmed", color: "green" };
    case "booking_progress":
    case "booking_request":
      return { status: "Pending", color: "yellow" };
    default:
      return { status: "Pending", color: "yellow" };
  }
}

// Helper function to generate revenue and amount due based on budget and status
function generateFinancialData(budget: number, status: string) {
  const baseBudget = budget || 5000;
  
  switch (status) {
    case "completed":
    case "trip_in_progress":
      return {
        amount: `$${baseBudget}`,
        revenueGenerated: `$${Math.floor(baseBudget * 0.2)}`, // 20% revenue
        amountDue: "$0"
      };
    case "cancelled":
      return {
        amount: `$${baseBudget}`,
        revenueGenerated: "$0",
        amountDue: "$0"
      };
    case "payment_forex":
    case "booking_progress":
      return {
        amount: `$${baseBudget}`,
        revenueGenerated: `$${Math.floor(baseBudget * 0.06)}`, // 6% revenue
        amountDue: `$${Math.floor(baseBudget * 0.36)}` // 36% remaining
      };
    default:
      return {
        amount: `$${baseBudget}`,
        revenueGenerated: `$${Math.floor(baseBudget * 0.06)}`,
        amountDue: `$${Math.floor(baseBudget * 0.36)}`
      };
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch recent enquiries (limit to 10 for recent bookings table)
    const enquiries = await prisma.enquiries.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Limit to recent 10 enquiries
    });

    // Transform enquiries into booking table format
    const bookings = enquiries.map((enquiry) => {
      const bookingId = generateBookingId(enquiry.id);
      const paymentStatus = getPaymentStatus(enquiry.status);
      const bookingStatus = getBookingStatus(enquiry.status);
      const financialData = generateFinancialData(enquiry.budget || 5000, enquiry.status);
      
      // Format departure date
      const departureDate = enquiry.estimatedDates 
        ? enquiry.estimatedDates.split(' - ')[0] || enquiry.estimatedDates
        : "TBD";

      return {
        bookingId,
        enquiryId: enquiry.id.slice(-5).toUpperCase(), // Show last 5 chars as enquiry ID
        poc: enquiry.name,
        tourType: enquiry.tourType || "Family",
        location: enquiry.locations || "TBD",
        departureDate: departureDate,
        pax: enquiry.numberOfTravellers || "1",
        amount: financialData.amount,
        paymentStatus: paymentStatus,
        revenueGenerated: financialData.revenueGenerated,
        amountDue: financialData.amountDue,
        bookingStatus: bookingStatus.status,
        bookingStatusColor: bookingStatus.color,
        rawEnquiryData: enquiry // Include raw data if needed
      };
    });

    return NextResponse.json({
      success: true,
      data: bookings
    }, { status: 200 });

  } catch (error: unknown) {
    console.error("Error fetching recent bookings:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch recent bookings";
    return NextResponse.json({
      error: message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
