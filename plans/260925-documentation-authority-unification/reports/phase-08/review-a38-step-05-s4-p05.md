# Review a38 Step 5 seam 4, part p05 (src-p05)

Payload: s4-src-p05.json, 27 files, 80 items reviewed (28 admitted references, 52 rejected dynamic tuples). Pin 95301cb9 for every file. One diff (retro-loop). No parked items.

## Verdict per file

ok (26 files):
- plugins/fgOS/skills/discover-next/SKILL.md: 3 items. reference-002348 preserve; dynamic-006259 and -006260 reject.
- plugins/fgOS/skills/discover/SKILL.md: 5 items. reference-002349 to -002352 preserve; dynamic-006261 reject.
- plugins/fgOS/skills/goal/SKILL.md: 1 item (dynamic-006275).
- plugins/fgOS/skills/graph/SKILL.md: 1 item (dynamic-006276).
- plugins/fgOS/skills/list/SKILL.md: 1 item (dynamic-006277).
- plugins/fgOS/skills/merge-list/SKILL.md: 1 item (dynamic-006278).
- plugins/fgOS/skills/merge-loop/SKILL.md: 1 item. reference-002409 preserve.
- plugins/fgOS/skills/merge-next/SKILL.md: 6 items. reference-002410 and -002411 preserve; dynamic-006279 to -006282 reject.
- plugins/fgOS/skills/move/SKILL.md: 1 item (dynamic-006283).
- plugins/fgOS/skills/pick/SKILL.md: 1 item (dynamic-006284).
- plugins/fgOS/skills/plan-next/SKILL.md: 2 items (dynamic-006285, -006286).
- plugins/fgOS/skills/plan/SKILL.md: 3 items. reference-002412 and -002413 preserve; dynamic-006287 reject.
- plugins/fgOS/skills/ready/SKILL.md: 1 item (dynamic-006288).
- plugins/fgOS/skills/retro-loop/SKILL.md: 3 items. reference-002414 and -002415 preserve; reference-002416 patch. Diff checked, see below.
- plugins/fgOS/skills/retro-next/SKILL.md: 8 items. reference-002417 to -002420 preserve; dynamic-006289 to -006292 reject.
- plugins/fgOS/skills/return/SKILL.md: 1 item (dynamic-006293).
- plugins/fgOS/skills/rollup/SKILL.md: 1 item (dynamic-006294).
- plugins/fgOS/skills/show/SKILL.md: 1 item (dynamic-006295).
- plugins/fgOS/skills/stale/SKILL.md: 1 item (dynamic-006296).
- plugins/fgOS/skills/submit/SKILL.md: 2 items (dynamic-006297, -006298).
- plugins/fgOS/skills/terminal-close/SKILL.md: 2 items. reference-002421 preserve; dynamic-006299 reject.
- plugins/fgOS/skills/terminal-close/close.sh: 2 items. reference-002422 preserve; dynamic-006300 reject.
- plugins/fgOS/skills/terminal/SKILL.md: 5 items. reference-002423 to -002425 preserve; dynamic-006301 and -006302 reject.
- plugins/fgOS/skills/terminal/rename.sh: 4 items. reference-002426 to -002428 preserve; dynamic-006303 reject.
- plugins/fgOS/skills/terminal/terminal-port.sh: 1 item (dynamic-006304).
- plugins/fgOS/skills/triage/SKILL.md: 1 item (dynamic-006305).

rework (1 file):
- scripts/backfill-status-category.mjs: 21 items. One outcome defect (reference-002431). The other 20 items are ok.

## Outcome defects

1. reference-002431, scripts/backfill-status-category.mjs, passage lines 1-7 (the literal spans lines 4-5).
   - Rule: owner-answers L12-39(3). A removed decision id that is preserved must carry the narrative-holder successor note when a `### NNNN` heading exists in a candidate decisions file. Step 4 applies the same rule to the same filename.
   - Problem: the file `docs/decisions/0027-domain-so-huu-...-d1-d3.md` is missing at the pin. It was retired by the corpus-retirement commit 4722361ae. The record preserves it with `successorNote: None`, resting on a generic "retained ... decision corpus identity" witness.
   - Precedent: Step 4 preserved the identical filename in src/state/work.mjs (step04-027) and src/state/frontier.mjs (step04-026), both with the successor note `docs/platform/work-state/decisions/retired-decision-history.md#12-adr-0027`.
   - Check: that file exists at the pin and has the heading `## 12. ADR 0027 ...`.
   - Correction: keep disposition `preserve` (the comment is history and design-origin provenance, so a patch is not wanted), but set `successorNote` to that holder. Replace the witness text with the retired-decision-corpus reasoning. The same-passage literal and dynamic outcome stays preserve.

