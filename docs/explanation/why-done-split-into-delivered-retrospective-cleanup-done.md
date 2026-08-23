---
type: explanation
title: Why a single `done` status split into delivered → retrospective → cleanup → done
tags: [work-item, status, lifecycle, delivered, retrospective, cleanup, done]
timestamp: 2026-08-06T00:00:00.000Z
source_capture_ids: [tsk-1ca]
---

# Why a single `done` status split into delivered → retrospective → cleanup → done

`tsk-1ca` is the item that designed the status chain nearly every other
work-item lifecycle decision in this codebase now assumes exists —
`delivered`/`retrospective`/`cleanup`/`done` as four separate, sequential
statuses, replacing what used to be one terminal `done`. Understanding why
it split three concerns apart explains a lot of otherwise-puzzling
downstream behavior: why dependents can start work before an item's
documentation is written, why a merged item can sit around for days before
disappearing from the tracker, and why `/fgOS:retro-loop` (the skill that
produced this very document) exists as a separate, batched process instead
of running inline at merge time.

## The conflation this replaced

Before this item, `done` was a single terminal status reached through two
doors (`doing->done`, `awaiting-approval->done`), gated by two rules at
once: RUL50 (the item had passed a `compound-learn` *stage* — synthesis
and doc-writing) and RUL58 (acceptance-clause evidence existed). That
bundled three genuinely different concerns into one gate:

1. **Code merged** — the actual work landed on `main`.
2. **Learning synthesized** — the retrospective doc/decision-record work
   now done by `fgos-coding-compounding`.
3. **Worktree reclaimed** — housekeeping, freeing the isolated worktree
   the item's work happened in.

