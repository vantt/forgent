# Phase 01: shard flag, partition and merge check

Status: pending. Effort 3h. Depends: none.

## Context

- `scripts/run-tests.mjs`: `discoverTestFiles` :61, `buildTestArgv` :98, `runSelectedTests` :507 (ERROR checks
  :627-720), `runTests` :733 (queue at :757-763), CLI entry :808-833 (chosen-file path :810-815; `recordLastRun` only
  when `process.argv.length === 2` :825; `suiteReport` :828).
- `scripts/test-proof-inventory.mjs`: `readSuiteBaseline` :493, `cpuGrowthLines` :560 (module-private),
  `suiteReport` :580 (clones over `files` :609).
- `scripts/write-test-marker.mjs`: `countXmlCases`, `buildMarker` (completed = xml + cases + exit code + job status).
- Door rule: `docs/architecture-manifest.json` job `parse CLI arguments (twin)` matches `export function parseArgs`;
  new code must not add one.

## Requirements

1. `scripts/lib/test-shards.mjs` (new, pure, no import of run-tests):
   - `partitionFiles(files, total, weights = {})` -> `string[][]` of length `total`. Weight of a file = `weights[path]`
     (repo-relative posix key, as `fileCpu`), else the mean of the known weights among `files`, else 1. Sort by
     weight desc then path asc; put each into the shard with the least load, ties to the lowest index. Each shard's
     list returned sorted by path. Throws on `total` not an integer >= 1.
   - `parseShard(text)` -> `{ index, total }` for `k/n` with 1 <= k <= n, else throws a message naming the value.
   - `junitFiles(xml, repoRoot)` -> set of repo-relative paths from `file="..."` attributes (strip any
     `.../<checkout>/` prefix by locating `/test/`-rooted relative path against `repoRoot`; CI path is
     `/home/runner/work/forgent/forgent/test/...`).
   - `checkShardSet(discovered, shards)` where `shards = [{ index, total, files:Set }]` -> list of problem lines:
     shard index missing or repeated, totals disagree, discovered file in no shard, file in two shards (names both),
     file in a shard but not discovered. Empty list = exact set.
   - `mergeJunit(xmls)` -> one `<?xml ...?><testsuites>` holding every root child of each input, in shard order.
2. `scripts/merge-test-shards.mjs` (new CLI, repo pattern of `write-test-marker.mjs`, plain argv loop, no exported
   parseArgs): `--dir <shards-dir> --out <dir>`. Reads every `test-shard-*/shard-<k>-of-<n>.xml` and its
   `test-marker.json`; runs `checkShardSet(discoverTestFiles(), ...)`; writes `<out>/full.xml`; prints each problem
   line as `merge-test-shards: ERROR: ...`; writes `exit_code=<max shard marker exitCode, or 1 when any marker is
   missing/incomplete or a problem exists>` to `$GITHUB_OUTPUT` when set; exits non-zero on any problem.
   The shard junit file name carries `k` and `n` so index and total come from evidence, not from the job.
3. `scripts/run-tests.mjs` CLI: an argv entry matching `^--shard=(.+)$` is removed from the forwarded args and parsed
   with `parseShard`; on a parse error print it and exit 1 before staging anything. With a shard: `runTests` gets
   `shard`, discovers all files, selects `partitionFiles(all, total, readSuiteBaseline().fileCpu)[index-1]`, runs
   them through `runSelectedTests` (queue path unchanged). Combining `--shard` with chosen `*.test.mjs` paths refuses
   (exit 1, message). `recordLastRun` stays full-run only (already: argv length check).
4. `suiteReport` gets `cloneFiles = files`: clones and shared titles scan `cloneFiles`; size line, CPU and
   `cpuGrowthLines` use `files`. In shard mode the CLI passes `files` = shard files, `cloneFiles` = all discovered,
   and a baseline sliced to the shard (`cpuSeconds` = sum of `fileCpu` over shard files that have one, `tests` =
   test() calls in those files) so the growth warning compares like with like. The size line names the shard:
   `suite: shard k/n: ...`.

## Files

Create: `scripts/lib/test-shards.mjs`, `scripts/merge-test-shards.mjs`, `test/scripts/test-shards.test.mjs`.
Modify: `scripts/run-tests.mjs`, `scripts/test-proof-inventory.mjs`, `test/scripts/run-tests.test.mjs`,
`test/scripts/test-proof-inventory.test.mjs`.

## Tests (one owner each)

- `test/scripts/test-shards.test.mjs` (new module -> new file):
  - "every discovered test file lands in exactly one shard for 1 to 8 shards": real `discoverTestFiles()` +
    real `readSuiteBaseline().fileCpu`; union equals discovered, pairwise disjoint, same result on a shuffled input.
    This is the `npm test` exact-set check.
  - "a file without a recorded duration weighs the mean of the known ones" (synthetic).
  - "the shard check names a missing file, a file in two shards, a missing shard and disagreeing totals" (synthetic).
  - "merged junit holds every case of every shard" (count via `countXmlCases`), and `junitFiles` strips the CI prefix.
  - "merge CLI fails by name when a shard result is missing" (spawn on a temp dir; one case).
- `test/scripts/run-tests.test.mjs`: one wiring case: `--shard=2/3` reaches `node --test` as the files of
  `partitionFiles(...)[1]` and is not forwarded; `--shard=0/3` and `--shard=x` exit 1 before any spawn. Extend the
  existing injected-spawn case, do not add a real suite run.
- `test/scripts/test-proof-inventory.test.mjs`: extend the existing `suiteReport` test (:320) with a `cloneFiles`
  wider than `files` (clone across a non-shard file still fails; size line counts shard files only).

## Steps

1. Read the listed lines; `impact` (GitNexus gate per AGENTS.md) on `runTests`, `suiteReport`.
2. Write `scripts/lib/test-shards.mjs` + its tests red, then green.
3. Wire `--shard` into run-tests CLI and `runTests`; extend its test.
4. Add `cloneFiles` + shard slicing to `suiteReport`; extend its test.
5. Write `scripts/merge-test-shards.mjs`; its one CLI case.
6. Focused: `npm test -- test/scripts/test-shards.test.mjs test/scripts/run-tests.test.mjs test/scripts/test-proof-inventory.test.mjs test/architecture.test.mjs`.
7. Local smoke, one small shard only (no full suite): `npm test -- --shard=5/40` (about 16 files) and confirm the
   suite line says `shard 5/40` and ERROR checks still print on a planted leftover (optional).

## Validation

Focused tests green; `git diff --stat` shows only the files above; no `export function parseArgs` added
(`rg -n "export function parseArgs" scripts`).

## Risk / rollback

Additive: nothing calls the flag until phase 02. Revert the commit to roll back.
