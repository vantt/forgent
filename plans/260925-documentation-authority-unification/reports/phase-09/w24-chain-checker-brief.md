# Chain-aware patch checker for premise judgments (Doer brief, records slice)

Status: Lead brief under L12-137 and L13-21.1. Read `reviews/w23-g6-shard-{1,2,3}-review.{md,json}` and L13-21 in `owner-answers.md` first.

Build `preserve-premise/park-judgments/check_shard.py --shard <N>|--all`, replacing `check_shard_1.py`, `check_shard_2.py` and `check_shard_3.py` (delete those three). For each shard it:
1. checks coverage: the shard's rows equal its ids file. Evidence lines exist at the pin, with matching digests.
2. builds, per file, the F-chain result: the pin bytes, then every entry of `phase-08/step-07-composed-patches.json`, then every entry of `composition/patch-specs.json` that touches the file, each applied with the chain's own replay method. Reuse the existing chain replay code; search `composition/` and `phase-08/` for it, and do not write a second one.
3. for every row patch: if the chain result already contains its post-image, report `duplicateOfChain` with the chain entry id. Otherwise it must apply with `patch --fuzz=0` on the chain result, forward and reverse. Any failure is `conflictsWithChain`.
4. for every repoint, successor-bound or `alreadyComposed` row: checks that the cutover actually removes or moves the operand path. Use the move set and removal set used by `proof.py`. A repoint of a surviving path is `repointOfSurvivingPath`.
5. reports chain entries whose before-bytes no longer match the current file (`staleChainEntry`).

Exit 1 if any duplicate, conflict, surviving-path repoint or stale entry is unresolved. A shard row can resolve a finding by being marked `alreadyComposed: <chainEntryId>`.

Run it with `--all` at HEAD. Write the findings to `park-judgments/chain-check-<shortpin>.json` and the counts per shard to `park-judgments/chain-check.md`. A non-zero exit is expected now; the next turns fix the rows. Cross-check that it reports at least the duplicates and conflicts the three reviews name, and list any it does not report together with the reason.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/park-judgments/check_shard.py
- plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/park-judgments/check_shard_1.py
- plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/park-judgments/check_shard_2.py
- plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/park-judgments/check_shard_3.py
- plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/park-judgments/chain-check-*.json
- plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/park-judgments/chain-check.md

Do not edit shards, docs/, ledgers, the register or other scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs, npm test or product tests, never `phase-08/audit-report.py`, and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
