# API SpaceTech

Base `/api`. JSON UTF-8; lỗi dạng `{ "error": "Thông báo" }`. Trạng thái 400/401/403/404/409/429 theo validation, xác thực, quyền, tồn kho và giới hạn gửi. POST/PATCH/DELETE từ nguồn khác bị từ chối.

| Method | Endpoint | Quyền / chức năng |
| --- | --- | --- |
| GET | `/me` | Danh tính hiện tại và cờ demo |
| POST | `/bootstrap` | Khởi tạo dữ liệu mẫu cho người dùng đã đăng nhập bản thử |
| POST | `/login`, `/logout`, `/register` | Đăng nhập/đăng xuất/đăng ký khách bản PostgreSQL |
| GET | `/settings`, `/taxonomy` | Cấu hình công khai và danh mục/hãng |
| GET | `/products` | Catalog; query `q`, `brand_id`, `category_id`, `voltage`, `signal`, `protocol`, `power`, `current` |
| GET | `/products/:id-or-slug` | Chi tiết và thông số |
| GET | `/articles`, `/articles/:slug` | Bài viết đã xuất bản |
| POST | `/cart-price` | `{items:[{product_id,quantity}],zone}`; trả tổng server |
| POST | `/orders` | Gửi yêu cầu đến Admin; cần customer, items, UUID key và expected_total |
| POST | `/rfqs` | customer, items (mã tự do hoặc product_id), note |
| GET | `/account` | Đơn/RFQ thuộc danh tính đang đăng nhập |
| GET | `/assets/:id` | Tệp công khai trong phạm vi cửa hàng; có xác minh content-type |
| GET/POST | `/admin/products` | Xem cho nhân viên; tạo chỉ Admin |
| PATCH | `/admin/products/:id` | Admin hoặc kỹ thuật; backend khóa quyền sửa giá/kho/trạng thái của kỹ thuật |
| DELETE | `/admin/products/:id` | Admin; chuyển archived, không xóa lịch sử |
| POST | `/admin/upload` | Admin/kỹ thuật; multipart file; PNG/JPEG/WebP/PDF ≤10 MB |
| POST | `/admin/taxonomy` | Admin; type brands/categories, name, slug, parent_id tùy chọn |
| PATCH | `/admin/settings` | Admin; các trường cấu hình được cho phép |
| GET | `/admin/orders`, `/admin/orders/:id` | Admin/kinh doanh |
| PATCH | `/admin/orders/:id` | `{status}` theo máy trạng thái |
| GET | `/admin/rfqs`, `/admin/rfqs/:id` | Admin/kinh doanh |
| PATCH | `/admin/rfqs/:id` | Gán mã: `{item_id,product_id}` |
| POST | `/admin/quotes` | Phát hành báo giá; rfq_id, item_id/giá/thuế/giảm giá/lead_time/warranty từng dòng, shipping, valid_until, terms |
| GET | `/admin/quotes/:id` | Xem snapshot phiên bản |
| GET | `/admin/quotes/:id/pdf` | Tải PDF chỉ Admin/kinh doanh |
| POST | `/admin/quotes/:id` | Chuyển báo giá thành đơn, idempotent theo quote_id |
| GET/POST/PATCH | `/admin/users[/id]` | Admin; danh sách, tạo, sửa vai trò/trạng thái; không sửa quyền chính mình |
| GET/POST/PATCH | `/admin/articles[/id]` | Admin/kỹ thuật |
| GET | `/admin/audit` | Admin; 100 thao tác gần nhất |

## Ví dụ tạo đơn

Lấy `product_id` thật từ `/products`, tính tổng bằng `/cart-price`, rồi gửi:

```json
{
  "customer": {
    "name": "Khách kiểm thử",
    "phone": "0900000000",
    "email": "test@example.com",
    "company": "Doanh nghiệp minh họa",
    "tax_code": "",
    "address": "Địa chỉ minh họa để kiểm thử",
    "zone": "Hồ Chí Minh",
    "note": "Đơn kiểm thử"
  },
  "items": [{ "product_id": "ID_TU_API_PRODUCTS", "quantity": 1 }],
  "key": "UUID_MOI_CHO_MOT_Y_DINH_DAT_HANG",
  "expected_total": 6880000
}
```

`key` phải là UUID hợp lệ, dùng lại cùng key khi retry một yêu cầu. Tổng tiền ví dụ không phải giá được cam kết; server tính lại giá/tồn/phí và từ chối nếu `expected_total` không khớp. Không có trường đơn giá client nào được dùng để quyết định giá checkout.

## Xác thực và lưu trữ

PostgreSQL: bcrypt cost 12, JWT HS256 trong cookie HttpOnly/SameSite=Lax, 8 giờ, có session server để thu hồi và kiểm tra người dùng active mỗi request. HTTPS tạo cookie Secure. Không dùng mật khẩu admin mặc định.

Bản trực tuyến: danh tính ChatGPT do cổng hosting xác thực. Scope `preview:<user_id>`; mỗi người chỉ thao tác không gian của mình. Runtime này chỉ được dùng phía sau cổng hosting tin cậy, không đặt trực tiếp trên server công khai tin header tùy ý. Tệp khách hàng tải lên phải là tài liệu sản phẩm có thể công khai trong cửa hàng; không dùng khu upload này để lưu hợp đồng bí mật.
