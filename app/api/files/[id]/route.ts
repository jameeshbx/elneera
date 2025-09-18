import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { join } from 'path';
import { stat, readFile } from 'fs/promises';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params promise
    const resolvedParams = await params;
    const fileId = resolvedParams.id;
    
    const { searchParams } = new URL(request.url);
    const directUrl = searchParams.get('direct');

    if (directUrl === 'true') {
      // Direct URL access - use the ID as the file path
      const filePath = join(process.cwd(), 'public', fileId);
      
      if (!existsSync(filePath)) {
        return new NextResponse('File not found', { status: 404 });
      }

      try {
        const stats = await stat(filePath);
        const fileName = fileId.split('/').pop() || 'file';
        const fileType = getContentType(fileName);
        
        const fileBuffer = await readFile(filePath);
        
        return new NextResponse(new Uint8Array(fileBuffer), {
          headers: {
            'Content-Type': fileType,
            'Content-Length': stats.size.toString(),
            'Content-Disposition': `inline; filename="${fileName}"`,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      } catch (fileError) {
        console.error('Error reading file:', fileError);
        return new NextResponse('Error reading file', { status: 500 });
      }
    }
    
    // Find the file in the database
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        name: true,
        type: true,
        url: true,
        size: true,
      },
    });

    if (!file) {
      console.error(`File with ID ${fileId} not found in database`);
      return new NextResponse('File not found', { status: 404 });
    }

    // Handle external URLs (HTTP/HTTPS)
    if (file.url.startsWith('http')) {
      try {
        const response = await fetch(file.url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const fileBuffer = await response.arrayBuffer();
        const contentLength = response.headers.get('content-length') || file.size?.toString() || '0';

        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': file.type,
            'Content-Length': contentLength,
            'Content-Disposition': `inline; filename="${file.name}"`,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      } catch (fetchError) {
        console.error('Error fetching external file:', fetchError);
        return new NextResponse('Error accessing external file', { status: 502 });
      }
    }

    // Handle local files
    let filePath: string;
    
    // Check if URL is already an absolute path
    if (file.url.startsWith('/')) {
      filePath = join(process.cwd(), 'public', file.url);
    } else {
      filePath = join(process.cwd(), 'public', 'uploads', file.url);
    }

    // Check if file exists
    if (!existsSync(filePath)) {
      console.error(`File not found at path: ${filePath}`);
      
      // Try alternative locations
      const alternativePaths = [
        join(process.cwd(), 'public', file.url),
        join(process.cwd(), 'uploads', file.url),
        join(process.cwd(), file.url)
      ];

      for (const altPath of alternativePaths) {
        if (existsSync(altPath)) {
          filePath = altPath;
          break;
        }
      }

      if (!existsSync(filePath)) {
        return new NextResponse('File not found on server', { status: 404 });
      }
    }

    try {
      // Read the file
      const fileBuffer = await readFile(filePath);
      const fileStats = await stat(filePath);

      // Determine content disposition - inline for images, attachment for others
      const contentDisposition = file.type.startsWith('image/') 
        ? `inline; filename="${file.name}"` 
        : `attachment; filename="${file.name}"`;

      // Return the file with appropriate headers
      return new NextResponse(new Uint8Array(fileBuffer), {
        headers: {
          'Content-Type': file.type,
          'Content-Length': fileStats.size.toString(),
          'Content-Disposition': contentDisposition,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (readError) {
      console.error('Error reading local file:', readError);
      return new NextResponse('Error reading file', { status: 500 });
    }

  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Helper function to get content type from file extension
function getContentType(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  const mimeTypes: Record<string, string> = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'bmp': 'image/bmp',
    'tiff': 'image/tiff',
    
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // Archives
    'zip': 'application/zip',
    'rar': 'application/vnd.rar',
    '7z': 'application/x-7z-compressed',
    'tar': 'application/x-tar',
    'gz': 'application/gzip',
    
    // Text
    'txt': 'text/plain',
    'csv': 'text/csv',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript',
    'json': 'application/json',
    'xml': 'application/xml',
    
    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'm4a': 'audio/mp4',
    
    // Video
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'wmv': 'video/x-ms-wmv',
  };

  return mimeTypes[extension] || 'application/octet-stream';
}

// Optional: Add HEAD method for checking file existence
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const fileId = resolvedParams.id;

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        name: true,
        type: true,
        url: true,
        size: true,
      },
    });

    if (!file) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': file.type,
        'Content-Length': file.size?.toString() || '0',
        'Content-Disposition': `inline; filename="${file.name}"`,
      },
    });
  } catch  {
    return new NextResponse(null, { status: 500 });
  }
}