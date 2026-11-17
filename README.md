# SpaceTech

Website bán thiết bị tự động hóa dành cho **SpaceTech**. Hotline **0706650020** và **0786882137**. Zalo **0706650020**. Email **trandangkhoacb2019@gmail.com**. Giao diện tiếng Việt, logo do chủ cửa hàng cung cấp, bố cục thích ứng máy tính và điện thoại.

## 1. Bắt đầu nhanh

**Bản chạy thử riêng** dùng tài khoản ChatGPT, dữ liệu mẫu riêng cho từng người đăng nhập. Vào đường dẫn website được gửi trong cuộc trò chuyện; chọn **Mở quản trị** để dùng Admin. Không cần cài Python hoặc mở file HTML trên máy.

**Mã nguồn PostgreSQL** là bản để cài trên máy riêng / VPS. Đây là ứng dụng có backend và cơ sở dữ liệu; không thể chạy bằng cách nhấp đúp một file HTML. Xem phần 3 để cài.

Giá, tồn kho, phí giao hàng và điều khoản hiện tại là mẫu để kiểm thử. Cập nhật địa chỉ, MST và chính sách trước khi mở cho khách. Yêu cầu đặt hàng được lưu vào Admin để người bán liên hệ. Không có tài khoản admin/mật khẩu mặc định.

## 2. Công nghệ và phạm vi

| Lựa chọn | Ưu điểm | Điểm cần cân nhắc |
| --- | --- | --- |
| WordPress + WooCommerce | Ra mắt nhanh, quản trị quen thuộc, nhiều tiện ích thương mại | Các bộ lọc kỹ thuật, quy trình RFQ và báo giá nhiều phiên bản cần tùy biến; phải quản lý tương thích, cập nhật và giấy phép plugin |
| Next.js + TypeScript + PostgreSQL — được chọn | Chủ động cấu trúc dữ liệu, phân quyền, tính tiền, chống bán vượt tồn, PDF và luồng B2B | Cần quản lý máy chủ, database, sao lưu và cập nhật mã nguồn |

Bản Node dùng Next.js, React, PostgreSQL, Prisma (các truy vấn có tham số), Zod, bcryptjs, jose và pdf-lib/fontkit. Bản chạy thử trực tuyến dùng cùng giao diện và nghiệp vụ, với Vinext/Cloudflare D1/R2 và danh tính ChatGPT. Hai môi trường **không tự đồng bộ dữ liệu**. Adapter được chọn khi build, không chuyển bằng lựa chọn từ trình duyệt.

| Chức năng | Trạng thái |
| --- | --- |
| Trang chủ, danh mục, thương hiệu, bài viết, liên hệ, sản phẩm mới | Có |
| Sản phẩm bán chạy | Xếp theo số lượng trong đơn hoàn tất; chưa có doanh số thì hiển thị “Sản phẩm tiêu biểu” |
| Tìm mã hàng/tên/hãng, lọc hãng, danh mục nhiều cấp, điện áp, tín hiệu, công suất, dòng điện, truyền thông | Có; thuộc tính chưa có dữ liệu sẽ không khớp bộ lọc |
| Chi tiết, bảng thông số, liên kết tải datasheet, ảnh | Có |
| Giỏ hàng, tổng dự kiến, phí theo khu vực, gửi yêu cầu đặt hàng về Admin | Có |
| Thanh toán trên website | Đã tắt toàn bộ luồng thu tiền |
| RFQ nhiều dòng, báo giá có thuế/giảm giá/phí giao, PDF tiếng Việt, phiên bản bất biến, chuyển đơn | Có |
| Admin sản phẩm thêm/sửa/lưu trữ, ảnh/PDF, tồn kho, trạng thái đơn, bài viết, cấu hình | Có |
| Admin/Kỹ thuật/Kinh doanh/Khách hàng | Có ở backend PostgreSQL; bản trực tuyến dùng tài khoản ChatGPT của chủ không gian thử |
| So sánh sản phẩm, chat trực tiếp, đồng bộ hãng vận chuyển, hóa đơn điện tử, quên mật khẩu qua email | Chưa triển khai |

## 3. Chạy bản PostgreSQL trên Windows

Cài Node.js 22.13 trở lên (khuyến nghị Node 24 để chạy toàn bộ test), Docker Desktop và trình soạn thảo. Sau khi giải nén ZIP, mở Terminal/PowerShell tại thư mục có `package.json`.

```powershell
Copy-Item .env.example .env
```

Mở `.env`, thay `POSTGRES_PASSWORD` bằng mật khẩu mới; thay phần mật khẩu trong `DATABASE_URL` cho giống. Dùng mật khẩu database chỉ gồm chữ/số nếu dùng trực tiếp mẫu Compose. Đặt `AUTH_SECRET` ngẫu nhiên tối thiểu 32 ký tự. Có thể tạo chuỗi mới bằng:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Giữ `APP_URL=http://localhost:3000` khi chạy trên máy này. Không gửi file `.env` hay mật khẩu cho người khác.

### Cách A — ứng dụng và database bằng Docker

```powershell
docker compose up -d --build
docker compose exec web npm run db:seed
```

