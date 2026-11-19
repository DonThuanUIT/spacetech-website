# Đưa SpaceTech lên tên miền và Google

SpaceTech chạy trên **Vibe Host của Mắt Bão** với Next.js + PostgreSQL. Khách gửi yêu cầu đặt hàng và người bán xem trong **Admin → Đơn hàng**. Tài liệu này hướng dẫn quy trình deploy, cấu hình và đưa website lên Google Search.

## 1. Chuẩn bị dữ liệu và tên miền

- Chuẩn bị một tên miền bạn sở hữu hoặc đăng ký tên miền còn trống.
- Điền thông tin người bán, danh mục, giá, tồn kho, chính sách xử lý yêu cầu, giao hàng và bảo mật. Rà soát thủ tục áp dụng với cơ quan có thẩm quyền trước khi mở cho khách. Cổng thông tin thương mại điện tử của Bộ Công Thương: <https://online.gov.vn/>.

## 2. Deploy lên Vibe Host Mắt Bão

### 2.1. Cấu hình biến môi trường

Trong **panel Mắt Bão**, tìm mục cấu hình biến môi trường (Environment Variables) của ứng dụng và điền các giá trị sau:

| Biến | Mô tả |
| --- | --- |
| `DATABASE_URL` | Chuỗi kết nối PostgreSQL do Mắt Bão cấp — lấy trong mục Database trên panel |
| `AUTH_SECRET` | Chuỗi ngẫu nhiên tối thiểu 32 ký tự — tạo bằng lệnh bên dưới |
| `APP_URL` | URL HTTPS đầy đủ của website, ví dụ `https://spacetech.vn` |
| `UPLOAD_DIR` | Đường dẫn thư mục lưu file upload, ví dụ `./data/uploads` |
| `INDEX_PUBLIC_SITE` | `false` trong giai đoạn chuẩn bị; `true` sau khi nghiệm thu |

Tạo `AUTH_SECRET` ngẫu nhiên trên máy tính:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Dán kết quả vào ô `AUTH_SECRET` trên panel. Không dùng chuỗi dễ đoán hoặc giống `AUTH_SECRET` của môi trường khác.

### 2.2. Liên kết Git và Deploy

1. Trong panel Mắt Bão, liên kết ứng dụng với Git repository chứa mã nguồn SpaceTech.
2. Push code lên nhánh đã liên kết (thường là `main`).
3. Vào panel, chọn ứng dụng và nhấn **Deploy** để triển khai phiên bản mới. Quá trình build diễn ra tự động; theo dõi log build để phát hiện lỗi.

> [!NOTE]
> Vibe Host không tự deploy khi push — bạn phải nhấn **Deploy** thủ công trên panel sau mỗi lần push code mới.

### 2.3. Chạy migration database

Sau khi deploy thành công lần đầu, chạy migration để tạo cấu trúc bảng trong PostgreSQL. Thực hiện từ **terminal/console** trên panel (nếu Mắt Bão cung cấp):

```bash
npm run db:deploy
```

Lệnh này chạy `prisma migrate deploy` — áp dụng toàn bộ migration SQL vào database PostgreSQL của Vibe Host. Chỉ cần chạy một lần lúc đầu và mỗi khi có migration mới.

> [!IMPORTANT]
> Nếu panel không có terminal, liên hệ hỗ trợ Mắt Bão để yêu cầu chạy lệnh migration hoặc hỏi về cách thực hiện migration qua panel.

### 2.4. Seed dữ liệu mẫu (lần đầu)

```bash
npm run db:seed
```

Tạo 4 thương hiệu, 6 danh mục và 6 sản phẩm mẫu để kiểm tra. Lệnh bỏ qua nếu dữ liệu đã tồn tại — không ghi đè cửa hàng đã có.

### 2.5. Tạo tài khoản admin

Trên panel, thêm tạm thời 3 biến môi trường sau rồi nhấn **Deploy** lại (hoặc restart app):

| Biến | Giá trị |
| --- | --- |
| `ADMIN_EMAIL` | Email đăng nhập admin |
| `ADMIN_PASSWORD` | Mật khẩu ít nhất 12 ký tự |
| `ADMIN_NAME` | Tên hiển thị, ví dụ `SpaceTech Admin` |

Sau khi app chạy lại, thực hiện từ terminal/console:

```bash
npm run admin:create
```

