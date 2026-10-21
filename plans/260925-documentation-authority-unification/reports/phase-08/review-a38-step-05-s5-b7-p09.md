# Review: seam 5 batch 7, part p09 (s4-src-p09)

## Files

### test/workflow/workflow-runner.test.mjs - verdict ok (42 items + 7 author-added refs)
- 42 dynamic tuples, all REJECT/preserve with nonDocumentUse scalar-pass-through, non-document-fs-probe, state-event-store, text-label-join.
- Passages read: all are `capability: 'docs:write'` labels, tmp-repo fixture construction (`path.join(tmp, ...)`), `.fgos/assignments/...` state reads, config.json fixture edits, or the stub-agent script. None constructs or reads a repository document path. nonDocumentUse values are true. No diff, no park (none needed).
- Author-added refs: `docs//` (L142) and `docs/note.md` (L1832/1833/1837/1859) ADMIT/preserve; `docs/note.md` L1801/L1819 REJECT/preserve.
  - `docs/note.md` is a file the test creates inside its own tmp git repo, so it is not a repo document. Preserve is the right outcome either way, so no outcome defect.
  - Record-text note: admission is inconsistent for the same fixture path. L1819 (`--context-ref docs/note.md`) is rejected while L1859 (the same ref echoed in the assignment) is admitted. Align the labels (all reject as fixture/non-document use, or all admit as preserve).
  - Record-text note: `docs//` at L142 is a writes-pattern canonicalisation input to `validateWorkflow`, not a document path. Reject/non-document would be more accurate. Preserve is harmless.
- workflow-store-ledger.test.mjs: empty entry, no items. Nothing to review.

### test/docs/decisions-corpus-retired.test.mjs - verdict rework (34 items; 1 author-added reject ok)
Outcome defects:
1. reference-004039 (L2) and reference-004041 (L3): ADMIT, role dated-provenance, disposition parked. Rule: dated history preserves; same-passage items share one outcome.
   - L2-3 are the same header-comment passage as reference-004030 (L8, `docs/decisions/`, preserve) and 004029/004043 (preserve). The blockedReason describes the code at L31 (the DECISIONS_DIR enumeration), not the comment text.
   - Correction: preserve 004039 and 004041 as dated-provenance, as 004030 is. The L31 code tuples dynamic-018734 and dynamic-018735 keep the park and the docs/decisions/index.md retention-or-move co-cut unit.

Verified correct:
- Parks:
  - 004034, 004047, dynamic-018742, dynamic-018743 (work-state): `retired-decision-history.md` has 0 retired-section markers and no `### 0032 — Multi-role Team Harness`. Checked in the worktree.
  - 004040 (foundations): `docs/platform/platform-foundations.md` has no marker and no `### 0001`.
  - 004035 (architecture-map): `docs/platform/architecture-map.md` lacks `### 0010/0015/0017`.
  - Each blockedReason names the exact missing claim.
- Patches 004033, 004037, 004046, dynamic-018741 and the diagnostics dynamic-018740 and dynamic-018744:
  - The runner target `h-36d872fbb0e5.md` has the marker once and `### 0032 — Cổng Iron Law`.
  - `system-overview/spec.md` has the marker once.
  - The diff is on a test source file, changes only the admitted lines (array members L47 and L49, and the runner read at L78), and has a rollback.
- Preserves 004042 (AGENTS.md absence assertion, AGENTS.md is retained) and dynamic-018745: ok.
- Rejects 004028, 004031, 004032, 004038, 004044, 004045, 004049 and dynamic-018737, dynamic-018739: all test-name or message labels, true.

## Lead-judgment questions
- Mixed outcomes inside one passage. The NARRATIVE_TARGETS array (L44-50) has two members patched (runner, system-overview) and three parked (foundations, work-state, architecture-map). The same test bodies hold patched diagnostics next to parked reads: dynamic-018740 (patch) with dynamic-018738 (park) at L67-75, and dynamic-018744 (patch) with dynamic-018743 (park) at L84-90.
  - Per-member outcomes look defensible here, since the diff touches only the two live members and the diagnostics print the array.
  - It does conflict with the literal "same passage, one outcome" rule. Confirm that per-member patch plus park is accepted and that the co-cut note blocks cutover until Step 7.
- The payload shows no replay status for the patch file, although R22 requires a current/candidate replay for patch files. The proofCommand is present, proofScope is null, and the candidate replay cannot go green while the parked members remain. Confirm that replay-deferred-phase9 is recorded for this file.

## Counts
- workflow-runner.test.mjs: 42 items + 7 author-added, 0 outcome defects, 2 record-text notes.
- workflow-store-ledger.test.mjs: 0 items.
- decisions-corpus-retired.test.mjs: 34 items + 1 author-added, 2 outcome defects (004039, 004041), 0 crossSeamChangedOnly items.

Status: DONE
