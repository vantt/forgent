---
id: ready-plan-runs-unattended
kind: procedure
owner: core
scope: repo
mode: append
specificity: 10
title: A ready plan runs to done without the owner
description: The standing rule for an unattended plan run — host steps with an executor, fixed cleanup, core/debt-ok marks, one batched ask before ready, the split lens
lifecycle: live
valid_from: 2026-11-27
---

# A ready plan runs to done without the owner

Standing process law for every plan, recorded with no per-plan owner approval. Why: `plans/discussions/ds-que32ftgg6-ready-plan-runs-unattended/DISCUSSION.md` §4 (D1, D4, D5) and §6. A plan carries an `## Unattended run` section with the subsections Host steps, Cleanup, Beyond the rule and Split (shape in `core/skills/_shared/plan-contract.md` §3).

**Host steps have a named executor.** Every step that needs more than a unit sandbox is written as an exact `fgos` argv plus the persona that runs it. Which door runs which step, and who may call it, is data read at plan time with `fgos can-i` against the head permission table and the project's release recipe; this unit lists no doors. A step whose argv answers `deny`, or that no door can run, keeps the plan from `ready`. A lead asks the supervisor for its rows with `fgos supervisor raise --kind coordination-help`, naming the plan's listed argv, never with an owner question. The full gate runs before land through `fgos release check --worktree <path>`, called by the lead.

**Cleanup is fixed.** The land door removes a landed branch's worktree. At close the lead lists its superseded worktrees (tip on main or on the branch that replaced them), merged branches and its own duplicate runs; the supervisor removes them through `fgos worktree remove --delivered-to <ref>`, which refuses undelivered work. Unmerged branches and dirty worktrees go in the closing report and nobody deletes them. A plan states only cleanup that differs.

**Every acceptance criterion is marked `[core]` or `[debt-ok]`.** The owner marks them when the discussion settles; an unmarked criterion counts as `core`. A `debt-ok` criterion that cannot be met inside the plan's frame does not stop the plan: the lead records the remainder as named debt in its closing report in the plan directory and asks the secretary to open the backlog row (no head writes `plans/backlog.md`); the plan still reaches `done`. A `core` criterion that cannot be met is a real deviation and goes to the run-time ask rule.

**Beyond the rule asks once, before `ready`.** One batched owner question, and only the phases it touches wait, for any of: debt on a `core` criterion or narrowing one; a new or widened trust boundary (a new grant, a sandbox read, a global config change, a `protectedConfigPaths` key); a new component or decision kind (`fgos authority declare`) or a change to a locked law; an irreversible step; a plan-specific fallback ("if X, do Y") the plan wants pre-approved. Everything else in this unit is decided by the agent and reported, never asked.

**What the check enforces.** For a plan going `ready`, `scripts/plan-contract-check.mjs` fails when: the Unattended run section is missing; a host step has no argv or no executor; an acceptance criterion has no `core` / `debt-ok` mark; a beyond-the-rule item has no answered `q-` id. It reads shape only. Whether the permission table allows an argv, and whether the footprint trace is complete, are the validator's judgment.

**Choose how to split with "cost of waiting vs cost of being wrong" (a lens, not a mandate).** Owner explanation, 2026-11-26, kept in full so it is not misread:

- There are two different ways to split a plan. (1) Split into the smallest pieces that can run in parallel. This is always right and does not change (`plan-contract.md` §4: phases, waves, an integration phase).
- (2) Split into step-by-step releases that keep the running system stable and compatible. This is a habit from human-speed work and often does not fit when an agent is far faster than a person. Example: work A takes a person 7 days and an agent about 2 hours. A person plans the 7 days as 7 releases, and each release carries a pile of work only to stay stable and compatible with the old system part by part (shims, twins, staged migrations, temporary guards). All of it is thrown away when the 7 days end. An agent that finishes in hours should not plan that way. It can do the whole change in one big step: there may be temporary disruption inside the step, but when the step ends the work is done.
- The condition: before starting, the agent works out a real path to reverse. It never "just does it". The reverse path covers the state the step touches, inside the worktree and outside it (event store, config, release activation, remote), or the step does not touch outside state before it lands; and the closing check is strict, because it carries the weight.
- Where it comes from: the owner drew it from the angle "cost of waiting vs cost of being wrong" that the agents raised in ds-jxoz3h2qgk, and from the evidence that 193 hours went to waiting, much of it on side work of this kind.
- It is a lens, not a rule that forces. It is one consideration when choosing ("a mindset used while deciding, not a large technical expectation"). Where the cost of being wrong is high and no reliable reverse path exists, staged releases stay a valid choice. The plan says which split it chose and why.
