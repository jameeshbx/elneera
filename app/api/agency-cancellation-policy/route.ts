import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET - Fetch default agency cancellation policy
export async function GET() {
  try {
    const policy = await prisma.$queryRaw`
      SELECT * FROM agency_cancellation_policies 
      WHERE is_default = true 
      LIMIT 1
    `

    if (!policy || (Array.isArray(policy) && policy.length === 0)) {
      return NextResponse.json(
        {
          error: "No default cancellation policy found",
        },
        { status: 404 },
      )
    }

    const defaultPolicy = Array.isArray(policy) ? policy[0] : policy

    return NextResponse.json(defaultPolicy)
  } catch (error) {
    console.error("Error fetching agency cancellation policy:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch cancellation policy",
      },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Create new agency cancellation policy
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { agencyId, policyName, cancellationDeadlineDays, cancellationTerms, refundPercentage, isDefault } = body

    const newPolicy = await prisma.$queryRaw`
      INSERT INTO agency_cancellation_policies (
        agency_id, 
        policy_name, 
        cancellation_deadline_days, 
        cancellation_terms, 
        refund_percentage, 
        is_default
      ) VALUES (
        ${agencyId}, 
        ${policyName}, 
        ${cancellationDeadlineDays}, 
        ${cancellationTerms}, 
        ${refundPercentage || 0}, 
        ${isDefault || false}
      ) RETURNING *
    `

    return NextResponse.json({
      success: true,
      policy: newPolicy,
    })
  } catch (error) {
    console.error("Error creating agency cancellation policy:", error)
    return NextResponse.json(
      {
        error: "Failed to create cancellation policy",
      },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}