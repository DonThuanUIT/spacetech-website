import { query, batch, demoRuntime } from "@runtime";
import {
  AppError,
  normalizePart,
  calculateCart,
  calculateQuote,
  transitions,
} from "@/core/models";
import type { Row, Sql, Actor, Product } from "@/core/models";
import {
  defaultSettings,
  brands,
  categories,
  samples,
  articles,
} from "@/core/seed";
export const uid = () => crypto.randomUUID();
export function ins(table: string, row: Row): Sql {
  const k = Object.keys(row);
  return {
    sql: `INSERT INTO ${table} (${k.map((x) => '"' + x + '"').join(",")}) VALUES (${k.map(() => "?").join(",")})`,
    params: k.map((x) => row[x] ?? null),
  };
}
export function update(
  table: string,
  scope: string,
  id: string,
  row: Row,
): Sql {
  const k = Object.keys(row);
  return {
    sql: `UPDATE ${table} SET ${k.map((x) => '"' + x + '" = ?').join(",")} WHERE id = ? AND scope = ?`,
    params: [...k.map((x) => row[x] ?? null), id, scope],
  };
}
export const audit = (a: Actor, action: string, entity: string) =>
  ins("audit", {
    id: uid(),
    scope: a.scope,
    actor_id: a.id,
    action,
    entity,
    created: Date.now(),
  });
