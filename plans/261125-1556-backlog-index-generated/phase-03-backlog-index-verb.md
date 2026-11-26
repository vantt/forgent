---
phase: 3
title: The backlog-index verb and the migrate ignore entry
status: draft
capability: code:implement
---

# Phase 3: The backlog-index verb and the migrate ignore entry

Render the index when nothing landed (a fresh clone), and let every project that adopts the portfolio ignore the
index from the start.

## Inputs

- `plans/261125-1556-backlog-index-generated/plan.md` (Decisions 2 and 4; Authority map row `declare: door
  render-the-backlog-index`).
- Phase 1's `portfolio::render_backlog_index` and its `RenderOutcome` in `apps/fgos/src/wiring/portfolio.rs`.
- How a native verb with no subcommand is registered, copied from `fgos resource-check`:
  `apps/fgos/src/wiring/resource_check.rs` (`OPERATION_ID`, `DESCRIPTOR`, the provider), `apps/fgos/src/main.rs`
  (the descriptor list and the provider list), `apps/fgos/src/cli_projector.rs` (the request projection by
  operation id), `apps/fgos/src/wiring/mod.rs`, and its selector row in
  `packages/host-runtime/contracts/command-route-annotations.json`.
- `fgos decision-index` (a Node verb, `src/report/decision-index.mjs`) only for the output and help shape.
- `apps/fgos/src/wiring/migrate.rs` (where it writes the backlog index) and `apps/fgos/tests/migrate_portfolio.rs`.
- `packages/component-authority/model/doors/*.yaml` for the door row shape; `fgos authority declare --help`.
- `.fgos/config.yaml` `land.regenerate` (it rebuilds `command-routes.json` and `command-manifest.json`).

## Files it may write (footprint)

`apps/fgos/src/wiring/backlog_index.rs` (new), `apps/fgos/src/wiring/mod.rs`, `apps/fgos/src/main.rs`,
`apps/fgos/src/cli_projector.rs`, `packages/host-runtime/contracts/command-route-annotations.json` (one selector row), `apps/fgos/src/wiring/migrate.rs`, `apps/fgos/tests/backlog_index.rs` (new),
`apps/fgos/tests/migrate_portfolio.rs`, `packages/host-runtime/contracts/command-routes.json` and
`packages/host-runtime/contracts/command-manifest.json` (regenerated only),
`packages/component-authority/model/doors/render-the-backlog-index.yaml` (written by `fgos authority declare`).

## Steps

1. `fgos authority declare --kind door --row <json> --plan plans/261125-1556-backlog-index-generated` for door
   `render-the-backlog-index` (owner component `supervision`; meaning: renders the local, uncommitted
   `plans/backlog.md` from the portfolio files; entry points `fgos backlog-index` and the land door's backlog port).
2. Native verb `fgos backlog-index [--dir <root>] [--json]` in `backlog_index.rs`: resolves the project root, asks the
   Git door whether `plans/backlog.md` is tracked, calls `portfolio::render_backlog_index`, prints
   `written|unchanged plans/backlog.md` plus any skipped files; a tracked index exits non-zero with
   `backlog-index-tracked` and the `git rm --cached plans/backlog.md` fix; a project with no `plans/backlog/` says so
   and exits 0. Help text names the effect (writes one ignored file) like `decision-index` does. Register it as
   `resource-check` is (`main.rs`, `cli_projector.rs`, `mod.rs`, one selector row in
   `command-route-annotations.json`); regenerate the contracts with `node scripts/export-command-selectors.mjs`.
3. `fgos migrate portfolio` keeps writing the index through `render_backlog_index` (drop any private write path it
   has) and writes `plans/.gitignore` holding `/backlog.md` when the line is missing, idempotently (a second run
   changes nothing). Extend its owning test in `migrate_portfolio.rs`.
4. `apps/fgos/tests/backlog_index.rs`: one wiring proof of the verb over a fixture project (two rows, one discussion
   and one plan citing a row, one unparseable row): the file is written with the citing links, the skipped row is
   named, a second run says `unchanged`, and a tracked index is left byte-identical with `backlog-index-tracked`.

## Verify

```bash
cargo test -p fgos --test backlog_index --test migrate_portfolio
node scripts/export-command-selectors.mjs && git diff --stat -- packages/host-runtime/contracts
node --test test/rust-host/command-routes.test.mjs test/cli/fgos-manifest.test.mjs
npm run fgos:dev -- backlog-index --help
fgos authority render --check
```

Pass: tests green; the contracts change only by the new verb; help prints the verb; the authority render check
passes.

## Rollback

Revert this phase's commit; `fgos backlog-index` and the migrate ignore entry go away, the land door keeps rendering.
