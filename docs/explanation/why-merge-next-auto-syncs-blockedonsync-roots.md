# Why `fgos merge next` now auto-syncs a clean `blockedOnSync` root

`fgos merge next` (and `/fgOS:merge-loop`, which calls it repeatedly) used
to look only at `mergeReadiness()`'s `ready` bucket. An `awaiting-approval`
root whose own `fgw/<root-id>` branch had drifted ahead of `main`
(`needsSync: true` in `driftStatus()`) landed in `blockedOnSync` instead,
and `merge next` reported it exactly as if nothing were pending at all —
`{picked: null, reason: 'nothing ready to merge'}` — zero signal that a
real, resolvable block existed. The only way out was a human separately
running `fgos merge list --json` and hand-invoking `fgos sync-root
<root-id>`.

## The real incident that surfaced it

Live-reproduced (`tsk-5q5`, 2026-08-03): `fgos merge list --json` returned
`blockedOnSync: ["tsk-5q5"]`, `ready: []`. `git rev-list --left-right
--count main...fgw/tsk-5q5` showed `570  9` — 570 commits behind, 9 ahead
— confirming `fgw/tsk-5q5` had genuinely drifted and `merge next` had no
way to notice or act on it.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | `merge next` auto-calls `fgos sync-root` on a `blockedOnSync` root when the sync comes back clean (`outcome: 'synced'`), then re-checks readiness and proceeds exactly as it does today. On any of `sync-root`'s existing failure outcomes — `merge-conflict`, Iron Law trip, `fgos-write-rejected`, `verify-fail` — it stops and reports the outcome plainly, never attempting to push past any of them on its own authority. User picked this ("Option B", auto-remediate) over "Option A" (visibility-only) after reviewing `sync-root`'s real failure-mode surface (`bin/fgos.mjs:2719`) — auto-remediation only ever automates the already-safe, already-gated path; every genuinely risky outcome still stops for a human exactly as `approve`'s Iron Law path already does. |
| D2 | `merge next` stays a **single mutation per call** — matches the existing D6 contract ("merge next: no parallel merge mechanism", `docs/history/merge-standardization/CONTEXT.md`). When `blockedOnSync` holds more than one root, only the top-ranked one (same `rankImpact` order `ready` already uses) gets a `sync-root` attempt this call; the rest wait for the next call. Chosen over "try every blockedOnSync root in one call" specifically because `/fgOS:merge-loop` calls `merge next` unattended in a tight loop — one call, one real git mutation, stays true whether that mutation is an `approve` merge or a `sync-root` merge. |

## Implementation (commit `363c615`)

- `graph-harness.mjs`: rank-orders `blockedOnSync` the same way
  `ready`/`mergeSets`/`supersededOut` already are, so "top-ranked root"
  means the same thing across every bucket.
- `bin/fgos.mjs`'s `merge next` case: on empty `ready` + non-empty
  `blockedOnSync`, resolves the top-ranked root and attempts `sync-root`
  per D1/D2. `picked` is always the resolved root id on a real attempt,
  never `null` — a blocked outcome here never collides with
  `merge-loop`'s own frontier-empty stop condition, which keys off
  `picked === null`.
- `merge-next`/`merge-loop` skill docs updated to relay and recognize the
  new outcome shapes.

A follow-up commit (`1c5ce73`) fixed the outcome-shape detail directly:
`picked` reports the resolved root id, not `null`, even on a blocked
sync — the distinction D1/D2's design depended on for `merge-loop` to
tell "genuinely nothing to do" apart from "found something, couldn't
finish it this call."

## Terms

- **blockedOnSync** — `mergeReadiness()`'s (`src/state/graph-harness.mjs:93`)
  bucket for an otherwise-candidate `awaiting-approval` item whose
  resolved root (`resolveRoot(view, item.id)`) shows `needsSync: true` in
  the supplied `driftStatus()` snapshot. Always empty unless a caller
  passes `opts.drift`.
- **needsSync** — `driftStatus()`'s (`src/state/drift-status.mjs:93`) own
  flag per root: `aheadOfTarget > 0 && !RESOLVED_STATUSES.has(rootItem.status)`.
- **sync-root** — the existing verb (`bin/fgos.mjs:2719`, built `tsk-50i`)
  that merges a root branch's current tip into its target without
  changing the root item's own status/stage. Reuses
  `mergeRunnerItem`'s lock/verify/Iron-Law path — the same gates
  `approve` already applies to a runner-sourced item.

## Related

- `docs/history/merge-next-auto-sync-root/CONTEXT.md` — full decision
  record and scout evidence.
- `docs/explanation/why-fgos-added-sync-root-and-drift-detection.md` —
  where `sync-root`/`driftStatus` themselves came from; this item reuses
  both as-is, folding the manual step into `merge next`'s own flow.
- `docs/history/merge-standardization/CONTEXT.md` — D6, the
  "merge next: no parallel merge mechanism" contract this item's D2
  extends.
