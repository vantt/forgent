---
phase: 14
title: "Budget cut: the seven functions over 300 lines, the three line budgets, the run.test.mjs split"
status: pending
depends_on: [09, 10, 12, 13]
parallel: "three lots with disjoint file sets (1 confinement + test split, 2 execution core files, 3 patterns + dispatch plan/settlement); one lead each, own worktree; land one lot at a time"
effort: ~1d
net_size: "Node about -700 / Rust 0 / tests about 0 (split moves tests, retires none)"
---

# Phase 14 — Budget cut

## Context

Owner decision 69 (HARDEN plan, 2026-11-06 20:57, "1b"): one more T5 phase that cuts what the [closing report](../reports/closing-261106-2006-harden-t5-execution-core.md) section 2 lists as not met, and does the test-file split H-T5a (TEST closed 18:57 with no receiver). Refactor only: behaviour unchanged, no new mechanism (RUL104, L10), one proof per behaviour (a split moves a test, it never copies one).

Measured on main `825e44a1f` (2026-11-06 ~21:00, Asia/Saigon; `wc -l` and the acorn scan used for the closing report, scratch `fnlen.mjs` in the session scratchpad; re-run both before starting):

| Budget | Now | Target | Cut needed |
|---|---|---|---|
| `src/runner/execution` (all files, 33) | 7 590 | ≤ 7 000 (aim 6 970) | -590 (-620 aimed) |
| `src/runner/dispatch/confinement/` (10 files) | 5 972 | ≤ 5 950 (aim 5 930) | -22 (-42 aimed) |
| `src/runner/execution/bind.mjs` (real path, same as the report) | 590 | ≤ 520 (aim 515) | -70 |
| Functions over 300 lines in `src/runner/execution` + `src/runner/dispatch` | 7 | 0 (aim ≤ 280 each) | see table |

The seven (acorn scan, `file:line`, length):

| # | Function | File:line | Lines | Lot |
|---|---|---|---|---|
| 1 | `buildConfinementAttestation` | `src/runner/dispatch/confinement/authority.mjs:170` | 343 | 1 |
| 2 | `assessAndPrepare` | `src/runner/dispatch/confinement/authority.mjs:518` | 389 | 1 |
| 3 | `prepareConfinementForLaunch` | `src/runner/dispatch/confinement/authority.mjs:915` | 302 | 1 |
| 4 | `resolveCollaboration` | `src/runner/execution/patterns/catalog.mjs:67` | 515 | 3 |
| 5 | `checkCatalog` | `src/runner/execution/patterns/catalog-entries.mjs:379` | 374 | 3 |
| 6 | `compileDispatchPlan` | `src/runner/dispatch/plan.mjs:285` | 421 | 3 |
| 7 | `settleRunOutcome` | `src/runner/dispatch/settlement.mjs:566` | 338 | 3 |

Next largest, kept under watch (must not pass 300 when the lots move code): `interpretRunResult` 293 (`run-result.mjs:655`), `executeAssignment` 277 (`assignment-runner.mjs:1196`), `normalizeRunResultV3` 277 (`run-result.mjs:343`). Not in any lot; nobody edits their files here.

Where the execution cut comes from (files, line counts, comment lines by `grep -cE '^\s*(//|\*|/\*)'`, same tree): `run.mjs` 975 (224 comments), `catalog-entries.mjs` 752, `catalog.mjs` 581 (10 comments), `bind.mjs` 590 (117), `unit-run-start.mjs` 526 (86), `seat-resolver.mjs` 508 (109), `loops/reviewed.mjs` 421 (71), `unit.mjs` 365 (90), `handoff-refs.mjs` 325 (99). The two pattern files hold 1 333 lines and the two functions in them are the biggest in the layer, so the long functions and most of the budget cut meet there. The rest comes from history and label comments, duplicate expressions and dead branches, the way P10 did it (the comment-heavy bodies of `resolveCollaboration`-style functions and the three authority functions carry dated finding notes: `plan.mjs:310-319` ("Self-review finding (2026-08-25)"), `:513-521` ("H6b (D1, 2026-09-20 ACCEPTED)")). A comment that states a still-true invariant stays, shortened; one that tells a dated story goes (rule: no plan ids, phase numbers, finding codes in code, `review-audit-self-decision.md`).

