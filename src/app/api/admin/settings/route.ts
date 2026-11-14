import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getStoreSettings } from "@/lib/catalog";
import { connectDB } from "@/lib/db";
import { enforceRateLimit } from "@/lib/guard";
import { recordAudit } from "@/lib/job-queue";
import { invalidateCatalogCache } from "@/lib/redis";
import { readJson } from "@/lib/sanitize";
import { requestMeta, stripHtml } from "@/lib/security";
import { StoreSettings } from "@/models/StoreSettings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  supportEmail: z.string().trim().email().max(120),
  supportPhone: z.string().trim().min(6).max(40),
  currencySymbol: z.string().trim().min(1).max(8),
  standardShippingRate: z.coerce.number().min(0).max(100000),
  freeShippingThreshold: z.coerce.number().min(0).max(10000000),
  taxPercentage: z.coerce.number().min(0).max(40),
  announcementBarText: z.string().trim().min(2).max(240),
  themeMode: z.enum(["warm-linen", "dark-editorial", "sage-minimal"]),
});

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request);
  if (limited) return limited;
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status === 401 ? 401 : 404 });
  const settings = await getStoreSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const limited = await enforceRateLimit(request);
  if (limited) return limited;
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status === 401 ? 401 : 404 });

  const parsed = settingsSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Check the settings." }, { status: 400 });
  }

  const next = {
    ...parsed.data,
    supportPhone: stripHtml(parsed.data.supportPhone),
    announcementBarText: stripHtml(parsed.data.announcementBarText),
    storeName: "Eden Bliss",
  };

  await connectDB();
  await StoreSettings.findOneAndUpdate(
    { singletonKey: "eden-bliss" },
    { $set: next, $setOnInsert: { singletonKey: "eden-bliss" } },
    { upsert: true },
  );
  await invalidateCatalogCache();
  recordAudit({
    adminId: auth.user.id,
    action: "UPDATE_SETTINGS",
    targetType: "StoreSettings",
    targetId: "eden-bliss",
    ...requestMeta(request),
    diff: next,
  });
  return NextResponse.json({ message: "The house settings have been saved." });
}
