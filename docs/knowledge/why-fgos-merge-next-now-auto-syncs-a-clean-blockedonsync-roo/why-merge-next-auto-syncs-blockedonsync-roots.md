---
type: explanation
title: Why `fgos merge next` now auto-syncs a clean `blockedOnSync` root
source_capture_ids: [tsk-4qu]
framework: diataxis
mode: explanation
---
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

A second follow-up (`tsk-66t`) added a new blocked reason to D1's
enumerated failure surface: `sync-root`'s no-parent branch (the one that
merges directly on the shared main checkout, not the `item.parent`
ephemeral-worktree branch) previously had no clean-tree precondition at
all — a dirty checkout let the merge commit silently sweep in another
session's staged changes. The new gate throws the same way the Iron Law
gate does, and `merge next`'s existing Iron-Law-recognizing `catch` block
(this file's own `bin/fgos.mjs`'s `merge next` case) gained one more
branch for it, reporting `{picked: rootId, blocked: 'dirty-tree', message,
syncRoot: {id: rootId}}` — the same shape every other blocked reason here
already uses, so `merge-loop/SKILL.md`'s own same-id-blocked-twice rule
needed no change to recognize it.

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

## A blind spot this mechanism has by design (`tsk-4qu`): a resolved root's drift is invisible to every bucket

`needsSync`'s own formula (`aheadOfTarget > 0 &&
!RESOLVED_STATUSES.has(rootItem.status)`) deliberately excludes a root
whose own status is already resolved — `blockedOnSync` was built to
catch an *active* `awaiting-approval` root drifting from its target, not
a root that has already finished. That exclusion has a real, silent
consequence this doc's own mechanism never covers: once a root reaches
`delivered`/`retrospective`/`cleanup`/`done`, a leaf approved *after*
that point still always merges into `fgw/<root-id>` (`graph-harness.mjs`'s
`mergeTier` reads `item.parent` alone, never the root's own status) — but
`needsSync` reports `false` for that now-resolved root, so the branch
never enters `blockedOnSync`, and `merge next`'s auto-sync (this doc's
whole subject) never fires for it either. The leaf's real, delivered work
sits on a branch nothing carries forward, invisible to every bucket
`fgos merge list` reports.

Observed live twice before anything reported it: `tsk-4ns` landed on
`fgw/tsk-5wz` after `tsk-5wz` had already gone `retrospective`, and
independently `tsk-53n` landed on `fgw/tsk-1o7` after `tsk-1o7` had
already reached `cleanup` — the second instance itself a leaf whose own
root (`tsk-1o7`) was *itself* also stuck the same way, one gap nested
inside another. Both times, `fgos merge list --json` showed every bucket
empty while real, delivered work sat outside `main`; the only way out
was `fgos sync-root <root-id>` typed by hand, with nothing telling
anyone to type it.

**The fix stayed deliberately narrow**: `checkRootDrift` (the doctor
check) already printed the right remedy instruction — it just filtered
this exact case out. It now reports both drift classes (an active root
still needing its normal sync, and a resolved root stuck outside its
target) with distinct messages. `needsSync` itself, and `merge next`'s
own auto-sync behavior this doc describes, were deliberately left
unchanged: `merge next` acts on `blockedOnSync` by running a real,
unattended `sync-root` git mutation, and auto-merging the branch of an
already-closed-out item is a behavior change nobody asked for on the
riskiest path in the system. `driftStatus` already measured the honest
`aheadOfTarget` count for these roots — this was a reporting-filter fix,
not a new measurement, pinned by a new test so a later "simplification"
that skips resolved roots fails loudly instead of silently dropping the
data source again.

## Related

- `docs/history/merge-next-auto-sync-root/CONTEXT.md` — full decision
  record and scout evidence.
- `docs/explanation/why-fgos-added-sync-root-and-drift-detection.md` —
  where `sync-root`/`driftStatus` themselves came from; this item reuses
  both as-is, folding the manual step into `merge next`'s own flow.
- `docs/history/merge-standardization/CONTEXT.md` — D6, the
  "merge next: no parallel merge mechanism" contract this item's D2
  extends.
