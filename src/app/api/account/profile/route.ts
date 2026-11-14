import { NextResponse } from "next/server";
import { updateCustomerProfile } from "@/lib/account";
import { requireUser } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/guard";
import { readJson } from "@/lib/sanitize";
import { profileFormSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const limited = await enforceRateLimit(request);
  if (limited) return limited;
  const auth = await requireUser();
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const parsed = profileFormSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Check your details." }, { status: 400 });
  }

  const profile = await updateCustomerProfile(auth.user.id, parsed.data);
  if (!profile) return NextResponse.json({ message: "The profile could not be saved." }, { status: 404 });
  return NextResponse.json({ message: "Your profile is saved.", profile });
}
