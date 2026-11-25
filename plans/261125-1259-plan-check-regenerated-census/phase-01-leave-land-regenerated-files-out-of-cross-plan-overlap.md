---
phase: 1
title: Leave land-regenerated files out of cross-plan overlap
status: ready
---

# Phase 1: Leave land-regenerated files out of cross-plan overlap

Capability: `code:implement`.

## Inputs

- `plan.md` of this directory: Outcome, Acceptance criteria, Non-goals, Risks.
- `scripts/plan-contract-check.mjs`: `collisions`, `activeOverlaps` (around line 320), `main`
  (the `--plan` branch around line 361 and the `--all` branch), `checkAll`.
- `src/config/facade.mjs`: `readConfig({ projectRoot, sections })`.
- `.fgos/config.yaml` and `core/config-standard/land.yaml`: the `land.regenerate` key
  (`files` lists the regenerated paths; `regenerate` may be `null`).
- `test/scripts/plan-contract-check.test.mjs`: the test "cross-plan overlap is an error when
  ready and a warning when running" and its helpers `planText`, `root`.
- `core/skills/_shared/plan-contract.md`: the "Cross-plan footprint overlap" line.

## Files it may write

- `scripts/plan-contract-check.mjs`
- `test/scripts/plan-contract-check.test.mjs`
- `core/skills/_shared/plan-contract.md`
- `.agents/skills/_shared/plan-contract.md`, `plugins/fgOS/skills/_shared/plan-contract.md`
  (rendered by `npm run build:skills` only, never by hand)
- `plans/261125-1259-plan-check-regenerated-census/plan.md` (Progress lines only)

## Steps

1. In `scripts/plan-contract-check.mjs`, give `activeOverlaps(results, { regenerated = [] } = {})`
   a list of repo-relative paths. Before the pair scan, drop from each active plan's
   footprint every entry that equals one of those paths exactly (after the same
   canonicalization the write-scope package applies, through
   `nativeDoor().writeScope('canonicalize', ...)`). Only exact entries are dropped: a
   directory or glob claim that contains a regenerated file stays as written, so it still
   meets a claim of that file. A plan left with an empty footprint takes no part in the scan.
2. Read the list once in `main` through `readConfig({ projectRoot, sections: ['land'] })`,
   from `value.land?.regenerate?.files ?? []`, where `projectRoot` is the repository that
   holds the script (two levels up from it). Pass it to every `activeOverlaps` call, in the
   `--plan` and the `--all` branches (`checkAll` takes it through as an option). A config
   that `readConfig` refuses ends the run with exit 2 and the message, as other unreadable
   input does. Do not name the census anywhere in the script.
3. In `test/scripts/plan-contract-check.test.mjs`, extend the existing cross-plan overlap
   test (do not add a second overlap section): with `regenerated: ['gen/census.json']`, two
   active plans sharing only `gen/census.json` have no overlap; sharing it and `src/a/x.mjs`
   still overlap; a claim of `gen/` still overlaps a claim of `gen/census.json`. Add one
   wiring case that runs `main(['--plan', ..., '--root', tmp])` on a `ready` and a `running`
   plan both naming `packages/git/contracts/mutation-census.v1.json` and asserts `ok` with no
   overlap line, which proves the config is read. Titles name behaviour, with no plan or
   phase ids.
4. In `core/skills/_shared/plan-contract.md`, add to the "Cross-plan footprint overlap" line:
   a file the land door regenerates (`land.regenerate.files` in the project config) is not
   counted, because the land regenerates it instead of merging it; a plan need not claim it.
   Run `npm run build:skills` and commit the two renders it rewrites.
5. Do not commit `packages/git/contracts/mutation-census.v1.json`; the land door regenerates
   it. If the census test is run locally, regenerate it in the worktree
   (`node scripts/git-one-door-scan.mjs --write-census`) and restore it afterwards with
   `git -C <worktree> checkout -- packages/git/contracts/mutation-census.v1.json`.

## Verify

```bash
rg -n "mutation-census" scripts/plan-contract-check.mjs   # prints nothing
node scripts/run-tests.mjs test/scripts/plan-contract-check.test.mjs
node scripts/plan-contract-check.mjs --all                # no new error from this change
npm run build:skills && git diff --exit-code .agents/skills plugins/fgOS/skills
```

Pass: `rg` prints nothing; the test run exits 0; `--all` shows no error the base commit did
not show; the renders match their source.

## Rollback

Revert the phase commit. The land of the revert regenerates the census.
