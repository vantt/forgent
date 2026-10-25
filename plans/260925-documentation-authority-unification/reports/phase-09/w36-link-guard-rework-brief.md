# Link guard rework (Doer brief, records slice)

Status: Lead brief under L12-137. Read `reviews/w35-link-guard-review.{md,json}` first (7 areas APPROVE, 3 REWORK), then `w34-link-guard-brief.md`, `owner-answers.md` L13-4, L13-26 and L13-28, and `fchain/receipt.md`.

1. **High: a moved file must not come back because F edits it.** In `fchain/links.py`, `tree()` builds the post-F file set as `(paths - set(moving)) | set(states)`, which re-adds the 21 move-set sources that F also edits (for example `docs/doc-governance.md`, `docs/transitional-switchboard.md`, `docs/routing-handoff-contract.md`, `docs/README.md`). After F these paths do not exist at their old location; only their move destinations (if any) do.
   - Fix the post-F set so that a moving path is absent whatever states F writes for it. A link into a move-set source is a `linkGuard` finding (`moved-target`), as L13-26.2 required of `linkIntoMoveSet`; L13-28 extended that rule and did not replace it.
   - Add a control in `fchain/controls.py`: a clickable link and a Related entry into an edited move-set source each make `linkGuard` fail. The control must raise only that finding (w32 Info: a control that also raises an unrelated `conflict` is not isolated).
2. **Fix the hidden findings.** With the corrected guard, fix every new finding (the review found 11 Related entries: 5 pointing at their own file's source, 6 with a successor in another file) through `fchain/link-retargets.json`, using the L13-28 rule order. Retargets of clickable links into `docs/routing-handoff-contract.md` and `docs/io-contract.md` and the Related entries into the same files must now agree.
3. **Medium: successors named outside the move set.** Row `L13-28:related:36` (`docs/specs/seat-binding.md`) became a code span, but L13-4.1 names `docs/platform/seat-binding/spec.md` as its successor and that file exists. Retarget it.
   - Re-check every row made literal under rule 2.2 against all successor sources: the move set, owner rulings (L12-n, L13-n), the G5 survivors (`docs/reading-map.md`), and the new area specs. A row stays literal only when none names a successor; record the sources checked in the row.
   - Relabel `related:64` as rule 2.3 (it points at its own source).
4. **Medium: rule 2.4 applies to every retargeted link.** About 49 retargeted links still show the old file name as their label (for example `[doc-governance.md](../../../governance.md)`, `[workflow.md](workflow/spec.md)`, about 38 rows of `[host-invocation-provider-routing.md](spec.md#…)`). Where a label shows a path or file name of the old target, change it to show the new one; leave descriptive labels alone. Add a check to `linkGuard` (or `check.py`) that fails when a retargeted link's label still names the old target's file, so this cannot return.
5. **Receipt.** Correct `fchain/receipt.md`:
   - the false "Related entries pointing into the move set 67 → 0" (recount with the fixed guard);
   - "398 inside literal fences" is 394 inside fences plus 4 multi-line inline code spans in `P00.1.md`;
   - name the three shard-3 patch changes as needing the final-F delta review.

Proofs, all exit 0:
- `fchain/check.py --pin HEAD` with 0 `linkGuard` findings (restore `fchain/check.json` if only volatile fields changed; delete any `chain-check-*.json` it writes);
- `fchain/controls.py`, including the new controls;
- `check_shard.py --all`;
- `g9/check_phase9_decisions.py`;
- `node plans/260925-documentation-authority-unification/reports/phase-09/carries/verify-carries.mjs`.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/fchain/**
- plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/park-judgments/**
- plans/260925-documentation-authority-unification/reports/phase-09/g9/**

Do not edit docs/, ledgers, reviews or other records. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs, npm test or product tests, never `phase-08/audit-report.py`, and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
