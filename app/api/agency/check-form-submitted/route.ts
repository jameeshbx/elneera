// Create this file: app/api/agency/check-form-submitted/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Adjust import if your prisma client is elsewhere


export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({
        submitted: false,
        error: 'Email is required'
      }, { status: 400 });
    }

    // Find AgencyForm for this user (createdBy is user.id, so we need to find user by email first)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true }
    });

    let submitted = false;
    let agencyForm = null;
    if (user) {
      // Find any AgencyForm created by this user
      agencyForm = await prisma.agencyForm.findFirst({
        where: {
          createdBy: user.id
        },
        select: { id: true, status: true }
      });
      if (agencyForm) {
        console.log('AgencyForm found:', agencyForm);
  submitted = !!agencyForm.status && agencyForm.status !== 'PENDING';
      } else {
        console.log('No AgencyForm found for user:', user.id);
      }
    } else {
      console.log('No user found for email:', email);
    }

    return NextResponse.json({
      submitted,
      debug: {
        user,
        agencyForm
      },
      message: submitted ? 'Form already submitted' : 'Form not submitted'
    });
  } catch (error) {
    console.error('Error checking agency form:', error);
    return NextResponse.json({
      submitted: false,
      error: 'Server error'
    }, { status: 500 });
  }
}


// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' }, 
    { status: 405 }
  );
}

// Handle OPTIONS for CORS if needed
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
// (removed stray closing brace)
}