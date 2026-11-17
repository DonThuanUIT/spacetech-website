// Test-only adapter. Never imported by either production build.
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import type { Row, Sql, Actor } from "../core/models";
export let database: DatabaseSync;
export const testEnv: Row = {};
const files = new Map<string, Uint8Array>();
export function reset() {
  database?.close();
  database = new DatabaseSync(":memory:");
  for (const f of readdirSync(new URL("../drizzle/", import.meta.url))
    .filter((f) => f.endsWith(".sql"))
    .sort())
    database.exec(
      readFileSync(new URL("../drizzle/" + f, import.meta.url), "utf8"),
    );
  files.clear();
  for (const k of Object.keys(testEnv)) delete testEnv[k];
}
export const demoRuntime = false;
export const env = (k: string) => testEnv[k] || "";
export async function query(sql: string, params: any[] = []): Promise<Row[]> {
  const st = database.prepare(sql);
  if (/^\s*SELECT/i.test(sql)) return st.all(...params);
  st.run(...params);
  return [];
}
export async function batch(items: Sql[]) {
  database.exec("BEGIN IMMEDIATE");
  try {
    for (const i of items) database.prepare(i.sql).run(...(i.params || []));
    database.exec("COMMIT");
  } catch (e) {
    database.exec("ROLLBACK");
    throw e;
  }
}
export async function actor(r: Request): Promise<Actor | null> {
  const role = r.headers.get("x-test-role");
  if (!role) return null;
  return {
    id: "tester",
    scope: await scope(r),
    name: "Người kiểm thử",
    email: "test@example.com",
    role: role as Actor["role"],
  };
}
export async function scope(r: Request) {
  return r.headers.get("x-test-scope") || "test-shop";
}
export async function login(
  _r: Request,
  _e: string,
  _p: string,
): Promise<string> {
  throw new Error("Not used in tests");
}
export async function logout(_r: Request) {
  return "";
}
export async function hashPassword(_p: string) {
  return "test-only-hash";
}
export async function putFile(key: string, _mime: string, bytes: Uint8Array) {
  files.set(key, bytes);
}
export async function getFile(key: string) {
  return files.get(key) || null;
}
