import { NextResponse } from "next/server";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { isR2Configured, getSafeContentType, generateSafeObjectKey, getPresignedUploadUrl, getR2BucketName } from "@/lib/r2/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isR2Configured()) {
    return NextResponse.json({ error: "R2 is not configured" }, { status: 503 });
  }

  const auth = await requireAllowedUser();
  if (!auth.authorized) return auth.response;
  const { user, supabase } = auth;

  try {
    const body = await request.json();
    const { filename, mimeType, sizeBytes, category, description, legalConsentGiven } = body;

    if (!filename || !sizeBytes || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!legalConsentGiven) {
      return NextResponse.json({ error: "Legal consent is required to upload materials." }, { status: 400 });
    }

    // Default max size: 50MB (unless overridden)
    const MAX_SIZE = parseInt(process.env.R2_UPLOAD_MAX_MB || "50", 10) * 1024 * 1024;
    if (sizeBytes > MAX_SIZE) {
      return NextResponse.json({ error: `File exceeds maximum size of ${MAX_SIZE / 1024 / 1024}MB` }, { status: 400 });
    }

    const safeMimeType = getSafeContentType(filename, mimeType);
    const objectKey = generateSafeObjectKey(user.id, filename);
    const bucket = getR2BucketName();

    // Create pending entry in uploaded_files
    const { data: pendingFile, error: dbError } = await supabase
      .from("uploaded_files")
      .insert({
        user_id: user.id,
        bucket,
        object_key: objectKey,
        original_filename: filename,
        display_name: filename,
        mime_type: safeMimeType,
        size_bytes: sizeBytes,
        file_ext: filename.split(".").pop()?.toLowerCase() || null,
        category,
        description: description || null,
        legal_consent_given: legalConsentGiven,
        upload_status: "pending",
        visibility: "private"
      })
      .select("id")
      .single();

    if (dbError || !pendingFile) {
      console.error("DB Error creating pending file:", dbError);
      return NextResponse.json({ error: "Failed to initialize upload in database" }, { status: 500 });
    }

    const presignedUrl = await getPresignedUploadUrl(objectKey, safeMimeType);

    return NextResponse.json({
      uploadUrl: presignedUrl,
      fileId: pendingFile.id,
      objectKey,
    });
  } catch (err: unknown) {
    console.error("Error generating presigned URL:", err);
    return NextResponse.json({ error: "Failed to prepare upload" }, { status: 500 });
  }
}
