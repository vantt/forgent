---
authoritative_for: dispatch execute unsignaled outcome, [DONE]/[BLOCKED] signal detection, headBefore/headAfter forensics shortcut
---

# `dispatch execute` now flags a worker that never signaled `[DONE]`/`[BLOCKED]`

`tsk-4oq` closed a real gap: `[DONE]`/`[BLOCKED]` was a documented worker
contract with **zero code enforcement** — the entire repo had exactly one
mention of both tokens together, and it was a comment
(`src/setup/registrations.mjs:1091`), not an actual check.

## Confirmed live, three separate times

1. Dispatching `fgos-coding-implement` out-of-process for `tsk-3av` via
   `agy`: worker exit code 1, empty stdout, stderr only `"Error: timeout
   waiting for response"` — no `[DONE]`/`[BLOCKED]` anywhere. `git log`
   showed the worker had actually committed real work before crashing at
   the reporting step. The driver had to do manual forensics (`git log`/
   `git show --stat`/re-running `npm test`) to tell "lost work" apart
   from "crashed while reporting, work is fine" — no cheaper way existed.
2. A second occurrence with the same shape.
3. Dispatching for `tsk-vuj` via `agy`: two consecutive `"Error: timeout
   waiting for response"` failures, `HEAD` unchanged both times but the
   working tree already correctly edited on disk — required manually
   running `git status`/`git diff`/diffing across 4 mirror files to
   confirm correctness before trusting it. This occurrence also
   confirmed a root cause candidate: this repo's `npm test` runs ~5-6
   minutes, longer than `agy`'s own response timeout — tracked as its own
   separate item (dispatch executor timeout shorter than `npm test`
   runtime), not fixed here.

## What shipped

`dispatch.mjs execute`'s own return-shape build now scans the worker's
stdout tail for `[DONE]`/`[BLOCKED]`. When neither is present, the
returned object gains `outcome: 'unsignaled'` plus `headBefore`/
`headAfter` — the git `HEAD` sha captured immediately before and after
the dispatch. This turns "did the worker actually make progress before
crashing at the reporting step?" from a three-command manual forensics
routine into a one-glance check: if `headBefore !== headAfter`, real
commits landed despite the missing signal.

**Deliberately not a hard failure.** `unsignaled` is a flag, never an
error the caller must treat as failure — a worker crashing *after*
committing real work is a legitimate, recoverable outcome that still
needs a person or driver to confirm, not something to auto-fail.

**Scope kept narrow on purpose.** The fix touches only
`dispatch.mjs execute`'s own return-shape construction — it does not tie
into the Iron Law / verify / `return` pipeline, which is a separate
concern left untouched. Verified additive and safe before landing: no
other code in `src/` was reading an `outcome` field on this return shape,
so adding it broke no existing consumer.
