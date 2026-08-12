# fgos-coding-driving claim step — branch by domain.worktreeBacked

Item: tsk-5y5

## Feature boundary

`fgos-coding-driving`'s claim-before-first-`executing`-stage-invocation
hard rule currently always calls `fgos pick` (worktree-creating,
`isolate:true`). It never reads `domain.worktreeBacked`, so a future
domain declared `worktreeBacked:false` (e.g. `synthetic`) with a real
`executing`-stage skill would get a worktree forced on it for no reason.
This item fixes that by branching the claim step on the already-registered
per-domain `worktreeBacked` field. Prose-only fix in the driving skill's
own doc; no engine code change, no new test surface.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Claim step branches on `domain.worktreeBacked`. `true` → unchanged: `fgos pick <id> --dir root`, then `EnterWorktree` into `data.worktree.path` (today's coding-domain behavior, untouched). `false` → `fgos take --role session --id <id> --dir root` (no `EnterWorktree`), invoke the `executing`-stage skill directly at the main checkout. Scope is exactly 2 files: `.claude/skills/fgos-coding-driving/SKILL.md` and its mirror `.agents/skills/fgos-coding-driving/SKILL.md` (confirmed byte-identical today via `diff`). No `bin/fgos.mjs` change — `claimWork`'s `isolate` param and `take --id`'s stage-agnostic claim already support both branches. No test — no test surface exists for skill-body prose in this repo. |
| D2 | Add one short clarifying line to the SKILL.md's "Red flags" section (or the D9/D10 intro paragraph) stating the new `worktreeBacked` branch reads an already-registered per-domain field and is not itself a new domain-generalization assertion — so it does not contradict the existing "this loop is proven correct for coding domain only... never asserted to generalize automatically" (D9/D10) disclaimer. User's explicit choice, over leaving those sections untouched, to prevent a future reader seeing the new branch as self-contradictory with the coding-only disclaimer. |

## Scout evidence

- `src/runner/claim-port.mjs:88` — `claimWork(dir, { id, actor, isolate, ... })`: `isolate: true` = create worktree (pick behavior), `false` = no worktree (take behavior). Param already exists, no change needed.
- `bin/fgos.mjs:1770-1799` (`case 'take'`) — explicit `--id` claims an item regardless of stage; only gates on `deps`/lineage when `status === 'todo'`. Comment at line 1785-1788 confirms: "a clarify/decompose item is claimable here exactly like `pick` already allows (status and stage are independent axes, fsm.mjs)". Same reasoning extends to `executing`-stage items.
- `bin/fgos.mjs:1856-1884` (`case 'pick'`) — always claims with `isolate:true` (worktree), no branch on domain.
- `src/state/workflow-stage-graphs.mjs:46-114` — `DOMAINS` registry: `coding` (`worktreeBacked: true`, `skillMap` has all 3 stages incl. `executing: 'fgos-coding-implement'`); `synthetic` (`worktreeBacked: false`, single stage `assembling` → `skillMap.assembling: null`). Confirms today's bug is latent, not live: `synthetic`'s only stage resolves to a `null` skill, so `fgos-coding-driving`'s own loop stops at the "skill is null → stage is mechanical" branch before ever reaching the claim-step check — the claim-forced-worktree bug can only manifest for a *future* domain that has both `worktreeBacked:false` AND a real skill mapped to its Execute-satisfying stage. No such domain exists today.
- `.claude/skills/fgos-coding-driving/SKILL.md` and `.agents/skills/fgos-coding-driving/SKILL.md` — confirmed byte-identical (`diff` → "Files are identical"). Both carry the same hard rule (~lines 97-119, "Claim right before the FIRST invocation") and loop pseudocode claim line (~lines 194-196), neither branching on `worktreeBacked` today.
- `fgos tool query --capability impact-analysis --status present` → GitNexus registered, `status: "present"`. Per `CLAUDE.md`'s capability gate, this is **full** posture (freshly checked this session) — but this item touches skill-body prose only, no symbol/function edits, so `impact()`/`detect_changes()` have no code surface to run against here; noted for the record per the gate's own instruction.

## Canonical references

- `plans/reports/internal-research-260804-1230-routing-coding-driving-domain-gap-plan-report.md`:
  - §3 "Finding 2" (lines 139-158) — confirms the gap, frames fix-now vs defer.
  - §5 (lines 211-232) — "Item B — filed as `tsk-5y5`": fix-now already chosen; root cause already sharpened to the exact `claimWork`/`take`/`pick` evidence above; recommends the prose-only branch this CONTEXT.md locks as D1.
  - §7.5 (line 420) — diagrams this exact claim step as the judgment-call node.
- `tsk-3w3` — parent milestone (multi-domain-readiness); this item's decision log entry references it.
- Related, not a dependency: `tsk-3xo` (Finding 1 — domain can't cross Clarify/Divide stage; different files, no overlap: `discovery.mjs`/`decompose.mjs`/`bin/fgos.mjs` vs. this item's `fgos-coding-driving/SKILL.md` doc-only scope).

## Outstanding questions deferred to planning

None — scope, files, and behavior are fully locked (D1, D2). Exact prose wording of the two edited sections is `fgos-coding-planning`/`fgos-coding-implement`'s job, not decided here.
