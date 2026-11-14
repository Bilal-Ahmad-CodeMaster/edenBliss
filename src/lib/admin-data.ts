import "server-only";
import { ADMIN_ONLINE_WINDOW_MS, LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { getStoreSettings } from "@/lib/catalog";
import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { pageCount, parsePageLimit } from "@/lib/pagination";
import { escapeRegExp } from "@/lib/sanitize";
import { traceSpan } from "@/lib/telemetry";
import { AuditLog } from "@/models/AuditLog";
import { Category } from "@/models/Category";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { Size } from "@/models/Size";
import { User } from "@/models/User";
import { convertMeasurements, type GarmentMeasurements } from "@/lib/measurements";

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

type Status = (typeof ORDER_STATUSES)[number];

function emptyOverview(currencySymbol: string) {
  const byStatus = Object.fromEntries(ORDER_STATUSES.map((status) => [status, 0])) as Record<Status, number>;
  return {
    connected: false,
    currencySymbol,
    users: { total: 0, online: 0 },
    revenue: 0,
    orders: { total: 0, byStatus },
    lowStock: [] as { id: string; title: string; sizeLabel: string; stock: number }[],
    recentOrders: [] as {
      id: string;
      orderNumber: string;
      status: string;
      grandTotal: number;
      fullName: string;
      createdAt: string;
    }[],
  };
}

export async function getAdminOverview() {
  const settings = await getStoreSettings();
  if (!isDatabaseConfigured()) return emptyOverview(settings.currencySymbol);

  await connectDB();
  const since = new Date(Date.now() - ADMIN_ONLINE_WINDOW_MS);

  return traceSpan("db.admin.overview", async () => {
    const [totalUsers, onlineUsers, statusRows, lowStockProducts, recentOrders] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({
        isBlocked: false,
        isOnline: true,
        lastActiveAt: { $gte: since },
      }),
      Order.aggregate<{ _id: Status; count: number; revenue: number }>([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            revenue: {
              $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 0, "$grandTotal"] },
            },
          },
        },
      ]),
      Product.find({ isActive: true, "sizes.stock": { $lte: LOW_STOCK_THRESHOLD } })
        .select("title sizes.sizeLabel sizes.stock")
        .limit(24)
        .lean<Array<{ _id: { toString(): string }; title: string; sizes?: { sizeLabel: string; stock: number }[] }>>(),
      Order.find()
        .select("orderNumber status grandTotal createdAt shippingDetails.fullName")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean<
          Array<{
            _id: { toString(): string };
            orderNumber: string;
            status: string;
            grandTotal: number;
            createdAt?: Date;
            shippingDetails?: { fullName?: string };
          }>
        >(),
    ]);

    const byStatus = Object.fromEntries(ORDER_STATUSES.map((status) => [status, 0])) as Record<Status, number>;
    let revenue = 0;
    let orderTotal = 0;
    for (const row of statusRows) {
      if (row._id in byStatus) byStatus[row._id] = row.count;
      orderTotal += row.count;
      revenue += row.revenue || 0;
    }

    const lowStock = lowStockProducts
      .flatMap((product) =>
        (product.sizes ?? [])
          .filter((size) => size.stock <= LOW_STOCK_THRESHOLD)
          .map((size) => ({
            id: `${String(product._id)}-${size.sizeLabel}`,
            title: product.title,
            sizeLabel: size.sizeLabel,
            stock: size.stock,
          })),
      )
      .slice(0, 12);

    return {
      connected: true,
      currencySymbol: settings.currencySymbol,
      users: { total: totalUsers, online: onlineUsers },
      revenue,
      orders: { total: orderTotal, byStatus },
      lowStock,
      recentOrders: recentOrders.map((order) => ({
        id: String(order._id),
        orderNumber: order.orderNumber,
        status: order.status,
        grandTotal: order.grandTotal,
        fullName: order.shippingDetails?.fullName ?? "",
        createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : "",
      })),
    };
  });
}

