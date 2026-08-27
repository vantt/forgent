---
type: how-to
title: How to respond when fgos doctor reports a shared events.jsonl truncation
tags: []
timestamp: 2026-08-11T00:00:00.000Z
source_capture_ids: []
framework: diataxis
mode: how-to
---
# How to respond when `fgos doctor` reports a shared `.fgos/events.jsonl` truncation

Use this when `fgos doctor` (as part of `npm test && node bin/fgos.mjs
doctor`, or run standalone) fails the `events-jsonl-not-truncated` check,
reporting a `content-mismatch`, `regressed`, or `log-emptied` break.

## Why this is different from a merge-conflict break

`docs/how-to/resolve-an-events-jsonl-merge-conflict.md` covers a *merge*
leaving duplicate/gapped `seq` values — recoverable, because both sides of
the conflict still exist somewhere in the merge and can be reconciled.

A truncation break means an ordinary git operation on the main
checkout — `git stash`, `git checkout --`, `git reset --hard`, `git
clean` — reverted the live, shared `.fgos/events.jsonl` to an older
committed state while `fgos` verbs kept appending on top of it. The events
that existed between the old committed tip and the true live tip are
**already gone** by the time the check catches this — there is no merge
side, no stash entry, no reflog to recover them from (this is exactly what
happened in the real incident this check exists to catch:
`docs/history/events-jsonl-git-tracked-truncation/CONTEXT.md`). This
runbook is about **safely acknowledging and moving forward**, not
recovery — there is nothing to recover.

## Steps

1. **Confirm it's real, not a false alarm.** Read the check's own message —
   it names the reason (`regressed`, `mark-seq-missing`, `content-mismatch`,
   or `log-emptied`) and the `seq` position where the mark stopped
   matching. A `content-mismatch` at a specific `seq` means: whatever event
   used to be recorded there is not what's there now.

2. **Do not try to restore the lost events.** By construction, if the
   working file already diverged from every committed snapshot and every
   stash before the guard caught it, there is no copy left anywhere in git
   to recover from (`git log`, `git stash list`, `git reflog` — none of
   them retain a state that was never committed or stashed while intact).
   Treat the gap as a permanent, acknowledged loss of *tracking* events —
   the guard's job is to make sure this is never silent again, not to make
   it reversible.

3. **Re-baseline the guard's own mark**, once you have looked at and
   understood the break — this is a deliberate, human-run step, never an
   automatic `doctor --fix` (this check has no registered fix: silently
   auto-repairing would erase the loud signal before anyone saw it,
   defeating the reason this check exists). There used to be a sibling
   `events-jsonl-contiguous` doctor check/fix pair that did auto-fix its
   own class of residue (duplicate/gapped `seq` after a union-merge); that
   check was retired by `tsk-3tp` along with the `.gitattributes`
   `merge=union` entry it protected and the underlying script
   (`scripts/events-jsonl-contiguity.mjs`), once `.fgos/events.jsonl`
   became a frozen baseline and `seq` stopped being cross-writer identity
   (see `docs/explanation/events-jsonl-lost-update-race-under-concurrent-
   session-writes.md`). It is no longer part of `fgos doctor`'s registry —
   this truncation-guard check remains the only one in this area, and it
   still has no fix:

   ```bash
   node scripts/events-jsonl-truncation-guard.mjs --force-rebaseline-all .fgos .fgos/runtime/events-jsonl.truncation-guard.json
   ```

   This advances the mark to the log's current tip. `fgos doctor` will
   pass again on the next run — the break is acknowledged, not hidden;
   nothing about the break itself is deleted or rewritten.

4. **Find and fix the actual git habit that caused it**, so it doesn't
   recur. The known cause (confirmed via fingerprint matching in
   `docs/history/events-jsonl-git-tracked-truncation/RESEARCH.md`) is
   running `git stash`/`git checkout --`/`git reset --hard`/`git clean`
   directly on the shared main checkout while `.fgos/events.jsonl` has
   live, uncommitted appends — any of those silently reverts a tracked
   file to HEAD. Prefer `fgos main-checkout-reset --sha <sha> [--confirm]`
   over a raw `git reset --hard` on the main checkout (per `AGENTS.md`),
   and avoid `git stash` on the main checkout entirely when you can commit
   or set the change aside another way instead.

## Related

- `docs/how-to/resolve-an-events-jsonl-merge-conflict.md` — the sibling
  runbook for a *merge*-caused break (recoverable, different mechanism).
- `src/state/events-jsonl-truncation-guard.mjs` — the check this runbook
  responds to; its own header documents the detection mechanism in full.
- `docs/history/events-jsonl-git-tracked-truncation/` — the investigation,
  locked decisions, and plan behind this check and this runbook.
