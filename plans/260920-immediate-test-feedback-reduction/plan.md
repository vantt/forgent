# Immediate Test Feedback Reduction — Implementation Plan

**Track:** `immediate-test-feedback-reduction`  
**Date:** 2026-09-20  
**Mode:** high-risk  
**Status:** proposed; requires reality validation before implementation

## 1. Objective

Produce an immediate, measured reduction in developer/agent waiting time while preserving the current authoritative proof:

- lower focused and full-suite execution cost by eliminating fixture-only, accidental external-process, and oversized live-state work;
- inventory execution, surface and semantic duplication without deleting tests on weak evidence;
- return relevant failures earlier through canary-first execution;
- provide a conservative related-test command for safe inner-loop use after shadow evidence;
- install warning-only proof/admission guards so removed cost does not silently grow back;
- keep `node:test` and add only narrow fgOS-specific harness utilities where they directly support fixtures, selection, evidence or parity.

The plan is deliberately incremental. It does not attempt the complete proof-registry, mutation-backed deduplication, cross-commit cache, global CLI-core, persistent-worker, or distributed-test architecture described in `plans/reports/test-suite-cost-brainstorm-260920.md`.

## 2. Success definition

The track succeeds only if all of the following hold:

1. `npm test` still runs every discovered `test/**/*.test.mjs` exactly once and remains green on the integrated track.
2. A fresh current-tree baseline and profile exist with valid immutable-snapshot evidence.
3. Every accepted execution-cost optimization has retained before/after samples using identical commands and a clear invariant-preservation argument.
4. Canary-first always proceeds to full suite after green canaries, and stops early only on a real canary failure.
5. Related selection explains every changed path, never accepts an empty selection, and falls back to full on every unknown/unsafe case.
6. Shadow evaluation has zero unresolved patch-related misses before `test:related` is documented as usable for inner-loop feedback.
7. No optimization claim sums timings captured on different snapshots or under incomparable load.
8. Anti-regression guards exist for each removed cost pattern.
9. A machine-readable proof inventory distinguishes expensive repeated execution from genuinely duplicated semantics; this track deletes no test solely from counts, names, coverage or matching assertions.
10. No new general-purpose test framework is introduced; any future Vitest/Jest proposal is left as a separately measured pilot.

## 3. Authority and read order

A fresh implementer reads:

1. `docs/specs/reading-map.md`
2. `docs/specs/runner.md`
3. `plans/260920-immediate-test-feedback-reduction/CONTEXT.md`
4. this plan
5. the phase brief being executed
6. inherited evidence listed in `CONTEXT.md`

`ITR-D01` through `ITR-D12` are locked inputs to this plan and are not reopened during implementation.

## 4. Current evidence and planning assumptions

### 4.1 Evidence

- Historical trustworthy baseline: full-suite wall median 342.70s, with substantial ambient-load variation.
- Current suite inventory observed during planning: roughly 359 test files and around 7,791 syntactic `test()`/`it()` sites.
- P02 profile orientation: CLI contributed about 51.6% of summed testcase time.
- CLI audit: 633 fixture-construction and 496 business-behavior static `run()` sites out of 1,722.
- Fast fixture pilot: focused sequential 94.36s → 67.57s; 136 `fgos init` sites → 3.
- Docs-index fixture pilot: 195.46s → 5.27s for the file.
- External-Claude pilot: 50.68s → 9.84s across its focused set.
- Fine-grained file splitting already produced a negative result and is excluded.

### 4.2 Assumptions to validate before mutation

| Assumption | Risk | Required proof |
|---|---|---|
| A1: the nine-file fast-fixture batch still contains fixture-only init sites on current tree | Medium | Re-run the responsibility audit on current SHA and classify every replacement candidate. |
| A2: current profile still has removable large-state/provider/process outliers | Medium | Fresh green JUnit profile plus source trace of each candidate. No candidate means the phase records `stop`, not invented work. |
| A3: a small set of leaf source areas can be safely owned by explicit manifest rules | High | For each pilot area, enumerate production files, direct tests, mandatory boundaries, dynamic dependencies, and historical regressions; unresolved paths force exclusion/fallback. |
| A4: canaries provide useful early failures without adding material green-path overhead | Low | Measure wrapper overhead and replay representative failing patches or controlled test failures. |
| A5: main checkout's unrelated changes can be isolated | High | Create clean linked worktree from recorded HEAD; clean before/after checks for every sample. |

## 5. Delivery strategy and dependency graph

```text
P00 current-tree baseline/profile
 └─> P00A proof/duplication inventory (read-only, no deletion)
      ├─> P01 hotspot/leak audit and bounded removals
      ├─> P02 fast-fixture expansion
      └─> P03 canary-first runner
               └─> P04 selector foundation + manifest
                       └─> P05 selector shadow evaluation
                               └─> P06 promotion decision and final proof

P01 and P02 may be implemented independently after P00A, but benchmark runs remain
serialized. P03 can be built after P00. P04 consumes P03's shared execution seam
and P00A's ownership/responsibility vocabulary. P05 requires P01/P02 integrated
so shadow timings represent the candidate tree.
```

