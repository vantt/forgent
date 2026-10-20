# Review a38 — Step 4 wave 1, part 08 (set step04-008)

Pin reviewed: ef62747ddb0952d3cf1a3558f5ea650e77fcbe7e. 15 files, 31 slots, all mandatory (headerless host/plugin skill sources). Stratum: mandatory (no patched or unpatched sample). Every slot reviewed. Source files were read whole at the pin and checked against `sourceSpans` (columns are 1-based; all 31 spans match the physical text).

Verdict: set is **rework** (1 file-level outcome defect set: 2 missed references across 2 files). The other 13 files are ok.

## L12-58(3) check (own source owner, no generator claim, no render-path diff)

- Headerless: all 15 start at `---` frontmatter with no GENERATED/source header.
- No generator claims them: `scripts/build-skill-wrappers.mjs` calls `mirrorDevSkillsIntoPlugin` (src/setup/skill-wrappers.mjs:245), which copies only `_shared` and names starting with `fgos-` (`isMirroredDevSkillName`, line 236). The doc comment at ~line 427 names `pick`, `submit`, `deliver` as hand-authored plugin skills that are NOT generated. None of the 15 names (approve, cleanup-loop, cleanup-next, coding-shape, coding-shape-distill, deliver, discover, discover-next, merge-loop, merge-next, plan, retro-loop, retro-next, terminal, terminal-close) starts with `fgos-`, and no `.agents/skills` dir exists for them. Each is its own source owner. Confirmed.
- No diff on a render path: all 15 records have `diff: ""`, 0 patch slots, `target`/`anchor` null, `sourceRenderProvenance: []`, timing `none`. Confirmed.
- Slot dispositions: 31 preserve, 0 patch, 0 parked.

## Per file

| File | Slots | Verdict |
| --- | --- | --- |
| plugins/fgOS/skills/approve/SKILL.md | skills-132 | ok |
| plugins/fgOS/skills/cleanup-loop/SKILL.md | skills-133, 134 | **rework** (missed ref) |
| plugins/fgOS/skills/cleanup-next/SKILL.md | skills-135, 136 | ok |
| plugins/fgOS/skills/coding-shape-distill/SKILL.md | skills-137 | ok |
| plugins/fgOS/skills/coding-shape/SKILL.md | skills-138, 139 | ok |
| plugins/fgOS/skills/deliver/SKILL.md | skills-140, 141, 142 | ok |
| plugins/fgOS/skills/discover-next/SKILL.md | skills-143 | ok |
| plugins/fgOS/skills/discover/SKILL.md | skills-144..147 | ok |
| plugins/fgOS/skills/merge-loop/SKILL.md | skills-179 | ok |
| plugins/fgOS/skills/merge-next/SKILL.md | skills-180, 181 | ok |
| plugins/fgOS/skills/plan/SKILL.md | skills-182, 183 | ok |
| plugins/fgOS/skills/retro-loop/SKILL.md | skills-184, 185 | **rework** (missed ref) |
| plugins/fgOS/skills/retro-next/SKILL.md | skills-186..189 | ok |
| plugins/fgOS/skills/terminal-close/SKILL.md | skills-190 | ok |
| plugins/fgOS/skills/terminal/SKILL.md | skills-192, 193, 194 | ok (record-text note below) |

Preserve is correct for all 31 slots:
- All `docs/history/**` targets exist at the pin (CONTEXT.md / DISCUSSION.md siblings, `fgos-cleanup-loop`, `fgos-retro-loop`, `retro-next-shared-driving`, `merge-standardization`, `iron-law-gate-human-ux`, `gate-bypass`, `coding-planning-validating-gate-redesign`, `main-checkout-destructive-git-safety-net`, `discover-decompose-skill-wrapper-verdict-routing`, `fgos-terminal-close-autoclose`, `fgos-terminal-pane-rename`, `orchestrator-worker-slots`) and `docs/history` is a retained root under L12-10. The wrapped fragments (skills-136, 142, 143, 144, 146, 182, 183) are one logical occurrence across a line break and resolve to existing paths; the bare `docs/history/` prose mentions (skills-134, 137, 138) are generic directory descriptions, not path pointers.
- skills-132 / skills-179: `git show "fgw/<id>:docs/history/<id>/iron-law-evidence.md"` is a runtime branch-relative placeholder in an external-project worktree convention (L12-10), not a repo path.
- skills-139: `docs/history/<feature>/DISCUSSION.md` is a placeholder for the external-project convention (L12-10).
- skills-192: `docs/operator-runbook-herdr-cockpit.md` exists at the pin and is a retained root doc (`legacy-current maintained-authority` in the switchboard). Step 3 records for the same path (maps-j-08226 etc.) all preserve with "retained path stays literal". Preserve matches the Step 3 precedent.

