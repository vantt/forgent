# RESEARCH — dispatch/fan-out research dogfood (tsk-o4l)

## Round 1 — 2026-08-08

**Asked:** gather real evidence for the two independent risk-map rows in
`plan.md`, required by `fgos-coding-validating`'s feasibility matrix (P1: repo,
P2: external — deliberately unrelated topics, dispatched as two
independent branches per D2's fan-out rule).

**Checked:**
- P1 — repo search (packet `tsk-o4l#p1`, dispatched native/Explore):
  `resolveWriterIdentity` (`src/runner/session-identity.mjs`) call/reference
  sites across the whole repo.
- P2 — external doc lookup (packet `tsk-o4l#p2`, dispatched
  native/researcher): Node.js `AbortController` + `child_process.spawn`
  cancellation, `nodejs.org/api/child_process.html` and
  `nodejs.org/api/globals.html#class-abortcontroller`.

**Found:**

### P1 — `resolveWriterIdentity` real call/reference sites (outside `session-identity.mjs`)

Real runtime callers (not docs/comments):
- `src/runner/merge.mjs:652` — `const identity = resolveWriterIdentity(fgosDir).id`, main-checkout merge lock.
- `src/cli/invocation-fault-log.mjs:98` — `writer: resolveWriterIdentity(path.dirname(logPath))`, stamps invocation-fault log record.
- `src/state/store.mjs:343`, `:509`, `:752` — `payload.writer = resolveWriterIdentity(dir)`, three event-append stamping sites.
- `bin/fgos.mjs:2540`, `:2562` — `releaseMainCheckoutLockIfOwn(dir, resolveWriterIdentity(dir).id)`, two lock-release self-ownership checks.
- `plugins/fgOS/skills/terminal/rename.sh:31` — `process.stdout.write(String(resolveWriterIdentity().id))`, dynamic-imports it from a shell script for the herdr pane label.
- `test/runner/session-identity.test.mjs` (15 call sites) — direct unit-test exercise of the four-tier fallback.

Plus a wide set of doc/comment citations (specs, decision records, plan
snippets) in `docs/specs/runner.md`, `docs/explanation/*`,
`docs/history/*/CONTEXT.md`/`plan.md`, `docs/how-to/fgos-terminal-pane-
rename.md`, and both `capacity-dispatch-fallback.md` mirrors
(`.claude/skills/_shared/` + `.agents/skills/_shared/`, line 162 in each) —
full list in the dispatched agent's own reply, condensed here to the real
call sites since that's what a caller re-reading this file needs.

### P2 — Node.js `AbortController` cancelling a running `child_process.spawn`

**Finding:** `AbortController`'s `signal` option is passed to `spawn()`,
`exec()`, `execFile()`, and `fork()` via the options object. Calling the
controller's `.abort()` triggers the signal, which terminates the child
process and emits an `AbortError` on the process's error event handler.
The `killSignal` option (default `'SIGTERM'`) controls which OS signal is
sent. Stable since Node.js v15.4.0.

**Source:**
- https://nodejs.org/api/child_process.html (spawn/exec/execFile/fork `signal` option)
- https://nodejs.org/api/globals.html#class-abortcontroller (`AbortController` class, since v15.0.0)

**Open:** none — both branches returned real, citable evidence. No follow-up
question needed for this round.