export async function listAdminUsers(pageValue?: unknown, limitValue?: unknown, queryValue?: unknown) {
  await connectDB();
  const paging = parsePageLimit(pageValue, limitValue);
  const query = String(queryValue ?? "").trim().slice(0, 80);
  const filter = query
    ? {
        $or: ["name", "email", "phone"].map((field) => ({
          [field]: { $regex: escapeRegExp(query), $options: "i" },
        })),
      }
    : {};

  return traceSpan("db.admin.users", async () => {
    const since = new Date(Date.now() - ADMIN_ONLINE_WINDOW_MS);
    const [rows, total, online] = await Promise.all([
      User.find(filter)
        .select("name email phone role isBlocked isOnline lastActiveAt createdAt")
        .sort({ createdAt: -1 })
        .skip(paging.skip)
        .limit(paging.limit)
        .lean(),
      User.countDocuments(filter),
      User.countDocuments({ isBlocked: false, isOnline: true, lastActiveAt: { $gte: since } }),
    ]);
    return {
      rows: rows.map((user) => ({
        id: String(user._id),
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
        role: user.role as "USER" | "ADMIN",
        isBlocked: Boolean(user.isBlocked),
        isOnline: Boolean(user.isOnline) && Boolean(user.lastActiveAt) && new Date(user.lastActiveAt).getTime() >= since.getTime(),
        lastActiveAt: user.lastActiveAt ? new Date(user.lastActiveAt).toISOString() : "",
      })),
      total,
      online,
      page: paging.page,
      limit: paging.limit,
      pages: pageCount(total, paging.limit),
    };
  });
}

export async function listAdminProducts(input: { page?: unknown; limit?: unknown; q?: unknown; category?: unknown } = {}) {
  await connectDB();
  const paging = parsePageLimit(input.page, input.limit);
  const query = String(input.q ?? "").trim().slice(0, 80);
  const category = String(input.category ?? "").trim();
  const filter: Record<string, unknown> = {};
  if (query) filter.title = { $regex: escapeRegExp(query), $options: "i" };
  if (category && /^[a-f\d]{24}$/i.test(category)) filter.category = category;

  return traceSpan("db.admin.products", async () => {
    const [rows, total] = await Promise.all([
      Product.find(filter)
        .select("title slug finalPrice basePrice isActive isFeatured discountPercentage discountAmount sizes.stock category")
        .populate({ path: "category", select: "name" })
        .sort({ createdAt: -1 })
        .skip(paging.skip)
        .limit(paging.limit)
        .lean(),
      Product.countDocuments(filter),
    ]);
    return {
      rows: rows.map((product) => {
        const categoryDoc = product.category as { name?: string } | null;
        const stock = Array.isArray(product.sizes)
          ? product.sizes.reduce((sum, size) => sum + (size.stock || 0), 0)
          : 0;
        return {
          id: String(product._id),
          title: product.title,
          slug: product.slug,
          categoryName: categoryDoc?.name ?? "",
          finalPrice: product.finalPrice,
          basePrice: product.basePrice,
          stock,
          isActive: Boolean(product.isActive),
          isFeatured: Boolean(product.isFeatured),
          discountPercentage: product.discountPercentage ?? 0,
          discountAmount: product.discountAmount ?? 0,
        };
      }),
      total,
      page: paging.page,
      limit: paging.limit,
      pages: pageCount(total, paging.limit),
    };
  });
}

export async function listAdminOrders(input: { page?: unknown; limit?: unknown; q?: unknown; status?: unknown } = {}) {
  await connectDB();
  const paging = parsePageLimit(input.page, input.limit);
  const query = String(input.q ?? "").trim().slice(0, 80);
  const status = String(input.status ?? "").trim();
  const filter: Record<string, unknown> = {};
  if (ORDER_STATUSES.includes(status as Status)) filter.status = status;
  if (query) {
    const pattern = escapeRegExp(query);
    filter.$or = [
      { orderNumber: { $regex: pattern, $options: "i" } },
      { "shippingDetails.fullName": { $regex: pattern, $options: "i" } },
      { "shippingDetails.phone": { $regex: pattern, $options: "i" } },
    ];
  }

  return traceSpan("db.admin.orders", async () => {
    const [rows, total] = await Promise.all([
      Order.find(filter)
        .select("orderNumber status grandTotal createdAt shippingDetails.fullName shippingDetails.phone")
        .sort({ createdAt: -1 })
        .skip(paging.skip)
        .limit(paging.limit)
        .lean(),
      Order.countDocuments(filter),
    ]);
    return {
      orders: rows.map((order) => ({
        id: String(order._id),
        orderNumber: order.orderNumber,
        status: order.status,
        grandTotal: order.grandTotal,
        createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : "",
        fullName: order.shippingDetails?.fullName ?? "",
        phone: order.shippingDetails?.phone ?? "",
      })),
      page: paging.page,
      limit: paging.limit,
      total,
      pages: pageCount(total, paging.limit),
    };
  });
}

