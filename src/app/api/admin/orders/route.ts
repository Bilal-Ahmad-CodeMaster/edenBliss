import { NextResponse } from "next/server";
import { listAdminOrders } from "@/lib/admin-data";
import { adminGate } from "@/lib/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const opened = await adminGate(request);
  if ("response" in opened && opened.response) return opened.response;
  const url = new URL(request.url);
  const result = await listAdminOrders({
    page: url.searchParams.get("page"),
    limit: url.searchParams.get("limit"),
    q: url.searchParams.get("q"),
    status: url.searchParams.get("status"),
  });
  return NextResponse.json(result);
}