Why this order:

- P00 prevents optimizing stale hotspots.
- P00A prevents confusing repeated work with safely deletable tests and supplies the anti-growth vocabulary.
- P01/P02 reduce real work first.
- P03 creates a reusable “subset then full” execution seam without weakening proof.
- P04 adds selection policy only after the execution seam is trustworthy.
- P05 evaluates misses against the integrated full suite.
- P06 makes no automatic promotion; it records an evidence-backed disposition.

## 6. Phase index

| Phase | Capability | Purpose | Mutation? | Exit artifact |
|---|---|---|---:|---|
| P00 | `code:test` | Fresh immutable baseline and profile | tooling only if required | `reports/current-baseline.md` + raw artifacts |
| P00A | `code:review` | Build proof/duplication inventory and warning-only admission rules | reports + focused lint/tests | `reports/proof-inventory.md` + JSON inventory |
| P01 | `code:debug` / `code:implement` | Find and remove current large-state/external-process leaks | bounded test harness/tests | `reports/hotspot-removal.md` |
| P02 | `code:refactor` | Expand fast fixtures to audited CLI batch | test helper/test files | `reports/fast-fixture-expansion.md` |
| P03 | `code:implement` | Add canary-first local runner | scripts/tests/package docs | `reports/canary-first.md` |
| P04 | `code:implement` | Add conservative related selector and ownership manifest | scripts/tests/package docs | `reports/selector-foundation.md` |
| P05 | `code:test` | Shadow-evaluate related selection | evidence/tests; fixes if selector defect | `reports/selector-shadow.md` |
| P06 | `code:review` | Integrate, rank outcomes, promote/revise/stop | docs/status only | `reports/final-evaluation.md` |

## 7. P00 — Current-tree baseline and profile

### Purpose

Replace stale orientation with a trustworthy measurement on the exact implementation base, satisfying ITR-D02, ITR-D11 and ITR-D12.

### Workspace preparation

1. Record main `HEAD`, branch, Node version, OS, CPU count and load.
2. Create a clean isolated worktree and track branch from that SHA.
3. Run `npm ci`.
4. Run `cargo build --release --workspace` because current tests expect release binaries.
5. Confirm no competing full-suite/benchmark process is running.
6. Confirm `git status --porcelain` is clean except explicitly permitted build-artifact symlinks recognized by the timing tool.

### Measurement protocol

Run three full-suite samples sequentially:

```sh
node scripts/test-timing.mjs sample --log-dir <reports-artifacts>/sample-1
node scripts/test-timing.mjs sample --log-dir <reports-artifacts>/sample-2
node scripts/test-timing.mjs sample --log-dir <reports-artifacts>/sample-3
```

Run one separate profile:

```sh
node scripts/test-timing.mjs profile --log-dir <reports-artifacts>/profile
```

If the current timing script cannot place the JUnit destination correctly through `run-tests.mjs`, fix that tooling defect in this phase with focused tests before collecting samples. Never hand-edit a failed sample into validity.

### Required report

Record:

- immutable SHA and clean-state proof before/after each run;
- exact command, exit status, test/pass/fail/skip totals;
- wall, user/system CPU, RSS and load;
- median/min/max;
- top 30 tests and files;
- directory totals;
- comparison to P02 labeled as cross-snapshot orientation, not direct attribution;
- candidate annotations: external process/provider, large-state fold, fixture construction, Rust/package boundary, real Git, concurrency/timing, unknown.

### Acceptance

- Three valid green samples and one separate valid green profile.
- No overlapping benchmark.
- No dirty or failed run included.
- Top candidates are based on current data.

### Rollback

Delete invalid artifacts; retain only tooling fixes that have focused tests and are necessary for valid measurement.

## 8. P00A — Proof and duplication inventory, without deletion

### Purpose

Answer “are there too many or duplicated tests?” with evidence, while giving P01–P05 a shared responsibility vocabulary and an anti-growth ratchet. This phase does **not** delete, skip, quarantine or rewrite existing tests.

### Required taxonomy

Every inventoried expensive test/call site receives exactly one primary execution responsibility:

- `direct-business-proof`;
- `fixture-construction`;
- `process-contract`;
- `git-process-integration`;
- `cross-language-packaging`;
- `large-state-artifact-boundary`;
- `concurrency-timing`;
- `unknown`.

Separately classify duplication:

1. **Execution duplication:** the same setup/process/state construction repeats; optimize setup while retaining assertions.
2. **Surface duplication:** the same invariant is exercised direct + CLI + runner/e2e; candidate for direct matrix plus bounded parity witnesses.
3. **Semantic duplication:** same invariant, production guard, boundary, failure mode and historical fault coverage; only this class may become a future deletion candidate, and not in this track.

### Inventory scope

At minimum include:

- top 50 current-profile tests and top 30 files;
- all static CLI `run()` sites in P02's nine files;
- all candidate P01 sites;
- test runner/canary/selector tests introduced later;
- existing direct tests that overlap the stage/edit/read CLI business cluster, as orientation for a future use-case extraction track.

Machine-readable fields:

