# CONTEXT — tsk-1vc: silent eventlog loss detection & guard reliability

## Feature boundary

tsk-1vc covers the shared main-checkout `.fgos/events.jsonl` guard
subsystem's reliability for the concurrent-write / opportunistic-checks
loss class: making the existing truncation guard (`src/state/events-jsonl-
truncation-guard.mjs`) fail-closed where it can safely do so without
blocking developer workflow, moving its periodic-checkpoint trigger off a
fixed wall-clock timer, surfacing the guard's already-recorded warnings to
a live session/`fgos doctor` instead of leaving them write-only, and pinning
the exact mechanism behind the concrete `tsk-3hks` loss incident via a real
concurrent-claim reproduction. The separate merge-content-precedence
overwrite mechanism (the `e921fdb4`/`165bc0cb` incident) is explicitly out
of scope here — it belongs to `tsk-1i3` (D3).

## Locked decisions

| D-ID | Quyết định |
|---|---|
| — | Supplementary finding (from tsk-c5u's own incident, same window, tip seq 22823 / mark 22850 -- looks like the same event this item already documents): recordMainCheckoutGuardWarning (src/state/main-checkout-guard-warnings.mjs) is write-only. Grepped src/, bin/fgos.mjs, docs/ -- nothing ever reads .fgos/main-checkout-guard-warnings.jsonl back (not fgos doctor, not fgos list/show, not fgos-coding-driving's loop). The guard DID correctly detect this break (a real, timestamped {reason:'regressed', message:'current tip seq 22816 is lower than the last recorded mark (seq 22850)...'} entry sits in that file), but nothing surfaces it to a live in-flight session -- my session only discovered the loss via a confusing downstream fgos-return refusal ('is todo, not doing'), then had to reconstruct the incident by hand (raw grep, seq arithmetic, fgos show cross-check) instead of being told directly. Worth folding into whatever this item's own fix ends up being: surface the warnings file's content somewhere a live session or fgos doctor actually reads. |
| D1 | Guard fail-closed only inside its own internal write path (refuse to advance the guard mark / refuse the periodic auto-commit when an unacknowledged break is currently flagged); fgos pick/take/return/claim stay unaffected -- no developer-facing block. |
| D2 | Ship event-count-based checkpointing as the periodic-checkpoint trigger -- commit after N real appended events since the last checkpoint. This applies on top of the current fixed 900s wall-clock constant (PERIODIC_CHECKPOINT_INTERVAL_SEC, events-jsonl-truncation-guard.mjs:195). N exposed as a .fgos/config.json knob (mirrors the existing runner.executor/capabilities nested-config precedent), default value measured during implementation/verify, never guessed. |
| D3 | tsk-1vc and tsk-1i3 stay separate items. tsk-1vc owns guard reliability + the D1/D2 fail-closed and checkpoint-mechanism decisions + warning-surfacing + root-cause pinning for the concurrent-write/opportunistic-checks loss class. tsk-1i3 keeps owning the merge-content-precedence overwrite fix (the e921fdb4/165bc0cb incident), ordered after tsk-1vc per its existing deps=[tsk-1vc, tsk-56u]. |
| D4 | Root-cause pinning for the tsk-3hks seq 22824-22851 gap must be done via a real live reproduction (a test/harness that runs genuinely concurrent fgos pick/claim calls against a shared main checkout and observes whether the same gap signature reproduces), not by git-log/timestamp inference alone. |
| D5 | Overall trade-off priority for this item's fixes: data safety over speed, but every safety change must be backed by real measurement/evidence (reproduced incident, measured checkpoint-interval risk window, etc.), never a guessed value or an unproven mechanism. |
| D6 | Warning-log surfacing is locked in this item's own scope -- expose recordMainCheckoutGuardWarning's output (main-checkout-guard-warnings.jsonl, confirmed write-only) to a live session or fgos doctor. |
| D7 | Correction to D4's citation -- the earlier claimed seq 22824-22851 gap does not exist. scripts/events-jsonl-contiguity.mjs --check against the live .fgos/events.jsonl reports gaps: [] (checked 2026-08-21T04:5x, validating stage); those seq numbers are legitimately used by other items' real, unrelated activity (real timestamps 03:30:30-03:31:xx). D4's actual directive (real live reproduction over git-log/timestamp inference) stays correct and is unweakened by this correction -- if anything strengthened, since a clean silent-disappear-and-renumber loses no numeric trace a post-hoc gap scan could ever catch, which is precisely why behavioral reproduction is required instead. |

## Pinned terms

- **"the loss"** (supersedes an earlier, retracted "the gap" term — D7) —
  `tsk-3hks`'s ORIGINAL `work.add` event silently disappearing from the
  shared main-checkout log at some point before it was manually recreated
  (per the item's own description: "Recovered by recreating the item
  (`fgos add` with the same id/fields)"). This leaves **no numeric trace**
  in the current log — `scripts/events-jsonl-contiguity.mjs --check`
  against the live log reports `gaps: []` (checked during validating);
  a silent disappear-and-renumber closes over cleanly, which is exactly
  why a post-hoc numeric scan cannot detect it and D4 requires real
  behavioral reproduction instead. The only surviving evidence is the
  guard's own "regressed" warning
  (`.fgos/main-checkout-guard-warnings.jsonl`: tip seq `22816` vs. recorded
  mark `22850` at `03:19:28`) — already explained in the prior
  investigation report as a likely false positive from the guard-mark
  file's own unlocked, unscoped race (another session's local,
  not-yet-synced view), not independently re-confirmed here.
