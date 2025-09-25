import { NextRequest, NextResponse } from 'next/server'
import { S3Service } from '@/lib/s3-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    const expiresIn = parseInt(searchParams.get('expiresIn') || '3600')

    if (!key) {
      return NextResponse.json(
        { error: 'S3 key is required' },
        { status: 400 }
      )
    }

    // Check if S3 is configured
    if (!S3Service.isConfigured()) {
      return NextResponse.json(
        { error: 'S3 is not properly configured' },
        { status: 500 }
      )
    }

    // Generate presigned URL
    const url = await S3Service.getSignedUrl(key, expiresIn)

    return NextResponse.json({
      success: true,
      url,
      key,
      expiresIn,
    })
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate presigned URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}