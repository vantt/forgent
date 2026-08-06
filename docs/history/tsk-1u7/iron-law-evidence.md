# tsk-1u7 — Iron Law evidence

`classifyIronLaw` result at `approve` time: `required: true`, matched
flags: `[none]`, matched modules: `[src/runner/session.mjs]` — a
self-modifying diff to fgOS's own runner code.

## Test command

```
node --test --test-name-pattern="concurrent createSession" test/runner/session.test.mjs
```

Run repeatedly (30x per side) against `test/runner/session.test.mjs`'s
`concurrent createSession from real separate OS processes never loses a
registry entry` test, at `N=50` with a shared `startAt` synchronization
barrier (added specifically for this reproduction — see
`docs/history/tsk-1u7-session-lock-contention-flake/plan.md` for why a
barrier was necessary and `N=20` alone was not).

## Failing-before transcript (unpatched — `session.mjs`'s original
`fs.openSync(lockPath,'wx')` + separate `fs.writeSync`)

30 runs: **8 failed** (~27%). Two representative real failures:

Direct data-corruption hit (run 19):
```
✖ concurrent createSession from real separate OS processes never loses a registry entry (485.358251ms)
  Error: child p21 exited 1: SessionError: sessions.json at "/tmp/fgos-session-test-repo-SOho2U/.fgos/sessions.json" is corrupt (not valid JSON): Unexpected end of JSON input
      at readRegistry (file:///.../src/runner/session.mjs:237:11)
      at Module.createSession (file:///.../src/runner/session.mjs:307:21)
```

Lost-update hit (run 8 — real diff output, some example run):
```
AssertionError [ERR_ASSERTION]:
  actual: ['p0', 'p10', 'p11', ..., 'p9']   (41 entries — 9 missing)
  expected: ['p0', 'p1', 'p10', ..., 'p9']  (50 entries)
  operator: 'deepStrictEqual'
```
(9 concurrently-created sessions' registry entries never landed — the
exact "loses a registry entry" failure mode the test's own name names.)

## Passing-after transcript (patched — `fs.linkSync`-based atomic create,
mirroring `events.mjs`'s `tryAcquireEventsLockOnce`)

Same command, same `N=50`+barrier, 30 runs: **0 failed** (0/30).

Full regression, same conditions:
```
node --test test/runner/session.test.mjs
→ tests 15, pass 15, fail 0

npm test (x3, full suite)
→ tests 2470, pass 2465, fail 0, skipped 5 (pre-existing, unrelated)  — all 3 runs identical
```

## Root cause and fix

`session.mjs`'s `tryAcquireOnce` (pre-fix) created the lock file via
`fs.openSync(lockPath, 'wx')` then a separate `fs.writeSync(fd, pid)` — a
window where the file exists but is still empty. A competing process's
`fs.readFileSync` landing in that window sees unparseable (NaN) content,
misreads it as a dead/garbage holder, and unlinks a lock a live process
still legitimately holds — letting two processes both believe they hold
it, racing on `sessions.json`'s `writeRegistry` call.

Fix (`src/runner/session.mjs:131-166`): write the pid to a per-attempt
temp file, then `fs.linkSync` it onto `lockPath`. `link()` only ever
exposes the destination fully-written or not-yet-existing — the window
closes structurally. This is a direct port of `events.mjs`'s
`tryAcquireEventsLockOnce` fix, already proven at `tsk-3ld` (commit
`962eb6b`) for the sibling `events.lock`.

See `docs/history/tsk-1u7-session-lock-contention-flake/CONTEXT.md` (D3/D4)
and `plan.md` for the full decision trail.
