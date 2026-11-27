---
contract: plan-v1
title: "The backlog index is generated from the row files at every land that feeds it"
status: ready
priority: P1
blockedBy: []
footprint:
  - packages/supervision/rust/src/land.rs
  - packages/supervision/rust/tests/land.rs
  - apps/fgos/src/wiring/supervision.rs
  - apps/fgos/src/wiring/portfolio.rs
  - apps/fgos/tests/portfolio_check.rs
  - apps/fgos/src/wiring/session_write_publish.rs
  - apps/fgos/tests/session_write_publish.rs
  - packages/session-host/contracts/head-permissions.v1.json
  - packages/session-host/rust/tests/permissions.rs
  - test/session-host/head-grants.test.mjs
  - core/skills/fgos-secretary/SKILL.md
  - core/skills/fgos-supervisor/SKILL.md
  - docs/platform/session-host/spec.md
  - docs/platform/supervision/spec.md
  - docs/platform/agent-confinement/spec.md
  - packages/portfolio/index-generator.mjs
  - packages/portfolio/portfolio-check.mjs
  - packages/portfolio/item.mjs
  - packages/portfolio/discussion.mjs
  - packages/portfolio/vocabulary.mjs
  - test/portfolio/portfolio-check.test.mjs
  - changelog.d/261128-0105-backlog-index-generated.md
  - plans/backlog.md
  - plans/261128-0105-backlog-index-generated
base: 48bbd49188238d92cfce79081f1db4f104f54a79
source:
  - plans/discussions/ds-6z4rfn6kv5-backlog-index-generated/DISCUSSION.md
  - p-o4iniqvitl
created: 2026-11-28
---

# The backlog index is generated from the row files at every land that feeds it

## Outcome

`plans/backlog.md` is never edited by hand. The land door writes it, in the same commit, whenever a land commits
a path the index is built from: a row file `plans/backlog/*.md`, a plan `plans/*/plan.md`, or a discussion
`plans/discussions/*/DISCUSSION.md`. That holds for paths lands and branch lands alike. The text comes from the one
generator that already exists in Rust (`generate_backlog_index_for_commit`, `apps/fgos/src/wiring/portfolio.rs`):
ID, title, status, priority and area from each row's frontmatter, the Citing column from the plans and discussions
whose `source` names the row. Adding a row lands exactly one new file, and the index changes inside that same
commit without anyone touching it, so two heads adding rows no longer conflict on the 600-line index. The old
write path (the session-write grant on `plans/backlog.md` for the supervisor and the secretary, and the skill
lines that tell them to copy and rewrite the whole index) is retired in the same change.

### What exists today (prior art)

- The generator exists twice: in Rust (`generate_backlog_index`, `generate_backlog_index_for_commit`, owner
  `apps/fgos/src/wiring/portfolio.rs`) and as an orphaned JavaScript copy (`packages/portfolio/index-generator.mjs`,
  with `portfolio-check.mjs`, `item.mjs`, `discussion.mjs`, `vocabulary.mjs`). Nothing in `src/`, `bin/`,
  `scripts/` or `packages/` imports the JavaScript copy; only `test/portfolio/portfolio-check.test.mjs` does.
  Rust is the survivor (design principle 4, Rust first; principle 1, one door).
- The land door already regenerates the index (`close_cited_items`, `packages/supervision/rust/src/land.rs`),
  but only in a paths land where a plan turns `done` and cites a row. A land of a new row alone
  (for example 261d3d0fe7) or a plan status change that is not `done` leaves the index stale.
- `session write` regenerates the index with its own call (`refresh_backlog_index`,
  `apps/fgos/src/wiring/session_write_publish.rs`) and passes `backlog_index: None` to the land door: a second
  caller of the generator beside the door.
- The supervisor and secretary grants (`packages/session-host/contracts/head-permissions.v1.json`) name
  `plans/backlog.md` as a session-write file, and both skills tell the head to copy, edit and rewrite it
  (commits 638dfccfff, f1455b1cdc, a19d920f12, 205ee7ecd1, d0b98c1f6a: "write plans/backlog.md").
- Named in the discussion and found not to write the index, so left unchanged:
  `scripts/check-backlog-reconciliation.mjs` (reads row frontmatter for its RECONCILIATION.md check, never the
  index), `src/session-host/head-start.mjs` (no backlog reference), `src/runner/merge.mjs` (one comment citing a
  row id). Readers of the index (the start ritual, `core/config-standard/sessionRotation.yaml`, start-context
  goldens) keep reading the same file.

