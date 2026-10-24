# G6 fixes: operand normalization, owned removed rows, file-level framing, f07526 (Doer brief, records slice)

Status: Lead brief under L12-137. It follows two exhaustive reviews; read both first:
- `reviews/w8-g6-parks-review.{md,json}`: 1,220 APPROVE / 40 REWORK.
- `reviews/w8-g6-judgments-review.{md,json}`: 163 APPROVE / 1 REWORK.

Lead rulings under A42 are recorded in owner-answers L13-10.

1. **Operand normalization (class A, 15 rows:** f00144, f00417, f00418, f00419, f00429, f03463, f03478, f04208, f04387, f06557, f06569, f06829, f07654, f08000, f08062**).** In `preserve-premise/proof.py`'s operand step:
   - strip a trailing `:<n>[-<n>]` and a leading `@`;
   - when the census path is a substring of a longer path on the bound line, take the full path from the line;
   - treat a target outside `docs/` that exists at the pin as still present after the move (the move touches only `docs/`).

   Add one positive and one negative control for each rule.
2. **Removed rows with no destination (class B, 25 rows:** 24 in `docs/specs/reading-map.md` f08209…f08288, plus f08335 in `docs/specs/workflow.md`**).** Never print an empty successor list. For each row, give a concrete action: name the holder to recheck (`docs/reading-map.md` for the reading-map rows, `docs/platform/workflow/spec.md` for f08335), or add the row to `retire-with-tree.json` with a reason, the same way the 38 work-state rows were added. Choose per row from the content and say why.
3. **File-level historical framing (ruling L13-10).** The one-sentence rule over-parks rows whose premise is set by the whole file. Add two evidence rules, each with negative controls:
   - (a) a file under `docs/distillery/sources/` or `docs/distillery/reports/` whose header states that it describes an outside repo or upstream project;
   - (b) a dated report under `archive/plans/` or `plans/reports/`, which is history by location, as in L12-26(8).

   A rule applies only when the file-level marker is real (quote it in the evidence). Report how many rows each rule moves, with the before and after counts. Do not touch live conventions such as `docs/history/<feature>/`.
4. **Live links that break after the move** (f08113, f08071, f06985): make each a `repoint-proposal` to the successor its blocker already names.
5. **f07526.** Make one patch for `docs/platform/proposals/dispatch-control-plane-redesign.md`:
   - line 29 → `docs/platform/agent-coordination/architecture/dispatch-control-plane.md`;
   - line 33 → `docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md`;
   - line 37 → `docs/platform/agent-coordination/README.md`;
   - in line 22, replace "The three inline-code legacy paths are retained pending cutover" with "The three inline-code legacy paths were repointed to their docs/platform holders at cutover".

   Reclassify f07527 and f07528 as `repoint-proposal`. Record the patch as a prepared patch; do not edit the doc in this turn.
6. Notes for later placement (do not apply now): write each dated note after the header's closing fence; merge the two notes in the 73 two-note files into one; date the note with the flip date, not 2026-10-23; f06391 "records" → "recorded".
7. Rerun `proof.py --pin 4178dcc6e` twice and show the runs are byte-identical. Update `preserve-premise/receipt.{md,json}`, `judgments.json`, `history-wrapper-proposals.json` and the counts in `misc-fix/receipt.md`. Run `misc-fix/verify.py` (exit 0), and confirm `preserve-premise/verify.py` stops only on the G2 pin.

Writable (exact): plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/**, plans/260925-documentation-authority-unification/reports/phase-09/misc-fix/receipt.md, plans/260925-documentation-authority-unification/reports/phase-09/misc-fix/checks.json. No pair accounting. Never a git write (the runner commits), never the fgos CLI, never .fgos/ or secrets, never docs/ or code, never scripts/run-tests.mjs or npm test. Always `python3 -B`. Scratch /tmp/fgos-work/w8-g6-fix/ only.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