## OUTCOME defects

1. **Missed reference: two live "see X" pointers to a nonexistent path are not recorded.**
   - `plugins/fgOS/skills/cleanup-loop/SKILL.md` line 31: `see \`docs/explanation/why-merge-loop-recurses-into-loop-not-ck-loop.md\`).` (census `class4-l-002026`, col 6-71, `checkedPathExists: false`).
   - `plugins/fgOS/skills/retro-loop/SKILL.md` line 36: `` `docs/explanation/why-merge-loop-recurses-into-loop-not-ck-loop.md`). `` (census `class4-l-002095`, `checkedPathExists: false`).
   - Why missed: step04-008 population is built from `step-02-census-skills-prompts.json` only. These two edges exist only in `step-02l-census-class4.json` (and 02k), where they are not joined into `step-04-population.json` rows (0 of the file's class4 refs for these two). The other 31 class4 edges for these 15 files duplicate skills-* slots one for one, so only these two fall out. Neither record's `edges` list nor any Step 3 record covers them (grep of step-03 records finds no `plugins/fgOS/skills/cleanup-loop` or `retro-loop` record).
   - Rule: prompt/owner rule for a live "see X" pointer to a nonexistent path (park as dead link) plus the Step 3 precedent "deleted targets with a findable successor get a non-executable successor note" (owner-answers L12-26/L12-47 successor lookup via doc-registry alias; `docs/explanation` is a retired root whose files moved to `docs/knowledge/**`). Under L12-58(3) the plugin file is its own owner, so any patch targets it directly.
   - Findable successor at the pin: `docs/knowledge/why-fgos-merge-loop-tsk-1sm-recurses-into-loop-not-ck-loop/why-merge-loop-recurses-into-loop-not-ck-loop.md`.
   - Correction: add two slots to the cleanup-loop and retro-loop records (inventoryRefs to `class4-l-002026` / `class4-l-002095`, spans as above). Disposition is a Lead choice between (a) `patch` (Phase 9, `timing` phase9, target = the file itself, replacement path = the `docs/knowledge/...` successor, preserving the backtick and "see" wording) and (b) `parked` with the successor named as a non-executable note. Either way both files must carry a slot for the line; "preserve" with no slot leaves a dead pointer unrecorded. Also add the matching two `edgeId`s to the step04-008 slot count (31 becomes 33) and the part/accounting totals.

No other outcome defects. No other legacy-root references exist in the 15 files: a full grep for `docs/`, `specs/`, `architect`, `plans/`, `AGENTS`, `ADR`, `.md` found only these 33 path occurrences plus relative `../_shared/*.md` and `references/blocked-pick-decision-tree.md` links (all exist inside `plugins/fgOS/skills`, not legacy roots) and `docs/journals/260803-1612-main-checkout-direct-branch-checkout-tsk-4hk.md` (deliver:82-83, file exists at the pin, `docs/journals` not retiring).

## Record-text notes (not rework)

- skills-192 (terminal:20) reason text says "historical decision evidence or the external-project history convention". This slot is actually a retained live root-doc pointer (`docs/operator-runbook-herdr-cockpit.md`), not history. Disposition is right; the reason string is inaccurate. Suggested wording: "retained root path exists at the pin; stays literal (Step 3 precedent maps-j-08226)".
- The shared reason text on all 31 slots is boilerplate; skills-132/139/179 are really runtime/placeholder forms and skills-134/137/138 are generic directory prose. Accurate but generic.
- The 15 records' `mandatory` field reads "Read source→render header/slot correspondence in record; generation/parity is not claimed.", which is a stale description given these files have no render join. Harmless.

## Lead-judgment questions

- Q1: for the two missed `docs/explanation/...` pointers, patch (rewrite to the `docs/knowledge/...` successor in Phase 9) or park with a successor note? Step 3 precedent for the same kind of dead pointer with a findable successor was a non-executable successor note (maps-e-00411); the retired-root alias mapping in L12-26/L12-47 is lookup-only, never a write destination, which argues for parked + successor note unless L12-58(3) is read as allowing a direct patch to a live consumer.
- Q2: the population-join gap (class4-only edges dropped when a file also has skills-prompts edges) may affect other Step 4 parts; Lead may want to diff the class4 census against population for all headerless plugin files (the 105 plugin class4 edges absent from the population are mostly `_shared` and other files, not examined here).

## Counts

- Set step04-008: 15 files reviewed, 15 mandatory, 0 sampled strata. 31 slots reviewed (31 preserve, 0 patch, 0 parked). Rework files: 2 (cleanup-loop, retro-loop), both for the same 2 missed class4 references; 13 ok. Outcome defects: 2 (one defect class). Record-text notes: 3.
