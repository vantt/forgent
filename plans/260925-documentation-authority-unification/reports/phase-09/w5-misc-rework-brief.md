# Misc fix rework: doctor split and line-scoped example framing (Doer brief, records slice)

Status: Lead brief under L12-137. Follows review `reviews/w5-misc-fix-review.{md,json}` (9 APPROVE / 2 REWORK) of commit ad94156cf (brief `w4-misc-fix-brief.md`). Read the review first.

1. **Doctor split.** The total of 141 checks is right, but the split is not 133 literal + 8 loop-registered. `src/setup/registrations.mjs` has 136 literal `registerCheck({ id: '…' })` calls plus one loop (around line 6340) that registers 5 Git ids. Write "136 literal plus 5 loop-registered Git ids" everywhere the false split appears:
   - the block-5 reason in `ledger/decisions/s13-resync-a.json`;
   - the 8 block-90 overlay reasons in `ledger/decisions/s17-misc-review-fixes.json` (fix the reason string in `misc-fix/rebind.py` that generates them so that `--check` stays green);
   - `misc-fix/receipt.md`.

   Make `misc-fix/verify.py` derive both numbers from the source and assert the split, not only the total. `resync-a/adjudications.json` (143) is outside this brief, so record it in the receipt as a known stale historical copy. If any binding hash changes, rebind with the recipe in the review.
2. **Line-scoped example framing.** `preserve-premise/proof.py` (~117-119) searches the whole bound unit for the example marker. It must instead search only the span's own lines (`currentLines`), or the sentence or table cell that holds the span.
   - Add a negative control: a marker elsewhere in the same unit must not frame the span.
   - Re-judge every row. The 9 rows the review names (f00166, f03953, f07667, f08643, f08645, f08668, f08681, f08748, f08817) must go back to parked unless their own line is framed. Do the same for f00445 (its "e.g." sits in an error message) and for real citations such as f08621, f08646 and f08700.
   - Re-cite f07822 on its `<id>` placeholder.
   - The five rows from the previous brief must still be judged by the line-scoped rule; report their result.
   - Rerun `proof.py --pin <HEAD>` twice and show the runs are byte-identical, then run `misc-fix/verify.py` and `preserve-premise/verify.py`, both exit 0.
3. Update `misc-fix/receipt.md` and `preserve-premise/receipt.md` with the counts before and after. Note the review's out-of-scope finding (`docs/distribution-vision.md:87` and `docs/explanation/iron-law-classification-recipe-path.md:45` still say `git rev-parse --git-common-dir`) as a residual for the Lead; do not edit those files.
4. No pair accounting in this turn: the Lead accounts the pairs after merging, because a parallel turn edits the same manifests.

Writable (exact): plans/260925-documentation-authority-unification/ledger/decisions/s13-resync-a.json, plans/260925-documentation-authority-unification/ledger/decisions/s17-misc-review-fixes.json, plans/260925-documentation-authority-unification/reports/phase-09/misc-fix/**, plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/**. A parallel turn is rebinding other decision files; do not touch any other file under ledger/ or pilot/. Never a git write (the runner commits), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs or npm test. Scratch /tmp/fgos-work/w5-misc-rework/ only.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
