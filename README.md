# SpaceTech

Website bán thiết bị tự động hóa dành cho **SpaceTech**. Hotline **0706650020** và **0786882137**. Zalo **0706650020**. Email **trandangkhoacb2019@gmail.com**. Giao diện tiếng Việt, logo do chủ cửa hàng cung cấp, bố cục thích ứng máy tính và điện thoại.

## 1. Bắt đầu nhanh

Website đã được deploy trên **Vibe Host Mắt Bão**. Truy cập URL được cấp để xem giao diện; chọn **Mở quản trị** để dùng Admin.

Giá, tồn kho, phí giao hàng và điều khoản hiện tại là mẫu để kiểm thử. Cập nhật địa chỉ, MST và chính sách trước khi mở cho khách. Yêu cầu đặt hàng được lưu vào Admin để người bán liên hệ. Không có tài khoản admin/mật khẩu mặc định.

## 2. Công nghệ và phạm vi

| Lựa chọn | Ưu điểm | Điểm cần cân nhắc |
| --- | --- | --- |
| WordPress + WooCommerce | Ra mắt nhanh, quản trị quen thuộc, nhiều tiện ích thương mại | Các bộ lọc kỹ thuật, quy trình RFQ và báo giá nhiều phiên bản cần tùy biến; phải quản lý tương thích, cập nhật và giấy phép plugin |
| Next.js + TypeScript + PostgreSQL — được chọn | Chủ động cấu trúc dữ liệu, phân quyền, tính tiền, chống bán vượt tồn, PDF và luồng B2B | Cần quản lý máy chủ, database, sao lưu và cập nhật mã nguồn |

Bản Node dùng Next.js, React, PostgreSQL, Prisma (các truy vấn có tham số), Zod, bcryptjs, jose và pdf-lib/fontkit. Hai môi trường **không tự đồng bộ dữ liệu**. Adapter được chọn khi build, không chuyển bằng lựa chọn từ trình duyệt.

| Chức năng | Trạng thái |
| --- | --- |
| Trang chủ, danh mục, thương hiệu, bài viết, liên hệ, sản phẩm mới | Có |
| Sản phẩm bán chạy | Xếp theo số lượng trong đơn hoàn tất; chưa có doanh số thì hiển thị "Sản phẩm tiêu biểu" |
| Tìm mã hàng/tên/hãng, lọc hãng, danh mục nhiều cấp, điện áp, tín hiệu, công suất, dòng điện, truyền thông | Có; thuộc tính chưa có dữ liệu sẽ không khớp bộ lọc |
| Chi tiết, bảng thông số, liên kết tải datasheet, ảnh | Có |
| Giỏ hàng, tổng dự kiến, phí theo khu vực, gửi yêu cầu đặt hàng về Admin | Có |
| Thanh toán trên website | Đã tắt toàn bộ luồng thu tiền |
| RFQ nhiều dòng, báo giá có thuế/giảm giá/phí giao, PDF tiếng Việt, phiên bản bất biến, chuyển đơn | Có |
| Admin sản phẩm thêm/sửa/lưu trữ, ảnh/PDF, tồn kho, trạng thái đơn, bài viết, cấu hình | Có |
| Admin/Kỹ thuật/Kinh doanh/Khách hàng | Có |
| So sánh sản phẩm, chat trực tiếp, đồng bộ hãng vận chuyển, hóa đơn điện tử, quên mật khẩu qua email | Chưa triển khai |

## 3. Hướng dẫn chạy và phát triển ở môi trường Local

Hệ thống được thiết kế theo kiến trúc nguyên khối hiện đại (Monolithic architecture) trên nền tảng **Next.js 16 (App Router)**, tích hợp đồng thời cả **Frontend (React 19)** và **Backend (API Route Handlers)**, kết nối trực tiếp với **PostgreSQL Database**.

---

### 3.1. Điều kiện tiên quyết (Prerequisites)

Trước khi bắt đầu, đảm bảo máy tính phát triển đã cài đặt các công cụ sau:

