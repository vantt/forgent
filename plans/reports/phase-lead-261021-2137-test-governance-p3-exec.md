# Test governance phase 3: execution and workflow slow files

Branch `chore/test-governance-p3-exec`, gated on `3599d6967` (on `180ed62fd`), then rebased on `225fa0896`; that rebase changed none of these files. Commits: `078b75dee` (run.test), `eb0915443` (workflow-runner and the new direct test), `c8c36007f` (advisory-m, units-runner, failover). Product code untouched; `test/suite-baseline.json` and the mutation census untouched.

## 1. Outcome

The machine ran at load 9–50 the whole time, so wall seconds alone swing by ±30 %. The steady measure is **real seat dispatches** (host `internal supervise` execs, counted with strace). It was counted with the base copy and the branch copy of each file running side by side under the same load.

| File | Alone before → after (s, `node --test` duration) | Side by side, base → branch (s) | Seat dispatches base → branch | Tests before → after |
|---|---:|---:|---:|---:|
| test/runner/execution/run.test.mjs | 184 → 152 | 138 → 116 | 108 → 88 | 86 → 79 |
| test/workflow/workflow-runner.test.mjs | 175 → 153 | 200 → 178 | 111 → 96 | 64 → 64 |
| test/runner/execution/run-provider-failover.test.mjs | 143 → 111 | 109 → 105 | 70 → 67 | 28 → 27 |
| test/workflow/advisory-m-contracts.test.mjs | 104 → 75 | 74 → 61 | 79 → 63 | 6 → 5 |
| test/workflow/units-runner.test.mjs | 78 → 97 (load) | 77 → 77 | 36 → 35 | 24 → 23 |
| test/workflow/playbook-observable-order.test.mjs | 42 → 44 (unchanged file) | 68 → 68 | 62 → 62 | 3 → 3 |
| test/workflow/unit-handoff.test.mjs (new) | — → 0.02 | — | 0 | 0 → 6 |
| **Total** | | **666 → 605** | **466 → 411 (−12 %)** | **211 → 207** |

All files pass alone after every rebase (0 failures).

**Where the time goes.** No case in these files goes through the CLI apart from a few cheap parity tests (each under 1 s). They call `runUnit` / `startWorkflow` directly already, so the "move to a direct use-case test" lever does not exist above them. Every second is spent in real confined seats. A strace of one solo seat took about 1.1–1.3 s, made of: the host `internal supervise` and `gate`, bwrap, the worker, two Node child processes for `attempt-step finalize-home` and `settle-attempt` (about 150–250 ms each), host `lock-fd` and `identity` calls, and around 15 bwrap-confined git calls. That cost sits in product code, not in the tests.

**In-file concurrency does not help.** I ran the nine independent playbook runs of the order guard with `Promise.all`: 42 s → 44 s. The seat path does its child-process work synchronously, so in-process runs cannot overlap. I reverted that change. Only fewer seat runs make these files cheaper.

## 2. What moved where

No assertion was dropped. Every merged case keeps all its assertions inside the test that now owns it.

| Retired / changed case (origin) | Now owned by |
|---|---|
| run: "panel members run on different provider families" (`31ea82107`, fix) | run: "panel members run on different provider families; when they take every family the synthesizer still runs, on the least used one" (same 3-family panel run, both assertion sets) |
| run: "a panel with enough provider families lands every seat on its own family…" (`c821a6fc8`); "the panel synthesizer runs on a provider family none of the panelists used" (`2ce06ea00`) | run: "a panel with enough provider families lands every seat on its own family, the synthesizer on one no panelist used, and only the synthesizer is told to read the panelist reports" (one 4-family default panel; the explicit `params.members` path stays proven by the 6-member case) |
| run: "a reviewed run never lets the producer family also check its own work" (`5f915db15`, fix) | run: "a reviewed run never lets the producer family also check its own work; the reviewer is told to review and handed the producer's report" (same alpha/beta reviewed run) |
| run: "a seat the earlier run did not have is refused…" (`b19643448`) | run: "each role of a panel gets its own seat's earlier report as own-previous…; a seat the earlier run did not have is refused by name" (reuses its first panel) |
| run: "a resume refuses a unit record carrying a seatSchema from a newer release…" (`17f551556`) | run: "a unit-run input reaches the roles…; a resume refuses a record from a newer release" (reuses its settled first solo) |
| run: "mutating gate: admits mutating unit in linked worktree matching unit.json" (`073c8b6fc`, feat; asserted only `unitRunId` and `rounds`) | run: "after a producer round passes, the runner commits what the worker wrote…" (a writing solo admitted in its linked worktree, plus the commit) |
| workflow-runner: 13 packet shapes of "producer expertise gate parks clearly on malformed packets…" (`fcfeafba7`, fix) | the shapes go to **test/workflow/unit-handoff.test.mjs**, a direct test of `renderGateQuestion` on settled records: valid lists, five wrong shapes (`RunnerConfigError`), three non-JSON reports (`SyntaxError`), an edited report (`report-changed-after-settle`). The runner test keeps one readable packet (with the tamper → `check-sha` path), one wrong shape and one fenced report, one for each refusal branch of the runner's catch. |
| workflow-runner: 7 scenarios of "expertise gate reads the settled report, then an untouched packet file…" (`ce880fbed`, fix) | all 7 are in unit-handoff.test.mjs. The runner keeps one scenario (a packet file beside a prose report) as "an expertise gate reads the packet file a producer wrote beside its prose report, judged against the settlement time the run recorded". It is the only proof that the run hands `settledAt` to the gate. |
| workflow-runner: "resume uses the persona text pinned at start after the file is edited or deleted", the edited case (`73cc780af`) | workflow-runner: "a named persona lands on its own seat only…; a resume after the file is edited uses the text pinned at start" (reuses the parked run); the deleted case stays in the retitled resume test |
| advisory-m: "registered advisory reopen preserves done reviewer findings through explanation and owner close" (`fcfeafba7`, fix) | advisory-m: "architecture-advisory: bounded findings reach synthesis/gate; transport failure blocks; the registered reopen keeps the findings…" (reopens the parent that case already settled) |
| failover: "a unit's run timeout rides every attempt…" (`1de852877`) | failover: "rotation stops after the accounts the provider has, then the walk leaves the provider; the unit's run timeout rides every attempt" (same fixture) |
| units-runner: "a unit's timeoutMs in a units file reaches the Unit and its dispatch; one out of range is refused…" (`5693500c3`) | units-runner: "a unit's timeoutMs in a units file reaches the Unit and its dispatch and wins over workflow start --timeout; one out of range is refused" (adds the unit record, `run.json` and 4 h checks to the u-custom unit) |

