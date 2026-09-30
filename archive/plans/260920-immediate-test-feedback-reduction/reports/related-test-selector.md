# P04 — Minimal Conservative Related Selector (Shadow Mode)

**Status:** accepted, shadow-mode only. No `test:related` command exists — promotion requires P05's evidence thresholds. `npm test` semantics unchanged.

## Reality-validated pilot scope

The plan's four candidate areas were checked against the current tree before anything was built, not assumed from the plan text:

| Area | Outcome |
|---|---|
| `src/intake/**` | Included whole (6/6 files): 4 with a direct `test/intake/*.test.mjs`, 2 (`risk-keywords.mjs`, `verify-pattern-check.mjs`) mapped to real boundary tests located by grep (`test/evolve/iron-law.test.mjs`; `test/intake/plan.test.mjs` + `test/state/discover-verdict-override.test.mjs` + `test/intake/judge-verify-second-pass-stability.test.mjs`). |
| `src/report/**` | 11/12 files included (8 direct, 3 boundary-mapped). `src/report/item-trace.mjs` excluded — no direct or boundary test found anywhere in `test/`; it falls through to the unknown-path → full default rather than being guessed into a rule. |
| `src/state/**` leaf modules | 16 files included, each individually checked: a direct test exists AND grep-measured fan-in (importers outside `src/state/` itself) is ≤3 AND the module is not log/coordination-core-adjacent by role. `events`, `store`, `replay`, `envelope` (explicit plan text), plus `work.mjs` (fan-in 11), `frontier.mjs` (11), `workflow-stage-graphs.mjs` (22), `worker-slots.mjs` (6), `knowledge-registry.mjs`/`graph-metrics.mjs` (5), `impact.mjs`/`graph-harness.mjs`/`gate-bypass.mjs`/`events-jsonl-truncation-guard.mjs` (4), and `events-compaction.mjs` (fan-in 1, but event-log-format-adjacent by role regardless of fan-in) and `runtime-coordination.mjs` (fan-in 3, but confirmed via direct read — imported straight from `bin/fgos.mjs`, a full-trigger itself, plus `src/runner/loop.mjs`/`claim-port.mjs` — a real runtime-claim load-bearing module, not a leaf) are all deliberately excluded. Four files (`stage-fsm.mjs`, `status-fsm.mjs`, `fgos-file-registry.mjs`, `main-checkout-guard-warnings.mjs`) have no direct test at all and were never candidates. |
| `src/verbs/merge/**` | **Excluded entirely.** Only `approve.mjs` has a direct test file (`test/verbs/merge/approve.test.mjs`); the other 7 files (`merge.mjs`, `catchup.mjs`, `review.mjs`, `reject.mjs`, `sync-root.mjs`, `promote-to-component.mjs`, `iron-law-level.mjs`) would need their "mandatory boundary tests" mapped across the large `test/cli/fgos-approve-*`/`fgos-merge-*`/`fgos-return-*` family with real confidence — this phase did not do that mapping, and the approve/merge gate is safety-critical enough (Iron Law) that a wrong exclusion here is a materially worse outcome than simply not piloting the area yet. The plan explicitly allows removing a candidate area under reality validation; this is that removal, recorded rather than guessed past. |

GitNexus's `impact` tool could not resolve `File`-kind targets in this session (`"Target 'X.mjs' not found"` for every attempt) — treated as the known stale-index degradation, cross-checked with `grep -rl` fan-in counts instead, consistent with the project's capability gate ("a suspicious zero-result or not-found answer... is worth a quick grep/rg cross-check").

Total manifest: **33 rules**, all exact-path (never glob) for full auditability — a path either matches exactly one rule or none; "multiple rules matching one path" is structurally impossible by construction, enforced by `validateManifest`'s duplicate-pattern check, not by a merge-compatibility algorithm this phase does not build.

## What shipped

