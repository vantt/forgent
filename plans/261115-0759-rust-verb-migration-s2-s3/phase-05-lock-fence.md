---
phase: 5
title: "`lock fence` native"
status: pending
effort: 2d
wave: C
step: S2
blockedBy: [0, 3]
landsAfter: [4]
---

# Phase 05: `lock fence` native

The fence state machine (list holders, confirm, SIGTERM by identity, wait, SIGKILL, probe, clear a hot record) is
Node (`src/runner/lock-fence.mjs`, 196 lines) over Rust primitives. It moves into the holder-lock crate, signalling
only through the process door. A native provider never waits for a person (migration doc §9), so the confirmation
becomes a `parked` answer that the CLI host turns into the terminal question.

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s2-p05`, cut after 03 landed; lands after 04
(both add a module line to `packages/holder-lock/rust/src/lib.rs` and a case to `cli_tests.rs`). Report slug `s2-p05-lock-fence`.

## Context

- Registry `src/cli/command-registry.mjs:2464-2492`: `fence <name>`, `--param k=v` (repeatable), `--yes`,
  `--attest-stopped`; `store: 'require'`, `mutatesStore: ['fence']`. `param` is a repeatable flag of the shared
  parser (`REPEATABLE_FLAGS`, `packages/host-runtime/rust/src/cli_args.rs:12`).
- Arm `bin/fgos.mjs:3774-3791`; `confirmFence` 330-340 (holder list on stderr, prompt `Stop these processes? [y/N] `
  only when stdin and stderr are TTYs, else "no"); `lockErrorToStoreError` 322-326 (shared with `main-checkout-reset`).
- `src/runner/lock-fence.mjs`: `TERM_WAIT_MS` 5000 :18, `KILL_WAIT_MS` 3000 :19, `parseLockParams` :28,
  `lockParamsFor` :42, `fenceLock` :97; refusals `unknown-lock`, `lock-fence-not-confirmed`, `lock-fence-self`,
  `lock-fence-unlistable`, `lock-fence-still-held`, `lock-param-invalid`, `lock-path-param-missing`,
  `lock-not-node-owned` (exit 2, text `lock fence: <msg>`); data `{ lock, path, status, holders, terminated, killed }`.
- Rust: `holders`/`probe` (`port.rs`), `signal_by_identity` and `self_chain` (process control, `packages/process/rust/src/control.rs:103`; addon `process.rs:106, 164`), `hot_record.rs` (03). Holder-lock spec §17.
- Host: `ProviderOutcome::Parked` exists (`packages/host-runtime/rust/src/contracts.rs:239`), presented as
  `fgos: parked: <reason>` (`apps/fgos/src/cli_presenter.rs:266`).

## Requirements

1. `packages/holder-lock/rust/src/fence.rs`: `fence(request, confirmed: bool) -> FenceOutcome` with Node's states and
   refusal codes; signals only through `fgos_process` (the `process control` `doors` row's allowed list already holds
   `packages/process/rust/src/**`; `fence.rs` must not match its patterns); waits 5000/3000 ms as named constants;
   the hot-record path through `hot_record.rs`; `--attest-stopped` only re-probes.
2. Confirmation: without `--yes`, the provider returns `Parked { reason: "lock-fence-confirm", holders }`. The CLI host
   (the presenter, one function, not the provider) writes Node's exact stderr list, asks on a TTY with Node's exact
   prompt, and reinvokes the same request with `confirmed: true` on yes; on no or without a TTY it reports
   `lock fence: lock-fence-not-confirmed ...` with exit 2, byte-equal to Node. The provider never reads stdin.
3. Host wiring: operation `holder-lock.fence` (write, `idempotency: None`), projector reading `fence`, the positional
   name, `param` (repeatable), `yes`, `attest-stopped` from `cli_args` only, `NATIVE_SUBCOMMANDS` `("lock", ["fence"])`,
   annotation, `native: true`.
4. Parity `lock.cases.mjs` (fresh fixture per entry; a real holder process started by the case): free lock (exit 0);
   held + `--yes` (fenced: TERM honoured); held + a TERM-ignoring holder (killed); held without `--yes` and no TTY
   (exit 2, nothing signalled); `--param` parametric merge-slot; unknown name; bad sub; self refusal; `state` hot record
   dead / unreadable with and without `--attest-stopped`; `--yes main-checkout` flag-before-positional (Node reads
   `main-checkout` as the value of `--yes`: the host must answer the same).
5. Delete: `src/runner/lock-fence.mjs`, static import `bin/fgos.mjs:105`, `ARM_STATIC_IMPORTS` line
   (`test/architecture.test.mjs:1691`), the arm, `confirmFence` (if no other arm calls it); the fence cases of
   `test/cli/fgos-lock-fence.test.mjs` (keep the `main-checkout-reset` case at 163, and the file, renamed only if the
   step lead asks). `lockErrorToStoreError` stays for `main-checkout-reset`.
6. `doors` row "fence a registry lock": patterns `export function fenceLock\b`, `\bTERM_WAIT_MS\b`, `\bKILL_WAIT_MS\b`,
   `lock-fence-not-confirmed`; allowed `packages/holder-lock/rust/src/fence.rs`, the host presenter file that prints the
   refusal (reason: CLI text of a parked answer).
7. Text references (`src/holder-lock/index.mjs:118`, `test/state/hot-lock-multiprocess.test.mjs:175`,
   `test/holder-lock/windows-hot-lock.test.mjs:167`) name `fgos lock fence` the verb, not the module: unchanged unless
   they name the deleted file.

## Test owners after the move

| Behaviour | Old proof | Owner now |
|---|---|---|
| confirm / `--yes`, SIGKILL escalation, free lock, `--param`, self refusal, unknown name, hot-record `state` path (10 cases) | `test/cli/fgos-lock-fence.test.mjs` | `fence.rs` unit tests (real child processes, temp lock roots) |
| the prompt and the no-TTY refusal | same file | presenter unit test (`cli_presenter.rs`) + one `cli_tests.rs` case (no TTY, exit 2, nothing signalled) |
| `fenceHotRecord` dead-holder paths | `fgos-lock-fence.test.mjs:240-290` | `hot_record.rs` (03) + `fence.rs` |
| `main-checkout-reset` lock case | `fgos-lock-fence.test.mjs:163` | unchanged |

## Files

- Create: `packages/holder-lock/rust/src/fence.rs`, `lock.cases.mjs` (deleted by 11).
- Modify: `packages/holder-lock/rust/src/lib.rs`, `catalog.rs`, `apps/fgos/src/{main.rs,cli_projector.rs,cli_presenter.rs,routing.rs}`,
  `apps/fgos/tests/cli_tests.rs`, annotations, registry, generated route files, `bin/fgos.mjs`, `test/architecture.test.mjs`,
  `test/cli/fgos-lock-fence.test.mjs`, `docs/architecture-manifest.json`, `test/suite-baseline.json` (row 37 if the
  file's cost changes), census, the parity runner's `TABLES`.
- Delete: `src/runner/lock-fence.mjs`.

## Gates

- `cargo fmt --all --check`; `cargo clippy -p fgos-holder-lock -p fgos --all-targets -- -D warnings`;
  `cargo test -p fgos-holder-lock -p fgos`; msvc and darwin checks (Windows and macOS: `unlistable` holders need
  `--attest-stopped`, as Node)
- `node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs test/cli/fgos-lock-fence.test.mjs test/state/hot-lock-multiprocess.test.mjs test/holder-lock/windows-hot-lock.test.mjs test/rust-host/command-routes.test.mjs test/cli/subcommand-flag-drift.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`
- `core/skills/fgos-lock-fence/SKILL.md` read: still true (it names the verb, not Node).

## Risk and rollback

- Signalling a wrong process (L x H): only `signal_by_identity` (start-time checked); a holder that changed identity is not signalled; parity case with a reused pid where 00 finds one is constructible.
- A blocked prompt in a non-interactive agent call (M x M): TTY check on stdin and stderr, as Node.
- Rollback: revert the phase.
