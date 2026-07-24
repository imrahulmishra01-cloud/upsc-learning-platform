import { NextResponse } from "next/server";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAllowedUser();
  if (!auth.authorized) return auth.response;
  const { user, supabase } = auth;

  const { searchParams } = new URL(request.url);
  const materialId = searchParams.get("materialId");

  if (!materialId) {
    return NextResponse.json({ error: "Missing materialId" }, { status: 400 });
  }

  try {
    const { data: progress, error: progressError } = await supabase
      .from("material_reading_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("material_id", materialId)
      .maybeSingle();

    if (progressError) {
      if (progressError.code === "42P01") {
        return NextResponse.json({ error: "Migration pending" }, { status: 503 });
      }
      return NextResponse.json({ error: progressError.message }, { status: 500 });
    }

    if (!progress) {
      return NextResponse.json({
        progress: {
          status: "not_started",
          last_page: null,
          scroll_percent: null,
        }
      });
    }

    return NextResponse.json({ progress });
  } catch (err) {
    console.error("Progress fetch error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAllowedUser();
  if (!auth.authorized) return auth.response;
  const { user, supabase } = auth;

  try {
    const body = await request.json();
    const { materialId, status, lastPage, scrollPercent } = body;

    if (!materialId) return NextResponse.json({ error: "Missing materialId" }, { status: 400 });

    // Validate access to material
    const { data: material, error: materialError } = await supabase
      .from("material_library")
      .select("user_id, visibility, status")
      .eq("id", materialId)
      .single();

    if (materialError || !material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    if (material.status === "archived") {
      return NextResponse.json({ error: "Material is archived" }, { status: 400 });
    }

    if (material.user_id !== user.id && material.visibility !== "shared_between_two") {
      return NextResponse.json({ error: "Unauthorized access to material" }, { status: 403 });
    }

    // Prepare upsert
    let completedAt = undefined;
    if (status === "completed") {
      completedAt = new Date().toISOString();
    }

    const { data: progress, error: upsertError } = await supabase
      .from("material_reading_progress")
      .upsert(
        {
          user_id: user.id,
          material_id: materialId,
          status: status || "not_started",
          last_page: lastPage,
          scroll_percent: scrollPercent,
          last_viewed_at: new Date().toISOString(),
          ...(completedAt && { completed_at: completedAt }),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,material_id" }
      )
      .select()
      .single();

    if (upsertError) {
      if (upsertError.code === "42P01") {
        return NextResponse.json({ error: "Migration pending" }, { status: 503 });
      }
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ progress });
  } catch (err) {
    console.error("Progress upsert error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
