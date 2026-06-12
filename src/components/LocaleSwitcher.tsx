"use client";

import { usePathname, useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";

export default function LocaleSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();

  function switchTo(next: Locale) {
    if (next === locale) return;
    document.cookie = `locale=${next};path=/;max-age=31536000`;
    const rest = pathname.replace(/^\/(zh|en)/, "");
    router.push(`/${next}${rest}`);
  }

  return (
    <div className="lang-switch" role="group" aria-label="language">
      <button className={locale === "zh" ? "on" : ""} onClick={() => switchTo("zh")}>中文</button>
      <button className={locale === "en" ? "on" : ""} onClick={() => switchTo("en")}>EN</button>
    </div>
  );
}
