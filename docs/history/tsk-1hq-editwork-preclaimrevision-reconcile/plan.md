# Plan — tsk-1hq: settleClaim CAS refuses legitimate same-writer revision drift

Mode: tiny

Flags counted per `fgos-routing`'s Mode gate: none of auth, authorization,
data model, audit/security, external systems, public contracts,
cross-platform, weak proof, multi-domain apply — this item touches no
code. "existing covered behavior" is the one borderline flag (the area is
`settleClaim`/`revisionDriftIsSelfCaused`), but this plan does not modify
that area, only verifies it — 0-1 flags, a couple of files, one direct
task → tiny. Same reasoning `tsk-2uh` (the prior verified-duplicate of
this exact bug) already applied — see
`docs/history/tsk-2uh-settleclaim-cas-already-fixed/plan.md`.

`CONTEXT.md` D1 (`docs/history/tsk-1hq-editwork-preclaimrevision-
reconcile/CONTEXT.md`) is the locked source of truth this plan follows.

## Approach

**Finding (CONTEXT.md D1, RESEARCH.md Round 1):** the bug this item
reports — `settleClaim`'s CAS check refusing a same-writer's own
legitimate mid-lifecycle writes (`fgos edit`, and the broader `moveStage`
case this item's own discovery found) as if they were a concurrent
conflict — was already fixed by `tsk-1ht` (`d6a2169c`,
`revisionDriftIsSelfCaused` in `src/state/store.mjs`), merged to `main`.
A third independent report of the same bug, `tsk-2uh`, already went
through this identical resolution and closed `delivered` with no code
change, verified via the existing regression suite.

**Live confirmation on this item itself:** this session's own `fgos ask
tsk-1hq ...` call (exploring stage, 2026-08-26T11:01Z), run AFTER
`tsk-1ht`'s fix landed on `main`, hit a real same-writer
`preClaimRevision` drift from this item's own earlier discovery-stage
writes and reconciled cleanly instead of refusing (see CONTEXT.md's Scout
evidence section for the exact log line). This is not just "the same bug
class is fixed elsewhere" — the fix was exercised, live, against this
item's own claim, and worked.

**Chosen path: no code change.** Writing a second fix for an
already-fixed, already-exercised bug would either be a no-op duplicate of
`revisionDriftIsSelfCaused` or a competing mechanism for the same
problem. The honest action here is verification, not implementation:
confirm the existing fix's test coverage still holds, and close this item
as a verified duplicate of `tsk-1ht`.

**Alternatives rejected:** same three alternatives `tsk-1ht`'s own plan
already weighed and `tsk-2uh`'s plan already re-confirmed rejected
(narrowing `getItemDurableRevision`'s hash; trusting single-writer
exclusivity with no event check; dropping the CAS check entirely) — no
new alternative surfaced by this item's own discovery/exploring passes
that those two plans did not already consider.

**Files touched:** none in `src/`, `bin/`, or `test/`. This plan's only
artifacts are `docs/history/tsk-1hq-editwork-preclaimrevision-reconcile/
RESEARCH.md`, `CONTEXT.md`, and this file.

**Risk map:** light. No code changes, so no blast radius to assess — the
`fgos tool query --capability impact-analysis --status present` gate
reports `gitnexus` present (posture: full, per CONTEXT.md's Scout
evidence), but this plan does not lean on blast-radius evidence since
nothing is being changed. The only residual risk is a false "already
fixed" read; covered by re-running the scoped verify below at execute
time, not by an impact-analysis proof point.

**Ordering:** `fgos graph --json` lists tsk-1hq in neither `criticalPath`
nor `topUnblock` — no other item is waiting on this one, no ordering
constraint applies.

## Shape

Single direct action, scaled to `tiny`:

1. Re-run the scoped verify (below) to reconfirm the fix is still green
   at execute time (state may have moved since this planning round).
2. Record the outcome and return the item — no source file needs editing.

Concrete cases already proven by the cited existing tests (not re-proven
here, since no new code is added): same-writer drift across
discover/plan/edit/decision/handoff is reconciled; a genuinely different
writer's drift still refuses; an event with no writer stamp still refuses
(fails closed); side-log-only events (decision, gate-approve) mixed into
the window do not break reconciliation. Plus this item's own live
confirmation above, which the existing suite does not need to re-cover.

## Verify

```bash
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test test/state/runtime-coordination.test.mjs
```

## Outstanding questions

None