Prior art (AGENTS "Prior art before design"): P09 and P10 already cut `executeAssignment`, `runUnitBody`, `run.mjs`, `assignment-runner.mjs`; their technique (extract along the seams the function already has, named helper in the same file or in the existing owner module, one run-context object instead of closures) is reused. Nothing new is invented; a new file appears only where a moved block belongs to no existing module, and then it takes a kebab-case name and an `docs/architecture-manifest.json` row.

## Requirements (all lots)

- Refactor only. No behaviour, return shape, error code, message text, persisted format or export changes. A needed export rename or removal moves every caller in the same commit and is named in the report (L10); across lots it needs the other lot's lead told first.
- Each cut function ends ≤ 300 lines (aim ≤ 280) and each helper it creates ≤ 300; a helper that exists for one call gets a name that states the step, not `part2`.
- Net lines per lot at or below the contribution in its table; extracting helpers must be paid for by deleted duplication and dated comments, never by a longer file elsewhere in the same budget area.
- Tests: no assertion weakened; a retired test (only where its behaviour is gone or owned by a named test) is named with its new owner in the report. The split in lot 1 moves tests whole.
- No env switch, flag or test-only branch.
- Every edit to a hashed file regenerates the census in the same commit (`node scripts/git-one-door-scan.mjs --write-census`); `CHANGELOG.md` is not touched (nothing user-visible); a new or deleted `src/` file adds or drops its `docs/architecture-manifest.json` row, and that file is rebase-only across lots: the lot landing second rebases it.
- Impact analysis per symbol before editing, as AGENTS requires (`fgos tool query --capability impact-analysis --status present`; degraded posture: grep callers and say so). Expected callers of the moved functions are internal (same file); the exports `buildConfinementAttestation`, `assessAndPrepare`, `prepareConfinementForLaunch`, `resolveCollaboration`, `checkCatalog`, `compileDispatchPlan`, `settleRunOutcome` keep their signatures.

## Lot 1 — confinement authority and the test split (H-T5a)

**Functions to cut:** `buildConfinementAttestation` 343 → ≤ 280, `assessAndPrepare` 389 → ≤ 280, `prepareConfinementForLaunch` 302 → ≤ 280, all in `authority.mjs` (1 314 lines). Seams to look at first: attestation build vs. the "determined outcome" fallback and the herdr-spawn branch (`:170-513`, the `isHerdrSpawn` block near its end); the `preferred` requirement mode path in `assessAndPrepare` (`:518-907`); in `prepareConfinementForLaunch` (`:915-1217`) the launch-command checks (`:918-946`), the env redaction and worker env (`:1011-1012`), the immutable-proof publish (`:1115-1140`) and the returned record (`:1196`). Helpers stay in `authority.mjs` unless the file would still pass 1 270 lines; then move them to one new module under `confinement/` (name by convention) and keep the layering rule (confinement imports no dispatch module above it).

**Budget contribution:** confinement ≤ 5 950, aim 5 930: `authority.mjs` ≤ 1 270 (-44). No other confinement file is needed; if one is edited it stays ≤ today's count. Does not feed the execution budget.

**Test split H-T5a** (S-3 of the speed seat; the failover half is already done by P12: `run-provider-failover.test.mjs` 31 → 6 tests, 181 lines, stays as is). `test/runner/execution/run.test.mjs` (2 207 lines, 78 tests, 156 s in the closing report; suite wall equals the longest file) is split into four files of about 500-650 lines along the seams of its own test list, each with the same imports, `seedFileLocalBwrapRegistry()` call and local helpers it uses (no helper copied: a helper used by two files moves to `test/helpers/`, a new file there only if no existing helper fits; `run-unit-repo-fixture.mjs` and `run-unit-with-port.mjs` already exist):

| New file (kebab-case, name via convention) | Tests from `run.test.mjs` (current lines) |
|---|---|
| run-gate | `:31-440` (`detectHerdrPresent`, `resolveGitRoots`, `snapshotRunnerConfig`, solo run, layer pin, architecture guard, persona rendering, every `mutating gate:` test) |
| run-roles | `:440-948` (reviewed/panel family tests, input paths, anonymize, commit after producer, preserved dirty work, every blind test, own-previous) |
| run-summary-resume | `:948-1564` (summary and settlement failures, write scope, resume refusals and commit-only resumes, workspace persona) |
| run-verify-pin | `:1564-2207` (custody handoff, rigor families, every verify test, signal handling, pending-record resume, pinned-unit and schema-1 resume tests, account inventory read) |