| Thành phần | Công nghệ / Yêu cầu | Phiên bản khuyến nghị | Mục đích |
| --- | --- | --- | --- |
| **Runtime & Quản lý gói** | Node.js & npm | Node.js `>= 22.13.0` (khuyến nghị Node 24) | Chạy runtime máy chủ Next.js và bộ test tích hợp |
| **Database** | PostgreSQL | PostgreSQL 16 (qua Docker Desktop) | Lưu trữ dữ liệu quan hệ, thực thi giao dịch ACID |
| **Container Engine** | Docker & Docker Compose | Docker Desktop bản mới nhất | Chạy máy chủ PostgreSQL local mà không cần cài thủ công vào OS |
| **Quản lý mã nguồn** | Git | Phiên bản mới nhất | Đồng bộ mã nguồn và triển khai lên Vibe Host Mắt Bão |

Kiểm tra phiên bản cài đặt trên PowerShell / Terminal:
```powershell
node -v
npm -v
docker --version
```

---

### 3.2. Cấu trúc các tầng kỹ thuật khi chạy Local

- **Frontend**:
  - Giao diện người dùng viết bằng **React 19**, cấu trúc component modular tại `app/components/` (`shop.tsx`, `admin.tsx`, `ui.tsx`).
  - Tích hợp Server-Side Rendering (SSR) tại `app/[[...path]]/page.tsx` nhằm tạo sẵn HTML và dữ liệu ban đầu cho SEO.
  - Tự động làm mới giao diện với cơ chế Fast Refresh / Hot Reload khi chỉnh sửa file.
- **Backend**:
  - Tầng API định tuyến động tại `app/api/[...path]/route.ts` trỏ về `server/api.ts`.
  - Nghiệp vụ giao dịch kho, RFQ, tính toán giá nằm tại `server/store.ts` và `core/models.ts`.
  - Xác thực phiên bằng JWT (HS256) qua thư viện `jose`, mật khẩu mã hóa an toàn bằng `bcryptjs`.
- **Database (Cơ sở dữ liệu)**:
  - PostgreSQL 16 chạy trong Docker container thông qua cấu hình `compose.yaml`.
  - Quản lý lược đồ và di chuyển schema bằng **Prisma ORM** (`prisma/schema.prisma` và `prisma/migrations/`).
  - Truy vấn dữ liệu thực thi bằng **Parameterized SQL** (`$queryRawUnsafe`) với mức cô lập giao dịch `SERIALIZABLE` để chống bán vượt tồn.

---

### 3.3. Các bước cài đặt và khởi chạy chi tiết

#### Bước 1: Thiết lập file cấu hình môi trường (`.env`)

Sao chép file cấu hình mẫu `.env.example` thành `.env`:
```powershell
Copy-Item .env.example .env
```

Mở file `.env` bằng trình soạn thảo và hoàn thiện các tham số sau:

```dotenv
# 1. Mật khẩu kết nối PostgreSQL local (chỉ sử dụng ký tự chữ và số)
POSTGRES_PASSWORD="spacetech_local_password_2026"

# 2. Chuỗi kết nối Database (đồng bộ mật khẩu vừa đặt ở trên)
DATABASE_URL="postgresql://spacetech:spacetech_local_password_2026@localhost:5432/spacetech?schema=public"

# 3. Khóa bí mật dùng để ký token JWT (tối thiểu 32 ký tự ngẫu nhiên)
AUTH_SECRET="dien_chuoi_ngau_nhien_tao_o_lenh_duoi_vao_day"

# 4. URL gốc của ứng dụng khi chạy tại máy cá nhân
APP_URL="http://localhost:3000"

# 5. Đường dẫn thư mục lưu trữ tệp tin tải lên (ảnh sản phẩm, datasheet PDF)
UPLOAD_DIR="./data/uploads"

# 6. Chặn Google thu thập dữ liệu trong môi trường thử nghiệm
INDEX_PUBLIC_SITE="false"
```

