# Nguồn dữ liệu và hình ảnh

Logo `public/assets/spacetech-logo.png` và ảnh người liên hệ `public/assets/spacetech-khoa.png` do chủ cửa hàng cung cấp. Logo cũ `public/assets/logo.png` được lưu để hiển thị các bản báo giá đã tạo trước khi cập nhật nhận diện.

Sáu sản phẩm mẫu dùng mã thực tế. Giá, tồn kho và chính sách là minh họa; không phải cam kết thương mại, thông tin đại lý được ủy quyền hay hàng có sẵn. Link nguồn và PDF riêng của từng mã nằm trong `core/seed.ts`.

| Thiết bị | Nguồn đối chiếu |
| --- | --- |
| PLC 6ES7214-1AG40-0XB0 | https://sieportal.siemens.com/en-se/products-services/detail/6ES72141AG400XB0 |
| HMI 6AV2123-2GB03-0AX0 | https://sieportal.siemens.com/en-bg/products-services/detail/6AV2123-2GB03-0AX0 |
| FR-D720S-0.75K | https://mitsubishi-electric-eshop.mee.com/mee/FA_IA/en/EUR/Catalogue/Inverter/Main-Unit/FR-D720S-0-75K/p/000000000000233309 |
| MR-JE-40A | https://mitsubishi-electric-eshop.mee.com/mee/FA_IA/en/EUR/Catalogue/Servo/Servo-Amplifier/MR-JE-40A/p/000000000000268794 |
| E2E-X5MC112 2M | https://industrial.omron.eu/en/products/E2E-X5MC112-2M |
| LC1D09M7 | https://www.se.com/vn/vi/product/LC1D09M7/ |

`plc.svg`, `hmi.svg`, `inverter.svg`, `servo.svg`, `contactor.svg` là hình minh họa được tạo bằng SVG cho giao diện, không phải ảnh thật và không thể dùng để suy ra kích thước/chân đấu. `sensor.jpg` là ảnh đại diện dòng E2E của Omron. Cần thay ảnh có quyền sử dụng của cửa hàng trước khi vận hành thương mại. Tên thương hiệu được hiển thị như tên hãng của mã hàng, không có tuyên bố là đối tác chính thức.

Font Noto Sans có hỗ trợ tiếng Việt, subset được nhúng cho giao diện và PDF. Giấy phép ở `public/assets/fonts/LICENSE.txt`. Biểu tượng giao diện từ lucide-react; dependency có giấy phép riêng trong gói. Không cần truy cập Google Fonts khi xem website hoặc tạo PDF.
