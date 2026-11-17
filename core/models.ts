export type Row = Record<string, any>;
export type Role = "admin" | "sales" | "technician" | "customer";
export type Actor = {
  id: string;
  name: string;
  email: string;
  role: Role;
  scope: string;
};
export type Sql = {
  sql: string;
  params?: any[];
};
export type Spec = {
  key: string;
  label: string;
  value: string;
  min?: number;
  max?: number;
  number?: number;
  unit?: string;
};
export type Product = {
  id: string;
  sold?: number;
  name: string;
  slug: string;
  sku: string;
  part_number: string;
  brand_id: string;
  category_id: string;
  brand: string;
  category: string;
  description: string;
  image: string;
  datasheet: string;
  source: string;
  mode: "fixed" | "quote";
  price: number | null;
  stock: number;
  reserved: number;
  backorder: boolean;
  demo: boolean;
  status: string;
  specs: Spec[];
};
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const money = (n: any) =>
  n == null
    ? "Liên hệ báo giá"
    : new Intl.NumberFormat("vi-VN").format(Number(n)) + " ₫";
export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
export const normalizePart = (s: string) =>
  s.toUpperCase().replace(/[\s-]/g, "");
export const statuses: Row = {
  new: "Mới tiếp nhận",
  confirmed: "Đã xác nhận",
  processing: "Đang chuẩn bị",
  shipped: "Đang giao",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
  unpaid: "Chưa thanh toán",
  paid: "Đã thanh toán",
  quoted: "Đã báo giá",
  issued: "Đã phát hành",
  accepted: "Đã chấp nhận",
  published: "Đang hiển thị",
  draft: "Bản nháp",
  archived: "Lưu trữ",
};
export const transitions: Record<string, string[]> = {
  new: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["completed"],
  completed: [],
  cancelled: [],
};
export function consolidate(items: Row[]) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 100)
    throw new AppError(400, "Chọn từ 1 đến 100 mã hàng.");
  const result = new Map<string, number>();
  for (const i of items) {
    if (
      !i.product_id ||
      !Number.isInteger(i.quantity) ||
      i.quantity < 1 ||
      i.quantity > 10000
    )
      throw new AppError(400, "Số lượng không hợp lệ.");
    const q = (result.get(i.product_id) || 0) + i.quantity;
    if (q > 10000) throw new AppError(400, "Số lượng vượt giới hạn.");
    result.set(i.product_id, q);
  }
  return [...result].map(([product_id, quantity]) => ({
    product_id,
    quantity,
  }));
}
export function calculateCart(
  items: Row[],
  products: Product[],
  settings: Row,
  zone: string,
) {
  const lines = consolidate(items).map((l) => {
    const p = products.find(
      (p) => p.id === l.product_id && p.status === "published",
    );
    if (!p) throw new AppError(409, "Một mã hàng không còn được bán.");
    if (p.mode === "quote" || p.price == null)
      throw new AppError(400, "Mặt hàng này cần báo giá trước.");
    const available = p.stock - p.reserved;
    if (!p.backorder && available < l.quantity)
      throw new AppError(
        409,
        `${p.part_number} chỉ còn ${available} sản phẩm.`,
      );
    return {
      ...l,
      p,
      unit_price: p.price,
      total: p.price * l.quantity,
      reserve: Math.min(available, l.quantity),
    };
  });
  const subtotal = lines.reduce((n, l) => n + l.total, 0);
  const shipping =
    settings.free_shipping > 0 && subtotal >= settings.free_shipping
      ? 0
      : zone === settings.local_zone
        ? settings.local_fee
        : settings.other_fee;
  if (
    !Number.isSafeInteger(subtotal) ||
    !Number.isSafeInteger(subtotal + shipping)
  )
    throw new AppError(400, "Tổng tiền vượt giới hạn.");
  return { lines, subtotal, shipping, total: subtotal + shipping };
}
export function calculateQuote(items: Row[], shipping: number) {
  let subtotal = 0,
    tax = 0,
    discount = 0;
  for (const i of items) {
    if (
      !Number.isInteger(i.quantity) ||
      i.quantity < 1 ||
      !Number.isSafeInteger(i.price) ||
      i.price < 0 ||
      !Number.isFinite(i.tax) ||
      i.tax < 0 ||
      i.tax > 100 ||
      !Number.isSafeInteger(i.discount) ||
      i.discount < 0 ||
      i.discount > i.price * i.quantity
    )
      throw new AppError(400, "Giá, thuế hoặc giảm giá không hợp lệ.");
    const line = i.price * i.quantity;
    subtotal += line;
    discount += i.discount;
    tax += Math.round(((line - i.discount) * i.tax) / 100);
  }
  if (
    !Number.isSafeInteger(shipping) ||
    shipping < 0 ||
    !Number.isSafeInteger(subtotal + tax + shipping)
  )
    throw new AppError(400, "Tổng tiền vượt giới hạn.");
  return {
    subtotal,
    discount,
    tax,
    shipping,
    total: subtotal - discount + tax + shipping,
  };
}
export function categoryIds(id: string, categories: Row[]) {
  const ids = new Set([id]);
  let size = 0;
  while (ids.size !== size) {
    size = ids.size;
    for (const c of categories) if (ids.has(c.parent_id)) ids.add(c.id);
  }
  return ids;
}
