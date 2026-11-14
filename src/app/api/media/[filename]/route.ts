import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/guard";
import { readPrivateImage } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ filename: string }> }) {
  const limited = await enforceRateLimit(request);
  if (limited) return limited;
  const { filename } = await context.params;
  const image = await readPrivateImage(filename);
  if (!image) return NextResponse.json({ message: "Not found." }, { status: 404 });

  return new NextResponse(new Uint8Array(image.bytes), {
    status: 200,
    headers: {
      "Content-Type": image.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