Đợi ứng dụng khởi động. Mở `http://localhost:3000`. Dữ liệu mẫu chỉ được tạo lần đầu. Chạy seed lại không ghi đè cửa hàng đã tồn tại.

Tạo quản trị viên một lần bằng cách nhập `ADMIN_EMAIL`, `ADMIN_PASSWORD` (ít nhất 12 ký tự) và `ADMIN_NAME` vào `.env`, sau đó:

```powershell
docker compose up -d --force-recreate web
docker compose exec web npm run admin:create
```

Xóa giá trị `ADMIN_PASSWORD` trong `.env` và chạy lại `docker compose up -d --force-recreate web` để bỏ mật khẩu bootstrap khỏi môi trường container. Đăng nhập ở `/dang-nhap`, rồi mở `/admin`.

### Cách B — database Docker, ứng dụng Node

```powershell
docker compose up -d db
npm ci
npx prisma generate
npm run db:deploy
npm run db:seed
npm run admin:create
npm run dev:postgres
```

Lệnh tạo admin cần các biến `ADMIN_*` trong `.env` như trên. Khi đã chạy ổn, sử dụng:

```powershell
npm run build:postgres
npm run start:postgres
```

`npm run dev` và `npm run build` mặc định là lệnh cho môi trường chạy thử trực tuyến; trên VPS PostgreSQL dùng các lệnh có hậu tố `:postgres`.

### Mở trên điện thoại cùng Wi-Fi

Trên Windows dùng `ipconfig` để xem IPv4 của máy, ví dụ `192.168.1.20`. Đặt `APP_URL=http://192.168.1.20:3000`, khởi động lại ứng dụng và mở đúng URL đó trên điện thoại. Máy tính/điện thoại phải cùng mạng; cho phép cổng 3000 trong Windows Firewall đối với mạng riêng. `localhost` trên điện thoại là chính điện thoại, không phải máy tính. Với website đã đưa lên hosting, mở trực tiếp URL HTTPS được cấp.

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
| `server/runtime-cf.ts` | D1/R2 và danh tính bản chạy thử |
| `server/pdf.ts`, `server/pdf-assets.ts` | Xuất PDF và font/logo nhúng |
| `prisma/` | Schema và migration SQL PostgreSQL |
| `db/schema.ts`, `drizzle/` | Schema/migration D1 bản chạy thử |
| `public/assets/` | Logo, ảnh, font và giấy phép |
| `scripts/` | Seed, tạo admin, dọn đơn, build, kiểm thử |
| `tests/` | Kiểm thử nghiệp vụ và API với database SQLite cô lập |
| `docs/` | Sơ đồ CSDL, API, hướng dẫn phát hành, kiểm tra |
| `Dockerfile`, `compose.yaml`, `.env.example` | Cài đặt Node/PostgreSQL |

## 6. Đưa lên tên miền riêng

Xem [hướng dẫn VPS, DNS, HTTPS và Google Search Console](docs/PUBLISHING.md).

Chọn VPS/container host hỗ trợ Node và PostgreSQL, gắn ổ đĩa bền vững cho database và thư mục upload. Cấu hình `APP_URL` là URL HTTPS thực tế, mật khẩu riêng và secret ngẫu nhiên. Chạy migration, tạo admin, dùng reverse proxy HTTPS và cấu hình giới hạn request ở proxy. Không mở database công khai. Không dùng chế độ thử ChatGPT làm kho bán hàng thật cho nhiều nhân viên.

Database trong Docker nằm ở volume `postgres-data`; tệp tải lên nằm ở `uploads`. Sao lưu cả hai. Không dùng `docker compose down -v` nếu cần giữ dữ liệu. Chỉ restore vào môi trường đã kiểm tra; lưu bản sao trước khi nâng cấp migration.

Nguồn code có thể tiếp tục phát triển: bộ lọc/catalog hiện tải dữ liệu theo phạm vi rồi lọc trong bộ nhớ để dễ chạy bản nhỏ; với hàng chục nghìn mã cần chuyển truy vấn lọc sang SQL phân trang và bổ sung công cụ tìm kiếm. Rate limit hiện dùng scope/tài khoản; vận hành công khai cần thêm giới hạn theo IP ở reverse proxy, email verification/reset và giám sát lỗi. Kiểm tra luồng gửi yêu cầu và vận hành với PostgreSQL trước khi mở cho khách.

## 7. Kiểm tra

```powershell
npm run typecheck
npm test
npm run build:postgres
```

`npm test` dùng SQLite tích hợp trong Node 22.13+ / 24; không chạm database thật. Các kiểm thử gồm đặt đồng thời mã cuối, không tạo đơn trùng, giá phía server, giữ/trừ/giải phóng kho, giới hạn vai trò, phạm vi dữ liệu, quote version, tiếp nhận yêu cầu không thanh toán, sitemap và PDF nhiều trang. Xem `docs/VERIFICATION.md` để biết phần đã kiểm tra và giới hạn.

Đọc tiếp: [Cơ sở dữ liệu](docs/DATABASE.md) · [API](docs/API.md) · [Phát hành và Google](docs/PUBLISHING.md) · [Nguồn ảnh và thông số](docs/ASSETS.md).
