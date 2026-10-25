# Ownership audit: judge drift through the rebind door (Doer brief, records slice)

Status: Lead brief under L12-137 and L13-27. Read L13-27, `g0rework/ownership-drift-proof.json` and the top section of `g0rework/receipt.md` (turn 733) first.

1. In both `phase-06/step10-round5-reproduction.json` (`scripts`) and `step10-sync4d-reproduction.json` (`readOnlyScripts`), repair the drift test in the embedded `ownership.mjs`, and in `audit-ownership.mjs` if needed:
   - Keep the raw `targetDigestDrift` list as it is.
   - Add an accounted list. A raw row is accounted only when `rebind/rebind.py --check` authenticates that claim as a superseded origin (its effective successor matches the live unit) or as an identical-unit group (all members match). Read `rebind.py`'s own output; if it does not yet expose the authenticated group claim ids, add them there. Do not copy its matching logic into JavaScript.
   - `noNewDoubleOwnership` fails on any unaccounted drift row, just as it fails today on any drift row.
   - Change nothing else in those scripts. Above all, leave the exception list in `checks.mjs` untouched.
2. Record the new script hashes wherever the existing receipts or `g0rework/verify.py` pin them.
3. Two negative controls, run in tempfile copies:
   - a stale digest on a row with no successor must still fail;
   - a group with one non-matching member must still fail.
4. Proofs, all exit 0:
   - both live ownership pairs, from both manifests, run as `g0rework/verify.py` runs them now;
   - the historical replay at the authoring pin;
   - `g0rework/verify.py`;
   - `g0rework/refresh-carries.py --check`;
   - `rebind/rebind.py --check`;
   - `g0join/join.py --pin HEAD`.

   Update `g0rework/receipt.md` with every command and its exit code.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-reproduction.json
- plans/260925-documentation-authority-unification/reports/phase-06/step10-sync4d-reproduction.json
- plans/260925-documentation-authority-unification/reports/phase-09/rebind/rebind.py
- plans/260925-documentation-authority-unification/reports/phase-09/g0rework/**

Do not edit docs/, ledgers, pilot decisions, the register or reviews. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs, npm test or product tests, never `phase-08/audit-report.py` or `checks.mjs`, and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
