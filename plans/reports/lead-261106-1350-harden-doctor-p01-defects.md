# Doctor readiness-only, defects phase: report

Branch `harden/doctor-p01` from origin/main `84f36c8f3`. Not pushed.

## What changed

- Doctor in a git repo that is not set up for fgOS now leaves no `.fgos` and starts no events child.
  - `bin/fgos.mjs`: `doctor` removed from the Event Store lifecycle verb set. It was added in the same commit that introduced the set (a generic list of verbs that open the store); no commit message names a behaviour that needs doctor to seal or publish.
  - `src/setup/registrations.mjs` `checkObserveDirWritable`: an absent `.fgos/observe` passes with an `info:` line and is never created (the observe store creates it on first write, `packages/observe/rust/src/shard.rs`); an existing directory still gets the write probe.
  - `.fgos/locks` culprit: `checkLeafNotifyDrift` (`registrations.mjs`, row `leaf-notify-drift`) calls `postLandDrift` (`src/state/postland-drift.mjs`), which called `listSessions` even with no candidate leaves; `listSessions` takes the sessions lock, and `ensureLockFile` (`src/holder-lock/index.mjs:204`) makes `.fgos/locks`. Found by tracing `fs.mkdirSync` under the test env; a per-row bisect without the host binary did not reproduce it. Fix: `postLandDrift` returns before reading the registry when there is nothing to compare.
- `executor-profile-warnings` returns `passed: true` with a `warning:` prefix; description lost its plan label. Only the level changed, T5 still owns the row.
- `no-stuck-merge-abort` fix deleted (check kept). Fix inventory line edited in `setup-doctor-registry.md` and in packaging-distribution `spec.md` row 7b.
- Lock-directory refusal text (`locks.rs`, and its pinning assertion in `append_recovery.rs`) names `fgos doctor --fix (event-store-lock-dirs)`. Two remaining "run fgos setup" messages in `registrations.mjs` (shell integration, `core.hooksPath` hook wiring) left: setup still owns them.
- CHANGELOG `[Unreleased]` line.

## Red to green

- New test in `test/setup/checks-doctor-config.test.mjs` (next to the doctor read-only proof): scratch `git init` repo, private HOME, `fgos doctor --json`, then no `.fgos` and no events child.
  - Red on main: `.fgos` left with `locks,logs,observe`.
  - After the lifecycle and observe fixes: `.fgos` still had `locks` (the drift row), red.
  - Green after the `postLandDrift` early return.
- Process check is a bounded poll of `ps` for an `events` process naming the repo. A child that fails and exits within 100 ms is invisible to it; the absence of `.fgos/logs` (where its fault was recorded) is what proves it was not started. Weakness noted.

## Tests retired / rewritten

- `no-stuck-merge-abort` fix assertions (two tests): behaviour removed, the check assertions stay in the same tests.
- `observe-dir-writable passes and creates .fgos/observe` rewritten: owner is the same test; now asserts absent dir = info and not created, existing dir = writable and probe removed.
- `executor-profile-warnings` level assertion corrected in its owning test.

## Verification

- Focused (checks-doctor-config, executor-profile-warnings, observe-doctor-checks, registrations, checks, postland-drift, architecture, doc-health, decision-citation-drift): 246 pass, 0 fail.
- `cargo test -p fgos-event-store` green; clippy `-D warnings` clean; `cargo check` for x86_64-pc-windows-msvc and aarch64-apple-darwin clean.
- `cargo fmt --all --check` reports drift only in files this change does not touch (`apps/fgos/src/wiring/mailbox_remote.rs`, `packages/convention/rust/tests/golden.rs`); `rustfmt --check` on the two Rust files I edited is clean.
- Census: `git-one-door-scan` 0 undeclared; no census regeneration needed.
- Full suite (8745 tests): 2 fail. One was `test/event-store/triggers.test.mjs` asserting the old `fgos setup` lock-dir message; updated to the new text and re-run green (10 pass). The other is the known frozen V7n addendum failure. No `run-tests: ERROR` lines. The suite was not re-run whole after the one-line test fix.

## Size against the phase estimate

Node src: +12 / -33 lines (about -21, estimate -20). Tests: +41 / -18 (about +23, estimate +40). Rust: message text only, 0 net.

## Deviations and notes

- `src/state/postland-drift.mjs` is outside the phase's file list; it is the `.fgos/locks` writer the phase asked to find and fix. `docs/platform/packaging-distribution/spec.md` row 7b edited for the fix inventory.
- Doctor timing before/after not measured (needs the activated release, a land-time step).
- Board line telling the T5 lead that the `executor-profile-warnings` level changed is not written (no board access here); for the big lead.

## Unresolved

- None blocking.