Six consumers (`RUL12`'s dependent-open check chief among them) only
unblocked on that one conflated `done` — so a slow doc-write step delayed
every dependent's ability to start, even after the code itself was safely
merged and verified. That was the concrete, filed complaint (`tsk-4op`)
this item resolves structurally, not by speeding up doc-writing, but by
separating what depends on doc-writing from what doesn't.

## The four statuses, and what each one actually gates

> "`delivered` — code is merged/accepted into main. The new, earlier,
> narrower meaning `done` always informally carried for dependent-opening
> purposes."
>
> "`retrospective` — the (former) `compound-learn` synthesis work..
> reframed as a status, processed in batch by a dedicated loop — never
> inline in `return`/`approve`."
>
> "`cleanup` — a TTL-bounded park state for worktree reclamation..
> deliberately delayed (not synchronous with merge) so a post-merge
> incident can still reuse the worktree."
>
> "`done` — administrative closure only, reached exactly once, after
> `cleanup`'s harness re-verifies the item is genuinely finished."

The chain is strictly sequential — `delivered -> retrospective -> cleanup
-> done` — never parallel branches, because the final gate (`cleanup ->
done`) needs to read "did retrospective actually complete," which
sequential ordering gives for free as a structural precondition rather
than something the final gate has to separately verify.

## Where the two old gates actually moved

The split's most consequential single choice was untangling RUL58
(acceptance-clause correctness evidence) from RUL50 (learning/doc
completeness) — they don't move together:

- **RUL58 gates all three doors into `delivered`** — exactly where it
  effectively gated before (the old `done`), so a dependent opening on
  `delivered` is exactly as protected as it always was. An earlier draft
  of this design had bundled RUL58 with RUL50-content onto `cleanup ->
  done` instead; that was found to open a real gap (dependents could
  start work on acceptance-unverified code, since `cleanup` sits several
  steps after `delivered`) and was explicitly retracted before landing.
- **RUL50-content (renamed to ask "has retrospective+cleanup actually
  completed") gates only `cleanup -> done`** — administrative/learning
  completeness, not code correctness, so it's correct for it to run
  *after* dependents have already opened. That deferral — code
  correctness gates early, documentation completeness gates late — is the
  entire point of the split.

## Why `cleanup`'s TTL delay is deliberate, not laziness

`cleanup` doesn't reclaim the worktree the moment retrospective synthesis
finishes — it waits out a globally-configured TTL first. The reason: a
worktree that's already been torn down can't be reused if a post-merge
incident needs to inspect what actually shipped. The TTL clock itself
anchors to the specific `retrospective -> cleanup` transition event's own
timestamp — mirroring the same discipline `classifyStaleDoing` already
uses elsewhere (`now - claimedAt`, the *specific* claiming event, never
"whatever the latest event of any kind happens to be") — so an unrelated
decision or friction logged against a parked item can never accidentally
reset its cleanup clock.

## The dependent-opens-early tradeoff, and why it isn't a new risk

Letting a dependent start work once its dependency merely reaches
`delivered` (rather than the old, later `done`) sounds like it should
weaken safety. It doesn't, for a specific reason: the thing that actually
protected a dependent before — RUL58's correctness evidence plus the
existing return-time dirty check — still gates at exactly the same
effective point it always did (`delivered` now carries the same meaning
`done` used to, for this purpose). What's new is strictly additive: the
`cleanup -> done` harness re-verifies, at the very end, that the item's
code is *still* genuinely merged on `main` — a check for a post-merge
revert that the old single-`done` design had no equivalent of at all, at
any point. The new design is strictly safer than the old one, never
riskier, despite dependents starting earlier.

## What `retrospective` becoming a status (not a stage) actually retired

The former `compound-learn` *stage* — its entry edge, and the `compound`
verb it hung off of — is retired outright, not layered alongside the new
`retrospective` status. Keeping both would have meant two mechanisms doing
the same reflect-and-learn job along two different axes (`stage` vs.
`status`) at once — accepted as redundant technical debt if it had
shipped that way, so it wasn't shipped that way. `fgos-coding-compounding` (the
skill this very synthesis runs through) now triggers on the `retrospective`
*status*, processed by a dedicated batch loop that scans every `delivered`
item once per invocation — never inline inside `return`/`approve` the way
the old stage-based synthesis was.

## Two places the same underlying set had to expand — and one place it deliberately didn't

`RESOLVED_STATUSES` (the shared constant six different consumers —
`frontier.mjs`'s dep-resolution and lineage checks, `claim-port.mjs`,
`impact.mjs`, `graph-metrics.mjs`, `entropy.mjs` — all read to answer "does
this item still affect code/graph state") expanded from `{done, wontfix}`
to `{delivered, retrospective, cleanup, done, wontfix}` in one shared
place, fixing all six consumers at once — none of them care about anything
past `delivered` for their own purposes.

`fgos rollup` (progress reporting — "k of n children done") deliberately
did **not** get the same expansion. It keeps counting strict `done` only,
on purpose: a progress report answering "how much is *actually* finished"
is a different question than "does this still block dependents," and
conflating the two would make rollup numbers jump the moment something
merges, before its retrospective/cleanup work has actually happened —
exactly the kind of premature-appearance-of-completion this whole item
exists to prevent elsewhere.

## No backfill — old `done` items keep their real (incomplete) history

Work items that were already `done` before this feature existed are not
rewritten to claim they passed through `delivered`/`retrospective`/
`cleanup` — because they never did. This mirrors the precedent set when
the old `compound-learn` *stage* was first introduced: items from before
that stage existed stayed at stage `executing` forever, with no migration
script backfilling a stage-visit that never happened. This is a
deliberately different call than decision `0024` (the `proposed` ->
`awaiting-approval` status rename), which *did* backfill — because that
was a pure relabeling with zero behavior change, while this item adds a
genuinely new required step. Backfilling here would fabricate history that
never actually occurred.

## Outcome

Landed `awaiting-approval`, standard tier, ahead by 38 commits, no friction
recorded — the sixteen locked decisions above (D1-D16) cover the full
design; every implementer-level choice left open (TTL day-count value,
exact CLI verb names, a `worktreeBacked` domain-registry field, retry
idempotency for the retrospective loop) was explicitly deferred to
planning rather than decided here, and each surfaced again as its own real
child work later — including the very `/fgOS:retro-loop`/`/fgOS:retro-next`
skills this synthesis document was produced through
(`docs/explanation/fgos-retro-loop-and-the-restored-compound-verb.md`,
`tsk-3o3`).

## The implementation drifted from D7/D8 in two places — a real, evidenced bug, not a design flaw

`tsk-1q1` found and confirmed, against real event-log data rather than
assumption, that the shipped `cleanup` implementation diverged from what
D7/D8 above actually locked — a restore-to-decision item, not a redesign.

**Drift 1 — the TTL got folded into D8's harness checks, when D7 placed it
outside them.** D7's own wording is explicit that the two are joined by
*AND*, not merged into one check list: "run only after TTL elapses AND the
`cleanup->done` harness (D8) passes." D8 locks exactly two checks —
code still genuinely merged on `main`, and retrospective actually produced
real content — neither of which is the TTL. The shipped code
(`assessCleanupReadiness`, `src/state/cleanup-harness.mjs`) folded all
three conditions into one `reasons` array, so any TTL-not-yet-elapsed item
parks `cleanup -> blocked` exactly like a genuine D8 check failure would.
Real evidence from `.fgos/events.jsonl`: six `cleanup -> blocked` events in
the entire log, six-for-six caused by the TTL condition, zero caused by an
actual D8 check failing — and every one of the six is still sitting
`blocked` today, none ever recovered. This is precisely the "silent stuck
state" D8's own text says must never happen. The mechanical consequence
compounds the damage: `blocked` isn't in the resolved-tail set (D13
above), so an item whose code is genuinely merged on `main` gets pulled
backward from resolved to unresolved the moment this mispark happens —
`statusCategory` flips back to `in-progress`, dependents that assumed the
code was safely in stop being told the truth, and `cleanup-pool.mjs`'s own
picker only ever looks for `status: cleanup`, so a misparked item is never
picked up again by anything.

**Drift 2 — the very thing `cleanup`'s delay exists to protect was already
being torn down early.** The pinned meaning of `cleanup` above is explicit:
delay is deliberate, "so a post-merge incident can still reuse the
worktree." In the real shipped code, `cleanupMergedBranch` deletes the
git branch at merge time, not at cleanup time, and the worktree checkout
itself is normally already torn down even earlier, by the runner at
propose-time. Measured directly against the live store: 0 of 55 items
currently sitting at status `cleanup` still have a worktree; 1 of 55 still
has a branch — and that one branch belongs to the sole item that would
fail D8's own merge-check anyway. For the one domain actually running
production work today (`coding`), the `cleanup` stage's whole reason for
existing — protecting a reusable worktree during the delay — was running
on nothing to protect.

Both drifts were confirmed, not assumed, against real data before being
treated as bugs — the discipline `docs/decisions/0025`'s Ship Faster
priority and this repo's own review norms both require: quoting the
locked decision's exact wording, then counting real events in the log
rather than trusting that shipped code matches what was designed. A third
option — adding a new `blocked -> cleanup` recovery edge for the six stuck
items — was considered and rejected: under the design as actually locked,
`cleanup -> blocked` should only ever fire on a genuine D8 failure, which
either needs rework (`-> todo`/`doing`) or abandonment (`-> wontfix`) —
there is no legitimate "wrongly parked" case for a correctly-implemented
harness to produce, so a recovery edge would just be papering over Drift
1 instead of fixing it. Once Drift 1 is fixed, the six items stuck today
recover through the ordinary mechanical `blocked -> delivered` retry edge
D2 already provides for exactly this shape of problem — no new edge
needed. The fix itself split into two dependent child items: separate the
TTL check out of D8's harness first, then move the worktree/branch
teardown timing back to actually happening at `cleanup`.

Drift 1's own fix (`tsk-4jf`, the first of the two dependent children)
lives at the verb, not the caller — deliberately. `cleanup-pool.mjs`'s own
picker had already tried filtering TTL-not-elapsed items out at the
*caller* (`tsk-dvc`), but that attempt demonstrably failed in practice:
three of the six real misparks happened *after* that caller-side guard
had already shipped, arriving through a different call path the guard
didn't cover. `assessCleanupReadiness` (`src/state/cleanup-harness.mjs`)
now returns two separate groups instead of one flat `reasons` array —
`notReadyYet` (TTL not yet elapsed — a genuine no-op, never a park) and
`failed` (an actual D8 check failing — still parks `cleanup -> blocked`,
unchanged). The `cleanup` verb case in `bin/fgos.mjs` only parks on
`failed` being non-empty; a `notReadyYet`-only result leaves the item
sitting quietly at `cleanup`, no `moveWork` call at all. `cleanup-pool.mjs`'s
own TTL pre-filter stays in place afterward — it's no longer load-bearing
for correctness (the verb itself is now safe to call early), but it's
still a real scheduling optimization, avoiding calling a verb already
known to no-op — and the code comments were updated to say so explicitly,
so a future reader doesn't mistake the leftover filter for the guard it
used to be. The one-door-write principle (CTR001) generalizes cleanly from
this: a true/false condition that matters for correctness belongs inside
the one write door every caller shares, never bolted onto just one
caller's own approach path.

Drift 2's own fix (`tsk-1p9`, the second child, deliberately ordered
*after* `tsk-4jf`) removes `cleanupMergedBranch`'s call from the merge path
entirely (`src/runner/merge.mjs`, invoked today at merge time via
`bin/fgos.mjs`) and leaves branch/worktree teardown to the `cleanup` verb
itself, once its harness actually passes — matching D7's wording exactly
instead of approximately. The dependency direction is load-bearing, not
incidental: both fixes touch the same `cleanup` case in `bin/fgos.mjs`
(overlapping footprint), and as long as Drift 1 remains unfixed, the TTL
condition parks nearly every item `blocked` before the verb ever reaches
its own teardown logic — making Drift 2's own change nearly impossible to
verify in isolation while Drift 1 still stands. Fixing the two drifts in
this order (decouple TTL first, then move teardown timing) is what makes
each one independently testable, rather than a preference for smaller
diffs.

