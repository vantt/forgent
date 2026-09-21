# P05 — Shadow Evaluation

**Status:** all promotion thresholds met, on an evidence set adapted from the plan's literal specification after a real, confirmed infrastructure blocker. Two real bugs in the shipped P04 selector were found and fixed as a direct result of this evaluation. Disposition recommendation at the end — **not** unilaterally promoted to `test:related` in this commit; that decision is left to the user given the methodology adaptation.

## Methodology: what changed and why

The plan's literal design (30 historical commits + 10 full-trigger + 10 adversarial, each with a real full-suite comparison) was attempted first. It failed for a real, confirmed reason, not convenience:

1. **Manifest-staleness on old trees.** Today's 33-rule manifest only fully validates against trees from 2026-09-09 onward (the newest manifest-referenced file, `capability-plan-lint.mjs`, didn't exist before then) — checking out older commits made `validateManifest` fail globally, masking every real decision behind `manifest-invalid`. Worked around by scoping validation to only the rules relevant to each commit's own changed paths (evaluation-harness-only change, not a change to the shipped selector).
2. **A real environment-contamination bug, discovered live.** With the scoping fix in place, every historical checkout still showed a large, unrelated failure cluster (approve/merge/catchup/coordination — nothing to do with the evaluated file). Root cause, confirmed not guessed: some part of the setup/config-merge path writes to the user's **global, machine-level** `/home/vantt/.fgos/config.json` (outside any git repo) as a side effect of running tests from an old checkout, and that global file's additive-only merge left stale old-schema tier names (`lightweight`/`creative`/`analytical`/`critical`) sitting alongside the current ones (`nano`/`mini`/`standard`/`advanced`/`flagship`/`frontier`). Every fresh test fixture's default config then inherited the stale keys, which whichever validator was live at that checkout rejected — in either direction (old validator rejecting a new-looking value at old commits; current validator rejecting the leftover old value once I returned to the current tree). **This was cleaned up** (backup retained, exact 5 stale keys surgically removed, verified with a real test re-run) — see Handoff.

With the literal 30-commit historical-replay approach confirmed infeasible on this machine without deeper per-commit environment isolation than is practical here, the evaluation pivoted (user-approved) to: **real fault-injection on the current, clean tree** for the safety-critical proof, plus **real sampled edits on the current tree** for the ratio/overhead/speed statistics, plus the already-cheap full-trigger and adversarial buckets. This is a materially different evidence shape than the plan's literal text — flagged plainly, not hidden.

## Critical bug found: FULL_TRIGGERS shadowed all state-leaf manifest rules

While building the fault-injection case for `src/state/`, `--explain` returned `full` via a rule named `state-shared-core` for a file that should have matched its own manifest rule instead. Root cause: `FULL_TRIGGERS` had a blanket `prefix: 'src/state/'` entry, checked *before* the manifest lookup — so it matched every `src/state/**` path, including all 16 curated leaf rules, making every one of them permanently unreachable. The selector could never have produced a `related` decision for any state-leaf change as shipped in the P04 commit.

**Fixed**: the rule was also redundant (any unmapped `src/state/` file already falls through to `unknown` → full, the same safe outcome, without needing a named blanket rule) — removed entirely, with 2 new regression tests proving every state-leaf rule is reachable and an unmapped state file still correctly escalates. Committed separately (`56bb02d5`) before re-running the evaluation.

## Safety proof: 0 unresolved patch-related misses (real fault injection, real full-suite verification)

One deliberate, real bug per pilot area, on the clean current tree, each independently verified end to end:

| Area | File | Injected fault | Selector decision | Related result | Full-suite result | Miss? |
|---|---|---|---|---|---|---|
| state | `src/state/cursor.mjs` | `DEFAULT_LIMIT` 50→51 | `related`, selected `test/state/cursor.test.mjs` (1/358 files) | red (51≠50) | **7204 tests, 1 fail — the exact same test** | **No** |
| report | `src/report/entropy.mjs` | `WEIGHTS.stageEntry` 3→4 | `related`, selected `test/report/entropy.test.mjs` (1/358 files) | red (2 assertions) | **7204 tests, 3 fail — the same 2 assertions, plus 1 confirmed-unrelated flake** (see below) | **No** |
| intake | `src/intake/classify.mjs` | fallback title casing changed | `related`, selected `test/intake/classify.test.mjs` (1/358 files) | red | **7204 tests, 1 fail — the exact same test** | **No** |

The report case's third full-suite failure (`test/runner/coordination-r5-hard-budgets.test.mjs`, a real OS-cross-process race test) was re-run 3× in isolation immediately after and came back 43/43 green every time — confirmed pre-existing ambient-load flake, unrelated to `entropy.mjs`, correctly classified `unrelated-flake` rather than counted against the selector. All three fault-injection cases were reverted (`git checkout --`) after verification; the tree is byte-identical to before this phase.

## Promotion thresholds

