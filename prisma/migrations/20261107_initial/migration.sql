
CREATE TABLE "brands" ("id" TEXT PRIMARY KEY, "scope" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL);
CREATE UNIQUE INDEX brands_scope_slug_uq ON "brands" ("scope","slug");

CREATE TABLE "categories" ("id" TEXT PRIMARY KEY, "scope" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL, "parent_id" TEXT);
CREATE UNIQUE INDEX categories_scope_slug_uq ON "categories" ("scope","slug");


CREATE TABLE "products" ("id" TEXT PRIMARY KEY, "scope" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL, "sku" TEXT NOT NULL, "part_number" TEXT NOT NULL, "part_search" TEXT NOT NULL, "brand_id" TEXT NOT NULL, "category_id" TEXT NOT NULL, "description" TEXT NOT NULL, "image" TEXT NOT NULL, "datasheet" TEXT NOT NULL, "source" TEXT NOT NULL, "mode" TEXT NOT NULL, "price" DECIMAL(18,0), "stock" INTEGER NOT NULL, "reserved" INTEGER NOT NULL, "backorder" INTEGER NOT NULL, "demo" INTEGER NOT NULL, "status" TEXT NOT NULL, "created" BIGINT NOT NULL, "updated" BIGINT NOT NULL, CHECK (stock >= 0 AND reserved >= 0 AND reserved <= stock AND (price IS NULL OR price >= 0)), FOREIGN KEY ("brand_id") REFERENCES "brands"("id"), FOREIGN KEY ("category_id") REFERENCES "categories"("id"));
CREATE UNIQUE INDEX products_scope_sku_uq ON "products" ("scope","sku");
CREATE UNIQUE INDEX products_scope_slug_uq ON "products" ("scope","slug");
CREATE TABLE "specs" ("id" TEXT PRIMARY KEY, "scope" TEXT NOT NULL, "product_id" TEXT NOT NULL, "key" TEXT NOT NULL, "label" TEXT NOT NULL, "value" TEXT NOT NULL, "unit" TEXT NOT NULL, "number" DOUBLE PRECISION, "min" DOUBLE PRECISION, "max" DOUBLE PRECISION, FOREIGN KEY ("product_id") REFERENCES "products"("id"));
CREATE TABLE "settings" ("id" TEXT PRIMARY KEY, "scope" TEXT NOT NULL, "value" TEXT NOT NULL);

CREATE TABLE "users" ("id" TEXT PRIMARY KEY, "scope" TEXT NOT NULL, "name" TEXT NOT NULL, "email" TEXT NOT NULL, "password_hash" TEXT NOT NULL, "role" TEXT NOT NULL, "status" TEXT NOT NULL, "created" BIGINT NOT NULL);
CREATE UNIQUE INDEX users_scope_email_uq ON "users" ("scope","email");
CREATE TABLE "sessions" ("id" TEXT PRIMARY KEY, "scope" TEXT NOT NULL, "user_id" TEXT NOT NULL, "expires" BIGINT NOT NULL, FOREIGN KEY ("user_id") REFERENCES "users"("id"));


CREATE TABLE "orders" ("id" TEXT PRIMARY KEY, "scope" TEXT NOT NULL, "number" TEXT NOT NULL, "user_id" TEXT, "customer" TEXT NOT NULL, "status" TEXT NOT NULL, "payment_status" TEXT NOT NULL, "method" TEXT NOT NULL, "subtotal" DECIMAL(18,0) NOT NULL, "shipping" DECIMAL(18,0) NOT NULL, "tax" DECIMAL(18,0) NOT NULL, "total" DECIMAL(18,0) NOT NULL, "request_key" TEXT NOT NULL, "quote_id" TEXT, "created" BIGINT NOT NULL);
CREATE UNIQUE INDEX orders_scope_request_key_uq ON "orders" ("scope","request_key");
CREATE UNIQUE INDEX orders_scope_quote_id_uq ON "orders" ("scope","quote_id");
CREATE TABLE "order_items" ("id" TEXT PRIMARY KEY, "scope" TEXT NOT NULL, "order_id" TEXT NOT NULL, "product_id" TEXT NOT NULL, "name" TEXT NOT NULL, "part_number" TEXT NOT NULL, "quantity" INTEGER NOT NULL, "price" DECIMAL(18,0) NOT NULL, "tax" DOUBLE PRECISION NOT NULL, "discount" DECIMAL(18,0) NOT NULL, "total" DECIMAL(18,0) NOT NULL, "reserve" INTEGER NOT NULL, CHECK (quantity > 0 AND price >= 0 AND reserve >= 0), FOREIGN KEY ("order_id") REFERENCES "orders"("id"), FOREIGN KEY ("product_id") REFERENCES "products"("id"));
CREATE TABLE "rfqs" ("id" TEXT PRIMARY KEY, "scope" TEXT NOT NULL, "number" TEXT NOT NULL, "user_id" TEXT, "customer" TEXT NOT NULL, "status" TEXT NOT NULL, "note" TEXT NOT NULL, "created" BIGINT NOT NULL);
CREATE TABLE "rfq_items" ("id" TEXT PRIMARY KEY, "scope" TEXT NOT NULL, "rfq_id" TEXT NOT NULL, "product_id" TEXT, "name" TEXT NOT NULL, "part_number" TEXT NOT NULL, "quantity" INTEGER NOT NULL, "note" TEXT NOT NULL, FOREIGN KEY ("rfq_id") REFERENCES "rfqs"("id"), FOREIGN KEY ("product_id") REFERENCES "products"("id"));

