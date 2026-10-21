# Step 7 — deterministic consumer handoff assembler, pre-pin dry run (Doer brief)

Status: Lead brief for the next Doer turn (records tooling; non-docs).

You are Doer for Phase 8 of plan 260925-documentation-authority-unification in the fgOS repo. Step 7 ("Assemble the atomic consumer handoff", phase-08 file) depends on Step 6b, which waits for another lane to land on main. Everything else Step 7 needs exists now. This turn builds the assembler and runs it once as a dry run at current HEAD, so that at the final pin the Lead only reruns it. It flips no disposition and claims no readiness.

Read first: phase-08 Step 7 and Step 8 text; owner-answers.md L12-4, L12-7, L12-9, L12-58, L12-87..L12-98; step-05-closure.json, step-05-step7-carry.json, step-07-park-resolution-plan.json, step-07-park-families.json, step-06-evidence-receipt.json; the record dirs step-03-records*/, step-04-records/, step-05-records/ and their closures/checkers in this directory (reuse their loaders; do not re-implement a record parser that already exists here).

Writable: plans/260925-documentation-authority-unification/reports/phase-08/** only. python3 -B (or node). Never a git write except read-only git show/log/diff/ls-files, never the fgos CLI, never the .fgos directory or secrets; no code, docs, tests, gates, baselines, switchboard or ledger edits. Scratch /tmp/fgos-work/; commit only final result files (no intermediate dumps).

Build `step-07-assemble.py` (deterministic: same input commit → byte-identical outputs; takes `--pin <commit>` and an output dir) producing:
1. `step-07-consumer-cutover-matrix.json`: one row per census file/reference from Steps 3–5 (every admitted reference, every rejected reference with its non-document use or custody), each with exactly one disposition class: applied-safe, prepared-for-cutover (with its exact patch spec id), preserved-history/fixture, or individually parked (with blocker and the resolution-plan family id). No generic "all covered" rows. Writer destinations must never be aliases (check against alias-table.json) — report violations, do not fix them.
2. `step-07-patch-order.json`: ordered patch specifications (by co-cut unit / R26 unit, then path), each with rollback ordering (the inverse order) and the pinned source blob it applies to.
3. `step-07-readiness.json`: per-row readiness receipt fields with current status; rows that need Step 6b (lease receipts), the L12-96 state export, the final pin, Plan A/B phase 06 landing status, or P7-DOC-GAP-05 are marked with an explicit blocker name, never green.
4. A changed-candidate union: A47's original 35 changed candidate files, L12-1's thirteen incoming paths, every subsequent changed candidate from the merge accountings (L12-84, L12-88, L12-98 and earlier), and every Phase 8-edited docs/platform/** path, each with its rebind receipt reference or "needs-rebind".
5. The 16 step-05-step7-carry.json items and all A34 residuals, PF-I022/PF-I023 reconciliation, reading-map entry merge, holder-lock header, P7-DOC-GAP-05/06, each as a row with its status.
6. Park projection: for each of the 23 families in step-07-park-resolution-plan.json, the disposition each member WOULD take at the pin under L12-96, computed but written only as `projectedDisposition` (no record changes). Count the members per family; the total must be 2,311.

Run it at current HEAD. Report totals per disposition class, blocker counts, and any row that fits no class (each one is a stop to report, not to paper over). Write a short `step-07-preassembly-report.md` with those counts and the exact rerun command. Record L12-99 in owner-answers.md (pre-pin dry run: what is built, counts, what still blocks Step 7). Do not record a readiness claim.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
