import { z } from "zod";

export const incomingCartItemSchema = z.object({
  productId: z.string().trim(),
  sizeLabel: z.string().trim().min(1).max(12),
  quantity: z.coerce.number().int().min(1).max(10),
});

export const signupFormSchema = z.object({
  name: z.string().trim().min(2, "Please share your full name.").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(120),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(72, "Passwords are limited to 72 characters."),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
});

export const signupRequestSchema = signupFormSchema.extend({
  wishlist: z.array(z.string()).max(100).optional().default([]),
  cart: z.array(incomingCartItemSchema).max(40).optional().default([]),
});

export const loginFormSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(120),
  password: z.string().min(1, "Enter your password.").max(72),
});

export const loginRequestSchema = loginFormSchema.extend({
  wishlist: z.array(z.string()).max(100).optional().default([]),
  cart: z.array(incomingCartItemSchema).max(40).optional().default([]),
});

export const cartReplaceSchema = z.object({
  items: z.array(incomingCartItemSchema).max(40),
});

export const wishlistToggleSchema = z.object({
  productId: z.string().trim(),
});

export const catalogIdsSchema = z.object({
  ids: z.array(z.string()).max(100),
});

export const checkoutFormSchema = z.object({
  fullName: z.string().trim().min(2, "Share the name for the parcel.").max(80),
  phone: z.string().trim().min(6, "Add a phone number.").max(30),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(120),
  address: z.string().trim().min(4, "Add the street address.").max(180),
  city: z.string().trim().min(2, "Add the city.").max(80),
  state: z.string().trim().max(80),
  postalCode: z.string().trim().min(3, "Add the postal code.").max(16),
  country: z.string().trim().max(80),
  customFitNotes: z.string().trim().max(1000),
  saveToProfile: z.boolean(),
  idempotencyKey: z.string().uuid(),
});

export const profileFormSchema = z.object({
  name: z.string().trim().min(2, "Please share your full name.").max(80),
  phone: z.string().trim().max(30).optional().default(""),
  street: z.string().trim().max(180).optional().default(""),
  city: z.string().trim().max(80).optional().default(""),
  state: z.string().trim().max(80).optional().default(""),
  postalCode: z.string().trim().max(16).optional().default(""),
  country: z.string().trim().max(80).optional().default(""),
  removeAvatar: z.boolean().optional().default(false),
});

export const reviewFormSchema = z.object({
  productId: z.string().trim(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(2, "Leave a short note.").max(2000),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(72),
  nextPassword: z.string().min(8, "Use at least 8 characters.").max(72),
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export type SignupFormValues = z.infer<typeof signupFormSchema>;
export type LoginFormValues = z.infer<typeof loginFormSchema>;
