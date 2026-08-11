# CONTEXT: unlock's honest string-identity message

Item: `tsk-24t`. Feature boundary: `bin/fgos.mjs`'s `unlock` case's
`HELD`-status error message stops claiming "live session" for a lock it
never actually checked liveness on. Nothing else in this item's scope.

## Locked decisions

**D1 — Message-only fix; `unlock`'s clear-ability behavior is unchanged.**
Per RESEARCH.md: user confirmed (asked directly) that `unlock` keeps
refusing to clear a string-identity-within-TTL lock, exactly as today —
only the error text changes. `main-checkout-lock.mjs`'s own D5 fail-closed
design (TTL-only held-ness for a string identity, no liveness probe
possible) is correct and untouched.

**D2 — Branch on `typeof lockResult.holderPid`, no new field, no change
to `main-checkout-lock.mjs`.** `holderPid` already carries `record.pid`
verbatim for both the numeric-pid and string-identity `HELD` paths
(`main-checkout-lock.mjs`'s shared `return` statement) — `number` means
`isPidAlive` genuinely ran (today's "live session" wording stays
accurate), `string` means liveness was never checked (the message must
say so honestly instead).

## Scout evidence

- `bin/fgos.mjs:4062-4089` (`unlock` case) — read in full.
- `src/runner/main-checkout-lock.mjs:190-260` (`tryAcquireOnce`, both
  branches) — read in full, cited in RESEARCH.md.

## Canonical references

- `plans/reports/project-instability-scan-260809-1608-ship-faster-stability-report.md`

## Outstanding questions

None
