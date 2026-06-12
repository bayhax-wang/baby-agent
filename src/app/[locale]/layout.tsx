import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import LangSetter from "@/components/LangSetter";

export function generateStaticParams() {
  return [{ locale: "zh" }, { locale: "en" }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;

  return (
    <>
      <LangSetter locale={l} />
      <header className="site-header">
        <Link href={`/${l}`} className="site-logo">
          <span className="pulse" />
          Agent Anatomy
          <span style={{ color: "var(--dim)", fontWeight: 400, fontSize: 13 }}>
            {l === "zh" ? "· 把 Claude Code 拆开看" : "· taking Claude Code apart"}
          </span>
        </Link>
        <div className="header-right">
          <a className="gh" href="https://github.com/bayhax-wang/agent-anatomy" target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
          <LocaleSwitcher locale={l} />
        </div>
      </header>
      {children}
      <footer className="site-footer">
        {l === "zh" ? (
          <>
            开源于 <a href="https://github.com/bayhax-wang/agent-anatomy" target="_blank" rel="noreferrer">GitHub</a> · MIT ·
            灵感与课程脉络致谢 <a href="https://github.com/shareAI-lab/learn-claude-code" target="_blank" rel="noreferrer">shareAI-lab/learn-claude-code</a> ·
            深层空间的证据来自对本机 Claude Code 安装包的一手核查
          </>
        ) : (
          <>
            Open source on <a href="https://github.com/bayhax-wang/agent-anatomy" target="_blank" rel="noreferrer">GitHub</a> · MIT ·
            Course outline inspired by <a href="https://github.com/shareAI-lab/learn-claude-code" target="_blank" rel="noreferrer">shareAI-lab/learn-claude-code</a> ·
            Deep-space evidence verified first-hand against a local Claude Code install
          </>
        )}
      </footer>
    </>
  );
}
