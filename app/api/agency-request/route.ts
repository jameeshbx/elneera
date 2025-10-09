// app/api/agency-requests/route.ts
import {  NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user has admin access (adjust based on your auth logic)
    const isAuthorized = user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.userType === "AGENCY" || user.role === "USER"

    if (!isAuthorized) {
      return NextResponse.json(
        { error: `Access denied. Role: ${user.role}` },
        { status: 403 }
      )
    }

    // Fetch all agency form submissions (simplified query)
    const agencyForms = await prisma.agencyForm.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to match the expected format
    const transformedData = agencyForms.map((form) => ({
      id: form.id,
      companyName: form.name,  // Explicitly map company name
      name: form.contactPerson || form.ownerName,  // Use contact/owner name for name field
      contactPerson: form.contactPerson,
      phoneCountryCode: form.phoneCountryCode,
      phoneNumber: form.phoneNumber,
      email: form.email,
      companyPhone: form.companyPhone,
      companyPhoneCode: form.companyPhoneCode,
      agencyType: form.agencyType,
      website: form.website,
      headquarters: form.headquarters,
      yearsOfOperation: form.yearsOfOperation,
      panNumber: form.panNumber,
      gstNumber: form.gstNumber,
      status: form.status || 'PENDING',
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
      logoPath: form.logoPath,
      businessLicensePath: form.businessLicensePath,
      createdBy: form.createdBy,
      ownerName: form.ownerName 
    }))

    return NextResponse.json(transformedData, { status: 200 })

  } catch (error) {
    console.error("Error fetching agency requests:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
// app/api/agency-request/route.ts
type StatusType = 'PENDING' | 'APPROVED' | 'REJECTED';

export async function PATCH(request: Request) {
    try {
      const { id, status } = await request.json() as { id: string; status: StatusType };
      
      // Update the status in your database
      const updated = await prisma.agencyForm.update({
        where: { id },
        data: { 
          status: status
        }
      });
  
      return NextResponse.json(updated);
    } catch (error) {
      console.error('Update error:', error);
      return NextResponse.json(
        { error: "Failed to update status" },
        { status: 500 }
      );
    }
  }