import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import { reset, query, batch, testEnv } from "./runtime-test";
import * as db from "../server/store";
import { api } from "../server/api";
import { calculateCart, calculateQuote, categoryIds } from "../core/models";
import type { Actor, Row } from "../core/models";
import { quotationPDF } from "../server/pdf";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
const scope = "test-shop",
  admin: Actor = {
    id: "tester",
    name: "Người kiểm thử",
    email: "test@example.com",
    role: "admin",
    scope,
  };
const buyer = {
  name: "Khách hàng thử nghiệm",
  phone: "0900000000",
  email: "test@example.com",
  company: "Doanh nghiệp minh họa",
  address: "Địa chỉ minh họa cho kiểm thử",
  zone: "Hồ Chí Minh",
};
let p: any;
beforeEach(async () => {
  reset();
  await db.seed(scope);
  p = (await db.listProducts(scope)).find((p) => p.mode === "fixed")!;
});
async function bodyFor(q = 1) {
  const items = [{ product_id: p.id, quantity: q }],
    price = calculateCart(
      items,
      await db.listProducts(scope),
      await db.settings(scope),
      buyer.zone,
    );
  return {
    customer: buyer,
    items,
    key: crypto.randomUUID(),
    expected_total: price.total,
  };
}
function req(
  path: string,
  method = "GET",
  data?: any,
  role?: string,
  headers: Record<string, string> = {},
) {
  return api(
    new Request("https://test.local/api/" + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(role ? { "x-test-role": role } : {}),
        ...headers,
      },
      body: data == null ? undefined : JSON.stringify(data),
    }),
  );
}
test("legacy store settings use new branding and preserve editable contact fields", async () => {
  await batch([
    db.update("settings", scope, scope + ":settings", {
      value: JSON.stringify({
        name: "Spacetech Automation",
        logo: "/assets/logo.png",
        email: "",
        local_fee: 41000,
      }),
    }),
  ]);
  const settings = await db.settings(scope);
  assert.equal(settings.name, "SpaceTech");
  assert.equal(settings.logo, "/assets/spacetech-logo.png");
  assert.equal(settings.portrait, "/assets/spacetech-khoa.png");
  assert.equal(settings.phone_alt, "0786882137");
  assert.equal(settings.email, "trandangkhoacb2019@gmail.com");
  assert.equal(settings.local_fee, 41000);
  const result = await req(
    "admin/settings",
    "PATCH",
    { phone_alt: "", portrait: "", email: "" },
    "admin",
  );
  assert.equal(result.status, 200);
  const saved = await db.settings(scope);
  assert.equal(saved.phone_alt, "");
  assert.equal(saved.portrait, "");
  assert.equal(saved.email, "");
});
test("cart uses server prices, combines duplicates, refuses quote-only and invalid quantities", async () => {
  const all = await db.listProducts(scope),
    s = await db.settings(scope);
  const c = calculateCart(
    [
      { product_id: p.id, quantity: 1, price: 1 },
      { product_id: p.id, quantity: 2 },
    ],
    all,
    s,
    buyer.zone,
  );
  assert.equal(c.lines.length, 1);
  assert.equal(c.subtotal, 3 * p.price);
  assert.throws(() =>
    calculateCart([{ product_id: p.id, quantity: -1 }], all, s, ""),
  );
  assert.throws(() =>
    calculateCart(
      [{ product_id: all.find((p) => p.mode === "quote")!.id, quantity: 1 }],
      all,
      s,
      "",
    ),
  );
  assert.equal(
    categoryIds("a", [
      { id: "b", parent_id: "a" },
      { id: "c", parent_id: "b" },
    ]).size,
    3,
  );
});
test("checkout is idempotent and cancellation releases reserved stock", async () => {
  const b = await bodyFor(2),
    o = await db.checkout(scope, null, b),
    again = await db.checkout(scope, null, b);
  assert.equal(again.id, o.id);
  assert.equal(
    (await db.listProducts(scope)).find((x) => x.id === p.id)!.reserved,
    2,
  );
  await db.changeOrder(admin, o.id, "cancelled");
  assert.equal(
    (await db.listProducts(scope)).find((x) => x.id === p.id)!.reserved,
    0,
  );
  assert.equal((await query("SELECT * FROM orders")).length, 1);
});
test("concurrent last-unit checkouts cannot oversell; failed transaction leaves no order", async () => {
  await batch([db.update("products", scope, p.id, { stock: 1 })]);
  const b1 = await bodyFor(),
    b2 = await bodyFor();
  const results = await Promise.allSettled([
    db.checkout(scope, null, b1),
    db.checkout(scope, null, b2),
  ]);
  assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal((await query("SELECT * FROM orders")).length, 1);
  const [row] = await query("SELECT stock,reserved FROM products WHERE id=?", [
    p.id,
  ]);
  assert.equal(row.stock, 1);
  assert.equal(row.reserved, 1);
});
test("rejects stale total and invalid state transition; shipping decrements stock once", async () => {
  const b = await bodyFor();
  await assert.rejects(db.checkout(scope, null, { ...b, expected_total: 1 }));
  const o = await db.checkout(scope, null, b);
  await assert.rejects(db.changeOrder(admin, o.id, "completed"));
  await db.changeOrder(admin, o.id, "confirmed");
  await db.changeOrder(admin, o.id, "processing");
  await db.changeOrder(admin, o.id, "shipped");
  const now = (await db.listProducts(scope)).find((x) => x.id === p.id)!;
  assert.equal(now.stock, p.stock - 1);
  assert.equal(now.reserved, 0);
  await assert.rejects(db.changeOrder(admin, o.id, "shipped"));
  await db.changeOrder(admin, o.id, "completed");
});
test("stock edits reject stale inventory; technicians cannot change price", async () => {
  await assert.rejects(
    db.saveProduct(admin, { ...p, expected_stock: p.stock - 1 }, p.id),
  );
  await db.saveProduct(
    { ...admin, role: "technician" },
    { ...p, price: 1, stock: 999, name: p.name + " cập nhật" },
    p.id,
  );
  const current = (await db.listProducts(scope)).find((x) => x.id === p.id)!;
  assert.equal(current.price, p.price);
  assert.equal(current.stock, p.stock);
});
test("quotation rounds tax after discount, snapshots prices, versions and conversion", async () => {
  const r = await db.createRFQ(scope, null, {
    customer: buyer,
    items: [{ product_id: p.id, part_number: p.part_number, quantity: 2 }],
    note: "Yêu cầu kiểm thử",
  });
  const input = {
    rfq_id: r.id,
    items: [
      {
        item_id: (await db.rfq(scope, r.id)).items[0].id,
        price: 100001,
        tax: 8,
        discount: 3,
        lead_time: "3–5 ngày",
        warranty: "12 tháng",
      },
    ],
    shipping: 30000,
    valid_until: new Date(Date.now() + 86400000).toISOString(),
    terms: "Điều khoản thử nghiệm",
  };
  const result = calculateQuote([{ quantity: 2, ...input.items[0] }], 30000);
  assert.equal(result.total, 245999);
  const q1 = await db.createQuote(admin, input);
  await db.saveProduct(
    admin,
    { ...p, price: 200000, expected_stock: p.stock },
    p.id,
  );
  assert.equal((await db.quote(scope, q1.id)).items[0].price, 100001);
  const q2 = await db.createQuote(admin, input);
  assert.equal(q2.version, 2);
  const o = await db.convertQuote(admin, q1.id),
    again = await db.convertQuote(admin, q1.id);
  assert.equal(o.id, again.id);
  assert.equal((await db.order(scope, o.id)).total, result.total);
});
test("unknown RFQ line is not turned into an order until catalog mapping, expired quote fails", async () => {
  const r = await db.createRFQ(scope, null, {
    customer: buyer,
    items: [{ part_number: "CHUA-CO", quantity: 1 }],
    note: "",
  });
  const q = await db.createQuote(admin, {
    rfq_id: r.id,
    items: [
      {
        item_id: (await db.rfq(scope, r.id)).items[0].id,
        price: 1000,
        tax: 0,
        discount: 0,
        lead_time: "",
        warranty: "",
      },
    ],
    shipping: 0,
    valid_until: new Date(Date.now() + 86400000).toISOString(),
    terms: "",
  });
  await assert.rejects(db.convertQuote(admin, q.id));
  await batch([
    db.update("quotes", scope, q.id, { valid_until: Date.now() - 1 }),
  ]);
  await assert.rejects(db.convertQuote(admin, q.id));
  assert.equal((await query("SELECT * FROM orders")).length, 0);
});
test("API enforces roles, same-origin writes and tenant scope", async () => {
  assert.equal((await req("admin/products")).status, 401);
  assert.equal((await req("admin/settings", "PATCH", {}, "sales")).status, 403);
  assert.equal(
    (await req("admin/orders", "GET", undefined, "technician")).status,
    403,
  );
  assert.equal(
    (
      await req("rfqs", "POST", {}, undefined, {
        origin: "https://evil.example",
      })
    ).status,
    403,
  );
  const r = await req("admin/products", "GET", undefined, "admin", {
    "x-test-scope": "other",
  });
  assert.deepEqual(await r.json(), []);
});
test("asset upload rejects HTML and cannot be read across scope", async () => {
  const f = new FormData();
  f.append("file", new File(["<script>alert(1)</script>"], "image.png"));
  const fail = await api(
    new Request("https://test.local/api/admin/upload", {
      method: "POST",
      headers: { "x-test-role": "admin" },
      body: f,
    }),
  );
  assert.equal(fail.status, 400);
  const ok = new FormData();
  ok.append("file", new File(["%PDF-1.4\n%%EOF"], "document.pdf"));
  const r = await api(
    new Request("https://test.local/api/admin/upload", {
      method: "POST",
      headers: { "x-test-role": "admin" },
      body: ok,
    }),
  );
  assert.equal(r.status, 201);
  const data: any = await r.json();
  assert.equal((await req("assets/" + data.id)).status, 200);
  assert.equal(
    (
      await req("assets/" + data.id, "GET", undefined, undefined, {
        "x-test-scope": "other",
      })
    ).status,
    404,
  );
});
test("a guest order request reaches the seller without payment", async () => {
  const b = await bodyFor();
  assert.equal((await req("orders", "POST", { ...b, method: "bank" })).status, 400);
  const result = await req("orders", "POST", b);
  assert.equal(result.status, 201);
  const receipt: any = await result.json();
  assert.equal((await req("admin/orders/" + receipt.id)).status, 401);
  const detail = await req("admin/orders/" + receipt.id, "GET", undefined, "admin");
  assert.equal(detail.status, 200);
  const order: any = await detail.json();
  assert.equal(order.number, receipt.number);
  assert.equal(order.status, "new");
  assert.equal(order.customer.phone, b.customer.phone);
  assert.equal(order.items[0].product_id, b.items[0].product_id);
  assert.equal(order.method, "request");
  assert.equal((await req("payment-webhook", "POST", {})).status, 404);
  assert.equal((await req("admin/confirm-payment", "POST", {}, "admin")).status, 404);
});
test("indexing requires a public HTTPS configuration and excludes demo data and private routes", async () => {
  await db.seed("shop");
  testEnv.INDEX_PUBLIC_SITE = "true";
  testEnv.APP_URL = "https://store.example";
  assert.deepEqual(await sitemap(), []);
  const settings = await db.settings("shop");
  await batch([db.update("settings", "shop", "shop:settings", { value: JSON.stringify({ ...settings, demo: false }) })]);
  const catalog = await db.listProducts("shop");
  await batch([db.update("products", "shop", catalog[0].id, { demo: 0 })]);
  const r = await robots();
  assert.equal(r.sitemap, "https://store.example/sitemap.xml");
  const urls = (await sitemap()).map((entry) => entry.url);
  assert.ok(urls.includes("https://store.example/san-pham/" + catalog[0].slug));
  assert.ok(!urls.includes("https://store.example/san-pham/" + catalog[1].slug));
  assert.ok(!urls.some((url) => /\/(admin|gio-hang|dat-hang|tai-khoan)(\/|$)/.test(url)));
  testEnv.APP_URL = "http://localhost:3000";
  assert.deepEqual(await sitemap(), []);
});
test("Vietnamese PDF renders with embedded fonts and pagination", async () => {
  const q = {
    number: "BG-KIEM-THU",
    version: 1,
    created: Date.now(),
    valid_until: Date.now() + 86400000,
    seller: { ...(await db.settings(scope)), demo: true },
    customer: buyer,
    items: Array.from({ length: 28 }, (_, i) => ({
      part_number: p.part_number,
      name: p.name + " · Dòng " + (i + 1),
      quantity: 2,
      price: 100000,
      tax: 8,
      discount: 0,
      total: 216000,
      lead_time: "Giao sau 3–5 ngày",
      warranty: "12 tháng",
    })),
    subtotal: 5600000,
    discount: 0,
    tax: 448000,
    shipping: 30000,
    total: 6078000,
    terms:
      "Điều khoản minh họa. Vui lòng kiểm tra đúng mã thiết bị trước khi đặt hàng.",
  };
  const bytes = await quotationPDF(q);
  const doc = await PDFDocument.load(bytes);
  assert.ok(doc.getPageCount() > 1);
  writeFileSync("outputs/bao-gia-kiem-thu.pdf", bytes);
});

test("quote line prices follow item IDs even when payload order changes", async () => {
  const r = await db.createRFQ(scope, null, {
    customer: buyer,
    items: [
      { product_id: p.id, part_number: p.part_number, quantity: 1 },
      { part_number: "OTHER", quantity: 3 },
    ],
    note: "",
  });
  const detail = await db.rfq(scope, r.id),
    lines = detail.items
      .map((x: Row, i: number) => ({
        item_id: x.id,
        price: i === 0 ? 111 : 999,
        tax: 0,
        discount: 0,
        lead_time: "",
        warranty: "",
      }))
      .reverse();
  const b = {
    rfq_id: r.id,
    items: lines,
    shipping: 0,
    valid_until: new Date(Date.now() + 86400000).toISOString(),
    terms: "",
  };
  const q = await db.createQuote(admin, b),
    snapshot = await db.quote(scope, q.id);
  assert.equal(
    snapshot.items.find((i: Row) => i.part_number === p.part_number).price,
    111,
  );
  assert.equal(
    snapshot.items.find((i: Row) => i.part_number === "OTHER").price,
    999,
  );
  await assert.rejects(
    db.createQuote(admin, { ...b, items: [lines[0], lines[0]] }),
  );
});
