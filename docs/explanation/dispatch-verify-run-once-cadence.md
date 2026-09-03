---
authoritative_for: worker verify-cadence rule ("run once, near the end"), agy/gemini repeated-verify behavior, root cause not fully confirmed, A/B test still open
---

# Verify should run once, near the end — a textual gap closed, root cause not fully confirmed

`tsk-2ky` closed a real, observed inefficiency: during `tsk-4bq`'s own
out-of-process Implement dispatch (`agy`/`gemini-3.6-flash-medium`), the
worker re-ran the item's full `npm test` verify command **at least 6
separate times** mid-run instead of once near the end — roughly 5-6x the
real verify cost for one item, and enough Monitor tee flooding to matter
on its own (fixed separately).

## Two candidate root causes, neither ruled out with certainty

1. **A textual gap.** `worker-prompt-skill-pointer.txt`'s own "Expected
   proof" text framed verify as something "the runner runs itself after
   you finish" — implying a runner-owned check, not something the worker
   must run. `coding-worker-contract.md`'s own Layer 2 rule 2 said the
   opposite ("run it yourself") without ever saying *how often* or *when*
   — leaving room for a provider to read "the runner will check anyway"
   as license to self-check cheaply and often instead of once and
   confidently.
2. **Provider/model natural behavior.** Re-verifying after every small
   edit could simply be how `agy`/`gemini-3.6-flash-medium` behaves absent
   an explicit cadence constraint — a normal, even reasonable, agentic
   habit on its own.

Discovery deliberately did not guess between these — checking the
existing `pi` (`tsk-47r`) and `claude` (`tsk-1dsr`) proof-test transcripts
found **neither confirms nor contradicts** the repeated-verify behavior:
both prior proof-tests used deliberately trivial verify commands (`true`,
`test -f <file>`) for a different purpose (proving contract compliance,
not cadence) — a cheap check re-run several times would have been
invisible in both. The absence of cadence evidence in prior proof-tests
is itself a real, evidenced finding, not a gap to paper over.

## What shipped

`coding-worker-contract.md`'s Layer 2 rule 2 now states the cadence
explicitly: "Run it once, near the end, when you believe the work is
actually done — never as a per-edit habit." A textual fix, not a
mechanical one — there's no way to enforce cadence at the process level
against an executor's own internal reasoning.

## A genuinely self-referential data point

This item's own Implement step was itself dispatched out-of-process to
the exact same provider/model combination (`agy`/`gemini-3.6-flash-
medium`) that originally misbehaved on `tsk-4bq`. The worker's own
`stdout` shows **three** separate background verify launches before
landing — smaller than `tsk-4bq`'s 6x (a smaller change), but the same
pattern. **This is not a clean A/B result**: the cadence rule this item
was adding did not exist yet at the *start* of that same dispatch — the
worker was creating the very sentence as its own deliverable. It cannot
be read as "the new rule fails to change behavior." What it *does*
support: `agy`/`gemini-3.6-flash-medium` has a real, recurring tendency to
self-verify multiple times absent a stated constraint — mild evidence for
root-cause candidate 2, without ruling out candidate 1 (the now-closed
textual gap).

## What's still open

A true A/B test — same provider, a fresh item whose `coding-worker-
contract.md` already carries the new cadence sentence *before* dispatch
starts — is the only way to confirm whether this fix actually changes
`agy`/`gemini`'s behavior. Named here as a real follow-up, not yet run,
and not spawned as a new backlog item by this synthesis (that call
belongs to whoever picks it up next, with the same discipline this item
used: real evidence, not a guess).
