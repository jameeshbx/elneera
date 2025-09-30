import { NextResponse } from "next/server"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

/**
 * GET /api/generate-presigned-url
 *
 * Query params:
 * - key: string (S3 object key; may optionally start with a leading "/" or "<bucket>/")
 * - url: string (full S3 HTTP/HTTPS URL or s3:// URL; path-style or virtual-hosted-style)
 * - expires: number (optional, seconds; defaults to 3600; min 60, max 21600)
 * - filename: string (optional; used for Content-Disposition as inline; filename="<value>")
 *
 * Behavior:
 * - If "url" is provided, derives the object key from its pathname, removing the bucket segment when present.
 * - If "key" is provided, normalizes by stripping leading "/" and "<bucket>/" if present.
 * - Signs a GetObjectCommand and returns a fresh pre-signed URL.
 *
 * Response: { url: string } or { error: string, details?: string }
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const keyParam = url.searchParams.get("key")
    const urlParam = url.searchParams.get("url")
    const expiresParam = url.searchParams.get("expires")
    const filenameParam = url.searchParams.get("filename")

    const bucket = process.env.AWS_S3_BUCKET_NAME
    const region = process.env.AWS_S3_REGION || process.env.AWS_REGION

    if (!bucket || !region) {
      return NextResponse.json(
        {
          error: "S3 environment variables missing",
          details: "Set AWS_S3_BUCKET_NAME and AWS_S3_REGION (or AWS_REGION)",
        },
        { status: 500 },
      )
    }

    let objectKey: string | null = null

    if (urlParam) {
      try {
        const s3Url = new URL(urlParam)
        const path = s3Url.pathname.startsWith("/") ? s3Url.pathname.slice(1) : s3Url.pathname
        const segments = path.split("/").filter(Boolean)

        if (segments.length > 0) {
          if (segments[0] === bucket) {
            objectKey = segments.slice(1).join("/")
          } else {
            objectKey = segments.join("/")
          }
        }
      } catch  {
        return NextResponse.json({ error: "Invalid url parameter" }, { status: 400 })
      }
    } else if (keyParam) {
      let normalized = keyParam.startsWith("/") ? keyParam.slice(1) : keyParam
      if (normalized.startsWith(`${bucket}/`)) {
        normalized = normalized.slice(bucket.length + 1)
      }
      objectKey = normalized
    }

    if (!objectKey) {
      return NextResponse.json({ error: "Missing required query param: key or url" }, { status: 400 })
    }

    const expiresInRaw = Number.parseInt(expiresParam || "", 10)
    const expiresIn = Number.isFinite(expiresInRaw) ? Math.max(60, Math.min(expiresInRaw, 6 * 60 * 60)) : 60 * 60

    const s3 = new S3Client({ region })

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ...(filenameParam
        ? {
            ResponseContentDisposition: `inline; filename="${filenameParam.replace(/"/g, "")}"`,
          }
        : {}),
    })

    const signedUrl = await getSignedUrl(s3, command, { expiresIn })

    return NextResponse.json({ url: signedUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[v0] Failed to generate pre-signed URL:", message)
    return NextResponse.json({ error: "Failed to generate pre-signed URL", details: message }, { status: 500 })
  }
}
