# tsk-28x — plan.md (risk map, RUL58/tsk-2p6 evidence)

`risk: heavy`. Full plan lives at
`plans/260825-1841-knowledge-registry/plan.md` + 12 phase files
(`phase-01-registry-domain-model.md` … `phase-12-deprecate-compound.md`),
written for an agent with no conversation context and already executed
(commit `5c948d2a`). This file is the risk-map summary RUL58/tsk-2p6
requires under `docs/history/tsk-28x/` — content mirrors the real plan,
never a hand-waved pointer.

## Problem

`fgos-coding-compounding` picked end-user doc filenames/paths ad hoc and
decided grow-vs-create by `fs.existsSync` alone. Measured on `main`
2026-08-25: 268 docs, +50/7 days (~7.1/day), 28% touch ≥2 entities in the
filename itself, visible topic-duplicate clusters. The existing anti-dup
mechanism (`fgos authoritative-match`, tsk-1lv-6) covers only ~20% of
docs and has no caller outside its own unit test.

## Four locked invariants (no phase may violate)

1. `activeDoc(topicId, role) <= 1` (D-tsk28x-14).
2. No second active doc for the same role at write time; splitting a
   topic requires a real `topic.split` with lineage (D-tsk28x-14).
3. `docPath` is history, never edited in place — every lookup resolves
   `oldPath -> currentPath` (D-tsk28x-9).
4. Lifecycle is `provisional | active | superseded | retired`; `draft`
   belongs only to the material layer, never the doc layer (D-tsk28x-15).

## Risk map — why `heavy`

- Touches the core CLI entrypoint (`bin/fgos.mjs`, 4200+ lines) across 4
  phases (05/06/07/12) — 5 real footprint-conflict pairs, 2 missed by
  manual analysis (`src/cli/command-registry.mjs`,
  `src/setup/checks.mjs`), resolved via explicit `deps` sequencing
  (engine-detected via `fgos plan`, not hand-analyzed).
- Migrates ~268 existing end-user docs with a conservation gate (every
  old file accounted for exactly once, no silent data loss) — phase 11,
  dry-run before apply.
- Adds a producer-door enforcement gate (`fgos knowledge attest`) that
  can reject writes repo-wide once live — phase 06.

## Three hard build-order gates

1. Phase 03 (classifier/inventory, read-only over 268 docs) before phase
   04 (bootstrap) — bootstrap has no data to seed from otherwise.
2. Phase 06 (attest gate/enforcement) before phase 09 (writer skill) —
   enforcement must exist before the writer is pointed at it.
3. Phase 10 (writer canary) green before phase 11 (migration) — migration
   only proceeds once the new writer path is proven end-to-end.

## Phases (see `plans/260825-1841-knowledge-registry/plan.md` for the full table + dependency graph)

01 domain model+reducer -> 02 resolver / 03 classifier (parallel with 01) ->
04 bootstrap -> 05 CLI verbs -> 06 attest gate -> 07 consumers-via-resolver /
08 projections+doctor -> 09 writer skill -> 10 writer canary -> 11 migration
dry-run/apply -> 12 deprecate `fgos compound`.

## Acceptance

- `npm test` green (all new harnesses included).
- `fgos doctor` green, including the 8 new knowledge doctor checks.
- `fgos doc-sources <oldPath>` still resolves after migration.
- Total reachable source captures unchanged before/after migration.

## Rollback

Every phase is additive except phase 11 (migration, gated dry-run-then-
apply) and phase 12 (deprecation warnings only, no removal). A red
`npm test`/`fgos doctor` after landing reverts the single commit
(`5c948d2a`) plus its Iron Law evidence follow-up (`5aed1ad9`) — no
partial-migration state possible since phase 11's own conservation gate
refuses to apply on an unclean dry-run.
