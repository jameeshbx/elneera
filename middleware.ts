import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const publicPaths = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/feedback",
  "/api/auth/**",
  "/_next/**",
  "/favicon.ico",
];

// Paths that are only accessible to authenticated users with specific roles
const adminPaths = [
  "/admin/**",
  "/super-admin/**"
];

const agencyAdminPaths = [
  "/agency-admin/**"
];

// Role-based path mappings
const roleBasedPaths = {
  ADMIN: "/admin/dashboard",
  SUPER_ADMIN: "/super-admin/dashboard",
  AGENCY_ADMIN: "/agency-admin/dashboard",
  MANAGER: "/agency/dashboard",
  EXECUTIVE: "/executive/dashboard",
  TEAM_LEAD: "/teamlead/dashboard",
  TL: "/telecaller/dashboard",
  AGENT_USER: "/agent/dashboard",
  DMC_ADMIN: "/dmc/dashboard",
  DMC_USER: "/dmc/dashboard"
} as const;

type UserRole = keyof typeof roleBasedPaths;
type PathForRole<T extends UserRole> = typeof roleBasedPaths[T];

function getDashboardPath(role: string): string {
  const path = roleBasedPaths[role as UserRole];
  return path || '/';
}

// Add this function to handle role-based redirection
function getRoleBasedRedirect(role: string, userType?: string): string {
  // First check userType if available
  if (userType) {
    const path = roleBasedPaths[userType as keyof typeof roleBasedPaths];
    if (path) return path;
  }
  
  // Fall back to role
  const path = roleBasedPaths[role as keyof typeof roleBasedPaths];
  return path || '/dashboard';
}

// Public API routes that don't require authentication
const preFormAgencyAdminPaths = [
  "/agency-admin/agency-form",
  "/api/agencyform",
  "/api/auth/session",
  "/api/auth/csrf",
  "/api/auth/callback/credentials",
  "/api/upload",
  "/_next/static",
  "/_next/image"
];

const postFormAgencyAdminPaths = [
  "/agency-admin/profile",
  "/agency-admin/dashboard",
  "/api/agency",
  "/api/auth/session",
  "/api/auth/csrf",
  "/api/auth/callback/credentials"
];

// Helper function to check if path is allowed for the user role
function isPathAllowed(pathname: string, token: any): boolean {
  // Allow public paths
  if (publicPaths.some(path => 
    path === pathname || 
    (path.endsWith('**') && pathname.startsWith(path.slice(0, -2)))
  )) {
    return true;
  }

  // If no token, only allow public paths
  if (!token) return false;

  const userRole = token.role as UserRole;
  const userType = token.userType as string;

  // Special handling for AGENCY_ADMIN userType
  if (userType === 'AGENCY_ADMIN') {
    return pathname.startsWith('/agency-admin/') || 
           pathname === '/api/agencyform' ||
           pathname.startsWith('/api/agency/');
  }

  // Check admin paths
  if (adminPaths.some(path => pathname.startsWith(path.replace('/**', '')))) {
    return userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  }

  // Check agency admin paths
  if (agencyAdminPaths.some(path => pathname.startsWith(path.replace('/**', '')))) {
    return userRole === 'AGENCY_ADMIN' || userType === 'AGENCY_ADMIN';
  }

  // Default to allowing access for authenticated users
  return true;
}

