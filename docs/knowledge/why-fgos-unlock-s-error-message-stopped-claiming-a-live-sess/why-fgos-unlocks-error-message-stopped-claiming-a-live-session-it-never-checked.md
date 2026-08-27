---
type: explanation
title: Why fgos unlock's error message stopped claiming a live session it never checked
tags: [main-checkout-lock, unlock, string-identity, ttl]
source_capture_ids: [tsk-24t]
framework: diataxis
mode: explanation
---
# Why `fgos unlock`'s error message stopped claiming a live session it never checked

`fgos unlock` refuses to clear a `HELD` main-checkout lock and throws an
error naming the holder. Before this fix, that error always said the
lock was "held by a LIVE session (`<id>`...)" — regardless of what kind
of identity actually held it.

`main-checkout-lock.mjs`'s `tryAcquireOnce` only probes real process
liveness (`isPidAlive`) for a **numeric** holder identity. A **string**
identity — the exact shape `.githooks/pre-commit` writes on every commit
— is judged purely by TTL freshness, by design (D5, fail-closed: no
liveness window exists to probe for a string identity, so freshness is
the only signal available). `unlock`'s old message asserted "live
session" for both cases alike, even though liveness was never checked
for the string-identity branch — a fabrication the code had no basis
for, and exactly the one case where `unlock` is actually needed (the
pre-commit hook's own lock).

## The fix: say what is actually known

The message-only fix branches on `typeof lockResult.holderPid`:
`holderPid` already carries `record.pid` verbatim for both paths in
`main-checkout-lock.mjs`'s shared `return` statement. `number` means
`isPidAlive` genuinely ran, so "a live session (...)" stays accurate.
`string` means liveness was never checked, so the message now reads "an
identity whose liveness cannot be determined (...)" instead.

## What deliberately did not change

`unlock`'s clear-ability behavior is untouched — confirmed directly with
the user before implementing. It still refuses to clear a
string-identity-within-TTL lock exactly as before; only the error text
changed. `main-checkout-lock.mjs`'s own fail-closed design (TTL-only
held-ness for a string identity, no liveness probe possible) was judged
correct and left alone — this item fixed what the operator is told, not
what the lock mechanism does.

## Related

- `docs/history/tsk-24t-unlock-honest-string-identity-message/CONTEXT.md` —
  the full decision record (D1: message-only, behavior unchanged; D2: the
  `typeof holderPid` branch).
- `plans/reports/project-instability-scan-260809-1608-ship-faster-stability-report.md` —
  the scan that surfaced this alongside the other main-checkout-lock and
  merge-safety items from the same sweep.
