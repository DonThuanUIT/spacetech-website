import type { Row, Product, Spec } from "./models";
export const defaultSettings: Row = {
  name: "SpaceTech",
  phone: "0706650020",
  phone_alt: "0786882137",
  zalo: "0706650020",
  logo: "/assets/spacetech-logo.png",
  portrait: "/assets/spacetech-khoa.png",
  contact_name: "Trần Đăng Khoa",
  hero_image: "/assets/plc.svg",
  email: "trandangkhoacb2019@gmail.com",
  address: "",
  tax_code: "",
  messenger: "",
  map_url: "",
  hero_title: "Kết nối thiết bị.\nVận hành tương lai.",
  hero_description:
    "Tìm đúng thiết bị cho hệ thống của bạn. Từ PLC, biến tần đến cảm biến — cùng SpaceTech xây dựng giải pháp tự động hóa phù hợp.",
  seo_title: "SpaceTech | Thiết bị tự động hóa",
  seo_description:
    "SpaceTech — thiết bị PLC, HMI, biến tần, servo và cảm biến. Hotline 0706650020 và 0786882137.",
  local_zone: "Hồ Chí Minh",
  local_fee: 30000,
  other_fee: 50000,
  free_shipping: 5000000,
  demo: true,
  warranty:
    "Thời hạn và điều kiện bảo hành được xác nhận theo từng mã thiết bị trong báo giá chính thức. Liên hệ 0706650020 để được hỗ trợ.",
  shipping:
    "Khách gửi yêu cầu đặt hàng qua website. SpaceTech liên hệ xác nhận thiết bị, giá, phí và thời gian giao hàng trước khi xử lý.",
  privacy:
    "Thông tin liên hệ được sử dụng để xử lý yêu cầu tư vấn, báo giá và đơn hàng. Liên hệ cửa hàng để yêu cầu cập nhật hoặc xóa dữ liệu. Chính sách cần được cửa hàng rà soát trước khi đưa vào kinh doanh.",
};
export const brands = [
  { id: "siemens", name: "Siemens", slug: "siemens" },
  { id: "mitsubishi", name: "Mitsubishi Electric", slug: "mitsubishi" },
  { id: "omron", name: "Omron", slug: "omron" },
  { id: "schneider", name: "Schneider Electric", slug: "schneider" },
];
export const categories = [
  { id: "plc", name: "PLC & Module", slug: "plc" },
  { id: "hmi", name: "Màn hình HMI", slug: "hmi" },
  { id: "inverter", name: "Biến tần", slug: "inverter" },
  { id: "sensor", name: "Cảm biến", slug: "sensor" },
  { id: "servo", name: "Servo & Motion", slug: "servo" },
  { id: "switchgear", name: "Thiết bị đóng cắt", slug: "switchgear" },
];
const s = (
  key: string,
  label: string,
  value: string,
  extra: Row = {},
): Spec => ({ key, label, value, ...extra });
const raw: Row[] = [
  {
    id: "plc1214",
    slug: "plc-siemens-s7-1200-cpu-1214c",
    sku: "ST-PLC-001",
    part_number: "6ES7214-1AG40-0XB0",
    name: "PLC Siemens S7-1200 CPU 1214C",
    brand_id: "siemens",
    category_id: "plc",
    image: "/assets/plc.svg",
    price: 6850000,
    stock: 12,
    description:
      "CPU nhỏ gọn DC/DC/DC, 14 ngõ vào số, 10 ngõ ra số và 2 ngõ vào analog. Hình vẽ minh họa thiết bị; đối chiếu datasheet trước khi lựa chọn.",
    datasheet:
      "https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=6ES7214-1AG40-0XB0",
    source:
      "https://sieportal.siemens.com/en-se/products-services/detail/6ES72141AG400XB0",
    specs: [
      s("voltage", "Nguồn cấp", "20.4–28.8 VDC", {
        min: 20.4,
        max: 28.8,
        unit: "V",
      }),
      s("supply", "Loại nguồn", "DC"),
      s("di", "Ngõ vào số", "14 DI, 24 VDC"),
      s("do", "Ngõ ra số", "10 DO, 24 VDC"),
      s("ai", "Ngõ vào analog", "2 AI, 0–10 V"),
      s("memory", "Bộ nhớ", "150 KB"),
    ],
  },
  {
    id: "hmi700",
    slug: "hmi-siemens-ktp700-basic",
    sku: "ST-HMI-001",
    part_number: "6AV2123-2GB03-0AX0",
    name: "HMI Siemens KTP700 Basic 7 inch",
    brand_id: "siemens",
    category_id: "hmi",
    image: "/assets/hmi.svg",
    price: 8900000,
    stock: 6,
    description:
      "Màn hình vận hành SIMATIC Basic Panel 7 inch, phím chức năng và cảm ứng. Hình vẽ minh họa thiết bị.",
    datasheet:
      "https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=6AV2123-2GB03-0AX0",
    source:
      "https://sieportal.siemens.com/en-bg/products-services/detail/6AV2123-2GB03-0AX0",
    specs: [
      s("screen", "Màn hình", "7 inch TFT"),
      s("colors", "Số màu", "65.536"),
      s("protocol", "Truyền thông", "PROFINET"),
      s("operation", "Thao tác", "Phím và cảm ứng"),
    ],
  },
  {
    id: "frd720",
    slug: "bien-tan-mitsubishi-fr-d720s-075k",
    sku: "ST-INV-001",
    part_number: "FR-D720S-0.75K",
    name: "Biến tần Mitsubishi FR-D720S 0.75 kW",
    brand_id: "mitsubishi",
    category_id: "inverter",
    image: "/assets/inverter.svg",
    mode: "quote",
    price: null,
    stock: 0,
    backorder: true,
    description:
      "Biến tần FR-D700 cho động cơ 0.75 kW. Dòng sản phẩm đã được hãng công bố EOL; liên hệ kiểm tra khả năng cung cấp và phương án thay thế.",
    datasheet:
      "https://mitsubishi-electric-eshop.mee.com/mee/FA_IA/en/EUR/Catalogue/Inverter/Main-Unit/FR-D720S-0-75K/p/000000000000233309/factsheet",
    source:
      "https://mitsubishi-electric-eshop.mee.com/mee/FA_IA/en/EUR/Catalogue/Inverter/Main-Unit/FR-D720S-0-75K/p/000000000000233309",
    specs: [
      s("power", "Công suất", "0.75 kW", { number: 0.75, unit: "kW" }),
      s("voltage", "Nguồn vào", "1 pha 200–240 VAC", {
        min: 200,
        max: 240,
        unit: "V",
      }),
      s("supply", "Loại nguồn", "AC"),
      s("current", "Dòng ra", "4.2 A", { number: 4.2, unit: "A" }),
      s("protocol", "Truyền thông", "Modbus RTU"),
    ],
  },
  {
    id: "e2e",
    slug: "cam-bien-omron-e2e-next",
    sku: "ST-SEN-001",
    part_number: "E2E-X5MC112 2M",
    name: "Cảm biến tiệm cận Omron E2E NEXT",
    brand_id: "omron",
    category_id: "sensor",
    image: "/assets/sensor.jpg",
    price: 480000,
    stock: 35,
    description:
      "Cảm biến tiệm cận M12, khoảng cách 5 mm, lắp không chìm, NPN thường mở, cáp 2 m. Ảnh đại diện dòng E2E từ hãng.",
    datasheet: "https://industrial.omron.eu/en/products/E2E-X5MC112-2M.pdf",
    source: "https://industrial.omron.eu/en/products/E2E-X5MC112-2M",
    specs: [
      s("size", "Kích thước", "M12"),
      s("distance", "Khoảng cách", "5 mm"),
      s("signal", "Ngõ ra", "NPN"),
      s("contact", "Trạng thái", "NO, DC 3 dây"),
      s("cable", "Chiều dài cáp", "2 m"),
      s("ip", "Cấp bảo vệ", "IP67 / IP67G / IP69K"),
    ],
  },
  {
    id: "servo40",
    slug: "servo-mitsubishi-mr-je-40a",
    sku: "ST-SRV-001",
    part_number: "MR-JE-40A",
    name: "Servo Mitsubishi MELSERVO-JE 400 W",
    brand_id: "mitsubishi",
    category_id: "servo",
    image: "/assets/servo.svg",
    price: 7200000,
    stock: 4,
    description:
      "Bộ điều khiển servo một trục MELSERVO-JE 400 W, tích hợp phanh động năng. Chọn động cơ và phụ kiện tương thích theo tài liệu hãng.",
    datasheet:
      "https://mitsubishi-electric-eshop.mee.com/mee/FA_IA/en/EUR/Catalogue/Servo/Servo-Amplifier/MR-JE-40A/p/000000000000268794/factsheet",
    source:
      "https://mitsubishi-electric-eshop.mee.com/mee/FA_IA/en/EUR/Catalogue/Servo/Servo-Amplifier/MR-JE-40A/p/000000000000268794",
    specs: [
      s("power", "Công suất", "0.4 kW", { number: 0.4, unit: "kW" }),
      s("axes", "Số trục", "1"),
      s("supply", "Nguồn cấp", "1 hoặc 3 pha 230 VAC"),
      s("brake", "Phanh động năng", "Tích hợp"),
      s("dimensions", "Kích thước", "50 × 168 × 135 mm"),
    ],
  },
  {
    id: "contactor",
    slug: "khoi-dong-tu-schneider-lc1d09m7",
    sku: "ST-CON-001",
    part_number: "LC1D09M7",
    name: "Khởi động từ Schneider TeSys Deca 9 A",
    brand_id: "schneider",
    category_id: "switchgear",
    image: "/assets/contactor.svg",
    price: 520000,
    stock: 20,
    description:
      "Contactor TeSys Deca 3 cực, 3 tiếp điểm thường mở. Dòng AC-3/AC-3e 9 A, cuộn hút 220 VAC, đấu nối cầu đấu vít.",
    datasheet: "https://iportal.se.com/Contents/docs/SQD-LC1D09M7.PDF",
    source: "https://www.se.com/vn/vi/product/LC1D09M7/",
    specs: [
      s("poles", "Số cực", "3P"),
      s("contact", "Tiếp điểm chính", "3 NO"),
      s("current", "Dòng AC-3/AC-3e", "9 A", { number: 9, unit: "A" }),
      s("coil", "Cuộn hút", "220 VAC, 50/60 Hz"),
    ],
  },
];
export function samples(scope = "public-demo"): Product[] {
  return raw.map((p) => ({
    ...p,
    id: scope + ":" + p.id,
    brand_id: scope + ":" + p.brand_id,
    category_id: scope + ":" + p.category_id,
    brand: brands.find((b) => b.id === p.brand_id)!.name,
    category: categories.find((c) => c.id === p.category_id)!.name,
    mode: p.mode || "fixed",
    reserved: 0,
    demo: true,
    backorder: p.backorder || false,
    status: "published",
  })) as Product[];
}
export const articles = [
  {
    id: "plc",
    slug: "chon-plc-cho-he-thong",
    title: "Chọn PLC: bắt đầu từ số lượng I/O",
    excerpt: "Xác định CPU, module mở rộng và khả năng kết nối cho dự án.",
    category: "PLC & Điều khiển",
    image: "/assets/plc.svg",
    body: "Hãy lập bảng tín hiệu đầu vào và đầu ra của máy. Phân biệt tín hiệu số, analog và yêu cầu điều khiển tốc độ cao.\n\nXác định giao thức kết nối với HMI, biến tần và hệ thống giám sát. Đối chiếu đúng mã CPU và phiên bản phần mềm.\n\nDự phòng khả năng mở rộng theo kế hoạch. Gửi danh sách I/O cho SpaceTech để trao đổi phương án.",
  },
  {
    id: "sensor",
    slug: "cam-bien-npn-va-pnp",
    title: "NPN và PNP: chọn đúng kiểu ngõ ra",
    excerpt: "Kiểm tra tương thích giữa cảm biến và module đầu vào PLC.",
    category: "Cảm biến",
    image: "/assets/sensor.jpg",
    body: "NPN và PNP mô tả cách transistor ngõ ra chuyển mạch. Cách đấu nối phụ thuộc mạch đầu vào và chân chung của module PLC.\n\nKiểm tra loại nguồn, NO/NC, khoảng cách phát hiện và kiểu lắp. Thông số một mã hàng không đại diện cho cả dòng sản phẩm.\n\nLuôn đối chiếu sơ đồ đấu dây trong datasheet. Việc đấu lắp cần người có chuyên môn thực hiện.",
  },
  {
    id: "rfq",
    slug: "chuan-bi-yeu-cau-bao-gia",
    title: "Chuẩn bị một yêu cầu báo giá đầy đủ",
    excerpt: "Mã hàng, số lượng và thời gian cần giúp trao đổi hiệu quả hơn.",
    category: "Hướng dẫn mua hàng",
    image: "/assets/hmi.svg",
    body: "Cung cấp hãng sản xuất, mã đặt hàng đầy đủ, số lượng và thời gian cần thiết bị. Khi thay thế linh kiện, bổ sung ảnh nhãn và yêu cầu tương thích.\n\nVới đơn doanh nghiệp, cung cấp thông tin công ty, hóa đơn và địa chỉ giao hàng.\n\nKiểm tra hiệu lực báo giá, thời gian giao, bảo hành và phụ kiện đi kèm trước khi chốt.",
  },
];