Rules: every test lands in exactly one file with its body unchanged; the sum of test counts before and after is 78; no test copied, none dropped; shared top-level state (`seedFileLocalBwrapRegistry`, fixtures) is per file. `test/suite-baseline.json:313` lists `run.test.mjs`; TEST's file, so the lead reports the four new names and the retired one in the report and the big lead updates it in the land commit (if `npm test` complains about it, that is the signal). The report prints per-file test count and wall time (`run-tests` spec reporter) against the baseline 156.3 s.

**S-4** (lighter staged test addon, ledger H13) is not part of this phase: it changes test staging (`scripts/lib/git-addon-stage.mjs`, `src/native/door.mjs`), not a file split, and owner decision 69 names the split only. See open questions.

**Files (owned by lot 1):**
- Modify: `src/runner/dispatch/confinement/authority.mjs`; `test/suite-baseline.json` only if the big lead delegates it (default: reported, not edited).
- Create (only if needed): one module under `src/runner/dispatch/confinement/` for moved helpers; the four run test files; at most one `test/helpers/` file.
- Delete: `test/runner/execution/run.test.mjs` (replaced by the four files).
- Tests that must stay green (focused): `test/runner/dispatch-confinement-authority.test.mjs`, `dispatch-confinement-p05.test.mjs`, `dispatch-confinement-p04.test.mjs`, `dispatch-confinement-blind.test.mjs`, `dispatch-confinement-backend-p03.test.mjs`, `provider-credential-renewal.test.mjs`, `cli-spawn-reconciliation.test.mjs`, `test/run-supervisor/sweep.test.mjs`, `test/architecture.test.mjs`, plus the four new run files and `run-provider-failover.test.mjs`, `run-pre-admission.test.mjs`.

**Must NOT touch:** every file of lots 2 and 3 (`src/runner/execution/**`, `src/runner/dispatch/plan.mjs`, `settlement.mjs`); `run.mjs` and its exports (the tests import `runUnit`, `readAccountInventory`, `resolveGitRoots`, `snapshotRunnerConfig`, `detectHerdrPresent` from it: lot 2 keeps those names); other confinement files unless a moved helper forces an import line.

**Validation:** FR on the focused list above before each commit; function-length scan shows the three functions ≤ 300; `wc -l` of `confinement/` printed; after the split, test counts per file sum to 78 and `git diff --stat` shows the old file only as deleted; full suite once at the end (below).

**Risk:** H-impact on security code (confinement authority: attestation, finalization descriptors, host-only record; P03 took three security reviews). Likelihood M, impact H. Mitigation: extraction only, no condition reordered; keep `try/finally` and the order of `saveAttestationRecordThenThrow` / `publishImmutableProof` calls byte-equivalent in effect; the lead diffs the exported behaviour with the confinement test set before and after; request a code review (security-minded) on the diff before landing, as P03 did. Split risk (L × L): a shared module-level state leaks between the four files; each file runs in its own process, so a file-local registry seed is the only state to carry.

**Rollback:** revert the lot's merge commit; nothing on disk or in a contract changes; re-activating the previous release is only needed if the release was already rebuilt.

## Lot 2 — execution core files and `bind.mjs`

**Functions to cut:** none (no function in these files is over 300; `runUnitBody` and `executeAssignment` were cut by P10 and P09). The lot is the budget cut.

