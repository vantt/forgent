# Plan — git merge --abort can itself fail (tsk-40a)

Mode: standard

Lane decided directly by this skill (no `fgos-routing` Mode-gate pass ran
first — discovery's `clear` verdict routed straight here). Flags counted
per `fgos-routing`'s own Mode-gate table:

- **existing covered behavior** — touches `abortMergeIfPossible` and all
  five `mergeRunnerItemLocked` call sites in `src/runner/merge.mjs`, code
  already exercised by `test/runner/merge.test.mjs` and
  `test/runner/main-checkout-lock.test.mjs`.
- **weak proof around the area** — this is a concurrency/locking bug; a
  fix's correctness is inherently harder to pin down with a single
  deterministic assertion than a straight-line bug.

2 flags, no hard-gate flag (no auth/data-loss/audit-security/external-
provider/removed-validation) → **standard**, not high-risk.

## Approach

**Chosen path: add a doctor check that detects and plainly reports the
broken half-aborted state; do not add automatic git recovery.**

Evidence this rests on (RESEARCH.md Round 1):

- The race that leaves a broken half-abort behind is reachable through
  ordinary concurrent use of this repo's own verbs, not fixture-only:
  `appendEvent` (`src/state/events.mjs:459-461`) writes `.fgos/events.jsonl`
  under its own `withEventsLock`, entirely uncoordinated with the
  merge-slot lock `withMergeTargetSlot` holds during a merge
  (`src/runner/merge.mjs:754-800`). Any concurrent `report`/`handoff`/
  `edit`/`discover`/`move` call from a different session — routine traffic
  under this repo's own multi-session/fanout usage — can trigger the
  precondition.
- No recovery or detection exists today: every `abortMergeIfPossible`
  failure (`merge.mjs:1242`, `:1270`, `:1308`, `:1324`) is wrapped into a
  descriptive `MergeError` and propagated, never recovered. `fgos
  main-checkout-reset --sha <sha> --confirm` (`bin/fgos.mjs:3992-4019`,
  guarded by `src/runner/main-checkout-reset-guard.mjs`) is the only
  existing recovery tool, run by hand, and nothing today points a stuck
  session at it.

**Why detection only, not auto-recovery:** the discovery scope named two
options — "detect and auto-recover" or "at minimum a doctor check that
flags it plainly." `main-checkout-reset`'s own existing design already
answers what a *safe* automatic reset would need: it refuses without an
explicit `--sha`, prints the full whole-repo `git status`, and refuses a
dirty tree without `--confirm` — because blindly running `git reset
--merge`/`--hard` in the SHARED main checkout risks discarding a
different, unrelated session's real uncommitted work (the same hazard this
skill's own `AGENTS.md`-adjacent tooling already guards against
elsewhere). Automating that reset from inside `abortMergeIfPossible`
itself — with no human in the loop and no certainty the working tree holds
nothing else worth keeping — reintroduces exactly the destructive-action
risk the existing manual verb was deliberately built to gate behind
`--confirm`. A **standard**-lane item is the wrong place to make that
call silently; a doctor check that surfaces the state and names the exact
recovery command is the smallest honest piece that closes the real gap
(nobody currently notices) without taking on that risk. Auto-recovery, if
ever wanted, is a natural follow-on item once this item's detection has
run in practice and the recovery shape (which ref to reset to, when it's
truly safe) has real evidence behind it — not something to guess now.

**Impact-analysis posture: degraded.** `fgos tool query --capability
impact-analysis --status present` shows GitNexus registered and
`present`, but its index at this scan root is **1235 commits behind
HEAD**. An `impact` query on `abortMergeIfPossible` (upstream) returned
`impactedCount: 0` — a suspicious zero given the direct-read evidence
above shows 5 real call sites in the same file — confirming the index is
stale for this symbol, not that the function is actually unused. Trusted
here instead: the direct `Read`/`grep` evidence in RESEARCH.md Round 1
(file:line citations against the current tree), which already found and
cited every real call site. This proof point is marked weak on the graph
side and strong on the direct-read side; `fgos-coding-validating` should
not re-run the same stale graph query expecting a different answer.

