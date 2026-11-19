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

- Kiểm thử tự động chạy trên SQLite tích hợp sẵn trong Node (không cần PostgreSQL riêng để test). Trước khi mở bán, cần nghiệm thu toàn bộ luồng trên PostgreSQL thật của Vibe Host Mắt Bão.
- Kiểm thử thao tác Admin đầy đủ (thêm/sửa sản phẩm, duyệt đơn, xuất PDF) thực hiện bằng tài khoản admin thật trên Vibe Host sau khi deploy.
- App đã vận hành trên PostgreSQL của Vibe Host Mắt Bão; cần tiếp tục theo dõi lỗi và hiệu năng trong giai đoạn đầu.
- Chưa chạy load test quy mô lớn, pentest độc lập, hỗ trợ mọi trình duyệt/thiết bị và backup/restore PostgreSQL thực tế.

## Kịch bản nghiệm thu của chủ cửa hàng

1. Đăng nhập bản thử, vào Admin và kiểm tra 6 sản phẩm mẫu.
2. Sửa tên một sản phẩm, tải ảnh/PDF mẫu, lưu rồi mở cửa hàng để kiểm tra.
3. Gửi một yêu cầu đặt hàng thử. Chuyển xác nhận → chuẩn bị → giao → hoàn tất và kiểm tra số tồn.
4. Gửi RFQ từ trang khách; nhập giá/thuế, xuất PDF, phát hành phiên bản thứ hai và chuyển một bản thành đơn.
5. Thử tắt/bật hiển thị sản phẩm, thay banner/hotline, tải lại trang để kiểm tra tính bền vững.
6. Trên bản PostgreSQL, tạo riêng Kinh doanh/Kỹ thuật/Khách hàng; thử truy cập các API ngoài quyền và kiểm tra bị từ chối.
7. Chỉ thay dữ liệu thử bằng dữ liệu kinh doanh sau khi đối chiếu danh mục, tồn và điều khoản.