**Budget contribution:** `src/runner/execution` -370 (of the -620 aimed, the rest is lot 3): `bind.mjs` 590 → ≤ 515 (-75; hard limit 520, spec §15 of seat-binding), `run.mjs` 975 → ≤ 865 (-110, mostly label and history comments, 224 comment lines today; the `run.mjs` ≤ 1 150 budget stays met), `unit-run-start.mjs` 526 → ≤ 475 (-50), `seat-resolver.mjs` 508 → ≤ 458 (-50), `handoff-refs.mjs` 325 → ≤ 285 (-40), `unit.mjs` 365 → ≤ 335 (-30), `legacy-seat-read.mjs` 214 → ≤ 194 (-20) (the sum is -375; the lead may move lines between these files, but not above the `bind.mjs` limit and not to lot 3's files). `bind.mjs` first: read `askFor` (`:255`), `requestOf` (`:277`), `bindingOf` (`:415-516`), duplicate `executorsOf`/`commandOf` readers, the 117 comment lines; every export stays (`bind`, `bindWorkSeat`, `explainSeat`, `askFor`, `getProviderFamily`).

**Files (owned by lot 2):** `src/runner/execution/{bind,run,unit-run-start,seat-resolver,handoff-refs,unit,legacy-seat-read}.mjs` and, only if a cut needs it, the small neighbours `commit-unit-work.mjs`, `unit-summary.mjs`, `unit-sync.mjs`, `account-rotation.mjs`, `explain.mjs`, `dry-bind.mjs`, `seat-policy.mjs`, `unit-run-history.mjs`, `run-request.mjs`, `case-admission-port.mjs`, `seat-ledger.mjs`, `account-pin.mjs`, `unit-state.mjs`, `partial-writes.mjs`, `unit-control.mjs`. Tests: edit only where a moved internal name is pinned (`test/runner/assignment-enumerator-guard.test.mjs` keys, `test/runner/execution/bind.test.mjs`); never add or retire a test unless its behaviour is gone (then name the owner).

**Tests that must stay green (focused):** `test/runner/execution/bind.test.mjs bind-committed-config.test.mjs tier-fallback.test.mjs seat-policy.test.mjs explain.test.mjs account-rotation.test.mjs account-pin.test.mjs seat-resolver.test.mjs unit.test.mjs unit-summary.test.mjs handoff-refs.test.mjs legacy-seat-read.test.mjs commit-unit-work.test.mjs run-sync.test.mjs run-case-admission.test.mjs run-resume-order.test.mjs run-posture.test.mjs run-request.test.mjs run-pre-admission.test.mjs git-core-adapters.test.mjs`, `test/seat-binding/client.test.mjs`, `test/setup/seat-binding-dry-bind.test.mjs`, `test/runner/tier-cell.test.mjs`, `test/runner/assignment-enumerator-guard.test.mjs`, `test/runner/driver-rununit.test.mjs`, `test/runner/dispatch-execute-effort.test.mjs`. The launch-bound run tests are lot 1's four files plus `run-provider-failover.test.mjs`: lot 2's lead runs them from lot 1's branch or, if lot 1 has not landed, from `run.test.mjs` on its own branch (same tests, same behaviour); the full-suite run covers both after landing.

**Must NOT touch:** `src/runner/execution/patterns/**`, `src/runner/execution/loops/**` (lot 3); `src/runner/dispatch/**` (lots 1 and 3); every `test/runner/execution/run*.test.mjs` (lot 1 splits `run.test.mjs`; if a `run.mjs` change would force an edit there, tell lot 1's lead and wait); no export of `run.mjs` renamed or removed.

**Validation:** FR on the list above; `wc -l src/runner/execution/bind.mjs` ≤ 520 printed; no function over 300 in the files touched; the lot's lines per file printed against the table.

**Risk:** M × M: the seat decision is owned by the Rust golden table and `bind.mjs` carries the facade around it, so a changed ask shape would show as a golden-vs-facade divergence; mitigation: `seat-binding-dry-bind` and the client test are in the focused list, plus one real `fgos run` direct-seat smoke on fg-server2 after landing. Comment cuts can delete the only explanation of an invariant: keep one line per still-true invariant, state it in the report's list of removed comment groups.

**Rollback:** revert the merge commit; no on-disk change.

## Lot 3 — pattern catalog, dispatch plan, settlement

**Functions to cut:** `resolveCollaboration` 515 → ≤ 280 (`catalog.mjs:67`; blocks: selector resolution and conflict check `:~90-140`, parameter layering, seats and launch bounds, pin), `checkCatalog` 374 → ≤ 280 (`catalog-entries.mjs:379`; retired keys, reserved names, per-entry checks, domain checks via `checkParamDomain` `:268` and `checkLoopSeatCardinality` `:185`), `compileDispatchPlan` 421 → ≤ 280 (`plan.mjs:285`; selector derivation, executor/purpose resolution, the unregistered-name refusal, mechanism result), `settleRunOutcome` 338 → ≤ 280 (`settlement.mjs:566`; supervised-receipt reading, lost-work observation, scope coverage, merge-conflict evidence, correlated snapshot). Same technique as P09/P10; helpers stay in the same file or in the existing owner module.

**Budget contribution:** `src/runner/execution` -250 (aim): `catalog.mjs` 581 → ≤ 470 (-110; the object-shaping repeated for `unit.pattern`/`callerObject` selectors is the first duplicate to remove), `catalog-entries.mjs` 752 → ≤ 650 (-100), `loops/reviewed.mjs` 421 → ≤ 380 (-40; `runReviewed` is 247, kept). With lot 2's -375 the execution total is about 6 965 (≤ 7 000). Lot 2 and 3 together are the budget: if lot 2 lands short, lot 3 does not cover it silently; the big lead re-measures after each land and the shortfall goes back to the lead that owns the file. Dispatch outside `confinement/` has no cut target (16 937 vs ≤ 19 000); `plan.mjs` 705 and `settlement.mjs` 903 must not grow in net.

**Files (owned by lot 3):** `src/runner/execution/patterns/{catalog,catalog-entries,retired-keys}.mjs`, `src/runner/execution/loops/*.mjs`, `src/runner/dispatch/plan.mjs`, `src/runner/dispatch/settlement.mjs`. Tests (edit only for moved internal names): `test/runner/execution/patterns/catalog.test.mjs`, `test/runner/dispatch-plan-policy.test.mjs`, `test/runner/dispatch.test.mjs`, `test/runner/assignment-dispatch.test.mjs`, `test/runner/assignment-runresult.test.mjs`, `test/runner/loop.test.mjs`.

**Tests that must stay green (focused):** the six above plus `test/workflow/core-workflow-seats.test.mjs`, `test/workflow/seats.test.mjs`, `test/setup/seat-binding-dry-bind.test.mjs`, `test/runner/operation-choice.test.mjs`, `test/runner/merge-quoted-paths.test.mjs`, `test/runner/dispatch-governance-provider-denylist.test.mjs`, `test/runner/dispatch-reconciliation-import-graph.test.mjs`, `test/runner/dead-vocabulary-guard.test.mjs`, `test/state/work-size-rigor.test.mjs`, `test/setup/capability-catalog-doctrine.test.mjs`, `test/runner/execution/account-rotation.test.mjs`, `test/runner/execution/run-posture.test.mjs`, `test/runner/execution/run-case-admission.test.mjs` (patterns reach through `unit-run-start.mjs`, `dry-bind.mjs`, workflow callers `src/workflow/{propose-frame,case-start,runner}.mjs`).

**Must NOT touch:** `bind.mjs`, `run.mjs`, `unit-run-start.mjs` and the other execution files of lot 2 (even to adapt to a changed import: keep `resolveCollaboration` and `checkCatalog` signatures, return shapes and `CollaborationError` codes unchanged so no caller moves); `confinement/**` (lot 1); `src/workflow/**` callers; `run-result.mjs`, `assignment-runner.mjs`, `assignment.mjs`; every `run*.test.mjs`.

**Validation:** FR on the list above; function-length scan shows the four functions ≤ 300; `compileDispatchPlan` is the `decide` path every dispatch goes through, so one `fgos dispatch decide` check per selector kind (executor id, `--for`, `--work`) is compared before and after on the same tree (`reasonCodes`, `mechanism`, `selector`) and printed in the report.

**Risk:** M × H on `compileDispatchPlan` and `settleRunOutcome` (a PreToolUse hook consults `decide` on every Agent call; settlement judges every run): a swapped branch order changes the answer silently. Mitigation: extraction only, same branch order; the before/after `decide` table; `assignment-runresult` and `assignment-dispatch` stay in the focused set; read `reasonCodes` text equality. Pattern catalog (M × M): a misordered check changes which problem is reported first; `catalog.test.mjs` pins the problems list, and the lead keeps problem order as is.

**Rollback:** revert the merge commit; no on-disk change.

## Dependencies and landing

| Lot | Needs from another lot | Parallel with |
|---|---|---|
| 1 | nothing | 2, 3 |
| 2 | none for code; its launch-bound run tests read the split files if lot 1 landed first | 1, 3 |
| 3 | nothing | 1, 2 |

File ownership is disjoint by construction (lists above); the only shared, rebase-only files are `packages/git/contracts/mutation-census.v1.json`, `docs/architecture-manifest.json` rows, `test/suite-baseline.json`. Each lead works in its own linked worktree from `origin/main` on `harden/t5-p14-<lot>` with its own ext4 `CARGO_TARGET_DIR` under `/home/vantt/projects/forgent-worktrees/` (never `/tmp`). Lots land one at a time, in the order they finish, each by rebasing on `origin/main` and running the land gate in `plan.md`; after each land the big lead re-measures the three budgets and the function scan and writes the numbers on the board line. Docs: when all three have landed, the big lead updates the counts that P13 wrote (runner spec "Execution Core and Dispatch: target shape", seat-binding spec §15 `bind.mjs`, `component-boundary.md` rows, closing report section 2 note) and closes the layer; the lots do not edit docs.

## Validation (phase)

- Per lot: the focused FR set above before every commit (the FR one-liner in `plan.md`, `FGOS_HOST_BIN` on a host built from the worktree; never `npm test` or `scripts/run-tests.mjs <file>` for a focused run, never during a full run in the same worktree).
- Once per lot, at the end: the full land gate from `plan.md` (cargo checks only if a crate was touched: none expected; `git-one-door-scan` 0 undeclared; full `npm test` through `node scripts/run-tests.mjs` with `HERDR_*` and `CLAUDE*` unset, ERROR lines and fail count both read; doc-health tests only if a doc or a `src/` deletion changed).
- Measured, printed in each lead report: `wc -l` of the budget areas touched, the function scan (nothing over 300), test counts and time for the lot-1 split.
- After the third land (big lead): `src/runner/execution` ≤ 7 000, `confinement/` ≤ 5 950, `bind.mjs` ≤ 520, zero functions over 300 in `src/runner/execution` and `src/runner/dispatch`, `run.mjs` ≤ 1 150, `assignment-runner.mjs` ≤ 1 500, `config.mjs` ≤ 1 300, `run-result.mjs` ≤ 1 150 all still met, full suite green.

## Risks (phase)

| Risk | L × I | Mitigation |
|---|---|---|
| A lot misses its line contribution and the area budget stays short | M × M | Targets carry a margin (aim 6 970 against 7 000, 5 930 against 5 950); big lead re-measures after each land; a shortfall goes to the owning lead, not to another lot's files |
| Behaviour change hides in an extraction (security authority, `decide`, settlement) | M × H | Extraction only, branch order kept, focused sets above, before/after `decide` table, security review on lot 1, one real `fgos run` direct-seat and confined-seat smoke on fg-server2 after each land |
| `fgos` hot-file collisions with lanes that still touch `authority.mjs`, `plan.mjs`, `settlement.mjs` | M × M | Read the board "Các luồng" and "File chung dễ va" rows and grep `log.md` by lane id before starting; announce the window |
| Dated comments removed that explain a live invariant | L × M | One-line replacement per live invariant; removed groups listed in the report |
| Test split leaves a test unrun | L × H | Counts per file sum to 78; `run-tests` lists all four files; `suite-baseline.json` reported |

## Rollback (phase)

Each lot reverts alone (merge commit revert on `main`), re-activate the previous release on fg-server2 if it was rebuilt, record the revert on the board. No on-disk format, contract or config changes in any lot, so no migration back.

## Done when

Three lots landed; budgets and function scan printed by the big lead and inside the table; `run.test.mjs` replaced by four files with 78 tests in total and none lost; full suite green on each land; docs counts updated by the big lead; layer close can proceed (P04 half B still separate).

## Open questions

1. S-4 (lighter staged test addon or a cross-process digest memo, about 0.26 s of each 1.1 s launch in tests): H-T5a names it next to the split, decision 69 names only the split. Left out; say if it should join lot 1 (it touches `scripts/lib/git-addon-stage.mjs` and possibly `src/native/door.mjs`, so it is a test-staging change with its own risk).
2. `test/suite-baseline.json` belonged to TEST (closed). Default: the big lead edits the one line in the land commit.

## Lead brief essentials

Include the lead rules from `plan.md` verbatim (FR only, `git diff --cached --stat` before commit, stage explicit paths, no heavy run without telling the big lead, report named via `fgos convention name --slug <slug> --json`, end with `Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT`), plus this lot's file list, "must NOT touch" list, target table, and the line "refactor only, no assertion weakened, no export changed".