**Files likely touched, in order:**

1. `src/setup/checks.mjs` — new check function detecting a lingering
   `MERGE_HEAD` in the main checkout (git plumbing: `git rev-parse
   --verify MERGE_HEAD` succeeding), registered into the existing check
   registry per `AGENTS.md`'s install/setup/doctor gate. Reports the
   state plainly and names the exact recovery command
   (`fgos main-checkout-reset --sha <sha> --confirm`) rather than
   guessing a sha itself.
2. `docs/how-to/recover-a-broken-half-aborted-merge-when-git-merge-abort-itself-fails.md`
   — new how-to doc, following this repo's existing naming convention
   (sibling docs: `clear-a-stuck-main-checkout-lock.md`,
   `fix-fgos-write-rejected-merge-block.md` — neither covers this exact
   shape, confirmed in RESEARCH.md). Doctor's own report message links
   here, matching the existing pattern at `merge.mjs:1143`
   (`formatFgosWriteRejectedDetail` linking its own how-to).
3. `test/setup/checks.test.mjs` — new test: a fixture repo with a
   deliberately left `MERGE_HEAD` (same repro shape as
   `docs/history/events-jsonl-merge-abort-truncation-gap/RESEARCH.md`
   Round 5, fixture 2) must make the new doctor check fail/warn with the
   plain message; a clean repo must not trip it.

No `fgos graph --json` critical-path signal changes this ordering — this
is a single self-contained item with no sibling children competing for
priority.

## Shape

One phase, no split (see below). Concrete cases to prove at
`fgos-coding-validating`/execution:

- **Boundary — no merge in progress.** `git rev-parse --verify MERGE_HEAD`
  fails (normal state) → check passes silently, same as every other
  doctor check today.
- **Existing behavior not regressed.** Every other doctor check in
  `src/setup/checks.mjs` keeps passing on an ordinary clean repo — this is
  purely additive, no existing check's logic changes.
- **The real failure state.** A fixture repo carrying a leftover
  `MERGE_HEAD` (built the same way RESEARCH.md's Round 1 evidence
  describes: union-merge-driver staged `.fgos/` change + a further
  uncommitted line landing on top, then a failed `git merge --abort`) must
  make the new check report the broken state and name the recovery
  command — never silently pass, never crash the whole `doctor` run.
- **Partial failure / no false positive.** A merge genuinely in progress
  at the exact moment `doctor` happens to run (rare, since `doctor` is a
  human-invoked read, not part of the merge's own critical section) should
  still report accurately — the check only asserts "a `MERGE_HEAD` exists
  right now," which is true in both the broken-forever case and the
  vanishingly-rare genuinely-mid-merge case; the report text should say so
  plainly (name it as "in progress or stuck," not assert "stuck" as
  certain) rather than assume a false positive can't happen.

## Split decision

No split. This is one honest piece: one new doctor check, one new how-to
doc, one new test. Nothing here has an independent reason to exist
without the other two, and neither the doctor check nor the doc benefits
from being materialized as a separate work item at a separate gate.

## Verify

Pass-through item — the item's own `verify` field already reads
`node --test test/runner/merge.test.mjs test/setup/checks.test.mjs`
(synced at discovery time from `fgos-researching`'s Round 1 suggestion).
This already matches the designed proof surface above (the new test lands
in `test/setup/checks.test.mjs`; `test/runner/merge.test.mjs` stays as
regression coverage proving `abortMergeIfPossible`'s own call sites are
untouched behaviorally) — no further `fgos edit --verify` sync needed.

## Assumptions

- **Not material, pinned here rather than asked:** the new doctor check
  reports the broken state as a warning/fail in `fgos doctor`'s existing
  output shape (whatever that shape already is for other checks in
  `src/setup/checks.mjs`) rather than inventing a new severity tier — an
  implementation-only detail, not a scope/behavior/data-shape question.

## Outstanding questions

None
