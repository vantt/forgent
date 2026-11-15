# Phase 05 report: `lock fence` native

Branch `rust-verb-migration-program/s2-p05`, cut from s2 `203e44c26`. Two foreign commits ride on it until their phases land
(they drop out on rebase): `8724ccb3a` (phase 04: `scope::entry` is `pub(crate)`) and `23e8b3305` (phase 02: registry flag order and
Node-grammar unknown-flag text).

## What changed

- `packages/holder-lock/rust/src/fence.rs`: the fence state machine (registry-row path resolution incl. `cwdDevIno`, listing, self
  refusal, refuse-unless-confirmed, SIGTERM by identity, 5000 ms wait, SIGKILL, 3000 ms wait, probe; hot-record path through
  `hot_record::{read_record,clear}`). Signals only through `fgos_process::control`. `TERM_WAIT_MS` / `KILL_WAIT_MS` named constants.
- `packages/process/rust/src/control.rs`: `self_chain`, `tuple_of`, `signal_record` moved in (the addon's private copies deleted);
  the addon `process.rs` calls them.
- Host: `apps/fgos/src/wiring/lock_fence.rs` (provider, descriptor, projector reading only the shared parser), `holder-lock.fence`
  in `catalog.rs`, arms in `main.rs`/`cli_projector.rs`, `("lock", ["fence"])` in `routing.rs`, annotation, `native: true`, routes and
  manifest regenerated, census regenerated.
- S23-Q3 = (b): without `--yes` the verb prints the holders (Node's exact lines) and refuses `lock-fence-not-confirmed`, exit 2, on a
  terminal too. Registry text and `core/skills/fgos-lock-fence/SKILL.md` say so; render surfaces rebuilt with `npm run build:skills`.
- Deleted: `src/runner/lock-fence.mjs`, the `bin/fgos.mjs` arm, `confirmFence`, the `readline` import, the `ARM_STATIC_IMPORTS` line,
  the `manifest.files` entry. `clearHotRecord` in `src/state/hot-lock.mjs` takes only a token or a read (text form dropped).
- `doors` row "fence a registry lock" (door, no debt): patterns `export function fenceLock`, `const TERM_WAIT_MS`,
  `const KILL_WAIT_MS ... = 3000`, `lock-fence-not-confirmed`; allowed `fence.rs`. Negative case: a scratch
  `src/runner/zz-scratch-fence.mjs` with `export function fenceLock() {}` fails the row by name; removed. The plan's bare
  `\bKILL_WAIT_MS\b` pattern hit `borrow_vectors.rs:32` (an unrelated private constant of 2000 ms), so the pattern names the value.

## Parity (host against base release `8d6a07c4c`, entry `node:<base>/bin/fgos.mjs` plus the staged env)

`test/rust-host/parity-cases/lock.cases.mjs`: 35 cases, 35 green (exit code, stdout, stderr byte for byte after scrubbing paths, pids,
start times, envelope time and hash; the host entry starts zero Node processes). Cases: no sub / unknown sub (exit code only: accepted
text change), no name, `--yes main-checkout`, unknown flag, `--param=ref=1`, `--yes=true`, unknown lock, three bad `--param`s,
path param missing (merge-slot, event-seal), outside a project, free rows (fixed, machine, parametric, repeated param, cwd-keyed,
`--dir` from outside), hot record (absent x2, torn with/without attestation, unjudgeable with/without, dead, live unconfirmed and
confirmed), held (unconfirmed, confirmed, parametric, SIGTERM-ignoring holder killed, held by the runner itself).
The case table needs a fresh fixture per entry, which `runDifferentialCase` cannot give (static cwd/env), so the table exports
`runPreparedCase(entryA, entryB, case)` beside `cases`; the step runner must call it for tables whose cases have `prepare`. My local
driver is `.fgos/runtime/tmp/lock-parity.test.mjs` (untracked, not committed). Log `/dev/shm/rvm-s2-p05-parity-1.log`.

## Retired test -> owner now

| retired | owner now |
|---|---|
| `lock fence main-checkout: lists the holder pid, refuses without --yes, ... --yes ends the holder` | `fence.rs`: `a_held_lock_is_listed_and_left_alone_without_confirmation`, `a_confirmed_fence_ends_the_holder_with_sigterm_and_frees_the_lock`; wiring: `cli_tests.rs` `lock_fence_refuses_without_yes_then_ends_the_holder_and_starts_no_node` (also owns "no `--yes` signals nothing, exit 2" and zero Node) |
| `lock fence escalates to SIGKILL when the holder ignores SIGTERM` | `fence.rs` `a_holder_that_ignores_sigterm_is_killed_after_the_term_wait` |
| `lock fence on a lock nobody holds reports free` | `fence.rs` `a_lock_with_no_file_or_no_holder_is_free_and_nothing_is_created_or_signalled` |
| `lock fence takes a lock path parameter with --param` | `fence.rs` `a_path_the_registry_needs_a_value_for_is_never_guessed` (param missing, `ref=main`, empty value) and `a_dispatch_cwd_lock_is_keyed_by_the_directory_the_cwd_param_names`; "the other target keeps its slot" is one path per resolved name (same tests) |
| `lock fence never fences a lock held by the process that runs it or its parents` | `fence.rs` `a_lock_held_by_this_process_is_never_fenced`, `a_hot_record_naming_this_process_is_never_fenced`; parity `held-by-the-runner-is-refused` |
| `lock fence refuses an unknown lock name and a missing name` (bad sub-verb included) | `fence.rs` `a_lock_the_registry_does_not_name_is_refused_by_name`; missing name: `lock_fence.rs` projector (parity `no-lock-name`); missing/unknown sub: `routing.rs` sub-command check (accepted host text) |
| `parseLockParams reads repeated key=value pairs` | `fence.rs` `params_are_key_value_pairs_that_may_carry_an_equals_sign` |
| `lock fence state: unreadable record needs --attest-stopped ... live holder ended by --yes` | `fence.rs` `a_hot_record_that_does_not_parse_needs_the_attestation_and_is_then_removed`, `a_hot_record_whose_holder_is_alive_is_ended_only_once_confirmed`, `a_hot_record_whose_holder_cannot_be_judged_here_needs_the_attestation`; byte-level torn-record clear stays with `hot_record.rs` / `hot-lock-tx.test.mjs` |
| `fenceHotRecord on a holder that died between judge and signal returns at once` | the window needed a confirm callback, which no longer exists (confirmation is the `--yes` flag, so nothing sits between judge and signal). Its behaviour that still exists, a vanished holder is sent nothing and never waited on: `fence.rs` `a_holder_that_is_already_gone_is_not_waited_on_and_nothing_is_sent` |
| `fenceHotRecord on a record whose holder is already dead` | `fence.rs` `a_hot_record_whose_holder_is_dead_is_cleared_without_a_signal` |
| (kept) `main-checkout-reset while another process holds main` | unchanged, same file |
| the "fenced lock as `lock-status` reports it" assertions (`lockStatus()` helper) | `fence.rs` asserts the lock reads free through `probe` after a fence; the `lock-status` view itself is phase 04's proof |

## Gates

- `cargo fmt --all --check`, `cargo clippy -p fgos-process -p fgos-holder-lock -p fgos-node-addon -p fgos -p fgos-host-runtime --all-targets -- -D warnings`: clean.
- `cargo test -p fgos-process -p fgos-holder-lock -p fgos-host-runtime -p fgos`: all green (log `/dev/shm/rvm-s2-p05-cargo-1.log`).
- `cargo check --locked --target x86_64-pc-windows-msvc` and `aarch64-apple-darwin` on the same crates: clean (no warning from the new files).
- Census regenerated: `0 undeclared`; Git classes `git-driver 1`, `sandbox-door 2` (phase 00 numbers); `rust-test` 161 -> 162 (the new holder-child test).
- `node scripts/run-tests.mjs`: `fgos-lock-fence`, `subcommand-flag-drift`, `architecture`, `git-mutation-census`, `command-routes`, `hot-lock-contract`,
  `hot-lock-tx`, `hot-lock-multiprocess`, `windows-hot-lock`, `process-facts-vectors`, `fgos-manifest`, `command-registry`: 0 failures (122 + 94 tests).
- Not run, need a release build (`help-routes.test.mjs` calls `buildRustDistribution`, wants `target/release/libfgos_node_addon.so`): heavy, so I did not start it.
  It reads `command-routes.json` and the manifest; please run it at the step gate.
- `harness.test.mjs` R5 `coverage-validation-failure` fails here (`show <id>` from `os.tmpdir()` exits 1, expected 4): the failure is the Node
  entry refusing with `git-addon-unavailable` on a bare `node bin/fgos.mjs` in `/tmp` (reproduced on the base release by hand), not a lock path. Not caused by this change.

## Proposed `## [Unreleased]` line

`fgos lock fence` without `--yes` lists the holders and refuses (exit 2), on a terminal too; it no longer asks `Stop these processes? [y/N]`. Rerun the call with `--yes` to fence them.

## Accepted changes (differences from the base release)

- `lock fence` without `--yes` refuses (exit 2) on a terminal too; the `[y/N]` prompt is gone.
- A missing or unknown sub-command (`lock`, `lock unlock`) is the host's one text, exit 4.
- `fgos lock fence dispatch-cwd --param cwd=<dir>` on Windows: the `<cwdDevIno>` key (dev, ino, birth time of the directory) is computed on unix only in Rust, so there the param is reported `lock-path-param-missing`; Node computed it. The row's holders are unlistable on Windows anyway.
- A refused signal after earlier holders were already signalled now names those holders in the message (`; already sent term: pid ...`).
- A dead holder's hot record is still labelled `attested-free` without `--attest-stopped`, as Node prints it; the parity case `hot-record-dead-holder` pins that label.

## Concerns / for the step lead

1. `src/state/hot-lock.mjs` `clearHotRecord` has no production caller left (only `hot-lock-tx.test.mjs`). Retiring it fully means deleting the addon binding
   `hotRecordClear` in `packages/git/node-addon/src/holder_lock.rs` and the pattern in the "read and clear a hot mutex record" row: files owned by phase 03,
   so I left them. Suggest folding that into 11.
2. `docs/platform/holder-lock/spec.md` section 17 point 2 ("It asks the person to confirm") is now stale, plus `docs/reading-map.md` and the route counts: phase 11's doc pass.
3. New file `apps/fgos/src/wiring/lock_fence.rs` and one line in `wiring/mod.rs` are not in the plan's Create/Modify list; the provider cannot live in `holder-lock` (no host-runtime edge).
4. `catalog.rs` count assertion is now 17; phases 02 and 04 add their own operations, so the number needs a recount at the second landing.
5. `cwdDevIno` unix-only: recorded under accepted changes.
6. A fence call blocks the host's single thread while it waits (up to 8 s); fine for a one-shot verb, same as Node's event loop wait.

Status: DONE_WITH_CONCERNS
