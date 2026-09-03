---
type: how-to
title: How to recover from a merge-loop merge-conflict block by running fgos catchup
tags: [merge-loop, merge-next, catchup, merge-conflict]
source_capture_ids: [tsk-60h]
authoritative_for: merge-loop and merge-next self-run fgos catchup on a merge-conflict block reason instead of parking to ask a person
framework: diataxis
mode: how-to
---
# How to recover from a merge-loop `merge-conflict` block by running `fgos catchup`

Use this when `/fgOS:merge-next` (or the `/fgOS:merge-loop` it runs
inside) reports a blocked pick shaped like:

```json
{"picked": "<id>", "approve": {"blocked": true, "reason": "merge-conflict"}}
```

— a post-merge `git merge --no-commit --no-ff` staged a real textual
conflict, the merge was rolled back, and the target branch is unchanged.

## Why this doesn't ask a person first

Before `tsk-60h`, this exact block reason went straight to a person: `fgos
catchup` already existed and already handled `merge-conflict` (it was
already in `CATCHUP_REASONS`), but no skill prose ever pointed a
merge-loop iteration at it. The gap was purely behavioral, not
mechanical — the agent was good at resolving merge conflicts, but the
loop's own prose said to stop and ask regardless. This is one of the two
named choke points blocking the "release con người" priority
(AGENTS.md's product priority #2): a person having to sit and answer a
question the agent could have resolved itself.

## The steps

1. **Run `fgos catchup <id>`**, forwarding whichever of `--timeout <ms>` /
   `--no-timeout` the caller was given. `catchup` resolves its own repo
   root from `--dir`, so it runs correctly from any directory — never
   leave or enter a worktree first to make it work. Internally it merges
   the item's own target branch back into the item's own branch inside an
   ephemeral worktree, re-runs the item's own `verify` there, and on green
   takes the `blocked -> awaiting-approval` edge itself.

2. **Read the returned `outcome` and act on exactly that:**
   - `"merged"` or `"already-caught-up"` — green; the item is back at
     `awaiting-approval`. Log the decision, continue the loop, which
     picks it up normally on a later iteration.
   - `"conflict"` — a real content conflict survived the automated
     reconciliation, with `conflictedFiles` naming exactly which. Stop.
     Report the id, target branch, and file list — this is the case a
     human's own content judgment is needed for.
   - `"verify-fail"` with `timedOut: false` — a real red verify on the
     reconciled tree. Stop. Report the id and the failing lines from
     `output`.
   - `"verify-fail"` with `timedOut: true` — timed out. Stop, same as any
     other `catchup` timeout.
   - The command itself errors (a real CLI failure, not a reported
     outcome) — stop and report the error verbatim; never retry it.

3. **Try at most once per id per loop run.** A second attempt on the same
   id in the same run falls to the ordinary same-id-twice stop rule
   instead of trying `catchup` again.

## Why this can't silently paper over a real problem

`catchup` fail-closes: both `outcome: "conflict"` and `outcome:
"verify-fail"` leave the item exactly as `blocked` — neither ever calls
the underlying move that would advance it. A playbook run that turns out
to be unnecessary can waste a cycle, but it cannot land anything broken,
because `catchup` runs the item's own `verify` on the staged merge and
aborts the merge on red, before ever committing. The stop-and-ask-a-human
door for a genuine conflict is never removed — it just moves to *after*
one automated attempt has already been made, instead of *before* any
attempt at all.

## What this deliberately doesn't do

- **`merge-next` does not run its own `catchup` retry.** Only
  `merge-loop` runs the playbook, because it is the one place holding the
  "already attempted once this run" state; two independent retry sites
  would desync that bookkeeping. A single-shot `/fgOS:merge-next` call
  (outside a loop) instead just names the door — `fgos catchup <id>` — so
  a person or a script can run it directly without asking anyone.
- **It never hand-resolves the conflicting hunks itself.** A genuine
  conflict, after the one automated attempt, is reserved for a person's
  real content judgment — the same boundary `tsk-18a` D1 already drew
  ("a genuine conflict needs a human's real content resolution").
- **It never patches `fgos catchup` to auto-reconcile.** The gap this
  item closed was always skill behavior, not the underlying verb;
  `bin/fgos.mjs`'s own conflict-abort logic was left untouched.

## Where this playbook actually lives today

The merge-conflict playbook, and its four siblings
(`verify-fail-post-merge`, `verify-timeout-post-merge`,
`integration-drift`, `merge-failed-unclassified`), now live together in
`plugins/fgOS/skills/merge-loop/references/blocked-pick-decision-tree.md`
— a later refactor (`tsk-4xq`) pulled the whole blocked-pick decision
tree out of `merge-loop/SKILL.md`'s own step 4 and generalized the shared
"read `fgos catchup`'s outcome" rule across every playbook that uses it,
rather than repeating it per playbook.

## Related

- `docs/how-to/recover-a-blocked-item-with-fgos-catchup-from-inside-its-own-worktree.md`
  — the underlying `fgos catchup` recipe this playbook wraps
- `docs/how-to/recover-a-blocked-merge-conflict-when-catchup-cannot-reconcile-it.md`
  — the opposite direction: what to do when `catchup` itself can't
  reconcile a conflict
- `docs/how-to/diagnose-a-verify-fail-post-merge-block-on-approve.md` —
  the sibling playbook for a genuinely red post-merge verify
