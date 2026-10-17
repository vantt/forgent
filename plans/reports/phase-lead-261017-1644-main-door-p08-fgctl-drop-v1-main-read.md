# Phase lead report: main door P08 (fgctl drops the v1 main-checkout read) + main (4.4a) merged in

Status: DONE. Integration head `2f9be15bc`.

## Step 1: main into integration (`fccd2218a`)
Merge conflicts, kept both lanes' intent:
- `src/holder-lock/fences.mjs`: `CUTOVER_OWNERS = ['4.2','4.3','4.4']`; `isCutOverLock` = owner in that list, and for 4.3 only `main-checkout`/`merge-slot`/`worktree-admin` (state locks stay unfenced, F10); one `fenceBy(owner)`; `fenceTargets` filters by `owners` AND `isCutOverLock`.
- `src/setup/holder-lock-checks.mjs`: imports `isCutOverLock`, error text names the lock's release.
- `docs/specs/distribution.md` rows 5g/7/7b merged word-level (both lock lists + both check/fix lists); holder-lock spec keeps 21 sections with both decision bullets; CHANGELOG keeps both.
- Tests: tombstone/registry-contract keep both families; fence counts 8->10 (5 base + activation/observe/install + main-checkout + 1 merge slot), lock total 13->16, owners-case "placed 7".
- Skill wrappers test failed only for a stale ignored `.claude/skills` render; `npm run build:skills` fixed it (no tracked diff).

## P08 (`6e47d622c`)
- `packages/distribution/rust/src/lock.rs`: only `probe(main-checkout)`; error enum `Held` (was `HeldV3`), `DriverUnavailable`, `Io`. Removed v1 record/TTL/pid/marker code, `Ambiguous`, `Unsupported`, `HeldNumeric`, `HeldString`, tombstone branch. Kept the file (tiny, `lib.rs` re-export and `fgos_distribution::lock::` paths unchanged; merging into `init.rs` would only churn). `lib.rs` untouched.
- Tests: removed the v1 cases and the drift guard (they imported the deleted Node module); v3 held + tombstone cases kept; added "leftover v1 file with a live pid is never read".
- Docs: distribution.md bullet on fgctl main checkout, CHANGELOG line.
- F10 respected: no state part, `.gitattributes`, `merge=union`.

## Evidence
- `rg 'read_to_string|DEFAULT_TTL_MS|protocol_marker' packages/distribution/rust/src/lock.rs` empty.
- `cargo test -p fgos-distribution -p fgctl`: 56+5+8+4+15 passed, 0 failed.
- `test/rust-host/*.test.mjs` (incl. all fgctl-init*) against release fgos+fgctl from this branch, private target: 145 tests, 144 pass, 0 fail, 1 skipped.
- Integration after merge: `test/holder-lock/*`, `test/setup/holder-lock-checks`, `registrations`: 155 tests, 153 pass, 0 fail, 2 skipped (no NFS mount). Before: `test/setup/*` + rust-host except fgctl-init: only the two env failures above.
- Sonnet review: no defects.
- GitNexus impact `check_main_checkout_lock`: LOW (init/upgrade/repair, fgctl main); signature unchanged.

## Concerns
- `release-tree` fails in any worktree whose `target` link is main's shared (older) host; passes with a private target. Not a regression.
- Not run: full `npm test`.

## Unresolved
None.
