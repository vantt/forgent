---
phase: 13
title: "Spec, measure, close: Part A shapes and the settled rules into the two owning docs, contract and alignment rows, CHANGELOG, backlog items, re-measure on the activated release, Vietnamese owner guide finished, closing report, layer net size at or below zero"
status: pending
depends_on: ["01-12 landed"]
parallel: "close"
effort: ~1d
net_size: "Node 0 / Rust 0 / tests 0"
---

# Phase 13 - Spec, measure, close

## Context

Per-layer loop steps 7-9 ([HARDEN plan](../261021-1118-harden-low-layers-bottom-up/plan.md#the-per-layer-loop)); arbitration lead decision L-2 (no new spec file: the shapes go into the two docs that already own the layer) and Q8 (a) (Part A shapes approved).

Docs read on `87e4d1e6f`: `docs/platform/packaging-distribution/contracts/skill-package-distribution.md` (render, surfaces, guards, provisioning; its Gemini rows are edited by P01, the rest is here), `docs/platform/domainization/architecture/domainization.md` (domain data and doctrine), `docs/platform/packaging-distribution/verification/implementation-alignment.md` (alignment rows), the contract's section 9 doctor rows (stale after T8: `agent-claims-resolve`, `executor-skills-installed`, `domain-registry-compiled` judge more; no row added or lost).

## Requirements

1. **DOC first:** message the DOC lead with the two doc paths, the alignment file and the change list; wait for an ack line or one working day before merging (plan rule).
2. **Spec Part A** (link the arbitration, do not copy it), settled by decision 79:
   - `skill-package-distribution.md`: the render door (`renderSkillSurfaces`) and its order (owned set and instruction projection computed first, any refusal leaves the tree untouched); the one owned-name door (`ownedSkillNames`) and the rule that render, setup and the plugin mirror write only owned names; the same-name refusal and the anchored stamp; the link refusal; the fixed point; the `.claude` reference copies per the **Q2 result** (state the probe, its date and the path the seat opened); `.gitignore` allowlist agrees with the owned set (the test); worktree provisioning is kit-agnostic (the rule, the five roots, `git check-ignore` as "not fgOS-owned", the probe result for hardlink, the bytes and time per worktree); Gemini not provided (P01's rows, wording checked); setup copy filter comes from the package root alone; section 9 doctor rows updated; one trust line: setup and render refuse what they cannot prove they wrote.
   - `domainization.md`: domain data and doctrine; doctrine is read only from the running payload (Q4 a), the sentence and the verb question (F-2) if open; one `listDomainDirs`; `compiled.json` equals its compile, no orphan, no duplicate workflow key.
   - A decision-history entry for decision 79 in the owning docs' "Lịch sử quyết định" sections (narrative, ids glossed), resolved through `docs/platform/governance.md#decision-scope-to-holder-table`.
   - One **limit line**: a foreign dir that carries fgOS's own marker is treated as fgOS's; the T9 setup retirement removes that surface.
3. **Stale text out:** `implementation-alignment.md` Gemini rows; the contract's Gemini rows (check P01's edit read right); `.gitignore`-related prose if any; the "reference files mirrored into `.claude`" line if Q2 passed.
4. **Backlog and items (ids from `fgos identity mint backlog`):** the WORK item for `src/state/domain-registry.mjs:72` (filed by P11, checked here); OPC idea F-9 (skip generated `.agents/skills/**` in `git-one-door-scan`); T9/Packaging items (R-9 `npm pack` list, `materializeSkillsIntoProject`/`createProjectSkillGuard` go when `fgos setup` retires); the P09 T8-10 OPC item if the Git port had no flag; idea F-2 (doctrine path verb) if P05 found none; the leftovers of decision 79 are not T8 rows and are not filed here. Mark done with commits: the T8 rows that already exist, if any.
5. **Cross-lane checks:** WORK, COOK, TEST told as planned (board lines present); OPC reviewed P09 and P12 census diffs; the owner-machine `.fgos/config.yaml` line of P10 applied on fg-server2 (report) and the guide tells forgentX and fg-server.
6. **Re-measure** on the activated release, fg-server2, load class of the baseline (record the load): the 22 T8-owned test files (the list the speed seat used; reuse its command) at quiet load, total ≤ 13 s; warm `npm run build:skills` ≤ 1.5 s and a second run writes nothing; `fgos worktree create` time and bytes before (8 759 files, 89 MB, 3.7 to 4.4 s) and after (state plainly if unchanged); `wc -l` per component against the Target shapes table (`skill-wrappers.mjs` ≤ 780, scripts and doctrine budgets) and the function-length scan (none over 130 in `skill-wrappers.mjs`); tracked generated line count (24 069 before); `fgos doctor --json` rows of the layer (ids and count unchanged); `rg` scans of acceptance criterion 3.
7. **Net size:** `git show --numstat` over HARDEN T8 commits (from `6f98ce04a` through P12) per language; each at or below zero, else every increase names its paying deletion. The estimate to check: Node about -1 040, Rust 0, tests about -2 870.
8. **Closing report** (`fgos convention name --kind report --type closing --slug harden-t8-skill-domain --json`): before/after table, acceptance criteria 1-8 with evidence, what moved where, open items handed off; HARDEN plan T8 layer row and one board line.
9. **Guide** finished (Vietnamese; every phase section; the P10 config line and which machine applies it; the Q2 probe result in plain words; the rollback notes from the "On-disk and behaviour changes" table).
10. Citations: `test/scripts/check-decision-citation-drift.test.mjs` and `test/scripts/doc-health.test.mjs`.

## Files

**Modify:** `docs/platform/packaging-distribution/contracts/skill-package-distribution.md`, `docs/platform/domainization/architecture/domainization.md`, `docs/platform/packaging-distribution/verification/implementation-alignment.md`, `docs/backlog.md`, `CHANGELOG.md` (only if a phase missed a line), the HARDEN plan's T8 row (`plans/261021-1118-harden-low-layers-bottom-up/plan.md`), board `log.md` line (read its "Các luồng" and "File chung dễ va" first, as the repo rule says).

**Create:** the closing report; the guide (if not created at the first landing).

**Delete:** stale spec text listed above.

**Tests to retire:** none.

## Steps

1. DOC message. 2. Spec and contract text. 3. Backlog items. 4. Measure. 5. Net size. 6. Report, guide, board, HARDEN plan row.

## Validation

- FR `test/scripts/doc-health.test.mjs test/scripts/check-decision-citation-drift.test.mjs test/skills/fgos-mirror.test.mjs`, then the full suite.
- Links in every edited doc resolve (doc-health).

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Spec edit collides with DOC | M x L | DOC told first; rebase-only |
| Measurement under load misleads | M x M | Load recorded; repeat at low load; estimates labelled as such |
| Net size above zero in one language | L x M | Every increase names its paying deletion (the estimate is well below zero) |
| Spec states a probe result that a later render invalidates | L x L | The doc cites the probe date and the test that now holds the behaviour |

## Rollback

Revert the docs commit; no code.

## Done when

Acceptance criteria 1-8 of plan.md each shown with evidence in the closing report; layer net at or below zero in every language; owner-machine guide linked on the board; HARDEN plan T8 row closed.

## Lead brief essentials

Write what was settled, gloss every id, link do not copy. All plan.md lead rules apply.
