# Iron Law Evidence for `tsk-5x7`

## Classification

```json
{"required":true,"matchedFlags":["schema"],"matchedModules":["src/runner/dispatch.mjs","src/runner/dispatch/cli.mjs","src/runner/dispatch/plan.mjs","src/runner/dispatch/resolve.mjs","src/runner/dispatch/transport.mjs","src/runner/loop.mjs"]}
```

- **Item ID**: `tsk-5x7` (root — the three children `tsk-5x7-1`/`-2`/`-3` each
  have their own `docs/history/<id>/iron-law-evidence.md`, already delivered
  before this file existed; this file covers the ROOT's own diffs, made
  directly on `fgw/tsk-5x7` during a nine-round self-review pass over the
  dispatch-redesign work, per the user's own instruction: "claim nhánh
  worktree của tsk-5x7 để làm một vòng self review. fix bug luôn vào nhánh
  đó.")
- **Gated Modules**: `src/runner/dispatch.mjs`, `src/runner/dispatch/cli.mjs`,
  `src/runner/dispatch/plan.mjs`, `src/runner/dispatch/resolve.mjs`,
  `src/runner/dispatch/transport.mjs`, `src/runner/loop.mjs`

## How this evidence was produced

Unlike the three children (each a single, narrowly-scoped implementation
with one red→green pair), this root absorbed 18 distinct fixes across nine
rounds of an external advisor review, each fix independently verified live
against the real `herdr` binary and/or the real test suite at the time it
was made. Two kinds of evidence follow:

1. **Directly re-verified in this file's own preparation** (2026-08-26,
   immediately before writing this document): for the three most recent
   commits, the exact code change was temporarily reverted, the RED state
   was re-captured with precise wall-clock timing (`time`), then the fix
   was restored and GREEN re-confirmed — `git diff`/`git status --porcelain`
   confirmed byte-identical restoration each time, so no accidental drift
   was introduced by this verification pass itself.
2. **The commit's own contemporaneous record**: for the remaining findings
   (rounds 1–6, predating this evidence file), the commit message itself —
   written at the time the fix was made, describing the exact live
   probe/test output that motivated and confirmed it — is quoted verbatim
   as the record. These are not reconstructed after the fact; they are the
   real messages already on `fgw/tsk-5x7`, citable via `git show <sha>`.

---

## Directly re-verified (2026-08-26)

### Finding: timeout settlement waited on `close`, exposing an escaped-descendant delay (commit `7ed5d2e5`, part 1/3)

**RED** — `timer`'s callback set `timedOut` and killed the child, but only
`child.on('close', ...)`'s own `if (timedOut)` branch actually rejected —
reverted live to confirm:

```
$ time node live-timeout-escaped-descendant-verify.mjs
elapsedMs: 1020
caught instanceof DispatchError: true
errorClass: worker-timeout
node   0,06s user 0,02s system 6% cpu 1,090 total
```

(command: `sh -c "setsid sh -c 'sleep 1' & echo parent-done"`,
`timeoutMs: 100` — a 1020ms wait for a 100ms timeout, because the escaped
`setsid` descendant kept the stdout pipe open for its own full 1s lifetime,
which `close` waited on.)

**GREEN** — restored (timeout settles itself synchronously, in the timer
callback, never waiting for `close`):

```
$ git diff --stat src/runner/dispatch/transport.mjs
(no output -- byte-identical to the committed state)
$ time node live-timeout-escaped-descendant-verify.mjs
elapsedMs: 117
caught instanceof DispatchError: true
errorClass: worker-timeout
node   0,18s user 0,03s system 66% cpu 0,326 total
```

### Finding: the calling process's own event loop hung on the pipe even after the promise settled (commit `7ed5d2e5`, part 2/3)

**RED** — `finish()` without `releaseStdio()`:

```
$ time timeout 8 node live-timeout-process-hang-verify.mjs
promise settled at 103 ms, errorClass: worker-timeout
NOT calling process.exit() -- if the process hangs past a few seconds, the pipe/handle is still keeping it alive
timeout 8 node   0,06s user 0,02s system 1% cpu 5,065 total
```

(the promise itself settled at 103ms, but the whole process still took
5.065s of real wall time to exit — matching the escaped descendant's own
`sleep 5` lifetime exactly.)

**GREEN** — restored (`finish()` calls `releaseStdio()`, destroying
`child.stdout`/`child.stderr` on every settle path):

```
$ git status --porcelain src/runner/dispatch/transport.mjs
(no output -- byte-identical to the committed state)
$ time timeout 8 node live-timeout-process-hang-verify.mjs
promise settled at 105 ms, errorClass: worker-timeout
NOT calling process.exit() -- if the process hangs past a few seconds, the pipe/handle is still keeping it alive
timeout 8 node   0,06s user 0,02s system 47% cpu 0,164 total
```

