# plan.md — tsk-1vc: silent eventlog loss detection & guard reliability

Mode: high-risk

Flags counted (per `fgos-routing`'s Mode gate): **data loss** (hard-gate —
this item exists to prevent further loss on the shared main-checkout event
log, the exact hard-gate category listed), **existing covered behavior**
(touches `src/runner/claim-port.mjs`/`src/runner/merge.mjs`, the same code
`tsk-5k1` just finished re-stabilizing against 7 pre-existing tests),
**weak proof around the area** (no lock on the guard-mark write, a
confirmed live false positive already observed — CONTEXT.md scout
evidence). One hard-gate flag alone forces high-risk regardless of count;
3 flags total confirm it.

## Approach

`fgos graph --json`'s `criticalPath`/`topUnblock`: tsk-1vc's own connected
component (`{tsk-56u, tsk-1vc, tsk-4te, tsk-1i3}`) does not sit on the
graph's global `criticalPath` (that chain lives in an unrelated component:
`tsk-4vo → ... → tsk-19y-1`, depth 10); `topUnblock` came back empty
(computation skipped this run). What the graph does confirm directly:
`tsk-4te` and `tsk-1i3` are both `blockedBy: ["tsk-1vc"]` — finishing this
item unblocks both. That fan-out, not the (irrelevant) global critical
path, is what makes this item worth landing promptly, and is already
reflected in `deps` on those two items — nothing new to decide from it.

Impact-analysis posture: `full` (GitNexus present, checked 2026-08-21,
recorded in CONTEXT.md) — every proof point below that leans on blast
radius is held to the full standard, not a degraded one.

**Chosen path:** three independently workable pieces, not one bundled
diff, because they touch different files with different verify shapes and
different risk profiles (D3 already ruled out a fourth candidate —
absorbing `tsk-1i3`'s merge-overwrite fix — so this list is closed at
three):

1. **Reproduce first, fix second.** Before touching
   `runOpportunisticMainCheckoutChecks`, build the live concurrent-claim
   reproduction D4 requires and confirm it reproduces "the loss" (D7's
   corrected term — a claimed item's own history silently disappearing
   from the shared log, not a numeric seq gap: `scripts/events-jsonl-
   contiguity.mjs --check` already proves no such gap survives today,
   CONTEXT.md D7) against **today's unfixed code** — a red-before-green
   baseline. Doing this after the fix would only prove the fix doesn't
   obviously break anything, not that it actually closes the hole D4
   asks about.
2. **Fix the guard's own write path** (D1 fail-closed scope + D2
   event-count checkpointing) once the baseline in (1) exists to check the
   fix against.
3. **Surface the warning log** (the item's own original ask, plus D-less
   supplementary finding already in the decision log) — independent of
   (1)/(2)'s file set, can land in any order relative to them, kept as its
   own piece so its verify stays a plain read-and-display check instead of
   getting bundled with the guard-mechanism tests.

**Alternatives rejected:**
- *One bundled diff covering all three* — rejected: `runOpportunisticMainCheckoutChecks`,
  the reproduction harness, and the warning-surfacing consumer are three
  distinct verify surfaces (an integration reproduction test, a unit-level
  guard-behavior test, a display/read-path test); bundling would make a
  single failing assertion block unrelated, already-passing pieces from
  landing at their own risk level.
- *Fix first, reproduce after (to save one round-trip)* — rejected per the
  reasoning in "Chosen path" above: proves nothing about whether the fix
  addresses the actual mechanism.
- *Absorb `tsk-1i3`'s merge-overwrite scope into this split* — rejected,
  D3 already locked this in CONTEXT.md.

### Risk map

