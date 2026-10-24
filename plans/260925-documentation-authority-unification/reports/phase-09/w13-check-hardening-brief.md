# Live check strength and small hygiene fixes (Doer brief, records slice)

Status: Lead brief under L12-137. Read `reviews/w13-misc-pin-and-gloss-review.{md,json}` first.

1. **A-M1, the misc-fix live check is too weak.** Today `misc-fix/rebind.py --check` compares only the four binding keys of each live misc overlay row. On the live tree it must also prove the following:
   - `bindingSha256` recomputes from the live row's payload.
   - `reviewStatus` is `pending`, unless a committed review record approves that exact claim and binding. Name the record.
   - The non-binding fields (`claimId`, `sourcePath`, `sourceAnchor`, `sourceUnitDigest`, `sourceAncestry`, `sourceContent`, `unitKind`, `disposition`, including the corrected 136/5 disposition text) equal the authoring bytes, or a later recorded rebind that lists its preimage changed them.

   Replay the reviewer's three controls in scratch: set `reviewStatus=approved`, zero `bindingSha256`, and change `disposition`. Each one must now fail. Fix the receipt sentence about "all earlier assertions remain" so it says exactly what is checked at the authoring commit and what is checked live.
2. **A-L1.** `misc-fix/rebind.py --check` and `misc-fix/verify.py` leave `/tmp/fgos-work/w11-misc-pin` behind. Use a `tempfile` directory removed on exit, the same pattern `g9/sweep.py` now uses, and delete the stale directory.
3. **B-L1.** The vertical-list label rule in the gloss audit fires only when a neighbouring line was also glossed. Make it look at the surrounding list in the after-bytes (the lines just before and after the glossed line), so it also catches a lone glossed item that lost its label in a longer list. Rerun it on all witnesses and keep the full result.
4. **B-L2.** Make the temp-workspace code in `g9/` safe when two runs overlap. Use a unique `tempfile.mkdtemp` per run and never share a fixed path.
5. **B-L3.** Witness #2 calls the Stop-drain decision an open fork and gives its answer in the same parentheses. Reword it so it says only what is true. Then regenerate the diff and witness, replay the chain with `patch --fuzz=0` forward and rollback byte-exact, rerun the citation scan (it must report 0 findings), and recompose the G9 body if its chain changed.
6. Proofs, with the commands and exit codes recorded in the receipts:
   - `misc-fix/verify.py` exits 0;
   - `rebind/rebind.py --check` exits 0;
   - `g9/sweep.py --check --pin HEAD` exits 0;
   - `g9/verify.py --pin HEAD` exits 0;
   - no directory is left under `/tmp/fgos-work` by any check.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/misc-fix/**
- plans/260925-documentation-authority-unification/reports/phase-09/g9/**
- plans/260925-documentation-authority-unification/reports/phase-09/composition/**

Do not edit docs/, ledgers or other scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs or npm test. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
