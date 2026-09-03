---
type: how-to
title: How to avoid a hung `verify` command on `fgos return`/`approve`/`catchup`
tags: []
timestamp: 2026-07-30T06:11:02.926Z
source_capture_ids: [tsk-3vo]
framework: diataxis
mode: how-to
---
# How to avoid a hung `verify` command on `fgos return`/`approve`/`catchup`

Use this when you need `fgos return`, `fgos approve`, or `fgos catchup` to
never freeze the calling session on a hung `verify` command — or when you
specifically need one of them to run an unbounded `verify` on purpose.

## Before you start

- Applies to `fgos return`, `fgos approve`, and `fgos catchup` — every verb
  that re-runs the item's own `verify` command via the shared `runGoalCheck`
  primitive.
- `runGoalCheck` only arms a kill timer when it is given a `timeoutMs`
  value; given none, it lets the spawned `verify` command run forever.

## The default behavior (as of this change)

Omitting `--timeout` entirely no longer means unbounded. It now falls back
to the runner config's own `timeoutMs` — the same value and the same
`runGoalCheck` call the runner loop itself already uses. That config lives
at `.fgos/config.json`'s `runner` section (tsk-5vf; the sole config source
since tsk-5hv D1 retired the legacy fallback). If it doesn't set one yet,
`ensureRunnerConfigForDir` bootstraps the default (`900000`, 15 minutes)
the first time any of these verbs runs.

```
fgos return <id>
fgos approve <id>
fgos catchup <id>
```

Each of these now kills a `verify` command that outlives the configured
timeout, moving the item to `blocked` (`reason: verify-fail`) with a
defined, diagnosable outcome instead of freezing the session.

## Steps

1. **Pick an explicit timeout for one call**, overriding the config
   fallback:

   ```
   fgos return <id> --timeout 60000
   ```

2. **Opt into a genuinely unbounded `verify`** when you know it needs to
   run long (e.g. a first-time dependency install baked into your verify
   command) — this is now the *only* way to get the old unbounded
   behavior:

   ```
   fgos return <id> --no-timeout
   ```

3. **Never combine `--timeout` and `--no-timeout`** on the same call — the
   two are mutually exclusive and the verb rejects both outright rather
   than silently picking one:

   ```
   fgos return <id> --timeout 60000 --no-timeout
   # fgos: return: --timeout and --no-timeout are mutually exclusive -- pass at most one.
   ```

## Why this exists

Before this change, `return`/`approve`/`catchup` only ever set `timeoutMs`
from an explicit `--timeout` flag — omitting it left `verify` unbounded,
silently diverging from the runner loop's own `runGoalCheck` call (which
always passes `config.timeoutMs`). Skill-driven callers (`/fgOS:return`,
`/fgOS:cook`, `/fgOS:pick`) never pass `--timeout`, so a `verify` command
that hangs — a test runner stuck in watch mode, a command waiting on
stdin, a stuck network call — could freeze the calling session
indefinitely with no diagnosis. For `return` specifically, the
main-checkout lock is only released after `runGoalCheck` resolves, so a
hung verify also held the lock until its TTL expired, opening a window for
another writer to act while the stuck verify was technically still
"running."

## Real example

Item `tsk-3vo` (this change itself) proved the fix with a real hung-verify
scenario: a runner config with a 200ms `timeoutMs`, and a
`verify` command that busy-waits 1.5s before exiting.

> `"return omitting --timeout falls back to the runner config's timeoutMs,
> blocking a verify that outlives it"` — checked out against the commit
> just before this fix landed, the same test genuinely failed:
> `AssertionError: the 200ms fallback timeout should have killed the 1.5s
> verify — actual 'awaiting-approval' - expected 'blocked'` (the old code
> ran the 1.5s verify to completion instead of killing it at 200ms).

With the fix in place, the same scenario resolves cleanly:

> real `check`/outcome capture, id `tsk-3vo`:
> `{"outcome":"awaiting-approval","passed":true,"attempts":1,"errorClass":null,"aheadCount":3}`
> — `return` on `tsk-3vo`'s own (fast) `verify: npm test` closed clean once
> the fallback-timeout logic was implemented and its own dedicated test
> suite passed.

## Follow-up (`tsk-53o`): a killed timeout looks identical to a real verify failure

The fix above ensures a hung `verify` actually gets killed instead of
freezing the session — but `tsk-53o` found that once the kill fires, the
*result* it reports is indistinguishable from a genuine test failure.
`runGoalCheck` (`src/runner/goal-check.mjs`) knows internally whether the
process was killed by the timeout (`timedOut`), but never surfaces that
fact to its caller — the caller only ever receives `{passed: false,
status: null}`, the exact same shape a spawn failure already produces.
No caller anywhere in the codebase can tell "the verify command actually
ran and failed" apart from "the machine was just too busy to finish in
time."

**Real repro, not hypothetical**: `tsk-puz` (2026-08-07) hit this live.
`fgos return` reported `{to: "blocked", passed: false, exitStatus:
null}` with truncated output and no failing-test line anywhere in it.
Running the exact same `npm test` by hand immediately afterward, on the
identical tree: `2600/2600` passed, in 199s — genuinely green. The root
cause: `.fgos-runner.json`'s default `timeoutMs` (900000ms / 15 minutes)
was being silently exceeded because roughly 15 concurrent Claude
sessions were competing for machine resources at the time — nothing
about the test suite itself was broken.

**The real cost of this ambiguity**: every time it happens, the only
available recovery is re-claiming the item (`blocked` → `doing`) and
running `fgos return` again — another full `npm test` cycle
(161-370s observed), spent entirely re-proving something that was
already true. A timeout kill and a real failure both currently cost the
same recovery cycle, even though only one of them actually needs a code
fix.

**Fix direction locked, without breaking the existing contract**: a new
field (e.g. `timedOut: true`) surfaces the real fact out of
`runGoalCheck`, while `passed`/`status`/`output` keep their exact
existing meanings — this repo's own convention treats this contract as
load-bearing, and every caller currently depends on `runGoalCheck`
*resolving*, never rejecting/throwing. Each real call site (`bin/fgos.mjs`'s
`return`/`approve`, `src/runner/merge.mjs`, `src/runner/loop.mjs`) then
gets to decide what a timeout should mean for its own park state — a
timeout is neither proof an item is broken nor proof it's fine, so it
should never silently become `passed: true` (that would weaken the
check itself), but it can carry its own distinct reason when parking, so
a person reads "this timed out, try again" instead of a truncated
test-output that reads like a real failure.

**Explicitly rejected fixes**, named to close off the easy-looking wrong
answers: raising the default `timeoutMs` (papers over the symptom rather
than fixing the ambiguity — an even slower machine would just hit the
same wall at a higher number), letting a timeout pass through as
`passed: true` (weakens the check for everyone, defeats its purpose),
and changing `runGoalCheck` to reject/throw on timeout instead of
resolving (breaks the contract every existing caller already depends on).

## Related

- `fgos check <id>` — the outcome/friction history a `blocked` verdict
  (from either a real verify failure or a timeout kill) shows up in.
- `docs/how-to/diagnose-a-blocked-return-from-an-unrelated-verify-failure.md`
  — what to do once a `return` reports `blocked`, whether from a real
  failure or a timeout.
