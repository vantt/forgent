# Review a38 Step 4 wave 3, part 26 (set step04-030)

Pin dc24ce645 (author input dc24ce64527f...). Worktree detached at 774adbd01, read-only. Method: every source read through EOF at the pin, every slot and render join checked, target existence/anchors checked with git at the pin, no checker/probe scripts run.

## Per file

### core/skills/_shared/executor-dispatch-fallback.md — set step04-030, category A, verdict OK
Slots reviewed: 7 source slots + 14 render joins (21 total; 12 stepFiveExcluded history-convention entries listed).
- Source slots (lines 12, 33, 151, 224): preserve. All four `docs/history/<feature>/...` targets exist at the pin; L12-10 convention. Line 224 (the previously missing slot) is now present and its passage matches.
- Line 239-240 (wrapped `docs/decisions/0026-...-cli-\nspawn.md`): park, dead link. Path absent at pin (retired by tsk-1lv-4). Passage-content witness checked: no same-basename holder; the only live holders are the combined narrative file `docs/platform/runner/decisions/h-36d872fbb0e5.md` (heading "### 0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity", line 583 at pin) and the "Lớp còn thiếu" heading (line 695). Name-drifted/combined holder gives a successor note and no patch (L12-62 ruling 1). Correct.
- Line 292 (how-to): patch to `docs/knowledge/how-to-wire-an-existing-skill-s-inline-reasoning-step-throug/wire-a-skills-classify-step-through-an-agent-executor-executor.md`. Target exists at the pin, same basename, source path absent at the pin, so ruling 1 (moved-verbatim) applies. Replacement keeps the `- ` list prefix and backticks, repo-root-relative like the original. The adjacent claim "registration steps (1–3 there)" still holds in the target (steps 1, 2 ... seen). Correct.
- Line 311 (`docs/decisions/0026-...-spawn.md`): park, same successor note. Correct.
- Render joins (.agents, plugins): each render line (source line + 1) maps to a source slot of equal passage and equal disposition (preserve x4 pairs, park x2, patch x1, per render). All 14 joins reference an existing source slot. No source-slot mismatch found.
- Diff: single hunk @@ -289,7 +289,7 @@, comment-free prose change only; no behavior change.

### core/skills/fgos-clarifying/SKILL.md — set step04-030, category A, verdict OK
Slots reviewed: 2 source slots + 4 render joins (the .claude wrapper carries no docs path).
- Source line 90 (`docs/specs/runner.md`, RUL45): patch to `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md`, anchor `business-rules` (heading "## Business Rules" at pin, slug matches). RUL45 text is in that file at line 78. Replacement renders correctly (path with `#business-rules` replaces the single backticked path; label `RUL45` kept on the previous line). Disposition OK.
- Source line 100-101 (wrapped `docs/decisions/0026-vision-orchestrator-roottask-\n capacity-native-vs-cli-spawn.md`): park, dead link, same successor note and witness as above. Correct. The wrap break differs from the fallback file, and the slot text reflects the real wrap (checked against bytes).
- Render joins skills-015, skills-148 join the line-90 patch slot (render line 91); class4-l-000040 and class4-l-002042 join the line-100 park slot (render lines 101-102). Source slots exist with equal passages and dispositions.
- No other `docs/` path appears in the source (checked by grep at the pin).

### core/skills/fgos-indexing/SKILL.md — set step04-030, categories A and B, verdict REWORK
Slots reviewed: 5 source slots (1 patch, 4 preserve) + 10 render joins.
- Line 62 `docs/specs/reading-map.md`: patch to `docs/reading-map.md`, anchor `5-detailed-product-and-source-map`. Target exists at the pin; its section 5 ("## 5. Detailed Product And Source Map", line 122) contains the end-user quadrant pointer bullet (line 157) and the `docs/enduser-docs-index.json` mention. Anchor resolves by passage. Replacement renders correctly. OK.
- Lines 62/63 `docs/how-to/`, `docs/tutorials/`, `docs/reference/`, `docs/explanation/`: preserve (they quote the content of the reading-map pointer line being superseded). Defensible, not flagged.
- Render joins skills-043, skills-176 (to the patch slot) and class4-l-000081..84, class4-l-002083..86 (to the four preserve slots): all source slots exist with equal passages (render line = source + 1).

OUTCOME DEFECT (missed reference), edgeId none (no slot exists), source lines 20 and 41:
- Line 20: "...whatever real documents already exist under `docs/<quadrant>/`."
- Line 41: "`fgos docs-index` enumerates every document under `docs/<quadrant>/` (the four Diataxis quadrant directories)..."
- These are present-tense input-layout claims about the retiring four-quadrant roots, the same class as `core/task-specs/fgos-indexing.md` line 6, which was given a parked Phase 9 slot (step04-031: "Retiring four-quadrant input layout; Phase 9 description rewrite and Step 5 index scanner/writer parity must agree on docs/knowledge layout"). L12-62 requires the pattern to get a Phase 9 slot ("The `docs/<quadrant>/` retiring-root pattern ... gets a Phase 9 slot") and the complete wrapped-path scan rule requires every hit to be slotted or in stepFiveExcluded. This record has `stepFiveExcluded: []` and no slot for either line, so both are neither slotted nor excluded. Correction: add two parked Phase 9 source slots (lines 20 and 41, same reason as step04-031 line 6) plus their render joins in .agents and plugins (render lines 21 and 42).
- If the Lead rules that the placeholder pattern `docs/<quadrant>/` is not a path edge, then the task-spec slot is the outlier instead; either way the two files must agree.

Record-text notes (not rework):
- fgos-clarifying line-90 patch reason says the RUL45 live rule "treats submitted title/description as untrusted data and forbids raw shell interpolation". The actual RUL45 text in the target (line 78) is about assistant-reported discovered-work names/descriptions being untrusted text with log normalisation and a once-per-turn rule. The rule id and the untrusted-text principle match; the reason overstates the match. The disposition and target are still correct.
- Successor-note anchor `#0026-native-first-dispatch-doctrine-launcherroottaskcapacity` omits the double hyphen that GitHub-style slugging gives for "0026 — Native-..." ("0026--native-..."). It is a non-executable note; confirm against the repository slug function if notes are later promoted to anchors.
- `docs/enduser-docs-index.json` (fgos-indexing lines 9, 43, 67, 74; `repo/` prefix at 43) is a live generated file that exists; no slot was authored. Not flagged (not a retiring path), mention only.

## Lead-judgment questions
1. Are `docs/<quadrant>/` placeholder patterns edges that need slots in fgos-indexing SKILL.md (lines 20, 41), as for the task-spec line 6? (Recommended: yes, match step04-031.)

## Counts
- Files reviewed: 3 (set step04-030, stratum: skills/shared skill sources). ok: 2, rework: 1.
- Slots reviewed: 7 + 2 + 5 = 14 source slots, 14 + 4 + 10 = 28 render joins, 42 joins/slots total in the payload basis.
- Outcome defects: 1 (missed slots for two lines in fgos-indexing SKILL.md).

Status: DONE_WITH_CONCERNS
Summary: executor-dispatch-fallback.md and fgos-clarifying/SKILL.md are ok; fgos-indexing/SKILL.md needs rework for two missing parked slots (lines 20 and 41, `docs/<quadrant>/`).
