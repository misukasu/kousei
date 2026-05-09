import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// ここでタブの名前と説明を設定します
export const metadata: Metadata = {
  title: "文章校正ツール",
  description: "一字下げやひらがな化を自動で行う校正支援ツールです",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>{children}</body>
    </html>
  );
}