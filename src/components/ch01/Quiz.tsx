"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";

type Q = { q: string; opts: string[]; ok: number; fbOk: string; fbNo: string };

const QS: Record<Locale, Q[]> = {
  zh: [
    {
      q: "Q1 · 模型这一轮的回复里没有任何 tool_use 块。循环会怎样？",
      opts: ["再给模型一次机会，重新调用一次 LLM", "直接 return，循环结束——模型说做完了就是做完了", "把上一条 tool_result 再喂一遍"],
      ok: 1,
      fbOk: "✅ 对！这就是循环唯一的退出条件——模型不举手要工具，harness 就收工。",
      fbNo: "❌ 再想想——循环的退出条件是什么？模型说完了，harness 没有理由再打扰它。",
    },
    {
      q: "Q2 · 工具执行的结果（tool_result）是以什么 role 喂回给模型的？",
      opts: ['role: "assistant" —— 因为是替模型干的活', 'role: "tool" —— 工具有自己专属的角色', 'role: "user" —— tool_result 放在 user 消息的 content 里'],
      ok: 2,
      fbOk: "✅ 对！这是 Anthropic API 的约定，模拟器第 6 步里你亲眼看到了。",
      fbNo: '❌ 不对。回看模拟器：messages.append({"role": "user", "content": results})。',
    },
    {
      q: "Q3 · 智能在哪里？",
      opts: ["在循环里——while True 就是智能本身", "在模型里——循环只是让模型能持续行动的最小框架", "在 bash 里——能执行命令才是关键"],
      ok: 1,
      fbOk: "✅ 对！模型负责决策，harness 负责执行。循环是心跳，不是大脑。",
      fbNo: "❌ 不对。while True 谁都会写，bash 哪台机器都有——决定「下一步干什么」的是模型。",
    },
  ],
  en: [
    {
      q: "Q1 · The model's reply this round contains no tool_use block. What does the loop do?",
      opts: ["Give the model another chance and call the LLM again", "Just return — the loop ends; when the model says it's done, it's done", "Feed the previous tool_result in once more"],
      ok: 1,
      fbOk: "✅ Right! That's the loop's only exit condition — no raised hand, harness clocks out.",
      fbNo: "❌ Think again — what's the exit condition? The model finished talking; the harness has no reason to bother it.",
    },
    {
      q: "Q2 · A tool's result (tool_result) is fed back to the model under which role?",
      opts: ['role: "assistant" — the work was done on the model\'s behalf', 'role: "tool" — tools get their own role', 'role: "user" — tool_results live in a user message\'s content'],
      ok: 2,
      fbOk: "✅ Right! That's the Anthropic API convention — you saw it in simulator step 6.",
      fbNo: '❌ Nope. Check the simulator: messages.append({"role": "user", "content": results}).',
    },
    {
      q: "Q3 · Where does the intelligence live?",
      opts: ["In the loop — while True is the intelligence", "In the model — the loop is just the minimal frame that lets it keep acting", "In bash — being able to execute commands is what matters"],
      ok: 1,
      fbOk: "✅ Right! The model decides; the harness executes. The loop is a heartbeat, not a brain.",
      fbNo: "❌ Nope. Anyone can write while True and every machine has bash — deciding what to do next is the model's job.",
    },
  ],
};

export default function Quiz({ locale }: { locale: Locale }) {
  const qs = QS[locale];
  const [picked, setPicked] = useState<(number | null)[]>(qs.map(() => null));

  return (
    <div className="try-box">
      {qs.map((q, qi) => (
        <div key={qi} style={{ marginTop: qi > 0 ? 28 : 0 }}>
          <div className="quiz-q">{q.q}</div>
          {q.opts.map((o, oi) => {
            const p = picked[qi];
            const cls =
              p === null ? "" : oi === q.ok ? "right" : p === oi ? "wrong" : "";
            return (
              <button
                key={oi}
                className={`quiz-opt ${cls}`}
                onClick={() => setPicked((arr) => arr.map((v, k) => (k === qi ? oi : v)))}
              >
                {o}
              </button>
            );
          })}
          <div className={`quiz-fb ${picked[qi] === null ? "" : picked[qi] === q.ok ? "ok" : "no"}`}>
            {picked[qi] === null ? "" : picked[qi] === q.ok ? q.fbOk : q.fbNo}
          </div>
        </div>
      ))}
    </div>
  );
}
