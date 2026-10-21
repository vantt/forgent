# Phase lead report: test governance phase 2, holder-lock

Date: 2026-10-21 (Asia/Saigon). Worktree `.claude/worktrees/test-p2-hl`, branch `chore/test-governance-p2-holder-lock`, base `bf24f3ad6`. Plan: [plan.md](../261020-1757-test-governance-port-inventory-and-slow-file-extraction/plan.md) (Phase 2, decision D2 narrow). Model: [phase-lead-261021-1129-test-governance-p2-ported-areas.md](phase-lead-261021-1129-test-governance-p2-ported-areas.md) §2, §3, §7. Owner rule: the suite does not get weaker. A test goes only when another named test owns its behaviour or the behaviour is gone.

## 1. Outcome

| Area | Node `test()` calls (files) | Rust tests | route | owns | contract-prose kept | Retired | Commit |
|---|---:|---:|---:|---:|---:|---:|---|
| holder-lock | 112 (20) -> 108 | 66 (`cargo test -p fgos-holder-lock -- --list`) | 7 | 74 | 27 | 4 `test()` calls + 15 generated vector cases | `4713a5131` |

- Retired: three `facade-multiprocess` tests that pass kernel cases through the facade unchanged, one contract-wording test with no behaviour, and 15 of the 18 generated `state-root vector:` cases. The `test()` call stays; its loop now runs only the 3 vectors that carry `FGOS_STATE_ROOT`.
- Kept on evidence: every other Node test. Most of `test/holder-lock` covers Node-only code (fences, `LockScope`, the hold transport, `runBorrowed`, driver errors, config reading), not a copy of the crate.
- No product, Rust, contract, plan or baseline file changed. `test/suite-baseline.json` was not refreshed (the `suite:` line still reads the baseline at `78334ff1d`).
- The controller's T0 phase 3 hold was lifted mid-task, so the liveness tests through `hold-transport.mjs` and `fences.mjs` were labelled under the normal rules. They all came out `owns`, so none was retired.

## 2. Gates

| Gate | Before (base `bf24f3ad6`) | After (`4713a5131`) |
|---|---|---|
| `npm test` `suite:` | `suite: 581 files, 8091 test() calls, 515 s wall (baseline 581 / 8087 / 202 s at 78334ff1d)` | `suite: 581 files, 8087 test() calls, 404 s wall (baseline 581 / 8087 / 202 s at 78334ff1d)` |
| change line | `suite: this change against bf24f3ad6: +0 -0 test() calls, 0 new CLI/host spawn site(s), 0 without a reason` | `suite: this change against bf24f3ad6: +0 -4 test() calls, 0 new CLI/host spawn site(s), 0 without a reason` |
| `npm test` results | 8778 tests, 8679 pass, **2 fail** (flakes, below), 32 skipped | 8759 tests, 8663 pass, 0 fail, 31 skipped; the run ended on `left temporary directories behind (fgos-direct-repo-*: 1)` (flake, below) |
| `cargo test --workspace` | 1236 passed, 0 failed | 1236 passed, 0 failed |
| coverage map (`node scripts/test-select-coverage-map.mjs`) | the controller's main map `cov-b2.json` (main at `4ebf60748`; this base adds only docs commits) | 331 sources before and after, **0 sources lost their last covering test**, 0 with fewer covering files (`cov-compare.mjs`). 6 files timed out during collection (the 4 run-supervisor crash/resume files, `runner/claim-port`, `runner/repo-locks-multiprocess`), none of them in this area |

Flakes. Each was rerun alone and passed. None is in a file this change touches:
- before: `test/runner/loop.test.mjs` "real concurrency: two independent ready items..." (the known `loop.test` real-concurrency flake) and `test/scripts/run-test-canary.test.mjs` "wrapper overhead ... median under 250ms" (timing under load). Both rerun alone together with the edited area: 238 tests, 0 fail.
- after: a leaked `fgos-direct-repo-*` dir (the known run-supervisor direct-harness flake). The five files that use `test/run-supervisor/support/direct-harness.mjs`, rerun alone: 71 tests, 0 fail, no dir left.

