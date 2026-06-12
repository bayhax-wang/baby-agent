"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";

type ChatMsg = { cls: string; who: string; body: React.ReactNode };
type TermLine = { type: "cmd" | "out" | "err" | "dim"; text: string };

const T = {
  zh: {
    task: "创建一个 hello.py，打印 \"Hello, World!\"，并运行它",
    chatTitle: "对话窗口（LLM）",
    termTitle: "你的终端 —— 真的可以打字",
    termHint: "点击终端打字 · 按 Tab 补全模型要的命令 · 或点击对话里的绿色命令自动输入",
    send: "发送任务 ▶",
    paste: "把输出粘贴回对话框 📋",
    narr0: "点「发送任务」，开始你的人肉 harness 生涯。",
    narrSent: "消息发出去了……模型在思考。",
    narrModel: "模型停了。它输出了命令，但它自己不会跑——现在轮到你：去右边终端把命令敲出来（或按 Tab 补全），回车执行。",
    narrRan: "命令跑完了。但模型看不到你的终端——点「粘贴回对话框」把输出搬回去。",
    narrPasted: "结果贴回去了，模型接着想……",
    wrongCmd: "✗ 这不是模型要的命令。按 Tab 自动补全，或点击对话里的绿色命令。",
    who_you: "你 → LLM",
    who_model: 'LLM · stop_reason: "tool_use" 🙋',
    who_model_final: "LLM（终于）",
    who_paste: "你 → LLM（粘贴 tool_result）",
    finalMsg: "✅ 全部完成！hello.py 已创建并成功运行，输出 \"Hello, World!\"。",
    finalNote: 'stop_reason: "end_turn" —— 这次它真的不需要工具了',
    narrDone: (a: number, k: number) =>
      `任务完成。一个巴掌大的小任务：你执行了 ${a} 次搬运、敲了 ${k} 个键。真实编码任务动辄几十个来回——是谁该被自动化，很明显了。`,
    fatigue: (a: number, k: number) => `搬运 ${a} 次 · 敲键 ${k} 下 🥵`,
    automate: "受够了！写个 while True 替我干 ⚡",
    narrAuto: "就是这个开关！把「跑命令 + 贴结果」写进循环，你就永远解放了。往下滑，看怎么写。",
    rounds: [
      { model: "好的！我先创建文件。请帮我执行：", after: "" },
      { model: "文件创建好了，现在运行它验证一下：", after: "" },
      { model: "保险起见，确认一下文件确实存在：", after: "" },
    ],
  },
  en: {
    task: 'Create a hello.py that prints "Hello, World!", then run it',
    chatTitle: "Chat window (LLM)",
    termTitle: "Your terminal — you can actually type here",
    termHint: "Click the terminal and type · press Tab to autocomplete the model's command · or click the green command in the chat",
    send: "Send task ▶",
    paste: "Paste output back to chat 📋",
    narr0: "Hit “Send task” to begin your career as a human harness.",
    narrSent: "Message sent… the model is thinking.",
    narrModel: "The model stopped. It produced a command but can't run it — your turn: type it in the terminal on the right (Tab completes), then press Enter.",
    narrRan: "Command finished. But the model can't see your terminal — click “Paste output back” to carry it over.",
    narrPasted: "Result pasted back. The model keeps thinking…",
    wrongCmd: "✗ That's not the command the model asked for. Press Tab to autocomplete, or click the green command in the chat.",
    who_you: "YOU → LLM",
    who_model: 'LLM · stop_reason: "tool_use" 🙋',
    who_model_final: "LLM (finally)",
    who_paste: "YOU → LLM (pasting tool_result)",
    finalMsg: '✅ All done! hello.py was created and runs correctly, printing "Hello, World!".',
    finalNote: 'stop_reason: "end_turn" — this time it truly needs no tool',
    narrDone: (a: number, k: number) =>
      `Done. For one palm-sized task you performed ${a} manual hops and ${k} keystrokes. Real coding tasks take dozens of round-trips — it's obvious who should be automated.`,
    fatigue: (a: number, k: number) => `${a} hops · ${k} keystrokes 🥵`,
    automate: "Enough! Write a while-True to replace me ⚡",
    narrAuto: "That's the switch. Put “run command + paste result” inside a loop and you're free forever. Scroll on to see how.",
    rounds: [
      { model: "Sure! First I'll create the file. Please run:", after: "" },
      { model: "File created. Now run it to verify:", after: "" },
      { model: "Just to be safe, confirm the file exists:", after: "" },
    ],
  },
};

