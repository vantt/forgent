# RESEARCH — tsk-4te: partial claim-event loss vs. tsk-1vc's shipped fix

## Round 1 — 2026-08-23 (discovery)

**Asked:** Does `tsk-1vc`'s delivered/merged fix already cover tsk-4te's
own symptom — a claimed item's `work.move` (pick → doing) event silently
vanishing from the shared main-checkout `.fgos/events.jsonl` while the
item's original `work.add` survives (confirmed on `tsk-4dk-2`) — a
partial-loss variant of `tsk-1vc`'s own confirmed full-item-loss incident
(`tsk-3hks`)? Or does tsk-4te need distinct implementation work beyond
what `tsk-1vc` shipped?

**Checked — repo evidence, cited:**

- `fgos list --id tsk-1vc --json`: status `delivered`, `mergedSha
  998abfa058feacb6c963b0c22715297634214693`, `mergedInto main`,
  `docsRef docs/history/tsk-1vc-silent-eventlog-loss-detection/`.
- `git merge-base --is-ancestor 998abfa0... c6411d4f...` (tsk-4te's own
  `branchHeadAtTake`) → true. tsk-1vc's shipped fix is already present in
  tsk-4te's branch base — not a pending, unmerged dependency.
- `fgos list --all --json` filtered on `tsk-1vc*`: all three split
  children (`tsk-1vc-1` reproduction harness, `tsk-1vc-2` guard
  fail-closed + event-count checkpointing, `tsk-1vc-3` warning surfacing)
  are `status: delivered` — the full three-piece plan
  (`docs/history/tsk-1vc-silent-eventlog-loss-detection/plan.md`) landed,
  not just a partial slice.
- `docs/history/tsk-1vc-silent-eventlog-loss-detection/plan.md` §"Chosen
  path", piece 1: the reproduction test's own acceptance shape is "a
  claimed item's own history silently disappearing from the shared log"
  under genuinely concurrent claim calls — the same symptom class (a
  claim event vanishing) tsk-4te describes, not a different, narrower
  case.
- `test/runner/concurrent-claim-eventlog-loss.test.mjs` (tsk-1vc-1's own
  deliverable), test `'runs genuinely concurrent fgos claim calls across
  real OS processes with a barrier'`: forks 6 real OS processes each
  calling `claimWork` (the same `fgos pick`/claim path `tsk-4dk-2` hit)
  under a synchronized start barrier, then asserts `contiguity.ok ===
  true` (0 gaps, 0 duplicates) AND `claimedTasks.length === N_PROC` —
  i.e. every concurrent claim's `work.move` event is present, none
  silently lost. Ran this suite directly against current `main`
  (`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test
  test/runner/concurrent-claim-eventlog-loss.test.mjs`): **3/3 pass**,
  including this exact test.
- `src/state/events-jsonl-truncation-guard.mjs:264-360`
  (`runOpportunisticMainCheckoutChecks`), read directly: D1 fail-closed
  (`if (breakFlagged) return;` before the periodic auto-commit — refuses
  to advance the guard mark or auto-commit past an unacknowledged break)
  and D2 event-count checkpointing (`DEFAULT_CHECKPOINT_EVENT_THRESHOLD =
  50`, configurable via `.fgos/config.json`'s `checkpoint.eventThreshold`)
  are both present in the code as shipped, not just planned.
- `tsk-1vc-3` (delivered) covers piece 3 — surfacing
  `main-checkout-guard-warnings.jsonl` to a live session/`fgos doctor` —
  which directly addresses tsk-4te's own stated "real cost" (no error at
  the time of loss, only discovered later via a confused downstream
  refusal): a future recurrence would now surface at the next `fgos
  doctor`/Orient read instead of silently.

**Still open (not resolved by this evidence, not this stage's call):**

- Whether tsk-4dk-2's specific incident (2026-08-21, before tsk-1vc's fix
  merged) was caused by the exact mechanism `tsk-1vc-1`'s reproduction
  targets (unlocked concurrent claim/write race) versus a third,
  undiscovered mechanism — git history alone cannot retroactively pin
  this, and no live reproduction of tsk-4dk-2's own incident was
  attempted (out of scope for a research round; `tsk-1vc-1`'s own
  reproduction already stood in for this per D3's decision to keep
  `tsk-1vc`/`tsk-4te` in one dependency chain rather than duplicating a
  second reproduction harness).
- Whether tsk-4te's own closing scope is "verify-only" (run the existing
  reproduction suite as this item's own regression proof, then close) or
  whether the person wants a second, distinct reproduction specific to
  the partial-loss shape (only the claim event lost, item's `work.add`
  intact) as extra insurance beyond `tsk-1vc-1`'s full-item-loss framing
  — a scope/mode call for `planning`, not `discovery`.

## Verdict

`clear` — the root-cause class tsk-4te reports is the same class
`tsk-1vc` (already delivered, merged, ancestor of this branch) fixed and
proved fixed via a real live reproduction (`test/runner/concurrent-claim-
eventlog-loss.test.mjs`, currently green on `main`), plus warning
surfacing so a recurrence would no longer be silent. No further
implementation is evidenced as necessary; the real, runnable regression
proof already exists.

**Proposed verify:**
`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test test/runner/concurrent-claim-eventlog-loss.test.mjs`
