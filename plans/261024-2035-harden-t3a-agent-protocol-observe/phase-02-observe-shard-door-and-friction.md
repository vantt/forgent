---
phase: 02
title: "Observe: one shard door for every store, friction fixes, thin Node client"
status: pending
depends_on: [01]
parallel: "with phase 03 (disjoint files); before 04 and 05 (same crate, same registrations.mjs)"
effort: ~1.5d
net_size: "Node −120 / Observe Rust src −50 (±40) / tests +190 (red tests landed, folded per principle 8) — estimates"
---

# Phase 02 — Observe shard door and friction

## Context

Arbitration §2.2 "One shard door", "Friction rules", "Rust/Node boundary", doctor row `observe-host-resolvable`; §4.2 item 1 (one change). Findings: B-O1..B-O9, RT-03..RT-06, RT-13 (FGOS_NOW, FGOS_CALLER_PID). Facts F-O1..F-O12 in [plan.md](plan.md).

## Red tests this phase turns green

1a, 1b, 2, 3, 4, 5a, 5b, 5c (phase 01 table), plus the main-flaky `friction::tests::test_friction_record_resolve_lifecycle` (same-ms stamps, B-O4).

**Folding (principle 8, decided here):** once the door exists, "a symlinked shard is refused", "a bad line is skipped and named" and "a torn last line is healed before the next append" are the **door's** behaviours. 1a and 2 move into `shard.rs` tests as the door's owning proofs. 5a stays in `friction.rs` as the one wiring proof that a non-eval store writes through the door; 5b and 5c are not landed (owner named in the commit: `shard.rs` symlink case + eval `symlink_writer_shard_never_changes_external_target`, `tests/eval_journal_test.rs:360`). 1b, 3, 4 are friction rules and stay in `friction.rs`. The new `snapshot.rs` test module (+43) is therefore not landed.

## Requirements

