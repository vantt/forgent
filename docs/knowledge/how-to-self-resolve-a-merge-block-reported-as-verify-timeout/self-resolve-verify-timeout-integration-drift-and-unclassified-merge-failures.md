---
type: how-to
title: Self-resolve verify-timeout, integration-drift, and unclassified merge failures
tags: [merge, catchup, playbook, verify-timeout, integration-drift]
source_capture_ids: [tsk-4xq]
authoritative_for: how to self-resolve a merge block reported as verify-timeout-post-merge, integration-drift, or merge-failed-unclassified, and what the narrowed same-id-twice stop rule now covers
framework: diataxis
mode: how-to
---
# Self-resolve verify-timeout, integration-drift, and unclassified merge failures

Part of the Merge Conductor design (`tsk-51m`, §H —
`docs/history/merge-conductor-throughput-and-human-release/`). Before
this item, `bin/fgos.mjs:3814`'s six `CATCHUP_REASONS` had real
self-resolve playbooks for only two — `verify-fail-post-merge` and
`merge-blocked-other-item`. This item wrote the remaining three, leaving
only Iron Law, a real merge conflict that survives catchup, and a real
verify failure that survives catchup as genuine person-shaped stops.

Every playbook below already runs automatically, inline, inside `approve`
— before `/fgOS:merge-next`/`/fgOS:merge-loop` ever see a blocked result.
This doc is for reading the signal and knowing what already happened, not
for running the playbook by hand.

## `verify-timeout-post-merge`

**Signal**: `{picked: <id>, approve: {blocked, reason:
"verify-timeout-post-merge"}}` with `timedOut: true` on the same
envelope. `fgos check <id>`'s friction detail reads "goal-check timed
out on staged merge ... after `<ms>`ms — not a verify failure; merge
aborted, `<target>` unchanged, rerun catchup", and its `errorClass` is
`verify-timeout`, never `verify-miss` — the distinguishing signal from an
actual failing test.

Since the merge was aborted and the target ref never moved, this is
inherently safe to retry: rerun `fgos catchup <id>` once, with a longer
timeout if the prior one was clearly too tight for the suite's real
duration. A second timeout escalates to a person — this is exactly the
narrowed same-id-twice stop rule below.

## `integration-drift`

**Signal**: `{picked: <id>, approve: {blocked, reason:
"integration-drift"}}` — produced only for a root that already has
children merging into `trunk`, on either a conflict or a non-timeout
verify failure. Tell the two flavours apart via the friction
`errorClass`: `merge-conflict` vs `verify-miss`.

Before this playbook runs at all, confirm the root has actually gathered
every child — no open descendants remain. If any child is still open,
this is never this playbook's case to run; it escalates unconditionally,
same as the Iron Law does. That carve-out exists so a root is never
force-synced to `main` while it is still incomplete (the same "root
without all its children never lands partially" invariant D1 in
`docs/explanation/why-merge-was-a-single-lane-funnel-under-a-16-lane-dispatch-pipeline.md`'s
own source item locks).

## `merge-failed-unclassified`

**Signal**: `{picked: <id>, approve: {blocked, reason:
"merge-failed-unclassified"}}` — `git merge --no-commit --no-ff` exited
non-zero without ever staging a real conflict. Stderr is carried in the
friction detail; read it before assuming this is safe to retry, since an
unclassified git failure can have causes a real conflict/timeout playbook
would never see (a dirty working tree, a detached-HEAD mismatch, and
similar git-level preconditions).

## What stays a real person-shaped stop

Three cases never run a playbook, by design, regardless of how many
attempts remain:

- **Iron Law** — a self-modifying diff needing human-verified
  failing-test-first proof. This was never in scope to automate and
  stays untouched by this item.
- **A real merge conflict that survives catchup** — the dedicated
  `merge-conflict` playbook (`tsk-60h`,
  `docs/how-to/recover-from-a-merge-loop-merge-conflict-block-by-running-fgos-catchup.md`)
  already tried first; what reaches a person here already failed that
  attempt.
- **A real verify failure that survives catchup** — same shape, for
  `verify-fail-post-merge`.

## The narrowed same-id-twice stop rule

Before this item, `merge-loop`'s stuck-twice stop rule fired on *any*
repeated block reason for the same id, indiscriminately — a
`verify-timeout-post-merge` and an Iron Law block were treated the same
way even though only one of them could ever self-resolve. The rule now
applies only to a reason that genuinely has no playbook: once a playbook
exists for a reason, retrying it is the playbook's own job (each playbook
above defines its own single-retry-then-escalate shape), and the loop's
generic same-id-twice rule stops competing with it. A successful merge
for any id resets both the blocked-id tracking and any in-flight playbook
attempt; the run's accumulated Iron Law list is the one thing a
successful merge never resets, since those still need a person regardless
of what else the loop does afterward.

## Leaving a real trail, not a silent auto-resolve

Every playbook records its own decision through the existing `fgos
decision` mechanism rather than resolving silently — the acceptance risk
named at design time was a playbook running too eagerly and hiding a real
failure behind an apparent auto-fix. A reader auditing a merge later can
always find, per id, which playbook ran, what evidence it checked, and
whether it retried or escalated.
