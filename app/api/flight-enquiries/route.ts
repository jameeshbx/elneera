// app/api/flight-enquiries/route.ts
import { NextRequest, NextResponse , } from "next/server"
import { sql } from "@vercel/postgres"


interface FlightEnquiry {
  from: string;
  to: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
}
// Helper function to create error responses
function createErrorResponse(error: Error | unknown, statusCode = 500) {
  console.error("API Error:", error)
  const errorMessage = error instanceof Error ? error.message : "Internal server error"
 const errorCode =
  error instanceof Error && "code" in error
    ? (error as { code: string | number }).code
    : "UNKNOWN_ERROR";


  return NextResponse.json(
    {
      error: errorMessage,
      code: errorCode,
    },
    { status: statusCode },
  )
}

// GET - Fetch all flight enquiries or a specific one by ID
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (id) {
      const { rows } = await sql`
        SELECT * FROM flight_enquiries WHERE id = ${id}
      `
      if (rows.length === 0) {
        return NextResponse.json({ error: "Flight enquiry not found" }, { status: 404 })
      }

      return NextResponse.json(rows[0])
    }

    // Fetch all flight enquiries
    const { rows } = await sql`
      SELECT * FROM flight_enquiries 
      ORDER BY created_at DESC
    `

    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error in GET /api/flight-enquiries:", error)
    return createErrorResponse(error)
  }
}

// POST - Create a new flight enquiry



export async function POST(req: NextRequest) {
  try {
    const body: FlightEnquiry = await req.json();

    // Optional: Validate required fields
    if (!body.from || !body.to || !body.departureDate) {
      return NextResponse.json(
        { error: "Missing required flight enquiry fields" },
        { status: 400 }
      );
    }

    // Example: Process enquiry
    return NextResponse.json({
      message: "Flight enquiry received successfully",
      data: body,
    });
  } catch  {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}


// PUT - Update a flight enquiry
export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const { id, ...updateData } = data

    if (!id) {
      return NextResponse.json(
        {
          error: "Enquiry ID is required",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      )
    }

    // Update only the status for drag and drop, or all fields for full update
    let updateQuery

    if (Object.keys(updateData).length === 1 && updateData.status) {
      // Simple status update for drag and drop
      updateQuery = sql`
        UPDATE flight_enquiries 
        SET status = ${updateData.status}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `
    } else {
      // Full update
      updateQuery = sql`
        UPDATE flight_enquiries 
        SET 
          name = ${updateData.name || ""},
          phone = ${updateData.phone || ""},
          email = ${updateData.email || ""},
          departure_city = ${updateData.departureCity || ""},
          return_city = ${updateData.returnCity || ""},
          departure_date = ${updateData.departureDate || ""},
          return_date = ${updateData.returnDate || ""},
          preferred_airline_class = ${updateData.preferredAirlineClass || "economy"},
          number_of_travellers = ${updateData.numberOfTravellers || ""},
          number_of_kids = ${updateData.numberOfKids || ""},
          assigned_staff = ${updateData.assignedStaff || ""},
          point_of_contact = ${updateData.pointOfContact || ""},
          notes = ${updateData.notes || ""},
          lead_source = ${updateData.leadSource || "Direct"},
          status = ${updateData.status || "enquiry"},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `
    }

    const { rows } = await updateQuery
    if (rows.length === 0) {
      return NextResponse.json({ error: "Flight enquiry not found" }, { status: 404 })
    }

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error("Error in PUT /api/flight-enquiries:", error)
    return createErrorResponse(error)
  }
}

// DELETE - Delete a flight enquiry
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        {
          error: "Enquiry ID is required",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      )
    }

    const { rows } = await sql`
      DELETE FROM flight_enquiries 
      WHERE id = ${id} 
      RETURNING id
    `

    if (rows.length === 0) {
      return NextResponse.json({ error: "Flight enquiry not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Flight enquiry deleted successfully",
      id: rows[0].id,
    })
  } catch (error) {
    console.error("Error in DELETE /api/flight-enquiries:", error)
    return createErrorResponse(error)
  }
}
