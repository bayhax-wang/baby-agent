"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { Locale } from "@/lib/i18n";

/* ───────────────────────────────────────────────────────────
   Full-width 3D pipeline stage — the v1 glow aesthetic
   (additive sprites, flowing particles, starfield, parallax)
   laid out as the pedagogical pipeline:
   user ──prompt──▶ LLM ⟨while-True ring⟩ bash ─end_turn─▶ done
   ─────────────────────────────────────────────────────────── */

const LABELS = {
  zh: ["用户", "LLM", "bash", "完成"],
  en: ["User", "LLM", "bash", "Done"],
};

const NODE_COLORS = ["#22d3ee", "#818cf8", "#fbbf24", "#34d399"];

export default function HeroStage3D({ locale }: { locale: Locale }) {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    const canvas = document.createElement("canvas");
    box.appendChild(canvas);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      canvas.remove();
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 4, 0.1, 100);
    camera.position.set(0, 0.4, 8.2);
    camera.lookAt(0, 0, 0);

    /* glow sprite texture */
    function glowTexture(color: string) {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const ctx = c.getContext("2d")!;
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, color);
      g.addColorStop(0.3, color.replace("1)", ".45)"));
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    }
    const rgba = (hex: string, a = 1) => {
      const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${a})`;
    };
    const texWhite = glowTexture("rgba(225,240,255,1)");
    const nodeTex = NODE_COLORS.map((c) => glowTexture(rgba(c, 1)));

    /* ── layout state (recomputed on resize) ── */
    let halfW = 7;            // visible world half-width at z=0
    const NX = [-0.86, -0.3, 0.3, 0.86]; // node x as fraction of halfW
    const nodePos: THREE.Vector3[] = [0, 1, 2, 3].map(() => new THREE.Vector3());
    let ringRx = 2, ringRz = 0.9;

    /* ── node sprites (halo + core) ── */
    const halos: THREE.Sprite[] = [];
    const cores: THREE.Sprite[] = [];
    for (let i = 0; i < 4; i++) {
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: nodeTex[i], transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, opacity: 0.75,
      }));
      const core = new THREE.Sprite(new THREE.SpriteMaterial({
        map: texWhite, transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, opacity: 0.95,
      }));
      halo.scale.setScalar(1.5);
      core.scale.setScalar(0.4);
      scene.add(halo, core);
      halos.push(halo);
      cores.push(core);
    }

    /* ── while-True ring (tilted, between LLM and bash) ── */
    const ringGroup = new THREE.Group();
    ringGroup.rotation.x = -0.5;
    scene.add(ringGroup);

    const ringLine = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0x4a5a8a, transparent: true, opacity: 0.5 })
    );
    ringGroup.add(ringLine);

    /* ring particles — indigo top half (tool_use), amber bottom (tool_result) */
    const RN = 64;
    const rGeo = new THREE.BufferGeometry();
    const rPos = new Float32Array(RN * 3);
    const rCol = new Float32Array(RN * 3);
    rGeo.setAttribute("position", new THREE.BufferAttribute(rPos, 3));
    rGeo.setAttribute("color", new THREE.BufferAttribute(rCol, 3));
    const ringPts = new THREE.Points(rGeo, new THREE.PointsMaterial({
      map: texWhite, size: 0.16, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, vertexColors: true,
    }));
    ringGroup.add(ringPts);
    const rOff = Array.from({ length: RN }, () => Math.random());
    const rSpd = Array.from({ length: RN }, () => 0.05 + Math.random() * 0.045);
    const cIndigo = new THREE.Color("#9aa4ff");
    const cAmber = new THREE.Color("#ffd069");

    /* ── prompt line (user → LLM) & exit curve (LLM → done) ── */
    const promptLine = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.3 })
    );
    const exitLine = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.28 })
    );
    scene.add(promptLine, exitLine);
    let exitCurve = new THREE.QuadraticBezierCurve3();

    /* traveling pulses: prompt (cyan) & exit (green), each = head + 4 trail sprites */
    function makePulse(hex: string, n = 5) {
      const tex = glowTexture(rgba(hex, 1));
      const sprites = Array.from({ length: n }, (_, i) => {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({
          map: tex, transparent: true, depthWrite: false,
          blending: THREE.AdditiveBlending, opacity: i === 0 ? 1 : 0.4 - i * 0.08,
        }));
        s.scale.setScalar(i === 0 ? 0.42 : 0.3 - i * 0.04);
        s.visible = false;
        scene.add(s);
        return s;
      });
      return sprites;
    }
    const promptPulse = makePulse("#3ee0ff");
    const exitPulse = makePulse("#4ef0b0");

    /* ── starfield ── */
    const SN = 220;
    const sGeo = new THREE.BufferGeometry();
    const sPos = new Float32Array(SN * 3);
    for (let i = 0; i < SN; i++) {
      sPos[i * 3] = (Math.random() - 0.5) * 26;
      sPos[i * 3 + 1] = (Math.random() - 0.5) * 7;
      sPos[i * 3 + 2] = -3 - Math.random() * 10;
    }
    sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
    scene.add(new THREE.Points(sGeo, new THREE.PointsMaterial({
      map: texWhite, size: 0.06, transparent: true, opacity: 0.5,
      depthWrite: false, blending: THREE.AdditiveBlending, color: 0x7a90b8,
    })));

    /* ── HTML labels ── */
    const labels = LABELS[locale];
    const els = labels.map((txt, i) => {
      const el = document.createElement("div");
      el.className = "node-label";
      el.textContent = txt;
      el.style.color = NODE_COLORS[i];
      el.style.borderColor = rgba(NODE_COLORS[i], 0.55);
      box.appendChild(el);
      return el;
    });
    const whileEl = document.createElement("div");
    whileEl.className = "node-label";
    whileEl.textContent = "while True ∞";
    whileEl.style.color = "#8a97c8";
    whileEl.style.borderColor = "transparent";
    whileEl.style.background = "transparent";
    whileEl.style.backdropFilter = "none";
    whileEl.style.fontSize = "13px";
    box.appendChild(whileEl);

    const pathLabels = [
      { text: "prompt ▸", color: "#22d3ee" },
      { text: "tool_use ▸", color: "#818cf8" },
      { text: "◂ tool_result", color: "#fbbf24" },
      { text: "end_turn ▸", color: "#34d399" },
    ].map((p) => {
      const el = document.createElement("div");
      el.className = "node-label";
      el.textContent = p.text;
      el.style.color = p.color;
      el.style.borderColor = "transparent";
      el.style.background = "transparent";
      el.style.backdropFilter = "none";
      el.style.fontSize = "11.5px";
      el.style.opacity = ".8";
      box.appendChild(el);
      return el;
    });

    /* ── layout & resize ── */
    function layout() {
      const w = box!.clientWidth, h = box!.clientHeight;
      renderer.setSize(w, h, false);
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      const vFov = (camera.fov * Math.PI) / 180;
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
      halfW = Math.tan(hFov / 2) * camera.position.z * 0.96;

      for (let i = 0; i < 4; i++) {
        nodePos[i].set(NX[i] * halfW, 0, 0);
        halos[i].position.copy(nodePos[i]);
        cores[i].position.copy(nodePos[i]);
      }
      ringRx = ((NX[2] - NX[1]) * halfW) / 2;
      ringRz = ringRx * 0.42;
      const ringCx = 0;

      /* ring geometry */
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 100; i++) {
        const a = (i / 100) * Math.PI * 2;
        pts.push(new THREE.Vector3(ringCx + Math.cos(a) * ringRx, 0, Math.sin(a) * ringRz));
      }
      ringLine.geometry.dispose();
      ringLine.geometry = new THREE.BufferGeometry().setFromPoints(pts);

      /* prompt line */
      promptLine.geometry.dispose();
      promptLine.geometry = new THREE.BufferGeometry().setFromPoints([
        nodePos[0].clone().add(new THREE.Vector3(0.25, 0, 0)),
        nodePos[1].clone().add(new THREE.Vector3(-0.25, 0, 0)),
      ]);

      /* exit curve */
      exitCurve = new THREE.QuadraticBezierCurve3(
        nodePos[1].clone().add(new THREE.Vector3(0.1, -0.18, 0)),
        new THREE.Vector3((nodePos[1].x + nodePos[3].x) / 2, -2.0, 1.0),
        nodePos[3].clone().add(new THREE.Vector3(-0.1, -0.15, 0))
      );
      exitLine.geometry.dispose();
      exitLine.geometry = new THREE.BufferGeometry().setFromPoints(exitCurve.getPoints(70));
    }
    const ro = new ResizeObserver(layout);
    ro.observe(box);
    layout();

    /* mouse parallax */
    let mouseX = 0;
    const onMove = (e: PointerEvent) => { mouseX = e.clientX / innerWidth - 0.5; };
    addEventListener("pointermove", onMove);

    /* ── frame loop ── */
    const v = new THREE.Vector3();
    const t0 = performance.now();
    let raf = 0;

    function project(world: THREE.Vector3, el: HTMLElement, dy = -30) {
      v.copy(world).project(camera);
      el.style.left = (v.x * 0.5 + 0.5) * box!.clientWidth + "px";
      el.style.top = (-v.y * 0.5 + 0.5) * box!.clientHeight + dy + "px";
    }

    function placePulse(sprites: THREE.Sprite[], getPos: (t: number) => THREE.Vector3, t: number, show: boolean) {
      sprites.forEach((s, i) => {
        const tt = Math.max(0, t - i * 0.035);
        s.visible = show && tt > 0;
        if (s.visible) s.position.copy(getPos(Math.min(tt, 1)));
      });
    }

    function frame() {
      raf = requestAnimationFrame(frame);
      const t = (performance.now() - t0) / 1000;

      /* ring particles flow + color by half */
      for (let i = 0; i < RN; i++) {
        const tt = (rOff[i] + t * rSpd[i]) % 1;
        const a = tt * Math.PI * 2;
        rPos[i * 3] = Math.cos(a) * ringRx;
        rPos[i * 3 + 1] = Math.sin(t * 2.2 + i) * 0.04;
        rPos[i * 3 + 2] = Math.sin(a) * ringRz;
        const c = Math.sin(a) > 0 ? cIndigo : cAmber; // screen-top half indigo (tool_use), bottom amber (tool_result)
        rCol[i * 3] = c.r; rCol[i * 3 + 1] = c.g; rCol[i * 3 + 2] = c.b;
      }
      rGeo.attributes.position.needsUpdate = true;
      rGeo.attributes.color.needsUpdate = true;

      /* node pulse */
      for (let i = 0; i < 4; i++) {
        halos[i].scale.setScalar(1.45 + Math.sin(t * 2 + i * 1.7) * 0.18);
        (halos[i].material as THREE.SpriteMaterial).opacity = 0.65 + Math.sin(t * 2 + i * 1.7) * 0.15;
      }

      /* prompt pulse: travels every 3.2s */
      {
        const cycle = (t % 3.2) / 1.1;
        const show = cycle < 1;
        placePulse(promptPulse, (tt) =>
          new THREE.Vector3().lerpVectors(
            nodePos[0].clone().add(new THREE.Vector3(0.25, 0, 0)),
            nodePos[1].clone().add(new THREE.Vector3(-0.25, 0, 0)), tt),
          cycle, show);
        if (show && cycle > 0.97) halos[1].scale.setScalar(2.1); // LLM flash on arrival
      }

      /* exit pulse: travels every 5.4s */
      {
        const cycle = ((t + 1.8) % 5.4) / 1.6;
        const show = cycle < 1;
        placePulse(exitPulse, (tt) => exitCurve.getPoint(tt), cycle, show);
        if (show && cycle > 0.97) halos[3].scale.setScalar(2.2); // done flash
      }

      camera.position.x = mouseX * 0.7;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);

      /* labels */
      for (let i = 0; i < 4; i++) project(nodePos[i], els[i]);
      project(new THREE.Vector3(0, 0.04, 0), whileEl, 0);
      project(new THREE.Vector3((nodePos[0].x + nodePos[1].x) / 2, 0.28, 0), pathLabels[0], -8);
      /* top of the ring (screen-up) is world +z after the -0.5 x-tilt */
      project(new THREE.Vector3(0, 0, ringRz).applyEuler(ringGroup.rotation), pathLabels[1], -26);
      project(new THREE.Vector3(0, 0, -ringRz).applyEuler(ringGroup.rotation), pathLabels[2], 26);
      project(exitCurve.getPoint(0.62), pathLabels[3], 18);
    }
    frame();

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("pointermove", onMove);
      ro.disconnect();
      renderer.dispose();
      els.forEach((e) => e.remove());
      pathLabels.forEach((e) => e.remove());
      whileEl.remove();
      canvas.remove();
    };
  }, [locale]);

  return <div ref={boxRef} style={{ position: "absolute", inset: 0 }} aria-hidden />;
}
