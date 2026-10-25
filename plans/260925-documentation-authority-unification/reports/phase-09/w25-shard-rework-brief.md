# Premise shard rework on the F chain (Doer brief, records slice)

Status: Lead brief under L12-137 and L13-21. Your shard N is named in the launch note. Read:
- `reviews/w23-g6-shard-<N>-review.{md,json}`;
- L13-21 in `owner-answers.md`;
- `preserve-premise/park-judgments/chain-check.md`, including the Lead correction;
- the findings for your shard in `chain-check-c804a3213.json`.

Fix every REWORK row in your shard review and every unresolved checker finding for your shard, except `staleChainEntry`. Stale chain entries are rebased by a separate turn; if one of your rows depends on one, say so in the row's notes. The rules:
- **duplicateOfChain:** set `alreadyComposed: <chainEntryId>` and drop the row's patch (L13-21.1).
- **conflictsWithChain:** rebase the patch onto the chain result so that it applies with `--fuzz=0`, forward and reverse.
- **Removed-door banners:** repoint the "decision 0062 in `docs/specs/runner.md`" citation to `docs/platform/runner/decisions/h-36d872fbb0e5.md` (L13-21.2).
- **`docs/history/` convention parks (shard 3):** keep them unchanged under L12-10 (L13-21.3).
- **Lineage links in `docs/platform/**` to removed files:** prepare code-span patches (L13-21.4). Shard 2's review lists 36 such rows; take those in your shard.
- **Live pointers named in L13-21.5 that fall in your shard's files:** prepare patches for them.
- **Every other REWORK row:** fix it as the review says, or give evidence that the review is wrong.

Proof: `python3 -B preserve-premise/park-judgments/check_shard.py --shard <N>` exits 0, or exits 1 only on `staleChainEntry` findings that you list in `shard-<N>.md`. Update `shard-<N>.md` with the counts before and after, and every changed row with its reason.

Writable (exact; your shard only):
- plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/park-judgments/shard-<N>.json
- plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/park-judgments/shard-<N>.md

Do not edit the checker, the chain files, docs/, ledgers, the register or other shards. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs, npm test or product tests, never `phase-08/audit-report.py`, and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
