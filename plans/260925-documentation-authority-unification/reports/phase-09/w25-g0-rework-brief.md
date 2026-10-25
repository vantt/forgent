# G0 binding rework: per-row REWORKs, defective hashes, code-span corruption (Doer brief, records and docs slice)

Status: Lead brief under L12-137 and L13-22/L13-23. Read `reviews/w24-g0-verdicts-b1..b6.{md,json}`, `g0join/receipt.md` and `g0join/verdict-batches/held.json` first.

1. **The 15 REWORK rows** in the w24 verdict files:
   - b2: the 6 `s9-runner-01` rows (`/claims/11`, `/14`, `/15`, `/133`, `/154`, `/250`);
   - b3: 5 rows;
   - b4: 2 rows;
   - b5: 2 rows.

   Re-decide each as the review says. A row that commit `7be0cbc52` repointed while keeping a "move" label becomes a `supersede`. It names each changed clause, with the old and new wording and the source of the change (that commit's per-unit decisions, or the owning spec or commit). Also correct any wrong anchor. A stale line citation is re-cited to the current lines. A dropped true clause is restored or recorded as an explicit drop with its reason. Set `reviewStatus: pending`. Then search for the same pattern across all other `s9-runner-01` rows: a "move" label where the target digest differs from the source. List what you find, and re-decide it the same way.
2. **The 27 held rows** (`g0join/verdict-batches/held.json`). Recompute the canonical `bindingSha256` with `ledgerfix/bindings.py`, and restore the missing `targetUnitDigest` with the repo extractor. Keep the old values in the row's existing history field.
3. **Code-span corruption.** The link rewriter changed text inside inline code spans, for example `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md:191` (`` `d['executeAssignment'](a)` ``). Scan every file under `docs/platform/**` with a real markdown code-span tokenizer, not a regex. Flag every inline code span that contains a markdown link target the rewriter produced: compare with the legacy source bytes the unit was carried from. Restore the original code-span text. These are docs edits. Then rebind every affected ledger row through the existing rebind tooling (`rebind/rebind.py`), and record the rebinds.
4. **Duplicate rows.** In `g0-content-redecisions.json`, `/bindingRefresh/124`, `/125` and `/126` repeat `/6`, `/20` and `/21`. Link each newer row to its older row with the existing `supersedesBinding` mechanism, so `g0join/join.py` counts one effective row each. Also fix the stale rationale texts the reviews list as notes, where the fix is a text correction.
5. **Proofs**, all exit 0 except `g0join/join.py`:
   - `rebind/rebind.py --check`;
   - `g0rework/verify.py` (`partial` is fine);
   - `node P/carries/verify-carries.mjs`;
   - `g9/sweep.py --check --pin HEAD`;
   - `node scripts/check-legacy-docs-ratchet.mjs`;
   - `misc-fix/verify.py` (restore `misc-fix/checks.json` if only volatile fields changed);
   - `g0join/join.py --pin HEAD`: it must show only rows changed in this turn as missing (they await review), plus nothing else open. Commit its output as `g0join/join-<shortpin>.json`.

   Write `g0join/rework-receipt.md` with every row's old and new hashes and every command with its exit code.

Writable (exact):
- plans/260925-documentation-authority-unification/ledger/decisions/**
- docs/platform/**
- plans/260925-documentation-authority-unification/reports/phase-09/g0join/**
- plans/260925-documentation-authority-unification/reports/phase-09/rebind/**
- plans/260925-documentation-authority-unification/reports/phase-09/carries/**

Do not edit legacy docs (`docs/specs/**`, `docs/architect/**`), the register, shards, reviews or other scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs, npm test or product tests, never `phase-08/audit-report.py`, and never load native addons. Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end. Do not use the fixed `/tmp/fgos-work/w3-ledger-fix-brief/` path of `g0fix/extract-units.mjs`; run the extractors from your own tempfile copy.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
