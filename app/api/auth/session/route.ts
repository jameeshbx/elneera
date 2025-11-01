import { getServerSession } from "next-auth/next";
import { NextResponse } from 'next/server';
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
  
    const { role, userType } = session.user;

    // Determine the appropriate dashboard path based on userType or role
    const getDashboardPath = () => {
      // First try to use userType if available
      if (userType) {
        switch (userType.toUpperCase()) {
          case 'TRAVEL_AGENCY':
            return '/agency-admin/agency-form';
          case 'MANAGER':
            return '/agency/dashboard';
          case 'EXECUTIVE':
            return '/executive/dashboard';
          case 'TEAM_LEAD':
            return '/teamlead/dashboard';
          case 'TL':
            return '/telecaller/dashboard';
        }
      }

      // Fall back to role if userType is not available
      if (role) {
        switch (role.toUpperCase()) {
          case 'TRAVEL_AGENCY':
            return '/agency-admin/agency-form';
          case 'MANAGER':
            return '/agency/dashboard';
          case 'EXECUTIVE':
            return '/executive/dashboard';
          case 'TEAM_LEAD':
            return '/teamlead/dashboard';
          case 'TL':
            return '/telecaller/dashboard';
        }
      }

      // Default fallback
      return '/dashboard';
    };

    const dashboardPath = getDashboardPath();

    // Return JSON response with redirect URL
    return NextResponse.json({ 
      success: true,
      redirectTo: dashboardPath,
      user: {
        role,
        userType
      }
    });

  } catch (error) {
    console.error('Session route error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
