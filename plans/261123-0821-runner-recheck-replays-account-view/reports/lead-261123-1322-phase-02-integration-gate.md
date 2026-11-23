# Phase 2: integration gate, live check passed, full suites need an unconfined host

## Outcome

The fix works live. On release `df57ddfcd609` (contains `2b903592c`), a writing unit bound deepseek/thehive while
gemini was quarantined, recorded `accountState` on its attempt, and committed through the write gate with no binding
mismatch. The full gate run on `main` found one compile break that phase 1 caused in a bin test; the fix landed as
`280c484ab`. Acceptance 3 (`cargo test --workspace`, `npm test`) could not run from this lead's sandbox and is handed
to the supervisor.

## Acceptance checks

| AC | Check | Result |
|---|---|---|
| 1 | `cargo test -p fgos-execution-engine --test assignment_runner` | pass, 28 passed (unit c-84280 worker, and this lead earlier at `c4b3fb883`) |
| 2 | `cargo test -p fgos-execution-engine --test unit_run` | pass, 44 passed (unit c-84280 worker) |
| 3 | `cargo test --workspace` | **not run to completion here**, see below. It did find one real break, now fixed |
| 3 | `npm test` | **not run here**: `scripts/run-tests.mjs` stages the git addon with `cargo build --locked -p fgos-node-addon`, which fails `Read-only file system (os error 30)` on the shared cargo build directory |
| 4 | `rg -n "accounts: None" .../assignment_runner/legality.rs` | pass, no hit |
| 5 | both docs name `binding-replay-account-view-mismatch` and `-missing` | pass, one hit each in `executor-model.md` and `h-6979005beaf7/spec.md` |
| 5 | `node scripts/plan-contract-check.mjs --plan plans/261123-0821-runner-recheck-replays-account-view` | pass, `ok` |
| 6 | live check | pass, below |

### The break the workspace run found

`apps/fgos/src/wiring/unit_run_host/tests/mod.rs:435-441` (`a_seat_binds_to_the_executor_the_machine_can_start`)
still indexed the result of `accounts::bind` as a JSON value. Phase 1 made it return `BoundSeat`, so the `fgos` bin
test target stopped compiling (E0608, E0277, E0599). The land gates do not build that target, so it reached `main`
with `2b903592c`. Unit c-114995 (`unit-run-1795414231355-8ed8aba7`) read `.binding` in both calls with every assertion
kept (commit `5131bd349`), landed as `280c484ab` with all land gates green.

### Why acceptance 3 did not finish here

The lead's sandbox sees the shared cargo build directories (the main checkout's and the p02 worktree's) as read-only.
A private build in the session temp directory needs more than the 16 GB tmpfs holds: the third attempt, on `main` at
`280c484ab`, filled it and failed at link time. The partial build was removed. Earlier runs in phase 1 were killed by
OOM. Nothing indicates a test failure beyond the compile break above; the suites simply have to run where the build
directory is writable.

## Live check (acceptance 6)

Unit `unit-run-1795414231355-8ed8aba7`, capability `execute`, no provider pin:

- attempt `producer/1` bound `deepseek` / pool `thehive` at bind time (not a fallback);
- the attempt carries `accountState { at, overlay }`, and the overlay holds gemini `tetcu72` and `tetnu` with
  `quarantinedUntil` set;
- outcome `pass`, commit `committed` `5131bd349`. Before the fix this exact shape was refused with
  `binding mismatch: recomputed { executor: gemini ... } does not match assignment { executor: deepseek, pool: thehive ... }`
  (units c-72536 and c-74587, 11:07).

Unit `unit-run-1795413024078-d44e13a3` (c-84280) also recorded `accountState` on each of its three attempts and passed on
a deepseek/thehive fallback, but it committed nothing, so it does not prove the gate.

## Hand-offs to the supervisor

1. `CHANGELOG.md` `## [Unreleased]`, once `261121-2110-component-authority-doors` releases the file: "Fixed: a writing
   unit bound while an account was quarantined is no longer refused by the write gate with a binding mismatch; the gate
   replays the account state the bind read."
2. Draft plan `261122-2108-delete-dead-node-execution-closure`: when it retires
   `test/golden-recorders/assignment-runner.recorder.mjs`, it must keep the three `rust-owned:` cases in
   `packages/execution/contracts/assignment-runner/legality.v1.json`. A rerun of that recorder before then deletes them.
3. Backlog `p-drfxqdzzon` closes with this plan.
4. Acceptance 3: run `cargo test --workspace` and `npm test` on `main` (at or after `280c484ab`) on a host with a
   writable cargo build directory, and record the result here.
5. Worktree kept: `/home/vantt/projects/forgent-worktrees/261123-0821-runner-recheck-replays-account-view-p02`
   (`worktree-dirty-preserved`; only an untracked `.probe` the c-84280 worker left; branch fully landed). Safe to remove.
6. The land gates do not compile the `fgos` bin's unit tests, which is how the break above reached `main`.

## Acceptance 3, closed 14:00

lead:SUPERVISOR ran both suites at `deaedf06d`, which contains `2b903592c` and `280c484ab`
(`plans/261123-0726-contract-check-in-confined-heads/reports/npm-test-full.md`):

- `cargo test --workspace --no-fail-fast`: 4301 passed, 1 failed. The red is `head_request`
  `the_contract_names_exactly_the_refusal_codes_and_verbs_the_server_speaks`, red since 4951cf3da, before this plan.
  `assignment_runner` is green, including the three `rust-owned:` cases.
- `npm test`: 7923 tests, 7883 passed, 12 failed. Every red is classified there as pre-existing or owned by another
  lane (DOCOS release workflows, the run-tests fixture, the dev-host consumers case of plan 261123-0726). None touches
  a path in this plan's footprint.

Acceptance 3 holds for this plan's change. Every acceptance criterion is met; the plan is done.
