# P00A — Proof And Duplication Inventory

**Status:** accepted. No test deleted, disabled, skipped, or rewritten. `node:test` remains the execution framework.

## Tooling

`scripts/test-proof-inventory.mjs` (25 focused tests, all green: `test/scripts/test-proof-inventory.test.mjs`). Two independent, mechanical inventory sources feed the shared 8-category schema (`direct-business-proof`, `fixture-construction`, `process-contract`, `git-process-integration`, `cross-language-packaging`, `large-state-artifact-boundary`, `concurrency-timing`, `unknown`):

1. **Static `run(cwd, ['init'])` call-site scan** over an explicit file list, classified by call shape (result discarded vs consumed; cwd built via a subdir-named constructor or not).
2. **Profile-driven top-N classification** (top 50 tests, top 30 files, from P00's retained `profile/junit.xml`), classified only by directory convention (`test/rust-host/**` → `cross-language-packaging`) or an unambiguous name keyword (`concurrent`/`racing`/`race`/`idle timeout`/`lock contention` → `concurrency-timing`). Everything else is left `unknown` — not guessed.

Raw output: `plans/260920-immediate-test-feedback-reduction/reports/proof-inventory.json` (87 entries). Admission-check baseline: `plans/260920-immediate-test-feedback-reduction/reports/admission-baseline.json`.

## Totals

| Primary responsibility | Entries |
|---|---:|
| `unknown` | 58 |
| `cross-language-packaging` | 19 |
| `fixture-construction` | 4 |
| `process-contract` | 3 |
| `concurrency-timing` | 3 |
| `direct-business-proof` | 0 |
| `git-process-integration` | 0 |
| `large-state-artifact-boundary` | 0 |

| Disposition | Entries |
|---|---:|
| `retain` | 83 |
| `optimize-execution` | 4 |

| Evidence level | Entries |
|---|---:|
| `measured` (from real profile durations) | 50 |
| `static` (call-shape/directory scan, no runtime timing claimed) | 37 |

**58/87 entries are honestly `unknown`.** That is the expected, correct outcome of a mechanical-only classifier applied to a repo whose top-cost tests are mostly `cli/`, `runner/`, `setup/`, and `e2e/` files that mix responsibilities within one file — no directory or keyword signal can responsibly assign a single label without reading each test body, and this phase does not do that reading (out of scope: P00A builds vocabulary and counts real occurrences of two responsibility classes with high confidence; it does not claim exhaustive coverage). `unknown` is explicitly not counted as savings or a deletion signal per ITR-D13/ITR-D15.

## Finding 1 (headline): the P02 nine-file lease has shrunk to 7 static sites, not the inherited 128

The prior track's P07 audit (`plans/260915-0455-test-suite-feedback-cost/reports/cli-harness-responsibility-audit.md`, SHA `da5684af...`, 2026-09-16) named the same nine files as "Candidate 1" with **128 residual `fgos init` static call sites**. Re-scanning the exact same nine files on the current tree (SHA `a5c29f6e...` + main sync) finds **7 total sites**:

| File | `fgos init` run() sites | Classification |
|---|---:|---|
| `test/cli/fgos-claim.test.mjs` | 0 | — |
| `test/cli/fgos-claim-2.test.mjs` | 0 | — |
| `test/cli/fgos-read-5.test.mjs` | 0 | — |
| `test/cli/fgos-return-2.test.mjs` | 3 | `process-contract` (cwd/subdir — see Finding 2) |
| `test/cli/fgos-iron-law-gate.test.mjs` | 0 | — |
| `test/cli/fgos-move.test.mjs` | 0 | — |
| `test/cli/fgos-approve-5.test.mjs` | 4 | `fixture-construction` (eligible) |
| `test/cli/fgos-return-3.test.mjs` | 0 | — |
| `test/cli/fgos-return-4.test.mjs` | 0 | — |

**This is exactly the drift ITR-D02 anticipated** ("the repository and suite have changed since that snapshot") — six of the nine files now construct their fixtures entirely through `initGitCwd(Fast)`/state helpers (`addWork`, `addOk`, etc.) rather than a `fgos init` CLI subprocess, and no longer contain the call sites the old audit counted. **P02's real eligible surface in the current tree is 4 sites, not ~128** — a materially smaller opportunity than the inherited number implies. Any P02 cell must re-scan before mutating, not trust the old count.

## Finding 2: 3 of the 7 sites are cwd/subdir fixtures, not eligible for fast substitution

All 3 `fgos-return-2.test.mjs` sites build `cwd` via `initGitCwdInSubdir()` immediately before the `run(cwd, ['init'])` call, inside tests explicitly named around subdirectory cwd behavior (e.g. "return succeeds when cwd is a subdirectory of the real git top-level..."). The `fgos init` call's own cwd/subdir resolution IS the fixture precondition under test here — replacing it with a fast/mocked init risks the same failure mode the plan's own history already recorded (P06: "found three subdir cases that failed under over-broad replacement"). Classified `process-contract`, disposition `retain`.

The 4 `fgos-approve-5.test.mjs` sites all discard their `run(...)` return value, build `cwd`/`cwdR`/`cwdP` via plain (non-subdir) constructors (`initSessionSafeCwd()`), and sit inside tests about the approve/session/worktree guard, not about `init` itself. Classified `fixture-construction`, disposition `optimize-execution` — genuinely eligible for P02.

## Finding 3: top-profile cost is dominated by real cross-language and concurrency boundaries, not obvious fixture waste

Among the top 50 profiled tests and top 30 profiled files, the only entries with a confident (non-`unknown`) mechanical label are:

- **19 `cross-language-packaging`** entries — every one is under `test/rust-host/**`, consistent with P00's baseline note that `test/rust-host/fgctl-init.test.mjs` (218.42s) is the single most expensive file, a real Rust/Node package boundary.
- **3 `concurrency-timing`** entries, all with the word "concurrent"/"racing" literally in the test name: `test/rust-host/fgctl-init.test.mjs` ("Concurrent fgctl init invocations..."), `test/e2e/runner-loop.test.mjs` ("submit pass-throughs 2 stages... concurrently"), `test/runner/dispatch.test.mjs` ("fanoutBatchExecutorCli fires candidates in batch concurrently...").

No `direct-business-proof`, `git-process-integration`, or `large-state-artifact-boundary` entries were found by mechanical rules alone in this top-cost slice — not because none exist, but because distinguishing them from `unknown` here would require reading individual test bodies, which this phase deliberately does not do. This is a **negative result worth recording**: the current top-cost tests are not obviously dominated by execution/surface duplication that a mechanical pass can safely flag; whatever P01 selects (max 3 candidates) will need its own individual trace, not a bulk inventory shortcut.

## Warning-only admission foundation

`scripts/test-proof-inventory.mjs --check --scope <files> --baseline <path>` flags a **new** unmarked `fgos init` call or a **new** unmarked real network call (`fetch`/`http(s).request`/`WebSocket`) in changed lines, comparing against a committed baseline so pre-existing debt never fires. Baseline seeded in `admission-baseline.json` with the 7 real sites found above (marking them accepted debt, not violations) — scoped to the two files that currently contain them (`fgos-return-2.test.mjs`, `fgos-approve-5.test.mjs`); this track claims no wider "onboarded area" than the files it has actually inventoried. Exit code is always 0 (warning-only, per ITR-D15) — it never fails a build in this track. Verified: a synthetic new unmarked site is flagged; the same site with a `// boundary:` or `// provider-boundary:` marker on the same or prior line is not; a site already present in the baseline never re-fires (see `test/scripts/test-proof-inventory.test.mjs`).

## Framework decision (record only)

`node:test` remains the execution framework. `scripts/test-proof-inventory.mjs` is a narrow, project-local static-analysis/metadata utility (regex-based call-site and profile-data classification) — not a replacement runner or assertion DSL, and it does not touch how any test executes. No framework-overhead evidence was collected in this phase; a future framework pilot remains out of scope per ITR-D14.

## Impact analysis

`impact-analysis: inactive` — 0 registered providers in this worktree (see P00's baseline report for the same finding); this phase adds no edits to existing functions/classes/methods outside the two brand-new files (`scripts/test-proof-inventory.mjs`, `test/scripts/test-proof-inventory.test.mjs`), so there is no pre-existing symbol to run upstream impact on.

## Acceptance

- [x] Inventory totals reconcile with scanned scope (7 static sites + 50 profiled tests + 30 profiled files = 87 entries, matches `proof-inventory.json.scope`).
- [x] Every entry has one primary responsibility or explicit `unknown` (58/87 `unknown`, honestly, not guessed).
- [x] No test deleted or disabled.
- [x] Warning-only/baseline rule verified to catch a synthetic new violation and not flag a preserved/baselined one.
- [x] P01/P02 can consume these inventory IDs (`testId` = `<file>::run-init@L<line>` for static sites, `<file>::<test name>` for profiled tests) instead of reclassifying the same sites independently.

## Handoff

- **P01** (max 3 hotspot candidates): this inventory found no mechanically-confident `execution-duplication`/leak candidate beyond what P00's baseline already flagged (`fgctl-init.test.mjs`, Rust/package boundary — likely legitimate, needs its own trace, not a quick win). P01 should not assume this inventory already selected its candidates.
- **P02** (fast-fixture expansion): real eligible surface in the nine-file lease is now 4 `fixture-construction` sites (all in `fgos-approve-5.test.mjs`), plus 3 `process-contract`/cwd-subdir sites to explicitly retain (all in `fgos-return-2.test.mjs`). Six of the nine files have zero `fgos init` sites at all currently.
- **P00A's own gap, named plainly:** "existing direct tests that overlap the stage/edit/read CLI business cluster" (plan's inventory-scope bullet 5) was not separately computed as a new field in this pass — the top-30-file list already includes `fgos-edit.test.mjs`, `fgos-edit-2/3.test.mjs`, `fgos-read.test.mjs`, `fgos-read-2..5.test.mjs`, and `fgos-stage.test.mjs`/`fgos-stage-2/3.test.mjs` by cost ranking, but no cross-reference to the prior track's `cli-harness-run-inventory.json` verb-level totals was computed here. Left as a named, explicit gap rather than a guessed cross-reference.
