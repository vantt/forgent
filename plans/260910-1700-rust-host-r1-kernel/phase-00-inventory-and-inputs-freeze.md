# Phase 00 — Inventory And Inputs Freeze

Depends on: none — first cell of the track (Wave 1). Reads only the entry
docs `plan.md`'s "Authority Entering The Plan" names.

## Objective

Freeze the track's decisions, classify every command selector, inventory
every real caller of the old `bin/fgos.mjs` path, and confirm the packaging
interface fields this track consumes — all as a report, no code change. Later
cells must not rediscover these boundaries mid-implementation.

## Requirements

- R1: Confirm `plan.md`'s Decisions table (target matrix, preview-vs-stable,
  Node compatibility window, performance budgets, selector classification,
  `distribution.build.show` owner) as-is, or record an explicit override with
  rationale. Cite `docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md`
  §3 and §5 for anything not already settled in `plan.md`.
- R2: Classify all 73 top-level `name` entries in `src/cli/command-registry.mjs`'s
  `COMMAND_REGISTRY`: exactly one (`version`) is `native` (operation
  `distribution.build.show`); the remaining 72 are `legacy-cli`. Note that a
  `sub`-positional entry (e.g. `coordination`, `dispatch`, `session`,
  `tool`, `doc`, `workflow`) is ONE selector, never exploded per `sub` enum
  value (`legacy-cli-transition.md` §3). Record the count (must equal 73)
  and each selector's proposed `owner_path` category (legacy payload vs. a
  named Rust crate).
- R3: Inventory the nine real call sites of the old path, each with exact
  file:line and its runtime's resolver:
  `scripts/fgos-shell-integration.sh` (`fgos()`, tier-1 branch),
  `herdr-plugin/src/fgos.rs::run_fgos`,
  `herdr-plugin/src/gateway.rs::build_fgos_command`,
  `herdr-plugin/src/main.rs::fetch_worker_slots`,
  `src/runner/dispatch/cli.mjs` (`BIN_FGOS_PATH` constant),
  `src/evolve/iron-law.mjs` (`MODULE_RULES`'s `bin/fgos.mjs` footprint
  entry — a static risk-classifier match, not a resolver call; flag this
  distinction explicitly),
  `src/setup/registrations.mjs` (`checkPluginSkillCliReachable`, which
  already calls `resolveFgosBin`),
  `core/skills/_shared/fgos-cli-fallback.md` (documented shell snippet,
  source for ~20 `.agents`/`plugins` mirror copies), and `package.json`
  `bin.fgos`. Confirm the ~75 Node tests spawning `bin/fgos.mjs` directly are
  fixtures, not callers to migrate.
- R4: Confirm the packaging interface fields this track consumes from
  `docs/architect/packaging-distribution/runtime-identity-and-activation.md`
  §5: `entries.fgos`, `entries.fgosRunner`, `components.legacyNode.{root,
  entry,digest}`, the `artifactDigest` formula, and the Release Tree
  Canonicalization table (path order, file digest, symlink refusal). Confirm
  `distribution.build.show` owner = `fgos-distribution`
  (`packages/distribution/rust`), per `plan.md`'s Decisions table and kernel
  §9.
- R5: Record the exact ownership-header wording to add to `bin/fgos.mjs` in
  a later cell (P07), per `legacy-cli-transition.md` §2's "a header in
  `bin/fgos.mjs` and the root `AGENTS.md` state the ownership rule" — do not
  apply it yet.
- R6: Check `plan.md`'s Shared-File Lease Rule for overlap between the two
  wave-2 lanes (`node-harness` vs. `rust-workspace`/`rust-kernel`); confirm
  none, or flag the exact overlapping path.
- R7: Write `plans/260910-1700-rust-host-r1-kernel/reports/p00-inventory.md`
  containing R1-R6's findings. Every claim cites a file path (and line
  number where R3 requires one).
- R8: Do not edit any source, test, or Cargo file in this phase.

## Files

Likely touch:

- `plans/260910-1700-rust-host-r1-kernel/reports/p00-inventory.md` (new)

Do not touch:

- `src/**`, `test/**`, `apps/**`, `packages/**`, `Cargo.*` (no code change)
- `plans/260910-1700-rust-host-r1-kernel/plan.md` (Lead-owned)
- `docs/architect/host-invocation-routing/**` (P11's `docs-closeout` lease)

## Verification

- `git diff --stat` shows only the new report file under `reports/`.
- `grep -c "^    name:" src/cli/command-registry.mjs` returns `73`; the
  report's selector classification accounts for all 73.
- `rg -n "bin/fgos.mjs" scripts/fgos-shell-integration.sh herdr-plugin/src/fgos.rs herdr-plugin/src/gateway.rs herdr-plugin/src/main.rs src/runner/dispatch/cli.mjs src/evolve/iron-law.mjs src/setup/registrations.mjs core/skills/_shared/fgos-cli-fallback.md package.json`
  — every hit this prints has a matching file:line entry in the report's R3
  inventory.
- Capability annotation for this cell: `code:review`.
