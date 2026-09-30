# P01 Handoff - Portable Test Runner And CI Proof

**Cell:** test-suite-feedback-cost--p01
**Status:** implemented, targeted + full suite green (rust-host binary gaps excluded)

## Root cause

`package.json`'s `test` script was
`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'`.
Two independent portability defects:

- The quoted glob relies on Node's own CLI glob resolution for `--test` file
  arguments, which is not present on the CI lane's pinned Node 20 (this dev
  machine runs Node 24, where the same string happens to resolve, masking the
  defect locally).
- The leading `VAR=value` env assignment is POSIX shell syntax; Windows's
  default `cmd.exe` npm shell rejects it outright.

Both failures happen before a single test runs (TFC-D02/D04's "12 most
recent CI runs never executed a test" finding).

## Fix

Added `scripts/run-tests.mjs`:

- `discoverTestFiles(root)` walks `test/` with `fs.readdirSync` (no glob),
  never follows a symlinked directory (avoids cycles / escaping into e.g. a
  `node_modules` symlink), still picks up a symlinked file, returns a
  sorted+de-duplicated list.
- `buildTestArgv(files, forwardedArgs)` returns
  `['--test', ...forwardedArgs, ...files]` — forwarded runner args always
  ride alongside the full file list, never in place of it.
- `runTests(...)` refuses (status 1, no spawn) on zero discovered files, sets
  `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1` directly on the spawned child's own
  env object (merged after `process.env`, so nothing else inherited is
  lost), and passes the file list as literal argv elements (`spawnSync`
  array form — no shell interpolation, so spaces/quotes/backslashes in a
  path are inert).

`package.json`'s `test` script is now `node scripts/run-tests.mjs` — no
shell-specific syntax on any OS. `.github/workflows/ci.yml`'s `npm test`
step is unchanged (it already just runs `npm test`); only fixed a stale
comment describing the old glob-based invocation.

## Requirements disposition

- R1/R2 (recursive discovery, sorted+de-duped, argv elements): done, tested.
- R3 (`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1` in child env): done, tested.
- R4 (refuse zero discovered tests): done, tested (unit + real spawned-process
  integration test).
- R5 (forward runner args without letting a caller bypass the full set):
  done — `buildTestArgv` always appends the full list after any forwarded
  args; tested with a forwarded arg that names one real file, proving the
  full 2-file set still rides along.
- R6 (`npm test` stays full-suite, same runner on every CI OS): done — the
  script is pure Node core, no OS branching.
- R7 (discovered count equals a fixture tree and the real repo inventory):
  done — one test against a synthetic fixture tree, one test that
  independently re-implements the walk and diffs it against
  `discoverTestFiles(test/)` on the real repo.

## Adversarial checks covered in tests

Spaces in paths, a directory literally named `looks-like.test.mjs` (must not
be treated as a file match), decoy files containing `.test.mjs` as a
substring but not the exact suffix, a symlinked directory (including a
self-referential one, to prove the guard actually short-circuits rather than
accidentally avoiding one fixture shape), a symlinked file (still
discovered). Windows env-assignment regression and CI-glob resolution are
structurally impossible now (no shell env prefix, no glob argument at all)
rather than separately unit-tested.

## Runner argv/env example

```
node --test --test-reporter=tap test/cli/fgos-add.test.mjs test/state/store.test.mjs ...
# env: { ...inherited, FGOS_DISABLE_OPPORTUNISTIC_CHECKS: '1' }
```

## Discovered file count

329 files (328 pre-existing + this cell's own new
`test/scripts/run-tests.test.mjs`), verified equal to an independent
manual `fs` walk of the real `test/` tree in
`test/scripts/run-tests.test.mjs`.

## Local full-suite output

`npm test`: 6538 tests, 6478 pass, 51 fail. All 51 failures confined to
`test/rust-host/{fgctl-init,fgctl-stage,fgctl-upgrade,release-tree}.test.mjs`
— the same pre-existing missing-`cargo build --release` environment gap
P00 already recorded, orthogonal to this cell. Zero regressions elsewhere;
15 more total tests than P00's run, matching the 15 new tests this cell
added.

## CI run links / external gate

**Not run.** No push/PR was made from this session (worktree-local branches
only), so there is no live GitHub Actions run to link. Per the plan's Track
Exit Gate #2: "If a PR/push is not authorized, the missing remote CI run
remains an explicit external gate and the track cannot claim CI restoration
complete." This cell implements and locally proves the portability fix; the
three-OS CI proof itself stays an open external gate until a push/PR is
explicitly authorized.

## Production code touched

None — `scripts/run-tests.mjs` is new infra, not product runtime code.
`package.json`, `.github/workflows/ci.yml` (comment only), `CHANGELOG.md`
also touched per file lease.
