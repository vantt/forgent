# Agent Coordination — single rework review request

Status: authored rework; **blocked on two owner contract decisions before the complete re-review can start**. This is not batch closure or an unconditional ready-for-review release. No second batch is started. First independent reports are committed in bb03cab52579d358015c611fa8b8543062a6e4da; follow review-brief.md and their owner-approved reading method. Ordinary review has no seeded pack/red-team; checkpoint procedure remains after Step 3, Step 6 and Step 10.

## Completed corrections

| Workset | Current result | Re-review scope |
|---|---|---|
| Manual source rows | 1,435 total; 1,329 reviewed; 106 pending | Original 78 reworks, 27 previously accepted kind corrections, one withdrawn exact proof. Four raw-log rows still await binding decision. |
| Candidate text | abf4bf803 labels additions/restores source context; 1f4f0b062 consolidates a duplicate paragraph | Seven candidate files in post-review-edits.md; both enum texts unchanged; literal historical snapshots preserved; full contract transition block remains exact. |
| Conflict receipts | 74 corrected | 69 evidence-name rules, equal-blob SVG receipt, four previously accepted receipts with changed member evidence. |
| Identical-unit exceptions | 206 unchanged accepted; 128 corrected pending | 126 shared rechecks explicitly have one origin in two sibling receipts, not separate observations; same-cell and document-metadata cases corrected. No source receipt is deleted. |
| Reverse classifications | 125 unchanged accepted; 59 corrected proposals | Five labelled frames, scheduler source binding, consolidated paragraph/retired unit and 52 blocked same-path copies. Current mechanical open count remains 182. |
| Script proof | 12,878 mirror rows plus 2,721 Unit-exact rows | The changed scheduler introduction is explicitly demoted to pending manual review, never silently passed as exact. |
| Legacy links | 17 target units queued | candidate-legacy-link-queue.json; 50 observed occurrences including heading/child overlap. Step 10 owns the rewrite. |

Current text pin: 1f4f0b06274fa95fe94f10e904e1ff12a2898ef4. Approved application commit: fa39f6416984fce0804b25a05e23af55b9d1a72f. Corrected data commit: 7df171219df1dab4662d609246d10fcc8c271fda. Five native ordinary packs at that commit contain 16/64/21/4/1 pending rows; hashes and exact commands are in rework-packet.json. They are prepared, not approved, and the complete re-review remains owner-blocked. Do not use historical first-review pack pins for corrected text.

## Owner decisions first

1. **Physical carrier versus semantic owner:** corrected 48 mirrors plus four logs are saved in same-path-binding-blocker.json, not activated. Activation creates 12 fatal semantic-owner splits. No identical-unit exception or baseline permits these. The original wrong-carrier bindings remain visible pending review; green D is not proof they are corrected.
2. **Candidate-native/frame reverse proof:** 125 accepted native/bookkeeping units and five labelled frames have authentic candidate origin, not invented legacy sources. The frozen reverse checker skips canonical-source rows and consumes no origin/frame report. Both strict runs therefore retain 182 unreferenced units including the 52 blocked copies. No checker acceptance, identity or vocabulary is changed.

Options and recommendation are in owner-queue.md. Complete the owner-approved representation, then regenerate the full workset and use the one allowed rework review. Do not spend that round approving an incomplete binding draft.

## Paths and reading order

1. owner-answers.md, owner-queue.md, this request, review-rework-evidence.json (all pending ids, before/after decisions, 74 receipt audits, 128 exception audits, 59 reverse audits, exact gate commands/results).
2. ledger/decisions/s2-agent-coordination-judgment-01.json, judgment-02.json, judgment-03.json, log-duplicates.json and reopened-exact.json (the abbreviated names share the s2-agent-coordination- prefix); ledger/retired-unit-decisions.json for the consolidated candidate paragraph.
3. ledger/conflict-resolutions.json; identical-unit-exceptions.md/json; reverse-agent-coordination.md/json; same-path-binding-blocker.json; post-review-edits.md; candidate-legacy-link-queue.json.
4. The seven current candidate files: proposals/dag-request-scheduler.md, proposals/README.md, verification/README.md, contracts/README.md and history/documentation-migration/{documentation-governance,documentation-standardization-plan,source-inventory}.md, all below docs/platform/agent-coordination/.

Regenerate with the existing native refresh command in review-rework-evidence.json, carrying forward the scratch registry and projecting only the explicit retired decisions, never copying an old registry over it. Then, for each of the five source shards, run `node scripts/propose-doc-decisions.mjs --pack <full-shard-path> --inventory /tmp/phase06/review-doc-inventory.json --repo-root /home/vantt/projects/forgentX-phase00-documentation-authority-unification --out /tmp/phase06/rework-<shard>.md`. Read every pending judgment row and both directions. Use committed independent ordinary reports with the source/target digests of the shown text; the author does not stamp approvals. The first reviewer already independently sampled 100 script-proven rows; recheck changed proof/carrier rules against the newly released population rather than treating the historical sample hash as a current proof.

## Exercised checks and remaining limits

D: existing invocation with --previous-registry, once against reports/identity-registry.json and once against reports/phase-02-identity-registry.json, both exit 0 / zero fatal. E: same inputs plus --strict and 937 explicit --scope paths, both exit 1: 106 not reviewed, 334 contextual identical exceptions, 182 reverse-open. Unchanged comparator: holds 0, exceptions 334; rejects pending and reverse-open counts. A zero unexpected / exactly five A3 pairs; B/C/I unchanged; G no lost-id or self-review; F ratchet 995/24/1, placement 448/447 with one recorded exception and zero leftovers; H 30 accounted, zero new tuples, Agent Coordination zero.

P6 closure, reduced promotion rehearsal and fresh-reader runs are **UNPROVEN** and dependent on committed re-review plus the two owner decisions. No passing strict result, batch close, new gate relaxation or next-batch progress is claimed.

Owner visibility: 65 temporary migration-notice dispositions independently accepted; no physical legacy archive or delete-as-obsolete. Holds zero. Prior promoted-portal edits remain in promoted-edits.md; no new promoted document or area-status change in this rework.
