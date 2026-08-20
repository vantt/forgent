# events-jsonl-merge-abort-truncation-gap — plan.md

## Mode: high-risk

Hard-gate flag: **data loss** — this item closes a real, live production
data-loss mechanism (tsk-24e: ~26 real events from tsk-4oq silently
discarded). Also present: existing covered behavior (touches production
merge/abort machinery already under test in `test/runner/merge.test.mjs`,
including the tsk-2j9/tsk-18a hardening already locked into
`abortMergeIfPossible`) and weak proof around the area (a cross-process
timing race is inherently hard to reproduce deterministically). No lane
was handed off from `fgos-routing` (this item entered via `/fgOS:pick` →
`fgos-coding-driving`, never through `fgos-routing`'s own Orient), so this
lane was derived directly from `fgos-routing`'s own Mode-gate thresholds
(SKILL.md § "Mode gate") per the planning skill's direct-entry fallback.

No `CONTEXT.md` exists for this item — discovery's verdict was `clear`
(`docs/history/events-jsonl-merge-abort-truncation-gap/RESEARCH.md`,
Round 1), which skips `exploring` entirely, so this plan's grounding is
that RESEARCH.md round plus the item's own description, not a locked
CONTEXT.md decision.

**Recovered prior research, folded in during this planning pass.** This
worktree already contained an untracked, uncommitted
`docs/history/tsk-1ji-truncation-guard-realtime-gap/RESEARCH.md` (3
rounds, dated the same day) from an earlier, interrupted attempt at this
same item — never committed, never applied via `fgos discover`, so the
item was still sitting at stage `discovery` when this session picked it.
Its findings corroborate and sharpen this round's own (independently
reached, same audit method, same six-call-site inventory) and add two
things this round did not have on its own:
1. The precise trigger for the highest-value abort call
   (`merge.mjs:1218-1231`): it fires specifically when the merge staged
   ANY change under `.fgos/` — the exact file class at risk.
