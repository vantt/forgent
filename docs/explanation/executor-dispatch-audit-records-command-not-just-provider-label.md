---
title: Why executor.dispatch audits record command alongside provider
---

# Why executor.dispatch audits record command alongside provider

## The gap (tsk-33w, tsk-5td D9)

`events.jsonl` is where the question "which provider did my prompt
actually go to?" gets answered. Before this fix it only recorded
`provider`, and `provider` was computed as `executor.provider ??
executor.command` (`src/runner/dispatch.mjs`) — a declared label, not the
observed fact. Configuring `command: "agy"` with `provider: "claude"`
meant `agy` ran for real while the audit trail said `claude` — no error,
no warning, no way to tell from reading the log afterward.

## Why this was a bookkeeping gap, not a security hole

The cross-provider guard (`allowCrossProvider`) was never fooled by this:
it reads `executor.command` directly, and its own code comment already
states the label is "a freely-overridable display alias, not the command
actually spawned." The enforcement decision was sound. What was missing
was the *evidence* of where that decision was applied — the guard checks
`command`, but the audit trail only ever wrote `provider`, so nobody could
cross-check the two after the fact.

## Three shapes considered, why C won

- **(A) Drop the `provider` field, always log `command`.** Fully honest,
  but turns the audit log into raw paths (`/usr/local/bin/agy`) instead of
  a readable label.
- **(B) Keep the label, validate it against a vendor mapping table.**
  Correct and honest, but requires building and maintaining a mapping
  table that doesn't otherwise need to exist.
- **(C) Chosen — keep the label, record both in the audit.** Nothing is
  removed, no table to maintain, and if the label is ever wrong the
  `command` sitting right next to it still tells the truth. Cost: one
  extra field in the payload.

## The fix

Two additive changes, no schema migration:
- `spawnWorker` (`src/runner/dispatch.mjs`) already had `command` in
  scope from `resolveExecutorCommand`'s destructure — it just wasn't
  included in the object it returned. Adding it follows the function's
  own documented principle: additive only, every field it already
  returned stays exactly where it was.
- The `executor.dispatch` event payload (`src/runner/loop.mjs`) gained a
  `command` field alongside the existing `provider`, `model`,
  `baseCommit`, `headRef` fields.

This was safe to do without a migration because `executor.dispatch` is an
audit-only event — `replay.mjs` ignores event types it doesn't recognize
by design, and this event never participates in the FSM view. Old events
without `command` still read fine; new consumers just have to tolerate
the field being absent on historical entries.

## What this doesn't change

- `provider` keeps its old meaning exactly — a freely-settable label. This
  fix doesn't take away the ability to set that label; it just makes sure
  the ground truth sits next to it in the same record.
- The human-readable dispatch log line (`executorId — provider — model`)
  was deliberately left alone rather than always appending `command` —
  the goal was audit-trail truth, not a longer log line for the common
  case where the two already match.
