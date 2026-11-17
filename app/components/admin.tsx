"use client";
import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  FileText,
  Settings,
  Users,
  Tags,
  BookOpen,
  History,
  ArrowUpRight,
  ArrowLeft,
  Plus,
  Search,
  Edit3,
  Archive,
  Upload,
  Save,
  Download,
  CheckCircle2,
  Menu,
  X,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import type { Actor, Row, Product } from "@/core/models";
import { money, statuses, transitions, calculateQuote } from "@/core/models";
import { request, Field, Modal, Badge, Spin } from "./ui";
const roles: Row = {
  admin: "Quản trị viên",
  sales: "Kinh doanh",
  technician: "Kỹ thuật viên",
  customer: "Khách hàng",
};
const tabs: any[] = [
  ["overview", "Tổng quan", LayoutDashboard],
  ["products", "Sản phẩm", Package],
  ["orders", "Đơn hàng", ShoppingBag],
  ["rfqs", "Báo giá B2B", FileText],
  ["taxonomy", "Danh mục & Hãng", Tags],
  ["articles", "Bài viết kỹ thuật", BookOpen],
  ["users", "Khách hàng & Nhân sự", Users],
  ["settings", "Cấu hình website", Settings],
  ["audit", "Nhật ký thao tác", History],
];
const date = (n: number) => new Date(Number(n)).toLocaleString("vi-VN");
const customer = (v: any) => (typeof v === "string" ? JSON.parse(v) : v);
export default function Admin({
  actor,
  demo,
  settings,
  taxonomy,
  loading,
  refreshShop,
  nav,
  notify,
  toast,
}: any) {
  const [tab, setTab] = useState("overview"),
    [rows, setRows] = useState<Row[]>([]),
    [products, setProducts] = useState<Product[]>([]),
    [orders, setOrders] = useState<Row[]>([]),
    [rfqs, setRfqs] = useState<Row[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [edit, setEdit] = useState<Row | null>(null),
    [q, setQ] = useState(""),
    [menu, setMenu] = useState(false);
  const available = tabs.filter(
    ([id]) =>
      actor?.role === "admin" ||
      (actor?.role === "sales"
        ? ["overview", "products", "orders", "rfqs"].includes(id)
        : ["overview", "products", "articles"].includes(id)),
  );
  async function load() {
    if (!actor || actor.role === "customer") return;
    setBusy(true);
    setError("");
    try {
      const p = await request("admin/products");
      setProducts(p);
      if (
        ["overview", "orders", "rfqs"].includes(tab) &&
        ["admin", "sales"].includes(actor.role)
      ) {
        const [o, r] = await Promise.all([
          request("admin/orders"),
          request("admin/rfqs"),
        ]);
        setOrders(o);
        setRfqs(r);
      }
      if (["users", "articles", "audit"].includes(tab))
        setRows(await request("admin/" + tab));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    load();
  }, [tab, actor?.id]);
  async function done(message = "Đã lưu thay đổi.") {
    setEdit(null);
    notify(message);
    await Promise.all([load(), refreshShop()]);
  }
  const select = (id: string) => {
    setTab(id);
    setQ("");
    setEdit(null);
    setMenu(false);
  };
  if (loading)
    return (
      <main className="container loading">
        <Spin />
        Đang tải quản trị...
      </main>
    );
  if (!actor || actor.role === "customer")
    return (
      <main className="container empty">
        <img src={settings.logo} className="login-logo" alt="" />
        <h1>Trang quản trị {settings.name}</h1>
        <p>Đăng nhập tài khoản được cấp quyền để tiếp tục.</p>
        <button className="btn primary" onClick={() => nav("/dang-nhap")}>
          Đăng nhập
          <ArrowUpRight size={17} />
        </button>
        <button className="text-link" onClick={() => nav("/")}>
          Về cửa hàng
        </button>
      </main>
    );
  const newOrders = orders.filter((order) => order.status === "new").length;
  const total = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((n, o) => n + Number(o.total), 0);
  return (
    <div className="admin-shell">
      <aside className={"admin-sidebar " + (menu ? "open" : "")}>
        <button className="logo" onClick={() => nav("/")}>
          <img src={settings.logo} alt="" />
          <span>
            {settings.name}<small>CONTROL CENTER</small>
          </span>
        </button>
        <small className="nav-caption">KHÔNG GIAN QUẢN TRỊ</small>
        <nav>
          {available.map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => select(id)}
              className={tab === id ? "active" : ""}
            >
              <Icon size={18} />
              {label}
              {id === "orders" && newOrders > 0 && <b>{newOrders}</b>}
              {id === "rfqs" &&
                rfqs.filter((r) => r.status === "new").length > 0 && (
                  <b>{rfqs.filter((r) => r.status === "new").length}</b>
                )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button onClick={() => nav("/")}>
            <ArrowUpRight size={18} />
            Xem cửa hàng
          </button>
          <div className="admin-person">
            <span>{actor.name.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{actor.name}</strong>
              <small>{roles[actor.role]}</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-top">
          <div>
            <button
              className="mobile-menu icon"
              aria-label="Mở menu quản trị"
              onClick={() => setMenu(!menu)}
            >
              <Menu size={22} />
            </button>
            <span>{settings.name}</span>
            <ChevronRight size={14} />
            <strong>{tabs.find((x) => x[0] === tab)?.[1]}</strong>
          </div>
          <span className="admin-status">
            <i className="dot" />
            {demo ? "Không gian thử nghiệm" : "Đang hoạt động"}
          </span>
        </header>
        <div className="admin-content">
          {demo && (
            <div className="notice demo-notice">
              Bản dùng thử riêng: dữ liệu mẫu được lưu cho tài khoản của bạn.
              Không phát sinh giao dịch thật.
            </div>
          )}
          <div className="admin-heading">
            <div>
              <div className="eyebrow">{settings.name} / ADMIN</div>
              <h1>{tabs.find((x) => x[0] === tab)?.[1]}</h1>
              <p>
                {tab === "overview"
                  ? "Theo dõi hoạt động và quản lý cửa hàng tại một nơi."
                  : tab === "products"
                    ? "Quản lý thiết bị, tài liệu và số lượng tồn kho."
                    : tab === "rfqs"
                      ? "Từ yêu cầu kỹ thuật đến báo giá rõ ràng."
                      : "Thông tin được lưu trên máy chủ."}
              </p>
            </div>
            <div className="buttons">
              <button
                className="btn outline"
                onClick={load}
                disabled={busy}
                aria-label="Tải lại"
              >
                {busy ? <Spin /> : <RefreshCw size={16} />}
              </button>
              {((tab === "products" && actor.role === "admin") ||
                tab === "articles") && (
                <button
                  className="btn primary"
                  onClick={() => setEdit({ type: tab, data: null })}
                >
                  <Plus size={17} />
                  {tab === "products" ? "Thêm sản phẩm" : "Viết bài mới"}
                </button>
              )}
            </div>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {tab === "overview" && (
            <>
              <div className="metric-grid">
                {[
                  [Package, "Sản phẩm", products.length, "Trong danh mục"],
                  [ShoppingBag, "Đơn mới", newOrders, "Chờ liên hệ khách"],
                  [
                    FileText,
                    "Yêu cầu mới",
                    rfqs.filter((r) => r.status === "new").length,
                    "Chờ xử lý báo giá",
                  ],
                  [
                    CheckCircle2,
                    "Giá trị đơn dự kiến",
                    money(total),
                    "Không bao gồm đơn đã hủy",
                  ],
                ].map(([Icon, label, val, sub]: any) => (
                  <div className="metric" key={label}>
                    <div>
                      <span>{label}</span>
                      <Icon size={20} />
                    </div>
                    <strong>{val}</strong>
                    <small>{sub}</small>
                  </div>
                ))}
              </div>
              <div className="two-col">
                <section className="panel">
                  <div className="panel-head">
                    <h2>Đơn hàng gần đây</h2>
                    <button
                      className="text-link"
                      onClick={() => select("orders")}
                    >
                      Xem tất cả ↗
                    </button>
                  </div>
                  {orders.length ? (
                    orders.slice(0, 5).map((o) => (
                      <button
                        key={o.id}
                        className="overview-order"
                        onClick={() => setEdit({ type: "order", id: o.id })}
                      >
                        <span>
                          <strong>{o.number}</strong>
                          <small>{customer(o.customer).name}</small>
                        </span>
                        <Badge value={o.status} />
                        <strong>{money(o.total)}</strong>
                      </button>
                    ))
                  ) : (
                    <Empty text="Đơn hàng sẽ xuất hiện khi khách đặt mua." />
                  )}
                </section>
                <section className="panel">
                  <div className="panel-head">
                    <h2>Theo dõi tồn kho</h2>
                    <Package size={20} />
                  </div>
                  {products
                    .filter((p) => p.stock - p.reserved < 10)
                    .map((p) => (
                      <div className="stock-item" key={p.id}>
                        <img src={p.image} alt="" />
                        <div>
                          <strong>{p.part_number}</strong>
                          <small>{p.name}</small>
                        </div>
                        <b className={p.stock - p.reserved === 0 ? "zero" : ""}>
                          {p.stock - p.reserved}
                        </b>
                      </div>
                    ))}
                </section>
              </div>
              <div className="admin-help">
                <FileText size={28} />
                <div>
                  <h3>Hoàn thiện thông tin cửa hàng</h3>
                  <p>
                    Cập nhật địa chỉ, chính sách và tài khoản ngân hàng trước
                    khi bán hàng thật.
                  </p>
                </div>
                <button
                  className="btn outline"
                  onClick={() => select("settings")}
                >
                  Mở cấu hình
                  <ArrowUpRight size={15} />
                </button>
              </div>
            </>
          )}
          {tab === "products" && (
            <section className="panel table-panel">
              <div className="table-toolbar">
                <div className="search small">
                  <Search size={17} />
                  <input
                    aria-label="Tìm sản phẩm quản trị"
                    placeholder="Tìm tên, mã hàng..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
                <span>{products.length} sản phẩm</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Sản phẩm / Mã hàng</th>
                      <th>Thương hiệu</th>
                      <th>Giá bán</th>
                      <th>Tồn / Giữ chỗ</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products
                      .filter((p) =>
                        (p.name + " " + p.part_number)
                          .toLowerCase()
                          .includes(q.toLowerCase()),
                      )
                      .map((p) => (
                        <tr key={p.id}>
                          <td>
                            <div className="table-product">
                              <img src={p.image} alt="" />
                              <div>
                                <strong>{p.name}</strong>
                                <small>{p.part_number}</small>
                              </div>
                            </div>
                          </td>
                          <td>{p.brand}</td>
                          <td className="nowrap">{money(p.price)}</td>
                          <td>
                            <strong>{p.stock}</strong> / {p.reserved}
                          </td>
                          <td>
                            <Badge value={p.status} />
                          </td>
                          <td>
                            <div className="actions">
                              {actor.role !== "sales" && (
                                <button
                                  className="icon"
                                  title="Sửa sản phẩm"
                                  aria-label={"Sửa " + p.part_number}
                                  onClick={() =>
                                    setEdit({ type: "products", data: p })
                                  }
                                >
                                  <Edit3 size={16} />
                                </button>
                              )}
                              <button
                                className="icon"
                                title="Xem sản phẩm"
                                onClick={() => nav("/san-pham/" + p.slug)}
                              >
                                <ArrowUpRight size={17} />
                              </button>
                              {actor.role === "admin" &&
                                p.status !== "archived" && (
                                  <button
                                    className="icon danger"
                                    title="Lưu trữ"
                                    onClick={() =>
                                      setEdit({ type: "archive", data: p })
                                    }
                                  >
                                    <Archive size={16} />
                                  </button>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {tab === "orders" && (
            <section className="panel table-panel">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Đơn hàng</th>
                      <th>Khách hàng</th>
                      <th>Tổng dự kiến</th>
                      <th>Trạng thái</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <strong>{o.number}</strong>
                          <small>{date(o.created)}</small>
                        </td>
                        <td>
                          {customer(o.customer).name}
                          <small>{customer(o.customer).phone}</small>
                        </td>
                        <td>{money(o.total)}</td>
                        <td>
                          <Badge value={o.status} />
                        </td>
                        <td>
                          <button
                            className="text-link"
                            onClick={() => setEdit({ type: "order", id: o.id })}
                          >
                            Chi tiết →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!orders.length && <Empty text="Chưa có đơn hàng." />}
              </div>
            </section>
          )}
          {tab === "rfqs" && (
            <section className="panel table-panel">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Mã yêu cầu</th>
                      <th>Khách hàng</th>
                      <th>Doanh nghiệp</th>
                      <th>Trạng thái</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {rfqs.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <strong>{r.number}</strong>
                          <small>{date(r.created)}</small>
                        </td>
                        <td>
                          {customer(r.customer).name}
                          <small>{customer(r.customer).phone}</small>
                        </td>
                        <td>{customer(r.customer).company || "—"}</td>
                        <td>
                          <Badge value={r.status} />
                        </td>
                        <td>
                          <button
                            className="text-link"
                            onClick={() => setEdit({ type: "rfq", id: r.id })}
                          >
                            Lập báo giá →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!rfqs.length && (
                  <Empty text="Chưa có yêu cầu. Bạn có thể gửi thử từ trang Báo giá B2B." />
                )}
              </div>
            </section>
          )}
          {tab === "taxonomy" && <Taxonomy taxonomy={taxonomy} done={done} />}
          {tab === "settings" && (
            <SettingsForm value={settings} demo={demo} done={done} />
          )}
          {tab === "users" && (
            <UsersView rows={rows} actor={actor} demo={demo} done={done} />
          )}
          {tab === "articles" && (
            <section className="panel table-panel">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Bài viết</th>
                      <th>Chuyên mục</th>
                      <th>Trạng thái</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <strong>{r.title}</strong>
                          <small>/{r.slug}</small>
                        </td>
                        <td>{r.category}</td>
                        <td>
                          <Badge value={r.status} />
                        </td>
                        <td>
                          <button
                            className="icon"
                            aria-label={"Sửa " + r.title}
                            onClick={() =>
                              setEdit({ type: "articles", data: r })
                            }
                          >
                            <Edit3 size={17} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {tab === "audit" && (
            <section className="panel table-panel">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Thời gian</th>
                      <th>Thao tác</th>
                      <th>Người thực hiện</th>
                      <th>Đối tượng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td>{date(r.created)}</td>
                        <td>{r.action}</td>
                        <td>{r.actor_id}</td>
                        <td>{r.entity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!rows.length && <Empty text="Chưa có nhật ký." />}
              </div>
            </section>
          )}
        </div>
        <div className="admin-footer">
          {settings.name} <span>Quản lý thiết bị · Kết nối giải pháp</span>
        </div>
      </div>
      {edit?.type === "products" && (
        <ProductEditor
          product={edit.data}
          taxonomy={taxonomy}
          actor={actor}
          close={() => setEdit(null)}
          done={done}
        />
      )}
      {edit?.type === "archive" && (
        <ArchiveConfirm
          product={edit.data}
          close={() => setEdit(null)}
          done={done}
        />
      )}
      {edit?.type === "order" && (
        <OrderView
          id={edit.id}
          close={() => setEdit(null)}
          done={done}
        />
      )}
      {edit?.type === "rfq" && (
        <QuoteEditor
          id={edit.id}
          products={products}
          close={() => setEdit(null)}
          done={done}
        />
      )}
      {edit?.type === "articles" && (
        <ArticleEditor
          article={edit.data}
          close={() => setEdit(null)}
          done={done}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={19} />
          {toast}
        </div>
      )}
    </div>
  );
}
function Empty({ text }: any) {
  return (
    <div className="empty compact">
      <Package size={30} />
      <p>{text}</p>
    </div>
  );
}
function SaveButton({ busy, label = "Lưu thay đổi" }: any) {
  return (
    <button className="btn primary" disabled={busy}>
      {busy ? <Spin /> : <Save size={17} />} {label}
    </button>
  );
}
function UploadField({
  label,
  value,
  set,
  accept = "image/png,image/jpeg,image/webp,application/pdf",
}: any) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function upload(f: File | undefined) {
    if (!f) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", f);
      const r = await request("admin/upload", "POST", form);
      set(r.url);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="upload-field">
      <Field label={label}>
        <input
          value={value || ""}
          placeholder="https://... hoặc tải tệp lên"
          onChange={(e) => set(e.target.value)}
        />
      </Field>
      <label className="btn outline upload-button">
        {busy ? <Spin /> : <Upload size={16} />}Tải tệp
        <input
          type="file"
          accept={accept}
          onChange={(e) => upload(e.target.files?.[0])}
          disabled={busy}
        />
      </label>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
function ProductEditor({ product, taxonomy, actor, close, done }: any) {
  const [p, setP] = useState<Row>(
      product
        ? {
            ...product,
            specs: product.specs.map((s: Row) => ({ ...s })),
            expected_stock: product.stock,
          }
        : {
            name: "",
            slug: "",
            sku: "",
            part_number: "",
            brand_id: taxonomy.brands[0]?.id || "",
            category_id: taxonomy.categories[0]?.id || "",
            description: "",
            image: "/assets/plc.svg",
            datasheet: "",
            source: "",
            mode: "quote",
            price: null,
            stock: 0,
            backorder: false,
            demo: true,
            status: "draft",
            specs: [],
          },
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setP({ ...p, [k]: v }),
    tech = actor.role === "technician";
  const input = (
    k: string,
    required = false,
    type = "text",
    disabled = false,
  ) => (
    <input
      required={required}
      type={type}
      min={type === "number" ? 0 : undefined}
      value={p[k] ?? ""}
      disabled={disabled}
      onChange={(e) =>
        set(
          k,
          type === "number"
            ? e.target.value === ""
              ? null
              : Number(e.target.value)
            : e.target.value,
        )
      }
    />
  );
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request(
        "admin/products" + (product ? "/" + product.id : ""),
        product ? "PATCH" : "POST",
        p,
      );
      await done();
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
    }
  }
  return (
    <Modal
      title={product ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm"}
      close={close}
      wide
    >
      <form onSubmit={save}>
        <div className="form-grid">
          <Field label="Tên sản phẩm *" wide>
            {input("name", true)}
          </Field>
          <Field label="Đường dẫn (slug) *" hint="Ví dụ: plc-siemens-s7-1200">
            {input("slug", true)}
          </Field>
          <Field label="Mã SKU nội bộ *">
            {input("sku", true, "text", tech)}
          </Field>
          <Field label="Mã nhà sản xuất *">{input("part_number", true)}</Field>
          <Field label="Thương hiệu">
            <select
              value={p.brand_id}
              onChange={(e) => set("brand_id", e.target.value)}
            >
              {taxonomy.brands.map((x: Row) => (
                <option value={x.id} key={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Danh mục">
            <select
              value={p.category_id}
              onChange={(e) => set("category_id", e.target.value)}
            >
              {taxonomy.categories.map((x: Row) => (
                <option value={x.id} key={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Trạng thái">
            <select
              value={p.status}
              disabled={tech}
              onChange={(e) => set("status", e.target.value)}
            >
              {["draft", "published", "archived"].map((v) => (
                <option key={v} value={v}>
                  {statuses[v]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Cách hiển thị giá">
            <select
              value={p.mode}
              disabled={tech}
              onChange={(e) => set("mode", e.target.value)}
            >
              <option value="quote">Liên hệ báo giá</option>
              <option value="fixed">Giá niêm yết</option>
            </select>
          </Field>
          <Field label="Giá bán cuối cùng (VND)">
            {input(
              "price",
              p.mode === "fixed",
              "number",
              tech || p.mode === "quote",
            )}
          </Field>
          <Field
            label="Tổng tồn kho"
            hint={
              product
                ? "Đang giữ chỗ: " + product.reserved
                : "Không bao gồm hàng chờ nhập"
            }
          >
            {input("stock", true, "number", tech)}
          </Field>
          <div className="field">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={!!p.backorder}
                disabled={tech}
                onChange={(e) => set("backorder", e.target.checked)}
              />
              Cho phép đặt hàng chờ nhập
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={!!p.demo}
                disabled={tech}
                onChange={(e) => set("demo", e.target.checked)}
              />
              Giá và tồn kho minh họa
            </label>
          </div>
          <Field label="Mô tả sản phẩm" wide>
            <textarea
              rows={4}
              value={p.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>
        </div>
        <UploadField
          label="Ảnh sản phẩm"
          value={p.image}
          set={(v: string) => set("image", v)}
          accept="image/png,image/jpeg,image/webp"
        />
        <UploadField
          label="Datasheet / Catalog PDF"
          value={p.datasheet}
          set={(v: string) => set("datasheet", v)}
          accept="application/pdf"
        />
        <Field label="Trang thông số chính thức">{input("source")}</Field>
        <div className="panel-head">
          <h3>Thông số kỹ thuật</h3>
          <button
            type="button"
            className="text-link"
            onClick={() =>
              set("specs", [
                ...p.specs,
                {
                  key: "",
                  label: "",
                  value: "",
                  unit: "",
                  min: null,
                  max: null,
                  number: null,
                },
              ])
            }
          >
            <Plus size={16} />
            Thêm thông số
          </button>
        </div>
        <p className="small muted">
          Khóa lọc: voltage, power, current, signal, protocol. Điện áp cần nhập
          cả giá trị nhỏ nhất và lớn nhất.
        </p>
        <div className="spec-editor">
          {p.specs.map((s: Row, i: number) => (
            <div className="spec-edit-row" key={i}>
              {[
                ["key", "Khóa"],
                ["label", "Tên thông số"],
                ["value", "Giá trị"],
                ["unit", "Đơn vị"],
                ["min", "Min (V)"],
                ["max", "Max (V)"],
              ].map(([k, l]) => (
                <input
                  key={k}
                  aria-label={l + " " + (i + 1)}
                  placeholder={l}
                  required={["key", "label", "value"].includes(k)}
                  type={["min", "max"].includes(k) ? "number" : "text"}
                  step="any"
                  value={s[k] ?? ""}
                  onChange={(e) =>
                    set(
                      "specs",
                      p.specs.map((x: Row, j: number) =>
                        i === j
                          ? {
                              ...x,
                              [k]: ["min", "max"].includes(k)
                                ? e.target.value === ""
                                  ? null
                                  : Number(e.target.value)
                                : e.target.value,
                            }
                          : x,
                      ),
                    )
                  }
                />
              ))}
              <button
                type="button"
                className="icon"
                aria-label="Xóa thông số"
                onClick={() =>
                  set(
                    "specs",
                    p.specs.filter((_: any, j: number) => i !== j),
                  )
                }
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        {error && <p className="error">{error}</p>}
        <div className="form-actions">
          <button type="button" className="btn outline" onClick={close}>
            Hủy
          </button>
          <SaveButton busy={busy} />
        </div>
      </form>
    </Modal>
  );
}
function ArchiveConfirm({ product, close, done }: any) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Modal title="Lưu trữ sản phẩm" close={close}>
      <p>
        Sản phẩm <strong>{product.part_number}</strong> sẽ được ẩn khỏi cửa
        hàng. Lịch sử đơn hàng vẫn được giữ.
      </p>
      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        <button className="btn outline" onClick={close}>
          Quay lại
        </button>
        <button
          disabled={busy}
          className="btn primary"
          onClick={async () => {
            setBusy(true);
            try {
              await request("admin/products/" + product.id, "DELETE");
              done("Đã lưu trữ sản phẩm.");
            } catch (e: any) {
              setError(e.message);
              setBusy(false);
            }
          }}
        >
          Lưu trữ
        </button>
      </div>
    </Modal>
  );
}
function OrderView({ id, close, done }: any) {
  const [o, setO] = useState<Row | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    request("admin/orders/" + id)
      .then(setO)
      .catch((e) => setError(e.message));
  }, [id]);
  async function action(path: string, body: Row) {
    setBusy(true);
    setError("");
    try {
      await request(path, "PATCH", body);
      setO(await request("admin/orders/" + id));
      await done("Đã cập nhật đơn hàng.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={o?.number || "Chi tiết đơn hàng"} close={close} wide>
      {error && <p className="error">{error}</p>}
      {o ? (
        <>
          <div className="two-col">
            <div>
              <h3>{o.customer.name}</h3>
              <p>
                {o.customer.company}
                <br />
                <a className="text-link" href={"tel:" + o.customer.phone}>{o.customer.phone}</a>
                {o.customer.email && (
                  <>
                    <br />
                    <a className="text-link" href={"mailto:" + o.customer.email}>{o.customer.email}</a>
                  </>
                )}
                <br />
                {o.customer.address}
              </p>
              {o.customer.note && <p className="notice">{o.customer.note}</p>}
            </div>
            <div className="order-status">
              <Badge value={o.status} />
              <p>{date(o.created)}</p>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Thiết bị</th>
                  <th>SL</th>
                  <th>Đơn giá</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {o.items.map((i: Row) => (
                  <tr key={i.id}>
                    <td>
                      {i.name}
                      <small>{i.part_number}</small>
                    </td>
                    <td>{i.quantity}</td>
                    <td>{money(i.price)}</td>
                    <td>{money(i.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="summary-row">
            <span>Phí vận chuyển</span>
            <strong>{money(o.shipping)}</strong>
          </div>
          <div className="total-row">
            <strong>Tổng dự kiến</strong>
            <strong>{money(o.total)}</strong>
          </div>
          <div className="form-actions">
            {(transitions[o.status] || []).map((v) => (
              <button
                key={v}
                className={
                  "btn " + (v === "cancelled" ? "outline danger" : "primary")
                }
                disabled={busy}
                onClick={() => action("admin/orders/" + id, { status: v })}
              >
                {statuses[v]}
              </button>
            ))}
          </div>
        </>
      ) : (
        <Spin />
      )}
    </Modal>
  );
}
function QuoteEditor({ id, products, close, done }: any) {
  const [r, setR] = useState<Row | null>(null),
    [items, setItems] = useState<Row[]>([]),
    [shipping, setShipping] = useState(0),
    [valid, setValid] = useState(
      new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    ),
    [terms, setTerms] = useState(
      "Giá có hiệu lực đến ngày ghi trên báo giá. Thời gian giao hàng được xác nhận khi đặt hàng. Khách hàng vui lòng đối chiếu mã thiết bị và thông số.",
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  async function load() {
    const v = await request("admin/rfqs/" + id);
    setR(v);
    setItems(
      v.items.map((i: Row) => {
        const p = products.find((p: Product) => p.id === i.product_id);
        return {
          ...i,
          price: p?.price || 0,
          tax: 0,
          discount: 0,
          lead_time: "Xác nhận khi đặt hàng",
          warranty: "Theo báo giá",
        };
      }),
    );
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [id]);
  const set = (i: number, k: string, v: any) =>
    setItems(items.map((x, j) => (i === j ? { ...x, [k]: v } : x)));
  let total: Row | null = null;
  try {
    total = calculateQuote(items, shipping);
  } catch {}
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const q = await request("admin/quotes", "POST", {
        rfq_id: id,
        items: items.map(
          ({ id, price, tax, discount, lead_time, warranty }) => ({
            item_id: id,
            price,
            tax,
            discount,
            lead_time,
            warranty,
          }),
        ),
        shipping,
        valid_until: valid + "T23:59:59+07:00",
        terms,
      });
      setR(await request("admin/rfqs/" + id));
      setNotice(
        `Đã phát hành ${q.number} · Phiên bản ${q.version}. Tải PDF bên dưới.`,
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={r ? "Báo giá · " + r.number : "Đang tải yêu cầu"}
      close={close}
      wide
    >
      {r ? (
        <>
          <div className="two-col">
            <div>
              <h3>{r.customer.name}</h3>
              <p>
                {r.customer.company}
                <br />
                {r.customer.phone} · {r.customer.email}
              </p>
            </div>
            <p>{r.note || "Không có ghi chú thêm."}</p>
          </div>
          <form onSubmit={submit}>
            {items.map((x, i) => (
              <div className="quote-line" key={x.id}>
                <div className="panel-head">
                  <strong>
                    {i + 1}. {x.part_number}
                  </strong>
                  <b>Số lượng: {x.quantity}</b>
                </div>
                <p>
                  {x.name} {x.note && "· " + x.note}
                </p>
                {!x.product_id && (
                  <Field label="Gán mã trong danh mục (cần trước khi chuyển thành đơn)">
                    <select
                      value=""
                      onChange={async (e) => {
                        if (!e.target.value) return;
                        try {
                          await request("admin/rfqs/" + id, "PATCH", {
                            item_id: x.id,
                            product_id: e.target.value,
                          });
                          await load();
                        } catch (e: any) {
                          setError(e.message);
                        }
                      }}
                    >
                      <option value="">Chọn thiết bị tương ứng</option>
                      {products.map((p: Product) => (
                        <option key={p.id} value={p.id}>
                          {p.part_number} — {p.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                <div className="form-grid three">
                  {[
                    ["price", "Đơn giá trước thuế (VND)"],
                    ["tax", "Thuế suất (%)"],
                    ["discount", "Giảm giá cả dòng (VND)"],
                  ].map(([k, l]) => (
                    <Field key={k} label={l}>
                      <input
                        required
                        type="number"
                        min="0"
                        max={k === "tax" ? 100 : undefined}
                        step={k === "tax" ? "0.01" : "1"}
                        value={x[k]}
                        onChange={(e) => set(i, k, Number(e.target.value))}
                      />
                    </Field>
                  ))}
                </div>
                <div className="form-grid">
                  <Field label="Thời gian giao">
                    <input
                      value={x.lead_time}
                      onChange={(e) => set(i, "lead_time", e.target.value)}
                    />
                  </Field>
                  <Field label="Bảo hành">
                    <input
                      value={x.warranty}
                      onChange={(e) => set(i, "warranty", e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            ))}
            <div className="form-grid">
              <Field label="Phí vận chuyển (VND)">
                <input
                  type="number"
                  required
                  min="0"
                  value={shipping}
                  onChange={(e) => setShipping(Number(e.target.value))}
                />
              </Field>
              <Field label="Hiệu lực đến">
                <input
                  type="date"
                  required
                  value={valid}
                  onChange={(e) => setValid(e.target.value)}
                />
              </Field>
              <Field label="Điều khoản" wide>
                <textarea
                  rows={3}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                />
              </Field>
            </div>
            {total && (
              <div className="quote-totals">
                <span>Tiền hàng: {money(total.subtotal)}</span>
                <span>Giảm giá: {money(total.discount)}</span>
                <span>Thuế: {money(total.tax)}</span>
                <strong>Tổng cộng: {money(total.total)}</strong>
              </div>
            )}
            {error && <p className="error">{error}</p>}
            {notice && <p className="notice success-note">{notice}</p>}
            <div className="form-actions">
              <SaveButton busy={busy} label="Phát hành báo giá PDF" />
            </div>
          </form>
          <h3>Các phiên bản đã phát hành</h3>
          <p className="small muted">
            Mỗi phiên bản giữ nguyên giá và điều khoản tại thời điểm phát hành.
          </p>
          {r.quotes.length ? (
            r.quotes.map((q: Row) => (
              <div className="quote-history" key={q.id}>
                <div>
                  <strong>
                    {q.number} · V{q.version}
                  </strong>
                  <small>
                    {money(q.total)} · {date(q.created)}
                  </small>
                </div>
                <Badge value={q.status} />
                <a
                  className="btn outline"
                  href={"/api/admin/quotes/" + q.id + "/pdf"}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download size={15} />
                  PDF
                </a>
                <button
                  className="btn primary"
                  disabled={busy || q.status === "accepted"}
                  onClick={async () => {
                    setBusy(true);
                    setError("");
                    try {
                      const o = await request(
                        "admin/quotes/" + q.id,
                        "POST",
                        {},
                      );
                      await done("Đã tạo đơn " + o.number);
                    } catch (e: any) {
                      setError(e.message);
                      setBusy(false);
                    }
                  }}
                >
                  Khách đã chốt · Tạo đơn
                </button>
              </div>
            ))
          ) : (
            <p className="notice">Chưa phát hành báo giá.</p>
          )}
        </>
      ) : (
        <Spin />
      )}
    </Modal>
  );
}
function Taxonomy({ taxonomy, done }: any) {
  const [v, setV] = useState({
      type: "categories",
      name: "",
      slug: "",
      parent_id: "",
    }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request("admin/taxonomy", "POST", {
        ...v,
        parent_id: v.type === "categories" ? v.parent_id || null : null,
      });
      setV({ ...v, name: "", slug: "", parent_id: "" });
      await done();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="two-col">
      <section className="panel">
        <h2>Danh mục thiết bị</h2>
        {taxonomy.categories.map((c: Row) => (
          <div className="summary-row" key={c.id}>
            <strong>
              {c.parent_id ? "↳ " : ""}
              {c.name}
            </strong>
            <span>
              {c.parent_id
                ? taxonomy.categories.find((x: Row) => x.id === c.parent_id)
                    ?.name
                : c.slug}
            </span>
          </div>
        ))}
        <h2 className="form-heading">Thương hiệu</h2>
        {taxonomy.brands.map((b: Row) => (
          <div className="summary-row" key={b.id}>
            <strong>{b.name}</strong>
            <span>{b.slug}</span>
          </div>
        ))}
      </section>
      <form className="panel" onSubmit={submit}>
        <h2>Thêm danh mục / Hãng</h2>
        <Field label="Loại">
          <select
            value={v.type}
            onChange={(e) => setV({ ...v, type: e.target.value })}
          >
            <option value="categories">Danh mục</option>
            <option value="brands">Thương hiệu</option>
          </select>
        </Field>
        <Field label="Tên">
          <input
            required
            minLength={2}
            value={v.name}
            onChange={(e) => setV({ ...v, name: e.target.value })}
          />
        </Field>
        <Field label="Slug (không dấu, ngăn bằng dấu -)">
          <input
            required
            pattern="[a-z0-9-]+"
            value={v.slug}
            onChange={(e) => setV({ ...v, slug: e.target.value })}
          />
        </Field>
        {v.type === "categories" && (
          <Field label="Danh mục cha">
            <select
              value={v.parent_id}
              onChange={(e) => setV({ ...v, parent_id: e.target.value })}
            >
              <option value="">Danh mục cấp cao nhất</option>
              {taxonomy.categories.map((c: Row) => (
                <option value={c.id} key={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        {error && <p className="error">{error}</p>}
        <SaveButton busy={busy} label="Thêm mới" />
      </form>
    </div>
  );
}
function SettingsForm({ value, demo, done }: any) {
  const [s, setS] = useState<Row>({ ...value }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setS({ ...s, [k]: v });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request("admin/settings", "PATCH", s);
      await done("Đã cập nhật cấu hình cửa hàng.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="settings-form">
      <section className="panel">
        <h2>01. Thông tin thương hiệu</h2>
        <div className="settings-logo">
          <img src={s.logo} alt="Logo hiện tại" />
          <UploadField
            label="Logo cửa hàng"
            value={s.logo}
            set={(v: string) => set("logo", v)}
            accept="image/png,image/jpeg,image/webp"
          />
        </div>
        <div className="form-grid">
          {[
            ["name", "Tên cửa hàng"],
            ["phone", "Hotline chính"],
            ["phone_alt", "Hotline thứ hai"],
            ["zalo", "Số Zalo"],
            ["email", "Email liên hệ"],
            ["contact_name", "Tên người liên hệ"],
            ["tax_code", "Mã số thuế"],
            ["address", "Địa chỉ giao dịch"],
            ["messenger", "Liên kết Messenger (https)"],
            ["map_url", "Liên kết bản đồ (https)"],
          ].map(([k, l]) => (
            <Field key={k} label={l}>
              <input value={s[k]} onChange={(e) => set(k, e.target.value)} />
            </Field>
          ))}
        </div>
        <UploadField
          label="Ảnh người liên hệ"
          value={s.portrait}
          set={(v: string) => set("portrait", v)}
          accept="image/png,image/jpeg,image/webp"
        />
      </section>
      <section className="panel">
        <h2>02. Trang chủ & SEO</h2>
        <UploadField
          label="Ảnh thiết bị / Banner chính"
          value={s.hero_image}
          set={(v: string) => set("hero_image", v)}
          accept="image/png,image/jpeg,image/webp"
        />
        <Field label="Tiêu đề banner (xuống dòng để tách 2 dòng)">
          <textarea
            rows={2}
            value={s.hero_title}
            onChange={(e) => set("hero_title", e.target.value)}
          />
        </Field>
        <Field label="Mô tả banner">
          <textarea
            rows={2}
            value={s.hero_description}
            onChange={(e) => set("hero_description", e.target.value)}
          />
        </Field>
        <Field label="SEO title">
          <input
            value={s.seo_title}
            onChange={(e) => set("seo_title", e.target.value)}
          />
        </Field>
        <Field label="SEO description">
          <textarea
            rows={2}
            value={s.seo_description}
            onChange={(e) => set("seo_description", e.target.value)}
          />
        </Field>
      </section>
      <section className="panel">
        <h2>03. Vận chuyển</h2>
        <div className="form-grid">
          <Field label="Khu vực nội vùng">
            <input value={s.local_zone} onChange={(e) => set("local_zone", e.target.value)} />
          </Field>
          {[
            ["local_fee", "Phí nội vùng (VND)"],
            ["other_fee", "Phí khu vực khác (VND)"],
            ["free_shipping", "Miễn phí từ (VND, 0 = không áp dụng)"],
          ].map(([k, l]) => (
            <Field label={l} key={k}>
              <input
                type="number"
                min="0"
                value={s[k]}
                onChange={(e) => set(k, Number(e.target.value))}
              />
            </Field>
          ))}
        </div>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={!!s.demo}
            disabled={demo}
            onChange={(e) => set("demo", e.target.checked)}
          />
          Hiển thị thông báo dữ liệu mẫu{" "}
          {demo && "(cố định trong bản dùng thử)"}
        </label>
      </section>
      <section className="panel">
        <h2>04. Chính sách cửa hàng</h2>
        {[
          ["warranty", "Bảo hành"],
          ["shipping", "Đặt hàng & giao hàng"],
          ["privacy", "Bảo mật thông tin"],
        ].map(([k, l]) => (
          <Field key={k} label={l}>
            <textarea
              rows={4}
              value={s[k]}
              onChange={(e) => set(k, e.target.value)}
            />
          </Field>
        ))}
      </section>
      {error && <p className="error">{error}</p>}
      <div className="form-actions sticky-actions">
        <SaveButton busy={busy} label="Lưu cấu hình website" />
      </div>
    </form>
  );
}
function UsersView({ rows, actor, demo, done }: any) {
  const [v, setV] = useState<Row>({
      name: "",
      email: "",
      password: "",
      role: "sales",
    }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request("admin/users", "POST", v);
      setV({ ...v, name: "", email: "", password: "" });
      await done();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function change(u: Row, k: string, value: string) {
    try {
      await request("admin/users/" + u.id, "PATCH", {
        role: u.role,
        status: u.status,
        [k]: value,
      });
      await done();
    } catch (e: any) {
      setError(e.message);
    }
  }
  return (
    <>
      <p className="notice">
        Admin quản lý toàn bộ. Kinh doanh xử lý đơn và báo giá. Kỹ thuật viên
        sửa nội dung, thông số, tài liệu và bài viết. Khách hàng chỉ xem dữ liệu
        của mình.
      </p>
      {error && <p className="error">{error}</p>}
      <section className="panel table-panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tài khoản</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u: Row) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name}</strong>
                    <small>{u.email}</small>
                  </td>
                  <td>
                    <select
                      disabled={demo || actor.id === u.id}
                      value={u.role}
                      onChange={(e) => change(u, "role", e.target.value)}
                    >
                      {Object.entries(roles).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l as string}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      disabled={demo || actor.id === u.id}
                      value={u.status}
                      onChange={(e) => change(u, "status", e.target.value)}
                    >
                      <option value="active">Hoạt động</option>
                      <option value="disabled">Đã khóa</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {demo ? (
        <p className="notice">
          Bản thử dùng tài khoản ChatGPT. Tạo nhân sự bằng email và mật khẩu
          được hỗ trợ trong bản cài đặt PostgreSQL.
        </p>
      ) : (
        <form className="panel" onSubmit={save}>
          <h2>Tạo tài khoản</h2>
          <div className="form-grid">
            {[
              ["name", "Họ tên", "text"],
              ["email", "Email", "email"],
              ["password", "Mật khẩu (tối thiểu 12 ký tự)", "password"],
            ].map(([k, l, t]) => (
              <Field key={k} label={l}>
                <input
                  type={t}
                  required
                  minLength={k === "password" ? 12 : 2}
                  value={v[k]}
                  onChange={(e) => setV({ ...v, [k]: e.target.value })}
                />
              </Field>
            ))}
            <Field label="Vai trò">
              <select
                value={v.role}
                onChange={(e) => setV({ ...v, role: e.target.value })}
              >
                {Object.entries(roles).map(([r, l]) => (
                  <option key={r} value={r}>
                    {l as string}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <SaveButton busy={busy} label="Tạo tài khoản" />
        </form>
      )}
    </>
  );
}
function ArticleEditor({ article, close, done }: any) {
  const [v, setV] = useState<Row>(
      article || {
        title: "",
        slug: "",
        excerpt: "",
        body: "",
        category: "Hướng dẫn kỹ thuật",
        image: "/assets/plc.svg",
        status: "draft",
      },
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const set = (k: string, x: string) => setV({ ...v, [k]: x });
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request(
        "admin/articles" + (article ? "/" + article.id : ""),
        article ? "PATCH" : "POST",
        v,
      );
      await done();
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
    }
  }
  return (
    <Modal title={article ? "Sửa bài viết" : "Bài viết mới"} close={close} wide>
      <form onSubmit={save}>
        <Field label="Tiêu đề">
          <input
            required
            minLength={5}
            value={v.title}
            onChange={(e) => set("title", e.target.value)}
          />
        </Field>
        <div className="form-grid">
          <Field label="Slug">
            <input
              required
              pattern="[a-z0-9-]+"
              value={v.slug}
              onChange={(e) => set("slug", e.target.value)}
            />
          </Field>
          <Field label="Chuyên mục">
            <input
              value={v.category}
              onChange={(e) => set("category", e.target.value)}
            />
          </Field>
        </div>
        <UploadField
          label="Ảnh bài viết"
          value={v.image}
          set={(x: string) => set("image", x)}
          accept="image/png,image/jpeg,image/webp"
        />
        <Field label="Mô tả ngắn">
          <textarea
            rows={2}
            value={v.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
          />
        </Field>
        <Field label="Nội dung (văn bản; cách 1 dòng trống để chia đoạn)">
          <textarea
            rows={12}
            required
            minLength={10}
            value={v.body}
            onChange={(e) => set("body", e.target.value)}
          />
        </Field>
        <Field label="Trạng thái">
          <select
            value={v.status}
            onChange={(e) => set("status", e.target.value)}
          >
            <option value="draft">Bản nháp</option>
            <option value="published">Đăng lên website</option>
          </select>
        </Field>
        {error && <p className="error">{error}</p>}
        <div className="form-actions">
          <SaveButton busy={busy} />
        </div>
      </form>
    </Modal>
  );
}
