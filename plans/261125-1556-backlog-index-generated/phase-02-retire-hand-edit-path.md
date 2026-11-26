---
phase: 2
title: Retire the hand-edit path and the Node twin
status: draft
capability: code:implement
---

# Phase 2: Retire the hand-edit path and the Node twin

No head may write `plans/backlog.md` any more, no skill tells it to, and the Node copy of the generator and of the
drift check go away.

## Inputs

- `plans/261125-1556-backlog-index-generated/plan.md` (Prior art; Authority map rows for the grants).
- `packages/session-host/contracts/head-permissions.v1.json`: the two rows whose `writes` are
  `["plans", "plans/backlog.md", "plans/backlog/*"]` (secretary and supervisor).
- `src/session-host/head-grants.mjs` (comments or constants naming `plans/backlog.md`).
- Owning tests: `test/session-host/head-grants.test.mjs:14`, `test/session-host/head-start.test.mjs:377`,
  `packages/session-host/rust/tests/permissions.rs:196` (the `coordinator` grant list).
- `packages/portfolio/index-generator.mjs`, `packages/portfolio/portfolio-check.mjs` (its import of
  `generateBacklogIndex` and the index drift part), `test/portfolio/portfolio-check.test.mjs` (the
  `generateBacklogIndex` cases near lines 204 and 303, the stale-index case near 511).
- `core/skills/fgos-secretary/SKILL.md`, the step that adds a row to `plans/backlog.md` (copy the index, `git
  hash-object`, `session write plans/backlog.md --base`), and `core/skills/fgos-supervisor/SKILL.md`, the sentence
  "write `plans/backlog.md` with `fgos session write plans/backlog.md < new`; it is a read-only file grant".
  Line numbers moved since the first draft; find them with `rg -n 'plans/backlog\.md'`.

## Files it may write (footprint)

`src/session-host/head-grants.mjs`, `packages/session-host/contracts/head-permissions.v1.json`,
`packages/session-host/rust/tests/permissions.rs`, `test/session-host/head-grants.test.mjs`,
`test/session-host/head-start.test.mjs`, `packages/portfolio/index-generator.mjs` (deleted),
`packages/portfolio/portfolio-check.mjs`, `test/portfolio/portfolio-check.test.mjs`,
`core/skills/fgos-secretary/SKILL.md`, `core/skills/fgos-supervisor/SKILL.md`, and the generated copies under
`.agents/skills/fgos-secretary/`, `.agents/skills/fgos-supervisor/`, `plugins/fgOS/skills/fgos-secretary/`,
`plugins/fgOS/skills/fgos-supervisor/` (rebuilt, never hand-edited; after plan `261126-2324` the land door also
regenerates them, so a conflict there is rebuilt at land).

## Steps

1. Remove `plans/backlog.md` from the secretary and supervisor `writes` in `head-permissions.v1.json`; fix any comment
   in `head-grants.mjs` that names it. Update the three owning tests to expect `["plans", "plans/backlog/*"]`, and in
   `head-grants.test.mjs` assert `plans/backlog.md` is refused `path-not-granted` for both roles while
   `plans/backlog/<id>-<slug>.md` stays allowed (extend the existing case; do not add a second one).
2. Delete `packages/portfolio/index-generator.mjs`. In `portfolio-check.mjs` remove the import and the index drift
   part; in its test retire the `generateBacklogIndex` and stale-index cases (behaviour moved to the Rust generator,
   whose owning proof is in `apps/fgos/tests/portfolio_check.rs`), keeping every other case.
3. Skills: the secretary adds a backlog item by writing the one row file `plans/backlog/<id>-<slug>.md` (path from
   `fgos convention path`) with `fgos session write`, never the index; the index is rendered by the land door. Remove the
   copy-the-index, `git hash-object` and `--base` steps that only served the index edit. The supervisor skill's "write
   `plans/backlog.md` with `fgos session write`" becomes "the land door renders `plans/backlog.md`; write only row
   files". Then `npm run build:skills`.

## Verify

```bash
node --test test/session-host/head-grants.test.mjs test/session-host/head-start.test.mjs test/portfolio/portfolio-check.test.mjs
cargo test -p fgos-session-host --test permissions
npm run build:skills && git diff --exit-code -- .agents/skills plugins/fgOS/skills ':!*/fgos-secretary/*' ':!*/fgos-supervisor/*'
rg -n "plans/backlog\.md" core/skills/fgos-secretary core/skills/fgos-supervisor src/session-host packages/session-host
rg -n "generateBacklogIndex|index-generator" packages src test
```

Pass: tests green; the rebuild changes only the two skills' generated copies; the first `rg` prints only lines saying
the land door renders the index (no write instruction, no grant); the second prints nothing.

## Rollback

Revert this phase's commit and rerun `npm run build:skills`.
