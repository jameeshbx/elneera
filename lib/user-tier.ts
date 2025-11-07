import { type Role, type UserType } from "@prisma/client"

/**
 * Determine user tier based on role and user type
 * Premium: AGENCY_ADMIN, SUPER_ADMIN, DMC_ADMIN
 * Standard: All other users
 */
export function getUserTier(role?: Role | null, userType?: UserType | null): "premium" | "standard" {
  // Premium tier users
  const premiumRoles: Role[] = ["AGENCY_ADMIN", "SUPER_ADMIN", "DMC_ADMIN"]
  const premiumUserTypes: UserType[] = ["AGENCY_ADMIN", "SUPER_ADMIN", "DMC"]

  if (role && premiumRoles.includes(role)) {
    return "premium"
  }

  if (userType && premiumUserTypes.includes(userType)) {
    return "premium"
  }

  // Default to standard
  return "standard"
}

/**
 * Get user tier from session or request
 * This can be extended to check subscription status, etc.
 */
export async function getUserTierFromRequest(userId?: string | null): Promise<"premium" | "standard"> {
  if (!userId) {
    return "standard"
  }

  try {
    // You can extend this to fetch user data from database
    // For now, return standard as default
    // In production, you might want to check:
    // - User subscription status
    // - Agency tier
    // - Payment history
    // etc.

    return "standard"
  } catch (error) {
    console.error("Error determining user tier:", error)
    return "standard"
  }
}

