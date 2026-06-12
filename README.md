# Agent Anatomy · 把 Claude Code 拆开看

> Don't just read Claude Code — take it apart and rebuild it with your own hands.
> 不是读 Claude Code，是把它拆开，再亲手装回去。

An interactive, bilingual (中文 / English) course that dissects how an AI coding agent works, one organ at a time. Every chapter ships three things:

- 🎮 **An interactive toy** — feel the problem in your browser before reading a single line of theory
- 🐍 **A minimal runnable implementation** — ~30 lines you can copy and run against a real model
- 🛸 **A "Deep Space" portal** — first-hand evidence dug out of a real, locally-installed Claude Code binary (`strings`, `sdk-tools.d.ts`), clearly separated from third-party analysis

每一章 = 一个能玩的交互装置 + 一段能跑的最小代码 + 一扇通往真实源码的「深层空间」。

## Chapters · 解剖图谱

| # | Organ · 器官 | Mechanism | Status |
|---|---|---|---|
| 01 | 心跳 The Heartbeat | Agent Loop | ✅ LIVE |
| 02 | 双手 The Hands | Tool Use | 🥚 incubating |
| 03 | 免疫系统 The Immune System | Permissions | 🥚 |
| 04 | 条件反射 The Reflexes | Hooks | 🥚 |
| 05–20 | … | Plan/Todo · Subagents · Skills · Compaction · Memory · System Prompt · Error Recovery · Tasks · Background · Cron · Teams · Protocols · Autonomy · Worktrees · MCP · Assembly | 🥚 |

## Run locally

```sh
npm install
npm run dev
# open http://localhost:3000 — it follows your browser language (中文/EN, switchable)
```

## Stack

Next.js (App Router) · TypeScript · three.js · hand-rolled i18n (cookie + Accept-Language) · zero CSS framework

## Honesty & credits

- The course **outline** is inspired by [shareAI-lab/learn-claude-code](https://github.com/shareAI-lab/learn-claude-code) — a great map of Claude Code's mechanisms. The narrative, interactions, metaphors and code on this site are original.
- The [anthropics/claude-code](https://github.com/anthropics/claude-code) GitHub repo does not ship readable TypeScript source. All "Deep Space" evidence is labeled by provenance: **BINARY · FIRST-HAND** (extracted with `strings` from a local install), **SDK TYPES · FIRST-HAND** (official `sdk-tools.d.ts`), or **THIRD-PARTY · ATTRIBUTED**.
- Claude Code is a product of Anthropic. This is an unofficial, educational project.

## License

MIT
