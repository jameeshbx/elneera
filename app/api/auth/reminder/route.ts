// app/api/customer/payment/reminder/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Handle reminder sending logic here
    console.log('Sending payment reminder:', body)
    
    return NextResponse.json({
      success: true,
      message: 'Reminder sent successfully'
    })
  } catch (error) {
    console.error('Error sending reminder:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send reminder' },  
      { status: 500 }
    )
  }
}