```json
{
  "testId": "file::test-name-or-static-site",
  "file": "test/...",
  "durationSeconds": null,
  "primaryResponsibility": "fixture-construction",
  "invariantId": null,
  "productionGuard": null,
  "boundary": "cli-process",
  "historicalFaultRefs": [],
  "subprocesses": ["fgos init"],
  "fixture": "tmpCwd",
  "overlapCandidates": [],
  "evidenceLevel": "measured|static|unknown",
  "disposition": "retain|optimize-execution|future-semantic-review"
}
```

Null invariant/guard is allowed and visible; it must not be guessed. `unknown` cannot count as savings or deletion opportunity.

### Warning-only admission foundation

Add a narrowly scoped linter/check for onboarded files only. It warns or fails only on **new** violations relative to a committed baseline:

- new direct fixture-only `fgos init` without an explicit boundary reason marker;
- new real provider/network command in test env without an explicit provider-boundary marker;
- new CLI subprocess test in an onboarded area with neither process/Git responsibility nor invariant reference.

Initial behavior is warning-only or baseline-ratcheted; it must not require annotating all ~7,800 tests. Existing debt is recorded, not mass-edited.

### Framework decision

Record that `node:test` remains the execution framework. Any helper added here must be a small project-local metadata/inventory utility, not a replacement runner or assertion DSL. A future framework pilot requires evidence that framework overhead—not subprocess/fixture work—is material and must compare at least runtime, CPU, RSS, ESM compatibility, isolation and maintenance.

### Verification

```sh
node <proof-inventory-script> --check
node --test <proof-inventory focused tests>
git diff --check
```

The exact script path is chosen during validation, preferably under `scripts/` with pure inventory logic tested under `test/scripts/`.

### Acceptance

- Inventory totals reconcile with scanned scope.
- Every entry has one primary responsibility or explicit `unknown`.
- No test is deleted or disabled.
- Warning-only/baseline rule catches synthetic new fixture/provider misuse but does not flag preserved real boundaries.
- P01/P02 can consume inventory IDs instead of reclassifying the same sites independently.

### Rollback

Remove the warning check if its classification cannot be made deterministic. Retain the report/JSON inventory as evidence, clearly marked snapshot-specific.

## 9. P01 — Current hotspot and leak removal

### Purpose

Use the fresh profile to find small, high-confidence instances of work unrelated to the invariant under test.

### Candidate classes

#### A. Accidental external provider/network/process

Search and trace tests invoking:

- `claude`, `codex`, `agy`, `gh`, package managers, curl/wget or network-capable setup paths;
- setup/doctor registries that can reach provider checks;
- commands inheriting real HOME/PATH/provider config unintentionally.

A candidate is editable only if:

1. the test is not explicitly proving that external boundary;
2. an existing fake/nonexistent-command seam exists, or a narrow test-only seam can be justified;
3. all other environment inputs remain intact;
4. the intended product path still executes and is asserted.

#### B. Oversized live-state or repository-history fixture

Trace tests that fold/scan the full real event store or large mutable history when the invariant needs a small persisted shape. A replacement must:

- use the real writer/store/replay format, not a fabricated object;
- preserve the real filesystem/docs/artifact boundary if that is the assertion;
- make formerly conditional proof unconditional where possible;
- use a fresh fixture per test/file;
- include an equivalence or boundary check.

#### C. Obvious fixture-only subprocess outside P02 batch

A candidate may move to a direct builder only if no process/init/output/cwd/Git boundary is asserted. Avoid overlapping P02 file ownership.

### Selection rule

Take at most the top three independent candidates whose focused pre-mutation total is material. Register a threshold before editing:

```text
minimum accepted effect = max(10% of focused median, 2 × focused run-to-run range)
```

Run at least three before and three after focused samples for noisy candidates. A candidate below threshold is reverted and reported `stop`.

### Anti-growth guard

For every accepted candidate, add the narrowest deterministic guard:

- unsafe environment-shape scan/test;
- fixture helper contract test;
- no-real-provider sentinel;
- no-full-live-store assertion when mechanically observable.

Do not add a broad brittle grep if the path can be represented as a helper API contract.

### Verification

For each candidate:

```sh
node --test <focused-files>
```

After all accepted candidates integrate:

```sh
npm test
git diff --check
```

### Acceptance

- Every changed site has a traced cost source and invariant-preservation statement.
- Before/after evidence exceeds the preregistered threshold.
- Focused and full suites green.
- Guard prevents the same cost shape from returning.

### Rollback

Revert candidate-by-candidate. A rejected candidate leaves only its evidence report, not speculative helper code.

## 10. P02 — Fast-fixture expansion

### Purpose

Apply the proven P06 strategy to the next audited cluster while preserving real CLI/Git boundaries.

### Initial file lease

- `test/cli/fgos-claim.test.mjs`
- `test/cli/fgos-claim-2.test.mjs`
- `test/cli/fgos-read-5.test.mjs`
- `test/cli/fgos-return-2.test.mjs`
- `test/cli/fgos-iron-law-gate.test.mjs`
- `test/cli/fgos-move.test.mjs`
- `test/cli/fgos-approve-5.test.mjs`
- `test/cli/fgos-return-3.test.mjs`
- `test/cli/fgos-return-4.test.mjs`
- `test/cli/helpers/fgos-cli-harness.mjs` only if an additional helper is proven necessary.

