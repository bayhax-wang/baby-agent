"use client";

import { useState } from "react";

export default function CopyPre({ text, label = "copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <pre style={{ position: "relative" }}>
      <button
        className="copy-btn"
        onClick={() => {
          navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        }}
      >
        {done ? "✓ copied" : label}
      </button>
      {text}
    </pre>
  );
}
