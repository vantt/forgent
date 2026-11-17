# Phase 02: CI shard matrix and aggregate check

Status: pending. Effort 2h. Depends: phase 01 (same branch is fine).

## Context

- `.github/workflows/ci.yml`: job `test` :28 (name `test (${{ matrix.os }})` :29, `timeout-minutes: 60` :40, the two
  `release-gate`-gated steps toolchain + rust-cache, release build, `npm test` with spec + junit `full.xml`, marker,
  upload `full-results-${{ matrix.os }}` :122); `compare` `needs: [selector-plan, related, test]` :234; base
  download of `full-results-ubuntu-latest` :263.
- `.github/workflows/release.yml` job `suite` calls `ci.yml` with `release-gate: true`; publish needs it. Unchanged.
- `test/scripts/release-packaging.test.mjs:119-138`: slices `'\n  test:'` .. `'\n  selector-plan:'`, asserts exactly
  two gated steps (toolchain, rust-cache).
- `scripts/test-select-compare.mjs:124,128` read `artifacts/full-results-ubuntu-latest/{full.xml,test-marker.json}`.

## Requirements

1. Job `test-shard`, name `test shard (${{ matrix.shard }}/5)`, `strategy: fail-fast: false`, `matrix: shard: [1, 2, 3, 4, 5]`,
   `runs-on: ubuntu-latest`, `timeout-minutes: 40`. Steps = today's `test` steps (checkout depth 0, Linux tools, git
   identity, node, npm install, gated toolchain + rust-cache, release build) with:
   - run: `npm test -- --shard=${{ matrix.shard }}/5 --test-reporter=spec --test-reporter-destination=stdout --test-reporter=junit --test-reporter-destination=test-results/shard-${{ matrix.shard }}-of-5.xml` (exit code to `$GITHUB_OUTPUT` as today);
   - marker: `node scripts/write-test-marker.mjs --type full --xml test-results/shard-${{ matrix.shard }}-of-5.xml --exit-code ...`;
   - upload `test-shard-${{ matrix.shard }}` (`test-results/`, `if: always()`, retention 14).
   Keep the Linux-only and fetch-depth comments; drop the `os` matrix.
2. Job `test` (id unchanged), name `test (ubuntu-latest)` (literal), `needs: test-shard`, `if: ${{ always() }}`,
   `runs-on: ubuntu-latest`, `timeout-minutes: 10`, no `release-gate` condition. Steps: checkout (default depth),
   setup-node 24 with npm cache, `npm install` (drop if `scripts/merge-test-shards.mjs` imports no package; verify),
   download artifacts `pattern: test-shard-*` to `shards/`, `node scripts/merge-test-shards.mjs --dir shards --out test-results`
   (id `merge`, `continue-on-error` off, `if: always()`), `node scripts/write-test-marker.mjs --type full --xml test-results/full.xml --exit-code "${{ steps.merge.outputs.exit_code }}"` (`if: always()`),
   upload `full-results-ubuntu-latest` (`if: always()`), final step `if: always()`: fail unless
   `needs.test-shard.result == 'success'` and the merge step succeeded.
3. `compare` keeps `needs: [selector-plan, related, test]`.
4. `release-packaging.test.mjs`: retarget the gated-steps slice to `'\n  test-shard:'` .. `'\n  test:'`; add asserts:
   shard matrix is `[1, ..., N]` contiguous and the run line uses `--shard=${{ matrix.shard }}/N` and the junit name
   `shard-${{ matrix.shard }}-of-N.xml` with that same N; job `test` has `name: test (ubuntu-latest)`,
   `needs: test-shard`, `if: ${{ always() }}`, runs `merge-test-shards.mjs`, uploads `full-results-ubuntu-latest`, and
   its last step fails on `needs.test-shard.result != 'success'`; neither job carries a job-level `release-gate` `if`.
   One test, its title states the behaviour ("the release suite runs every shard and one aggregate check fails when
   any shard fails").
5. Docs lines from plan.md "Docs impact" (reading-map `test/` clause; release how-to line 25).

## Files

Modify: `.github/workflows/ci.yml`, `test/scripts/release-packaging.test.mjs`, `docs/reading-map.md`,
`docs/knowledge/how-to-cut-a-fgos-release-tag/cut-a-fgos-release-tag.md`.
Do not touch: `release.yml`, `release-assets*.yml`.

## Steps

1. Edit `ci.yml`; `actionlint` if present, else `node -e` YAML parse through the repo's YAML door.
2. Update `release-packaging.test.mjs`; run `npm test -- test/scripts/release-packaging.test.mjs test/scripts/test-shards.test.mjs`.
3. Push the branch; open a PR; on its CI run check: 5 shard jobs + aggregate; aggregate log shows no
   `merge-test-shards: ERROR`; `full-results-ubuntu-latest/full.xml` case count equals the sum of the shard counts;
   `compare` ran.
4. Negative proof on the PR (then drop it): a throwaway commit with `assert.fail` in one test file -> that shard red,
   aggregate red, other shards green.
5. After landing: run the measure command in plan.md on three green main runs; write the numbers into plan.md.

## Validation

PR CI green with the shape above; the negative commit turns `test (ubuntu-latest)` red; measured wall <= 20 min.

## Risk / rollback

Revert this commit: `ci.yml` back to one job; phase 01 stays inert. A release cut while this is broken is blocked,
not wrong: `publish` needs the whole called suite.
