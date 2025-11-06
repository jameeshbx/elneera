import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { randomUUID } from "crypto"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth" // Adjust path to your auth config

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get the logged-in user session
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 }
      )
    }

    const agencyId = session.user.id // Get the agency user ID from session
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit") || "10")))

    // Build where clause for search - FILTER BY AGENCY ID
    const whereClause: {
      agencyId: string; // Add agency filter
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' };
        contactPerson?: { contains: string; mode: 'insensitive' };
        email?: { contains: string; mode: 'insensitive' };
        phoneNumber?: { contains: string; mode: 'insensitive' };
      }>;
    } = {
      agencyId: agencyId, // Only get DMCs for this agency
    };
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy clause
    const orderByClause: {
      name?: 'asc' | 'desc';
      contactPerson?: 'asc' | 'desc';
      status?: 'asc' | 'desc';
      createdAt?: 'asc' | 'desc';
    } = {};
    
    const sortDirection = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc' as const;
    
    switch (sortBy) {
      case "name":
        orderByClause.name = sortDirection;
        break;
      case "primaryContact":
        orderByClause.contactPerson = sortDirection;
        break;
      case "status":
        orderByClause.status = sortDirection;
        break;
      case "createdAt":
      default:
        orderByClause.createdAt = sortDirection;
        break;
    }

    // Fetch DMCs with pagination - filtered by agencyId
    const [dmcs, totalCount] = await Promise.all([
      prisma.dMCForm.findMany({
        where: whereClause,
        orderBy: orderByClause,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          contactPerson: true,
          phoneNumber: true,
          designation: true,
          email: true,
          status: true,
          agencyId: true, // Include agencyId in response
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.dMCForm.count({ where: whereClause }),
    ])

    // Transform data to match frontend interface
    const transformedDmcs = dmcs.map((dmc) => ({
      id: dmc.id,
      name: dmc.name,
      primaryContact: dmc.contactPerson || "",
      phoneNumber: dmc.phoneNumber || "",
      designation: dmc.designation || "",
      email: dmc.email || "",
      status: dmc.status === "ACTIVE" ? "Active" : "Inactive",
      joinSource: "Agency",
      agencyId: dmc.agencyId,
      createdAt: dmc.createdAt,
      updatedAt: dmc.updatedAt,
    }))

    return NextResponse.json({
      success: true,
      data: transformedDmcs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching DMCs:", error)
    return NextResponse.json({ error: "Failed to fetch DMCs" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the logged-in user session
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 }
      )
    }

    const agencyId = session.user.id // Get the agency user ID from session
    
    const formData = await request.formData()
    
    // Extract and validate required fields
    const name = formData.get('dmcName')?.toString() || ''
    const contactPerson = formData.get('primaryContact')?.toString() || ''
    const phoneNumber = formData.get('phoneNumber')?.toString() || ''
    const email = formData.get('email')?.toString() || ''
    
    // Extract optional fields with null fallback
    const designation = formData.get('designation')?.toString() || null
    const website = formData.get('website')?.toString() || null
    const primaryCountry = formData.get('primaryCountry')?.toString() || null
    const destinationsCovered = formData.get('destinationsCovered')?.toString() || null
    const cities = formData.get('cities')?.toString() || null
    const gstRegistration = formData.get('gstRegistration')?.toString() || 'No'
    const gstNo = formData.get('gstNo')?.toString() || null
    const yearOfRegistration = formData.get('yearOfRegistration')?.toString() || null
    const ownerName = formData.get('ownerName')?.toString() || null
    const ownerPhoneNumber = formData.get('ownerPhoneNumber')?.toString() || null
    const panNo = formData.get('panNo')?.toString() || null
    const panType = formData.get('panType')?.toString() || 'INDIVIDUAL'
    const headquarters = formData.get('headquarters')?.toString() || null
    const country = formData.get('country')?.toString() || null
    const yearOfExperience = formData.get('yearOfExperience')?.toString() || null
    const primaryPhoneExtension = formData.get('primaryPhoneExtension')?.toString() || '+91'
    const ownerPhoneExtension = formData.get('ownerPhoneExtension')?.toString() || '+91'

    // Validate required fields
    if (!name || !contactPerson || !phoneNumber || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Map PAN type to enum value if needed
    type DmcPanType = "INDIVIDUAL" | "COMPANY" | "TRUST" | "OTHER"
    const panTypeValue: DmcPanType = (panType?.toUpperCase() as DmcPanType) || "INDIVIDUAL"

    // Create DMC record with agencyId
    const dmc = await prisma.dMCForm.create({
      data: {
        id: randomUUID(),
        name,
        config: {},
        contactPerson,
        designation,
        phoneNumber,
        phoneCountryCode: primaryPhoneExtension,
        ownerName,
        email,
        ownerPhoneNumber,
        ownerPhoneCode: ownerPhoneExtension,
        website,
        primaryCountry,
        destinationsCovered,
        cities,
        gstRegistered: gstRegistration === "Yes",
        gstNumber: gstRegistration === "Yes" ? gstNo : null,
        yearOfRegistration,
        panNumber: panNo,
        panType: panTypeValue,
        headquarters,
        country,
        yearsOfExperience: yearOfExperience,
        createdBy: "agency",
        agencyId: agencyId, // IMPORTANT: Store the agency ID
        status: "ACTIVE" as const,
      },
      select: {
        id: true,
        name: true,
        contactPerson: true,
        phoneNumber: true,
        email: true,
        status: true,
        agencyId: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: dmc,
      message: 'DMC created successfully',
    })
  } catch (error: unknown) {
    console.error("DMC registration error:", error)

    // Handle Prisma validation errors
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          { error: "Email or phone number already exists" },
          { status: 409 }
        )
      }
      if (error.message.includes("Invalid input")) {
        return NextResponse.json(
          { error: "Invalid input data provided" },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: error.message || "Failed to create DMC" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  } finally {
    try {
      await prisma.$disconnect()
    } catch (e) {
      console.error("Error disconnecting from Prisma:", e)
    }
  }
}