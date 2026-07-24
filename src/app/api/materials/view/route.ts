import { NextResponse } from "next/server";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { isR2Configured, getPresignedViewUrl } from "@/lib/r2/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isR2Configured()) {
    return NextResponse.json({ error: "R2 is not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const materialId = searchParams.get("materialId");

  if (!materialId) {
    return NextResponse.json({ error: "Missing materialId" }, { status: 400 });
  }

  const auth = await requireAllowedUser();
  if (!auth.authorized) return auth.response;
  const { user, supabase } = auth;

  try {
    // Check material_library first to ensure it's accessible and not archived
    const { data: material, error: materialError } = await supabase
      .from("material_library")
      .select("*, uploaded_files(*)")
      .eq("id", materialId)
      .neq("status", "archived")
      .single();

    if (materialError || !material) {
      return NextResponse.json({ error: "Material not found or access denied" }, { status: 404 });
    }

    // Must have a linked uploaded_files row
    const file = material.uploaded_files;
    if (!file || Array.isArray(file)) {
      return NextResponse.json({ error: "No uploaded file attached to this material" }, { status: 400 });
    }

    if (file.upload_status !== "uploaded") {
      return NextResponse.json({ error: "File is not fully uploaded or has been archived" }, { status: 400 });
    }

    // Access control: Ensure user owns it or it has shared visibility
    if (material.user_id !== user.id && material.visibility !== "shared_between_two") {
      return NextResponse.json({ error: "Unauthorized access to material" }, { status: 403 });
    }

    // Ensure safe types
    const mimeType = file.mime_type || "application/octet-stream";
    const filename = file.display_name || "document";

    // Generate signed URL
    const presignedUrl = await getPresignedViewUrl(file.object_key, filename, mimeType);

    // Return safe metadata (no object_key)
    return NextResponse.json({
      viewUrl: presignedUrl,
      material: {
        id: material.id,
        title: material.title,
        description: material.description,
        category: material.category,
        subject_area: material.subject_area,
        paper_id: material.paper_id,
        copyright_status: material.copyright_status,
        permission_status: material.permission_status,
      },
      file: {
        id: file.id,
        filename: file.display_name,
        mimeType: mimeType,
        sizeBytes: file.size_bytes,
      }
    });

  } catch (err: unknown) {
    console.error("Error generating view URL:", err);
    return NextResponse.json({ error: "Failed to generate view URL" }, { status: 500 });
  }
}
