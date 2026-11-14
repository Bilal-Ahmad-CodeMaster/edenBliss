import type { GarmentMeasurements } from "@/lib/measurements";

export type Role = "USER" | "ADMIN";

export type ThemeMode = "warm-linen" | "dark-editorial" | "sage-minimal";

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string;
  phone: string;
  wishlist: string[];
};

export type StoreSettingsDTO = {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  currencySymbol: string;
  standardShippingRate: number;
  freeShippingThreshold: number;
  taxPercentage: number;
  announcementBarText: string;
  themeMode: ThemeMode;
};

export type NavCategory = {
  name: string;
  slug: string;
  imageUrl: string;
  children: { name: string; slug: string }[];
};

export type CartItem = {
  productId: string;
  title: string;
  slug: string;
  image: string;
  sizeLabel: string;
  sizeMeasurementsMeters: GarmentMeasurements;
  quantity: number;
  unitPrice: number;
  discountApplied: number;
};

export type ShippingAddress = {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type CustomerProfile = PublicUser & {
  shippingAddress: ShippingAddress;
};

export type WishlistOfferSize = {
  sizeLabel: string;
  stock: number;
  measurementsInMeters: GarmentMeasurements;
};

export type WishlistPiece = ProductCardData & {
  offerSize: WishlistOfferSize | null;
};

export type CustomerOrderItem = {
  title: string;
  image: string;
  sizeLabel: string;
  quantity: number;
  unitPrice: number;
  discountApplied: number;
  lineTotal: number;
};

export type CustomerOrder = {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  subtotal: number;
  totalDiscount: number;
  shippingFee: number;
  taxAmount: number;
  grandTotal: number;
  customFitNotes: string;
  paymentMethod: "COD";
  statusHistory: { status: string; updatedAt: string; note: string }[];
  items: CustomerOrderItem[];
  shipping: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
};

export type ProductCardData = {
  id: string;
  title: string;
  slug: string;
  storyDescription: string;
  image: string;
  images: string[];
  basePrice: number;
  discountPercentage: number;
  finalPrice: number;
  categoryName: string;
  categorySlug: string;
};

export type ProductSizeOption = {
  sizeId: string;
  sizeLabel: string;
  stock: number;
  measurementsInMeters: GarmentMeasurements;
  measurementsInCm: GarmentMeasurements;
  measurementsInInches: GarmentMeasurements;
};

export type ProductDetail = ProductCardData & {
  fabricAndCare: string;
  outfitLookImages: string[];
  subCategoryName: string;
  subCategorySlug: string;
  sizes: ProductSizeOption[];
  averageRating: number;
  reviewCount: number;
};