## Acceptance criteria

1. **A row land commits exactly one new file and the regenerated index.** A paths land of one new row file
   `plans/backlog/<id>-<slug>.md` produces one commit whose diff adds exactly that file and modifies
   `plans/backlog.md` to the generator's output. Owning proof: a new case in
   `packages/supervision/rust/tests/land.rs`; run `cargo test -p fgos-supervision --test land`.
2. **Every land that feeds the index regenerates it.** A paths land of a plan whose status changes to anything,
   or of a discussion, commits the regenerated index; a branch land whose merged change set touches an
   index-feeding path commits the regenerated index in the merge result; a land that touches none of those paths
   leaves `plans/backlog.md` alone. Owning proof: `packages/supervision/rust/tests/land.rs` (the existing case
   `a_plan_land_that_is_not_a_turn_to_done_touches_no_item` is extended: it still touches no item, and now commits
   the index), run as in criterion 1.
3. **A hand edit of the index cannot land.** A paths land naming `plans/backlog.md` (alone, or inside a glob such
   as `plans`) with bytes different from the generator's output commits the generator's bytes, never the edit.
   Owning proof: `packages/supervision/rust/tests/land.rs`.
4. **The index lines come from the row files and the citing plans.** The generator's row, sort and Citing rules
   stay as they are and stay proven by `apps/fgos/tests/portfolio_check.rs`; run
   `cargo test -p fgos --test portfolio_check`.
5. **The old write path is retired.** `session write plans/backlog.md` from a supervisor or secretary head is
   refused by the grant (the path is not named by `writes`); `session write plans/backlog/<id>-<slug>.md` still
   lands the row, now with the index the land door generated, and `session_write_publish.rs` no longer calls the
   generator itself. Owning proofs: `packages/session-host/rust/tests/permissions.rs` (grant) and
   `apps/fgos/tests/session_write_publish.rs` (row write lands row plus generated index); run
   `cargo test -p fgos-session-host --test permissions` and `cargo test -p fgos --test session_write_publish`.
   `rg -n "plans/backlog.md" core/skills/fgos-secretary/SKILL.md core/skills/fgos-supervisor/SKILL.md` shows no
   instruction to write the index.
6. **One generator.** `packages/portfolio/{index-generator,portfolio-check,item,discussion,vocabulary}.mjs` and
   `test/portfolio/portfolio-check.test.mjs` are deleted; `rg -n "packages/portfolio/.*\.mjs" --glob '!plans/**'`
   returns nothing; every behaviour their test proved is owned by a named case in
   `apps/fgos/tests/portfolio_check.rs` (listed in the phase-4 report).
7. **The combined tree is green.** `npm test` and `cargo test --workspace` pass on the merged tree, and the
   landed `plans/backlog.md` equals the generator's output for the landed rows.

## Non-goals

- Changing the row file format (`plans/backlog/<id>-<slug>.md` frontmatter and sections).
- Moving the backlog into the event store (belongs to ds-ubqlutna6r).
- A new CLI verb or script to render the index on demand: rendering at land time meets the row's "Done when"
  ("at land time or on demand"), and a new verb would add a mechanism (RUL104).
- Changing the index's columns, sort order or Citing format.
- Rewriting `scripts/check-backlog-reconciliation.mjs`, `src/session-host/head-start.mjs` or
  `src/runner/merge.mjs` (none writes the index; see prior art).

## Authority map

