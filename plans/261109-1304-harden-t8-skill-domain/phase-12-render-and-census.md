---
phase: 12
title: "Render and census: one npm run build:skills with the staged addon over every source change, one census regeneration, a second run that writes nothing, and the one tracked-render assertion; lands as one unit with the source-text phases"
status: pending
depends_on: [01, 02, 03, 04, 05, 09, 11]
parallel: "group E, alone"
effort: ~0.5d
net_size: "Node 0 / Rust 0 / tests +5; generated about -4 300 with the Q2 pass (about -900 on the fail branch)"
---

# Phase 12 - Render and census (L-8, L-4)

## Context

Every edit to a skill source (`core/skills/**`, `domains/*/skills/**`) changes its render in three trees (`.agents/skills`, `.claude/skills`, the mirror part of `plugins/fgOS/skills`) and two census hashes per file (`packages/git/contracts/mutation-census.v1.json`, 133 skill hashes; 66 are renders of scanned sources). Lead decision L-8: one render-and-census step per wave, never per lane, because parallel lanes would collide on generated files. `skill-wrappers.test.mjs`'s drift guard compares sources with renders, so **a phase that edits a skill source cannot land alone**: P05 (text, fragment deletions) and the `distill.mjs` commit of P09 (a source file under `core/skills/distill/scripts/`) change what the render must produce.

**Landing unit.** P05, the P09 `distill` commit and P12 are pushed together as one fast-forward of consecutive commits (gate run on the tip), in one announced window. The intermediate commits are red against the drift guard but never published on their own. Every other phase lands independently as soon as its gate passes.

The gate for running `build:skills` in a linked worktree (`harden/skip-worktree-writer`) landed as `115128df2`; P12 may run it in its own worktree. The script stages the git addon itself and refuses before its first write (`6f98ce04a`).

## Requirements

1. **Start only when every dependency is on `origin/main`** (P01-P04, P11 landed; P05 and P09's distill commit on the lead's branch ready for the unit). Rebase; `git log origin/main..HEAD`.
2. **One render.** `npm run build:skills` once, with the addon staged (the script does it). Record the output counts. **Second run writes nothing** (`git status` identical, the script prints no `wrote`/`assembled` line that changed a byte; "instruction projections already up to date"). A third run on a clean clone of the result is optional.
3. **Expected diff, nothing else (RT-7).** Compare `git status` and `git diff --stat` to the list this plan predicts: renamed skill text (P05) in `.agents/skills` and the plugin mirror and the three wrappers' sources; the two deleted fragments (`.agents/skills/_shared`, 2 files); `.claude/skills/instruction-audit/SKILL.md` newly tracked (+18 lines); `.agents/skills/distill/scripts/distill.mjs` changed; on the Q2 pass branch the 29 `.claude` reference copies (3 393 lines) deleted, on the fail branch none. Any other changed path is explained or reverted before commit.
4. **Census.** `node scripts/git-one-door-scan.mjs --write-census`; the diff is the changed and deleted skill hashes and the P09 script line if P09 has not already taken it (about -4 hashes for the fragments, per arbitration T8-13). OPC glances at the census diff.
5. **One assertion.** In `test/skills/fgos-mirror.test.mjs`, add "every owned skill has a tracked `.agents/skills/<name>` and `.claude/skills/<name>/SKILL.md`", over `ownedFileSet` and `ownedSkillNames`, now true for `instruction-audit` (the render exists in this commit). No exception list.
6. **Scans.** Acceptance criteria 3 (the doors scan of `plan.md`) are run here on the rendered tree, including `rg -c "fgos-coding-compounding" core domains plugins` returning nothing (generated mirrors included).

## Files

**Create:** `.claude/skills/instruction-audit/SKILL.md` (a render output).

**Modify:** generated surfaces per requirement 3; `packages/git/contracts/mutation-census.v1.json`; `test/skills/fgos-mirror.test.mjs` (one test); `CHANGELOG.md` only if a phase missed a line.

**Delete:** the two fragment renders; the 29 `.claude` reference copies (Q2 pass).

**Tests to retire:** none.

**Cross-lane one-liners:** none. Generated files are written only by this phase.

## Net size

Generated about -4 300 with the Q2 pass (references -3 393, fragments -600 across renders, `instruction-audit` +18, text edits about 0), about -900 on the fail branch. Tests +5.

## Steps

1. Confirm dependencies; rebase; check no other lane touches generated files (board).
2. Build, compare the diff to the prediction, build again.
3. Census, assertion, scans.
4. Land the unit (P05 + P09 distill + this) in one announced window; build, stage, activate the release on fg-server2; `fgos doctor`; smoke.
5. Report.

## Validation (focused)

- FR `test/setup/skill-wrappers.test.mjs test/skills/fgos-mirror.test.mjs test/scripts/check-decision-citation-drift.test.mjs test/scripts/doc-health.test.mjs test/architecture.test.mjs test/runner/dead-vocabulary-guard.test.mjs`
- `node scripts/git-one-door-scan.mjs --root .` -> 0 undeclared. Full land gate on the tip.
- Second `build:skills` writes nothing.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| RT-7: a late rebase changes a source after the render | M x M | Render last; `git status` empty after a second run; any unexpected path explained |
| The drift guard is red on an intermediate commit of the unit | H x L | Pushed as one fast-forward with the gate on the tip; no intermediate is published alone |
| The census regen collides with a Git-lane commit | M x L | Rebase-only; regenerate on rebase (the scan is deterministic) |
| A parallel lane edits a skill source during the window | L x M | Board HOLD line for skill sources during the window; the lead reads the board before building |

## Rollback

Revert the unit (three commits) in one revert; re-activate the previous release on both machines (id in the guide).

## Done when

One render, a second run that writes nothing, the diff equal to the prediction, census 0 undeclared, the assertion green, acceptance-3 scans clean, the release activated on fg-server2, guide section written.

## Lead brief essentials

The only phase that runs `build:skills`. Predict the diff before the run; explain every other path. All plan.md lead rules apply.
