# Git Publication: resumable pin release

Date 2026-10-21. Branch git/p07-switch (merged origin/main first).

## Change
- `packages/git/rust/src/publication.rs` `release_pin_and_compact`: for a chain at `PinReleaseAttempt`, pin == recorded candidate re-issues the exact-old delete (first release and resume now share this one path); pin absent -> `PinReleased` + compact; other value -> `RecoveryRequired`, pin kept. Delete failure (native lock) returns the error, lock untouched.
- `docs/platform/git/spec.md` §9 step 4: dated 2026-10-21 clarification (pin unique/written once/only release deletes it -> no ABA; locks never removed).
- `packages/git/node-addon/src/git.rs` `inspect_git`: `nativeLocks` also lists `refs/fgos/git-operations/<id>/candidate.lock` (existing `git-native-locks` row; `packed-refs.lock` was already covered; no new row).
- `scripts/git/e1-power-cut.mjs` `check`: fsck `badRefContent` on `<pin>.lock` whose chain last record is `pin-release-attempt` is not a violation; a pin-release chain whose pin holds a value other than the recorded candidate is. Other fsck errors unchanged. Sanity-run on replay image 2783: fsck lock no longer reported (remaining violations there are the known dev:ino `Untrusted` of copied images).

## Proof
- New owning test `an_interrupted_pin_release_is_resumed_only_while_the_pin_still_equals_its_candidate` (tests/publication.rs, files + reftable): native lock present -> release errors, lock bytes preserved, chain stays at attempt, repeat still blocked; lock removed -> same release completes and compacts; pin with another value -> error, pin and chain preserved. No fault point needed: a real lock blocks the delete after the attempt is appended.
- Doctor lock listing extended in test/git/native-load.test.mjs (existing native-lock test).
- `cargo test -p fgos-git` all pass; `cargo clippy -p fgos-git --all-targets -D warnings` clean; test/git/recovery, test/setup/git-checks, test/git/native-load pass (17 pass, 1 skip).
- Copied e1-power-cut.mjs, publication.rs (and git.rs) into /home/vantt/.claude/jobs/e1505f04/tmp/land-0530/wt and ran `node scripts/git-addon.mjs` (built).

## Notes
- `recover_publications` still aborts its loop on one stuck release (owner decision pending, unchanged).
- Clippy of the node-addon crate not run separately (package name not found by that id); addon compiled via git-addon build.

Status: DONE
Summary: A chain stuck at PinReleaseAttempt now re-issues the exact-old pin delete, compacting once any native lock is cleared; spec, doctor lock listing, E1 verdict and owning test updated.
Concerns/Blockers: none blocking.