| Component | Risk | Proof point (carried to `fgos-coding-validating`) |
|---|---|---|
| Live concurrent-claim reproduction (piece 1) | high | Must actually reproduce an item's own history silently disappearing from the shared log (D7's corrected symptom, not a numeric seq gap) against unfixed code; a harness that runs "clean" proves nothing and must not be accepted as done. Must also rule out the two already-fixed root causes A/B (`docs/explanation/events-jsonl-lost-update-race-under-concurrent-session-writes.md`) explicitly before concluding a third mechanism. GitNexus (`full` posture) used to confirm no other caller path already serializes these calls in a way that would make the race unreproducible by design. |
| Guard write-path fail-closed + event-count checkpoint (piece 2) | high | Must not introduce a new block on `pick`/`take`/`return` (D1's own explicit boundary) — proof: the same 7 tests `tsk-5k1` just fixed (`test/cli/fgos-claim.test.mjs`, `test/cli/fgos-return.test.mjs`, `test/cli/fgos-read.test.mjs`, `test/e2e/runner-loop.test.mjs`) plus `test/state/events-jsonl-truncation-guard.test.mjs`/`test/runner/claim-port.test.mjs`/`test/runner/merge.test.mjs` all still pass unmodified in their non-guard assertions. |
| Warning-log surfacing (piece 3) | medium | Read path only, no write-path change — proof is functional (the warning actually appears where a live session/`fgos doctor` would see it), not a data-safety proof. |

### Files likely touched, in order

1. Piece 1: a new test file exercising concurrent `fgos pick`/claim calls
   against a shared main checkout, reusing this repo's own existing
   multiprocess-test machinery rather than inventing new infrastructure —
   `test/runner/merge-target-slot-multiprocess.test.mjs` (real forked OS
   processes, not same-process Promises, with a documented rationale for
   why that distinction matters for exactly this class of race) and
   `test/state/events.test.mjs`'s twenty-process barrier pattern are the
   two direct precedents to extend/adapt (confirmed real by reading both
   files directly, not assumed from a grep hit — corrects an earlier,
   wrong "no existing file to extend" claim from before this session
   checked).
2. Piece 2: `src/state/events-jsonl-truncation-guard.mjs` (fail-closed
   branch in `runOpportunisticMainCheckoutChecks`'s D1 section, event-count
   trigger replacing/augmenting `PERIODIC_CHECKPOINT_INTERVAL_SEC`'s D2
   time-based one), `.fgos/config.json`'s schema (new knob, D2), plus
   whichever existing test files above need new assertions.
3. Piece 3: a read/consumer for `src/state/main-checkout-guard-warnings.mjs`'s
   output — exact hook point (an `fgos doctor` check registered via
   `registerCheck({...})` in `src/setup/registrations.mjs`, the real
   registry `src/setup/checks.mjs` only re-exports — confirmed by reading
   both files directly, per this repo's own install/setup/doctor gate in
   `AGENTS.md`, vs. an additive read inside `fgos-coding-driving`'s Orient
   step mirroring `postLandDrift`) is an implementation choice left
   to whoever builds this piece — CONTEXT.md's own Outstanding questions
   is `None` because both options equally satisfy the locked decision
   ("surface it somewhere a live session or `fgos doctor` actually
   reads"); the exact one is not material to scope/behavior/acceptance,
   only to which file gets touched, so it stays an implementation
   assumption rather than a planning-stage lock.

## Shape

Cases worth proving against, one per piece:

- **Piece 1** — the reproduction must show the SAME symptom class CONTEXT.md
  pinned (D7-corrected: a claimed item's own recorded history silently
  disappearing from the shared log between two live reads, on the shared
  main checkout — not a numeric seq gap, which the contiguity checker
  already rules out today), not a different, easier-to-trigger race. A
  harness that only proves "two processes can write to the same file at
  once" without ever losing an item's history is not done.
- **Piece 2** — boundary: guard mark exactly at the break boundary (report
  transitions ok→not-ok mid-run); concurrent access: two sessions racing
  the guard-mark write at once (this is D1's own target — prove the
  fail-closed branch actually stops the write, not just logs a warning
  again); existing behavior that must not regress: `pick`/`take`/`return`
  must complete normally even when the guard's internal write is refused.
- **Piece 3** — empty case: no warnings ever recorded (must not error or
  print noise); boundary: the warnings file exists but is empty/malformed
  (must degrade to "nothing to show", never crash a live session's Orient
  read).

## Split — three child specs

```json
[
  {
    "title": "Build a live concurrent-claim reproduction for the tsk-3hks eventlog loss",
    "verify": "npm test -- test/runner/concurrent-claim-eventlog-loss.test.mjs",
    "action": "per D4 and D7 (docs/history/tsk-1vc-silent-eventlog-loss-detection/CONTEXT.md), build a real harness (extending the real-forked-OS-process pattern in test/runner/merge-target-slot-multiprocess.test.mjs and the barrier pattern in test/state/events.test.mjs) running genuinely concurrent fgos pick/claim calls against a shared main checkout and confirm it reproduces a claimed item's own history silently disappearing from the shared log against today's unfixed guard code -- a red-before-green baseline for the piece that fixes it, explicitly ruling out the two already-fixed root causes in docs/explanation/events-jsonl-lost-update-race-under-concurrent-session-writes.md before concluding a third mechanism",
    "footprint": ["test/runner/concurrent-claim-eventlog-loss.test.mjs"],
    "kind": "task",
    "risk": "heavy"
  },
  {
    "title": "Make the eventlog guard fail-closed at its own write path and switch checkpointing to event-count",
    "verify": "npm test -- test/state/events-jsonl-truncation-guard.test.mjs test/runner/claim-port.test.mjs test/runner/merge.test.mjs test/cli/fgos-claim.test.mjs test/cli/fgos-return.test.mjs test/cli/fgos-read.test.mjs test/e2e/runner-loop.test.mjs",
    "action": "per D1 and D2 (docs/history/tsk-1vc-silent-eventlog-loss-detection/CONTEXT.md), make runOpportunisticMainCheckoutChecks refuse to advance the guard mark / refuse its periodic auto-commit when an unacknowledged break is flagged (D1, never touching pick/take/return), and replace the fixed 900s PERIODIC_CHECKPOINT_INTERVAL_SEC trigger with event-count-based checkpointing configurable via .fgos/config.json (D2)",
    "footprint": ["src/state/events-jsonl-truncation-guard.mjs", ".fgos/config.json"],
    "kind": "task",
    "risk": "heavy"
  },
  {
    "title": "Surface main-checkout-guard-warnings.jsonl to a live session or fgos doctor",
    "verify": "npm test -- --grep guard-warnings-surface",
    "action": "per D6 (docs/history/tsk-1vc-silent-eventlog-loss-detection/CONTEXT.md), surface recordMainCheckoutGuardWarning's write-only output (confirmed unread anywhere in src/, bin/, docs/, test/ -- CONTEXT.md scout evidence) to a live session or fgos doctor",
    "footprint": ["src/setup/registrations.mjs"],
    "kind": "task",
    "risk": "standard"
  }
]
```

## Outstanding questions

None
