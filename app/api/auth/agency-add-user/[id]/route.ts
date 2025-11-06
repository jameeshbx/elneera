import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Create a single Prisma Client and reuse it
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

if (process.env.NODE_ENV !== 'production') { 
  globalForPrisma.prisma = prisma;
}

type RouteParams = {
  id: string;
};

// GET a single user by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  try {
    console.log("=== Starting GET /api/auth/agency-add-user/[id] ===");
    
    // 1. Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.error("❌ Unauthorized - No session found");
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    const currentUserId = session.user.id;
    console.log("🔑 Current user ID:", currentUserId);

    // 2. Get user ID from params
    let userId: string;
    try {
      const params = await context.params;
      userId = params.id;
      console.log("📝 Requested user ID:", userId);
    } catch (paramError) {
      console.error("❌ Error getting params:", paramError);
      return NextResponse.json({
        success: false,
        error: "Invalid user ID format"
      }, { status: 400 });
    }

    if (!userId) {
      console.error("❌ No user ID provided");
      return NextResponse.json({ 
        success: false,
        error: "User ID is required" 
      }, { status: 400 });
    }

    // 3. Try to fetch the user
    let user;
    try {
      console.log("🔍 Fetching user from database...");
      user = await prisma.userForm.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          agencyId: true,
          userType: true,
          phoneNumber: true,
          phoneExtension: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          profileImage: {
            select: {
              id: true,
              url: true,
              name: true,
              type: true,
              size: true
            }
          }
        }
      });
    } catch (dbError) {
      console.error("❌ Database error:", {
        error: dbError instanceof Error ? dbError.message : 'Unknown database error',
        name: dbError instanceof Error ? dbError.name : 'DatabaseError',
        stack: dbError instanceof Error ? dbError.stack : 'No stack trace'
      });
      throw new Error("Failed to fetch user from database");
    }

    if (!user) {
      console.error("❌ User not found with ID:", userId);
      return NextResponse.json({ 
        success: false,
        error: "User not found" 
      }, { status: 404 });
    }

    console.log("✅ User found:", {
      id: user.id,
      name: user.name,
      email: user.email,
      agencyId: user.agencyId
    });

    // 4. Authorization check
    const isSelfRequest = user.id === currentUserId;
    const isAgencyAdminFetchingTeamLead = user.agencyId === currentUserId;
    
    if (!isSelfRequest && !isAgencyAdminFetchingTeamLead) {
      console.error("❌ Unauthorized access attempt:", {
        isSelfRequest,
        isAgencyAdminFetchingTeamLead,
        userId: user.id,
        currentUserId,
        userAgencyId: user.agencyId
      });
      
      return NextResponse.json({ 
        success: false,
        error: "You can only view your own profile or users from your agency" 
      }, { status: 403 });
    }

    // 5. Return the user data
    console.log("✅ Sending user data");
    return NextResponse.json({
      success: true,
      data: {
        ...user,
        maskedPassword: "••••••••"
      }
    });

  } catch (error) {
    console.error("❌ Unhandled error in GET /api/auth/agency-add-user/[id]:", {
      error: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : typeof error,
      stack: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    }, { status: 500 });
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error("❌ Error disconnecting from database:", disconnectError);
    }
  }
}

// UPDATE a single user
export async function PUT(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  try {
    console.log("📝 Updating user...");
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 });
    }

    const agencyAdminId = session.user.id;
    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json({ 
        success: false,
        error: "User ID is required" 
      }, { status: 400 });
    }

    const body = await request.json();
    const { name, phoneNumber, email, userType, status } = body;

    // Verify user exists and belongs to agency
    const existingUser = await prisma.userForm.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json({ 
        success: false,
        error: "User not found" 
      }, { status: 404 });
    }

    if (existingUser.agencyId !== agencyAdminId) {
      return NextResponse.json({ 
        success: false,
        error: "You can only update users from your own agency" 
      }, { status: 403 });
    }

    // Validate if email is being changed
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.userForm.findFirst({
        where: { 
          email,
          id: { not: id }
        }
      });

      if (emailExists) {
        return NextResponse.json({
          success: false,
          error: "Email already in use by another user"
        }, { status: 400 });
      }
    }

    // Update user
    const updatedUser = await prisma.userForm.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phoneNumber && { phoneNumber }),
        ...(email && { email }),
        ...(userType && { userType }),
        ...(status && { status }),
        updatedAt: new Date()
      },
      include: {
        profileImage: true
      }
    });

    console.log("✅ User updated successfully");

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      data: {
        ...updatedUser,
        password: undefined,
        maskedPassword: "••••••••"
      }
    });

  } catch (error) {
    console.error("❌ Error updating user:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update user";
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE a single user
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  try {
    console.log("🗑️ Deleting user...");
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 });
    }

    const agencyAdminId = session.user.id;
    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json({ 
        success: false,
        error: "User ID is required" 
      }, { status: 400 });
    }

    // Verify user exists and belongs to agency
    const user = await prisma.userForm.findUnique({
      where: { id },
      include: { profileImage: true }
    });

    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: "User not found" 
      }, { status: 404 });
    }

    if (user.agencyId !== agencyAdminId) {
      return NextResponse.json({ 
        success: false,
        error: "You can only delete users from your own agency" 
      }, { status: 403 });
    }

    // Delete user
    await prisma.userForm.delete({
      where: { id }
    });

    console.log("✅ User deleted successfully");

    return NextResponse.json({
      success: true,
      message: "User deleted successfully"
    });

  } catch (error) {
    console.error("❌ Error deleting user:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete user";
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}