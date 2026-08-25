# Iron Law evidence: tsk-31v

`classifyIronLaw` against the real committed diff (`435444ef...f3393c40`
on `fgw/tsk-31v`) returned `required: true`, matched modules:

```
bin/fgos.mjs, src/runner/gateway-control.mjs
```

No matched flags — the module list itself (core CLI dispatcher + a new
runner module) is enough to require evidence, regardless of keyword hits
in the description.

## Test command

```
node --test test/runner/gateway-control.test.mjs test/cli/fgos-gateway.test.mjs test/cli/fgos-manifest.test.mjs
```

## Failing-before / passing-after

Captured live by restoring the working tree to the parent commit
(`435444ef`, immediately before the `feat(tsk-31v)` commit) with
`git checkout 435444ef -- .`, running the real commands, then restoring
the real committed tree with `git checkout f3393c40 -- .` and re-running
— `git status --short` confirmed a byte-identical, clean restoration
before trusting the after-run.

**Before** (`435444ef`, `bin/fgos.mjs` has no `case 'gateway'`,
`command-registry.mjs` has no entry — the new `gateway-control.mjs`
module and its test files exist on disk untouched by the revert since
they are new-in-this-commit paths absent from the parent tree, but
nothing wires to them yet):

```
$ node bin/fgos.mjs gateway status --dir /home/vantt/projects/forgentX
fgos: unknown verb "gateway". Usage: fgos <version|init|add|...
exit code: 4

$ node --test test/cli/fgos-gateway.test.mjs
ℹ tests 6
ℹ pass 0
ℹ fail 6
```

(Every CLI-dispatch test fails for real — the verb genuinely does not
exist yet.)

**After** (`f3393c40`, the real committed diff):

```
$ node bin/fgos.mjs gateway status --dir /home/vantt/projects/forgentX
{"contract":"fgos.v1", ..., "data":{"running":false,"reachable":false}}

$ node --test test/runner/gateway-control.test.mjs test/cli/fgos-gateway.test.mjs test/cli/fgos-manifest.test.mjs
ℹ tests 27
ℹ pass 27
ℹ fail 0
```

## Also real: the full pipeline, proven by hand against this repo

Not automated (a real `cargo build --release` is too slow for the test
suite's own fast-CLI contract) — run directly against
`/home/vantt/projects/forgentX`:

```
$ fgos gateway start --dir /home/vantt/projects/forgentX
{"pid":1071178,"port":4170,"startedAt":"2026-08-25T05:21:23.147Z", ...}

$ fgos gateway status --dir /home/vantt/projects/forgentX
{"running":true,"reachable":true,"pid":1071178,"port":4170, ...}

$ fgos gateway start --dir /home/vantt/projects/forgentX   # while already running
fgos: gateway is already running (pid 1071178, port 4170) — stop it first ...

$ fgos gateway stop --dir /home/vantt/projects/forgentX
{"alreadyStopped":false,"pid":1071178,"port":4170}

$ fgos gateway status --dir /home/vantt/projects/forgentX
{"running":false,"reachable":false}

$ fgos gateway stop --dir /home/vantt/projects/forgentX   # already stopped
{"alreadyStopped":true}

$ ss -ltnp | grep 4170   # (nothing — port genuinely freed)
```

## Also real: an out-of-scope regression found, not fixed here

`test/runner/claim-port.test.mjs:77` fails on `main` independent of this
diff (actual 6 !== expected 4 read count, stale since commit `b727d9a7`'s
multi-file event-read routing). Confirmed reproducible in isolation
before this diff touched anything. Filed as **tsk-4cf**; this item's own
verify command deliberately excludes it rather than either fixing
out-of-scope code or silently accepting a red suite.

## Full suite at the final, returned state

`node --test test/runner/gateway-control.test.mjs test/cli/fgos-gateway.test.mjs test/cli/fgos-manifest.test.mjs`:
**27 tests, 27 pass, 0 fail.**

## Not applicable here

No scope/architecture redesign — the module shape (registry file,
PID-liveness technique, lifecycle verbs) was decided directly from
`session.mjs`'s own established precedent, not guessed.
