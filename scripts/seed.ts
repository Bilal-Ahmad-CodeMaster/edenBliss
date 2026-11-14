import { config as loadEnv } from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { usePublicDnsWhenLoopback } from "../src/lib/mongo-dns";
import { defaultStoreSettings, SIZE_PRESETS } from "../src/lib/defaults";
import { calculateFinalPrice } from "../src/lib/prices";
import { categorySeed, productSeed } from "../src/lib/seed-data";
import { Category } from "../src/models/Category";
import { Product } from "../src/models/Product";
import { Size } from "../src/models/Size";
import { StoreSettings } from "../src/models/StoreSettings";
import { User } from "../src/models/User";

loadEnv({ path: ".env.local" });
loadEnv();

export async function runSeed(options: { disconnect?: boolean } = { disconnect: true }) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing. Add it to .env.local before seeding.");
  }

  usePublicDnsWhenLoopback();
  await mongoose.connect(uri);
  console.log("Connected to the Eden Bliss archive.");

  await StoreSettings.findOneAndUpdate(
    { singletonKey: "eden-bliss" },
    {
      $set: defaultStoreSettings,
      $setOnInsert: {
        singletonKey: "eden-bliss",
        adminEmail: (process.env.INITIAL_ADMIN_EMAIL || defaultStoreSettings.supportEmail).toLowerCase(),
      },
    },
    { upsert: true, returnDocument: "after" },
  );
  console.log("Store settings are in place.");

  for (const preset of SIZE_PRESETS) {
    await Size.findOneAndUpdate({ code: preset.code }, preset, {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    });
  }
  const sizes = await Size.find().sort({ sortOrder: 1 });
  console.log(`Sizes ready: ${sizes.map((size) => size.label).join(", ")}.`);

  const categoryIds = new Map<string, mongoose.Types.ObjectId>();
  for (const category of categorySeed.filter((entry) => entry.parent === null)) {
    const saved = await Category.findOneAndUpdate(
      { slug: category.slug },
      {
        name: category.name,
        slug: category.slug,
        description: category.description,
        imageUrl: category.imageUrl,
        parentCategory: null,
        isActive: true,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    if (saved) categoryIds.set(category.slug, saved._id);
  }

  for (const category of categorySeed.filter((entry) => entry.parent)) {
    const parentId = categoryIds.get(category.parent ?? "");
    const saved = await Category.findOneAndUpdate(
      { slug: category.slug },
      {
        name: category.name,
        slug: category.slug,
        description: category.description,
        imageUrl: category.imageUrl,
        parentCategory: parentId,
        isActive: true,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    if (saved) categoryIds.set(category.slug, saved._id);
  }
  console.log(`Categories ready: ${categoryIds.size}.`);

  for (const product of productSeed) {
    const categoryId = categoryIds.get(product.category);
    const subCategoryId = categoryIds.get(product.subCategory);
    if (!categoryId || !subCategoryId) {
      throw new Error(`Missing category for ${product.slug}.`);
    }

    await Product.findOneAndUpdate(
      { slug: product.slug },
      {
        title: product.title,
        slug: product.slug,
        storyDescription: product.storyDescription,
        fabricAndCare: product.fabricAndCare,
        images: product.images,
        outfitLookImages: product.outfitLookImages,
        category: categoryId,
        subCategory: subCategoryId,
        sizes: sizes.map((size, index) => ({
          sizeId: size._id,
          sizeLabel: size.label,
          stock: product.stock[index] ?? 0,
        })),
        basePrice: product.basePrice,
        discountPercentage: product.discountPercentage,
        finalPrice: calculateFinalPrice(product.basePrice, product.discountPercentage),
        isFeatured: product.isFeatured,
        isActive: true,
        averageRating: 0,
        reviewCount: 0,
      },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
    );
  }
  console.log(`Products ready: ${productSeed.length}.`);

  const adminEmail = (process.env.INITIAL_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL ?? "admin@edenbliss.com").toLowerCase();
  const adminName = process.env.ADMIN_NAME ?? "Eden Bliss Atelier";
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD;
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
  if (!adminPassword) {
    throw new Error("INITIAL_ADMIN_PASSWORD is missing. Set it in .env.local before seeding.");
  }

  const passwordHash = await bcrypt.hash(adminPassword, saltRounds);
  const existingAdmin = await User.findOne({ email: adminEmail }).select("+passwordHash");
  if (!existingAdmin) {
    await User.create({
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
      isBlocked: false,
      isOnline: false,
      phone: defaultStoreSettings.supportPhone,
    });
    console.log(`Admin account created for ${adminEmail}.`);
  } else {
    existingAdmin.name = adminName;
    existingAdmin.role = "ADMIN";
    existingAdmin.isBlocked = false;
    if (!existingAdmin.passwordHash) existingAdmin.passwordHash = passwordHash;
    await existingAdmin.save();
    console.log(`Admin account confirmed for ${adminEmail}.`);
  }

  if (options.disconnect !== false) await mongoose.disconnect();
  console.log("Seed complete.");
}

const invokedDirectly = process.argv[1]?.replaceAll("\\", "/").includes("/scripts/seed");
if (invokedDirectly) {
  runSeed().catch(async (error) => {
    console.error(error);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
  });
}
