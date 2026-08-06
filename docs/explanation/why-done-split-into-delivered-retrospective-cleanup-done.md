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
   now done by `fgos-compounding`.
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
shipped that way, so it wasn't shipped that way. `fgos-compounding` (the
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

---

**Source:** `docs/history/work-item-status-delivered-retrospective-cleanup/CONTEXT.md`
(tsk-1ca, D1-D16); work-item capture via `fgos check tsk-1ca`.
