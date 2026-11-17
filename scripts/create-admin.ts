import { query, hashPassword, prisma } from "../server/runtime-node";
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase(),
  password = process.env.ADMIN_PASSWORD,
  name = process.env.ADMIN_NAME || "SpaceTech Admin";
if (
  !email ||
  !/^\S+@\S+\.\S+$/.test(email) ||
  !password ||
  password.length < 12
)
  throw new Error(
    "Đặt ADMIN_EMAIL và ADMIN_PASSWORD (tối thiểu 12 ký tự) qua biến môi trường.",
  );
if (
  (
    await query("SELECT id FROM users WHERE scope=? AND email=?", [
      "shop",
      email,
    ])
  ).length
)
  throw new Error("Email đã tồn tại. Không ghi đè tài khoản.");
await query(
  "INSERT INTO users (id,scope,name,email,password_hash,role,status,created) VALUES (?,?,?,?,?,?,?,?)",
  [
    crypto.randomUUID(),
    "shop",
    name,
    email,
    await hashPassword(password),
    "admin",
    "active",
    Date.now(),
  ],
);
console.log(
  "Đã tạo quản trị viên. Xóa ADMIN_PASSWORD khỏi môi trường sau khi dùng.",
);
await prisma.$disconnect();