| New thing | Model row | Note |
|---|---|---|
| The land door regenerates `plans/backlog.md` in every land (paths and branch) that commits an index-feeding path, not only when a plan turns done | `supervision` (component) | survivor: `BacklogPort` / `close_cited_items` in `packages/supervision/rust/src/land.rs`; the trigger widens, no new port |
| `session write` of a row publishes through the land door's backlog port instead of its own generator call | `write-door` (component) | survivor: the land door's `BacklogPort`; retired: the index write in `refresh_backlog_index`, `apps/fgos/src/wiring/session_write_publish.rs` (its item checks stay) |
| One backlog index generator | `portfolio/backlog-item.schema.v1` (contract) | survivor: `generate_backlog_index_for_commit`, `apps/fgos/src/wiring/portfolio.rs`; retired: `packages/portfolio/index-generator.mjs`, `packages/portfolio/portfolio-check.mjs`, `packages/portfolio/item.mjs`, `packages/portfolio/discussion.mjs`, `packages/portfolio/vocabulary.mjs` |
| The supervisor and secretary grants no longer name `plans/backlog.md` | `write-door` (component) | survivor: `writes` of `plans/backlog/*`; retired: the `plans/backlog.md` entry in `packages/session-host/contracts/head-permissions.v1.json` |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Land door regenerates the index on every feeding land](phase-01-land-door-regenerates-index.md) | - | packages/supervision/rust/src/land.rs, packages/supervision/rust/tests/land.rs, apps/fgos/src/wiring/supervision.rs, apps/fgos/src/wiring/portfolio.rs | 1 | ready |
| 2 | [Session write publishes rows through the land door](phase-02-session-write-uses-land-door.md) | 1 | apps/fgos/src/wiring/session_write_publish.rs, apps/fgos/tests/session_write_publish.rs | 2 | ready |
| 3 | [Retire the index grant and the hand-edit doctrine](phase-03-retire-index-grant-and-doctrine.md) | - | packages/session-host/contracts/head-permissions.v1.json, packages/session-host/rust/tests/permissions.rs, test/session-host/head-grants.test.mjs, core/skills/fgos-secretary/SKILL.md, core/skills/fgos-supervisor/SKILL.md, docs/platform/session-host/spec.md, docs/platform/supervision/spec.md, docs/platform/agent-confinement/spec.md | 1 | ready |
| 4 | [Retire the JavaScript portfolio duplicate](phase-04-retire-js-portfolio-duplicate.md) | - | packages/portfolio/index-generator.mjs, packages/portfolio/portfolio-check.mjs, packages/portfolio/item.mjs, packages/portfolio/discussion.mjs, packages/portfolio/vocabulary.mjs, test/portfolio/portfolio-check.test.mjs, apps/fgos/tests/portfolio_check.rs | 1 | ready |
| 5 | [Integration: combined gates, regenerated index, changelog](phase-05-integration.md) | 1, 2, 3, 4 | changelog.d/261128-0105-backlog-index-generated.md, plans/backlog.md, plans/261128-0105-backlog-index-generated | 3 | ready |

Each phase's capability is `code:implement`, except phase 5, which is `code:test`.

Checked: every phase sits in a later wave than its dependencies (2 after 1; 5 after all); the wave-1 footprints
(phases 1, 3, 4) share no path and no path sits inside another; `plans/backlog.md` has one writer (phase 5, through
the land door). The generated skill surfaces (`.agents/skills/**`, `.claude/skills/**`, `plugins/fgOS/skills/**`)
that phase 3's skill edits change are rebuilt by `land.regenerate`, so no phase owns them.

## Owner questions

None. The discussion is settled with no open points, and every choice below the "Done when" was decided from the
code: render at land time rather than a new verb (RUL104), Rust generator as survivor (design principles 1 and 4),
the door overwrites a hand edit rather than refusing it (a refusal would break `land --paths plans`, which the
supervisor uses).

## Risks and rollback

- **Branch land regeneration reads the wrong tree.** The current port generates from `trusted_main_root()`; in a
  branch land the index must come from the merge candidate (its tracked rows, plans and discussions). Proof
  point: the branch-land case of criterion 2 builds a branch that changes a plan's status and checks the
  committed index shows the new status.
- **The door's index write trips the footprint check of a plan branch.** A plan footprint does not list
  `plans/backlog.md`; the door's own write must be exempt the way `land.regenerate` files are (`regen_files`,
  land.rs around the footprint judge), never by widening every plan. Proof point: the same branch-land case
  runs with a footprint that omits `plans/backlog.md`.
- **Index churn.** Every plan status change now rewrites some index lines. That adds no commit (the write rides
  in the land's own commit) and no conflict (the door writes under the merge slot from the tip), which is the
  point of the row.
- **A stale index on main until the first feeding land.** Phase 5's own plan land is a feeding land, so it
  regenerates it.
- **Rollback:** revert the plan's commits in reverse order (5, 2, 4, 3, 1). Restoring the grant entry and the
  skill lines returns the old hand-write path; the Rust door then falls back to regenerating only on a plan
  turning done.
