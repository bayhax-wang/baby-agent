"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { Locale } from "@/lib/i18n";

const LABELS = {
  zh: ["👤 用户", "🧠 模型", "🔧 bash"],
  en: ["👤 User", "🧠 Model", "🔧 bash"],
};

export default function Hero3D({ locale }: { locale: Locale }) {
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
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 1.4, 7.2);
    camera.lookAt(0, 0, 0);

    function glowTexture(color: string) {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const ctx = c.getContext("2d")!;
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, color);
      g.addColorStop(0.35, color.replace("1)", ".5)"));
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    }
    const texCyan = glowTexture("rgba(77,214,255,1)");
    const texPurple = glowTexture("rgba(167,139,250,1)");
    const texYellow = glowTexture("rgba(251,191,36,1)");
    const texWhite = glowTexture("rgba(220,240,255,1)");

    const R = 2.5;
    const group = new THREE.Group();
    group.rotation.x = -0.45;
    scene.add(group);

    const posOnLoop = (t: number) =>
      new THREE.Vector3(Math.cos(t * Math.PI * 2) * R, 0, Math.sin(t * Math.PI * 2) * R);

    const ringPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) ringPts.push(posOnLoop(i / 128));
    group.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(ringPts),
        new THREE.LineBasicMaterial({ color: 0x2a4a66, transparent: true, opacity: 0.85 })
      )
    );

    const nodeDefs = [
      { t: 0.25, tex: texCyan, color: "var(--cyan)", border: "rgba(77,214,255,.6)" },
      { t: 0.583, tex: texPurple, color: "var(--purple)", border: "rgba(167,139,250,.6)" },
      { t: 0.917, tex: texYellow, color: "var(--yellow)", border: "rgba(251,191,36,.6)" },
    ];
    const labels = LABELS[locale];
    const nodes = nodeDefs.map((n, i) => {
      const sp = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: n.tex, transparent: true, depthWrite: false })
      );
      sp.scale.setScalar(1.05);
      sp.position.copy(posOnLoop(n.t));
      group.add(sp);
      const el = document.createElement("div");
      el.className = "node-label";
      el.textContent = labels[i];
      el.style.color = n.color;
      el.style.borderColor = n.border;
      box.appendChild(el);
      return { sprite: sp, el };
    });

    const N = 80;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(N * 3);
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({
        map: texWhite,
        size: 0.14,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: 0x9fdcff,
      })
    );
    group.add(particles);
    const offsets = Array.from({ length: N }, () => Math.random());
    const speeds = Array.from({ length: N }, () => 0.04 + Math.random() * 0.05);
    const wobble = Array.from({ length: N }, () => Math.random() * Math.PI * 2);

    function resize() {
      const w = box!.clientWidth;
      const h = box!.clientHeight;
      renderer.setSize(w, h, false);
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(resize);
    ro.observe(box);
    resize();

    let mouseX = 0;
    const onMove = (e: PointerEvent) => {
      mouseX = e.clientX / innerWidth - 0.5;
    };
    addEventListener("pointermove", onMove);

    const v = new THREE.Vector3();
    const clock = new THREE.Clock();
    let raf = 0;
    function frame() {
      raf = requestAnimationFrame(frame);
      const t = clock.getElapsedTime();
      group.rotation.y = t * 0.14;
      for (let i = 0; i < N; i++) {
        const tt = (offsets[i] + t * speeds[i]) % 1;
        const p = posOnLoop(tt);
        pPos[i * 3] = p.x;
        pPos[i * 3 + 1] = Math.sin(t * 2 + wobble[i]) * 0.07;
        pPos[i * 3 + 2] = p.z;
      }
      pGeo.attributes.position.needsUpdate = true;
      nodes.forEach((n, i) => n.sprite.scale.setScalar(1.0 + Math.sin(t * 2 + i * 2.1) * 0.14));
      camera.position.x = mouseX * 0.9;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);

      const w = box!.clientWidth;
      const h = box!.clientHeight;
      nodes.forEach((n) => {
        v.copy(n.sprite.position).applyMatrix4(group.matrixWorld).project(camera);
        n.el.style.left = (v.x * 0.5 + 0.5) * w + "px";
        n.el.style.top = (-v.y * 0.5 + 0.5) * h - 30 + "px";
      });
    }
    frame();

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("pointermove", onMove);
      ro.disconnect();
      renderer.dispose();
      nodes.forEach((n) => n.el.remove());
      canvas.remove();
    };
  }, [locale]);

  return <div ref={boxRef} className="hero-canvas-box" aria-hidden />;
}
