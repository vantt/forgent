# G9: gateway readers and the remaining phase-9 dependencies (Doer brief, records slice)

Status: Lead brief under L12-137 and L13-21. Read `reviews/w23-g9-phase9-decisions-review.{md,json}` and L13-21 (items 5 and 6) in `owner-answers.md` first.

1. **The three gateway "moved" entries** (reference-000200, dynamic-000767, dynamic-000768). List every reader of `docs/contracts/fgos-gateway-api-v1.yaml`, both code and docs:
   - the 4 candidate docs the review names;
   - the two `packages/yaml-doc` mentions, recorded as excluded with a reason;
   - any other reader you find with `rg`.

   Each doc reader needs a G6 row reference or an entry in a new `g9/f-composition-additions.json`, with a prepared patch in the existing patch format. That patch is checked on top of the F chain with `preserve-premise/park-judgments/check_shard.py`'s chain-replay helper if it exists at your HEAD; otherwise with `patch --fuzz=0` on the chain result built the same way. Mark the cited bin patch (reference-000232/235/236) as stale against the pin, to be rebased at F.
2. **The other 53 Phase-9 dependencies** that phase 08 left in records that are not carriedBlocker records. Re-derive the full set of 158 from `phase-08/step-05-records/` (every parked dependency naming Phase 9) and decide each of the 125 not yet decided, the same way as the 33: retained-in-place, moved (with readers and patches) or retired. That includes the 17 `docs/doc-governance.md` rows and the 1 `docs/architecture-map.md` row. Cite `phase-08/step-07-park-resolution-applied.json` where phase 08 already decided a row, and say so. If the design does not decide a row, propose a decision and mark it `leadDecisionProposed`.
3. **Checker.** Extend `g9/check_phase9_decisions.py` with the review's gaps:
   - tie each retained entry's quote to its own file;
   - tie the decision type to its source;
   - check that retired and moved patches apply on the F chain result;
   - take the reader set from an `rg` scan, not only R26.

   Keep the existing 14 negative controls and add one for each new rule. It must exit 0.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/g9/phase9-decisions.json
- plans/260925-documentation-authority-unification/reports/phase-09/g9/phase9-decisions.md
- plans/260925-documentation-authority-unification/reports/phase-09/g9/check_phase9_decisions.py
- plans/260925-documentation-authority-unification/reports/phase-09/g9/f-composition-additions.json

Do not edit docs/, src/, ledgers, the register, shards or other scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs, npm test or product tests, never `phase-08/audit-report.py`, and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