## The chain's real blind spot: nothing detects an item forgotten mid-chain, because nothing needs to

Every downstream mechanism this split touches was deliberately made to
stop caring about an item the moment it reaches `delivered` — that's the
entire point (see "Two places the same underlying set had to expand"
above: `RESOLVED_STATUSES` opens dependents immediately, never waiting for
`retrospective`/`cleanup` to finish). The dependent-opens-early design
being correct has a side effect nobody had designed for: since nothing
downstream needs an item to leave `delivered`/`retrospective`/`cleanup`
promptly, nothing was watching whether it actually did. `/fgOS:retro-loop`
and `/fgOS:cleanup-loop` run entirely by hand — this repo has no
cron/scheduler at all (confirmed: no crontab file, no scheduler wiring in
`package.json`) — so an item that reaches `delivered` and then nobody
happens to run a sweep on just sits there, invisible to every existing
advisory surface: `classifyStaleDoing` only covers `status:doing`,
`staleBlocked` only covers `todo`/`blocked`, and `frontier()` never even
looks at `delivered`/`retrospective`/`cleanup` items at all (by D15's own
design, above).

`tsk-1bl` closed that blind spot with a new pure classifier,
`classifyStalePostDelivery` (`src/state/graph-metrics.mjs`), mirroring
`classifyStaleDoing`'s exact shape — read-only, no transitions, anchored
to the *specific* transition event that entered each status rather than
"whatever event happened most recently" (the same discipline D7 already
locked for `cleanup`'s own TTL clock, reused here rather than re-derived).
The three thresholds, confirmed directly by the person rather than
proposed by the session:

1. **`delivered`**: stale after 3 days sitting there un-swept, anchored to
   the specific `doing->delivered`/`awaiting-approval->delivered`/
   `blocked->delivered` event.
2. **`cleanup`**: stale after `ttlDays + 3` days — the TTL grace period
   added on top, so an item still legitimately waiting out its own TTL is
   never falsely flagged; only genuinely forgotten-past-TTL items are.
3. **`retrospective`**: stale after 3 days, same threshold as `delivered`,
   anchored to the `delivered->retrospective` sweep event.

This is a **detection**-only tool, explicitly not a trigger: "not a single
thing here auto-advances anything" — the thresholds exist so a person (or
a future sweep) can *see* what's been forgotten, matching the fact that
nothing in this repo auto-runs `/fgOS:retro-loop`/`/fgOS:cleanup-loop`
today.

