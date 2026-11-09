---
phase: 09
title: "Small scripts: delete the script whose engine is gone, make distill refuse a path-escaping name, write AGENTS.md through the durable door, refuse an effective-set write that would strand a worktree"
status: landed
depends_on: []
parallel: "group A; the distill commit lands with P12 (landing unit, see plan.md)"
effort: ~1d
net_size: "Node about -447 / Rust 0 / tests about +8 (estimate)"
---

# Phase 09 - Small scripts (T8-12, T8-21, T8-18, T8-10)

## Context

Four independent, small items that share no file with another phase.

- **T8-12 (L-6).** `scripts/measure-coordination-baseline.mjs` (464 lines) imports `src/runner/coordination/replay.mjs` (`:11`), which does not exist (gone since `2180b4e72`); it cannot run. Its only references: `test/runner/assignment-enumerator-guard.test.mjs:114-115` (two exception rows) and `packages/git/contracts/mutation-census.v1.json:876`. `git log` keeps the script as history.
- **T8-21 (R-7).** `core/skills/distill/scripts/distill.mjs:123-125` and `:287` build a clone path from a skill-supplied name; `../../../escaped` wrote outside the learning area (reproduced by the red-team seat). `distill` has no test file.
- **T8-18.** `src/setup/instruction-projections.mjs:339-345` writes the repo `AGENTS.md` in place with `writeFileSync`; the durable door is `replaceDurably` (`src/native/door.mjs:105`).
- **T8-10.** `src/setup/instruction-projections.mjs:341-343` writes `.fgos/instructions/effective/repo.json`, which is `skip-worktree` in every linked worktree, so a lane's regenerated effective set is never staged and main goes stale. The removal side of the stranded-worktree problem is fixed by `115128df2` (landed); only the writer side is left.

Reused doors: `replaceDurably`; the Git port if it already reports the skip-worktree flag (unresolved question 5 of the plan); the compute-first order of `renderSkillSurfaces` (`skill-wrappers.mjs:1401`, `computeInstructionProjection` before the first write, landed in `6f98ce04a`): the refusal of T8-10 goes in that already-ordered place, so it needs nothing from P02.

## Requirements

1. **T8-12.** Delete `scripts/measure-coordination-baseline.mjs`, the two exception rows in `test/runner/assignment-enumerator-guard.test.mjs:114-115`, and the census line. Verify no other reference (`rg -n "measure-coordination-baseline" .` over source, tests, docs, `package.json`; a docs mention is edited or removed). The census is regenerated (`node scripts/git-one-door-scan.mjs --write-census`) and **OPC glances** at the diff.
2. **T8-21.** In `distill.mjs`: the name must match `^[a-z0-9][a-z0-9-]*$` (refused by name otherwise); the printed line is `git clone -- <url> <dir>` (the `--` closes option parsing); `add` refuses a URL that is not `https://`, `ssh://` or `git@`. No new test file for a skill script (principle 8): the refusal is proven by one scratch run recorded in the phase report (command and output), and the behaviour is the script's own.
3. **T8-18.** The `AGENTS.md` write goes through `replaceDurably`, not `writeFileSync`; existing write cases stay as the proof.
4. **T8-10.** When the effective-set path is `skip-worktree` in this checkout and its content would change, refuse by name ("regenerate in the main checkout") before any write. **Step 1 of this item** answers whether the Git port already reports that flag (`rg -n "skipWorktree|skip-worktree|ls-files -v" src packages/git`): if yes, use it; if no verb answers, **file an item for OPC instead of adding a port verb** (RUL104), and this item reduces to the documented refusal text only if the flag is readable some other way the lead can justify; otherwise it is closed as "filed". Test: `test/setup/instruction-projections.test.mjs`.

## Files

**Create:** none.

**Modify:** `src/setup/instruction-projections.mjs`, `test/setup/instruction-projections.test.mjs`, `core/skills/distill/scripts/distill.mjs`, `test/runner/assignment-enumerator-guard.test.mjs` (two rows), `packages/git/contracts/mutation-census.v1.json`, `CHANGELOG.md` (T8-10 only if user-visible).

**Delete:** `scripts/measure-coordination-baseline.mjs`.

**Tests to retire:** the two exception rows of `assignment-enumerator-guard.test.mjs` (behaviour removed with the script). No other.

**Cross-lane one-liners:** none. `distill.mjs` is under `core/skills/`, so its render copy (`.agents/skills/distill/scripts/distill.mjs`) changes with P12; it belongs to the landing unit with P05 and P12.

## Red tests first

- T8-18/T8-10: a projection write cases in `instruction-projections.test.mjs`: the effective set is refused by name when the path is skip-worktree and would change (red today: written); the existing write case still passes with the durable write (a read of the temp file name pattern proves no partial `AGENTS.md`).
- T8-21: scratch run of `distill.mjs add ../../../escaped <url>` recorded red (writes outside) before, refused after.
- T8-12: recorded failing scan: `node scripts/measure-coordination-baseline.mjs` exits with a module-not-found error today (the evidence that it cannot run).

## Net size

Node about -447 (script -464, T8-10 +6, T8-18 +3, T8-21 +8); tests about +8 (T8-10 +10, enumerator rows -2).

## Steps

1. Scan references for the script; delete it with its rows and census line.
2. `distill.mjs` rules and the scratch-run evidence.
3. `replaceDurably` write.
4. T8-10 per the Git-port finding; otherwise file the OPC item.
5. Census; report.

## Validation (focused)

- FR `test/setup/instruction-projections.test.mjs test/runner/assignment-enumerator-guard.test.mjs test/scripts/doc-health.test.mjs`
- `node scripts/git-one-door-scan.mjs --root .` -> 0 undeclared. Land gate. **No `build:skills`** (P12).

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| A tool or doc still names the deleted script | L x L | `rg` across the repo before delete; docs reference edited or removed |
| `distill` name rule refuses a name in use | L x M | List existing learning-area names (`distill.mjs status --repo`) before the rule; a name that fails is reported to the owner, not renamed here |
| T8-10 needs a port verb that does not exist | M x L | File an item for OPC; no new verb |
| The census diff is large because the script had a hash | L x L | One line; OPC glances |

## Rollback

Revert the merge commit; the script returns (it could not run before either).

## Done when

Script gone with its rows and census line; distill scratch evidence recorded; AGENTS.md written durably; T8-10 done or filed with reason; guide section written.

## Lead brief essentials

Four small items, one commit each. All plan.md lead rules apply.
