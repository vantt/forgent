# plan.md — tsk-2q8

Mode: **standard**. Flag count: 3 — data model (the `blocked` park's `reason`
recording changes shape for this cause), public contracts (`fgos catchup`'s
eligibility surface changes), existing covered behavior (`CATCHUP_REASONS`
and `checkMergeStillResolves`'s ref-exists-ancestry-fails path both have
regression-guard tests today). No hard-gate flag applies (no auth, no data
loss, no audit/security surface, no external provider, and this does not
remove any existing validation — it only admits one more case into a path
that still re-merges and re-verifies for real, per D2/D3). Not `tiny`/
`small`: the area has a real incident track record (four prior sibling
fixes in the same file — tsk-577, tsk-3ft, tsk-psb, tsk-5j0) and this
item's own D2 finding below changes the shape of the fix mid-plan, which a
`small` lane's "no gray areas" bar does not honestly cover.

## Approach

Chosen path: admit a cleanup-origin `blocked` item into `fgos catchup`
(D2/D3 of `CONTEXT.md`) instead of writing a new verb. Rejected: a new
`resync-sha` verb (D2 explicitly rejects this — the git-merge-and-reverify
mechanics already exist in `performCatchUp`); a new `blocked -> delivered`
target-status code path (D3 explicitly rejects this — accepted the
`awaiting-approval` relap instead).

**New finding this step (not yet in CONTEXT.md — checked whether it's
material below):** read `bin/fgos.mjs:1616-1629` (the `cleanup` verb's own
blocked-park call) directly. It parks a cleanup-harness failure as:

```js
const reason = [...assessment.notReadyYet, ...assessment.failed].join('; ');
moveWork(dir, { id, to: 'blocked', expectedStatus: 'cleanup', reason, role: 'system' });
```

`reason` here is the FULL human-readable diagnostic text (e.g.
`checkMergeStillResolves`'s own `detail`, including the `git reflog show`
hint) — never a short enum. `moveWork`/`transitionWork`
(`src/state/store.mjs:487`) has exactly one `reason` field, no separate
structured-category field. This is different from the merge/approve inbound
gate's own blocked-park (`bin/fgos.mjs:3612` etc.), which already writes
short enum values (`'merge-conflict'`, `'verify-fail-post-merge'`, …) —
those are what `CATCHUP_REASONS` (`bin/fgos.mjs:4401`) actually matches
against today.

So "add a structured marker" (D2) cannot mean replacing `reason`'s rich
text with a short enum — that would silently delete the diagnostic detail
a human currently reads via `fgos show <id>` (the `git reflog show` pointer
tsk-3ft specifically added). The two real shapes this could take:

- **(i) Tag the existing reason text with a stable, matchable prefix**
  (e.g. always start a cleanup-harness-caused block's `reason` with a fixed
  short tag before the free-text detail), and have `CATCHUP_REASONS`'
  check become a prefix/pattern match instead of exact-Set-membership for
  this one case.
- **(ii) Gate on transition origin instead of `reason` content at all** —
  since this failure mode can ONLY be produced by a `cleanup -> blocked`
  edge (`bin/fgos.mjs:1628`'s own `expectedStatus: 'cleanup'`), `catchup`
  could instead read the item's most recent transition event
  (`readRawEvents`/`rebuildView`, already available in-process) and check
  whether the CURRENT `blocked` state was entered `from: 'cleanup'`, never
  parsing `reason` as a matchable key at all. This keeps `reason` free-text
  and human-only, and needs no new field or convention.

Both are real, implementable options; picking between them is genuinely
still open and affects `fgos-coding-validating`'s proof point below —
**not resolved here** (see Risk map). This is NOT a material `CONTEXT.md`
gap per step 6's filter: it does not change tsk-2q8's own scope, behavior
contract, or acceptance criteria (either shape achieves exactly D2's
stated goal — admit a cleanup-origin `system-error` park into catchup
without also admitting runner-crash/anti-loop parks) — it is purely an
implementation-shape choice `CONTEXT.md` correctly left unaddressed. Pinned
as an Assumption below, not sent back to exploring.

Files likely touched:
- `bin/fgos.mjs` — the `cleanup` verb's blocked-park call (`~1616-1629`,
  option (i) only) and/or the `catchup` verb's eligibility check
  (`~4401-4407`, both options).
