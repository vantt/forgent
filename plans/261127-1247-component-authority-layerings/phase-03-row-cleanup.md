# Phase 3: Row cleanup: owners, retired rows, merges

Every component row owns something, carries a one-sentence `summary`, and no retired row is
left (CAS-D19..D22, CAS-D26 (5)). Data and the governance render only; the door rules that keep
it so come in phase 4. Runs after phase 10, so the model has no decision kinds any more.

Capability: `code:implement`.

## Inputs

- DISCUSSION §4 CAS-D19, D20, D21, D22, D26 (5); §3 row 22.
- `packages/component-authority/model/{components,contracts}.yaml` after phase 10.
- `packages/component-authority/rust/src/render.rs` `governance_holder_body`;
  `docs/platform/governance.md:558` (spec files listed through `h-*` rows).

## Files this phase may write

Its footprint row in plan.md.

## Steps

1. CAS-D19: `agent-mailbox` status `live` (crates `packages/mailbox/rust/{core,store}` run);
   `supervision.paths` adds `packages/supervision/` and `packages/portfolio/`; set the hexagon
   default and ring of the eight rows exactly as CAS-D19 lists, with the per-directory hexagon
   exceptions it names (`watcher`, `notify` infra; `queue`, `portfolio` domain; event-store
   `fsio`, `refs`, `publish`, `sync`, `locks` infra; identity `proc_tree`, `machine`, `cli_dirs`
   infra; agent-mailbox `store` infra; runner `anti-loop`, `recovery`, `rigor` domain,
   `github-adapter`, `worktree` infra). Each exception carries its reason.
2. CAS-D20: delete the 8 `h-*` rows; add `docs/platform/runner/` to `runner.paths`; change
   `governance_holder_body` (one line per component since phase 10) to also list a component's
   spec files found under its `paths`, so the governance table still lists every runner spec
   file. For each `documentation`-family row (`documentation`,
   `admission`, `doc-checks`, `document-identity`, `write-door`): keep it only if it points to the
   plan or backlog row that makes it (search `plans/` for the documentation H2 plan); otherwise
   delete it, and say which in the phase report.
3. CAS-D21: delete the 9 retired rows; put each old id in its successor's `aliases`
   (`herdr-web-dashboard`, `ui-spec` → `fgos-gateway`; `agent-coordination` → `workflow`;
   `host-invocation-routing` → `host-runtime`; the rest have no successor); move contracts
   (`fgos-gateway` gets the 4, CTR012 → `workflow`, CTR013 → `run-result`); drop the consumer
   lines of `agent-coordination-engine` and `herdr-web-dashboard`. A deleted row's `decisions`
   home, if any, moves to the successor.
4. CAS-D22: delete `team-cognition-engine` (drop its consumer lines on 3 contracts); delete
   `work-driver`, move its `owns` and its 12 consumer lines to `runner`, add `work-driver` to
   `runner.aliases`; add ring exceptions on `runner`: `src/runner/loop.mjs` orchestrator,
   `src/runner/operation-choice.mjs` router, `src/runner/work-dispatch.mjs` launcher (default
   launcher). Confirm each file path exists first.
5. CAS-D26 (5): write `summary` on every remaining row, one full sentence saying what the
   component does, taken from its `meaning`, `owns` and spec header (governance.md §10 style);
   then make `summary` required for a component row in the schema and `model.rs`, with a test
   that a row without it is refused. `owns`/`mustNotOwn` stay as they are (backlog row
   p-xtgvunuvxy rewrites them).
6. `rg -n "<each deleted id>" packages docs/platform src test apps` and fix every live reference
   (rendered blocks excepted, they regenerate).
7. Render with the worktree code and check.

## Verify

`cargo test -p component-authority`, `node --test test/architecture.test.mjs`,
`npm run fgos:dev -- authority render --check`, and
`npm run fgos:dev -- authority model --json | node -e '…'` showing zero rows with
`status: retired`, zero ids starting `h-` and zero rows without `summary`. Pass: all green; the governance table lists every
file under `docs/platform/runner/`.

## Rollback

Revert the phase merge.
