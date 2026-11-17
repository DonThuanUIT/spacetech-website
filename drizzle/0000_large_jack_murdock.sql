CREATE TABLE `articles` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`excerpt` text NOT NULL,
	`body` text NOT NULL,
	`category` text NOT NULL,
	`image` text NOT NULL,
	`status` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `articles_scope_slug_uq` ON `articles` (`scope`,`slug`);--> statement-breakpoint
CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`owner_id` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`actor_id` text NOT NULL,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `brands` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `brands_scope_slug_uq` ON `brands` (`scope`,`slug`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`parent_id` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_scope_slug_uq` ON `categories` (`scope`,`slug`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`provider` text NOT NULL,
	`event_id` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `events_scope_provider_event_id_uq` ON `events` (`scope`,`provider`,`event_id`);--> statement-breakpoint
CREATE TABLE `guards` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`ok` integer NOT NULL,
	CONSTRAINT "guards_valid" CHECK(ok = 1)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`name` text NOT NULL,
	`part_number` text NOT NULL,
	`quantity` integer NOT NULL,
	`price` integer NOT NULL,
	`tax` real NOT NULL,
	`discount` integer NOT NULL,
	`total` integer NOT NULL,
	`reserve` integer NOT NULL,
	CONSTRAINT "order_items_valid" CHECK(quantity > 0 AND price >= 0 AND reserve >= 0)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`number` text NOT NULL,
	`user_id` text,
	`customer` text NOT NULL,
	`status` text NOT NULL,
	`payment_status` text NOT NULL,
	`method` text NOT NULL,
	`subtotal` integer NOT NULL,
	`shipping` integer NOT NULL,
	`tax` integer NOT NULL,
	`total` integer NOT NULL,
	`request_key` text NOT NULL,
	`quote_id` text,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_scope_request_key_uq` ON `orders` (`scope`,`request_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `orders_scope_quote_id_uq` ON `orders` (`scope`,`quote_id`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`order_id` text NOT NULL,
	`provider` text NOT NULL,
	`reference` text NOT NULL,
	`amount` integer NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`sku` text NOT NULL,
	`part_number` text NOT NULL,
	`part_search` text NOT NULL,
	`brand_id` text NOT NULL,
	`category_id` text NOT NULL,
	`description` text NOT NULL,
	`image` text NOT NULL,
	`datasheet` text NOT NULL,
	`source` text NOT NULL,
	`mode` text NOT NULL,
	`price` integer,
	`stock` integer NOT NULL,
	`reserved` integer NOT NULL,
	`backorder` integer NOT NULL,
	`demo` integer NOT NULL,
	`status` text NOT NULL,
	`created` integer NOT NULL,
	`updated` integer NOT NULL,
	CONSTRAINT "products_valid" CHECK(stock >= 0 AND reserved >= 0 AND reserved <= stock AND (price IS NULL OR price >= 0))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_scope_sku_uq` ON `products` (`scope`,`sku`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_scope_slug_uq` ON `products` (`scope`,`slug`);--> statement-breakpoint
CREATE TABLE `quote_items` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`quote_id` text NOT NULL,
	`product_id` text,
	`name` text NOT NULL,
	`part_number` text NOT NULL,
	`quantity` integer NOT NULL,
	`price` integer NOT NULL,
	`tax` real NOT NULL,
	`discount` integer NOT NULL,
	`total` integer NOT NULL,
	`lead_time` text NOT NULL,
	`warranty` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`number` text NOT NULL,
	`rfq_id` text NOT NULL,
	`version` integer NOT NULL,
	`customer` text NOT NULL,
	`seller` text NOT NULL,
	`status` text NOT NULL,
	`subtotal` integer NOT NULL,
	`shipping` integer NOT NULL,
	`tax` integer NOT NULL,
	`discount` integer NOT NULL,
	`total` integer NOT NULL,
	`valid_until` integer NOT NULL,
	`terms` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quotes_scope_number_version_uq` ON `quotes` (`scope`,`number`,`version`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rfq_items` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`rfq_id` text NOT NULL,
	`product_id` text,
	`name` text NOT NULL,
	`part_number` text NOT NULL,
	`quantity` integer NOT NULL,
	`note` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rfqs` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`number` text NOT NULL,
	`user_id` text,
	`customer` text NOT NULL,
	`status` text NOT NULL,
	`note` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`user_id` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `specs` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`product_id` text NOT NULL,
	`key` text NOT NULL,
	`label` text NOT NULL,
	`value` text NOT NULL,
	`unit` text NOT NULL,
	`number` real,
	`min` real,
	`max` real
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text NOT NULL,
	`status` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_scope_email_uq` ON `users` (`scope`,`email`);