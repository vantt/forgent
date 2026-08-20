# events-jsonl-merge-abort-truncation-gap — plan.md

## Mode: high-risk

Hard-gate flag: **data loss** — this item closes a real, live production
data-loss mechanism (tsk-24e: tsk-6al/tsk-4oq/tsk-5dnt/tsk-1el, real
events silently lost). Also present: existing covered behavior — this
redesigned Approach (below) touches `claimWork` (`src/runner/claim-
port.mjs`), the single hottest call path in the whole system (every
`pick`/`take` runs through it), and `mergeRunnerItem`'s lock-acquisition
sites (`src/runner/merge.mjs`) — and weak proof around the area
(concurrency, wall-clock timing). No lane was handed off from
`fgos-routing` (entered via `/fgOS:pick` → `fgos-coding-driving`), so this
lane was derived directly from `fgos-routing`'s own Mode-gate thresholds
per the planning skill's direct-entry fallback.

**Re-planned after a validating NOT READY + a material CONTEXT.md gap.**
This item's first planning pass (superseded, history preserved in
RESEARCH.md Rounds 1-5) hypothesized a specific fgOS-internal mechanism
(`git merge --abort` on the main checkout) and `fgos-coding-validating`
empirically falsified it (RESEARCH.md Round 5 — three throwaway git
fixtures, none reproduce a silent discard). That triggered a
`planning->exploring` hand-back (Step 6), now resolved: `CONTEXT.md`'s
own **D1** locks this item's real scope as **tsk-24e's own D1+D2**,
already human-approved in a parallel session and explicitly handed to
this item by tsk-24e's own D3. See `CONTEXT.md` for the full citation
chain, including a rich, directly-addressed handoff decision tsk-24e's
own session logged onto this item's decision log.

## Approach

**Two independent, additive mechanisms — CONTEXT.md D1 (detect-and-warn
guard) and D2 (time-based periodic auto-commit) — both non-blocking, both
wired at the same two real touchpoints.**

CONTEXT.md's own rich handoff decision (row 2 of the Locked decisions
table) already narrowed both mechanisms concretely:

- **D1 — detect-and-warn guard.** No clean git-native pre-reset/pre-
  checkout-force hook exists without real plumbing risk (the closest
  primitive, git's reference-transaction hook, is real but nontrivial —
  explicitly rejected as the mechanism here). Instead, reuse the
  EXISTING detection function this item's own dependency (tsk-cgg)
  already built and tested: `advanceEventsJsonlTruncationGuard(logPath,
  guardPath)` (`src/state/events-jsonl-truncation-guard.mjs:185`), the
  exact function `fgos doctor`'s `events-jsonl-not-truncated` check
  already calls (`src/setup/registrations.mjs:1210`). No new detection
  logic — only new, more-frequent, non-blocking WIRING of a
  function that already exists and is already proven.
