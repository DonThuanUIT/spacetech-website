import { env as cloud } from "cloudflare:workers";
import type { Actor, Row, Sql } from "@/core/models";
import { AppError } from "@/core/models";
const b = cloud as unknown as {
  DB: D1Database;
  BUCKET: R2Bucket;
  [k: string]: any;
};
export const demoRuntime = true;
export const env = (k: string) => (typeof b[k] === "string" ? b[k] : "");
export async function query(sql: string, params: any[] = []): Promise<Row[]> {
  return (
    await b.DB.prepare(sql)
      .bind(...params)
      .all()
  ).results as Row[];
}
export async function batch(statements: Sql[]) {
  if (statements.length)
    await b.DB.batch(
      statements.map((s) => b.DB.prepare(s.sql).bind(...(s.params || []))),
    );
}
export async function actor(req: Request): Promise<Actor | null> {
  const id = req.headers.get("oai-authenticated-user-id");
  if (!id) return null;
  const email = req.headers.get("oai-authenticated-user-email") || "";
  let name = email || "Chủ cửa hàng";
  try {
    name = decodeURIComponent(
      req.headers.get("oai-authenticated-user-full-name") || name,
    );
  } catch {}
  return { id, name, email, role: "admin", scope: "preview:" + id };
}
export async function scope(req: Request) {
  return (await actor(req))?.scope || "public-demo";
}
export async function login(
  _req: Request,
  _email: string,
  _password: string,
): Promise<string> {
  throw new AppError(400, "Bản dùng thử đăng nhập bằng ChatGPT.");
}
export async function logout(_req: Request) {
  return "";
}
export async function hashPassword(_s: string): Promise<string> {
  throw new AppError(
    400,
    "Tạo nhân sự bằng mật khẩu được hỗ trợ trong bản PostgreSQL.",
  );
}
export async function putFile(key: string, mime: string, bytes: Uint8Array) {
  await b.BUCKET.put(key, bytes, { httpMetadata: { contentType: mime } });
}
export async function getFile(key: string) {
  const r = await b.BUCKET.get(key);
  return r ? new Uint8Array(await r.arrayBuffer()) : null;
}
