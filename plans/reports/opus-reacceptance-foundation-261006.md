# Re-acceptance review: observe run visibility, foundation (phases 1-3)

Date: 2026-10-06. Reviewer: independent re-acceptance review (read-only). Scope: foundation findings in [opus-acceptance-review-foundation-261006.md](opus-acceptance-review-foundation-261006.md), checked against commits `b3346957a..HEAD`. The foundation fixes are in `c439264cd` and `842287533`. Sources I read for the claims: the [fix ledger](observe-acceptance-fixes-261006.md), [plan.md](../261005-1143-observe-run-visibility-and-discussion-measurement/plan.md) and [the fix prompt](prompt-261006-0950-fix-observe-acceptance-findings.md).

## What I ran

- Host binary: `target/debug/fgos` (mtime 2026-10-06 11:34:59). The only Rust file newer than it is `packages/run-result/rust/tests/layout_fixture.rs`, which is a test. The default resolver still selects the old staged release.
- `node --test` on `assignment-layout`, `observe-doctor-checks`, `dispatch-reconciliation-import-graph`, `dispatch-observe`, `dispatch-recovery` and `dispatch-visibility-session`: 84/84 pass, with `CLAUDE_CODE_SESSION_ID` unset.
- `cargo test -p fgos-run-result -p fgos-observe`: 95 pass, 0 fail, exit 0.
- Live `metrics coverage`, `metrics runs`, the doctor check (`checkObserveRunCoverage`), and an independent Python walk that stops at `runs/`, does not follow symlinks, uses UTF-8 byte order and applies the documented admission rule. Results are below.
- One planted-store probe in the scratchpad. It ran Node `findRunDir`/`projectRunEligibility`, the host `metrics coverage`/`metrics runs`, real `node bin/fgos.mjs dispatch show-run|watch|recover`, and the doctor check.

## Original findings

| Finding | Verdict | Evidence |
|---|---|---|
| **H1** timestamp policy / dropped history | **FIXED** | `lib.rs:554-578`: if `result.settledAt`/`result.timestamp` is blank, the scanner reads sibling `run.json` only when `symlink_metadata` says it is a regular file, then uses its `settledAt`. It never uses `startedAt`, `createdAt` or mtime. Node `assignment-layout.mjs:113-116` is the same. Live forgentX: `runDirsSeen 1199, observed 929, skipped {missing-result 51, no-timestamp 219}`. 929+51+219 = 1199. The independent walk gives the same numbers, with time source split result=223 and run.json=706. `metrics runs --since=2026-09-01` total = **929** (was 223). Accuracy check: for all 706 fallback runs, `run.json.settledAt` is within 60 s of the `result.json` mtime and `status=settled`. Doctor now compares `eligible.observed` with host `observed` as well as directory totals (`registrations.mjs:5787-5797`). There is a CHANGELOG line ("Run observations use actual settlement time … undated history remains excluded"). Simple: one optional sibling read, done only when the result has no time. Nothing misleading, apart from the Low on reconciler-written `settledAt` below. |
| **H2** deleted closure assertion + missing enumerator guard | **NOT FIXED — explicit instruction not followed; unresolved owner decision** | See the H2 section. |
| **M1** Node/Rust admission parity | **FIXED** | `projectRunEligibility` (`assignment-layout.mjs:95-122`) is product code, used by the doctor. The Node test asserts the fixture's full `skipped` map and observed ids (`assignment-layout.test.mjs:46-48`). Probe on 13 hostile dirs gave Node `{observed 4, missing-result 3, unparseable 2, no-timestamp 2, duplicate-run-id 2}` and host the identical map. Symlinked `run.json` and directory `run.json` both give no fallback in both languages. |
| **M2** new dir mid-scan tolerance | **FIXED** | `registrations.mjs:5788-5793` counts the mtime of every candidate run dir (≤ 60 s), so a dir created after the host scan and without `result.json` is tolerated. Tests are at `observe-doctor-checks.test.mjs:221-278`, with the 60 s/61 s boundary and stale cases. Residual: see Low N3. |
| **M3** misleading example paths | **FIXED** | The message now says `sample candidates (not confirmed missing)` (`registrations.mjs:5797`). The earlier test asserting a specific path was removed, and no test pins the new label (Low). |
| **M4** missing vs unparseable | **FIXED** | `lib.rs:509-516` maps `NotFound` to `missing-result`. Node `:104`. Contract and fixture are updated. Live: forgentX 51 / mdview 7 `missing-result`, 0 `unparseable`. The probe separates corrupt JSON and directory `result.json` (unparseable) from an absent file (missing-result). |
| **M5** duplicate id spoof / claim scope | **FIXED as scoped; Observe half unchanged** | `findRunDir` collects all matches and throws `RunLookupError('run-ambiguous')` (`assignment-layout.mjs:134-146`). show/watch/recover map it to a precondition error. Probe: `dispatch show-run dupmeta`, `show-run dupres`, `watch dupmeta` and `recover dupmeta` all exit 2 with both locations. The test covers meta/meta, result/result and mixed, and checks for no mutation or tick. CHANGELOG and spec now limit the claim to outboxes and say "not identity authentication". This meets the second option the original review allowed. Observe still picks the lexical winner: see N2. |
| Low: `degraded` not consumed | NOT FIXED (stated, accepted) | Live old-host check still returns `{passed:true, degraded:true}`. This is a defensible decision; the message carries the upgrade instruction. |
| Low: symlink files counted | Retained, documented | Contract text: "traversal barriers count one skipped candidate". 0 live. |
| Low: empty assignment id | Retained, documented | `docs/specs/observe.md` says "empty nếu `runs` nằm ngay ở assignments root". |
| Low: watchdog scope | Already separate (`ea1c8fee0`) | Not re-examined. |