1. **One shard door in `shard.rs`** (moved, not rewritten, from `eval_journal.rs`):
   - **Directories:** before any append or read, every component of `.fgos/observe/<store>` must be a real directory, checked with `symlink_metadata` per component, creating missing ones only on write: eval's existing preflight `eval_store_exists` (`eval_journal.rs:145-170`), moved and used by every store. Today `shard.rs:24` (`create_dir_all`) and `:42` (`is_file`) follow a symlinked store directory. <!-- Red Team: security F2 -->
   - `append_lines(root, store, policy, &[Value])`, called **under the store lock** and only ever on the caller's own writer shard: no-follow, regular-file-only open (`open_append_shard`, `eval_journal.rs:173-228`, moved), opened **read + append on one descriptor** and `fstat`-checked regular; then the torn-tail policy: `Heal` (friction, case, snapshot) appends one `\n` when the last byte is not `\n`, `Refuse` (eval, keeping `tests/eval_journal_test.rs:640`) refuses by name; every line and its `\n` are one `write_all`; `sync_all`. <!-- Red Team: failure F7, security F6 -->
   - Windows: unchanged in this phase (eval's `create_new` branch, `eval_journal.rs:206-220`); RT-06 is fixed in phase 04 through the one Windows helper phase 03 adds to `fgos-durable-file` (one door for both crates). No `windows-sys` dependency in Observe. <!-- Red Team: scope F2, security F3 -->
   - `read_store(root, store) -> StoreRead { records: Vec<(Value, shard, line_no)>, invalid: Vec<InvalidLine> }`: entries checked with `symlink_metadata` (no follow), per-line bounded read (`read_bounded_line`, `eval_journal.rs:233-258`, moved; 1 MiB cap), refuses a symlinked or non-regular shard by name, never `?` on a line (today `shard.rs:43-46` aborts the whole store on one invalid UTF-8 line), never silent (today `shard.rs:51` drops unparsable lines without a word). `read_all_json` (`shard.rs:31-65`, re-exported `lib.rs:24`) is deleted; its other callers move to `read_store`: `metrics_cli/entropy.rs:103` (today `.ok()?` hides a refused store; it now returns the error) and `tests/fixture_test.rs:2,37,62`. <!-- Red Team: assumptions F7 -->
   - Residual (named in the spec): the directory checks and the open are separate calls, so a directory swapped between them is the same race eval has today; `openat`-relative appends would need a new `durable-file` write API (not built: RUL104).
   - A store that is unreadable as a whole (directory missing is "empty"; I/O error or a refused shard is an error) returns `Err`.
   - Bad lines are named on stderr by the reading verb: `fgos: warning: observe <store>: skipped <shard>:<line>: <reason>`. Eval keeps its own `invalid` output field and its refusal policy (`eval_journal.rs:302-303`).
   - Callers: friction (`friction.rs:119-127` `append_line` deleted), case (`case_journal.rs:214-228` `append_record` body and `:126-164` `read_all_case_records` body deleted), snapshot (`metrics_cli/snapshot.rs:69-79` inline write deleted), eval (moved helpers), migration (`friction.rs:184-190` tmp file and `:266-276` tmp-file append deleted; the migration builds its lines in memory and calls `append_lines` once).
2. **Lazy migration** (B-O1, B-O3, B-O7):
   - `record` and `resolve` no longer call `run_lazy_migration` (`friction.rs:291`, `:342`) and lose the `legacy_sources` parameter; `friction_cli::dispatch` passes legacy sources to `migrate` only.
   - `run_lazy_migration` reads through `read_store` and **fails closed on a read error** (I/O error, refused directory or shard) → `Err`, nothing appended (today `friction.rs:141` `unwrap_or_default()` reads an unreadable store as empty). Invalid lines are skipped (named): dedupe needs only the valid `legacy.{src,seq}` pairs, so a healed torn line never turns `friction migrate` into a dead end that the doctor's fix text (`src/setup/registrations.mjs:5720-5721`) points at. <!-- Red Team: failure F1 -->
   - `friction migrate` takes the store lock itself (`friction_cli.rs:38-44` runs it unlocked today).
   - `checkObserveFrictionMigrated` and its fix stay (D17, WORK, ledger H33).
3. **Settlement on instants** (B-O4): one comparator used by `show` (`friction.rs:473`), `rank` (`:534`) and `list --since` (`:414`): parse both stamps (`time.rs:45` `parse_timestamp_millis`; a trailing `~` written by the legacy migration, `friction.rs:223-224`, is stripped first); a resolve settles a record when its instant is later, or equal and later in file order **of the same writer shard whose name is a session id** (`Source::Env | Source::Registry`, `shard.rs:12-18`). `pid-*` shard names are not unique across machines (RT-21), so in them an equal instant does not settle. Equal instants in different shards do not settle (cross-machine skew: spec known limit, phase 06). A **record** stamp that does not parse makes its line invalid (named, skipped); a **resolve** whose stamp does not parse (the legacy `resolve_reason` `kind@ts` branch, `friction.rs:221-222`, carries free text) settles the subject's records before it in the same shard. One test feeds both legacy branches. <!-- Red Team: failure F2, F8 -->
4. **Subject kind**: the three copies of the kind match (`friction.rs:301-307`, `:352-358`, `:438-444`) become one `SubjectKind` string function in `contract.rs`.
5. **Clock, caller and git head** (RT-13, AGENTS.md L5): delete the `FGOS_NOW` read (`store_lock.rs:35-43`), the `FGOS_CALLER_PID` read (`friction.rs:40-43`) and the `FGOS_GIT_HEAD` read (`case_journal.rs:113`, the same class of test switch; set only by the regenerator, `scripts/regenerate-observe-fixtures.mjs:284,313`). <!-- Red Team: assumptions F9 --> One `time::now_iso()` (moved `format_iso_now`; snapshot's `chrono_now_iso`, `snapshot.rs:89-91`, deleted). The only env-clock test (`tests/eval_journal_test.rs:295`) drops the variable (it asserts complete shards, not stamps; re-read before deleting). `scripts/regenerate-observe-fixtures.mjs` (`:206`, `:233-312`) stops setting the three variables and normalises the volatile fields of the generated lines to its pinned values after generation: `ts`, case `since`/`until`, `caller.pid`, and the case git-head fields. It asserts record → resolve and open → close stamps are strictly ordered before the diff check. The golden fixtures prove readers and shapes; stamping is owned by the Rust unit tests, so normalising volatile fields hides nothing they own.
6. **Flags** (B-O8): a small `flags.rs` (key-value `--k v` and `--k=v`, boolean, one positional, `--dir` skipped, unknown flag and bad number are named errors: the grammar arbitration §2.2 approved) used by `friction_cli.rs` (replaces `get_flag`/`has_flag`, `:11-27`; `show`'s positional taken after flags, `:119-120`; `--attempts abc` and `--limit abc` become errors instead of silent drops, `:64`, `:128`). Each verb arm keeps its own `"--k"` literals and passes them to the parser, because `test/cli/subcommand-flag-drift.test.mjs:262-282,330-345` reads them from the arm. Phase 04 moves the `metrics` verbs onto it; the two paths never reach main apart (one landing merge). <!-- Red Team: assumptions F6 -->
7. **Root rule** (B-O9): the Observe provider resolves its store root once per invocation, **before** taking the store lock, as the Git component's trusted main root of the requested root, reusing the Identity project provider's pattern (`packages/identity/rust/src/project.rs:154,170`: `resolve_repo(dir, dir)` → `trusted_main_root()`). Three outcomes: Repository → the trusted main root; NotARepository → the requested root; any resolver error (untrusted worktree, unsupported git floor, unreadable config; `packages/git/rust/src/driver.rs:339-351`, `:436-451`) → the named error `observe-root-unresolved: <cause>`, never a silent downgrade. One test per outcome. Applies to every Observe verb (reads too). <!-- Red Team: security F8, assumptions F3 --> `apps/fgos/src/main.rs:128-148` (the host's own walk, ledger H17, T9) is not touched. `invokeHost` keeps passing `--dir` (it is shared by every verb; harmless here).
8. **Lock wait** (B-O2, second half): `store_lock::ACQUIRE_TIMEOUT` 5 s → 4 s so the host names `observe-lock-timeout` before `invokeHost` kills it at 5 s (`src/util/host-bin.mjs:10`); the error text derives from the constant (`store_lock.rs:14` hard-codes "5s"). Step 7 measures the p99 of everything before the lock (start, root resolve) and after it (holder-lock admit, heal, write, fsync); if p99 pre-lock + 4 s + post-lock exceeds 4.8 s, stop and ask (the rejected alternative is a per-call `invokeHost` timeout). <!-- Red Team: failure F3, assumptions F4 --> Spec numbers change in phase 06 (`docs/platform/holder-lock/spec.md:173`, `docs/specs/observe.md` §3).
9. **Input refusals are named**: every client-input error of the friction arm (missing required flag, `friction_cli.rs:46-62,90-102`; invalid subject; `validate_record_input`/`validate_resolve_input`) starts with `friction-invalid-input:`, and no path or file content is ever written before that prefix in any Observe error (today a refusal and a store failure both exit 1 with `provider failed: <text>`, verified 10-24 against the activated host). `--producer` stays required in Rust: the CLI contract declares it (`src/cli/command-registry.mjs:264`, `packages/host-runtime/contracts/command-routes.json:386`). <!-- Red Team: scope F1, assumptions F5, security F5 -->
10. **Thin Node client** `src/observe/friction-client.mjs` (194 → ≈ 70 lines, 2 exports): build argv from what the caller passed, `detail` on stdin, `invokeHost`; when the **first stderr line** matches `^fgos: error: invocation failed: provider failed: friction-invalid-input:` the client rethrows a `StoreError` with `category: 'validation'` (the exception type callers see today); any other failure logs the invocation fault and warns (unchanged best-effort semantics). Deleted: the four value sets (`:12-28`, already drifted: no `spec`), the validation blocks (`:64-85`, `:160-165`), the defaults for `layer`, `disposition`, `errorClass`, `by` (`:64,72,87,152`; all 29 call sites pass the first three, scripted count). **Kept:** `producer ?? 'work'` (`:88`), the one caller convention 23 of 29 call sites rely on; moving it into Rust would change the declared CLI contract (deviation from arbitration "no defaults", recorded here). The two catch blocks become one helper.
11. **Doctor `observe-host-resolvable`** (B-O6): probe `friction rank --limit 1` through `invokeHost` (5 s timeout) instead of a raw `execFileSync` of `friction ping` with no timeout (`src/setup/registrations.mjs:5801-5834`, the call at `:5812`); the "passed without `ok`" branch (`:5823-5826`) goes; the row description (`:6034`, "…(friction ping)") follows. A store the host refuses to read (symlinked directory or shard, I/O error) fails the row. No row added. "Named and skipped" means the one stderr warning line per bad line (arbitration §2.2 "a bad line is named and skipped"); no check command is added (A3 stays an owner addition). <!-- Red Team: scope F8 -->

## Files

- **Create:** `packages/observe/rust/src/flags.rs`; `test/observe/friction-client.test.mjs` (the module has no test file today; one wiring proof: refusal rethrows, missing host logs a fault; principle 8 allows the owning file for a module that has none).
- **Modify:** `packages/observe/rust/src/{shard.rs,eval_journal.rs,friction.rs,friction_cli.rs,case_journal.rs,store_lock.rs,time.rs,contract.rs,provider.rs,lib.rs,metrics_cli/snapshot.rs,metrics_cli/entropy.rs}`, `packages/observe/rust/tests/{eval_journal_test.rs,fixture_test.rs}`, `apps/fgos/src/wiring/friction_sources.rs` only if the provider signature forces it, `src/observe/friction-client.mjs`, `src/setup/registrations.mjs` (`checkObserveHostResolvable` only), `test/setup/observe-doctor-checks.test.mjs` (`:176-207`, one added case: refused shard fails the row), `scripts/regenerate-observe-fixtures.mjs`, `packages/git/contracts/mutation-census.v1.json` (regenerated), `Cargo.lock` (regenerated).
- **Delete:** code listed in requirements 1, 2, 5, 9, 10, 11 (no file deleted).
- **Tests to retire:** none of the existing suite. Red tests 5b, 5c are not landed (owners: `shard.rs` symlink case + `tests/eval_journal_test.rs:360`). Red tests 1a, 2 move into `shard.rs`. `test_friction_lazy_migration_and_deduplication` (`friction.rs:662`) is rewritten to migrate through `friction migrate` (record no longer migrates); it retires with D17.

## Steps

1. Move the hardened pair into `shard.rs`; point eval at it; run `tests/eval_journal_test.rs` (the pair's existing owning proofs stay green unchanged).
2. Directory preflight for every store, read+append descriptor and the torn-tail policy; move red tests 1a and 2 into `shard.rs`, plus one case where `.fgos/observe/friction` itself is a symlink; route friction, case, snapshot, migration, entropy and `fixture_test.rs` through the door; delete `read_all_json`.
3. Migration: off the write path, lock, fail closed (red 1b, 3 green).
4. Instants comparator (red 4 and the lifecycle test green, 10 consecutive runs).
5. Clock, caller and git-head env deletion; regenerator normalisation; run it once and confirm zero diff under `test/fixtures/observe/`.
6. `flags.rs` for friction; `friction-invalid-input:` prefix on every input refusal; lock wait 4 s.
7. Root rule in the provider (before the lock); measure `friction record` and `friction rank --limit 1` before/after on a scratch repository root (20 runs, p50 and p99) and the pre/post-lock split of requirement 8. **Stop-and-ask gate:** more than +10 ms p50, or the requirement-8 budget exceeded → decision question to the big lead (template `core/skills/_shared/decision-question.md`) before continuing.
8. Node client and doctor row; one wiring test file.
9. Regenerate census (`node scripts/git-one-door-scan.mjs --root . --write-census`); check the count line.
10. Commit in two: `fix(observe): …` (Rust + census + Cargo.lock) and `refactor(observe): …` (Node client + doctor + regenerator), each body naming behaviours, the retired/moved tests and their owners; `git diff --stat` reviewed before each commit (no unexpected deletions).

## Validation (focused)

```sh
export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/harden-t3a-p02-target
cargo test -p fgos-observe
cargo test -p fgos --bin fgos   # host wiring compiles and its unit tests pass
node --input-type=module -e "import {runChosenTests} from './scripts/run-tests.mjs'; runChosenTests(['test/observe/friction-client.test.mjs','test/setup/observe-doctor-checks.test.mjs','test/rust-host/observe-store-lock.test.mjs','test/observe/observe-contracts-fixtures.test.mjs'])"
node scripts/regenerate-observe-fixtures.mjs && git status --short test/fixtures/observe   # expect no output
```

Land gates (before the phase is handed back):

```sh
cargo check -p fgos-observe -p fgos --all-targets --target x86_64-pc-windows-msvc   # Windows door itself lands in phase 04
cargo check -p fgos-observe -p fgos --all-targets --target aarch64-apple-darwin
cargo clippy -p fgos-observe -p fgos --all-targets -- -D warnings
node scripts/git-one-door-scan.mjs --root .   # count stays 5
```

## Success criteria

- All routed red tests green; `cargo test -p fgos-observe` green 3 runs in a row (lifecycle flake gone).
- `rg -n 'FGOS_NOW|FGOS_CALLER_PID|FGOS_GIT_HEAD' packages apps src bin scripts` → 0 hits.
- No shard-append `OpenOptions` outside `shard.rs` (test modules excepted); `rg -n 'read_all_json' packages` → 0 hits.
- One `friction record` on a scratch root writes one line and reads no `.fgos/events*.jsonl` (`strace -e trace=openat` shows no events file).
- Measured Δ reported next to the net-size estimate.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| Healing a torn tail changes eval behaviour (eval refuses a torn tail today, `tests/eval_journal_test.rs:640`) | M × M | The torn-tail policy is a door argument; eval passes `Refuse`; the eval test stays as is and must stay green |
| Removing the lazy migration leaves new legacy records unmigrated | L × M | Nothing writes `work.friction` after the cutover; the doctor row `observe-friction-migrated` still fails and names `friction migrate` (kept for one release, H33). WORK is told before landing (plan.md "Landing") |
| Root rule costs a Git resolve per write | M × M | Stop-and-ask gate in step 7 |
| Node callers that relied on a client default other than `producer` | L × M | Scripted count on `42c5a0a55`: 29 call sites, all pass `layer`/`errorClass`/`disposition`; a missing field now throws `StoreError` (validation) by name |
| The root resolve fails on a machine with no or old git | L × M | fgOS already requires the git floor (Git doctor rows); the error is named, and the doctor row fails with it |

## Rollback

Revert the phase's two commits on the track branch. On-disk format is unchanged (same JSON lines); a healed shard only gained a `\n`, which the previous release reads as before.
