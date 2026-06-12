"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animate, svg, utils, type JSAnimation } from "animejs";
import type { Locale } from "@/lib/i18n";

/* ─────────────────────────────────────────────────────────
   The Courier Game — an interactive animated diagram.
   LLM (left) emits command cards. YOU are the courier in the
   middle: click a card to carry it to the terminal (right),
   click the result to carry it back. After 3 round trips,
   one button replaces you with a while-True loop — and the
   cards start flying on their own.
   ───────────────────────────────────────────────────────── */

const ROUNDS = [
  { cmd: `echo 'print("hi")' > hello.py`, out: "(no output)" },
  { cmd: "python hello.py", out: "hi" },
  { cmd: "ls -la hello.py", out: "hello.py  ✓" },
];

type Phase =
  | "idle"      // before start
  | "thinking"  // llm pulsing
  | "emit"      // command chip waiting at LLM — click it
  | "flyCmd"    // chip flying to terminal
  | "running"   // terminal typing
  | "emitOut"   // output chip waiting at terminal — click it
  | "flyOut"    // chip flying back to LLM
  | "doneMsg"   // all rounds finished, automate button shows
  | "auto";     // loop took over

const T = {
  zh: {
    title: "对话窗口",
    you: (n: number) => `你已跑腿 ${n} 趟`,
    start: "发任务 ▶",
    automate: "⚡ 写个 while True 替你跑腿",
    next: "看看这个循环长什么样 ↓",
    cap: {
      idle: "LLM 很聪明，但它的命令出不了对话框。点「发任务」试试。",
      thinking: "LLM 在想……",
      emit: "命令开好了 📦 点击卡片，帮它送到终端",
      flyCmd: "送货中……",
      running: "终端执行中……",
      emitOut: "结果出来了 — 点击卡片，送回给 LLM",
      flyOut: "送回中……",
      doneMsg: "任务完成。但这么小的任务，你跑了 6 趟。",
      auto: "你下班了。while True 在替你跑腿 —— 这，就是 Agent Loop。",
    } as Record<Phase, string>,
  },
  en: {
    title: "Chat window",
    you: (n: number) => `${n} errands run`,
    start: "Send task ▶",
    automate: "⚡ Replace yourself with a while True",
    next: "See what that loop looks like ↓",
    cap: {
      idle: "The LLM is smart, but its commands can't leave the chat. Hit “Send task”.",
      thinking: "LLM is thinking…",
      emit: "Command ready 📦 — click the card to carry it to the terminal",
      flyCmd: "Delivering…",
      running: "Terminal running…",
      emitOut: "Result's out — click the card to carry it back to the LLM",
      flyOut: "Carrying back…",
      doneMsg: "Done. For this tiny task, you ran 6 errands.",
      auto: "You're off duty. while True runs the errands now — that is the Agent Loop.",
    } as Record<Phase, string>,
  },
};

const YOU_FACES = ["🧍", "🚶", "😅", "🥵"];

