# G0 content rework: three re-decisions and record hygiene (Doer brief, records slice)

Status: Lead brief under L12-137. Read `reviews/w14-g0-content-rereview.{md,json}` first. That review covered 124 rows: 121 APPROVE, 3 REWORK.

**Lead ruling for the three REWORK rows.** Do not edit the legacy files. They retire at the cutover, and the platform target already carries the current truth from main. Re-decide each row as a **supersede**. The decision must name each changed clause, give the old wording (legacy) and the new wording (target), and name the source of the change (the main commit, or the spec that owns the new behaviour). The approval does not carry over: set reviewStatus to pending.

1. `claim_b5695d38…` (`packaging-distribution/spec.md#unheaded-block-109`). The checkout root is now read from the `.git`/gitdir/commondir layout without running Git. The legacy text says `git rev-parse --git-common-dir` (`docs/specs/distribution.md:439`). Also correct the rationale "complete unit digest equal", which is false.
2. `claim_5ba6768e…`. There are two clauses: the id is now "issued by the Identity mint door", and `rigorToTier` has been replaced.
3. `claim_2e2bc926…`. These clauses are gone from the target: events.lock / `withEventsLock` / `appendEventLocked` / 2s-10ms / `EventLogError('lock-timeout')` / hash-suffix `generateId`. Find out where that behaviour lives now: the event store spec, or main's Event Store cutover. Then either name the successor, or record the retirement and its cause.

Record hygiene, from the review's concerns:

4. **Legacy rewrites.** For the 21 rows whose legacy source was rewritten to match the target (19 in `confinement-authority.md` and 2 in `work-state.md`), add an entry in `carries/source-parity.json`, in its existing format, that records the rewrite. Include the commit, the old and new legacy digests, and the reason. Leave the recorded source digest as the historical one, but make the parity entry machine-readable.
5. **Stale rationales.** Wherever a rationale describes an older target, replace that text with one that is true now. Examples are `claim_4d5b7f73` ("All 26 historical lines remain in order") and `claim_d572bb9d` ("byte for byte, limitations retained"). Keep the old text only as a dated history line if the format has one. Fix the remainder digest of `claim_d5ba1eda` (`fb0b0100`, now `797c7185`).
6. **Stale overlay rows.** The rows s12 `/unitCarries/364`, s14 `/bindingRefresh/574` and `/577` bind an older digest, and anything that reads by pointer alone would read them. Mark them superseded, using the existing supersession field and pointing at the current row, so that reading by pointer cannot pick them.
7. **Proofs.** All of the following must pass:
   - `rebind/rebind.py --check` exits 0.
   - `misc-fix/verify.py` exits 0; restore `misc-fix/checks.json` if only volatile fields changed.
   - `phase-08/audit-report.py`: audit-ownership exits 0 and reports no failing rows.
   - `node scripts/check-legacy-docs-ratchet.mjs` exits 0.
   - The binding hash of every touched row recomputes.

   Write `reports/phase-09/g0rework/receipt.md` and `receipt.json` with each change, the old and new hashes, and every command with its exit code.

Writable (exact):
- plans/260925-documentation-authority-unification/ledger/decisions/**
- plans/260925-documentation-authority-unification/reports/phase-09/carries/source-parity.json
- plans/260925-documentation-authority-unification/reports/phase-09/g0rework/**

Do not edit docs/ or scripts. No pair accounting. Never a git write (the runner commits; read-only git is fine), never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs or npm test, never load native addons (if `audit-report.py`'s `checks.mjs` needs one, report it as not run). Always `python3 -B`. Scratch only in `tempfile` directories under `/tmp/fgos-work/`, removed at the end.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
