---
title: "CI test shards: split the npm test job into balanced parallel shards"
description: "Run the full npm test suite in CI as 5 duration-balanced shards with an exact-set check and an aggregate job that keeps the name test (ubuntu-latest)."
status: done (landed 2026-11-16: 04520dbf6)
priority: P2
effort: 5h
branch: mail/ci-test-shards-plan
tags: [ci, test, infra]
blockedBy: []
blocks: []
created: 2026-11-15
---

# CI test shards

Read on `origin/main` `fa5d62997`. Lane MAIL. Backlog context: p-s7lnni5443 (CI cache and cancel,
`plans/reports/report-261115-0957-ci-cache-and-cancel.md`).

## Outcome

`test (ubuntu-latest)` finishes in about 17 min instead of about 50 min. The full suite still runs every file
exactly once per CI run (and per release-gate run), with every run-tests ERROR check intact, and a mechanical
exact-set check fails CI and `npm test` when a file is in no shard or in two.

## Non-goals

No change to which tests run, to `release.yml`, to the selector/related/compare logic, to local `npm test` (no
argument = full suite, unchanged), to the Rust jobs. No test-level (sub-file) splitting.

## Measurements (facts the design rests on)

Job/step seconds from `gh run view <id> --json jobs`.

| run | `test (ubuntu-latest)` | release build step | `npm test` step |
|---|---|---|---|
| 43690017863 | 3238 | 170 | 2981 |
| 43612693610 | 2765 | 141 | 2561 |
| 43610797699 | 2824 | 179 | 2578 |
| 43610368890 | 3347 | 176 | 3108 |
| 43610148230 | 2164 | 132 | 1958 |
| 43609964071 | 3509 | 183 | 3266 |
| release-gate 43656026397 (no cache) | 2264 | 114 | 2104 |

- Median job 3031 s (50.5 min); `cargo (workspace)` 887 s; slowest other job of that run: Windows assets 1207 s.
- Run 43690017863 suite line: `643 files, 8202 test() calls, 2908 s wall, 8158 s CPU`. CPU/wall = 2.81 on the
  4-vCPU runner: CPU-bound, so N runners divide the work by N.
- 110 s of the `npm test` step pass before the first test (in-suite dev build of addon 41 s + host 28 s, staging).
- Per-file time (sum of junit `<testcase time>` per `file=`, `full.xml` artifact of that run): 643 files, 7763 s;
  largest `test/runner/loop.test.mjs` 337 s, so no file bounds a shard.
- `test/suite-baseline.json` already commits `fileCpu` per file (606 files, local CPU s; refreshed by
  `node scripts/test-proof-inventory.mjs --write-baseline`, `scripts/test-proof-inventory.mjs:632`); correlation with
  CI per-file time 0.869; 47 current files missing (new since).
- Partition simulation, judged on CI per-file times, shard test wall = load / 2.81:

| N | node `--test-shard` (index) | sha1 mod N | LPT on baseline `fileCpu` | ideal |
|---|---|---|---|---|
| 4 | 876 s (imb 1.27) | 773 s (1.12) | 749 s (1.08) | 691 s |
| 5 | 641 s (1.16) | 763 s (1.38) | **596 s (1.08)** | 553 s |
| 6 | 599 s (1.30) | 669 s (1.45) | 530 s (1.15) | 461 s |

- Per-shard fixed cost: checkout (depth 0) 31-48 + setup ~20 + release build 114-183 + in-suite build ~110 +
  post ~15 = ~290-370 s.
- `main` has no branch protection and no rulesets (`gh api .../branches/main/protection` 404, `rulesets` `[]`).
  The name still matters: `compare` needs job id `test` (`.github/workflows/ci.yml:234`); the base download
  (`ci.yml:263`) and `scripts/test-select-compare.mjs:124,128` read `full-results-ubuntu-latest/{full.xml,test-marker.json}`.

## Prior art (reused / missing)

