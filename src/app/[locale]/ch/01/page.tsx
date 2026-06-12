import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n";
import Reveal from "@/components/Reveal";
import CopyPre from "@/components/CopyPre";
import Hero3D from "@/components/ch01/Hero3D";
import HarnessGame from "@/components/ch01/HarnessGame";
import LoopSimulator from "@/components/ch01/LoopSimulator";
import DeepSpace from "@/components/ch01/DeepSpace";
import Quiz from "@/components/ch01/Quiz";

const AGENT_PY = `# agent.py — a complete coding agent in ~30 lines
# pip install anthropic && export ANTHROPIC_API_KEY=...
import subprocess
from anthropic import Anthropic

client = Anthropic()
TOOLS = [{
    "name": "bash",
    "description": "Run a shell command.",
    "input_schema": {"type": "object",
                     "properties": {"command": {"type": "string"}},
                     "required": ["command"]},
}]

def run_bash(command: str) -> str:
    r = subprocess.run(command, shell=True, capture_output=True,
                       text=True, timeout=120)
    return (r.stdout + r.stderr).strip() or "(no output)"

def agent_loop(messages: list):
    while True:
        response = client.messages.create(
            model="claude-sonnet-4-6", max_tokens=8000,
            system="You are a coding agent. Act, don't explain.",
            messages=messages, tools=TOOLS)
        messages.append({"role": "assistant", "content": response.content})
        if response.stop_reason != "tool_use":
            return
        results = []
        for block in response.content:
            if block.type == "tool_use":
                print(f"$ {block.input['command']}")
                results.append({"type": "tool_result",
                                "tool_use_id": block.id,
                                "content": run_bash(block.input["command"])})
        messages.append({"role": "user", "content": results})

if __name__ == "__main__":
    history = []
    while (q := input(">> ")) not in ("q", ""):
        history.append({"role": "user", "content": q})
        agent_loop(history)
        print(history[-1]["content"][-1].text)`;

