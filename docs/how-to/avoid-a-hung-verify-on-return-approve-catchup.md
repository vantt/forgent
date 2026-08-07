---
type: how-to
title: How to avoid a hung `verify` command on `fgos return`/`approve`/`catchup`
tags: []
timestamp: 2026-07-30T06:11:02.926Z
source_capture_ids: [tsk-3vo]
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

## Related

- `fgos check <id>` — the outcome/friction history a `blocked` verdict
  (from either a real verify failure or a timeout kill) shows up in.
- `docs/how-to/diagnose-a-blocked-return-from-an-unrelated-verify-failure.md`
  — what to do once a `return` reports `blocked`, whether from a real
  failure or a timeout.
