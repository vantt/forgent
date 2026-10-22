# Release probe left a forkable Sh lock (holder-lock)

## Cause
`settle_release` (flock.rs) and `port::probe` took a Sh lock on a private description and only closed it. A child forked by another thread of the same process in that window inherits the description and its lock until exec/exit, so an immediate Ex try answered Held. `Locked`/`before_close` is a no-op on POSIX, so `port::probe` had the same defect.

## Fix
- New `LockDriver::unlock_private` (flock: LOCK_UN; Windows: delegates to `before_close`). Called by the release probe and by `port::probe` before the close. The holder's own description is still never unlocked.
- Other sites checked, left alone: `borrowed_check` locks the borrower's slot description, which is shared with the holder (not private); `semantics.rs` and `helper.rs` hold the lock on purpose.
- Spec: one sentence added to description rule 6. Code header comments updated. CHANGELOG line added.

## Proof
`released_lock_is_free_while_a_sibling_thread_forks_children` (tests/borrow_io.rs): forker thread spawns `true` in a loop while main loops 2x acquire(Ex,Try)+release; asserts never Held. Bounded by 300 rounds / 20 s.
- Before fix: red 3/3 runs.
- After fix: green 5/5 runs.

## Distribution lib tests (`cargo test -p fgos-distribution --lib`, 30 runs each, own target dir)
- Before fix: 7/30 failed.
- After fix: 0/30 failed.

## Checks
`cargo test -p fgos-holder-lock` all green; `cargo clippy -p fgos-holder-lock --all-targets` clean.