export default async function Ch01({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  const zh = l === "zh";

  return (
    <main>
      {/* ───── hero: split layout, text and animation never overlap ───── */}
      <div className="hero">
        <div className="hero-split">
          <div>
            <div className="hero-kicker">{zh ? "第 1 章 / 共 20 章 · 心脏科" : "CHAPTER 1 / 20 · CARDIOLOGY"}</div>
            <h1 className="hero-title">
              {zh ? <>心跳<br />一个循环就是一条命</> : <>The Heartbeat<br />One Loop Is a Life</>}
            </h1>
            <p className="hero-sub">
              {zh ? (
                <>大模型天生是<b>截瘫的天才</b>：想得出命令，却动不了手，也看不见结果。给它接上一个 <code>while True</code>——它就活了。</>
              ) : (
                <>An LLM is born a <b>paralyzed genius</b>: it can think up commands but can&apos;t move a finger or see what happens. Wire it to a <code>while True</code> — and it comes alive.</>
              )}
            </p>
            <p className="hero-quote">{zh ? "// 智能在模型里，生命在循环里" : "// intelligence lives in the model; life lives in the loop"}</p>
            <a href="#act1" className="hero-cta">
              {zh ? "先亲手体验没有循环的痛苦 ↓" : "First, feel the pain of life without the loop ↓"}
            </a>
          </div>
          <Hero3D locale={l} />
        </div>
      </div>

      {/* ───── act 1: the game ───── */}
      <section id="act1">
        <div className="wrap">
          <Reveal>
            <div className="act-tag">{zh ? "第一幕 · 发病现场" : "ACT 1 · THE SYMPTOM"}</div>
            <h2>{zh ? "你来当人肉心脏 🫀" : "You Be the Human Heart 🫀"}</h2>
            <p className="lede">
              {zh ? (
                <>你对模型说：<strong>「创建一个 hello.py 并运行它」</strong>。它聪明地吐出第一条命令——然后就<strong>停了</strong>。
                  接下来每一步都得你来泵血：<strong>亲手在右边的终端里把命令敲出来</strong>（真的可以打字），再把输出搬回对话框。
                  数着自己搬了几次。</>
              ) : (
                <>You tell the model: <strong>&quot;create a hello.py and run it&quot;</strong>. It smartly emits the first command — then <strong>stops dead</strong>.
                  From here every beat is on you: <strong>type the command into the terminal on the right yourself</strong> (it really types), then carry the output back to the chat.
                  Count your trips.</>
              )}
            </p>
            <HarnessGame locale={l} />
          </Reveal>
        </div>
      </section>

      {/* ───── act 2: the concept ───── */}
      <section id="concept" style={{ background: "var(--bg2)" }}>
        <div className="wrap">
          <Reveal>
            <div className="act-tag">{zh ? "第二幕 · 处方" : "ACT 2 · THE PRESCRIPTION"}</div>
            <h2>
              {zh ? <>把「你」换成 <code style={{ fontSize: ".85em" }}>while True</code></> : <>Replace &quot;you&quot; with <code style={{ fontSize: ".85em" }}>while True</code></>}
            </h2>
            <p className="lede">
              {zh ? (
                <>刚才你做的所有事——看模型要不要执行、跑命令、贴结果——没有一步需要智能，全是体力活。
                  体力活就该交给代码。整个循环只盯<strong>一个信号</strong>：</>
              ) : (
                <>Everything you just did — checking whether the model wants something run, running it, pasting results — required zero intelligence. It was pure manual labor,
                  and manual labor belongs to code. The whole loop watches <strong>one signal</strong>:</>
              )}
            </p>
            <div className="panel" style={{ marginBottom: 36 }}>
              <table>
                <thead>
                  <tr>
                    <th>{zh ? "信号" : "SIGNAL"}</th>
                    <th>{zh ? "含义" : "MEANING"}</th>
                    <th>{zh ? "循环动作" : "LOOP ACTION"}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span className="badge tool">stop_reason == &quot;tool_use&quot;</span></td>
                    <td>{zh ? "模型举手：「我要用工具」🙋" : "The model raises a hand: “I need a tool” 🙋"}</td>
                    <td>{zh ? <>执行 → 喂回 → <b style={{ color: "var(--green)" }}>继续跳</b></> : <>execute → feed back → <b style={{ color: "var(--green)" }}>keep beating</b></>}</td>
                  </tr>
                  <tr>
                    <td><span className="badge end">stop_reason != &quot;tool_use&quot;</span></td>
                    <td>{zh ? "模型说：「我做完了」😌" : "The model says: “I'm done” 😌"}</td>
                    <td><b style={{ color: "var(--red)" }}>{zh ? "心跳停止（正常下班）" : "flatline (a healthy one)"}</b></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="lede" style={{ marginBottom: 0 }}>
              {zh ? (
                <>分工从此清晰：<strong>模型负责决策</strong>（下一步干什么、要不要收工），<strong>循环负责供血</strong>（执行、喂回、再来一圈）。
                  循环本身没有任何智能——但没有它，再聪明的模型也只是一段不会动的文字。</>
              ) : (
                <>The division of labor is now clean: <strong>the model decides</strong> (what next, when to stop) and <strong>the loop pumps blood</strong> (execute, feed back, go again).
                  The loop holds zero intelligence — but without it, the smartest model is just text that can&apos;t move.</>
              )}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ───── act 3: simulator ───── */}
      <section id="act3">
        <div className="wrap">
          <Reveal>
            <div className="act-tag">{zh ? "第三幕 · 心电图" : "ACT 3 · THE ECG"}</div>
            <h2>{zh ? "给循环做一次心电图 📈" : "Run an ECG on the Loop 📈"}</h2>
            <p className="lede">
              {zh ? (
                <>左边是 30 行的完整实现，右边是 <code>messages</code> 数组的实时心电。单步播放一次真实请求：
                  每一条消息的 JSON 都和真实 Anthropic API 一字不差。</>
              ) : (
                <>On the left, the full 30-line implementation; on the right, a live ECG of the <code>messages</code>{" "}array.
                  Step through one real request — every message&apos;s JSON matches the actual Anthropic API byte for byte.</>
              )}
            </p>
            <LoopSimulator locale={l} />
          </Reveal>
        </div>
      </section>

      {/* ───── act 4: build it ───── */}
      <section style={{ background: "var(--bg2)" }}>
        <div className="wrap">
          <Reveal>
            <div className="act-tag">{zh ? "第四幕 · 出院带药" : "ACT 4 · TAKE-HOME MEDICINE"}</div>
            <h2>{zh ? "把这颗心脏装进你自己的机器 🔥" : "Install This Heart on Your Own Machine 🔥"}</h2>
            <p className="lede">
              {zh
                ? "上面是模拟，这是真药。复制这 30 行，连上真模型、跑真命令："
                : "The above was a simulation. This is the real medicine — copy these 30 lines, hook up a real model, run real commands:"}
            </p>
            <div className="try-box">
              <div className="warn">
                ⚠️ {zh
                  ? "它会执行模型生成的 shell 命令——请在一个临时目录里玩。真正的免疫系统（权限）第 3 章才长出来。"
                  : "It executes model-generated shell commands — play inside a throwaway directory. The immune system (permissions) doesn't grow until Chapter 3."}
              </div>
              <CopyPre text={AGENT_PY} label={zh ? "复制 agent.py" : "copy agent.py"} />
              <p style={{ color: "var(--dim)", fontSize: 14.5 }}>
                {zh ? <>跑起来后试试：<code>Create a file called hello.py that prints Hello</code>、<code>List all Python files here</code>、<code>What is the current git branch?</code>——观察<b style={{ color: "var(--text)" }}>哪些问题让循环多跳几圈，哪些一圈就停</b>。</>
                  : <>Once running, try: <code>Create a file called hello.py that prints Hello</code>, <code>List all Python files here</code>, <code>What is the current git branch?</code> — and watch <b style={{ color: "var(--text)" }}>which prompts make the loop beat extra rounds and which stop in one</b>.</>}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───── deep space ───── */}
      <section>
        <div className="wrap">
          <Reveal>
            <DeepSpace locale={l} />
          </Reveal>
        </div>
      </section>

      {/* ───── quiz + next ───── */}
      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <Reveal>
            <h2 style={{ fontSize: 24 }}>{zh ? "出院考试 ✍️" : "Discharge Exam ✍️"}</h2>
            <div style={{ marginTop: 18 }}>
              <Quiz locale={l} />
            </div>
            <div className="next-card" style={{ marginTop: 50 }}>
              <h3>{zh ? "下一章 · 双手 🔧" : "Next · The Hands 🔧"}</h3>
              <p>
                {zh
                  ? "现在这颗心脏只长了一只手：bash。读文件要 cat，写文件要 echo >，找文件要 find——能用，但笨拙得像用筷子做外科手术。"
                  : "Right now this heart has grown exactly one hand: bash. Reading means cat, writing means echo >, finding means find — workable, but as clumsy as surgery with chopsticks."}
              </p>
              <p>
                <b>
                  {zh
                    ? "给它 5 根手指会发生什么？模型会同时用两只手吗？两只手会打架吗？"
                    : "What happens when we give it five fingers? Will the model use both hands at once? Will the hands fight?"}
                </b>
              </p>
              <p style={{ fontSize: 13, fontFamily: "var(--mono)", color: "var(--dim)" }}>
                {zh ? "孵化中 🥚" : "incubating 🥚"}
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