Test counts after: 8759 = 8778 - 4 retired `test()` calls - 15 generated vector cases. Skips went from 32 to 31 because the Windows-only `state-root vector: windows-userprofile` case is no longer generated (Rust still runs that vector on Windows). `npm test` and the mutation runs rewrote `packages/git/contracts/mutation-census.v1.json` every time; it was restored each time and is not committed. The coverage script's `plans/260922-test-suite-optimization/` output was copied to scratch and deleted.

## 3. Ports and their one route proof

| Port (route) | Route test | Evidence |
|---|---|---|
| lock-fd: acquire, probe, release (`fgos internal lock-fd --try/--shared-try`) | `facade-multiprocess.test.mjs:88` a lock acquired through the facade stays held after the helper exits and excludes another process | no Rust test catches HL-R1 (the route takes a shared lock); this Node test does |
| lock-fd: borrow, borrowed-check, drain | `run-borrowed-git.test.mjs:86` runBorrowed hands the description to git only... | HL-R7 fails it and the Rust vectors test |
| state-root (`fgos internal state-root`) | `state-root.test.mjs:49`, vector `blank-pinned-root-ignored` | only this test catches HL-N5 |
| quiesce-scan (`fgos internal quiesce-scan`) | `fences-stop-check.test.mjs:143` a node process running the payload ... is a blocker until it is gone | Node `checkStopped` over the real route |
| Windows lock-hold, borrow job, process-observe | `windows-facade.test.mjs:101`, `windows-borrow.test.mjs:82`, `windows-hot-lock.test.mjs:64` | skipped on Linux, so not mutated here |

## 4. Mutation evidence

Harness: scratch scripts, not in the repo. Each applies one exact-string edit, then runs `cargo test -p fgos-holder-lock` (Rust and contract edits only) and all 20 `test/holder-lock` files through `run-some.mjs`, plus the extra files named in the row. `run-some.mjs` uses the suite's env and rebuilds the host and addon from the edited tree. Then the file is restored. After every batch, `git status --short` and `git diff --stat` were empty apart from the rewritten census, which was restored.

