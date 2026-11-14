import "server-only";
import { connectDB } from "@/lib/db";
import { stripHtml } from "@/lib/security";
import { User } from "@/models/User";
import type { CustomerProfile, ShippingAddress } from "@/types/commerce";
import type { ProfileFormValues } from "@/lib/validators";

const EMPTY_ADDRESS: ShippingAddress = {
  street: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};

type AddressLean = Partial<ShippingAddress> | null | undefined;

function addressOf(value: AddressLean): ShippingAddress {
  return {
    street: value?.street ?? "",
    city: value?.city ?? "",
    state: value?.state ?? "",
    postalCode: value?.postalCode ?? "",
    country: value?.country ?? "",
  };
}

type ProfileLean = {
  _id: { toString(): string };
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  avatarUrl?: string;
  phone?: string;
  wishlist?: Array<{ toString(): string }>;
  shippingAddress?: AddressLean;
};

function toProfile(user: ProfileLean): CustomerProfile {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl ?? "",
    phone: user.phone ?? "",
    wishlist: (user.wishlist ?? []).map((id) => String(id)),
    shippingAddress: addressOf(user.shippingAddress),
  };
}

const PROFILE_SELECT = "name email role avatarUrl phone wishlist shippingAddress";

export async function getCustomerProfile(userId: string) {
  await connectDB();
  const user = await User.findOne({ _id: userId, isBlocked: false }).select(PROFILE_SELECT).lean<ProfileLean | null>();
  return user ? toProfile(user) : null;
}

function cleanAddress(input: ProfileFormValues): ShippingAddress {
  return {
    street: stripHtml(input.street).slice(0, 180),
    city: stripHtml(input.city).slice(0, 80),
    state: stripHtml(input.state).slice(0, 80),
    postalCode: stripHtml(input.postalCode).slice(0, 16),
    country: stripHtml(input.country).slice(0, 80),
  };
}

export async function updateCustomerProfile(userId: string, input: ProfileFormValues) {
  await connectDB();
  const update: Record<string, unknown> = {
    name: stripHtml(input.name).slice(0, 80),
    phone: stripHtml(input.phone).slice(0, 30),
    shippingAddress: cleanAddress(input),
  };
  if (input.removeAvatar) update.avatarUrl = "";

  const user = await User.findOneAndUpdate({ _id: userId, isBlocked: false }, { $set: update }, { returnDocument: "after" })
    .select(PROFILE_SELECT)
    .lean<ProfileLean | null>();
  return user ? toProfile(user) : null;
}

export async function saveProfileAvatar(userId: string, avatarUrl: string) {
  await connectDB();
  const user = await User.findOneAndUpdate(
    { _id: userId, isBlocked: false },
    { $set: { avatarUrl } },
    { returnDocument: "after" },
  )
    .select(PROFILE_SELECT)
    .lean<ProfileLean | null>();
  return user ? toProfile(user) : null;
}

export { EMPTY_ADDRESS };
