# Gloss polish and sweep hygiene (Doer brief, records slice)

Status: Lead brief under L12-137. Read `reviews/w12-g9-followup-review.{md,json}` first. Fix its findings M1–M3 and L1–L3.

1. **M1, git spec list (witnesses #35–#39, `docs/platform/git/spec.md` about lines 1075–1079).** This was a numbered D1–D9 list.
   - Restore a list label on every item. Use a form the citation scanner does not read as a decision id, as the holder-lock fix did.
   - Start each item with a capital letter.
   - Drop the repeated subtitle, e.g. "order (order)".
2. **M2, holder-lock (#62).** "mục N" already means "section N" in that spec. Relabel the restored list items with a distinct form such as "(1)"…"(8)" or "Ý 1"…, and keep "mục" only for sections.
3. **M3, holder-lock #65 (about line 430).** Point "D8" to the restored list item 8 of the main-door entry. Write the sentence in Vietnamese with no English clause in it.
4. **L3, older wording faults.**
   - #47, #50 and #59 have Vietnamese explanations inside English sentences; rewrite each so the sentence is in one language, matching the surrounding text.
   - #94 has nested parentheses; flatten them.
   - #2 is garbled at a join; repair it.
5. **The list-label audit rule.** Extend it in `composition/w10-gloss-audit.json`'s generator to catch a lost label in a vertical numbered or lettered list, one item per line, not only several labels on one line. Rerun it across all witnesses, and keep the complete per-witness result.
6. For every changed gloss:
   - regenerate its diff and witness;
   - replay the full chain with `patch --fuzz=0`, forward and rollback byte-exact;
   - rerun the citation scan with the glosses applied (it must report 0 findings);
   - recompose every G9 body whose chain changed.

   Then `g9/sweep.py --check --pin HEAD` and `g9/verify.py --pin HEAD` must exit 0.
7. **L1.** `sweep.py --check` imports `recompose.py`, which creates `/tmp/fgos-work/w11-g9` on import. Make the check side effect free: no directory is created on import, and any temporary space it needs is a `tempfile` directory that is removed on exit. Make the docstring true.
8. **L2.** In `g9/receipt.md`, label the "Passages" column as evidence per row, 21,194, and give the unique passage count, 20,621, next to it.
9. Update `composition/receipt.md` and `g9/receipt.md` with the commands and their exit codes.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/g9/**
- plans/260925-documentation-authority-unification/reports/phase-09/composition/**

Do not edit docs/ or ledgers. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs or npm test. Always `python3 -B`. Scratch `/tmp/fgos-work/w12-gloss/` only; delete it at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
