# Rebase prepared patches onto the current docs (Doer brief, records slice)

Status: Lead brief under L12-137 and L13-24. After turns 722 and 726 changed bytes in `docs/platform/**`, the single composition door `fchain/check.py --pin HEAD` reports 16 `conflict`, 3 `sameLinesTwice` and 2 `ownerless` findings. `check_shard.py --all` and `g9/check_phase9_decisions.py` fail for the same reason. Read `fchain/receipt.md`, L13-21 and L13-24 first.

For each finding:
- **conflict:** rebase the owning patch onto the current composed state, without changing the decision it carries. Use the source's existing basis field (`basis: chain` or pin). If the doc change already made the retarget, mark the patch `alreadyComposed` or `composedBy`, and drop it.
- **sameLinesTwice:** keep one owner. Link the others with `composedBy`.
- **ownerless:** bind the patch to its owning record row, or drop it if nothing owns it, with the reason.
- **staleChainEntry** (check_shard): rebase it the way turn 723 did, keeping history.

Do not change any decision. Proofs, all exit 0:
- `fchain/check.py --pin HEAD`;
- `check_shard.py --all`;
- `g9/check_phase9_decisions.py`;
- `node P/carries/verify-carries.mjs`;
- `census-join/join.py`, replayed twice at its pin, byte-identical.

Restore volatile outputs that only a rerun changed. Update `fchain/receipt.md` with the findings resolved and every command with its exit code.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/fchain/**
- plans/260925-documentation-authority-unification/reports/phase-09/g9/**
- plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/park-judgments/**
- plans/260925-documentation-authority-unification/reports/phase-09/carries/pointer-patches.json
- plans/260925-documentation-authority-unification/reports/phase-09/census-join/pointer-patches.json
- plans/260925-documentation-authority-unification/reports/phase-08/step-07-composed-patches.json
- plans/260925-documentation-authority-unification/reports/phase-09/composition/patch-specs.json

Do not edit docs/, ledgers, the register, reviews or other scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs, npm test or product tests, never `phase-08/audit-report.py`, and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