| id | seeded mutation | Rust tests that fail | Node tests that fail |
|---|---|---|---|
| HL-R1 | lock-fd route locks with `Mode::Sh` instead of `Mode::Ex` (route.rs) | **none** | `facade-multiprocess`: :88, :114, :132, :152, :271; `lock-scope-order`:66 a real acquire out of order throws before any lock file is opened |
| HL-R2 | the predecessor rule never kills the domain (predecessor.rs, `if false && watch.kill_all()...`) | `predecessor_gate_is_killed_before_the_next_holder_proceeds` | `facade-multiprocess`:210 a live predecessor domain is killed at once... |
| HL-R3 | `lock_until` answers `Held` at its deadline instead of `Timeout` (port.rs) | `route::hold::tests::a_wait_that_runs_out_is_answered_timeout` | `facade-multiprocess`:152 a bounded wait on a held lock ends as timeout... |
| HL-R5 | the XDG state root joins `fgos-x` (state_root.rs) | `every_state_root_vector_resolves_as_the_contract_says` | `state-root`:49 vectors `xdg-state-home`, `empty-fgos-state-home-ignored` |
| HL-R6 | the lock-fd route answers a wait that ran out as `held` (route.rs) | **none** | `facade-multiprocess`:152 |
| HL-R7 | borrowed-check calls a description it cannot lock a borrower (port.rs) | `the_four_borrow_vectors_and_the_sibling_check_are_green` | `run-borrowed-git`:86; `fences-rust-locks`:116, :132 (fgctl activation runs the borrow vectors) |
| HL-R8 | quiesce-scan ignores the listed worktrees (route.rs) | `route::quiesce::tests::workspace_dirs_are_the_root_and_the_listed_worktrees_only` | `fences-stop-check`:230 a process working in a linked worktree blocks only when the caller lists that worktree |
| HL-N1 | `runBorrowed` stops prepending `-c gc.auto=0 -c maintenance.auto=false` to git (index.mjs) | n/a (Node-only edit) | **none** |
| HL-N2 | `release()` does not close the description (index.mjs) | n/a | `facade-multiprocess`:88, :114, :152, :271; `run-borrowed-git`:86, :178 |
| HL-N3 | a sync acquire that is not acquired leaves its description open (index.mjs) | n/a | `facade-multiprocess`:152 (fd count), :228 |
| HL-N4 | `LockScope` lets the same rank in twice (lock-scope.mjs) | n/a | `lock-scope-order`:37 the same rank twice in one scope is refused |
| HL-N5 | a blank `FGOS_STATE_ROOT` counts as a pin (state-root.mjs) | n/a | `state-root`:49 vector `blank-pinned-root-ignored` |
| HL-N6 | the `predecessor-domain-not-empty` answer is not mapped to its named error (index.mjs) | n/a | `facade-multiprocess`:228 a predecessor domain that cannot be killed fails by name... |
| HL-N7 | `workerBaseEnv` keeps `FGOS_LOCK_FD` (src/runner/dispatch/adapters.mjs; extra files `test/runner/dispatch/worker-env-case-context.test.mjs`, `test/session-identity/attempt-writer-id.test.mjs`, `test/runner/herdr-spawn-adapter.test.mjs`, `test/run-supervisor/direct-cutover.test.mjs`) | n/a | **none** |
| HL-N8 | `unlinkRecordIfUnchanged` drops its bytes check (src/state/hot-lock.mjs; extra files `test/state/hot-lock-multiprocess.test.mjs`, `test/state/hot-lock-tx.test.mjs`) | n/a | **none** |
| HL-N9 | `reclaimDeadHolder` drops its bytes check (same file, same extra files) | n/a | **none** |
| HL-N10 | `checkStopped` stops passing `--dir` for the listed worktrees (fences.mjs) | n/a | `fences-stop-check`:230 |
| HL-C1 | the registry gives `state` rank 45 (lock-registry.v1.json; extra file `test/state/hot-lock-tx.test.mjs`) | **none** (`registry_matches_node_for_every_row` reads the same file on both sides) | `registry-contract`:94 every lock rank exists in the rank table and fits the lock kind; :102 ranks follow the documented ordering of the locks |
| HL-C2 | the judge rule `t1.boot-id-differs` says `alive` while its vectors say `dead` (packages/process/contracts/process-facts.judge.v1.json; extra file `test/process/process-facts-vectors.test.mjs`) | not run for the process crate: `judge_vectors.rs` reads only rule ids and vector expectations, never `rule.result` | `registry-contract`:161 judge vectors state the same result as the rule they exercise... |

What the mutations decided:
- HL-R2: only the Rust test and `facade-multiprocess:210` see the missing kill. The facade adds nothing on that path; it forwards `--kill-wait-ms`, and HL-N3 and HL-N6 show `:228` proves the mapping of the answer. `:210` is a mirror.
- HL-R1 and HL-N2: `:114` and `:132` never fail alone, only together with `:88`, `:152` and `:271`. No seeded edit tells them apart, and a Rust test owns their kernel behaviour (§6).
- HL-R5 vs HL-N5: the formula cases fail in Rust and Node alike, and only `blank-pinned-root-ignored` sees the Node pin rule. So the loop is narrowed to the 3 vectors that carry `FGOS_STATE_ROOT`.
- HL-R1 and HL-R6 are route-only edits that no Rust test catches. That makes `:88` and `:152` the route proofs of the lock-fd answers.

## 5. Inventory (every Node test; line numbers at base `bf24f3ad6`)

Columns: E6 verdict, label, owner or evidence. "same as above" repeats the file's first row.

