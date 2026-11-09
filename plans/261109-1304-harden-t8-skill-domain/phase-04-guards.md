---
phase: 04
title: "Guards: the mirror test judges owned names over ownedFileSet and every owned skill has a tracked render in both trees, instruction-audit tracked under .claude, the citation guard stops sweeping .agents/skills, its CLI cases run in process"
status: landed
depends_on: []
parallel: "group A; P03 fail branch appends to fgos-mirror.test.mjs after this lands"
effort: ~0.5d
net_size: "Node -12 / Rust 0 / tests +10 (estimate); baseline JSON -65 lines; .gitignore +1"
---

# Phase 04 - Guards (T8-07, T8-08, T8-22, L-4)

## Context

The two drift guards stopped judging `ak-*` vendor dirs in `27b2c580c`. Three residuals (arbitration T8-07, T8-08, T8-22) and lead decision L-4.

- `test/skills/fgos-mirror.test.mjs:48` selects skills by `startsWith('fgos-')`, so `distill`, `instruction-audit` and `_shared` renders are compared by nothing (0 drift today).
- `.gitignore:68-79` re-includes `/.agents/skills/instruction-audit/` but not `/.claude/skills/instruction-audit/`, so a fresh checkout has no Claude render of an owned skill; `core/skills/instruction-audit/SKILL.md:1-12` is a generic repo-audit skill for any project (L-4: track it, like every other owned skill).
- `scripts/check-decision-citation-drift.mjs:321` `WIDE_SWEEP_ROOTS` still contains `.agents/skills`; `collectWideSourceFiles` (`:340`) has no owned filter, so `fgos decision --relation` (`bin/fgos.mjs`, `retrospective-doors.mjs`) reads 104 vendor dirs (19 MB). The comment above it (`:307-320`) still calls `.agents/skills` "the canonical dev-skill source".
- `test/scripts/check-decision-citation-drift.test.mjs` spawns the CLI about 12 times (about 1 s each at load 40).

Reused doors: `ownedSkillNames` (exported, `src/setup/skill-wrappers.mjs:163`; read-only here, P01-P03 are editing that file, this phase only imports an existing export) and `ownedFileSet` (`scripts/lib/git-ports.mjs`).

## Requirements

1. **`fgos-mirror` over owned names.** Iterate the owned names (from `ownedSkillNames(root)`) over `ownedFileSet`, not `startsWith('fgos-')`. The compare then covers `distill` and `instruction-audit` as well as `fgos-*`; the "every owned name has a tracked render" assertion is P12's (requirement 2). The failure text names the `.gitignore` allowlist when the file exists but is untracked.
2. **`.gitignore` agrees with the owned set.** Add `!/.claude/skills/instruction-audit/` beside `:70-71`. One test in `fgos-mirror.test.mjs` proves `.gitignore`'s per-name allowlist and `ownedSkillNames` name the same set: it fails when a source skill is added without its allowlist lines and when an allowlist line has no source (`.gitignore` cannot compute the set; the allowlist stays, arbitration §2.2). The assertion "every owned skill has a tracked `.agents/skills/<name>` and `.claude/skills/<name>/SKILL.md`" of requirement 1 is added by P12 in the same commit as the `instruction-audit` render (it would be red on `main` before that render exists, and no exception list or test-only branch is added to hide it). P04 lands the `.gitignore` line, the allowlist-agreement test and the owned-name iteration, all green on today's tree.
3. **Citation guard.** Remove `.agents/skills` from `WIDE_SWEEP_ROOTS` (`:321`), the false claim in the comment `:307-320`, and the 59 baseline entries under `.agents/skills` from `scripts/check-decision-citation-drift.baseline.json` (confirm first, by the node script the arbitration used, that each of the 5 files has its byte twin under `plugins/fgOS/skills` and the entries have 0 unique citations: RT-5). Node about -12, baseline JSON about -65.
4. **In-process cases (T8-22).** Cases of the drift test that do not exercise the CLI contract call the module in process; one CLI wiring proof stays (principle 8). Measure the file before and after at the same load class and report; the arbitration's -3 to -4 s at quiet load is an estimate, not a promise.

## Files

**Create:** none.

**Modify:** `test/skills/fgos-mirror.test.mjs`, `scripts/check-decision-citation-drift.mjs`, `scripts/check-decision-citation-drift.baseline.json` (confirm the exact name with `ls scripts | grep citation`), `test/scripts/check-decision-citation-drift.test.mjs`, `.gitignore`, `CHANGELOG.md` only if user-visible (it is not; skip), census.

**Delete:** the `.agents/skills` sweep root, its comment, its 59 baseline entries.

**Tests to retire:** none; in-process conversion keeps each behaviour's owning case and one CLI wiring case. Name any case dropped as a duplicate, with its owner.

**Cross-lane one-liners:** none.

## Red tests first

Allowlist-agreement test red on today's tree (`instruction-audit` has no `.claude` allowlist line), green with the `.gitignore` line; the owned-name iteration red when a `distill` or `instruction-audit` render is made to differ in a scratch root (mutation of one byte in a scratch copy, not in the tree); `collectWideSourceFiles` returns no `.agents/skills` path (red first by a one-line assertion).

## Net size

Node about -12, baseline JSON about -65 lines, tests about +10 (+20 mirror, +2 message, -12 net from in-process conversion; measured), `.gitignore` +1.

## Steps

1. Twin check for the 59 entries; red tests.
2. `fgos-mirror` rewrite, `.gitignore` line, allowlist-agreement test.
3. Citation guard edit and baseline; in-process conversion; before/after timing.
4. Census (the script is hashed); report.

## Validation (focused)

- FR `test/skills/fgos-mirror.test.mjs test/scripts/check-decision-citation-drift.test.mjs test/scripts/doc-health.test.mjs`
- `fgos decision --relation` smoke on the real repo (reads fewer files; same output on a known id).
- Full land gate.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| RT-5: a citation in `.agents/skills` has no twin and is now unguarded | L x M | Twin comparison before deleting the entries; any entry with no twin stays and is named |
| The `.claude/skills/instruction-audit` render only exists after P12 | M x L | The existence assertion is added by P12 with the render; P04 adds no exception list |
| In-process conversion changes what a test proves | M x M | Each converted case keeps its assertion; the one CLI wiring case stays |

## Rollback

Revert the merge commit; `.gitignore` and the baseline return to their previous bytes.

## Done when

Allowlist agreement green; `fgos-mirror` judges owned names; no `.agents/skills` sweep; baseline shrunk with 0 unique citations lost; before/after test time reported; guide section written.

## Lead brief essentials

Import `ownedSkillNames`, never copy it; do not edit `skill-wrappers.mjs`. All plan.md lead rules apply.