### Pre-edit reality audit

For every `fgos init`/fixture helper call in the nine files, classify exactly one:

- `fixture-only` — eligible;
- `init/process-contract` — retain;
- `cwd/subdir` — retain unless a separate direct precondition is proven and cwd behavior is not asserted;
- `git/process-integration` — retain;
- `unknown` — retain.

Commit a machine-readable inventory under this plan's reports. Static counts are orientation, not runtime counts.

### Allowed substitutions

Use existing committed helpers by explicit opt-in:

- `tmpCwdFast`
- `initGitCwdFast`
- `initGitCwdMainFast`
- `initHeadlessGitCwdFast`

A new fast subdirectory helper is allowed only if:

1. no selected test proves subdirectory init/cwd resolution;
2. it has focused equivalence tests;
3. it does not mutate the global `tmpCwd()` behavior.

### Preserved doors

Never replace real process coverage for:

- raw `fgos init` behavior;
- pre-init refusal;
- init/setup idempotence, coexistence output and startup messages;
- cwd/`--dir`/subdirectory resolution;
- `take`, `pick`, `return`, `approve`, `merge next`, `sync-root`;
- GitHub transport;
- conflict/rollback/lock/durable-write paths.

### Baseline and measurement

After P00 dependencies are prepared, run the named files three times before mutation and three times after with identical command and low-load conditions:

```sh
/usr/bin/time -f 'TIME real=%e user=%U sys=%S maxrss=%M' \
  node --test \
  test/cli/fgos-claim.test.mjs \
  test/cli/fgos-claim-2.test.mjs \
  test/cli/fgos-read-5.test.mjs \
  test/cli/fgos-return-2.test.mjs \
  test/cli/fgos-iron-law-gate.test.mjs \
  test/cli/fgos-move.test.mjs \
  test/cli/fgos-approve-5.test.mjs \
  test/cli/fgos-return-3.test.mjs \
  test/cli/fgos-return-4.test.mjs
```

Also record eligible/replaced/retained init-site counts.

### Acceptance

- Every replacement is classified `fixture-only`.
- Named focused suite remains green and test count does not drop.
- Median focused wall or process-tree CPU improves beyond noise; target is at least 10%, but evidence controls disposition.
- Full suite green.
- No global helper default changed.

### Anti-growth guard

Add a focused test or lint that detects new direct fixture-only `fgos init` usage in onboarded files, while allowing an explicit marker/reason for preserved boundary sites. Do not impose the rule repo-wide until other files are audited.

### Rollback

Revert substitutions per file if equivalence or timing fails. Keep existing P06 helpers unchanged.

## 11. P03 — Canary-first local runner

### Purpose

Reduce time-to-first-useful-failure without changing the green-path proof.

### Public command

Add:

```json
{
  "scripts": {
    "test:canary": "node scripts/run-test-canary.mjs"
  }
}
```

Expected behavior:

```text
resolve explicit canary files
→ reject empty/invalid/out-of-root paths
→ run canaries
→ if red: return their non-zero status, do not run full suite
→ if green: invoke the unchanged full-suite runTests door
→ report both phases and elapsed time
```

Initial input modes:

- explicit file arguments, e.g. `npm run test:canary -- test/state/store.test.mjs`;
- a machine-readable canary file generated by P04;
- no arguments is a validation error, not an implicit full run.

### Implementation constraints

- Reuse exported execution functions from `scripts/run-tests.mjs`; do not duplicate discovery/env/portable argv logic.
- Refactor `run-tests.mjs` only as needed to expose `runSelectedTests(files, options)` while preserving `runTests()` full semantics.
- Normalize, deduplicate and contain paths under the repository test root.
- Do not accept globs through shell interpolation.
- Set the same test env as full suite.
- Print a structured summary with canary count/result and whether full suite ran.

### Tests

Prove:

1. empty canary set refuses;
2. missing/outside/symlink-escape path refuses;
3. duplicates collapse deterministically;
4. failing canary prevents full invocation and preserves status;
5. green canary invokes full suite exactly once;
6. forwarded reporter/test arguments cannot replace selected files;
7. Windows-safe argv/env behavior remains;
8. default `npm test` behavior is byte-for-byte/semantically unchanged.

### Performance acceptance

- Wrapper overhead excluding tests <250ms median over 10 dry/injected-spawn runs.
- Demonstrate one controlled failing canary returns before a full-suite run would complete.
- Green path runs the full suite once, not twice; canary files are intentionally rerun in full suite and this small duplication must be reported.

### Verification

```sh
node --test test/scripts/run-tests.test.mjs test/scripts/run-test-canary.test.mjs
npm run test:canary -- test/state/store.test.mjs
npm test
```

### Rollback

Remove only the new command/script/tests; keep any neutral `run-tests.mjs` extraction only if its original tests prove unchanged semantics.

## 12. P04 — Minimal conservative related selector

### Purpose

Create a small, auditable inner-loop selection policy without claiming whole-repo dependency inference.

