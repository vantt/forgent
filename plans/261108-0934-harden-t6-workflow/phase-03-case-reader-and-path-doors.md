---
phase: 03
title: "One case reader, one run-directory door that refuses a non-case id, and one durable-write path for the case files"
status: pending
depends_on: [01, 02]
parallel: "wave 1, alone (the door lands with every caller, L10, and the callers are in every wave-2 lane's files)"
effort: ~1d
net_size: "Node −60 / Rust 0 / tests +20 (estimate)"
---

# Phase 03 — Case reader and path doors (simplicity 4, 7, 8; B-10, B-11, B-12, B-15; R-9 ids and reader race)

## Context

Arbitration §1 Case ledger contract ("one reader `readCaseProjection(mainRoot, id, { retryTail })` in `case-projection.mjs`", "one `runDirOf`/`runsRoot` … that refuses an id that is not one path segment of the case-id pattern", "durable writes only through `replaceDurably`/`installOnce` plus one exported `fsyncDirectory`; a short `writeSync` is retried or refused"), delete list (`CASE_EVENT_KINDS`), §5.2 ("one reader + `runDirOf` first, others rebase onto it").

**Deviation (plan fact 4):** the arbitration put `runDirOf` in `store.mjs`. The A4 guard (`test/architecture.test.mjs:841-859`) forbids `src/runner/execution` from importing any `workflow/` module, and the Execution Core already builds a case path (`gateAnswerFile`, `handoff-refs.mjs:89-92`) that Workflow imports (`case-runtime.mjs:14`). So the door goes into one small leaf in `src/runner/execution/` (the lowest layer that builds the path, design principle 2), holding `runsRoot`, `runDirOf` and `gateAnswerFile`; Workflow, setup, scripts and `handoff-refs.mjs` import it. Lead question Q-4 confirms the home before this phase starts.

Code read on `595faa273`:
- Readers: `readCaseProjection` `case-close.mjs:14-19` (events → `projectWorkflowState` → `projectCase` twice; `projectCase` folds again at `case-projection.mjs:72`); `readCase` `case-admission-port.mjs:45-51` (retries an unterminated tail 3× with no wait, `:34-41`); `readCase` `case-verbs.mjs:43-47`; `const reread` `runner.mjs:102-110`; importers `case-inherit.mjs:11,39`, `propose.mjs:23,606`. `playbookSubjectDigests` lives in `case-close.mjs` and imports `unit-handoff` digests.
- Builders: `store.mjs:42-44`, `case-lock.mjs:19-21` (`workflowRunDirOf`, exported), `case-runtime.mjs:20`, `case-admission-port.mjs:29,140`, `case-bindings.mjs:25-27` (`.bindings`), `propose.mjs:590,592`, `handoff-refs.mjs:91`, `src/setup/workflow-case-checks.mjs:34`, `src/setup/holder-lock-checks.mjs:225`, `scripts/backfill-unit-summaries.mjs:22`. Not builders, left alone: `handoff-refs.mjs:230` (relative-path check), `src/runner/dispatch/confinement/resources.mjs:31` (mask template). Id rule to reuse: `caseEnvOf`'s `idLike` `/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/` (`case-admission-port.mjs:123`), which refuses `.bindings` and `..`. A non-case id was once advanced: `.fgos/workflow-runs/.bindings/advance.lock` exists in the real tree (B-15).
- Durable writes: `writeDurably` `store.mjs:113-121` ignores `writeSync`'s byte count (B-12); `fsyncDirectory` `store.mjs:123-130`; `fsyncDir` `case-bindings.mjs:31-38`, used at `:164`; `renderGateAnswerFile` `case-runtime.mjs:146-154` tmp + `renameSync`, no fsync (B-10); first ledger line `store.mjs:97-101` — `installOnce` has the same semantics.
- Dead: `CASE_EVENT_KINDS` `case-projection.mjs:16` (no user).

Not reproduced at arbitration, so **red first**: the R-9 reader race (an unlocked reader meets an append in flight), B-15/R-9 ids (`../x`, `.bindings`), B-12 short write; B-10 and the builders as a recorded scan.

## Requirements

1. **One reader.** `readCaseProjection(mainRoot, id, { retryTail })` moves to `case-projection.mjs`; `projectCase` takes the already folded state (no second `projectWorkflowState`); the guide is derived once; `playbookSubjectDigests` moves to `ref-digests.mjs` (which owns digests) so projection does not import `unit-handoff`. The copies in `case-admission-port.mjs`, `case-verbs.mjs`, `runner.mjs` call it; `case-inherit.mjs` and `propose.mjs` import it from its new home (the guard read at `propose.mjs:606` is deleted by P07 with W-1). `case-close.mjs` keeps closing only.
2. **`retryTail`** retries only `workflow-ledger-unterminated`, only for readers without the hold (status, doctor, admission read), at most 3 tries with a short wait; a corrupt middle line still fails closed (RT-6).
3. **One path door** in the leaf (deviation above): `runsRoot(mainRoot)`, `runDirOf(mainRoot, id)` refusing an id that does not match the case-id rule (`invalid-case-id`, by name), and `gateAnswerFile` moved from `handoff-refs.mjs`. Every builder listed above calls it; `workflowRunDirOf` and the private builders go; `bindingsDir` is `runsRoot(mainRoot)/.bindings` built in `case-bindings.mjs` from `runsRoot`. `caseEnvOf` uses the same rule (one definition).
4. **Durable writes.** First ledger line by `installOnce`; `writeDurably` loops a short `writeSync` until done or refuses (`ledger-short-write`); answer file by `replaceDurably`; `fsyncDirectory` exported once from `store.mjs`, `fsyncDir` deleted; `uniqueTmpTag` import goes from `case-runtime.mjs` if unused.
5. `CASE_EVENT_KINDS` deleted.
6. Behaviour unchanged otherwise; the fold of every existing ledger is identical (one proof: fold of a trimmed real ledger before/after equal).

