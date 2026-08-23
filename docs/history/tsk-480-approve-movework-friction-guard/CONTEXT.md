# CONTEXT: tsk-480 — approve's post-merge moveWork can throw silently after a permanent state change

## Feature boundary

`fgos approve`'s three success paths in `bin/fgos.mjs` (`case 'approve'`)
each call `moveWork(dir, { id, to: 'delivered', ... })` right after their
own precondition already succeeded (a real git merge landed, or a
verify-only re-check passed). None of the three catches a failure from
that call. When it throws, the precondition's real effect (a landed
merge, or a confirmed-green verify) is permanent, but the item's status
never advances past `awaiting-approval`, and — unlike every other
failure branch in the same function (`conflict`, `fgos-write-rejected`,
`verify-fail`) — no friction record is written. The item looks stuck
with zero diagnostic trail.

This item fixes that gap: every `moveWork(...to:'delivered'...)` success
call in `approve` gets guarded so a failure there is caught and made
diagnosable, with a fallback path that stays visible even if the
underlying lock that caused the failure is still contended.

Out of scope: redesigning the merge/lock architecture itself (that is
`tsk-5t3a`'s Harness v2 effort — see refs below), and the `--github`
transport's own `moveWork(...to:'delivered'...)` call (line 2119), which
was not raised by the filed item and is a materially different case (a
GitHub-side merge, not a local git merge/verify) — left to a future item
if the same gap is confirmed there.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Fix covers all three unguarded `moveWork(...to:'delivered'...)` success calls in `case 'approve'`, not just the one the item's original description named: leaf-into-root merge (`bin/fgos.mjs:2223`), root-into-main merge (`bin/fgos.mjs:2297`), and pull-door/legacy verify-only (`bin/fgos.mjs:2327`). All three share the identical shape (success path, unguarded write, no friction on throw); fixing only the merge-landing paths would leave a known, identical gap in the third untouched. |
| D2 | The diagnostic fallback must stay visible even under **sustained** lock contention, not just a one-off blip. The item's original suggestion (reuse the `fgos-write-rejected` friction shape via `addFriction`) is itself another `events.jsonl` write guarded by the same `events.lock` that just threw (`EventLogError('lock-timeout')`, `src/state/events.mjs`) — a same-lock retry can hit the identical failure. The fallback record must not depend solely on that same lock succeeding. |
| D3 | Verified by an automated test using an injectable failure seam that forces `moveWork` to throw at the success point, asserting a diagnosable record appears instead of an unhandled throw + permanently-stuck item — not manual repro only. |

## Pinned terms

- **"success path"** — in `case 'approve'`, the branch reached after
  `mergeRunnerItem`'s outcome is anything other than `conflict`,
  `fgos-write-rejected`, or `verify-fail` (i.e. the merge or verify
  already succeeded), or the pull-door verify-only branch after
  `runGoalCheck` passes.
- **"guaranteed-visible" (D2)** — the diagnostic record must not be lost
  solely because `events.lock` is still held by another writer at the
  moment of the original failure; it may still depend on other
  infrastructure (disk, process survival) being available.

## Scout evidence

- `bin/fgos.mjs:2223` — leaf-into-root merge success:
  `moveWork(dir, { id, to: 'delivered', expectedStatus: 'awaiting-approval', role: 'human' })`
  immediately followed by `cleanupMergedBranch(ephemeral.path, result.branch)`
  — a throw here also skips branch cleanup, leaking the leaf branch.
- `bin/fgos.mjs:2297` — root-into-main merge success: identical shape,
  followed by `cleanupMergedBranch(repoRoot, result.branch)`.
- `bin/fgos.mjs:2327` — pull-door/legacy verify-only success: same
  `moveWork` call, no git merge involved (comment at line 2311: "code is
  already on main"), so a throw here desyncs status only — no hidden
  permanent code mutation, but the same "stuck forever, no friction"
  symptom.
- `bin/fgos.mjs:2119` — the `--github` transport's own
  `moveWork(...to:'delivered'...)` call, structurally similar but explicitly
  out of scope (see Feature boundary).
- `src/state/store.mjs:355` (`moveWork`) calls `withEventsLock` (imported
  from `src/state/events.mjs:30`), which can raise `EventLogError`
  categorized `'lock-timeout'` (`src/state/events.mjs:56-58,286-311`) —
  a real, documented failure mode, not hypothetical. Default timeout is
  2000ms with 10ms retry interval (`src/state/events.mjs:44-48` comment).
- The item's own recorded incident: commit `2766e60` "Merge branch
  fgw/tsk-3wr" landed on `main` while `tsk-3wr` stayed `status:proposed`
  (pre-dating the `delivered` status rename) for many minutes, discovered
  only by manually diffing `git log` against `fgos list`.
- The item's original description cites stale line numbers (`~1824-1884`,
  `line 1873`) and a stale target status (`to: 'done'`) — the codebase has
  since renamed the terminal success status to `delivered` and the
  `approve` case has moved substantially. This CONTEXT.md's line
  references are current as of `905c82b` (branch head at claim time).
- `plans/reports/internal-research-260801-1823-merge-mechanism-grand-orchestrator-design-report.md`
  (line 62, line 260) and
  `plans/reports/internal-design-260802-0907-merge-harness-v2-locked-decisions-report.md`
  (line 176-178) both already classify `tsk-480` as one of 8 mechanical,
  independent Layer-2 bug fixes, sequenced to proceed in parallel once the
  foundational items (`tsk-4voj`, `tsk-2j9`, `tsk-18a`, `tsk-3wq`,
  `tsk-3bn`, `tsk-2eq`) stabilize — informational scheduling context, not a
  recorded `deps` edge on the item itself (`deps: []`).
- Impact-analysis capability gate (`CLAUDE.md`): `fgos tool query
  --capability impact-analysis --status present` returns gitnexus as
  `present` → posture is **full**. Informational only for this
  clarify-stage pass (no code edited here); the `MUST run impact` rule
  applies in full once `fgos-coding-implement` starts editing `moveWork` callers
  in `bin/fgos.mjs`.

## Canonical references

- `bin/fgos.mjs` `case 'approve'` (lines 1989-2328)
- `src/state/store.mjs:355` `moveWork`
- `src/state/events.mjs` `withEventsLock`, `EventLogError`
- `plans/reports/internal-research-260801-1823-merge-mechanism-grand-orchestrator-design-report.md`
- `plans/reports/internal-design-260802-0907-merge-harness-v2-locked-decisions-report.md`

## Outstanding questions deferred to planning

- Concrete mechanism for D2's "must not share `events.lock`'s failure
  mode" fallback (e.g. a separate append-only file, a bounded retry
  before falling back, or something else) — implementation choice, not a
  product decision.
- Where the injectable failure seam (D3) lives (test-only parameter,
  dependency injection, monkeypatch) and what test file it belongs in.
- Whether the `--github` transport's own `moveWork(...to:'delivered'...)`
  call (line 2119, out of scope here per Feature boundary) should get a
  follow-up item once this one lands.
