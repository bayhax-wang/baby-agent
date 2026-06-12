import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { pickLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function Root() {
  const ck = (await cookies()).get("locale")?.value;
  const al = (await headers()).get("accept-language");
  redirect(`/${pickLocale(al, ck)}`);
}
