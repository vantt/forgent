---
phase: 4
title: "Docs, decision record, changelog, full verification"
status: completed
priority: P1
effort: "2h"
dependencies: [2, 3]
---

# Phase 4: Docs, decision record, changelog, full verification

## Goal

The change is documented where a stranger agent will look (L5), and the test
suite in a worktree without `node_modules` has no yaml-caused failure left and
no new failure.

## Files

- Modify: `CHANGELOG.md` (`[Unreleased]`)
- Modify: the owning spec's decision history (find via `docs/specs/reading-map.md`;
  likely `docs/specs/distribution.md` for the dependency/payload fact)
- Modify: `docs/specs/*` facts that cite the `yaml` package or "doctor must
  load without node_modules" as a reason for hand parsing
  (`grep -rn "yaml package\|node_modules" docs/specs`)
- Modify: `docs/backlog.md` (item: remove `legacyPersonaProjection` once no
  pre-change pins can exist; item: watch js-yaml advisories, since `npm audit`
  no longer sees it)

## Steps

1. CHANGELOG lines: fresh checkouts, worktrees and `fgos setup` no longer need
   `npm install`; agent definitions and project workflow files must be valid
   YAML, and doctor names the file, line and column when one is not; doctor
   checks `workflow-pools-satisfy-independence` and `blind-steps-use-proven-pools`
   now evaluate in copies without dependencies; doctor reports a stale
   `compiled.json`; persona rendering shows full block-scalar descriptions.
2. Decision entry with evidence (phase commits, parity output, timing numbers):
   no npm runtime dependency; YAML only through `src/util/yaml.mjs` over
   js-yaml 5.4.3 in `src/util/third-party/`; upgrade procedure (fetch with
   `--ignore-scripts`, check `dist.integrity`, diff against the previous bundle,
   run parity, update header and hash constant); why `frontmatter.mjs`,
   `distill.mjs` and `compiled.json` stay.
3. Run `npm test` in the worktree (`test ! -e node_modules` first). Compare
   against the phase-1 baseline: every yaml-caused failure gone, no new
   failure. Failures that need an environment prerequisite unrelated to this
   change (e.g. `dev-host.test.mjs` needs a built release host binary) are
   listed as such with their message, unchanged from baseline.
4. Change-scope check: GitNexus `detect_changes` against `main` when the
   index is usable, otherwise `git diff --stat main` reviewed by module; only
   the expected modules changed.
5. Operator follow-up noted in the report: after merge, restage and activate
   the release, then run `fgos doctor` through the installed shim.

## Verification

- `npm test` comparison recorded in the phase report.
- `node bin/fgos.mjs doctor` shows no dependency-missing failure.
- `git grep -n "'yaml'" -- src bin scripts test` lists only the `findDynamicLoads` fixture string (`.fgos/state.json` holds historical verify commands; out of scope).
