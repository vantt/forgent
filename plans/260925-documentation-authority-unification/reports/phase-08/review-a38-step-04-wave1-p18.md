# Review a38 — step-04 wave1 part 18 (set step04-015)

Pin read: ef62747dd (worktree f068af156). Both files read through EOF; every slot reviewed. Payload items, records, diffs, targetEvidence, and the census edge list checked.

## src/intake/discovery.mjs — set step04-015, stratum: patched sample (1 patch file)
Verdict: ok. Slots reviewed: 3 (class6-l-000229 x2 physical lines, class6-l-000230).

- class6-l-000229 (src L43-44, `docs/history/fanout-and-delegation-rubric/` + `// CONTEXT.md`): preserve, timing none. Correct under L12-10/38/40: it is a "RETIRED (tsk-1x3 ...)" provenance citation of a portable docs/history/<feature>/ topology; the folder and CONTEXT.md exist at the pin. OK.
- class6-l-000230 (src L436, `docs/explanation/judge-verdict-second-pass-semantic-check.md`): patch, Phase 9.
  - Target `docs/knowledge/why-judgediscovery-judgedecompose-run-a-second-independent-j/judge-verdict-second-pass-semantic-check.md` exists at the pin. The old docs/explanation path does not exist at the pin, so the patch repairs a dead pointer.
  - Anchor `why-disagreement-parks-instead-of-retrying` matches target heading `## Why disagreement parks instead of retrying` (L37). The "never silently overrides one judgment with" sentence is on target L42, inside that section. The comment's "already states for this exact two-judge-disagreement path" is true. The target also covers `--force` later (L139+, L168), so the adjacent description holds.
  - Diff: hunk `@@ -433,7 +433,7 @@` is correct. Context lines 433-435 and 437-439 match the source. Only line 436 changes. Indent (8 spaces) and the `//` marker are kept. Only comment text changes and no code token is touched. The renderer-free `.mjs` has no render join. No behavior change. OK.
- Other legacy/dead docs-path occurrences in the file: none. Remaining hits (L4, 22, 48, 157, 244..., 510, `CONTEXT.md`; L530 `RESEARCH.md`; L382 `plan.md`) are bare artifact names with no docs path. No missed reference.
- Provenance/mandatory join: sourceRenderProvenance empty; this file has no render header, so no join is needed.

## src/intake/plan.mjs — set step04-015, stratum: unpatched sample (empty diff)
Verdict: rework (one missed census edge; no slot in this record, no checker evidence). Slots reviewed: 5 edge ids (8 physical slots): 000240 x2, 000241 x2, 000242 x2, 000243, 000244.

- class6-l-000240 (L8-9), 000241 (L88-89), 000242 (L286-287), 000243 (L311-312, wrapped `docs/history/decompose-locked-` / `decision-footprint-coverage/CONTEXT.md`): all preserve under L12-10/38/40. All four history folders exist at the pin (fanout-and-delegation-rubric, tsk-3xd-decompose-child-directive-prose, tsk-5e97-decompose-footprint-overlap-gate, decompose-locked-decision-footprint-coverage), each with CONTEXT.md. OK. Note: 000243's span covers only the L311 prefix. The wrapped second line holds the full folder name, but the preserve is correct either way.
- class6-l-000244 (L367, `"docs/decisions"` as an example directory-shaped footprint in a comment): preserve (L12-26/38). Correct: it is a literal illustrative footprint string for the coverage matcher, not a doc pointer; the reason text states that. OK.

### OUTCOME defect — missed reference (no slot)
- Census edge `class6-l-000245` (step-02l-census-class6.json; consumer src/intake/plan.mjs; digest c3c72be3 matches; physical span line 923, cols 135-224): `docs/explanation/auto-decompose-can-drop-a-locked-decision-from-every-childs-footprint.md`. It is inside the runtime string `rationale: 'tsk-1gr D1/D2: ... see docs/explanation/auto-decompose-can-drop-a-locked-decision-from-every-childs-footprint.md for the failure mode this catches'`. The record's `inventoryEdgeIds` stops at 000244 and it has no slot for 000245. The edge appears in no step-04 record or batch, only the census (grep over the reports dir).
  - The path is dead at the pin: `existenceAtInputCommit.checkedPathExists` is false, and docs/explanation/ no longer holds it.
  - The live owner exists at the pin: `docs/knowledge/auto-decompose-can-drop-a-locked-decision-from-every-child-s/auto-decompose-can-drop-a-locked-decision-from-every-childs-footprint.md`.
  - Rule: L12-58(4) "every frozen batch slot" / no census edge dropped. The record's own check scope says "other buckets remain in Step 3/5", but 000245 is claimed by no other bucket.
  - Correction: add a slot for 000245. It is a string literal persisted by `addDecision` into decision rationale (not a comment), so a patch changes runtime-emitted text. Disposition should therefore be parked (timing Step 5 behavioral/runtime string, target = the knowledge path above, no anchor needed), matching the other runtime-string parks. If the Lead instead rules that a one-token rationale text patch is allowed, patch with that target. Either way it needs a slot.

### Record-text / Lead-judgment notes (not rework)
- plan.mjs L822 comment cites bare `id-systems-audit.md #1`. It exists at the pin as both `docs/id-systems-audit.md` and `docs/platform/documentation/history/id-systems-audit.md`. It is not a legacy-root path, has no census edge, and is not a defect. Lead may want to confirm bare filenames are out of scope.
- plan.mjs `checks` carries empty writerTrace/descriptionTruth/anchors objects, consistent with the all-preserve record. Fine.

## Counts
- step04-015: files reviewed 2 (patched sample 1, unpatched sample 1); ok 1, rework 1.
- Slots reviewed: 11 physical slot rows (discovery 3, plan 8); preserve 10, patch 1, parked 0.
- Rework: 1 file (plan.mjs, missed class6-l-000245). Behavior changes: none.

Status: DONE_WITH_CONCERNS
