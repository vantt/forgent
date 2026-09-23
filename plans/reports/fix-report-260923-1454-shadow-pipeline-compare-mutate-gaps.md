# Fix report: CI shadow pipeline (TI-03/TI-04) remaining gaps (Slice 2)

Branch: `fix/shadow-pipeline-compare-mutate-gaps` (worktree `.claude/worktrees/shadow-pipeline-fix`, off `main@c7a45c56`)

Scope: the remaining TI-03/TI-04 gaps not already fixed by `fgw/phase3-completion`'s own merge (`af55cbcc` + `c7a45c56`, already on `main`). That merge landed real fixes for 3 of TI-03's 4 described bugs (undefined `isOsSpecific`, artifact-path layout, `require()`-in-ESM) plus a new `test-select-promote.mjs`. Verified two gaps remained before starting any edit here:

- **TI-03 (marker integration)**: `test-select-compare.mjs`'s `runCompare` never read `test-marker.json` at all — a crashed/incomplete OS run with an empty junit would silently read as "nothing failed there" instead of `inconclusive`, per the original spec ("Đọc marker (TI-02b): marker thiếu hoặc completed:false → inconclusive").
- **TI-04 (baseline + regex)**: confirmed live by running `node scripts/test-select.mjs --explain --plan-out <f>` on a clean `main` checkout — `decision: "refuse"` ("no changed paths since base"). `test-select-mutate.mjs`'s baseline check ran this exact bare invocation before the mutant loop even started, so it always threw and the whole nightly run returned an empty ledger without ever testing a single mutant — the exact TI-04 root cause #1 from the original brief. The fragile regex `/\{[^{}]*"decision"[^]*\}/` for parsing `--explain` stdout (root cause #2) was also still present, unchanged.

## Fixes

### TI-04 — `scripts/test-select-mutate.mjs` (root-cause rewrite, not a patch)

Replaced the git-diff-based selector call (`test-select.mjs --explain`, parsed via regex from stdout) with a direct manifest lookup: each mutant already carries `ruleId` after `generateMutantPayload` enrichment, so `relatedFilesForRule(rule)` reads the rule's own `directTests`/`boundaryTests` straight from `MANIFEST` — no git diff, no selector CLI, no stdout parsing at all. This also structurally fixes root cause #1: baseline is no longer a single global pre-loop check against a clean checkout (which will always show zero changes and always refuse) — it now runs **per mutant, per rule, inside the detached worktree, before mutation**, against exactly that rule's own related tests, matching the original brief's own requirement verbatim ("Baseline phải chạy đúng tập related của rule đang kiểm định, trong worktree detach, không có mutation").

Extracted the per-mutant apply+classify logic into an exported `classifyOneMutant({ mutant, rule, worktreePath, runRelated, execFileFn })`, injectable via `runRelated`/`execFileFn`, so every classification path `classifyMutant` supports (`infra-error`, `timeout`, `invalid-syntax`, `caught`, `equivalent-or-missing-test`, `confirmed-miss`) plus the two new gate outcomes (`invalid`: no related test files / mutant find-string not found; `infra-error`: red baseline) can be exercised with a fake runner — no real git worktree or test process per test case, matching the spec's "Test: dùng fake runner cho cả 6 hàng của C2". `runNightlyMutations` is now a thin orchestration loop (worktree create/teardown + ledger write) calling `classifyOneMutant`.

Syntax-error detection (`invalid-syntax`) is done via a `SyntaxError|Unexpected token|Unexpected end of input` stderr match on the mutated related-test run, since the JSON/regex path that used to (accidentally) produce `syntaxError: true` on any parse failure is gone. Timeout detection reads the child process's `signal` field (a real `SIGTERM`/similar from a killed process), not something the previous code ever modeled.

### TI-03 — `scripts/test-select-compare.mjs` (marker gate added)

`runCompare` now reads `test-marker.json` from each OS's artifact directory (`artifacts/full-results-<os>/test-marker.json`, the same directory `full.xml` lives in, since `ci.yml`'s "Write test marker" step writes both into the same `test-results/` dir that gets uploaded as one artifact). If any of the 3 OS markers is missing, unparseable, or reports `completed !== true`, the whole run short-circuits to `{error: 'inconclusive', reason: 'marker-incomplete', incompleteOses: [...]}` (or `process.exit(0)` in CLI mode) — placed after the existing "no plan"/"decision: full" early-returns, before any junit file is read, so a crashed OS's empty fail-list is never mistaken for "nothing failed there".

