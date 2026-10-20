# Review a38: Step 4 wave 2, part 42 (set step04-031)

Pin dc24ce645. Payload step-04-wave2-p42.json. Reviewer read-only; no checker/probe run. Note: the two files in this part are core/skills/fgos-researching/SKILL.md and core/task-specs/fgos-indexing.md (not runner prompt templates); neither contains a runtime-emitted string with a legacy path, so no Step 5 exclusion is missing (`stepFiveExcluded: []` correct for both).

## Per file

### core/skills/fgos-researching/SKILL.md (set step04-031, mandatory) — verdict: OK
Read whole (149 lines) plus the three renders at the pin. Slots reviewed: 5 of 5 (skills-086 preserve; skills-087 patch; skills-044, skills-045, skills-177, skills-178 render-join; counted as 5 slot groups + 1 extra join pair, 6 slot rows total).
- skills-086 (line 77, `docs/history/<feature>/RESEARCH.md`): the write destination of the skill's own research record; L12-10 portable convention for external projects. Preserve correct. Joins skills-044 (.agents line 78) and skills-177 (plugins line 78) correct, header at render line 16 shifts lines by one, spans verified.
- skills-087 (line 90, `docs/specs/runner.md` in "(RUL45, ...) never splice it raw into a shell"): patch to `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#business-rules`. Target exists at the pin; `## Business Rules` is at line 25 so `#business-rules` resolves; RUL45 is in that section (line 78) with the same text as the retiring docs/specs/runner.md line 1012 (untrusted report text, never directly shell-executable). Same target/anchor as the accepted sibling RUL45 patches (skills-090, skills-084, skills-112). Diff hunk `@@ -87,7 +87,7 @@` has valid counts, old line byte-matches the source, backtick and label form kept, absolute docs path (no relative-path issue). Joins skills-045 and skills-178 (render line 91, timing Phase 9, sourceDisposition patch, no own diff) correct; `.claude/skills` wrapper has no doc edge and is a build:skills output; both generated renders carry the build:skills header, so no headerless-owner issue.
- Whole-file scan: `../_shared/capability-catalog.md` and `../_shared/executor-dispatch-fallback.md` are relative live paths, not legacy. `RESEARCH.md`, `scout-notes.md` bare names (not edges). `rg ... src bin docs test` is a bare directory list in a command example, no edge.

### core/task-specs/fgos-indexing.md (set step04-031, mandatory) — verdict: REWORK
Read whole (26 lines). Slots reviewed: 1 of 1 (skills-088, parked).

OUTCOME defect, skills-088 (line 12, `docs/specs/reading-map.md`, "Pointer in ... verified/updated for `docs/enduser-docs-index.json`"):
- The slot parks on P8-DOC-GAP-02 (end-user pointer conservation / one-bullet update contract). GAP-02 (owner-answers L12-26/L12-30(2)) covers `docs/specs/enduser-docs-authoring.md`, `docs/specs/enduser-docs-index.md` and `docs/specs/platform-foundations.md`; it does not cover the reading map. The slot's searchWitness itself reports 15 live hits for the path and lists them only as "citation-only".
- A LIVE (non-carriage) holder of the same passage exists: `docs/reading-map.md` (maintained-authority per `docs/platform/documentation/switchboard.md` lines 68/85) section 5 "Detailed Product And Source Map", line 157, is the merged copy of `docs/specs/reading-map.md` line 37 and names `docs/enduser-docs-index.json` (the `fgos-indexing` skill / `fgos docs-index` pointer). Its own text states the legacy map "remains a provenance pointer until consumer cutover; it is not the reader's detailed-map destination". The accepted Step 4 record AGENTS.md (instructions-003/012/014) already patches `docs/specs/reading-map.md` to `docs/reading-map.md` under the Step 3 carry. L12-30(1)(c): a live hit outside carriage is the target, park only when no live holder.
- Correction: change to `patch`, target `docs/reading-map.md` (anchor null as in the AGENTS.md rows, or the section 5 heading), timing Phase 9, replacement `docs/reading-map.md`, with the same recorded dependency as AGENTS.md (Phase 9 must first merge the remaining source reading-map content under the accepted Step 3 carry). The writer wording "verified/updated" does not make this an alias write destination: `docs/reading-map.md` is a real maintained file, not an alias lookup (aliases found none, correctly).
- Same passage appears in core/skills/fgos-indexing/SKILL.md skills-085 (parked identically, with joins skills-043/176); that file is outside this part, flagged for the Lead to review in its own part (same correction).

Other tokens: `docs/enduser-docs-index.json` (5 uses) is a retained, existing file (not an edge). `src/report/enduser-index.mjs` / `QUADRANT_META` are source paths.

## Record-text notes (not rework)
- skills-088 `reason`/`blockedReason`/`dependency` begin with duplicated "A51, L12-30/31/32/58/60: A51, L12-30/31/32/58/60:".
- skills-087 reason says RUL45 "forbids raw shell interpolation"; the target RUL45 actually says report text is untrusted and cannot itself become a shell command. Source gloss unchanged; wording of the reason only.

## Lead-judgment questions
1. fgos-indexing.md line 6 states end-user docs live under `docs/<quadrant>/` (`how-to`, `tutorials`, `reference`, `explanation`), roots the migration retires toward `docs/knowledge/**`. It matches no census pattern (placeholder, no literal path) and has no slot. It also describes runtime scan behavior of `src/report/enduser-index.mjs` (Step 5 parity). I did not count it as a defect; confirm it is Step 5/Phase 9 literal-search territory and needs no slot.

## Counts
- Set step04-031 (this part): files reviewed 2, rework 1 (fgos-indexing.md). Slots reviewed 7 (preserve 1, render-join 4, patch 1, parked 1): outcome defects 1.
- Mandatory stratum: 2 reviewed, 1 rework. Rate >3%, so the set expands to every file once other parts of step04-031 are accounted; skills-085 in fgos-indexing/SKILL.md likely shares the defect.

Status: DONE_WITH_CONCERNS