Tạo chuỗi `AUTH_SECRET` ngẫu nhiên an toàn bằng lệnh:
```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
*Sao chép chuỗi kết quả in ra và dán vào biến `AUTH_SECRET` trong file `.env`.*

#### Bước 2: Khởi động cơ sở dữ liệu PostgreSQL qua Docker

Khởi chạy riêng dịch vụ database ngầm trong Docker:
```powershell
docker compose up -d db
```

Kiểm tra trạng thái container:
```powershell
docker compose ps
```
*Đảm bảo container `db` có trạng thái `healthy` trước khi thực hiện các bước tiếp theo.*

#### Bước 3: Cài đặt thư viện dependencies và sinh mã Prisma Client

Cài đặt chính xác các package theo `package-lock.json`:
```powershell
npm ci
```

Sinh mã nguồn thư viện truy vấn `@prisma/client` từ `prisma/schema.prisma`:
```powershell
npx prisma generate
```

#### Bước 4: Chạy Migration khởi tạo cấu trúc bảng và chèn dữ liệu mẫu

Áp dụng các tệp migration SQL vào PostgreSQL:
```powershell
npm run db:deploy
```

Chèn dữ liệu ban đầu (thương hiệu, danh mục, sản phẩm mẫu và cấu hình cửa hàng):
```powershell
npm run db:seed
```
*Lưu ý: Lệnh seed chỉ tạo dữ liệu một lần duy nhất nếu bảng dữ liệu đang trống, không ghi đè dữ liệu đã tồn tại.*

#### Bước 5: Khởi tạo tài khoản Quản trị viên (Admin)

Khai báo tạm thông tin đăng nhập trong file `.env`:
```dotenv
ADMIN_EMAIL="admin@spacetech.vn"
ADMIN_PASSWORD="matkhau_it_nhat_12_ky_tu"
ADMIN_NAME="SpaceTech Admin"
```

Chạy script tạo tài khoản:
```powershell
npm run admin:create
```

> [!IMPORTANT]
> **Bảo mật**: Sau khi tài khoản admin đã được tạo thành công, hãy **xóa ngay** dòng `ADMIN_PASSWORD` khỏi file `.env` để tránh lộ mật khẩu trong cấu hình môi trường.

#### Bước 6: Khởi chạy máy chủ phát triển (Development Server)

Khởi động ứng dụng ở chế độ phát triển:
```powershell
npm run dev:postgres
```

Mở trình duyệt và truy cập:
- Trang chủ cửa hàng: **`http://localhost:3000`**
- Trang đăng nhập quản trị: **`http://localhost:3000/dang-nhap`**
- Giao diện Admin: **`http://localhost:3000/admin`**

---

### 3.4. Bảng tổng hợp các lệnh thường dùng khi phát triển

| Mục đích công việc | Lệnh thực thi | Ghi chú |
| --- | --- | --- |
| **Khởi động DB** | `docker compose up -d db` | Chạy database nền qua Docker |
| **Dừng DB** | `docker compose stop db` | Tạm dừng container khi không làm việc |
| **Chạy dev server** | `npm run dev:postgres` | Khởi động Next.js dev server kèm Hot Reload |
| **Kiểm tra kiểu dữ liệu** | `npm run typecheck` | Chạy TypeScript compiler kiểm tra lỗi toàn dự án |
| **Chạy unit/integration test** | `npm test` | Chạy 14 bộ kiểm thử nghiệp vụ (dùng SQLite tích hợp) |
| **Cập nhật database schema** | `npm run db:deploy` | Áp dụng migration SQL mới vào database |
| **Seed lại dữ liệu mẫu** | `npm run db:seed` | Tạo dữ liệu mẫu nếu database trống |
| **Tạo tài khoản quản trị** | `npm run admin:create` | Đọc thông tin từ `ADMIN_*` trong `.env` |
| **Dọn dẹp đơn giữ chỗ quá hạn** | `npm run orders:expire` | Hủy đơn chưa xử lý quá 24h và hoàn tồn kho |
| **Build thử nghiệm production** | `npm run build:postgres` | Kiểm tra quy trình build standalone trước khi deploy |
| **Chạy bản build production local** | `npm run start:postgres` | Chạy ứng dụng sau khi đã build |

---

### 3.5. Kiểm tra và gỡ lỗi Cơ sở dữ liệu (Database Inspection)

Khi cần xem trực tiếp bảng dữ liệu hoặc kiểm tra truy vấn SQL:

**Cách 1: Sử dụng giao diện dòng lệnh (CLI):**
```powershell
docker compose exec db psql -U spacetech -d spacetech
```
*Một số câu lệnh hữu ích trong psql: `\dt` (xem danh sách bảng), `SELECT * FROM brands;`, `\q` (thoát).*

**Cách 2: Sử dụng các công cụ quản lý GUI (DBeaver, TablePlus, pgAdmin):**
- **Host**: `localhost` (hoặc `127.0.0.1`)
- **Port**: `5432`
- **Database**: `spacetech`
- **Username**: `spacetech`
- **Password**: Giá trị khai báo tại `POSTGRES_PASSWORD` trong file `.env`

---

## 4. Đưa thông tin và tài liệu thật vào website

### Logo, số điện thoại, địa chỉ, banner và SEO

