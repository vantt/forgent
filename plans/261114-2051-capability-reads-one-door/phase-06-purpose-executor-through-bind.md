---
phase: 06
title: "Choosing an executor for a purpose goes through bind(); the first-prefer chooser and the reverse prefer match are deleted"
status: pending
effort: 6h
depends_on: [01, 03]
parallel_with: [02, 04, 05]
needs_owner: [Q1, Q2, Q3]
---

# Phase 06 — Purpose to executor through bind()

## Context

Big lead decision (2026-11-14, inside the owner's frame): one door for the whole system; a second executor
chooser is a worse violation than a field reader, so step 1 must not leave one. Read `plan.md` (Facts, Intended
deltas, Owner questions Q1-Q3), `src/runner/dispatch/resolve.mjs:28-266`, `src/runner/dispatch/plan.mjs:280-584`,
`src/runner/dispatch/mechanism.mjs:50-95`, `src/runner/work-dispatch.mjs:440-520`, `src/runner/execution/bind.mjs:572-584`
(`bindWorkSeat`), `packages/seat-binding/rust/src/rank.rs:210-258` (tool-only seats are refused
`not-an-agent-seat`), `src/state/tool-registry.mjs:60-115` (tool executors name their capability in `for`).
Start only when phase 03 is merged (same files) and the owner has answered Q1-Q3; the steps below implement the
recommended options; a different answer changes only the step it names.
Impact analysis (as phase 01) on `resolveExecutorAndOverrides`, `resolveExecutorConfig`,
`decideExecutorDispatchMechanism`, `compileDispatchPlan`, `resolveCapabilityDetailsFromHints`, `workUnitFor`
(the function holding `work-dispatch.mjs:445`). Expect HIGH: `fgos dispatch decide` and the Agent/Task PreToolUse
hook sit on this path; report the blast radius before editing.

## What exists today (traced)

`resolveExecutorAndOverrides(cfg, idOrPurpose)` (`resolve.mjs:226-266`) has four branches:
1. `executors[id]` -> that entry, `bindingSource: 'executor-id'` — a lookup of a named executor, chooses nothing. **Stays.**
2. no id and `cfg.executor` -> the default executor, `'default'` — a lookup. **Stays.**
3. id equals `'executor'`, `cfg.executor.command`, or its first invocation's command or id -> the default
   executor, `'default'` — a lookup by name. **Stays.**
4. `capabilities[id].prefer` present -> `normalizePreferCandidates(prefer)[0]`, `'capability.prefer'` — **the
   second chooser. Deleted.**

Callers and where the argument can be a purpose (a capability row name):

| Caller | Argument | Branch reached today |
|---|---|---|
| `plan.mjs:453` | `effectiveDispatchPolicy(...).executorId` (already `bind()`'s) | 1 |
| `plan.mjs:468` | `workHint.workExecutorId` (a Work step skill, e.g. `fgos-coding-implement`, a capability row) | 1 or 4 |
| `plan.mjs:476` | `--for <purpose>` | 4 (or 1 when the purpose is an executor id) |
| `plan.mjs:507` | positional `decide <name>` (may be a row name) or the id from 468/476 | 1, 3 or 4 |
| `mechanism.mjs:82` | `plan.mjs:498` (positional name, may be a row) and `bind.mjs:98,148` (real ids) | 1 or 4 |
| `resolve.mjs:274` (`resolveExecutorConfig`) | `transport.mjs:155` <- `assignment-runner.mjs:871` (`bind()`'s id), `work-dispatch.mjs:265` (`binding.executor`), `plan.mjs:327` (unconfigured work id), `plan.mjs:540` (id from 468/476/507) | 1-3, or 4 via 507 |
| `work-dispatch.mjs:445` | `executorIdForWork(item, stage)` (a step skill) | 1 or 4; its result feeds capability hints (447) and the unit's soft `prefer` (502) |

The reverse match (`resolve.mjs:66-71`) adds every capability whose raw `prefer` `===` the executor id (or whose
`executors[prefer]` is the resolved entry) as a capability candidate. Only a string `prefer` can match. In the
standard config every `prefer` is a list; in this repo only `impact-analysis: prefer: gitnexus` matches, and
`gitnexus` declares `for: [impact-analysis]`, which the tool branch at `resolve.mjs:57-63` already adds.

## Requirements

1. `resolve.mjs`: replace `resolveExecutorAndOverrides` with `lookupExecutor(cfg, id)` = branches 1-3 only (same
   return shape, `configured: false` otherwise). Every caller in the table moves in this phase (L10):
   `mechanism.mjs:82`, `resolve.mjs:274`, `plan.mjs:453/468/476/507`, `work-dispatch.mjs:445`. Delete the
   `capability.prefer` branch, its comment block (`resolve.mjs:196-224`, the D1/D5 narrative moves to the
   decision history in phase 07) and the now-unused `normalizePreferCandidates` import.
2. New `purposeSeatOf(cfg, purpose)` in `src/runner/dispatch/plan.mjs` (exported; `plan.mjs` already imports
   `bindWorkSeat`, and `work-dispatch.mjs` (tier 7) may import tier 5). It is the one door from a purpose to an
   executor:
   - `lookupExecutor(cfg, purpose)` configured -> that (a purpose that is an executor id names it; nothing chosen).
   - else, when the purpose's own row has a usable pool (`hasOwnPreferPool(cfg, purpose)`, exact key, as today's
     branch 4 requires an own `prefer`): `bindWorkSeat({ runnerConfig: cfg, unit: { id: purpose, capability: purpose } })`
     -> `{ executorId: binding.executor, executor: executors[binding.executor], configured: true,
     bindingSource: 'seat-binding', invocationId: binding.invocation ?? undefined, binding }`.
   - a `bindWorkSeat` refusal with code `not-an-agent-seat` (every candidate is a tool executor) -> Q1 option A:
     the first executor in insertion order with `kind: 'tool'` whose `for` includes the purpose, `bindingSource:
     'tool-for'`; none -> unconfigured.
   - any other refusal -> `{ configured: true, executorId: null, refused: { reason, detail } }`; the dispatch plan
     reports `mechanism: 'unavailable'`, `reasonCodes: [..., 'seat-binding.refused']`, `blockedReason` (Q2 option A).
   - no own pool -> unconfigured, exactly as today (a purpose with no row, or a row without `prefer`, stays
     `selector.unregistered` / native-first with `--needs-soul`; never a `tierFallback` executor). This keeps the
     Agent/Task PreToolUse hook's `decide --for <label> --needs-soul` answer `in-process`.
3. `compileDispatchPlan`: the work (468), purpose (476) and positional (507) paths call `purposeSeatOf`; when it
   returns a `binding`, pass it to `policyForPlan` (so tier, model and executor come from the same `bind()`;
   `policy.executor-mismatch-ignored` can no longer fire for these paths). `decideExecutorDispatchMechanism` and
   `resolveExecutorConfig` then only ever see executor ids.
4. `work-dispatch.mjs:445`: `purposeSeatOf(cfg, executorId)`; the capability hints (447) take `resolvedExecutor`
   from it; the unit's soft `prefer` (502) is `binding.executor` when bound, or the looked-up executor id, as today.
5. Delete the reverse `prefer` match (`resolve.mjs:65-71`) (Q3 option A). Tool executors keep contributing their
   `for` (57-63).
6. Harness (`compare-capability-reads.mjs`, written by phase 01; this phase is its second and last writer): add
   allowlist entries for the Q1-Q3 deltas, each naming its plan.md delta row; add probes: a purpose whose
   `prefer[0]` cannot run here (CLI absent from a fixture PATH), a tool-only row with and without a matching `for`,
   a string `prefer` naming an agent executor, the PreToolUse label probe (`decide --for red-team --needs-soul
   --has-live-task-access` must stay `in-process`).

## Files

- Modify: `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/plan.mjs`, `src/runner/dispatch/mechanism.mjs`,
  `src/runner/work-dispatch.mjs`, `plans/261114-2051-capability-reads-one-door/reports/equivalence/compare-capability-reads.mjs`
- Tests (owning files, extended, not new files): `test/runner/dispatch.test.mjs` (decide by purpose, positional
  row name, work id), `test/runner/work-unit-for.test.mjs` (Work unit soft prefer and capability), and the
  resolve/mechanism cases in `test/runner/dispatch-plan-policy.test.mjs`.
- Create/Delete: none (`resolveExecutorAndOverrides` deleted inside `resolve.mjs`)

## Tests

- Changed behaviour, each with one case in its owning file (titles in plain words):
  purpose answered by bind() when the first `prefer` entry cannot run here (CLI absent on the fixture PATH);
  purpose refused by bind() is `unavailable` with the refusal; tool-only purpose answered by the tool whose `for`
  names it, and unconfigured when none does; purpose with no own pool stays unregistered, and `--needs-soul`
  stays in-process; the reported invocation is the bound one; Work unit soft `prefer` is the bound executor;
  a string `prefer` naming an agent executor no longer makes that capability a candidate.
- Retired: every assertion on `bindingSource: 'capability.prefer'` and on `resolveExecutorAndOverrides`'s purpose
  branch (find with `rg -n "capability\.prefer|resolveExecutorAndOverrides" test`); each names its new owner (the
  cases above) in the commit message; lookup cases move to `lookupExecutor` in the same file.
- Fixtures: tests that decide by purpose need the agent CLIs the bound executor runs on the fixture PATH (bind
  refuses `agent-cli-missing` otherwise). Reuse the existing fake-CLI helper if one exists
  (`rg -l "PATH" test/helpers`); never add an env switch or test-only branch.

## Gates

```
node scripts/run-tests.mjs test/runner/dispatch.test.mjs test/runner/dispatch-plan-policy.test.mjs \
  test/runner/dispatch-policy-baseline-snapshot.test.mjs test/runner/dispatch-executor-profile.test.mjs \
  test/runner/egress-governance.test.mjs test/runner/assignment-dispatch.test.mjs test/runner/assignment-provenance.test.mjs \
  test/runner/work-unit-for.test.mjs test/runner/spawn-worker.test.mjs test/runner/operation-choice.test.mjs \
  test/runner/work-path-case-admission.test.mjs test/state/work-size-rigor.test.mjs \
  test/setup/capability-catalog-doctrine.test.mjs test/runner/dispatch-reconciliation-import-graph.test.mjs \
  test/runner/dispatch-confinement-p04.test.mjs test/runner/execution/bind.test.mjs test/architecture.test.mjs
node scripts/doc-health.mjs
node scripts/check-decision-citation-drift.mjs
npm run fgos:dev -- dispatch decide --for red-team --needs-soul --has-live-task-access --json   # mechanism in-process
npm run fgos:dev -- dispatch decide --for impact-analysis --json                               # gitnexus (tool-for)
```
Plus `rg -l "dispatch/resolve.mjs|dispatch/plan.mjs|dispatch/mechanism.mjs|work-dispatch.mjs|dispatch.mjs" test`.
Rust: not touched.

## Net size

src: −~60 (branch 4 and its comment, reverse match) +~35 (`purposeSeatOf`, call-site changes); tests: modified
cases plus ~8 new cases in existing files.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| The Agent/Task PreToolUse hook starts refusing (decide no longer `in-process`) | M x H | no own pool -> unconfigured exactly as today; gate command above; hook test if one exists (`rg -l "PreToolUse" test`) |
| Purpose decide now depends on CLI presence and account state | H x M | intended (Q2); fixtures put fake CLIs on PATH; harness probe |
| Host exec per Work unit build (`bindWorkSeat`) | M x L | one exec, p95 ~4 ms (seat-binding spec §13); Work builds are not hot |
| `work-dispatch.mjs` is tier 7 Work code | L x M | edit is one call site; tier 7 may import tier 5; architecture test |
| Owner picks a non-recommended option | M x M | each option changes one named requirement (2 for Q1/Q2, 5 for Q3) |

## Rollback

Revert the phase merge (plan.md Rollback); 07 must be reverted first if merged.

## Success criteria

`rg -n "resolveExecutorAndOverrides|capability\.prefer" src bin` finds nothing; `rg -n "preferOf\(|normalizePreferCandidates\(" src bin`
finds only `seat-binding-checks.mjs` and `config.mjs`; gates green; harness 0 failures outside the Q1-Q3 allowlist.