### Initial pilot areas

Reality validation may remove an area but may not add a broad one without a new decision. Candidate leaf areas:

1. `src/intake/**`
2. `src/report/**`
3. selected leaf modules under `src/state/**` that do not include shared event/store/replay/schema core
4. selected existing `src/verbs/merge/**` use-case modules only where mandatory boundary tests are explicitly mapped

Explicit full triggers from day one:

- `bin/**`, especially `bin/fgos.mjs`;
- `scripts/run-tests.mjs`, canary/selector scripts, ownership manifest;
- shared CLI/setup test harnesses;
- `package.json`, lockfiles, `.github/**`, hooks;
- `src/state/{events,store,replay,envelope,...}` and other validated shared core;
- config/default/schema/template/registry/projection sources;
- `core/**`, `domains/**`, `.agents/**`, `plugins/**` when generated/projection relationships are not completely mapped;
- Rust host/packages and cross-language route descriptors;
- unknown docs-as-data paths;
- unsafe rename/delete/base resolution.

### Files to add/edit

Expected shape:

- add `scripts/test-select.mjs`;
- add `test/test-ownership.mjs` or a data-only manifest module;
- add `test/scripts/test-select.test.mjs`;
- edit `scripts/run-tests.mjs` only to reuse selected execution;
- edit `package.json` with `test:related` and `test:related:shadow`;
- add short user guidance and reading-map pointer;
- update `CHANGELOG.md` under Unreleased.

### Selector algorithm

1. Resolve repository root and trunk using existing repo conventions.
2. Resolve merge-base unless explicit `--base` is provided.
3. Collect name-status changes from merge-base to HEAD plus staged, unstaged and untracked paths.
4. Preserve old and new rename paths; preserve deleted old paths.
5. Normalize repository-relative paths; reject traversal/symlink escape.
6. Validate the ownership manifest before matching.
7. Match every changed path against exactly explainable rules.
8. Add `directTests` and `boundaryTests`.
9. Optionally add static graph/import discovered tests; never remove manifest tests.
10. If any path is unknown, ambiguous, unsafe or full-triggering, choose full discovered set.
11. Refuse zero selected tests.
12. Execute through the shared selected-test runner.

### Required `--explain` output

Machine-readable JSON plus concise human output:

- base/trunk/merge-base SHA;
- changed paths with source (committed/staged/unstaged/untracked/rename/delete);
- matched rule IDs;
- direct and boundary tests with reasons;
- added graph/import tests with provenance;
- unmatched/unsafe paths;
- final decision `related|full` and escalation reason;
- selected count / full count.

### Manifest validation

Refuse or fallback full on:

- duplicate IDs;
- patterns matching no source on current tree unless explicitly allowed for deleted-path history;
- missing direct/boundary tests;
- empty test set;
- overlapping rules with incompatible escalation;
- paths outside repo/test root;
- symlink escape;
- unsupported fields;
- stale mandatory boundary test.

### Adversarial test matrix

At minimum:

- committed-only diff;
- staged-only;
- unstaged-only;
- mixed;
- untracked source and untracked test;
- rename and delete;
- missing/invalid base;
- detached HEAD/worktree;
- spaces/backslashes in paths;
- source matches one rule;
- source matches multiple compatible rules;
- unknown source;
- shared-core/full trigger;
- harness/manifest change;
- generated source/target change;
- test deletion;
- traversal and symlink escape;
- zero selected files;
- static graph returning empty/UNKNOWN;
- graph-added test union behavior.

### Public commands

```sh
npm run test:related -- --explain
npm run test:related:shadow -- --explain
```

Semantics:

- `test:related`: available only after P05 promotion; before that it prints experimental status or is omitted.
- `test:related:shadow`: related/canary first, then unchanged full suite, recording comparison.

### Acceptance for implementation phase

- Selector unit/adversarial tests green.
- Unknown and unsafe cases demonstrably select full suite.
- `npm test` unchanged.
- No claim of adoption before P05.

## 13. P05 — Shadow evaluation

### Purpose

Establish whether the selector is safe and worthwhile on real changes.

### Sample

Use at least:

- 30 historical patches/commits across pilot areas;
- 10 full-trigger/unknown changes;
- 10 synthetic adversarial working-tree cases;
- every current implementation commit from P01–P04 where applicable.

The sample must include:

- bug fixes with known regression tests;
- source + test changes;
- source-only changes;
- rename/delete;
- docs/config/generated changes;
- at least one failing patch or fault-injected case per pilot area.

### Evaluation procedure

For each case:

1. Materialize an isolated clean snapshot/patch.
2. Run selector `--explain` and retain decision.
3. Run selected tests.
4. Run full suite or, for historical red commits where full execution is impractical, run the known full failing set plus justify the limitation. Promotion requires actual full-suite comparisons on all current/synthetic cases.
5. Classify differences:
   - patch-related miss;
   - unrelated pre-existing failure;
   - flake;
   - selector fallback;
   - correct narrow selection.
6. Record selector overhead, selected/full file ratio and time-to-result.

### Promotion thresholds

All must hold:

