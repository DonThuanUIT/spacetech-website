import { expire } from "../server/store";
import { query, prisma } from "../server/runtime-node";
await expire("shop");
await query("DELETE FROM sessions WHERE expires<?", [Date.now()]);
await query("DELETE FROM rate_limits WHERE expires<?", [Date.now()]);
console.log("Đã dọn đơn mới quá hạn, phiên và bộ đếm hết hạn.");
await prisma.$disconnect();