## Items checked and ok

- All 52 rejects are real non-document uses. None builds or reads a document path.
  - The `${CLAUDE_PROJECT_DIR}` and `--dir` passages are store-root selection for `.fgos/`, a state directory. The `git rev-parse ... dirname` calls and the `.fgos` store reads in the discover-next, plan-next and retro-next node snippets are the same kind.
  - merge-next dynamic-006279 to -006282 are syncRoot output-shape prose.
  - submit dynamic-006297 is gate prose (lines 109-120). dynamic-006298 is the `--dir` explanation.
  - The shell tuples in close.sh, rename.sh and terminal-port.sh are session key, pane id, JSON string and project-root arguments. rename.sh builds `$project_root/.fgos/installation/bin/fgos`, `bin/fgos.mjs` and `src/util/session-identity.mjs`; none is a document.
  - The backfill-status-category.mjs rejects are error-message formatting, a log-text join, and backup and log path resolution on the `.fgos` event log (state).
- The other 27 admitted references (including the one patch) are correct.
  - Every `docs/history/**` target is dated history and exists at the pin. This covers the eleven inherited-preserve items in discover, discover-next, plan, retro-next, terminal-close, terminal and rename.sh, the three navigation comments, and merge-next, merge-loop and retro-loop. None falls under the retiring `docs/specs/**` or `docs/architect/**`.
  - `docs/operator-runbook-herdr-cockpit.md` and `docs/platform-foundations.md` exist and are retained root docs (owner-answers L12 line 262), so those preserves hold.
  - The Step 3/4-joined ids keep the Step 3/4 disposition: patch for 002416, preserve for the rest. No joined id is changed.
  - reference-002409 `docs/history/<id>/iron-law-evidence.md` is a runtime `git show` template and is joined to Step 4 skills-179 (preserve). The record claims no relocation.
- retro-loop diff (reference-002416):
  - It is a one-line hunk at line 36, moving `docs/explanation/why-merge-loop-recurses-into-loop-not-ck-loop.md` to `docs/knowledge/why-fgos-merge-loop-tsk-1sm-recurses-into-loop-not-ck-loop/why-merge-loop-recurses-into-loop-not-ck-loop.md`.
  - It is on a source file. plugins/fgOS/skills/retro-loop/SKILL.md is hand-authored, with no core/skills counterpart and no generated header.
  - It touches only the admitted passage.
  - The target directory and file exist at the pin.
  - The rollback diff is the exact inverse.
  - The two sibling preserves in the same file (002414, 002415) are untouched by the hunk.

## Record-text notes

- Most `reason` fields quote the passage and rely on the "inherited preserve" label. The text does not say that docs/history is dated history. That is acceptable, but the L12-71 wording is thin for the three navigation items in comments (002422, 002426, 002427).
- reference-002431: the `matchedExpression` and the `parityObligation` current and candidate strings contain the embedded `\n// ` comment line-break. That matches the Step 4 style and looks mechanical.

## Lead-judgment questions

- plugins/fgOS/skills/cleanup-loop/SKILL.md line 31 carries the same dead `docs/explanation/why-merge-loop-recurses-into-loop-not-ck-loop.md` pointer. It is not in this part. Confirm its sibling slice has the same patch outcome as retro-loop 002416. Same-passage and same-target text should share one outcome.

## Counts

- Files: 27 (26 ok, 1 rework).
- Items: 80 (28 admitted references, 52 rejected dynamic tuples).
- Outcome defects: 1 (reference-002431).
- Diffs: 1, ok.
- Unseen sibling slices: none within this part; cleanup-loop is a sibling file outside it.

Status: DONE_WITH_CONCERNS
