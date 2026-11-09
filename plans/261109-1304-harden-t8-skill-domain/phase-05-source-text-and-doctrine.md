---
phase: 05
title: "Source text and doctrine: the dead skill name leaves every machine-read contract, two dead fragments go, the coding doctrine file loses its foreign managed block and duplicated prose, domain doctrine is read from the running payload only (Q4 a); source only, no render"
status: pending
depends_on: []
parallel: "group A; lands only as part of the landing unit with P09's distill commit and P12"
effort: ~1d
net_size: "Node 0 / Rust 0 / tests 0; source text about -280 lines (fragments -200, doctrine -80); generated about -600 (P12)"
---

# Phase 05 - Source text and doctrine (T8-06 text, T8-11, T8-13, T8-23 text, Q4 a)

## Context

Owner decision 79 Q4 (a): "domain doctrine is read only from the running fgOS payload; no project extension". Arbitration T8-06 (dead name `fgos-coding-compounding` in machine-read contracts that the doctor judges against itself: `checkAgentClaimsResolve` compares a name with a name), T8-11 (foreign managed block and duplicated prose in `domains/coding/AGENTS.md`), T8-13 (two dead fragments), T8-23 text (a plugin command named as if it were a skill), L-7 (the delete-only edits in Work-adjacent skills are made here with WORK told, not waited on).

**Source only.** No render here (L-8): every edit to a skill source re-renders three trees and two census hashes per file, and `build:skills` is P12's alone. The hand-authored plugin commands are edited here because the render never writes them.

Re-grep result on `87e4d1e6f` (the arbitration listed `retro-next` only): `fgos-coding-compounding` is named in `core/skills/fgos-routing/SKILL.md`, `core/skills/fgos-indexing/SKILL.md`, `core/task-specs/fgos-indexing.md`, `core/agents/fgos-placeholder.yaml`, `core/agents/docs-manager.yaml`, `domains/coding/task-specs/compound-learn.md`, `domains/coding/skills/fgos-coding-implement/SKILL.md`, and in `plugins/fgOS/skills/` the hand-authored `retro-next/SKILL.md` and `retro-loop/SKILL.md` plus generated mirrors (`fgos-coding-implement`, `fgos-routing`, `fgos-indexing`: P12 re-renders those). The live name is `fgos-coding-knowledge` (`domains/coding/workflows/feature.yaml` already uses it).

## Requirements