`git log -S'--shard'`, `-S'shard'` on `ci.yml`, `scripts/`, `package.json`: never sharded (two unrelated hits in
retired docs tools). `-G'matrix:'` on `ci.yml`: only `d64dd4e6f` (3-OS matrix, later Linux only).
Reused: `runSelectedTests` (`scripts/run-tests.mjs:507`, all ERROR checks 627-720), `discoverTestFiles` (`:61`),
`suite-baseline.json` `fileCpu` + `--write-baseline`, `readSuiteBaseline` (`scripts/test-proof-inventory.mjs:493`),
`write-test-marker.mjs`, artifact `full-results-ubuntu-latest`. Missing: partition, `--shard` flag, junit merge with
exact-set check.

## Decisions

| # | Decision | Why (numbers above) |
|---|---|---|
| D1 | N = 5 shards | ~965 s per shard (16 min, 13-20 with runner noise); N=4 ~1115 s; N=6 saves only ~65 s more for one more slot of 20 |
| D2 | LPT greedy over `suite-baseline.json` `fileCpu`; file without a weight gets the mean of known weights; ties by path; no weights at all = equal weights | deterministic per commit, imbalance 1.08, no hand list; refresh is the existing `--write-baseline` |
| D3 | Rust build per shard (same rust-cache key; one save wins, others warn) | parallel ~115-180 s vs a serial ~280 s build job plus cargo still rebuilding without the multi-GB fingerprints; a skip switch is forbidden (L5 q5) |
| D4 | Shards are `npm test -- --shard=k/5` through `runSelectedTests` | one door: every ERROR check (timeouts, temp leftovers, stray processes, stray worktrees, git spawn spy, `.fgos` leak, git identity) runs per shard unchanged |
| D5 | Exact-set check twice, at two layers: pure partition property in `npm test`; aggregate job checks the junit `file=` sets that actually reported against `discoverTestFiles()` | the CI check trusts evidence (what ran), not the partition code's claim |
| D6 | Aggregate job keeps id `test`, name `test (ubuntu-latest)`, `if: always()`, uploads merged `full-results-ubuntu-latest` | `compare`, base download and any future required check stay unchanged; `always()` stops a skipped aggregate reading as green |
| D7 | Static suite checks (cross-file clone ERROR, shared titles, admission) run in every shard over ALL discovered files; size/CPU line and CPU-growth warning over the shard's files against the baseline sliced to them | each shard's verdict reproduces locally with `--shard=k/5` alone; no shard depends on another |
| D8 | No "keep together" groups | shards are separate VMs (no shared FS/ports/locks); inside a shard files run concurrently exactly as today; no test sets `--test-concurrency`; the only full-suite-queue users (`test/scripts/run-tests.test.mjs`, `test/scripts/full-suite-queue.test.mjs`) spawn their own runs. Sharding only removes co-running pairs, never adds one |

## Phases

| Phase | File | Effort | Depends |
|---|---|---|---|
| 01 | [phase-01-shard-door-and-partition.md](phase-01-shard-door-and-partition.md) | 3h | - |
| 02 | [phase-02-ci-shard-matrix-and-aggregate.md](phase-02-ci-shard-matrix-and-aggregate.md) | 2h | 01 landed or on the same branch |

Serial: 02 calls the flag and script 01 adds. File ownership disjoint (01: `scripts/`, three test files; 02:
`ci.yml`, `release-packaging.test.mjs`, optional doc lines).

## Acceptance criteria

1. `npm test -- --shard=k/5` runs exactly the files `partitionFiles` gives shard k; `npm test` with no argument is
   unchanged.
2. `npm test` contains a test that partitions the real discovered list for N=1..8 and fails when any file is in no
   shard or two.
3. CI: five `test shard (k/5)` jobs plus `test (ubuntu-latest)`; the aggregate fails when any shard fails, is
   cancelled or missing, or when the junit file sets miss a discovered file or repeat one.
