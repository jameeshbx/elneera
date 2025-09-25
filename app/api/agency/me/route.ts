import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    console.log('Session:', session) // Log session data

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Get the current user with their agency data
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          agency: {
            include: {
              logo: {
                select: {
                  url: true
                }
              }
            }
          }
        }
      });

    console.log('User from DB:', user) // Log user data

    if (!user?.agency) {
      return NextResponse.json(
        { error: "Agency not found" },
        { status: 404 }
      )
    }

    // Return the agency data with logo URL
    const responseData = {
      id: user.agency.id,
      name: user.agency.name,
      logoUrl: user.agency.logo?.url || null,
    }

    console.log('Response data:', responseData) // Log response data
    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error in /api/agency/me:', error)
    return NextResponse.json(
      { 
        error: "Failed to fetch agency data",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
