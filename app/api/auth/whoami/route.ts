import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthenticated" }, { status: 401 });
    }

    // Prefer session user id if present
   const sid = (session.user as { id?: string })?.id;
    if (sid) return NextResponse.json({ success: true, id: sid });

    const email = session.user.email;
    if (!email) return NextResponse.json({ success: false, error: 'No id or email in session' }, { status: 400 });

    // Try main user table
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) return NextResponse.json({ success: true, id: user.id, source: 'user' });

    // Try user_form table
    const userForm = await prisma.userForm.findUnique({ where: { email } });
    if (userForm) return NextResponse.json({ success: true, id: userForm.id, source: 'userForm' });

    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
  return NextResponse.json({ 
    success: false, 
    error: 'Failed to fetch user ID',
    details: process.env.NODE_ENV === 'development' ? errorMessage : undefined 
  }, { status: 500 });
} finally {
    try { await prisma.$disconnect(); } catch {};
  }
}
