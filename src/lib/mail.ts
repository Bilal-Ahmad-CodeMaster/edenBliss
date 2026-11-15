import "server-only";
import { resolve4 } from "node:dns";
import nodemailer from "nodemailer";
import { connectDB } from "@/lib/db";
import { usePublicDnsWhenLoopback } from "@/lib/mongo-dns";
import { formatMoney } from "@/lib/prices";
import { stripHtml } from "@/lib/sanitize";
import { Order } from "@/models/Order";
import { StoreSettings } from "@/models/StoreSettings";

function oneLine(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function resolveMailHost(hostname: string) {
  usePublicDnsWhenLoopback();
  return new Promise<string>((resolve) => {
    resolve4(hostname, (error, addresses) => {
      resolve(!error && addresses[0] ? addresses[0] : hostname);
    });
  });
}

function smtpConfig() {
  const host = process.env.SMTP_HOST?.trim() ?? "";
  const user = process.env.SMTP_USER?.trim() ?? "";
  const pass = process.env.SMTP_PASS ?? "";
  if (!host || !user || !pass) return null;
  if ([host, user, pass].some((value) => value.includes("<") || value.includes("xxxxx"))) return null;
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  return { host, port, secure, user, pass };
}

export function mailConfigured() {
  return smtpConfig() !== null;
}

export async function getAdminInbox() {
  const fallback = (process.env.INITIAL_ADMIN_EMAIL || "").trim().toLowerCase();
  try {
    await connectDB();
    const settings = await StoreSettings.findOne({ singletonKey: "eden-bliss" })
      .select("adminEmail")
      .lean<{ adminEmail?: string } | null>();
    const stored = settings && !Array.isArray(settings) ? settings.adminEmail?.trim().toLowerCase() : "";
    return stored || fallback;
  } catch {
    return fallback;
  }
}

export async function sendAdminMail(input: { subject: string; text: string; replyTo?: string }) {
  const config = smtpConfig();
  const to = await getAdminInbox();
  if (!config || !to) return false;

  const timeout = Math.max(Number(process.env.EXTERNAL_API_TIMEOUT_MS) || 5000, 12000);
  const host = await resolveMailHost(config.host);
  const transporter = nodemailer.createTransport({
    host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    tls: { servername: config.host },
    connectionTimeout: timeout,
    greetingTimeout: timeout,
    socketTimeout: timeout,
  });

  const from = oneLine(process.env.MAIL_FROM || `Eden Bliss <${config.user}>`);
  await transporter.sendMail({
    from,
    to,
    replyTo: input.replyTo ? oneLine(input.replyTo) : undefined,
    subject: oneLine(input.subject).slice(0, 180),
    text: input.text,
  });
  return true;
}

type NoticeOrder = {
  orderNumber: string;
  subtotal: number;
  totalDiscount: number;
  shippingFee: number;
  taxAmount: number;
  grandTotal: number;
  customFitNotes?: string;
  items?: { title: string; sizeLabel: string; quantity: number; lineTotal: number }[];
  shippingDetails?: {
    fullName?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
};

export async function sendOrderNotice(orderNumber: string) {
  await connectDB();
  const order = await Order.findOne({ orderNumber })
    .select("orderNumber subtotal totalDiscount shippingFee taxAmount grandTotal customFitNotes items shippingDetails")
    .lean<NoticeOrder | null>();
  if (!order || Array.isArray(order)) return false;

  const ship = order.shippingDetails ?? {};
  const lines = (order.items ?? [])
    .map((item) => `${item.quantity} × ${item.title} (${item.sizeLabel}) — ${formatMoney(item.lineTotal)}`)
    .join("\n");
  const address = [ship.address, ship.city, ship.state, ship.postalCode, ship.country].filter(Boolean).join(", ");
  const notes = stripHtml(order.customFitNotes ?? "").trim();

  return sendAdminMail({
    subject: `New cash-on-delivery order ${order.orderNumber}`,
    replyTo: ship.email,
    text: [
      `A new order is waiting at the atelier.`,
      ``,
      `Order: ${order.orderNumber}`,
      `Name: ${ship.fullName ?? ""}`,
      `Email: ${ship.email ?? ""}`,
      `Phone: ${ship.phone ?? ""}`,
      `Address: ${address}`,
      notes ? `Fit notes: ${notes}` : "",
      ``,
      lines,
      ``,
      `Subtotal: ${formatMoney(order.subtotal)}`,
      `Discount: ${formatMoney(order.totalDiscount)}`,
      `Shipping: ${formatMoney(order.shippingFee)}`,
      `Tax: ${formatMoney(order.taxAmount)}`,
      `Total due on delivery: ${formatMoney(order.grandTotal)}`,
    ]
      .filter((line) => line !== "")
      .join("\n"),
  });
}
