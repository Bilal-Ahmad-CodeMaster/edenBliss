import type { StoreSettingsDTO } from "@/types/commerce";

export const defaultStoreSettings: StoreSettingsDTO = {
  storeName: "Eden Bliss",
  supportEmail: "atelier@edenbliss.com",
  supportPhone: "+1 (212) 555-0148",
  currencySymbol: "Rs.",
  standardShippingRate: 450,
  freeShippingThreshold: 15000,
  taxPercentage: 0,
  announcementBarText:
    "Cash on delivery across the atelier · Complimentary shipping above the seasonal threshold",
  themeMode: "warm-linen",
};

export const SIZE_PRESETS = [
  {
    label: "S",
    code: "s",
    sortOrder: 1,
    measurementsInMeters: {
      chest: 0.86,
      waist: 0.71,
      shoulder: 0.38,
      length: 0.66,
      sleeve: 0.58,
    },
  },
  {
    label: "M",
    code: "m",
    sortOrder: 2,
    measurementsInMeters: {
      chest: 0.96,
      waist: 0.81,
      shoulder: 0.41,
      length: 0.71,
      sleeve: 0.6,
    },
  },
  {
    label: "L",
    code: "l",
    sortOrder: 3,
    measurementsInMeters: {
      chest: 1.06,
      waist: 0.91,
      shoulder: 0.44,
      length: 0.73,
      sleeve: 0.62,
    },
  },
  {
    label: "XL",
    code: "xl",
    sortOrder: 4,
    measurementsInMeters: {
      chest: 1.16,
      waist: 1.02,
      shoulder: 0.47,
      length: 0.75,
      sleeve: 0.63,
    },
  },
  {
    label: "XXL",
    code: "xxl",
    sortOrder: 5,
    measurementsInMeters: {
      chest: 1.27,
      waist: 1.12,
      shoulder: 0.5,
      length: 0.76,
      sleeve: 0.64,
    },
  },
] as const;
