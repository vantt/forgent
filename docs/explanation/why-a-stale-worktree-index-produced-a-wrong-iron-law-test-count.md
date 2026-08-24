---
type: explanation
title: Why a stale worktree index produced a wrong Iron Law test count
tags: [iron-law, evidence, worktree, addendum]
source_capture_ids: [tsk-5x4]
authoritative_for: why the tsk-51m root Iron Law evidence file recorded a test count lower than any of its own children, and why the fix is an addendum rather than an edit
---
# Why a stale worktree index produced a wrong Iron Law test count

Found in a post-batch audit of `tsk-51m` (2026-08-13), from two
evidence-doc-accuracy findings grouped together because both are
`docs/history`-only corrections, touching no `src/`.

## Finding 1: a root's evidence file reported fewer tests than any single child

`docs/history/merge-conductor-throughput-and-human-release/iron-law-evidence-tsk-51m-root.md`
claimed `npm test` against `fgw/tsk-51m`'s real HEAD — "the root's own
post-merge tree containing all 5 children" — produced 2985 tests. But
every one of the five children's own evidence files reported *more*:
`tsk-55p` 2991, `tsk-2ypd` 3003, `tsk-xyr` 3017, `tsk-4ax` 3029 (each
confirmed directly by grep). A tree that genuinely contains all five
children cannot have fewer tests than any one child measured alone — the
math is impossible on its face.

**Root cause, traced to a real commit**: `254f61e9` ("fix: restore
content accidentally reverted by a stale worktree index in the previous
commit") had already diagnosed the mechanism. The commit before it
(`docs(tsk-51m): record root-level Iron Law evidence`) ran from worktree
`tsk-51m-wSxZpU`, whose index/working tree was stale — that commit
unintentionally reverted 405 lines of `bin/fgos.mjs` plus 2838 lines
across 20 files back to before the five children existed. The 2985 test
count in the evidence file was measured against that stale, reverted
tree — not the real tree that actually landed. `254f61e9` fixed the code
revert, but no addendum ever corrected the now-wrong test count sitting
in the evidence file itself.

**Fix**: append an addendum to the evidence file — never edit the
original historical record — with a fresh `npm test` run against the
real current `main`, the corrected count, and an explanation of why the
original number was wrong.

## Finding 2: a stored verify string stopped being verbatim-reproducible

`tsk-60h`'s stored `verify` field (visible via `fgos show tsk-60h`)
greps for the literal string `"catchup playbook already attempted"` in
`plugins/fgOS/skills/merge-loop/SKILL.md`. That exact string no longer
exists — `tsk-4xq`'s later rewrite (see
`docs/how-to/self-resolve-verify-timeout-integration-drift-and-unclassified-merge-failures.md`)
consolidated the 4b rule down to `"playbook already attempted"`, dropping
the `catchup` prefix. The underlying behavior is unchanged (semantics
preserved, consolidated for DRY) — only the exact string stopped
matching.

Notably, `tsk-60h`'s own `plan.md` risk map had *predicted* exactly this
collision ("text overlap with `tsk-4xq`") and called for a re-verify
after that later merge — a step that had simply never happened.

**Fix, and why it is scoped this narrowly**: `tsk-60h`'s stored `verify`
field is never edited — it is a `delivered`, immutable historical record.
Instead, a note is added to `docs/history/tsk-60h-merge-conflict-catchup-playbook/plan.md`
recording the drift with concrete evidence (the line, the commit), so a
future reader does not mistake the stored string for something still
verbatim-reproducible today.

## The shared lesson

Both findings share the same shape: a historical evidence record is a
point-in-time snapshot, and later, unrelated changes (a stale-index
revert, a later text consolidation) can silently invalidate a number or
a string inside it without anyone noticing, because nothing re-checks an
already-`delivered` evidence file against the present state of the
world. The fix pattern in both cases is the same — append an addendum
with the correction and its evidence, never rewrite the original record
— preserving the historical record's own integrity while keeping a
future reader from trusting a number or string that quietly stopped
being true.