## Files

**Create:** the path leaf `src/runner/execution/<name>.mjs` (kebab-case, name by the lead, e.g. `case-run-paths.mjs`) and its `docs/architecture-manifest.json` row.

**Modify:** `src/workflow/case-projection.mjs`, `case-close.mjs`, `case-verbs.mjs` (`readCase` swap only), `case-admission-port.mjs` (`readCase`, `caseDirOf`, `:140`, `caseEnvOf` rule), `runner.mjs` (`reread` swap only), `case-inherit.mjs` (import), `propose.mjs` (import, `:590,592`), `ref-digests.mjs`, `store.mjs`, `case-lock.mjs`, `case-runtime.mjs` (`caseDir`, answer file, `gateAnswerFile` import), `case-bindings.mjs`, `src/runner/execution/handoff-refs.mjs` (`gateAnswerFile` moves out, `:91`), `src/setup/workflow-case-checks.mjs:34`, `src/setup/holder-lock-checks.mjs:225`, `scripts/backfill-unit-summaries.mjs:22`, census.

Tests: `test/workflow/workflow-store-ledger.test.mjs` (short write, id refusal, first line), `test/workflow/case-projection.test.mjs` (reader, retryTail, corruption still refuses), `test/workflow/case-runtime.test.mjs` (answer file durable), `test/runner/execution/handoff-refs.test.mjs` (gate-answer path from the leaf), importers of `workflowRunDirOf`/`readCaseProjection` moved.

**Delete:** three reader copies and the double fold; the private builders and `workflowRunDirOf`; `fsyncDir`; the tmp+rename idiom; `CASE_EVENT_KINDS`.

**Cross-lane one-liners:** `handoff-refs.mjs` (T5), `holder-lock-checks.mjs:225` (T1, OPC reviews), `workflow-case-checks.mjs:34` (doctor side), `scripts/backfill-unit-summaries.mjs:22` — each the import and the call, in this commit.

**Tests to retire:** none expected; a test that asserts a private builder's path string moves to the leaf (same file).

## Net size

Node: reader −30, builders −12 (+leaf ≈ 15, −`gateAnswerFile` in `handoff-refs` 4), durable −27, id rule +2, `CASE_EVENT_KINDS` −2 → about −60. Tests: +20 (race with a held append, `../x` and `.bindings` refused at status/close/run, short write, corruption still refuses).

## Steps

1. Q-4 answered; red tests (race, ids, short write); record `rg -n "renameSync|fsyncDir\b" src/workflow` and `rg -n "'workflow-runs'" src scripts` counts.
2. Path leaf and id rule; move every builder (one commit with the outside one-liners).
3. Reader move, `projectCase(state)`, `retryTail`; every caller.
4. Durable writes; `CASE_EVENT_KINDS`.
5. Fold-equality proof on a trimmed real ledger; architecture test; census.

## Validation (focused)

- FR `test/workflow/workflow-store-ledger.test.mjs test/workflow/case-projection.test.mjs test/workflow/case-runtime.test.mjs test/workflow/case-admission-port.test.mjs test/workflow/case-verbs.test.mjs test/workflow/conductor-case.test.mjs test/workflow/stale-approval-reapproval.test.mjs test/workflow/propose.test.mjs test/setup/workflow-case-checks.test.mjs test/setup/holder-lock-checks.test.mjs test/runner/execution/handoff-refs.test.mjs test/runner/execution/run-case-admission.test.mjs test/architecture.test.mjs`
- `rg -n "'workflow-runs'" src/workflow src/setup scripts` → nothing; the leaf is the only builder besides the two non-builders of the context.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| `retryTail` hides corruption (RT-6) | L × H | Requirement 2; corruption test |
| The id rule refuses a legitimate id (`wf-run-…`, `case-…`) | M × M | The rule is `caseEnvOf`'s; the lead proves it on the 54 real ids on fg-server2 (read-only) |
| `projectCase(state)` changes the fold | L × H | Requirement 6 fold-equality proof |
| The leaf drags heavy imports into the ledger | L × M | The leaf imports only `node:path` and the error class (the ledger already imports `config.mjs` today; P14 moves the class to its own leaf) |

## Rollback

Revert; no on-disk change (same bytes).

## Done when

One reader, one path door, durable writes; fold equality green; landed with smoke `fgos workflow status <newest run>` and `fgos workflow close ../x` refused by name; guide section written.

## Lead brief essentials

This phase lands alone; keep each other-lane file edit to the reader/path call. No behaviour change beyond the refusals named. All plan.md lead rules apply.
