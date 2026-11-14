# Confined run end: zombie no longer counts as a leftover process

Base: origin/main 3bb5979aa merged with origin/harden/ci-mlc (4ef103586), no history rewrite.

## Changes
- `scripts/lib/mailbox-live-confined.mjs`: `processesOfRun` skips processes in state Z or X via the existing `stateOf` (a killed, unreaped process keeps a readable `ns/pid` link and used to match).
- `startConfinedRun` takes `waitMs` (default 5000) and hands it to `sandboxInit`, so pid 1 is found under load.
- `test/scripts/mailbox-live-confined.test.mjs`: the 'leaves no process' assertions now name each remaining pid with its state and parent pid; the pair run starts with `waitMs: LOADED_WAIT_MS`; one new test proves an unreaped zombie in the namespace is not counted while a live process is. The no-process check is unchanged in strength.

## Verification
`node scripts/run-tests.mjs test/scripts/mailbox-live-confined.test.mjs`: 20 pass, 0 fail.
Not shown: that the new test fails on the old code (not run, to spare the loaded machine); the test asserts the zombie still shows its namespace link, which is the precondition.
