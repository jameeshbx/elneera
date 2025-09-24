import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); 
    }

    const enquiryData = await req.json();
    
    console.log("Creating enquiry:", enquiryData);

    // Get agencyId from session user (assuming agencyId is stored on user)
    const agencyId = session.user.agencyId;
    if (!agencyId) {
      return NextResponse.json({ error: "No agencyId found for user" }, { status: 403 });
    }

    // Create the enquiry with agencyId
    const enquiry = await prisma.enquiries.create({
      data: {
        name: enquiryData.name,
        phone: enquiryData.phone,
        email: enquiryData.email,
        locations: enquiryData.locations,
        tourType: enquiryData.tourType,
        estimatedDates: enquiryData.estimatedDates,
        currency: enquiryData.currency,
        budget: enquiryData.budget,
        notes: enquiryData.notes,
        assignedStaff: enquiryData.assignedStaff,
        pointOfContact: enquiryData.pointOfContact,
        pickupLocation: enquiryData.pickupLocation,
        dropLocation: enquiryData.dropLocation,
        numberOfTravellers: enquiryData.numberOfTravellers,
        numberOfKids: enquiryData.numberOfKids,
        travelingWithPets: enquiryData.travelingWithPets,
        flightsRequired: enquiryData.flightsRequired,
        leadSource: enquiryData.leadSource,
        tags: enquiryData.tags,
        mustSeeSpots: enquiryData.mustSeeSpots,
        status: enquiryData.status || "enquiry",
        enquiryDate: enquiryData.enquiryDate,
        agencyId: agencyId,
      }
    });

    // If staff is assigned, send notification email
    if (enquiryData.assignedStaff && enquiryData.assignedStaff !== "no-staff") {
      try {
        console.log("Looking for assigned staff:", enquiryData.assignedStaff);
        
        // Find the assigned staff member by ID
        const assignedStaff = await prisma.userForm.findFirst({
          where: {
            id: enquiryData.assignedStaff,
            status: "ACTIVE"
          }
        });

        console.log("Found assigned staff:", assignedStaff);

        if (assignedStaff && assignedStaff.email) {
          console.log("Sending notification to assigned staff:", assignedStaff.email);
          
          // Check if email configuration is available - Updated to use SMTP_PASSWORD
          if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
            const emailResult = await sendEmail({
              to: assignedStaff.email,
              subject: "New Enquiry Assigned - Travel Agency",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px;">New Enquiry Assigned!</h1>
                    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">You have been assigned a new enquiry</p>
                  </div>
                  
                  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #374151; margin-top: 0;">Enquiry Details</h2>
                    
                    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <h3 style="color: #4ECDC4; margin-top: 0;">Customer Information:</h3>
                      <p><strong>Name:</strong> ${enquiryData.name}</p>
                      <p><strong>Email:</strong> ${enquiryData.email}</p>
                      <p><strong>Phone:</strong> ${enquiryData.phone}</p>
                      <p><strong>Location:</strong> ${enquiryData.locations || 'Not specified'}</p>
                      <p><strong>Tour Type:</strong> ${enquiryData.tourType || 'Not specified'}</p>
                      <p><strong>Estimated Dates:</strong> ${enquiryData.estimatedDates || 'Not specified'}</p>
                      <p><strong>Budget:</strong> ${enquiryData.currency || '$'}${enquiryData.budget || 'Not specified'}</p>
                      <p><strong>Number of Travellers:</strong> ${enquiryData.numberOfTravellers || 'Not specified'}</p>
                      <p><strong>Number of Kids:</strong> ${enquiryData.numberOfKids || 'Not specified'}</p>
                    </div>
                    
                    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <h3 style="color: #92400e; margin-top: 0;">📝 Notes</h3>
                      <p>${enquiryData.notes || 'No additional notes provided.'}</p>
                    </div>
                    
                    <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <h3 style="color: #065f46; margin-top: 0;">🚀 Next Steps</h3>
                      <p>Please review this enquiry and take appropriate action:</p>
                      <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Contact the customer to discuss their requirements</li>
                        <li>Create an itinerary based on their preferences</li>
                        <li>Update the enquiry status in the dashboard</li>
                      </ul>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px;">
                      <p style="color: #6b7280; font-size: 14px;">Please log into your dashboard to manage this enquiry.</p>
                      <p style="color: #6b7280; font-size: 14px;">Best regards,<br><strong>Travel Agency Team</strong></p>
                    </div>
                  </div>
                </div>
              `
            });

            console.log("Email send result:", emailResult);

            if (emailResult.success) {
              console.log("Staff notification email sent successfully to:", assignedStaff.email);
            } else {
              console.log("Failed to send staff notification email:", emailResult.error);
            }
          } else {
            console.log("Email configuration not available. Missing environment variables:");
            console.log("SMTP_HOST:", !!process.env.SMTP_HOST);
            console.log("SMTP_USER:", !!process.env.SMTP_USER);
            console.log("SMTP_PASSWORD:", !!process.env.SMTP_PASSWORD);
          }
        } else {
          console.log("Assigned staff not found or missing email:", {
            staffFound: !!assignedStaff,
            hasEmail: assignedStaff?.email ? true : false,
            searchedFor: enquiryData.assignedStaff
          });
          
          // Debug: Let's see what staff members exist
          const allStaff = await prisma.userForm.findMany({
            where: { status: "ACTIVE" },
            select: { name: true, email: true, status: true }
          });
          console.log("Available active staff:", allStaff);
        }
      } catch (emailError) {
        console.error("Error in email notification process:", emailError);
        // Don't fail the enquiry creation if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Enquiry created successfully",
      data: enquiry
    }, { status: 201 });

  } catch (error: unknown) {
    console.error("Error creating enquiry:", error);
    const message = error instanceof Error ? error.message : "Failed to create enquiry";
    return NextResponse.json({
      error: message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Enhanced GET method with support for both single enquiry and all enquiries
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const enquiryId = searchParams.get("id");

    // Get agencyId from session user (assuming agencyId is stored on user)
    // If not, adjust according to your session structure
    const agencyId = session.user.agencyId;
    if (!agencyId) {
      return NextResponse.json({ error: "No agencyId found for user" }, { status: 403 });
    }

    // If enquiryId is provided, fetch single enquiry (but only if it belongs to this agency)
    if (enquiryId) {
      console.log("Fetching single enquiry with ID:", enquiryId);
      try {
        const enquiry = await prisma.enquiries.findUnique({
          where: { id: enquiryId },
        });
        if (!enquiry) {
          console.log("Enquiry not found:", enquiryId);
          return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
        }
        if (enquiry.agencyId !== agencyId) {
          return NextResponse.json({ error: "Forbidden: Not your agency's enquiry" }, { status: 403 });
        }
        return NextResponse.json(enquiry);
      } catch (dbError) {
        console.error("Database error while fetching enquiry:", dbError);
        return NextResponse.json({
          error: "Database error",
          details: dbError instanceof Error ? dbError.message : String(dbError)
        }, { status: 500 });
      }
    }

    // If no enquiryId, fetch all enquiries for this agency only
    console.log(`Fetching all enquiries for agencyId: ${agencyId}`);
    try {
      const enquiries = await prisma.enquiries.findMany({
        where: { agencyId },
        orderBy: {
          createdAt: 'desc'
        }
      });
      console.log(`Found ${enquiries.length} enquiries for agencyId: ${agencyId}`);
      return NextResponse.json(enquiries);
    } catch (dbError) {
      console.error("Database error while fetching enquiries:", dbError);
      return NextResponse.json({
        error: "Database error",
        details: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 });
    }

  } catch (error: unknown) {
    console.error("Error in GET enquiries:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch enquiries";
    return NextResponse.json({
      error: message,
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json()
    const { id, ...updateData } = data

    if (!id) {
      return NextResponse.json({ error: "Enquiry ID is required" }, { status: 400 })
    }

    console.log("Updating enquiry with ID:", id, "Data:", updateData);

    // Check if enquiry exists first
    const existingEnquiry = await prisma.enquiries.findUnique({
      where: { id }
    });

    if (!existingEnquiry) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }

    const updatedEnquiry = await prisma.enquiries.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    })

    console.log("Enquiry updated successfully:", updatedEnquiry);
    return NextResponse.json(updatedEnquiry)
  } catch (error) {
    console.error("Error updating enquiry:", error)
    return NextResponse.json(
      { error: "Failed to update enquiry", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Enquiry ID is required" }, { status: 400 })
    }

    console.log("Deleting enquiry with ID:", id);

    // Check if enquiry exists first
    const existingEnquiry = await prisma.enquiries.findUnique({
      where: { id }
    });

    if (!existingEnquiry) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }

    await prisma.enquiries.delete({
      where: { id },
    })

    console.log("Enquiry deleted successfully");
    return NextResponse.json({ message: "Enquiry deleted successfully" })
  } catch (error) {
    console.error("Error deleting enquiry:", error)
    return NextResponse.json(
      { error: "Failed to delete enquiry", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect();
  }
}