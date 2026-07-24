import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;

// Optional override, fallback to account ID format if missing
const endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");

let s3Client: S3Client | null = null;

if (accountId && accessKeyId && secretAccessKey && bucketName && endpoint) {
  s3Client = new S3Client({
    region: "auto",
    endpoint: endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export function isR2Configured() {
  return s3Client !== null;
}

export function getR2BucketName() {
  return bucketName || "";
}

/**
 * Validates a file extension and returns a safe content type.
 */
export function getSafeContentType(filename: string, providedMimeType?: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  
  const allowedMap: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    txt: "text/plain",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };

  if (ext && allowedMap[ext]) {
    return allowedMap[ext];
  }
  
  // Fallback if extension isn't explicitly matched but they provided something safe-looking
  if (providedMimeType === "application/pdf" || providedMimeType?.startsWith("image/")) {
    return providedMimeType;
  }
  
  return "application/octet-stream";
}

/**
 * Generate a secure, pseudo-random object key to prevent predictable guessing
 * Format: user_id/timestamp-random.ext
 */
export function generateSafeObjectKey(userId: string, filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "bin";
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${userId}/${timestamp}-${randomStr}.${ext}`;
}

/**
 * Gets a presigned URL for direct browser -> R2 upload (PUT)
 */
export async function getPresignedUploadUrl(objectKey: string, contentType: string): Promise<string> {
  if (!s3Client || !bucketName) throw new Error("R2 is not configured");

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

/**
 * Gets a presigned URL for secure browser download (GET)
 */
export async function getPresignedDownloadUrl(objectKey: string, filename: string): Promise<string> {
  if (!s3Client || !bucketName) throw new Error("R2 is not configured");

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    ResponseContentDisposition: `attachment; filename="${filename}"`,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

/**
 * Gets a presigned URL for secure inline browser viewing (GET)
 */
export async function getPresignedViewUrl(objectKey: string, filename: string, mimeType: string): Promise<string> {
  if (!s3Client || !bucketName) throw new Error("R2 is not configured");

  // Sanitize filename to prevent header injection
  const safeFilename = filename.replace(/[^a-zA-Z0-9_\-\.]/g, "_");

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    ResponseContentDisposition: `inline; filename="${safeFilename}"`,
    ResponseContentType: mimeType,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

/**
 * Verifies if an object actually exists in R2
 */
export async function verifyObjectExists(objectKey: string): Promise<boolean> {
  if (!s3Client || !bucketName) throw new Error("R2 is not configured");

  try {
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });
    await s3Client.send(command);
    return true;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "NotFound") {
      return false;
    }
    throw err;
  }
}
