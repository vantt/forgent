---
authoritative_for: main-checkout.lock "still waiting" poll line labeling self vs. other-session holder identity, and (tsk-6ci) surfacing lock age / remaining TTL / staleness hint in the same poll line
---

# The lock-wait poll line couldn't tell a session its own overlapping call from a stranger's

`tsk-6uc` fixed a real diagnosability gap: `withLockRetry`'s "still
waiting on main-checkout lock" poll line printed a bare holder identity
string with no way to tell whether that holder was the calling session's
own earlier, still-in-flight background call, or a genuinely different
session/pid.

## A real live misdiagnosis, caught only by the user's follow-up

Confirmed live 2026-08-21 during `tsk-1vc`'s own `sync-root` retries: a
driving session fired several overlapping `run_in_background fgos
sync-root` calls against the same item; a later call printed `still
waiting on main-checkout lock (holder pid
f437bb2d-85a2-4bdc-b05d-b222d2f97d53, Ns elapsed)` for 176+ seconds — that
literal string was the calling session's own env-derived writer id,
confirmed only by manually cross-referencing it against every event that
same session had already written in the conversation. In the moment this
was genuinely indistinguishable from a different session's identity
without that manual check, and the session incorrectly concluded in
conversation that "another concurrent session" was actively contending —
caught and corrected only because the user asked pointed follow-up
questions, prompting a re-check of `git log` timestamps that showed the
actual other session's real merges (`tsk-2jz`/`tsk-2lq`) had already
landed and settled well before this retry window even started. The
self-contention was entirely unrelated to that other session.

## The real risk this named

A person or agent debugging a "stuck" lock had no cheap way to tell "this
is my own overlapping call, just wait" from "this is a different session,
consider `fgos-unlock`" — and `fgos-unlock`'s own contract is to refuse
when a different session genuinely still holds the lock live. A session
that wrongly believes a self-held lock is foreign could be tempted to
force past that refusal; conversely (what actually happened here) it can
waste real time chasing a nonexistent external cause.

## Distinct from the adjacent UX-polish item

Related but not the same as `tsk-6ci` (an opaque wait with no ETA or
progress indicator — a UX polish gap). This item is specifically about
holder-identity ambiguity making self- vs. other-session contention
indistinguishable — a diagnosability/safety gap, not a missing progress
bar.

## What shipped

`src/runner/lock-wait.mjs`'s poll line now compares the caught error's
`holderPid` against the calling process's own identity before printing:
numeric `holderPid` compares against `process.pid`; string `holderPid`
(a session id) compares against `resolveWriterIdentity().id`. A plain
qualifier is appended to the existing line — `" — likely your own
session's other in-flight call"` when it matches, `" — a different
pid/session"` when it doesn't — leaving the original identity string
printed either way, just no longer bare and ambiguous.

## A second gap in the same poll line — no ETA, no staleness signal — `tsk-6ci`

Distinct but adjacent gap in the same `withLockRetry` poll line: it
carried no queue position, no ETA, no indication of what the holder was
doing or how much longer the wait might take. Confirmed live on
`tsk-4oq` (2026-08-20): `fgos approve --acknowledge-iron-law` printed 35
of these poll lines (0s, 1s, 2s, 4s, 6s, 8s... up to 64s elapsed) before
finally acquiring the lock — over 65 seconds of pure opaque waiting on a
busy shared dev machine (confirmed via `ps aux` showing several other
concurrent sessions' own `agy`/`dispatch.mjs` processes against the same
main checkout). A person or driving session watching this had no way to
tell whether the wait was nearly over, whether the holder had crashed
and the lock was actually stale (a real category `fgos-unlock` already
handles, but nothing in the poll line hinted at it), or whether to keep
waiting versus investigate.

Fixed by surfacing data the lock-held error already carried (attached
since `tsk-5z2`, just never printed): `err.lockAgeMs` and
`err.remainingTtlMs`, formatted via the existing `formatLockDurationMs`
and appended to the same poll line — `lock age <duration>, remaining TTL
<duration>`. When `remainingTtlMs` reads exactly `0`, the line appends
`" — TTL EXPIRED, may be stale: consider fgos-unlock"` — the plain
"this is likely fine, still waiting" vs. "this may be stale" framing the
item's own description asked for, driven by data already computed
elsewhere rather than a new heuristic.

Related but distinct from [`tsk-2qp`](approve-lock-lost-mid-merge-guard.md)
— a different angle on the same lock: that item's own held span doesn't
cover the full git merge/commit sequence, causing a collision *failure*,
not this opaque-wait *UX* gap.