export default function CourierGame({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [phase, setPhase] = useState<Phase>("idle");
  const [round, setRound] = useState(0);
  const [trips, setTrips] = useState(0);
  const [termLines, setTermLines] = useState<{ k: "cmd" | "out"; text: string }[]>([]);
  const [chip, setChip] = useState<{ text: string; kind: "cmd" | "out" } | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const llmRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<HTMLDivElement>(null);
  const youRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLButtonElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const loopPathRef = useRef<SVGPathElement>(null);

  const anims = useRef<JSAnimation[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const phaseRef = useRef<Phase>("idle");

  const go = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  useEffect(() => {
    const a = anims.current;
    const tm = timers.current;
    return () => {
      a.forEach((x) => x.cancel());
      tm.forEach(clearTimeout);
    };
  }, []);

  /* position helpers (relative to stage) */
  function center(el: HTMLElement | null) {
    const s = stageRef.current!.getBoundingClientRect();
    const r = el!.getBoundingClientRect();
    return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 };
  }

  function pulse(el: HTMLElement | null, color: string) {
    if (!el) return;
    anims.current.push(
      animate(el, { scale: [1, 1.05, 1], duration: 420, ease: "inOutSine" })
    );
    el.style.boxShadow = `0 0 26px ${color}`;
    later(() => { el.style.boxShadow = ""; }, 500);
  }

  /* place chip near a station, pop it in */
  function showChip(kind: "cmd" | "out", text: string, at: "llm" | "term") {
    setChip({ text, kind });
    requestAnimationFrame(() => {
      const el = chipRef.current;
      if (!el || !stageRef.current) return;
      const stage = stageRef.current.getBoundingClientRect();
      const station = center(at === "llm" ? llmRef.current : termRef.current);
      const w = el.offsetWidth;
      const x = at === "llm"
        ? Math.min(station.x + 70, stage.width - w - 12)
        : Math.max(station.x - 70 - w, 12);
      el.style.left = `${x}px`;
      el.style.top = `${station.y - 18}px`;
      el.style.transform = "none";
      anims.current.push(
        animate(el, { scale: [0.4, 1], opacity: [0, 1], duration: 480, ease: "outBack(1.6)" })
      );
      anims.current.push(
        animate(el, { translateY: [0, -5, 0], duration: 1800, loop: true, ease: "inOutSine", delay: 500 })
      );
    });
  }

  /* fly chip to a station with an elegant arc, then resolve */
  function flyChip(to: "llm" | "term", after: () => void) {
    const el = chipRef.current;
    if (!el) return;
    utils.remove(el); // stop the hover bobbing
    const dest = center(to === "llm" ? llmRef.current : termRef.current);
    const r = el.getBoundingClientRect();
    const s = stageRef.current!.getBoundingClientRect();
    const cur = { x: r.left - s.left, y: r.top - s.top };
    const dx = dest.x - cur.x - r.width / 2;
    const dy = dest.y - cur.y - r.height / 2;
    anims.current.push(
      animate(el, {
        translateX: dx,
        translateY: [
          { to: dy - 64, duration: 420, ease: "outQuad" },
          { to: dy, duration: 380, ease: "inQuad" },
        ],
        rotate: [0, dx > 0 ? 4 : -4, 0],
        duration: 800,
        ease: "inOutSine",
        onComplete: () => {
          anims.current.push(
            animate(el, { scale: [1, 0.3], opacity: [1, 0], duration: 220, ease: "inQuad", onComplete: after })
          );
        },
      })
    );
    /* you hop along */
    if (youRef.current) {
      anims.current.push(
        animate(youRef.current.querySelector(".cr-face")!, {
          translateY: [0, -10, 0, -7, 0],
          duration: 760,
          ease: "inOutSine",
        })
      );
    }
  }

  /* ── game flow ── */
  function start() {
    go("thinking");
    pulse(llmRef.current, "rgba(129,140,248,.5)");
    later(() => emitCmd(0), 900);
  }

  function emitCmd(r: number) {
    setRound(r);
    go("emit");
    showChip("cmd", `$ ${ROUNDS[r].cmd}`, "llm");
  }

  function onChipClick() {
    const p = phaseRef.current;
    if (p === "emit") {
      go("flyCmd");
      setTrips((n) => n + 1);
      flyChip("term", () => {
        setChip(null);
        runTerminal();
      });
    } else if (p === "emitOut") {
      go("flyOut");
      setTrips((n) => n + 1);
      flyChip("llm", () => {
        setChip(null);
        pulse(llmRef.current, "rgba(129,140,248,.5)");
        const next = round + 1;
        if (next < ROUNDS.length) {
          go("thinking");
          later(() => emitCmd(next), 850);
        } else {
          go("doneMsg");
        }
      });
    }
  }

  function runTerminal() {
    go("running");
    pulse(termRef.current, "rgba(251,191,36,.45)");
    const r = ROUNDS[round];
    setTermLines((ls) => [...ls.slice(-3), { k: "cmd", text: `$ ${r.cmd}` }]);
    later(() => {
      setTermLines((ls) => [...ls.slice(-3), { k: "out", text: r.out }]);
      later(() => {
        go("emitOut");
        showChip("out", r.out, "term");
      }, 350);
    }, 750);
  }

  /* ── automation: you vanish, the loop takes over ── */
  function automate() {
    go("auto");

    /* 1. the courier clocks out */
    if (youRef.current) {
      anims.current.push(
        animate(youRef.current, { translateY: 36, opacity: 0, duration: 600, ease: "inQuad" })
      );
    }

    /* 2. draw the loop between LLM and terminal */
    const svgEl = svgRef.current!;
    const path = loopPathRef.current!;
    const s = stageRef.current!.getBoundingClientRect();
    svgEl.setAttribute("viewBox", `0 0 ${s.width} ${s.height}`);
    const a = center(llmRef.current);
    const b = center(termRef.current);
    const lift = Math.min(s.height * 0.3, 92);
    path.setAttribute(
      "d",
      `M ${a.x + 46} ${a.y} C ${a.x + (b.x - a.x) * 0.3} ${a.y - lift}, ${b.x - (b.x - a.x) * 0.3} ${b.y - lift}, ${b.x - 46} ${b.y}
       C ${b.x - (b.x - a.x) * 0.3} ${b.y + lift}, ${a.x + (b.x - a.x) * 0.3} ${a.y + lift}, ${a.x + 46} ${a.y}`
    );
    utils.set(path, { opacity: 1 });
    anims.current.push(
      animate(svg.createDrawable(path), {
        draw: ["0 0", "0 1"],
        duration: 1100,
        ease: "inOutSine",
        onComplete: () => {
          /* 3. pulses circulate forever */
          const mp = svg.createMotionPath(path);
          svgEl.querySelectorAll(".cr-pulse").forEach((dot, i) => {
            anims.current.push(
              animate(dot, {
                translateX: mp.translateX,
                translateY: mp.translateY,
                opacity: { from: 0, to: 1, duration: 240 },
                duration: 2400,
                delay: i * 800,
                loop: true,
                ease: "linear",
              })
            );
          });
        },
      })
    );

    /* 4. terminal keeps streaming on its own */
    let i = 0;
    const feed = () => {
      if (phaseRef.current !== "auto") return;
      const r = ROUNDS[i % ROUNDS.length];
      setTermLines((ls) => [...ls.slice(-3), i % 2 === 0 ? { k: "cmd", text: `$ ${r.cmd}` } : { k: "out", text: r.out }]);
      if (i % 2 === 0) pulse(termRef.current, "rgba(251,191,36,.35)");
      else pulse(llmRef.current, "rgba(129,140,248,.4)");
      i++;
      later(feed, 1200);
    };
    later(feed, 1300);
  }

  const face = YOU_FACES[Math.min(Math.floor(trips / 2), YOU_FACES.length - 1)];

  return (
    <div className="courier">
      <div className="courier-stage" ref={stageRef}>
        {/* loop svg (hidden until automation) */}
        <svg ref={svgRef} className="cr-svg" aria-hidden>
          <path ref={loopPathRef} fill="none" stroke="url(#cr-grad)" strokeWidth={2}
            strokeLinecap="round" opacity={0} style={{ filter: "drop-shadow(0 0 6px rgba(129,140,248,.8))" }} />
          <defs>
            <linearGradient id="cr-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>
          <circle className="cr-pulse" r={4.5} fill="#22d3ee" opacity={0} style={{ filter: "drop-shadow(0 0 7px #22d3ee)" }} />
          <circle className="cr-pulse" r={4.5} fill="#818cf8" opacity={0} style={{ filter: "drop-shadow(0 0 7px #818cf8)" }} />
          <circle className="cr-pulse" r={4.5} fill="#fbbf24" opacity={0} style={{ filter: "drop-shadow(0 0 7px #fbbf24)" }} />
        </svg>

        {/* LLM station */}
        <div className="cr-station cr-llm" ref={llmRef}>
          <span className="cr-icon">🧠</span>
          <span className="cr-name">LLM</span>
          <span className="cr-tag">{t.title}</span>
        </div>

        {/* terminal station */}
        <div className="cr-station cr-term" ref={termRef}>
          <div className="cr-term-head"><i /><i /><i />terminal</div>
          <div className="cr-term-screen">
            {termLines.map((l, i) => (
              <div key={i} className={l.k === "cmd" ? "cl-cmd" : "cl-out"}>{l.text}</div>
            ))}
            <span className="cl-caret" />
          </div>
        </div>

        {/* you, the courier */}
        <div className="cr-you" ref={youRef}>
          <span className="cr-face">{face}</span>
          <span className="cr-trips">{t.you(trips)}</span>
        </div>

        {/* the traveling card */}
        {chip && (
          <button ref={chipRef} className={`cr-chip ${chip.kind}`} onClick={onChipClick}>
            {chip.text}
          </button>
        )}

        {/* caption */}
        <div className="cr-caption" key={phase}>{t.cap[phase]}</div>
      </div>

      <div className="game-actions">
        {phase === "idle" && (
          <button className="btn primary" onClick={start}>{t.start}</button>
        )}
        {phase === "doneMsg" && (
          <button className="btn glow" onClick={automate}>{t.automate}</button>
        )}
        {phase === "auto" && (
          <a href="#act3" className="btn" style={{ textDecoration: "none" }}>{t.next}</a>
        )}
      </div>
    </div>
  );
}