### Finding: herdr-spawn's own `waitChild` observer was never process-grouped (commit `7ed5d2e5`, part 3/3)

**RED** — `waitChild` spawned without `detached: true`:

```
$ time node --test --test-name-pattern="handles timeout via DispatchError" test/runner/herdr-spawn-adapter.test.mjs
✔ herdr-spawn adapter handles timeout via DispatchError worker-timeout (111.569833ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
ℹ duration_ms 10093.218853
node --test ...   0,12s user 0,04s system 1% cpu 10,120 total
```

(the assertion itself passed in ~112ms, but the whole test FILE took
10.12s of real wall time to report done — the mock's inline `sleep 10`,
orphaned by a kill that could only reach `waitChild`'s own pid, not its
process group, kept the pipe open for the remaining ~9s.)

**GREEN** — restored (`waitChild` spawned with `detached: true`, same
pattern `cliSpawnAdapter`'s own `child` already used):

```
$ git status --porcelain src/runner/dispatch/transport.mjs
(no output -- byte-identical to the committed state)
$ time node --test --test-name-pattern="handles timeout via DispatchError" test/runner/herdr-spawn-adapter.test.mjs
✔ herdr-spawn adapter handles timeout via DispatchError worker-timeout (111.824016ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
ℹ duration_ms 186.841235
node --test ...   0,11s user 0,03s system 68% cpu 0,213 total
```

### Finding: echo-stripping missed a second, prompt-prefixed occurrence (commit `9faf8879`)

Captured live in the original session, against the real adapter
(`EXECUTOR_ADAPTERS['herdr-spawn']`, real `herdr` binary), not reverted
after the fact — both runs below are genuine before/after transcripts from
that live session.

**RED** — `indexOf` (first occurrence only):

```
paneId: wS:pN7
status: 0
stdout: "➜  /tmp sh '/tmp/fgos-herdr-run-mt9ifj2e-8q7idy.sh'\nworker-with-no-contract-signal\n➜  /tmp"
cli.mjs would compute hasSignal: false (expect false)
```

(dispatched via `sh -c 'echo worker-with-no-contract-signal'`; the returned
`stdout` still started with the pane's own echo of the typed
`sh '<scriptPath>'` invocation — a real terminal artifact discovered via a
raw `herdr pane wait-output` JSON probe showing the typed line rendered
TWICE, once bare and once shell-prompt-prefixed, which the prior fix's
`indexOf` only ever found the first of.)

**GREEN** — `lastIndexOf` bounded by the evaluated sentinel's position:

```
paneId: wS:pN9
status: 0
stdout: "worker-with-no-contract-signal\n➜  /tmp"
cli.mjs would compute hasSignal: false (expect false)
```

---

## From the commit's own contemporaneous record

Each block below is quoted verbatim from the named commit's message,
written at the time the fix was made — citable via `git show <sha>` on
`fgw/tsk-5x7`.

### `580fe09e` — egress-governance host check was a bypassable substring match

> `envTarget.includes('api.anthropic.com')` is true for any URL merely
> containing that literal text (a path segment, a query param, a
> lookalike host like `evil.example.com/api.anthropic.com`), silently
> clearing the cross-provider gate. Replaced with a real hostname
> comparison, fail-closed on an unparseable URL.

### `2db1fe88` — herdr-spawn pane run was vulnerable to shell command injection

> `herdr pane run` types the given text into whatever shell is already
> running in the pane — there is no argv boundary. The old regex-based
> conditional double-quote wrapping still let `$()`/backticks inside a
> double-quoted shell string execute as command substitution against
> untrusted prompt/repo content. Replaced with unconditional POSIX
> single-quote wrapping... Regression test hands the exact captured
> typed-text to a real POSIX shell and proves neither injection nor
> content mangling occurs.

### `bdddbe16` — governance descriptor was computed then discarded before the real dispatch event

> `resolveExecutorConfig` already computes `{providerFamily, egress}` for
> every dispatch, but `resolveExecutorCommand` never returned it, so
> `spawnWorker`'s result never carried it, so `loop.mjs`'s real production
> `executor.dispatch` event... never recorded it.

### `c6be1a38` — DispatchPlan approximated resolution instead of reusing it

> Three real gaps closed: (1) selector derivation order didn't match
> actual resolution precedence... (2) invocation picked
> `executor.invocations[0]` instead of the `via:"cli"` entry
> `resolveExecutorConfig`'s own Gate B2 actually selects... (3) governance
> was hardcoded `{carries:[], egress:null}`, never the real per-executor
> descriptor.

### `5f69b274` — DispatchPlan's unavailable branch was the sole governance-shape holdout

> Every other branch reports governance as `{providerFamily, egress}`
> after the prior fix — the `'selector.unregistered'`/unavailable branch
> was still returning the old `{carries: [], egress: null}` stub.

### `6a682fb1` — DispatchPlan swallowed governance/resolution failures as false success (P1)

> `compileDispatchPlan` caught `resolveExecutorConfig`'s throw and quietly
> degraded governance to null while still reporting
> `mechanism: 'out-of-process', configured:true` — a governance-blocked...
> executor previewed as dispatchable when the exact same `executorId`
> passed to `execute` would refuse it.

### `927b3f7f` — herdr-spawn lost the unsignaled→git-inference fallback and reported the wrong exit code (P1, P2)

> `herdr pane wait-output` can ONLY detect completion by regex-matching
> text the dispatched agent itself prints... A worker that does real work
> but never emits `[DONE]`/`[BLOCKED]`... just sat until this adapter's
> own timeout fired and hard-rejected, discarding that fallback entirely...
> RED confirmed: reverting the fix reproduces the exact `worker-timeout`
> rejection this finding described.

### `4cdddae7` — herdr-spawn never passed the resolved executor env into the pane (P1)

> `fullEnv` only ever governed the LOCAL `execFileSync`/`spawn` calls this
> adapter makes to the `herdr` CLI itself — the worker actually running
> inside the pane ran under ambient/default env instead... RED confirmed
> for the env-propagation gap.

### `70832531` — herdr-spawn was broken against the real binary in 3 ways (P1, P1, P2)

> Verified live against the actually-installed herdr binary (0.8.2), not
> just mocks... 1. `pane split --direction right|down` is REQUIRED. This
> adapter never passed it. Confirmed live: `herdr pane split --no-focus
> --cwd /tmp` refuses with exit 2... 2. Timeout only killed the
> wait-output watcher, never the worker actually running inside the
> pane... Confirmed live: a real `sleep 45` survived a `worker-timeout`
> rejection... 3. `herdr pane wait-output --timeout` raced against this
> adapter's own JS `setTimeout` at the identical duration. Confirmed live:
> when herdr's own timeout won, wait-output exited 1... silently
> resolving `{status:1, stdout:''}` instead of rejecting `worker-timeout`.

### `56d9dcc5` — DispatchPlan.configured was overloaded with a second meaning (P2)

> `configured` means "does this executorId resolve to a real config
> entry" everywhere else... the governance-blocked early return hardcoded
> it to `false`, conflating "not registered" with "registered but
> currently refused".

### `36a7a076` — herdr-spawn could resolve before the worker truly exits, and misreported observer failures (P1 x2, P2)

> 1. A worker that prints `[DONE]` and then keeps running was treated as
> complete the instant the token appeared — confirmed live: resolved in
> ~10ms while the worker kept running for another second... 2. [a]
> multiline dispatched prompt... containing a line that itself starts
> with the literal text `"[DONE]"`/`"[BLOCKED]"`... would satisfy even the
> prior round's `(?m)^` anchor via the pane's own echo of the typed
> command, before the worker ever runs. [Also fixed, P2:] a non-zero
> wait-output exit that is NOT this adapter's own SIGTERM-triggered
> timeout... fell through to the "success" path... confirmed live by
> closing the adapter's own pane out from under a live wait-output call.

### `0a373722` — herdr-spawn's temp run-script self-deletes at startup (P2)

> Fixed by making the script delete itself as its own first line
> (`rm -f "$0"`)... Confirmed live: while a long-running worker is still
> executing, `ls /tmp/fgos-herdr-run-*` finds nothing — the file is gone
> before the worker even starts, not just after it exits.

### `e55a1da8` — dispatch adapters resolve on 'close', not 'exit' (stdout-loss race)

> Node's own docs say 'exit' can fire BEFORE all buffered stdout/stderr
> 'data' events have been delivered... under real CPU contention...
> 'exit' can win, and `cliSpawnAdapter` resolves with `stdout` still
> empty — silently truncating the SAME `result.stdout` every real caller
> (including the live-tee log) depends on.

Confirmed by a subsequent regression run, not reverted for this file
(re-running would require re-inducing the same rare CPU-contention race
that originally exposed it, which is not reliably reproducible on demand —
the fix's correctness instead rests on the Node platform documentation
cited above plus the observed absence of the failure across multiple
repeated runs after the fix):

```
$ node --test test/runner/dispatch.test.mjs test/runner/loop.test.mjs
ℹ tests 401
ℹ pass 401
ℹ fail 0
```

(the reviewer's own two independent reports, before this fix, both showed
400/401 with `item-live-b`'s log empty — `test/runner/loop.test.mjs:1038`.)

## Full regression suite (after all fixes)

```
$ npm test
ℹ tests 4081
ℹ pass 4075
ℹ fail 1
ℹ skipped 5
```

The one remaining failure (`check-decision-citation-drift.test.mjs`) is
pre-existing worktree cross-contamination unrelated to this item's own
diff (unrelated `docs`/`skills` files modified by some other process,
already flagged to and explicitly left as-is by the user) — confirmed via
`git status`/`git diff` showing those files dirty but not staged or
touched by any commit on this branch.
