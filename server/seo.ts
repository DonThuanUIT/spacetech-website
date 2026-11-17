import { demoRuntime, env } from "@runtime";
import { settings } from "./store";

export const publicPages = {
  "/": "",
  "/san-pham": "Danh mục thiết bị",
  "/giai-phap": "Giải pháp tự động hóa",
  "/kien-thuc": "Kiến thức kỹ thuật",
  "/lien-he": "Giới thiệu & liên hệ",
} as const;

export async function publicIndexingOrigin(): Promise<string | null> {
  if (demoRuntime || env("INDEX_PUBLIC_SITE") !== "true") return null;
  try {
    const url = new URL(env("APP_URL"));
    if (url.protocol !== "https:" || url.username || url.password) return null;
    if ((await settings("shop")).demo !== false) return null;
    return url.origin;
  } catch {
    return null;
  }
}
