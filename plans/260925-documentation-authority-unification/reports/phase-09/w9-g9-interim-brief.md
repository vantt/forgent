# G9 interim: source context and spec drift at current HEAD (Doer brief, records slice)

Status: Lead brief under L12-137. Gate G9 (`preflip-execution-plan.md` §2) has to be met at final pin F. This turn does the bulk now, at HEAD, so that F only replays the delta. Read first: `preflip-execution-plan.md` §2–3, `preflip-gate-status.json` (G9 row), `../phase-08/step-08-preflip-gates.json` → `sourceContextAndPostPinRecomposition` (518 `changedRecords`) and the L12-130 overlaps (10 Step 3 / 9 Step 4 / 125 Step 5, in `../phase-08/step-08-l12-130-*`), `w0-deferred-rebinds.json` (W0 deferred 11/4/7), and `reviews/w4-import2-review.{md,json}` (open REWORK source-pin-provenance).

Do:
1. **Rerunnable tool.** Commit `g9/sweep.py` (python -B). `--pin <commit>` defaults to HEAD; it hardcodes no commit. For every record in scope, it reads the record's bound source passage and the current file at the pin, and classifies the record:
   - `unchanged`: the passage is byte-equal;
   - `moved`: same passage, new place;
   - `changed`: the passage text differs;
   - `absent`: the passage is gone.

   It also runs the **all-spec hash sweep**: every composed spec (`../phase-07/step-07-patch-order.json` plus the composition records) must have `beforeSha256 == sha256(file@pin)`. List every drifted spec. With `--check` it exits 1 on any unjudged change or any drift.
2. **Re-judge** at HEAD every record classified `changed` or `absent`: the 518 records, the 144 overlaps and the W0 deferred 11/4/7. Read the current passage and give one disposition per record:
   - still valid as recorded;
   - needs recomposition (prepare a patch at current bytes and replay it with `patch --fuzz=0`, forward and rollback byte-exact);
   - owned park (owner plus concrete next action).

   "Disposition-only rows are not ready": every row needs evidence (current line numbers and digest). Write the results to `g9/judgments.json`.
3. **Recompose drifted specs** at current bytes, using the same replay proof. Record them in `g9/recomposed.json` and keep the predecessor chains.
4. **Doer SHA provenance (the w4-import2 REWORK).** Some records pin pre-rebase Doer commits that are reachable only from the `plan/260925-w1-d*` branches or `keep/w1-d2-late-areas`. For each such pin, find the plan-branch commit with the same `git patch-id`, and record the mapping in `g9/sha-map.json`. Re-pin the record to the plan-branch commit only when the patch-ids are equal; otherwise list it.
5. Write `g9/receipt.md` in short, plain English: counts per classification and disposition, the drifted and recomposed specs, the SHA map, and every command with its exit code. `g9/sweep.py --check` must exit 0 at HEAD, with every change judged.

Writable (exact): plans/260925-documentation-authority-unification/reports/phase-09/g9/**, plus the record files whose pins step 4 re-pins (list them in the receipt; they must be under plans/260925-documentation-authority-unification/reports/** or plans/260925-documentation-authority-unification/ledger/**). Do not edit docs/: every doc change is a prepared, replayed patch. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never code or tests, never scripts/run-tests.mjs or npm test. Always `python3 -B`. Scratch /tmp/fgos-work/w9-g9/ only.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
