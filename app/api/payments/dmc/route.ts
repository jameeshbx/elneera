import { NextResponse } from "next/server"
import { DMCPaymentData } from "@/lib/types"

// GET endpoint to fetch DMC payment data
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const itineraryReference = searchParams.get("itineraryReference")
  
  if (!itineraryReference) {
    return NextResponse.json(
      { error: "Itinerary reference is required" },
      { status: 400 }
    )
  }
  
  try {
    // In a real application, you would fetch this data from your database
    // For now, we'll return mock data
    const payment: DMCPaymentData = {
        dmcName: 'Maple Trails DMC',
        itineraryReference: itineraryReference,
        paymentMode: 'Offline',
        totalCost: '1,100.00',
        amountPaid: '500.00',
        paymentDate: '13 - 04 - 25',
        remainingBalance: '600.00',
        paymentStatus: 'Partial',
        paymentChannel: 'Bank transfer ( manual entry )',
        transactionId: '41431545',
        selectedBank: 'Wells Fargo Bank, N.A. ( 987654321098 )',
        paymentGateway: 'https://pages.razorpay.com/family-camping',
        id: "",
        currency: ""
    }
    
    return NextResponse.json({ payment })
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch DMC payment data" },
      { status: 500 }
    )
  }
}

// POST endpoint to update DMC payment data
export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Validate required fields
    if (!data.itineraryReference) {
      return NextResponse.json(
        { error: "Itinerary reference is required" },
        { status: 400 }
      )
    }
    
    // In a real application, you would update this data in your database
    // For now, we'll just return success
    
    return NextResponse.json({ success: true })
  } catch  {
    return NextResponse.json(
      { error: "Failed to update DMC payment data" },
      { status: 500 }
    )
  }
}
