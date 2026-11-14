import "server-only";
import { createHmac } from "crypto";
import { after } from "next/server";
import { connectDB } from "@/lib/db";
import { AuditLog } from "@/models/AuditLog";

export type AuditInput = {
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  ipAddress: string;
  userAgent: string;
  diff?: Record<string, unknown>;
};

function integrity(entry: AuditInput) {
  const secret = process.env.INTERNAL_JOB_QUEUE_SECRET;
  if (!secret) return "";
  return createHmac("sha256", secret).update(JSON.stringify(entry)).digest("hex");
}

export function enqueueJob(task: () => Promise<void>) {
  after(async () => {
    try {
      await task();
    } catch (error) {
      console.error("Background job failed.", error);
    }
  });
}

export function recordAudit(entry: AuditInput) {
  const signature = integrity(entry);
  enqueueJob(async () => {
    if (process.env.NODE_ENV === "production" && !process.env.INTERNAL_JOB_QUEUE_SECRET) return;
    await connectDB();
    await AuditLog.create({ ...entry, diff: entry.diff ?? {}, integrity: signature });
  });
}
