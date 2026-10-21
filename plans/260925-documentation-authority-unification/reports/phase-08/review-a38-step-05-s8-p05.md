# Review a38 step-05 seam 8, part p05 (payload s4-src-p05.json)

Scope: 30 source files, 108 payload items (admitted references/tuples plus docs-mentioning judgment rejects). The 10 files with no items (prompt-templates, repo-locks, session, worker-log, decision-question, domain-registry, fgos-file-registry, hot-lock, porting-store, runtime-coordination) were checked for coverage only and have nothing to review.
Standard applied: L12-72 R1-R9, L12-74 R10-R16, seam 8 brief and rulings (R27/R28), pinned bytes at 97c9694a4. I also read the whole record for the files where I found gaps (runtime-judgment-part-28/29.jsonl), and ran a coverage scan of every `docs/` / `docsRef` occurrence at the pin against the item lines.

## Per-file verdicts

| file | verdict | items |
|---|---|---|
| src/runner/paths.mjs | ok | 5 |
| src/runner/promote-preflight.mjs | ok | 2 |
| src/runner/work-compat.mjs | ok (Lead note N1) | 4 |
| src/runner/work-dispatch.mjs | ok (Lead note N2) | 6 |
| src/runner/worktree.mjs | **rework** (D1) | 13 |
| src/state/cleanup-harness.mjs | **rework / Lead decision** (D5) | 4 |
| src/state/dep-graph.mjs | ok | 1 |
| src/state/drift-status.mjs | ok | 2 |
| src/state/events-compaction.mjs | ok | 1 |
| src/state/events-jsonl-truncation-guard.mjs | ok | 2 |
| src/state/frontier.mjs | ok | 3 |
| src/state/gate-bypass.mjs | ok | 8 |
| src/state/graph-harness.mjs | ok | 6 |
| src/state/graph-metrics.mjs | ok | 5 |
| src/state/knowledge-registry.mjs | ok (notes N5, N6) | 30 |
| src/state/postland-drift.mjs | ok | 1 |
| src/state/priority-formula.mjs | ok | 1 |
| src/state/replay.mjs | ok | 3 |
| src/state/retrospective-doors.mjs | **rework** (D2, D3, D4) | 9 |
| src/state/status-fsm.mjs | ok | 2 |

## OUTCOME defects

**D1. src/runner/worktree.mjs: the occurrence at L1248-1249 has no record.**
- Pin L1248-1249 is the comment `(docs/history/ merge-worktree-reclaim-clobbers-kept-checkout/CONTEXT.md D1)` in the createVerifyCheckout doc comment. Its target exists at the pin.
- reference-003787 (census L1253) is rejected as removed-occurrence-provenance, "same scalar elsewhere is not a binding". At the census pin that comment sat in createDetachedMergeWorktree and was rewritten. The rewritten text now sits in createVerifyCheckout, and nothing covers it. `authorAddedReferences` is `[]`.
- reference-003782 (old L1265) and reference-003792 (old L1340) are genuinely absent at the pin, so those two rejects are right.
- Rule: R3 (a source passage with no owning record gets an author-added source slot) and R16 (docs/history comment pointers admit/preserve uniformly).
- Correction: add an author-added reference for L1248-1249, ADMIT/preserve, same as 003790 and 003786. Keep the 003787 removed-occurrence witness for the old line only.

**D2. src/state/retrospective-doors.mjs dynamic-015651 (L120): the rejection is untrue.**
- It is `path.join(repoRoot, homeFile)`, rejected as nonDocumentUse `state-event-store`.
- homeFile is `posix.join(docsRef,'CONTEXT.md')` (L115, admitted as dynamic-015650), and L121-122 existsSync/readFileSync the item CONTEXT.md.
- That is a document read (R6/R16), and the passage (L102-130) already holds 015650.
- Correction: ADMIT with the same park as 015650, and add the CONTEXT bytes read to the dependency.

