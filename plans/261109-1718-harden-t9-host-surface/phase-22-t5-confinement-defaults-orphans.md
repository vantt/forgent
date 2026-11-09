---
phase: 22
title: "T5 fix: the confinement request constructor always sets the mode; confinement owns its orphan judgement and removal"
status: pending
depends_on: ["05 landed if approved, else 04 (layer order)", "26 landed (authority.mjs, cleanup.mjs writer order)"]
parallel: "T5 slot, first wave: beside P06 and P20 (file-disjoint); P10's confinement row switch waits for it"
effort: ~0.5d
net_size: "Node about +35 here (orphan judgement +40, three fallbacks -5); doctor's -70 booked in P10; tests: cases move from the doctor test to the confinement test, about 0 net (estimate)"
---

# Phase 22 - T5 fix: confinement defaults and orphans (authority audit AU-24, AU-07 part)

**Authority moved:** the confinement mode of a request is set once, by `confinement/request.mjs`; "is this confinement home orphaned, and remove it" is judged by confinement (`confinement/cleanup.mjs`), not by a doctor row.

## Context

- **AU-24 (Low).** `request.requirement?.mode ?? 'unconfined'` in `src/runner/dispatch/confinement/authority.mjs:233,437` and `drivers/bwrap.mjs:283`, while `request.mjs:24,245` validates the mode: a missing requirement defaults to the least safe value in three places. `attestation-store.mjs:29` exports `VALID_OUTCOMES`, the same name as the loop table (P20) with another meaning.
- **AU-07.** `confinement-orphaned-resources-reaped` (`src/setup/registrations.mjs`, row near `:3190`, judgement near `:3045-3120`) decides that a home is orphaned (marker pid liveness) and deletes it under `--fix`; its own comment calls `--fix` "the one place that judges it". `src/runner/dispatch/confinement/cleanup.mjs` owns the markers (`readOwnershipMarker`, `readAttemptOwnershipMarker`, `removeEmptyDispatchParent`).

## Requirements

1. The constructor in `request.mjs` always sets `requirement.mode`; the three `?? 'unconfined'` fallbacks go (a request without a mode can no longer reach them). Rename `VALID_OUTCOMES` in `attestation-store.mjs` to `ATTESTATION_OUTCOMES` with its readers.
2. `cleanup.mjs` exports one judgement (`{ deadOwned, emptyShells, loose }` as the row computes today) and one removal over the same judgement; liveness through the T0 process-facts door, not a private check. P10 points the doctor row and its `--fix` at them.
3. No behaviour change for valid requests; no change to what is removed.

## Files

**Modify:** `src/runner/dispatch/confinement/{request,authority,attestation-store,cleanup}.mjs`, `src/runner/dispatch/confinement/drivers/bwrap.mjs`, readers of `VALID_OUTCOMES` from the attestation store (`rg -n "attestation-store" src test`), `test/runner/dispatch/confinement/*` (owning tests).

**Delete:** the three fallbacks.

**Tests to retire:** none here; P10 names the doctor orphan cases that move into the confinement test.

## Steps

1. `rg -n "mode \?\? 'unconfined'|VALID_OUTCOMES" src/runner/dispatch/confinement`; read the doctor row's judgement and list its inputs.
2. Red: a request built without a mode carries the constructor's mode (fails if any path skips it); the orphan judgement on a staged dead-owner home, an empty shell and a loose dir.
3. Implement.

## Validation (focused)

FR `test/runner/dispatch/confinement/*`; on Linux a bwrap smoke through `fgos run` read-only. Land gate.

## Risks and rollback

| Risk | L x I | Mitigation |
|---|---|---|
| A caller built a request by hand and relied on the fallback | L x H | step 1 lists every request construction site; each goes through the constructor or is refused by name |

Rollback: revert the merge commit.
