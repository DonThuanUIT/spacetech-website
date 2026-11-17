import {
  sqliteTable,
  text,
  integer,
  real,
  uniqueIndex,
  check,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
export const brands = sqliteTable(
  "brands",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
  },
  (t) => [uniqueIndex("brands_scope_slug_uq").on(t.scope, t.slug)],
);
export const categories = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    parent_id: text("parent_id"),
  },
  (t) => [uniqueIndex("categories_scope_slug_uq").on(t.scope, t.slug)],
);
export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    sku: text("sku").notNull(),
    part_number: text("part_number").notNull(),
    part_search: text("part_search").notNull(),
    brand_id: text("brand_id").notNull(),
    category_id: text("category_id").notNull(),
    description: text("description").notNull(),
    image: text("image").notNull(),
    datasheet: text("datasheet").notNull(),
    source: text("source").notNull(),
    mode: text("mode").notNull(),
    price: integer("price"),
    stock: integer("stock").notNull(),
    reserved: integer("reserved").notNull(),
    backorder: integer("backorder").notNull(),
    demo: integer("demo").notNull(),
    status: text("status").notNull(),
    created: integer("created").notNull(),
    updated: integer("updated").notNull(),
  },
  (t) => [
    uniqueIndex("products_scope_sku_uq").on(t.scope, t.sku),
    uniqueIndex("products_scope_slug_uq").on(t.scope, t.slug),
    check(
      "products_valid",
      sql`stock >= 0 AND reserved >= 0 AND reserved <= stock AND (price IS NULL OR price >= 0)`,
    ),
  ],
);
export const specs = sqliteTable(
  "specs",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull(),
    product_id: text("product_id").notNull(),
    key: text("key").notNull(),
    label: text("label").notNull(),
    value: text("value").notNull(),
    unit: text("unit").notNull(),
    number: real("number"),
    min: real("min"),
    max: real("max"),
  },
  (t) => [],
);
export const settings = sqliteTable(
  "settings",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull(),
    value: text("value").notNull(),
  },
  (t) => [],
);
export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    password_hash: text("password_hash").notNull(),
    role: text("role").notNull(),
    status: text("status").notNull(),
    created: integer("created").notNull(),
  },
  (t) => [uniqueIndex("users_scope_email_uq").on(t.scope, t.email)],
);
export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull(),
    user_id: text("user_id").notNull(),
    expires: integer("expires").notNull(),
  },
  (t) => [],
);
export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull(),
    number: text("number").notNull(),
    user_id: text("user_id"),
    customer: text("customer").notNull(),
    status: text("status").notNull(),
    payment_status: text("payment_status").notNull(),
    method: text("method").notNull(),
    subtotal: integer("subtotal").notNull(),
    shipping: integer("shipping").notNull(),
    tax: integer("tax").notNull(),
    total: integer("total").notNull(),
    request_key: text("request_key").notNull(),
    quote_id: text("quote_id"),
    created: integer("created").notNull(),
  },
  (t) => [
    uniqueIndex("orders_scope_request_key_uq").on(t.scope, t.request_key),
    uniqueIndex("orders_scope_quote_id_uq").on(t.scope, t.quote_id),
    uniqueIndex("orders_scope_number_uq").on(t.scope, t.number),
  ],
);
export const order_items = sqliteTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull(),
    order_id: text("order_id").notNull(),
    product_id: text("product_id").notNull(),
    name: text("name").notNull(),
    part_number: text("part_number").notNull(),
    quantity: integer("quantity").notNull(),
    price: integer("price").notNull(),
    tax: real("tax").notNull(),
    discount: integer("discount").notNull(),
    total: integer("total").notNull(),
    reserve: integer("reserve").notNull(),
  },
  (t) => [
    check(
      "order_items_valid",
      sql`quantity > 0 AND price >= 0 AND reserve >= 0`,
    ),
  ],
);
export const rfqs = sqliteTable(
  "rfqs",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull(),
    number: text("number").notNull(),
    user_id: text("user_id"),
    customer: text("customer").notNull(),
    status: text("status").notNull(),
    note: text("note").notNull(),
    created: integer("created").notNull(),
  },
  (t) => [],
);
export const rfq_items = sqliteTable(
  "rfq_items",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull(),
    rfq_id: text("rfq_id").notNull(),
    product_id: text("product_id"),
    name: text("name").notNull(),
    part_number: text("part_number").notNull(),
    quantity: integer("quantity").notNull(),
    note: text("note").notNull(),
  },
  (t) => [],
);
export const quotes = sqliteTable(
  "quotes",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull(),
    number: text("number").notNull(),
    rfq_id: text("rfq_id").notNull(),
    version: integer("version").notNull(),
    customer: text("customer").notNull(),
    seller: text("seller").notNull(),
    status: text("status").notNull(),
    subtotal: integer("subtotal").notNull(),
    shipping: integer("shipping").notNull(),
    tax: integer("tax").notNull(),
    discount: integer("discount").notNull(),
    total: integer("total").notNull(),
    valid_until: integer("valid_until").notNull(),
    terms: text("terms").notNull(),
    created: integer("created").notNull(),
  },
  (t) => [
    uniqueIndex("quotes_scope_number_version_uq").on(
      t.scope,
      t.number,
      t.version,
    ),
  ],
);
export const quote_items = sqliteTable(
  "quote_items",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull(),
    quote_id: text("quote_id").notNull(),
    product_id: text("product_id"),
    name: text("name").notNull(),
    part_number: text("part_number").notNull(),
    quantity: integer("quantity").notNull(),
    price: integer("price").notNull(),
    tax: real("tax").notNull(),
    discount: integer("discount").notNull(),
    total: integer("total").notNull(),
    lead_time: text("lead_time").notNull(),
    warranty: text("warranty").notNull(),
  },
  (t) => [],
);
export const assets = sqliteTable(
  "assets",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull(),
    key: text("key").notNull(),
    name: text("name").notNull(),
    mime: text("mime").notNull(),
    size: integer("size").notNull(),
    owner_id: text("owner_id").notNull(),
    created: integer("created").notNull(),
  },
  (t) => [],
);
export const articles = sqliteTable(
  "articles",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull(),
    body: text("body").notNull(),
    category: text("category").notNull(),
    image: text("image").notNull(),
    status: text("status").notNull(),
    created: integer("created").notNull(),
  },
  (t) => [uniqueIndex("articles_scope_slug_uq").on(t.scope, t.slug)],
);
export const payments = sqliteTable(
  "payments",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull(),
    order_id: text("order_id").notNull(),
    provider: text("provider").notNull(),
    reference: text("reference").notNull(),
    amount: integer("amount").notNull(),
    created: integer("created").notNull(),
  },
  (t) => [],
);
export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull(),
    provider: text("provider").notNull(),
    event_id: text("event_id").notNull(),
    created: integer("created").notNull(),
  },
  (t) => [
    uniqueIndex("events_scope_provider_event_id_uq").on(
      t.scope,
      t.provider,
      t.event_id,
    ),
  ],
);
export const audit = sqliteTable(
  "audit",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull(),
    actor_id: text("actor_id").notNull(),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    created: integer("created").notNull(),
  },
  (t) => [],
);
export const guards = sqliteTable(
  "guards",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull(),
    ok: integer("ok").notNull(),
  },
  (t) => [check("guards_valid", sql`ok = 1`)],
);
export const rate_limits = sqliteTable(
  "rate_limits",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull(),
    count: integer("count").notNull(),
    expires: integer("expires").notNull(),
  },
  (t) => [],
);
