import { NextResponse } from 'next/server'
import prisma from "@/lib/prisma"


// Update your handler function to use these types
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { params } = context;
    const { id } = await params;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        agency: {
          include: { users: { take: 1 } },
        },
        plan: true,
        feature: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    const user = subscription.agency.users[0] || null
    const formattedSubscription = {
      id: subscription.id,
      agencyId: subscription.agencyId,
      agencyName: subscription.agency.name,
      name: user?.name || "Contact Name",
      email: user?.email || "contact@example.com",
      phoneNumber: "+1234567890",
      plan: subscription.plan.name,
      paymentStatus: "Paid",
      subscriptionStatus: "Active",
      trialStatus: "Completed",
      trialStartDate: subscription.createdAt.toISOString().split("T")[0],
      dateCaptured: subscription.createdAt.toISOString().split("T")[0],
      requestDate: subscription.createdAt.toISOString(),
      requestLimit: subscription.requestLimit,
      userLimit: subscription.userLimit,
      feature: subscription.feature.name,
    };

    return NextResponse.json(formattedSubscription)
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { params } = context;
    const body = await request.json()
    const subscription = await prisma.subscription.update({
      where: { id: (await params).id },
      data: body,
      include: {
        agency: true,
        plan: true,
        feature: true,
      },
    });

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { params } = context;
    await prisma.subscription.delete({
      where: { id: (await params).id },
    })
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    return NextResponse.json(
      { error: "Failed to delete subscription" },
      { status: 500 }
    );
  }
} 