CREATE TABLE "quotes" ("id" TEXT PRIMARY KEY, "scope" TEXT NOT NULL, "number" TEXT NOT NULL, "rfq_id" TEXT NOT NULL, "version" INTEGER NOT NULL, "customer" TEXT NOT NULL, "seller" TEXT NOT NULL, "status" TEXT NOT NULL, "subtotal" DECIMAL(18,0) NOT NULL, "shipping" DECIMAL(18,0) NOT NULL, "tax" DECIMAL(18,0) NOT NULL, "discount" DECIMAL(18,0) NOT NULL, "total" DECIMAL(18,0) NOT NULL, "valid_until" BIGINT NOT NULL, "terms" TEXT NOT NULL, "created" BIGINT NOT NULL, FOREIGN KEY ("rfq_id") REFERENCES "rfqs"("id"));
CREATE UNIQUE INDEX quotes_scope_number_version_uq ON "quotes" ("scope","number","version");
CREATE TABLE "quote_items" ("id" TEXT PRIMARY KEY, "scope" TEXT NOT NULL, "quote_id" TEXT NOT NULL, "product_id" TEXT, "name" TEXT NOT NULL, "part_number" TEXT NOT NULL, "quantity" INTEGER NOT NULL, "price" DECIMAL(18,0) NOT NULL, "tax" DOUBLE PRECISION NOT NULL, "discount" DECIMAL(18,0) NOT NULL, "total" DECIMAL(18,0) NOT NULL, "lead_time" TEXT NOT NULL, "warranty" TEXT NOT NULL, FOREIGN KEY ("quote_id") REFERENCES "quotes"("id"), FOREIGN KEY ("product_id") REFERENCES "products"("id"));
CREATE TABLE "assets" ("id" TEXT PRIMARY KEY, "scope" TEXT NOT NULL, "key" TEXT NOT NULL, "name" TEXT NOT NULL, "mime" TEXT NOT NULL, "size" INTEGER NOT NULL, "owner_id" TEXT NOT NULL, "created" BIGINT NOT NULL);

CREATE TABLE "articles" ("id" TEXT PRIMARY KEY, "scope" TEXT NOT NULL, "slug" TEXT NOT NULL, "title" TEXT NOT NULL, "excerpt" TEXT NOT NULL, "body" TEXT NOT NULL, "category" TEXT NOT NULL, "image" TEXT NOT NULL, "status" TEXT NOT NULL, "created" BIGINT NOT NULL);
CREATE UNIQUE INDEX articles_scope_slug_uq ON "articles" ("scope","slug");
CREATE TABLE "payments" ("id" TEXT PRIMARY KEY, "scope" TEXT NOT NULL, "order_id" TEXT NOT NULL, "provider" TEXT NOT NULL, "reference" TEXT NOT NULL, "amount" DECIMAL(18,0) NOT NULL, "created" BIGINT NOT NULL, FOREIGN KEY ("order_id") REFERENCES "orders"("id"));

CREATE TABLE "events" ("id" TEXT PRIMARY KEY, "scope" TEXT NOT NULL, "provider" TEXT NOT NULL, "event_id" TEXT NOT NULL, "created" BIGINT NOT NULL);
CREATE UNIQUE INDEX events_scope_provider_event_id_uq ON "events" ("scope","provider","event_id");
CREATE TABLE "audit" ("id" TEXT PRIMARY KEY, "scope" TEXT NOT NULL, "actor_id" TEXT NOT NULL, "action" TEXT NOT NULL, "entity" TEXT NOT NULL, "created" BIGINT NOT NULL);
CREATE TABLE "guards" ("id" TEXT PRIMARY KEY, "scope" TEXT NOT NULL, "ok" INTEGER NOT NULL, CHECK (ok = 1));
CREATE TABLE "rate_limits" ("id" TEXT PRIMARY KEY, "scope" TEXT NOT NULL, "count" INTEGER NOT NULL, "expires" BIGINT NOT NULL);
CREATE INDEX products_part_search_idx ON products(scope,part_search);
CREATE INDEX specs_filter_idx ON specs(scope,key,value);
CREATE INDEX orders_status_idx ON orders(scope,status,created);