# G2: settle the 187 owned census judgments, and correct the gate register (Doer brief, records slice)

Status: Lead brief under L12-137 and L13-17. Read `reviews/w18-gate-reconcile-review.{md,json}` and `census-join/receipt.md` first.

1. **G2 judgments.** The G2 gate requires each of the 1,126 census ids to be joined either to an owning proof or to a confirmed REJECT. 187 ids are still "owned judgments" in Lead custody (159 fixture, 21 drifted-grade, 7 other). Settle each one at the current HEAD:
   - **joined:** name the owning test (file, test title, line) that exercises the literal or fixture. Use the existing join grammar in `census-join/join.py`.
   - **confirmed REJECT:** the grade record supports REJECT. For the 21 drifted-grade rows, show why the drift does not change the grade, or re-grade with a reason.
   - **owned park:** only if neither is possible from the repository. Give a named owner, the reason, and a concrete next action. Each park keeps G2 open, so expect few.

   Group rows that share one cause and give each group one explanation, but give every row its own disposition and locator. Keep the existing pinned run reproducible. Add the settlement as a pinned layer (`--pin <HEAD at start>`), and do not rewrite old grade records. `join.py` must replay byte-identically twice.
2. **Register corrections** in `preflip-gate-status.json`, from the w18 findings and ruling L13-17:
   - G2: back to `partial`. Remove "settle/review the 187 original owned judgments" from its F item, and add a `remaining` entry that points at this turn's receipt. It becomes met-local only after an independent review.
   - G9 note: W15 reviewed the 50 parks, superseded rows and recomposition rows in full, and sampled 60 of the 288 still-valid rows. Say exactly that.
   - G6 note: W9 approved db023f065's reclassification of 319 parks and 20 operand rows by rule, with a 56-row spot check. That is accepted under L13-17.3. Cite it.
   - G6 F item "co-compose … owned-park actions": cite L13-17.2.
   - G6: add a `remaining` entry: an independent re-review of 25e8842d3, the misc-fix receipt counts.
   - G0 F join duty: add that the duplicate rows `/bindingRefresh/124..126` must follow any later rebind of `/6`, `/20` and `/21` (W16 note).
   - Fix the w18 Info labels in `gate-reconcile/receipt.*`: the "still open" item whose only part is cleared, the G3 F citation of W3, and the missing W13/W14 citations on G9 cleared item 1.

   Then rerun `gate-reconcile/verify.py` and `controls.py` (exit 0), and restore volatile fields.
3. **Proofs.** All must exit 0 and be listed in `census-join/receipt.md` with their exit codes:
   - `census-join/join.py` at your pin, twice, byte-identical;
   - `gate-reconcile/verify.py`;
   - `gate-reconcile/controls.py`.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/census-join/**
- plans/260925-documentation-authority-unification/reports/phase-09/preflip-gate-status.json
- plans/260925-documentation-authority-unification/reports/phase-09/gate-reconcile/**

Do not edit docs/, tests, ledgers or other scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs or npm test, never `phase-08/audit-report.py`, and never load native addons. Do not run product tests; name proofs by locator. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
