import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "喵星来信",
  description: "为已经离开的真实小猫，留一处温柔的陪伴和慢慢抵达的信。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
