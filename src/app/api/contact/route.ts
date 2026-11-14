import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/guard";
import { sendAdminMail } from "@/lib/mail";
import { readJson, stripHtml } from "@/lib/sanitize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QUERY_TYPES = ["Fit", "Order", "Cloth", "Delivery", "Other"] as const;

const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80),
  email: z.string().trim().email("Enter a real email address.").max(120),
  queryType: z.enum(QUERY_TYPES),
  description: z.string().trim().min(10, "Describe the query in a sentence or two.").max(2000),
});

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "auth");
  if (limited) return limited;

  const parsed = contactSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Check the note before sending it." },
      { status: 400 },
    );
  }

  const name = stripHtml(parsed.data.name);
  const email = parsed.data.email.toLowerCase();
  const description = stripHtml(parsed.data.description);

  try {
    const sent = await sendAdminMail({
      subject: `Atelier query · ${parsed.data.queryType} · ${name}`,
      replyTo: email,
      text: [`From: ${name}`, `Email: ${email}`, `Query: ${parsed.data.queryType}`, ``, description].join("\n"),
    });
    if (!sent) {
      return NextResponse.json(
        { message: "The desk could not send that note. Write to the atelier email instead." },
        { status: 503 },
      );
    }
  } catch (error) {
    console.error("Contact mail failed.", error instanceof Error ? error.message : "Unknown mail error");
    return NextResponse.json(
      { message: "The desk could not send that note. Write to the atelier email instead." },
      { status: 503 },
    );
  }

  return NextResponse.json({ message: "Your note is with the atelier." });
}
