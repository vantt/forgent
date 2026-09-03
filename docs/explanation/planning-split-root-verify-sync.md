---
authoritative_for: fgos-coding-planning syncing a real verify onto a split decompose-root item, discovery placeholder exit-127 on fgos sync-root goal-check
---

# A split root item's own `verify` field had no sync step — `fgos sync-root` ran a placeholder as a shell command

`tsk-13g` closed a real three-way gap: `fgos-coding-planning`'s
verify-sync step covered a pass-through item and covered split
*children* (the normalizer already forces a real verify onto each at
creation time) — but never the split **root** item itself.

## Confirmed live on `tsk-1vc` (2026-08-21)

After all 3 children of `tsk-1vc` merged into the root's own branch,
`fgos sync-root tsk-1vc` failed with a confusing `merge-failed-unclassified`
outcome. Direct reproduction (calling `mergeRunnerItem` against a safe
throwaway worktree) found the real cause: `tsk-1vc`'s own `verify` field
was still the discovery-stage placeholder text `"chưa xác định — bổ sung
thủ công"`, and `mergeRunnerItem`'s goal-check executed it literally as a
shell command — `/bin/sh: 1: chưa: not found`, exit 127.

## The gap in the existing verify-sync docs

`fgos-coding-planning`'s own `verify-sync-and-gap.md` explicitly scoped
its sync step to "a pass-through (non-split) item only," and said split
children need no such step since the normalizer already handles them at
creation. That left the split root itself uncovered — still carrying
whatever placeholder `discovery` left behind. An informal precedent
already existed in this same repo (`tsk-3ik`, another decompose root,
using `node --test 'test/**/*.test.mjs'` as its own verify), suggesting
the convention was already understood but undocumented and unenforced —
so most decompose roots likely still carried the raw placeholder silently
until someone tried `sync-root` on them.

## What shipped

A new section in `verify-sync-and-gap.md` (mirrored across all 4 skill
copies: `.agents/`, `domains/coding/skills/`, `.claude/skills/`,
`plugins/fgOS/skills/`), wired into `fgos-coding-planning`'s own
`SKILL.md` Step 4 (the split decision): once a real split is decided,
check the root item's own current `verify` against the same
discovery-stage placeholder constants the pass-through check already
uses. If it's still a placeholder, sync it to `npm test` —
`fgos edit "<item-id>" --verify "npm test"` — before handing off to
`fgos-coding-validating`. A whole-suite command is the honest choice
here specifically because a root item has no single piece-specific proof
surface of its own; its correctness question is "does everything merged
still pass." If the item already carries a real, distinct verify (the
`tsk-3ik` case), the sync does nothing — never overwrites a value already
set deliberately.

Four cases explicitly enumerated to hold: a split root with a placeholder
(gets synced), a split root already real (untouched), a pass-through item
(untouched, already covered by the existing section — the same gap
`tsk-14a` had already fixed for that case), and a split child (untouched,
the normalizer's job, not this item's gap).

## Not a duplicate

Related to, not the same root cause as, the `events-jsonl-lost-update-race`
doc's own `tsk-2xt` story — same exit-127 signature (a placeholder text
executed literally as shell), but a different code path and a different
verify-sync gap.
