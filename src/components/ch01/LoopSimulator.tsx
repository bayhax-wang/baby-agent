"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";

type Step = {
  code: string;
  lamp?: "thinking" | "on-tool" | "on-end";
  lampText?: string;
  round?: number;
  push?: { role: "user" | "assistant"; json: object; stop?: "tool_use" | "end_turn" };
  done?: boolean;
};

const CODE: { s: string; html: string }[] = [
  { s: "", html: `<span class="kw">def</span> <span class="fn">agent_loop</span>(messages):` },
  { s: "loop", html: `    <span class="kw">while</span> <span class="kw">True</span>:` },
  { s: "call", html: `        response = client.messages.create(` },
  { s: "call", html: `            model=MODEL, system=SYSTEM, messages=messages,` },
  { s: "call", html: `            tools=TOOLS, max_tokens=<span class="num">8000</span>,` },
  { s: "call", html: `        )` },
  { s: "", html: `` },
  { s: "append", html: `        messages.append(` },
  { s: "append", html: `            {<span class="st">"role"</span>: <span class="st">"assistant"</span>, <span class="st">"content"</span>: response.content})` },
  { s: "", html: `` },
  { s: "check", html: `        <span class="kw">if</span> response.stop_reason != <span class="st">"tool_use"</span>:` },
  { s: "exit", html: `            <span class="kw">return</span>  <span class="cm"># no tool call → done</span>` },
  { s: "", html: `` },
  { s: "exec", html: `        results = []` },
  { s: "exec", html: `        <span class="kw">for</span> block <span class="kw">in</span> response.content:` },
  { s: "exec", html: `            <span class="kw">if</span> block.type == <span class="st">"tool_use"</span>:` },
  { s: "exec", html: `                output = <span class="fn">run_bash</span>(block.input[<span class="st">"command"</span>])` },
  { s: "exec", html: `                results.append({` },
  { s: "exec", html: `                    <span class="st">"type"</span>: <span class="st">"tool_result"</span>,` },
  { s: "exec", html: `                    <span class="st">"tool_use_id"</span>: block.id,` },
  { s: "exec", html: `                    <span class="st">"content"</span>: output })` },
  { s: "", html: `` },
  { s: "feed", html: `        messages.append(` },
  { s: "feed", html: `            {<span class="st">"role"</span>: <span class="st">"user"</span>, <span class="st">"content"</span>: results})` },
];

const NARR = {
  zh: [
    <>进入 <b>while True</b>。用户的问题先成为第一条消息：<code>messages[0]</code>。</>,
    <><b>第 1 圈 · 调用 LLM。</b>messages + 工具定义一起发过去。注意：工具定义只是一段 JSON Schema——模型自己执行不了任何东西。</>,
    <>模型回来了！content 里有一个 <b>tool_use 块</b>——它想跑 <code>find</code>。先把这条 assistant 回复 append 进 messages。</>,
    <>检查信号：<code>stop_reason == &quot;tool_use&quot;</code> → 模型在举手要工具，<b>不退出</b>，继续往下。</>,
    <><b>harness 出场：</b>真的去 shell 跑 <code>find</code>，拿到输出，打包成 tool_result（带 tool_use_id 对号入座）。</>,
    <>关键一步：tool_result 以 <b>role: &quot;user&quot;</b> 的消息喂回去（API 的约定）。然后——回到 while 开头。</>,
    <><b>第 2 圈 · 再次调用 LLM。</b>这次模型能&quot;看到&quot;命令输出了——这就是循环的全部意义。</>,
    <>模型读完结果给出最终回答——content 里<b>只有 text，没有 tool_use</b>。</>,
    <><code>stop_reason != &quot;tool_use&quot;</code> → <b style={{ color: "var(--red)" }}>return，循环退出</b> ✅ 模型决策了 2 次，harness 执行了 1 次，messages 里留下完整轨迹。</>,
  ],
  en: [
    <>Enter <b>while True</b>. The user&apos;s question becomes the first message: <code>messages[0]</code>.</>,
    <><b>Round 1 · Call the LLM.</b> messages + tool definitions go over the wire. Note: a tool definition is just JSON Schema — the model can&apos;t execute anything itself.</>,
    <>The model is back! Its content holds a <b>tool_use block</b> — it wants to run <code>find</code>. Append this assistant reply to messages first.</>,
    <>Check the signal: <code>stop_reason == &quot;tool_use&quot;</code> → the model is raising its hand. <b>Don&apos;t exit</b> — keep going.</>,
    <><b>The harness steps in:</b> actually run <code>find</code> in a shell, collect the output, wrap it as a tool_result (tool_use_id links it back).</>,
    <>The key move: the tool_result goes back as a <b>role: &quot;user&quot;</b> message (that&apos;s the API convention). Then — back to the top of the while.</>,
    <><b>Round 2 · Call the LLM again.</b> Now the model can &quot;see&quot; the command output — that is the entire point of the loop.</>,
    <>The model reads the result and answers — content holds <b>only text, no tool_use</b>.</>,
    <><code>stop_reason != &quot;tool_use&quot;</code> → <b style={{ color: "var(--red)" }}>return — the loop exits</b> ✅ The model decided twice, the harness executed once, and messages holds the full trace.</>,
  ],
};