- `test/test-ownership.mjs` — the 33-rule manifest + `FULL_TRIGGERS` (day-one full-trigger list from the plan, corrected against the real tree: `apps/`/`packages/`/`Cargo.toml`/`components/` for the Rust host, not the plan text's placeholder `rust-host/`, which does not exist in this repo).
- `scripts/test-select.mjs` — `collectChangedPaths` (git plumbing: committed since merge-base, staged, unstaged, untracked, via `git diff --name-status --find-renames -z` / `git ls-files -z`, NUL-separated throughout so spaces/backslashes in paths are never quote-parsed), `validateManifest`, `matchFullTrigger`, `selectTests` (the algorithm), `runSelected` (`--explain`), `runShadow` (`--shadow`). Reuses `runSelectedTests`/`runTests` from P03 for all execution — no duplicated discovery/env/argv logic.
- `test/scripts/test-select.test.mjs` — 46 focused tests, including real git-repo integration tests (not mocked git) for every adversarial case below.
- `package.json`: `"test:related:shadow": "node scripts/test-select.mjs --shadow"`. `test:related` intentionally omitted (plan: "available only after P05 promotion; before that it prints experimental status or is omitted").
- `docs/how-to/use-fast-test-feedback-commands.md` (new, short, covers both `test:canary` and `test:related:shadow`) + a `docs/specs/reading-map.md` pointer line.
- `CHANGELOG.md` `[Unreleased]`: entries for both `test:canary` (P03 — missed at the time, added now) and `test:related:shadow` (P04).

## Adversarial matrix coverage (plan's required list)

| Case | Test(s) |
|---|---|
| committed-only / staged-only / unstaged-only / mixed | 4 dedicated real-git tests, plus a combined "mixed" test asserting all four sources appear correctly tagged in one run |
| untracked source and untracked test | 1 test |
| rename and delete | 2 tests: a real `git mv` + commit (old path reported as D with `renamedTo`, new path with `renamedFrom` — old path never silently dropped) and a plain delete |
| missing/invalid base | `collectChangedPaths` returns `{ error }` (never throws); `runSelected` reports `invalid-base` and never spawns |
| detached HEAD/worktree | 1 test: detach, commit, re-collect — no crash |
| spaces/backslashes in paths | `parseNameStatusZ` unit test with a literal space+backslash path; the whole reason every git call uses `-z` |
| source matches one rule | 1 test |
| source matches multiple compatible rules | structurally impossible by design (exact-path uniqueness); documented, not implemented as a runtime merge |
| unknown source | 1 test |
| shared-core/full trigger | 1 test (a full-trigger path escalates even alongside a cleanly-matched path) |
| harness/manifest change | 1 test (exact-path full-trigger match) |
| generated source/target change | not explicitly special-cased — any generated path not in the 33-rule manifest already falls through to the unknown → full default, same effective safety without a separate rule |
| test deletion | 1 test: a deleted test file is a known, explainable change, not an escalation, and is never re-selected (a file that no longer exists cannot be run) |
| traversal and symlink escape | tested against the **manifest's own declared paths** (`validateManifest`), not git-diff output (git never emits a `../`-escaping path from a real repo) — a symlinked test path resolving outside the repo root is rejected |
| zero selected files | `selectTests` refuses (not "runs 0 tests green"); separately, zero changed paths at all also refuses |
| static graph returning empty/UNKNOWN | `staticGraphTests: []` (the default) — proven to leave the manifest-derived set completely unchanged |
| graph-added test union behavior | proven to ADD without removing any manifest-selected test |

Plus: manifest validation has its own 9 dedicated tests (duplicate id, duplicate pattern, empty test set, missing pattern file, `allowMissing` opt-in, stale referenced test file, symlink-escape, unsupported field, and a full accept-case), and the real `MANIFEST`/`FULL_TRIGGERS` from this repo are validated in the same run (not just fixture data).

## `--explain` output

Machine-readable JSON: `base`, `mergeBase`, every `changedPaths` row (path/status/source/rename links), `decision`, `reason`, `matchedRules` (rule id + which direct/boundary tests it contributed), `escalations` (path + rule id + human reason), `selectedCount`, and (shadow mode) the full `comparison` object (`relatedStatus`, `fullStatus`, `agree`, `patchRelatedMiss`, timings). A concise one-line human summary goes to stderr either way.

## Shadow mode (`--shadow`)

Runs related first (skipped entirely when the decision already escalated to full — nothing to compare), then **always** the unchanged full suite, and returns the full suite's status as authoritative regardless of the related outcome. `comparison.patchRelatedMiss` operationalizes CONTEXT.md's pinned term exactly: related predicted green while the full suite actually failed. 4 dedicated tests cover: agree/green-green, a genuine patch-related-miss (related green, full red — full's failing status wins), an escalated-to-full run (only one spawn, nothing to shadow-compare), and zero-changes refusal.

## Real end-to-end proof

`npm run test:related:shadow -- --explain` run for real against this repo. Because this phase's own new files (`scripts/test-select.mjs`, `test/test-ownership.mjs`) match their own declared full-trigger rules, every live run correctly escalated to `full` and ran the complete, unchanged suite — this doubles as the phase's required `npm test`-unchanged verification on the exact post-mutation tree.

**A real bug found and fixed during this dry-run:** the CLI originally used `stdio: 'pipe'` whenever `--explain` was passed, to keep the JSON output clean — but this silently discarded the spawned full-suite's own stdout/stderr, so the first live attempt exited 1 with zero visibility into what failed. Fixed to always `stdio: 'inherit'` regardless of `--explain` (the JSON explain output is printed separately, after the real test output, never in place of it). Re-ran twice after the fix (plus once more via the plain `node scripts/run-tests.mjs` door directly, to rule out anything selector-specific): all three came back green — **7200 tests, 7191 pass, 0 fail, 9 skipped, exit 0** — consistent with the first failure being a transient flake under this session's fluctuating ambient load (same pattern already documented in P00's baseline report), not a regression from this phase's changes. The specific test that flaked was not captured (that is exactly the bug just described), so this is recorded as a probable flake with two clean confirmations, not a fully diagnosed one.

## Acceptance

- [x] Selector unit/adversarial tests green — 46/46, plus 85/85 combined with P03's suites (no regression).
- [x] Unknown and unsafe cases demonstrably select full suite — proven per the matrix above.
- [x] `npm test` unchanged — `runTests()` untouched by this phase (only reused, exactly as P03 already refactored it); real end-to-end run confirms identical full-suite behavior.
- [x] No claim of adoption before P05 — `test:related` does not exist; every message/doc explicitly says shadow-only, full-suite-authoritative.

## Impact analysis

`mcp__gitnexus__impact` could not resolve `File`-kind targets this session (treated as stale-index degradation per the capability gate, cross-checked with grep fan-in counts as documented above). `mcp__gitnexus__detect_changes` run before commit; see the commit message for its result.

## Rollback

Remove `scripts/test-select.mjs`, `test/test-ownership.mjs`, `test/scripts/test-select.test.mjs`, the `test:related:shadow` package.json entry, the how-to doc, and the reading-map/CHANGELOG lines. Nothing else depends on any of these — `run-tests.mjs` was not modified by this phase (P03 already did the one shared extraction it needed).
