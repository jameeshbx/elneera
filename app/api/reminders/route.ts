import { NextResponse } from "next/server"
import type { Reminder } from "@/lib/types"

// POST endpoint to send a payment reminder
export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.itineraryReference) {
      return NextResponse.json({ error: "Itinerary reference is required" }, { status: 400 })
    }

    // In a real application, you would send a reminder and store it in your database
    // For now, we'll just return a new reminder
    const newReminder: Reminder = {
      id: Date.now(),
      type: "Reminder sent",
      message: `Payment reminder sent via ${data.method || "system"}`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: "Today",
      status: "SENT",
    }

    return NextResponse.json({ reminder: newReminder })
  } catch {
    return NextResponse.json({ error: "Failed to send reminder" }, { status: 500 })
  }
}

// GET endpoint to fetch reminders for an itinerary
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const itineraryReference = searchParams.get("itineraryReference")

  if (!itineraryReference) {
    return NextResponse.json({ error: "Itinerary reference is required" }, { status: 400 })
  }

  try {
    // In a real application, you would fetch reminders from your database
    // For now, we'll return mock data
    const reminders: Reminder[] = [
      {
        id: 1,
        type: "Payment pending",
        message:
          "Customer is satisfied with the entire itinerary. No changes requested. Proceeding with confirmation and sending to DMC.",
        time: "02:00 PM",
        date: "Today",
        status: "RECENT",
      },
    ]

    return NextResponse.json({ reminders })
  } catch {
    return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 })
  }
}