export function guard(scope: string, sql: string, params: any[]): Sql[] {
  const id = uid();
  return [
    {
      sql: `INSERT INTO guards (id,scope,ok) VALUES (?,?,(${sql}))`,
      params: [id, scope, ...params],
    },
    { sql: "DELETE FROM guards WHERE id = ?", params: [id] },
  ];
}
export async function settings(scope: string): Promise<Row> {
  const [s] = await query("SELECT value FROM settings WHERE scope = ?", [
    scope,
  ]);
  const stored: Row = s ? JSON.parse(s.value) : {};
  // Previous installations may still contain old payment settings.
  for (const key of ["bank_bin", "bank_account", "bank_name"]) delete stored[key];
  if (s && !("phone_alt" in stored)) {
    // Apply the new identity to stores seeded before the branding update.
    for (const key of ["name", "phone", "zalo", "email", "logo"]) {
      stored[key] = defaultSettings[key];
    }
    for (const key of ["hero_description", "seo_title", "seo_description"]) {
      if (typeof stored[key] === "string") {
        stored[key] = stored[key]
          .replaceAll("Spacetech Automation", "SpaceTech")
          .replaceAll("Spacetech", "SpaceTech");
      }
    }
  }
  return {
    ...defaultSettings,
    ...stored,
    ...(demoRuntime ? { demo: true } : {}),
  };
}
export async function taxonomy(scope: string) {
  const [bs, cs] = await Promise.all([
    query("SELECT * FROM brands WHERE scope = ? ORDER BY name", [scope]),
    query("SELECT * FROM categories WHERE scope = ? ORDER BY name", [scope]),
  ]);
  return {
    brands: bs.length
      ? bs
      : demoRuntime
        ? brands.map((x) => ({ ...x, id: scope + ":" + x.id }))
        : [],
    categories: cs.length
      ? cs
      : demoRuntime
        ? categories.map((x) => ({ ...x, id: scope + ":" + x.id }))
        : [],
  };
}
export async function listProducts(
  scope: string,
  all = false,
): Promise<Product[]> {
  const ps = await query(
    `SELECT p.*,COALESCE((SELECT SUM(oi.quantity) FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE oi.product_id=p.id AND o.scope=p.scope AND o.status='completed'),0) AS sold,b.name AS brand,c.name AS category FROM products p JOIN brands b ON b.id=p.brand_id JOIN categories c ON c.id=p.category_id WHERE p.scope = ? ${all ? "" : "AND p.status='published'"} ORDER BY p.created DESC`,
    [scope],
  );
  if (
    !ps.length &&
    demoRuntime &&
    !(await query("SELECT id FROM settings WHERE scope = ?", [scope])).length
  )
    return samples(scope);
  const specs = await query("SELECT * FROM specs WHERE scope = ?", [scope]);
  return ps.map((p) => ({
    ...p,
    price: p.price == null ? null : Number(p.price),
    demo: !!p.demo,
    backorder: !!p.backorder,
    specs: specs
      .filter((s) => s.product_id === p.id)
      .map(({ scope, id, product_id, ...s }) => s),
  })) as Product[];
}
function productRows(scope: string, p: any, existing = false): Sql[] {
  const now = Date.now(),
    row = {
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      part_number: p.part_number,
      part_search: normalizePart(p.part_number),
      brand_id: p.brand_id,
      category_id: p.category_id,
      description: p.description,
      image: p.image,
      datasheet: p.datasheet,
      source: p.source,
      mode: p.mode,
      price: p.mode === "quote" ? null : p.price,
      stock: p.stock,
      backorder: p.backorder ? 1 : 0,
      demo: p.demo ? 1 : 0,
      status: p.status,
      updated: now,
    };
  const st: Sql[] = existing
    ? [
        update("products", scope, p.id, row),
        {
          sql: "DELETE FROM specs WHERE product_id = ? AND scope = ?",
          params: [p.id, scope],
        },
      ]
    : [ins("products", { id: p.id, scope, ...row, reserved: 0, created: now })];
  for (const s of p.specs)
    st.push(
      ins("specs", {
        id: uid(),
        scope,
        product_id: p.id,
        key: s.key,
        label: s.label,
        value: s.value,
        unit: s.unit || "",
        number: s.number ?? null,
        min: s.min ?? null,
        max: s.max ?? null,
      }),
    );
  return st;
}
export async function seed(scope: string) {
  if ((await query("SELECT id FROM settings WHERE scope = ?", [scope])).length)
    return;
  const st: Sql[] = [];
  for (const b of brands)
    st.push(ins("brands", { ...b, id: scope + ":" + b.id, scope }));
  for (const c of categories)
    st.push(
      ins("categories", {
        ...c,
        id: scope + ":" + c.id,
        scope,
        parent_id: null,
      }),
    );
  for (const p of samples(scope)) st.push(...productRows(scope, p));
  for (const a of articles)
    st.push(
      ins("articles", {
        ...a,
        id: scope + ":" + a.id,
        scope,
        status: "published",
        created: Date.now(),
      }),
    );
  st.push(
    ins("settings", {
      id: scope + ":settings",
      scope,
      value: JSON.stringify(defaultSettings),
    }),
  );
  try {
    await batch(st);
  } catch (e) {
    if (
      !(await query("SELECT id FROM settings WHERE scope = ?", [scope])).length
    )
      throw e;
  }
}
export async function saveProduct(a: Actor, p: Row, id?: string) {
  const scope = a.scope;
  const [b] = await query("SELECT id FROM brands WHERE id = ? AND scope = ?", [
    p.brand_id,
    scope,
  ]);
  const [c] = await query(
    "SELECT id FROM categories WHERE id = ? AND scope = ?",
    [p.category_id, scope],
  );
  if (!b || !c) throw new AppError(400, "Hãng hoặc danh mục không hợp lệ.");
  const [old] = id
    ? await query("SELECT * FROM products WHERE id = ? AND scope = ?", [
        id,
        scope,
      ])
    : [];
  if (id && !old) throw new AppError(404, "Không tìm thấy sản phẩm.");
  if (
    old &&
    a.role === "admin" &&
    p.expected_stock !== undefined &&
    p.expected_stock !== old.stock
  )
    throw new AppError(
      409,
      "Tồn kho vừa thay đổi. Tải lại sản phẩm trước khi lưu.",
    );
  if (a.role === "technician") {
    if (!old)
      throw new AppError(403, "Kỹ thuật chỉ được sửa sản phẩm hiện có.");
    for (const k of [
      "sku",
      "price",
      "mode",
      "stock",
      "backorder",
      "demo",
      "status",
    ])
      p[k] = old[k];
  }
  p.id = id || uid();
  await batch([
    ...(old
      ? guard(
          scope,
          "SELECT CASE WHEN COUNT(*)=1 THEN 1 ELSE 0 END FROM products WHERE id=? AND scope=? AND stock=? AND updated=?",
          [old.id, scope, old.stock, old.updated],
        )
      : []),
    ...productRows(scope, p, !!old),
    audit(a, old ? "product.update" : "product.create", p.id),
  ]);
  return p.id;
}
export async function order(scope: string, id: string): Promise<Row> {
  const [o] = await query("SELECT * FROM orders WHERE id = ? AND scope = ?", [
    id,
    scope,
  ]);
  if (!o) throw new AppError(404, "Không tìm thấy đơn hàng.");
  return {
    ...o,
    customer: JSON.parse(o.customer),
    items: await query(
      "SELECT * FROM order_items WHERE order_id = ? AND scope = ?",
      [id, scope],
    ),
  };
}
export async function checkout(
  scope: string,
  userId: string | null,
  body: Row,
) {
  const [repeat] = await query(
    "SELECT id,number,total FROM orders WHERE scope = ? AND request_key = ?",
    [scope, body.key],
  );
  if (repeat) return repeat;
  const s = await settings(scope),
    p = await listProducts(scope),
    cart = calculateCart(body.items, p, s, body.customer.zone);
  if (cart.total !== body.expected_total)
    throw new AppError(
      409,
      "Tổng tiền đã thay đổi. Vui lòng tải lại giỏ hàng.",
    );
  const id = uid(),
    number =
      "ST-" +
      new Date().toISOString().slice(0, 10).replace(/-/g, "") +
      "-" +
      id.replace(/-/g, "").slice(0, 12).toUpperCase();
  const st: Sql[] = [
    ins("orders", {
      id,
      scope,
      number,
      user_id: userId,
      customer: JSON.stringify(body.customer),
      status: "new",
      payment_status: "not_applicable",
      method: "request",
      subtotal: cart.subtotal,
      shipping: cart.shipping,
      tax: 0,
      total: cart.total,
      request_key: body.key,
      quote_id: null,
      created: Date.now(),
    }),
  ];
  for (const l of cart.lines) {
    st.push(
      ...guard(
        scope,
        "SELECT CASE WHEN COUNT(*)=1 THEN 1 ELSE 0 END FROM products WHERE id=? AND scope=? AND status='published' AND mode='fixed' AND price=? AND stock-reserved>=? AND (backorder=1 OR stock-reserved>=?)",
        [l.p.id, scope, l.unit_price, l.reserve, l.quantity],
      ),
      {
        sql: "UPDATE products SET reserved=reserved+? WHERE id=? AND scope=?",
        params: [l.reserve, l.p.id, scope],
      },
      ins("order_items", {
        id: uid(),
        scope,
        order_id: id,
        product_id: l.p.id,
        name: l.p.name,
        part_number: l.p.part_number,
        quantity: l.quantity,
        price: l.unit_price,
        tax: 0,
        discount: 0,
        total: l.total,
        reserve: l.reserve,
      }),
    );
  }
  try {
    await batch(st);
  } catch (e) {
    const [r] = await query(
      "SELECT id,number,total FROM orders WHERE scope=? AND request_key=?",
      [scope, body.key],
    );
    if (r) return r;
    throw new AppError(
      409,
      "Giá hoặc tồn kho vừa thay đổi. Vui lòng cập nhật giỏ hàng.",
    );
  }
  return { id, number, total: cart.total };
}
export async function changeOrder(
  a: Actor,
  id: string,
  to: string,
  onlyUnsettled = false,
) {
  const o = await order(a.scope, id);
  if (!transitions[o.status]?.includes(to))
    throw new AppError(409, "Bước chuyển trạng thái không hợp lệ.");
  const st: Sql[] = [
    ...guard(
      a.scope,
      `SELECT CASE WHEN COUNT(*)=1 THEN 1 ELSE 0 END FROM orders WHERE id=? AND scope=? AND status=?${onlyUnsettled ? " AND payment_status IN ('unpaid','not_applicable')" : ""}`,
      [id, a.scope, o.status],
    ),
  ];
  for (const i of o.items) {
    if (to === "cancelled")
      st.push({
        sql: "UPDATE products SET reserved=reserved-? WHERE id=? AND scope=?",
        params: [i.reserve, i.product_id, a.scope],
      });
    if (to === "shipped") {
      const missing = i.quantity - i.reserve;
      st.push(
        ...guard(
          a.scope,
          "SELECT CASE WHEN COUNT(*)=1 THEN 1 ELSE 0 END FROM products WHERE id=? AND scope=? AND stock-reserved>=?",
          [i.product_id, a.scope, missing],
        ),
        {
          sql: "UPDATE products SET stock=stock-?,reserved=reserved-? WHERE id=? AND scope=?",
          params: [i.quantity, i.reserve, i.product_id, a.scope],
        },
      );
    }
  }
  if (["shipped", "cancelled"].includes(to))
    st.push({
      sql: "UPDATE order_items SET reserve=0 WHERE order_id=? AND scope=?",
      params: [id, a.scope],
    });
  st.push(
    update("orders", a.scope, id, { status: to }),
    audit(a, "order." + to, id),
  );
  await batch(st);
}
export async function expire(scope: string) {
  const os = await query(
    "SELECT id FROM orders WHERE scope=? AND status='new' AND payment_status IN ('unpaid','not_applicable') AND created<?",
    [scope, Date.now() - 86400000],
  );
  for (const o of os)
    try {
      await changeOrder(
        { id: "system", name: "System", email: "", scope, role: "admin" },
        o.id,
        "cancelled",
        true,
      );
    } catch {}
}
export async function createRFQ(scope: string, userId: string | null, b: Row) {
  const id = uid(),
    number = "RFQ-" + id.slice(0, 8).toUpperCase(),
    p = await listProducts(scope);
  const st = [
    ins("rfqs", {
      id,
      scope,
      number,
      user_id: userId,
      customer: JSON.stringify(b.customer),
      status: "new",
      note: b.note || "",
      created: Date.now(),
    }),
  ];
  for (const i of b.items) {
    const product = p.find((p) => p.id === i.product_id);
    if (i.product_id && !product)
      throw new AppError(400, "Sản phẩm không hợp lệ.");
    st.push(
      ins("rfq_items", {
        id: uid(),
        scope,
        rfq_id: id,
        product_id: product?.id || null,
        name: product?.name || i.name || i.part_number,
        part_number: product?.part_number || i.part_number,
        quantity: i.quantity,
        note: i.note || "",
      }),
    );
  }
  await batch(st);
  return { id, number };
}
export async function rfq(scope: string, id: string): Promise<Row> {
  const [r] = await query("SELECT * FROM rfqs WHERE scope=? AND id=?", [
    scope,
    id,
  ]);
  if (!r) throw new AppError(404, "Không tìm thấy yêu cầu.");
  return {
    ...r,
    customer: JSON.parse(r.customer),
    items: await query("SELECT * FROM rfq_items WHERE scope=? AND rfq_id=?", [
      scope,
      id,
    ]),
    quotes: await query(
      "SELECT * FROM quotes WHERE scope=? AND rfq_id=? ORDER BY version DESC",
      [scope, id],
    ),
  };
}
export async function createQuote(a: Actor, b: Row) {
  const r = await rfq(a.scope, b.rfq_id),
    s = await settings(a.scope);
  if (b.items.length !== r.items.length)
    throw new AppError(400, "Số dòng không khớp.");
  if (new Set(b.items.map((i: Row) => i.item_id)).size !== r.items.length)
    throw new AppError(400, "Mã dòng báo giá bị trùng.");
  const items = r.items.map((x: Row) => {
    const price = b.items.find((i: Row) => i.item_id === x.id);
    if (!price)
      throw new AppError(400, "Dòng báo giá không thuộc yêu cầu này.");
    return {
      ...x,
      ...price,
      quantity: x.quantity,
      product_id: x.product_id,
      name: x.name,
      part_number: x.part_number,
    };
  });
  const total = calculateQuote(items, b.shipping);
  const valid = Date.parse(b.valid_until);
  if (!Number.isFinite(valid) || valid < Date.now())
    throw new AppError(400, "Ngày hết hạn phải ở tương lai.");
  const id = uid(),
    number = "BG-" + r.number.slice(4),
    version =
      r.quotes.reduce((n: number, q: Row) => Math.max(n, q.version), 0) + 1;
  const st = [
    ins("quotes", {
      id,
      scope: a.scope,
      number,
      rfq_id: r.id,
      version,
      customer: JSON.stringify(r.customer),
      seller: JSON.stringify({
        name: s.name,
        phone: s.phone,
        phone_alt: s.phone_alt,
        address: s.address,
        email: s.email,
        tax_code: s.tax_code,
        logo: s.logo,
        demo: s.demo,
      }),
      status: "issued",
      ...total,
      valid_until: valid,
      terms: b.terms,
      created: Date.now(),
    }),
  ];
  for (const i of items)
    st.push(
      ins("quote_items", {
        id: uid(),
        scope: a.scope,
        quote_id: id,
        product_id: i.product_id,
        name: i.name,
        part_number: i.part_number,
        quantity: i.quantity,
        price: i.price,
        tax: i.tax,
        discount: i.discount,
        total:
          i.quantity * i.price -
          i.discount +
          Math.round(((i.quantity * i.price - i.discount) * i.tax) / 100),
        lead_time: i.lead_time,
        warranty: i.warranty,
      }),
    );
  st.push(
    update("rfqs", a.scope, r.id, { status: "quoted" }),
    audit(a, "quote.issue", id),
  );
  await batch(st);
  return { id, number, version };
}
export async function quote(scope: string, id: string): Promise<Row> {
  const [q] = await query("SELECT * FROM quotes WHERE scope=? AND id=?", [
    scope,
    id,
  ]);
  if (!q) throw new AppError(404, "Không tìm thấy báo giá.");
  return {
    ...q,
    customer: JSON.parse(q.customer),
    seller: JSON.parse(q.seller),
    items: await query(
      "SELECT * FROM quote_items WHERE scope=? AND quote_id=?",
      [scope, id],
    ),
  };
}
export async function convertQuote(a: Actor, id: string) {
  const q = await quote(a.scope, id),
    p = await listProducts(a.scope, true);
  const [existing] = await query(
    "SELECT id,number FROM orders WHERE scope=? AND quote_id=?",
    [a.scope, id],
  );
  if (existing) return existing;
  if (q.status !== "issued" || Number(q.valid_until) < Date.now())
    throw new AppError(409, "Báo giá hết hiệu lực.");
  const oid = uid(),
    number = "ST-BG-" + oid.replace(/-/g, "").slice(0, 12).toUpperCase();
  const st: Sql[] = [
    ...guard(
      a.scope,
      "SELECT CASE WHEN COUNT(*)=1 THEN 1 ELSE 0 END FROM quotes WHERE scope=? AND id=? AND status='issued'",
      [a.scope, id],
    ),
    ins("orders", {
      id: oid,
      scope: a.scope,
      number,
      user_id: null,
      customer: JSON.stringify(q.customer),
      status: "new",
      payment_status: "not_applicable",
      method: "request",
      subtotal: Number(q.subtotal) - Number(q.discount),
      shipping: Number(q.shipping),
      tax: Number(q.tax),
      total: Number(q.total),
      quote_id: id,
      request_key: "quote:" + id,
      created: Date.now(),
    }),
  ];
  for (const i of q.items) {
    const product = p.find(
      (p) => p.id === i.product_id && p.status !== "archived",
    );
    if (!product)
      throw new AppError(
        409,
        "Gán mã hàng trong danh mục cho RFQ trước khi chuyển đơn.",
      );
    const available = product.stock - product.reserved;
    if (!product.backorder && available < i.quantity)
      throw new AppError(409, product.part_number + ": không đủ tồn kho.");
    const reserve = Math.min(available, i.quantity);
    st.push(
      ...guard(
        a.scope,
        "SELECT CASE WHEN COUNT(*)=1 THEN 1 ELSE 0 END FROM products WHERE id=? AND scope=? AND stock-reserved>=?",
        [product.id, a.scope, reserve],
      ),
      {
        sql: "UPDATE products SET reserved=reserved+? WHERE id=? AND scope=?",
        params: [reserve, product.id, a.scope],
      },
      ins("order_items", {
        id: uid(),
        scope: a.scope,
        order_id: oid,
        product_id: product.id,
        name: i.name,
        part_number: i.part_number,
        quantity: i.quantity,
        price: Number(i.price),
        tax: Number(i.tax),
        discount: Number(i.discount),
        total: Number(i.total),
        reserve,
      }),
    );
  }
  st.push(
    update("quotes", a.scope, id, { status: "accepted" }),
    audit(a, "quote.convert", id),
  );
  await batch(st);
  return { id: oid, number };
}
