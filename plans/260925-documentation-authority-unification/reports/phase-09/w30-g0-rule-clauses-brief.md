# Name the changed rule clauses in two G0 rationales (Doer brief, records slice)

Status: Lead brief under L12-137, L13-22 and L13-25. Read `reviews/w29-g0-verdicts-b10.{md,json}` first. That review covered 16 rows: 14 APPROVE, 2 REWORK. Both REWORK rows need a rationale fix only.

1. **g0-content-redecisions `/bindingRefresh/117` (Business Rules).** Name every rule rewrite between source `8ea4a467` and the target, each with its old and new wording:
   - RUL18: `add` now defaults to the entry step through `entryStepFor` (`discovery` for coding);
   - RUL19: the sweep now dispatches the `fgos-researching` worker, and `resolveDiscovery` can move items on;
   - RUL26: the human-gate trigger widens from two conditions to five;
   - RUL53: `compound` is deprecated, and its path must be committed and registered;
   - RUL60: `--tier` is retired, so this is more than a size rename.

   Also check the rest of the section yourself, clause by clause, and name any other change you find.
2. **g0-content-redecisions `/bindingRefresh/47` (Submit Verb).** Remove "every other clause is unchanged". Name the RUL60 gloss change: "ba cờ ghi-đè tier/kind/risk, độc lập từng trường" became "cờ phân loại hiện hành". Check the other clauses the same way.
3. Non-blocking notes from the review, fixed in the same ledger files:
   - `/50`'s `changedClauses` lists 2 clauses where 4 lines changed; list all 4;
   - s13 `/sourceBindings/70`'s disposition must also name the link-label change;
   - remove the stray leading newline from the rationales added to s13.

Change only `rationale`, `changedClauses` and disposition text. Leave `reviewStatus` at pending. Do not change bindings, digests, sources, placements or supersession.

Proofs, all exit 0:
- `rebind/rebind.py --check`;
- `g0rework/verify.py`;
- `g0rework/refresh-carries.py --check`;
- `misc-fix/verify.py` (if only volatile fields changed in `misc-fix/checks.json`, restore it);
- `node scripts/check-legacy-docs-ratchet.mjs`;
- each touched row's binding hash recomputes unchanged.

Writable (exact):
- plans/260925-documentation-authority-unification/ledger/decisions/**
- plans/260925-documentation-authority-unification/reports/phase-09/g0rework/**

Do not edit docs/, the register, reviews or scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs, npm test or product tests, never `phase-08/audit-report.py`, and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
