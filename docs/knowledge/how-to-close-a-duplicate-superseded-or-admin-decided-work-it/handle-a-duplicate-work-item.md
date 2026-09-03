---
type: how-to
title: How to close a duplicate, superseded, or admin-decided work item
tags: []
timestamp: 2026-07-29T11:06:51.870Z
source_capture_ids: [tsk-1ua]
framework: diataxis
mode: how-to
---
# How to close a duplicate, superseded, or admin-decided work item

Use this when a work item is genuinely done arguing about — a duplicate of
another item, a bug whose precondition got eliminated by unrelated work, or
something a person simply decided not to build — and needs an honest closed
state, not a `blocked` park that never resolves.

## Before this existed

There was no honest terminal status for this. The only reachable park was
`blocked`, which structurally means "stuck, unresolved" and has no forward
edge to `done`. Two real cases surfaced the gap:

- `tsk-4fu-1` (investigating an old `events.jsonl` truncation) was
  superseded by `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md`
  eliminating its own precondition — `createWorktree` now deletes `.fgos/`
  outright on every worktree creation, so the bug can no longer reproduce.
  It was parked at `blocked` with the reason in its decision log, since
  forcing it through `proposed→done` would have falsely claimed a verify
  pass on work that was never built.
- `tsk-5h4`'s own repro: closing `tsk-2ib` as a duplicate of `tsk-3yl` via
  `fgos compound tsk-2ib --doc-type how-to --doc-path
  docs/how-to/handle-a-duplicate-work-item.md` failed outright, because the
  only path to `done` requires stage `compound-learn`, reachable only via
  `executing` — no lightweight closure edge existed for an item that needed
  no real code/decompose/execute work at all.

Both symptoms shared one root cause: `hasOpenDescendant`
(`src/state/frontier.mjs`) treats any non-`done` status, including a
permanently-parked `blocked`, as "open" — so a permanently-blocked child
anchors its parent out of the frontier forever too, with no way out for
either item.

## Steps

1. **Confirm the item is genuinely closed, not just stuck.** `wontfix` is
   for "not going to be built" (superseded, duplicate, admin decision) —
   not for "temporarily stuck," which stays `blocked`.

2. **Close it through the existing generic `move` verb** — no dedicated
   `fgos wontfix` command was added; `move` already accepts any FSM-legal
   target status:

   ```bash
   fgos move <id> --to wontfix --reason "duplicate of <other-id>"
   ```

   This works from exactly three statuses — `blocked`, `todo`, or `doing`
   — mirroring how `awaiting-human` already enters from both `todo` and
   `doing`, plus `blocked`. It covers both trigger cases above: an item
   already parked in `blocked` when closed (like `tsk-4fu-1`), and an item
   closed directly from `clarify` (`todo`/`doing`) before ever being
   blocked (like the `tsk-5h4`/`tsk-2ib` case).

3. **Record the closure reason in the decision log**, the same convention
   `blocked` reasons already use — `--reason` is accepted but not
   mechanically enforced (unlike `proposed→todo`/`proposed→blocked`, which
   do require one):

   ```bash
   fgos decision <id> --text "closed as wontfix: duplicate of <other-id>"
   ```

4. **Nothing further to do.** `wontfix` is fully terminal — no exit edge,
   symmetric with `done`. A wrongly-closed item is revived by filing a new
   item that references the old one (the existing `refs` field), not by
   reopening this edge. It also does not go through `compound-learn`'s
   synthesis gate — an item closed without being built has nothing to
   synthesize; the closure reasoning already lives in the decision log from
   step 3.

## Why the parent unblocks too

`hasOpenDescendant` now treats `wontfix` as resolved, the same as `done`
(`src/state/frontier.mjs`, tested in `test/state/frontier.test.mjs`: *"a
root with two children is released once the open one reaches 'wontfix' (not
just 'done')"*). A parent item with a `wontfix` child and every other child
`done` is back in the frontier — it no longer sits permanently excluded the
way a `blocked` child used to leave it.

## Real example

Building this exact feature (`tsk-1ua`) hit the FSM's own gate on itself:
the engine's `decompose`→`executing` judgment initially parked the item at
`awaiting-human` because its `risk` was `heavy`:

> `"ask": "Đề xuất: không chia (pass-through) — Item gốc có risk cao (heavy)
> — cần xác nhận trước khi chia."`
> — real `work.move` event, `tsk-1ua`, 2026-07-29

A human confirmed the no-split shape (`fgos answer tsk-1ua --text
"Confirmed: no split, proceed pass-through..."`), and the item proceeded
through `fsm.mjs`, `work.mjs`, and `frontier.mjs` changes, landing in
commit `f3424e6` on `fgw/tsk-1ua`, verified by the full suite:

> `1664 pass, 0 fail, 5 skipped` — real `npm test` output via `fgos return
> tsk-1ua`, 2026-07-29

## Related

- `docs/history/fsm-wontfix-terminal-status/CONTEXT.md` — the locked
  product decisions (D1-D5: why a new status instead of reinterpreting
  `blocked`, the `wontfix` name, its three entry edges, its terminality,
  and why `compound-learn` doesn't apply to it).
- `docs/history/fsm-wontfix-terminal-status/plan.md` — the implementation
  shape and risk map.
- `docs/specs/work-state.md` Data Dictionary row #4 — the full status
  domain reference, including `wontfix`'s formal edge list.
