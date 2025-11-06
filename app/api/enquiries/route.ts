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

    // Get userId and agencyId from session
    const userId = session.user.id;
    const agencyId = session.user.agencyId;
    
    if (!userId) {
      return NextResponse.json({ error: "No userId found for user" }, { status: 403 });
    }

    // Create the enquiry with both userId and agencyId
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
        tags: enquiryData.tags,
        mustSeeSpots: enquiryData.mustSeeSpots,
        status: enquiryData.status || "enquiry",
        enquiryDate: enquiryData.enquiryDate,
        userId: userId, // Added userId
        agencyId: agencyId,
      }
    });

    // Email notification logic remains the same...
    if (enquiryData.assignedStaff && enquiryData.assignedStaff !== "no-staff") {
      try {
        console.log("Looking for assigned staff:", enquiryData.assignedStaff);
        
        const assignedStaff = await prisma.userForm.findFirst({
          where: {
            id: enquiryData.assignedStaff,
            status: "ACTIVE"
          }
        });

        if (assignedStaff && assignedStaff.email) {
          if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
            await sendEmail({
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
                      <p><strong>Budget:</strong> ${enquiryData.currency || '$'}${enquiryData.budget || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              `
            });
          }
        }
      } catch (emailError) {
        console.error("Error in email notification process:", emailError);
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const enquiryId = searchParams.get("id");

    // Get userId from session
    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json({ error: "No userId found for user" }, { status: 403 });
    }

    // If enquiryId is provided, fetch single enquiry if user is creator or assigned
    if (enquiryId) {
      console.log("Fetching single enquiry with ID:", enquiryId, "for userId:", userId);
      try {
        const enquiry = await prisma.enquiries.findFirst({
          where: { 
            id: enquiryId,
            OR: [
              { userId }, // User is the creator
              { assignedStaff: userId } // Exact match for assigned staff
            ]
          },
        });
        
        if (!enquiry) {
          console.log("Enquiry not found or not authorized:", enquiryId);
          return NextResponse.json({ error: "Enquiry not found or not authorized" }, { status: 404 });
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

    // Fetch all enquiries where user is either the creator or assigned staff
    console.log(`Fetching enquiries for userId: ${userId}`);
    try {
      const enquiries = await prisma.enquiries.findMany({
        where: {
          OR: [
            { userId }, // Enquiries created by this user
            { assignedStaff: userId } // Enquiries where user is in assignedStaff array
          ]
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log(`Found ${enquiries.length} enquiries for userId: ${userId}`);
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

    // Get userId from session
    const userId = session.user.id;

    console.log("Updating enquiry with ID:", id, "for userId:", userId);

    // Check if enquiry exists and belongs to this user
    const existingEnquiry = await prisma.enquiries.findFirst({
      where: { 
        id,
        userId: userId // Only allow update if belongs to this user
      }
    });

    if (!existingEnquiry) {
      return NextResponse.json({ error: "Enquiry not found or not authorized" }, { status: 404 });
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

    // Get userId from session
    const userId = session.user.id;

    console.log("Deleting enquiry with ID:", id, "for userId:", userId);

    // Check if enquiry exists and belongs to this user
    const existingEnquiry = await prisma.enquiries.findFirst({
      where: { 
        id,
        userId: userId // Only allow delete if belongs to this user
      }
    });

    if (!existingEnquiry) {
      return NextResponse.json({ error: "Enquiry not found or not authorized" }, { status: 404 });
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