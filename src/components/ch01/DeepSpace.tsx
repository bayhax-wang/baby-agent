"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";

const T = {
  zh: {
    triggerTitle: "🛸 深层空间 · 与真实的 Claude Code 对照",
    triggerDesc: "教学版 30 行就是全部了吗？当然不是。进入二楼，看我们从本机真实安装的 Claude Code 里挖出的一手证据——不是转述，是 strings 命令亲手抓出来的。",
    enter: "进入深层空间 →",
    close: "✕ 返回地面",
    kicker: "DEEP SPACE · 二楼",
    title: "真实的循环长什么样",
    honesty: (
      <>
        <b>诚实声明：</b>GitHub 上的 anthropics/claude-code 仓库并不包含可读的 TypeScript 源码（那里是
        changelog、示例和插件）。本页证据来自三个渠道：① 对<b>本机安装的 Claude Code v2.1.175 二进制</b>直接跑{" "}
        <code>strings</code> 提取（一手，可复现）；② npm 包内官方的 <code>sdk-tools.d.ts</code> 类型定义（一手）；③
        社区项目 learn-claude-code 对打包代码的逆向分析（三方，已注明）。
      </>
    ),
    ev1Title: "stop_reason 的完整全集——就在二进制里",
    ev1P: "教学版只区分「是不是 tool_use」。真实二进制里能抓到全部 5 种停止原因。在你自己的机器上跑这条命令，立刻复现：",
    ev1P2: (
      <>
        <b>tool_use</b> 让循环继续；其余 4 种（end_turn / max_tokens / refusal / stop_sequence）各自需要不同的处理——
        比如 max_tokens 意味着话说一半被截断，生产级循环要决定是续写还是报错。这是教学版省掉的第一层复杂度。
      </>
    ),
    ev2Title: "while True 其实有保险丝：轮次上限",
    ev2P: (
      <>
        裸的 while True 可能永远跑下去。二进制里有两个环境变量：<code>CLAUDE_CODE_MAX_TURNS</code> 和{" "}
        <code>FORKED_AGENT_DEFAULT_MAX_TURNS</code>——主循环和子 Agent 的循环都有圈数熔断。模型决策，但 harness
        握着最终的拔插头权力。
      </>
    ),
    ev3Title: "循环里藏着记忆管理的钩子",
    ev3P: (
      <>
        二进制里有 <code>query_autocompact_start</code> / <code>query_autocompact_end</code> /{" "}
        <code>microcompact_boundary</code> 这样的埋点——说明<b>上下文压缩直接发生在 query 循环内部</b>
        ：每一圈开始前，harness 会检查 messages 是不是太长了，太长就先压缩再发请求。这是第 8 章「遗忘的艺术」的预告。
      </>
    ),
    ev4Title: "官方 sdk-tools.d.ts：这个循环驱动着 38 种工具",
    ev4P: (
      <>
        npm 包里带着一份官方生成的 <code>sdk-tools.d.ts</code>（约 13 万字符），定义了{" "}
        <b>38 个工具的输入 Schema</b>：Bash、FileRead、FileEdit、Glob、Grep、Agent（子代理）、TodoWrite、WebFetch……
        我们的教学版只接了 1 个 bash。第 2 章「双手」就从这里开始长出来。
      </>
    ),
    ev5Title: "三方情报：社区逆向看到的 query.ts",
    ev5P: (
      <>
        社区项目 learn-claude-code 对打包产物做过系统逆向，报告核心循环约 1729 行，并指出生产实现
        <b>不依赖 stop_reason 判断是否继续</b>——因为流式响应中 stop_reason 可能迟到，它改用「内容里出现 tool_use
        块就标记继续」的 needsFollowUp 旗标。此说法与我们在二进制里看到的流式架构一致，但行号无法独立验证，故标注为三方来源。
      </>
    ),
    sumTitle: "一句话带走",
    sum: (
      <>
        生产级的循环 = 教学版 30 行 + 完整的 stop_reason 分类处理 + 轮次熔断 + 循环内记忆管理 + 38 种工具的调度。
        <b>骨架一模一样，区别全是保护机制。</b>每一章我们长出一个新器官。
      </>
    ),
  },
  en: {
    triggerTitle: "🛸 Deep Space · compare with the real Claude Code",
    triggerDesc: "Is the 30-line teaching loop the whole story? Of course not. Step upstairs and see first-hand evidence we dug out of a real local Claude Code install — not hearsay, extracted with the strings command ourselves.",
    enter: "Enter deep space →",
    close: "✕ Back to ground",
    kicker: "DEEP SPACE · SECOND FLOOR",
    title: "What the real loop looks like",
    honesty: (
      <>
        <b>Honesty note:</b> the anthropics/claude-code repo on GitHub does not ship readable TypeScript source
        (it holds the changelog, examples and plugins). Evidence here comes from three channels: ① running{" "}
        <code>strings</code> directly on a <b>locally installed Claude Code v2.1.175 binary</b> (first-hand,
        reproducible); ② the official <code>sdk-tools.d.ts</code>{" "}type definitions inside the npm package
        (first-hand); ③ the community project learn-claude-code&apos;s reverse-engineering of the bundle
        (third-party, attributed).
      </>
    ),
    ev1Title: "The complete stop_reason set — right there in the binary",
    ev1P: "The teaching loop only asks “is it tool_use or not”. The real binary carries all five stop reasons. Run this on your own machine to reproduce:",
    ev1P2: (
      <>
        <b>tool_use</b>{" "}keeps the loop going; the other four (end_turn / max_tokens / refusal / stop_sequence) each
        demand different handling — max_tokens, for instance, means the reply was cut mid-sentence and a production
        loop must decide whether to continue or fail. That&apos;s the first layer of complexity the teaching version skips.
      </>
    ),
    ev2Title: "while True actually has a fuse: turn limits",
    ev2P: (
      <>
        A bare while-True could run forever. The binary exposes two env vars: <code>CLAUDE_CODE_MAX_TURNS</code> and{" "}
        <code>FORKED_AGENT_DEFAULT_MAX_TURNS</code> — both the main loop and subagent loops have a circuit breaker on
        round count. The model decides, but the harness holds the power plug.
      </>
    ),
    ev3Title: "Memory management hooks hide inside the loop",
    ev3P: (
      <>
        Markers like <code>query_autocompact_start</code> / <code>query_autocompact_end</code> /{" "}
        <code>microcompact_boundary</code> live in the binary — meaning <b>context compaction happens inside the query
        loop itself</b>: before each round the harness checks whether messages grew too long and compresses first.
        A teaser for Chapter 8, “The Art of Forgetting”.
      </>
    ),
    ev4Title: "Official sdk-tools.d.ts: this loop drives 38 tools",
    ev4P: (
      <>
        The npm package ships an officially generated <code>sdk-tools.d.ts</code> (~130k chars) defining input schemas
        for <b>38 tools</b>: Bash, FileRead, FileEdit, Glob, Grep, Agent (subagents), TodoWrite, WebFetch… Our teaching
        loop wires up exactly one bash. Chapter 2, “The Hands”, grows from here.
      </>
    ),
    ev5Title: "Third-party intel: query.ts as seen by community reverse-engineering",
    ev5P: (
      <>
        The community project learn-claude-code systematically reversed the bundle and reports a core loop of ~1,729
        lines, noting the production implementation <b>does not rely on stop_reason to decide continuation</b> — in
        streaming responses stop_reason can arrive late, so it sets a needsFollowUp flag whenever a tool_use block
        appears in content. Consistent with the streaming architecture we observe in the binary, but the line numbers
        can&apos;t be independently verified — hence the third-party label.
      </>
    ),
    sumTitle: "Take one sentence home",
    sum: (
      <>
        Production loop = the 30 teaching lines + full stop_reason taxonomy + turn fuses + in-loop memory management +
        scheduling for 38 tools. <b>Same skeleton; every difference is a protection mechanism.</b> Each chapter grows
        one new organ.
      </>
    ),
  },
};

