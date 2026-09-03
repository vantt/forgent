---
authoritative_for: merge self-recovery moved into approve, merge-loop/merge-next as thin callers, interactive vs headless self-recovery parity, reconciled with tsk-c5u
---

# Self-recovery moved from `merge-loop` into `approve` itself

`tsk-6av` re-architected where merge self-recovery lives, directly
building on [`tsk-c5u`'s own finding](catchup-self-recovery-shared-reference.md)
that self-recovery playbooks were scattered across skill files and never
reached `approve/SKILL.md` — the skill an interactive session actually
uses to drive a single item's merge.

## The remaining problem after `tsk-c5u`

`tsk-c5u` extracted the self-recovery decision logic into a shared
reference file and pointed `approve` at it — but the merge pipeline was
still passive on failure in a structural sense: `merge-next` stopped and
reported instead of self-recovering even when it could, and `merge-loop`
didn't automatically advance past a blocked item in the pool. Root cause:
the self-recovery decision tree lived in `merge-loop/SKILL.md` and its
own `blocked-pick-decision-tree.md` reference — but `approve` is the
layer that actually *attempts* the merge and hits the block in the first
place (`merge-next` itself only picks a frontier id, then calls
`approve`).

## What shipped

Self-recovery playbooks (`merge-conflict`, `verify-fail-post-merge`,
`verify-timeout-post-merge`) now run **directly inside `approve`**, on
every attempt — before `merge-loop` ever sees a blocked pick at all.
`approve/SKILL.md`'s own park-handling table changed `merge-conflict`
and `verify-fail-post-merge`/`verify-timeout-post-merge` from "no
[self-recovery]" to "yes: run the shared playbook, then retry step 6 —
same two-retries ceiling as every other row." This gives `/fgOS:approve
<id>` (a person merging one item by hand) the exact same self-recovery
capability as running through `merge-loop` — closing the interactive/
headless parity gap directly.

`merge-loop` was correspondingly demoted to a genuinely thin caller: by
the time a blocked pick reaches `merge-loop`, one self-recovery attempt
has *already been spent* inside `approve` — `merge-loop` never re-runs
a playbook itself, only relays whatever `approve` already reported on
failure. Its own carve-out sequence simplified from "envelope carve-outs
→ playbook rules → the named playbooks → the same-id-twice stop rule" to
just "escalate-only carve-outs → the same-id-twice stop rule," since the
playbook-running responsibility moved entirely into `approve`.
`merge-next`'s own existing contract (no id param, pick frontier then
call `approve`) stayed unchanged.

## Landed with real Iron Law evidence

Shipped with its own `docs/history/tsk-6av/iron-law-evidence.md` —
explicitly reconciled with `tsk-c5u`'s own already-landed shared
reference file rather than replacing or duplicating it.
