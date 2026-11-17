import type { MetadataRoute } from "next";
import { query } from "@runtime";
import { listProducts } from "@/server/store";
import { publicIndexingOrigin, publicPages } from "@/server/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await publicIndexingOrigin();
  if (!origin) return [];
  const [products, articles] = await Promise.all([
    listProducts("shop"),
    query("SELECT slug FROM articles WHERE scope=? AND status='published'", ["shop"]),
  ]);
  return [
    ...Object.keys(publicPages),
    ...products.filter((p) => !p.demo).map((p) => "/san-pham/" + p.slug),
    ...articles.map((a) => "/kien-thuc/" + a.slug),
  ].map((path) => ({ url: origin + path }));
}
