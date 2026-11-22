# Phase 2: Coach views

Capability: `code:implement`. Wave 2. Depends on phase 1 (the coach skill exists and `coach-due` proved the settle
rule in the query grammar). Decision: CA-D3.

## Inputs

- `plans/discussions/ds-abplbwphmm-coach-agent-and-observe-views/DISCUSSION.md`, section 6, table "Coach use cases
  and the view each needs" (U1-U11).
- `core/watcher/definitions/coach-due.query.json` (phase 1: the settle-rule `without` clauses to copy).
- `packages/observe/rust/src/query/model.rs` (grammar), `packages/observe/rust/src/definition/mod.rs` (definition
  loading, `requires`, `params`, `unmeasured`).
- Reused definitions: `domains/coding/observe/definitions/{failure-rate-by-*,plan-failure-rate,m7-first-pass,plan-tokens,run-tokens,phase-time,plan-lead-time,m2-owner-wait,m3-interventions}.query.json`,
  `core/attention/definitions/plan-no-progress.query.json`.
- `packages/observe/rust/tests/definition_test.rs` (how a definition test builds a store and environment) and
  `packages/supervision/rust/tests/definitions.rs` (fixture layout).
- `packages/observe/rust/src/friction.rs` (attributes: kind, layer, class, producer; subject and refs).
- `vantt/pkm`'s `docs/agent-views.md` as the model only: views are named, versioned and held by a contract test.

## Files it may write (footprint)

`core/coach/definitions/friction-hot.query.json`, `friction-cases.query.json`, `friction-by-ref.query.json`,
`fix-effect.query.json`, `friction-returned.query.json`, `token-waste.query.json`, `producer-silence.query.json` and
`coach-outcomes.query.json` (all new), `core/coach/README.md` (new), `core/skills/fgos-coach/references/views.md` (new),
`packages/observe/rust/tests/coach_views.rs` (new: a new boundary, so a new file), and
`packages/observe/rust/tests/fixtures/coach-views/**` (new).

## Steps

1. **Naming and version.** Each view file carries `"name"` equal to its file stem and a `"version": 1` field. If the
   definition loader rejects unknown keys, put the version in the name instead (`friction-hot.v1`). Record which in
   `core/coach/README.md`.
2. **Write the eight views.** All friction views drop settled records exactly as `coach-due` does.
   - U1 `friction-hot`: by `fgos.friction.class`, layer; `count`, `min:ts`, `max:ts`, distinct subjects/refs if the
     grammar has a distinct-count aggregate. If it does not, leave distinct counts out and say so in `views.md`.
     Weekly trend with `bucket: week`.
   - U2 `friction-cases`: one row per record of one signature (`params.signature`), with producer, subject, refs
     (plan, phase, run, session), `ts`, and `fgos.friction.detail_ref` once phase 3 lands. Before phase 3, that
     column is absent and named in `views.md`.
   - U3 `friction-by-ref`: unsettled frictions grouped by ref kind and id.
   - U4 `fix-effect`: per signature with a `filed:` resolve, the count before and after the resolve (`join` or two
     windows anchored on the resolve).
   - U5 `friction-returned`: signatures with a `recorded` after their last `resolved` (`latest_per` plus
     `without ... anchor: before`, or the nearest form the grammar has).
   - U7 `token-waste`: tokens on failed or retried runs per plan and run, built on the attributes `run-tokens` and
     `plan-failure-rate` already use.
   - U10 `producer-silence`: last record per friction layer and per record kind against its own median gap, plus the
     `fgos.observe.health` rejects.
   - U11 `coach-outcomes`: `fgos.coach.proposal` records (phase 1) by route, joined to `filed:` resolves and to
     `fix-effect`.
3. **When the grammar cannot express a view.** Write the closest honest form. Name the gap in `views.md` and record
   one friction of class `coach-query-gap` (layer `observe`). Do not add query features in this phase. CA-D3 reopens
   the projection question only on accumulated gaps.
4. **Reuse list.** In `core/skills/fgos-coach/references/views.md`, list each use case with its view path. For U6, U8
   and U9, list the reused definitions by path, and say U9 returns `unmeasured` until `fgos.question.*` is produced.
   Add the goal each view measures (CA-D5 compass: Ship Faster, Release con người, DoD), matching
   `references/goal-compass.md`.
5. **Contract test.** `packages/observe/rust/tests/coach_views.rs` loads every file under `core/coach/definitions/`
   except `rule-evidence` (phase 4 owns it). For each file it asserts name, version and the exact output column list,
   runs it on the fixture store `fixtures/coach-views/`, and asserts one expected row. It also runs each reused
   definition from step 4 on the same fixture and asserts it answers or returns a named `unmeasured`. A new file in
   `core/coach/definitions/` with no test entry fails the test (list the directory and compare).

## Verify

```bash
cargo test -p fgos-observe --test coach_views
cargo test -p fgos-supervision --test definitions
```

Pass: both exit 0. Every view has a name, a version and a row-shape assertion.

## Rollback

`git revert` of this phase's commit. The coach falls back to `fgos friction rank` and the reused definitions, which is
how phase 1's skill already works.
