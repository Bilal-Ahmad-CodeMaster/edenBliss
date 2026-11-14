import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/guard";
import { recordAudit } from "@/lib/job-queue";
import { requestMeta } from "@/lib/security";
import { runSeed } from "../../../../../scripts/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request);
  if (limited) return limited;

  if (process.env.ENABLE_SEED_ENDPOINT !== "true" || process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ message: "Not found." }, { status: auth.status === 401 ? 401 : 404 });

  await runSeed({ disconnect: false });
  const meta = requestMeta(request);
  recordAudit({
    adminId: auth.user.id,
    action: "SEED",
    targetType: "Store",
    targetId: "eden-bliss",
    ...meta,
    diff: { seeded: true },
  });
  return NextResponse.json({ message: "The atelier archive has been seeded." });
}
