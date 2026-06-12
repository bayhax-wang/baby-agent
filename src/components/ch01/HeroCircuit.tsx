"use client";

import { useEffect, useRef } from "react";
import { animate, createScope, createTimeline, stagger, svg, utils } from "animejs";
import type { Locale } from "@/lib/i18n";

const L = {
  zh: { user: "用户", llm: "LLM", bash: "bash", done: "完成", loop: "while True" },
  en: { user: "User", llm: "LLM", bash: "bash", done: "Done", loop: "while True" },
};

const C = {
  cyan: "#22d3ee",
  indigo: "#818cf8",
  amber: "#fbbf24",
  green: "#34d399",
  dim: "#4e6b8a",
};

/* viewBox 1200x300 layout
   user(90,150) ──prompt──▶ llm(430,150) ⟨lens loop over/under⟩ bash(770,150)
   llm ──end_turn──(deep arc below)──▶ done(1110,150)              */
const P_IN = "M 96 150 H 424";
const P_LOOP = "M 430 150 C 480 58, 720 58, 770 150 C 720 242, 480 242, 430 150";
const P_OUT = "M 430 150 C 520 308, 980 308, 1104 150";

export default function HeroCircuit({ locale }: { locale: Locale }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const t = L[locale];

  useEffect(() => {
    if (!rootRef.current) return;

    const scope = createScope({ root: rootRef.current }).add(() => {
      /* 1 ── draw the circuit in */
      utils.set(["#p-in", "#p-loop", "#p-out"], { opacity: 1 });

      const tl = createTimeline({ defaults: { ease: "inOutSine" } });
      tl.add(svg.createDrawable("#p-in"), { draw: ["0 0", "0 1"], duration: 650 })
        .add(svg.createDrawable("#p-loop"), { draw: ["0 0", "0 1"], duration: 1100 }, "-=250")
        .add(svg.createDrawable("#p-out"), { draw: ["0 0", "0 1"], duration: 850 }, "-=650")
        .add(".hc-node", { opacity: [0, 1], delay: stagger(130) }, "-=1100")
        .add(".hc-label", { opacity: [0, 0.92], delay: stagger(90) }, "-=700")
        .add(".hc-plabel", { opacity: [0, 0.6], delay: stagger(120) }, "-=500");

      /* 2 ── pulses circulating the while-True racetrack */
      const mpLoop = svg.createMotionPath("#p-loop");
      animate(".hc-pulse-loop", {
        translateX: mpLoop.translateX,
        translateY: mpLoop.translateY,
        opacity: { from: 0, to: 1, duration: 260 },
        duration: 3400,
        delay: stagger(1133, { start: 1500 }),
        loop: true,
        ease: "linear",
      });

      /* 3 ── prompt pulse: user → llm, then llm ring flash */
      const mpIn = svg.createMotionPath("#p-in");
      animate(".hc-pulse-in", {
        translateX: mpIn.translateX,
        translateY: mpIn.translateY,
        opacity: { from: 0, to: 1, duration: 200 },
        duration: 1400,
        delay: 800,
        loop: true,
        loopDelay: 2400,
        ease: "inOutSine",
        onLoop: () => {
          animate("#ring-llm", { opacity: [0.85, 0], r: [10, 30], duration: 700, ease: "outQuad" });
        },
      });

      /* 4 ── end_turn pulse: llm → done, then done ring flash */
      const mpOut = svg.createMotionPath("#p-out");
      animate(".hc-pulse-out", {
        translateX: mpOut.translateX,
        translateY: mpOut.translateY,
        opacity: { from: 0, to: 1, duration: 200 },
        duration: 1900,
        delay: 2600,
        loop: true,
        loopDelay: 4600,
        ease: "inOutSine",
        onLoop: () => {
          animate("#ring-done", { opacity: [0.9, 0], r: [10, 32], duration: 750, ease: "outQuad" });
          animate("#node-done-core", { fill: ["#34d399", "#a7f3d0", "#34d399"], duration: 600 });
        },
      });

      /* 5 ── idle breathing rings on every node */
      animate(".hc-idle-ring", {
        opacity: [{ from: 0.42, to: 0 }],
        r: [{ from: 10, to: 24 }],
        duration: 2000,
        delay: stagger(500),
        loop: true,
        ease: "outQuad",
      });

      /* 6 ── "while True" caption breathes */
      animate("#hc-while", { opacity: [0.3, 0.7], duration: 1600, loop: true, alternate: true, ease: "inOutSine" });
    });

    return () => scope.revert();
  }, [locale]);

  const mono = `"SF Mono","JetBrains Mono",Menlo,Consolas,monospace`;

  const node = (
    id: string,
    x: number,
    y: number,
    color: string,
    label: string,
    labelDy = -26
  ) => (
    <g className="hc-node" opacity={0}>
      {/* idle breathing ring */}
      <circle className="hc-idle-ring" cx={x} cy={y} r={10} fill="none" stroke={color} strokeWidth={1.2} opacity={0} />
      {/* flash ring (triggered on pulse arrival) */}
      <circle id={`ring-${id}`} cx={x} cy={y} r={10} fill="none" stroke={color} strokeWidth={1.6} opacity={0} />
      {/* body */}
      <circle cx={x} cy={y} r={10} fill="#0c1829" stroke={color} strokeWidth={1.8} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      <circle id={`node-${id}-core`} cx={x} cy={y} r={4.2} fill={color} />
      <text className="hc-label" x={x} y={y + labelDy} textAnchor="middle" fontFamily={mono} fontSize={14} fontWeight={600} fill={color} opacity={0}>
        {label}
      </text>
    </g>
  );

  return (
    <div ref={rootRef} style={{ position: "absolute", inset: 0 }} aria-hidden>
      <svg
        viewBox="0 0 1200 300"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <defs>
          <linearGradient id="grad-loop" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C.indigo} />
            <stop offset="100%" stopColor={C.amber} />
          </linearGradient>
        </defs>

        {/* ── rails ── */}
        <path id="p-in" d={P_IN} fill="none" stroke={C.cyan} strokeWidth={1.6} strokeLinecap="round" opacity={0}
          style={{ filter: `drop-shadow(0 0 4px ${C.cyan})` }} />
        <path id="p-loop" d={P_LOOP} fill="none" stroke="url(#grad-loop)" strokeWidth={1.8} strokeLinecap="round" opacity={0}
          style={{ filter: `drop-shadow(0 0 5px ${C.indigo})` }} />
        <path id="p-out" d={P_OUT} fill="none" stroke={C.green} strokeWidth={1.4} strokeLinecap="round" opacity={0} strokeDasharray="none"
          style={{ filter: `drop-shadow(0 0 4px ${C.green})` }} />

        {/* ── path labels ── */}
        <text className="hc-plabel" x={258} y={132} textAnchor="middle" fontFamily={mono} fontSize={12.5} fill={C.cyan} opacity={0}>prompt ▸</text>
        <text className="hc-plabel" x={600} y={46} textAnchor="middle" fontFamily={mono} fontSize={12.5} fill={C.indigo} opacity={0}>tool_use ▸</text>
        <text className="hc-plabel" x={600} y={262} textAnchor="middle" fontFamily={mono} fontSize={12.5} fill={C.amber} opacity={0}>◂ tool_result</text>
        <text className="hc-plabel" x={960} y={266} textAnchor="middle" fontFamily={mono} fontSize={12.5} fill={C.green} opacity={0}>end_turn ▸</text>
        <text id="hc-while" x={600} y={156} textAnchor="middle" fontFamily={mono} fontSize={15} fontWeight={700} fill={C.dim} opacity={0.3}>{t.loop} ∞</text>

        {/* ── nodes ── */}
        {node("user", 90, 150, C.cyan, t.user)}
        {node("llm", 430, 150, C.indigo, t.llm)}
        {node("bash", 770, 150, C.amber, t.bash)}
        {node("done", 1110, 150, C.green, t.done)}

        {/* ── traveling pulses (positioned via motion path translate) ── */}
        <circle className="hc-pulse-loop" r={4} fill={C.indigo} opacity={0} style={{ filter: `drop-shadow(0 0 7px ${C.indigo})` }} />
        <circle className="hc-pulse-loop" r={4} fill={C.amber} opacity={0} style={{ filter: `drop-shadow(0 0 7px ${C.amber})` }} />
        <circle className="hc-pulse-loop" r={4} fill={C.indigo} opacity={0} style={{ filter: `drop-shadow(0 0 7px ${C.indigo})` }} />
        <circle className="hc-pulse-in" r={4} fill={C.cyan} opacity={0} style={{ filter: `drop-shadow(0 0 7px ${C.cyan})` }} />
        <circle className="hc-pulse-out" r={4} fill={C.green} opacity={0} style={{ filter: `drop-shadow(0 0 7px ${C.green})` }} />
      </svg>
    </div>
  );
}
