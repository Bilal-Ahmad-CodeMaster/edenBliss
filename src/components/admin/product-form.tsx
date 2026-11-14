"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { DeskAlert } from "@/components/admin/desk-alert";
import { ImageManager } from "@/components/admin/image-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { productFormSchema, type ProductFormValues } from "@/lib/admin-schemas";
import { clientFetch } from "@/lib/client-fetch";
import { formatMoney, resolvePricing } from "@/lib/prices";
import { slugify } from "@/lib/utils";

type Option = { id: string; name: string; parentId: string };
type SizeOption = { id: string; label: string };
type SizeStock = { sizeId: string; stock: number };

export type ProductEditor = ProductFormValues & {
  id?: string;
  images: string[];
  outfitLookImages: string[];
  sizes: SizeStock[];
};

export function ProductForm({
  product,
  categories,
  sizes,
  currency,
  onSaved,
}: {
  product?: ProductEditor;
  categories: Option[];
  sizes: SizeOption[];
  currency: string;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const slugTouched = useRef(Boolean(product));
  const [images, setImages] = useState(product?.images ?? []);
  const [outfitLookImages, setOutfitLookImages] = useState(product?.outfitLookImages ?? []);
  const [stocks, setStocks] = useState<Record<string, string>>(() =>
    Object.fromEntries((product?.sizes ?? []).map((size) => [size.sizeId, String(size.stock)])),
  );
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      title: product?.title ?? "",
      slug: product?.slug ?? "",
      storyDescription: product?.storyDescription ?? "",
      fabricAndCare: product?.fabricAndCare ?? "",
      categoryId: product?.categoryId ?? "",
      subCategoryId: product?.subCategoryId ?? "",
      basePrice: product?.basePrice ?? 0,
      discountMode: product?.discountMode ?? "percent",
      discountPercentage: product?.discountPercentage ?? 0,
      discountAmount: product?.discountAmount ?? 0,
      isFeatured: product?.isFeatured ?? false,
      isActive: product?.isActive ?? true,
    },
  });

  const title = useWatch({ control: form.control, name: "title" });
  const categoryId = useWatch({ control: form.control, name: "categoryId" });
  const basePrice = useWatch({ control: form.control, name: "basePrice" });
  const discountMode = useWatch({ control: form.control, name: "discountMode" });
  const discountPercentage = useWatch({ control: form.control, name: "discountPercentage" });
  const discountAmount = useWatch({ control: form.control, name: "discountAmount" });

  useEffect(() => {
    if (slugTouched.current) return;
    form.setValue("slug", slugify(title || ""));
  }, [form, title]);

  const children = useMemo(
    () => categories.filter((category) => category.parentId === categoryId),
    [categories, categoryId],
  );
  const parents = categories.filter((category) => !category.parentId);
  const preview = resolvePricing(Number(basePrice) || 0, discountMode, Number(discountPercentage) || 0, Number(discountAmount) || 0);
  const chosenSizes = sizes.filter((size) => stocks[size.id] !== undefined);

  async function onSubmit(values: ProductFormValues) {
    if (pending) return;
    if (!images.length) {
      setMessage("Add at least one gallery image.");
      return;
    }
    if (!chosenSizes.length) {
      setMessage("Choose at least one size and a stock count.");
      return;
    }
    setPending(true);
    setMessage("");
    try {
      const response = await clientFetch(product?.id ? `/api/admin/products/${product.id}` : "/api/admin/products", {
        method: product?.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          subCategoryId: values.subCategoryId || null,
          discountPercentage: values.discountMode === "percent" ? values.discountPercentage : 0,
          discountAmount: values.discountMode === "flat" ? values.discountAmount : 0,
          images,
          outfitLookImages,
          sizes: chosenSizes.map((size) => ({ sizeId: size.id, stock: Math.max(0, Number(stocks[size.id]) || 0) })),
        }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        setMessage(data.message ?? "The piece could not be saved.");
        toast.error(data.message ?? "The piece could not be saved.");
        return;
      }
      toast.success(data.message ?? "Saved.");
      if (onSaved) {
        onSaved();
        return;
      }
      router.push("/admin/products");
      router.refresh();
    } catch {
      setMessage("The piece could not be saved.");
      toast.error("The piece could not be saved.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
      <DeskAlert message={message} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...form.register("title")} />
          {form.formState.errors.title ? <p className="text-xs text-terracotta">{form.formState.errors.title.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            {...form.register("slug", {
              onChange() {
                slugTouched.current = true;
              },
            })}
          />
          {form.formState.errors.slug ? <p className="text-xs text-terracotta">{form.formState.errors.slug.message}</p> : null}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="story">Brand story</Label>
        <Textarea id="story" {...form.register("storyDescription")} />
        {form.formState.errors.storyDescription ? (
          <p className="text-xs text-terracotta">{form.formState.errors.storyDescription.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="care">Fabric and care</Label>
        <Textarea id="care" {...form.register("fabricAndCare")} />
        {form.formState.errors.fabricAndCare ? (
          <p className="text-xs text-terracotta">{form.formState.errors.fabricAndCare.message}</p>
        ) : null}
      </div>
      <ImageManager label="Gallery" images={images} onChange={setImages} />
      <ImageManager label="Outfit looks" images={outfitLookImages} onChange={setOutfitLookImages} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select id="category" className="h-12 w-full border border-line bg-background px-3 text-sm" {...form.register("categoryId")}>
            <option value="">Choose</option>
            {parents.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="subcategory">Subcategory</Label>
          <select
            id="subcategory"
            className="h-12 w-full border border-line bg-background px-3 text-sm"
            {...form.register("subCategoryId")}
          >
            <option value="">None</option>
            {children.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <fieldset className="space-y-3">
        <legend className="text-[11px] uppercase tracking-[0.18em] text-muted">Sizes and stock</legend>
        {sizes.map((size) => {
          const checked = stocks[size.id] !== undefined;
          return (
            <label key={size.id} className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => {
                  setStocks((current) => {
                    const next = { ...current };
                    if (event.target.checked) next[size.id] = next[size.id] ?? "0";
                    else delete next[size.id];
                    return next;
                  });
                }}
              />
              <span className="w-12">{size.label}</span>
              <Input
                type="number"
                min={0}
                className="h-10 max-w-28"
                disabled={!checked}
                value={stocks[size.id] ?? ""}
                onChange={(event) => setStocks((current) => ({ ...current, [size.id]: event.target.value }))}
                aria-label={`${size.label} stock`}
              />
            </label>
          );
        })}
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="basePrice">Base price</Label>
          <Input id="basePrice" type="number" min="0" step="0.01" {...form.register("basePrice", { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="discountMode">Offer</Label>
          <select id="discountMode" className="h-12 w-full border border-line bg-background px-3 text-sm" {...form.register("discountMode")}>
            <option value="percent">Percent off</option>
            <option value="flat">Flat off</option>
          </select>
        </div>
      </div>
      {discountMode === "flat" ? (
        <div className="space-y-2">
          <Label htmlFor="discountAmount">Flat off</Label>
          <Input id="discountAmount" type="number" min="0" step="0.01" {...form.register("discountAmount", { valueAsNumber: true })} />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="discountPercentage">Percent off</Label>
          <Input
            id="discountPercentage"
            type="number"
            min="0"
            max="90"
            step="1"
            {...form.register("discountPercentage", { valueAsNumber: true })}
          />
        </div>
      )}
      <div className="border border-line p-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Customer price</p>
        <p className="mt-2 font-serif text-4xl">{formatMoney(preview.finalPrice, currency)}</p>
        {preview.finalPrice < preview.basePrice ? (
          <p className="mt-2 text-sm text-terracotta">
            {formatMoney(preview.basePrice - preview.finalPrice, currency)} off
            {preview.discountPercentage > 0 ? ` · ${Math.round(preview.discountPercentage)}%` : ""}
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">No offer applied. Offers stop at 90%.</p>
        )}
        {preview.capped ? <p className="mt-2 text-xs text-terracotta">The offer was capped at 90%.</p> : null}
      </div>
      <div className="flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" {...form.register("isActive")} /> On the rail
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" {...form.register("isFeatured")} /> Featured
        </label>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving" : product?.id ? "Save piece" : "Add piece"}
      </Button>
    </form>
  );
}
