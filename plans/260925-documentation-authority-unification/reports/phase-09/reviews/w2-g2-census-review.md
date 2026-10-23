# G2 census-join review (wave 2)

Scope: the D4 G2 delivery in bade6b6b3 (`census-join/`), reviewed at cffe725b9. Read-only. Scratch is `/tmp/fgos-work/w2-g2-census/`, using a shared clone and no writes to the repository.

## Recomputation
- I reran `join.py --rescan` in a clone checked out at pin 3e2d05af. All 3 artifacts came out byte-identical to the committed bytes.
- I reran at cffe725b9. Statuses are unchanged (646/293/187), but 38 rows have line drift.
- Exhaustive: 1,126 unique ids, set-equal to the register. The residue set equals the judgment-required rows.
- Graded: I checked all 314. 293 are confirmed exactly when the passage and span hold. Every confirmed site lies inside a passage occurrence. The 21 drifted rows are correctly left for judgment.
- Mechanical: stratified sample of 66 rows, seed 20261023. All are correctly contained in their own test or same-file helper chain.

## REWORK
1. **High: post-pin coverage is incomplete.** `post-pin-literals.json` re-enumerates literal entries only. 1,073 of the 1,126 G2 sites are dynamic sites. Recomputing step-07's dynamic delta at the pin gives 132 new doc-cued dynamic sites that no artifact lists. 112 of them are in files outside the register, mostly imported `packages/config` and `packages/yaml-doc`. 13 have the reader role, for example `bin/fgos.mjs:3869-3890`, `packages/config/rust/src/files.rs:122-128` and `src/runner/dispatch/config.mjs:365`. The list is in `dyn-delta-3e2d05af8.json`.
2. **Medium: stale pin.** The artifacts were computed at 3e2d05af but landed on top of 5fe778624. `src/runner/worktree.mjs` and `test/scripts/check-evidence-relocation.test.mjs` changed in between, so 38 rows carry stale lines and source SHA-256. `join.py` takes the pin from HEAD and has no `--pin`, so a replay at the landed commit is not byte-identical.
3. **Medium: wrong judgment need on 27 residue rows.** Their source files were deleted by 5a33989fa (seat-binding). The blocker still says shared fixture/helper, and the locator names a non-existent file without the deleting commit.
4. **Low:** pc-d-0185/0186 name `recovery_matrix_child` as owning proof. That test is `#[ignore]` and runs only as a subprocess, so the parent `recovery_matrix_all_payload_kinds` should be named instead.
5. **Low:** 116 residue rows carry joined-custody text ("Same-file fixture helper joins …") while their owning proofs are empty.
6. **Low:** in 9 of 17 Rust proofs (37 rows), the locator points at the blank line before `#[test]` because of the regex `^\s*`. The yaml golden join is hard-coded by filename to line 185, which is a body line rather than the test. The 13 post-pin judgment rows have no stated need per row.

## Counts
APPROVE 231, REWORK 33 (264 verdicts: 11 findings, 66 sampled, 187 residue).