export async function listAuditLogs(pageValue?: unknown, limitValue?: unknown) {
  await connectDB();
  const paging = parsePageLimit(pageValue, limitValue);
  return traceSpan("db.admin.audit", async () => {
    const [rows, total] = await Promise.all([
      AuditLog.find()
        .select("action targetType targetId ipAddress createdAt adminId")
        .sort({ createdAt: -1 })
        .skip(paging.skip)
        .limit(paging.limit)
        .lean(),
      AuditLog.countDocuments(),
    ]);
    return {
      rows: rows.map((entry) => ({
        id: String(entry._id),
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        ipAddress: entry.ipAddress ?? "",
        createdAt: entry.createdAt ? new Date(entry.createdAt).toISOString() : "",
      })),
      total,
      page: paging.page,
      limit: paging.limit,
      pages: pageCount(total, paging.limit),
    };
  });
}

export async function listAdminCategories() {
  await connectDB();
  const rows = await Category.find()
    .select("name slug description imageUrl parentCategory isActive")
    .sort({ name: 1 })
    .limit(200)
    .lean<
      Array<{
        _id: { toString(): string };
        name: string;
        slug: string;
        description: string;
        imageUrl?: string;
        parentCategory?: { toString(): string } | null;
        isActive?: boolean;
      }>
    >();
  const names = new Map(rows.map((row) => [String(row._id), row.name]));
  return rows.map((row) => ({
    id: String(row._id),
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.imageUrl ?? "",
    parentId: row.parentCategory ? String(row.parentCategory) : "",
    parentName: row.parentCategory ? names.get(String(row.parentCategory)) ?? "" : "",
    isActive: row.isActive !== false,
  }));
}

export async function listAdminSizes() {
  await connectDB();
  const rows = await Size.find()
    .select("label code measurementsInMeters sortOrder")
    .sort({ sortOrder: 1, label: 1 })
    .limit(100)
    .lean<
      Array<{
        _id: { toString(): string };
        label: string;
        code: string;
        measurementsInMeters: GarmentMeasurements;
        sortOrder: number;
      }>
    >();
  return rows.map((row) => {
    const converted = convertMeasurements(row.measurementsInMeters);
    return {
      id: String(row._id),
      label: row.label,
      code: row.code,
      sortOrder: row.sortOrder,
      measurementsInMeters: converted.meters,
      measurementsInCm: converted.centimeters,
      measurementsInInches: converted.inches,
    };
  });
}

export async function getAdminProfile(userId: string) {
  await connectDB();
  const user = await User.findById(userId).select("name email avatarUrl phone").lean<{
    name: string;
    email: string;
    avatarUrl?: string;
    phone?: string;
  } | null>();
  if (!user || Array.isArray(user)) return null;
  return {
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl ?? "",
    phone: user.phone ?? "",
  };
}

export async function listCategoryOptions() {
  await connectDB();
  const rows = await Category.find()
    .select("name slug parentCategory isActive")
    .sort({ name: 1 })
    .limit(200)
    .lean<Array<{ _id: { toString(): string }; name: string; slug: string; parentCategory?: { toString(): string } | null; isActive?: boolean }>>();
  return rows.map((row) => ({
    id: String(row._id),
    name: row.name,
    slug: row.slug,
    parentId: row.parentCategory ? String(row.parentCategory) : "",
    isActive: row.isActive !== false,
  }));
}
