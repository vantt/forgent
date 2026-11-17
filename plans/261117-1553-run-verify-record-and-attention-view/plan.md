---
contract: plan-v1
title: "Keep the verify result in the run record, and one attention view on dispatch inspect"
status: ready
priority: P2
blockedBy: []
footprint:
  - plans/261117-1553-run-verify-record-and-attention-view/**
  - src/runner/execution/run.mjs
  - src/runner/execution/unit-summary.mjs
  - packages/run-result/contracts/unit-summary.read.v3.json
  - packages/run-result/rust/src/unit_summary.rs
  - packages/run-result/rust/tests/unit_summary.rs
  - src/runner/dispatch/runtime-inspection.mjs
  - src/verbs/dispatch/inspect.mjs
  - src/cli/command-registry.mjs
  - packages/host-runtime/contracts/command-manifest.json
  - bin/fgos.mjs
  - test/runner/dispatch-runtime-inspect.test.mjs
  - test/cli/dispatch-inspect.test.mjs
  - test/cli/run-verb.test.mjs
  - docs/platform/runner/contracts/unit-run-result.md
  - docs/platform/run-supervisor/spec.md
  - CHANGELOG.md
  - packages/git/contracts/mutation-census.v1.json
base: 6a414c9680c0ffc23c87a18af1a3587831df5050
source:
  - plans/reports/audit-261117-1545-supervisor-watcher-audit.md (section D, items 5 and 6; owner decision 2026-11-17 15:55)
created: 2026-11-17
---

# Keep the verify result in the run record, and one attention view on dispatch inspect

One owner question is open; it
blocks nothing, because the plan records the default it will take.

## Outcome

1. A run that ran verify keeps the outcome: the command, the exit status, pass or fail, and how long it took. It sits
   in the unit settlement (`unit.json`), in `unit-summary.json`, and in the `fgos run --json` result, as the field
   `verify` that today only says `{ran:false}`. A reader can tell later whether verify ran, passed and how long it took.
2. `fgos dispatch inspect --attention --since <T>` lists, across every worktree of the project, the runs that need a
   person since `T`: failed, blocked, refused, needs-human, live past the deadline, live and idle. One line each, with
   the reason and the next command. It reuses inspect's readers; no new store, no timer, no mailbox.

## Prior art (git log -S, read on the base commit)

- `verify: { ran: false, reason }` came in `48d457a53` ("keep verify and skills on the Unit, bound the verify step").
  `verify` as a Unit field is read by Workflow (`unit-run-result.md` row "`rounds`, `findings`, `sync`, `verify`,
  `commit`", status "present"). Nothing ever stored the verify seat's facts; `runVerify`
  (`src/runner/execution/custody-door.mjs:79`) already measures `status`, `how`, `tail`, `durationMs`, `outputDigest`,
  and `verifyUnit` (`run.mjs:540`) throws all but pass/fail away. **Reused:** `runVerify`'s facts, `settleUnitRun`
  (`run.mjs:366`) storing `settlement`, `buildUnitSummary` copying settlement fields (infrastructure facts, v3).
  **Missing:** the storing and copying of the verify facts, and the reader side.
- `unit-run-result.md` line 7 says "unit-summary stays version 2" and is stale (v3 shipped with the infrastructure
  facts); phase 5 corrects that line because it is the owning contract of this change.
- `needs attention` has no prior symbol: `git log -S'needs-attention'` and `-S'attention'` over `src docs` find nothing
  on `dispatch inspect`. The prototype's `watch` lives on `origin/plan-supervisor-prototype`, not on main, so there is
  nothing on main to delete for it.
- **Reused for the view:** `allRuns`, `result()`, `owner()` in `src/runner/dispatch/runtime-inspection.mjs`,
  `readAttemptView` (`src/verbs/dispatch/show-run.mjs`: `attemptState`, `unitState`, `resumeCommand`) and
  `scanTerminalAllocations` (`src/terminal-control/client.mjs:252`). **Missing:** a selector that filters by time
  across all workspaces, a reason per run, and the deadline and idle read for a live run.

## Decision taken (so no question blocks it)

**Where the verify record lives.** The owner asked for "the existing run-result contract (assignment-run-result v3)".
The verify check is not an assignment attempt: it is run by the controller under worktree custody and has no
`run.json` or `result.json`, so `assignment-run-result` v3 has no place to hold it. The same facts that contract's owner
(Execution) already records at unit level are the unit settlement, `unit-summary` v3 and the `fgos run` result
(`unit-run-result.md` section 3, "the verify result ... Execution"). The plan therefore adds `verify` there, and leaves
`assignment-run-result` v3 untouched. This is one record, written once at settlement and copied, never a second store.
Shape (the shared contract between phases 1, 2 and 5):

```json
{ "ran": true, "command": "npm test", "outcome": "pass|findings|timeout|not-run",
  "exit": 0, "passed": true, "durationMs": 4120, "how": "exited 0", "outputDigest": "sha256:..." }
```

and the existing `{ "ran": false, "reason": "..." }` stays for a run that did not verify. `exit` is null when the
command did not run to an end. When a loop verifies more than once (reviewed rounds), the field holds the last verify,
the one that decided the outcome. The output tail stays out of the record (it is already in the failure text and can be
large). `unit-summary` stays version 3 with `verify` optional: a summary written before reads as no `verify` key, never
as a pass; the Rust reader accepts both. If the owner wants a version bump, phase 2 is the only phase that changes.

## Acceptance criteria

1. A unit run with a verify command that passes writes `verify.ran === true`, `passed === true`, `exit === 0`,
   `durationMs >= 0`, and the same object in `unit.json` `settlement.verify`, `unit-summary.json` `verify`, and the
   `fgos run --json` result (`data.results` unit-level `verify`). Proof: `node --test test/cli/run-verb.test.mjs`.
2. A failing verify records `passed === false`, `outcome: "findings"`, the real exit status; a timeout records
   `outcome: "timeout"`, `exit: null`. Same test file.
3. A run with no verify command still reports `{ran:false, reason}`; an old summary without `verify` is read without
   error by Node and Rust. Proof: `cargo test -p run-result` and `node --test test/runner/run-result-v3-reader.test.mjs`.
4. `fgos dispatch inspect --attention --since <T> --json` lists one row per run that needs attention, from every
   worktree of the project, none older than `T`, each with `reason` and `nextCommand`; healthy and finished-pass runs
   are absent. Proof: `node --test test/runner/dispatch-runtime-inspect.test.mjs` (the behaviours) and
   `node --test test/cli/dispatch-inspect.test.mjs` (one wiring proof: flags, exit code, text line).
5. `--attention` without `--since`, or with another selector, is refused like today's selector rule.
6. Nothing new is written by the view: no file under `.fgos` changes after a call (asserted in the runner test).
7. `npm test` and `cargo test --workspace` green on the merged tree; `node scripts/plan-contract-check.mjs --plan
   plans/261117-1553-run-verify-record-and-attention-view` exits 0; `CHANGELOG.md` `[Unreleased]` has the two lines.

## Non-goals

- No timer, no mailbox send, no push alert, no supervisor state, no decision queue (owner deferred alerts).
- No change to `assignment-run-result` v3, to the run supervisor's idle or deadline rules, or to Workflow's gate.
- No new store or index of "attention" state: the view is computed from run records on each call.
- Not fixing the step timeout that did not fire on a pane without a prompt (filed separately as a run-supervisor fault).
- No edit to the solo-driving trial plan's watcher procedure; the owner updates it after this lands.
- No `--yagni` flag was passed; the full requested scope is delivered, nothing beyond it.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Verify facts into the settlement, summary and run result](phase-01-verify-facts-writer.md) | - | src/runner/execution/run.mjs, src/runner/execution/unit-summary.mjs, test/cli/run-verb.test.mjs | 1 | ready |
| 2 | [Verify in the unit-summary contract and the Rust reader](phase-02-verify-contract-rust-reader.md) | - | packages/run-result/contracts/unit-summary.read.v3.json, packages/run-result/rust/src/unit_summary.rs, packages/run-result/rust/tests/unit_summary.rs | 1 | ready |
| 3 | [Attention reader on the inspect use case](phase-03-attention-reader.md) | - | src/runner/dispatch/runtime-inspection.mjs, src/verbs/dispatch/inspect.mjs, test/runner/dispatch-runtime-inspect.test.mjs | 1 | ready |
| 4 | [Attention flags: command, manifest, wiring proof](phase-04-attention-flags.md) | 3 | src/cli/command-registry.mjs, packages/host-runtime/contracts/command-manifest.json, bin/fgos.mjs, test/cli/dispatch-inspect.test.mjs | 2 | ready |
| 5 | [Docs and CHANGELOG](phase-05-docs-and-changelog.md) | 1, 2, 3 | docs/platform/runner/contracts/unit-run-result.md, docs/platform/run-supervisor/spec.md, CHANGELOG.md | 2 | ready |
| 6 | [Integration and full gate](phase-06-integration.md) | 1, 2, 3, 4, 5 | packages/git/contracts/mutation-census.v1.json, plans/261117-1553-run-verify-record-and-attention-view/reports | 3 | ready |

Hot file: `packages/git/contracts/mutation-census.v1.json` is regenerated (never hand-merged) in every phase commit that
edits a census-listed file (the pre-commit hook refuses otherwise): phases 1, 2, 3 and 4. It is not listed in those
phases' footprints, because same-wave phases would then overlap; a conflict on it is resolved by regenerating it
(`node scripts/git-one-door-scan.mjs --write-census`) on the merged tree. Phase 6 owns it in the table.

**Contract check.** `scripts/plan-contract-check.mjs` could not run in the planner sandbox (YAML door: `git-addon-unavailable: addon not shipped on this channel`); its rules were applied by reading, and HARDEN runs the script. The reading found: required keys present, `base` is 40 chars, the six body headings are in order, every phase sits in a later wave than its dependencies, and no two phases in one wave share a footprint (wave 1: phases 1, 2, 3; wave 2: phases 4, 5), with the census file as the named hot file.

## Owner questions

One, non-blocking (default taken, phase 2 is the only phase that changes on a different answer).

1. **Should `unit-summary` get a version 4 for the new `verify` field?**
   - *What is happening:* the verify outcome must be stored in `unit-summary.json`, whose contract id is
     `unit-summary` version 3.
   - *Cause:* the field is additive and optional, and the Rust reader only validates the fields it names, so v3 files
     with and without `verify` both read. A bump would force `backfill-unit-summaries.mjs` and the "unsupported-version"
     path on every summary on disk.
   - *Options:* (a) keep v3, `verify` optional (cost: a reader cannot tell "verify not recorded" from "old file" except
     by the missing key; no migration); (b) v4 with `verify` required (cost: `--regenerate` of every stored summary and
     every reader moves in one change, per L10).
   - *Recommendation:* (a). The old file's absent key already reads as "not recorded", which is true.
   - *Scope of the answer:* this contract only; it does not set the rule for later fields.

## Risks and rollback

- **Workflow reads `verify`** (`unit-run-result.md` section 7). Today it only ever sees `{ran:false}`; a `{ran:true,...}`
  object is new to it. Phase 1 step 1 greps every reader (`rg -n "\.verify\b" src/workflow src/runner`) and moves each
  in the same phase; a reader that treats any present `verify` as "did not run" is a regression and gets a test.
- **Deadline and idle for a live run** may not be readable from Node alone (the supervisor keeps absolute times on
  `CLOCK_BOOTTIME`). Phase 3 step 1 finds the readable source; if only the contract's `timeoutMs` plus the run's start
  time is readable, the view reports "live past its declared timeout" from those two and says so in the reason text.
  Idle is reported only when the supervisor's own idle record can be read; otherwise the row set simply has no idle
  rows and the phase report says it (not guessed from file times, which the audit rejected).
- **Store root.** Runs of every worktree sit in the main checkout's `.fgos`; the view must read that root even when called
  from a linked worktree. Phase 3 step 1 proves it against `repoRootForDispatch`.
- **Rollback:** each phase is one commit; revert in reverse order (6, 5, 4, 3, 2, 1). Nothing migrates data: summaries
  written with `verify` stay readable by the old reader (extra key), so a revert strands no file.

## What the planner could not verify

See `reports/planner-report.md`.
