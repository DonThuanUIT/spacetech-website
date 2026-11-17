# Kiểm tra và giới hạn

## Đã kiểm tra

- TypeScript bằng `npm run typecheck`.
- Build Next.js Node bằng `npm run build:postgres`.
- Build Worker/Vinext cho bản trực tuyến bằng quy trình hosting.
- 14 trường hợp tự động với SQLite thật, cùng module nghiệp vụ và API: tính giá server/nhân số lượng, idempotency, đặt đồng thời đơn vị tồn cuối cùng, rollback khi lỗi, chuyển trạng thái và kho, kỹ thuật không sửa giá, quote snapshot/phiên bản/chuyển đơn và gán giá đúng item_id khi thay thứ tự dòng, RFQ chưa gán mã và hết hạn, phân quyền/phạm vi dữ liệu/same-origin, upload và phạm vi đọc tệp, tiếp nhận yêu cầu không thanh toán, robots và sitemap, PDF tiếng Việt nhiều trang.
- Trình duyệt ở giao diện desktop: trang chủ, tìm “6ES7214”, chi tiết PLC, nút thêm giỏ và tổng tiền giỏ.
- Giao diện 390px được xem qua khung trình duyệt có viewport riêng để kiểm tra responsive.
- PDF kiểm thử A4 nhiều trang được render để kiểm tra tiếng Việt, bảng, header/footer và tổng tiền.

## Giới hạn kiểm tra

- Môi trường build không có PostgreSQL server để chạy integration test lên database PostgreSQL thật; kiểm thử giao dịch hiện chạy trên SQLite. Cần chạy migration và toàn bộ luồng với PostgreSQL đích trước mở bán.
- Môi trường xem giao diện cục bộ không cấp danh tính ChatGPT, nên không giả lập/bỏ qua đăng nhập để kiểm tra Admin bằng trình duyệt. Quyền Admin và nghiệp vụ đã kiểm tra qua adapter test; kiểm thử thao tác Admin đầy đủ bằng tài khoản chủ trong bản đã phát hành là bước nghiệm thu tiếp theo.
- Gửi yêu cầu được kiểm tra qua API và đọc lại trong Admin bằng tài khoản kiểm thử. Chưa vận hành trên máy chủ PostgreSQL của người dùng.
- Chưa chạy load test quy mô lớn, pentest độc lập, hỗ trợ mọi trình duyệt/thiết bị và backup/restore PostgreSQL thực tế.

## Kịch bản nghiệm thu của chủ cửa hàng

1. Đăng nhập bản thử, vào Admin và kiểm tra 6 sản phẩm mẫu.
2. Sửa tên một sản phẩm, tải ảnh/PDF mẫu, lưu rồi mở cửa hàng để kiểm tra.
3. Gửi một yêu cầu đặt hàng thử. Chuyển xác nhận → chuẩn bị → giao → hoàn tất và kiểm tra số tồn.
4. Gửi RFQ từ trang khách; nhập giá/thuế, xuất PDF, phát hành phiên bản thứ hai và chuyển một bản thành đơn.
5. Thử tắt/bật hiển thị sản phẩm, thay banner/hotline, tải lại trang để kiểm tra tính bền vững.
6. Trên bản PostgreSQL, tạo riêng Kinh doanh/Kỹ thuật/Khách hàng; thử truy cập các API ngoài quyền và kiểm tra bị từ chối.
7. Chỉ thay dữ liệu thử bằng dữ liệu kinh doanh sau khi đối chiếu danh mục, tồn và điều khoản.
