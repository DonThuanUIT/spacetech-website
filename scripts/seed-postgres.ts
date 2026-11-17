import { seed } from "../server/store";
import { prisma } from "../server/runtime-node";
await seed("shop");
console.log(
  "Đã tạo dữ liệu mẫu. Cập nhật giá, tồn kho và chính sách trước khi bán thật.",
);
await prisma.$disconnect();
