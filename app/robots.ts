import type { MetadataRoute } from "next";
import { publicIndexingOrigin } from "@/server/seo";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await publicIndexingOrigin();
  if (!origin) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: origin + "/sitemap.xml",
  };
}
