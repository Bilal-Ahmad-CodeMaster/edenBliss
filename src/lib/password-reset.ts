import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { connectDB } from "@/lib/db";
import { sendCustomerMail } from "@/lib/mail";
import { hashPassword } from "@/lib/passwords";
import { User } from "@/models/User";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function otpKey() {
  const secret = process.env.CSRF_SECRET || process.env.JWT_ACCESS_SECRET || "";
  if (!secret) throw new Error("A signing secret is required for password codes.");
  return secret;
}

function hashOtp(email: string, code: string) {
  return createHmac("sha256", otpKey()).update(`${email.toLowerCase()}:${code}`).digest("hex");
}

function codesMatch(expected: string, actual: string) {
  const left = Buffer.from(expected);
  const right = Buffer.from(actual);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

async function clearReset(id: unknown) {
  await User.updateOne(
    { _id: id },
    { $set: { passwordResetHash: "", passwordResetAttempts: 0 }, $unset: { passwordResetExpires: "" } },
  );
}

export async function requestPasswordOtp(email: string) {
  await connectDB();
  const normalized = email.toLowerCase();
  const user = await User.findOne({ email: normalized }).select("email isBlocked");
  if (!user || Array.isArray(user)) return "missing" as const;
  if (user.isBlocked) return "blocked" as const;

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        passwordResetHash: hashOtp(normalized, code),
        passwordResetExpires: new Date(Date.now() + OTP_TTL_MS),
        passwordResetAttempts: 0,
      },
    },
  );

  try {
    const sent = await sendCustomerMail({
      to: normalized,
      subject: "Your Eden Bliss password code",
      text: [
        "Use this code to choose a new Eden Bliss password.",
        "",
        code,
        "",
        "The code expires in 10 minutes. If you did not ask for it, you can ignore this message.",
      ].join("\n"),
    });
    if (!sent) {
      await clearReset(user._id);
      return "mail" as const;
    }
  } catch (error) {
    console.error("Password code mail failed.", error instanceof Error ? error.message : "Unknown mail error");
    await clearReset(user._id);
    return "mail" as const;
  }

  return "sent" as const;
}

export async function resetPasswordWithOtp(email: string, code: string, password: string) {
  await connectDB();
  const normalized = email.toLowerCase();
  const user = await User.findOne({ email: normalized, isBlocked: false }).select(
    "+passwordResetHash +passwordResetExpires +passwordResetAttempts",
  );
  const expires = user?.passwordResetExpires ? new Date(user.passwordResetExpires).getTime() : 0;
  const hash = user && typeof user.passwordResetHash === "string" ? user.passwordResetHash : "";
  const attempts = Number(user?.passwordResetAttempts) || 0;
  if (!user || Array.isArray(user) || !hash || !expires || expires < Date.now() || attempts >= MAX_ATTEMPTS) {
    if (user && !Array.isArray(user)) await clearReset(user._id);
    return { ok: false as const, status: 400, message: "That code has expired. Request a new one." };
  }

  const nextAttempts = attempts + 1;
  if (!codesMatch(hash, hashOtp(normalized, code))) {
    if (nextAttempts >= MAX_ATTEMPTS) {
      await clearReset(user._id);
      return { ok: false as const, status: 400, message: "That code has expired. Request a new one." };
    }
    await User.updateOne({ _id: user._id }, { $set: { passwordResetAttempts: nextAttempts } });
    return { ok: false as const, status: 400, message: "That code does not match." };
  }

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        passwordHash: await hashPassword(password),
        passwordResetHash: "",
        passwordResetAttempts: 0,
      },
      $unset: { passwordResetExpires: "" },
    },
  );
  return { ok: true as const };
}