const ROUNDS = [
  { cmd: `echo 'print("Hello, World!")' > hello.py`, out: "(no output)" },
  { cmd: "python hello.py", out: "Hello, World!" },
  { cmd: "ls -la hello.py", out: "-rw-r--r--  1 you  staff  23 Jun 12 10:30 hello.py" },
];

function confetti() {
  const colors = ["#4dd6ff", "#a78bfa", "#4ade80", "#fbbf24", "#f472b6"];
  for (let i = 0; i < 80; i++) {
    const p = document.createElement("div");
    p.className = "confetti-piece";
    const s = 6 + Math.random() * 8;
    p.style.cssText = `left:${Math.random() * 100}vw;width:${s}px;height:${s * 0.6}px;background:${colors[i % 5]};`;
    document.body.appendChild(p);
    const fall = p.animate(
      [
        { transform: "translateY(0) rotate(0deg)", opacity: 1 },
        { transform: `translateY(${innerHeight + 40}px) rotate(${360 + Math.random() * 720}deg)`, opacity: 0.8 },
      ],
      { duration: 1800 + Math.random() * 1600, easing: "cubic-bezier(.2,.6,.4,1)" }
    );
    fall.onfinish = () => p.remove();
  }
}

export default function HarnessGame({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [term, setTerm] = useState<TermLine[]>([]);
  const [input, setInput] = useState("");
  const [round, setRound] = useState(-1);
  const [phase, setPhase] = useState<"idle" | "model" | "ran" | "wait" | "done">("idle");
  const [narr, setNarr] = useState<React.ReactNode>(t.narr0);
  const [hops, setHops] = useState(0);
  const [keys, setKeys] = useState(0);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef(false);
  const hopsRef = useRef(0);
  const keysRef = useRef(0);
  const phaseRef = useRef<typeof phase>("idle");

  function go(p: typeof phase) {
    phaseRef.current = p;
    setPhase(p);
  }

  useEffect(() => {
    chatRef.current && (chatRef.current.scrollTop = chatRef.current.scrollHeight);
  }, [chat]);
  useEffect(() => {
    termRef.current && (termRef.current.scrollTop = termRef.current.scrollHeight);
  }, [term, input]);

  function addChat(m: ChatMsg) {
    setChat((c) => [...c, m]);
  }

  function startRound(r: number) {
    if (r >= ROUNDS.length) {
      addChat({
        cls: "msg-model",
        who: t.who_model_final,
        body: (
          <>
            {t.finalMsg}
            <br />
            <span style={{ color: "var(--dim)", fontSize: 13 }}>{t.finalNote}</span>
          </>
        ),
      });
      go("done");
      setNarr(t.narrDone(hopsRef.current, keysRef.current));
      return;
    }
    setRound(r);
    addChat({
      cls: "msg-model",
      who: t.who_model,
      body: (
        <>
          {t.rounds[r].model}
          <button className="cmd-chip" onClick={() => autoType(ROUNDS[r].cmd, r)} title="click to auto-type">
            $ {ROUNDS[r].cmd}
          </button>
        </>
      ),
    });
    go("model");
    setNarr(t.narrModel);
  }

  function send() {
    addChat({ cls: "msg-user", who: t.who_you, body: t.task });
    setNarr(t.narrSent);
    go("wait");
    setTimeout(() => startRound(0), 800);
  }

  function execute(cmd: string, r = round) {
    const expected = ROUNDS[r].cmd;
    if (cmd.trim() === "") return;
    if (cmd.trim() === expected) {
      setTerm((ls) => [...ls, { type: "cmd", text: cmd }, { type: "out", text: ROUNDS[r].out }]);
      setInput("");
      go("ran");
      setNarr(t.narrRan);
    } else {
      setTerm((ls) => [...ls, { type: "cmd", text: cmd }, { type: "err", text: t.wrongCmd }]);
      setInput("");
    }
  }

  function autoType(cmd: string, r: number) {
    if (phaseRef.current !== "model" || typingRef.current) return;
    typingRef.current = true;
    inputRef.current?.focus();
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setInput(cmd.slice(0, i));
      if (i >= cmd.length) {
        clearInterval(iv);
        typingRef.current = false;
        setTimeout(() => execute(cmd, r), 350);
      }
    }, 14);
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (typingRef.current) {
      e.preventDefault();
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      if (phase === "model") setInput(ROUNDS[round].cmd);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (phase === "model") execute(input);
      else {
        setTerm((ls) => [...ls, { type: "cmd", text: input }, { type: "dim", text: locale === "zh" ? "（现在不需要跑命令）" : "(no command needed right now)" }]);
        setInput("");
      }
      return;
    }
    if (e.key.length === 1 || e.key === "Backspace") {
      keysRef.current += 1;
      setKeys(keysRef.current);
    }
  }

  function pasteBack() {
    if (phase !== "ran") return;
    hopsRef.current += 1;
    setHops(hopsRef.current);
    addChat({
      cls: "msg-tool",
      who: t.who_paste,
      body: <span style={{ fontFamily: "var(--mono)", fontSize: 13 }}>{ROUNDS[round].out}</span>,
    });
    go("wait");
    setNarr(t.narrPasted);
    setTimeout(() => startRound(round + 1), 700);
  }

  function automate() {
    confetti();
    setNarr(<b>{t.narrAuto}</b>);
    setTimeout(() => document.getElementById("concept")?.scrollIntoView({ behavior: "smooth" }), 1500);
  }

  return (
    <>
      <div className="game-grid">
        <div className="panel">
          <div className="panel-head">
            <span className="dot r" /><span className="dot y" /><span className="dot g" />
            &nbsp;{t.chatTitle}
          </div>
          <div className="panel-body" ref={chatRef}>
            {chat.map((m, i) => (
              <div key={i} className={`chat-msg ${m.cls}`}>
                <div className="who">{m.who}</div>
                {m.body}
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="dot r" /><span className="dot y" /><span className="dot g" />
            &nbsp;{t.termTitle}
          </div>
          <div className="panel-body" ref={termRef} onClick={() => inputRef.current?.focus()}>
            <div className="term">
              {term.map((l, i) =>
                l.type === "cmd" ? (
                  <div key={i}><span className="t-prompt">you@laptop ~/demo $</span> <span className="t-cmd">{l.text}</span></div>
                ) : (
                  <div key={i} className={l.type === "out" ? "t-out" : l.type === "err" ? "t-err" : "t-dim"}>{l.text}</div>
                )
              )}
              <div>
                <span className="t-prompt">you@laptop ~/demo $</span>{" "}
                <span className="t-cmd">{input}</span>
                <span className={`caret ${focused ? "" : "idle"}`} />
              </div>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => !typingRef.current && setInput(e.target.value)}
                onKeyDown={onKey}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 1, height: 1 }}
                autoCapitalize="off" autoCorrect="off" spellCheck={false}
                aria-label="terminal input"
              />
            </div>
          </div>
          <div className="term-hint">{t.termHint}</div>
        </div>
      </div>

      <div className="game-narration">{narr}</div>

      <div className="game-actions">
        <button className="btn primary" onClick={send} disabled={phase !== "idle"}>{t.send}</button>
        <button className="btn" onClick={pasteBack} disabled={phase !== "ran"}>{t.paste}</button>
        {(hops > 0 || keys > 0) && <span className="fatigue">{t.fatigue(hops, keys)}</span>}
      </div>

      {phase === "done" && (
        <div className="game-actions">
          <button className="btn glow" onClick={automate}>{t.automate}</button>
        </div>
      )}
    </>
  );
}