1. Vào **Admin → Cấu hình website**.
2. Chọn **Tải tệp** ở Logo. Dùng PNG nền trong hoặc nền trắng; PNG cũng được dùng trong báo giá PDF. Logo JPEG/WebP hiển thị trên website; PDF hiện chỉ thay logo tùy chỉnh khi tệp là PNG.
3. Điền hai số hotline, số Zalo (chỉ chữ số), email, địa chỉ giao dịch, MST và liên kết Messenger/bản đồ. Chọn tên và ảnh người liên hệ để hiển thị tại trang Giới thiệu & liên hệ.
4. Tải ảnh banner chính, đổi tiêu đề/mô tả banner, SEO title/description và nội dung chính sách.
5. Nhấn **Lưu cấu hình website**. Tiêu đề SEO được áp dụng khi tải trang trực tiếp; khi chuyển trang trong giao diện, nội dung được cập nhật tại chỗ.

Logo và ảnh người liên hệ mặc định nằm tại `public/assets/spacetech-logo.png` và `public/assets/spacetech-khoa.png`. Có thể thay ảnh trong Admin. Bản nâng cấp này áp dụng nhận diện SpaceTech cho cấu hình cũ chưa có trường hotline thứ hai. Các thiết lập khác như phí giao hàng vẫn đọc từ cơ sở dữ liệu.

### Thêm sản phẩm

1. Tạo hãng/danh mục ở **Danh mục & Hãng** nếu chưa có. Chọn danh mục cha để thêm cấp con.
2. Mở **Sản phẩm → Thêm sản phẩm**. Nhập tên, slug không dấu, SKU duy nhất, mã hãng, thương hiệu và danh mục.
3. Chọn **Liên hệ báo giá** nếu chưa có giá xác nhận, hoặc **Giá niêm yết** để mua trực tiếp. Giá niêm yết là giá cuối cùng, không cộng thuế thêm ở checkout.
4. Tải ảnh PNG/JPEG/WebP và Datasheet PDF, tối đa 10 MB/tệp. Có thể thay bằng URL HTTPS chính thức. Ảnh/PDF tải lên được lưu bền vững; không lưu đơn hàng trong trình duyệt.
5. Điền thông số. Ví dụ điện áp: khóa `voltage`, tên `Nguồn cấp`, giá trị `20.4–28.8 VDC`, Min `20.4`, Max `28.8`. Khóa `signal` cho NPN/PNP; `protocol` cho PROFINET/Modbus; `power`, `current` cho công suất và dòng điện. Không dùng một khóa hai lần trong cùng sản phẩm.
6. Nhập **tổng tồn kho**. Số đang giữ chỗ được hiển thị riêng và không được giảm tồn xuống dưới số giữ chỗ. Bật đặt hàng chờ nhập chỉ khi cửa hàng có thể cung cấp.
7. Bỏ dấu **Giá và tồn kho minh họa** sau khi đã xác nhận dữ liệu. Chọn **Đang hiển thị** và lưu.

Dùng **Lưu trữ** để ẩn hàng đã ngừng bán, giữ lịch sử đơn/báo giá. Không xóa cứng sản phẩm đã có giao dịch. Các hình SVG mẫu là minh họa; cần thay ảnh thực tế trước khi dùng thương mại. FR-D720S là mẫu có lưu ý ngừng sản xuất, không phải cam kết có hàng.

### Xử lý RFQ và xuất PDF

1. Khách mở **Yêu cầu báo giá**, chọn mã hoặc thêm mã chưa có trong danh mục, số lượng và thông tin liên hệ.
2. Nhân viên Kinh doanh/Admin mở **Báo giá B2B → Lập báo giá**.
3. Nhập đơn giá trước thuế, thuế suất từng dòng, giảm giá của cả dòng, giao hàng, bảo hành, phí vận chuyển và ngày hết hiệu lực.
4. **Phát hành báo giá PDF** lưu một phiên bản mới. Nhấn **PDF** để tải. Không chỉnh sửa trực tiếp giá của phiên bản đã phát hành; phát hành phiên bản tiếp theo.
5. Sau khi khách chốt, nhấn **Khách đã chốt · Tạo đơn**. Mã tự do cần được gán vào sản phẩm thật trước khi phát hành phiên bản sẽ dùng tạo đơn. Gán mã sau khi phát hành không sửa nội dung phiên bản cũ.
6. PDF được tải xuống để bạn tự gửi khách; hệ thống không tự gửi tin nhắn/email.

