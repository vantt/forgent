# Phase 8: Question relay is recorded and measured

Capability: `code:implement` (skill text), then `code:test` (the measure).

Closes `p-vquz26ibnn` item (b): time from a question being asked to the owner seeing it.

## Inputs

- `core/skills/fgos-secretary/SKILL.md` (how Miu batches open owner questions in the five-part form).
- The question store's `askedAt` on each question (`fgos questions --json`).
- `metrics record` in the secretary grant accepts `fgos.coordination.*` kinds only (`head-request.mjs`,
  `metricsRecordVerb`).
- Evidence 2026-11-21 21:28: two owner questions sat open over 2 hours unreported.

## Footprint

`core/skills/fgos-secretary/SKILL.md`, `.agents/skills/**` and `plugins/fgOS/skills/**` (regenerated only),
`plans/261122-0118-heads-stable-and-able/reports/question-relay.md`.

## Steps

1. "Seen by the owner" means the secretary's message to the owner that names the question id: her report or batch. A
   question the owner answers before any relay counts as seen at its answer time.
2. Secretary skill: each time Miu relays open owner questions to the owner, she records one
   `fgos.coordination.question-relayed` record per question with `metrics record`, carrying `questionId`, `askedAt` and
   `relayedAt`.
3. Run `npm run build:skills`.
4. Measure: after at least 24 hours with the rule live (and again after phase 10), write `reports/question-relay.md`
   with each question's ask-to-seen time (relay or answer, whichever came first), the median and the maximum, and
   whether a mechanism woke the secretary or the owner's own typing did. Write the measuring commands into the report.

## Verify

`node scripts/run-tests.mjs test/skills/fgos-mirror.test.mjs` passes. The report lists every owner question of the
window with its time.

## Rollback

Revert the phase commit and rebuild the renders. The records are evidence and stay.
