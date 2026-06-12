import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n";
import Reveal from "@/components/Reveal";
import CopyPre from "@/components/CopyPre";
import HeroCircuit from "@/components/ch01/HeroCircuit";
import CourierGame from "@/components/ch01/CourierGame";
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
      {/* ───── hero: headline top + full-width pipeline animation bottom ───── */}
      <section className="hero" style={{ padding: 0 }}>
        <div className="hero-content">
          <div className="hero-kicker">{zh ? "CH 01 / 20 · AGENT LOOP" : "CH 01 / 20 · AGENT LOOP"}</div>
          <h1 className="hero-title">
            {zh ? <>给它一次循环<br />它就活过来了</> : <>Give It One Loop<br />and It Comes Alive</>}
          </h1>
          <p className="hero-sub">
            {zh ? (
              <>小 Agent 刚破壳时只是个<b>会想但不会动的脑袋</b>。给它接上一个 <code>while True</code>——
              它就能持续行动、看见结果、做下一个决策。<b>那个循环，就是这一章要建的东西。</b></>
            ) : (
              <>A baby agent starts as a <b>head that can think but not act</b>.
              Wire it to a <code>while True</code> and it can act, see results, and decide what&apos;s next.
              <b>That loop is what we build in this chapter.</b></>
            )}
          </p>
          <div className="hero-actions">
            <a href="#act1" className="hero-cta">
              {zh ? "先体验没有循环的痛 →" : "Feel the pain without the loop →"}
            </a>
            <a href="#act3" className="hero-cta-ghost">
              {zh ? "直接看模拟器" : "Jump to simulator"}
            </a>
          </div>
        </div>

        {/* full-width continuous pipeline animation */}
        <div className="hero-stage">
          <HeroCircuit locale={l} />
        </div>
      </section>

      {/* ───── act 1: the game ───── */}
      <section id="act1">
        <div className="wrap">
          <Reveal>
            <div className="act-tag">{zh ? "ACT 1 · 玩一下" : "ACT 1 · PLAY"}</div>
            <h2>{zh ? "你来当它的快递员 📦" : "You Be Its Courier 📦"}</h2>
            <p className="lede">
              {zh
                ? "LLM 想得出命令，但送不出对话框。这一单，由你来跑。"
                : "The LLM can think up commands — but can't get them out of the chat. This delivery is on you."}
            </p>
            <CourierGame locale={l} />
          </Reveal>
        </div>
      </section>

      {/* ───── act 2: the concept ───── */}
      <section id="concept" style={{ background: "var(--bg2, transparent)" }}>
        <div className="wrap">
          <Reveal>
            <div className="act-tag">{zh ? "ACT 2 · 原理" : "ACT 2 · THE IDEA"}</div>
            <h2>
              {zh ? <>把「你」换成 <code style={{ fontSize: ".85em" }}>while True</code></> : <>Replace &quot;you&quot; with <code style={{ fontSize: ".85em" }}>while True</code></>}
            </h2>
            <p className="lede">
              {zh
                ? "你刚才跑的腿，没有一步需要动脑。循环只看一个信号："
                : "None of your errands needed a brain. The loop watches one signal:"}
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
                    <td>{zh ? "小 Agent 举手：「我要用工具」🙋" : "The baby raises a hand: “I need a tool” 🙋"}</td>
                    <td>{zh ? <>执行 → 喂回 → <b style={{ color: "var(--green)" }}>再蹦一下 💓</b></> : <>execute → feed back → <b style={{ color: "var(--green)" }}>beat once more 💓</b></>}</td>
                  </tr>
                  <tr>
                    <td><span className="badge end">stop_reason != &quot;tool_use&quot;</span></td>
                    <td>{zh ? "小 Agent 说：「我做完啦」😴" : "The baby says: “I'm done” 😴"}</td>
                    <td><b style={{ color: "var(--red)" }}>{zh ? "安心睡觉（循环退出）" : "off for a nap (loop exits)"}</b></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="lede" style={{ marginBottom: 0 }}>
              {zh
                ? <><strong>模型负责动脑，循环负责跑腿。</strong>循环本身一点也不聪明——但没有它，再聪明的脑袋也只是一段不会动的文字。</>
                : <><strong>The model thinks; the loop runs errands.</strong> The loop isn&apos;t clever at all — but without it, the smartest head is just text that can&apos;t move.</>}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ───── act 3: simulator ───── */}
      <section id="act3">
        <div className="wrap">
          <Reveal>
            <div className="act-tag">{zh ? "ACT 3 · 慢放" : "ACT 3 · SLOW-MO"}</div>
            <h2>{zh ? "一帧一帧看它转圈 🎬" : "Frame by Frame 🎬"}</h2>
            <p className="lede">
              {zh
                ? <>左边 30 行真实代码，右边 <code>messages</code>{" "}数组——单步看一次请求怎么流过循环。</>
                : <>30 real lines on the left, the <code>messages</code>{" "}array on the right — step through one request flowing around the loop.</>}
            </p>
            <LoopSimulator locale={l} />
          </Reveal>
        </div>
      </section>

      {/* ───── act 4: build it ───── */}
      <section style={{ background: "var(--bg2, transparent)" }}>
        <div className="wrap">
          <Reveal>
            <div className="act-tag">{zh ? "ACT 4 · 带回家" : "ACT 4 · TAKE IT HOME"}</div>
            <h2>{zh ? "抱一只回你的机器 🐣" : "Bring One Home 🐣"}</h2>
            <p className="lede">
              {zh
                ? "上面是模拟，这是真的——复制 30 行，它就在你电脑里活了。"
                : "That was a simulation. This is real — copy 30 lines and it lives on your machine."}
            </p>
            <div className="try-box">
              <div className="warn">
                ⚠️ {zh
                  ? "它会执行模型生成的 shell 命令——请在一个临时目录里玩。教它「哪些不能碰」（权限）是第 3 章的事。"
                  : "It executes model-generated shell commands — play inside a throwaway directory. Teaching it “what not to touch” (permissions) comes in Chapter 3."}
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
            <h2 style={{ fontSize: 24 }}>{zh ? "小测验 ✍️" : "Quick Quiz ✍️"}</h2>
            <div style={{ marginTop: 18 }}>
              <Quiz locale={l} />
            </div>
            <div className="next-card" style={{ marginTop: 50 }}>
              <h3>{zh ? "下一章 · 长出双手 🙌" : "Next · Grow Hands 🙌"}</h3>
              <p>
                {zh
                  ? "现在小 Agent 只长了一根手指：bash。读文件要 cat，写文件要 echo >，找文件要 find——能用，但笨拙得像用一根筷子吃饭。"
                  : "Right now the baby has just one finger: bash. Reading means cat, writing means echo >, finding means find — workable, but as clumsy as eating with a single chopstick."}
              </p>
              <p>
                <b>
                  {zh
                    ? "给它一双巧手会怎样？它会同时用好几根手指吗？几只手一起动会不会打架？"
                    : "What happens when it grows nimble hands? Will it use several fingers at once? Will the hands fight when they move together?"}
                </b>
              </p>
              <p style={{ fontSize: 13, fontFamily: "var(--mono)", color: "var(--dim)" }}>
                {zh ? "孵化中 🥚" : "in the egg 🥚"}
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