2. A nuance this plan's Approach section folds in below: `git merge
   --abort` is `git reset --merge` under the hood, which git documents as
   refusing (not silently discarding) when a path has uncommitted
   working-tree changes on top of what the merge staged — whether that
   safety actually holds for this specific interleaving is NOT yet
   empirically confirmed, named as an open proof point for `fgos-coding-
   validating` rather than asserted here.
3. Round 3 confirmed no other open work item already covers either of
   tsk-1ji's own two improvement directions — this item is not duplicate
   work.
Content preserved verbatim in this feature dir's RESEARCH.md as its own
dated round; the stray duplicate folder is removed once that copy lands.

## Approach

**Chosen path: a targeted snapshot/compare/restore wrapper around
`abortMergeIfPossible`, using the already-hardened `withEventsLock`
primitive — not a lock-widening or stash-based approach.**

RESEARCH.md Round 1 pinpointed the mechanism: `git merge --abort`
(`src/runner/merge.mjs:1074-1098`, called from `mergeRunnerItemLocked` at
lines 1196/1224/1262/1278/1299 — the last four confirmed read directly at
`src/runner/merge.mjs:1190-1300`) reverts the main-checkout working tree
to pre-merge-attempt HEAD. **Corrected from this plan's own first draft:**
`git merge --abort` is `git reset --merge`, which git documents as
refusing a path (erroring, not silently discarding) when that path has
uncommitted working-tree changes on top of what the merge itself staged —
so "always blindly discards" overstates the documented mechanism. What is
empirically certain, independent of that nuance, is the OUTCOME: the real
tsk-24e/tsk-4oq incident this item root-causes did lose already-appended
events with no error surfaced anywhere in `.fgos/events.jsonl`'s own
history or this repo's event log for that window (not yet cross-checked
against process/CI logs — see the proof point below). Either git's
refusal safety does not actually cover this specific shape (e.g. `.fgos/
events.jsonl` reads as "clean" relative to the merge's own staged state at
the moment abort runs, so the refusal never triggers, and the concurrent
append that landed after that staged snapshot is the part that gets
silently dropped), or the loss happened via a different path this item's
own scope does not yet need to distinguish to justify the fix below — the
targeted restore is correct in EITHER case, since it activates only when
the file was actually reverted, and both branches leave the same content
on disk today: not proven safe. `acquireMainCheckoutLock` (held for the
whole merge-attempt window) and `acquireEventsLock`/`events.lock` (what
`appendEvent` takes) are deliberately independent locks
(`src/runner/main-checkout-lock.mjs:7-14`, by design) — nothing today
closes this window either way.

The fix: immediately before each `abortMergeIfPossible` call actually runs
`git merge --abort`, read `.fgos/events.jsonl`'s current live content;
immediately after the abort completes, re-read it and compare. If the
abort reverted it (content now differs from the pre-abort read and matches
the older HEAD-committed version), restore the pre-abort content — both
the compare and the restore write happen inside one `withEventsLock`
critical section (`src/state/events.mjs:400`, already exported and
already hardened per tsk-3ld — RESEARCH.md's own citation), so the window
where a THIRD concurrent `appendEvent` could still race the restore itself
shrinks to that one short critical section instead of the whole
merge-attempt duration.

**Alternatives rejected:**
- *Hold `events.lock` for the entire merge-attempt-through-abort window*
  (proposed as direction in the item's own description) — rejected: a
  merge attempt's own duration includes running the item's real
  goal-check/verify command (`runGoalCheck`, arbitrary length), so this
  would block EVERY concurrent session's `appendEvent` calls system-wide
  (the same physical `.fgos/events.jsonl`, shared across the main checkout
  and every linked worktree via the `.fgos` symlink, ADR0020) for that
  entire duration — a much larger contention surface than the targeted
  restore for no extra correctness benefit, since only the abort path
  actually discards content.
- *`git stash` the file around the merge attempt* — rejected: no `git
  stash` call exists anywhere in fgOS's own source today (RESEARCH.md
  Round 1), and stashing a single tracked file mid-merge-attempt interacts
  awkwardly with the merge's own index state; the plain snapshot/restore
  achieves the same outcome without touching git's stash machinery at
  all.
- *Widen the frequency of the existing detection-only
  `events-jsonl-truncation-guard` check (direction (a) in the item's own
  description)* — kept explicitly OUT of this item's scope (YAGNI): it is
  a real, independently valuable follow-up (catches whatever this fix
  doesn't, plus any human-run raw-git-command class of the same failure —
  RESEARCH.md Round 1 found the truncation-guard's own comments name that
  as a distinct, non-fgOS-internal trigger too), but does not close the
  mechanism this item root-caused, and bundling it here would blur one
  cohesive fix with a second, separable improvement.

**Scope boundary against tsk-24e (this item's own dependency, still
`status: doing` / `stage: exploring`, currently parked `awaiting-human`
with its own unrelated-but-adjacent open question).** Read directly via
`fgos show tsk-24e --json`: tsk-24e's own parked question frames the same
general problem ("nothing in `src/` ever git-commits `.fgos/events.jsonl`
automatically... exposed to a concurrent session's raw `git reset --hard`/
`git checkout -f`/`git clean -fd` on the shared main checkout") and offers
a person options (a) a code-level guard on raw force-checkout/reset, (b) a
periodic auto-commit cadence, (c) both, (d) other. That framing is about a
**human or session running raw git commands** directly against the main
checkout, outside any fgOS verb — a different trigger from this item's own
`abortMergeIfPossible` mechanism, which is **fgOS's own internal,
automatic** merge machinery. tsk-1ji's own description already draws this
same line under improvement direction (b) ("audit every git operation
*fgOS itself* runs"). This item's fix closes the fgOS-internal vector
only; it does not answer tsk-24e's own still-open human-raw-command
question, and this plan does not attempt to answer it on tsk-24e's
behalf — that stays tsk-24e's own park for a person to resolve. Once this
item lands, its existence (a real, code-level guard against fgOS's own
internal git ops discarding `.fgos/events.jsonl`) is honest evidence
toward tsk-24e's option (a), scoped narrowly — worth a one-line note on
tsk-24e once this item reaches `awaiting-approval`, not a scope merge now.

**Impact-analysis posture: degraded.** `fgos tool query --capability
impact-analysis --status present` reports GitNexus registered and
`present`, but this session's own hook already flagged "GitNexus index is
stale (last indexed: 7bb3231)" — per `CLAUDE.md`'s capability gate, a
`present`-but-stale index means blast-radius evidence from it would be
weak, not full. Substituted with the plain `rg`-based call-site audit
already performed in RESEARCH.md Round 1 (every `checkout`/`reset`/
`clean`/`stash` git-arg literal in `src bin`, plus every `.fgos/events.jsonl`
mention in `merge.mjs`) as the cross-check CLAUDE.md's gate itself
recommends in place of a stale index.

`fgos graph --json tsk-1ji` — component `{tsk-cgg, tsk-64o, tsk-24e,
tsk-1ji}` (size 4), `topUnblock` empty for this item: nothing else in the
backlog is waiting on tsk-1ji specifically, so there is no ordering
pressure from other items — this plan's own internal file order below is
the only sequencing that matters.

**Files touched, in order:**
1. `src/runner/merge.mjs` — wrap each of the five `abortMergeIfPossible`
   call sites' shared implementation (the function itself, lines
   1074-1098) with the snapshot/compare/restore sequence around the
   `git(repoRoot, ['merge', '--abort'])` call, reusing `withEventsLock`
   from `src/state/events.mjs` (imported, not reinvented). Must preserve
   the function's existing early-return/no-op semantics exactly: the
   `!mergeHeadExists` early return (nothing to abort — no restore needed
   either), and the tsk-18a race-tolerant catch block (a concurrent
   session already clearing `MERGE_HEAD` is still a benign no-op, not a
   trigger for the restore path).
2. `test/runner/merge.test.mjs` — add a regression test that reproduces
   the race directly (append a marker event to `.fgos/events.jsonl`
   between the `git merge --no-commit --no-ff` attempt and the
   `abortMergeIfPossible` call, force a conflict so abort actually runs,
   assert the marker event is still present in the file afterward). Also
   re-run the existing tsk-2j9/tsk-18a cases in this same file to confirm
   the wrapper does not change either's already-locked behavior.

## Split decision

**No split — one piece is honestly enough.** The fix (wrap
`abortMergeIfPossible` with the snapshot/compare/restore sequence) and its
regression test are one cohesive, atomically-mergeable change: the fix
without the test is unverifiable, and the test without the fix asserts a
still-broken behavior — neither half is independently shippable, so
splitting them would only fragment one change across two gates for no
real parallelism gained (this item's own `topUnblock` is empty; nothing
else in the backlog is waiting on a partial landing). Proceeds as itself.

## Concurrent-access sketch (high-risk mode)

- **Two-session race (the bug itself):** Session A running
  `mergeRunnerItemLocked` for item X hits a conflict, is about to call
  `abortMergeIfPossible`. Session B (own linked worktree, same shared
  `.fgos/events.jsonl` via the symlink) calls `appendEvent` for its own
  unrelated item Y in that same window. Expected after the fix: B's event
  survives on disk once A's abort completes.
- **Existing behavior that must not regress:** the no-`MERGE_HEAD`
  early-return (tsk-2j9) and the concurrent-clear-of-`MERGE_HEAD` race
  tolerance (tsk-18a) inside `abortMergeIfPossible` itself — both already
  covered in `test/runner/merge.test.mjs` per RESEARCH.md's read of the
  function; the new wrapper must not fire the restore logic on either of
  those no-abort-actually-happened paths.
- **Residual window (named honestly, not claimed away):** a fourth
  concurrent `appendEvent` landing in the exact instant of the fix's own
  `withEventsLock` critical section (the compare+restore) is still, in
  principle, serialized correctly by that same lock — `appendEvent` and
  the restore both take the identical `events.lock`, so they cannot
  interleave. No unclosed gap is expected here, but this is the one claim
  in this plan the regression test above must actually exercise rather
  than take on faith.

**Proof point for `fgos-coding-validating` (required — this plan's Approach
softened an initial overclaim about `git merge --abort`'s documented
"refuse if uncommitted" safety and did not resolve which of the two
branches above actually explains the real incident):** before or alongside
implementing the fix, reproduce the race directly against a throwaway git
repo fixture (not the live `.fgos/events.jsonl`) — start a `git merge
--no-commit --no-ff` that will conflict, append an uncommitted change to a
tracked file mid-attempt, call `git merge --abort`, and observe directly
whether git refuses (errors) or silently discards. This settles the exact
mechanism before the fix is trusted, and doubles as the regression test's
own setup once confirmed.

## Outstanding questions

None