**New test file:** `src/workflow/unit-handoff.mjs` had no test file of its own, so its first owning proof gets one. There are six tests, each named by behaviour. I checked them by mutation: dropping the `missing_expertise` spelling, ignoring the packet mtime, or dropping the `trim()` check each fails a test. Reversing the packet-file order fails none, and no test proved that order before either.

## 3. Gates

Before, from the controller's shared gate on clean `406a81f98`:
- npm test: 8724 tests, 8626 pass, 2 fail (land.test and session.test load flakes, 40/0 alone), 31 skipped. `suite: 582 files, 8078 test() calls, 530 s wall`.
- cargo test --workspace: 1243 passed, 0 failed.

After, on `3599d6967`, rebased on `180ed62fd`:
- npm test: 8705 tests, 8609 pass, **0 fail**, 31 skipped.
  `suite: 583 files, 8058 test() calls, 402 s wall (baseline 581 / 8084 / 202 s at 21a4fdc29)`
  `suite: this change against 180ed62fd: +17 -21 test() calls, 0 new CLI/host spawn site(s), 0 without a reason`
  The run printed two `run-tests: ERROR` lines, neither caused by my files. One is the known `.fgos/runtime/git-addon/*/manifest.json` leak (HARDEN). The other is one leaked `fgos-direct-repo-*` directory, which comes from `test/run-supervisor/support/direct-harness.mjs` (a known flake).
- cargo test --workspace: **1243 passed, 0 failed** (`--no-fail-fast` run). A first run stopped at one failure in `packages/distribution` `store::tests::test_lock_exclusive_and_release` (`lock3.is_ok()`), a temp-dir lock test that reuses its pid-named directory. No Rust changed on this branch, and the full rerun passed.
- No new CLI, host or fgctl spawn and no change to what a CLI call loads, so `--cli-cost` is not needed.

Voided runs, for the record:
- My first before-gate ran in this worktree while I was already editing; I stopped it.
- One after-gate failed 16 tests and cargo `kill_append`. A root-owned mount at `/var/tmp/fgos-e1/mnt` (another lane) made bwrap refuse to mount during 23:12–23:28. Run alone afterwards, the 14 failing files passed 462/0 and `kill_append` passed 9/0.
- The controller killed another after-gate for the quiet window.

## 4. Coverage

`node scripts/test-select-coverage-map.mjs` on `3599d6967` (583 files, 15.1 min, 0 timed out), compared with `cov-compare.mjs` against the controller's `cov-p3base.json`: **332 sources before, 332 after, 0 lost their last covering test, 0 with fewer covering files.** Map copied to the scratch dir `p3-exec/cov-after.json`; the generated `plans/260922-…` directory was deleted.

## 5. Files I could not improve, and why

- **playbook-observable-order** (one test, 9 playbooks, 62 seats). Each playbook is a separate baseline row, and running them side by side gains nothing (§1). No smaller fixture keeps the guarantee that every registered playbook runs in its committed order. Unchanged.
- **run-provider-failover** and **units-runner**. Each case is a distinct rotation, walk or scope policy proven at the wiring level. The decision logic already has its own tests (`account-rotation`, `tier-fallback`, `account-pin`, `partial-writes`), and these files are the one wiring proof above them. Only one same-fixture pair each could merge. Reader versus writer pairs on the same fixture (dead login, family skip) go through different gates (the mutating gate and the partial-writes check), so they stay.
- **What is left in all six files:** about 1.2 s of product work per seat (§1). The two Node `attempt-step` child processes per seat and the bwrap-wrapped git calls are product cost that a test cannot remove. That is a candidate item for HARDEN, not for TEST.

## 6. Unresolved questions

1. Seat cost in product code: should one seat's `attempt-step finalize-home` and `settle-attempt` run in-process or in the host instead of as two Node child processes? That would cut these six files, and every other seat-running file, by an estimated 25–35 %. It is a product change, outside TEST's frame; it is worth a ledger item if HARDEN agrees.
2. H2 (longest-first ordering): these files remain 60–180 s each because of the seat cost, so H2's trigger "one file still holds the tail" depends on the suite re-measure the controller is doing.
