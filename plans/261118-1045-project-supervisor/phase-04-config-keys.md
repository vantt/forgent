# Phase 4 — Config keys: watcher, supervisor, land, lanes

Registers every key the plan reads. Keys go only through `core/config-standard` and `core/config-schema` (plan rule; install/setup gate in AGENTS.md). No Rust or Node reader here: readers arrive in the phases that use the keys. One owning proof: the existing config suite.

## Inputs
Step 0 first: re-grep every item. A finding that changes a plan decision stops the phase with `NEEDS_CONTEXT`.
- Current key: `core/config-standard/workerSlots.yaml` (`ceiling: null`, doc says "work items"), `core/config-schema/workerSlots.schema.yaml` (`type: [integer, "null"]`, owner comment `work-state`).
- Template: `core/config-standard/mailbox.yaml` (comment grammar `# @fgos:doc ...`) and `core/config-schema/mailbox.schema.yaml` (`x-fgos-scope`, `x-fgos-file`, `minimum`, `maximum`).
- Scope rule: `docs/platform/config/spec.md:69` (`x-fgos-scope: global-only|project-only|both`). Counts at base: 57 both, 18 global-only, 7 project-only.
- Section lists compiled into the binary: `packages/config/rust/src/bundle.rs:19` (`SCHEMAS`) and `:24` (`STANDARD`), both in schema-set order. A section file not named there is not loaded.
- Command-key precedent: `core/config-schema/runner.schema.yaml:489-495` (`verify`: `x-fgos-scope: both`, `x-fgos-sensitivity: command`, a `$comment` justifying a command read from the trusted main checkout). Plan.md cites `:501`; the real lines are these.
- Plan facts: PS-5 (`land.gates: [{run, when?}]`, `land.regenerate`, empty gates refuse `land-gate-missing`), PS-13 (`watcher.enabled` global-only, two intervals), PS-12 (lane ceiling default 4), watcher-overdue factor `docs/discussions/ops-metrics/DISCUSSION.md:312` (k default 3).

## Footprint
`core/config-standard/watcher.yaml`, `core/config-standard/supervisor.yaml`, `core/config-standard/land.yaml`, `core/config-standard/workerSlots.yaml`, `core/config-schema/watcher.schema.yaml`, `core/config-schema/supervisor.schema.yaml`, `core/config-schema/land.schema.yaml`, `core/config-schema/workerSlots.schema.yaml`, `packages/config/**`.

## Steps
1. `watcher` section:
   - `enabled` boolean, default `false`, `x-fgos-scope: global-only` (decides what runs on this machine).
   - `activeIntervalSec` integer, minimum 1, default 60; `idleIntervalSec` integer, minimum 1, default 900 (PS-13).
   - `overdueFactor` integer, minimum 1, default 3.
   - `defaultAction` enum `wake-supervisor|notify`, default `wake-supervisor`; `actions` object mapping a row kind to the same enum (empty by default).
   - `wakeFailureLimit` integer, minimum 1, default 3: consecutive failed wakes before a notify-only row.
2. `supervisor.maxLeads` integer, minimum 1, default 3, scope both.
3. `land` section: `gates` array of `{run: string, when?: string}`, default `[]`; `regenerate` object `{run: string, files: [string]}` or `null`, default `null`; each `run` string carries `x-fgos-sensitivity: command` and a `$comment` justification like `verify`, scope both (commands are read from the trusted main checkout, as `verify` is).
4. `workerSlots.ceiling`: default `4`; schema keeps `[integer, "null"]` (null leaves the pool unarmed and takes no lane); rewrite the doc strings from "work items" to "worker seats on this machine"; owner comment stays unless Work no longer owns it (leave as is).
5. Add `watcher`, `supervisor`, `land` to both lists in `bundle.rs` in schema-set (alphabetical) order. Do not touch other `packages/config` files except a golden file a failing test names; regenerate it with the config verb (`fgos config refresh-docs`), never by hand.
6. Each key's `@fgos:doc` says unit, minimum, maximum when any, and default, like the mailbox keys.

## Verify
- `cargo test -p fgos-config` passes (golden schema, docs and snapshot tests).
- `node scripts/run-tests.mjs test/config` (check `ls test | rg config`) passes.
- `npm run fgos:dev -- config show --json` lists the five new sections or keys with their defaults; `config check` reports no finding.
- Pass: no test lists `workerSlots.ceiling: null` as the standard value; if one does, it is updated in this phase and named in the commit.

## Rollback
Revert the phase commit. A project file that already sets a new key then fails `config check` by name until the line is removed; nothing reads these keys before phase 6.