`test/holder-lock/driver-unavailable.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 22 | with no host binary every door fails by name and nothing is created | Kept | owns | Node driver: host resolution, the named `lock-driver-unavailable`, no lock dir, `workerBaseEnv` without a host; no Rust twin |
| 85 | a lock directory on a network filesystem is refused by name (guarantee none) | Kept | owns | same as above (Node maps the route's `none` guarantee) |
| 108 | a host that speaks another route protocol is refused by name, and a protocol-1 answer is never trusted | Kept | owns | same as above (Node protocol parser) |

`test/holder-lock/facade-multiprocess.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 88 | a lock acquired through the facade stays held after the helper exits and excludes another process | Kept | route | lock-fd acquire/probe/release wiring; the description lives in the caller; HL-R1 (no Rust test fails), HL-N2 |
| 114 | two scopes in one process are two descriptions and exclude each other | **Retired** | mirrors-Rust | `multiprocess.rs: two_descriptions_in_one_process_exclude_each_other`; the facade side is proved by :152 (a second scope of the same process times out, then takes the lock after release) and :271 (a second scope is held, then acquires after release) |
| 132 | a holder killed with SIGKILL leaves the lock free at once | **Retired** | mirrors-Rust | `multiprocess.rs: a_sigkilled_holder_frees_the_lock_at_once`; :88 proves the lock lives on the caller's own description, so it dies with that process |
| 152 | a bounded wait on a held lock ends as timeout, closes its description and holds nothing | Kept | owns | the route's timeout answer (HL-R6: Node only) and the closed description (HL-N3: Node only) |
| 176 | acquire refuses a missing scope and a bad wait before touching anything | Kept | owns | Node argument validation |
| 210 | a live predecessor domain is killed at once and acquire returns within milliseconds of its death | **Retired** | mirrors-Rust | `multiprocess.rs: predecessor_gate_is_killed_before_the_next_holder_proceeds` (HL-R2 fails both); :228 proves the facade wiring of the predecessor rule |
| 228 | a predecessor domain that cannot be killed fails by name within lock.predecessorKillWaitMs and leaves the lock free | Kept | owns | Node maps `predecessor-domain-not-empty` to the named error with the configured bound (HL-N6, HL-N3: Node only) |
| 256 | a malformed lock.predecessorKillWaitMs is refused, never guessed around | Kept | owns | Node config reader |
| 271 | the async acquire polls a held lock to timeout, then takes it once the holder releases | Kept | owns | Node async poll loop (HL-R1, HL-N2) |

`test/holder-lock/fences-main-door.test.mjs` (Node `fences.mjs` against the real v1 code; no Rust twin)

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 51 | the main checkout lock, one merge slot per local branch and the three old state store locks are tombstoned | Kept | owns | Node fence placement |
| 78 | the v1 main checkout acquire, the old hook inspection and the old merge slot all fail by name on the tombstones | Kept | owns | same as above |
| 104 | the v1 events lock, claims lock and porting events lock all fail by name on the tombstones, none takes the lock | Kept | owns | same as above |
| 130 | a v1 main checkout lock file that is still there stops the placement before anything is written | Kept | owns | same as above |
| 142 | a branch created after the fences were placed has no merge slot tombstone, and the status says which paths are missing | Kept | owns | same as above |
| 153 | a branch that shares its short name with a tag still gets the merge slot tombstone named after the branch | Kept | owns | same as above |
| 161 | the v1 pre-commit hook refuses a commit on main once the main checkout lock is a tombstone | Kept | owns | same as above |

`test/holder-lock/fences-rust-locks.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 69 | placeFences tombstones the three old paths, install once for the machine, and a second run changes nothing | Kept | owns | Node fence placement for the Rust callers' locks |
| 101 | an old observe lock file still there stops the placement and is left alone | Kept | owns | same as above |
| 116 | behind the fences the new fgctl activates the workspace and the Observe CLI takes its kernel lock | Kept | owns | Node fences composed with fgctl and the Observe CLI (HL-R7 also fails it, through fgctl's borrow vectors) |
| 132 | doctor names the three locks: lock-fences before the fences, lock-holders while a foreign process holds observe | Kept | owns | the installed doctor over the three Rust-caller locks; overlaps in part with `test/setup/holder-lock-checks.test.mjs` (§7) |

`test/holder-lock/fences-stop-check.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 126 | ownPidChain starts with this process and climbs through its parents | Kept | owns | Node `ownPidChain` |
| 134 | a workspace with no fgOS process is clean | Kept | owns | Node `checkStopped` result shape |
| 143 | a node process running the payload with its cwd in the workspace is a blocker until it is gone | Kept | route | quiesce-scan wiring |
| 160 | a blocker found before placement means nothing is placed | Kept | owns | Node `fenceCutover` ordering |
| 177 | a process that starts after the first scan is seen by the scan after placement | Kept | owns | same as above |
| 193 | a clean workspace is fenced and scanned clean again by the whole cutover step | Kept | owns | same as above |
| 217 | a pid the caller declares as its own is not counted, every other matching pid is | Kept | owns | `--exclude-pid` marshalling; no Rust test of exclusion |
| 230 | a process working in a linked worktree blocks only when the caller lists that worktree | Kept | owns | `--dir` marshalling (HL-N10: Node only); the Rust half is `workspace_dirs_are_the_root_and_the_listed_worktrees_only` (HL-R8 fails both) |

