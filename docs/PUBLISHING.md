# Đưa SpaceTech lên tên miền và Google

SpaceTech hiện dùng bản xem thử riêng để duyệt. Bản chạy công khai dùng Next.js + PostgreSQL. Khách gửi yêu cầu đặt hàng và người bán xem trong **Admin → Đơn hàng**. Đăng ký tên miền, đưa website lên máy chủ và lập chỉ mục Google là ba bước riêng.

## 1. Chuẩn bị dữ liệu và tên miền

- Chọn một tên miền bạn sở hữu hoặc đăng ký tên miền còn trống. Ví dụ trong tài liệu dùng `spacetech.example` làm chỗ điền.
- Chuẩn bị một VPS có IP công khai, SSH, Docker Engine và Docker Compose. Cần lưu bền vững dữ liệu PostgreSQL và ảnh tải lên.
- Điền thông tin người bán, danh mục, giá, tồn kho, chính sách xử lý yêu cầu, giao hàng và bảo mật. Rà soát thủ tục áp dụng với cơ quan có thẩm quyền trước khi mở cho khách. Việc bỏ chức năng thanh toán trực tuyến không tự xác định website có phải làm thủ tục hay không. Cổng thông tin thương mại điện tử của Bộ Công Thương: <https://online.gov.vn/>.

## 2. Chạy bản chuẩn bị trên VPS

Chuyển ZIP lên VPS, giải nén và vào thư mục chứa `compose.yaml`. Cài Docker và Compose theo tài liệu của hệ điều hành bạn dùng. Tạo `.env` từ `.env.example` nếu chưa có:

```bash
cp -n .env.example .env
openssl rand -hex 32
```

Trong `.env`, đặt `POSTGRES_PASSWORD` riêng bằng chữ và số, đồng bộ mật khẩu trong `DATABASE_URL`, dán chuỗi ngẫu nhiên vào `AUTH_SECRET`. Đặt `WEB_BIND_ADDRESS="127.0.0.1"`, `APP_URL="http://localhost:3000"` và `INDEX_PUBLIC_SITE="false"`. Điền `ADMIN_EMAIL` và `ADMIN_PASSWORD` để tạo tài khoản theo README.

```bash
docker compose up -d --build
docker compose ps
docker compose logs --tail=50 web
docker compose exec web npm run db:seed
docker compose exec web npm run admin:create
```

Chờ web sẵn sàng trước khi chạy hai lệnh `exec`. Xóa giá trị `ADMIN_PASSWORD` khỏi `.env` sau khi tạo, rồi chạy `docker compose up -d --force-recreate web`.

Để mở bản đang chuẩn bị từ máy tính của bạn, tạo SSH tunnel (thay `user` và `IP_VPS`):

```bash
ssh -N -L 3000:127.0.0.1:3000 user@IP_VPS
```

Giữ cửa sổ SSH mở và vào `http://localhost:3000`. Nếu đã có một website dùng cổng 3000 trên máy tính, dừng website đó trước. Đăng nhập và kiểm tra một đơn thử trong Admin. Cập nhật sản phẩm và thông tin thật trước khi bỏ dấu **Hiển thị thông báo dữ liệu mẫu** trong **Admin → Cấu hình website**. Với từng sản phẩm thật, bỏ dấu dữ liệu mẫu trong màn sửa sản phẩm. Ẩn những mã mẫu chưa dùng.

## 3. Mở website qua HTTPS

Trong trang quản lý DNS của tên miền, tạo bản ghi **A** cho tên miền bạn định dùng trỏ vào IPv4 của VPS. Nếu dùng tên miền gốc, nhiều nhà cung cấp dùng `@` làm tên bản ghi. Không tạo AAAA trừ khi VPS có IPv6 hoạt động. Cho phép kết nối tới VPS ở cổng 80 và 443, giữ 5432 và 3000 chỉ ở loopback. Kiểm tra DNS trỏ đúng IP và cổng 80/443 đang trống.

Đổi `.env` sang tên miền thật:

```dotenv
SITE_DOMAIN="spacetech.example"
APP_URL="https://spacetech.example"
WEB_BIND_ADDRESS="127.0.0.1"
INDEX_PUBLIC_SITE="false"
```

Dùng cùng một tên miền trong hai giá trị đầu. Chạy cấu hình có proxy HTTPS đi kèm:

```bash
docker compose -f compose.yaml -f compose.public.yaml up -d --build
docker compose -f compose.yaml -f compose.public.yaml logs --tail=60 proxy
```

Proxy Caddy sẽ phục vụ website và xin chứng chỉ HTTPS khi tên miền trỏ đúng và máy chủ truy cập được. Mở tên miền trên trình duyệt. Kiểm tra truy cập khách, đặt thử, đơn xuất hiện trong Admin, HTTPS và chính sách bảo mật. Các yêu cầu đã gửi nằm trong Admin. Bản này chưa gửi email thông báo tự động.

`INDEX_PUBLIC_SITE=false` chỉ kiểm soát lập chỉ mục. Việc bật proxy HTTPS ở bước này sẽ cho phép khách truy cập qua tên miền.

## 4. Đưa vào Google Search

1. Sau khi nghiệm thu website công khai, đặt `INDEX_PUBLIC_SITE="true"` và chạy `docker compose -f compose.yaml -f compose.public.yaml up -d --force-recreate web`.
2. Mở `https://TEN_MIEN/robots.txt` và `https://TEN_MIEN/sitemap.xml`. Tệp sitemap phải dùng đúng tên miền và chứa các trang giới thiệu, danh mục, bài viết và mã sản phẩm thật. Nếu sitemap trống, kiểm tra `APP_URL`, `INDEX_PUBLIC_SITE` và chế độ mẫu.
3. Mở [Google Search Console](https://search.google.com/search-console), thêm thuộc tính **Tên miền**, rồi sao chép chính xác giá trị **TXT** Google đưa vào trang quản lý DNS. Bấm **Xác minh** khi DNS đã nhận bản ghi.
4. Trong **Sơ đồ trang web**, gửi `https://TEN_MIEN/sitemap.xml`. Dùng **Kiểm tra URL** cho trang chủ và trang sản phẩm quan trọng, rồi yêu cầu lập chỉ mục nếu đủ điều kiện.

Google tự quyết định thời điểm và việc hiển thị từng URL. Gửi sitemap giúp Google tìm URL. Bản xem thử riêng và các trang giỏ hàng, gửi yêu cầu, tài khoản, quản trị không dùng để lập chỉ mục.

Tài liệu Google: [Xác minh quyền sở hữu](https://support.google.com/webmasters/answer/9008080) · [Tạo và gửi sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) · [Yêu cầu Google thu thập lại URL](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl).
