# Phase 12d: Retire the second copies phase 10b found, and give the unprobed rows their names

## Why now
Phase 10b (4f38d6db0) added `names` to 13 rows and `primitives` to none. Every candidate also matched files outside the
row's `allowed` and `debt`. Some of those matches are callers, and some are real second copies of the door's job that
no row recorded (`reports/unit-261124-0235-p10b2-result.md` §3). Some rows were never probed (§4). An unrecorded copy
is debt the guard cannot see. Under owner answer B to q-aanvfxaopa (2026-11-24), it is retired with the named debt.
Phase 12 overview: `plan.md`, note "Phase 12 cut".

## Inputs
- `reports/unit-261124-0235-p10b2-result.md` §3 (the matches outside `allowed` and `debt`) and §4 (rows left without
  `names`, including the two marked "not probed").
- Door rows and their survivors: `civil-date-arithmetic.yaml` (`packages/host-runtime/rust/src/civil_time.rs`),
  `managed-timer.yaml` (`packages/distribution/rust/src/timer.rs`), `skill-generated-stamp.yaml`
  (`packages/distribution/rust/src/skill_stamp.rs`), `shell-rc-fgos-lines.yaml`
  (`packages/distribution/rust/src/rc_lines.rs`), `compose-git-status-and-recovery.yaml`,
  `event-store-maintain-policy.yaml`, `coexistence-manifest.yaml`, `packaging-doctor-judgments.yaml`.
- The phase 2a nit in `plan.md` (lead note, 2026-11-24 08:30): the `fix-alpha` fixture now carries explicit
  `repairs`, so "a fix without `repairs` repairs its own id" has no direct unit assertion.

## Files it may write
apps/fgos/src/wiring/migrate.rs, apps/fgos/src/wiring/observe_sources/plan_history.rs,
packages/convention/rust/src/operations.rs, packages/execution/rust/src/unit_record/timestamp.rs,
apps/fgos/src/wiring/doctor/mailbox.rs, apps/fgos/src/wiring/uninstall.rs, apps/fgos/src/wiring/init.rs,
packages/convention/rust/Cargo.toml, packages/execution/rust/Cargo.toml, packages/distribution/rust/src/doctor.rs,
Cargo.lock, packages/component-authority/model/doors/, test/architecture.test.mjs,
docs/platform/component-authority/spec.md, packages/component-authority/contracts/model.v1.json,
packages/component-authority/rust/

## Execution
`--provider claude` (owner order, D6 step 0). Run one unit per row group. The unit needs node and cargo. If they are
refused, the unit reports `blocked` and the lead runs the guard. Phase 10b showed that names checked by hand are not
proof.

## Steps
1. For each match in p10b2 §3, decide **caller** or **copy**. A caller uses the door's own function. A copy redoes
   the door's job with its own code.
   - A caller joins the row's `allowed` with `count` and a one-line reason, for example `read_git_status` in
     `apps/fgos/src/wiring/git_incidents.rs`, or `write_coexistence_manifest` in `init.rs`.
   - A copy moves onto the survivor named in the row, with the caller's existing test kept as the vector. Then the
     copy is deleted (CA-D2, last SHA in the commit). Known candidates: `civil_from_days` and `days_from_civil` in
     `migrate.rs`, `plan_history.rs`, `convention/rust/src/operations.rs` and `execution/rust/src/unit_record/timestamp.rs`
     (survivor `civil_time.rs`); `check_managed_timer` and `fix_managed_timer` in `doctor/mailbox.rs`, and
     `remove_managed_timer` and `unit_stem` in `uninstall.rs` (survivor `timer.rs`); `generated_skill_dirs` and
     `owned_skill_names` in `uninstall.rs` (survivor `skill_stamp.rs`); `rc_files_sourcing` in `uninstall.rs` (survivor
     `rc_lines.rs`).
   - A new crate edge must pass `layers.yaml` and the architecture test. If it fails, stop on that copy, record it as
     named debt with a `retiredBy` naming the stop report, and go on.
   - `fence_lock`, `TERM_WAIT_MS` and `KILL_WAIT_MS` belong to 12a. The `footprint` and `decide-a-dispatch` matches
     belong to 12c.
2. Add the names step 1 cleared to each row's `names`, and `primitives` where they no longer collide. Probe the two
   "not probed" rows (`packaging-doctor-judgments` and `execution-doctor-judgments`), plus the rows §4 says already
   carry identifier `patterns`. Give each one `names`, or a one-line reason in the report why not.
3. Add the missing unit assertion that a fix without `repairs` repairs its own id, in the test module of
   `packages/distribution/rust/src/doctor.rs`.
4. Write one decision-history line in `docs/platform/component-authority/spec.md` that names the copies deleted here
   and their last SHAs.
5. Add the one-word `severity` field to every door row and to the model contract (owner decision D24 in
   `plans/discussions/ds-wqsrwmiier-harden-next-round/DISCUSSION.md`, row N18). Values: `high`, a live twin that decides a
   live answer which can disagree; `medium`, a live side that only asks the owner; `low`, a twin reached only by dead
   code. A row with no `debt` and no twin gets `low`. Declare the field in `packages/component-authority/contracts/model.v1.json`
   and in the crate's model types (`packages/component-authority/rust/`), so `fgos authority model --json` and
   `locate` return it; name it in the spec's door-row field list. One commit, separate from the copy moves.

## Verify
- `node --test test/architecture.test.mjs` passes except A4, which is red on main too, and every allowed file carries
  its measured `count`.
- `cargo test -p fgos -p fgos-convention -p fgos-execution -p fgos-distribution` is green. Take the exact package
  names from each `Cargo.toml`.
- Every file in `packages/component-authority/model/doors/` has `severity`, and `fgos authority model --json` loads.
- Re-running p10b2 §3's `rg -w` sweep for each cleared name finds hits only in the row's `allowed` or `debt` files.

## Rollback
Revert the row group's commit. The copy comes back, and the row loses the names that only the deleted copy kept from
matching.
