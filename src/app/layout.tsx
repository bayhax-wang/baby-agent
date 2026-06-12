import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Anatomy · 把 Claude Code 拆开看",
  description:
    "An interactive, bilingual course that dissects how Claude Code works — by rebuilding its mechanisms one chapter at a time. 交互式双语教程：亲手重建 Claude Code 的每一个机制。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
