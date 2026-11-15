---
phase: 5
title: "`lock fence` native"
status: pending
effort: "1.5d (S23-Q3 = b); 2d (a); 0.25d (c, hand-off note only)"
wave: C
step: S2
blockedBy: [0, 3, S23-Q3]
landsAfter: [4]
---

# Phase 05: `lock fence` native

> Owner answer applies (2026-11-15 08:41): S23-Q3 = b. Without `--yes` the verb lists the holders and refuses with `lock-fence-not-confirmed` (exit 2), on a terminal too; the (a) and (c) branches below are not taken.

The fence state machine (list holders, confirm, SIGTERM by identity, wait, SIGKILL, probe, clear a hot record) is Node
(`src/runner/lock-fence.mjs`, 196 lines) over Rust primitives. It moves into the holder-lock crate, signalling only
through the process door. How a person confirms is S23-Q3; this file gives the requirements for each answer.
**If S23-Q3 = (c):** this phase only writes one line into the program plan's S6a row ("`lock fence`, held in Node until
a work-lifecycle reinvoke exists") and one into its S2 row.

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s2-p05`, cut after 03 landed; lands after 04
(both add a module line to `packages/holder-lock/rust/src/lib.rs` and a case to `cli_tests.rs`). Report slug `s2-p05-lock-fence`.

## Context

- Registry `src/cli/command-registry.mjs:2464-2492`: `fence <name>`, `--param k=v` (repeatable), `--yes`,
  `--attest-stopped`; `store: 'require'`, `mutatesStore: ['fence']`. `param` is a repeatable flag of the shared parser
  (`REPEATABLE_FLAGS`, `packages/host-runtime/rust/src/cli_args.rs:12`).
- Arm `bin/fgos.mjs:3774-3791`; `confirmFence` 330-340 (holder list on stderr; prompt `Stop these processes? [y/N] ` only
  when stdin and stderr are TTYs, else "no"); `lockErrorToStoreError` 322-326 (shared with `main-checkout-reset`).
- `src/runner/lock-fence.mjs`: `TERM_WAIT_MS` 5000 :18, `KILL_WAIT_MS` 3000 :19, `parseLockParams` :28, `lockParamsFor` :42,
  `fenceLock` :97 (confirm at 128-134 sees the same holder list it then signals); refusals `unknown-lock`,
  `lock-fence-not-confirmed`, `lock-fence-self`, `lock-fence-unlistable`, `lock-fence-still-held`,
  `lock-fence-signal-refused` (60), `lock-param-invalid`, `lock-path-param-missing`, `lock-not-node-owned` (exit 2, text
  `lock fence: <msg>`); data `{ lock, path, status, holders, terminated, killed }`.
- Rust: `holders`/`probe` (`port.rs`), `signal_by_identity` (`packages/process/rust/src/control.rs:103`), `self_chain`
  only in the addon (`packages/git/node-addon/src/process.rs:164-177`), `hot_record.rs` (03). Holder-lock spec §17.
- Host: refusals through D3 (01); `Parked` exits 0 and carries `reason` and `diagnostics` only
  (`packages/host-runtime/rust/src/contracts.rs:239-243`, `apps/fgos/src/cli_presenter.rs:266-269`); `run_native`
  invokes once (`apps/fgos/src/main.rs:318-388`).

## Requirements

1. Move `self_chain` from the addon into `fgos-process` (`control.rs`); the addon entry calls it (D10, no new edge).
2. `packages/holder-lock/rust/src/fence.rs`: `fence(request) -> FenceOutcome` with Node's states and refusal codes; signals
   only through `fgos_process` (the "process control" `doors` row allows `packages/process/rust/src/**`; `fence.rs` must
   not match its patterns); waits 5000/3000 ms as named constants; the hot-record path through `hot_record.rs`;
   `--attest-stopped` only re-probes; self refusal through `self_chain`.
3. Confirmation, by S23-Q3's answer:
   - **(b, recommended):** without `--yes`, `fence` lists the holders (Node's exact stderr lines) and refuses
     `lock-fence-not-confirmed` (exit 2) on a terminal too; no prompt. `core/skills/fgos-lock-fence/SKILL.md` flow
     step 3 says "rerun with `--yes`" (rebuild render surfaces with `npm run build:skills`).
   - **(a):** without `--yes` the provider answers "needs confirmation" with the holders' identities (pid + start time)
     in the refusal outcome's diagnostics; `run_native` (one generic loop, not the presenter) asks on a terminal with
     Node's prompt and reinvokes with `confirmed: [identities]`; `fence.rs` signals only holders that are confirmed and
     still holding, and answers "needs confirmation" again for a new holder; without a terminal the refusal is Node's.
     A test proves an unconfirmed holder is never signalled and that a parked fence never exits 0.
4. Host wiring: operation `holder-lock.fence` (write, `idempotency: None`), projector reading `fence`, the positional
   name, `param` (repeatable), `yes`, `attest-stopped` from `cli_args` only, `NATIVE_SUBCOMMANDS` `("lock", ["fence"])`,
   annotation, `native: true`; refusals through D3 with Node's text and exit 2.
5. Parity `lock.cases.mjs` (fresh fixture per entry; a real holder process started by the case): free lock (exit 0);
   held + `--yes` (TERM honoured); held + a TERM-ignoring holder (killed); held without `--yes` and no terminal (exit 2,
   nothing signalled); `--param` parametric merge-slot; unknown name; missing name; bad sub; self refusal; `state` hot
   record dead / unreadable with and without `--attest-stopped`; `--yes main-checkout` (Node reads `main-checkout` as the
   value of `--yes`: the host must answer the same).
6. Delete: `src/runner/lock-fence.mjs` and its `manifest.files` entry, static import `bin/fgos.mjs:105`, `ARM_STATIC_IMPORTS`
   line (`test/architecture.test.mjs:1691`), the arm, `confirmFence`; the fence cases of `test/cli/fgos-lock-fence.test.mjs`
   (keep the `main-checkout-reset` case at 163 and the file). `lockErrorToStoreError` stays for `main-checkout-reset`.
7. `doors` row "fence a registry lock": patterns `export function fenceLock\b`, `\bTERM_WAIT_MS\b`, `\bKILL_WAIT_MS\b`,
   `lock-fence-not-confirmed`; allowed `packages/holder-lock/rust/src/fence.rs` (and, under (a), the host file that
   prints the prompt, with its reason).

## Test owners after the move

| Behaviour | Old proof | Owner now |
|---|---|---|
| `--yes`, SIGKILL escalation, free lock, `--param`, self refusal, unknown name, hot-record `state` path (10 cases) | `test/cli/fgos-lock-fence.test.mjs` | `fence.rs` unit tests (real child processes, temp lock roots) |
| no terminal / no `--yes` refuses and signals nothing | same file | one `cli_tests.rs` case (exit 2, holder alive) |
| the prompt (only under (a)) | same file | `run_native` loop unit test + the "never signals an unconfirmed holder" test |
| `fenceHotRecord` dead-holder paths | `fgos-lock-fence.test.mjs:240-290` | `hot_record.rs` (03) + `fence.rs` |
| a fenced lock as `lock-status` reports it | the case using the `lockStatus()` helper (25) | `fence.rs` test reading `status::collect` |
| `main-checkout-reset` lock case | `fgos-lock-fence.test.mjs:163` | unchanged |

## Files

- Create: `packages/holder-lock/rust/src/fence.rs`, `lock.cases.mjs` (deleted by 11).
- Modify: `packages/process/rust/src/control.rs`, `packages/git/node-addon/src/process.rs`, `packages/holder-lock/rust/src/lib.rs`,
  `catalog.rs`, `apps/fgos/src/{main.rs,cli_projector.rs,routing.rs}` (and `cli_presenter.rs` under (a)), `apps/fgos/tests/cli_tests.rs`,
  annotations, registry, generated route files, `bin/fgos.mjs`, `test/architecture.test.mjs`, `test/cli/fgos-lock-fence.test.mjs`,
  `core/skills/fgos-lock-fence/SKILL.md` (under (b)), `docs/architecture-manifest.json`, `test/suite-baseline.json` (row 37
  if the file's cost changes), census, the parity runner's `TABLES`.
- Delete: `src/runner/lock-fence.mjs`.

## Gates

- `cargo fmt --all --check`; `cargo clippy -p fgos-process -p fgos-holder-lock -p fgos-node-addon -p fgos --all-targets -- -D warnings`;
  `cargo test -p fgos-process -p fgos-holder-lock -p fgos`; msvc and darwin checks (`unlistable` holders need `--attest-stopped`, as Node)
- `node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs test/cli/fgos-lock-fence.test.mjs test/state/hot-lock-multiprocess.test.mjs test/holder-lock/windows-hot-lock.test.mjs test/process/process-facts-vectors.test.mjs test/rust-host/command-routes.test.mjs test/cli/subcommand-flag-drift.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`
  (no Node test calls `selfChain` directly on `e6b78d1d1`; the self refusal is proven in `fence.rs` and the parity case)

## Risk and rollback

- Signalling a process nobody saw (M x H): (b) has no confirmation step to race; (a) carries the confirmed identities.
- Signalling a wrong process (L x H): only `signal_by_identity` (start-time checked).
- Rollback: revert the phase.
