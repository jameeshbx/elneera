//  File: app/api/auth/admin-profile/route.ts (profile-section)

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import  prisma  from "@/lib/prisma"; 

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  
  try {

     // ✅ Set user online
    await prisma.user.update({
      where: { id: session.user.id },
      data: { isOnline: true }
    });


    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,             // for user identification
        name: true,           // for profile info
        email: true,          // shared: for both profile & account info
        role: true,           // for account info
        isOnline: true,       // for account status
        password: true   // (optional) don’t include this unless truly needed
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create a username from email (take part before @)

  return NextResponse.json({
  name: user.name || "",
  email: user.email,
  username: user.email, // or use a separate field if available
  role: user.role,
  location: "India",
  status: user.isOnline ? "Active" : "Inactive"
});


  } catch (error) {
    console.error("Error fetching profile/account info:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
