import Shop from "@/app/components/shop";
import { headers } from "next/headers";
import { actor, scope, demoRuntime } from "@runtime";
import { settings, taxonomy, listProducts } from "@/server/store";
import { articles as sampleArticles } from "@/core/seed";
import { query } from "@runtime";
import { publicIndexingOrigin, publicPages } from "@/server/seo";
export const dynamic = "force-dynamic";
async function context() {
  const h = await headers();
  const req = new Request("https://spacetech.local", { headers: h });
  return { req, scope: await scope(req) };
}
export async function generateMetadata({ params, searchParams }: any) {
  const { path = [] } = await params;
  const filters = (await searchParams) || {};
  const c = await context();
  const pagePath = "/" + path.join("/");
  try {
    const s = await settings(c.scope);
    const p = path[0] === "san-pham" && path.length === 2
      ? (await listProducts(c.scope)).find((p) => p.slug === path[1])
      : undefined;
    const [article] = path[0] === "kien-thuc" && path.length === 2
      ? await query("SELECT title,excerpt,image FROM articles WHERE scope=? AND slug=? AND status='published'", [c.scope, path[1]])
      : [];
    const label = publicPages[pagePath as keyof typeof publicPages];
    const origin = await publicIndexingOrigin();
    const indexable = !!origin && !s.demo &&
      (label !== undefined || !!(p && !p.demo) || !!article) &&
      Object.keys(filters).length === 0;
    const title = p
      ? `${p.part_number} | ${p.name} – ${s.name}`
      : article ? `${article.title} | ${s.name}` : label ? `${label} | ${s.name}` : s.seo_title;
    const description = (p?.description || article?.excerpt || s.seo_description).slice(0, 160);
    return {
      title,
      description,
      robots: { index: indexable, follow: indexable },
      ...(indexable && origin ? { alternates: { canonical: origin + pagePath } } : {}),
      ...(origin ? { metadataBase: new URL(origin) } : {}),
      openGraph: { title, description, images: [p?.image || article?.image || s.logo] },
    };
  } catch {
    return {
      title: "SpaceTech | Thiết bị tự động hóa",
      robots: { index: false, follow: false },
    };
  }
}
export default async function Page({ params }: any) {
  const { path = [] } = await params;
  const c = await context();
  let initial;
  try {
    const [s, ps, t, a, u] = await Promise.all([
      settings(c.scope),
      listProducts(c.scope),
      taxonomy(c.scope),
      query(
        "SELECT * FROM articles WHERE scope=? AND status='published' ORDER BY created DESC",
        [c.scope],
      ),
      actor(c.req),
    ]);
    initial = {
      settings: s,
      products: ps,
      taxonomy: t,
      articles: a.length ? a : demoRuntime ? sampleArticles : [],
      actor: u,
      demo: demoRuntime,
    };
  } catch {}
  return <Shop initialPath={"/" + path.join("/")} initial={initial} />;
}