export default withAuth(
  async function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = await getToken({ req });

    // Redirect to dashboard if user is already authenticated and trying to access auth pages
    if (token) {
      // Allow access to signup page for new users
      if (pathname === '/signup') {
        // Only allow access to signup if not logged in as ADMIN or SUPER_ADMIN
        if (['ADMIN', 'SUPER_ADMIN'].includes(token.role)) {
          const redirectUrl = getRoleBasedRedirect(token.role, token.userType);
          return NextResponse.redirect(new URL(redirectUrl, req.url));
        }
        return NextResponse.next();
      }
      
      // Redirect other auth pages to dashboard
      if (['/login', '/forgot-password', '/reset-password'].includes(pathname)) {
        const redirectUrl = getRoleBasedRedirect(token.role, token.userType);
        return NextResponse.redirect(new URL(redirectUrl, req.url));
      }
    }

    // Skip middleware for API routes and static files
    if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.startsWith('/images/')) {
      return NextResponse.next();
    }

    // Allow access to public API routes
   // Allow public paths
   if (publicPaths.some(path => 
    path === pathname || 
    (path.endsWith('/**') && pathname.startsWith(path.slice(0, -3)))
  )) {
      return NextResponse.next();
    }

   // If no token, redirect to login with callback URL
    if (!token) {
     // Allow access to signup page without redirection
     if (pathname === '/signup' || pathname.startsWith('/api/auth/signup')) {
      return NextResponse.next();
    }

    // For other non-public paths, redirect to login with callback URL
    const loginUrl = new URL('/login', req.url);
    // Don't set callbackUrl for signup page to prevent redirect loop
    if (pathname !== '/signup') {
      loginUrl.searchParams.set('callbackUrl', encodeURI(pathname));
    }
    return NextResponse.redirect(loginUrl);
    }

    // Get user role from token
    // Handle authenticated users
    if (token && token.role) {
      // Redirect from login/signup to appropriate dashboard
      if (pathname === '/login' || pathname === '/signup') {
        let redirectPath = getRoleBasedRedirect(token.role, token.userType);

        // Special handling for AGENCY_ADMIN based on form submission
        if (token.role === 'AGENCY_ADMIN') {
          redirectPath = token.agencyFormSubmitted 
            ? '/agency-admin/profile' 
            : '/agency-admin/agency-form';
        }

        return NextResponse.redirect(new URL(redirectPath, req.url));
      }

      // Handle AGENCY_ADMIN form submission state
      if (token.role === 'AGENCY_ADMIN') {
        // If form is not submitted, only allow access to the form
        if (!token.agencyFormSubmitted && pathname !== '/agency-admin/agency-form') {
          return NextResponse.redirect(new URL('/agency-admin/agency-form', req.url));
        }

        // If form is submitted, don't allow access to the form
        if (token.agencyFormSubmitted && pathname === '/agency-admin/agency-form') {
          return NextResponse.redirect(new URL('/agency-admin/profile', req.url));
        }
      }
    }
    

    // Handle AGENCY_ADMIN specific logic
    if (token?.role === 'AGENCY_ADMIN') {
      // Block access to admin/super-admin routes
      if (pathname.startsWith('/admin/') || pathname.startsWith('/super-admin/')) {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
      
      // If form is not submitted, only allow access to the form
      if (!token.agencyFormSubmitted) {
        if (pathname !== '/agency-admin/agency-form' && 
            !pathname.startsWith('/api/') &&
            !pathname.startsWith('/_next/')) {
          return NextResponse.redirect(new URL('/agency-admin/agency-form', req.url));
        }
        return NextResponse.next();
      }
    // After form submission, redirect from form to profile
    if (pathname === '/agency-admin/agency-form') {
      return NextResponse.redirect(new URL('/agency-admin/profile', req.url));
    }

    // Allow access to profile page after form submission
    if (pathname === '/agency-admin/profile') {
      return NextResponse.next();
    }

    // Block access to admin/super-admin paths
    if (adminPaths.some(path => 
      path === pathname || 
      (path.endsWith('/**') && pathname.startsWith(path.slice(0, -3)))
    )) {
      const redirectUrl = getRoleBasedRedirect(token.role, token.userType);
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }
  }

  // Check if path is allowed for the user's role
  if (!isPathAllowed(pathname, token)) {
    console.log('[Middleware] Path not allowed for role. Checking role-based redirection...', { 
      pathname, 
      role: token?.role,
      rolePaths: roleBasedPaths
    });

    // Get the appropriate dashboard path based on user role
    const userRoleKey = token?.role?.toUpperCase() as UserRole | undefined;
    let userDashboardPath: string | undefined;
    
    if (userRoleKey && userRoleKey in roleBasedPaths) {
      userDashboardPath = roleBasedPaths[userRoleKey];
    }
    
    const hasAccess = userDashboardPath && 
                   (pathname === userDashboardPath || 
                    pathname.startsWith(userDashboardPath.split('/')[1] + '/'));

    // Redirect to appropriate dashboard if user tries to access root
    if (pathname === '/' && userDashboardPath) {
      const redirectUrl = new URL(userDashboardPath, req.url);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
},
  {
    callbacks: {
      authorized: ({ token }) => {
        // We handle all authorization in the middleware function
        return true;
        }
      },


    pages: {
      signIn: "/login",
      error: "/unauthorized"
    }
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};