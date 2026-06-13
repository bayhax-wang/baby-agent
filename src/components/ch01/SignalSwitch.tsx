"use client";

import { useEffect, useRef, useState } from "react";
import { animate, svg, utils, type JSAnimation } from "animejs";
import type { Locale } from "@/lib/i18n";

/* ───────────────────────────────────────────────────────────
   The Signal Switch — Act 2 as an interactive animation.
   Two buttons = the two values of stop_reason.
   tool_use  → a pulse loops around the track and returns (loop lives on)
   end_turn  → the pulse escapes to ✓ and the loop dims (return)
   ─────────────────────────────────────────────────────────── */

const T = {
  zh: {
    intro: "你是 LLM。这一轮想干嘛？按下你的 stop_reason：",
    loop: (n: number) => `🌀 tool_use → 执行 → 喂回 —— 第 ${n} 圈，循环继续`,
    exit: "🏁 end_turn → return —— 循环退出，任务完成",
    again: "（循环已退出。再按 tool_use 可以开始新的一轮）",
    btnLoop: 'stop_reason = "tool_use"',
    btnExit: 'stop_reason = "end_turn"',
  },
  en: {
    intro: "You are the LLM. Your move this round — press your stop_reason:",
    loop: (n: number) => `🌀 tool_use → execute → feed back — round ${n}, the loop lives on`,
    exit: "🏁 end_turn → return — loop exits, task complete",
    again: "(Loop exited. Press tool_use to start a fresh one.)",
    btnLoop: 'stop_reason = "tool_use"',
    btnExit: 'stop_reason = "end_turn"',
  },
};

/* viewBox 1000x230 — LLM left, lens track to bash-ish midpoint, exit to ✓ */
const P_LOOP = "M 200 115 C 260 30, 520 30, 580 115 C 520 200, 260 200, 200 115";
const P_EXIT = "M 200 115 C 350 235, 700 235, 845 115";

