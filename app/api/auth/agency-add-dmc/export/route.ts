import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    // Build where clause for search
    const whereClause = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { contactPerson: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}

    // Build orderBy clause
    const orderByClause = (() => {
      switch (sortBy) {
        case "name":
          return { name: sortOrder as "asc" | "desc" }
        case "primaryContact":
          return { contactPerson: sortOrder as "asc" | "desc" }
        case "status":
          return { status: sortOrder as "asc" | "desc" }
        default:
          return { createdAt: sortOrder as "asc" | "desc" }
      }
    })()

    // Fetch all DMCs (no pagination for export)
    const dmcs = await prisma.dMCForm.findMany({
      where: whereClause,
      orderBy: orderByClause,
    })

    // Transform data for Excel export
    const excelData = dmcs.map((dmc, index) => ({
      "S.No": index + 1,
      "DMC Name": dmc.name,
      "Primary Contact": dmc.contactPerson || "",
      "Phone Number": `${dmc.phoneCountryCode || "+91"} ${dmc.phoneNumber || ""}`,
      Designation: dmc.designation || "",
      "Owner Name": dmc.ownerName || "",
      "Owner Phone": `${dmc.ownerPhoneCode || "+91"} ${dmc.ownerPhoneNumber || ""}`,
      Email: dmc.email || "",
      Website: dmc.website || "",
      "Primary Country": dmc.primaryCountry || "",
      "Destinations Covered": dmc.destinationsCovered || "",
      Cities: dmc.cities || "",
      "GST Registered": dmc.gstRegistered ? "Yes" : "No",
      "GST Number": dmc.gstNumber || "",
      "Year of Registration": dmc.yearOfRegistration || "",
      "PAN Number": dmc.panNumber || "",
      "PAN Type": dmc.panType || "",
      Headquarters: dmc.headquarters || "",
      Country: dmc.country || "",
      "Years of Experience": dmc.yearsOfExperience || "",
      Status: dmc.status === "ACTIVE" ? "Active" : "Inactive",
      "Created Date": new Date(dmc.createdAt).toLocaleDateString(),
      "Updated Date": new Date(dmc.updatedAt).toLocaleDateString(),
    }))

    // Create CSV content instead of Excel for simplicity
    const csvHeader = Object.keys(excelData[0] || {}).join(",")
    const csvRows = excelData.map((row) =>
      Object.values(row)
        .map((value) => `"${value}"`)
        .join(","),
    )
    const csvContent = [csvHeader, ...csvRows].join("\n")

    // Create response with CSV file
    const response = new NextResponse(csvContent)
    response.headers.set("Content-Type", "text/csv")
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="DMCs_Export_${new Date().toISOString().split("T")[0]}.csv"`,
    )

    return response
  } catch (error) {
    console.error("Error exporting DMCs:", error)
    return NextResponse.json({ error: "Failed to export DMCs" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
