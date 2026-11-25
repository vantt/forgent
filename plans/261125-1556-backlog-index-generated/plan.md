---
contract: plan-v1
title: "The backlog index is generated from the row files and never committed: a row lands as one file, the land door renders plans/backlog.md locally, and the head write grant on the index is retired"
status: draft
priority: P1
blockedBy: []
base: 161b3a3af465e55433fcaef996750eddb2ceddf4
footprint:
  - plans/261125-1556-backlog-index-generated/**
  - apps/fgos/src/wiring/portfolio.rs
  - apps/fgos/src/wiring/supervision.rs
  - apps/fgos/src/wiring/session_write_publish.rs
  - apps/fgos/src/wiring/migrate.rs
  - apps/fgos/src/wiring/backlog_index.rs
  - apps/fgos/src/wiring/mod.rs
  - apps/fgos/src/routing.rs
  - apps/fgos/src/cli_projector.rs
  - apps/fgos/tests/portfolio_check.rs
  - apps/fgos/tests/session_write_publish.rs
  - apps/fgos/tests/migrate_portfolio.rs
  - apps/fgos/tests/backlog_index.rs
  - packages/supervision/rust/src/land.rs
  - packages/supervision/rust/tests/land.rs
  - packages/host-runtime/contracts/command-routes.json
  - packages/host-runtime/contracts/command-manifest.json
  - packages/portfolio/index-generator.mjs
  - packages/portfolio/portfolio-check.mjs
  - test/portfolio/portfolio-check.test.mjs
  - src/session-host/head-grants.mjs
  - packages/session-host/contracts/head-permissions.v1.json
  - packages/session-host/rust/tests/permissions.rs
  - test/session-host/head-grants.test.mjs
  - test/session-host/head-start.test.mjs
  - core/skills/fgos-secretary/SKILL.md
  - core/skills/fgos-supervisor/SKILL.md
  - .agents/skills/fgos-secretary/**
  - .agents/skills/fgos-supervisor/**
  - plugins/fgOS/skills/fgos-secretary/**
  - plugins/fgOS/skills/fgos-supervisor/**
  - packages/component-authority/model/doors/render-the-backlog-index.yaml
  - plans/.gitignore
  - plans/backlog.md
  - docs/platform/runner/decisions/h-36d872fbb0e5.md
  - docs/platform/supervision/spec.md
  - docs/platform/session-host/spec.md
  - docs/platform/agent-confinement/spec.md
  - docs/decisions/index.md
  - CHANGELOG.md
source:
  - plans/discussions/ds-6z4rfn6kv5-backlog-index-generated/DISCUSSION.md
  - p-o4iniqvitl
created: 2026-11-25
---

# The backlog index is generated, never committed

Mode: standard. Source: the settled discussion `plans/discussions/ds-6z4rfn6kv5-backlog-index-generated/DISCUSSION.md`
and its row `p-o4iniqvitl` (owner choice A, 2026-11-25, confirmed to the secretary). First of the five ordered plans:
it lowers writes to main for the others.

## Prior art (what exists, what is missing)

Most of the machinery already exists; this plan reshapes it rather than adding a generator.

- **One Rust generator exists and is reused:** `generate_backlog_index` in `apps/fgos/src/wiring/portfolio.rs`
  (sort by priority, created, id; Citing column from discussions and plans whose `source` names the row). It stays the
  only generator.
- **The index is committed today by two writers**, which is why every row add rewrites the 546-line file and why one
  bad row anywhere refuses unrelated lands (`land-backlog-index-failed`, owner question q-3rhc6lroqc):
  - `refresh_backlog_index` in `apps/fgos/src/wiring/session_write_publish.rs` regenerates and commits the index with
    every row written through `fgos session write`;
  - `close_cited_items` in `packages/supervision/rust/src/land.rs`, through `BacklogPort.index`
    (`apps/fgos/src/wiring/supervision.rs::backlog_index`), regenerates and commits it when a plan turns `done`.
  Both go through `generate_backlog_index_for_commit` and `CommitIndexError`, which retire here.
- **A drift check holds the committed copy:** `check_portfolio`'s `check_index` option (`index-missing`,
  `index-drift`). With no committed copy it has nothing to hold; it retires.
- **A hand-edit path exists:** the secretary and supervisor grants name `plans/backlog.md`
  (`packages/session-host/contracts/head-permissions.v1.json`, `src/session-host/head-grants.mjs`, added by row
  p-dw3h5wscns after owner question q-nudu6zlusf), and both skills tell the head to edit a copy of the index and
  `session write` it. Retired: the grant line and the skill text.
- **A Node twin of the generator** (`packages/portfolio/index-generator.mjs`) and of the drift check (in
  `packages/portfolio/portfolio-check.mjs`) have no production caller, only `test/portfolio/portfolio-check.test.mjs`.
  The generator twin and the drift part retire (one door); the rest of the Node check is out of scope (see Risks).
- **Unaffected, kept as is:** `scripts/check-backlog-reconciliation.mjs` and `scripts/check-decision-citation-drift.mjs`
  already read the row files under `plans/backlog/`, never the index. `src/runner/merge.mjs` only cites a row id in a
  comment. `src/session-host/head-start.mjs` tells a head to read `plans/backlog.md`, which stays true because the
  land door keeps the main checkout's copy fresh (phase 1); its line is not changed.
- **Missing:** a way to render the index when nothing landed (a fresh clone): the verb `fgos backlog-index`
  (phase 3), shaped like its sibling `fgos decision-index`.

## Decisions taken here

1. **The index is not committed.** "Adding a row lands exactly one new file" and the reason given in the row (the
   shared file is hot and conflicts) rule out a committed index that every row rewrites. `plans/backlog.md` is ignored
   by a `plans/.gitignore` and removed from the Git index. This amends D-ADR0082 point 1 ("a generated, committed
   index") and the "stale index" clause of point 5; the amendment is written as a new D-ADR record (phase 4), never by
   editing D-ADR0082 in place.
2. **Rendered at land time and on demand.** After every successful land (paths or branch) whose committed paths touch
   `plans/`, the land door renders the index into the main checkout through the existing `BacklogPort`; a render
   problem is a note in the land result (`backlogIndexNote`), never a refusal, so a bad row can no longer block a land.
   `fgos backlog-index` renders it on demand.
3. **Rendered from the working tree, skipping what does not parse.** The local copy is a view, not a commit: it lists
   every row file that parses and names the ones it skipped. Validation of a new row stays where it is: `session write`
   still refuses a row that breaks the item contract or its file name, or a new row without a minted id.
4. **A tracked index is never overwritten.** In a project that still tracks `plans/backlog.md` (one migrated before
   this change), the door and the verb leave the file alone and say `backlog-index-tracked` with the fix
   (`git rm --cached plans/backlog.md`), so rendering never dirties a tracked file in the main checkout. `fgos migrate
   portfolio` writes `plans/.gitignore` with `/backlog.md`, idempotently.
5. **Closing cited rows on a plan `done` stays** (D-ADR0082 point 5): the door still sets cited rows `done` in the
   same commit; only the index write leaves that commit.

## Outcome

`plans/backlog.md` is a local, ignored file rendered by the Rust generator from `plans/backlog/*.md` frontmatter and
the plans and discussions whose `source` cites each row. A row written through `fgos session write` lands as a commit
holding that one file. A plan landing `done` commits the plan and its closed rows, no index. No head grant names
`plans/backlog.md` and no skill tells a head to edit it. The main checkout's copy is refreshed by every land that
touches `plans/`, and `fgos backlog-index` renders it on demand.

## Acceptance criteria

1. Adding a row lands exactly one file: `cargo test -p fgos --test session_write_publish` has a case that writes a new
   row through the publish port and asserts the commit's changed paths are exactly that row file.
2. A plan turning `done` commits no index: `cargo test -p fgos-supervision --test land` has the plan-done case assert
   the commit holds the plan file and the closed rows only, and the main checkout's `plans/backlog.md` afterwards lists
   the closed row as `done`.
3. A bad row never refuses a land: the same land test file has a case with one unparseable row file whose land
   succeeds with a `backlogIndexNote` naming the skipped file.
4. A tracked index is left alone: a land test case with `plans/backlog.md` tracked asserts the file's bytes are
   unchanged and the note says `backlog-index-tracked`.
5. On demand: `cargo test -p fgos --test backlog_index` renders the index in a fixture project from rows, a citing
   discussion and a citing plan, and refuses-by-note on a tracked index.
6. The grant is gone: `node --test test/session-host/head-grants.test.mjs` and
   `cargo test -p fgos-session-host --test permissions` assert the secretary and supervisor writes are
   `["plans", "plans/backlog/*"]`.
7. No commit-scoped generator, drift check or Node twin remains: `rg -n "generate_backlog_index_for_commit|CommitIndexError|check_index|index-drift|land-backlog-index-failed|generateBacklogIndex" apps packages src test`
   prints nothing.
8. In this repository `git ls-files plans/backlog.md` prints nothing and `git check-ignore plans/backlog.md` prints the
   path.
9. The amendment is recorded: a new D-ADR heading amending D-ADR0082 exists in
   `docs/platform/runner/decisions/h-36d872fbb0e5.md`, and `fgos decision-index --check` passes.
10. DoD: `npm test` and `cargo test --workspace` green on the combined tree; `node scripts/plan-contract-check.mjs --all`
    has no error.

## Non-goals

- Changing the row file format or the item contract.
- Moving the backlog into the Event Store (that is ds-ubqlutna6r).
- Retiring the rest of the Node portfolio check (`packages/portfolio/portfolio-check.mjs` minus its drift part).
- Any other line of the row's or the discussion's scope beyond its "Done when".

## Authority map

| New thing | Model row | Note |
|---|---|---|
| Render the backlog index into the main checkout from the working tree (`render_backlog_index` in portfolio.rs) | `supervision` (owns "portfolio status and plan lane pool") | survivor: `generate_backlog_index` (apps/fgos/src/wiring/portfolio.rs); retired: `generate_backlog_index_for_commit`, `CommitIndexError`, `check_index` drift, `packages/portfolio/index-generator.mjs` |
| The land door renders the index after a land instead of committing it (`BacklogPort.index` reshaped) | `supervision` | survivor: `BacklogPort` in packages/supervision/rust/src/land.rs; retired: the index write in `close_cited_items` and code `land-backlog-index-failed` |
| Row write publishes one file (`refresh_backlog_index` becomes item validation only) | `session-host` | survivor: the item checks in apps/fgos/src/wiring/session_write_publish.rs; retired: its index generation and write |
| Verb `fgos backlog-index` | declare: door render-the-backlog-index | No model row owns an on-demand render of the portfolio index; it is the one entry for a render when nothing landed, beside `fgos decision-index`. Phase 3 writes `packages/component-authority/model/doors/render-the-backlog-index.yaml` with `fgos authority declare --kind door` |
| Secretary and supervisor grants without `plans/backlog.md` | `session-host` | survivor: head-permissions.v1.json grant rows; retired: the `plans/backlog.md` write entry from row p-dw3h5wscns |
| Decision amending D-ADR0082 points 1 and 5 (index generated, not committed) | `supervision` (holder of portfolio decisions: D-ADR0082 lives in docs/platform/runner/decisions/h-36d872fbb0e5.md) | id from `fgos identity mint d-adr` in phase 4 |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Stop committing the index](phase-01-stop-committing-the-index.md) | - | apps/fgos/src/wiring/portfolio.rs, apps/fgos/src/wiring/supervision.rs, apps/fgos/src/wiring/session_write_publish.rs, apps/fgos/src/wiring/migrate.rs, apps/fgos/tests/portfolio_check.rs, apps/fgos/tests/session_write_publish.rs, packages/supervision/rust/src/land.rs, packages/supervision/rust/tests/land.rs | 1 | draft |
| 2 | [Retire the hand-edit path and the Node twin](phase-02-retire-hand-edit-path.md) | - | src/session-host/head-grants.mjs, packages/session-host/contracts/head-permissions.v1.json, packages/session-host/rust/tests/permissions.rs, test/session-host/head-grants.test.mjs, test/session-host/head-start.test.mjs, packages/portfolio/index-generator.mjs, packages/portfolio/portfolio-check.mjs, test/portfolio/portfolio-check.test.mjs, core/skills/fgos-secretary/SKILL.md, core/skills/fgos-supervisor/SKILL.md, .agents/skills/fgos-secretary/**, .agents/skills/fgos-supervisor/**, plugins/fgOS/skills/fgos-secretary/**, plugins/fgOS/skills/fgos-supervisor/** | 1 | draft |
| 3 | [The backlog-index verb and the migrate ignore entry](phase-03-backlog-index-verb.md) | 1 | apps/fgos/src/wiring/backlog_index.rs, apps/fgos/src/wiring/mod.rs, apps/fgos/src/routing.rs, apps/fgos/src/cli_projector.rs, apps/fgos/src/wiring/migrate.rs, apps/fgos/tests/backlog_index.rs, apps/fgos/tests/migrate_portfolio.rs, packages/host-runtime/contracts/command-routes.json, packages/host-runtime/contracts/command-manifest.json, packages/component-authority/model/doors/render-the-backlog-index.yaml | 2 | draft |
| 4 | [Untrack the index, record the decision, integrate](phase-04-untrack-record-integrate.md) | 1, 2, 3 | plans/.gitignore, plans/backlog.md, docs/platform/runner/decisions/h-36d872fbb0e5.md, docs/platform/supervision/spec.md, docs/platform/session-host/spec.md, docs/platform/agent-confinement/spec.md, docs/decisions/index.md, CHANGELOG.md | 3 | draft |

Hot files: `command-routes.json` and `command-manifest.json` are regenerated by `land.regenerate`
(`node scripts/export-command-selectors.mjs`), only in phase 3. The generated skill surfaces are rebuilt by
`npm run build:skills`, only in phase 2. `docs/decisions/index.md` is regenerated by `fgos decision-index`, only in
phase 4. `CHANGELOG.md` is written only in phase 4.

Checked with `node scripts/plan-contract-check.mjs --plan plans/261125-1556-backlog-index-generated` and
`fgos resource-check --plan plans/261125-1556-backlog-index-generated`: phases 1 and 2 share no path; phase 3 waits on
phase 1 because its verb calls the render helper phase 1 writes, and the one shared path (`migrate.rs`, phase 1
drops a field, phase 3 adds the ignore entry) is serialised by that dependency; phase 4 runs last as the integration phase.

## Owner questions

None. The owner chose option A and confirmed the plan on 2026-11-25; the evidence settles the rest (Decisions taken
here).

## Risks and rollback

- **A head reads a stale index.** The main checkout's copy is refreshed by every land that touches `plans/`; a fresh
  clone has none until the first land or `fgos backlog-index`. Proof: acceptance 2 and 5.
- **Other projects still track the index.** Decision 4: the door and the verb never write a tracked index and say how
  to untrack it; `fgos migrate portfolio` writes the ignore entry. Until a project untracks it, its committed copy only
  goes stale, it never blocks.
- **A plan written before this change lists `plans/backlog.md` in its footprint.** Harmless: the path no longer
  changes in a commit.
- **Out-of-scope observation:** the rest of `packages/portfolio/portfolio-check.mjs` duplicates the Rust check with no
  production caller; worth its own backlog row (the secretary files rows; this planner writes only plans).
- **Rollback:** revert the phase commits in reverse order (4, 3, 2, 1); reverting phase 4 restores the tracked index
  (`git add plans/backlog.md` after `fgos backlog-index` from the phase-3 tree, or from the phase-1 parent).
