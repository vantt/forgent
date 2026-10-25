# One F composition door for every prepared patch (Doer brief, records slice)

Status: Lead brief under L12-137 and L13-24. Read L13-24 in `owner-answers.md`, `reviews/w25-g9-dependencies-review.{md,json}`, `preserve-premise/park-judgments/chain-check.md` and `check_shard.py`, and `composition/compose.py` first.

1. **Prior art first.** Find every existing replay or apply path for prepared patches (`composition/compose.py` `apply_diff`, `check_shard.py`'s chain builder, `phase-08` step-07 replay, `carries`, `census-join` and `g9` patch checks). Reuse them; do not write another engine. Say in the receipt what you reused.
2. **Manifest.** Add `fchain/manifest.json`. It names every prepared-patch source in apply order: `phase-08/step-07-composed-patches.json`, `composition/patch-specs.json`, `carries/pointer-patches.json`, `census-join/pointer-patches.json`, the premise shards and `g9/f-composition-additions.json`, plus any other you find. For each source, it records how its patches are read.
3. **One checker.** `fchain/check.py --pin <commit>` composes every source on the pin bytes, through the reused code, and reports:
   - `sameLinesTwice`: two patches change the same lines;
   - `conflict`: a patch does not apply with `--fuzz=0` on the composed state;
   - `ownerless`: a patch has no owning record row;
   - `duplicateWithoutLink`: an identical change is present in two sources without a `composedBy` link.

   It writes the composed after-hash of every touched file. Any finding exits 1, and the checker has negative controls for each finding.
4. **Resolve the overlaps the w25 review found, so that each changed line has exactly one owner:**
   - The G9 gateway doc patches `/2`, `/3`, `/4`, `/6`, `/7` and `/8` overlap the premise shards. The shard rows own those readers. Drop the G9 copies and link to the shard row with `composedBy`. Keep `/5` (`config/spec.md`) as the G9 owner. Shard rows f06830, f06831 and f04343 keep their decision; the G9 patch must not rewrite those lines.
   - Map patch `/1` repeats shard row f00527: drop it and link.
   - G9 patches `/9`–`/12` and `/17`–`/19` restate `carries/pointer-patches.json`: link them to the carries entries and keep one copy.
   - G9 governance and map moves: record, for each live doc reader of the old paths, its owning shard row or its new owning patch.
   - Resolve every other finding `fchain/check.py` reports the same way, or list it with the reason it cannot be resolved here.
5. **G9 checker fixes (w25).** In `g9/check_phase9_decisions.py`:
   - read every `plans/` evidence file from the pin, not from disk;
   - check shard-row ownership of gateway readers and the AGENTS successor anchor and path;
   - replay through `fchain/check.py`.

   Add negative controls for the cases the review found passing wrongly.
6. **Proofs**, all exit 0:
   - `fchain/check.py --pin HEAD`;
   - `check_shard.py --all`;
   - `g9/check_phase9_decisions.py`;
   - `node P/carries/verify-carries.mjs`;
   - `census-join/join.py`, replayed twice at its pin;
   - the composition replay checks.

   Write `fchain/receipt.md` with the counts, the overlaps resolved, and every command with its exit code.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/fchain/**
- plans/260925-documentation-authority-unification/reports/phase-09/g9/**
- plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/park-judgments/**
- plans/260925-documentation-authority-unification/reports/phase-09/carries/pointer-patches.json
- plans/260925-documentation-authority-unification/reports/phase-09/census-join/pointer-patches.json

Do not change any judgment's decision, docs/, ledgers, the register, the chain files or other scripts. Another Doer is editing `ledger/decisions/**`, `docs/platform/**`, `g0join/**`, `rebind/**` and `carries/**` right now. Of `carries/`, you may change only `pointer-patches.json`, and only to add `composedBy` links. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs, npm test or product tests, never `phase-08/audit-report.py`, and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
