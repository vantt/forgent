# Iron Law evidence: tsk-2n2

`classifyIronLaw` against the real committed diff (`ccf8ed09...1005e7cd`
on `fgw/tsk-2n2`) returned `required: true`, matched module:

```
src/runner/gateway-control.mjs
```

## Test command

```
node --test test/runner/gateway-control.test.mjs test/cli/fgos-gateway.test.mjs test/cli/fgos-manifest.test.mjs test/architecture.test.mjs
```

## Failing-before / passing-after

Captured live by restoring the working tree to the parent commit
(`ccf8ed09`) with `git checkout ccf8ed09 -- .`, then restoring ONLY the
new test file (`git checkout 1005e7cd -- test/runner/gateway-control.test.mjs`)
so the NEW tests run against the OLD module — the most direct way to
prove the fix's own tests genuinely exercise something the old code
lacked, not just something the old code happened to already pass. Then
restored the real committed tree with `git checkout 1005e7cd -- .` and
re-ran — `git status --short` confirmed a clean restoration.

**Before** (old `gateway-control.mjs`, new test file):

```
$ node --test test/runner/gateway-control.test.mjs
SyntaxError: The requested module '../../src/runner/gateway-control.mjs'
does not provide an export named 'acquireGatewayLock'
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

(The whole file fails to even load — `acquireGatewayLock` did not exist
before this fix, so the cross-process lock-contention test cannot run
against the old code at all. Real, unambiguous red.)

**After** (the real committed diff):

```
$ node --test test/runner/gateway-control.test.mjs test/cli/fgos-gateway.test.mjs test/cli/fgos-manifest.test.mjs test/architecture.test.mjs
ℹ tests 35
ℹ pass 35
ℹ fail 0
```

## Also real: two genuine bugs caught while BUILDING this fix's own tests

Not just fixing the originally-reported gaps blind — writing real tests
for them surfaced two more real, live bugs before this item was
considered done:

1. **A same-process zombie artifact in the ORIGINAL test helper**
   (`spawnThrowaway` used a direct `child_process.spawn`, making the
   throwaway a live Node child of the test process itself). Calling the
   real `stopGateway` against it made its own `Atomics.wait`-based poll
   loop starve the event loop needed to reap that child, so `isPidAlive`
   saw a zombie as "still alive" for the full timeout — a test-only
   artifact (confirmed live: an ORPHANED process, matching real
   production topology where `stop` always targets an unrelated,
   already-detached process, dies within ~50ms under the identical
   blocking poll). Fixed the test helper to spawn via `setsid` from a
   `sh -c` wrapper that itself exits immediately, producing a genuine
   orphan.
2. **A real bug in the escalation logic itself**, caught only once a
   genuinely SIGTERM-resistant throwaway process was used to test it:
   the first draft checked `isPidAlive` exactly once, immediately after
   sending SIGKILL, and gave up right away if it had not been reaped
   that exact instant — treating a real (if brief) kernel delay as
   permanent failure. Fixed by giving the SIGKILL phase its own full
   `waitUntilDeadOrDeadline` window, same as the graceful phase.

## Also real: a manual end-to-end run against this repo, post-fix

```
$ fgos gateway start --dir /home/vantt/projects/forgentX
{"pid":426480,"port":4170,"logPath":".../gateway-1787719548653-426416.log", ...}
   # ^ unique per-invocation log path, confirmed

$ fgos gateway status --dir /home/vantt/projects/forgentX
{"running":true,"reachable":true,"pid":426480, ...}

$ fgos gateway start --dir /home/vantt/projects/forgentX   # while running
fgos: gateway is already running (pid 426480, port 4170) ...

$ fgos gateway stop --dir /home/vantt/projects/forgentX
{"alreadyStopped":false,"pid":426480,"port":4170}

$ fgos gateway status --dir /home/vantt/projects/forgentX
{"running":false,"reachable":false}

$ ss -ltnp | grep 4170   # nothing — port genuinely freed
```

## Full suite at the final, returned state

`node --test test/runner/gateway-control.test.mjs test/cli/fgos-gateway.test.mjs test/cli/fgos-manifest.test.mjs test/architecture.test.mjs`:
**35 tests, 35 pass, 0 fail.**

## Not applicable here

No new `.mjs` file added this time (all fixes landed inside the existing
`gateway-control.mjs`), so `docs/architecture-manifest.json` needed no
further edit — `test/architecture.test.mjs` is included in this item's
own verify specifically to confirm that (the exact check tsk-31v was
blocked on the first time).
