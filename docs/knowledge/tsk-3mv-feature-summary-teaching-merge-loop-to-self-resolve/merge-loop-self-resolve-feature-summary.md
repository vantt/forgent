---
type: explanation
title: tsk-3mv feature summary — teaching merge-loop to self-resolve the two block reasons that already had a proven playbook
tags: []
timestamp: 2026-07-30T01:41:23.516Z
source_capture_ids: [tsk-3mv, tsk-3mv-1, tsk-3mv-2]
framework: diataxis
mode: explanation
---
# tsk-3mv feature summary — teaching merge-loop to self-resolve the two block reasons that already had a proven playbook

This is the root-level synthesis for `tsk-3mv`, tying together its two
children (`tsk-3mv-1`, `tsk-3mv-2`) into the one feature they were split
from — per `docs/specs/runner.md` RUL25, a decomposed root's own proposal
represents the whole feature exactly once, so this document does the same
at the doc layer: the two children's own `docs/explanation/` pages each
cover their own half in depth; this page is the one place that explains
why they were split, and what changed as a result.

## What shipped

- **`tsk-3mv-1`** (`src/runner/merge.mjs`): auto-resolves a decision-ID
  collision merge-conflict — two branches independently claiming the same
  next-free decision id — by renumbering the incoming branch's colliding
  file(s) and merging both index rows. Trips Iron Law on its own diff
  (`src/runner/` is a self-modifying-capable module), approved by a real
  human operator with `--acknowledge-iron-law` after the failing-test-first
  proof (`test/runner/merge.test.mjs`) was confirmed.
- **`tsk-3mv-2`** (`plugins/fgOS/skills/merge-loop/SKILL.md`): teaches
  `/fgOS:merge-loop` to walk the existing `verify-fail-post-merge` how-to
  playbook live, once per id per loop run, before counting the block toward
  the existing "same id blocked twice" stop rule.

Both traces to the same locked decisions
(`docs/history/tsk-3mv-merge-loop-self-resolve/CONTEXT.md` D1-D4) and the
same validated plan (`plan.md`, `READY WITH CONSTRAINTS`). Iron Law's own
human-operator requirement (RUL34/RUL37) was never touched, in either
child — a separate item, `tsk-44f` (depends on `tsk-5t3`), was filed
instead of silently folding that question in here.

## A real friction this item surfaced, worth naming honestly

Closing out THIS root item hit a real gap in the manual pull-door
(`fgos take`/`fgos pick` + `fgos return`) when used for a decomposed root:
`fgos discover`'s decompose step releases the root's own claim back to
`todo` once it creates children (so the runner's automated dispatch, which
tracks root ownership separately via `root-affinity.mjs`, can re-claim it
correctly) — but a manual session re-claiming the SAME root later, after
its children have already merged all the real advancement into its branch,
gets a fresh `branchHeadAtTake` equal to the current tip. `fgos return`'s
own precondition (`bin/fgos.mjs`, the `branchAheadCount <= 0` check) then
correctly reports "nothing advanced under this claim" — technically true
for the claim itself, even though the branch as a whole is genuinely far
ahead of where the root started. There is no FSM edge or verb flag that
recognizes "this root's real advancement came from its own children's
approved merges before this claim" as valid evidence. This document's own
commit is what supplies the real, honest advancement this specific claim
needed to satisfy `return` — the underlying gap (a decomposed root closed
out by hand, rather than by the automated runner, has no clean path) is
still real and worth its own item.

A second, related real event during this same close-out: the linked
worktree this session's earlier work was standing on
(`.claude/worktrees/tsk-3mv-WgNzzo`) was found torn down at the filesystem
level (its own `bin/fgos.mjs` and everything but a stray `docs/` directory
gone) sometime after `tsk-3mv-2`'s leaf-branch merge landed, even though
nothing in that merge should have targeted the ROOT's own worktree. No data
was lost — every commit stayed reachable through its branch ref
(`git log fgw/tsk-3mv-1`/`fgw/tsk-3mv-2` from the main checkout) the whole
time — but the checkout itself needed rebuilding via a plain
`git worktree add` against the existing branch to keep working. Real,
reproducible, and not yet root-caused against the specific cleanup call
that did it.

## The real outcomes this synthesis traces to

> `{"id":"tsk-3mv-1","predicted":{"tier":"standard","deps":0,"priorVisits":0,"role":"session","branchHeadAtTake":"8e2afb2867477816e03d698b005b303b4626b0df"},"actual":{"outcome":"awaiting-approval","passed":true,"attempts":1,"errorClass":null,"aheadCount":1}}`
> — real `work.outcome` capture, id `tsk-3mv-1`

> `{"id":"tsk-3mv-2","predicted":{"tier":"standard","deps":0,"priorVisits":0,"role":"session","branchHeadAtTake":"8e2afb2867477816e03d698b005b303b4626b0df"},"actual":{"outcome":"awaiting-approval","passed":true,"attempts":1,"errorClass":null,"aheadCount":1}}`
> — real `work.outcome` capture, id `tsk-3mv-2`

Both children's own `approve` runs re-verified the FULL suite against
`fgw/tsk-3mv` after merging in — `tsk-3mv-1`'s approve (the later of the
two, carrying both children's changes) reported 1711/1716 passing, 0
failing, 5 pre-existing skips.

## Related

- `docs/explanation/merge-auto-resolves-decision-id-collision.md` —
  `tsk-3mv-1`'s own synthesis.
- `docs/explanation/merge-loop-self-diagnoses-verify-fail-post-merge.md` —
  `tsk-3mv-2`'s own synthesis.
- `docs/history/tsk-3mv-merge-loop-self-resolve/CONTEXT.md` and `plan.md` —
  the full locked-decision and shaping record both children executed
  against.
- `docs/specs/runner.md` RUL25/RUL26/RUL27 — the fan-out-parallel rules
  this root's own close-out ran into the edge of.
