import { NextResponse } from "next/server";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { isR2Configured, getPresignedDownloadUrl } from "@/lib/r2/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isR2Configured()) {
    return NextResponse.json({ error: "R2 is not configured" }, { status: 503 });
  }

  const auth = await requireAllowedUser();
  if (!auth.authorized) return auth.response;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("fileId");

  if (!fileId) {
    return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
  }

  try {
    // RLS SELECT policy enforces access control (user_id = auth.uid() OR shared_between_two if allowed)
    const { data: file, error: dbError } = await supabase
      .from("uploaded_files")
      .select("object_key, display_name")
      .eq("id", fileId)
      .single();

    if (dbError || !file) {
      return NextResponse.json({ error: "File not found or access denied" }, { status: 404 });
    }

    const presignedUrl = await getPresignedDownloadUrl(file.object_key, file.display_name);

    return NextResponse.json({ downloadUrl: presignedUrl });
  } catch (err: unknown) {
    console.error("Error generating download URL:", err);
    return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 });
  }
}
