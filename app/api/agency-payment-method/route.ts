import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'BANK_ACCOUNT' | 'UPI' | 'QR_CODE' | 'PAYMENT_GATEWAY' | null
    const agencyId = searchParams.get('agencyId')

    if (!agencyId) {
      return NextResponse.json(
        { error: 'Agency ID is required' },
        { status: 400 }
      )
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify the user has access to this agency
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { agencyId: true }
    })

    if (!user || user.agencyId !== agencyId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Build the query
    const where = {
      agencyId,
      isActive: true,
      type: type || undefined
    }

    if (type) {
      where.type = type
    }

    // Fetch payment methods
    const paymentMethods = await prisma.agencyPaymentMethod.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        name: true,
        identifier: true,
        bank: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(paymentMethods)
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    )
  }
}
