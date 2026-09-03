---
authoritative_for: catchup-self-recovery.md shared reference, approve/SKILL.md never had self-recovery playbooks, why three prior items each patched only one skill file
---

# Three items each fixed self-recovery in one skill file — none of them shared it

`tsk-c5u` closed a real cross-skill duplication gap: three separate,
independent items (`tsk-60h`, `tsk-4xq`, `tsk-38w`) had each patched
self-recovery/fallback logic into exactly **one** skill file —
`tsk-60h` and `tsk-4xq` both into `plugins/fgOS/skills/merge-loop/
SKILL.md` (merge-conflict, then verify-timeout-post-merge/integration-
drift/merge-failed-unclassified), `tsk-38w` into `.agents/skills/
_shared/executor-dispatch-fallback.md`'s Step B only — and **none of the
three ever touched `plugins/fgOS/skills/approve/SKILL.md`**, the skill an
interactive session actually uses to drive a single item's merge.

## Root cause

No shared reference existed for "when should a session self-run `fgos
catchup` instead of escalating a park to a person" — so each item that
added this behavior had to pick one skill file to patch, and it never
propagated to the others.

## Confirmed live

`tsk-1wdf` (2026-08-20): `approve/SKILL.md` still said verify-fail/
verify-timeout parks should be reported, not retried — and explicitly
listed retrying a verify-fail park as a Red Flag — even though `merge-
loop/SKILL.md` already had self-recovery playbooks for the adjacent
failure reasons. A session driving a single item through `/fgOS:approve`
had no access to recovery logic a `merge-loop` session already had.

## What shipped

A new shared reference file, `catchup-self-recovery.md`
(`.agents/skills/_shared/`, `core/skills/_shared/`, `plugins/fgOS/
skills/_shared/`), mirroring the existing `_shared/fgos-cli-fallback.md`/
`_shared/executor-dispatch-fallback.md` pattern this repo already uses
for exactly this kind of cross-skill duplication. It extracts the
self-recovery decision logic itself: which `CATCHUP_REASONS` values are
eligible, the once-per-id-per-run cap, the `fgos decision` audit-trail
requirement, and the verified-not-blind evidence bar a session must meet
before retrying a verify-fail/verify-timeout park (the same evidence bar
already used for [flake diagnosis like `tsk-2y1`'s
class](spawnworker-idletimeout-flaky-test-margin.md)). `approve/
SKILL.md` and `merge-next/SKILL.md` were pointed at this single file
instead of each carrying its own copy or its own gap — a `merge-loop/
SKILL.md`'s own `blocked-pick-decision-tree.md` reference dropped ~190
lines of now-duplicated logic in favor of the shared file.

## A follow-up reconciliation

A subsequent item (`tsk-6av`) further consolidated this shape —
centering the self-recovery logic in `approve` itself and making `merge-
next`/`merge-loop` thin callers into it — explicitly reconciled with
this item's own shared-file extraction rather than replacing it.
