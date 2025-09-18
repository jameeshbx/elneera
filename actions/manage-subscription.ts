"use server"

import prisma from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export type SubscriptionData = {
  id: string
  agencyId: string
  agencyName: string
  name: string
  email: string
  phoneNumber: string
  plan: string
  paymentStatus: string
  subscriptionStatus: string
  trialStatus: string
  trialStartDate: string | null
  dateCaptured: string | null
  requestDate: string
  requestLimit: number
  userLimit: number
  feature: string
}

export async function getSubscriptions({
  search = "",
  page = 1,
  limit = 8,
  sortBy = "createdAt",
  sortDirection = "desc",
  paymentStatus = [],
  plans = [],
  fromDate,
  toDate,
}: {
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortDirection?: "asc" | "desc"
  paymentStatus?: string[]
  plans?: string[]
  fromDate?: Date | null
  toDate?: Date | null
}) {
  try {
    // Build where clause for filtering
    const where: Prisma.SubscriptionWhereInput = {}

    // Search filter
    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { agency: { name: { contains: search, mode: "insensitive" } } },
        { plan: { name: { contains: search, mode: "insensitive" } } },
      ]
    }

    // Payment status filter - would need a custom field in schema
    // if (paymentStatus && paymentStatus.length > 0) {
    //   where.paymentStatus = { in: paymentStatus }
    // }

    // Plan filter
    if (plans && plans.length > 0) {
      where.plan = { name: { in: plans } }
    }

    // Date range filter
    if (fromDate && toDate) {
      where.createdAt = {
        gte: fromDate,
        lte: toDate,
      }
    }

    // Count total records for pagination
    const total = await prisma.subscription.count({ where })

    // Get subscriptions with pagination, sorting, and includes
    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        agency: {
          include: {
            users: {
              take: 1,
            },
          },
        },
        plan: true,
        feature: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sortBy]: sortDirection,
      },
    })

    // Transform data to match frontend expectations
    const formattedSubscriptions: SubscriptionData[] = subscriptions.map((subscription) => {
      const user = subscription.agency.users[0] || null

      return {
        id: subscription.id,
        agencyId: subscription.agencyId,
        agencyName: subscription.agency.name,
        name: user?.name || "Contact Name",
        email: user?.email || "contact@example.com",
        phoneNumber: "+1234567890", // This would come from a user record if you had a phone field
        plan: subscription.plan.name,
        paymentStatus: "Paid", // This would be a field in your schema
        subscriptionStatus: "Active", // This would be derived from dates or a status field
        trialStatus: "Completed", // This would be derived from dates or a status field
        trialStartDate: subscription.createdAt.toISOString().split("T")[0],
        dateCaptured: subscription.createdAt.toISOString().split("T")[0],
        requestDate: subscription.createdAt.toISOString(),
        requestLimit: subscription.requestLimit,
        userLimit: subscription.userLimit,
        feature: subscription.feature.name,
      }
    })

    return {
      subscriptions: formattedSubscriptions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    console.error("Error fetching subscriptions:", error)
    throw new Error("Failed to fetch subscriptions")
  }
}

export async function getSubscriptionById(id: string) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        agency: {
          include: {
            users: {
              take: 1,
            },
          },
        },
        plan: true,
        feature: true,
      },
    })

    if (!subscription) {
      throw new Error("Subscription not found")
    }

    const user = subscription.agency.users[0] || null

    // Transform data to match frontend expectations
    const formattedSubscription: SubscriptionData = {
      id: subscription.id,
      agencyId: subscription.agencyId,
      agencyName: subscription.agency.name,
      name: user?.name || "Contact Name",
      email: user?.email || "contact@example.com",
      phoneNumber: "+1234567890", // This would come from a user record
      plan: subscription.plan.name,
      paymentStatus: "Paid", // This would be a field in your schema
      subscriptionStatus: "Active", // This would be derived from dates or a status field
      trialStatus: "Completed", // This would be derived from dates or a status field
      trialStartDate: subscription.createdAt.toISOString().split("T")[0],
      dateCaptured: subscription.createdAt.toISOString().split("T")[0],
      requestDate: subscription.createdAt.toISOString(),
      requestLimit: subscription.requestLimit,
      userLimit: subscription.userLimit,
      feature: subscription.feature.name,
    }

    return formattedSubscription
  } catch (error) {
    console.error("Error fetching subscription:", error)
    throw new Error("Failed to fetch subscription")
  }
}

export async function createSubscription(data: {
  agencyId: string
  planId: string
  featureId: string
  requestLimit: number
  userLimit: number
}) {
  try {
    const subscription = await prisma.subscription.create({
      data,
      include: {
        agency: true,
        plan: true,
        feature: true,
      },
    })

    return subscription
  } catch (error) {
    console.error("Error creating subscription:", error)
    throw new Error("Failed to create subscription")
  }
}

export async function updateSubscription(
  id: string,
  data: {
    planId?: string
    featureId?: string
    requestLimit?: number
    userLimit?: number
  },
) {
  try {
    const subscription = await prisma.subscription.update({
      where: { id },
      data,
      include: {
        agency: true,
        plan: true,
        feature: true,
      },
    })

    return subscription
  } catch (error) {
    console.error("Error updating subscription:", error)
    throw new Error("Failed to update subscription")
  }
}

export async function deleteSubscription(id: string) {
  try {
    await prisma.subscription.delete({
      where: { id },
    })

    return { success: true }
  } catch (error) {
    console.error("Error deleting subscription:", error)
    throw new Error("Failed to delete subscription")
  }
}
