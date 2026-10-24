# w4-g8-archive review (G8 after D5b, 7f1eb147f, reviewed at 77db6ed2b)

10 APPROVE / 3 REWORK. Full verdicts: `w4-g8-archive-review.json`. Scratch: `/tmp/fgos-work/w4-g8-archive/`.

## Fixed from the previous review
- **Retirement specs:** all 336 say "behaviour retired with the plan". None names itself as its proof. No path outside the plan references any of the retired programs.
- **Gate programs:** the ten reviewed programs plus 8 more Phase 09 programs are tagged `retire-at-final-pin`. The before-freeze tip (1,970,867,003 B) is exactly the reduced tip plus the 3,363 temporary inputs.
- **Check A:** I re-ran the **unchanged, full** `checks.mjs`, not the Doer's slice. On removal commit `ffab97382` it is red with 3,618 unaccounted pairs. On accounted commit `bf6c4d5` it is green with 0 unaccounted and 0 working violations. Both recipes give the same result. B is also ok.
- **Partition:** recomputed exactly against the `e158e6726` ls-tree (6,362 archived / 399 retained, with 0 blob or size mismatches). No size threshold is used and no row says "small".
- **Manifest and filesystem label:** `manifest.json` is 6.6 KB and the audit lives only on the archive ref. The filesystem label is now probed (`stat -f`/`findmnt`), not hardcoded.
- **Tip size:** my own rebuild is 10,547 files / 677,670,851 B. It has the same path set as the Doer's `bf6c4d5`, and the byte difference comes only from the accounting rows plus later main-side artifacts.
- **Timing:** measured with `git worktree add --detach` on ext4 `/dev/nvme0n1p2` at load 28-29:

| Tree | Run 1 (s) | Run 2 (s) | Run 3 (s) |
|---|---:|---:|---:|
| My rebuild | 51.14 (cold cache) | 6.14 | 7.04 |
| Doer's tree | 5.16 | 6.42 | 4.09 |
| Full pin (control, 1 run) | 176.9 | | |

## REWORK
1. **The removal adds a new H finding.** The unchanged checks.mjs on `bf6c4d5` reports an unresolved link from `docs/platform/documentation/switchboard.md` to the archived `current-authority-map-2026-09-25.md`. The same reader is used by `check-doc-candidate-status.mjs` and `check-doc-retirement.mjs:260`. The receipt never ran H. Fix: keep the file, or name the link repoint in the removal commit.
2. **Plan navigation and live docs point at archived files.** Three files are affected:
   - `minimum-constitution.md`: a ruling source, linked 11 times from `docs/platform/intent-preservation-ledger.md`.
   - `current-authority-map-2026-09-25.md`: linked from `docs/reading-map.md` and `docs/specs/reading-map.md`.
   - `reports/phase-08/step-08-preflip-gates.json`: the gate register.

   In total, 21 references outside the plan point at archived files, and the design names no repoint.
3. **22 retained rows (23.3 MB) have false basename reasons.** Examples:
   - The phase-09 `receipt.json` files are said to be read by `adopt.rs`, which actually reads a run directory's own receipt.
   - `preserve-premise/proof.json` (16.2 MB) is justified only by a code comment.
   - The `generate-doc-inventory` test "readers" are files the test writes into its own fixture.
   - `review-pack-261013-1528…` (4.9 MB) is justified by a `review-{3,6,10}-checkpoint.md` pattern that cannot match its name.
   - Others: READMEs mentioned in prose, a `seed.txt` that a script writes, and command help text.

   Each needs a real reason, or the file moves to the archive.

## Notes
- The warm timing reproduces, but the cold first run took 51 s. F must time a cold-cache run.
- The partition is bound to `e158e6726`. At `77db6ed2b` there are 100 new plan files (50.9 MB) and 35 changed ones, so the partition must be rebuilt at F (the design already says so).

Status: DONE_WITH_CONCERNS
Summary: 10 APPROVE / 3 REWORK. Check A is green after accounting when I re-run the unchanged recipe, and tip bytes and timing reproduce (cold first run 51 s). But the removal breaks a live switchboard link that the H / candidate-status check catches, archives navigation files that live docs link to, and keeps 22 rows (23.3 MB) on false basename reasons.
