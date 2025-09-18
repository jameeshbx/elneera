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

  // DMC roles
  DMC_ADMIN: "/dmc/dashboard",
  DMC_USER: "/dmc/dashboard"
} as const;

type UserRole = keyof typeof roleBasedPaths;
type PathForRole<T extends UserRole> = typeof roleBasedPaths[T];

function getDashboardPath(role: string): string {
  const path = roleBasedPaths[role as UserRole];
  return path || '/';
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
  const userRole = token?.role?.toUpperCase();
  const isAgencyFormSubmitted = token?.agencyFormSubmitted === true;

  console.log('[isPathAllowed] Checking path:', { pathname, userRole, isAgencyFormSubmitted });

  // Allow public paths
  if (publicPaths.some(path => 
    path === pathname || 
    (path.endsWith('/**') && pathname.startsWith(path.slice(0, -3)))
  )) {
    return true;
  }

    // Handle specific role paths
  switch(userRole) {
    case 'AGENCY_ADMIN':
      if (isAgencyFormSubmitted) {
        return postFormAgencyAdminPaths.some(path => 
          path === pathname || (path.endsWith('/**') && pathname.startsWith(path.slice(0, -3)))
        );
      } else {
        return preFormAgencyAdminPaths.some(path => 
          path === pathname || (path.endsWith('/**') && pathname.startsWith(path.slice(0, -3)))
        );
      }

    case 'MANAGER':
      return pathname.startsWith('/agency/') || pathname === '/api/agency';

    case 'TL':
    case 'TELEMARKETER':
      return pathname.startsWith('/telecaller/') || pathname === '/api/telecaller';

    case 'EXECUTIVE':
      return pathname.startsWith('/executive/') || pathname === '/api/executive';

    case 'TEAM_LEAD':
      return pathname.startsWith('/teamlead/') || pathname === '/api/teamlead';
      // Check if the path is in the allowed lists based on form submission status
      const allowedPaths = isAgencyFormSubmitted 
        ? postFormAgencyAdminPaths 
        : preFormAgencyAdminPaths;

      // Allow access to allowed paths
      if (allowedPaths.some(path => 
        pathname === path || 
        (path.endsWith('/**') && pathname.startsWith(path.slice(0, -3)))
      )) {
        return true;
      }

      // Allow access to static assets
      if (pathname.startsWith('/_next/') || pathname.startsWith('/images/')) {
        return true;
      }

      // If form is not submitted, only allow access to the form
      if (!isAgencyFormSubmitted && pathname === '/agency-admin/agency-form') {
        return true;
      }
      return false;

    case 'MANAGER':
      return pathname.startsWith('/agency/');

    case 'TL':
      return pathname.startsWith('/telecaller/');

    case 'TEAM_LEAD':
      return pathname.startsWith('/teamlead/');

    case 'EXECUTIVE':
      return pathname.startsWith('/executive/');

    case 'ADMIN':
    case 'SUPER_ADMIN':
      return pathname.startsWith('/admin/') || pathname.startsWith('/super-admin/');

    case 'DMC_ADMIN':
    case 'DMC_USER':
      return pathname.startsWith('/dmc/');

    default:
      console.warn('No role matched for path access check:', { userRole, pathname });
      return false;
  }
}

export default withAuth(
  async function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = await getToken({ req });
    const userRole = token?.role?.toUpperCase();
    const isAgencyFormSubmitted = token?.agencyFormSubmitted === true;

    console.log(`[Middleware] Path: ${pathname}, Role: ${userRole}, Form Submitted: ${isAgencyFormSubmitted}`);

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
    if (token && userRole) {
      // Redirect from login/signup to appropriate dashboard
      if (pathname === '/login' || pathname === '/signup') {
        let redirectPath = getDashboardPath(userRole);

        // Special handling for AGENCY_ADMIN based on form submission
        if (userRole === 'AGENCY_ADMIN') {
          redirectPath = isAgencyFormSubmitted 
            ? '/agency-admin/profile' 
            : '/agency-admin/agency-form';
        }

        return NextResponse.redirect(new URL(redirectPath, req.url));
      }

      // Handle AGENCY_ADMIN form submission state
      if (userRole === 'AGENCY_ADMIN') {
        // If form is not submitted, only allow access to the form
        if (!isAgencyFormSubmitted && pathname !== '/agency-admin/agency-form') {
          return NextResponse.redirect(new URL('/agency-admin/agency-form', req.url));
        }

        // If form is submitted, don't allow access to the form
        if (isAgencyFormSubmitted && pathname === '/agency-admin/agency-form') {
          return NextResponse.redirect(new URL('/agency-admin/profile', req.url));
        }
      }
    }
    

    // Handle AGENCY_ADMIN specific logic
    if (userRole === 'AGENCY_ADMIN') {
      // Block access to admin/super-admin routes
      if (pathname.startsWith('/admin/') || pathname.startsWith('/super-admin/')) {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
      
      // If form is not submitted, only allow access to the form
      if (!isAgencyFormSubmitted) {
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
      const redirectUrl = new URL('/agency-admin/dashboard', req.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Check if path is allowed for the user's role
  if (!isPathAllowed(pathname, token)) {
    console.log('[Middleware] Path not allowed for role. Checking role-based redirection...', { 
      pathname, 
      userRole,
      rolePaths: roleBasedPaths
    });

    // Get the appropriate dashboard path based on user role
    const userRoleKey = userRole as UserRole;
    const userDashboardPath = roleBasedPaths[userRoleKey];
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