- **D2 — time-based periodic auto-commit.** A fixed wall-clock interval
  (not per-verb-call, not checkpoint-only — CONTEXT.md's own pinned
  term). Concretely: before doing real work, check `git log -1
  --format=%ct -- .fgos/events.jsonl` (last commit touching the file,
  unix seconds) against `Date.now()`; if the gap exceeds a fixed
  threshold AND the working tree has uncommitted changes to that path
  (`git status --porcelain -- .fgos/events.jsonl`), commit it directly
  with a scoped `git add .fgos/events.jsonl && git commit -m "chore(.fgos):
  periodic events.jsonl checkpoint"`. Threshold: 15 minutes — well under
  the ~2.5h blind window CONTEXT.md's own handoff decision cites as the
  real incident's own exposure gap, and short enough that a busy
  multi-session repo (this one, empirically — dozens of concurrent verb
  calls per hour per this item's own description) hits the two wired
  touchpoints far more often than once per 15 minutes.

**Where both wire in.** CONTEXT.md's own handoff decision already
confirmed the only two real `acquireMainCheckoutLock` call sites in the
whole codebase (grep-verified, RESEARCH.md Round 2, re-confirmed live at
`src/runner/claim-port.mjs:104` and `src/runner/merge.mjs:773,894`):
`claimWork` (backs `pick`/`take`) and `mergeRunnerItem` (backs
`approve`/`sync-root`). Both mechanisms run immediately AFTER a
successful lock acquisition at each site (the lock is already held, so a
`git log`/`git status`/`git commit` read-and-maybe-write there cannot
race a concurrent claim or merge attempt on the same main checkout) — the
same insertion point for both D1 and D2, one small shared helper call.
`return` has NO `acquireMainCheckoutLock` site to hook into today
(CONTEXT.md's own handoff decision, point 3) — out of scope per that same
citation; wiring only the two real sites is not a partial fix, it is the
complete set of sites that exist.

**Non-blocking, always.** Both mechanisms wrap their own body in a
`try`/`catch` that never lets a failure propagate into `claimWork`'s or
`mergeRunnerItem`'s own return path — a failed periodic commit or a
truncation-guard read error must never turn a legitimate `pick` or
`approve` into a refusal. This mirrors an existing precedent already in
this codebase for exactly this shape: `src/cli/approve-fault-log.mjs`'s
`recordApprovePostSuccessFault` — "Never throws into its caller — a
failure recording the failure must not mask (or replace) the original
error." D1's own warning, when the guard reports a break, needs a
side-channel of the same shape (a plain `fs.appendFileSync`, its own
dedicated file, deliberately NOT `events.jsonl` and NOT sharing
`events.lock` — same reasoning `approve-fault-log.mjs`'s own header
already states) — new file `src/state/main-checkout-guard-warnings.mjs`
mirroring `approve-fault-log.mjs`'s own shape, writing to
`.fgos/main-checkout-guard-warnings.jsonl`.

**Alternatives already rejected (superseded, kept for the record):** the
original `abortMergeIfPossible` snapshot/restore Approach — falsified,
see above. Holding `events.lock` for a whole merge-attempt window and
using `git stash` — both already rejected in that earlier Approach for
reasons (contention surface, no stash call anywhere in fgOS) that still
apply independent of the mechanism change.

**Impact-analysis posture: degraded** (unchanged from the prior
Approach — `fgos tool query --capability impact-analysis --status
present` reports GitNexus `present` but this session's own hook still
flags its index as stale). Cross-check substitute: the same RESEARCH.md
Round 2 `acquireMainCheckoutLock` call-site grep, now re-confirmed live
against the two exact line numbers cited above.

**Files touched, in order:**
1. `src/state/events-jsonl-truncation-guard.mjs` or a new sibling module
   — no change to the existing detection functions themselves (D1 reuses
   them as-is); only a new thin wrapper, e.g.
   `runOpportunisticMainCheckoutChecks(dir, repoRoot)`, that calls
   `advanceEventsJsonlTruncationGuard` (D1) and the new periodic-commit
   check (D2) together, catching and recording (never throwing) either
   mechanism's own failure.
2. `src/state/main-checkout-guard-warnings.mjs` (new, mirrors
   `src/cli/approve-fault-log.mjs`'s exact shape) — the D1 warning
   side-channel.
3. `src/runner/claim-port.mjs` — one call to the Step 1 wrapper, inserted
   right after the successful-lock branch (after line 118, before the
   existing `try` block at line 120).
4. `src/runner/merge.mjs` — the same call at both `acquireMainCheckoutLock`
   sites (lines 773 and 894).
5. `test/runner/claim-port.test.mjs` and `test/runner/merge.test.mjs` (or
   a new dedicated test file for the shared wrapper) — regression
   coverage for: D1 firing a warning (never a throw) when the guard
   detects a break; D2 committing when stale-and-dirty, and NOT
   committing when fresh or clean; both mechanisms' own failure being
   swallowed without affecting `claimWork`'s/`mergeRunnerItem`'s normal
   return value.

## Split decision

**No split — one piece is honestly enough.** D1 and D2 share one
insertion point (the same wrapper, the same two call sites) and one
non-blocking-failure contract; shipping either alone without its own
regression test would leave a real, unverified change in production
merge/claim machinery. `topUnblock` is still empty for this item (RESEARCH.md
Round 1's `fgos graph --json` read) — no other item is waiting on a
partial landing. Proceeds as itself.

## Concurrent-access sketch (high-risk mode)

- **D1 (detect-and-warn) under concurrency:** the guard read (`advance
  EventsJsonlTruncationGuard`) runs while `claimWork`/`mergeRunnerItem`
  already hold `acquireMainCheckoutLock` — no other main-checkout writer
  using that same lock can run a conflicting git-tree operation
  concurrently, so the guard's own read is against a quiescent
  main-checkout tree at read time (matches the lock's own documented
  purpose, `src/runner/main-checkout-lock.mjs`).
- **D2 (periodic commit) under concurrency:** the same lock-held window
  makes the `git status`/`git commit` sequence safe against a racing
  merge/claim; the one thing NOT protected is a concurrent `appendEvent`
  landing on `.fgos/events.jsonl` between this sequence's own `git add`
  and `git commit` (the lock only excludes other main-checkout-lock
  holders, not `events.lock` holders — the two remain independent by
  design per `main-checkout-lock.mjs:7-14`). A concurrent append in that
  narrow window either lands in the commit (harmless — one extra event
  gets checkpointed early) or lands just after (harmless — it stays
  uncommitted, exactly the pre-fix state, picked up by the NEXT periodic
  check). Neither outcome loses data; this needs no lock-widening.
- **Existing behavior that must not regress:** `claimWork`'s own
  `lock-held`/`lock-ambiguous` error paths (lines 105-118) run BEFORE the
  new wrapper call and are untouched; a lock-acquisition failure must
  still throw exactly as today, never reach the new wrapper at all.
- **Proof point for `fgos-coding-validating`:** reproduce D2's own commit
  decision directly (a throwaway git fixture: commit `.fgos/events.jsonl`
  with an old timestamp, append uncommitted content, run the wrapper,
  confirm a real commit lands only when stale-and-dirty) — the same
  fixture-based verification style Round 5 already used, now proving a
  real mechanism instead of falsifying an assumed one.

## Outstanding questions

None

## Prior validating round (superseded)

RESEARCH.md Round 5 and the "Validating verdict — NOT READY" section this
plan.md previously carried are preserved as history in RESEARCH.md; this
rewritten plan.md replaces the superseded Approach in place rather than
duplicating both versions here. See RESEARCH.md for the full falsification
evidence and CONTEXT.md for the re-scoping decision (D1) that followed it.
