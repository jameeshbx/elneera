import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Mock DMCs data for immediate use
const mockDMCs = [
  {
    id: "1",
    name: "DMC Europe",
    email: "europe@dmc.com",
    contactPerson: "John Smith",
    primaryCountry: "France",
    destinationsCovered: "Europe",
    status: "ACTIVE",
  },
  {
    id: "2",
    name: "Trails DMC",
    email: "trails@dmc.com",
    contactPerson: "Sarah Wilson",
    primaryCountry: "India",
    destinationsCovered: "Asia",
    status: "ACTIVE",
  },
  {
    id: "3",
    name: "Adventure DMC",
    email: "adventure@dmc.com",
    contactPerson: "Mike Johnson",
    primaryCountry: "USA",
    destinationsCovered: "Americas",
    status: "ACTIVE",
  },
  {
    id: "4",
    name: "Safari DMC",
    email: "safari@dmc.com",
    contactPerson: "David Brown",
    primaryCountry: "Kenya",
    destinationsCovered: "Africa",
    status: "ACTIVE",
  },
  {
    id: "5",
    name: "Island DMC",
    email: "island@dmc.com",
    contactPerson: "Maria Garcia",
    primaryCountry: "Maldives",
    destinationsCovered: "Islands",
    status: "ACTIVE",
  },
]

// GET - Fetch all DMCs
export async function GET() {
  try {
    // For now, return mock data
    // TODO: Replace with actual Prisma query when DMC model exists
    const dmcs = mockDMCs.filter((dmc) => dmc.status === "ACTIVE").sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({
      success: true,
      data: dmcs,
    })
  } catch (error) {
    console.error("Error fetching DMCs:", error)
    return NextResponse.json({ error: "Failed to fetch DMCs" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Create new DMC
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, contactPerson, primaryCountry, destinationsCovered } = body

    // For now, create mock DMC
    // TODO: Replace with actual Prisma create when DMC model exists
    const newDMC = {
      id: `dmc-${Date.now()}`,
      name,
      email,
      contactPerson,
      primaryCountry,
      destinationsCovered,
      status: "ACTIVE",
    }

    return NextResponse.json({
      success: true,
      message: "DMC created successfully",
      data: newDMC,
    })
  } catch (error) {
    console.error("Error creating DMC:", error)
    return NextResponse.json({ error: "Failed to create DMC" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
