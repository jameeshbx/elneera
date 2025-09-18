import { NextRequest, NextResponse } from 'next/server'
import { S3Service } from '@/lib/s3-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder') || 'itinerary-pdfs'
    const maxKeys = parseInt(searchParams.get('maxKeys') || '100')

    const files = await S3Service.listFiles(folder, maxKeys)

    return NextResponse.json({
      success: true,
      files,
      count: files.length,
    })
  } catch (error) {
    console.error('Error listing S3 files:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list files',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
