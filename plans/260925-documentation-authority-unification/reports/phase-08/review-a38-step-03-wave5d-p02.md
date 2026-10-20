# Wave 5d review p02

File: docs/ui-spec/generated/wireframe-v2.html (batch-125, mandatory stratum, >=64 KiB source of 631,319 bytes / 2,569 lines)
Verdict: ok
Edges reviewed: 11 of 11 (maps-j-08469..08479), all parked, empty diff.

## Method
- Loaded the batch-125 record and printed every edge field.
- Pulled the whole pinned source and scanned it.
- Regex scan for docs/plans/core/src/.fgos paths, ADR/decision ids and legacy-root names.
- Read the 11 occurrences in line context.

## Edges
All 11 are one occurrence each of `docs/specs/herdr-web-dashboard.md`, inside the embedded JSON "prose" of the S01-S04, M02, M03, C01, domain-rules and system-events sections. The record spans match the source columns on lines 516, 657, 807, 898, 968, 1030, 1099, 1145 (two edges, columns 379 and 1193), 1347 and 1363. Each has the same disposition, category, reason and dependency text:
- disposition parked, category step5-parity, target null, anchor null, timing none.
- targetFacts says the path exists at the pin, so the reason's note that the tree retires at Phase 9 is accurate.

The park is correct:
- The file is generator output, and the file itself is not in a retiring tree.
- docs/ui-spec/00-overview.md lines 75-85 name validate.mjs, build.mjs and interpret-wireframe.mjs as the compiler, so the reason's claim holds.
- A hand patch of embedded prose would diverge from the Markdown sources (S01..., M02..., 20-domain-rules and 15-system-events), so the reason is right to rule it out.
- Parking all 11 on one category matches the same-category precedent in earlier batches (002, 040, 058, 059, 065) and the registry parks noted in progress.md.

Specific checks:
- The "§Sign in", "§View the taskboard", "Data Dictionary #4" and "R1" style locators are citations embedded in prose.
- Source line 898 carries "Data Dictionary #4". Lines 1145 and 1347 carry "§Retire a work item" and "## Business Rules". These are exactly what the Step 5 parity work must carry through, and nothing is lost by parking.
- `src/web/mod.rs` and `src/web/auth.rs` appear only as `herdr-plugin/src/web/...` mock file lists drawn inside the wireframe, not as references. No edge is needed, and the empty legacyScan is correct.
- No bare decision ids, no other legacy-root paths, no missed references. Bare `herdr-web-dashboard.md` file-name tokens come from the embedded source-file lists in the same prose, so they add no extra path edge.
- Records spans and matchedExpression are consistent with the 11 occurrences found by the scan (11 occurrences, 11 edges).

## Outcome defects
None.

## Record-text notes (not rework)
- The `reason` field duplicates the `blockedReason` and `dependency` text. It is verbose but harmless.
- 00-overview.md says `generated/` is gitignored, while the file is tracked at the pin. This is a fact for Step 5 to resolve (is the render a tracked artifact or a build output?). It does not affect the parking.

## Lead-judgment questions
None.

## Counts
- batch-125 mandatory stratum: reviewed 1, rework 0 (0%), within the 3% threshold.
- batch-125 other strata, batch-123 and batch-124: not in this part.

Status: DONE
