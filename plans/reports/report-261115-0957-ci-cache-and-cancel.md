# CI Rust cache, cancel superseded runs, skip plans-only commits

Branch `ci/cache-and-cancel`, draft PR #25 (measurement vehicle). Backlog row p-s7lnni5443.

## Changes per workflow (`.github/workflows/`)

| File | Change |
|---|---|
| `ci.yml` | `concurrency` group `workflow-ref`, `cancel-in-progress` unless the ref is a tag; `paths-ignore: plans/**` on push and pull_request; `Swatinem/rust-cache` (pinned to the v2.9.3 commit) in jobs `test`, `related`, `herdr-plugin` (workspace `herdr-dashboard`), `rust-workspace`, `external-consumer`. Cache and toolchain steps in `test`, `herdr-plugin`, `rust-workspace`, `external-consumer` are skipped when `release-gate` is true (release suite stays on a clean runner). `test` and `related` got an explicit `rustup toolchain install` step so the cache key sees the pinned compiler. |
| `release-assets-check.yml` | Same concurrency and `paths-ignore`; toolchain step plus cache in `focused-tests` (ubuntu, windows). The `assets` job calls `release-assets.yml` and stays uncached. |
| `holder-lock-cross-platform.yml` | Concurrency group; cache in `crates` (windows, macos; toolchain step already existed). No `paths-ignore`: it is already a `paths` allow-list that never matches `plans/**`; GitHub rejects `paths` plus `paths-ignore` for one event. |
| `process-containment.yml` | Same as holder-lock: concurrency, toolchain step, cache. Already a `paths` allow-list. |
| `selector-nightly.yml` | Toolchain step plus cache. No concurrency (scheduled/manual). |
| `release-assets.yml` | Unchanged: the release build, no cache, no concurrency. |
| `release.yml` | Unchanged: tag publish never cancels, no cache. |
| `platform-probe.yml` | Unchanged: manual only, separate workspace, no cache value. |

Cache key (Swatinem default): OS, job id, `rustc -vV` (the toolchain from `rust-toolchain.toml`), and hashes of `Cargo.lock` and every `Cargo.toml`.
`docs/**` is not ignored: doc-health and citation checks run in the suite.

Doc updated: `docs/knowledge/how-to-cut-a-fgos-release-tag/cut-a-fgos-release-tag.md` (step 1: a plans-only head has no CI run; older main runs are cancelled).
CHANGELOG: no line proposed, internal only (CI behaviour, no user-visible change).

## Before (green CI runs on main, 2026-11-14, job duration start to end, seconds)

| Job | run 43612693610 | run 43610148230 | run 43594211739 |
|---|---|---|---|
| test (ubuntu-latest) | 2765 | 2164 | 2718 |
| cargo (workspace) | 1008 | 877 | 909 |
| external consumer proof | 299 | 236 | 228 |
| herdr-dashboard test | 56 | 47 | 44 |
| selector-plan | 103 | 100 | 137 |
| addon reproducibility / assets linux | 291 | 296 | 328 |
| addon reproducibility / assets windows | 847 | 1015 | 923 |

Wall time of these runs, queue included, was 37 to 65 minutes.

## After

Not measured yet. The branch runs (CI 43669881508, Release assets check 43669881371, holder-lock 43669873256) have been `queued` since 02:53Z with zero jobs started: 68 runs were queued ahead of them, mostly main pushes that the old workflow never cancels, the exact problem this change fixes. Cold run, then warm run (empty commit), still to record.

To finish: when the PR runs complete, `gh run view <id> --json jobs --jq '.jobs[]|[.name,((.completedAt|fromdate)-(.startedAt|fromdate))]|@tsv'`, push an empty commit, repeat for the warm numbers.

## Notes and risks

- Cancelled intermediate main runs mean not every main commit has its own CI result; the newest head always does.
- A plans-only head has no CI run; the release how-to now says so.
- If branch protection requires these checks by name, a skipped plans-only run can show as pending; no protection rule was checked here.
- Caches written on a PR branch are readable only by that branch; main-push runs fill the cache main and later PRs read. The 10 GB repo cache limit evicts oldest first.
