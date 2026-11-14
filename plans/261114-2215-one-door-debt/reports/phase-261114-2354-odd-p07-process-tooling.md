# Phase 07 report: test tooling signals only identities the door read

Branch `one-door-debt/p07`.

## Done

- Strays, run-dir reap and the mailbox probe's run processes now go through the existing door: `scan` reads each identity before argv, env, cwd and exe, and `stopProcessesInside` signals that identity, so a reused pid is refused. `stop-processes-inside.mjs` gained two pass-through options (`envKeys`, `views`; `processesInside` already had them); this file is outside the phase list, the change is 3 lines and additive.
- `scripts/run-tests.mjs`: `stopStrays(roots, ...)` finds strays by executable, cwd or inherited `TMPDIR`/`FGOS_TEST_FIXTURE_ROOT` and returns `{strays, refusals}`. Gone is not a refusal. Unreadable identity (with its cause), a refused signal, a process alive after the kill and an unavailable door are refusals: logged with `ps -o pid,lstart,args -p <pid>` as the next step, and the run fails. No stray is reported "killed" unless the door stopped it. Deleted: `processTable`, `strayProcessesUnder`, `identifyStray`, the `identify` parameter, `killByIdentity`.
- Watchdog: writes `ready` after its judge check (or `failed`); the runner waits up to 20 s for either and refuses with status 1 before spawning any test when the door cannot load, `selfRecord` throws, the watchdog fails or stays silent. `killTree` observes every member, reads the table again, and signals only members still in the tree with the same command line, by the observed identity. Refusals are said once (console and journal) with a next step; the runner prints them under the timed-out file, and the header no longer says "killed". Deleted: `GONE`, `killByIdentity`, `killPid`, `reportRefusal`, the `/proc` environ loop (`reapRunDirs` lost `procRoot`).
- `mailbox-live-confined.mjs`: run processes come from `scan` (identity first, then namespace link) and are killed by that tuple; launch start times are `observe(...).startTime`; `startTime`, `stateOf`, `killObserved` removed. `killIfSame` keeps comparing the start time recorded at launch before signalling the observed identity.
- No existing runner-side loader of a staged manifest exists (only `build-rust-distribution.mjs` builds a descriptor inline), so `loadRunnerDoor` stays: it builds the descriptor from the manifest in `childEnv` and falls back to the process's own door when staging produced none.
- `doors` rows: process control debt now only `packages/git/rust/src/driver.rs`. `/proc` row: `run-tests.mjs` and `test-file-watchdog.mjs` need no entry (scan covers them); six `scripts/` entries moved to `allowed` with corrected reasons (`mailbox-live-cli` cmdline scan, `p-space-resource` status thread count, `mailbox-live-confined` ns link and children). Census regenerated.
- Tests (owner `test/scripts/run-tests.test.mjs`): door refusal of a stray fails the run with the next step; the run refuses before any test when the time limit cannot start; the watchdog reports `failed` and exits 2 when the door cannot load. The stale-identity case is owned by `test/process/process-facts-vectors.test.mjs` (`identity-mismatch`), so the earlier copy was removed. The real-watchdog hang test (journal, kill, grandchild) holds the door's `signalByIdentity` and is green.

## Gates (/dev/shm/odd-p07-gates5.log, odd-p07-run6.log)

run-tests, architecture, doc-health, git-mutation-census, process-facts-vectors, mailbox-live-confined, mailbox-behaviour-v7j, stop-processes-inside tests: green; citation drift clean; one-door scan 0 undeclared. Focused slow-file run not done (needs the big lead's go).

## Concerns

- Item 7 (cap polling on repeated `unknown`) not done: stopping the watchdog would silently drop the time limit, and the refusal path above already covers the door being unavailable.
- The door now loads at the end of every run (the scan needs it), not only when a kill is needed.
- A stray is now matched by env/cwd/exe, not by its command line naming the dir.
- `stillThere` in `stop-processes-inside.mjs` treats `unknown` as gone; that predates this phase and is left unchanged.
- Review follow-ups applied: `killTree` also requires the root's ppid unchanged, `stopStrays` returns early on win32, the ready-wait skips a half-written journal line.
- No CHANGELOG line.

## Lessons

- Identity must come from the same scan that reads the attributes you match on; observing a pid at kill time proves nothing.
- A launcher that blocks in spawnSync needs a ready handshake through a file, or a dead helper looks the same as a quiet one.
- Reuse the door's stop primitive; extend it with an option before writing a second killer.
- "Gone" and "refused" are different outcomes; reports must not merge them.

## Authority

None changed.