export default function DeepSpace({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <div className="deep-trigger-card">
        <div>
          <h3>{t.triggerTitle}</h3>
          <p>{t.triggerDesc}</p>
        </div>
        <button className="btn glow" onClick={() => setOpen(true)}>{t.enter}</button>
      </div>

      {open && (
        <div className="deep" role="dialog" aria-modal>
          <button className="deep-close" onClick={() => setOpen(false)}>{t.close}</button>
          <div className="deep-inner">
            <div className="deep-kicker">{t.kicker}</div>
            <h2>{t.title}</h2>
            <div className="honesty">{t.honesty}</div>

            <div className="evidence">
              <span className="ev-tag bin">BINARY · FIRST-HAND</span>
              <h4>{t.ev1Title}</h4>
              <p>{t.ev1P}</p>
              <pre>{`$ strings "$(which claude | xargs dirname)/../lib/node_modules/\\
@anthropic-ai/claude-code/bin/claude.exe" \\
  | grep -E '^(tool_use|end_turn|max_tokens|stop_sequence|refusal)$' | sort -u
`}<span className="t-out">{`end_turn
max_tokens
refusal
stop_sequence
tool_use`}</span></pre>
              <p>{t.ev1P2}</p>
            </div>

            <div className="evidence">
              <span className="ev-tag bin">BINARY · FIRST-HAND</span>
              <h4>{t.ev2Title}</h4>
              <pre>{`$ strings claude.exe | grep -iE 'max.?turns'
`}<span className="t-out">{`CLAUDE_CODE_MAX_TURNS
FORKED_AGENT_DEFAULT_MAX_TURNS`}</span></pre>
              <p>{t.ev2P}</p>
            </div>

            <div className="evidence">
              <span className="ev-tag bin">BINARY · FIRST-HAND</span>
              <h4>{t.ev3Title}</h4>
              <pre>{`$ strings claude.exe | grep -E 'autocompact|microcompact'
`}<span className="t-out">{`query_autocompact_start
query_autocompact_end
microcompact_boundary
autocompact`}</span></pre>
              <p>{t.ev3P}</p>
            </div>

            <div className="evidence">
              <span className="ev-tag dts">SDK TYPES · FIRST-HAND</span>
              <h4>{t.ev4Title}</h4>
              <pre>{`// sdk-tools.d.ts (shipped in @anthropic-ai/claude-code)
export type ToolInputSchemas =
  | AgentInput | BashInput | FileEditInput | FileReadInput
  | FileWriteInput | GlobInput | GrepInput | TodoWriteInput
  | WebFetchInput | WebSearchInput | ... `}<span className="t-out">/* 38 in total */</span></pre>
              <p>{t.ev4P}</p>
            </div>

            <div className="evidence">
              <span className="ev-tag third">THIRD-PARTY · ATTRIBUTED</span>
              <h4>{t.ev5Title}</h4>
              <p>{t.ev5P}</p>
              <p>
                → <a href="https://github.com/shareAI-lab/learn-claude-code" target="_blank" rel="noreferrer">shareAI-lab/learn-claude-code</a>
              </p>
            </div>

            <div className="evidence" style={{ borderColor: "rgba(77,214,255,.4)" }}>
              <h4>💡 {t.sumTitle}</h4>
              <p>{t.sum}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