export default function SignalSwitch({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [caption, setCaption] = useState(t.intro);
  const [rounds, setRounds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [exited, setExited] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const anims = useRef<JSAnimation[]>([]);

  useEffect(() => {
    const a = anims.current;
    return () => a.forEach((x) => x.cancel());
  }, []);
  useEffect(() => { setCaption(T[locale].intro); }, [locale]);

  const q = (sel: string) => rootRef.current!.querySelector(sel) as SVGElement;

  function flash(sel: string) {
    anims.current.push(
      animate(q(sel), { opacity: [0.9, 0], r: [12, 34], duration: 700, ease: "outQuad" })
    );
  }

  function fire(kind: "loop" | "exit") {
    if (busy) return;
    setBusy(true);

    if (exited) {
      /* revive the track if we restart */
      anims.current.push(animate(q("#ss-loop"), { opacity: 0.9, duration: 400 }));
      setExited(false);
      setRounds(0);
    }

    const pathId = kind === "loop" ? "#ss-loop" : "#ss-exit";
    const dot = q(kind === "loop" ? "#ss-dot-loop" : "#ss-dot-exit");
    const mp = svg.createMotionPath(q(pathId) as SVGPathElement);

    anims.current.push(
      animate(dot, {
        translateX: mp.translateX,
        translateY: mp.translateY,
        opacity: [{ to: 1, duration: 150 }, { to: 1, duration: kind === "loop" ? 1250 : 1050 }, { to: 0, duration: 200 }],
        duration: kind === "loop" ? 1600 : 1400,
        ease: "inOutSine",
        onComplete: () => {
          if (kind === "loop") {
            flash("#ss-ring-llm");
            setRounds((n) => {
              setCaption(t.loop(n + 1));
              return n + 1;
            });
          } else {
            flash("#ss-ring-done");
            anims.current.push(
              animate(q("#ss-done-core"), { scale: [1, 1.6, 1], duration: 500, ease: "outBack(2)" })
            );
            anims.current.push(animate(q("#ss-loop"), { opacity: 0.18, duration: 700 }));
            setCaption(t.exit);
            setExited(true);
            setTimeout(() => setCaption((c) => c + "  " + t.again), 1600);
          }
          setBusy(false);
        },
      })
    );
    /* reset dot transform start */
    utils.set(dot, { translateX: 0, translateY: 0 });
  }

  const mono = `"SF Mono","JetBrains Mono",Menlo,Consolas,monospace`;

  return (
    <div ref={rootRef} className="signal-switch">
      <div className="ss-stage">
        <svg viewBox="0 0 1000 230" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%", display: "block" }}>
          {/* track */}
          <path id="ss-loop" d={P_LOOP} fill="none" stroke="#818cf8" strokeWidth={1.8} opacity={0.9}
            strokeLinecap="round" style={{ filter: "drop-shadow(0 0 5px rgba(129,140,248,.7))" }} />
          <path id="ss-exit" d={P_EXIT} fill="none" stroke="#34d399" strokeWidth={1.4} opacity={0.4}
            strokeDasharray="5 9" strokeLinecap="round" />

          {/* LLM node */}
          <circle id="ss-ring-llm" cx={200} cy={115} r={12} fill="none" stroke="#818cf8" strokeWidth={1.6} opacity={0} />
          <circle cx={200} cy={115} r={12} fill="#0c1829" stroke="#818cf8" strokeWidth={2}
            style={{ filter: "drop-shadow(0 0 8px rgba(129,140,248,.8))" }} />
          <circle cx={200} cy={115} r={5} fill="#818cf8" />
          <text x={200} y={82} textAnchor="middle" fontFamily={mono} fontSize={14} fontWeight={700} fill="#818cf8">LLM</text>

          {/* tools label on the track */}
          <text x={390} y={38} textAnchor="middle" fontFamily={mono} fontSize={12} fill="#818cf8" opacity={0.7}>{locale === "zh" ? "执行工具 ▸" : "run tool ▸"}</text>
          <text x={390} y={206} textAnchor="middle" fontFamily={mono} fontSize={12} fill="#fbbf24" opacity={0.7}>◂ tool_result</text>

          {/* done node */}
          <circle id="ss-ring-done" cx={845} cy={115} r={12} fill="none" stroke="#34d399" strokeWidth={1.6} opacity={0} />
          <g id="ss-done-core" style={{ transformOrigin: "845px 115px" }}>
            <circle cx={845} cy={115} r={12} fill="#0c1829" stroke="#34d399" strokeWidth={2}
              style={{ filter: "drop-shadow(0 0 8px rgba(52,211,153,.7))" }} />
            <text x={845} y={120} textAnchor="middle" fontSize={12} fill="#34d399">✓</text>
          </g>
          <text x={845} y={82} textAnchor="middle" fontFamily={mono} fontSize={13} fill="#34d399">return</text>
          <text x={700} y={208} textAnchor="middle" fontFamily={mono} fontSize={12} fill="#34d399" opacity={0.6}>end_turn ▸</text>

          {/* pulses */}
          <circle id="ss-dot-loop" r={5} fill="#22d3ee" opacity={0} style={{ filter: "drop-shadow(0 0 8px #22d3ee)" }} />
          <circle id="ss-dot-exit" r={5} fill="#34d399" opacity={0} style={{ filter: "drop-shadow(0 0 8px #34d399)" }} />
        </svg>
      </div>

      <div className="ss-caption">{caption}</div>

      <div className="game-actions" style={{ justifyContent: "center" }}>
        <button className="btn ss-btn-loop" onClick={() => fire("loop")} disabled={busy}>{t.btnLoop}</button>
        <button className="btn ss-btn-exit" onClick={() => fire("exit")} disabled={busy}>{t.btnExit}</button>
        {rounds > 0 && !exited && <span className="fatigue">∞ × <b>{rounds}</b></span>}
      </div>
    </div>
  );
}
