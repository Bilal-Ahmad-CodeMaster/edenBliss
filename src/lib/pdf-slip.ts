import "server-only";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatMeters } from "@/lib/measurements";
import type { GarmentMeasurements } from "@/lib/measurements";

export type SlipOrder = {
  orderNumber: string;
  status: string;
  createdAt: string;
  customFitNotes: string;
  subtotal: number;
  totalDiscount: number;
  shippingFee: number;
  grandTotal: number;
  shippingDetails: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
  };
  items: Array<{
    title: string;
    colorName?: string;
    sizeLabel: string;
    quantity: number;
    unitPrice: number;
    discountApplied: number;
    lineTotal: number;
    sizeMeasurementsMeters?: GarmentMeasurements;
  }>;
};

const INK: [number, number, number] = [28, 25, 23];
const SAGE: [number, number, number] = [63, 90, 69];
const PAPER: [number, number, number] = [250, 247, 242];

export function buildCodSlips(orders: SlipOrder[], support: { email: string; phone: string }, currency: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  orders.forEach((order, index) => {
    if (index > 0) doc.addPage();
    drawSlip(doc, order, support, currency);
  });
  return Buffer.from(doc.output("arraybuffer"));
}

function drawSlip(doc: jsPDF, order: SlipOrder, support: { email: string; phone: string }, currency: string) {
  doc.setFillColor(...PAPER);
  doc.rect(0, 0, 595, 842, "F");
  doc.setTextColor(...INK);
  doc.setFont("times", "bold");
  doc.setFontSize(26);
  doc.text("EDEN BLISS", 40, 52);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(order.orderNumber, 40, 72);
  doc.text(order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-GB") : "", 160, 72);
  doc.text(order.status, 280, 72);
  doc.setTextColor(...SAGE);
  doc.text(support.phone, 400, 52);
  doc.text(support.email, 400, 66);
  doc.setTextColor(...INK);

  doc.setFont("helvetica", "bold");
  doc.text("Deliver to", 40, 108);
  doc.text("Payment", 320, 108);
  doc.setFont("helvetica", "normal");
  const address = [
    order.shippingDetails.fullName,
    order.shippingDetails.phone,
    order.shippingDetails.address,
    [order.shippingDetails.city, order.shippingDetails.postalCode].filter(Boolean).join(" "),
  ];
  address.forEach((line, lineIndex) => doc.text(line, 40, 126 + lineIndex * 14));
  doc.setFillColor(...SAGE);
  doc.rect(320, 118, 220, 28, "F");
  doc.setTextColor(...PAPER);
  doc.setFont("helvetica", "bold");
  doc.text("CASH ON DELIVERY (COD)", 332, 136);

  autoTable(doc, {
    startY: 200,
    head: [["Piece", "Colour", "Size", "Qty", "Price", "Off", "Line"]],
    body: order.items.map((item) => [
      item.title,
      item.colorName || "—",
      item.sizeMeasurementsMeters
        ? `${item.sizeLabel}  Chest ${formatMeters(item.sizeMeasurementsMeters.chest)} / Length ${formatMeters(item.sizeMeasurementsMeters.length)}`
        : item.sizeLabel,
      String(item.quantity),
      money(item.unitPrice, currency),
      money(item.discountApplied, currency),
      money(item.lineTotal, currency),
    ]),
    styles: { fontSize: 8, textColor: INK, fillColor: PAPER },
    headStyles: { fillColor: SAGE, textColor: PAPER },
    margin: { left: 40, right: 40 },
  });

  const afterTable = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 360;
  let cursor = afterTable + 24;
  if (order.customFitNotes.trim()) {
    doc.setFillColor(158, 71, 59);
    doc.rect(40, cursor, 515, 48, "F");
    doc.setTextColor(...PAPER);
    doc.setFontSize(9);
    doc.text("CUSTOM FIT / WAIST NOTES", 52, cursor + 16);
    doc.text(order.customFitNotes.trim().slice(0, 220), 52, cursor + 32);
    cursor += 64;
  }
  doc.setTextColor(...INK);
  doc.setFontSize(11);
  const totals = [
    `Subtotal  ${money(order.subtotal, currency)}`,
    `Total savings  ${money(order.totalDiscount, currency)}`,
    `Shipping  ${money(order.shippingFee, currency)}`,
    `TOTAL COD AMOUNT TO COLLECT  ${money(order.grandTotal, currency)}`,
  ];
  doc.setFillColor(...INK);
  doc.rect(40, cursor, 515, 78, "F");
  doc.setTextColor(...PAPER);
  totals.forEach((line, lineIndex) => doc.text(line, 52, cursor + 18 + lineIndex * 16));
}

function money(value: number, currency: string) {
  return `${currency} ${value.toLocaleString("en-PK")}`;
}