- **0 unresolved patch-related misses**;
- **100% fallback** on defined unsafe/full-trigger cases;
- median selector overhead <500ms;
- median selected-file ratio ≤25% for narrowing-eligible pilot cases;
- median related feedback at least 4× faster than full suite for narrowing-eligible cases;
- fallback-full rate among intentionally eligible pilot cases ≤40%;
- every selection explainable without manual hidden knowledge.

If safety passes but value thresholds fail: `revise`, not adopt. If any unresolved patch-related miss exists: `stop` or fix and restart the affected evaluation sample from zero.

### Output

`reports/selector-shadow.md` plus machine-readable case records.

## 14. P06 — Integration and final disposition

### Required dispositions

For each unit, return `expand`, `revise`, or `stop`:

- current hotspot removal;
- fast fixture expansion;
- canary-first;
- related selector.

### Final proof

On integrated clean branch:

```sh
npm ci
cargo build --release --workspace
node --test test/scripts/run-tests.test.mjs test/scripts/run-test-canary.test.mjs test/scripts/test-select.test.mjs
npm test
git diff --check
```

Also run the current-tree profile once after integration. Do not compare a single final run as a precise aggregate saving against P00 unless load is comparable; report directional and focused attributable results separately.

### Promotion rules

- `test:canary` may ship if its focused/full semantics are proven.
- `test:related` may ship as an explicitly documented inner-loop command only if P05 thresholds pass.
- `npm test`, Work verification, post-merge and CI remain full-suite.
- No cross-commit cache or proof reuse is authorized by this track.

### Changelog and documentation

Because new commands are user-visible:

- add `CHANGELOG.md` Unreleased entries;
- add concise how-to for canary/related commands and their non-DoD status;
- add reading-map entry;
- preview long Markdown artifacts through MDView.

## 15. Cross-phase risk map

| Risk | Severity | Mitigation/proof |
|---|---|---|
| Benchmark attribution corrupted by dirty/concurrent checkout | High | Clean isolated worktree, sequential runs, before/after clean checks, load record. |
| Fast fixture bypasses init/cwd/Git contract | High | Per-site responsibility inventory, explicit opt-in, preserved-door list, focused tests. |
| Test count/name/coverage is mistaken for safe deletion evidence | High | P00A taxonomy; no deletion in this track; future semantic deletion requires invariant/guard/boundary/fault evidence. |
| A new test framework adds migration/config cost without removing subprocess work | High | Keep `node:test`; permit only narrow harness utilities; require a separate measured framework pilot later. |
| Selector misses dynamic dependency | Critical | Manifest-first union, mandatory boundaries, graph adds only, unknown→full, shadow miss analysis. |
| Canary command becomes mistaken for DoD | High | Green always continues to full; documentation and structured output state non-authoritative role. |
| Full suite semantics drift during runner refactor | Critical | Existing runner tests, repository inventory equality, `npm test` remains same entry. |
| New manifest becomes another stale source of truth | Medium | Validation, narrow pilot, later projection into proof registry; no broad ownership claims. |
| Optimization guard is brittle and blocks legitimate boundary tests | Medium | Scope guards to onboarded files/helpers and allow explicit reason markers. |
| Full suite runtime does not fall despite focused wins | Medium | Report focused and full effects separately; do not reject useful inner-loop improvements solely due parallel makespan. |
| Ambient load/OOM dominates measurements | High | Serialize benchmarks, record load/RSS, discard invalid runs, compare medians/ranges. |
| Current unrelated working-tree work is overwritten | Critical | New track worktree; never mutate current dirty checkout implementation files. |

## 16. Expected file ownership by phase

| Path | P00 | P00A | P01 | P02 | P03 | P04/P05 | P06 |
|---|---:|---:|---:|---:|---:|---:|---:|
| `scripts/test-timing.mjs` | possible | no | no | no | no | no | no |
| proof inventory script/test + report JSON | no | yes | consume | consume | consume | consume | consume |
| `test/report/**`, `test/setup/**` | no | read | bounded | no | no | no | no |
| nine named `test/cli/**` files | no | read | no | yes | no | no | no |
| `test/cli/helpers/fgos-cli-harness.mjs` | no | read | no | possible | no | no | no |
| `scripts/run-tests.mjs` | no | no | no | no | yes | shared | no |
| `scripts/run-test-canary.mjs` | no | no | no | no | yes | possible | no |
| `scripts/test-select.mjs` | no | no | no | no | no | yes | no |
| `test/test-ownership.mjs` | no | no | no | no | no | yes | no |
| `package.json`, `CHANGELOG.md` | no | no | no | no | sequential | sequential | no |
| reports under this plan | yes | yes | yes | yes | yes | yes | yes |

P03 and P04 must be sequential because they share the test execution seam. P00A lands before P01/P02 so responsibility classification is performed once and reused.

## 17. Child specifications

The plan should execute as separately reviewable cells. Planning records these specs but does not create work items.

