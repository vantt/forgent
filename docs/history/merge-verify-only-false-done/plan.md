# tsk-15k — plan: fix verify-only merge short-circuit false-done

See `CONTEXT.md` in this same directory for the locked decisions (D1-D3)
this plan builds on. Never reopened here — cited by ID only.

## Mode: high-risk

Flags counted (of: auth, authorization, data model, audit/security,
external systems, public contracts, cross-platform, existing covered
behavior, weak proof, multi-domain):

- **audit/security** — yes. A false `done` on unmerged divergent content is
  a data-integrity failure in the engine's own bookkeeping: main is
  reported to contain content it does not actually contain.
- **public contracts** — yes. `mergeRunnerItem`'s outcome shape
  (`{outcome: 'merged'|'conflict'|'verify-fail'|'fgos-write-rejected', ...}`)
  is consumed by `bin/fgos.mjs`'s approve path; the fix must not silently
  change what existing callers read from a `'merged'` outcome.
- **existing covered behavior** — yes. `mergeRunnerItemLocked`'s
  `isAlreadyMerged` fast path (`src/runner/merge.mjs:701-707`) is already
  exercised by two passing tests (`test/runner/merge.test.mjs:628`,
  `:643`) — any change must keep both green, not just add a new one.
  Modifying working, tested code raises the bar per this repo's own
  quality-gate rule.
- **weak proof** — yes. The item's own `verify` field was unset before
  this session (`"chưa xác định — P15 bổ sung"`); no test today constructs
  a false-positive scenario for this specific path.

4 flags, including a hard-gate one (audit/security, data-loss-adjacent) →
**high-risk** confirmed twice over. A `standard` plan would not honestly
carry the reproduction uncertainty (see risk #1 below) or the
contract-compatibility proof this item actually needs.

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` returned
the `gitnexus` provider as `present` → **full**. Per `CLAUDE.md`'s gate,
`fgos-executing` MUST run `impact({target: "isAlreadyMerged",
direction: "upstream"})` and `impact({target: "mergeRunnerItemLocked",
direction: "upstream"})` before editing either function, and report the
blast radius before proceeding.

## Approach

**Chosen path**: extend `isAlreadyMerged`'s fast path in
`mergeRunnerItemLocked` (`src/runner/merge.mjs:694-707`) with an explicit
integrity check (D1) run before the code trusts `is-ancestor` alone,
alongside a new regression test (D2) in `test/runner/merge.test.mjs`
that constructs the false-positive scenario this item names. Scoped as a
standalone patch (D3) — no dependency on merge-harness-v2's
`driftStatus`/`sync-root` work, which does not exist in code yet.

**Rejected alternative — drop the short-circuit entirely**: considered and
explicitly rejected by the user during clarify (D1). Would reintroduce
tsk-3yl's original crash (`git commit --no-edit` failing with "nothing to
commit" on a genuine retry-after-partial-approve-failure), trading one
real bug for reintroducing an already-fixed one. Not pursued.

**Rejected alternative — fold into merge-harness-v2**: rejected during
clarify (D3). Harness v2's `driftStatus` is a *separate, read-only,
not-yet-built* function for a different purpose (drift reporting across
merge tiers), not a substitute for `isAlreadyMerged`'s own integrity
proof. Folding them would block this item on an unbuilt, unscheduled
design instead of shipping the fix that already has a locked shape.

### Risk map

| # | Component | Risk | Proof point (owned by `fgos-validating`) |
|---|-----------|------|-------------------------------------------|
| 1 | Reproduction of the false-positive | **High** — this session's code reading of `isAlreadyMerged` (`git merge-base --is-ancestor <branch> HEAD`) shows the check is cryptographically sound for the two already-tested cases (genuine prior merge; unrelated post-merge regression). No specific trigger for a *false* positive was found on file for this item (no `view.discovery` verdict, no decision-log entry beyond this session's D1-D3, item description is the only record). This is the plan's central open risk — the exact reproducing scenario is not yet known. | Attempt to construct a failing test in `test/runner/merge.test.mjs` that makes `isAlreadyMerged` return `true` while HEAD's tree does *not* actually reflect all of branch's committed content (candidate shapes to try: branch ref moved/rebased after an earlier partial merge; a merge commit landed via a route where `is-ancestor` reads true through incidental history rather than a real completed merge of *this* branch's current tip). If, after a genuine attempt, no such scenario reproduces, `fgos-validating` must say so plainly and this item's fix becomes a defense-in-depth hardening (an explicit invariant assertion) rather than a literal bug repro — never silently reclassify the item as "no bug" without surfacing that finding. |
| 2 | Integrity-check design (D1) | Medium | New check must reject the constructed failure case from risk #1 while keeping both existing `isAlreadyMerged` tests (`:628` idempotent-merged, `:643` verify-fail-on-regression) passing unchanged. |
| 3 | Contract compatibility | Medium | Every existing caller of `mergeRunnerItem`'s outcome (`bin/fgos.mjs`'s approve path) must keep working against `'merged'`/`'conflict'`/`'verify-fail'`/`'fgos-write-rejected'` unchanged — an added check should surface as one of these existing outcomes (most likely `'verify-fail'` or a documented new sub-case) never a silently different shape. |
| 4 | Regression-test placement | Low | `test/runner/merge.test.mjs` already has an established pattern for this exact fast path (lines 622-656) — extend it there, not a new file. |

### Files likely touched, in order

1. `src/runner/merge.mjs` — `isAlreadyMerged` and/or
   `mergeRunnerItemLocked` (the integrity check itself).
2. `test/runner/merge.test.mjs` — the new regression test (D2), added
   alongside the existing tsk-3yl tests it must not break.

No other files expected — the fix is scoped to this one module and its
existing test file (D3: standalone, no harness-v2 files touched).

## No split

`fgos graph --json` shows tsk-15k as an isolated single-item component
(size 1), not on the critical path, no children. This is one honest piece
of work — proceeds as itself, not decomposed into child items.

**Verify command**: `node --test test/runner/merge.test.mjs`

## Assumptions (unproven, flagged for `fgos-validating`)

- That a genuine false-positive trigger for `isAlreadyMerged` exists and
  is reproducible in a unit test (risk #1) — not yet proven; this plan's
  central unproven assumption.
- That the fix can be expressed as an additional check inside
  `mergeRunnerItemLocked`/`isAlreadyMerged` without needing new state or
  a new outcome value — reasonable given the existing outcome enum, but
  not verified against the as-yet-unknown exact trigger shape.
