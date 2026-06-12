import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n";

const CHAPTERS: { zh: [string, string]; en: [string, string] }[] = [
  { zh: ["心跳 · Agent Loop", "一个 while True 就是一条命"], en: ["The Heartbeat · Agent Loop", "One while-True is a life"] },
  { zh: ["双手 · Tool Use", "从一把瑞士军刀到一套工具箱"], en: ["The Hands · Tool Use", "From one Swiss knife to a toolbox"] },
  { zh: ["免疫系统 · Permissions", "哪些命令能碰，哪些不能"], en: ["The Immune System · Permissions", "What may run, and what must not"] },
  { zh: ["条件反射 · Hooks", "不经过大脑的快速反应"], en: ["The Reflexes · Hooks", "Reactions that skip the brain"] },
  { zh: ["前额叶 · Plan & Todo", "先想清楚，再动手"], en: ["The Planner · Plan & Todo", "Think first, then act"] },
  { zh: ["细胞分裂 · Subagents", "一个 Agent 孵出另一个"], en: ["Cell Division · Subagents", "An agent hatching agents"] },
  { zh: ["肌肉记忆 · Skills", "按需加载的专业技能"], en: ["Muscle Memory · Skills", "Expertise loaded on demand"] },
  { zh: ["遗忘的艺术 · Compaction", "上下文满了怎么办"], en: ["The Art of Forgetting · Compaction", "When the context fills up"] },
  { zh: ["海马体 · Memory", "跨会话的长期记忆"], en: ["The Hippocampus · Memory", "Long-term memory across sessions"] },
  { zh: ["人格 · System Prompt", "性格是怎么写出来的"], en: ["The Personality · System Prompt", "How character gets written"] },
  { zh: ["自愈 · Error Recovery", "出错之后不崩溃"], en: ["Self-Healing · Error Recovery", "Failing without falling over"] },
  { zh: ["任务清单 · Task System", "比一次对话更长的事"], en: ["The Task System", "Work longer than one conversation"] },
  { zh: ["后台代谢 · Background Tasks", "一边聊天一边干活"], en: ["Background Metabolism", "Working while talking"] },
  { zh: ["生物钟 · Cron", "到点就醒来的 Agent"], en: ["The Body Clock · Cron", "Agents that wake on schedule"] },
  { zh: ["蜂群 · Agent Teams", "多个 Agent 协同作战"], en: ["The Swarm · Agent Teams", "Many agents, one mission"] },
  { zh: ["蜂群语言 · Team Protocols", "Agent 之间怎么说话"], en: ["Swarm Protocols", "How agents talk to each other"] },
  { zh: ["自主神经 · Autonomy", "没人盯着也能干活"], en: ["The Autonomic System", "Working with nobody watching"] },
  { zh: ["平行宇宙 · Worktrees", "互不干扰的隔离副本"], en: ["Parallel Universes · Worktrees", "Isolated copies that never collide"] },
  { zh: ["外接器官 · MCP & Plugins", "把别人的能力接进来"], en: ["External Organs · MCP", "Plugging in outside abilities"] },
  { zh: ["完整躯体 · 总装", "把 19 个器官装回一个身体"], en: ["The Whole Body", "Reassembling all 19 organs"] },
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
          <div className="act-tag" style={{ letterSpacing: 4 }}>AGENT ANATOMY</div>
          <h1 className="hero-title" style={{ margin: "0 auto", maxWidth: 820 }}>
            {zh ? "不是读 Claude Code，是把它拆开，再亲手装回去" : "Don't just read Claude Code — take it apart and rebuild it with your own hands"}
          </h1>
          <p className="lede" style={{ margin: "24px auto 0", textAlign: "center" }}>
            {zh ? (
              <>每一章 = 一个能玩的交互装置 + 一段能跑的最小代码 + 一扇通往真实源码的「深层空间」。</>
            ) : (
              <>Every chapter = an interactive toy you can play with + a minimal runnable implementation + a &quot;deep space&quot; portal into the real shipped code.</>
            )}
          </p>
          <Link href={`/${l}/ch/01`} className="hero-cta" style={{ marginTop: 32 }}>
            {zh ? "从第 1 章「心跳」开始 →" : "Start with Chapter 1: The Heartbeat →"}
          </Link>
        </div>
      </div>

      <section style={{ paddingTop: 20 }}>
        <div className="wrap">
          <h2 style={{ fontSize: 26 }}>{zh ? "解剖图谱 · 20 个器官" : "The Anatomy Atlas · 20 Organs"}</h2>
          <p className="lede" style={{ marginBottom: 0 }}>
            {zh
              ? "一个 AI 编码 Agent 的完整身体。第 1 章已开放，其余正在孵化。"
              : "The complete body of an AI coding agent. Chapter 1 is live; the rest are incubating."}
          </p>
          <div className="chapter-grid">
            {CHAPTERS.map((c, i) => {
              const [title, desc] = c[l];
              const no = String(i + 1).padStart(2, "0");
              return i === 0 ? (
                <Link key={no} href={`/${l}/ch/01`} className="ch-card live">
                  <span className="live-pill">● LIVE</span>
                  <div className="ch-no">CH {no}</div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </Link>
              ) : (
                <div key={no} className="ch-card soon">
                  <div className="ch-no">CH {no}</div>
                  <h3>{title}</h3>
                  <p>{desc}{zh ? " · 孵化中 🥚" : " · incubating 🥚"}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
