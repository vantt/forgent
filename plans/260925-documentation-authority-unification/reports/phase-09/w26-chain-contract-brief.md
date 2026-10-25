# One checkable contract for chain-rebased premise patches, and stale chain entries (Doer brief, records slice)

Status: Lead brief under L12-137 and L13-21.1. The three shard rework turns (719–721) prepared their row fixes. They stopped because `check_shard.py` can only validate a patch made against the bare pin, while L13-21.1 requires a conflicting patch to be rebased onto the F-chain result. Read `shard-{1,2,3}.md`, including their "checker gap" sections, `chain-check.md` and L13-21 first.

Record note: commit 8cb66d85a carries the shard 2 rework and 8f68bcbdf the shard 3 rework, although their subjects say "first" and "second". The Lead's commit loop was off by one. The content is correct; read each commit by the file it changes.

1. **One representation.** The three shards represent a rebased patch in three different ways; shard 3, for example, uses `chainRebases`. Define one schema, and convert all three shards to it without changing any decision. A row patch states its basis explicitly:
   - `basis: "pin"`: the diff applies to the pin bytes, and the chain does not touch that file region;
   - `basis: "chain"`: the diff applies to the F-chain result, and the record names the chain entries it follows and the chain-result sha256 it expects.

   A successor-holder proposal names the holder file and section and applies to that file's chain result. Frozen pin evidence stays as evidence, never as a second executable patch.
2. **Checker.** Extend `check_shard.py` so that it validates both bases:
   - a pin-basis patch: the pin diff equality check;
   - a chain-basis patch: the expected chain-result sha256 equals the actual one, and the patch applies with `--fuzz=0`, forward and reverse;
   - successor-holder proposals;
   - an `alreadyComposed` marker, where a chain entry rewraps the lines (the f00183 case): match the retarget, not the exact bytes;
   - a source that was already absent before the cutover, kept apart from one the cutover removes;
   - a harmless gloss addition, kept apart from a lost preserved reference.

   Keep every existing control, and add a negative control for each new rule.
3. **Stale chain entries (15).** Rebase every `staleChainEntry` in `phase-08/step-07-composed-patches.json` and `composition/patch-specs.json` onto the current file bytes. Change no retarget; keep the old entry in the existing history or supersession field. Each rebased entry must replay with `--fuzz=0` both ways, and `composition/` replay scripts that read those entries must still exit 0.
4. **Proof.** `python3 -B check_shard.py --all` exits 0. Commit its output as `chain-check-<shortpin>.json` and update `chain-check.md` with the counts before and after. Run the composition and phase-08 replay checks that consume the chain files, and record their exit codes.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/park-judgments/**
- plans/260925-documentation-authority-unification/reports/phase-08/step-07-composed-patches.json
- plans/260925-documentation-authority-unification/reports/phase-09/composition/patch-specs.json

Do not change any judgment's decision, docs/, ledgers, the register or other scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs, npm test or product tests, never `phase-08/audit-report.py`, and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