| Threshold | Requirement | Evidence | Met? |
|---|---|---|---|
| Unresolved patch-related misses | 0 | 3/3 fault-injection cases, real full-suite comparison, 0 misses | **Yes** |
| Fallback on unsafe/full-trigger cases | 100% | 10/10 real cases (`bin/fgos.mjs`, `package.json`, unmapped `src/state/{events,store}.mjs`, `src/verbs/merge/approve.mjs`, `scripts/run-tests.mjs`, unmapped `src/report/item-trace.mjs`, `src/setup/checks.mjs`, `core/instructions/platform-laws.md`, `.github/workflows/ci.yml`) | **Yes** |
| Median selector overhead | <500ms | 13 real single-file edits, `collectChangedPaths`+`selectTests` timed end to end: 51-64ms, median ~57ms | **Yes** |
| Median selected-file ratio (eligible cases) | ≤25% | 1/358 files ≈ 0.28% for every eligible case sampled | **Yes** |
| Median related feedback speedup | ≥4× faster | 5 real single-file `node --test` runs: 0.13-2.91s (median 0.14s) vs the session's established full-suite median (~404-425s, P00/P03/P04 baselines) ≈ **~2900×** | **Yes** |
| Fallback-full rate (intentionally eligible cases) | ≤40% | 0% (16/16 eligible-by-construction real edits all produced `related`) | **Yes** |
| Every selection explainable, no hidden knowledge | required | `--explain` prints the exact matched rule id + direct/boundary tests, or the exact escalating path + rule id/reason, for every case above | **Yes** |

## Adversarial matrix (mapped to P04's existing 46 real-git-integration tests, not re-derived)

| Plan's required case | Covered by |
|---|---|
| committed-only / staged-only / unstaged-only / mixed | 4 dedicated tests in `test/scripts/test-select.test.mjs` |
| untracked source and untracked test | 1 test |
| rename and delete | 2 tests (real `git mv`, real delete) |
| missing/invalid base | `collectChangedPaths` `{error}` test + `runSelected`/`runShadow` never-spawns tests |
| detached HEAD/worktree | 1 test |
| spaces/backslashes in paths | `parseNameStatusZ` unit test, `-z` used throughout |
| source matches one rule | 1 test, plus 16 real current-tree samples above |
| source matches multiple compatible rules | structurally impossible by design (exact-path uniqueness, `validateManifest` rejects a duplicate pattern) |
| unknown source | 1 test, plus real samples above |
| shared-core/full trigger | 1 test, plus 10 real current-tree samples above |
| harness/manifest change | 1 test (exact-path full-trigger) |
| generated source/target change | no dedicated rule needed — any generated path outside the 33-rule manifest already falls through to `unknown` → full |
| test deletion | 1 test (a deleted test file is a known, non-escalating, non-re-selected change) |
| traversal and symlink escape | tested against the manifest's own declared paths (git itself never emits an escaping path from a real diff) |
| zero selected files | 2 tests (zero changed paths; zero files after matching) |
| static graph empty/UNKNOWN | 1 test (`staticGraphTests: []` leaves the manifest-derived set unchanged) |
| graph-added test union behavior | 1 test (adds without removing) |

## Every current implementation commit from P01-P04 (reused, not re-run)

- **P00** (`4bbbc31f`): 3 real full-suite samples at baseline, all green (7104 tests).
- **P00A** (`baf30148`): docs/tooling only, no product behavior changed.
- **P01/P02** (`a8c22de3`, `78f223a0`, `a90bee31`): both `stop`, tree byte-identical to their parent commits — nothing to re-verify.
- **P03** (`f9ba99ca`): real end-to-end run, canary green then full suite once, 7154 tests green.
- **P04** (`852171c2`): real end-to-end run, 7200 tests, one transient failure whose cause was hidden by a since-fixed `stdio` bug, two subsequent clean re-runs (7200 tests, 0 fail).
- **This phase's own fixes** (`2eff154d`, `56bb02d5`): 89 focused tests green; no full-suite regression expected (docs/manifest/scripts only) and not separately re-verified with a fresh full run given the 3 fault-injection cases above already exercise the corrected selector end to end.

## Disposition

**Safety and value thresholds are both met** on the adapted evidence set. Per the plan's own rule ("if safety passes but value thresholds fail: revise, not adopt"), the inverse holds here: both hold, so promotion is *technically* justified by the numbers. However, this report does **not** add a `test:related` command in this commit, for one reason: the evidence set materially deviates from the plan's literal "30 historical commits, each independently verified" requirement, substituted with 16 real current-tree edits + 3 fault-injections + 10 full-trigger cases. That substitution was reasoned and user-approved, but it is a smaller, current-tree-only sample than the plan specifies, and the user should decide whether that's sufficient to actually ship `test:related` or whether they want the literal historical bucket attempted again (now that the manifest-shadowing bug and the environment contamination are both fixed, a retry would not hit the same failures — though the Rust/Node-old-commit-schema-drift risk for *very* old commits would still need the same evaluation-harness scoping trick used here).

## Handoff

- **`/home/vantt/.fgos/config.json` was corrupted by this evaluation's own historical-commit attempts and has been fixed** (5 stale tier-name keys removed, backup at `/tmp/fgos-global-config-backup-*.json`, verified with a real test re-run). This was global, machine-level state outside any git repo — worth flagging to the user explicitly, which this report does.
- **Real infrastructure gap, not yet fixed**: some part of the config-merge/setup path writes tier-policy defaults into the user's global `~/.fgos/config.json` as an apparent side effect of running tests, additively (never removing stale keys). This is a genuine latent bug in this repo's own config-merge logic (separate from anything in this track's scope) that could recontaminate the same file again under different circumstances. Flagged, not fixed — out of this track's scope (P04/P05 own only the test selector, not the config-merge subsystem).
- If a literal historical-commit re-run is wanted later: the eval-worktree pattern (`git worktree add --detach`, symlink `node_modules`/`target`, manifest validation scoped to the commit's own changed-path rules) is reusable; this run's scratch scripts were kept out of the repo (one-off evaluation drivers, not a shipped capability) but the pattern itself is documented here for reproduction.
