# Phase 8: A head's domain fact comes from its bound item

P10's seam part. The composer only reads the domain and never classifies it (ASC-D4). This is the fix that fills
the empty `domains/<domain>`.

## Inputs

- The discussion's P10 row: the domain is decided at intake (`fgos submit --domain`, `fgos-clarifying` step 3) and
  stored as `work.domain`.
- `src/session-host/head-plan.mjs` (`taskOfHead`, line 213) and `src/session-host/head-start.mjs` after phase 5.
- `src/state/domain-registry.mjs` (the vocabulary).
- Portfolio items carry no domain today: 0 of 534 backlog row files and 0 plans have a `domain:` key (checked on
  `2c27d499a`). Where an item's domain will live may be settled by the open discussion `ds-ubqlutna6r` (a
  domain-agnostic item component); read its current state first and follow its field name if it is settled.

## Footprint

`src/session-host/head-plan.mjs`, `test/session-host/head-plan.test.mjs`, `src/session-host/head-start.mjs`,
`test/session-host/head-start.test.mjs`, `packages/agent-start-context/goldens/**` (the domain fix in the head
goldens). It runs after phase 7, because both update goldens.

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

## Result (2026-11-27, fg-server)

Done. The field is `domain` in the item's frontmatter, the name settled by discussion `ds-ubqlutna6r` (A8, owner
2026-11-25).
- `planOfHead` reads it from the `plan.md` it already parses at the trunk tip.
- `discussionOfHead` reads it from `DISCUSSION.md` (port `readDiscussion`).
- `taskOfHead` carries it, and `headStartRequest` sets the `domain` fact only when it is present.

No plan or discussion names a domain yet, so today's heads get no domain fact until intake writes one. The owning
proofs are the `taskOfHead` case in `test/session-host/head-plan.test.mjs` and the `headStartRequest` case in
`test/session-host/head-start.test.mjs`. The golden `shaper-task-coding` shows change 1, the filled
`domains/coding/`.

