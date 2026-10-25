# Register update after the link guard (Doer brief, records slice)

Status: Lead brief under L12-137. Read first:
- `reviews/w32-register-review.{md,json}` (18 APPROVE / 3 REWORK, plus low notes);
- `reviews/w33-ownership-audit-review.md`, `reviews/w33-link-retargets-review.md`;
- `reviews/w35-link-guard-review.{md,json}` and `reviews/w37-link-guard-rereview.{md,json}`;
- `owner-answers.md`, rulings L13-26, L13-27 and L13-28;
- `fchain/receipt.md` (the whole-population link guard, commit 8ea185bfd).

Regenerate `preflip-gate-status.json` through `gate-reconcile/reconcile.py`, so that the register states what is true at HEAD. Fix the reconciler's inputs or code where needed; do not hand-edit the generated register.

1. **Review coverage.** `localCorrectionReview` lists every local correction with the independent review that covers it:
   - a319902ab (link retargets): w33-link-retargets, 4 APPROVE / 1 REWORK, the REWORK fixed in 8ea185bfd;
   - 8ea185bfd (whole-population `linkGuard`, row 125, gateway references): w35-link-guard, 7 APPROVE / 3 REWORK;
   - b467e09fe (rework of w35): w37-link-guard-rereview, 10 APPROVE / 1 REWORK; that REWORK (duplicate row id `L13-28:related:86`) is fixed by the Lead in edf816838 (the coexistence row is now `L13-28:related:118`, and `check.py` refuses duplicate row ids). Record it as a Lead fix of a mechanical defect, verified by `check.py` exit 0 and a duplicate-id probe that fails;
   - 73e89962e, 98d71bef2, ca3179b3c, c3882df26 (ownership audit): w33-ownership-audit, 5 APPROVE;
   - the register catch-up itself: w32.
   If any of these reviews has a REWORK still open, the affected gate is `partial` with that review named as the blocker, not met-local.
2. **G6 and F composition.** The G6 note cites L13-28 and the `linkGuard` result (0 findings over the composed `docs/platform/**` population, Related headers included), not only L13-26.
3. **Guard 3 F duty (L13-28.4).** Add an `atFinalPinUnderLease` duty: the docs/platform link guard landed with the cutover must agree with `fchain/links.py` `linkGuard` on the composed tree at F (same population, same fence and anchor semantics), and both must report 0. Name two known disagreements with today's product reader `scripts/check-doc-candidate-status.mjs`, which the cutover guard must not inherit: it counts link-like text inside fences and multi-line inline code (398 occurrences), and its `relatedPaths()` does not resolve Related entries that end in `#anchor` (44 entries, w37 low note). Add a second duty from w37: the shard-2 patches changed after their review get the final-F delta review.
4. **Last F duty.** Reword "the owner packet was already sent at met-local" as a precondition: "the owner has approved the cutover packet (L13-6)".
5. **Low notes from w32:**
   - G0 `commit` field: the current join commit, not a8ea05c50; name the selected component-boundary predecessor step in the duty text.
   - G7: name the effective spec `rebased-current:rebased:w8:gloss:docs/platform/work-state/spec.md` (verdict pending) and its basis, a pure rebase with an identical change set.
   - G9: record the 136 recorded vs 138 census occurrences (2 history-only misses) and the disclosure that W15 sampled 60 of the 288 still-valid rows.
   - `fComposition`: correct the source label (the composed replay, not `manifest.json`) and refresh its counts from the current `fchain` records (composed files, executed proposals, link rows and patches, as `fchain/check.py` reports them at HEAD).
   - `followUps`: give each item an owner (`lead:DOC`) and a destination: "separate backlog item, filed when the cutover lands (backlog on main is outside PRE-FLIP scope)". Keep the four items and their sources.
6. **Rebind record status.** `rebind/g0-rework-rebindings.json` still says `authored-pending-independent-review`. Set it to reviewed, citing w33-ownership-audit, using the record's existing status field; leave every edge byte unchanged.

Proofs, all exit 0:
- `gate-reconcile/verify.py`;
- `gate-reconcile/controls.py`;
- `rebind/rebind.py --check`.

Restore volatile fields that only a rerun changed. Update `gate-reconcile/receipt.md` with each gate's status before and after, and every command with its exit code.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/preflip-gate-status.json
- plans/260925-documentation-authority-unification/reports/phase-09/gate-reconcile/**
- plans/260925-documentation-authority-unification/reports/phase-09/rebind/g0-rework-rebindings.json

Do not edit docs/, ledgers, reviews, other records or other scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs, npm test or product tests, never `phase-08/audit-report.py`, and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
