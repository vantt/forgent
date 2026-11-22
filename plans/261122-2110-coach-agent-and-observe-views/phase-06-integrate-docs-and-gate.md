# Phase 6: Integrate, docs and gate

Capability: `code:test`. Wave 3. Depends on phases 1-5.

## Inputs

- Every earlier phase file and its landed commit.
- `core/skills/fgos-coach/SKILL.md` (phase 1), `core/skills/fgos-coach/references/views.md` (phase 2) and
  `references/curation.md` (phase 4).
- `packages/observe/rust/tests/coach_views.rs` (phase 2) and `packages/observe/rust/tests/transcript_citations.rs`
  (phase 4, the `rule-evidence` case).
- `docs/platform/observe/spec.md`, `docs/platform/supervision/spec.md`, `docs/reading-map.md`, `CHANGELOG.md`.
- `docs/platform/governance.md#decision-scope-to-holder-table` (where settled facts go).

## Files it may write (footprint)

`core/skills/fgos-coach/SKILL.md`, `packages/observe/rust/tests/coach_views.rs`,
`packages/observe/rust/tests/transcript_citations.rs`, `test/live/coach-run.live.mjs`,
`docs/platform/observe/spec.md`, `docs/platform/supervision/spec.md`, `docs/reading-map.md`, `CHANGELOG.md`, and the
generated render surfaces `.agents/skills/**`, `plugins/fgOS/skills/**` and `.claude/skills/**` (regenerated, never
hand-edited).

## Steps

1. Link `references/views.md` and `references/curation.md` from `SKILL.md`, and replace the phase-1 fallback
   ("until the views land, use `fgos friction rank`") with the view list.
2. Move the `rule-evidence` contract case into `coach_views.rs` so that test covers every file in
   `core/coach/definitions/`. Remove the duplicate assertion from `transcript_citations.rs` and keep its
   source-level cases there.
3. Add the curation case to `test/live/coach-run.live.mjs`. The fixture memory has one duplicate and one
   contradicted entry. The proposed version under `.fgos/observe/private/coach/<run>/` must merge the duplicate and
   mark the contradiction with both sources and dates, and the input memory files must be byte-identical afterwards.
4. Run `npm run build:skills` and commit the regenerated surfaces.
5. Docs, settled facts only:
   - `docs/platform/observe/spec.md`: the private detail store (path, self-ignoring directory,
     `fgos.friction.detail_ref`, `--private-detail`), the coach views directory and its versioning rule, and the
     `fgos.transcript.citation` source. Add one line to its decision-history section citing CA-D3, CA-D4 and CA-D6.
   - `docs/platform/supervision/spec.md`: the `coach-due` row kind and the supervisor's action, citing CA-D2.
   - `docs/reading-map.md`: `core/coach/`, `core/skills/fgos-coach/`.
   - `CHANGELOG.md` `## [Unreleased]`: the coach head and its trigger, the `coach.*` config keys, the
     `--private-detail` flag and private store, and the owner-reaction hook.
6. Run the full gate on the combined tree, and the live coach run once on the host.

## Verify

```bash
cargo test -p fgos-observe --test coach_views
npm test
cargo test --workspace
node scripts/plan-contract-check.mjs --plan plans/261122-2110-coach-agent-and-observe-views
node --test test/live/coach-run.live.mjs   # live; spends tokens
```

Pass: every command exits 0 and `git status` shows no drift in the render surfaces after a second
`npm run build:skills`.

## Rollback

`git revert` of this phase's commit restores the per-phase state. The coach still works without the links, from
phase 1's fallback.
