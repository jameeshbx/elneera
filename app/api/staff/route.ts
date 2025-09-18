import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Mock staff data for demonstration
const mockStaff = [
  {
    id: "1",
    name: "Kevin Blake",
    email: "kevin@example.com",
    phone: "+1234567890",
    role: "MANAGER",
    isActive: true,
  },
  {
    id: "2",
    name: "Maria Rodriguez",
    email: "maria@example.com",
    phone: "+1234567891",
    role: "STAFF",
    isActive: true,
  },
  {
    id: "3",
    name: "Priya Sharma",
    email: "priya@example.com",
    phone: "+1234567892",
    role: "STAFF",
    isActive: true,
  },
  {
    id: "4",
    name: "Ahmed Khan",
    email: "ahmed@example.com",
    phone: "+1234567893",
    role: "STAFF",
    isActive: true,
  },
  {
    id: "5",
    name: "Emily Johnson",
    email: "emily@example.com",
    phone: "+1234567894",
    role: "STAFF",
    isActive: true,
  },
]

// GET - Fetch all active staff members
export async function GET() {
  try {
    // For now, return mock data
    // TODO: Replace with actual Prisma query when Staff model exists
    // const staff = await prisma.staff.findMany({
    //   where: {
    //     isActive: true
    //   },
    //   select: {
    //     id: true,
    //     name: true,
    //     email: true,
    //     phone: true,
    //     role: true
    //   },
    //   orderBy: {
    //     name: 'asc'
    //   }
    // })

    const staff = mockStaff.filter((s) => s.isActive).sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({
      success: true,
      data: staff,
    })
  } catch (error) {
    console.error("Error fetching staff:", error)
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Create new staff member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, role } = body

    // For now, create mock staff member
    // TODO: Replace with actual Prisma create when Staff model exists
    const newStaff = {
      id: `staff-${Date.now()}`,
      name,
      email,
      phone,
      role: role || "STAFF",
      isActive: true,
    }

    return NextResponse.json({
      success: true,
      message: "Staff member created successfully",
      data: newStaff,
    })
  } catch (error) {
    console.error("Error creating staff:", error)
    return NextResponse.json({ error: "Failed to create staff member" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
