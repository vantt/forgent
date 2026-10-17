# Rust callers P04: fences, doctor coverage, docs, changelog

Status: DONE_WITH_CONCERNS

## Result
- Merged integration into the draft docs branch (conflicts only in `CHANGELOG.md` and `docs/specs/distribution.md` row 5g; both kept). Drafts checked against merged P01-P03 code; paths, 5 s wait, error names (`lock-driver-unavailable`, `observe-lock-timeout`, `AlreadyInProgress`) match.
- Real gap found: `fenceTargets` and `cutOverLockFiles` only took registry rows with `owner === '4.2'`, and the `install` row's `<stateRoot>` path was unresolvable, so the three 4.4 rows had no fence and no doctor coverage. Fixed in `src/holder-lock/fences.mjs` (`CUTOVER_OWNERS`, `owners` and `stateRoot` options, `<stateRoot>/` resolved lazily through `resolveStateRoot`, tombstone `by` = `fgos <owner>`) and `src/setup/holder-lock-checks.mjs` (lock-file enumeration for activation, install, observe). `registry.mjs` needed no change (non-strict v1 fill leaves `<stateRoot>` verbatim).
- Hazard closed: `fixLockFences` is now gated per owner by the activated payload's registry. Without it, `doctor --fix` on a 4.2-activated workspace would tombstone `.fgos/installation/activation.lock` and `<stateRoot>/install.lock`, and the older `fgctl` could no longer upgrade that workspace.
- Docs: observe.md, distribution.md (rows 5g, 7b, RUL18), holder-lock spec (section 12 table, section 13, doctor table, decision history D1-D6 plus fence decisions), repository-runtime-layout.md, runtime-identity-and-activation.md, CHANGELOG. `fgos convention check -- <6 files>`: 0 violations.

## Evidence (phase-private release build of fgos and fgctl, `FGOS_HOST_BIN` set, session env unset)
- `test/holder-lock/*.test.mjs` + `test/setup/holder-lock-checks.test.mjs` + `test/setup/checks.test.mjs`: 198 tests, 196 pass, 0 fail, 2 skipped, exit 0.
- New `test/holder-lock/fences-rust-locks.test.mjs` (4 tests): three tombstones, idempotent, install once per machine; old observe file gives `v1-lock-present` with nothing half-fenced; new fgctl init and `metrics case open` work behind the fences; doctor `lock-fences` names the three paths, `lock-holders` warns with pid for a `flock` holder of `observe.lock`.
- Updated for the new rows: tombstone, ledger and stop-check tests pin a scratch `FGOS_STATE_ROOT`; counts 5 to 8 paths, 10 to 13 locks; added a per-owner gate test.
- `test/rust-host/fgctl-init-activation.test.mjs` (fixture sanity): 7 pass. The merge into integration was tree-identical to the tested tree (`git diff` empty), so it was not retested there.

## Decisions
- Fence owner list `['4.2','4.4']`; fix gated by the owners the activated registry names.
- Edited `holder-lock-checks.mjs` and the 4.2 fence tests, outside the phase file list, because doctor coverage and the acceptance test cannot work otherwise.
- Doctor test resets the three tombstones after init (init's `doctor --fix` fences when the machine is quiet), so it does not depend on other processes running.

## Concerns
- Accident: the first run of the old fence tests (before they pinned a state root) placed a tombstone at the real `~/.local/state/fgos/install.lock`. Removed within a minute (it held only that TOMBSTONE); the state dir listing is back to normal. Tests now never touch the real state root.
- GitNexus impact and detect_changes not usable (stale index, several repos named forgent); callers cross-checked by grep: only `holder-lock-checks.mjs` and tests use the changed fence functions. Public change: fence targets gain `owner`; new options. LOW.
- The `rc-p04` build-output link was repointed to a worktree-local dir (the fixture hardcodes `<repo>/<build dir>/release`); the integration worktree still links main's old build, so fgctl-init tests there fail falsely.
- A draft report `implementation-261016-1835-rust-callers-p04-docs.md` came in with the branch; left as is.
- P05 note: fences for the three locks are placed only once the activated release's registry carries the 4.4 rows, i.e. after the new fgctl release is activated.

No component-boundary change.

## Unresolved questions
None.