### Yêu cầu đặt hàng và tồn kho

- Khách thêm sản phẩm vào giỏ, bấm **Tiếp tục đặt hàng**, nhập thông tin nhận hàng và gửi yêu cầu.
- Yêu cầu và mã đơn xuất hiện tại **Admin → Đơn hàng**. Mở chi tiết để gọi hoặc email trực tiếp cho khách và xác nhận giá, tồn kho, giao hàng. Bản này chưa gửi email thông báo tự động.
- Khách thấy tổng dự kiến. Không có bước COD, chuyển khoản, QR hoặc xác nhận thu tiền trên website.
- Admin xác nhận → chuẩn bị → đang giao → hoàn tất. Khi chuyển **Đang giao**, kho trừ đúng số lượng. Đơn chờ nhập chưa đủ hàng không thể chuyển sang giao. Hủy trước khi giao giải phóng phần tồn giữ chỗ.
- Yêu cầu mới giữ chỗ tối đa 24 giờ nếu chưa được xác nhận. Trên VPS có thể đặt cron chạy `npm run orders:expire` mỗi 15 phút để không phụ thuộc lượt truy cập.

## 5. Cấu trúc mã nguồn

| Thư mục / tệp | Vai trò |
| --- | --- |
| `app/[[...path]]/page.tsx` | Trang server, dữ liệu đầu tiên và SEO |
| `app/components/shop.tsx` | Trang chủ, danh mục, chi tiết, giỏ, đặt hàng, RFQ, bài viết, tài khoản |
| `app/components/admin.tsx` | Admin, quản lý sản phẩm, đơn, báo giá, nhân sự, cấu hình |
| `app/components/ui.tsx` | Form, modal, trạng thái, hàm gọi API |
| `app/globals.css` | Thiết kế responsive và màu thương hiệu |
| `app/api/[...path]/route.ts` | Route API |
| `core/models.ts` | Kiểu dữ liệu, tính tiền, chuyển trạng thái, lọc danh mục |
| `core/seed.ts` | Sản phẩm mẫu, cấu hình mặc định, bài viết |
| `server/api.ts` | Validate, phân quyền, CRUD, upload |
| `server/store.ts` | Nghiệp vụ database và giao dịch kho |
| `server/runtime-node.ts` | PostgreSQL, phiên đăng nhập, lưu tệp trên Node |
| `server/pdf.ts`, `server/pdf-assets.ts` | Xuất PDF và font/logo nhúng |
| `prisma/` | Schema và migration SQL PostgreSQL |
| `public/assets/` | Logo, ảnh, font và giấy phép |
| `scripts/` | Seed, tạo admin, dọn đơn, build, kiểm thử |
| `tests/` | Kiểm thử nghiệp vụ và API với database SQLite cô lập |
| `docs/` | Sơ đồ CSDL, tài liệu kiến trúc, API, hướng dẫn phát hành, kiểm tra |
| `.env.example` | Mẫu biến môi trường |

## 6. Deploy lên Vibe Host Mắt Bão

Xem [hướng dẫn deploy đầy đủ](docs/PUBLISHING.md).

Quy trình tóm tắt:
1. Push code lên Git repository được liên kết với Vibe Host
2. Vào panel Mắt Bão, chọn ứng dụng và nhấn **Deploy**
3. Cấu hình biến môi trường trong panel (AUTH_SECRET, APP_URL, v.v.)
4. Chạy migration và seed từ panel hoặc terminal nếu có
5. Kiểm tra app chạy và đăng nhập Admin

## 7. Kiểm tra

```powershell
npm run typecheck
npm test
npm run build:postgres
```

`npm test` dùng SQLite tích hợp trong Node 22.13+ / 24; không chạm database thật. Các kiểm thử gồm đặt đồng thời mã cuối, không tạo đơn trùng, giá phía server, giữ/trừ/giải phóng kho, giới hạn vai trò, phạm vi dữ liệu, quote version, tiếp nhận yêu cầu không thanh toán, sitemap và PDF nhiều trang. Xem `docs/VERIFICATION.md` để biết phần đã kiểm tra và giới hạn.

Đọc tiếp: [Kiến trúc hệ thống](docs/ARCHITECTURE.md) · [Cơ sở dữ liệu](docs/DATABASE.md) · [API](docs/API.md) · [Deploy lên Vibe Host](docs/PUBLISHING.md) · [Nguồn ảnh và thông số](docs/ASSETS.md).
