import { z } from "zod";

const slug = z
  .string()
  .trim()
  .min(2)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens.");

export const categoryWriteSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug,
  description: z.string().trim().min(2).max(600),
  imageUrl: z.string().trim().max(800).optional().default(""),
  parentCategory: z.string().trim().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const sizeWriteSchema = z.object({
  label: z.string().trim().min(1).max(12),
  code: slug,
  sortOrder: z.coerce.number().int().min(0).max(999),
  measurementsInMeters: z.object({
    chest: z.coerce.number().gt(0).max(3),
    waist: z.coerce.number().gt(0).max(3),
    shoulder: z.coerce.number().gt(0).max(3),
    length: z.coerce.number().gt(0).max(3),
    sleeve: z.coerce.number().gt(0).max(3),
  }),
});

const mediaUrl = z.string().trim().min(1).max(800);

const colorVariantWriteSchema = z.object({
  colorName: z.string().trim().min(2).max(40),
  colorSlug: slug,
  hexCode: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/, "Use a hex colour such as #B54B5A."),
  images: z.array(mediaUrl).min(1).max(8),
  outfitLookImages: z.array(mediaUrl).max(8).default([]),
  sizes: z
    .array(
      z.object({
        sizeId: z.string().trim().min(1),
        stock: z.coerce.number().int().min(0).max(10000),
      }),
    )
    .min(1)
    .max(20),
});

export const productWriteSchema = z.object({
  title: z.string().trim().min(2).max(140),
  slug,
  storyDescription: z.string().trim().min(10).max(4000),
  fabricAndCare: z.string().trim().min(2).max(2000),
  images: z.array(mediaUrl).min(1).max(8),
  outfitLookImages: z.array(mediaUrl).max(8).default([]),
  colorVariants: z.array(colorVariantWriteSchema).max(8).default([]),
  categoryId: z.string().trim().min(1),
  subCategoryId: z.string().trim().optional().nullable(),
  sizes: z
    .array(
      z.object({
        sizeId: z.string().trim().min(1),
        stock: z.coerce.number().int().min(0).max(10000),
      }),
    )
    .min(1)
    .max(20),
  basePrice: z.coerce.number().positive().max(10_000_000),
  discountMode: z.enum(["percent", "flat"]),
  discountPercentage: z.coerce.number().min(0).max(90).default(0),
  discountAmount: z.coerce.number().min(0).max(10_000_000).default(0),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const productFormSchema = z.object({
  title: z.string().trim().min(2, "Give the piece a name.").max(140),
  slug,
  storyDescription: z.string().trim().min(10, "Write the brand story.").max(4000),
  fabricAndCare: z.string().trim().min(2, "Add fabric and care.").max(2000),
  categoryId: z.string().min(1, "Choose a category."),
  subCategoryId: z.string(),
  basePrice: z.coerce.number().positive("Set a base price."),
  discountMode: z.enum(["percent", "flat"]),
  discountPercentage: z.coerce.number().min(0).max(90),
  discountAmount: z.coerce.number().min(0),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  avatarUrl: z.string().trim().max(400).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  currentPassword: z.string().max(72).optional().default(""),
  nextPassword: z.string().max(72).optional().default(""),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
