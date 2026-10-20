# Review a38 step-04 wave3 p24 (set step04-027, category A, maintained comments in src/state)

Pin dc24ce645. Both files read whole from the payload content (store.mjs 2214 lines, work.mjs 906 lines). Edge regions and every docs/plans/.md mention were grepped. Targets were checked at the pin with git cat-file.

## src/state/store.mjs (set step04-027, stratum maintained code comments, category A): verdict ok
Slots reviewed: 10 distinct edges (class6-l-000454, 456, 457, 458, 459, 460, 461, 462, 463; 456 and 457 appear twice in the record). That is 9 preserve and 1 parked. The diff is empty, so there are no patches and no behavior change.
- 454 (l.579, `docs/history/<id>/`): preserve. This is the external-project history convention (L12-10), and the witness says pattern, zero tree matches. Correct.
- 456, 458, 459, 460 (l.857, 1147, 1273, 1440, `docs/architect/doing-coordination-redesign.md`): preserve. These are design-origin tsk-40m provenance (L12-62 ruling 2). The witness shows the file exists in the tree with 5 history commits. The line 1147-1148 wrapped reference is joined correctly. The "present-tense location claim about a retiring tree" rule is Phase 9 timing, so preserve is right.
- 457 (l.892, `docs/distillery/deep-dives/fgos-capture-gaps-vs-bee.md`): preserve. L12-58 3 retains docs/distillery, and the file exists at the pin.
- 462 (l.1772, `docs/decisions/index.md`): preserve. It is a retained root path, and the file exists at the pin.
- 463 (l.2090-2091, `docs/history/execution-fanout/CONTEXT-tsk-4so.md`): preserve. This is named history evidence, and the file exists.
- 461 (l.1768, `docs/specs/<area>.md`): parked, with the L12-62 passage-content live-holder search. The comment says scope is free text, and `docs/specs/<area>.md` is only an illustrative area slug for a retiring monolithic layout. The witness searched docs/platform/** and docs/knowledge/** for six content terms (buildDecisionIndexMarkdown, decision-index and others) and for the path itself. It found no single 1:1 successor holder, and the alias table and doc-registry have no match. Parking with a rewrite-needed note is consistent with rulings 3 and 6, and it does not invent a holder. I do not call this a defect.
- Step 5 exclusions: l.615 `docs/history/${id}/plan.md` is a runtime template-literal candidate path, so it is Step 5 under L12-60(1). Correctly excluded. The second exclusion entry is a truncated duplicate span and is harmless.
- No missed references. The other .md mentions are bare filenames or non-edges: dag-request-scheduler.md §4 (l.85), plan.md, CONTEXT.md, CONTEXT D5/D6, iron-law-evidence.md.
Outcome defects: none.

## src/state/work.mjs (set step04-027, stratum maintained code comments, category A): verdict ok
Slots reviewed: 12 distinct edges (class6-l-000466 to 475) in 13 record rows. 466 appears twice, once without an edgeId, and 467 to 475 are each preserve. The rows without an edgeId are 466 (l.122-123) and a platform-foundations.md (l.132-133) row. The diff is empty, with no patches and no behavior change. All are preserve.
- 466 (l.122-123, `docs/decisions/0027-...base-workflow-model-d1-d3.md`): preserve under L12-62 ruling 2 (design-origin provenance). The path is absent at the pin (history-only, 5 commits) and the live statement exists. The note correctly says "no live destination claim". The successor note `docs/platform/work-state/decisions/retired-decision-history.md#12-adr-0027-domain-owns-the-pre-delivered-status-vocabulary` exists. Heading `## 12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary` is at line 536, so the slug matches. The passage-content live-holder search (moveWork, statusCategory) is embedded. Correct.
- 467, 468, 469, 470, 471, 472, 473, 475: preserve. These are named docs/history evidence or the external-project convention (470 is the `<feature>` pattern). The witnesses show the tree paths exist. The wrapped references at l.123-124, l.341-342 and l.676-677 are joined correctly.
- 474 (l.852, `docs/history/foo/CONTEXT.md`): preserve. This is a literal adversarial example, with never-existed and the L12-10/49 exception stated. It is not a see-pointer. Correct.
- Row without edgeId (l.132-133, wrapped `docs/ platform-foundations.md`): preserve. The root authority is retained under L12-58 3, and the file exists at the pin. The wrapped span is joined correctly.
- No missed references. Bare CONTEXT.md, plan.md and DISCUSSION.md mentions (l.33, 43, 607, 737, 811, 871) are not edges.
Outcome defects: none.

## Record-text notes (not rework)
- store.mjs 456 and 457 appear as duplicate record rows with identical content. work.mjs 466 and 472 have the same duplication. 466 has a variant row without an edgeId, as does the platform-foundations row.
- The 461 reason string repeats the prefix "A51, L12-30/31/32/58/60: L12-62:" twice.
- The second store.mjs Step 5 exclusion carries a truncated span (`docs/history/$`).

## Lead-judgment questions
None.

## Counts
Set step04-027, comment stratum: 2 files reviewed, 0 rework. 22 distinct slots reviewed (10 in store.mjs, 12 in work.mjs): 21 preserve, 1 parked, 0 patch. 0 outcome defects.
