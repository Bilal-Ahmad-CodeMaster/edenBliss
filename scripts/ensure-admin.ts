import { config as loadEnv } from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { defaultStoreSettings } from "../src/lib/defaults";
import { usePublicDnsWhenLoopback } from "../src/lib/mongo-dns";
import { User } from "../src/models/User";

loadEnv({ path: ".env.local" });
loadEnv();

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is missing.");
  const adminEmail = (process.env.INITIAL_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL ?? "admin@edenbliss.com").toLowerCase();
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD;
  if (!adminPassword) throw new Error("INITIAL_ADMIN_PASSWORD is missing.");

  usePublicDnsWhenLoopback();
  await mongoose.connect(uri);
  const passwordHash = await bcrypt.hash(adminPassword, Number(process.env.BCRYPT_SALT_ROUNDS) || 12);
  const existing = await User.findOne({ email: adminEmail }).select("+passwordHash role");
  if (!existing) {
    await User.create({
      name: process.env.ADMIN_NAME ?? "Eden Bliss Atelier",
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
      isBlocked: false,
      isOnline: false,
      phone: defaultStoreSettings.supportPhone,
    });
    console.log(`Admin account created for ${adminEmail}.`);
  } else {
    existing.role = "ADMIN";
    existing.isBlocked = false;
    if (!existing.passwordHash) existing.passwordHash = passwordHash;
    await existing.save();
    console.log(`Admin account confirmed for ${adminEmail}.`);
  }
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : "Admin setup failed.");
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
