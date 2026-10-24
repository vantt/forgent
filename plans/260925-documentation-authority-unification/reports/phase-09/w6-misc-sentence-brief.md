# Example framing scoped to the sentence or table cell (Doer brief, records slice)

Status: Lead brief under L12-137. Follows review `reviews/w6-misc-rework-review.{md,json}` (10 APPROVE / 1 REWORK) of 9d6070828 (brief `w5-misc-rework-brief.md`). Read the review first.

**Lead ruling (A42):** the four rows f00445, f08621, f08646 and f08700 keep `preserve-operand-reachability-unchanged`. They are real citations, their targets exist at the pin and after the move, and that was their result before the whole-unit rule. Record this ruling in `preserve-premise/receipt.md`.

Fix in `preserve-premise/proof.py` (around lines 118-128):
1. Search for the example marker only in the sentence or table cell that contains the span's `columnStart`. Use `|` boundaries for table cells, and split sentences on `. `, `; ` and `—`.
2. A `<placeholder>` inside the span text is evidence on its own when the reason says "illustrative", so f07822 and f08072 stay confirmed without borrowing a marker.
3. Add a negative control: a marker on the same line but in a different sentence must not frame the span.
4. Assert f07821 (`docs/platform/runner/subcomponents/h-6979005beaf7/spec.md:67`, column ~939) is `preserve-operand-reachability-unchanged` with `evidence: null`.
5. Rerun `proof.py --pin 4178dcc6e` twice and show the runs are byte-identical. Update the counts in `preserve-premise/receipt.{md,json}` and `misc-fix/receipt.md` (example-framed is expected to fall from 6 to 5, stable-operand to rise by 1; report the real numbers). Run `misc-fix/verify.py` and `preserve-premise/verify.py`. The combined verifier still stops only on the G2 pin, which is a final-pin item; show that this is the only failure.

Writable (exact): plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/**. A parallel turn owns misc-fix/** and the decision files: do not touch them. If a receipt line in misc-fix/receipt.md needs a count change, put it in preserve-premise/receipt.md and say so. Never a git write (the runner commits), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs or npm test. Scratch /tmp/fgos-work/w6-misc-sentence/ only.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
