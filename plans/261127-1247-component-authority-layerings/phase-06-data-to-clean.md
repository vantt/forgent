# Phase 6: Data to clean: ranks, exceptions, ports, owners

Every violation counted in phase 5 is resolved in the model: a data error is fixed, a real
violation becomes a named exception with its reason (CAS-D23, CAS-D9, CAS-D10). No code is
refactored.

Capability: `code:implement`.

## Inputs

- `reports/measure-layerings.md` (phase 5).
- DISCUSSION §4 CAS-D4, D10, D17, D19, D21 (host-runtime tier note), D23; §6 "Hệ quả khi thực
  hiện" (1)-(5).
- `packages/component-authority/model/{components,contracts}.yaml`.

## Files this phase may write

Its footprint row in plan.md.

## Steps

1. Re-rank `hexagon` defaults per CAS-D4 as measured in phase 5 step 6.
2. Coverage: give every ownerless directory an owner (the CAS-D23 cases: `fgos-node-addon`, the
   9 ownerless crates, the 20 ownerless code directories), choosing the component by what the code
   does and confirming with `fgos authority locate`; a directory that truly belongs to nobody
   goes to `coverage.ignore` only if it is not product code, with its reason.
3. `platform-foundations`: one exception per file under `src/util/` with its own rank (CAS-D19);
   list the files for the secretary's backlog row on splitting `src/util/` (phase 9).
4. `stack`: a crate dependency that runs upward is either a wrong tier (fix the row) or real
   (named exception, e.g. `fgos-config`, `fgos-identity` → `fgos-git`). `host-runtime`: if its
   routing part pulls it above T3, split by path exception (shared low part vs.
   `operation_provider_router`, `invocation_service`, `providers`) per the CAS-D21 note.
5. Ports: for every contract that is a hexagon port, add `port: {kind, implementers}`
   (CAS-D10); the provider is the side that needs the capability.
6. `orchestration-ring`: resolve any order violation as data or a named exception.
7. Every remaining real violation is an `exceptions` line `{path, <layering>: <value>, reason}`;
   for a component that mixes roles and is not split, the reason says so and names the backlog
   row to be opened (listed for phase 9).
8. Re-run the report tests and write `reports/measure-layerings-after.md`: every count zero.
9. Render with the worktree code and check.

## Verify

`node --test test/architecture.test.mjs`, `cargo test -p component-authority`,
`npm run fgos:dev -- authority render --check`; pass: green and every count in
`measure-layerings-after.md` is zero.

## Rollback

Revert the phase merge; the rules are still in report mode, so nothing else depends on it.
