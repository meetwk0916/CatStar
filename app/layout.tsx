import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "喵星来信",
  description: "为已经离开的真实小猫，留一处温柔的陪伴和慢慢抵达的信。",
};

// shortcut: Vinext omits viewport-fit in generated metadata, remove the explicit tag when it supports it.
export const viewport: Viewport = { width: undefined, initialScale: undefined };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      </head>
      <body>{children}</body>
    </html>
  );
}
