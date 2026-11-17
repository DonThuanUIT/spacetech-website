import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { regular, bold, logo, spaceTechLogo } from "./pdf-assets";
import { money } from "@/core/models";
const bytes = (b64: string) =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
export async function quotationPDF(q: any, logoBytes?: Uint8Array) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(bytes(regular), { subset: true }),
    fontBold = await doc.embedFont(bytes(bold), { subset: true });
  const defaultLogo = q.seller.logo === "/assets/logo.png" ? logo : spaceTechLogo;
  const img = await doc.embedPng(logoBytes || bytes(defaultLogo));
  const navy = rgb(0.07, 0.21, 0.29),
    gray = rgb(0.42, 0.51, 0.57),
    line = rgb(0.85, 0.89, 0.91);
  const pages: any[] = [];
  let page: any,
    y = 0;
  function text(
    t: any,
    x: number,
    yy: number,
    size = 9,
    b = false,
    color = navy,
  ) {
    page.drawText(String(t ?? "").replace(/[\u2010-\u2015]/g, "-"), {
      x,
      y: yy,
      size,
      font: b ? fontBold : font,
      color,
    });
  }
  function amount(
    v: any,
    right: number,
    yy: number,
    size = 9,
    b = false,
    width = 90,
  ) {
    const value = money(v),
      f = b ? fontBold : font;
    size = Math.min(size, width / f.widthOfTextAtSize(value, 1));
    text(value, right - f.widthOfTextAtSize(value, size), yy, size, b);
  }
  function wrap(t: string, width: number, size = 9) {
    const result: string[] = [];
    for (const para of String(t || "").split("\n")) {
      let l = "";
      for (const word of para.split(/\s+/)) {
        const chunks: string[] = [];
        let part = "";
        for (const ch of word) {
          if (font.widthOfTextAtSize(part + ch, size) > width && part) {
            chunks.push(part);
            part = ch;
          } else part += ch;
        }
        if (part) chunks.push(part);
        for (const w of chunks) {
          if (
            font.widthOfTextAtSize((l ? l + " " : "") + w, size) > width &&
            l
          ) {
            result.push(l);
            l = w;
          } else l += (l ? " " : "") + w;
        }
      }
      result.push(l);
    }
    return result;
  }
  function next() {
    page = doc.addPage([595.28, 841.89]);
    pages.push(page);
    page.drawImage(img, { x: 37, y: 752, ...img.scaleToFit(50, 50) });
    text(q.seller.name, 103, 783, 17, true);
    const numbers = [q.seller.phone, q.seller.phone_alt].filter(Boolean);
    text("Hotline: " + numbers.join(" / "), 103, 764, 9, false, gray);
    if (q.seller.email)
      text(q.seller.email, 103, 751, 8, false, gray);
    if (q.seller.address)
      text(q.seller.address.slice(0, 95), 103, q.seller.email ? 740 : 750, 8, false, gray);
    page.drawLine({
      start: { x: 37, y: 735 },
      end: { x: 558, y: 735 },
      thickness: 2,
      color: rgb(0.92, 0.72, 0.28),
    });
    y = 708;
  }
  function ensure(height: number) {
    if (y - height < 70) next();
  }
  function paragraph(t: string, width = 515, size = 9) {
    for (const l of wrap(t, width, size)) {
      ensure(size + 5);
      text(l, 40, y, size);
      y -= size + 5;
    }
  }
  function tableHeader() {
    ensure(26);
    page.drawRectangle({
      x: 37,
      y: y - 20,
      width: 521,
      height: 25,
      color: navy,
    });
    text("SẢN PHẨM / MÃ HÀNG", 44, y - 12, 8, true, rgb(1, 1, 1));
    text("SL", 286, y - 12, 8, true, rgb(1, 1, 1));
    text("ĐƠN GIÁ", 326, y - 12, 8, true, rgb(1, 1, 1));
    text("THUẾ", 414, y - 12, 8, true, rgb(1, 1, 1));
    text("THÀNH TIỀN", 471, y - 12, 8, true, rgb(1, 1, 1));
    y -= 32;
  }
  next();
  text("BẢNG BÁO GIÁ", 40, y, 22, true);
  y -= 24;
  text(
    `${q.number} / Phiên bản ${q.version} · ${new Date(Number(q.created)).toLocaleDateString("vi-VN")}`,
    40,
    y,
    9,
    false,
    gray,
  );
  y -= 25;
  if (q.seller.demo) {
    paragraph(
      "BẢN MINH HỌA — không phải báo giá thương mại chính thức.",
      515,
      9,
    );
    y -= 8;
  }
  paragraph("Khách hàng: " + q.customer.name);
  if (q.customer.company) paragraph("Công ty: " + q.customer.company);
  paragraph(
    "Điện thoại: " +
      q.customer.phone +
      (q.customer.email ? " · " + q.customer.email : ""),
  );
  if (q.customer.address) paragraph("Địa chỉ: " + q.customer.address);
  if (q.customer.tax_code) paragraph("Mã số thuế: " + q.customer.tax_code);
  y -= 18;
  tableHeader();
  for (const item of q.items) {
    const content = [
      ...wrap(item.part_number, 225, 9),
      ...wrap(item.name, 225, 8),
      ...(item.lead_time ? wrap("Giao hàng: " + item.lead_time, 225, 7) : []),
      ...(item.warranty ? wrap("Bảo hành: " + item.warranty, 225, 7) : []),
      ...(Number(item.discount) > 0
        ? wrap("Giảm giá: " + money(item.discount), 225, 7)
        : []),
    ];
    const h = Math.max(38, content.length * 12 + 15);
    if (y - h < 75) {
      next();
      tableHeader();
    }
    let yy = y;
    for (let i = 0; i < content.length; i++) {
      text(content[i], 44, yy, i === 0 ? 9 : 8, i === 0);
      yy -= 12;
    }
    text(item.quantity, 286, y, 8);
    amount(item.price, 401, y, 8, false, 76);
    text(item.tax + "%", 419, y, 8);
    amount(item.total, 551, y, 8, false, 82);
    y -= h;
    page.drawLine({
      start: { x: 37, y: y + 9 },
      end: { x: 558, y: y + 9 },
      color: line,
      thickness: 0.5,
    });
  }
  ensure(150);
  y -= 5;
  for (const [label, value] of [
    ["Tiền hàng", q.subtotal],
    ["Giảm giá", q.discount],
    ["Thuế", q.tax],
    ["Vận chuyển", q.shipping],
  ]) {
    text(label, 330, y, 9, false, gray);
    amount(value, 551, y, 9, false, 100);
    y -= 19;
  }
  text("TỔNG CỘNG", 330, y - 3, 11, true);
  amount(q.total, 551, y - 3, 12, true, 115);
  y -= 35;
  ensure(70);
  text("ĐIỀU KIỆN BÁO GIÁ", 40, y, 10, true);
  y -= 20;
  paragraph(
    "Hiệu lực đến: " +
      new Date(Number(q.valid_until)).toLocaleDateString("vi-VN"),
  );
  paragraph(q.terms || "Điều kiện giao hàng theo xác nhận của cửa hàng.");
  paragraph(
    "Đơn vị tiền tệ: VND. Thành tiền từng dòng đã gồm thuế và giảm giá.",
  );
  for (let i = 0; i < pages.length; i++) {
    page = pages[i];
    text(
      q.seller.name + " · " + q.number + " · v" + q.version,
      40,
      34,
      7,
      false,
      gray,
    );
    text(`${i + 1} / ${pages.length}`, 520, 34, 7, false, gray);
  }
  doc.setTitle(q.number + " — " + q.seller.name);
  doc.setAuthor(q.seller.name);
  return doc.save();
}