**D3. retrospective-doors dynamic-015656 (L202): the rejection is untrue.**
- It is `path.join(dirAbs, entry.name)`, rejected as scalar-pass-through. It feeds `fs.readFileSync` on each docsRef/*.md file.
- dirAbs is admitted and parked at L193 (015654/015655), and that blocker already names "deferred-prose contents".
- Rule: R7 (same passage, one admission and one disposition) and R6 (read).
- Correction: ADMIT/park under the same docsRef-export dependency.

**D4. retrospective-doors dynamic-015660 (L68): the rejection is untrue for the docsRef member.**
- It is `fs.existsSync(path.join(repoRoot, p))`. L60 pushes the docsRef directory into candidatePaths, and the same file admits the docsRef directory at L193 (015654).
- The existsSync probe is R6/R16 and must carry the docsRef export dependency. The `item.refs` members are caller data, but the docsRef member makes the probe a document probe.
- 015661 (`path: p`, finding field) and 015662 (message on `${p}`) correctly reject under R5/R6.
- Correction: ADMIT/park under the same docsRef dependency, or, if the Lead keeps R16's "fixed path" reading, retract the admission of 015654 and its siblings. One of the two must change.

**D5. src/state/cleanup-harness.mjs dynamic-015349 (L377), 015351 (L389) and 015355 (L416): the nonDocumentUse label is untrue. The disposition needs a Lead call.**
- Each is `fs.existsSync(path.join(repoRoot, <outcome.docPath | resolvedDoc.currentPath | attestedDoc.currentPath>))`, a probe of a document file. The label is `scalar-pass-through`.
- The paths come from state: the outcome log and the registry. The comment at L380-386 says the historical docPath is never rewritten and relies on `resolveDocPath` alias resolution after a docs move. The post-cutover result of this gate therefore depends on the registry alias population.
- Rulings in tension: R16 says existsSync on a *fixed* document path admits, and these are not fixed. The seam 8 brief says "state and external populations stay explicit parks until authorized exports exist". Under that brief this looks like an explicit park (registry alias/currentPath export), not a reject.
- Correction: either admit/park on the state-population dependency, or keep REJECT with a true nonDocumentUse (for example, state-held path resolved through the registry alias table) and say why no Phase 9 action is needed. The label as written is false.

## Lead-judgment questions

- **N1. work-compat dynamic-013296 (L148)** is the worker-prompt pointer `${work.docsRef}/plan.md and .../CONTEXT.md`, rejected as text-label-join. R6 rejects a message whose path comes only from caller data, and docsRef is caller data, so this is defensible. But the same docsRef/plan.md and CONTEXT.md appear in work-dispatch 013331/013332 (admitted/park, worker context). Please confirm the rejection is intended, or join this pointer to the same docsRef export unit as a message slot.
- **N2. work-dispatch dynamic-013333 (L488):** `contentRoot = docsRef ? resolveContentRoot(...)` builds no document path. Reading is owned once in paths.mjs `readLockedContext` (brief: join, do not duplicate). It may be an R5 pass-through, or it should carry an explicit join to the paths.mjs unit rather than its own park text. The park text is not wrong, only possibly duplicative.
- **N3. retrospective-doors 015657 (L207) and 015658 (L209):** the same `path.posix.join(docsRef, entry.name)` expression is ADMIT/park in the `file:` finding field and REJECT in the message. R5 lists "finding data fields that only carry a path value" as a reject class, so 015657 is arguably over-admitted. Whichever way it goes, the two should agree (one expression, one admission). Same question for 015653 (L173, `${docsRef}/CONTEXT.md` message) beside 015652. It is a reject under R6 caller-data, but it sits in the same function as the admitted 015652.
- **N4. docs/architect/doing-coordination-redesign.md preserves** (cleanup-harness 003862, replay 003904, status-fsm 003906/003907): all are dated tsk-40m comments. The only holder is the non-canonical docs/platform/proposals/doing-coordination-redesign.md. Preserve as dated provenance with a tree-retires witness fits R8 and the L12-78 P03 precedent. Confirm.
- **N5. knowledge-registry 003892-003899 (8 parks, inherited joins):** the Step 4 park is carried (ownerJoin exact), and I confirmed no live holder under docs/platform or docs/knowledge. L12-78 P03 treats dated knowledge-registry citations in tests as preserve, so the same kind of comment ends up park in src and preserve in tests. Confirm that is intended inheritance.

## Record-text notes (not outcome defects)

- dynamic-013447 (worktree L1002) and dynamic-015423 (truncation-guard L140): ADMIT/patch with `pathOperand: null`. The document path operand is the literal `docs/how-to/...md` inside the message. Both join the CLI-messages patches (reference-003784 and reference-003868) by census join. I checked targets and anchors: the docs/knowledge holders exist, as does docs/platform/git/spec.md section 7 ("No hardcoded trunk"). Please name the literal as pathOperand.
- pathOperand strings that are truncated expressions rather than operands: 013181 (`featureDir = path.join(repoRoot`), 013333, 013334, 015655 (`dirAbs = path.join(repoRoot`).
- reference-003783 has `successorNote: null`, with the successor named only inside `reason` (the target h-36d872fbb0e5.md#0022 exists). reference-003872's successorNote field is `docs/decisions/index.md`, while the live holder (retired-decision-history.md section 12, ADR 0027) is named only in `reason`. R8 wants the live holder in successorNote.
- dynamic-015576 reason cites "explicit tree retirement where specs/architect are named", but the passage (L42-48, `docs/${purposeSlug}/${role}.md` built by scripts/knowledge-migration.mjs) names neither tree. Boilerplate.
- reference-003897 (`docs/architect/...md`) is an elided literal, not a real path. It is kept because the Step 4 edge exists.
- The seven knowledge-registry park reasons share one template and differ only in the section quoted. They are inherited by exact join, so I treated them as accepted.

## Checked and fine

- Patches: priority-formula 003901 (to work-state/spec.md section 3, risk is free text, row 6), replay 003902 (to section 11, RUL27), gate-bypass 003876 (to docs/knowledge gate-bypass-design.md, mechanical-criterion heading), worktree 003781 (docs/platform/git/spec.md section 7) and 003788 (before-you-start). All targets and anchors exist. The inherited Step 4 diffs change only the cited comment lines. No file in this payload carries its own new diff; all diffs are inherited or joined, so there is nothing to check on source-file ownership.
- All admitted docs/history preserves exist at the pin. The docs/architecture-manifest.json preserve (events-compaction 003867) is a real retained root.
- Parks paths.mjs 013180-013182, work-dispatch 013331-013335 and retrospective-doors 015650/015652/015654/015655/015657: each reason is specific to its passage. Duplicated text (013334/013335, 015654/015655) is within one passage. The co-cut list on paths.mjs names the intake/runner callers and their tests.
- Rejects that really are not document operations: paths 013179, work-compat 013294/013295, work-dispatch 013330, worktree 013443, retrospective-doors 015649 (`excludeRelDirs` config) and 015659, knowledge-registry 015555/015556/015571/015575/015579-015610 (diagnostics and scalar comparisons). 015608 correctly admits the fixed `docs/` containment message.

## Counts

108 items reviewed. OUTCOME defects: 5 (D1 to D5; D5 may resolve as Lead decision). Lead-judgment: 5 (N1-N5). Record-text notes: 6.

Status: DONE_WITH_CONCERNS
Summary: 30 files, 108 items reviewed; 22 files ok, 3 need rework (worktree.mjs missing slot, retrospective-doors three false rejects, cleanup-harness state-path probes labelled scalar-pass-through).
