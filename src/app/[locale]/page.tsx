import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n";

const CHAPTERS: { emoji: string; zh: [string, string]; en: [string, string] }[] = [
  { emoji: "🐣", zh: ["苏醒 · Agent Loop", "给它一次心跳，蛋就破壳了"], en: ["Wake Up · Agent Loop", "One heartbeat and the egg hatches"] },
  { emoji: "🙌", zh: ["长出双手 · Tool Use", "从一根手指到一双巧手"], en: ["Grow Hands · Tool Use", "From one finger to nimble hands"] },
  { emoji: "🛡️", zh: ["学会说不 · Permissions", "哪些能做，哪些不能碰"], en: ["Learn to Say No · Permissions", "What it may do, what it mustn't touch"] },
  { emoji: "⚡", zh: ["条件反射 · Hooks", "不用想就会的小动作"], en: ["Reflexes · Hooks", "Little moves that skip thinking"] },
  { emoji: "🗺️", zh: ["先想后做 · Plan & Todo", "学会做计划，不再瞎冲"], en: ["Think First · Plan & Todo", "Make a plan before charging in"] },
  { emoji: "👯", zh: ["分身术 · Subagents", "变出小伙伴一起帮忙"], en: ["Cloning · Subagents", "Conjure helpers to pitch in"] },
  { emoji: "🎒", zh: ["收纳本领 · Skills", "需要时才翻出来的招式"], en: ["Pack Skills", "Tricks pulled out only when needed"] },
  { emoji: "🧹", zh: ["学会忘记 · Compaction", "脑子塞满了怎么办"], en: ["Learn to Forget · Compaction", "What to do when the brain fills up"] },
  { emoji: "📔", zh: ["长期记忆 · Memory", "记住上次聊了啥"], en: ["Long-term Memory", "Remembering last time"] },
  { emoji: "😀", zh: ["有了性格 · System Prompt", "它的脾气是怎么写出来的"], en: ["A Personality · System Prompt", "How its temperament gets written"] },
  { emoji: "🩹", zh: ["摔倒爬起 · Error Recovery", "出错也不哭鼻子"], en: ["Bounce Back · Error Recovery", "Failing without crying"] },
  { emoji: "✅", zh: ["列清单 · Task System", "比一次聊天更长的事"], en: ["Make Lists · Task System", "Work longer than one chat"] },
  { emoji: "🎏", zh: ["一心多用 · Background Tasks", "边聊边干活"], en: ["Multitask · Background Tasks", "Working while chatting"] },
  { emoji: "⏰", zh: ["生物钟 · Cron", "到点自己醒来"], en: ["Body Clock · Cron", "Waking up on schedule"] },
  { emoji: "🐝", zh: ["组队 · Agent Teams", "喊上小伙伴一起干大事"], en: ["Team Up · Agent Teams", "Calling friends for the big job"] },
  { emoji: "💬", zh: ["队内黑话 · Team Protocols", "它们之间怎么聊天"], en: ["Team Slang · Protocols", "How they talk to each other"] },
  { emoji: "🦋", zh: ["自己拿主意 · Autonomy", "没人盯着也能干活"], en: ["Self-driving · Autonomy", "Working with nobody watching"] },
  { emoji: "🌌", zh: ["平行世界 · Worktrees", "各玩各的，互不打架"], en: ["Parallel Worlds · Worktrees", "Each plays apart, never collide"] },
  { emoji: "🔌", zh: ["外接装备 · MCP & Plugins", "装上别人造的超能力"], en: ["Plug-in Gear · MCP", "Snapping on others' superpowers"] },
  { emoji: "🎓", zh: ["毕业典礼 · 总装", "把 19 样本领装回一个身体"], en: ["Graduation · Assembly", "All 19 abilities back in one body"] },
];

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  const zh = l === "zh";

  return (
    <main>
      <div className="home-hero">
        <div className="wrap">
          <div className="act-tag">BABY AGENT · 20 CHAPTERS</div>
          <h1 className="hero-title" style={{ maxWidth: 820 }}>
            {zh ? <>别只是读 Claude Code<br />亲手从一行循环把它养大</> : <>Don&apos;t just read Claude Code<br />raise it from a single loop, by hand</>}
          </h1>
          <p className="lede">
            {zh ? (
              <>每一章，小 Agent 学会一项新本领。你会得到：一个<b>能玩的交互装置</b> + 一段<b>能跑的最小代码</b> + 一扇通往真实源码的<b>「深层空间」</b>。</>
            ) : (
              <>Each chapter, the baby agent learns one new ability. You get: a <b>playable interaction</b> + a <b>minimal runnable implementation</b> + a portal into real deployed code — the <b>&quot;Deep Space&quot;</b>.</>
            )}
          </p>
          <Link href={`/${l}/ch/01`} className="hero-cta">
            {zh ? "从第 1 章「苏醒」开始 →" : "Start with Chapter 1: Wake Up →"}
          </Link>
        </div>
      </div>

      <section style={{ paddingTop: 20 }}>
        <div className="wrap">
          <h2 style={{ fontSize: 26 }}>{zh ? "成长图谱 · 20 项本领" : "Growth Map · 20 Abilities"}</h2>
          <p className="lede" style={{ marginBottom: 0 }}>
            {zh
              ? "一只 AI 编码 Agent 从破壳到毕业的全过程。第 1 章已开放，其余正在孵化。"
              : "A coding agent's whole journey, from hatching to graduation. Chapter 1 is live; the rest are still in the egg."}
          </p>
          <div className="chapter-grid">
            {CHAPTERS.map((c, i) => {
              const [title, desc] = c[l];
              const no = String(i + 1).padStart(2, "0");
              return i === 0 ? (
                <Link key={no} href={`/${l}/ch/01`} className="ch-card live">
                  <span className="live-pill">● LIVE</span>
                  <div className="ch-no">{c.emoji} CH {no}</div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </Link>
              ) : (
                <div key={no} className="ch-card soon">
                  <div className="ch-no">{c.emoji} CH {no}</div>
                  <h3>{title}</h3>
                  <p>{desc}{zh ? " · 孵化中 🥚" : " · in the egg 🥚"}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
