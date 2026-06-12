"use client";

import { useEffect, useRef } from "react";
import type { Locale } from "@/lib/i18n";

const LABELS = {
  zh: ["用户输入", "LLM", "bash", "输出结果"],
  en: ["User Prompt", "LLM", "bash", "Result"],
};

const COLORS = {
  user:   "#22d3ee",
  llm:    "#818cf8",
  bash:   "#fbbf24",
  result: "#34d399",
};

interface Node {
  id: string;
  x: number; y: number;
  color: string; label: string;
  glow: number;  // 0..1, fades out after a particle arrives
}

interface Particle {
  segIdx: number;  // which segment it's on
  t: number;       // 0..1 along segment
  speed: number;
  color: string;
  trail: { x: number; y: number }[];
}

// Segment: from node index → to node index
// 0:user→llm  1:llm→bash  2:bash→result  3:result→llm(curve back)  4:llm→exit(end_turn)
const SEGMENTS = [
  { from: 0, to: 1 },   // user → llm
  { from: 1, to: 2 },   // llm → bash (tool_use path)
  { from: 2, to: 3 },   // bash → result
  { from: 3, to: 1 },   // result → llm (loop back, curved)
  { from: 1, to: -1 },  // llm → exit (end_turn, rightward)
];

export default function HeroLoop({ locale }: { locale: Locale }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const canvas = document.createElement("canvas");
    wrap.appendChild(canvas);
    const ctx = canvas.getContext("2d")!;

    let W = 0, H = 0;
    let nodes: Node[] = [];
    let particles: Particle[] = [];
    let raf = 0;
    let lastSpawn = 0;

    function resize() {
      const dpr = Math.min(devicePixelRatio, 2);
      W = wrap!.clientWidth;
      H = wrap!.clientHeight;
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width  = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildNodes();
    }

    function buildNodes() {
      const labels = LABELS[locale];
      // Spread 4 nodes across width, sit in upper 40% so curve arc fits below
      const pad = Math.max(W * 0.08, 80);
      const span = W - pad * 2;
      const cy = H * 0.38;
      nodes = [
        { id: "user",   x: pad,              y: cy, color: COLORS.user,   label: labels[0], glow: 0 },
        { id: "llm",    x: pad + span * .33, y: cy, color: COLORS.llm,    label: labels[1], glow: 0 },
        { id: "bash",   x: pad + span * .67, y: cy, color: COLORS.bash,   label: labels[2], glow: 0 },
        { id: "result", x: pad + span,       y: cy, color: COLORS.result, label: labels[3], glow: 0 },
      ];
    }

    // Interpolate position along a segment (with a curve for the "loop back" segment)
    function segPos(segIdx: number, t: number): { x: number; y: number } {
      const seg = SEGMENTS[segIdx];
      const from = nodes[seg.from];

      if (seg.to === -1) {
        // exit: LLM → off right edge
        return { x: from.x + (W - from.x + 60) * t, y: from.y };
      }

      const to = nodes[seg.to];

      if (segIdx === 3) {
        // curved return path: result → llm, arcs below
        const cpY = from.y + H * 0.46;   // arc sits in lower half of stage
        const cpX = (from.x + to.x) / 2;
        const u = 1 - t;
        return {
          x: u * u * from.x + 2 * u * t * cpX + t * t * to.x,
          y: u * u * from.y + 2 * u * t * cpY + t * t * to.y,
        };
      }
      return {
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t,
      };
    }

    function spawnParticle() {
      // Choose a starting segment probabilistically:
      // Most start user→llm, then continue on the tool_use path (segments 0→1→2→3→1→...)
      // Occasionally one escapes as end_turn (seg 4)
      const r = Math.random();
      let segIdx: number;
      if (r < 0.12) segIdx = 4;      // end_turn escape
      else           segIdx = 0;      // fresh user→llm

      const colorMap: Record<number, string> = {
        0: COLORS.user, 1: COLORS.llm, 2: COLORS.bash, 3: COLORS.result, 4: COLORS.llm,
      };

      particles.push({
        segIdx,
        t: 0,
        speed: 0.0028 + Math.random() * 0.0018,
        color: colorMap[segIdx],
        trail: [],
      });
    }

    function drawGrid() {
      const step = 28;
      ctx.strokeStyle = "rgba(30, 58, 95, 0.4)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
    }

    function hexAlpha(hex: string, a: number) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${a})`;
    }

    function drawConnections() {
      if (!nodes.length) return;

      ctx.lineCap = "round";

      // Draw each segment as a dashed dim line first (the "rail")
      SEGMENTS.forEach((seg, i) => {
        const from = nodes[seg.from];
        if (!from) return;

        ctx.strokeStyle = hexAlpha(from.color, 0.14);
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 10]);

        if (seg.to === -1) {
          // exit arrow to the right
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(Math.min(from.x + 100, W - 10), from.y);
          ctx.stroke();
        } else if (i === 3) {
          // curved return
          const to = nodes[seg.to];
          const cpY = from.y + H * 0.46;
          const cpX = (from.x + to.x) / 2;
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.quadraticCurveTo(cpX, cpY, to.x, to.y);
          ctx.stroke();
        } else {
          const to = nodes[seg.to];
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      });

      // Arrow tips on straight segments
      ctx.setLineDash([]);
      [0, 1, 2, 4].forEach((i) => {
        const seg = SEGMENTS[i];
        const from = nodes[seg.from];
        if (!from) return;
        let ax: number, ay: number, angle: number;
        if (seg.to === -1) {
          ax = Math.min(from.x + 100, W - 10); ay = from.y; angle = 0;
        } else {
          const to = nodes[seg.to];
          ax = to.x; ay = to.y;
          angle = Math.atan2(to.y - from.y, to.x - from.x);
        }
        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(angle);
        ctx.strokeStyle = hexAlpha(from.color, 0.3);
        ctx.fillStyle   = hexAlpha(from.color, 0.3);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-7, -4); ctx.lineTo(0, 0); ctx.lineTo(-7, 4);
        ctx.stroke();
        ctx.restore();
      });
    }

    function drawNodes() {
      if (!nodes.length) return;
      const labels = LABELS[locale];
      nodes.forEach((n, i) => {
        // glow ring when lit up
        if (n.glow > 0) {
          const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 28 * n.glow);
          g.addColorStop(0, hexAlpha(n.color, .35 * n.glow));
          g.addColorStop(1, hexAlpha(n.color, 0));
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(n.x, n.y, 28, 0, Math.PI * 2); ctx.fill();
        }

        // outer ring
        ctx.strokeStyle = hexAlpha(n.color, 0.5 + n.glow * 0.4);
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(n.x, n.y, 9, 0, Math.PI * 2); ctx.stroke();

        // inner dot
        ctx.fillStyle = hexAlpha(n.color, 0.25 + n.glow * 0.55);
        ctx.beginPath(); ctx.arc(n.x, n.y, 5, 0, Math.PI * 2); ctx.fill();

        // label above
        ctx.font = `600 11px "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace`;
        ctx.textAlign = "center";
        ctx.fillStyle = hexAlpha(n.color, 0.75 + n.glow * 0.25);
        ctx.fillText(labels[i], n.x, n.y - 18);

        n.glow = Math.max(0, n.glow - 0.025);
      });
    }

    function drawParticles() {
      particles.forEach((p) => {
        const pos = segPos(p.segIdx, p.t);
        p.trail.push({ x: pos.x, y: pos.y });
        if (p.trail.length > 14) p.trail.shift();

        // trail
        for (let i = 0; i < p.trail.length - 1; i++) {
          const a = (i / p.trail.length) * 0.6;
          ctx.strokeStyle = hexAlpha(p.color, a);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(p.trail[i].x, p.trail[i].y);
          ctx.lineTo(p.trail[i + 1].x, p.trail[i + 1].y);
          ctx.stroke();
        }

        // head dot with glow
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(pos.x, pos.y, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      });
    }

    function advanceParticles(dt: number) {
      const dead: number[] = [];
      particles.forEach((p, idx) => {
        p.t += p.speed * dt * 0.06;

        if (p.t >= 1) {
          const seg = SEGMENTS[p.segIdx];
          // arrive at destination node
          if (seg.to >= 0 && nodes[seg.to]) {
            nodes[seg.to].glow = 1;
          }

          // choose next segment
          if (p.segIdx === 0) {
            // user→llm: now LLM decides
            const r = Math.random();
            p.segIdx = r < 0.18 ? 4 : 1; // mostly tool_use
            p.color = COLORS.llm;
          } else if (p.segIdx === 1) {
            // llm→bash
            p.segIdx = 2;
            p.color = COLORS.bash;
          } else if (p.segIdx === 2) {
            // bash→result
            p.segIdx = 3;
            p.color = COLORS.result;
          } else if (p.segIdx === 3) {
            // result→llm (loop back) → go to bash again mostly
            p.segIdx = Math.random() < 0.25 ? 4 : 1;
            p.color = COLORS.llm;
          } else {
            // exit (seg 4 or done)
            dead.push(idx);
            return;
          }
          p.t = 0;
          p.trail = [];
        }
      });
      // remove dead (reverse order)
      dead.reverse().forEach((i) => particles.splice(i, 1));
    }

    let prev = 0;
    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(now - prev, 50);
      prev = now;

      ctx.clearRect(0, 0, W, H);
      drawGrid();
      drawConnections();
      drawParticles();
      drawNodes();
      advanceParticles(dt);

      // spawn
      if (now - lastSpawn > 320 + Math.random() * 480 && particles.length < 18) {
        spawnParticle();
        lastSpawn = now;
      }
    }

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    // seed some particles immediately
    for (let i = 0; i < 5; i++) {
      spawnParticle();
      // scatter start positions
      particles[i].t = Math.random() * 0.9;
    }

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.remove();
    };
  }, [locale]);

  return (
    <div
      ref={wrapRef}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden
    />
  );
}
