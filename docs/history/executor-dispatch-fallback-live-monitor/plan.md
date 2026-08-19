# plan.md — tsk-37ij: Step B live-visibility fix

Mode: tiny (0 flags — single prose edit to one shared fragment file, no
gray areas, `RESEARCH.md` round 1 already resolved both open points).

## Approach

Single piece, no split. File touched (existing, edited):
`plugins/fgOS/skills/_shared/executor-dispatch-fallback.md` (Step B only,
`RESEARCH.md` round 1 confirmed it is the only real copy).

Impact-analysis capability gate: not applicable — prose edit to a skill
fragment, not a code symbol GitNexus indexes.

Risk map: light. Only risk is getting the Monitor invocation technically
wrong — mitigated by `RESEARCH.md` round 1's direct read of the Monitor
tool's own schema/doc (not guessed) and this session's own two live
verified runs of the underlying dispatch call this session already did
(tsk-52z, tsk-1ep).

## Shape

Replace Step B's body (the `dispatch.mjs execute` bash block and its
surrounding prose) to instruct: run the `execute` invocation through the
**Monitor** tool directly, as Monitor's own `command`, with `2>&1`
appended (Monitor's event stream is stdout-only, and `dispatch.mjs`'s own
live tee writes to stderr — `RESEARCH.md` round 1), instead of a plain
synchronous Bash call. Explain *why*: the live tee already exists
(`dispatch.mjs:2154`, tsk-129) but a synchronous Bash call never relays it
to a human watching the session — this is the real, intended relay
channel for a live agent session, not a new mechanism and not a
workaround. Read the final JSON result once Monitor reports the command
exited, same as before this change (`mechanism`/`status`/`stdout`/
`stderr`/... fields unchanged). Keep the existing "error → Step C"
fallback rule, extended to cover a Monitor timeout the same way as a
`RunnerConfigError`/spawn failure.

## Concrete cases

- A short-lived executor call (seconds) — Monitor's live per-line
  notifications and its final exit-code report both still apply; no
  special-casing needed for "too fast to matter".
- A call that never produces output before its own timeout (a hung
  executor) — covered by the existing "error → Step C" fallback, now
  explicitly extended to a Monitor timeout too.

## Split decision

No split. One honest piece of work — pass-through.

## Outstanding questions

None
