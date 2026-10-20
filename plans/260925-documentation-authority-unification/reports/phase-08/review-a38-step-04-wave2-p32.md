# Review a38: Step 4 wave 2, part 32 (set step04-022, first review)

Pin dc24ce645 (authorInputCommit). Payload step-04-wave2-p32.json. Reviewer read-only; no checker/probe run.
Method note: both sources were scanned through EOF for every path-like token (docs/, plans/, archive/, .md, specs/, AGENTS, .agents, plugins/, core/, decisions, history, CONTEXT/RESEARCH/DISCUSSION, prompts) and each hit read in context; the 2676-line runner was not read line-by-line as prose beyond those regions.

## Per file

### src/runner/dispatch/assignment-policy.mjs (set step04-022, stratum A51 selection, mandatory) — verdict: REWORK
Slots reviewed: 1 of 1 (class6-l-000255, preserve).

OUTCOME defect, class6-l-000255 (source line 416, span cols 7-51 `docs/history/executor-policy-dispatch-seams/`):
- Passage: "`resolveExecutorProvider` ... see that function's own doc comment for why, and `docs/history/executor-policy-dispatch-seams/` (H2a/H2b/RT1/F1) for the edge cases its logic still encodes unchanged".
- The slot preserves it under the "External-project history convention or named history evidence" reason. That label is wrong for this passage. Verified at the pin: `docs/history/executor-policy-dispatch-seams/` has never existed. `git log --all` with that pathspec returns nothing, `ls docs/history` (881 dirs) has no such directory, and no ref ever deleted it. The real tracks are `archive/plans/260915-executor-policy-dispatch-seams/` (plan history) and the finding ids H2a/F1 live in `docs/platform/agent-coordination/verification/step-08-standalone-coordination/P00.2.md` (evidence file) and `archive/plans/260901-1542-step08-standalone-coordination/reports/*P00.2*`.
- Rule: L12-30(5) "a never-existing target in live navigation is parked as a dead link with that fact; in examples/history it is preserved" and L12-60 ruling 4 "a 'see X' navigation pointer parks as a dead link (`src/install/coexist.mjs`); provenance wording preserves". This is "see X ... for the edge cases", a navigation pointer in a maintained comment, not provenance wording (contrast the coexist.mjs D2/D4/D6 slot, which the author correctly kept as provenance). The comment is also not a dated completed-action record like maps-j-08351, and not an existing `docs/history/<feature>` convention path (L12-10 covers conventions of real, retained history dirs).
- Live-holder check (docs/platform/**, docs/knowledge/**, docs/reference/**): no non-evidence, non-carriage holder of the "edge cases H2a/H2b/RT1/F1 of resolveExecutorProvider" passage (git grep H2b outside verification/ returns nothing). So the correct outcome is `parked` (dead link), timing none, with a searchWitness (queries for the path and for H2a/H2b/RT1/F1, hit counts, why verification/P00.2.md and archive/plans are history/evidence, not live targets) and a successor note naming `archive/plans/260915-executor-policy-dispatch-seams/` and the P00.2.md evidence file. No executable `new` text on the park.
- Behavior: none either way (comment only).

Other tokens in the file: lines 62 and 88 "design.md §4/§5.1" are bare filenames (L12-49, not edges). No runtime strings with doc paths; `stepFiveExcluded: []` is correct.

### src/runner/dispatch/assignment-runner.mjs (set step04-022, mandatory) — verdict: OK
Slots reviewed: 1 of 1 (class6-l-000256, preserve).
- Line 346 `docs/routing-handoff-contract.md` in a JSDoc "trust boundary" comment citing its "three locked invariants". Target exists at the pin (retained native path, named in AGENTS.md). Preserve is correct; the span (line 346, cols 5-37) matches the bytes. inventory originalLine 333 vs current 346 is explained by main drift; the record carries the actual line.
- Scan found no other doc-path edges. `plans/260917-executor-profile-schema-migration/plan.md` at lines 998, 1414, 1704 and "executor-policy-dispatch-seams plan.md" at 1685 are dated-plan provenance (L12-60 ruling 2; not docs/ paths, no census edge). The directory is now `archive/plans/260917-...`. Record-text/Lead note only (below). `agent-report.md`, `plan.md` are bare filenames. `stepFiveExcluded: []` correct (no runtime string carries a legacy path).

## Record-text notes (not rework)
- Both records' `reviewSet` and `checks` are fine; class6-l-000255's `reason` boilerplate ("External-project history convention") should be replaced with the true target state when reworked.

## Lead-judgment questions
1. assignment-runner.mjs lines 998/1414/1704 cite `plans/260917-executor-profile-schema-migration/plan.md`, a path that moved to `archive/plans/`. I treated this as dated-plan provenance outside the census (no edge, L12-60(2)). Confirm that live-comment pointers to relocated `plans/<dated>/` paths stay out of Step 4 slots (Phase 9 L12-4 literal remnant search).
2. For the dead-link park in class6-l-000255, confirm that verification/P00.2.md (evidence class) is not accepted as a live holder for a patch; I judged it is not.

## Counts
- Set step04-022 (this part): files reviewed 2, rework 1 (assignment-policy.mjs). Slots reviewed 2 (preserve 2, parked 0, patch 0): outcome defects 1.
- Stratum A51 selection / mandatory: 2 reviewed, 1 rework (set-level rate for this part 50%; >3%, so per L12 the set expands to every file, including preserve/park, once other parts of step04-022 are counted by the Lead).

Status: DONE_WITH_CONCERNS
