---
authoritative_for: docs/specs/runner.md's D0026 "Lớp còn thiếu" narrative claiming no automatic decision layer existed yet for the Native-First Dispatch Doctrine, stale against the very 5-phase table two paragraphs below it showing 4 of 5 phases done (tsk-1ni/27y/53h/3ik) and phase 5 (agy) deliberately deferred; also names what shipped as a deliberate narrowing from the original 4-factor LLM-judgment vision to 3 mechanical config-time factors plus one self-declared has-live-task-access flag, cross-linked from docs/architect/dispatch-control-plane-redesign.md
---

# A doc's own opening paragraph contradicted its own table two screens down

`tsk-17m` fixed a stale-narrative bug in `docs/specs/runner.md`'s D0026
section ("Lớp còn thiếu — LLM đủ thông minh để tự nhận ra khi nào dùng
nhánh nào", the Native-First Dispatch Doctrine's own gap description).

## The contradiction

The section opened with "Hôm nay CHƯA có lớp quyết định nào tự động áp
quy tắc 1-4" ("today there is no automatic decision layer applying rules
1-4 yet") — but its own "Kế hoạch triển khai 5 pha" (5-phase implementation
plan) table, a few dozen lines below in the SAME file, already listed:

- `tsk-1ni` — done (Phase 1)
- `tsk-27y` — done (Phase 2 — caller-supplied verdict protocol)
- `tsk-53h` — done (Phase 3 — the shared native-vs-cli/spawn detection
  helper, now `src/runner/dispatch/mechanism.mjs`'s
  `decideDispatchMechanism`/`decideExecutorDispatchMechanism`, exposed via
  `node src/runner/dispatch.mjs decide` — the mandatory gate for every
  dispatch in this repo per `AGENTS.md`'s Dispatch section, enforced by a
  PreToolUse hook)
- `tsk-3ik` — done (Phase 4 — merging `capacities.<id>` config-dispatch
  with direct Task-tool calls)
- `tsk-6db` — `todo`, but self-noted "deferred, low priority, YAGNI — no
  concrete consumer yet" (Phase 5 — extending native detection to `agy`)

4 of 5 phases were done — only Phase 5 stayed open, and deliberately so
(named explicitly in its own plan, not simply forgotten). The stale
opening paragraph misled readers — including a recent independent review
— into thinking the entire gap was still unaddressed.

## What actually shipped was a deliberate narrowing, never stated as such

D0026's original vision asked the LLM to judge 4 factors: does the
capacity need a soul, does it have a native mechanism, does config force
cli-spawn, and is native worth using for resource-isolation reasons. What
actually got built resolves the first 3 mechanically at config time
(agentType-shaped vs. command-shaped, with D0033's
cli-spawn-shaped-always-wins rule) — leaving exactly one genuinely
runtime-judgment factor ("am I a live soul with Task-tool access right
now?"), narrowed to a self-declared flag from the calling LLM
(`--has-live-task-access`, self-declaration, never probed or guessed).
A reasonable, already-shipped decision — but the original narrative never
said plainly that this was a deliberate narrowing, reading instead as if
a more complex AI-judgment layer was still missing.

## The newest architecture doc didn't know this history existed

`docs/architect/dispatch-control-plane-redesign.md` (2026-08-26, the
newest architecture doc, also covered by
[`dispatch-plan-protocol-redesign`](dispatch-plan-protocol-redesign.md))
mentions the `decide` mechanism itself in its own Problem Statement ("a
`decide` command that chooses whether a target should run native/in-process
or out-of-process") but never cross-referenced D0026 or any of
`tsk-1ni`/`27y`/`53h`/`3ik`/`6db` — zero hits grepping those ids in that
file. A reader of the newer redesign doc had no way to know `decide` was
already the mechanism that closed the D0026 gap.

## What shipped

- `docs/specs/runner.md`'s opening paragraph was rewritten to state the
  present tense correctly: the gap already has a mechanical decision layer
  plus a self-declaration protocol via 4 done phases, with only Phase 5
  (`agy`) deliberately deferred. The original 4-factor vision description
  was kept (real historical/documentation value) — only the "still fully
  open" reading was corrected.
- A line was added naming what was built as a deliberate NARROWING (3
  mechanical config-time factors + 1 self-declaration flag), pointing
  directly at `mechanism.mjs`'s `decideDispatchMechanism`/
  `decideExecutorDispatchMechanism` as evidence.
- The 5-phase table gained an explicit done/deferred status per row, so
  the table is self-sufficient without a reader having to separately query
  live state.
- `docs/architect/dispatch-control-plane-redesign.md`'s Problem Statement
  gained a short cross-reference back to `runner.md`'s D0026 "Lớp còn
  thiếu" section, naming `decide` as the result of D0026's 4 done phases
  with Phase 5 as the one deliberately-deferred remainder.

## Explicitly out of scope

No dispatch decision or logic changed — pure narrative reconciliation
against what already shipped. Phase 5 (`agy`)'s deferred/YAGNI status was
not reopened for debate — only accurately reflected in the docs.

## A follow-up added the current-vocabulary overlay this reconciliation implied (`tsk-4he`)

`tsk-17m` fixed the narrative's own accuracy; `tsk-4he` added the piece a
reader still needed: a dedicated "Từ vựng dispatch hiện hành" (current
dispatch vocabulary) section in `docs/specs/runner.md`, placed before the
historical "Lịch sử quyết định" section so current terms are read first.
It gives a current-term ↔ superseded-term table:

| Current | Superseded | Meaning | Reference |
|---|---|---|---|
| `work` | `rootTask` | the root work unit (`tsk-*`), holds T1 role when active | ADR 0029 |
| `child work` | `subTask` | a work item decomposed from a parent work | ADR 0029 |
| `executor` | `capacity` (execution unit sense) | the concrete execution target (agentType/cli/task/mcp) | ADR 0034 |
| `capability` | `capacity` (behavior-promise sense) | the named abstract behavior an executor provides | ADR 0034 |
| `launcher` | `orchestrator` (old `0026` sense) | activates work, stands it up, then lets go | ADR 0028 |
| `driver` | (unchanged) | stays engaged with work start to finish | ADR 0029/0031 |
| `orchestrator` | (re-assigned, `0029`) | the T0 layer managing N work units, stays engaged | ADR 0029/0031 |
| `DispatchPlan` | (new) | the resolved dispatch plan: mechanism, target, metadata | `src/runner/dispatch/plan.mjs` |
| `DispatchAssignment` | (new) | a concrete dispatch assignment binding an executor to a work item | `src/runner/dispatch/plan.mjs` |

Also fixed two stale `capacities.<id>` mentions left over from D0034's
rename to `capabilities.<id>`/`executors.<id>` — plain leftover text in
the same D0026 section this whole doc covers, corrected alongside the
vocabulary table. `rootTask`/`subTask` are named explicitly as fully
removed from the dispatch vocabulary per ADR 0029, not merely deprecated.