## A tempting simplification — merging the two loops — was explicitly rejected, twice

Before landing on the detection-only classifier, the item's own
investigation considered folding `fgos-coding-driving`'s execution loop
together with `retro-next`/`cleanup-next` into one unified sweep. Two
separate advisor-review rounds rejected that, each with concrete evidence
rather than a general preference:

> "Đã xác nhận điều phối 2 trục (stage/status) qua shared-state là ĐÚNG
> THIẾT KẾ, không phải lỗ hổng... Vì vậy không có ai downstream chờ cho
> chuỗi status cả — 2 loop (fgos-coding-driving vs retro-next/cleanup-next)
> KHÔNG được gộp (đã thử và bị từ chối bằng 5 bằng chứng cụ thể)."

The five concrete blockers: the `awaiting-approval` boundary can't be
crossed by a unified loop without breaking the approval gate; there's no
existing handler that drives straight from a `status` value to a `stage`
value; `fgos retrospective` sweeps the *entire* repo in one call, not one
item at a time, which a unified per-item loop can't reproduce without
reversing D9 with no new evidence to justify it; the `cleanup` TTL is not
a no-op to skip past — treating it as one would wrongly park items
`blocked`; and worktree/cwd context doesn't cross the merge boundary
cleanly. Each blocker traces to a design choice already locked earlier in
this same document (D9's batch-loop separation, D7's TTL, D3/D4's early
dependent-open) — the rejection wasn't a new judgment call, it was
confirming those earlier locks still held under a proposal that would have
undone them.

## The domain-agnostic guarantee (D5) got its own regression-proving child task

`tsk-3b3`, a child of `tsk-1ca` scoped to verification only, confirmed D5's
domain-agnostic claim held in the real, built code — that
`delivered`/`retrospective`/`cleanup`/`done` behave identically for the
throwaway `synthetic` domain (single stage, zero worktree, zero
stage-transitions) as they do for `coding`, with domain-awareness living
only in the harness/skill layer rather than the FSM table itself. Verified
with the plain full regression suite (`npm test`) rather than a narrower
targeted check, matching the task's own scope — proving nothing broke
across the whole implementation, not proving one isolated behavior.
Landed `awaiting-approval`, first attempt, ahead by 1 commit, no friction
recorded.

---

**Source:** `docs/history/work-item-status-delivered-retrospective-cleanup/CONTEXT.md`
(tsk-1ca, D1-D16); work-item capture via `fgos check tsk-1ca`.
