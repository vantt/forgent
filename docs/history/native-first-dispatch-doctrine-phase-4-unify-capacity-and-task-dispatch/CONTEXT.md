---
type: context
title: "tsk-3ik — Native-First Dispatch Doctrine Phase 4: unify capacities.<id> config dispatch with direct Task-tool calls"
---

# tsk-3ik — Native-First Dispatch Doctrine Phase 4

## Feature boundary

Today two fully separate mechanisms decide how a "needs-soul" target gets
dispatched, with zero shared decision layer between them:

1. **capacities.<id> config path** (`src/runner/dispatch.mjs`'s
   `resolveExecutorConfig`/`resolveCapacityCli`/`spawnWorker`) — always
   resolves to a real `{command,args,provider,model}`, cli/spawn-shaped,
   even for the `agentType` branch (`tsk-3sw`) which still `exec`s
   `claude --agent <name>` as a subprocess rather than calling Task
   natively.
2. **A live session's own direct Agent/Task tool calls** — entirely
   outside `dispatch.mjs`, never touches `capacities.<id>` config at all.

This item unifies both under ONE decision protocol per
`docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
(Native-First Dispatch Doctrine) rules 1-4 — mechanism-level unification
only (subTask and capacity stay distinct concepts, per 0026's own
correction; only "how do we decide native vs cli/spawn" is shared).

## Locked decisions

| ID | Decision |
|---|---|
| D1 | Scope is **broad**, not narrowed to capacity-shaped helpers: the shared decision protocol must govern BOTH `capacities.<id>` config-driven dispatch AND any skill's direct Agent/Task-tool subTask calls, not just the former. Reason (user, verbatim intent): doing this lets fgOS flexibly use many different models across ALL its tools, not just the fgOS-specific capacity mechanism — the payoff is model flexibility for every dispatch path, not just the narrow judge/classify helpers. |
| D2 | This item builds the FIRST real native-Task-dispatch branch itself, now — it is not deferred to a later proving item, despite `docs/decisions/0026-...md`'s phase table implying the pattern would already be "proven on two separate real cases" (`tsk-27y`'s engine-verb case, `tsk-53h`'s skill-facing-helper case) before Phase 4 starts. Scout evidence below shows `tsk-53h` never actually built a native-Task branch — this item is where that first proof happens. Reason (user, verbatim): "the discover phase has many candidates for that" — confirmed real, already-wired candidates exist (see scout evidence) to build and validate the native branch against. |
| D3 | Full scope is "wire everything": every real existing `capacities.<id>` consumer, AND every direct Task/Agent-tool call site in fgOS's own skill catalog (this repo), migrates onto the shared decision protocol. Scout confirms fgOS's own skill catalog (`.claude/skills/`, `plugins/fgOS/skills/`) has ZERO existing direct Task/Agent-tool call sites today (see scout evidence) — so the "direct-call" half of this migration has no existing code to retrofit; it is establishing the mandatory-consult convention any *future* direct-dispatch skill work must follow, not a rewrite of dozens of existing files. The `capacities.<id>` half has three real, already-wired consumers to migrate (see D2). Splitting this into child work items, and continuously building/merging each child rather than one big-bang change, is explicit user instruction — the concrete split (how many children, which consumer first) is `fgos-coding-planning`/`fgos-decompose`'s own shaping call, not decided here. |

## Pinned terms

- **Native-First Dispatch Doctrine** — per `docs/decisions/0026-...md`;
  this item is Phase 4 of that doctrine's 5-phase plan.
- **cli-dispatch** / **task-dispatch** — per `tsk-53h`'s pinned definitions
  (`docs/history/agent-executor-generalized-capacity-helper/CONTEXT.md`):
  cli-dispatch is the `resolveCapacityCli`/`spawnWorker` subprocess-spawn
  mechanism; task-dispatch is native Agent/Task tool use inside a live
  Claude Code session.
- **launcher / rootTask / subTask / capacity** — per 0026's own
  vocabulary section; subTask and capacity remain distinct concepts, only
  the dispatch-decision mechanism is shared between them.

## Scout evidence

- `impact-analysis: full` — GitNexus registered and `present`
  (`fgos tool query --capability impact-analysis --status present`), per
  `CLAUDE.md`'s capability gate.
- `src/runner/dispatch.mjs:650` (`resolveExecutorConfig`),
  `:637` (`buildAgentTypeExecutor`) — confirmed the `agentType` branch
  (`tsk-3sw`) already implements tsk-3sw's "Revised design": every
  capacity, `cli` or `task` kind alike, resolves to a uniform
  `{command,args,provider,model}` shape. The earlier "signal-return
  instead of command" idea is dead code that was never built — no need to
  re-litigate that shape.
- `rg capacity-dispatch-fallback .claude/skills .agents/skills` — only
  real consumer of the shared fragment is `fgos-submit-assist`
  (`capacities.submit-assist-classify`, `kind: "cli"`). No skill or
  `.fgos/config.json` anywhere configures `kind: "task"`/`agentType`
  today; `.claude/skills/_shared/capacity-dispatch-fallback.md`'s Step C
  only ever `exec`s the resolved command — no native-Task branch exists
  anywhere in this repo yet.
- `docs/history/tsk-53h/iron-law-evidence.md` (`agent-executor-generalized-capacity-helper`'s
  own landed diff) — confirmed `tsk-53h`'s actual delivered scope was
  extracting `fgos-submit-assist`'s pre-existing cli/spawn wiring into a
  shared fragment plus a mirror-drift test — it never built a
  native-Task-dispatch branch. The doctrine's phase-table claim that the
  skill-facing-helper case is already "proven" does not hold; this item is
  where that proof needs to happen (D2).
- `src/intake/judge-executor.mjs:417` (`runJudgeExecutor`) — confirmed a
  SECOND real, already-wired `capacities.<id>` consumer distinct from
  `fgos-submit-assist`: `src/intake/discovery.mjs:383` and
  `src/intake/plan.mjs:317` both call `runJudgeExecutor` with a
  hardcoded `'judge-discovery'`/`'judge-decompose'` capacity id, which
  `runJudgeExecutor` resolves via `resolveExecutorConfig` (`dispatch.mjs`)
  as a synthetic role key. Both always cli/spawn a blind `claude -p` judge
  today, unconditionally — this is the exact live case
  `docs/decisions/0026-...md`'s own motivating `tsk-1ni` gap describes.
  `tsk-27y`'s caller-supplied-verdict flags (Phase 2) fixed this bug for
  the ENGINE-VERB caller case by having the calling session bypass
  `judgeDiscovery`/`judgeDecompose` entirely for that one invocation — a
  different mechanism than teaching `capacities.judge-discovery`/
  `capacities.judge-decompose` themselves to dispatch natively, so it does
  not substitute for this item's own native-branch build.
- `rg "Task\(|Agent\(|subagent_type|Task tool|Agent tool" .claude/skills plugins/fgOS/skills`
  → zero hits across fgOS's entire own skill catalog (`.claude/skills/`,
  `plugins/fgOS/skills/`). Confirms D3's claim: no existing direct
  Task/Agent-tool call site exists in this repo's own skills to retrofit
  today.

## Canonical references

- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
  — Native-First Dispatch Doctrine, this item is Phase 4/5.
- `docs/history/caller-verdict-protocol-discover-decompose/CONTEXT.md`
  (`tsk-27y`, Phase 2) — caller-supplied verdict pattern, engine-verb case.
- `docs/history/agent-executor-generalized-capacity-helper/CONTEXT.md`
  (`tsk-53h`, Phase 3) — shared capacity-dispatch consumer pattern
  (cli/spawn only, as it stands before this item).
- `docs/history/agent-executor-capacity-kind-task-resolution/CONTEXT.md`
  (`tsk-3sw`) — `agentType` field + "Revised design" (uniform
  `{command,args,provider,model}` shape) this item builds on.
- `.claude/skills/_shared/capacity-dispatch-fallback.md` — the shared
  fragment whose Step C needs the new native-Task branch.
- `src/intake/judge-executor.mjs`, `src/intake/discovery.mjs`,
  `src/intake/plan.mjs` — the `judge-discovery`/`judge-decompose`
  capacity consumers this item migrates.

## Outstanding questions deferred to planning

- Exact shape of the shared native-vs-cli/spawn decision helper (a
  function, a CLI subcommand, a shared skill-facing fragment addition) and
  where it lives — `fgos-coding-planning`'s implementation-shaping call.
- How to split this item into child work items (one per consumer:
  `judge-discovery`, `judge-decompose`, `submit-assist-classify`, plus the
  shared-helper build itself, plus the "future direct-dispatch skills must
  consult this" convention doc) and their build/merge order —
  `fgos-decompose`'s shaping call, per D3's explicit "continuous build and
  merge" instruction.
- Exact signal a calling skill uses to know it "already has live Agent/Task
  tool access" (self-declared in its own SKILL.md prose vs. a runtime
  check) — implementation detail, planning's call.
