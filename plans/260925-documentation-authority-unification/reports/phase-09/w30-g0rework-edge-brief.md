# Account for the Data Dictionary edit in the rebind record (Doer brief, records slice)

Status: Lead brief under L12-137. Turn 731 found that `g0rework/verify.py` fails even at the plan HEAD. See `g0rework/rule-clauses-proof.json`, field `baselineReplay`.

The cause: the docs commit e88d4e283 edited line 74 of `docs/platform/work-state/spec.md`. That changed the digest of `#3-work-item-data-dictionary` from `c55decfd…` to `38928382…`, and no recorded edge accounts for the change (`account_target`, `g0rework/verify.py:76`).

1. Add the edge to `rebind/g0-rework-rebindings.json` in its existing format:
   - the old and new unit digests;
   - the commit e88d4e283;
   - the reason, which is the Data Dictionary link retarget to `#add-verb`;
   - each ledger row that binds that unit, if any.
2. Check for any other unit that e88d4e283 changed, at its lines 83 and 516 or elsewhere, and is missing an edge the same way. Add an edge for each.

Do not change any assertion in `verify.py`. Proofs, all exit 0:
- `g0rework/verify.py`;
- `g0rework/refresh-carries.py --check`;
- `rebind/rebind.py --check`.

Update `g0rework/receipt.md` with each command and its exit code.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/rebind/g0-rework-rebindings.json
- plans/260925-documentation-authority-unification/reports/phase-09/g0rework/**

Do not edit docs/, ledgers, the register, reviews or scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs, npm test or product tests, never `phase-08/audit-report.py`, and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
