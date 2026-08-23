# plan.md — tsk-4te: partial claim-event loss vs. tsk-1vc's shipped fix

Mode: tiny

Flag count: 0 of the counted flags (auth, authorization, data model,
audit/security, external systems, public contracts, cross-platform,
existing covered behavior, weak proof around the area, multi-domain)
apply — this plan touches no source file and proposes no new mechanism;
it only names the existing regression proof and records the closing
rationale. No hard-gate flag (auth, data loss, audit/security, external
provider, removing a validation) applies either: the "data loss" concept
in this item's own title is the bug being confirmed-fixed, not a change
this plan makes to a data model.

`fgos graph --json`: tsk-4te's own connected component
(`{tsk-56u, tsk-1vc, tsk-4te, tsk-1i3, tsk-1vc-1, tsk-1vc-2, tsk-1vc-3}`)
sits outside the graph's global `criticalPath` (`tsk-4vo → ... →
tsk-19y-1`, depth 10); `topUnblock` came back empty (skipped this run,
same as observed on tsk-1vc's own plan.md). Nothing depends on tsk-4te
(`deps` scan over `fgos list --all --json` found zero items listing it),
so this item's ordering is not urgency-driven — closing it promptly is
about hygiene (an already-fixed bug still open in the backlog), not
unblocking other work.

Impact-analysis posture: `full` (GitNexus present per `fgos tool query
--capability impact-analysis --status present`) — not leaned on for a
proof point here, since this plan makes no code change to blast-radius
against; recorded per the gate's own instruction to note posture
regardless.

## Approach

**Chosen path:** close as a duplicate root-cause, verify-only. tsk-4te's
own discovery pass (`docs/history/tsk-4te-partial-claim-event-loss/
RESEARCH.md`, Round 1) already established, on real evidence, that:

- tsk-4te's dependency `tsk-1vc` (D-cite: tsk-1vc is `status: delivered`,
  `mergedSha 998abfa0...`, and that sha is a confirmed git ancestor of
  tsk-4te's own `branchHeadAtTake`) shipped the fix for the root-cause
  class tsk-4te reports — a claim's `work.move` event silently vanishing
  from the shared main-checkout event log under concurrent activity.
- The fix is proven, not just shipped: `test/runner/concurrent-claim-
  eventlog-loss.test.mjs`'s `'runs genuinely concurrent fgos claim calls
  across real OS processes with a barrier'` test forks real concurrent
  claim calls (the same code path `tsk-4dk-2`'s incident hit) and asserts
  every one's `work.move` event survives, 0 gaps/0 duplicates. Confirmed
  green on `main` as of this discovery round.
- The "no error at the time it happens" cost tsk-4te's own description
  names is also closed: `tsk-1vc-3` (delivered) surfaces the guard's
  warning log to a live session/`fgos doctor`, so a future recurrence
  would no longer be silent.

No new implementation is evidenced as necessary. The one open question
this plan does NOT need to resolve (per RESEARCH.md's own "still open"
list — whether tsk-4dk-2's specific 2026-08-21 incident matched
`tsk-1vc-1`'s exact reproduced mechanism versus a third, undiscovered
one) is not material to this plan's own acceptance: the fix already
covers the reported symptom CLASS with a real, currently-green regression
test, which is what this item's own `verify` field can honestly assert
going forward. A third, as-yet-undiscovered mechanism producing the same
symptom would be a new bug report, not evidence this plan is wrong to
close on.

**Alternatives rejected:**

- *Build a second, distinct reproduction specific to the "only the claim
  event lost, `work.add` intact" partial shape* — rejected: `tsk-1vc-1`'s
  existing reproduction already exercises concurrent `work.move` claim
  events end to end (the same event class tsk-4te's incident lost); a
  second harness proving the identical mechanism a second way would
  duplicate verify surface for no new evidence, the same reasoning
  tsk-1vc's own D3 used to keep `tsk-1i3` a separate item rather than
  bundling a second loss mechanism into one plan.
- *Treat this as `unclear`/hand back to `exploring`* — rejected: every
  question exploring would ask a person (is the root cause the same
  class? has it shipped? is it proven?) already has a real, cited,
  evidence-backed answer from this item's own discovery round; asking a
  person to re-confirm what the repo already proves would violate
  `fgos-coding-discovering`'s own point.

## Shape

Single honest piece, no split. tsk-4te's own closing action is: run the
named verify command (already synced onto the item's own `verify` field
during discovery, not a placeholder — no `fgos edit --verify` needed
here) and let `fgos return`'s normal mechanical path confirm it, same as
any other item at `executing`.

Cases already proven against (inherited from `tsk-1vc-1`'s own proof, not
re-derived here):

- **concurrent access** — 6 real forked OS processes claiming distinct
  items under a synchronized start barrier; every claim's `work.move`
  event survives (`claimedTasks.length === N_PROC`).
- **existing behavior that must not regress** — `contiguity.ok === true`
  (0 gaps, 0 duplicates) asserted on the same run, the same invariant
  `scripts/events-jsonl-contiguity.mjs --check`'s own `fgos doctor` check
  polices continuously.
- **silent-failure boundary** — `tsk-1vc-3`'s warning-surfacing piece
  covers the case this plan does not re-test: a future break would now
  reach a live session/`fgos doctor` instead of only being discovered
  later via a confused downstream refusal (tsk-4te's own originally-
  reported cost).

## Outstanding questions

None
