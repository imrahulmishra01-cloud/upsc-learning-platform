import { NextResponse } from "next/server";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { isR2Configured, verifyObjectExists } from "@/lib/r2/client";

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
    const { fileId } = body;

    if (!fileId) {
      return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
    }

    // Fetch pending file belonging to user
    const { data: file, error: fetchError } = await supabase
      .from("uploaded_files")
      .select("*")
      .eq("id", fileId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !file) {
      return NextResponse.json({ error: "File record not found or access denied" }, { status: 404 });
    }

    if (file.upload_status === "uploaded") {
      return NextResponse.json({ success: true, message: "Already marked as uploaded" });
    }

    // Verify object actually exists in R2
    const exists = await verifyObjectExists(file.object_key);
    if (!exists) {
      return NextResponse.json({ error: "File not found in storage bucket. Upload may have failed." }, { status: 400 });
    }

    // Mark as uploaded
    const { error: updateError } = await supabase
      .from("uploaded_files")
      .update({ upload_status: "uploaded", updated_at: new Date().toISOString() })
      .eq("id", fileId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to update uploaded_files:", updateError);
      return NextResponse.json({ error: "Failed to update file status" }, { status: 500 });
    }

    // Create material_library entry
    const { error: libraryError } = await supabase
      .from("material_library")
      .insert({
        user_id: user.id,
        uploaded_file_id: fileId,
        title: file.display_name,
        description: file.description,
        material_type: "uploaded_file",
        category: file.category,
        visibility: file.visibility,
        copyright_status: "unknown",
        permission_status: "user_owned",
        owned_by_user: true
      });

    if (libraryError) {
      console.error("Failed to create material_library entry:", libraryError);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Error in complete-upload:", err);
    return NextResponse.json({ error: "Failed to complete upload process" }, { status: 500 });
  }
}