`test/holder-lock/fences-v1-ledger.test.mjs` (Node blocking generations against the real v1 ledger code)

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 66 | the real v1 ledger code acquires before the fence and refuses after it | Kept | owns | Node fences, no Rust twin |
| 112 | the blocking generation holds inside a fresh PID namespace too | Kept | owns | same as above |
| 136 | a live v1 holder in a ledger stops the placement and keeps its generation | Kept | owns | same as above; the only proof of `fences.mjs` `isPidAlive` (a live holder blocks, a dead one is fenced over) |
| 177 | a released v1 generation is superseded by the fence, and a second placement adds nothing | Kept | owns | same as above |
| 198 | a corrupt generation above the last readable one gets the fence published past it, and v1 still refuses | Kept | owns | same as above |
| 216 | without a provider-capacity runtime dir there is no ledger to fence | Kept | owns | same as above |

`test/holder-lock/fences-v1-tombstone.test.mjs` (Node tombstones against the real v1 lock code)

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 65 | placeFences tombstones every old file-lock path of the workspace, in both cwd forms | Kept | owns | Node fences, no Rust twin |
| 101 | a run made by the run supervisor after the cutover needs no recovery tombstone | Kept | owns | same as above |
| 112 | every real v1 acquire fails loudly against the tombstones instead of taking the lock | Kept | owns | same as above |
| 157 | an old lock file still present stops the placement before anything is written | Kept | owns | same as above |
| 175 | placing fences twice places nothing the second time and reports every path as skipped | Kept | owns | same as above |
| 188 | a tombstone directory whose record was never written is completed, not refused | Kept | owns | same as above |
| 198 | fenceStatus lists every missing path before placement and none after | Kept | owns | same as above |

`test/holder-lock/hold-transport-borrow.test.mjs` (the Node half of the hold transport against a fake helper; runs on every platform)

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 62 | sync borrow returns exit, stdout and stderr like the POSIX shape and removes its files | Kept | owns | Node `hold-transport.mjs`; the Rust half is Windows-only |
| 76 | a timeout sends a cancel and the borrow returns the helper answer | Kept | owns | same as above |
| 88 | a second borrow while one runs is answered borrow-busy | Kept | owns | same as above |
| 100 | async borrow is ChildProcess-shaped: pid, streams, spawn, exit, close, kill | Kept | owns | same as above |
| 124 | kill() cancels a blocked child within a second | Kept | owns | same as above |
| 141 | a child that cannot start is reported as an error event, not a pid | Kept | owns | same as above |
| 155 | sync hold capture honors per-call limits and refuses oversized path lists | Kept | owns | same as above |

`test/holder-lock/hot-lock-contract.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 16 | every hot resource is a hot-mutex registry row whose v3Path is its reclaim lock | Kept | contract-prose | cross-contract check (hot-lock vs the lock registry); the only test that catches the two contradicting each other (D2) |
| 30 | the record carries the full process tuple and cleanup needs the judge and the kernel lock | Kept | contract-prose | describes a behaviour with no owner: the bytes-equal check before unlink (HL-N8 and HL-N9 survive); D2 keeps it |
| 43 | the critical section forbids children and nesting, and names every error the module throws | Kept | contract-prose | pins the error list and the 5000 ms wait that `src/state/hot-lock.mjs` hardcodes; nothing else ties the code to the contract (D2) |
| 54 | HotLockError maps a timeout to the lock-timeout exit category and every other code to precondition | Kept | owns | Node `HotLockError` categories against the contract |

`test/holder-lock/lock-scope-order.test.mjs` (Node `LockScope`, a separate implementation from the crate's)

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 21 | a lower rank after a higher one is refused with the held and acquiring locks named | Kept | owns | Node `lock-scope.mjs` |
| 37 | the same rank twice in one scope is refused | Kept | owns | same as above (HL-N4: Node only) |
| 43 | ascending ranks pass, and a released lock no longer constrains the scope | Kept | owns | same as above |
| 57 | two scopes in one process keep separate rank histories | Kept | owns | same as above |
| 66 | a real acquire out of order throws before any lock file is opened | Kept | owns | Node order check before any I/O |
| 96 | two async acquires started together on one scope are checked against each other | Kept | owns | Node `reserve` across an async acquire |

`test/holder-lock/main-checkout-borrow-contract.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 15 | borrowing names the main-checkout row and the borrowed-check route | Kept | contract-prose | cross-contract (registry row, lock-fd `--borrowed-check` flag) and the `gitConfigPrefix`, whose behaviour has no owner (HL-N1 survives); D2 keeps it |
| 27 | the holder waits for the child and only the facade maps the description | Kept | contract-prose | describes behaviours with no owner: `workerBaseEnv` dropping `FGOS_LOCK_FD` (HL-N7 survives), and only the facade mapping a description; D2 keeps it |
| 35 | the borrow contract does not reach into the state store | **Retired** | contract-prose | asserts only that certain words are absent from the file; it describes no behaviour |