```json
[
  {
    "title": "Capture current immutable test baseline and profile",
    "domain": "coding",
    "kind": "test",
    "risk": "medium",
    "capability": "code:test",
    "action": "Execute P00 from plans/260920-immediate-test-feedback-reduction/plan.md and retain three green samples plus one profile.",
    "footprint": [
      "scripts/test-timing.mjs",
      "test/scripts/test-timing.test.mjs",
      "plans/260920-immediate-test-feedback-reduction/reports/current-baseline.md",
      "plans/260920-immediate-test-feedback-reduction/reports/artifacts/**"
    ],
    "verify": "node --test test/scripts/test-timing.test.mjs && git diff --check"
  },
  {
    "title": "Inventory proof responsibilities and duplication without deleting tests",
    "domain": "coding",
    "kind": "review",
    "risk": "medium",
    "capability": "code:review",
    "action": "Execute P00A: classify expensive test work, emit a machine-readable proof inventory, and add a warning-only or baseline-ratcheted admission rule for onboarded areas. Keep node:test and delete no tests.",
    "footprint": [
      "scripts/test-proof-inventory.mjs",
      "test/scripts/test-proof-inventory.test.mjs",
      "plans/260920-immediate-test-feedback-reduction/reports/proof-inventory.md",
      "plans/260920-immediate-test-feedback-reduction/reports/proof-inventory.json",
      "plans/260920-immediate-test-feedback-reduction/reports/proof-admission-baseline.json"
    ],
    "verify": "node scripts/test-proof-inventory.mjs --check && node --test test/scripts/test-proof-inventory.test.mjs && git diff --check"
  },
  {
    "title": "Remove current test hotspot leaks with bounded guards",
    "domain": "coding",
    "kind": "bug",
    "risk": "medium",
    "capability": "code:debug",
    "action": "Execute P01 using only candidates proven by P00; retain separate before/after evidence and anti-regression guards.",
    "footprint": [
      "test/report/**",
      "test/setup/**",
      "plans/260920-immediate-test-feedback-reduction/reports/hotspot-removal.md"
    ],
    "verify": "node --test <P01 focused files recorded by the implementation> && npm test && git diff --check"
  },
  {
    "title": "Expand explicit fast fixtures across the audited CLI batch",
    "domain": "coding",
    "kind": "refactor",
    "risk": "medium",
    "capability": "code:refactor",
    "action": "Execute P02 for the nine named CLI files; replace only fixture-only initialization and preserve every listed boundary door.",
    "footprint": [
      "test/cli/fgos-claim.test.mjs",
      "test/cli/fgos-claim-2.test.mjs",
      "test/cli/fgos-read-5.test.mjs",
      "test/cli/fgos-return-2.test.mjs",
      "test/cli/fgos-iron-law-gate.test.mjs",
      "test/cli/fgos-move.test.mjs",
      "test/cli/fgos-approve-5.test.mjs",
      "test/cli/fgos-return-3.test.mjs",
      "test/cli/fgos-return-4.test.mjs",
      "test/cli/helpers/fgos-cli-harness.mjs",
      "plans/260920-immediate-test-feedback-reduction/reports/fast-fixture-expansion.md"
    ],
    "verify": "node --test test/cli/fgos-claim.test.mjs test/cli/fgos-claim-2.test.mjs test/cli/fgos-read-5.test.mjs test/cli/fgos-return-2.test.mjs test/cli/fgos-iron-law-gate.test.mjs test/cli/fgos-move.test.mjs test/cli/fgos-approve-5.test.mjs test/cli/fgos-return-3.test.mjs test/cli/fgos-return-4.test.mjs && npm test && git diff --check"
  },
  {
    "title": "Add a canary-first local test runner without weakening full proof",
    "domain": "coding",
    "kind": "feature",
    "risk": "high",
    "capability": "code:implement",
    "action": "Execute P03: add explicit canary execution that stops on red and invokes the unchanged full suite after green.",
    "footprint": [
      "scripts/run-tests.mjs",
      "scripts/run-test-canary.mjs",
      "test/scripts/run-tests.test.mjs",
      "test/scripts/run-test-canary.test.mjs",
      "package.json",
      "CHANGELOG.md",
      "plans/260920-immediate-test-feedback-reduction/reports/canary-first.md"
    ],
    "verify": "node --test test/scripts/run-tests.test.mjs test/scripts/run-test-canary.test.mjs && npm test && git diff --check"
  },
  {
    "title": "Build the minimal fail-safe related-test selector",
    "domain": "coding",
    "kind": "feature",
    "risk": "high",
    "capability": "code:implement",
    "action": "Execute P04: manifest-first related selection for validated pilot areas, full fallback for every unknown/unsafe path, and explainable output.",
    "footprint": [
      "scripts/test-select.mjs",
      "scripts/run-tests.mjs",
      "scripts/run-test-canary.mjs",
      "test/test-ownership.mjs",
      "test/scripts/test-select.test.mjs",
      "package.json",
      "CHANGELOG.md",
      "docs/how-to/run-related-tests.md",
      "docs/specs/reading-map.md",
      "plans/260920-immediate-test-feedback-reduction/reports/selector-foundation.md"
    ],
    "verify": "node --test test/scripts/run-tests.test.mjs test/scripts/run-test-canary.test.mjs test/scripts/test-select.test.mjs && npm run test:related:shadow -- --explain && npm test && git diff --check"
  },
  {
    "title": "Shadow-evaluate related selection against full-suite truth",
    "domain": "coding",
    "kind": "test",
    "risk": "high",
    "capability": "code:test",
    "action": "Execute P05 on the specified historical/current/synthetic sample and classify every related/full difference.",
    "footprint": [
      "plans/260920-immediate-test-feedback-reduction/reports/selector-shadow.md",
      "plans/260920-immediate-test-feedback-reduction/reports/artifacts/selector-shadow/**",
      "test/scripts/test-select.test.mjs"
    ],
    "verify": "node --test test/scripts/test-select.test.mjs && npm test && git diff --check"
  },
  {
    "title": "Integrate and disposition immediate test-feedback pilots",
    "domain": "coding",
    "kind": "review",
    "risk": "high",
    "capability": "code:review",
    "action": "Execute P06: reconcile evidence, run final proof, and promote/revise/stop each unit without authorizing broader caching or proof replacement.",
    "footprint": [
      "plans/260920-immediate-test-feedback-reduction/plan.md",
      "plans/260920-immediate-test-feedback-reduction/reports/final-evaluation.md",
      "CHANGELOG.md",
      "docs/how-to/run-related-tests.md",
      "docs/specs/reading-map.md"
    ],
    "verify": "npm ci && cargo build --release --workspace && node --test test/scripts/run-tests.test.mjs test/scripts/run-test-canary.test.mjs test/scripts/test-select.test.mjs && npm test && git diff --check"
  }
]
```

