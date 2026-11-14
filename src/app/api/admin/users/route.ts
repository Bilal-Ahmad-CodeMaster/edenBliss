import { NextResponse } from "next/server";
import { listAdminUsers } from "@/lib/admin-data";
import { adminGate } from "@/lib/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const opened = await adminGate(request);
  if ("response" in opened && opened.response) return opened.response;
  const url = new URL(request.url);
  const result = await listAdminUsers(url.searchParams.get("page"), url.searchParams.get("limit"), url.searchParams.get("q"));
  return NextResponse.json(result);
}