4. Release gate: `release.yml` unchanged; the called `ci.yml` runs all shards and the aggregate (no
   `release-gate` condition on either beyond the existing toolchain/cache steps).
5. `test/scripts/release-packaging.test.mjs` pins the new shape deliberately.
6. After landing, three green main runs: first-shard-start to aggregate-end <= 20 min (median before: 50.5 min).

## Risks

| Risk | L | I | Mitigation |
|---|---|---|---|
| A file silently not run (partition bug, shard crash before junit) | L | H | D5 double check; missing shard artifact fails aggregate by name |
| Aggregate skipped on shard failure reads as success | M | H | `if: always()` + explicit `needs.test-shard.result == 'success'` step; pinned in release-packaging test |
| Imbalance grows as files are added (weights stale) | M | L | mean weight for new files; refresh rule: imbalance > 1.25 three runs in a row -> `--write-baseline` |
| 5 more concurrent jobs worsen queueing (20-slot account limit, 68 queued runs seen 11-15) | M | M | PR runs cancel superseded (`ci.yml` concurrency); N is one matrix line to lower |
| Clone/admission ERROR printed 5 times | H | L | accepted: identical verdict per shard, D7 |
| Fixture/leak check depends on whole-suite state | L | M | none found (D8); every check is per `runSelectedTests` call |
| rust-cache save races between shards | M | L | benign "already exists" warning; same key |
| Release-gate shards cold (no cache) | L | L | cold build measured 114 s |
| Timeout too tight on a slow runner | L | M | shard `timeout-minutes: 40` (est 16) |

## Rollback

Phase 02 alone: revert its commit -> one `test` job again (phase 01 stays inert: the flag is unused).
Phase 01: revert; nothing else calls `--shard` or the merge script.

## Design principles check

- One door: shards go through `npm test` -> `runTests` -> `runSelectedTests`; no second runner. Partition lives in one
  pure module used by run-tests, the merge script and the test. Flag reading uses a plain regex on argv, never a new
  `export function parseArgs` (door pattern in `docs/architecture-manifest.json`, `parse CLI arguments (twin)`).
- One proof: partition + exact set + merge owned by `test/scripts/test-shards.test.mjs` (new module); `--shard`
  wiring one case in `test/scripts/run-tests.test.mjs`; suiteReport scope in its existing test; CI shape in
  `release-packaging.test.mjs`. No case copied across layers.
- KISS: no committed shard lists, no grouping config, no artifact-shared build, no new dependency (junit merge is
  string concatenation of `<testsuites>` children).

## Docs impact

`docs/reading-map.md` `test/` line: add `npm test -- --shard=k/n` and the refresh rule (one clause).
`docs/knowledge/how-to-cut-a-fgos-release-tag/cut-a-fgos-release-tag.md:25` says "`test` matrix job": change to
"the `test (ubuntu-latest)` check (aggregate of the test shards)". No CHANGELOG line (CI internal, as p-s7lnni5443).

## Measure after landing

```bash
for id in $(gh run list --workflow ci.yml --branch main --status success --limit 6 --json databaseId --jq '.[].databaseId'); do
  gh run view $id --json jobs --jq '[.jobs[]|select(.name|test("^test"))] as $j
    | [(($j|map(.completedAt|fromdate)|max) - ($j|map(.startedAt|fromdate)|min)),
       ($j|map(select(.name|test("shard"))|(.completedAt|fromdate)-(.startedAt|fromdate))|max),
       ($j|map(select(.name|test("shard"))|(.completedAt|fromdate)-(.startedAt|fromdate))|min)] | @tsv' | sed "s/^/$id\t/"
done
```

Columns: test wall (compare with 3031 s), slowest shard, fastest shard. Record in the plan close.

## Open questions

1. Lower N to 4 if job-slot queueing turns out worse than the 2.5 min gained? (planner picks 5; owner may override.)
2. Brief said branch protection names `test (ubuntu-latest)`; repo shows none. Nothing to migrate; confirm no
   external required-check config elsewhere (org level) exists.
