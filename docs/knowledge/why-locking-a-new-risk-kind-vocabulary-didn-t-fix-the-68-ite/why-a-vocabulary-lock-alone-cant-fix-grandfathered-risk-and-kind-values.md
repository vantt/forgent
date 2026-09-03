---
type: explanation
title: Why locking a new risk/kind vocabulary didn't fix the 68 items already on disk
tags: []
source_capture_ids: [tsk-6ax]
framework: diataxis
mode: explanation
---
# Why locking a new risk/kind vocabulary didn't fix the 68 items already on disk

`tsk-5wz` locked a new `risk` vocabulary for the `coding` domain
(`light`/`standard`/`heavy`, `DOMAINS.coding.classification`) and
enforced it at the write door. That enforcement only blocks *new*
writes — data already on disk was untouched, and `validateWorkShape`'s
own grandfathering (`touchedFields`, `tsk-1ne` D1/D2) deliberately left
existing values alone so old fixtures could keep proving the
grandfathering mechanism itself worked. The result: 68 items kept their
pre-vocabulary values (`low`/`medium`/`high`) indefinitely, valid by the
schema's own grandfathering rule, invisible to every gate check, and
silently wrong.

## Two independent consumers silently degraded, neither erroring

- **`decompose.mjs`'s human-confirmation gate**: `keywordRiskGate =
  work.risk === 'heavy'` — a strict equality check against exactly one
  string. The 17 items carrying `risk: 'high'` (the old vocabulary's
  equivalent of `heavy`) never tripped this gate at all. A root item
  that should have required human confirmation before being split
  proceeded as if it never carried elevated risk.
- **`priority-formula.mjs`'s risk discount**: `RISK_DISCOUNTS[risk] ??
  RISK_DISCOUNTS.standard` — an unrecognized risk value silently falls
  back to the `standard` discount (`0.85`) rather than erroring. All 68
  items (`low`/`medium`/`high`) landed on the same default discount
  regardless of their real risk, so their priority ranking never
  reflected their actual risk level.

Neither consumer raised an error, logged a warning, or otherwise
signaled that its input didn't match the current vocabulary — both
degraded to a plausible-looking default silently, exactly the failure
shape that makes this class of bug persist for months undetected.

## Why the fix needed three separate pieces, not one

1. **A backfill**, mapping the old values to their real vocabulary
   equivalents (`low → light`, `medium → standard`, `high → heavy`),
   applied through `fgos edit <id> --risk <value>` — the existing
   one-door-write path, never a direct `.fgos/events.jsonl` edit. Applied
   as a main-checkout operation via the CLI verb, same precedent
   `tsk-28o`/`tsk-3fj` already established for this shape of change (not
   riding a `fgw/<id>` branch).
2. **A doctor check** (`work-classification-vocabulary`), registered into
   `src/setup/registrations.mjs`'s check registry per `AGENTS.md`'s own
   install/setup/doctor gate — a new invariant ("no open item may carry
   risk/kind outside its domain's vocabulary") doesn't get to stand alone
   outside that registry; it has to be discoverable by `fgos doctor` the
   same way every other invariant is.
3. **Leaving the vocabulary itself and the fixture tests alone** —
   `backward-compat.test.mjs`/`workflow-stage-graphs.test.mjs`
   intentionally keep legacy values in their fixtures specifically to
   prove the grandfathering mechanism still works; touching those would
   have removed the only live proof that old, ungrandfathered data
   doesn't crash the shape validator.

A vocabulary lock at the write door and a backfill of existing data are
two genuinely separate actions — the first stops the problem from
growing, the second closes the gap already open. Shipping only the first
(as `tsk-5wz` did, correctly scoped to its own item) left the second as
real, unfinished work, discoverable only by directly comparing the
locked vocabulary against a live census of what values actually exist
on disk today — not by reading the enforcement code in isolation.

## Why `work.kind` needed the same treatment despite having no live consumer

9 items also carried stale `kind` values. Unlike `risk`, a repo-wide
grep confirmed `work.kind` has zero live gating/formula consumers today
— every `.kind` reference in `decompose.mjs`/`priority-formula.mjs`
turned out to be the discovery/decompose *verdict's* own `kind` field
(`'decompose'`/`'pass-through'`/`'invalid'`/`'need-human'`), a completely
different object from `work.kind`. Backfilling `kind` anyway changed no
runtime behavior — it was scoped in for data hygiene and doctor
visibility, on the theory that an invariant worth a doctor check is worth
being true of the data it checks, even before any code depends on it.

## Related

- `docs/history/backfill-risk-kind-vocabulary-drift/plan.md` — full plan,
  including the fresh pre-flight census re-run that confirmed the count
  hadn't drifted before the backfill ran.
- `docs/history/intake-classify-after-clarify/plan.md` — `tsk-5wz`'s own
  plan, where the `light`/`standard`/`heavy` vocabulary was originally
  locked.
