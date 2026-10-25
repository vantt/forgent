# Retarget links into moved paths and rebase work-state patches (Doer brief, records slice)

Status: Lead brief under L12-137, L13-24 and L13-26. Read `reviews/w28-fchain-and-premise-rework-review.{md,json}`, `fchain/receipt.md`, L13-21, L13-25 and L13-26 first.

1. **Rebase the stale work-state entries.** `fchain/check.py --pin HEAD` exits 1 with 4 findings, all on `docs/platform/work-state/spec.md` after the latest docs edit: a staleChainEntry for `rebased:w8:gloss:…`, the shard-3 non-strict basis, an ownerless chain entry, and the G9 whole-body witness drift. Rebase them as turn 727 did, keeping history. Do not change any decision.
2. **Link retarget record (L13-26.1).** Create `fchain/link-retargets.json`.
   - Scan every `docs/platform/**/*.md` in its composed state: composed bytes where F changes the file, pin bytes otherwise. Find each clickable link outside code spans and fences that resolves to a path in the phase-08 cutover move set. The w28 review found 160 such links in 40 files.
   - For each one, give one row: file, line, old target, new target (taken from the move set), and the owning ruling L13-26. Then give one prepared patch per file, in the existing pointer-patch format with forward and rollback diffs.
   - A target that is removed with no successor becomes a code span.
   - Add the record to `fchain/manifest.json`, after the G9 additions. A link that an earlier source already retargets is not repatched; that is a `sameLinesTwice` finding.
3. **Gateway list (L13-26.3).** In the same record, repoint the `x-specs` entries in the composed `docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml` that still name `docs/specs/work-state.md` and `docs/specs/runner.md`.
4. **Door check (L13-26.2).** Add the finding `linkIntoMoveSet` to `fchain/check.py`, reusing its composed state and the move set it already reads. Add one negative control to `fchain/controls.py`: an injected link into a moved path must fail.
5. Low notes from w28, in scope here:
   - fix the stale notes on f07871 and f07667;
   - make the "zero-fuzz conflict" control exercise the patch path, not the hash check;
   - when the `composedBy` link in a record and in the manifest disagree, fail rather than letting the record silently win;
   - record the gap05 relocation patch's new id and file hash where the G0 F duties name it.

Proofs, all must exit 0:
- `fchain/check.py --pin HEAD`, with 0 `linkIntoMoveSet`;
- `fchain/controls.py`;
- `check_shard.py --all`;
- `g9/check_phase9_decisions.py`;
- `node P/carries/verify-carries.mjs`;
- `census-join/join.py`, replayed twice at its pin, byte-identical.

Restore volatile outputs that only a rerun changed. Update `fchain/receipt.md` with the counts before and after, and every command with its exit code.

Writable (exact):
- plans/260925-documentation-authority-unification/reports/phase-09/fchain/**
- plans/260925-documentation-authority-unification/reports/phase-09/g9/**
- plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/park-judgments/**
- plans/260925-documentation-authority-unification/reports/phase-09/carries/pointer-patches.json
- plans/260925-documentation-authority-unification/reports/phase-09/census-join/pointer-patches.json
- plans/260925-documentation-authority-unification/reports/phase-08/step-07-composed-patches.json
- plans/260925-documentation-authority-unification/reports/phase-09/composition/patch-specs.json
- plans/260925-documentation-authority-unification/reports/phase-09/g0rework/**

Do not edit docs/, ledgers, the register, reviews or other scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs, npm test or product tests, never `phase-08/audit-report.py`, and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
