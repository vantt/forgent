# tsk-2q8 — checkMergeStillResolves has no recovery path for a rebased (not pruned) root branch

## Feature boundary

`checkMergeStillResolves` (`src/state/cleanup-harness.mjs:133-159`) has a
recovery path for a named root ref that was *pruned* (tsk-577: falls back to
checking ancestry against `HEAD`), but none for a named ref that still
*exists* while the recorded sha is no longer its ancestor because the ref
was rebased. Two live occurrences confirmed (`tsk-2sr`/root `tsk-3cx`,
`tsk-4n7`/root `tsk-19y`), both manually unblocked via
`fgos move --override-reason`.

This item's scope is narrowly: **let `fgos catchup` recover a
cleanup-origin `blocked` item caused by this specific gap**, by admitting a
structured, cleanup-harness-specific marker into `CATCHUP_REASONS`
(`bin/fgos.mjs:4401`). It does NOT touch `checkMergeStillResolves`'s
ancestry logic itself, and does NOT build any periodic/automatic sweep —
that is a separate concern, split into `tsk-597z` (D2 below).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Direction "auto-fallback ancestry vs `main`" is dropped entirely — the confirmed `tsk-2sr` evidence shows the recorded sha (`93d8e653`) is unreachable from `main` too (only the rebased replay, `7cd06e83`, is), so this fallback would not even fix the case it targets. It also collides with `tsk-3ft` D2 (`docs/history/tsk-3ft-branchheadatreturn-stale-after-manual-reset/CONTEXT.md`), locked as diagnostic-only for the identical "ref exists, ancestry fails" shape ("divergent history"). Not reopened — no new evidence changes tsk-3ft's own conclusion. |
| D2 | Recovery path is direction (d): reuse the sha-resync mechanism that already exists inside `fgos catchup` (`bin/fgos.mjs:4448`, `moveWork(..., branchHeadAtReturn: result.catchupHead)`) instead of writing a new `resync-sha` verb. Requires (i) a structured park-time marker distinguishing a cleanup-harness/`checkMergeStillResolves` failure from any other `blocked` park — confirmed `parkReason:'system-error'` is the coding domain's generic label for every `blocked` park (`src/state/workflow-stage-graphs.mjs:313-317`), not cleanup-harness-specific, so `CATCHUP_REASONS` cannot safely be widened on it directly (would also admit runner-crash/anti-loop parks into a merge-retry path). |
| D3 | Target status after recovery: **option A** — accept the existing `awaiting-approval` target `fgos catchup` already lands on (`bin/fgos.mjs:4448`), even though a cleanup-origin item re-runs a full approval + retrospective lap for content whose retrospective already exists. No new target-status code path is built. User decision (2026-08-14): simplicity over building and proving a second, untested target. |
| D4 | Direction (c) — a periodic/fix-triggered sweep re-checking `status:blocked` items after an unrelated fix lands (the `tsk-4n7` shape, where an unrelated sync-root later made the ancestry check pass again) — is split out of this item's scope into a new item, `tsk-597z`, created 2026-08-14. It cannot fix `tsk-2q8`'s own repro (a permanently-unreachable rebased sha never becomes an ancestor again no matter how many times the same check re-runs), so bundling it here would leave this item's own acceptance criteria unsatisfiable by half its own code. |

## Pinned terms

- **"Rebased (not pruned)"** = the same shape `tsk-3ft` calls "divergent
  history": the named root ref (`fgw/<rootId>`) still exists, but the
  recorded `branchHeadAtReturn` sha is neither an ancestor nor a descendant
  of the ref's current tip.
- **Direction (d)** = reusing `fgos catchup`'s existing merge-and-reverify
  mechanics (not writing a new verb) to resync a cleanup-origin blocked
  item, gated by a new structured marker rather than the generic
  `system-error` parkReason.

## Scout evidence

- `src/state/cleanup-harness.mjs:133-159` — `checkMergeStillResolves`'s two
  existing fallback branches (pruned-ref → `HEAD`; ref-exists-ancestry-fails
  → none) read in full.
- `docs/history/tsk-3ft-branchheadatreturn-stale-after-manual-reset/CONTEXT.md`
  D2 — locked diagnostic-only stance for the identical shape, with its own
  scout evidence already using an empty `git diff` as proof and still
  declining to auto-recover from it.
- `bin/fgos.mjs:4370-4460` (`catchup` verb) — `CATCHUP_REASONS`
  (`bin/fgos.mjs:4401`) confirmed not to include `system-error`;
  `performCatchUp`'s success path confirmed to always target
  `awaiting-approval` (`bin/fgos.mjs:4448`).
- `src/state/workflow-stage-graphs.mjs:313-317` — `parkReason: {blocked:
  'system-error', ...}` confirmed generic across the whole `coding` domain,
  not cleanup-harness-specific.
- `src/state/status-fsm.mjs:69-158` — legal `blocked` exit edges confirmed:
  `todo`, `doing`, `awaiting-approval`, `delivered`, `wontfix`. No
  `blocked -> cleanup` edge exists (the raw item text's original phrasing
  was technically wrong); `blocked -> delivered` is the FSM's own
  "mechanical retry" door for a `cleanup`-origin park, unused by this item
  per D3 (kept as a documented alternative for a future item that wants
  it).
- `src/runner/loop.mjs:1494` (`runWatch`/`runOnce`) — confirmed a ~5s
  poll-cycle infra already exists, but `runOnce` never reads `blocked`
  items today; relevant to `tsk-597z`, not this item.
- Live check (2026-08-14): `git rev-parse --verify refs/heads/fgw/tsk-2sr`
  resolves to `93d8e653...` — the leaf's own branch, and the recorded sha,
  both still exist, so direction (d) is viable against the item's own real
  repro.
- Independent second-opinion review (Opus agent, 2026-08-14, two rounds)
  confirmed D1's technical reasoning, corrected an earlier framing that
  called (d) "already implemented" (the git-merge mechanics are reusable;
  the marker and target-status decision are real new work — captured as D2
  and D3 above), and confirmed the FSM reading in D2/D4.
- Impact-analysis capability posture (`fgos tool query --capability
  impact-analysis --status present`): `gitnexus` present. No code is
  written by this stage; recorded for the next stage's reference.

## Canonical references

- `src/state/cleanup-harness.mjs` — `checkMergeStillResolves` (untouched by
  this item, per D1/D2 scope).
- `bin/fgos.mjs:4370-4460` — `catchup` verb (the mechanism D2 reuses).
- `src/state/workflow-stage-graphs.mjs` — `parkReason` table (the gap D2's
  marker closes).
- `docs/history/tsk-3ft-branchheadatreturn-stale-after-manual-reset/CONTEXT.md`
  — the locked decision D1 defers to, never reopens.
- `tsk-597z` — the split-off item for direction (c).

## Outstanding questions

None
