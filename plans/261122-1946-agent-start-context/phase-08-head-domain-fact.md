# Phase 8: A head's domain fact comes from its bound item

P10's seam part. The composer only reads the domain and never classifies it (ASC-D4). This is the fix that fills
the empty `domains/<domain>`.

## Inputs

- The discussion's P10 row: the domain is decided at intake (`fgos submit --domain`, `fgos-clarifying` step 3) and
  stored as `work.domain`.
- `src/session-host/head-plan.mjs` (`taskOfHead`, about line 213) and `src/session-host/head-start.mjs` after
  phase 5.
- `src/state/domain-registry.mjs` (the vocabulary).

## Footprint

`src/session-host/head-plan.mjs`, `test/session-host/head-plan.test.mjs`, `src/session-host/head-start.mjs`,
`test/session-host/head-start.test.mjs`.

## Steps

1. `taskOfHead` returns the bound item's domain when the item carries one: a work item's `domain`, or a `domain` key
   that the secretary's P10 item may add to backlog rows, plans and discussions. This phase reads that key if it is
   present and never writes it.
2. `head-start.mjs` passes it as the `domain` fact. When no domain is known, the fact is left out. It is never set to
   `coding` by default, and domain-scoped units then do not match.
3. Add tests: a bound work item with a domain produces the fact, and an item without one produces no fact.

## Verify

`node scripts/run-tests.mjs test/session-host/head-plan.test.mjs test/session-host/head-start.test.mjs` passes. The
record of a head started on a work item with `domain: coding` lists the coding-domain units.

## Rollback

Revert the commit. The domain fact disappears, and units scoped to a domain stop matching heads.
