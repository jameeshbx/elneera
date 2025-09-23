import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { sendEmail } from "@/lib/email"
import { getFileStream, getItineraryPdfKey } from "@/lib/s3"
import { S3Client, HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner" 
import * as fs from 'fs';
import * as path from 'path'; 
import os from 'os';

const prisma = new PrismaClient()

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Function to check if S3 object exists and get its info
async function checkS3ObjectExists(bucketName: string, key: string) {
  try {
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    const response = await s3Client.send(command);
    console.log(` S3 Object exists: s3://${bucketName}/${key}`);
    console.log(` Content Length: ${response.ContentLength} bytes`);
    console.log(` Last Modified: ${response.LastModified}`);
    console.log(` Content Type: ${response.ContentType}`);
    
    return {
      exists: true,
      size: response.ContentLength,
      lastModified: response.LastModified,
      contentType: response.ContentType,
    };
  } catch (error: unknown) {
    console.error(`❌ S3 Object does not exist or access denied: s3://${bucketName}/${key}`);
    if (error && typeof error === 'object' && 'message' in error) {
      console.error(`Error details: ${(error as { message: string }).message}`);
      return {
        exists: false,
        error: (error as { message: string }).message,
      };
    } else {
      console.error('Unknown error details:', error);
      return {
        exists: false,
        error: 'Unknown error',
      };
    }
  }
}

// Function to generate and log S3 URL
// Function to generate and log S3 URL
async function getS3Url(bucketName: string, key: string, expiresIn: number = 3600) {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
  // @ts-expect-error: S3Client is compatible with getSignedUrl but types are mismatched in AWS SDK
  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    console.log(` Generated S3 URL: ${signedUrl}`);
    console.log(` URL expires in: ${expiresIn} seconds`);
    
    return signedUrl;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'message' in error) {
      console.error(`❌ Failed to generate S3 URL: ${(error as { message: string }).message}`);
    } else {
      console.error('❌ Failed to generate S3 URL: Unknown error', error);
    }
    return null;
  }
}

// Validate S3 configuration at startup
const requiredS3Vars = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET_NAME'];
const missingS3Vars = requiredS3Vars.filter(varName => !process.env[varName]);

if (missingS3Vars.length > 0) {
  console.error(`Missing required S3 environment variables: ${missingS3Vars.join(', ')}`);
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Email sending API called")
    const body = await request.json()
    console.log("[v0] Request body:", body)

    const {
      customerId,
      itineraryId,
      enquiryId,
      customerName,
      email,
      whatsappNumber,
      notes,
    } = body

    // Validate required fields
    if (!customerName || !email || !whatsappNumber) {
      return NextResponse.json(
        { error: "Missing required fields: customerName, email, or whatsappNumber" },
        { status: 400 },
      )
    }

    if (!customerId && !enquiryId) {
      return NextResponse.json({ error: "Either customerId or enquiryId is required" }, { status: 400 })
    }

    if (!itineraryId) {
      return NextResponse.json({ error: "itineraryId is required" }, { status: 400 })
    }

    // Check if S3 is properly configured
    if (missingS3Vars.length > 0) {
      return NextResponse.json(
        { 
          error: "S3 configuration is missing",
          missingVariables: missingS3Vars,
          message: "Please configure the required S3 environment variables"
        }, 
        { status: 500 }
      )
    }

    // Generate the S3 key for the itinerary PDF
    const pdfKey = getItineraryPdfKey(itineraryId);
    const bucketName = process.env.AWS_S3_BUCKET_NAME!;
    
    console.log(` Checking S3 object: s3://${bucketName}/${pdfKey}`);
    
    // First, check if the S3 object exists
    const objectCheck = await checkS3ObjectExists(bucketName, pdfKey);
    
    if (!objectCheck.exists) {
      return NextResponse.json(
        { 
          error: 'PDF file not found in S3',
          details: `The itinerary PDF does not exist at s3://${bucketName}/${pdfKey}`,
          s3Error: objectCheck.error
        },
        
        { status: 404 }
      );
    }
      console.log("s3 object exists, proceeding to download and email.");
      
    // Generate and log the S3 URL
    const s3Url = await getS3Url(bucketName, pdfKey);
    
    try {
      // Get the PDF from S3
      console.log(` Downloading PDF from S3...`);
  const pdfBuffer = await getFileStream(pdfKey);
      console.log(` PDF downloaded successfully, size: ${pdfBuffer.length} bytes`);
      
      // Create a temporary file to store the PDF
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(tempDir, `itinerary-${itineraryId}.pdf`);
      
      // Write the buffer directly to the file
      await fs.promises.writeFile(tempFilePath, pdfBuffer);
      console.log(` PDF saved to temporary file: ${tempFilePath}`);

      // Send email with the PDF attachment
      console.log(` Sending email to: ${email}`);
      const emailResult = await sendEmail({
        to: email,
        subject: `Your Travel Itinerary - ${customerName}`,
        html: `
          <h1>Your Travel Itinerary</h1>
          <p>Dear ${customerName},</p>
          <p>Please find attached your travel itinerary.</p>
          ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>Your Travel Agency</p>
        `,
        attachments: [
          {
            filename: `itinerary-${itineraryId}.pdf`,
            path: tempFilePath,
            contentType: 'application/pdf',
          },
        ],
      });

      // Clean up the temporary file
      fs.unlink(tempFilePath, (err) => {
        if (err) console.error('❌ Error deleting temporary file:', err);
        else console.log(' Temporary file cleaned up successfully');
      });

      if (!emailResult.success) {
        throw new Error(emailResult.error || 'Failed to send email');
      }

      console.log(' Email sent successfully');

      // Persist a sent itinerary record
      const finalCustomerId: string = customerId || enquiryId || "";
      
      // Create sent itinerary record
      const sentItinerary = await prisma.sent_itineraries.create({
        data: {
          customerId: finalCustomerId,
          customerName: customerName || "",
          email,
          whatsappNumber: whatsappNumber || null,
          notes: notes || null,
          status: "sent",
          sentDate: new Date(),
          itineraryId,
          emailSent: true,
          whatsappSent: false,
        },
      })

      console.log(' Sent itinerary record created in database');

      return NextResponse.json({
        success: true,
        message: 'Itinerary sent successfully',
        s3Info: {
          bucket: bucketName,
          key: pdfKey,
          size: objectCheck.size,
          url: s3Url, // Include the signed URL in response (optional)
        },
        sentItinerary: {
          id: sentItinerary.id,
          customerId: sentItinerary.customerId,
          itineraryId: sentItinerary.itineraryId,
          customerName: sentItinerary.customerName,
          email: sentItinerary.email,
          whatsappNumber: sentItinerary.whatsappNumber,
          notes: sentItinerary.notes,
          status: sentItinerary.status,
          sentDate: sentItinerary.sentDate,
          emailSent: sentItinerary.emailSent,
          whatsappSent: sentItinerary.whatsappSent,
          createdAt: sentItinerary.createdAt,
          updatedAt: sentItinerary.updatedAt,
        },
        emailResult,
      });
      
    } catch (error) {
      console.error('❌ Error processing itinerary:', error);
      return NextResponse.json(
        { 
          error: 'Failed to process itinerary',
          details: error instanceof Error ? error.message : 'Unknown error',
          s3Info: {
            bucket: bucketName,
            key: pdfKey,
            url: s3Url,
          }
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error in send-itinerary API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect()
  }
}

export function GET() {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 })
}