- **"the guard"** — `src/state/events-jsonl-truncation-guard.mjs`'s
  `checkTruncationGuard`/`advanceEventsJsonlTruncationGuard`/
  `runOpportunisticMainCheckoutChecks` trio, wired unconditionally into
  `src/runner/claim-port.mjs:123` and `src/runner/merge.mjs:788,911`.
- **"the warning log"** — `src/state/main-checkout-guard-warnings.mjs`'s
  `recordMainCheckoutGuardWarning`, confirmed write-only: no read site
  exists anywhere in `src/`, `bin/`, `docs/`, or `test/`.

## Scout evidence

- `rg -n "main-checkout-guard-warnings|recordMainCheckoutGuardWarning" src
  bin docs test` — only the write site and its definition; no read site.
- `src/state/events-jsonl-truncation-guard.mjs:163-167`
  (`writeGuardMark`) — plain `fs.writeFileSync`, no lock, no per-session
  scope.
- `src/state/events-jsonl-truncation-guard.mjs:195`
  (`PERIODIC_CHECKPOINT_INTERVAL_SEC = 900`) — hardcoded, no config-file
  override read anywhere.
- `src/runner/claim-port.mjs:123`, `src/runner/merge.mjs:788,911` — the
  guard's two unconditional call sites.
- **Retracted (D7):** an earlier round of this investigation misread a
  `rg -n "tsk-3hks"` grep (which only shows lines matching that string) as
  proof of a numeric seq gap 22824-22851. Re-checked directly: those seq
  numbers are populated by other items' real, unrelated activity
  (real timestamps 03:30:30-03:31:xx); `scripts/events-jsonl-contiguity.mjs
  --check .fgos/events.jsonl` confirms `{"ok": true, "gaps": [], "duplicates": []}`
  against the current live log. No numeric gap exists today — see "the
  loss" in Pinned terms for what evidence actually survives.
- `docs/explanation/events-jsonl-lost-update-race-under-concurrent-session-writes.md`
  (tsk-1q5/tsk-3wq) — an existing, already-proven two-root-cause taxonomy
  for this exact class of failure: root cause A (`refreshView` outside
  `withEventsLock` in `store.mjs`/`porting-store.mjs`, already fixed) and
  root cause B (`.fgos/events.jsonl` git-tracked in the shared checkout,
  silently discarded by a raw `git merge`/checkout from another session;
  already fixed via a `.gitattributes merge=union` entry +
  `scripts/events-jsonl-contiguity.mjs` registered into `fgos doctor`).
  Neither root cause is asserted to explain `tsk-3hks`'s own loss — both
  are already fixed and this item's own scout evidence (no merge commit
  landed in the original investigation's timing window) argues against
  root cause B specifically for this incident — but D4's reproduction
  harness (piece 1) must rule both out explicitly before concluding a
  third, unfixed mechanism, per this doc's own precedent of two prior
  "obvious" hypotheses both proving wrong on direct inspection.
- `test/runner/merge-target-slot-multiprocess.test.mjs`,
  `test/runner/main-checkout-lock.test.mjs`,
  `test/e2e/main-checkout-lock-hook.test.mjs` — existing multiprocess/
  concurrent-claim test patterns in this repo; piece 1's reproduction
  harness should reuse this repo's own existing multiprocess-test
  machinery rather than inventing a new one from scratch.
- `.fgos/config.json`'s existing `runner.executor`/`runner.capabilities`
  nested shape — precedent that a checkpoint-trigger threshold belongs in
  config, not a hardcoded constant (grounds D2).
- Full round detail: `docs/history/tsk-1vc-silent-eventlog-loss-detection/
  RESEARCH.md` (discovery round 1).

## Impact-analysis capability posture

`full` — GitNexus registered and `present`
(`fgos tool query --capability impact-analysis --status present`, checked
2026-08-21T04:41Z, this session). Informational only; this skill produces
no code, so the posture is recorded here for whichever session runs
`fgos-coding-planning`/`fgos-coding-implement` next.

## Canonical references

- `plans/reports/investigation-260821-1050-eventlog-loss-merge-speed-root-cause-report.md`
  — prior investigation session's root-cause timeline and roadmap; source
  of the tsk-1i3 scope split (D3) and the checkpoint-interval /
  fail-closed trade-off framing this item's D1/D2 resolve.
- `tsk-cgg` (done) — original truncation-guard detect-only fix.
- `tsk-5k1` (delivered, merged `acb79db0`, re-checked 2026-08-21 after
  merge) — tsk-1ji's opportunistic-checks fallout on 7 pre-existing tests;
  its own discovery found the regression already resolved by main's
  `tsk-oet` (`8607438e`) before tsk-5k1 started (confirm-and-close, no
  code change). No formal graph edge to this item (not in `deps`, not in
  the same `fgos graph` component — that component is
  `{tsk-56u, tsk-1vc, tsk-4te, tsk-1i3}`); the prior investigation report's
  roadmap listed it first only as a suggested clean-noise-before-guard
  ordering, not a dependency. Re-check found nothing that changes D1/D2/D4/
  D5 — the SHA-mismatch/dirty-tree test assumptions it fixed are unrelated
  to this item's fail-closed/event-count-checkpoint/reproduction work on
  the same subsystem.
- `tsk-1i3` (open, deps=[tsk-1vc, tsk-56u]) — merge-content-precedence
  overwrite fix, explicitly out of this item's scope (D3).
- `tsk-4te` (open, deps=[tsk-1vc]) — partial-loss variant (claim event
  only, same root-cause class) reported the same day; not this item's own
  deliverable but shares the same underlying mechanism this item
  investigates.

## Outstanding questions

None
