import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

// Helper function to create error responses
function createErrorResponse(error: Error | unknown, statusCode = 500) {
  console.error("API Error:", error)
  const errorMessage = error instanceof Error ? error.message : "Internal server error"
  const errorCode =
    error instanceof Error && "code" in error ? (error as Error & { code: string }).code : "UNKNOWN_ERROR"

  return NextResponse.json(
    {
      error: errorMessage,
      code: errorCode,
    },
    { status: statusCode },
  )
}

// GET - Fetch all accommodation enquiries or a specific one by ID
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (id) {
      const { rows } = await sql`
        SELECT * FROM accommodation_enquiries WHERE id = ${id}
      `
      if (rows.length === 0) {
        return NextResponse.json({ error: "Accommodation enquiry not found" }, { status: 404 })
      }

      // Parse JSON arrays back to arrays
      const enquiry = {
        ...rows[0],
        locations: rows[0].locations ? JSON.parse(rows[0].locations) : [],
        accommodationType: rows[0].accommodation_type ? JSON.parse(rows[0].accommodation_type) : [],
        hotelPreference: rows[0].hotel_preference ? JSON.parse(rows[0].hotel_preference) : [],
      }

      return NextResponse.json(enquiry)
    }

    // Fetch all accommodation enquiries
    const { rows } = await sql`
      SELECT * FROM accommodation_enquiries 
      ORDER BY created_at DESC
    `

    // Parse JSON arrays for all enquiries
    const enquiries = rows.map((row) => ({
      ...row,
      locations: row.locations ? JSON.parse(row.locations) : [],
      accommodationType: row.accommodation_type ? JSON.parse(row.accommodation_type) : [],
      hotelPreference: row.hotel_preference ? JSON.parse(row.hotel_preference) : [],
    }))

    return NextResponse.json(enquiries)
  } catch (error) {
    console.error("Error in GET /api/accommodation-enquiries:", error)
    return createErrorResponse(error)
  }
}
