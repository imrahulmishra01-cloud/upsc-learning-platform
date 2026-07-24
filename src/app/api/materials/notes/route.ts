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
    const { data: notes, error: notesError } = await supabase
      .from("material_notes")
      .select("*")
      .eq("user_id", user.id)
      .eq("material_id", materialId)
      .eq("status", "active")
      .order("page_number", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (notesError) {
      if (notesError.code === "42P01") {
        return NextResponse.json({ error: "Migration pending" }, { status: 503 });
      }
      return NextResponse.json({ error: notesError.message }, { status: 500 });
    }

    return NextResponse.json({ notes: notes || [] });
  } catch (err) {
    console.error("Notes fetch error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAllowedUser();
  if (!auth.authorized) return auth.response;
  const { user, supabase } = auth;

  try {
    const reqBody = await request.json();
    const { materialId, title, body: noteBody, pageNumber, noteType, tags } = reqBody;

    if (!materialId) return NextResponse.json({ error: "Missing materialId" }, { status: 400 });
    if (!noteBody || noteBody.trim().length === 0) return NextResponse.json({ error: "Note body cannot be empty" }, { status: 400 });

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

    const { data: note, error: insertError } = await supabase
      .from("material_notes")
      .insert({
        user_id: user.id,
        material_id: materialId,
        title: title || null,
        body: noteBody,
        page_number: pageNumber || null,
        note_type: noteType || "general",
        tags: tags || null,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "42P01") {
        return NextResponse.json({ error: "Migration pending" }, { status: 503 });
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ note });
  } catch (err) {
    console.error("Notes insert error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAllowedUser();
  if (!auth.authorized) return auth.response;
  const { user, supabase } = auth;

  try {
    const reqBody = await request.json();
    const { noteId, title, body, pageNumber, noteType, tags, status } = reqBody;

    if (!noteId) return NextResponse.json({ error: "Missing noteId" }, { status: 400 });

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (body !== undefined) updates.body = body;
    if (pageNumber !== undefined) updates.page_number = pageNumber;
    if (noteType !== undefined) updates.note_type = noteType;
    if (tags !== undefined) updates.tags = tags;
    if (status !== undefined) updates.status = status;

    const { data: note, error: updateError } = await supabase
      .from("material_notes")
      .update(updates)
      .eq("id", noteId)
      .eq("user_id", user.id) // Ensure ownership
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ note });
  } catch (err) {
    console.error("Notes update error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
