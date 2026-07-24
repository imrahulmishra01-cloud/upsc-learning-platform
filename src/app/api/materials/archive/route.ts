import { NextResponse } from "next/server";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const auth = await requireAllowedUser();
  if (!auth.authorized) return auth.response;
  const { user, supabase } = auth;

  try {
    const body = await request.json();
    const { id, type } = body;

    if (!id || !type) {
      return NextResponse.json({ error: "Missing id or type" }, { status: 400 });
    }

    if (type === "uploaded_file") {
      const { error } = await supabase
        .from("uploaded_files")
        .update({ upload_status: "archived", updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id);
        
      if (error) throw error;
    } else if (type === "material_library") {
      const { error } = await supabase
        .from("material_library")
        .update({ status: "archived", updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id);
        
      if (error) throw error;
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Error archiving material:", err);
    return NextResponse.json({ error: "Failed to archive" }, { status: 500 });
  }
}
