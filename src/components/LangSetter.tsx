"use client";

import { useEffect } from "react";
import type { Locale } from "@/lib/i18n";

export default function LangSetter({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);
  return null;
}
