"use client";
import React from "react";
import { LoaderCircle, X } from "lucide-react";
import { statuses } from "@/core/models";
export async function request(
  path: string,
  method = "GET",
  data?: any,
): Promise<any> {
  const r = await fetch("/api/" + path, {
    method,
    credentials: "same-origin",
    headers:
      data && !(data instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {},
    body:
      data instanceof FormData ? data : data ? JSON.stringify(data) : undefined,
  });
  const b: any = await r.json();
  if (!r.ok) throw new Error(b.error || "Không thể kết nối máy chủ.");
  return b;
}
export const Spin = () => <LoaderCircle size={18} className="spin" />;
export function Field({ label, children, wide = false, hint }: any) {
  return (
    <label className={"field " + (wide ? "wide" : "")}>
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Badge({ value }: any) {
  return (
    <span className={"badge badge-" + value}>{statuses[value] || value}</span>
  );
}
export function Modal({ title, children, close, wide = false }: any) {
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section
        className={"modal " + (wide ? "large" : "")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <h2>{title}</h2>
          <button className="icon" onClick={close} aria-label="Đóng">
            <X size={20} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}
