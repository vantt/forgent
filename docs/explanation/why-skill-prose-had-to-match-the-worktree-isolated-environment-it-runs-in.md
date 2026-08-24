---
type: explanation
title: Why skill prose had to match the worktree-isolated environment it runs in
tags: [worktree, isolation-guard, approve, pick, main-checkout]
source_capture_ids: [tsk-3rg]
authoritative_for: why fgos-coding-driving's pick-through-approve skills instruct leaving the worktree before approve, and why they call the fgos shell wrapper instead of a compound root=$(...) command
---
# Why skill prose had to match the worktree-isolated environment it runs in

`tsk-3rg`. Two friction points on the `pick -> implement -> approve`
path, both traced to the same root cause: skill prose describing an
environment different from the one the skill actually runs in. Both
observed live in the same real session (`tsk-224`, 2026-08-13).

## Friction 1: `approve` refuses to run from where `pick` just put the session

`/fgOS:pick` stands up a worktree and enters it — that is the whole
point of the claim step. But `fgos approve` refuses outright when run
from inside one: `"refusing to run from ... this is a git worktree, not
the repository main working tree. Run approve from the main checkout."`
`pick/SKILL.md`'s own step 6 only said the review gate (`fgos
review`/`approve`/`reject`) "is theirs to run next" — it never said a
session first has to leave the worktree it was just placed into.

Observed directly: after `return` completed and a person approved the
merge, the first `approve` call failed immediately; only running
`ExitWorktree` with `action: "keep"`, then calling `approve` from the
main checkout, actually worked.

**Fix**: `pick/SKILL.md` step 6 now says explicitly that `approve` must
run from the main checkout, naming the exit step
(`ExitWorktree`/`action: "keep"`, then `fgos approve` from the main
checkout) — the same sequence this session had to discover by trial.

## Friction 2: the harness's own worktree-isolation guard refuses the exact command shape four skills prescribed

Four skill files — `fgos-coding-implement`, `fgos-coding-planning`,
`fgos-coding-validating`, `fgos-coding-exploring` — all wrote the same
template: `root=$(git rev-parse --path-format=absolute --git-common-dir
| xargs dirname)` followed by `node "$root/bin/fgos.mjs" ... --dir
"$root"`. Run from inside a worktree-isolated session — exactly where
these skills are meant to run — the harness's own isolation guard
refuses it: `"this command is too complex to verify that it stays inside
the worktree; break it into plain, separate commands."`

The guard itself is a harness feature fgOS cannot change. What fgOS
*can* change is the template prose it ships: split into separate plain
commands, or route through an already-resolved absolute path, so the
prescribed pattern actually runs in the exact environment it was written
for.

**Whether to consolidate into one shared helper** (rather than repeating
the pattern across four files) was left open, to be worked out during
`fgos-coding-exploring`'s own pass on this item — not decided at capture
time.

## Why both frictions share one root cause

Both are the same failure shape: skill prose that describes an ideal or
assumed environment instead of the real one a worktree-isolated session
actually operates in. Neither friction was a logic bug — `approve`'s
main-checkout requirement and the isolation guard's own refusal are both
intentional, correct behavior. The fix in both cases was making the
*prose* accurate to the constraints that were already real, rather than
changing any underlying mechanism.

## Scope boundary: related items, deliberately not merged in

Two related findings from the same investigation were explicitly kept
separate, with no dependency attached: `tsk-1y0` (a per-session
worktree-isolation flag for fan-out, a different mechanism-level
question) and `tsk-5zg` (`approve` crashing with a raw git fatal error —
see `docs/explanation/why-createdetachedmergeworktree-crashed-for-session-driven-roots.md`).
Both are real, but neither is the same "prose doesn't match environment"
class this item fixes.
