import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { Readable } from "stream"

// Validate required environment variables
const requiredEnvVars = [
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET_NAME'  
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`) 
  }
}

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

// Function to get a readable stream of a file from S3
export async function getFileStream(key: string) {
  if (!process.env.AWS_S3_BUCKET_NAME) {
    throw new Error('S3 bucket name is not configured')
  }

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
  })

  try {
    const response = await s3Client.send(command)
    
    if (!response.Body) {
      throw new Error('No file found in S3')
    }

    // Convert the response body to a buffer
    const chunks: Buffer[] = []
    const stream = response.Body as Readable
    
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk))
    }
    
    return Buffer.concat(chunks)
  } catch (error) {
    console.error('Error getting file from S3:', error)
    throw new Error('Failed to retrieve file from S3')
  }
}

// Function to get a signed URL for a file in S3
export async function getSignedFileUrl(key: string, expiresIn = 3600) {
  if (!process.env.AWS_S3_BUCKET_NAME) {
    throw new Error('S3 bucket name is not configured')
  }

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
  })

  try {
    // Use the command and s3Client to generate the signed URL
  // ts-expect-error: S3Client is compatible with getSignedUrl but types are mismatched in AWS SDK
  return await getSignedUrl(s3Client, command, { expiresIn })
  } catch (error) {
    console.error('Error generating signed URL:', error)
    throw new Error('Failed to generate signed URL')
  }
}

// Function to generate the S3 key for an itinerary PDF
export function getItineraryPdfKey(itineraryId: string, timestamp?: number): string {
  const timestampSuffix = timestamp ? `-${timestamp}` : ''
  return `itineraries/itinerary-${itineraryId}${timestampSuffix}.pdf`
}