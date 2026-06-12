export type Locale = "zh" | "en";

export const LOCALES: Locale[] = ["zh", "en"];

export function isLocale(v: string): v is Locale {
  return v === "zh" || v === "en";
}

export function pickLocale(acceptLanguage: string | null, cookie?: string): Locale {
  if (cookie && isLocale(cookie)) return cookie;
  const al = (acceptLanguage || "").toLowerCase();
  return al.includes("zh") ? "zh" : "en";
}
