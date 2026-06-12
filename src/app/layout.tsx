import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Baby Agent · 从一行循环养大一个 AI",
  description:
    "A cheerful, interactive, bilingual course where you raise an AI coding agent from scratch — it grows one new ability per chapter. 一个欢快的交互式双语教程：从零养大一只小 Agent，每章学会一项新本领。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
