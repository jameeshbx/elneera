import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

interface TeamMemberProfileImage {
  url: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  profileImage: TeamMemberProfileImage | null;
  updatedAt: Date;
}

interface TeamMemberResponse {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  lastLoggedIn: string
  avatarColor: string
}

// Helper function to normalize logo URL
function normalizeLogoUrl(logoPath: string | null | undefined): string | null {
  if (!logoPath) return null;
  
  // If it's already a full URL, return as is
  if (logoPath.startsWith('http')) {
    return logoPath;
  }
  
  // If it starts with /, it's already a proper path from public
  if (logoPath.startsWith('/')) {
    return logoPath;
  }
  
  // Otherwise, ensure it has the /uploads/ prefix
  return logoPath.startsWith('uploads/') ? `/${logoPath}` : `/uploads/${logoPath}`;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find user by email
   const user = await prisma.user.findUnique({
  where: { email: session.user.email },
  include: {
    profileImage: true,
    agency: true,
  },
})

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Determine whether the current requester is an agency admin or an admin-type role.
    // We do NOT deny access entirely here — non-admin users should be able to fetch
    // their own profile and agency form info. Only admin users will receive the
    // teamMembers list (the users created by that agency admin).

    // Helper function to check if user_form table exists
    const ensureUserFormTableExists = async () => {
      try {
        await prisma.$executeRaw`SELECT 1 FROM "user_form" LIMIT 1`
        return true
      } catch (error: unknown) {
        if (error instanceof Error && "code" in error && error.code === "P2021") {
          return false
        } else {
          throw error
        }
      }
    }

    // Fetch team members only if user_form table exists
    let teamMembers: TeamMemberResponse[] = []

    try {
      const tableExists = await ensureUserFormTableExists()

      if (tableExists) {
        const userFormRecords = await prisma.userForm.findMany({
          where: {
            createdBy: user.id,
          },
          include: {
            profileImage: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        })

        // Helper function for avatar colors
        const getAvatarColor = (name: string): string => {
          const colors = [
            "#0F9D58", "#4285F4", "#F4B400", "#DB4437", 
            "#673AB7", "#009688", "#FF5722", "#795548"
          ]

          let hash = 0
          for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash)
          }

          return colors[Math.abs(hash) % colors.length]
        }

        teamMembers = userFormRecords.map((member: TeamMember) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          avatarUrl: member.profileImage?.url || null,
          lastLoggedIn: member.updatedAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          avatarColor: getAvatarColor(member.name),
        }))
      }
    } catch (error) {
      console.log("UserForm table might not exist yet:", error)
      // Continue without team members if table doesn't exist
    }

    // Fetch agency form data with proper error handling
    let agencyForm = null
    try {
      agencyForm = await prisma.agencyForm.findFirst({
        where: {
          createdBy: user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    } catch (error) {
      console.log("AgencyForm table might not exist yet:", error)
      // Continue without agency form data if table doesn't exist
    }

    // Build company information with fallbacks and proper logo URL handling
    const companyInformation = {
      name: agencyForm?.contactPerson || user.companyName || user.name || "N/A",
      contactPerson: agencyForm?.contactPerson || user.name || "N/A",
      agencyType: agencyForm?.agencyType || "N/A",
      designation: agencyForm?.designation || "N/A",
      gstRegistration: agencyForm?.gstRegistered !== undefined 
        ? (agencyForm.gstRegistered ? "Yes" : "No") 
        : "N/A",
      gstNo: agencyForm?.gstNumber || "N/A",
      ownerName: agencyForm?.ownerName || user.name || "N/A",
      mobile: agencyForm?.companyPhone
        ? `${agencyForm.companyPhoneCode || "+91"} ${agencyForm.companyPhone}`.trim()
        : user.phone || "N/A",
      personalPhone: agencyForm?.phoneNumber
        ? `${agencyForm.phoneCountryCode || "+91"} ${agencyForm.phoneNumber}`.trim()
        : user.phone || "N/A",
      email: agencyForm?.email || user.email,
      website: agencyForm?.website || "N/A",
      logo: normalizeLogoUrl(agencyForm?.logoPath),
      country: agencyForm?.country || "INDIA",
      yearOfRegistration: agencyForm?.yearOfRegistration || "N/A",
      panNo: agencyForm?.panNumber || "N/A",
      panType: agencyForm?.panType || "N/A",
      headquarters: agencyForm?.headquarters || "N/A",
      yearsOfOperation: agencyForm?.yearsOfOperation || "N/A",
      landingPageColor: agencyForm?.landingPageColor || "#0F9D58",
      businessLicense: normalizeLogoUrl(agencyForm?.businessLicensePath),
    }

    const response = {
      profileData: {
        name: user.name || "N/A",
        email: user.email,
        fullName: user.name || "N/A",
        mobile: user.phone || "N/A",
        location: "N/A",
        avatarUrl: user.profileImage?.url || null,
      },
      accountData: {
        username: user.email,
        password: "••••••••", // Always masked for security
        role: user.role,
        location: "N/A",
        status: user.isOnline ? "Active" : "Inactive",
        lastLoggedIn: user.updatedAt.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
      teamMembers: teamMembers,
      commentData: null,
      companyInformation: companyInformation,
      hasAgencyForm: !!agencyForm, // Flag to indicate if agency form exists
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}