`test/holder-lock/registry-contract.test.mjs` (the lock registry, its schema, and the port and route contracts; the crate embeds only the registry and reads ranks from it)

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 79 | registry validates against its schema | Kept | contract-prose | shape lint; nothing else validates the registry against its schema |
| 83 | the schema rejects a 4.2 lock without a fence | Kept | contract-prose | same as above |
| 89 | lock names are unique | Kept | contract-prose | the crate takes the first row of a name, so only this test sees a duplicate |
| 94 | every lock rank exists in the rank table and fits the lock kind | Kept | contract-prose | HL-C1: no Rust test fails |
| 102 | ranks follow the documented ordering of the locks | Kept | contract-prose | HL-C1; Rust `every_r30_acquisition_profile_against_every_held_rank_subset` checks only the profile chains, not this order |
| 115 | every lock owned by 4.2 has a fence and a v1 shape that agrees with it | Kept | contract-prose | registry self-consistency |
| 127 | a tombstoned lock never takes its v3 lock at the path its tombstone occupies | Kept | contract-prose | same as above |
| 137 | machine and run locks keep the scope the plan gives them | Kept | contract-prose | same as above |
| 148 | judge vectors cover every row of both judge tables | Kept | contract-prose | row coverage is also in Rust `judge_vectors.rs: every_rule_in_the_table_is_pinned_by_at_least_one_vector` and `test/process/process-facts-vectors.test.mjs:59`; unique rule ids, table counts and vectors naming an unknown row are caught only here (§7) |
| 161 | judge vectors state the same result as the rule they exercise, except where a control says otherwise | Kept | contract-prose | HL-C2: the only test that catches a rule contradicting its vectors |
| 169 | judge vectors include the observer-outside-init-namespace case and the zombie states | Kept | contract-prose | only this test requires the X/Z zombie pair |
| 181 | judge vector names are unique | Kept | contract-prose | not caught elsewhere |
| 186 | the repo lock family keeps its ranks, v3 paths and tombstone fences | Kept | contract-prose | pins the repo family rows |
| 202 | the Rust-owned activation, install and observe locks are leaf mutexes fenced by tombstone | Kept | contract-prose | same as above |
| 226 | the Windows guarantee is kernel exclusion with job-scoped borrowing and unlistable holders | Kept | contract-prose | port contract lint; nothing reads it on Linux |
| 238 | the Windows borrower check names its four conditions and five refusal reasons | Kept | contract-prose | cross-contract (port vs lock-fd reasons) |
| 248 | the port contract names the new errors and the helper roles | Kept | contract-prose | port contract lint |
| 256 | the windows-job record carries every key of the domain shape | Kept | contract-prose | predecessor contract lint |
| 267 | lock-fd adds the path probe and the read-only predecessor state | Kept | contract-prose | route contract lint |
| 274 | lock-hold names its argv and every work-directory file | Kept | contract-prose | route contract lint |
| 282 | borrow vectors keep their names and state one assertion per platform | Kept | contract-prose | route contract lint |
| 289 | event-store mutex contracts pin names, ranks, paths and owner schema | Kept | contract-prose | registry rows and schema for the event-store mutexes |
| 302 | Git repo-config is a rank 80 leaf and Node leaves the held controller path to fgctl | Kept | owns | Node `placeFences`/`fenceStatus` `controllerMissing` behaviour |

