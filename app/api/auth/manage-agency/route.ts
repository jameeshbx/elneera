import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Define types for the config object
type AgencyConfig = {
  status?: string
  requestType?: string
  [key: string]: unknown
}

// GET - Fetch agency requests with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    console.log("API: GET /api/auth/manage-agency called")
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortDirection = searchParams.get("sortDirection") || "desc"
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    // Build where clause
    const where: {
      OR?: Array<{
        id?: { contains: string; mode: "insensitive" }
        name?: { contains: string; mode: "insensitive" }
        email?: { contains: string; mode: "insensitive" }
        contactPerson?: { contains: string; mode: "insensitive" }
      }>
      createdAt?: {
        gte?: Date
        lte?: Date
      }
    } = {}

    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { contactPerson: { contains: search, mode: "insensitive" } },
      ]
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo)
      }
    }

    // Build orderBy clause
    const orderBy: Record<string, string> = {}
    orderBy[sortBy === 'status' || sortBy === 'requestType' ? 'createdAt' : sortBy] = sortDirection

    console.log("API: Building where clause:", where)
    console.log("API: Order by:", orderBy)
    
    // Fetch data from AgencyForm table
    const requests = await prisma.agencyForm.findMany({
      where,
      orderBy,
      include: {
        logo: true,
        businessLicense: true,
      }
    })
    
    console.log("API: Raw requests from DB:", requests)

    // Transform data to match frontend expectations
    const transformedRequests = requests.map((request) => {
      const config: AgencyConfig = request.config as AgencyConfig || {}
      
      // Map the requestType to match frontend expectations
      let requestType = "PENDING"
      if (config.requestType && typeof config.requestType === 'string') {
        requestType = config.requestType.toUpperCase()
      }
      
      return {
        id: request.id,
        name: request.contactPerson || request.name || "",
        email: request.email || "",
        phoneNumber: request.phoneNumber || "",
        AgencyName: request.name || "",
        status: config.status || "Inactive",
        requestType: requestType,
        requestDate: request.createdAt.toISOString(),
        contactPerson: request.contactPerson || "",
        designation: request.designation || "",
        website: request.website || "",
        ownerName: request.ownerName || "",
        gstNumber: request.gstNumber || "",
        panNumber: request.panNumber || "",
        headquarters: request.headquarters || "",
        logo: request.logo,
        businessLicense: request.businessLicense,
        agencyType: request.agencyType || "PRIVATE_LIMITED",
        phoneCountryCode: request.phoneCountryCode || "+91",
        companyPhone: request.companyPhone || "",
        companyPhoneCode: request.companyPhoneCode || "+91",
        landingPageColor: request.landingPageColor || "#4ECDC4",
        gstRegistered: request.gstRegistered || false,
        yearOfRegistration: request.yearOfRegistration || "",
        panType: request.panType || "",
        country: request.country || "",
        yearsOfOperation: request.yearsOfOperation || "",
        createdBy: request.createdBy || "admin",
        createdAt: request.createdAt.toISOString(),
        updatedAt: request.updatedAt.toISOString(),
      }
    })

    console.log("API: Transformed requests:", transformedRequests)
    
    return NextResponse.json({
      requests: transformedRequests,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(requests.length / limit),
        totalCount: requests.length,
        hasNextPage: page * limit < requests.length,
        hasPrevPage: page > 1,
      },
    })
  } catch (error) {
    console.error("Error fetching agency requests:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create new agency request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      email,
      phoneNumber,
      contactPerson,
      designation,
      website,
      ownerName,
      companyPhone,
      gstRegistered,
      gstNumber,
      yearOfRegistration,
      panNumber,
      panType,
      headquarters,
      country,
      yearsOfOperation,
      phoneCountryCode,
      companyPhoneCode,
      landingPageColor,
      agencyType,
    } = body

    // Validate required fields
    if (!contactPerson || !email || !phoneNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingRequest = await prisma.agencyForm.findFirst({
      where: { email },
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: "Agency request with this email already exists" },
        { status: 409 }
      )
    }

    const newRequest = await prisma.agencyForm.create({
      data: {
        name: contactPerson || "Agency",
        config: {
          status: "Inactive", // Set initial status
          requestType: "PENDING" // Set initial request type
        },
        contactPerson,
        agencyType: agencyType || "PRIVATE_LIMITED",
        designation,
        phoneNumber,
        phoneCountryCode: phoneCountryCode || "+91",
        ownerName,
        email,
        companyPhone,
        companyPhoneCode: companyPhoneCode || "+91",
        website,
        landingPageColor: landingPageColor || "#4ECDC4",
        gstRegistered,
        gstNumber,
        yearOfRegistration,
        panNumber,
        panType,
        headquarters,
        country,
        yearsOfOperation,
        createdBy: "admin",
      },
    })

    const config = newRequest.config as AgencyConfig

    return NextResponse.json(
      { 
        message: "Agency request created successfully",
        request: {
          id: newRequest.id,
          name: newRequest.contactPerson || newRequest.name,
          email: newRequest.email || "",
          phoneNumber: newRequest.phoneNumber || "",
          AgencyName: newRequest.name,
          status: config.status || "Inactive",
          requestType: config.requestType || "PENDING",
          requestDate: newRequest.createdAt.toISOString(),
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating agency request:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH - Update agency request status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { requestId, status, requestType } = body

    if (!requestId || (!status && !requestType)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get existing request first
    const existingRequest = await prisma.agencyForm.findUnique({
      where: { id: requestId }
    })

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Agency request not found" },
        { status: 404 }
      )
    }

    // Get existing config
    const existingConfig: AgencyConfig = existingRequest.config as AgencyConfig || {}

    // Prepare update data
    const updateData = {
      config: {
        ...existingConfig,
        ...(status && { status }), // Store status in config
        ...(requestType && { requestType }),
        updatedAt: new Date()
      }
    }

    const updatedRequest = await prisma.agencyForm.update({
      where: { id: requestId },
      data: updateData,
      include: {
        logo: true,
        businessLicense: true,
      },
    })

    // Get the updated config
    const config: AgencyConfig = updatedRequest.config as AgencyConfig || {}

    return NextResponse.json({
      message: "Agency request updated successfully",
      request: {
        id: updatedRequest.id,
        name: updatedRequest.contactPerson || updatedRequest.name,
        email: updatedRequest.email || "",
        phoneNumber: updatedRequest.phoneNumber || "",
        AgencyName: updatedRequest.name,
        status: config.status || "Active",
        requestType: config.requestType || "PENDING",
        requestDate: updatedRequest.createdAt.toISOString(),
        updatedAt: new Date(),
      },
    })
  } catch (error) {
    console.error("Error updating agency request:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete agency request
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get("requestId")

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      )
    }

    await prisma.agencyForm.delete({
      where: { id: requestId },
    })

    return NextResponse.json({
      message: "Agency request deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting agency request:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}