## 18. Validation proof points

Before implementation is approved, the validating pass must answer:

1. Do all nine P02 files and helper names still exist, and which candidate init sites remain?
2. Can P00A deterministically inventory test IDs/static sites without requiring a whole-suite metadata migration?
3. Which warning-only admission rules can distinguish fixture-only calls from preserved boundaries without brittle name heuristics?
4. Does current `scripts/run-tests.mjs` expose a reusable seam cleanly, or will P03 require a larger refactor?
5. Can Node 18 support every API proposed for selector path handling and Git process execution?
6. Which exact `src/state/**` modules are leaf-safe for the initial selector, and which are full triggers?
7. Are `src/intake/**` and `src/report/**` dependencies fully mapped to direct/boundary tests?
8. Can historical patches be replayed without contaminating the main checkout?
9. Is the P05 sample feasible within available machine time, and should it be split into resumable batches?
10. Do any proposed public commands conflict with existing command names or package scripts?
11. Does the current dirty main checkout require waiting for unrelated work to land before creating the track base?
12. Are full-suite gates currently duplicated on exact SHA often enough to justify a separate proof-reuse follow-up? This plan only instruments/observes that question.
13. Is any measurable residual cost attributable to `node:test` itself after fixture/process work is isolated? If not, no framework pilot should be opened.

## 19. Explicit non-goals

- Deleting tests in this track.
- Replacing `node:test` or migrating to Vitest/Jest.
- Treating test count, line coverage, matching names/assertions or historical non-failure as deletion proof.
- Changing `npm test` to a partial suite.
- Changing Work verify/post-merge/CI to related selection.
- Input-closure or cross-commit cache.
- Dynamic dependency tracing beyond optional additive investigation.
- Test tier taxonomy.
- Global test metadata migration.
- Global `tmpCwd()` replacement.
- Global `runCli(argv, ctx)`.
- Persistent worker pool or distributed execution.
- Broad merge/return/approve consolidation.
- Timing failure thresholds for CI.

## 20. Rollback strategy

Rollback is phase-local:

- P01: revert each candidate independently.
- P02: restore only opt-in helper substitutions.
- P03: remove the canary command and wrapper.
- P04: remove selector command/manifest; full runner remains authoritative.
- P05/P06: reports are evidence-only.

At no point should rollback require changing product runtime behavior. If shared runner extraction is reverted, restore `scripts/run-tests.mjs` from its pre-track behavior and prove repository inventory equality.

## Outstanding questions

None

## Known deferred bug (found during P05, not fixed by this track)

`~/.fgos/config.json`'s setup config-merge is additive-only and never prunes
stale keys: it keeps old-schema tier-policy keys (e.g.
`lightweight`/`creative`/`analytical`/`critical` under
`runner.modelPolicies.*`) that a newer schema no longer defines, instead of
removing them. Confirmed real during the P05 selector-shadow-evaluation phase
(2026-09-20/21): historical-commit checkouts additively merged stale tier
keys into this real, machine-level config file outside any repo, poisoning
every subsequent fresh test fixture's default config on that machine and
causing 200+ unrelated test failures until fixed by hand (backup + surgical
key removal). Full incident writeup:
`plans/260920-immediate-test-feedback-reduction/reports/selector-shadow-evaluation.md`.

Fix belongs in the setup/config-merge subsystem (`src/setup/checks.mjs` or
wherever config-merge is implemented): prune keys no longer present in the
current schema's defaults instead of only adding missing ones, or validate/
reject unknown keys on read. Out of this track's scope; left here as a
pointer rather than filed as a separate work item, per the user's explicit
instruction (2026-09-21).
