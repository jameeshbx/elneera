import { type NextRequest, NextResponse } from "next/server"
import { Commission, PrismaClient, SharedDMC } from "@prisma/client"
import { sendEmail } from "@/lib/email"
import fs from "fs"
import path from "path"

const prisma = new PrismaClient()

type DMCStatus = "AWAITING_TRANSFER" | "VIEWED" | "AWAITING_INTERNAL_REVIEW" | "QUOTATION_RECEIVED" | "REJECTED"

interface LocalEmailResult {
  dmcId: string;
  dmcName: string;
  email: string;
  sent: boolean;
  error?: string;
  messageId?: string;
}

interface SharedDMCItemWithDMC {
  id: string;
  dmcId: string;
  status: string;
  notes?: string;
  updatedAt: Date;
  dmc: {
    id: string;
    name: string;
    contactPerson: string | null;
    email: string | null;
    phoneNumber: string | null;
    designation: string | null;
    status: string;
    primaryCountry: string | null;
    destinationsCovered: string | null;
    cities: string | null;
  };
}

// Helper function to find PDF file
function findPdfFile(pdfUrl: string, enquiryId: string): string | null {
  console.log("🔍 Finding PDF file for URL:", pdfUrl)
  
  const possiblePaths = [
    path.join(process.cwd(), 'public', pdfUrl.replace(/^\//, '')),
    path.join(process.cwd(), pdfUrl.replace(/^\//, '')),
    path.join(process.cwd(), 'public', pdfUrl),
    path.join(process.cwd(), 'public', 'uploads', 'pdfs', `itinerary-${enquiryId}.pdf`),
    path.join(process.cwd(), 'public', 'generated-pdfs', `itinerary-${enquiryId}.pdf`),
    path.join(process.cwd(), 'public', 'uploads', `itinerary-${enquiryId}.pdf`),
    pdfUrl,
  ]
  
  for (const pdfPath of possiblePaths) {
    console.log("  Checking:", pdfPath)
    if (fs.existsSync(pdfPath)) {
      const stats = fs.statSync(pdfPath)
      console.log("  ✅ Found! Size:", stats.size, "bytes")
      return pdfPath
    }
  }
  
  console.log("  ❌ PDF file not found in any location")
  return null
}



// GET - Fetch all shared DMCs with their details
export async function GET(request: NextRequest) {
  let prismaConnected = false;
  
  try {
    console.log("=== Shared DMC API GET Request Started ===")
    const { searchParams } = new URL(request.url)
    const enquiryId = searchParams.get("enquiryId")
    const customerId = searchParams.get("customerId")
    const locations = searchParams.get("locations")
    
    console.log("Request parameters:", { enquiryId, customerId, locations })
    
    await prisma.$connect()
    prismaConnected = true
    console.log("✅ Database connection established")
    
    const dmcWhereClause: Record<string, unknown> = { status: "ACTIVE" }

    if (locations) {
      const locationArray = locations.split(',').map(loc => loc.trim())
      dmcWhereClause.OR = locationArray.flatMap(location => [
        { primaryCountry: { contains: location, mode: "insensitive" } },
        { destinationsCovered: { contains: location, mode: "insensitive" } },
        { cities: { contains: location, mode: "insensitive" } }
      ])
    }

    type DMCRecord = {
      id: string;
      name: string;
      contactPerson: string | null;
      email: string | null;
      phoneNumber: string | null;
      designation: string | null;
      status: string;
      primaryCountry: string | null;
      destinationsCovered: string | null;
      cities: string | null;
      createdAt: Date | null;
      updatedAt: Date | null;
    }
    
    let dmcs: DMCRecord[] = []
    try {
      dmcs = await prisma.dMCForm.findMany({
        where: dmcWhereClause,
        select: {
          id: true,
          name: true,
          contactPerson: true,
          email: true,
          phoneNumber: true,
          designation: true,
          status: true,
          primaryCountry: true,
          destinationsCovered: true,
          cities: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          name: "asc"
        }
      })
      console.log(`✅ Found ${dmcs.length} DMCs`)
    } catch (error) {
      console.error("❌ Error fetching DMCForm records:", error)
      dmcs = []
    }

    let sharedDMCs: (SharedDMC & { sharedDMCItems: SharedDMCItemWithDMC[] })[] = []
    try {
      const whereClause: Record<string, unknown> = {}
      if (enquiryId) whereClause.enquiryId = enquiryId
      if (customerId) whereClause.customerId = customerId

      console.log("Fetching shared DMCs with where clause:", whereClause)

      sharedDMCs = await prisma.sharedDMC.findMany({
        where: whereClause,
        include: {
          sharedDMCItems: {
            include: {
              dmc: true,
            },
          },
        },
      }) as (SharedDMC & { sharedDMCItems: SharedDMCItemWithDMC[] })[]
      
      console.log(`✅ Found ${sharedDMCs.length} shared DMCs`)
    } catch (error) {
      console.error("❌ Error fetching SharedDMC records:", error)
      console.error("Error details:", error instanceof Error ? error.message : "Unknown error")
      sharedDMCs = []
    }

    let commissions: Commission[] = []
    try {
      if (enquiryId) {
        commissions = await prisma.commission.findMany({
          where: { enquiryId },
        })
        console.log(`✅ Found ${commissions.length} commissions`)
      }
    } catch (error) {
      console.error("❌ Error fetching Commission records:", error)
      commissions = []
    }

    const transformedDMCs = dmcs.map((dmc) => ({
      id: dmc.id,
      name: dmc.name,
      primaryContact: dmc.contactPerson || "",
      phoneNumber: dmc.phoneNumber || "",
      designation: dmc.designation || "",
      email: dmc.email || "",
      status: dmc.status === "ACTIVE" ? "Active" : "Inactive",
      primaryCountry: dmc.primaryCountry || "",
      destinationsCovered: dmc.destinationsCovered || "",
      cities: dmc.cities || "",
      createdAt: dmc.createdAt?.toISOString() || "",
      updatedAt: dmc.updatedAt?.toISOString() || "",
    }))

    const transformedSharedDMCs = sharedDMCs.map((shared) => {
      try {
        return {
          id: shared.id,
          dateGenerated: shared.dateGenerated ? shared.dateGenerated.toLocaleDateString("en-GB") : new Date().toLocaleDateString("en-GB"),
          pdf: shared.pdfUrl ? "D" : "B",
          pdfUrl: shared.pdfUrl,
          activeStatus: shared.isActive,
          enquiryId: shared.enquiryId || enquiryId || "default-enquiry",
          customerId: shared.customerId || customerId,
          assignedStaffId: shared.assignedStaffId,
          selectedDMCs: (shared.sharedDMCItems || []).map((item) => {
            const commission = commissions.find(c => c.dmcId === item.dmcId && c.enquiryId === (shared.enquiryId || enquiryId))
            return {
              id: item.id,
              dmcId: item.dmcId,
              status: item.status as DMCStatus,
              dmc: {
                id: item.dmc.id,
                name: item.dmc.name,
                primaryContact: item.dmc.contactPerson || "",
                phoneNumber: item.dmc.phoneNumber || "",
                designation: item.dmc.designation || "",
                email: item.dmc.email || "",
                status: item.dmc.status === "ACTIVE" ? "Active" : "Inactive",
                primaryCountry: item.dmc.primaryCountry || "",
                destinationsCovered: item.dmc.destinationsCovered || "",
                cities: item.dmc.cities || "",
              },
              lastUpdated: item.updatedAt ? item.updatedAt.toISOString() : new Date().toISOString(),
              quotationAmount: commission?.quotationAmount,
              markupPrice: commission?.markupPrice,
              commissionAmount: commission?.commissionAmount,
              commissionType: commission?.commissionType,
              notes: commission?.comments || item.notes || "",
            }
          }),
        }
      } catch (error) {
        console.error("Error transforming shared DMC:", shared.id, error)
        return {
          id: shared.id,
          dateGenerated: new Date().toLocaleDateString("en-GB"),
          pdf: "B",
          pdfUrl: shared.pdfUrl,
          activeStatus: shared.isActive,
          enquiryId: shared.enquiryId || enquiryId || "default-enquiry",
          customerId: shared.customerId || customerId,
          assignedStaffId: shared.assignedStaffId,
          selectedDMCs: [],
        }
      }
    })

    const mockSharedItineraries = transformedSharedDMCs.length > 0 ? transformedSharedDMCs : [
      {
        id: "shared-1",
        dateGenerated: new Date().toLocaleDateString("en-GB"),
        pdf: "B",
        pdfUrl: null,
        activeStatus: true,
        enquiryId: enquiryId || "enquiry-1",
        customerId: customerId || "customer-1",
        assignedStaffId: "staff-1",
        selectedDMCs: [],
      },
    ]

    const response = {
      success: true,
      data: mockSharedItineraries,
      availableDMCs: transformedDMCs,
    }

    console.log("=== Response Summary ===")
    console.log(`Shared DMCs: ${mockSharedItineraries.length}`)
    console.log(`Available DMCs: ${transformedDMCs.length}`)
    
    return NextResponse.json(response)
  } catch (error) {
    console.error("=== Shared DMC API Error ===", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("Error name:", error instanceof Error ? error.name : "Unknown")
    console.error("Error message:", error instanceof Error ? error.message : "Unknown error")
    
    return NextResponse.json({ 
      error: "Failed to fetch shared DMCs", 
      details: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      success: false 
    }, { status: 500 })
  } finally {
    console.log("=== Shared DMC API Request Completed ===")
    if (prismaConnected) {
      try {
        await prisma.$disconnect()
        console.log("✅ Database disconnected")
      } catch (disconnectError) {
        console.error("Error disconnecting from database:", disconnectError)
      }
    }
  }
}

// POST - Create new shared DMC entry and send email with PDF
export async function POST(request: NextRequest) {
  let prismaConnected = false;
  
  try {
    await prisma.$connect()
    prismaConnected = true
    
    console.log("=== POST Share DMC Started ===")
    
    const body = await request.json()
    const { selectedDMCs: selectedDMCIds, enquiryId, customerId, pdfPath, selectedItinerary, dateGenerated, assignedStaffId } = body

    console.log("📥 POST request body:", { 
      selectedDMCIds, 
      enquiryId, 
      customerId, 
      pdfPath, 
      selectedItinerary: selectedItinerary ? {
        id: selectedItinerary.id,
        pdfUrl: selectedItinerary.pdfUrl,
        activePdfUrl: selectedItinerary.activePdfUrl
      } : 'missing',
      dateGenerated, 
      assignedStaffId 
    })

    // Validate required fields
    if (!selectedDMCIds || selectedDMCIds.length === 0) {
      console.error("❌ No DMCs selected")
      return NextResponse.json({ 
        error: "At least one DMC must be selected",
        success: false 
      }, { status: 400 })
    }

    if (!enquiryId) {
      console.error("❌ No enquiry ID provided")
      return NextResponse.json({ 
        error: "Enquiry ID is required",
        success: false 
      }, { status: 400 })
    }

    // Fetch the selected DMCs from database
    console.log("🔍 Fetching DMCs from database...")
    const selectedDMCs = await prisma.dMCForm.findMany({
      where: {
        id: { in: selectedDMCIds },
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        contactPerson: true,
        email: true,
        phoneNumber: true,
        designation: true,
        status: true,
        primaryCountry: true,
        destinationsCovered: true,
        cities: true,
      },
    })

    if (selectedDMCs.length === 0) {
      console.error("❌ No active DMCs found with provided IDs")
      return NextResponse.json({ 
        error: "No active DMCs found with the provided IDs",
        success: false 
      }, { status: 400 })
    }

    console.log(`✅ Found ${selectedDMCs.length} active DMCs`)

    // Get customer/enquiry details
    let customerDetails: { name: string; locations?: string } = { name: "Valued Customer" }
    if (enquiryId) {
      try {
        const enquiry = await prisma.enquiries.findUnique({
          where: { id: enquiryId },
          select: { name: true, locations: true },
        })
        if (enquiry) {
          customerDetails = {
            name: enquiry.name,
            locations: enquiry.locations || undefined
          }
          console.log("✅ Found enquiry details:", customerDetails)
        }
      } catch (error) {
        console.log("⚠️ Could not fetch enquiry details:", error)
      }
    }

    // Prepare PDF attachment - UPDATED LOGIC
    let pdfFilePath: string | null = null
    
    console.log("\n=== PDF Attachment Preparation ===")
    console.log("selectedItinerary:", selectedItinerary)
    console.log("pdfPath:", pdfPath)
    
    // Priority 1: Use activePdfUrl from selectedItinerary (NEW)
    if (selectedItinerary?.activePdfUrl) {
      console.log("📄 PDF URL from selectedItinerary.activePdfUrl:", selectedItinerary.activePdfUrl)
      pdfFilePath = findPdfFile(selectedItinerary.activePdfUrl, enquiryId)
    } 
    // Priority 2: Use pdfUrl from selectedItinerary
    else if (selectedItinerary?.pdfUrl) {
      console.log("📄 PDF URL from selectedItinerary.pdfUrl:", selectedItinerary.pdfUrl)
      pdfFilePath = findPdfFile(selectedItinerary.pdfUrl, enquiryId)
    } 
    // Priority 3: Use pdfPath parameter
    else if (pdfPath) {
      console.log("📄 PDF path from request:", pdfPath)
      pdfFilePath = findPdfFile(pdfPath, enquiryId)
    } else {
      console.log("⚠️ No PDF URL or path provided")
    }

    // Prepare attachment object
    let attachments: Array<{ filename: string; path: string; contentType: string }> | undefined = undefined
    
    if (pdfFilePath) {
      attachments = [{
        filename: `itinerary-${enquiryId}.pdf`,
        path: pdfFilePath,
        contentType: "application/pdf",
      }]
      console.log("✅ PDF attachment prepared:", pdfFilePath)
    } else {
      console.log("⚠️ No PDF will be attached to emails")
    }

    // Send emails to all selected DMCs
    console.log(`\n=== Starting email sending to ${selectedDMCs.length} DMCs ===`)
    const emailResults: LocalEmailResult[] = []
    
    for (const dmc of selectedDMCs) {
      console.log(`\n--- Processing DMC: ${dmc.name} ---`)
      console.log(`    Email: ${dmc.email}`)
      
      if (!dmc.email) {
        console.log(`    ❌ No email address`)
        emailResults.push({
          dmcId: dmc.id,
          dmcName: dmc.name,
          email: "No email provided",
          sent: false,
          error: "DMC has no email address",
        })
        continue
      }

      try {
        const emailResult = await sendEmail({
          to: dmc.email,
          subject: `New Itinerary Request - ${enquiryId}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4ECDC4;">New Itinerary Request</h2>
              <p>Dear ${dmc.name},</p>
              <p>You have been added to a new itinerary request for quotation.</p>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Request Details:</h3>
                <p><strong>Enquiry ID:</strong> ${enquiryId}</p>
                <p><strong>Customer:</strong> ${customerDetails.name}</p>
                <p><strong>Date Generated:</strong> ${dateGenerated || new Date().toISOString().split("T")[0]}</p>
                <p><strong>Destinations:</strong> ${dmc.destinationsCovered || 'As per attached itinerary'}</p>
                ${customerDetails.locations ? `<p><strong>Requested Locations:</strong> ${customerDetails.locations}</p>` : ''}
              </div>
              <p>Please review the ${attachments ? 'attached itinerary' : 'itinerary details'} and provide your quotation.</p>
              <div style="background-color: #e8f5f4; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h4 style="margin-top: 0;">🎯 Next Steps</h4>
                <ol>
                  <li><strong>Review</strong> the attached itinerary carefully</li>
                  <li><strong>Prepare</strong> your detailed quotation</li>
                  <li><strong>Submit</strong> your competitive quote within 48 hours</li>
                </ol>
                <div style="text-align: center; margin-top: 20px;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dmc-quote?enquiryId=${enquiryId}&dmcId=${dmc.id}" 
                     style="background-color: #4ECDC4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Submit Your Quote
                  </a>
                </div>
              </div>
              <p>We look forward to your response!</p>
              <p>Best regards,<br><strong>Travel Team</strong></p>
            </div>
          `,
          attachments: attachments,
        })
        
        emailResults.push({
          dmcId: dmc.id,
          dmcName: dmc.name,
          email: dmc.email,
          sent: emailResult.success || false,
          error: emailResult.success ? undefined : (emailResult.error || "Failed to send email"),
          messageId: emailResult.messageId ?? undefined,
        })

        if (!emailResult.success) {
          console.error(`    ❌ Email failed:`, emailResult.error)
        } else {
          console.log(`    ✅ Email sent successfully`)
        }

      } catch (emailError) {
        console.error(`    ❌ Error sending email:`, emailError)
        emailResults.push({
          dmcId: dmc.id,
          dmcName: dmc.name,
          email: dmc.email,
          sent: false,
          error: emailError instanceof Error ? emailError.message : "Failed to send email",
        })
      }
    }

    console.log(`\n=== Email Summary ===`)
    console.log(`Total DMCs: ${selectedDMCs.length}`)
    console.log(`Emails sent: ${emailResults.filter(r => r.sent).length}`)
    console.log(`Emails failed: ${emailResults.filter(r => !r.sent).length}`)

    // Create the shared DMC record in database
    console.log("\n=== Creating database records ===")
    
    // Store the PDF URL properly - prefer activePdfUrl
    const storedPdfUrl = selectedItinerary?.activePdfUrl || selectedItinerary?.pdfUrl || pdfPath || null
    
    // Parse dateGenerated - handle different formats
    let parsedDate = new Date()
    if (dateGenerated) {
      try {
        const cleanDate = dateGenerated.replace(/\s+/g, '').replace(/\./g, '-')
        const parts = cleanDate.split(/[-/]/)
        if (parts.length === 3) {
          const day = parseInt(parts[0])
          const month = parseInt(parts[1]) - 1
          const year = parseInt(parts[2])
          parsedDate = new Date(year, month, day)
          
          if (isNaN(parsedDate.getTime())) {
            console.warn("Invalid date format, using current date")
            parsedDate = new Date()
          }
        } else {
          parsedDate = new Date(dateGenerated)
          if (isNaN(parsedDate.getTime())) {
            console.warn("Invalid date format, using current date")
            parsedDate = new Date()
          }
        }
      } catch (error) {
        console.warn("Failed to parse dateGenerated:", error)
        parsedDate = new Date()
      }
    }
    
    console.log("Parsed date:", parsedDate.toISOString())
    
    const newSharedDMC = await prisma.sharedDMC.create({
      data: {
        enquiryId: enquiryId,
        customerId: customerId || undefined,
        assignedStaffId: assignedStaffId || undefined,
        dateGenerated: parsedDate,
        pdfUrl: storedPdfUrl,
        isActive: true,
        status: "PENDING",
      },
    })

    console.log("✅ Created SharedDMC record:", newSharedDMC.id)

    // Create SharedDMCItem records
    const sharedDMCItems = await Promise.all(
      selectedDMCs.map(async (dmc) => {
        return await prisma.sharedDMCItem.create({
          data: {
            sharedDMCId: newSharedDMC.id,
            dmcId: dmc.id,
            status: "AWAITING_TRANSFER",
          },
        })
      })
    )

    console.log(`✅ Created ${sharedDMCItems.length} SharedDMCItems`)

    // Fetch complete record
    const sharedDMCWithItems = await prisma.sharedDMC.findUnique({
      where: { id: newSharedDMC.id },
      include: {
        sharedDMCItems: {
          include: {
            dmc: true
          }
        }
      }
    })

    if (!sharedDMCWithItems) {
      throw new Error("Failed to fetch created shared DMC record")
    }

    // Format response
    const response = {
      success: true,
      message: "DMC sharing created successfully and emails sent",
      data: {
        id: sharedDMCWithItems.id,
        enquiryId: sharedDMCWithItems.enquiryId,
        customerId: sharedDMCWithItems.customerId,
        assignedStaffId: sharedDMCWithItems.assignedStaffId,
        dateGenerated: sharedDMCWithItems.dateGenerated.toISOString(),
        activeStatus: sharedDMCWithItems.isActive,
        pdf: sharedDMCWithItems.pdfUrl ? "D" : "B",
        pdfUrl: sharedDMCWithItems.pdfUrl,
        selectedDMCs: sharedDMCWithItems.sharedDMCItems.map(item => ({
          id: item.id,
          dmcId: item.dmcId,
          status: item.status,
          dmc: {
            id: item.dmc.id,
            name: item.dmc.name,
            primaryContact: item.dmc.contactPerson || "",
            contactPerson: item.dmc.contactPerson || "",
            email: item.dmc.email || "",
            phoneNumber: item.dmc.phoneNumber || "",
            designation: item.dmc.designation || "",
            status: item.dmc.status,
            primaryCountry: item.dmc.primaryCountry || "",
            destinationsCovered: item.dmc.destinationsCovered || "",
            cities: item.dmc.cities || ""
          },
          lastUpdated: item.updatedAt.toISOString(),
          notes: item.notes || ""
        }))
      },
      emailResults: emailResults,
      emailSummary: {
        total: emailResults.length,
        sent: emailResults.filter(r => r.sent).length,
        failed: emailResults.filter(r => !r.sent).length
      }
    }

    console.log("=== POST Share DMC Completed Successfully ===\n")
    return NextResponse.json(response)
    
  } catch (error) {
    console.error("\n=== Error in POST Share DMC ===")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace")
    
    return NextResponse.json({ 
      error: "Failed to create shared DMC",
      details: error instanceof Error ? error.message : "Unknown error",
      success: false 
    }, { status: 500 })
  } finally {
    if (prismaConnected) {
      await prisma.$disconnect()
    }
  }
}

// PUT - Update shared DMC
export async function PUT(request: NextRequest) {
  let prismaConnected = false;
  
  try {
    await prisma.$connect()
    prismaConnected = true
    
    const body = await request.json()
    const { id, action, ...updateData } = body

    console.log("PUT request:", { id, action })

    if (action === "toggleActive") {
      const updated = await prisma.sharedDMC.update({
        where: { id },
        data: { 
          isActive: updateData.isActive,
          updatedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        message: "Active status updated",
        data: { id, activeStatus: updated.isActive },
      })
    }

    if (action === "updateDMCStatus") {
      if (!updateData.itemId) {
        return NextResponse.json({ 
          error: "itemId is required",
          success: false 
        }, { status: 400 })
      }

      const updated = await prisma.sharedDMCItem.update({
        where: { id: updateData.itemId },
        data: { 
          status: updateData.status,
          notes: updateData.notes,
          updatedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        message: "DMC status updated",
        data: { 
          id: updated.id, 
          status: updated.status, 
          notes: updated.notes,
          updatedAt: updated.updatedAt.toISOString(),
        },
      })
    }

    if (action === "addCommission") {
      const { enquiryId, dmcId, quotationAmount, commissionType, commissionAmount, markupPrice, comments } = updateData

      if (!enquiryId || !dmcId) {
        return NextResponse.json({ 
          error: "enquiryId and dmcId are required",
          success: false 
        }, { status: 400 })
      }

      const commission = await prisma.commission.upsert({
        where: {
          enquiryId_dmcId: {
            enquiryId: enquiryId,
            dmcId: dmcId,
          },
        },
        create: {
          enquiryId,
          dmcId,
          quotationAmount: parseFloat(quotationAmount) || 0,
          commissionType,
          commissionAmount: parseFloat(commissionAmount) || 0,
          markupPrice: parseFloat(markupPrice) || 0,
          comments,
        },
        update: {
          quotationAmount: parseFloat(quotationAmount) || 0,
          commissionType,
          commissionAmount: parseFloat(commissionAmount) || 0,
          markupPrice: parseFloat(markupPrice) || 0,
          comments,
          updatedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        message: "Commission added successfully",
        data: {
          id,
          commission: {
            id: commission.id,
            enquiryId: commission.enquiryId,
            dmcId: commission.dmcId,
            quotationAmount: commission.quotationAmount,
            commissionType: commission.commissionType,
            commissionAmount: commission.commissionAmount,
            markupPrice: commission.markupPrice,
            comments: commission.comments,
          },
        },
      })
    }

    if (action === "shareToCustomer") {
      const { enquiryId, customerId, dmcId, itineraryId } = updateData

      const commission = await prisma.commission.findUnique({
        where: {
          enquiryId_dmcId: {
            enquiryId: enquiryId,
            dmcId: dmcId,
          },
        },
      })

      if (!commission) {
        return NextResponse.json({ 
          error: "Commission not found. Please set margin first.",
          success: false 
        }, { status: 400 })
      }

      let customer: { name: string; email: string; phone: string | null; locations?: string } | null = null;

      if (enquiryId) {
        const enquiry = await prisma.enquiries.findUnique({
          where: { id: enquiryId },
          select: { name: true, email: true, phone: true, locations: true },
        })
        
        if (enquiry) {
          customer = {
            name: enquiry.name,
            email: enquiry.email,
            phone: enquiry.phone,
            locations: enquiry.locations || undefined
          }
        }
      }
      
      if (!customer && customerId) {
        const directCustomer = await prisma.customers.findUnique({
          where: { id: customerId },
          select: { name: true, email: true, phone: true },
        })
        
        if (directCustomer) {
          customer = directCustomer
        }
      }

      if (!customer) {
        return NextResponse.json({ 
          error: "Customer not found",
          success: false 
        }, { status: 404 })
      }

      const dmc = await prisma.dMCForm.findUnique({
        where: { id: dmcId },
        select: { name: true }
      });

      const customerPdfUrl = `/uploads/customer-quotes/quote-${enquiryId || customerId}-${Date.now()}.pdf`;
      const emailAttachments: Array<{ filename: string; path: string; contentType: string }> = []
      
      const selectedItinerary = await prisma.itineraries.findUnique({
        where: { id: itineraryId },
        select: { pdfUrl: true, destinations: true }
      })
      
      if (selectedItinerary?.pdfUrl) {
        const pdfUrl = String(selectedItinerary.pdfUrl);
        const pdfFilePath = findPdfFile(pdfUrl, enquiryId)
        
        if (pdfFilePath) {
          emailAttachments.push({
            filename: `${selectedItinerary.destinations || 'itinerary'}.pdf`,
            path: pdfFilePath,
            contentType: 'application/pdf'
          })
        }
      }
      const markupPrice = commission.markupPrice ?? 0
      const emailResult = await sendEmail({
        to: customer.email,
        subject: `Your Travel Quote is Ready! - ${enquiryId || 'Quote Request'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="background: linear-gradient(135deg, #4ECDC4, #44A08D); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Your Travel Quote is Ready!</h1>
              <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Customized Just for You by ${dmc ? dmc.name : 'Our Team'}</p>
            </div>
            <p>Dear ${customer.name},</p>
            <p>Thank you for your interest in our travel services. We're excited to share your customized quote!</p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Quote Summary:</h3>
              <p><strong>Destination:</strong> ${customer.locations || 'As per itinerary'}</p>
              <p><strong>Total Price:</strong> ${markupPrice}</p>
              <p><strong>Quote Valid Until:</strong> ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
            </div>
            <p>Please find your detailed itinerary and quote attached to this email.</p>
            <div style="background-color: #e8f5f4; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Ready to Book?</strong></p>
              <p style="margin: 10px 0 0 0;">Contact us to confirm your booking or if you have any questions about your quote.</p>
            </div>
            <p>We look forward to making your travel dreams come true!</p>
            <p>Best regards,<br>
            <strong>Your Travel Team</strong><br>
            <em>Creating Unforgettable Journeys</em></p>
          </div>
        `,
        attachments: emailAttachments,
      })

      let sharedPdf = null
      try {
        sharedPdf = await prisma.sharedCustomerPdf.create({
          data: {
            itineraryId: itineraryId,
            customerId: customerId || enquiryId,
            enquiryId: enquiryId,
            pdfUrl: customerPdfUrl,
            pdfFileName: `travel-quote-${enquiryId || customerId}.pdf`,
            customerName: customer.name,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            emailSent: emailResult.success || false,
            emailSentAt: emailResult.success ? new Date() : null,
            createdBy: "system",
          },
        })
      } catch (error) {
        console.log("Could not create shared customer PDF record:", error)
      }

      return NextResponse.json({
        success: true,
        message: "Quote shared with customer successfully",
        data: {
          id,
          sharedPdf: sharedPdf ? {
            id: sharedPdf.id,
            customerName: sharedPdf.customerName,
            customerEmail: sharedPdf.customerEmail,
            emailSent: sharedPdf.emailSent,
            markupPrice: commission?.markupPrice,
          } : null,
        },
      })
    }

    if (action === "addDMC") {
      if (!updateData.dmcId) {
        return NextResponse.json({ 
          error: "dmcId is required",
          success: false 
        }, { status: 400 })
      }

      const dmc = await prisma.dMCForm.findUnique({
        where: { id: updateData.dmcId },
        select: {
          id: true,
          name: true,
          contactPerson: true,
          email: true,
          phoneNumber: true,
          designation: true,
          status: true,
          primaryCountry: true,
          destinationsCovered: true,
          cities: true,
        },
      })

      if (!dmc) {
        return NextResponse.json({ 
          error: "DMC not found",
          success: false 
        }, { status: 404 })
      }

      let sharedDMCItem = await prisma.sharedDMCItem.findFirst({
        where: {
          sharedDMCId: id,
          dmcId: updateData.dmcId,
        },
      });

      if (!sharedDMCItem) {
        sharedDMCItem = await prisma.sharedDMCItem.create({
          data: {
            sharedDMCId: id,
            dmcId: updateData.dmcId,
            status: "AWAITING_TRANSFER",
          },
        })
      }

      const transformedDMC = {
        id: dmc.id,
        name: dmc.name,
        primaryContact: dmc.contactPerson || "",
        phoneNumber: dmc.phoneNumber || "",
        designation: dmc.designation || "",
        email: dmc.email || "",
        status: dmc.status === "ACTIVE" ? "Active" : "Inactive",
        primaryCountry: dmc.primaryCountry || "",
        destinationsCovered: dmc.destinationsCovered || "",
        cities: dmc.cities || "",
      }

      return NextResponse.json({
        success: true,
        message: "DMC added successfully",
        data: {
          id,
          selectedDMCs: [
            {
              id: sharedDMCItem.id,
              dmcId: updateData.dmcId,
              status: "AWAITING_TRANSFER" as DMCStatus,
              dmc: transformedDMC,
              lastUpdated: new Date().toISOString(),
              notes: "",
            },
          ],
        },
      })
    }

    return NextResponse.json({ 
      error: "Invalid action",
      success: false 
    }, { status: 400 })
  } catch (error) {
    console.error("Error updating shared DMC:", error)
    return NextResponse.json({ 
      error: "Failed to update shared DMC",
      details: error instanceof Error ? error.message : "Unknown error",
      success: false 
    }, { status: 500 })
  } finally {
    if (prismaConnected) {
      await prisma.$disconnect()
    }
  }
}

// DELETE - Remove shared DMC entry
export async function DELETE(request: NextRequest) {
  let prismaConnected = false;
  
  try {
    await prisma.$disconnect()
    prismaConnected = true
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ 
        error: "ID is required",
        success: false 
      }, { status: 400 })
    }

    await prisma.sharedDMCItem.deleteMany({
      where: { sharedDMCId: id },
    })

    await prisma.sharedDMC.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: "Shared DMC deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting shared DMC:", error)
    return NextResponse.json({ 
      error: "Failed to delete shared DMC",
      details: error instanceof Error ? error.message : "Unknown error",
      success: false 
    }, { status: 500 })
  } finally {
    if (prismaConnected) {
      await prisma.$disconnect()
    }
  }
}