import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('[TEST_AUTH] Session:', session)
    console.log('[TEST_AUTH] Session user:', session?.user)
    
    if (!session) {
      return NextResponse.json({ 
        error: 'No session found',
        authenticated: false 
      }, { status: 401 })
    }

    if (!session.user) {
      return NextResponse.json({ 
        error: 'No user in session',
        authenticated: false 
      }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        agencyId: session.user.agencyId
      }
    })
  } catch (error) {
    console.error('[TEST_AUTH_ERROR]', error)
    return NextResponse.json(
      { error: 'Internal Server Error', authenticated: false },
      { status: 500 }
    )
  }
}
