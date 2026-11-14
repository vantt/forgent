# Report: uninstall purge guard uses the state root's home rule

## What changed
- `packages/holder-lock/rust/src/state_root.rs`: the HOME-then-USERPROFILE reading moved into public `home_from(get)` (returns path and `Source`) plus `home_for_state_root()` (process env). `state_root_from` calls `home_from`; behaviour and vectors unchanged.
- `packages/distribution/rust/src/uninstall.rs`: private `home_dir()` deleted; `--purge` guard calls `home_for_state_root()`. One test added: a store root equal to the `HOME` the state-root rule picks is refused while a different `USERPROFILE` is not the guarded home (why new: nothing pinned the guard to the state root's rule; the home-rule cases stay owned by `state_root.rs` tests). Uses the injectable `home_from`, no env mutation.
- Net: no new crate edge, `Cargo.lock` unchanged.

## doors
The global-directory row is not on this base; no row edited. Leak gone: the row lands with no debt entry for `uninstall.rs` (no `fn home_dir(` remains in that file). If the row's pattern would match `home_from`/`home_for_state_root`, allow them with reason "the state root's home rule; Config's global directory is a different rule".

## Gates (log files /dev/shm/odd-p04-*.log)
fmt, clippy -D warnings, `cargo test -p fgos-holder-lock -p fgos-distribution -p fgctl`, cargo check msvc and aarch64-apple-darwin: green. Node: architecture, doc-health, git-mutation-census, holder-lock tests 0 failures; decision-citation-drift 0; git-one-door-scan 0 undeclared. CHANGELOG: none (no user-visible change).

## Item for the big lead (not fixed)
Two home rules exist: `state_root.rs` (HOME then USERPROFILE on every platform) and `packages/config/rust/src/machine.rs` (USERPROFILE only on Windows, rejects whitespace). Which is right is a separate question.

## Lessons
- A "home" reader beside a protected path must share that path's rule, not the nearest shared helper.
- Expose the injectable `_from` form so a guard test needs no env mutation.

## Status
DONE