## Tests

- `classifyOneMutant`: 6 fake-runner tests (one per classification row) + 2 more for the `invalid` gate (empty related-file list; find-string not present) + baseline-red → `infra-error`. All isolated to a plain tmp dir, no git/spawn overhead — run in under 3ms total.
- `relatedFilesForRule`: dedup + null-rule tests.
- One real integration test: applies the real registry mutant `m-edit-1` (`src/verbs/state/edit.mjs`, removes a missing-item guard) inside an actual detached git worktree with real spawned `node --test` runs (baseline + mutated related + full), asserting the classification lands on a real, non-error outcome (`caught`/`confirmed-miss`/`equivalent-or-missing-test`) — proves the whole real wire-up end to end, not just the injectable logic. Completes in <1s.
- `runCompare` marker gate: missing-marker → inconclusive naming all 3 OSes; one OS `completed:false` → inconclusive naming only that OS; all 3 `completed:true` → proceeds past the gate to real classification.
- Fixed 3 pre-existing `runCompare` fixture tests (`AC 3`, both `AC 7`) that broke the instant the marker gate was added, since none of them provided marker fixtures — added a shared `writeCompleteMarkers(tmpDir)` helper and wired it into all 3, plus every new `runCompare`-exercising test.

## Commands run + results

- `node scripts/test-select.mjs --explain --plan-out <f>` on a clean `main` checkout → confirmed `decision: "refuse"` (root cause #1, before the fix).
- `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/test-select-mutate.test.mjs` → **23/23 pass** (12 pre-existing + 11 new).
- `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/test-select-compare.test.mjs` → **18/18 pass** (15 pre-existing, 3 of which needed the marker-fixture fix + 3 new).
- `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/*.test.mjs` → **430/430 pass**.
- `env -u CLAUDE_CODE_SESSION_ID npm run test:ownership:lint` → passes (one pre-existing unrelated warning: orphaned `test/direct/merge-gate.test.mjs`, not touched here).
- `env -u CLAUDE_CODE_SESSION_ID npm test` (full suite, local, per repo convention -- not CI): see below.

## Why this didn't need full CI

Per the repo's own `ci.yml`, `test-select-compare.mjs` is used only by the non-required `compare` job and `test-select-mutate.mjs` only by `selector-nightly.yml` (cron/`workflow_dispatch`-only, never triggered by a plain PR push). Neither depends on the slow 3-OS `test` job's own outcome (that job's correctness was Slice 1's subject, already proven separately). `ci.yml` has no path filters, so opening a PR here will still trigger that job automatically and it is not being treated as a blocking gate for this slice's own acceptance.

## Scope check

- Only touched `scripts/test-select-compare.mjs`, `scripts/test-select-mutate.mjs`, and their two test files — no forbidden paths (`src/runner/merge.mjs`, `src/verbs/merge/approve.mjs`, `.fgos/`).
- No test skipped, nudged, or weakened; `npm test`'s own full-suite behavior (Slice 1's ITR-D01 concern) is untouched by this slice.
- No new config default/env var/infra dependency — no `fgos doctor` registration needed.

## Unresolved / follow-ups

- `test-select.mjs`'s own CLI entrypoint guard (`process.argv[1] === __filename`, line ~454) is a *different* pattern from the `file://${process.argv[1]}` bug Slice 1 fixed, but shares the same failure class (symlink/realpath mismatch could make it silently no-op). Not touched here — out of this slice's declared scope (TI-03/TI-04 only), and this repo's own `scripts/test-select.mjs` header already flags "Shadow-mode only" for the whole file. Worth a follow-up note if `dispatch.mjs`'s own guard fix (Slice 1, F2/F3) sets a precedent to sweep the rest of `scripts/*.mjs` for entrypoint-guard variants beyond the literal `file://${process.argv[1]}` string.
- `selector-nightly.yml` was never manually triggered via `workflow_dispatch` to observe a real nightly run end to end on CI (only local tests + the one real-mutant integration test prove the fix). Not blocking per the "why this didn't need full CI" note above, but flagging as the one piece of evidence this report doesn't carry.
