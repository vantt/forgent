# Review a38 step-05 seam 4, part src-p07

Payload: s4-src-p07.json (5 files, 96 items: 29+5+18+21+23 = literal refs 9+2+1+6+1 = 19, dynamic tuples 77). Pin 95301cb9a for all five. No diffs/rollbackDiffs anywhere (all five files are no-diff: preserve or park only), coCutPaths empty everywhere. Read-only; nothing run.

## Per-file verdicts

### scripts/check-backlog-reconciliation.mjs - rework (29 items reviewed)
- 9 literal refs (002432-002440): all admit/preserve at retained roots (docs/backlog.md, docs/history/...). Correct. Same-passage literal/tuple pairs at L17/L18 (002434/002440 vs 006473/006474), L114 (002433 vs 006462), L133 (002439 vs 006467) agree.
- OUTCOME DEFECT 1: dynamic-006479, line 89, `fail(\`docs/backlog.md lists duplicate proposed ids: ${...}\`)`. Rejected as "scalar-guard/accumulator/serialization". The own operand is the template whose literal text names `docs/backlog.md`; it is a runtime-emitted message (L12-71, user-visible output). Reference-002432 on the same passage is ADMIT/preserve, and the same-shape messages at L114/L133 (006462/006467) are ADMIT emitted-document-message. Correction: ADMIT, role emitted-document-message, preserve, join 002432 (same passage = same outcome). Output delta none.
- Lower-confidence: dynamic-006461 (L107, "appears more than once in RECONCILIATION.md") rejects as non-document-formatting. This is a bare basename of a retained history file; owner-answers L12-22 era ruling "bare basename of a retained root file is not an edge" supports the reject, so left as ok. Mentioned only because 006462/006467 admit messages that carry both a path and the basename.
- 006476/006480 (L61/L92 `path.relative(repoRoot, BACKLOG|DOC)`) reject: output is derived from the admitted BACKLOG/DOC constants (006473/006474), no literal doc path, so they follow the constants. OK.
- Record-text note: role label "navigation" for the L17/L18 `path.join(repoRoot, '...')` constants (they are path operands read by the script) is loose; the preserve outcome is right.

### scripts/check-decision-codes.baseline.json - ok (5 items)
- 002472 (L228, docs/decisions) and 002473 (L42, docs/history/<id>/iron-law-evidence.md) are substrings of test-title keys; preserve is right (baseline file protected, no baseline change; neither target is under docs/specs|architect).
- 006527-006529 reject (`scope:'subtree'`, `scope:'whole-repo'`, "scope: only the main-source...") correctly: scalar prose, no path.
- Lead question A: these baseline strings must equal the test titles verbatim. If the real-file-tests seam ever patches the checks.test.mjs title containing "docs/decisions" (002472 passage), the baseline key would have to change in the same cut. That is outside "no baseline change". Confirm the test-title record preserves (title says "alias, D6"), so the pair stays byte-identical.

### scripts/check-decision-codes.mjs - ok (18 items)
- 002474 (L8 comment to docs/history/decision-code-check-enforcement/CONTEXT.md): preserve, history retained. OK.
- 17 rejects (test dir, baseline path, message formatting, path.join over test files): none construct or read a document path (DEFAULT_BASELINE_PATH is a scripts/ JSON, DEFAULT_TEST_DIR is test/). Correct.

### scripts/check-decision-supersession.mjs - rework (21 items)
- OUTCOME DEFECT 2: dynamic-006547 (L103, "no row found in 0000-index.md ...") and dynamic-006548 (L110, "its 0000-index.md row does not mention ...") reject as non-document-formatting. `0000-index.md` is a deleted decision basename (`00NN-*.md` without a directory); owner-answers G2 (L12-3x list, item 7) says such basenames in live text are references that the scanner must find. These are runtime-emitted strings naming that file; the same file is admitted at L137 (006554/006555 path-operation) and L157 (002480, full path). Correction: ADMIT, emitted-document-message, same outcome as 002480 (whatever Lead rules in question B below), joined to 002480/006554.
- Items 002475-002480, 006549-006555: admit is right (path.join/resolve/default dir/messages). 006558/006559/006560/006561 (`[${id}]`, `${record.id}: ...`) reject correctly.
- Lead question B (outcome): 002475, 002478, 002480 have `existsAtPin: false` (docs/decisions/*.md corpus and 0000-index.md are removed, tsk-1lv-4) yet the witness is "retained ... decision corpus identity ... no relocation claimed". Comment 002475 and the L157 message actually say the corpus is retired, so preserving them is defensible as accurate history/output, and docs/decisions is not under docs/specs|architect so the retiring-target rule does not forbid it. But L6 comment 002478 ("its row in docs/decisions/0000-index.md") describes live behaviour of a script that is no longer wired in, in live code text, which is where G2 and L12 line 414/528 would park or add a successor note naming docs/decisions/index.md. Needs a ruling: keep preserve for all three with an accurate witness, or park 002478 (stale description) with a successor note.
- Record-text note: witness rule text "retained" is false for 002475/002478/002480 (existsAtPin false); reason lacks the "removed 0000-index.md, successor docs/decisions/index.md" naming that L12 line 528 asked for.

### scripts/check-doc-candidate-status.mjs - ok with notes (23 items)
- 002481 (L15 comment, docs/doc-governance.md): preserve right; doc exists at pin, switchboard routes it as active root authority.
- Admitted path-operation tuples 006565, 006566, 006568, 006570-006574, 006577, 006582, 006583 (11 parks): admit is right (they build document paths from the caller file set, switchboard, constitution). All 11 parks share one blocker, so same-passage items agree. Rejects 006562-006564, 006567, 006569, 006575, 006576, 006578-006581 are message/count formatting; correct.
- Record-text note / Lead question C: the park blocker is the generic "no bounded artifact/export supplied; preserve gate bytes". It fits the caller-supplied file-set operations (006565/66/68/70/77/83). For 006582 (DEFAULT_SWITCHBOARD_PATH, a fixed plans/ literal) and 006571-006574 (CLI option paths) it does not name the real dependency (the switchboard path moves or retires with the transitional switchboard at cutover; CLI options default to caller choice). Park outcome is acceptable, but the blocker text for 006582 should name the switchboard path change/co-cut instead of a file-set export, or Lead may rule the literal a preserve (not a legacy root).

## Counts
- Files: 5; ok 2 (baseline json, decision-codes), ok-with-notes 1 (candidate-status), rework 2 (check-backlog-reconciliation, check-decision-supersession).
- Items reviewed: 96 (19 literal refs, 77 tuples).
- Outcome defects: 3 (006479; 006547; 006548). All three are admit/reject errors; the intended disposition is preserve so no diff or park count changes beyond making those three admitted.
- Diff defects: 0 (no diffs present).
- Lead-judgment questions: A (baseline key coupling), B (retired-corpus preserve vs park), C (generic park blocker for 006582/006571-006574).

Status: DONE_WITH_CONCERNS
Summary: Three tuples are misclassified as rejects (006479 on L89, 006547/006548 on L103/L110) and need ADMIT/preserve joined to their same-passage references; everything else is sound, with three questions for Lead.
