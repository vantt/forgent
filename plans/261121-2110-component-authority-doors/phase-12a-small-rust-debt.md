# Phase 12a: Retire the small Rust debts (dead agy copy, single-load lock, winpid fixture, holder-lock flag reader, gateway home seam)

## Why now
The owner answered B to q-aanvfxaopa (2026-11-24): everything phase 8 left is named debt, and all debt is handled right
after component-authority releases. Release 9e5ae72c is active, and phases 10, 10b and 11 are done. This phase takes
the five rows whose survivor already exists and that no other plan owns. Phase 12 overview: `plan.md`, note
"Phase 12 cut".

## Inputs
- `packages/component-authority/model/doors/execution-doctor-judgments.yaml`, `kernel-lock-primitive.yaml`,
  `process-facts-proc.yaml`, `parse-cli-arguments.yaml`, `global-fgos-directory.yaml` (their `debt` and `retiredBy`).
- `test/architecture.test.mjs`: `NAMED_DOOR_DEBT` (line ~1811) and `checkDoors`.
- Survivors: `packages/execution/rust/src/checks.rs` (agy sub-home judgement), `packages/holder-lock/rust/src/port.rs`
  (`acquire`) and `packages/holder-lock/contracts/lock-registry.v1.json`, `packages/host-runtime/rust/src/cli_args.rs`
  (`parse_args`, the reader run-supervisor moved onto in phase 7), and the machine global-directory door that
  `global-fgos-directory.yaml` names as allowed.
- `reports/unit-261124-0235-p10b2-result.md` §3 (`fence_lock`, `TERM_WAIT_MS` and `KILL_WAIT_MS` copies in
  `borrow_vectors.rs`).

## Files it may write
packages/distribution/rust/src/agent_config.rs, packages/distribution/rust/src/lib.rs,
packages/git/node-addon/src/single_load.rs, packages/git/node-addon/Cargo.toml,
packages/holder-lock/contracts/lock-registry.v1.json, packages/holder-lock/rust/src/borrow_vectors.rs,
packages/holder-lock/rust/src/route.rs, packages/holder-lock/rust/Cargo.toml, apps/fgos-gateway/src/gateway.rs,
Cargo.lock, packages/component-authority/model/doors/execution-doctor-judgments.yaml,
packages/component-authority/model/doors/kernel-lock-primitive.yaml,
packages/component-authority/model/doors/process-facts-proc.yaml,
packages/component-authority/model/doors/parse-cli-arguments.yaml,
packages/component-authority/model/doors/global-fgos-directory.yaml, test/architecture.test.mjs,
docs/platform/packaging-distribution/spec.md, docs/platform/git/spec.md, docs/platform/holder-lock/spec.md

## Execution
`--provider claude` (owner order, D6 step 0). Each step is its own unit and its own commit, so a stopped step does not
hold the others back. A unit that cannot run cargo or node reports `blocked`; the lead runs the verify.

## Steps
1. **Execution doctor judgments.** Delete `find_agy_sub_homes` and `check_agy_sub_homes_configured` and their own
   tests from `packages/distribution/rust/src/agent_config.rs`, plus the module line in `lib.rs` if the file empties.
   The host already judges the row through `fgos-execution` `checks.rs`, and that crate's tests own the behaviour.
   Clear the row's `debt`, drop it from `NAMED_DOOR_DEBT`, and name the deleted path and its last SHA in the commit
   and in one decision-history line of `docs/platform/packaging-distribution/spec.md` (CA-D2).
2. **Kernel lock primitive.** Move the single-load marker in `packages/git/node-addon/src/single_load.rs` (Windows
   `CreateMutexW`, Unix `flock`) onto a holder-lock resource registered in `lock-registry.v1.json` and taken with
   `fgos_holder_lock` `acquire`. The node-addon already depends on `fgos-holder-lock`. The behaviour to keep is "a
   second load of the addon in the same process tree is refused". Keep the existing single-load test; if the addon
   has none, add one in the file that owns the module. Stop and report, without moving anything, if `acquire` needs
   a project state root that does not exist when the addon loads. Clear the row's debt, drop it from the list, and
   add a decision-history line in `docs/platform/git/spec.md`.
3. **Winpid fixture and the vector copies.** `borrow_vectors.rs:183` is a shell snippet that reads Git for Windows'
   `/proc/$!/winpid`. Only that shell can learn the Windows pid of its own background job, so this is not a copy of
   the `process facts: read /proc` door's job, and no Rust door can take it over. Move the entry from `debt` to
   `allowed` with `count` and that reason. In the same file, move `fence_lock`, `TERM_WAIT_MS` and `KILL_WAIT_MS`
   onto the holder-lock fence door they copy (p10b2 §3). If a copy carries a value the vectors rely on, keep the
   value and import the function. The row stays in `NAMED_DOOR_DEBT` for its other entry,
   `scripts/lib/mailbox-live-confined.mjs` (the frozen V7n module, which moves when backlog `p-irt4weqipe`
   re-measures the mailbox). The holder-lock spec gets a decision-history line.
4. **Holder-lock flag reader.** Move `Flags::parse` and the `--protocol` loop in `packages/holder-lock/rust/src/route.rs`
   onto `fgos_host_runtime::cli_args::parse_args`, the way phase 7 moved run-supervisor's reader.
   `workspace_argument` stays in place, because it judges a worker's argv. First check that a `fgos-holder-lock` →
   `fgos-host-runtime` crate edge passes the layer rules in `packages/component-authority/model/layers.yaml` and the
   architecture test. If it does not, stop and report, and the row keeps its S7 `retiredBy`. Otherwise clear the
   row's debt and drop it from the list.
5. **Gateway home seam.** Make `load_gateway_config` in `apps/fgos-gateway/src/gateway.rs` read the global directory
   through the machine global-directory door. Its test passes the home as that door's environment input, not as an
   explicit `home_dir` argument. Remove the `gateway.rs` entry from `global-fgos-directory.yaml` `debt`. The row stays
   named debt for its Node entries (deleted by `261122-2108-delete-dead-node-execution-closure` phase 8; checked in
   12c) and for `packages/holder-lock/rust/src/state_root.rs` (backlog `p-n22bigucgp` decides which home rule wins).

## Verify
- `cargo test -p fgos-distribution -p fgos-holder-lock -p fgos-git-node-addon -p fgos-gateway` is green. Take the
  exact package names from each crate's `Cargo.toml`.
- `node --test test/architecture.test.mjs` passes except A4, which is red on main too.
- `NAMED_DOOR_DEBT` no longer holds `execution doctor judgments`, `kernel lock primitive` or
  `parse CLI arguments (twin)` (unless step 4 stopped). `process-facts-proc.yaml` and `global-fgos-directory.yaml`
  have lost the `borrow_vectors.rs` and `gateway.rs` debt entries.
- `fgos authority model --json` loads.

## Rollback
Revert the step's commit. The deleted copy and its debt entry come back together.
