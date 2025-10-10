import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const { pathname } = request.nextUrl

  // If user is not logged in and trying to access protected routes
  if (!token) {
    if (pathname.startsWith('/agency-admin')) {
      const url = new URL('/auth/login', request.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // For logged-in users accessing agency admin routes
  if (pathname.startsWith('/agency-admin')) {
    // Skip redirection for these paths
    if (pathname === '/agency-admin/agency-form' || pathname.startsWith('/api')) {
      return NextResponse.next()
    }

    try {
      // Check if user has an agency form
      const response = await fetch(`${request.nextUrl.origin}/api/agencyform`, {
        headers: { cookie: request.headers.get('cookie') || '' },
      })
      
      const data = await response.json()
      
      // If no form exists, redirect to form
      if (!data.exists) {
        if (pathname !== '/agency-admin/agency-form') {
          return NextResponse.redirect(new URL('/agency-admin/agency-form', request.url))
        }
      } 
      // If form exists but is pending, redirect to profile
      else if (data.data?.status === 'PENDING') {
        if (pathname !== '/agency-admin/dashboard/profile') {
          return NextResponse.redirect(new URL('/agency-admin/dashboard/profile', request.url))
        }
      }
      // If form is approved, allow access to all agency-admin routes
      
    } catch (error) {
      console.error('Middleware error:', error)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/agency-admin/:path*',
    '/api/agencyform/:path*',
  ],
}