**Quan trọng:** Sau khi tạo xong, **xóa ngay** `ADMIN_PASSWORD` khỏi biến môi trường trên panel và Deploy lại để bỏ mật khẩu khỏi môi trường runtime. Giữ lại `ADMIN_EMAIL` và `ADMIN_NAME`.

### 2.6. Kiểm tra bản chuẩn bị

Mở URL của ứng dụng trên panel. Đăng nhập tại `/dang-nhap` bằng tài khoản admin vừa tạo, rồi vào `/admin` để:

- Kiểm tra 6 sản phẩm mẫu xuất hiện.
- Thêm thương hiệu và danh mục thật tại **Danh mục & Hãng**.
- Thêm sản phẩm thật, bỏ dấu **Giá và tồn kho minh họa** khi đã xác nhận dữ liệu.
- Cập nhật thông tin cửa hàng tại **Cấu hình website** (logo, hotline, địa chỉ, MST).
- Gửi một yêu cầu thử từ trang khách và kiểm tra đơn xuất hiện trong Admin.

## 3. Mở website qua tên miền riêng

### 3.1. Trỏ DNS

Trong trang quản lý DNS của tên miền, tạo bản ghi **A** trỏ về IP máy chủ Vibe Host (lấy trong panel Mắt Bão). Nếu dùng tên miền gốc (không có `www`), nhiều nhà cung cấp dùng `@` làm tên bản ghi. Chờ DNS cập nhật (thường 5–30 phút).

### 3.2. Cấu hình tên miền trên panel

Trong panel Mắt Bão, thêm tên miền vào ứng dụng và bật HTTPS (Vibe Host tự cấp chứng chỉ Let's Encrypt). Sau khi kích hoạt, cập nhật biến môi trường:

```
APP_URL=https://ten-mien-cua-ban.vn
```

Nhấn **Deploy** để áp dụng. Mở tên miền trên trình duyệt, kiểm tra HTTPS và toàn bộ luồng khách → đơn hàng → Admin.

## 4. Đưa vào Google Search

1. Sau khi nghiệm thu website công khai, đặt `INDEX_PUBLIC_SITE=true` trong biến môi trường trên panel và nhấn **Deploy**.
2. Mở `https://ten-mien/robots.txt` và `https://ten-mien/sitemap.xml`. Sitemap phải dùng đúng tên miền và chứa các trang giới thiệu, danh mục, bài viết và mã sản phẩm thật. Nếu sitemap trống, kiểm tra `APP_URL` và `INDEX_PUBLIC_SITE`.
3. Mở [Google Search Console](https://search.google.com/search-console), thêm thuộc tính **Tên miền**, sao chép chính xác giá trị **TXT** Google đưa vào trang quản lý DNS. Bấm **Xác minh** khi DNS đã nhận bản ghi.
4. Trong **Sơ đồ trang web**, gửi `https://ten-mien/sitemap.xml`. Dùng **Kiểm tra URL** cho trang chủ và trang sản phẩm quan trọng, rồi yêu cầu lập chỉ mục nếu đủ điều kiện.

Google tự quyết định thời điểm và việc hiển thị từng URL. Gửi sitemap giúp Google tìm URL. Bản xem thử riêng và các trang giỏ hàng, gửi yêu cầu, tài khoản, quản trị không dùng để lập chỉ mục.

Tài liệu Google: [Xác minh quyền sở hữu](https://support.google.com/webmasters/answer/9008080) · [Tạo và gửi sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) · [Yêu cầu Google thu thập lại URL](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl).

## 5. Vận hành và cập nhật code

### Cập nhật code

1. Chỉnh sửa code trên máy local, test local nếu cần.
2. `git push` lên nhánh đã liên kết.
3. Vào panel Mắt Bão → nhấn **Deploy**.
4. Nếu có migration mới: chạy `npm run db:deploy` từ terminal/console trên panel sau khi deploy.

### Dữ liệu và sao lưu

- Database PostgreSQL do Mắt Bão quản lý. Liên hệ hỗ trợ Mắt Bão để hỏi về chính sách backup và cách export/import dữ liệu.
- File upload (ảnh, PDF) lưu tại thư mục `UPLOAD_DIR`. Kiểm tra xem Vibe Host có persistent storage hay không — nếu không, file sẽ mất khi deploy lại; cần dùng URL HTTPS ngoài thay cho file tải lên.
- Yêu cầu đơn hàng hết hạn sau 24 giờ nếu chưa được xác nhận. Trên Vibe Host không có cron tự động — cần thao tác thủ công hoặc hỏi Mắt Bão về scheduled jobs để chạy `npm run orders:expire`.
