# Phase 4 — Config keys: watcher, supervisor, land, lane wait

Registers every new key the plan reads. Keys go only through `core/config-standard` and `core/config-schema` (plan
rule; install/setup gate in AGENTS.md). No Rust or Node reader here: readers arrive in the phases that use the keys.
One owning proof: the existing config suite. `workerSlots.ceiling` is **not** changed here: `claimWork` reads it today
(`src/runner/claim-port.mjs:29-30,145`, null = unarmed), so its default, scope and doc move only in phase 17, together
with the old gate's removal (PS-12).

## Inputs
Step 0 first: re-grep every item. A finding that changes a plan decision stops the phase with `NEEDS_CONTEXT`.
- Current key: `core/config-standard/workerSlots.yaml` (`ceiling: null`), `core/config-schema/workerSlots.schema.yaml` (`type: [integer, "null"]`, owner comment `work-state`).
- Template: `core/config-standard/mailbox.yaml` (comment grammar `# @fgos:doc ...`) and `core/config-schema/mailbox.schema.yaml` (`x-fgos-scope`, `x-fgos-file`, `minimum`, `maximum`).
- Scope rule: `docs/platform/config/spec.md:69-77` (`x-fgos-scope: global-only|project-only|both`; machine keys are global-only).
- Section lists compiled into the binary: `packages/config/rust/src/bundle.rs:19` (`SCHEMAS`) and `:24` (`STANDARD`), both in schema-set order. A section file not named there is not loaded.
- Command-key precedent: `core/config-schema/runner.schema.yaml:489-495` (`verify`: `x-fgos-scope: both`, `x-fgos-sensitivity: command`, a `$comment` justifying a command read from the trusted main checkout).
- Fixtures: `packages/config/contracts/fixtures/README.md` (each file has one owning test; cases are hand-written in the case format, there is no regenerator). `registry-defaults.v1.json:14` and `authoring-source.config.json:1086` show the `workerSlots` section.
- Definition paths the watcher runs by default: this plan's `core/watcher/definitions` (phase 13); ops-metrics phase 14 `core/attention/definitions/` (`head-gone`, `plan-no-progress`; read the landed file names); the owner-question store's `core/questions/definitions` (its QP-12).
- Plan facts: PS-5, PS-12, PS-13, PS-21, PS-22, watcher-overdue factor `docs/discussions/ops-metrics/DISCUSSION.md:308-310` (k default 3).

## Footprint
`core/config-standard/watcher.yaml`, `core/config-standard/supervisor.yaml`, `core/config-standard/land.yaml`, `core/config-standard/workerSlots.yaml`, `core/config-schema/watcher.schema.yaml`, `core/config-schema/supervisor.schema.yaml`, `core/config-schema/land.schema.yaml`, `core/config-schema/workerSlots.schema.yaml`, `packages/config/**`.

## Steps
1. `watcher` section:
   - `enabled` boolean, default `false`, `x-fgos-scope: global-only` (decides what runs on this machine).
   - `activeIntervalSec` integer, minimum 1, default 60; `idleIntervalSec` integer, minimum 1, default 900 (PS-13).
   - `lookbackSec` integer, minimum 0, default 86400: how far before the last tick edge definitions look (PS-21).
   - `overdueFactor` integer, minimum 1, default 3 (read by `watcher-overdue`).
   - `definitions`: list of repo- or release-relative files or directories, each passed as one `--def`; standard
     `[core/watcher/definitions, core/attention/definitions/head-gone.query.json, core/attention/definitions/plan-no-progress.query.json, core/questions/definitions]`
     (step 0 confirms the two attention file names). A project may add its own. Pace definitions are not listed here
     (PS-22).
   - `defaultAction` enum `wake-supervisor|notify|none`, default `wake-supervisor`; `actions` object mapping a row kind
     to the same enum; standard `{supervisor-wake-failed: notify, supervisor-stuck: notify}`.
   - `notifyTo` string or null, default null: the mailbox recipient of `notify` rows (null: a notify row is counted in
     `errors` as `notify-unavailable`).
   - `wakeFailureLimit` integer, minimum 1, default 3: consecutive failed wakes before `supervisor-wake-failed`.
   - `stuckWakeLimit` integer, minimum 1, default 15: consecutive `already-live` wakes with events unhandled before
     `supervisor-stuck` (15 min at the active interval).
2. `supervisor.maxLeads` integer, minimum 1, default 4, scope both. The doc says it equals the lane default (Round 7:
   "default = the lane count") and is not derived at read time.
3. `land` section: `gates` array of `{run: string, when?: [string]}` (`when` = globs; the gate runs only if a landed
   path matches one; absent = always), default `[]`; `regenerate` object `{run: string, files: [string]}` or `null`,
   default `null`; each `run` string carries `x-fgos-sensitivity: command` and a `$comment` starting `justification:`
   like `verify`, scope both (commands are read from the trusted main checkout; trust boundary PS-19).
4. `workerSlots.laneWaitSec` integer, minimum 0, default 900, `x-fgos-scope: global-only`: how long a top-level worker
   seat waits for a free lane before `lane-pool-full` (PS-12). Leave `ceiling` and the section doc untouched.
5. Add `watcher`, `supervisor`, `land` to both lists in `bundle.rs` in schema-set (alphabetical) order. Touch no other
   `packages/config` file except a fixture whose owning test fails and names it; edit that case by hand in the case
   format (fixtures README), never by a docs verb.
6. Each key's `@fgos:doc` says unit, minimum, maximum when any, and default, like the mailbox keys.

## Verify
- `cargo test -p fgos-config` passes (golden schema, standard, scope and snapshot tests).
- `node scripts/run-tests.mjs test/config` (check `ls test | rg config`) passes.
- `npm run fgos:dev -- config show --json` lists the new sections and keys with their defaults; `config check` reports no finding.
- `rg -n "ceiling" core/config-standard/workerSlots.yaml` still shows `ceiling: null`.

## Rollback
Revert the phase commit. A project file that already sets a new key then fails `config check` by name until the line is
removed; nothing reads these keys before phases 6, 7, 11 and 16.
