import { NextResponse } from "next/server";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { isR2Configured, getR2BucketName } from "@/lib/r2/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const auth = await requireAllowedUser();
  if (!auth.authorized) return auth.response;

  const configured = isR2Configured();
  return NextResponse.json({
    ok: true,
    configured,
    bucketName: configured ? getR2BucketName() : null,
  });
}
