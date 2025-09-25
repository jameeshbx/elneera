import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Validate required environment variables
function validateS3Config() {
  const requiredEnvVars = {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
  }

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required S3 environment variables: ${missingVars.join(', ')}. ` +
      'Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME in your environment.'
    )
  }

  return {
    accessKeyId: requiredEnvVars.AWS_ACCESS_KEY_ID!,
    secretAccessKey: requiredEnvVars.AWS_SECRET_ACCESS_KEY!,
    bucketName: requiredEnvVars.AWS_S3_BUCKET_NAME!,
    region: process.env.AWS_REGION || 'us-east-1',
  }
}

// Initialize S3 configuration
let s3Config: ReturnType<typeof validateS3Config>
let s3Client: S3Client

try {
  s3Config = validateS3Config()
  s3Client = new S3Client({
    region: s3Config.region,
    credentials: {
      accessKeyId: s3Config.accessKeyId,
      secretAccessKey: s3Config.secretAccessKey,
    },
  })
} catch (error) {
  console.error('S3 configuration error:', error)
  // Set default values to prevent runtime errors
  s3Config = {
    accessKeyId: '',
    secretAccessKey: '',
    bucketName: '',
    region: 'us-east-1',
  }
  s3Client = new S3Client({
    region: 'us-east-1',
    credentials: {
      accessKeyId: '',
      secretAccessKey: '',
    },
  })
}

export interface S3FileInfo {
  key: string
  url: string
  size?: number
  lastModified?: Date
  contentType?: string
}

export class S3Service {
  /**
   * Check if S3 is properly configured
   */
  static isConfigured(): boolean {
    try {
      validateS3Config()
      return true
    } catch {
      return false
    }
  }

  /**
   * Upload a file to S3
   */
  static async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string = 'application/pdf',
    folder: string = 'itinerary-pdfs'
  ): Promise<S3FileInfo> {
    if (!this.isConfigured()) {
      throw new Error(
        'S3 is not properly configured. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME environment variables.'
      )
    }

    try {
      const key = `${folder}/${fileName}`
      
      const command = new PutObjectCommand({
        Bucket: s3Config.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        Metadata: {
          uploadedAt: new Date().toISOString(),
        },
      })

      await s3Client.send(command)
      
      // Generate a presigned URL for the uploaded file
      const url = await this.getSignedUrl(key)
      
      return {
        key,
        url,
        contentType,
      }
    } catch (error) {
      console.error('Error uploading file to S3:', error)
      throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get a presigned URL for a file
   */
  static async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('S3 is not properly configured')
    }

    try {
      const command = new GetObjectCommand({
        Bucket: s3Config.bucketName,
        Key: key,
      })

  // ts-expect-error: S3Client is compatible with getSignedUrl but types are mismatched in AWS SDK
  return await getSignedUrl(s3Client, command, { expiresIn })
    } catch (error) {
      console.error('Error generating signed URL:', error)
      throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete a file from S3
   */
  static async deleteFile(key: string): Promise<boolean> {
    if (!this.isConfigured()) {
      throw new Error('S3 is not properly configured')
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: s3Config.bucketName,
        Key: key,
      })

      await s3Client.send(command)
      return true
    } catch (error) {
      console.error('Error deleting file from S3:', error)
      throw new Error(`Failed to delete file from S3: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * List files in a folder
   */
  static async listFiles(folder: string = 'itinerary-pdfs', maxKeys: number = 100): Promise<S3FileInfo[]> {
    if (!this.isConfigured()) {
      throw new Error('S3 is not properly configured')
    }

    try {
      const command = new ListObjectsV2Command({
        Bucket: s3Config.bucketName,
        Prefix: folder,
        MaxKeys: maxKeys,
      })

      const response = await s3Client.send(command)
      
      if (!response.Contents) {
        return []
      }

      const files: S3FileInfo[] = []
      
      for (const object of response.Contents) {
        if (object.Key) {
          const url = await this.getSignedUrl(object.Key)
          files.push({
            key: object.Key,
            url,
            size: object.Size,
            lastModified: object.LastModified,
          })
        }
      }

      return files
    } catch (error) {
      console.error('Error listing files from S3:', error)
      throw new Error(`Failed to list files from S3: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get file info without downloading
   */
  static async getFileInfo(key: string): Promise<S3FileInfo | null> {
    if (!this.isConfigured()) {
      throw new Error('S3 is not properly configured')
    }

    try {
      const command = new GetObjectCommand({
        Bucket: s3Config.bucketName,
        Key: key,
      })

      const response = await s3Client.send(command)
      
      if (!response) {
        return null
      }

      const url = await this.getSignedUrl(key)
      
      return {
        key,
        url,
        size: response.ContentLength,
        lastModified: response.LastModified,
        contentType: response.ContentType,
      }
    } catch (error) {
      console.error('Error getting file info from S3:', error)
      return null
    }
  }
}