`test/holder-lock/run-borrowed-git.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 86 | runBorrowed hands the description to git only, kills what the hook left behind, and leaves the lock free on release | Kept | route | borrow, borrowed-check and drain through the route (HL-R7, HL-N2) |
| 178 | runBorrowed prepends the gc guards to git only, refuses a released handle, and release waits for an async borrow | Kept | owns | Node argv for non-git commands, slot env, borrow counter (HL-N2) |
| 205 | Rust drain waits for a direct pre-exec child through both Node borrow paths | Kept | owns | both Node borrow paths over the drain |
| 237 | concurrent async sibling borrows are waited on and never killed by another drain | Kept | owns | Node `borrowRoots` / protected roots |

`test/holder-lock/state-root.test.mjs`

| line | test | E6 | label | owner / evidence |
|---:|---|---|---|---|
| 49 | `state-root vector: ${vector.name}` (loop) | Kept, narrowed | route + owns | now runs the 3 vectors with `FGOS_STATE_ROOT`: the two pinned ones test Node's pin rule, and `blank-pinned-root-ignored` is the route wiring proof (HL-N5). The 15 other generated cases are **retired**; their owner is `state_root_vectors.rs: every_state_root_vector_resolves_as_the_contract_says` (HL-R5 fails it) |
| 63 | a pinned root is read without any host binary, fresh on every call | Kept | owns | Node reads the pin fresh on every call |
| 78 | without a pin and without a host binary the root is not guessed | Kept | owns | Node error path |

`test/holder-lock/windows-borrow.test.mjs`, `windows-doctor.test.mjs`, `windows-facade.test.mjs`, `windows-hot-lock.test.mjs` (Windows-only, skipped on Linux, so not mutated here)

| file:line | test | E6 | label | owner / evidence |
|---|---|---|---|---|
| windows-borrow:69 | a sync borrow returns exit, stdout and stderr in the POSIX shape | Kept | owns | Windows hold transport (Node) over `lock-hold` |
| windows-borrow:82 | a borrowed git commit ends the background process its hook left, and a hook can prove it is a borrower | Kept | route | Windows borrow-job wiring |
| windows-borrow:120 | the credential probe works through spawnHolding: streams, close, and a judged answer | Kept | owns | Node `spawnHolding` |
| windows-borrow:147 | kill() cancels a blocked borrowed child within a second, and a probe timeout ends it | Kept | owns | same as above |
| windows-doctor:31 | lock-kernel-semantics reports lockfileex/kernel with a green probe | Kept | owns | doctor on Windows |
| windows-doctor:45 | lock-borrow-vectors runs on Windows and passes | Kept | owns | same as above |
| windows-doctor:56 | lock-holders passes on a fresh workspace | Kept | owns | same as above |
| windows-facade:73 | the stale work-directory sweep removes old directories of dead owners only | Kept | owns | Node `sweepStaleWorkDirs` (runs on Linux too); the only proof of `hold-transport.mjs` `pidAlive` |
| windows-facade:101 | a Node process holds the lock; another process sees held; a process that exits without release frees it | Kept | route | lock-hold wiring |
| windows-facade:126 | release is quick and an immediate acquire in the same process succeeds | Kept | owns | Node hold release |
| windows-facade:139 | a bounded wait against a holder times out within its bound and leaves no helper or work directory | Kept | owns | same as above |
| windows-facade:156 | a process that only holds a lock exits by itself and the lock is free afterwards | Kept | owns | same as above |
| windows-facade:171 | probe answers held and free | Kept | owns | same as above |
| windows-facade:181 | a Rust in-process holder and a Node holder exclude each other | Kept | owns | cross-implementation exclusion on Windows |
| windows-facade:200 | cold acquire and release latency over 50 pairs | Kept | owns | latency bound |
| windows-hot-lock:64 | the record of a holder carries its creation time | Kept | route | process-observe wiring |
| windows-hot-lock:82 | a holder killed inside withStateTx is reclaimed by a second process within the wait | Kept | owns | Node hot lock on Windows |
| windows-hot-lock:105 | a live holder is never reclaimed, and a second process times out instead | Kept | owns | same as above |

Label totals (112 `test()` calls at base): route 7, owns 74, contract-prose kept 27, retired 4. The `state-root:49` loop is counted as route.

## 6. Retired list with owners

| Retired | Owner now | `git log -S` origin |
|---|---|---|
| facade-multiprocess:114 two scopes in one process are two descriptions and exclude each other | `packages/holder-lock/rust/tests/multiprocess.rs: two_descriptions_in_one_process_exclude_each_other`; facade side `facade-multiprocess:152` and `:271` | `93c3b2503` (facade introduction, feature) |
| facade-multiprocess:132 a holder killed with SIGKILL leaves the lock free at once | `multiprocess.rs: a_sigkilled_holder_frees_the_lock_at_once`; lock on the caller's own description: `facade-multiprocess:88` | `93c3b2503` (feature) |
| facade-multiprocess:210 a live predecessor domain is killed at once and acquire returns within milliseconds of its death | `multiprocess.rs: predecessor_gate_is_killed_before_the_next_holder_proceeds` (HL-R2); facade mapping: `facade-multiprocess:228` | `93c3b2503` (feature) |
| main-checkout-borrow-contract:35 the borrow contract does not reach into the state store | behaviour gone: it asserts only that certain words are absent | `595374378` (refactor) |
| state-root:49, 15 generated cases (every vector without `FGOS_STATE_ROOT`, `fgos-state-home-wins` through `windows-userprofile`) | `packages/holder-lock/rust/tests/state_root_vectors.rs: every_state_root_vector_resolves_as_the_contract_says` (HL-R5) | `93c3b2503` (feature) |

No retired title was born in a bug-fix commit, so no case had to move into an owning proof. The helpers that only the retired tests used (`HOLD_HELPER`, `firstLine`, `exited`, the `spawn` import) went with them.

## 7. Gaps (survivors, for the owner; nothing was added, RUL104)

- **HL-N1**: Node `runBorrowed` can stop prepending `-c gc.auto=0 -c maintenance.auto=false` to git and every test still passes. `run-borrowed-git:86` sets `gc.auto=1` with loose objects but did not catch it. Rust `borrowing_git_disables_automatic_gc_and_maintenance` covers only the crate's own path. The contract wording (`main-checkout-borrow-contract:15`) is the only place this behaviour appears.
- **HL-N7**: `workerBaseEnv` can keep `FGOS_LOCK_FD` and every test still passes. The run-supervisor step env has its own test (`direct-cutover.test.mjs` "the step environment carries the state root and PATH and never a lock description"); the dispatch worker env has none. Only `main-checkout-borrow-contract:27` names this behaviour.
- **HL-N8 / HL-N9**: either of the two bytes-equal checks in `src/state/hot-lock.mjs` (`reclaimDeadHolder`, `unlinkRecordIfUnchanged`) can be removed on its own and every test still passes. They guard each other, so no single test pins either one. `hot-lock-contract:30` is the only place this behaviour appears.
- Possible duplicates outside this area (out of scope, not touched): `test/setup/holder-lock-checks.test.mjs:204`, `:223`, `:365` (lock-holders, lock-fences) overlap in part with `fences-rust-locks:132`, which adds the three Rust-caller locks and the installed doctor path. `holder-lock-checks:113` (malformed kill wait, doctor side) sits next to `facade-multiprocess:256` (facade side). `registry-contract:148` repeats the row-coverage half of `test/process/process-facts-vectors.test.mjs:59` and Rust `every_rule_in_the_table_is_pinned_by_at_least_one_vector`; it is kept for its Node-only checks.
- Noted, not a gap: `multiprocess.rs: wait_ms_times_out_and_nothing_is_kept` does not catch HL-R3 (`lock_until` timeout), because that test goes through another code path. The hold route test and Node `:152` catch it.

## 8. Unresolved questions

1. HL-N1 and HL-N7 have no owning proof. Should each get one (a Node test in `test/holder-lock/run-borrowed-git.test.mjs` and in `test/runner/dispatch/`)? Owner's choice.
2. Should the setup batch (the 59 `test/setup` clones item) take up the partial duplicates in `test/setup/holder-lock-checks.test.mjs`?
