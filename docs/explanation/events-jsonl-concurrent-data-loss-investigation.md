---
authoritative_for: events.jsonl concurrent multi-session data-loss investigation, force-checkout/reset truncation gap, D1 detect-and-warn guard, D2 periodic auto-commit cadence
---

# A critical, real events.jsonl data-loss pattern — investigated, root-caused, and scoped for a fix

`tsk-24e` is the investigation and design-decision item for a real,
repeatedly-confirmed class of data loss on the shared main checkout's
`.fgos/events.jsonl`. It shipped as a thin pass-through — locking the
root cause and the fix's shape (D1/D2 below) — and deferred the actual
implementation to a follow-up item, `tsk-1ji`.

## The evidence: not a one-off

Three prior fixes (`tsk-1q5`, `tsk-3wq`, `tsk-2tm`) had already closed
three real race classes on this file. Fresh live evidence recorded
directly on this item (2026-08-20) showed data loss continuing to happen
**after** those fixes had landed, across four separate items in the same
session:

- **`tsk-6al`**: present in a full `fgos list --json` at ~15:50 (title,
  status, stage, description all intact); by ~16:15, `fgos list --id`,
  `fgos list --all --id`, and `fgos show` all reported "work not found,"
  and `grep -c tsk-6al .fgos/events.jsonl` on the live 22169-line file
  returned 0 — genuinely absent, including its exact title text under
  any id. `check-events-seq-contiguity.mjs` reported the file as
  perfectly contiguous — no detectable corruption by that check alone.
- **`tsk-4oq`**: its entire event history (roughly 15-20+ events over
  about an hour: pick, discover, plan, gate-approve, multiple decision/
  handoff calls, report, return, approve) vanished with zero trace,
  minutes after `fgos approve` had confirmed it delivered. The
  underlying git commit was safely on `main` — only the `.fgos` event/
  state record was lost, not the code. The direction ruled out a simple
  "whole file reverted to an older snapshot" theory: `tsk-4oq`'s events
  (chronologically earlier) vanished while `tsk-24e`'s own creation
  event (chronologically later, same session) survived intact —
  consistent with a selective loss of one item's mid-file event span,
  not a wholesale rollback.
- **`tsk-5dnt`**: a ~9-event mid-session span (seq ~22182-22201, ~15
  minutes) vanished between two of the same session's own consecutive
  `fgos` calls, confirmed by comparing each call's own real-time
  incrementing `seq` against a later fresh read reverted to pre-session
  state. Events immediately before and after that seq window, including
  other concurrent sessions' own writes, were both present and intact —
  the same selective-span pattern as `tsk-4oq`.
- **`tsk-1el`**: `fgos return` reported real success (`seq:22207`,
  `passed:true`) but the write never landed durably — a fresh read
  minutes later showed the item reverted to its pre-call state. At the
  moment of discovery, `fgos lock-status` showed a stale lock (8m37s
  old, zero remaining TTL) held by a *different* session's identity,
  overlapping the exact window the `return` call ran in — a candidate
  lead correlating the loss window with a stale main-checkout lock from
  a concurrent session, though this correlation was explicitly noted as
  unconfirmed, not treated as the root cause.

## Root cause traced by discovery research

Nothing in the codebase ever ran a real `git commit` on
`.fgos/events.jsonl` automatically — confirmed by grepping every
`src/runner/*.mjs` hit for `git.*commit` and reading each one (the word
"commit" in `claim-port.mjs` refers to `moveWork`'s state event, not a
git commit). The file sits uncommitted for long stretches on the shared
main checkout, exposed to a concurrent session's raw `git reset --hard`/
`git checkout -f` — a vector the existing `union` merge driver
(`tsk-3wq`) does not cover, since it only fires on merge-class git
operations, never on checkout/reset.

## Two locked decisions (D1, D2) — implementation deferred to `tsk-1ji`

**D1 — detect-and-warn, never block.** Blocking was considered and
rejected: no clean git-native pre-reset/pre-checkout-force hook exists
without real plumbing risk, and a false-positive block would refuse a
person's own legitimate recovery operation — a worse failure mode than
the data loss it prevents. Matches this repo's existing
`events-jsonl-contiguous` doctor-check precedent (detect + `fgos doctor
--fix`, never refuses an operation).

**D2 — time-based periodic auto-commit**, not per-verb-call (real `git
commit` overhead on every mutating call across many concurrent
sessions, plus log/blame noise) and not checkpoint-only (reproduces the
exact gap already observed — a long stage sits uncommitted for its
whole duration). Time-based periodic directly bounds the quantity that
actually matters: the wall-clock exposure window.

The guard scope is explicitly narrow: only raw `git reset --hard`/
`checkout -f`/`checkout --force` on the shared main checkout — ordinary
`git checkout <branch>` is out of scope since git already refuses that
itself when it would silently discard uncommitted tracked changes. The
exact commit interval and trigger mechanism were left as implementation
choices for `fgos-coding-planning`.

## What actually shipped, and where

The real code — an opportunistic truncation guard
(`src/state/events-jsonl-truncation-guard.mjs`, an external gitignored
high-water-mark sidecar: last-line `seq` + content hash, immune to a
truncate-then-reappend that would otherwise look perfectly contiguous)
plus the D2 periodic fallback auto-commit — landed in the deferred
follow-up item `tsk-1ji`, not in this item. That implementation has
itself evolved further since (its module header now cites a later
successor, `tsk-cgg`) — this item's own scope stops at the investigation
and the two locked design decisions.