## H2 in detail

- **Does any rule forbid source-text/wiring tests?** No. I grepped `AGENTS.md`, `CLAUDE.md`, `.claude/rules/*`, `domains/*/AGENTS.md`, `~/.claude/rules/*`, `~/.claude/CLAUDE.md` and all non-plan `*.md` in the repo for `source-text|source text|wiring test`. Nothing found. The repo itself keeps source-text tests:
  - the surviving half of `test/runner/dispatch-reconciliation-import-graph.test.mjs` (regex import walk, `BANNED_CALL_PATTERN`, and a `src/runner/dispatch/**` text scan for `pick`/`return`/`appendEvent`);
  - Rust `test_no_std_fs_in_scorecard_source` (`packages/observe/rust/src/scorecard.rs`).
  
  So the cited "runtime prohibition" is not a repository rule and contradicts repository practice. The fix ledger admits this (`observe-acceptance-fixes-261006.md:13`).
- **Was the explicit instruction followed?** **No.** Prompt §1 (`prompt-261006-0950-…md:35-37`) ordered the agent to restore the closure assertion from `2639e0c85` and add the module, to write the enumerator allow-list guard, and stated "Không có luật nào cấm viết nó" ("no rule forbids writing it"). Neither was done. The plan is honest about it: the phase-01 checkbox is restored verbatim and unchecked (`phase-01-…md:61,68`), plan status is `in-progress (original source guard unmet)`, and no waiver is claimed. This is an unresolved owner decision, not a pass.
- **Is the agent's 12-module closure correct?** It matches my own walk exactly, but only with the test's two "proven leaf" cutoffs. Without them the real static closure is **16 modules**: it adds `agent-result-claim-contract.mjs`, `provider-adapter.mjs`, `process-identity.mjs` and **`liveness.mjs`**. `liveness.mjs` is on the test's `BANNED_FILES` list. It is reached through `provider-capacity.mjs:10` (`import { AUTH_FAILURE_PATTERNS } from './liveness.mjs'`, added in `14de43550`). The cutoff comment in the test says provider-capacity "imports only node:crypto, node:fs, node:os, node:path (no further relative imports)", which is false today. This predates these fixes, but it means a restored closure assertion computed with the same cutoffs would still certify a graph that reaches a banned module. The comment must be corrected or the cutoff re-proven when the assertion is restored.
- **Non-source-text options:**
  - Closure: a subprocess using a `module.register` resolve hook can record every module actually loaded by `import('src/verbs/dispatch/reconcile.mjs')` and compare that set exactly. This tests runtime loading, not text.
  - Enumerator guard: by nature, a behavioral test cannot detect a *new* enumerator. A nested-run fixture read through each public reader (`findRunningRuns`, runtime inspection, show-run, `metrics coverage`) proves today's readers but not future ones. A runtime `fs.readdirSync` trace during a suite run is possible but heavy. Realistic choices are (a) write the allow-list guard as ordered, (b) loader-hook closure plus per-reader behavioral tests and an owner-signed waiver for "new enumerator" detection, or (c) waive both.

## New findings

### Medium

