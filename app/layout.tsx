import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "SpaceTech | Thiết bị tự động hóa",
  description:
    "PLC, HMI, biến tần, cảm biến và thiết bị công nghiệp. Tư vấn mã hàng và báo giá B2B. Hotline 0706650020 và 0786882137.",
  icons: { icon: "/assets/spacetech-logo.png" },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