- `test/state/cleanup-harness.test.mjs` and/or a CLI-level catchup test
  (need to locate the existing catchup test file at validating time) — a
  new regression case: a cleanup-origin `blocked` item with a still-live
  `fgw/<id>` branch and a genuinely-resolvable ancestry gap (the `tsk-2sr`
  shape) reaches `awaiting-approval` via `fgos catchup`.

Order: single piece, no cross-piece sequencing — `fgos graph --json`
skipped `topUnblock` for this repo scale; not meaningful for a one-piece,
no-split item anyway (see Shape below).

Impact-analysis posture (`fgos tool query --capability impact-analysis
--status present`, checked in `CONTEXT.md`'s Scout evidence): `gitnexus`
present. GitNexus's own index is flagged stale in this session's tool
output (`c0cedaa` last indexed) — per `CLAUDE.md`'s gate, this is **degraded**
posture, not full: the blast-radius evidence below is not GitNexus-verified,
it is direct `rg`/`Read` on the two touched files, cross-checked by hand
(the CLAUDE.md gate's own required fallback when a `present` status can't
be trusted blind).

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| Eligibility gate shape (option (i) tag-prefix vs (ii) transition-origin) | Medium — wrong choice either silently loses diagnostic text (i, done carelessly) or requires an event-log read at a call site that today only reads `view.work[id]` (ii) | `fgos-coding-validating`: read `catchup`'s current imports/available context to confirm which shape is cheaper to implement correctly; pick one, record as a new D-ID if it changes a locked decision's framing |
| `CATCHUP_REASONS` widening scope | Medium — a too-broad match (e.g. a naive substring match on `reason`) could admit an unrelated `system-error` park (runner-crash, anti-loop-max-visits) into the merge-retry path, exactly the failure D2 exists to prevent | `fgos-coding-validating`/`fgos-coding-implement`: the new regression test must include a NEGATIVE case — a `blocked` item with an unrelated `system-error` reason (e.g. `runner-crash-reclaim`) must still be REJECTED by `fgos catchup` |
| `performCatchUp`'s merge mechanics against a genuinely rebased parent branch | Light — `performCatchUp` already merges `target` into the item's own branch and re-verifies before accepting; this is exactly the tested, existing mechanism (`bin/fgos.mjs:4446`), only the eligibility gate is new | `fgos-coding-implement`: run `fgos catchup tsk-2sr` for real (its branch `fgw/tsk-2sr` is confirmed still live, `CONTEXT.md` Scout evidence) as part of verify, not just a synthetic test repo |

## Shape

No split — one honest piece of work (direction (c) already split into
`tsk-597z` per `CONTEXT.md` D4). This item:

1. Decide and implement the eligibility-gate shape (option (i) or (ii)
   above) in `bin/fgos.mjs`.
2. Add the regression test pair (positive: `tsk-2sr`-shaped cleanup-origin
   block recovers via catchup; negative: an unrelated `system-error` block
   is still rejected).
3. Verify against the real, still-live `fgw/tsk-2sr` case.

Assumptions:
- The eligibility-gate shape choice (i vs ii) is an implementation detail,
  not a product decision — deferred to `fgos-coding-validating`/
  `fgos-coding-implement`'s own judgment, not a `CONTEXT.md` gap (see
  Approach above).
- `fgw/tsk-2sr` remains live through implementation (confirmed live as of
  2026-08-14 in `CONTEXT.md`'s Scout evidence) — if it gets pruned before
  this item reaches `executing`, the live-branch verify step degrades to
  the synthetic-repo test only; this does not change the fix itself.

## Outstanding questions

None
