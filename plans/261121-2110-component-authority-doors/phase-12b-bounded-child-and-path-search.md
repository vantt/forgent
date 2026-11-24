# Phase 12b: Close the bounded-child and search-path debt

## Why now
`run a bounded child and find a program on the search path` is the largest named-debt row: 19 files. Its `retiredBy`
says "each Rust caller moves onto spawn.rs when its crate next changes how it spawns". The owner answered B to
q-aanvfxaopa (2026-11-24), so all debt is handled right after the release instead. The own-child polls are among the
process-tier survivors that the answer names. Phase 12 overview: `plan.md`, note "Phase 12 cut".

## Inputs
- `packages/component-authority/model/doors/run-bounded-child.yaml` (19 `debt` entries, each with a reason).
- Survivor: `packages/process/rust/src/spawn.rs`: `run_bounded`, `run_bounded_command` and `resolve_program`.
- Phase 8 note in `plan.md` (slice 1, 7d084487a). Two moves were dropped there. The git PATH lookup was dropped
  because `resolve_program` has no absolute-entries-only mode. The node lookup in `attempt_step.rs` was dropped
  because the one-door census scan cannot follow `resolve_program`'s return. Teach the census scan first.
- `scripts/git-one-door-scan.mjs`, `packages/git/contracts/mutation-census.v1.json`, `test/git/one-door.test.mjs`.

## The three kinds of entry, and the shape chosen for each
Each `debt` reason already names its kind.
- **Search-path lookups** (`packages/config/rust/src/detect.rs`, `packages/distribution/rust/src/init.rs`
  `resolve_node_path`, `packages/git/rust/src/driver.rs` git lookup, `packages/run-supervisor/rust/src/attempt_step.rs`
  node lookup, `packages/process/rust/src/platform/windows_spawn.rs`, and the search part of
  `packages/process/rust/src/mapped.rs`) move onto `resolve_program`. `resolve_program` is extended in place with
  an absolute-entries-only mode and an "already has an extension" case. Extending the door is reuse, not a second
  door (design principle 1, L10).
- **Bounded runs with a deadline** (the deadline loop of `driver.rs`'s git children,
  `packages/mailbox/rust/store/src/adapters/version.rs`, `packages/mailbox/rust/store/src/nudge.rs`,
  `packages/host-runtime/rust/src/providers/external_process/bound_invocation_supervisor.rs`,
  `packages/run-supervisor/rust/src/steps.rs`, `packages/run-supervisor/rust/src/gate/windows.rs`,
  `packages/process/rust/src/containment/linux.rs`) move onto `run_bounded` or `run_bounded_command` where the
  shape fits. The survivor is extended only when the missing piece is small and at least two of these callers need
  it, for example an output cap. Otherwise the unit stops on that file and reports what `spawn.rs` lacks. That is a
  feature idea for the owner (RUL104), not something to add here.
- **Long-lived children the caller started and watches** (`apps/fgos-gateway/src/gateway.rs`,
  `apps/fgos/src/wiring/run.rs`, `packages/holder-lock/rust/src/borrow_windows.rs`,
  `packages/run-supervisor/rust/src/controller/launch.rs`, `packages/run-supervisor/rust/src/supervise.rs`,
  `packages/run-supervisor/rust/src/supervise/windows.rs`, `packages/terminal-control/rust/src/driver/herdr.rs`, and
  the poll in `mapped.rs`) are not this door's job. Each one calls std `Child::try_wait` on a service child, and no
  algorithm is copied. Those entries move from `debt` to `allowed`, each with `count` and its existing reason, and the
  row's `must not own` (or meaning sentence) says that watching a long-lived child you started is outside it.
  Rejected alternative: an owned-child wrapper type in `spawn.rs`. It would add a layer around one std call and
  remove no duplicated logic (RUL104: better, not bigger).
- Files inside `packages/process/rust` (`containment/linux.rs`, `mapped.rs`, `platform/windows_spawn.rs`) belong to
  the door's own crate. Each one either calls `spawn.rs` or is listed in `allowed` with its reason.

## Files it may write
packages/process/rust/src/spawn.rs, packages/process/rust/src/mapped.rs,
packages/process/rust/src/containment/linux.rs, packages/process/rust/src/platform/windows_spawn.rs,
packages/config/rust/src/detect.rs, packages/config/rust/Cargo.toml, packages/distribution/rust/src/init.rs,
packages/distribution/rust/Cargo.toml, packages/git/rust/src/driver.rs,
packages/mailbox/rust/store/src/adapters/version.rs, packages/mailbox/rust/store/src/nudge.rs,
packages/mailbox/rust/store/Cargo.toml,
packages/host-runtime/rust/src/providers/external_process/bound_invocation_supervisor.rs,
packages/host-runtime/rust/Cargo.toml, packages/run-supervisor/rust/src/attempt_step.rs,
packages/run-supervisor/rust/src/steps.rs, packages/run-supervisor/rust/src/gate/windows.rs, Cargo.lock,
scripts/git-one-door-scan.mjs, packages/git/contracts/mutation-census.v1.json, test/git/one-door.test.mjs,
packages/component-authority/model/doors/run-bounded-child.yaml, test/architecture.test.mjs,
docs/platform/process/spec.md

## Execution
`--provider claude` (owner order, D6 step 0). Run it as one unit per step. Steps 3 and 4 are one commit per crate, so a
stop on one file does not hold back the rest.

## Steps
1. Teach `scripts/git-one-door-scan.mjs` to follow a binary resolved through `resolve_program`, so that a git or node
   spawn whose program comes from it counts as resolved. Add one case to `test/git/one-door.test.mjs` and regenerate
   the census with `node scripts/git-one-door-scan.mjs --write-census`.
2. Extend `resolve_program` in `spawn.rs` with the absolute-entries-only mode and the "already has an extension"
   case, with one unit test each in `spawn.rs`'s own tests.
3. Move the search-path lookups onto `resolve_program`, one commit per crate. A crate that gains a `fgos-process`
   edge (`fgos-config`, `fgos-host-runtime`) must pass `packages/component-authority/model/layers.yaml` and the
   architecture test. If the edge is refused, stop and report that file.
4. Move the bounded runs onto `run_bounded` or `run_bounded_command`, one commit per crate, as described above.
   Before each move, keep or record the caller's existing timeout and kill test as the vector (the 488d3ab28 pattern).
5. Reclassify the long-lived children and the process-crate files in `run-bounded-child.yaml`, as described above.
6. Clear the row's `debt`. Remove `run a bounded child and find a program on the search path` from `NAMED_DOOR_DEBT`
   only if no entry is left. Otherwise, give the remaining entries a `retiredBy` that names the stop report, and keep
   the row in the list. Write one decision-history line in `docs/platform/process/spec.md` naming each moved copy and
   its last SHA (CA-D2).

## Verify
- `cargo test -p fgos-process -p fgos-config -p fgos-distribution -p fgos-git -p fgos-mailbox-store -p fgos-host-runtime -p fgos-run-supervisor`
  is green. Take the exact package names from each `Cargo.toml`. Known reds that are also red on main may be named
  as such (the head-request contract missing `config patch`).
- `node --test test/git/one-door.test.mjs test/architecture.test.mjs` passes except A4, which is red on main too.
- `node scripts/git-one-door-scan.mjs --write-census` leaves no diff after the final commit.
- `run-bounded-child.yaml` has no `debt` entry, or only entries the stop report names.

## Rollback
Revert the commit for the step or crate. The caller's own loop and its debt entry come back together.