1. **Rename the dead skill.** In every source above, `fgos-coding-compounding` -> `fgos-coding-knowledge`, reading each site first (a sentence about "compounding" may need rewording, not a substitution). `rg -c "fgos-coding-compounding" core domains plugins/fgOS/skills/retro-next plugins/fgOS/skills/retro-loop` returns nothing after; the generated mirrors are zero after P12 (acceptance 3 checks the whole tree there).
2. **Two dead fragments.** Delete `domains/coding/skills/_shared/coding-cell-policy.md` (110 lines) and `core/skills/_shared/private-cell-worktree.md` (90 lines). Re-check for readers first (`rg -n "coding-cell-policy|private-cell-worktree" .` over source, plugins, docs, tests); the arbitration found none outside `skill-wrappers.test.mjs:464`, which P01 retires. **Keep `core/skills/_shared/catchup-self-recovery.md`**: seven live readers in hand-authored plugin commands (`plugins/fgOS/skills/approve/SKILL.md:163,221`, `merge-loop/SKILL.md:86,139`, `merge-next/SKILL.md:70,76`, `merge-loop/references/blocked-pick-decision-tree.md:66`).
3. **Coding doctrine file.** `domains/coding/AGENTS.md` (89 lines): delete the GitNexus managed block (`:46-89`, 44 lines, committed 2026-08-20, "19129 symbols", says "MUST run impact analysis" while the root capability gate says "0 providers: inactive") **after** checking that `gitnexus analyze` does not rewrite a subdirectory `AGENTS.md` (read the tool's behaviour with a scratch run in a scratch copy; if it does, exclude the path in its config instead of leaving the block). Delete the prose of `:9-44` that duplicates `domains/coding/instructions/worktree-safety.md` (already projected into the AGENTS.md managed block): diff-check each rule against that file and the projection **before** deleting; a rule present only here moves into `worktree-safety.md` and the projection test stays green. Target file at most 9 lines.
4. **T8-23 wording.** `domains/coding/skills/fgos-coding-shaping/SKILL.md:20` names the plugin command `fgos-discover` as if it were a skill: reword so it says what it is (WORK told).
5. **Q4 (a), doctrine from the payload only.** `core/skills/fgos-routing/SKILL.md:180-181,232` tell an agent to read `domains/<domain>/AGENTS.md` by a relative path, which in another project means the project's own file. Change them so the doctrine is read from the running fgOS payload, never the project cwd, and the text says so in one sentence. Step 1 of this requirement: look for an existing verb or `doctor` output that reports the payload root (`fgos --help`, `fgos doctor --json`, `rg -n "payloadRoot|OWN_PAYLOAD_ROOT" src bin`). If one exists, the skill names it. If none does, the skill states where the doctrine is (the payload of the running `fgos`) and the report records "no verb gives the root: idea F-2 (about +30 Node) is the owner's choice" as unresolved question 3 of the plan; **no verb is added** (RUL104; decision 79 Q4 scope).
6. **Do not edit** `core/skills/distill/scripts/` (P09), `src/` (other phases), or any WORK file listed in plan.md except the three text lines above.

## Files

**Create:** none.

**Modify:** the sources in requirement 1; `domains/coding/AGENTS.md`; `domains/coding/instructions/worktree-safety.md` only if a rule moves; `domains/coding/skills/fgos-coding-shaping/SKILL.md`; `core/skills/fgos-routing/SKILL.md`; `CHANGELOG.md` (one line: domain doctrine is read from the fgOS payload, not the project).

**Delete:** the two fragments; the managed block and duplicated prose of `domains/coding/AGENTS.md`.

**Tests to retire:** none (doctrine text has no test; the AGENTS.md projection test and `test/runner/dead-vocabulary-guard.test.mjs` stay green and are the proof that nothing moved).

**Cross-lane one-liners:** the text lines in `fgos-coding-implement`, `fgos-coding-shaping`, `fgos-routing` are WORK-adjacent: WORK told before merge.

## Red tests first

Text phase: the recorded failing scan is `rg -c "fgos-coding-compounding" core domains plugins` before (12 files), after (0 in sources); `wc -l` of the two fragments and of `domains/coding/AGENTS.md` before and after. The doctor-side proof (a dead claim is refused) is P06's test; this phase makes the contracts it judges true.

## Net size

Source text about -280 (fragments -200, doctrine -80), Node 0, tests 0. The two generated copies of each fragment disappear at P12 (about -600).

## Steps

1. Re-grep both name searches; read each site; the `gitnexus analyze` behaviour check; the doctrine diff-check table (rule -> where it lives now) in the report.
2. Message WORK (the three text files) and COOK (`core/skills/_shared` deletions: they own `coordination-driver.md` siblings) before merge.
3. Edits; CHANGELOG; census (hashed skill sources regenerate their entries; the render copies wait for P12 and the census regen is P12's single one: here only the source hashes that change).
4. Report.

## Validation (focused)

- FR `test/runner/dead-vocabulary-guard.test.mjs test/scripts/doc-health.test.mjs test/scripts/check-decision-citation-drift.test.mjs test/setup/instruction-projections.test.mjs test/skills/fgos-coding-knowledge.test.mjs test/state/domain-registry.test.mjs` (the last two are WORK's: run, never edit).
- `node scripts/git-one-door-scan.mjs --root .`
- Full land gate. Note: the `skill-wrappers.test.mjs` drift guard compares sources with renders, so it is red on this phase's own tip until P12 renders. P05 is part of the landing unit (P05, the P09 `distill` commit, P12; see plan.md Landing): its lead proves the gate on a branch that carries P12's render, and the big lead merges the unit as one fast-forward. `build:skills` is never run here (L-8).
## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| The drift guard is red on P05 alone | H x M | Landing unit with P12 (fast-forward, gate on the tip); the lead says so on the board and does not push P05 alone |
| A deleted fragment has a reader the grep missed | L x M | Grep across source, plugins, docs, tests; 3-line report of the search; a hit keeps the file |
| `gitnexus analyze` rewrites the doctrine block back | M x L | Scratch-copy run before the delete; else exclude the path |
| A rule lives only in the duplicated prose | M x M | Rule-by-rule diff table; a unique rule moves to `worktree-safety.md` |
| The doctrine path wording sends an agent to a path it cannot open | M x M | Unresolved question 3; the sentence states the rule and the report names the missing verb |

## Rollback

Revert the merge commit (and P12's if it landed with it). The doctor row reads the dead name on both sides again, as before.

## Done when

Sources name no dead skill; fragments gone; doctrine file at most 9 lines with the diff table in the report; routing text states the payload rule; WORK and COOK told; guide section written.

## Lead brief essentials

Text only, no `build:skills`, no `src/`. A kept fragment is named with its readers. All plan.md lead rules apply.
