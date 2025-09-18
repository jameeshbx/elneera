import { NextResponse } from 'next/server'
import prisma from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export const dynamic = 'force-dynamic' // If using dynamic routes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract query parameters
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '8')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortDirection = searchParams.get('sortDirection') as 'asc' | 'desc' || 'desc'
    const plans = searchParams.getAll('plans') || []
    const fromDate = searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : null
    const toDate = searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : null

    // Build where clause
    const where: Prisma.SubscriptionWhereInput = {}

    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { agency: { name: { contains: search, mode: "insensitive" } } },
        { plan: { name: { contains: search, mode: "insensitive" } } },
      ]
    }

    if (plans.length > 0) {
      where.plan = { name: { in: plans } }
    }

    if (fromDate && toDate) {
      where.createdAt = {
        gte: fromDate,
        lte: toDate,
      }
    }

    // Count and fetch data
    const total = await prisma.subscription.count({ where })
    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        agency: {
          include: {
            users: { take: 1 },
          },
        },
        plan: true,
        feature: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortDirection },
    })

    // Format response
    const formattedSubscriptions = subscriptions.map((sub) => ({
      id: sub.id,
      agencyId: sub.agencyId,
      agencyName: sub.agency.name,
      name: sub.agency.users[0]?.name || "Contact Name",
      email: sub.agency.users[0]?.email || "contact@example.com",
      phoneNumber: "+1234567890",
      plan: sub.plan.name,
      paymentStatus: "Paid",
      subscriptionStatus: "Active",
      trialStatus: "Completed",
      trialStartDate: sub.createdAt.toISOString().split("T")[0],
      dateCaptured: sub.createdAt.toISOString().split("T")[0],
      requestDate: sub.createdAt.toISOString(),
      requestLimit: sub.requestLimit,
      userLimit: sub.userLimit,
      feature: sub.feature.name,
    }))

    return NextResponse.json({
      subscriptions: formattedSubscriptions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching subscriptions:", error)
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const subscription = await prisma.subscription.create({
      data: body,
      include: {
        agency: true,
        plan: true,
        feature: true,
      },
    })
    return NextResponse.json(subscription)
  } catch (error) {
    console.error("Error creating subscription:", error)
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    )
  }
}