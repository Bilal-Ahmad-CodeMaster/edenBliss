"use client";

import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { DeskAlert } from "@/components/admin/desk-alert";
import { ImageManager } from "@/components/admin/image-manager";
import { DeskDialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { clientFetch } from "@/lib/client-fetch";
import { slugify } from "@/lib/utils";

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  parentId: string;
  parentName: string;
  isActive: boolean;
};

const empty = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  parentId: "",
  isActive: true,
};

export function CategoryDesk({ initial }: { initial: CategoryRow[] }) {
  const [rows, setRows] = useState(initial);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [removeId, setRemoveId] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const parents = useMemo(() => rows.filter((row) => !row.parentId && row.id !== editing), [rows, editing]);

  function openCreate() {
    setEditing("");
    setSlugTouched(false);
    setMessage("");
    setForm(empty);
    setFormOpen(true);
  }

  function edit(row: CategoryRow) {
    setEditing(row.id);
    setSlugTouched(true);
    setMessage("");
    setForm({
      name: row.name,
      slug: row.slug,
      description: row.description,
      imageUrl: row.imageUrl,
      parentId: row.parentId,
      isActive: row.isActive,
    });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing("");
    setForm(empty);
    setSlugTouched(false);
    setMessage("");
  }

  async function reload() {
    const response = await clientFetch("/api/admin/categories");
    const data = (await response.json()) as { rows?: CategoryRow[]; message?: string };
    if (!response.ok || !data.rows) throw new Error(data.message ?? "The categories could not be loaded.");
    setRows(data.rows);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setMessage("");
    try {
      const response = await clientFetch(editing ? `/api/admin/categories/${editing}` : "/api/admin/categories", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, parentCategory: form.parentId || null }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        setMessage(data.message ?? "The category could not be saved.");
        return;
      }
      toast.success(data.message ?? "Saved.");
      closeForm();
      await reload();
    } catch {
      setMessage("The category could not be saved.");
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!removeId || pending) return;
    setPending(true);
    try {
      const response = await clientFetch(`/api/admin/categories/${removeId}`, { method: "DELETE" });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(data.message ?? "The category could not be removed.");
        return;
      }
      toast.success(data.message ?? "Removed.");
      setRemoveId("");
      if (editing === removeId) {
        setEditing("");
        setForm(empty);
      }
      await reload();
    } catch {
      toast.error("The category could not be removed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={openCreate}>
          Add category
        </Button>
      </div>
      <ul className="divide-y divide-line border border-line">
        {rows.length === 0 ? <li className="p-4 text-sm text-muted">No categories yet.</li> : null}
        {rows.map((row) => (
          <li key={row.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="truncate font-serif text-2xl">{row.name}</p>
              <p className="truncate text-xs text-muted">
                /{row.slug}
                {row.parentName ? ` · inside ${row.parentName}` : ""}
                {row.isActive ? "" : " · hidden"}
              </p>
            </div>
            <div className="flex shrink-0 gap-3 text-[11px] uppercase tracking-[0.14em]">
              <button type="button" className="text-sage" onClick={() => edit(row)}>
                Edit
              </button>
              <button type="button" className="text-terracotta" onClick={() => setRemoveId(row.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      <DeskDialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) closeForm();
        }}
        wide
        title={editing ? "Update category" : "Add category"}
        description="Name the rail, then place it at the top or inside another room."
      >
        <form onSubmit={onSubmit} className="space-y-4">
        <DeskAlert message={message} />
        <div className="space-y-2">
          <Label htmlFor="category-name">Name</Label>
          <Input
            id="category-name"
            value={form.name}
            onChange={(event) => {
              const name = event.target.value;
              setForm((current) => ({ ...current, name, slug: slugTouched ? current.slug : slugify(name) }));
            }}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category-slug">Slug</Label>
          <Input
            id="category-slug"
            value={form.slug}
            onChange={(event) => {
              setSlugTouched(true);
              setForm((current) => ({ ...current, slug: slugify(event.target.value) }));
            }}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category-description">Description</Label>
          <Textarea
            id="category-description"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category-parent">Parent</Label>
          <select
            id="category-parent"
            value={form.parentId}
            onChange={(event) => setForm((current) => ({ ...current, parentId: event.target.value }))}
            className="h-12 w-full border border-line bg-background px-3 text-sm"
          >
            <option value="">Top level</option>
            {parents.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
        </div>
        <ImageManager
          label="Cover"
          max={1}
          images={form.imageUrl ? [form.imageUrl] : []}
          onChange={(images) => setForm((current) => ({ ...current, imageUrl: images[0] ?? "" }))}
        />
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
          />
          Active on the shop
        </label>
        <div className="flex gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving" : editing ? "Save category" : "Add category"}
          </Button>
          <Button type="button" variant="outline" onClick={closeForm}>
            Cancel
          </Button>
        </div>
        </form>
      </DeskDialog>

      <DeskDialog
        open={Boolean(removeId)}
        onOpenChange={(open) => {
          if (!open) setRemoveId("");
        }}
        title="Remove this category?"
        description="Pieces and subcategories must be moved first."
      >
        <div className="flex gap-3">
          <Button type="button" variant="sale" disabled={pending} onClick={() => void remove()}>
            Delete
          </Button>
          <Button type="button" variant="outline" onClick={() => setRemoveId("")}>
            Keep it
          </Button>
        </div>
      </DeskDialog>
    </div>
  );
}
