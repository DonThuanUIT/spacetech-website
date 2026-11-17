import { z } from "zod";
import {
  query,
  batch,
  actor as getActor,
  scope as getScope,
  demoRuntime,
  env,
  login,
  logout,
  hashPassword,
  putFile,
  getFile,
} from "@runtime";
import {
  AppError,
  calculateCart,
  normalize,
  normalizePart,
  categoryIds,
} from "@/core/models";
import type { Actor, Role, Row } from "@/core/models";
import * as db from "./store";
import { articles } from "@/core/seed";
const customer = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().regex(/^[+\d\s().-]{9,20}$/),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  company: z.string().max(200).optional(),
  tax_code: z.string().max(40).optional(),
  address: z.string().max(500).optional(),
  zone: z.string().max(100).optional(),
  note: z.string().max(3000).optional(),
});
const url = z
  .string()
  .max(2000)
  .refine(
    (s) =>
      !s ||
      /^https:\/\//.test(s) ||
      /^\/(assets|api\/assets)\/[\w/?.=&%:~-]+$/.test(s),
    "URL không hợp lệ.",
  );
const product = z
  .object({
    name: z.string().min(3).max(200),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(200),
    sku: z.string().min(1).max(100),
    part_number: z.string().min(1).max(150),
    brand_id: z.string().max(250),
    category_id: z.string().max(250),
    description: z.string().max(15000),
    image: url,
    datasheet: url,
    source: url,
    mode: z.enum(["fixed", "quote"]),
    price: z.number().int().min(0).max(1e12).nullable(),
    stock: z.number().int().min(0).max(1e6),
    expected_stock: z.number().int().optional(),
    backorder: z.boolean(),
    demo: z.boolean(),
    status: z.enum(["draft", "published", "archived"]),
    specs: z
      .array(
        z
          .object({
            key: z.string().min(1).max(60),
            label: z.string().min(1).max(100),
            value: z.string().min(1).max(300),
            unit: z.string().max(20).optional(),
            number: z.number().finite().nullable().optional(),
            min: z.number().finite().nullable().optional(),
            max: z.number().finite().nullable().optional(),
          })
          .refine(
            (s) => s.min == null || s.max == null || s.min <= s.max,
            "Dải thông số không hợp lệ",
          ),
      )
      .max(100),
  })
  .refine((p) => p.mode !== "fixed" || p.price != null, "Chưa nhập giá.")
  .refine(
    (p) => new Set(p.specs.map((s) => s.key)).size === p.specs.length,
    "Khóa thông số không được trùng.",
  );
function res(data: any, status = 200, extra: Record<string, string> = {}) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extra,
    },
  });
}
function must(a: Actor | null, roles: Role[] = ["admin"]) {
  if (!a) throw new AppError(401, "Vui lòng đăng nhập.");
  if (!roles.includes(a.role))
    throw new AppError(403, "Không đủ quyền truy cập.");
  return a;
}
async function body(r: Request) {
  if (Number(r.headers.get("content-length") || 0) > 250000)
    throw new AppError(413, "Dữ liệu quá lớn.");
  const s = await r.text();
  if (s.length > 250000) throw new AppError(413, "Dữ liệu quá lớn.");
  try {
    return JSON.parse(s);
  } catch {
    throw new AppError(400, "JSON không hợp lệ.");
  }
}
async function limit(scope: string, key: string, max = 20) {
  const bucket = Math.floor(Date.now() / 600000);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(key + bucket),
  );
  const id =
    scope +
    ":rate:" +
    Array.from(new Uint8Array(digest))
      .map((n) => n.toString(16).padStart(2, "0"))
      .join("");
  await query(
    "INSERT INTO rate_limits (id,scope,count,expires) VALUES (?,?,1,?) ON CONFLICT (id) DO UPDATE SET count=rate_limits.count+1",
    [id, scope, Date.now() + 600000],
  );
  const [r] = await query("SELECT count FROM rate_limits WHERE id=?", [id]);
  if (r.count > max)
    throw new AppError(
      429,
      "Bạn gửi yêu cầu quá nhanh, vui lòng thử lại sau ít phút.",
    );
}
const sales: Role[] = ["admin", "sales"],
  tech: Role[] = ["admin", "technician"];
