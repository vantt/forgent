# G0: seven rationale corrections and stale prose (Doer brief, records slice)

Status: Lead brief under L12-137 and L13-25. Read `reviews/w27-g0-stale-verdicts-b7.{md,json}` and `reviews/w27-g0-stale-verdicts-b8.{md,json}` first.

1. **The 7 REWORK rows.** In every one the decision is right and only the rationale text is wrong:
   - `g0-content-redecisions.json` `/bindingRefresh/45`: name the change from "(9 file)" to "trong nhiều file (ví dụ …)".
   - `/bindingRefresh/125` and `/126`: also name the two link-label changes ("Enduser Docs Authoring/Index Spec" → "… Contract").
   - s4-packaging-distribution-architecture `/claims/214`: name the real unit, block-23 at line 258 under "Canonical Release Tree Rules", and the real link destination.
   - s5-root-boundary-sync `/registryGaps/35` and s9-runner-01 `/registryGaps/0`: name block-101, lines 1244–1294.
   - s9-runner-01 `/claims/12`: cite the block-11 ruling (`s13-resync-a /sourceBindings/343`).

   Correct only the rationale text, and set `reviewStatus: pending`.
2. **Non-blocking notes from the same reviews.** Fix them while you are in these files:
   - stale line ranges;
   - the "Target unchanged since …" sentences that contradict the corrected SHA;
   - the two residual rows' `placement.selected` digest `299c5b49`, refreshed to the current placement.

   Change no binding or decision field beyond these.
3. **Proofs.**
   - `rebind/rebind.py --check` exits 0.
   - `g0join/join.py --pin HEAD` reports only the rows changed in this turn as stale or missing, and nothing else open. Commit its output as `g0join/join-<shortpin>.json`.
   - List every changed row in `g0join/followup-receipt.md`, with every command and its exit code.

Writable (exact):
- plans/260925-documentation-authority-unification/ledger/decisions/**
- plans/260925-documentation-authority-unification/reports/phase-09/g0join/**
- plans/260925-documentation-authority-unification/reports/phase-09/import2/partial-carry-residuals.json

Do not edit docs/, the register, reviews or other scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs, npm test or product tests, never `phase-08/audit-report.py`, and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
