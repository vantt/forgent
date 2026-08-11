---
type: explanation
title: Why session-claim liveness measures worktree activity, not PID or event-log age
tags: []
source_capture_ids: [tsk-3ni]
---
# Why session-claim liveness measures worktree activity, not PID or event-log age

`pick`/`take` refused unconditionally (`FsmError('conflict')`, exit 3)
whenever a session tried to claim a `doing` item — with zero regard for
whether the claiming session was still actually working or had gone
quiet. `startupReap` (`src/runner/loop.mjs`) deliberately never reaps a
`human`/`session` claim, only a crashed `runner` claim — a documented,
intentional "indefinite hold" (`docs/specs/work-state.md`'s own Open
Gaps). A quiet, abandoned session/human claim just sat there forever,
with no path back except a person manually investigating and
force-moving the item.

## The real report that started this

> "tsk-2ec can't be claimed here — it's already status: doing under a
> different session... A worktree already exists at
> `.claude/worktrees/tsk-2ec-on2zCD/` — that's almost certainly where
> the other session is working."
> — real item description, `tsk-3ni`

The person hit exactly the manual-investigation workaround this gap
forces: reading the error, checking the worktree, deciding by hand
whether the other session was still real.

## Why the "still alive" signal is worktree activity, not PID or event-log age

Two other signals were considered and rejected:

- **PID/heartbeat-based** — the same shape `main-checkout-lock.mjs`
  already uses for its own liveness check, but same-machine-only, and it
  tracks the wrong resource: a lock file's holder identity, not whether
  work is actually happening in a worktree. A claim can survive its
  original process exiting (a session resuming later) without that being
  abandonment.
- **Event-log age** — cheap, reuses `staleDoingAdvisory`'s existing
  `work.move` idiom, but structurally blind during the exact period that
  matters most: a session actively editing files inside
  `fgos-coding-implement` produces zero `.fgos` events while genuinely
  working. Event-log age would misclassify real, in-progress work as
  quiet.

The chosen signal — `max(git log -1 --format=%ct` on `fgw/<id>`, newest
mtime among files `git status --porcelain` lists in that worktree`)` —
answers the actual question ("is real file activity happening in this
worktree") directly, and for free reuses git's own already-computed
dirty/untracked file list, which already excludes `.gitignore`d paths
like `node_modules` without a separate exclusion list to maintain.

## Why the threshold reuses `/fgOS:stale`'s existing numbers

Rather than inventing a new, more conservative silence threshold, this
feature reuses `/fgOS:stale`'s existing `agentMs: 15min` /
`humanMs: 24h` pair, scoped by the same `claimRole` split that
mechanism already has. A separate, purpose-built threshold was
explicitly rejected — the repo already has one considered answer to
"how long is too quiet for this kind of claimant," and duplicating it
with a second, independently-tuned number would only risk the two
drifting apart with no reason for the difference.

## Why reclaim is transparent, not a new flag

The check runs inside `pick`/`take`'s existing claim-conflict path
itself — the same command a caller already runs, no new flag that says
"also check for staleness." Conclusive silence (the activity signal
clears the threshold) → transparent reattach to the existing
`fgw/<id>` worktree/branch, reusing the already-shipped
`pick-reattach-live-worktree` mechanism rather than destroying and
recreating anything. Anything inconclusive — recent activity, or the
signal simply can't be read (deleted worktree, cross-machine, any other
read failure) — falls through to today's exact refusal, `FsmError
('conflict')`, same exit 3, just with the evidence found appended to the
message for a human reading it.

## Why this mirrors `main-checkout-lock.mjs`'s own precedent deliberately

`main-checkout-lock.mjs` already has this exact two-branch shape:
auto-reclaim on conclusive evidence (`isPidAlive(pid) === false`),
fail-closed (`AMBIGUOUS`) only when evidence is genuinely inconclusive —
never a third "ask a human" branch inside the lock primitive itself.
This feature is a direct structural mirror of that same shape, applied
to a different resource (a work-item claim, not the main-checkout write
lock): conclusive → act silently and log it; inconclusive → refuse
exactly as before. No new "ask" branch was added to `pick`/`take`
either — a human or agent reading the enriched refusal message remains
free to investigate by hand, exactly as `tsk-3ni`'s own originating
report did.

## What stayed explicitly out of scope

- `startupReap`'s runner-only reap policy — untouched; this feature adds
  one conditional door a session walks through deliberately, it doesn't
  repeal the documented "indefinite hold" for `human`/`session` claims.
- The `main-checkout-lock` mechanism itself — a different lock, a
  different resource (the repo checkout, not a work item's claim).
- Cross-machine claim liveness — the activity signal is worktree-local;
  when it can't be read, the claim falls through to today's unconditional
  refusal, not a new degraded-mode branch.

## Related

- `docs/history/session-claim-liveness/CONTEXT.md` — full decision
  record (D1–D5) and scout evidence.
- `docs/history/session-claim-liveness/DISCUSSION.md` — the full
  conversational design record behind the locked decisions.
- `docs/history/pick-reattach-live-worktree/CONTEXT.md` — the reattach
  mechanism this feature reuses rather than rebuilding.
- `docs/explanation/session-isolation-and-concurrency.md` — the
  `tsk-49a` correction this feature's own originating report followed:
  a genuine runner-vs-session claim race was never found in the real
  event log, but the "indefinite hold" gap for quiet human/session claims
  this doc describes was real and is what this feature closes.
