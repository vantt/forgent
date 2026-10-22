# Step 7 integration re-review fixes (Doer brief, records turn)

Status: Lead brief. The bounded re-review `review-a38-step-07-integration-r2.md` (this directory) passed the 39 overturns, the composed patches, the single replay door, the alias check and the owner split, and returned a narrow REWORK. Read it completely (it lists every row id).

Lead ruling L12-121 (record in owner-answers.md, Lead under A42):
1. Flip to patch, each with an exact patch spec composed once per file over the pin (forward + rollback + expectedAfterSha256), consistent with the identical pointers already patched: r01010, r01106, r01108, r01135, r01136 (UI-spec pointers; cf. r01008), r00820, r01033, r01037 (gateway contract pointers; cf. the patched gateway.rs comments), r04466 (`pane_scan.rs`) and r14203 (`assignment-runner.mjs`).
2. r02200 and r04182 (architecture manifests) move from preserve to individually parked, tied to the existing `docs/architecture-map.md` park (same blocker and owner).
3. The seven AGENTS.md root pointers r00764, r00732, r00761, r00762, r00731, r00733, r00737 move from preserve to individually parked with blocker "AGENTS.md cutover packet (A34) rewrites root pointers to moved targets at cutover" (owner: AGENTS.md cutover packet). New evidence (the move set physically moves their targets; r18863 to the same target was patched) supersedes L12-60 for these seven rows only; say so in L12-121.
4. Replace the post-move proof's role exemption with a real test: every preserve must state a reason that the simulated post-move tree confirms (historical/dated text, fixture, non-path token, target not moved, etc.). Rerun it over ALL preserves; any further row it overturns is handled the same way (patch if a live pointer with an exact replacement, park with a named blocker otherwise) and listed.
5. Add a dated correction under L12-120 for its "23 gateway + 9 R28" split (the proof labels them 16 and 16; the 39 ids are unchanged). Do not rewrite L12-120.
6. Rerun `step-07-assemble.py --final --pin <pin>` twice (byte-identical), update the report counts, record L12-121 with the new counts, and do pair accounting (L12-11) last.

Writable (exact): plans/260925-documentation-authority-unification/reports/phase-08/**, plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-reproduction.json, plans/260925-documentation-authority-unification/reports/phase-06/step10-sync4d-reproduction.json, plans/260925-documentation-authority-unification/ledger/decisions/**. No docs/** or code edits, never a git write, never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs or npm test. python -B; scratch /tmp/fgos-work/.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
