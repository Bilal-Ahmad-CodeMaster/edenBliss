import "server-only";
import bcrypt from "bcryptjs";

export function saltRounds() {
  const rounds = Number(process.env.BCRYPT_SALT_ROUNDS);
  if (!Number.isFinite(rounds) || rounds < 10 || rounds > 14) return 12;
  return Math.floor(rounds);
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, saltRounds());
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}
