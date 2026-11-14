"use client";

import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { DeskAlert } from "@/components/admin/desk-alert";
import { DeskDialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clientFetch } from "@/lib/client-fetch";
import {
  MEASUREMENT_KEYS,
  convertMeasurements,
  formatCentimeters,
  formatInches,
  formatMeters,
  type GarmentMeasurements,
} from "@/lib/measurements";
import { slugify } from "@/lib/utils";

export type SizeRow = {
  id: string;
  label: string;
  code: string;
  sortOrder: number;
  measurementsInMeters: GarmentMeasurements;
  measurementsInCm: GarmentMeasurements;
  measurementsInInches: GarmentMeasurements;
};

const blankMeters = { chest: "", waist: "", shoulder: "", length: "", sleeve: "" };

const labels: Record<(typeof MEASUREMENT_KEYS)[number], string> = {
  chest: "Chest",
  waist: "Waist",
  shoulder: "Shoulder",
  length: "Length",
  sleeve: "Sleeve",
};

export function SizeDesk({ initial }: { initial: SizeRow[] }) {
  const [rows, setRows] = useState(initial);
  const [label, setLabel] = useState("");
  const [code, setCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [sortOrder, setSortOrder] = useState("0");
  const [meters, setMeters] = useState(blankMeters);
  const [editing, setEditing] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [removeId, setRemoveId] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const preview = useMemo(() => {
    const values = Object.fromEntries(MEASUREMENT_KEYS.map((key) => [key, Number(meters[key])])) as GarmentMeasurements;
    if (MEASUREMENT_KEYS.some((key) => !(values[key] > 0))) return null;
    return convertMeasurements(values);
  }, [meters]);

  function openCreate() {
    reset();
    setFormOpen(true);
  }

  function edit(row: SizeRow) {
    setEditing(row.id);
    setCodeTouched(true);
    setLabel(row.label);
    setCode(row.code);
    setSortOrder(String(row.sortOrder));
    setMeters({
      chest: String(row.measurementsInMeters.chest),
      waist: String(row.measurementsInMeters.waist),
      shoulder: String(row.measurementsInMeters.shoulder),
      length: String(row.measurementsInMeters.length),
      sleeve: String(row.measurementsInMeters.sleeve),
    });
    setFormOpen(true);
  }

  function reset() {
    setEditing("");
    setLabel("");
    setCode("");
    setCodeTouched(false);
    setSortOrder("0");
    setMeters(blankMeters);
    setFormOpen(false);
  }

  async function reload() {
    const response = await clientFetch("/api/admin/sizes");
    const data = (await response.json()) as { rows?: SizeRow[]; message?: string };
    if (!response.ok || !data.rows) throw new Error(data.message ?? "The sizes could not be loaded.");
    setRows(data.rows);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending || !preview) {
      setMessage("Enter every measurement in metres.");
      return;
    }
    setPending(true);
    setMessage("");
    try {
      const response = await clientFetch(editing ? `/api/admin/sizes/${editing}` : "/api/admin/sizes", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          code,
          sortOrder: Number(sortOrder) || 0,
          measurementsInMeters: preview.meters,
        }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        setMessage(data.message ?? "The size could not be saved.");
        return;
      }
      toast.success(data.message ?? "Saved.");
      reset();
      await reload();
    } catch {
      setMessage("The size could not be saved.");
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!removeId || pending) return;
    setPending(true);
    try {
      const response = await clientFetch(`/api/admin/sizes/${removeId}`, { method: "DELETE" });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(data.message ?? "The size could not be removed.");
        return;
      }
      toast.success(data.message ?? "Removed.");
      if (editing === removeId) reset();
      setRemoveId("");
      await reload();
    } catch {
      toast.error("The size could not be removed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={openCreate}>
          Add size
        </Button>
      </div>
      <ul className="divide-y divide-line border border-line">
        {rows.length === 0 ? <li className="p-4 text-sm text-muted">No sizes yet.</li> : null}
        {rows.map((row) => (
          <li key={row.id} className="flex items-start justify-between gap-4 p-4">
            <div>
              <p className="font-serif text-2xl">{row.label}</p>
              <p className="mt-1 text-xs text-muted">
                Chest {formatMeters(row.measurementsInMeters.chest)} · {formatCentimeters(row.measurementsInCm.chest)} ·{" "}
                {formatInches(row.measurementsInInches.chest)}
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
          if (!open) reset();
        }}
        wide
        title={editing ? "Update size" : "Add size"}
        description="Measurements are stored in metres and shown in centimetres and inches."
      >
      <form onSubmit={onSubmit} className="space-y-4">
        <DeskAlert message={message} />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="size-label">Label</Label>
            <Input
              id="size-label"
              value={label}
              onChange={(event) => {
                const next = event.target.value;
                setLabel(next);
                if (!codeTouched) setCode(slugify(next));
              }}
              placeholder="M"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="size-code">Code</Label>
            <Input
              id="size-code"
              value={code}
              onChange={(event) => {
                setCodeTouched(true);
                setCode(slugify(event.target.value));
              }}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="size-order">Sort order</Label>
          <Input id="size-order" type="number" min={0} value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {MEASUREMENT_KEYS.map((key) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={`size-${key}`}>{labels[key]} (m)</Label>
              <Input
                id={`size-${key}`}
                type="number"
                min="0.01"
                max="3"
                step="0.01"
                value={meters[key]}
                onChange={(event) => setMeters((current) => ({ ...current, [key]: event.target.value }))}
                required
              />
            </div>
          ))}
        </div>
        <div className="border border-line p-4 text-sm">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Live preview</p>
          {preview ? (
            <ul className="mt-3 space-y-2">
              {MEASUREMENT_KEYS.map((key) => (
                <li key={key} className="flex justify-between gap-3">
                  <span>{labels[key]}</span>
                  <span className="text-muted">
                    {formatMeters(preview.meters[key])} · {formatCentimeters(preview.centimeters[key])} · {formatInches(preview.inches[key])}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-muted">Enter metres to see centimetres and inches.</p>
          )}
        </div>
        <div className="flex gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving" : editing ? "Save size" : "Add size"}
          </Button>
          <Button type="button" variant="outline" onClick={reset}>
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
        title="Remove this size?"
        description="A size still used by a piece stays in the book."
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
