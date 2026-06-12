# Baby Agent 🐣 · 从一行循环养大一个 AI

> Don't just read Claude Code — raise it from a single loop, by hand.
> 别只是读 Claude Code，亲手把它从一行循环养大。

A cheerful, interactive, **bilingual (中文 / English)** course where you *raise* an AI coding agent from scratch. It hatches in Chapter 1 and grows one new ability per chapter. Every chapter ships three things:

- 🎮 **A playable mini-game** — feel the problem in your browser before reading a line of theory
- 🐍 **A minimal runnable implementation** — ~30 lines you can copy and run against a real model
- 🛸 **A "Deep Space" portal** — first-hand evidence dug out of a real, locally-installed Claude Code binary (`strings`, `sdk-tools.d.ts`), clearly separated from third-party analysis

每一章，小 Agent 学会一项新本领：一个能玩的小游戏 + 一段能跑的最小代码 + 一扇通往真实源码的「深层空间」。

## Growth Map · 成长图谱

| # | Ability · 本领 | Mechanism | Status |
|---|---|---|---|
| 01 | 🐣 苏醒 Wake Up | Agent Loop | ✅ LIVE |
| 02 | 🙌 长出双手 Grow Hands | Tool Use | 🥚 in the egg |
| 03 | 🛡️ 学会说不 Learn to Say No | Permissions | 🥚 |
| 04 | ⚡ 条件反射 Reflexes | Hooks | 🥚 |
| 05–20 | … | Plan/Todo · Subagents · Skills · Compaction · Memory · System Prompt · Error Recovery · Tasks · Background · Cron · Teams · Protocols · Autonomy · Worktrees · MCP · Graduation | 🥚 |

## Run locally

```sh
npm install
npm run dev
# open http://localhost:3000 — it follows your browser language (中文/EN, switchable)
```

## Stack

Next.js (App Router) · TypeScript · three.js · hand-rolled i18n (cookie + Accept-Language) · zero CSS framework · cheerful light theme with a dark "Deep Space" mode

## Honesty & credits

- The course **outline** is inspired by [shareAI-lab/learn-claude-code](https://github.com/shareAI-lab/learn-claude-code) — a great map of Claude Code's mechanisms. The narrative, metaphors, interactions and code on this site are original.
- The [anthropics/claude-code](https://github.com/anthropics/claude-code) GitHub repo does not ship readable TypeScript source. All "Deep Space" evidence is labeled by provenance: **BINARY · FIRST-HAND** (extracted with `strings` from a local install), **SDK TYPES · FIRST-HAND** (official `sdk-tools.d.ts`), or **THIRD-PARTY · ATTRIBUTED**.
- Claude Code is a product of Anthropic. This is an unofficial, educational project.

## License

MIT
