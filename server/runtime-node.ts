import { PrismaClient, Prisma } from "@prisma/client";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { mkdir, readFile as read, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Sql, Row, Actor } from "@/core/models";
import { AppError } from "@/core/models";
const g = globalThis as unknown as {
  prisma?: PrismaClient;
};
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
export const demoRuntime = false;
export const env = (k: string) => process.env[k] || "";
const paramsSql = (s: string) => {
  let n = 0;
  return s.replace(/\?/g, () => "$" + ++n);
};
async function run(db: any, s: Sql) {
  const sql = paramsSql(s.sql);
  if (/^\s*SELECT/i.test(sql)) {
    const data = await db.$queryRawUnsafe(sql, ...(s.params || []));
    return JSON.parse(
      JSON.stringify(data, (_k, v) => (typeof v === "bigint" ? Number(v) : v)),
    );
  }
  await db.$executeRawUnsafe(sql, ...(s.params || []));
  return [];
}
export async function query(sql: string, params: any[] = []): Promise<Row[]> {
  return run(prisma, { sql, params });
}
export async function batch(statements: Sql[]) {
  for (let n = 0; ; n++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          for (const s of statements) await run(tx, s);
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          timeout: 20000,
        },
      );
    } catch (e: any) {
      if (e.code === "P2034" && n < 2) continue;
      throw e;
    }
  }
}
function secret() {
  if (env("AUTH_SECRET").length < 32)
    throw new AppError(503, "Chưa cấu hình AUTH_SECRET.");
  return new TextEncoder().encode(env("AUTH_SECRET"));
}
function cookie(req: Request) {
  return req.headers
    .get("cookie")
    ?.split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("st_session="))
    ?.slice(11);
}
export async function actor(req: Request): Promise<Actor | null> {
  const token = cookie(req);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), {
      algorithms: ["HS256"],
      issuer: "spacetech",
      audience: "store",
    });
    const [u] = await query(
      "SELECT u.* FROM users u JOIN sessions s ON s.user_id = u.id WHERE s.id = ? AND s.expires > ? AND u.scope = ? AND u.status = ?",
      [payload.jti, Date.now(), "shop", "active"],
    );
    return u
      ? { id: u.id, name: u.name, email: u.email, role: u.role, scope: "shop" }
      : null;
  } catch {
    return null;
  }
}
export async function scope(_req: Request) {
  return "shop";
}
export const hashPassword = (s: string) => bcrypt.hash(s, 12);
export async function login(req: Request, email: string, password: string) {
  const [u] = await query("SELECT * FROM users WHERE email = ? AND scope = ?", [
    email.toLowerCase().trim(),
    "shop",
  ]);
  if (
    !u ||
    u.status !== "active" ||
    !(await bcrypt.compare(password, u.password_hash))
  )
    throw new AppError(401, "Email hoặc mật khẩu không đúng.");
  const id = crypto.randomUUID();
  await query(
    "INSERT INTO sessions (id,scope,user_id,expires) VALUES (?,?,?,?)",
    [id, "shop", u.id, Date.now() + 8 * 3600000],
  );
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(u.id)
    .setJti(id)
    .setIssuer("spacetech")
    .setAudience("store")
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());
  return `st_session=${jwt}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800${env("APP_URL").startsWith("https:") || new URL(req.url).protocol === "https:" ? "; Secure" : ""}`;
}
export async function logout(req: Request) {
  try {
    const { payload } = await jwtVerify(cookie(req) || "", secret());
    await query("DELETE FROM sessions WHERE id = ?", [payload.jti]);
  } catch {}
  return "st_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
}
function filePath(key: string) {
  const root = path.resolve(env("UPLOAD_DIR") || "./data/uploads");
  const p = path.resolve(root, key);
  if (!p.startsWith(root + path.sep))
    throw new AppError(400, "Đường dẫn tệp không hợp lệ.");
  return p;
}
export async function putFile(key: string, mime: string, bytes: Uint8Array) {
  const p = filePath(key);
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, bytes);
}
export async function getFile(key: string) {
  try {
    return new Uint8Array(await read(filePath(key)));
  } catch {
    return null;
  }
}