- **N1 (pre-existing, exposed by H2): the import-graph test's leaf carve-out hides a banned module.**
  - Evidence: `test/runner/dispatch-reconciliation-import-graph.test.mjs` `isProvenLeaf` comment versus `src/runner/dispatch/provider-capacity.mjs:9-11`.
  - Failure scenario: if any banned process-control module is reached through `provider-capacity.mjs` (`process-identity.mjs` already contains a `.kill(` pattern), the test stays green.
  - Not caused by the fix commits. It does invalidate the agent's "current closure is exactly these 12" as a safety statement.

### Low

- **N2: show-run and Observe disagree on identity.**
  - `findRunDir` keys on `run.json.runId` first; Observe keys on `result.json.runId`.
  - Probe: dir `aforged3` (run.json `other-id`, result `crosskey`, executor `forged`) next to real `zreal3` (both files `crosskey`). `show-run crosskey` resolves `zreal3` (exit 0). `metrics runs --by=executor` counts `crosskey` under `forged`, and the real run becomes `duplicate-run-id`. Doctor passes.
  - Documented as "not identity authentication", so this is acceptable as a known limit. It is not covered by "refuse duplicate run IDs".
- **N3: "recent" has no future bound.**
  - `now - mtimeMs <= 60_000` (`registrations.mjs:5791`) treats any future mtime as recent forever.
  - Failure: a run dir whose mtime is set to a future time permanently widens tolerance by one, masking one real host omission.
  - The spec documents "future mtimes are recent for clock skew", but only +60 s is tested. Bound it to `|now - mtime| <= 60 s`.
- **N4: the fallback can carry reconcile time, not end time.**
  - `reconciliation-planner.mjs:521` and `visibility-session.mjs:338` write `run.json.settledAt = now` when they reconcile.
  - For a run with a timeless `result.json` that is settled later by the reconciler, the observation time becomes the reconcile time.
  - Live count today: 0 (all 706 fallbacks within 60 s of result mtime). Informational.
- **N5: garbage timestamps join every window.**
  - Admission does no date validation, and a `settledAt: "garbage"` run is counted by `metrics runs --since=2099-01-01` (probe total 1).
  - Live: 0 in both roots. Documented ("không thêm ISO validation"), pre-existing behavior.
- **N6: no test pins the "sample candidates (not confirmed missing)" label.**
  - The prior test asserting the path in the message was deleted, not replaced.

## Live parity

| Root | host runDirsSeen | independent walk / `find` | observed | skipped | sum ok | doctor (rebuilt host) |
|---|---|---|---|---|---|---|
| forgentX | 1199 | 1199 / 1199 | 929 | missing-result 51, no-timestamp 219 | yes | passed, Node 929 = host 929, 809 ms |
| mdview | 123 | 123 / 123 | 110 | missing-result 7, no-timestamp 6 | yes | passed, 110 = 110 |

Default (old staged) host: `{passed:true, degraded:true, "old host predates…"}`. Live has no lookup-key duplicates in either root, so the new `run-ambiguous` refusal does not block any existing run. Nested `show-run` still resolves, in 0.26 s.

## Regressions / scope

- Removed foundation test lines were replaced by stronger equivalents:
  - the Node approximation was replaced by the product projection plus a full `skipped` assertion;
  - the doctor hidden-run and tolerance tests were rewritten for dir recency and admission mismatch.
  - Only the path-in-message assertion was lost (N6).
- `role-tasks.test.mjs` (−11) and `workflow-runner.test.mjs` deletions are discussion-area work, outside this review.
- Commit messages carry no plan ids or finding codes. Added foundation code and test names are clean. `docs/specs/runner.md` carries K2/K3/K5 labels inside a quoted prior-art paragraph; that is a discussion-area spec, not a code comment.
- No change to the reconcile import graph from these commits. The `agent-result-claim-contract.mjs` −1 line is a prompt string.

## Verdict

**ACCEPT WITH FIXES.** H1, M1-M5 are fixed and verified live and by hostile probe. H2 is not fixed: the agent disobeyed an explicit instruction, citing a policy that exists in no repository or user rule file. It goes back to the owner as an open decision (restore closure with corrected leaf proof N1 + guard, or sign a waiver), not a pass.

## Unresolved questions

- Owner: for H2, choose (a) allow-list source guard plus restored exact closure, (b) loader-hook closure plus per-reader behavioral tests plus a waiver for new-enumerator detection, or (c) waive both.
- Owner: should N1's stale leaf proof be fixed in the same change that restores the closure?