export async function api(req: Request) {
  try {
    const u = new URL(req.url),
      parts = u.pathname
        .replace(/^\/api\/?/, "")
        .split("/")
        .filter(Boolean),
      [r, id, act] = parts,
      m = req.method;
    const origin = req.headers.get("origin");
    if (
      !["GET", "HEAD"].includes(m) &&
      (req.headers.get("sec-fetch-site") === "cross-site" ||
        (origin &&
          origin !==
            (env("APP_URL") ? new URL(env("APP_URL")).origin : u.origin)))
    )
      throw new AppError(403, "Yêu cầu khác nguồn bị từ chối.");
    const a = await getActor(req),
      scope = await getScope(req);
    if (r === "me") return res({ user: a, demo: demoRuntime });
    if (r === "bootstrap" && m === "POST") {
      if (!demoRuntime) throw new AppError(404, "Không tìm thấy API.");
      must(a);
      await db.seed(scope);
      return res({ ok: true });
    }
    if (r === "login" && m === "POST") {
      await limit(scope, "login", 10);
      const b = z
        .object({
          email: z.string().email(),
          password: z.string().min(1).max(150),
        })
        .parse(await body(req));
      return res({ ok: true }, 200, {
        "Set-Cookie": await login(req, b.email, b.password),
      });
    }
    if (r === "logout" && m === "POST")
      return res({ ok: true }, 200, { "Set-Cookie": await logout(req) });
    if (r === "register" && m === "POST") {
      if (demoRuntime)
        throw new AppError(400, "Dùng tài khoản ChatGPT trong bản thử.");
      await limit(scope, "register", 10);
      const b = z
        .object({
          name: z.string().min(2).max(100),
          email: z.string().email().max(254),
          password: z.string().min(12).max(100),
        })
        .parse(await body(req));
      await batch([
        db.ins("users", {
          id: db.uid(),
          scope,
          name: b.name,
          email: b.email.toLowerCase(),
          password_hash: await hashPassword(b.password),
          role: "customer",
          status: "active",
          created: Date.now(),
        }),
      ]);
      return res({ ok: true }, 201);
    }
    if (r === "settings" && m === "GET") return res(await db.settings(scope));
    if (r === "taxonomy" && m === "GET") return res(await db.taxonomy(scope));
    if (r === "products" && m === "GET") {
      let ps = await db.listProducts(scope);
      if (id) {
        const p = ps.find((p) => p.id === id || p.slug === id);
        if (!p) throw new AppError(404, "Không tìm thấy sản phẩm.");
        return res(p);
      }
      const q = u.searchParams.get("q");
      if (q) {
        ps = ps
          .filter(
            (p) =>
              normalize(p.name + " " + p.brand).includes(normalize(q)) ||
              normalizePart(p.part_number).includes(normalizePart(q)) ||
              normalizePart(p.sku).includes(normalizePart(q)),
          )
          .sort(
            (a, b) =>
              Number(normalizePart(b.part_number) === normalizePart(q)) -
              Number(normalizePart(a.part_number) === normalizePart(q)),
          );
      }
      if (u.searchParams.get("brand_id"))
        ps = ps.filter((p) => p.brand_id === u.searchParams.get("brand_id"));
      if (u.searchParams.get("category_id")) {
        const ids = categoryIds(
          u.searchParams.get("category_id")!,
          (await db.taxonomy(scope)).categories,
        );
        ps = ps.filter((p) => ids.has(p.category_id));
      }
      for (const k of ["signal", "protocol", "power", "current"])
        if (u.searchParams.get(k))
          ps = ps.filter((p) =>
            p.specs.some(
              (s) => s.key === k && s.value === u.searchParams.get(k),
            ),
          );
      const v = Number(u.searchParams.get("voltage"));
      if (v)
        ps = ps.filter((p) =>
          p.specs.some(
            (s) =>
              s.key === "voltage" &&
              s.min != null &&
              s.max != null &&
              v >= s.min &&
              v <= s.max,
          ),
        );
      return res(ps);
    }
    if (r === "articles" && m === "GET") {
      let rows = await query(
        "SELECT * FROM articles WHERE scope=? AND status='published' ORDER BY created DESC",
        [scope],
      );
      if (!rows.length && demoRuntime) rows = articles;
      return res(id ? rows.find((a) => a.slug === id) || null : rows);
    }
    if (r === "cart-price" && m === "POST") {
      const b = z
        .object({
          items: z
            .array(
              z.object({
                product_id: z.string(),
                quantity: z.number().int().min(1).max(10000),
              }),
            )
            .min(1)
            .max(100),
          zone: z.string().max(100),
        })
        .parse(await body(req));
      await db.expire(scope);
      const c = calculateCart(
        b.items,
        await db.listProducts(scope),
        await db.settings(scope),
        b.zone,
      );
      return res({
        subtotal: c.subtotal,
        shipping: c.shipping,
        total: c.total,
      });
    }
    if (r === "orders" && m === "POST") {
      if (demoRuntime) must(a);
      await limit(scope, a?.id || "orders");
      const b = z
        .object({
          customer: customer.extend({
            address: z.string().min(8).max(500),
            zone: z.string().min(1).max(100),
          }),
          items: z
            .array(
              z.object({
                product_id: z.string(),
                quantity: z.number().int().min(1).max(10000),
              }),
            )
            .min(1)
            .max(100),
          key: z.string().uuid(),
          expected_total: z.number().int().nonnegative(),
        })
        .strict()
        .parse(await body(req));
      await db.expire(scope);
      return res(await db.checkout(scope, a?.id || null, b), 201);
    }
    if (r === "rfqs" && m === "POST") {
      if (demoRuntime) must(a);
      await limit(scope, a?.id || "rfqs");
      const b = z
        .object({
          customer,
          items: z
            .array(
              z.object({
                product_id: z.string().optional(),
                part_number: z.string().min(1).max(150),
                name: z.string().max(200).optional(),
                quantity: z.number().int().min(1).max(10000),
                note: z.string().max(1000).optional(),
              }),
            )
            .min(1)
            .max(100),
          note: z.string().max(5000).optional(),
        })
        .parse(await body(req));
      return res(await db.createRFQ(scope, a?.id || null, b), 201);
    }
    if (r === "account" && m === "GET") {
      const actor = must(a, ["admin", "sales", "technician", "customer"]);
      return res({
        orders: await query(
          "SELECT id,number,total,status,created FROM orders WHERE scope=? AND user_id=? ORDER BY created DESC",
          [scope, actor.id],
        ),
        rfqs: await query(
          "SELECT id,number,status,created FROM rfqs WHERE scope=? AND user_id=? ORDER BY created DESC",
          [scope, actor.id],
        ),
      });
    }
    if (r === "assets" && m === "GET") {
      const [asset] = await query(
        "SELECT * FROM assets WHERE id=? AND scope=?",
        [id, scope],
      );
      if (!asset) throw new AppError(404, "Không tìm thấy tệp.");
      const bytes = await getFile(asset.key);
      if (!bytes) throw new AppError(404, "Tệp không khả dụng.");
      return new Response(bytes as any, {
        headers: {
          "Content-Type": asset.mime,
          "Content-Disposition": `${asset.mime === "application/pdf" ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(asset.name)}`,
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "private, max-age=300",
        },
      });
    }
    if (r !== "admin") throw new AppError(404, "Không tìm thấy API.");
    const admin = must(a, ["admin", "sales", "technician"]);
    if (id === "products") {
      if (m === "GET") return res(await db.listProducts(scope, true));
      if (m === "POST" || m === "PATCH") {
        must(admin, tech);
        const b = product.parse(await body(req));
        return res(
          {
            id: await db.saveProduct(admin, b, m === "PATCH" ? act : undefined),
          },
          m === "POST" ? 201 : 200,
        );
      }
      if (m === "DELETE") {
        must(admin);
        await batch([
          db.update("products", scope, act, {
            status: "archived",
            updated: Date.now(),
          }),
          db.audit(admin, "product.archive", act),
        ]);
        return res({ ok: true });
      }
    }
    if (id === "settings" && m === "PATCH") {
      must(admin);
      const b = await body(req),
        s = await db.settings(scope);
      for (const k of Object.keys(s))
        if (k in b && typeof s[k] === "string")
          s[k] = z.string().max(15000).parse(b[k]);
      for (const k of ["logo", "portrait", "hero_image", "map_url", "messenger"])
        url.parse(s[k]);
      z.string().min(2).max(100).parse(s.name);
      z.string()
        .regex(/^[+\d\s().-]{9,20}$/)
        .parse(s.phone);
      z.union([z.literal(""), z.string().regex(/^[+\d\s().-]{9,20}$/)])
        .parse(s.phone_alt);
      z.union([z.literal(""), z.string().email().max(120)]).parse(s.email);
      z.string().max(100).parse(s.contact_name);
      z.string()
        .regex(/^\d{9,15}$/)
        .parse(s.zalo);
      z.string().max(120).parse(s.seo_title);
      z.string().max(300).parse(s.seo_description);
      z.string().max(200).parse(s.hero_title);
      z.string().max(600).parse(s.hero_description);
      z.string().max(500).parse(s.address);
      z.string().max(40).parse(s.tax_code);
      for (const k of ["local_fee", "other_fee", "free_shipping"])
        if (k in b) s[k] = z.number().int().min(0).max(1e9).parse(b[k]);
      if ("demo" in b) s.demo = demoRuntime ? true : z.boolean().parse(b.demo);
      await batch([
        db.update("settings", scope, scope + ":settings", {
          value: JSON.stringify(s),
        }),
        db.audit(admin, "settings.update", "settings"),
      ]);
      return res({ ok: true });
    }
    if (id === "taxonomy" && m === "POST") {
      must(admin);
      const b = z
        .object({
          type: z.enum(["brands", "categories"]),
          name: z.string().min(2).max(100),
          slug: z
            .string()
            .regex(/^[a-z0-9-]+$/)
            .max(100),
          parent_id: z.string().nullable().optional(),
        })
        .parse(await body(req));
      if (
        b.parent_id &&
        !(
          await query("SELECT id FROM categories WHERE scope=? AND id=?", [
            scope,
            b.parent_id,
          ])
        ).length
      )
        throw new AppError(400, "Danh mục cha không hợp lệ.");
      const id = db.uid();
      await batch([
        db.ins(b.type, {
          id,
          scope,
          name: b.name,
          slug: b.slug,
          ...(b.type === "categories"
            ? { parent_id: b.parent_id || null }
            : {}),
        }),
      ]);
      return res({ id }, 201);
    }
    if (id === "orders") {
      must(admin, sales);
      if (m === "GET")
        return res(
          act
            ? await db.order(scope, act)
            : await query(
                "SELECT * FROM orders WHERE scope=? ORDER BY created DESC",
                [scope],
              ),
        );
      if (m === "PATCH") {
        const b = z
          .object({
            status: z.enum([
              "confirmed",
              "processing",
              "shipped",
              "completed",
              "cancelled",
            ]),
          })
          .parse(await body(req));
        await db.changeOrder(admin, act, b.status);
        return res({ ok: true });
      }
    }
    if (id === "rfqs") {
      must(admin, sales);
      if (m === "GET")
        return res(
          act
            ? await db.rfq(scope, act)
            : await query(
                "SELECT * FROM rfqs WHERE scope=? ORDER BY created DESC",
                [scope],
              ),
        );
      if (m === "PATCH") {
        const b = z
          .object({ item_id: z.string(), product_id: z.string() })
          .parse(await body(req));
        const [p] = await query(
          "SELECT * FROM products WHERE id=? AND scope=?",
          [b.product_id, scope],
        );
        if (!p) throw new AppError(400, "Sản phẩm không hợp lệ.");
        await query(
          "UPDATE rfq_items SET product_id=?,name=?,part_number=? WHERE id=? AND rfq_id=? AND scope=?",
          [p.id, p.name, p.part_number, b.item_id, act, scope],
        );
        return res({ ok: true });
      }
    }
    if (id === "quotes") {
      must(admin, sales);
      if (m === "POST") {
        if (act) return res(await db.convertQuote(admin, act), 201);
        const b = z
          .object({
            rfq_id: z.string(),
            items: z
              .array(
                z.object({
                  item_id: z.string(),
                  price: z.number().int().nonnegative(),
                  tax: z.number().min(0).max(100),
                  discount: z.number().int().nonnegative(),
                  lead_time: z.string().max(200),
                  warranty: z.string().max(200),
                }),
              )
              .min(1)
              .max(100),
            shipping: z.number().int().nonnegative(),
            valid_until: z.string(),
            terms: z.string().max(5000),
          })
          .parse(await body(req));
        return res(await db.createQuote(admin, b), 201);
      }
      if (m === "GET" && act) {
        const q = await db.quote(scope, act);
        if (parts[3] === "pdf") {
          const { quotationPDF } = await import("./pdf");
          let logo: Uint8Array | undefined;
          if (q.seller.logo?.startsWith("/api/assets/")) {
            const [asset] = await query(
              "SELECT * FROM assets WHERE id=? AND scope=?",
              [q.seller.logo.split("/").pop(), scope],
            );
            if (asset?.mime === "image/png")
              logo = (await getFile(asset.key)) || undefined;
          }
          const bytes = await quotationPDF(q, logo);
          return new Response(bytes as any, {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="${q.number}-v${q.version}.pdf"`,
              "Cache-Control": "private, no-store",
            },
          });
        }
        return res(q);
      }
    }
    if (id === "upload" && m === "POST") {
      must(admin, tech);
      if (Number(req.headers.get("content-length") || 0) > 11 * 1024 * 1024)
        throw new AppError(413, "Tối đa 10 MB.");
      const form = await req.formData(),
        file = form.get("file");
      if (!(file instanceof File) || !file.size || file.size > 10 * 1024 * 1024)
        throw new AppError(400, "Chọn ảnh hoặc PDF tối đa 10 MB.");
      const bytes = new Uint8Array(await file.arrayBuffer()),
        s = new TextDecoder().decode(bytes.slice(0, 12));
      const mime =
        bytes[0] === 137 &&
        bytes[1] === 80 &&
        bytes[2] === 78 &&
        bytes[3] === 71
          ? "image/png"
          : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
            ? "image/jpeg"
            : s.startsWith("%PDF-")
              ? "application/pdf"
              : s.startsWith("RIFF") && s.slice(8) === "WEBP"
                ? "image/webp"
                : "";
      if (!mime) throw new AppError(400, "Chỉ nhận PNG, JPEG, WebP hoặc PDF.");
      const id = db.uid(),
        key = scope.replace(/[^\w-]/g, "_") + "/" + id;
      await putFile(key, mime, bytes);
      await batch([
        db.ins("assets", {
          id,
          scope,
          key,
          name: file.name.replace(/[\r\n]/g, ""),
          mime,
          size: bytes.length,
          owner_id: admin.id,
          created: Date.now(),
        }),
      ]);
      return res({ id, url: "/api/assets/" + id, mime }, 201);
    }
    if (id === "users") {
      must(admin);
      if (m === "GET")
        return res(
          demoRuntime
            ? [{ ...admin, status: "active" }]
            : await query(
                "SELECT id,name,email,role,status FROM users WHERE scope=?",
                [scope],
              ),
        );
      if (m === "POST") {
        const b = z
          .object({
            name: z.string().min(2).max(100),
            email: z.string().email().max(254),
            password: z.string().min(12).max(100),
            role: z.enum(["admin", "sales", "technician", "customer"]),
          })
          .parse(await body(req));
        await batch([
          db.ins("users", {
            id: db.uid(),
            scope,
            name: b.name,
            email: b.email.toLowerCase(),
            password_hash: await hashPassword(b.password),
            role: b.role,
            status: "active",
            created: Date.now(),
          }),
        ]);
        return res({ ok: true }, 201);
      }
      if (m === "PATCH") {
        if (demoRuntime || act === admin.id)
          throw new AppError(400, "Không thể thay đổi quyền tài khoản này.");
        const b = z
          .object({
            role: z.enum(["admin", "sales", "technician", "customer"]),
            status: z.enum(["active", "disabled"]),
          })
          .parse(await body(req));
        await batch([
          db.update("users", scope, act, b),
          db.audit(admin, "user.update", act),
        ]);
        return res({ ok: true });
      }
    }
    if (id === "articles") {
      must(admin, tech);
      if (m === "GET")
        return res(
          await query(
            "SELECT * FROM articles WHERE scope=? ORDER BY created DESC",
            [scope],
          ),
        );
      if (m === "POST" || m === "PATCH") {
        const b = z
          .object({
            title: z.string().min(5).max(200),
            slug: z
              .string()
              .regex(/^[a-z0-9-]+$/)
              .max(200),
            excerpt: z.string().max(500),
            body: z.string().min(10).max(50000),
            category: z.string().max(100),
            image: url,
            status: z.enum(["draft", "published"]),
          })
          .parse(await body(req));
        await batch([
          m === "POST"
            ? db.ins("articles", {
                id: db.uid(),
                scope,
                ...b,
                created: Date.now(),
              })
            : db.update("articles", scope, act, b),
        ]);
        return res({ ok: true });
      }
    }
    if (id === "audit" && m === "GET") {
      must(admin);
      return res(
        await query(
          "SELECT * FROM audit WHERE scope=? ORDER BY created DESC LIMIT 100",
          [scope],
        ),
      );
    }
    throw new AppError(404, "Không tìm thấy API.");
  } catch (e: any) {
    if (e instanceof AppError) return res({ error: e.message }, e.status);
    if (e instanceof z.ZodError)
      return res(
        {
          error: e.issues
            .slice(0, 3)
            .map((i) => i.path.join(".") + ": " + i.message)
            .join("; "),
        },
        400,
      );
    console.error("API", e?.code, e?.message);
    return res(
      {
        error:
          "Không thể lưu. Kiểm tra mã trùng, tồn kho hoặc kết nối cơ sở dữ liệu.",
      },
      409,
    );
  }
}