const TRACE: Step[] = [
  { code: "loop", push: { role: "user", json: { role: "user", content: "List all Python files in this directory" } } },
  { code: "call", lamp: "thinking", lampText: "requesting…", round: 1 },
  {
    code: "append", lamp: "on-tool", lampText: 'stop_reason: "tool_use"',
    push: {
      role: "assistant",
      json: { role: "assistant", content: [{ type: "tool_use", id: "toolu_01A8…", name: "bash", input: { command: 'find . -name "*.py" -maxdepth 1' } }] },
      stop: "tool_use",
    },
  },
  { code: "check" },
  { code: "exec" },
  {
    code: "feed",
    push: { role: "user", json: { role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_01A8…", content: "./agent.py\n./hello.py" }] } },
  },
  { code: "call", lamp: "thinking", lampText: "requesting…", round: 2 },
  {
    code: "append", lamp: "on-end", lampText: 'stop_reason: "end_turn"',
    push: { role: "assistant", json: { role: "assistant", content: [{ type: "text", text: "Found 2 Python files: agent.py and hello.py" }] }, stop: "end_turn" },
  },
  { code: "exit", done: true },
];

const T = {
  zh: { next: "下一步 →", auto: "▶ 自动播放", pause: "⏸ 暂停", reset: "↺ 重置", rounds: "循环圈数", empty: "// messages = [] —— 还是空的", intro: <>用户输入了：<b>&quot;List all Python files in this directory&quot;</b>。准备好就点「下一步 →」。</> },
  en: { next: "Next →", auto: "▶ Auto-play", pause: "⏸ Pause", reset: "↺ Reset", rounds: "loop rounds", empty: "// messages = [] — still empty", intro: <>The user typed: <b>&quot;List all Python files in this directory&quot;</b>. Hit “Next →” when ready.</> },
};

export default function LoopSimulator({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [i, setI] = useState(-1);
  const [msgs, setMsgs] = useState<NonNullable<Step["push"]>[]>([]);
  const [rounds, setRounds] = useState(0);
  const [lamp, setLamp] = useState<{ cls: string; text: string }>({ cls: "", text: "stop_reason: —" });
  const [auto, setAuto] = useState(false);
  const stackRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const iRef = useRef(-1);

  useEffect(() => {
    stackRef.current && (stackRef.current.scrollTop = stackRef.current.scrollHeight);
  }, [msgs]);

  function applyStep(idx: number) {
    const s = TRACE[idx];
    if (s.push) setMsgs((m) => [...m, s.push!]);
    if (s.round) setRounds(s.round);
    if (s.lamp) setLamp({ cls: s.lamp, text: s.lampText! });
    if (s.done) stopAuto();
  }
  function step() {
    const nxt = iRef.current + 1;
    if (nxt >= TRACE.length) return;
    iRef.current = nxt;
    setI(nxt);
    applyStep(nxt);
  }
  function stopAuto() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setAuto(false);
  }
  function toggleAuto() {
    if (auto) return stopAuto();
    setAuto(true);
    step();
    timer.current = setInterval(() => {
      if (iRef.current + 1 >= TRACE.length) stopAuto();
      else step();
    }, 2600);
  }
  function reset() {
    stopAuto();
    iRef.current = -1;
    setI(-1);
    setMsgs([]);
    setRounds(0);
    setLamp({ cls: "", text: "stop_reason: —" });
  }
  useEffect(() => () => stopAuto(), []);

  const cur = i >= 0 ? TRACE[i] : null;
  const done = !!cur?.done;

  return (
    <>
      <div className="sim-grid">
        <div className="panel">
          <div className="panel-head">
            <span className="dot r" /><span className="dot y" /><span className="dot g" />
            &nbsp;agent.py · agent_loop()
          </div>
          <pre className="code">
            {CODE.map((l, k) => (
              <span
                key={k}
                className={`ln ${cur && l.s && l.s === cur.code ? "hl" : ""}`}
                dangerouslySetInnerHTML={{ __html: l.html || " " }}
              />
            ))}
          </pre>
        </div>
        <div className="panel">
          <div className="sim-status">
            <span className={`lamp ${lamp.cls}`}><i /><span>{lamp.text}</span></span>
            <span className="loop-counter">{t.rounds}: <b>{rounds}</b></span>
            <span className="loop-counter">messages.length = <b>{msgs.length}</b></span>
          </div>
          <div className="panel-body" ref={stackRef} style={{ minHeight: 380, maxHeight: 520 }}>
            {msgs.length === 0 && (
              <div style={{ color: "var(--dim)", fontSize: 13.5, fontFamily: "var(--mono)" }}>{t.empty}</div>
            )}
            {msgs.map((m, k) => (
              <div key={k} className={`msg-stack-item role-${m.role}`}>
                <div className="idx">
                  <span>
                    messages[{k}]{" "}
                    <span className={`role-pill ${m.role === "user" ? "u" : "a"}`}>{m.role}</span>
                  </span>
                  {m.stop && (
                    <span className={`badge ${m.stop === "tool_use" ? "tool" : "end"}`} style={{ fontSize: 10, padding: "1px 7px" }}>
                      stop_reason: {m.stop}
                    </span>
                  )}
                </div>
                <pre>{JSON.stringify(m.json, null, 1)}</pre>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sim-narration">{i < 0 ? t.intro : NARR[locale][i]}</div>

      <div className="sim-controls">
        <button className="btn primary" onClick={step} disabled={done}>{t.next}</button>
        <button className="btn" onClick={toggleAuto} disabled={done}>{auto ? t.pause : t.auto}</button>
        <button className="btn" onClick={reset}>{t.reset}</button>
      </div>
    </>
  );
}
