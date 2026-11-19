"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  Phone,
  ArrowRight,
  ArrowUpRight,
  Cpu,
  Monitor,
  Zap,
  Radio,
  Activity,
  CircuitBoard,
  Wrench,
  FileText,
  Truck,
  Plus,
  Minus,
  Check,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Mail,
  Download,
  ShieldCheck,
  SlidersHorizontal,
  ArrowLeft,
  Building2,
  ExternalLink,
} from "lucide-react";
import type { Product, Actor, Row } from "@/core/models";
import { money, normalize, normalizePart, categoryIds } from "@/core/models";
import { defaultSettings } from "@/core/seed";
import { request, Field, Spin, Badge } from "./ui";
import Admin from "./admin";
const catIcons: Row = {
  plc: Cpu,
  hmi: Monitor,
  inverter: Zap,
  sensor: Radio,
  servo: Activity,
  switchgear: CircuitBoard,
};
function contactNumbers(s: Row): string[] {
  return [...new Set([s.phone, s.phone_alt].filter(Boolean))];
}
export default function Shop({
  initialPath = "/",
  initial,
}: {
  initialPath?: string;
  initial?: any;
}) {
  const [route, setRoute] = useState(initialPath),
    [ps, setPs] = useState<Product[]>(initial?.products || []),
    [s, setS] = useState<Row>(initial?.settings || defaultSettings),
    [tax, setTax] = useState<Row>(
      initial?.taxonomy || { brands: [], categories: [] },
    ),
    [articles, setArticles] = useState<Row[]>(initial?.articles || []),
    [actor, setActor] = useState<Actor | null>(initial?.actor || null),
    [demo, setDemo] = useState(!!initial?.demo),
    [loading, setLoading] = useState(!initial),
    [error, setError] = useState(""),
    [cart, setCart] = useState<Row[]>([]),
    [ready, setReady] = useState(false),
    [search, setSearch] = useState(""),
    [menu, setMenu] = useState(false),
    [toast, setToast] = useState("");
  const timer = useRef<any>(null);
  const notify = (message: string) => {
    setToast(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 4000);
  };
  const nav = (to: string) => {
    history.pushState({}, "", to);
    setRoute(to);
    setMenu(false);
    window.scrollTo(0, 0);
  };
  async function refresh() {
    setError("");
    try {
      const me = await request("me");
      setActor(me.user);
      setDemo(me.demo);
      if (me.demo && me.user) await request("bootstrap", "POST", {});
      const [p, st, t, a] = await Promise.all([
        request("products"),
        request("settings"),
        request("taxonomy"),
        request("articles"),
      ]);
      setPs(p);
      setS(st);
      setTax(t);
      setArticles(a);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    setRoute(location.pathname + location.search);
    refresh();
    const pop = () => {
      setRoute(location.pathname + location.search);
      window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", pop);
    try {
      const v = JSON.parse(localStorage.getItem("spacetech-cart") || "[]");
      if (Array.isArray(v))
        setCart(
          v.filter(
            (x) =>
              typeof x.product_id === "string" &&
              Number.isInteger(x.quantity) &&
              x.quantity > 0,
          ),
        );
    } catch {}
    setReady(true);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem("spacetech-cart", JSON.stringify(cart));
  }, [cart, ready]);
  const Link = ({ to, children, className = "", ...rest }: any) => (
    <a
      href={to}
      className={className}
      {...rest}
      onClick={(e) => {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          nav(to);
        }
      }}
    >
      {children}
    </a>
  );
  const add = (p: Product, quantity = 1) => {
    if (p.mode === "quote") {
      nav("/bao-gia?product=" + encodeURIComponent(p.id));
      return false;
    }
    const count =
      (cart.find((x) => x.product_id === p.id)?.quantity || 0) + quantity;
    if (count > 10000 || (!p.backorder && count > p.stock - p.reserved)) {
      notify("Số lượng vượt số có thể đặt.");
      return false;
    }
    setCart((old) =>
      old.some((l) => l.product_id === p.id)
        ? old.map((l) =>
            l.product_id === p.id
              ? { ...l, quantity: l.quantity + quantity }
              : l,
          )
        : [...old, { product_id: p.id, quantity }],
    );
    notify("Đã thêm sản phẩm vào giỏ");
    return true;
  };
  const path = route.split("?")[0],
    params = new URLSearchParams(route.split("?")[1] || "");
  const Card = ({ p }: { p: Product }) => (
    <article className="product-card">
      <Link to={"/san-pham/" + p.slug} className="product-image">
        <span
          className={"stock " + (p.stock - p.reserved ? "" : "order-stock")}
        >
          <i />
          {p.stock - p.reserved
            ? p.demo
              ? "Tồn mẫu"
              : "Còn hàng"
            : "Đặt theo yêu cầu"}
        </span>
        <img src={p.image} alt={p.name} loading="lazy" />
      </Link>
      <div className="product-body">
        <div className="brand-label">{p.brand}</div>
        <Link to={"/san-pham/" + p.slug}>
          <h3>{p.name}</h3>
        </Link>
        <p className="part">{p.part_number}</p>
        <div className="spec-chips">
          {p.specs.slice(0, 2).map((x) => (
            <span key={x.key}>{x.value}</span>
          ))}
        </div>
        <div className="price-row">
          <div>
            <strong>{money(p.price)}</strong>
            <small>
              {p.demo
                ? "Giá minh họa"
                : p.mode === "quote"
                  ? "Báo giá theo số lượng"
                  : "Giá niêm yết cuối cùng"}
            </small>
          </div>
          <button aria-label={"Thêm " + p.name} onClick={() => add(p)}>
            {p.mode === "quote" ? (
              <ArrowUpRight size={19} />
            ) : (
              <Plus size={19} />
            )}
          </button>
        </div>
      </div>
    </article>
  );
  if (path.startsWith("/admin"))
    return (
      <Admin
        actor={actor}
        demo={demo}
        settings={s}
        taxonomy={tax}
        loading={loading}
        refreshShop={refresh}
        nav={nav}
        notify={notify}
        toast={toast}
      />
    );
  return (
    <>
      <div className="utility">
        <div className="container">
          <span className="utility-message">
            GIẢI PHÁP TỰ ĐỘNG HÓA CHO MỌI KẾT NỐI
          </span>
          <div className="utility-phones">
            <span>Hotline</span>
            {contactNumbers(s).map((number) => (
              <a href={"tel:" + number} key={number}>
                <Phone size={12} /> {number}
              </a>
            ))}
          </div>
        </div>
      </div>
      <header className="header">
        <div className="container header-inner">
          <Link to="/" className="logo">
            <img src={s.logo} alt="" />
            <span>
              {s.name}<small>AUTOMATION</small>
            </span>
          </Link>
          <form
            className="search"
            onSubmit={(e) => {
              e.preventDefault();
              nav("/san-pham?q=" + encodeURIComponent(search));
            }}
          >
            <Search size={19} />
            <input
              aria-label="Tìm sản phẩm"
              placeholder="Tìm tên sản phẩm, mã hàng, thương hiệu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button>Tìm kiếm</button>
          </form>
          <div className="header-actions">
            <Link to={actor ? "/tai-khoan" : "/dang-nhap"} className="account">
              <User size={21} />
              <span>
                {actor ? "Tài khoản" : "Đăng nhập"}
                <small>{actor ? actor.name.split("@")[0] : "Chào bạn!"}</small>
              </span>
            </Link>
            <Link to="/gio-hang" className="cart-link" aria-label="Giỏ hàng">
              <ShoppingCart size={23} />
              {cart.length > 0 && (
                <b>{cart.reduce((n, l) => n + l.quantity, 0)}</b>
              )}
              <span>Giỏ hàng</span>
            </Link>
            <button
              className="mobile-menu icon"
              onClick={() => setMenu(!menu)}
              aria-label="Mở menu"
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <nav className={"navigation " + (menu ? "open" : "")}>
        <div className="container">
          <Link to="/san-pham" className="all-cats">
            <Menu size={18} />
            Danh mục sản phẩm
            <ChevronRight size={14} />
          </Link>
          {[
            ["/", "Trang chủ"],
            ["/san-pham", "Sản phẩm"],
            ["/giai-phap", "Giải pháp"],
            ["/kien-thuc", "Kiến thức kỹ thuật"],
            ["/lien-he", "Giới thiệu & liên hệ"],
          ].map(([to, label]) => (
            <Link key={to} to={to} className={path === to ? "active" : ""}>
              {label}
            </Link>
          ))}
          <Link to="/bao-gia" className="nav-rfq">
            <FileText size={16} />
            Yêu cầu báo giá
          </Link>
        </div>
      </nav>

      {error ? (
        <main className="container empty">
          <h2>Chưa thể tải dữ liệu</h2>
          <p>{error}</p>
          <button className="btn primary" onClick={refresh}>
            Thử lại
          </button>
        </main>
      ) : loading ? (
        <div className="container loading">
          <Spin /> Đang tải danh mục...
        </div>
      ) : path === "/" ? (
        <>
          <section className="hero">
            <div className="container hero-grid">
              <div className="hero-copy">
                <div className="eyebrow">
                  <i />
                  {s.name}
                </div>
                <h1>
                  {s.hero_title.split("\n").map((t: string, i: number) => (
                    <React.Fragment key={i}>
                      {i > 0 && <br />}
                      <span className={i === 1 ? "accent" : ""}>{t}</span>
                    </React.Fragment>
                  ))}
                </h1>
                <p>{s.hero_description}</p>
                <div className="buttons">
                  <Link to="/san-pham" className="btn primary">
                    Khám phá sản phẩm
                    <ArrowRight size={17} />
                  </Link>
                  <Link to="/bao-gia" className="btn outline">
                    Nhận tư vấn kỹ thuật
                    <ArrowUpRight size={17} />
                  </Link>
                </div>
                <small className="hero-note">
                  <i className="dot" />
                  Tư vấn lựa chọn thiết bị theo nhu cầu dự án
                </small>
              </div>
              <div className="hero-art">
                <div className="grid-bg" />
                <div className="orbit o1" />
                <div className="orbit o2" />
                <span className="coordinate">AUTOMATION / 01</span>
                <img
                  className="hero-plc"
                  src={s.hero_image || "/assets/plc.svg"}
                  alt="Minh họa PLC S7-1200"
                />
                <div className="device-label">
                  <i className="dot" />
                  <span>
                    Điều khiển thông minh
                    <small>PLC · HMI · Motion Control</small>
                  </span>
                  <ArrowUpRight size={20} />
                </div>
                <div className="sensor-mini">
                  <img src="/assets/sensor.jpg" alt="Cảm biến công nghiệp" />
                  <span>
                    PRECISION
                    <br />
                    <strong>in every signal.</strong>
                  </span>
                </div>
                <div className="art-bottom">
                  ENGINEERED TO CONNECT <span>↗</span>
                </div>
              </div>
            </div>
          </section>
          <div className="container benefits">
            {[
              [Cpu, "Thiết bị đa dạng", "PLC, HMI, biến tần, cảm biến"],
              [Wrench, "Hỗ trợ kỹ thuật", "Trao đổi trực tiếp theo dự án"],
              [FileText, "Tài liệu sản phẩm", "Datasheet từ nhà sản xuất"],
              [Truck, "Giao nhận linh hoạt", "Xác nhận theo từng đơn hàng"],
            ].map(([Icon, t, d]: any) => (
              <div key={t}>
                <Icon size={27} />
                <span>
                  <strong>{t}</strong>
                  <small>{d}</small>
                </span>
              </div>
            ))}
          </div>
          <section className="container section">
            <div className="section-head">
              <div>
                <div className="eyebrow">TÌM ĐÚNG THIẾT BỊ</div>
                <h2>Danh mục sản phẩm</h2>
              </div>
              <Link to="/san-pham" className="text-link">
                Tất cả danh mục
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="category-grid">
              {tax.categories.map((c: Row) => {
                const Icon = catIcons[c.slug] || Cpu;
                return (
                  <Link
                    key={c.id}
                    to={"/san-pham?category=" + encodeURIComponent(c.id)}
                    className="category-card"
                  >
                    <span className="category-icon">
                      <Icon size={29} strokeWidth={1.5} />
                    </span>
                    <h3>{c.name}</h3>
                    <small>
                      {ps.filter((p) => p.category_id === c.id).length} sản phẩm
                      <ArrowUpRight size={14} />
                    </small>
                  </Link>
                );
              })}
            </div>
          </section>
          <div className="brands">
            <div className="container">
              <span>
                CÁC THƯƠNG HIỆU
                <br />
                TRONG DANH MỤC
              </span>
              <b className="siemens">SIEMENS</b>
              <b className="mitsubishi">
                ◆ MITSUBISHI<small>ELECTRIC</small>
              </b>
              <b className="omron">OMRON</b>
              <b className="schneider">
                Schneider<small>Electric</small>
              </b>
            </div>
          </div>
          <section className="container section">
            <div className="section-head">
              <div>
                <div className="eyebrow">LỰA CHỌN CHO HỆ THỐNG CỦA BẠN</div>
                <h2>
                  {ps.some((p) => Number(p.sold) > 0)
                    ? "Sản phẩm bán chạy"
                    : "Sản phẩm tiêu biểu"}
                </h2>
              </div>
              <Link to="/san-pham" className="text-link">
                Xem toàn bộ
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="product-grid">
              {[...ps]
                .sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0))
                .slice(0, 4)
                .map((p) => (
                  <Card key={p.id} p={p} />
                ))}
            </div>
          </section>
          <section className="container b2b">
            <div>
              <div className="eyebrow">DÀNH CHO KHÁCH HÀNG DOANH NGHIỆP</div>
              <h2>
                Một danh sách thiết bị.
                <br />
                Một giải pháp phù hợp.
              </h2>
              <p>
                Gửi mã hàng, số lượng và yêu cầu dự án. {s.name} hỗ trợ kiểm
                tra thông số, khả năng cung cấp và lập báo giá chi tiết.
              </p>
              <Link to="/bao-gia" className="btn yellow">
                Gửi yêu cầu báo giá
                <ArrowUpRight size={18} />
              </Link>
            </div>
            <div className="quote-preview">
              <div>
                <FileText size={26} />
                <span>
                  Yêu cầu báo giá B2B
                  <small>Được chuẩn bị cho dự án của bạn</small>
                </span>
                <ArrowUpRight size={19} />
              </div>
              {[
                "Danh sách mã hàng & số lượng",
                "Thông số kỹ thuật cần thiết",
                "Thời gian và địa chỉ nhận hàng",
              ].map((t, i) => (
                <p key={t}>
                  <span>0{i + 1}</span>
                  {t}
                  <Check size={16} />
                </p>
              ))}
              <small>
                Rõ thông số. Đúng nhu cầu.
                <i className="dot" />
              </small>
            </div>
          </section>
          <section className="container section">
            <div className="section-head">
              <div>
                <div className="eyebrow">MỚI TRONG DANH MỤC</div>
                <h2>Sản phẩm mới cập nhật</h2>
              </div>
              <Link to="/san-pham" className="text-link">
                Khám phá thêm
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="product-grid">
              {ps.slice(0, 4).map((p) => (
                <Card key={p.id} p={p} />
              ))}
            </div>
          </section>
          <section className="container section">
            <div className="section-head">
              <div>
                <div className="eyebrow">CHIA SẺ CÙNG KỸ SƯ</div>
                <h2>Góc kiến thức kỹ thuật</h2>
              </div>
              <Link to="/kien-thuc" className="text-link">
                Tất cả bài viết
                <ArrowRight size={16} />
              </Link>
            </div>
            <ArticleGrid articles={articles.slice(0, 3)} nav={nav} />
          </section>
        </>
      ) : path === "/san-pham" ? (
        <Catalog
          products={ps}
          taxonomy={tax}
          params={params}
          nav={nav}
          Card={Card}
        />
      ) : path.startsWith("/san-pham/") ? (
        <Details
          p={ps.find((p) => p.slug === path.split("/")[2])}
          products={ps}
          Card={Card}
          add={add}
          nav={nav}
        />
      ) : ["/gio-hang", "/dat-hang", "/thanh-toan"].includes(path) ? (
        <Cart
          products={ps}
          cart={cart}
          setCart={setCart}
          settings={s}
          orderForm={path !== "/gio-hang"}
          nav={nav}
          refresh={refresh}
        />
      ) : path === "/bao-gia" ? (
        <RFQ
          products={ps}
          selected={params.get("product")}
          cart={params.get("from") === "cart" ? cart : []}
          nav={nav}
          demo={demo}
          settings={s}
        />
      ) : path === "/dang-nhap" ? (
        <Login demo={demo} refresh={refresh} nav={nav} />
      ) : path === "/tai-khoan" ? (
        <Account actor={actor} demo={demo} nav={nav} refresh={refresh} />
      ) : path.startsWith("/kien-thuc") ? (
        <Knowledge articles={articles} slug={path.split("/")[2]} nav={nav} />
      ) : (
        <Info path={path} settings={s} tab={params.get("tab")} nav={nav} />
      )}
      <div className="contact-ribbon">
        <div className="container">
          <div>
            <span>
              <Phone size={24} />
            </span>
            <p>
              <strong>Cần hỗ trợ chọn đúng thiết bị?</strong>
              <small>Trao đổi cùng {s.name}.</small>
            </p>
          </div>
          <nav className="ribbon-phones" aria-label="Hotline">
            {contactNumbers(s).map((number) => (
              <a href={"tel:" + number} key={number}>
                {number}
                <ArrowUpRight size={18} />
              </a>
            ))}
          </nav>
        </div>
      </div>
      <footer>
        <div className="container footer-grid">
          <div>
            <Link to="/" className="logo">
              <img src={s.logo} alt="" />
              <span>
                {s.name}<small>AUTOMATION</small>
              </span>
            </Link>
            <p>
              Thiết bị phù hợp.
              <br />
              Kết nối bền vững. Vận hành hiệu quả.
            </p>
            <a
              target="_blank"
              rel="noreferrer"
              href={"https://zalo.me/" + s.zalo}
            >
              Liên hệ Zalo <ArrowUpRight size={14} />
            </a>
          </div>
          <div>
            <h4>Sản phẩm</h4>
            {tax.categories.slice(0, 5).map((c: Row) => (
              <Link
                key={c.id}
                to={"/san-pham?category=" + encodeURIComponent(c.id)}
              >
                {c.name}
              </Link>
            ))}
          </div>
          <div>
            <h4>Hỗ trợ khách hàng</h4>
            <Link to="/bao-gia">Yêu cầu báo giá</Link>
            <Link to="/chinh-sach?tab=shipping">Đặt hàng & giao hàng</Link>
            <Link to="/chinh-sach?tab=warranty">Chính sách bảo hành</Link>
            <Link to="/chinh-sach?tab=privacy">Bảo mật thông tin</Link>
            <Link to="/admin">Quản trị cửa hàng</Link>
          </div>
          <div>
            <h4>Kết nối với {s.name}</h4>
            {contactNumbers(s).map((number) => (
              <a href={"tel:" + number} key={number}>
                <Phone size={14} />
                {number}
              </a>
            ))}
            {s.email && (
              <a href={"mailto:" + s.email}>
                <Mail size={14} />
                <span className="contact-email">{s.email}</span>
              </a>
            )}
            <Link to="/lien-he">Giới thiệu &amp; liên hệ</Link>
            <p>
              <MapPin size={15} />
              {s.address || "Liên hệ để xác nhận địa chỉ giao dịch."}
            </p>
            {s.tax_code && <p>MST: {s.tax_code}</p>}
            {s.messenger && (
              <a href={s.messenger} target="_blank" rel="noreferrer">
                Messenger ↗
              </a>
            )}
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} {s.name}</span>
          <span>Thiết bị & giải pháp tự động hóa công nghiệp</span>
        </div>
      </footer>
      <a
        href={"https://zalo.me/" + s.zalo}
        target="_blank"
        rel="noreferrer"
        className="floating-zalo"
        aria-label="Liên hệ Zalo"
      >
        Zalo
      </a>
      {toast && (
        <div className="toast">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
    </>
  );
}
function Crumb({ items }: any) {
  return (
    <div className="crumb">
      <a href="/">Trang chủ</a>
      {items.map((t: string, i: number) => (
        <React.Fragment key={i}>
          <ChevronRight size={12} />
          <span>{t}</span>
        </React.Fragment>
      ))}
    </div>
  );
}
function Catalog({ products, taxonomy, params, nav, Card }: any) {
  const [filters, setFilters] = useState<Row>({
      q: params.get("q") || "",
      category: params.get("category") || "",
      brand: "",
      voltage: "",
      signal: "",
      protocol: "",
      power: "",
      current: "",
    }),
    [sort, setSort] = useState("default"),
    [open, setOpen] = useState(false);
  const set = (k: string, v: any) => setFilters((x: Row) => ({ ...x, [k]: v }));
  useEffect(() => {
    set("q", params.get("q") || "");
    set("category", params.get("category") || "");
  }, [params.toString()]);
  let rows = products.filter((p: Product) => {
    const f = filters;
    if (
      f.q &&
      !normalize(p.name + " " + p.brand).includes(normalize(f.q)) &&
      !normalizePart(p.part_number).includes(normalizePart(f.q)) &&
      !normalizePart(p.sku).includes(normalizePart(f.q))
    )
      return false;
    if (
      (f.brand && p.brand_id !== f.brand) ||
      (f.category &&
        !categoryIds(f.category, taxonomy.categories).has(p.category_id))
    )
      return false;
    if (
      f.voltage &&
      !p.specs.some(
        (s) =>
          s.key === "voltage" &&
          s.min != null &&
          s.max != null &&
          Number(f.voltage) >= s.min &&
          Number(f.voltage) <= s.max,
      )
    )
      return false;
    return ["signal", "protocol", "power", "current"].every(
      (k) => !f[k] || p.specs.some((s) => s.key === k && s.value === f[k]),
    );
  });
  if (sort === "asc")
    rows = [...rows].sort(
      (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity),
    );
  if (sort === "desc")
    rows = [...rows].sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
  if (sort === "name")
    rows = [...rows].sort((a, b) => a.name.localeCompare(b.name, "vi"));
  const reset = () => {
    setFilters({
      q: "",
      category: "",
      brand: "",
      voltage: "",
      signal: "",
      protocol: "",
      power: "",
      current: "",
    });
    nav("/san-pham");
  };
  return (
    <main className="container page">
      <Crumb items={["Sản phẩm"]} />
      <div className="page-heading">
        <div className="eyebrow">CATALOG / SpaceTech</div>
        <h1>Thiết bị cho mọi kết nối.</h1>
        <p>
          Tìm theo mã hàng, thương hiệu và thông số phù hợp với hệ thống của
          bạn.
        </p>
      </div>
      <div className="catalog">
        <aside className={"filters " + (open ? "visible" : "")}>
          <div className="filter-head">
            <SlidersHorizontal size={18} />
            <strong>Bộ lọc sản phẩm</strong>
            <button onClick={reset}>Xóa</button>
          </div>
          <Field label="Mã hàng / Tên sản phẩm">
            <input
              value={filters.q}
              placeholder="Ví dụ: 6ES7214..."
              onChange={(e) => set("q", e.target.value)}
            />
          </Field>
          {[
            ["category", "Danh mục", taxonomy.categories],
            ["brand", "Thương hiệu", taxonomy.brands],
          ].map(([k, l, list]: any) => (
            <Field key={k} label={l}>
              <select
                value={filters[k]}
                onChange={(e) => set(k, e.target.value)}
              >
                <option value="">Tất cả</option>
                {list.map((x: Row) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </Field>
          ))}
          <Field label="Điện áp nguồn cần dùng (V)">
            <input
              type="number"
              min="0"
              value={filters.voltage}
              onChange={(e) => set("voltage", e.target.value)}
              placeholder="Ví dụ: 24"
            />
          </Field>
          {[
            ["signal", "Loại tín hiệu"],
            ["protocol", "Truyền thông"],
            ["power", "Công suất"],
            ["current", "Dòng điện"],
          ].map(([k, l]) => (
            <Field key={k} label={l}>
              <select
                value={filters[k]}
                onChange={(e) => set(k, e.target.value)}
              >
                <option value="">Tất cả</option>
                {Array.from(
                  new Set<string>(
                    products.flatMap((p: Product) =>
                      p.specs.filter((s) => s.key === k).map((s) => s.value),
                    ),
                  ),
                ).map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </Field>
          ))}
          <div className="filter-help">
            <Wrench size={25} />
            <strong>Chưa tìm thấy mã?</strong>
            <p>Gửi yêu cầu để được hỗ trợ lựa chọn.</p>
            <button className="text-link" onClick={() => nav("/bao-gia")}>
              Liên hệ kỹ thuật ↗
            </button>
          </div>
        </aside>
        <section>
          <div className="catalog-toolbar">
            <span>
              <strong>{rows.length}</strong> sản phẩm
            </span>
            <button
              className="btn outline mobile-filter"
              onClick={() => setOpen(!open)}
            >
              <SlidersHorizontal size={15} />
              Bộ lọc
            </button>
            <select
              aria-label="Sắp xếp"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="default">Mặc định</option>
              <option value="asc">Giá tăng dần</option>
              <option value="desc">Giá giảm dần</option>
              <option value="name">Tên A–Z</option>
            </select>
          </div>
          {rows.length ? (
            <div className="product-grid catalog-grid">
              {rows.map((p: Product) => (
                <Card key={p.id} p={p} />
              ))}
            </div>
          ) : (
            <div className="empty">
              <Search size={40} />
              <h2>Chưa có sản phẩm phù hợp</h2>
              <p>Thử bỏ bớt bộ lọc hoặc gửi mã hàng cho SpaceTech.</p>
              <button className="btn primary" onClick={reset}>
                Xóa bộ lọc
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
function Details({ p, products, Card, add, nav }: any) {
  const [qty, setQty] = useState(1),
    [tab, setTab] = useState("specs");
  useEffect(() => {
    setQty(1);
    setTab("specs");
  }, [p?.id]);
  if (!p)
    return (
      <main className="container empty">
        <h1>Không tìm thấy sản phẩm</h1>
        <button className="btn primary" onClick={() => nav("/san-pham")}>
          Xem danh mục
        </button>
      </main>
    );
  return (
    <main className="container page">
      <Crumb items={["Sản phẩm", p.category, p.part_number]} />
      <div className="detail-grid">
        <div>
          <div className="detail-image">
            <span className="brand-label">{p.brand}</span>
            <img src={p.image} alt={p.name} />
            <small>Hình minh họa / ảnh đại diện dòng sản phẩm</small>
          </div>
          <p className="detail-image-note">
            <ShieldCheck size={18} />
            Đối chiếu đúng mã hàng và datasheet trước khi lựa chọn.
          </p>
        </div>
        <section className="detail-summary">
          <div className="eyebrow">
            {p.brand} / {p.category}
          </div>
          <h1>{p.name}</h1>
          <p className="part">
            Mã hàng: <strong>{p.part_number}</strong> <span>SKU: {p.sku}</span>
          </p>
          <div className="stock-line">
            <i className="dot" />
            {p.stock - p.reserved
              ? `${p.demo ? "Tồn mẫu" : "Còn hàng"}: ${p.stock - p.reserved} sản phẩm`
              : "Liên hệ kiểm tra khả năng cung cấp"}
          </div>
          <div className="detail-price">
            <strong>{money(p.price)}</strong>
            <small>
              {p.demo
                ? "Giá minh họa cho bản dùng thử"
                : "Giá bán niêm yết cuối cùng"}
            </small>
          </div>
          <p className="description">{p.description}</p>
          <div className="quick-specs">
            {p.specs.slice(0, 3).map((x: Row) => (
              <div key={x.key}>
                <span>{x.label}</span>
                <strong>{x.value}</strong>
              </div>
            ))}
          </div>
          <div className="buy-row">
            <Quantity value={qty} set={setQty} />
            <button className="btn primary" onClick={() => add(p, qty)}>
              {p.mode === "quote" ? (
                <FileText size={17} />
              ) : (
                <ShoppingCart size={17} />
              )}{" "}
              {p.mode === "quote" ? "Liên hệ báo giá" : "Thêm vào giỏ"}
            </button>
          </div>
          {p.mode === "fixed" && (
            <button
              className="btn yellow full"
              onClick={() => {
                if (add(p, qty)) nav("/dat-hang");
              }}
            >
              Đặt hàng
              <ArrowRight size={17} />
            </button>
          )}
          <button
            className="detail-rfq"
            onClick={() => nav("/bao-gia?product=" + encodeURIComponent(p.id))}
          >
            <Building2 size={18} />
            Mua số lượng lớn? Yêu cầu báo giá B2B
            <ChevronRight size={15} />
          </button>
          {p.datasheet && (
            <a
              className="datasheet"
              href={p.datasheet}
              target="_blank"
              rel="noreferrer"
            >
              <FileText size={23} />
              <span>
                Tài liệu kỹ thuật<small>Datasheet / Catalog nhà sản xuất</small>
              </span>
              <Download size={20} />
            </a>
          )}
        </section>
      </div>
      <section className="detail-tabs">
        <div className="tabs">
          {[
            ["specs", "Thông số kỹ thuật"],
            ["description", "Thông tin sản phẩm"],
            ["support", "Bảo hành & hỗ trợ"],
          ].map(([v, l]) => (
            <button
              className={tab === v ? "selected" : ""}
              key={v}
              onClick={() => setTab(v)}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="tab-body">
          {tab === "specs" ? (
            <>
              <h2>Thông số {p.part_number}</h2>
              <table className="spec-table">
                <tbody>
                  {p.specs.map((x: Row) => (
                    <tr key={x.key}>
                      <th>{x.label}</th>
                      <td>{x.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <a
                className="text-link"
                href={p.source}
                target="_blank"
                rel="noreferrer"
              >
                Đối chiếu nhà sản xuất
                <ExternalLink size={14} />
              </a>
            </>
          ) : (
            <>
              <h2>
                {tab === "description"
                  ? "Thông tin thiết bị"
                  : "Bảo hành & hỗ trợ"}
              </h2>
              <p>
                {tab === "description"
                  ? p.description
                  : "Thời hạn bảo hành, thời gian giao hàng và phụ kiện đi kèm được xác nhận trong báo giá chính thức."}
              </p>
            </>
          )}
        </div>
      </section>
      <section className="section">
        <div className="section-head">
          <h2>Khám phá thêm thiết bị</h2>
        </div>
        <div className="product-grid">
          {products
            .filter((x: Product) => x.id !== p.id)
            .slice(0, 4)
            .map((x: Product) => (
              <Card key={x.id} p={x} />
            ))}
        </div>
      </section>
    </main>
  );
}
function Quantity({ value, set }: any) {
  return (
    <div className="quantity">
      <button
        type="button"
        aria-label="Giảm số lượng"
        onClick={() => set(Math.max(1, value - 1))}
      >
        <Minus size={14} />
      </button>
      <input
        aria-label="Số lượng"
        type="number"
        min="1"
        max="10000"
        value={value}
        onChange={(e) =>
          set(Math.max(1, Math.min(10000, Number(e.target.value) || 1)))
        }
      />
      <button
        type="button"
        aria-label="Tăng số lượng"
        onClick={() => set(Math.min(10000, value + 1))}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
function CustomerForm({ value, set, address = false }: any) {
  const input = (
    k: string,
    placeholder = "",
    required = false,
    type = "text",
  ) => (
    <input
      type={type}
      required={required}
      value={value[k] || ""}
      placeholder={placeholder}
      onChange={(e) => set({ ...value, [k]: e.target.value })}
    />
  );
  return (
    <div className="form-grid">
      <Field label="Họ và tên *">{input("name", "Người liên hệ", true)}</Field>
      <Field label="Số điện thoại *">
        {input("phone", "09xx xxx xxx", true, "tel")}
      </Field>
      <Field label="Email">
        {input("email", "Email liên hệ", false, "email")}
      </Field>
      <Field label="Công ty">{input("company", "Tên doanh nghiệp")}</Field>
      <Field label="Mã số thuế">
        {input("tax_code", "Nếu cần xuất hóa đơn")}
      </Field>
      <Field label="Tỉnh / Thành phố">
        <select
          value={value.zone || ""}
          required={address}
          onChange={(e) => set({ ...value, zone: e.target.value })}
        >
          <option value="">Chọn khu vực</option>
          <option>Hồ Chí Minh</option>
          <option>Hà Nội</option>
          <option>Đà Nẵng</option>
          <option>Tỉnh / thành khác</option>
        </select>
      </Field>
      <Field label={address ? "Địa chỉ giao hàng đầy đủ *" : "Địa chỉ"} wide>
        {input("address", "Số nhà, đường, phường/xã, tỉnh/thành", address)}
      </Field>
    </div>
  );
}
function Cart({
  products,
  cart,
  setCart,
  settings: s,
  orderForm,
  nav,
  refresh,
}: any) {
  const [c, setC] = useState<Row>({
      name: "",
      phone: "",
      email: "",
      company: "",
      tax_code: "",
      address: "",
      zone: "Hồ Chí Minh",
      note: "",
    }),
    [price, setPrice] = useState<Row | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState<Row | null>(null);
  const key = useRef("");
  useEffect(() => {
    key.current = crypto.randomUUID();
  }, []);
  useEffect(() => {
    let active = true;
    setPrice(null);
    setError("");
    if (cart.length)
      request("cart-price", "POST", { items: cart, zone: c.zone })
        .then((p) => {
          if (active) setPrice(p);
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    return () => {
      active = false;
    };
  }, [JSON.stringify(cart), c.zone, products]);
  const items = cart.map((l: Row) => ({
    ...l,
    p: products.find((p: Product) => p.id === l.product_id),
  }));
  const subtotal = items.reduce(
    (n: number, l: any) => n + (l.p?.price || 0) * l.quantity,
    0,
  );
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!price) return;
    setBusy(true);
    setError("");
    try {
      const o = await request("orders", "POST", {
        customer: c,
        items: cart,
        key: key.current,
        expected_total: price.total,
      });
      setSuccess(o);
      setCart([]);
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (success)
    return (
      <main className="container success">
        <CheckCircle2 size={55} />
        <div className="eyebrow">
          {s.demo ? "ĐƠN THỬ NGHIỆM" : "ĐÃ TIẾP NHẬN"}
        </div>
        <h1>Cảm ơn bạn đã chọn SpaceTech.</h1>
        <p>
          Mã yêu cầu của bạn: <strong>{success.number}</strong>
        </p>
        <p>
          Tổng dự kiến: <strong>{money(success.total)}</strong>
        </p>
        <p>
          {s.demo
            ? "Yêu cầu thử đã được lưu trong mục Đơn hàng của bản dùng thử."
            : "Yêu cầu đã được gửi đến SpaceTech. Cửa hàng sẽ liên hệ bạn để xác nhận."}
        </p>
        <button className="btn primary" onClick={() => nav("/san-pham")}>
          Tiếp tục xem sản phẩm
          <ArrowRight size={17} />
        </button>
      </main>
    );
  return (
    <main className="container page">
      <Crumb items={[orderForm ? "Gửi yêu cầu đặt hàng" : "Giỏ hàng"]} />
      <div className="page-heading">
        <div className="eyebrow">THIẾT BỊ BẠN ĐÃ CHỌN</div>
        <h1>{orderForm ? "Gửi yêu cầu đặt hàng" : "Giỏ hàng của bạn"}</h1>
      </div>
      {!cart.length ? (
        <div className="empty">
          <ShoppingCart size={44} />
          <h2>Giỏ hàng đang trống</h2>
          <p>Khám phá thiết bị phù hợp với hệ thống của bạn.</p>
          <button className="btn primary" onClick={() => nav("/san-pham")}>
            Khám phá sản phẩm
            <ArrowRight size={17} />
          </button>
        </div>
      ) : (
        <form className="cart-layout" onSubmit={submit}>
          <section className="panel">
            {orderForm ? (
              <>
                <h2>Thông tin nhận hàng</h2>
                <CustomerForm value={c} set={setC} address />
                <Field label="Ghi chú đơn hàng">
                  <textarea
                    rows={3}
                    value={c.note}
                    onChange={(e) => setC({ ...c, note: e.target.value })}
                  />
                </Field>
                <p className="notice">
                  SpaceTech tiếp nhận yêu cầu và liên hệ xác nhận giá, tồn kho
                  và thời gian giao hàng.
                </p>
              </>
            ) : (
              <>
                <div className="panel-head">
                  <h2>Sản phẩm</h2>
                  <span>{cart.length} mã hàng</span>
                </div>
                {items.map((l: any) => (
                  <div key={l.product_id} className="cart-item">
                    <img src={l.p?.image || "/assets/plc.svg"} alt="" />
                    <div>
                      <small className="brand-label">{l.p?.brand}</small>
                      <h3>{l.p?.name || "Sản phẩm không còn khả dụng"}</h3>
                      <p className="part">{l.p?.part_number}</p>
                      <button
                        className="remove"
                        type="button"
                        onClick={() =>
                          setCart(
                            cart.filter(
                              (x: Row) => x.product_id !== l.product_id,
                            ),
                          )
                        }
                      >
                        Xóa sản phẩm
                      </button>
                    </div>
                    <div>
                      <strong>{money(l.p?.price)}</strong>
                      <Quantity
                        value={l.quantity}
                        set={(quantity: number) =>
                          setCart(
                            cart.map((x: Row) =>
                              x.product_id === l.product_id
                                ? { ...x, quantity }
                                : x,
                            ),
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="text-link"
                  onClick={() => nav("/san-pham")}
                >
                  <ArrowLeft size={15} />
                  Tiếp tục chọn sản phẩm
                </button>
              </>
            )}
          </section>
          <aside className="panel summary">
            <h2>Tóm tắt yêu cầu</h2>
            {orderForm &&
              items.map((l: any) => (
                <div className="summary-row" key={l.product_id}>
                  <span>
                    {l.p?.part_number} × {l.quantity}
                  </span>
                  <strong>{money((l.p?.price || 0) * l.quantity)}</strong>
                </div>
              ))}
            <div className="summary-row">
              <span>Tiền hàng</span>
              <strong>{money(price?.subtotal ?? subtotal)}</strong>
            </div>
            {!orderForm && (
              <Field label="Khu vực nhận hàng">
                <select
                  value={c.zone}
                  onChange={(e) => setC({ ...c, zone: e.target.value })}
                >
                  <option>Hồ Chí Minh</option>
                  <option>Hà Nội</option>
                  <option>Đà Nẵng</option>
                  <option>Tỉnh / thành khác</option>
                </select>
              </Field>
            )}
            <div className="summary-row">
              <span>Phí vận chuyển dự kiến</span>
              <strong>{price ? money(price.shipping) : "Đang tính..."}</strong>
            </div>
            <div className="total-row">
              <span>Tổng dự kiến</span>
              <strong>{money(price?.total ?? subtotal)}</strong>
            </div>
            {s.demo && (
              <p className="notice">
                Giá, tồn kho và phí giao hàng là dữ liệu minh họa.
              </p>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            {orderForm ? (
              <>
                <label className="checkbox">
                  <input required type="checkbox" />
                  Tôi đồng ý gửi thông tin để SpaceTech liên hệ xác nhận yêu cầu.
                </label>
                <button
                  className="btn primary full"
                  disabled={busy || !price || !!error}
                >
                  {busy ? <Spin /> : <Check size={17} />}{" "}
                  {s.demo ? "Gửi yêu cầu thử" : "Gửi yêu cầu đặt hàng"}
                </button>
                <button
                  type="button"
                  className="text-link center"
                  onClick={() => nav("/gio-hang")}
                >
                  Quay lại giỏ hàng
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn primary full"
                  disabled={!price || !!error}
                  onClick={() => nav("/dat-hang")}
                >
                  Tiếp tục đặt hàng
                  <ArrowRight size={17} />
                </button>
                <button
                  type="button"
                  className="btn outline full"
                  onClick={() => nav("/bao-gia?from=cart")}
                >
                  Yêu cầu báo giá giỏ hàng
                </button>
              </>
            )}
            <small className="summary-note">
              <ShieldCheck size={15} />
              Giá và phí giao hàng sẽ được xác nhận khi cửa hàng liên hệ.
            </small>
          </aside>
        </form>
      )}
    </main>
  );
}
function RFQ({ products, selected, cart, nav, demo, settings }: any) {
  const initial = selected ? [{ product_id: selected, quantity: 1 }] : cart;
  const [items, setItems] = useState<Row[]>(
      initial.map((l: Row) => {
        const p = products.find((p: Product) => p.id === l.product_id);
        return {
          product_id: p?.id,
          part_number: p?.part_number || "",
          name: p?.name || "",
          quantity: l.quantity,
          note: "",
        };
      }),
    ),
    [c, setC] = useState<Row>({
      name: "",
      phone: "",
      email: "",
      company: "",
      tax_code: "",
      address: "",
      zone: "",
    }),
    [pick, setPick] = useState(""),
    [note, setNote] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [success, setSuccess] = useState<Row | null>(null);
  const add = () => {
    const p = products.find((p: Product) => p.id === pick);
    setItems([
      ...items,
      {
        product_id: p?.id,
        part_number: p?.part_number || "",
        name: p?.name || "",
        quantity: 1,
        note: "",
      },
    ]);
    setPick("");
  };
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      setSuccess(await request("rfqs", "POST", { customer: c, items, note }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (success)
    return (
      <main className="container success">
        <CheckCircle2 size={55} />
        <h1>Đã tiếp nhận yêu cầu của bạn.</h1>
        <p>
          Mã yêu cầu: <strong>{success.number}</strong>
        </p>
        <p>
          {demo
            ? "Mở Admin → Báo giá B2B để nhập giá và xuất PDF."
            : "SpaceTech sẽ liên hệ để xác nhận thông số và khả năng cung cấp."}
        </p>
        <button
          className="btn primary"
          onClick={() => nav(demo ? "/admin" : "/san-pham")}
        >
          {demo ? "Mở trang quản trị" : "Tiếp tục xem sản phẩm"}
          <ArrowRight size={17} />
        </button>
      </main>
    );
  return (
    <main className="container page">
      <Crumb items={["Yêu cầu báo giá"]} />
      <div className="page-heading">
        <div className="eyebrow">RFQ / KHÁCH HÀNG DOANH NGHIỆP</div>
        <h1>
          Chia sẻ nhu cầu.
          <br />
          Cùng tìm giải pháp.
        </h1>
        <p>
          Gửi mã hàng và số lượng cần mua để nhận thông tin phù hợp cho dự án.
        </p>
      </div>
      <div className="rfq-layout">
        <form className="panel" onSubmit={submit}>
          <h2>01. Thông tin liên hệ</h2>
          <CustomerForm value={c} set={setC} />
          <h2 className="form-heading">02. Danh sách thiết bị</h2>
          <div className="add-row">
            <select
              value={pick}
              aria-label="Chọn sản phẩm"
              onChange={(e) => setPick(e.target.value)}
            >
              <option value="">Nhập mã chưa có trong danh mục</option>
              {products.map((p: Product) => (
                <option key={p.id} value={p.id}>
                  {p.part_number} — {p.name}
                </option>
              ))}
            </select>
            <button type="button" className="btn outline" onClick={add}>
              <Plus size={15} />
              Thêm dòng
            </button>
          </div>
          {!items.length && (
            <p className="notice">Bấm “Thêm dòng” để nhập mã cần báo giá.</p>
          )}
          {items.map((x, i) => (
            <div className="rfq-item" key={i}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <input
                  aria-label="Mã hàng"
                  required
                  readOnly={!!x.product_id}
                  value={x.part_number}
                  placeholder="Mã hàng / Part Number *"
                  onChange={(e) =>
                    setItems(
                      items.map((v, j) =>
                        j === i ? { ...v, part_number: e.target.value } : v,
                      ),
                    )
                  }
                />
                <input
                  aria-label="Ghi chú thiết bị"
                  readOnly={!!x.product_id}
                  value={x.product_id ? x.name : x.note}
                  placeholder="Hãng / Thông số / Ghi chú"
                  onChange={(e) =>
                    setItems(
                      items.map((v, j) =>
                        j === i ? { ...v, note: e.target.value } : v,
                      ),
                    )
                  }
                />
              </div>
              <input
                aria-label="Số lượng báo giá"
                type="number"
                min="1"
                max="10000"
                required
                value={x.quantity}
                onChange={(e) =>
                  setItems(
                    items.map((v, j) =>
                      j === i ? { ...v, quantity: Number(e.target.value) } : v,
                    ),
                  )
                }
              />
              <button
                type="button"
                className="icon"
                aria-label="Xóa dòng"
                onClick={() => setItems(items.filter((_, j) => j !== i))}
              >
                <X size={17} />
              </button>
            </div>
          ))}
          <Field label="03. Yêu cầu thêm">
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Thời gian cần hàng, yêu cầu kỹ thuật, bảo hành..."
            />
          </Field>
          {error && <p className="error">{error}</p>}
          <button disabled={busy || !items.length} className="btn primary">
            {busy ? <Spin /> : <FileText size={17} />}Gửi yêu cầu báo giá
            <ArrowRight size={17} />
          </button>
        </form>
        <aside className="rfq-aside">
          <div className="eyebrow">THÔNG TIN RÕ RÀNG HƠN</div>
          <h2>
            Đúng mã hàng.
            <br />
            Đúng nhu cầu.
          </h2>
          {[
            ["01", "Gửi yêu cầu", "Cung cấp mã thiết bị và số lượng."],
            [
              "02",
              "Kiểm tra thông số",
              "Trao đổi phương án và khả năng cung cấp.",
            ],
            ["03", "Nhận báo giá", "Giá, thời gian giao và điều kiện cụ thể."],
          ].map(([n, t, d]) => (
            <div className="rfq-step" key={n}>
              <span>{n}</span>
              <div>
                <strong>{t}</strong>
                <p>{d}</p>
              </div>
            </div>
          ))}
          <a
            className="btn outline full"
            href={"https://zalo.me/" + settings.zalo}
            target="_blank"
            rel="noreferrer"
          >
            Trao đổi qua Zalo
            <ArrowUpRight size={16} />
          </a>
        </aside>
      </div>
    </main>
  );
}
function Login({ demo, refresh, nav }: any) {
  const [v, setV] = useState({ name: "", email: "", password: "" }),
    [register, setRegister] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (register) await request("register", "POST", v);
      await request("login", "POST", v);
      await refresh();
      nav("/tai-khoan");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="container login-layout">
      <section>
        <div className="eyebrow">WELCOME TO SpaceTech</div>
        <h1>
          Kết nối với
          <br />
          hệ thống của bạn.
        </h1>
        <p>Theo dõi đơn hàng và yêu cầu báo giá trong cùng một tài khoản.</p>
        <img src="/assets/hmi.svg" alt="Minh họa HMI" />
      </section>
      <div className="panel">
        <h2>{register ? "Tạo tài khoản" : "Chào mừng trở lại"}</h2>
        {demo ? (
          <>
            <p>
              Bản dùng thử sử dụng tài khoản ChatGPT để giữ dữ liệu trong không
              gian riêng của bạn.
            </p>
            <a
              href="/signin-with-chatgpt?return_to=/admin"
              target="_top"
              className="btn primary full"
            >
              Tiếp tục bằng ChatGPT
              <ArrowRight size={17} />
            </a>
          </>
        ) : (
          <form onSubmit={submit}>
            {register && (
              <Field label="Họ tên">
                <input
                  required
                  value={v.name}
                  onChange={(e) => setV({ ...v, name: e.target.value })}
                />
              </Field>
            )}
            <Field label="Email">
              <input
                type="email"
                autoComplete="email"
                required
                value={v.email}
                onChange={(e) => setV({ ...v, email: e.target.value })}
              />
            </Field>
            <Field
              label="Mật khẩu"
              hint={register ? "Ít nhất 12 ký tự." : null}
            >
              <input
                type="password"
                autoComplete={register ? "new-password" : "current-password"}
                required
                minLength={register ? 12 : undefined}
                value={v.password}
                onChange={(e) => setV({ ...v, password: e.target.value })}
              />
            </Field>
            {error && <p className="error">{error}</p>}
            <button disabled={busy} className="btn primary full">
              {busy && <Spin />}
              {register ? "Tạo tài khoản" : "Đăng nhập"}
              <ArrowRight size={17} />
            </button>
            <button
              type="button"
              className="text-link center"
              onClick={() => setRegister(!register)}
            >
              {register
                ? "Đã có tài khoản? Đăng nhập"
                : "Chưa có tài khoản? Đăng ký"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
function Account({ actor, demo, nav, refresh }: any) {
  const [data, setData] = useState<any>(null),
    [error, setError] = useState("");
  useEffect(() => {
    if (actor)
      request("account")
        .then(setData)
        .catch((e) => setError(e.message));
  }, [actor]);
  if (!actor)
    return (
      <main className="container empty">
        <User size={45} />
        <h1>Đăng nhập để xem tài khoản</h1>
        <button className="btn primary" onClick={() => nav("/dang-nhap")}>
          Đăng nhập
        </button>
      </main>
    );
  return (
    <main className="container page">
      <div className="page-heading">
        <div className="eyebrow">TÀI KHOẢN CỦA BẠN</div>
        <h1>Xin chào, {actor.name}.</h1>
        <p>{actor.email}</p>
      </div>
      <div className="buttons">
        {actor.role !== "customer" && (
          <button className="btn primary" onClick={() => nav("/admin")}>
            Quản trị cửa hàng
            <ArrowUpRight size={17} />
          </button>
        )}
        {demo ? (
          <a
            href="/signout-with-chatgpt?return_to=/"
            target="_top"
            className="btn outline"
          >
            Đăng xuất
          </a>
        ) : (
          <button
            className="btn outline"
            onClick={async () => {
              await request("logout", "POST", {});
              await refresh();
              nav("/");
            }}
          >
            Đăng xuất
          </button>
        )}
      </div>
      {error && <p className="error">{error}</p>}
      <section className="section">
        <h2>Đơn hàng của bạn</h2>
        {data?.orders?.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                  <th>Tổng tiền</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((o: Row) => (
                  <tr key={o.id}>
                    <td>{o.number}</td>
                    <td>
                      {new Date(Number(o.created)).toLocaleDateString("vi-VN")}
                    </td>
                    <td>
                      <Badge value={o.status} />
                    </td>
                    <td>{money(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="notice">Bạn chưa có đơn hàng.</p>
        )}
        <h2>Yêu cầu báo giá</h2>
        {data?.rfqs?.length ? (
          data.rfqs.map((r: Row) => (
            <div className="summary-row" key={r.id}>
              <strong>{r.number}</strong>
              <Badge value={r.status} />
            </div>
          ))
        ) : (
          <p className="notice">Bạn chưa gửi yêu cầu báo giá.</p>
        )}
      </section>
    </main>
  );
}
function ArticleGrid({ articles, nav }: any) {
  return (
    <div className="article-grid">
      {articles.map((a: Row, i: number) => (
        <button
          className="article-card"
          key={a.id}
          onClick={() => nav("/kien-thuc/" + a.slug)}
        >
          <div className={"article-image a" + i}>
            <img src={a.image} alt="" />
            <span>TECHNICAL NOTES / 0{i + 1}</span>
          </div>
          <div className="article-info">
            <small>{a.category}</small>
            <h3>{a.title}</h3>
            <p>{a.excerpt}</p>
            <span className="text-link">
              Đọc bài viết
              <ArrowUpRight size={15} />
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
function Knowledge({ articles, slug, nav }: any) {
  if (slug) {
    const a = articles.find((x: Row) => x.slug === slug);
    return (
      <main className="container page article-page">
        <Crumb items={["Kiến thức kỹ thuật", a?.title || "Không tìm thấy"]} />
        {a ? (
          <>
            <div className="eyebrow">{a.category}</div>
            <h1>{a.title}</h1>
            <p className="lead">{a.excerpt}</p>
            <img className="article-cover" src={a.image} alt="" />
            <div className="prose">
              {a.body.split("\n\n").map((t: string, i: number) => (
                <p key={i}>{t}</p>
              ))}
            </div>
            <button className="btn outline" onClick={() => nav("/kien-thuc")}>
              <ArrowLeft size={16} />
              Tất cả bài viết
            </button>
          </>
        ) : (
          <h1>Không tìm thấy bài viết</h1>
        )}
      </main>
    );
  }
  return (
    <main className="container page">
      <div className="page-heading">
        <div className="eyebrow">SpaceTech / TECHNICAL NOTES</div>
        <h1>Kiến thức kỹ thuật</h1>
        <p>Thông tin để lựa chọn thiết bị có cơ sở hơn.</p>
      </div>
      <ArticleGrid articles={articles} nav={nav} />
    </main>
  );
}
function Info({ path, settings: s, tab, nav }: any) {
  if (!["/lien-he", "/giai-phap", "/chinh-sach"].includes(path))
    return (
      <main className="container empty">
        <h1>Không tìm thấy trang</h1>
        <button className="btn primary" onClick={() => nav("/")}>
          Về trang chủ
        </button>
      </main>
    );
  return (
    <main className="container page">
      <div className="page-heading">
        <div className="eyebrow">{s.name}</div>
        <h1>
          {path === "/giai-phap"
            ? "Từ thiết bị đến giải pháp."
            : path === "/lien-he"
              ? "Giới thiệu & liên hệ"
              : "Thông tin & chính sách"}
        </h1>
      </div>
      {path === "/chinh-sach" ? (
        <div className="panel prose">
          <h2>
            {tab === "shipping"
              ? "Đặt hàng & giao hàng"
              : tab === "privacy"
                ? "Bảo mật thông tin"
                : "Bảo hành & hỗ trợ"}
          </h2>
          <p>
            {
              s[
                tab === "shipping"
                  ? "shipping"
                  : tab === "privacy"
                    ? "privacy"
                    : "warranty"
              ]
            }
          </p>
        </div>
      ) : path === "/giai-phap" ? (
        <>
          <div className="two-col">
            {[
              [
                Cpu,
                "Điều khiển máy & dây chuyền",
                "Xác định I/O và lựa chọn PLC, module theo yêu cầu.",
              ],
              [
                Activity,
                "Điều khiển động cơ",
                "Trao đổi công suất, tải và phương pháp điều khiển biến tần / servo.",
              ],
              [
                Monitor,
                "Giao diện vận hành",
                "Lựa chọn HMI và giao thức kết nối phù hợp.",
              ],
              [
                Radio,
                "Cảm biến & thu thập tín hiệu",
                "Đối chiếu tín hiệu, môi trường và phương pháp lắp.",
              ],
            ].map(([Icon, t, d]: any) => (
              <div className="panel solution" key={t}>
                <Icon size={34} />
                <h2>{t}</h2>
                <p>{d}</p>
              </div>
            ))}
          </div>
          <button className="btn primary" onClick={() => nav("/bao-gia")}>
            Trao đổi nhu cầu dự án
            <ArrowUpRight size={17} />
          </button>
        </>
      ) : (
        <div className="two-col contact-grid">
          <div className="panel contact-panel">
            <div className="contact-brand">
              <img src={s.logo} alt="" width={70} height={70} />
              <div>
                <h2>{s.name}</h2>
                <p>Thiết bị và giải pháp tự động hóa công nghiệp</p>
              </div>
            </div>
            <p>Trao đổi về mã thiết bị, thông số và nhu cầu của dự án.</p>
            <div className="contact-links">
              {contactNumbers(s).map((number) => (
                <a href={"tel:" + number} key={number}>
                  <Phone size={17} />
                  {number}
                </a>
              ))}
              {s.email && (
                <a href={"mailto:" + s.email}>
                  <Mail size={17} />
                  <span className="contact-email">{s.email}</span>
                </a>
              )}
            </div>
            <a
              className="btn primary"
              href={"https://zalo.me/" + s.zalo}
              target="_blank"
              rel="noreferrer"
            >
              Nhắn tin Zalo
              <ArrowUpRight size={17} />
            </a>
            <p>
              <MapPin size={17} />
              {s.address || "Địa chỉ giao dịch sẽ được cửa hàng cập nhật."}
            </p>
            {s.map_url && (
              <a
                href={s.map_url}
                target="_blank"
                rel="noreferrer"
                className="text-link"
              >
                Mở bản đồ
                <ExternalLink size={14} />
              </a>
            )}
          </div>
          {(s.portrait || s.contact_name) && (
            <figure className="panel contact-profile">
              {s.portrait && (
                <img
                  src={s.portrait}
                  alt={s.contact_name ? "Chân dung " + s.contact_name : "Người liên hệ"}
                  width={317}
                  height={321}
                />
              )}
              <figcaption>
                <div className="eyebrow">NGƯỜI LIÊN HỆ</div>
                <h2>{s.contact_name || s.name}</h2>
              </figcaption>
            </figure>
          )}
          <div className="panel contact-note contact-rfq">
            <FileText size={40} />
            <h2>Có danh sách mã hàng?</h2>
            <p>
              Gửi danh sách và số lượng để chúng tôi chuẩn bị báo giá rõ ràng
              cho bạn.
            </p>
            <button className="btn outline" onClick={() => nav("/bao-gia")}>
              Gửi yêu cầu báo giá
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
