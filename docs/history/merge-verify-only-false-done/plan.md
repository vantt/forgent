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
`fgos-coding-implement` MUST run `impact({target: "isAlreadyMerged",
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

| # | Component | Risk | Proof point (owned by `fgos-coding-validating`) |
|---|-----------|------|-------------------------------------------|
| 1 | Reproduction of the false-positive | **High** — this session's code reading of `isAlreadyMerged` (`git merge-base --is-ancestor <branch> HEAD`) shows the check is cryptographically sound for the two already-tested cases (genuine prior merge; unrelated post-merge regression). No specific trigger for a *false* positive was found on file for this item (no `view.discovery` verdict, no decision-log entry beyond this session's D1-D3, item description is the only record). This is the plan's central open risk — the exact reproducing scenario is not yet known. | Attempt to construct a failing test in `test/runner/merge.test.mjs` that makes `isAlreadyMerged` return `true` while HEAD's tree does *not* actually reflect all of branch's committed content (candidate shapes to try: branch ref moved/rebased after an earlier partial merge; a merge commit landed via a route where `is-ancestor` reads true through incidental history rather than a real completed merge of *this* branch's current tip). If, after a genuine attempt, no such scenario reproduces, `fgos-coding-validating` must say so plainly and this item's fix becomes a defense-in-depth hardening (an explicit invariant assertion) rather than a literal bug repro — never silently reclassify the item as "no bug" without surfacing that finding. |
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

## Assumptions (unproven, flagged for `fgos-coding-validating`)

- That a genuine false-positive trigger for `isAlreadyMerged` exists and
  is reproducible in a unit test (risk #1) — not yet proven; this plan's
  central unproven assumption.
- That the fix can be expressed as an additional check inside
  `mergeRunnerItemLocked`/`isAlreadyMerged` without needing new state or
  a new outcome value — reasonable given the existing outcome enum, but
  not verified against the as-yet-unknown exact trigger shape.

## Feasibility validation (`fgos-coding-validating`, this session)

Both assumptions above are now resolved with real, executed evidence —
neither is "unproven" anymore.

### Reality gate

| Dimension | Result | Evidence |
|---|---|---|
| Mode fit | PASS | high-risk confirmed correct — the bug is real, not hypothetical (see repro below), and still carries the same 4 flags from `fgos-coding-planning`. |
| Repo fit | PASS | Every path/function this plan cites was read directly: `isAlreadyMerged` (`src/runner/merge.mjs:682-692`), `mergeRunnerItemLocked` (`:694-707`), `changedFiles` (`:316-330`), existing tests (`test/runner/merge.test.mjs:622,628,643`). |
| Assumptions | PASS | See "Central risk #1 — proven" below. |
| Smaller path | PASS | No smaller mode overlooked. The confirmed fix (content-diff check via the already-existing `changedFiles` primitive) is well-contained, but the surrounding proof (contract compatibility, not regressing 2 existing tests, audit implications) still legitimately needs high-risk's fuller map. |
| Proof surface | PASS | `node --test test/runner/merge.test.mjs` run for real just now: **51/51 passing**, confirmed baseline before any fix lands. |
| Impact-analysis posture | PASS | Re-queried `fgos tool query --capability impact-analysis --status present` this session — still returns `gitnexus`/`present` → `full`, matching this plan's recorded posture exactly (no drift since `fgos-coding-planning` ran). |

### Central risk #1 — proven, not hypothetical

Constructed the scenario directly against a real repo and the actual
`mergeRunnerItem` code (not a mock):

1. Branch `fgw/demo-item` commits real content (`produced.txt`).
2. `git merge --no-ff -s ours fgw/demo-item` on `main` — the `-s ours`
   strategy keeps `fgw/demo-item` as a real second parent (so
   `git merge-base --is-ancestor` reports `true`) while discarding 100%
   of the branch's tree content. Confirmed empirically:
   `git ls-tree -r --name-only HEAD` after this merge shows only
   `base.txt` — `produced.txt` is absent.
3. Called the real `mergeRunnerItem(repoRoot, item)` from this exact
   checkout's `src/runner/merge.mjs` against that repo state:
   - `item.verify = 'test -f produced.txt'` (a verify scoped to the
     item's own artifact) → `outcome: 'verify-fail'`, correctly caught.
   - `item.verify = 'true'` (a generic/weak verify, not scoped to the
     item's own artifact) → **`outcome: 'merged'`**, `check.passed: true`
     — the false-done case, reproduced for real.

This confirms the bug's exact shape: `isAlreadyMerged`'s fast path
trusting bare ancestor-reachability is not itself wrong (ancestry is a
real git invariant), but it is *insufficient alone* whenever the item's
own verify command isn't scoped to the content the branch actually
introduced. The gap is real and does not depend on any hypothetical
edge case — any actor producing an ancestor-true-but-content-discarded
merge commit (a manual `-s ours` resolution being the concrete case
constructed here) triggers it, combined with the pre-existing "weak
proof" flag (item verify commands are not guaranteed to be scoped to
their own branch's changed files).

### Feasibility matrix

| Assumption / risk | Risk | Proof required | Evidence found | Result |
|---|---|---|---|---|
| A real false-positive trigger exists (risk #1) | High | A constructed failing scenario against real code | Empirical repro above — real `mergeRunnerItem` call returned `outcome: 'merged'` on genuinely discarded content | **PASS** |
| Integrity-check design (D1) is buildable without inventing new primitives | Medium | An existing, reusable content-diff primitive | `changedFiles(repoRoot, item, opts)` (`merge.mjs:316-330`) already computes `git diff --name-only trunk...branch` — the exact shape a content-parity check needs (diff branch's own changed paths against HEAD) | **PASS** |
| Fix stays contract-compatible (no new outcome value forced) | Medium | Confirm every consumer of `mergeRunnerItem`'s outcome | `bin/fgos.mjs` only branches on the 4 existing literal outcome strings (`'merged'`/`'conflict'`/`'fgos-write-rejected'`/`'verify-fail'`, lines 2114/2176/2189/2202/2250/2267/2280) — mapping the newly-caught case to `'verify-fail'` requires zero changes there | **PASS** |
| Regression test fits the existing file's pattern (D2) | Low | An established pattern to extend | `test/runner/merge.test.mjs:622-656` already has the tsk-3yl idempotent-merge tests in the identical shape a new test would extend | **PASS** |

### Verdict

**READY.** Every reality-gate dimension and every medium+ risk row has
real, executed evidence — no plausibility language, no open gap. The
central uncertainty this plan flagged (whether the bug is real at all)
is resolved: it is, concretely, and the fix's building block
(`changedFiles`) already exists in the codebase.
