import { NextRequest, NextResponse } from 'next/server'
import { S3Service } from '@/lib/s3-service'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params
    const decodedKey = decodeURIComponent(key)

    const success = await S3Service.deleteFile(decodedKey)

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'File deleted successfully',
        key: decodedKey,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete file',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error deleting S3 file:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params
    const decodedKey = decodeURIComponent(key)

    const fileInfo = await S3Service.getFileInfo(decodedKey)

    if (!fileInfo) {
      return NextResponse.json(
        {
          success: false,
          error: 'File not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      file: fileInfo,
    })
  } catch (error) {
    console.error('Error getting S3 file info:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get file info',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
