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

## Revision note (post reality-gate FAIL)

`fgos-coding-validating`'s reality gate FAILed the first version of this
plan on repo fit: it targeted `src/setup/checks.mjs`, which is a thin
re-export shim (`checks.mjs:1-22`, own header comment) — the real check
registry (`registerCheck`/`DOCTOR_CHECKS`) lives in
`src/setup/registrations.mjs`. It also missed that the same file already
exposes a paired `registerFix`/`FIX_REGISTRATIONS` mechanism (9 existing
registrations, gated behind `fgos doctor --fix`) that fits this shape
better than a standalone how-to doc. This revision corrects both — see
Approach below for the design that resulted from actually reading
`registrations.mjs`.

## Approach

**Chosen path: register a check + a fix in `src/setup/registrations.mjs`;
the fix never mutates git state, it only ever reports the exact manual
recovery command. No new how-to doc.**

Evidence this rests on (RESEARCH.md Round 1 + this revision's own reads):

- The race that leaves a broken half-abort behind is reachable through
  ordinary concurrent use of this repo's own verbs, not fixture-only:
  `appendEvent` (`src/state/events.mjs:459-461`) writes `.fgos/events.jsonl`
  under its own `withEventsLock`, entirely uncoordinated with the
  merge-slot lock `withMergeTargetSlot` holds during a merge
  (`src/runner/merge.mjs:754-800`). Any concurrent `report`/`handoff`/
  `edit`/`discover`/`move` call from a different session — routine traffic
  under this repo's own multi-session/fanout usage — can trigger the
  precondition.
- No detection or recovery exists today: every `abortMergeIfPossible`
  failure (`merge.mjs:1242`, `:1270`, `:1308`, `:1324`) is wrapped into a
  descriptive `MergeError` and propagated, never recovered.
- `src/setup/registrations.mjs:87-98` (`registerCheck`) and `:133-144`
  (`registerFix`) are the real registry — `check` returns `{passed,
  message}`, `fix` returns `{changed, message}`, matched by the same
  `id`. Example pair read directly: `iron-law-configured`
  (`registrations.mjs:1702-1711`) — its check message names the exact
  remediation ("run fgos doctor --fix") the same way this new check's
  message should name `fgos main-checkout-reset`.
- The closest existing precedent for "a git merge left repo state broken,
  register a fix for it" is `events-jsonl-contiguous`/
  `fixEventsJsonlContiguous` (`registrations.mjs:1158-1181`, description:
  "shared .fgos/events.jsonl has no seq breaks or duplicates left behind
  by a git merge (tsk-3wq)") — but its fix only ever rewrites one file's
  own content with a backup (`result.backupPath`), never touches git
  plumbing (`.git/MERGE_HEAD`, the index). None of the 9 existing
  `registerFix` entries mutate git state at all; every one writes a config
  default or repairs one file's own content. This item's fix would be the
  first to touch git plumbing, which is a different risk class — deleting
  `MERGE_HEAD` or resetting the index can discard whatever the concurrent
  writer's uncommitted change actually was, exactly the hazard
  `main-checkout-reset-guard.mjs`'s `assertSafeMainCheckoutReset` already
  exists to gate.
- `assertSafeMainCheckoutReset({dirty, confirmed})`
  (`src/runner/main-checkout-reset-guard.mjs:21-29`) is a pure decision:
  throws whenever `dirty && !confirmed`. `dirty` is derived from
  `isWorkingTreeClean` (`bin/fgos.mjs:4004`, whole-repo scope) — a tree
  with `MERGE_HEAD` present and a staged/conflicted merge is definitionally
  not clean, so `dirty` is always true in exactly the state this check
  detects. An unattended `fgos doctor --fix` run has no way to supply
  `confirmed: true` (that flag only exists because a human reviewed the
  real `git status` output first, per `main-checkout-reset`'s own CLI
  contract). Reusing this same guard inside the new fix therefore means
  the fix can never safely reset anything by itself — which is the
  correct, evidence-grounded answer, not a workaround: it reuses the
  exact safety boundary this repo already built for the identical
  question ("is it safe to reset the shared main checkout right now"),
  rather than inventing a looser one just to make the fix "do something."

**Why the fix still exists even though it can never repair anything.**
Every check in this registry that also registers a fix follows the same
`fgos doctor --fix` UX: running `--fix` attempts a repair and reports
`{changed, message}`, even when the honest answer is "nothing safe to
change" — several existing fixes already return `changed: false` with an
explanatory message on their own not-actually-broken branch (e.g.
`fixEventsJsonlContiguous`'s "already contiguous — nothing to fix",
`registrations.mjs:1169`). This item's fix follows that same shape: it
always returns `changed: false`, naming the exact
`fgos main-checkout-reset --sha <sha> --confirm` command as the message —
consistent with the registry's own convention, and honest that no
unattended process may cross this particular safety line.

**Why no new how-to doc.** The corrected design's check/fix message names
the exact remediation command directly, the same way `iron-law-configured`
already does inline (no how-to link). `fgos main-checkout-reset` itself
already prints the full whole-repo `git status` and its own usage error
when called wrong (`bin/fgos.mjs:3992-4019`) — that existing output is
already the recovery walkthrough. A fourth new file whose only job would
be to restate what the command's own `--help`-shaped error already says
is not the smaller path; dropped from this revision.

**Impact-analysis posture: degraded.** `fgos tool query --capability
impact-analysis --status present` shows GitNexus registered and
`present`, but its index at this scan root is **1235 commits behind
HEAD**. An `impact` query on `abortMergeIfPossible` (upstream) returned
`impactedCount: 0` — a suspicious zero given the direct-read evidence
above shows 5 real call sites in the same file — confirming the index is
stale for this symbol, not that the function is actually unused. Trusted
here instead: the direct `Read`/`grep` evidence in RESEARCH.md Round 1 and
this revision (file:line citations against the current tree).
`fgos-coding-validating` should not re-run the same stale graph query
expecting a different answer.

**Files touched, in order:**

1. `src/setup/registrations.mjs` — one new `registerCheck` (detects a
   lingering `MERGE_HEAD` via `git rev-parse --verify MERGE_HEAD`
   succeeding, message names `fgos main-checkout-reset --sha <sha>
   --confirm`) and one paired `registerFix` under the same `id` (always
   `changed: false`, same message — never mutates git state, per the
   `assertSafeMainCheckoutReset` reasoning above).
2. `test/setup/checks.test.mjs` — new test cases: a fixture repo with a
   deliberately left `MERGE_HEAD` (same repro shape as
   `docs/history/events-jsonl-merge-abort-truncation-gap/RESEARCH.md`
   Round 5, fixture 2) makes the check fail with the plain message and the
   fix report `changed: false` with the same remediation command; a clean
   repo trips neither.

No `fgos graph --json` critical-path signal changes this ordering — this
is a single self-contained item with no sibling children competing for
priority.

## Shape

One phase, no split (see below). Concrete cases to prove at execution:

- **Boundary — no merge in progress.** `git rev-parse --verify MERGE_HEAD`
  fails (normal state) → check passes silently, fix reports `changed:
  false, message: "no merge in progress — nothing to fix"`, same idiom as
  every other doctor check today.
- **Existing behavior not regressed.** Every other doctor check/fix in
  `src/setup/registrations.mjs` keeps passing on an ordinary clean repo —
  this is purely additive, no existing entry's logic changes.
- **The real failure state.** A fixture repo carrying a leftover
  `MERGE_HEAD` (built the same way RESEARCH.md's Round 1 evidence
  describes) must make the new check report the broken state and the fix
  report `changed: false` naming the manual recovery command — never
  silently pass, never crash the whole `doctor`/`--fix` run.
- **Partial failure / no false positive.** A merge genuinely in progress
  at the exact moment `doctor` happens to run (rare — `doctor` is a
  human-invoked read, not part of the merge's own critical section) still
  reports accurately: the check only asserts "a `MERGE_HEAD` exists right
  now," true in both the broken-forever case and the vanishingly-rare
  genuinely-mid-merge case. The message says "in progress or stuck," never
  asserts "stuck" as certain.

## Split decision

No split. One honest piece: one check+fix pair, one test file change.

## Verify

Pass-through item — the item's own `verify` field already reads
`node --test test/runner/merge.test.mjs test/setup/checks.test.mjs`
(synced at discovery time). This matches the designed proof surface above
(the new test lands in `test/setup/checks.test.mjs`, which already
exercises the live `DOCTOR_CHECKS`/`FIX_REGISTRATIONS` arrays re-exported
from `registrations.mjs`; `test/runner/merge.test.mjs` stays as
regression coverage proving `abortMergeIfPossible`'s own call sites are
untouched behaviorally) — no further `fgos edit --verify` sync needed.

## Assumptions

- **Not material, pinned here rather than asked:** the new check/fix
  report through `fgos doctor`'s existing `{passed, message}` /
  `{changed, message}` shapes, with no new severity tier — an
  implementation-only detail, not a scope/behavior/data-shape question.

## Outstanding questions

None
