# Rust callers P00: registry rows for activation, install, observe

Status: DONE

## Result
- Draft rows (`6a82b3dab`) re-verified against the 4.2 registry as landed on main: the three 4.4-owned rows are separate rows (mutex, rank 80, fence tombstone, owner 4.4; install is machine scope). v3/v1 paths match the source: `init.rs` activation.lock under `installation/`, `store.rs` install.lock in the store root, `store_lock.rs` `.fgos/observe/.lock`.
- 4.2 code reads these rows safely: `fences.mjs` `fenceTargets` and `holder-lock-checks.mjs` `cutOverLockFiles` filter on `owner === '4.2'`, so 4.2 tooling ignores the 4.4 rows until 4.4a P04/P05 wires them. No drift to fix in the registry.
- One real defect found in the 4.2 test: the tombstone-path check compared by `endsWith` on the template tail, so `<lockRoot>/install.lock` (= `<stateRoot>/locks/install.lock`) falsely "landed on" `<stateRoot>/install.lock`. Fixed by comparing both paths in one spelling (`<lockRoot>` -> `<stateRoot>/locks`, `<fgosDir>` -> `.fgos`) with `notEqual`.

## Evidence
- `node --test` on registry-contract, lock-scope-order, fences-v1-tombstone, fences-v1-ledger, state-root: 51 tests, 50 pass, 0 fail (1 skipped), exit 0.
- Prior art: `git whatchanged -S'flock' --oneline --no-patch -- packages/distribution packages/observe`: no commits; no kernel lock ever existed in these crates.
- Impact analysis: no code symbol edited (JSON data + one test); GitNexus index stale, not used.

## Notes for wave 1
- `install` v1Path uses `<stateRoot>`; no facade placeholder covers it yet, P04 adds resolution where fences/doctor need it.
- Worktree needed a hard-linked dependency dir for the `yaml` import in the v1-acquire test.

No component-boundary change.

## Unresolved questions
None.
