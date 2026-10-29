# HARDEN re-check, new component: agent mailbox

Pinned tree: `/home/vantt/projects/forgent-worktrees/harden-recheck-new` at `a5358f127` (2026-10-29 10:24 +07). This is a read-only audit by code-reviewer, done 2026-10-29 (Asia/Saigon). I did not build, run cargo or run npm. The one CLI call was a read-only `fgos show tsk-1lx` from the main checkout.

Scope: `packages/mailbox` (core and store crates, contracts), the host wiring `apps/fgos/src/wiring/mailbox_*.rs`, and the Node callers (`src/setup/mailbox-limits.mjs`, `src/setup/agent-hooks.mjs`, `src/setup/registrations.mjs`, `src/runner/dispatch/confinement/resources.mjs`, `bin/fgos.mjs`, `scripts/lib/mailbox-*.mjs`). Spec: `docs/platform/agent-mailbox/spec.md`.

These four items went to MAIL on 10-28, so I leave them out: the private HOME filter in `mailbox_identity.rs`, the bare-pid kill in `killIfSame`, the raw herdr execs in `scripts/`, and the 3 red tests in `test/setup/agent-hooks.test.mjs`.

**Verdict: DRIFT (10 small, 1 large). Medium 3, Low 8, High 0.**

The component has the right shape. Process facts, durable writes, the lock, Identity, Git and Config each go through their own door, and no decision is made twice between Node and Rust. The drift is at the edges:
- one primitive set (unsafe directory and euid calls, no-follow opens) is copied beside a lower door that now covers it;
- the limit values have two sources of truth;
- since the 10-28 default flip, the hook is installed on platforms where it can never act;
- stale contract text and comments, and a few dead accessors.

Markers: **WIP** means the item is probably still moving, because MAIL committed it in the last 24 hours or it is research tooling. **settled** means the item has been stable since it landed.

## Layer placement

| Crate | Production dependencies (Cargo.toml) | HARDEN layer of those dependencies |
|---|---|---|
| `fgos-mailbox-core` | `serde` only (`packages/mailbox/rust/core/Cargo.toml`) | leaf |
| `fgos-mailbox` (store) | `fgos-process`, `fgos-durable-file` (T0); `fgos-holder-lock`, `fgos-identity` with `default-features = false` (T1) (`store/Cargo.toml:7-12`) | T0 and T1 |
| host wiring | adds `fgos_git::main_checkout_root` (T2, `mailbox_root.rs:60`) and `fgos_config` (`mailbox_config.rs:16-21`) | T2 |

The store therefore sits at T2. With its host wiring, the component is a T3 peer of agent-protocol. I found no upward dependency:
- No mailbox source names herdr, run-supervisor, dispatch or event-store.
- It recognises a runner head only through Identity's door, `fgos_identity::is_attempt_writer_id` (`hook/shell.rs:238`).
- The two newer contracts are WIP, from `89743bb9e` on 10-28 at 14:22: the event-streams contract `packages/mailbox/contracts/event-streams.v1.json` and `remote.v1.json`. The streams file is registered in `packages/event-store/contracts/consumers.v1.json:24`. No code reads `remote.v1.json` yet.

## Verified

- **Process facts.** The ancestry comes from `relation_of`, `identity_of`, `view_of` and `command_name_of` (`store/src/ancestry.rs:35-62`). Liveness comes from one judge, `judge_here` (`head.rs:60-66`), used for registration, prune and send name resolution (`head.rs:41-46`, `record/prune.rs:241-277`). No mailbox source file reads `/proc`; the word appears only in comments. Nothing signals or kills a process except the CLI's own `codex --version` child (`adapters/version.rs:75`).
- **Durable writes.** Every durable write goes through a durable-file door:
  - the snapshot through `replace_durably_observed` (`record/snapshot.rs:55`);
  - bodies through `install_once` (`record/bodies.rs:27`);
  - the breaker and hook outcome files through `replace_durably` (`hook/breaker.rs:196`, `hook/outcome_log.rs:308`);
  - new directories through `sync_directory` (`record/mod.rs:342`).

  There is no hand-written rename or temporary file.
- **Lock.** The lock is the holder-lock registry row `mailbox` (`packages/holder-lock/contracts/lock-registry.v1.json:223-228`), taken through `LockScope` (`record/mod.rs:513-516`). Node never takes it. `src/setup/holder-lock-checks.mjs:223` only checks that the file exists.
- **Identity, Git and Config.**
  - The state root comes from `fgos_holder_lock::state_root` (`mailbox_identity.rs:31-35`).
  - The Claude config directory comes from `fgos_identity::cli_dirs::claude_config_dir` (`hook/resolve.rs:213`).
  - The writer comes from `resolve_current` (`hook/resolve.rs:237`).
  - The main checkout is a disk-only Git read (`mailbox_root.rs:60`).
  - The `mailbox` section comes from one Config snapshot (`mailbox_config.rs:62-103`). Node reads only through `src/config/facade.mjs` (`mailbox-limits.mjs:6`).
- **No Node twin of record logic.** The doctor gets the record verdict from `fgos mailbox status --json` (`src/setup/registrations.mjs:2258-2276`), so directory trust, version and caps are judged only in Rust. The behaviour scripts that read `snapshot.json` directly (`scripts/lib/mailbox-behaviour-run.mjs:283,735`) are test harnesses and change no product decision.
- **Gate 8.** There is one doctor row, `mailbox-hook` (`registrations.mjs:2280-2304`). Its one failing condition is a record that cannot be read. Each other condition has exactly one owner:
  - a refused config is failed by the config rows, and this row passes and points to them;
  - whether the hook rows are present is checked by the agent-hook checks;
  - the lock file is checked in `holder-lock-checks.mjs:223`.

  There is no `registerConfigDefault`. Every key is in `core/config-schema/mailbox.schema.yaml` and `core/config-standard/mailbox.yaml`. The `budgetMs` maximum (8000, `mailbox.schema.yaml:228`) stops a project from raising the hook timeout past the CLI timeout that setup derives (`mailbox-limits.mjs:12-16`).
- **Panics.**
  - `record`, `hook` and `adapters` deny `unwrap`, `expect` and `panic` (`record/mod.rs:20`, `hook/mod.rs:3`, `adapters/mod.rs:5`).
  - The shell wraps each phase in `catch_unwind` (`hook/shell.rs:186-207`).
  - The host entry catches any panic and exits 0 (`mailbox_hook.rs:31-36`).
  - `unsafe` is confined to `record/sys.rs` (`store/src/lib.rs:15`).
- **Platform gates.**
  - The modules that need the record are `cfg(unix)` (`store/src/lib.rs:19-28`, `hook/mod.rs:4-13`, `adapters/mod.rs:8-15`).
  - Windows builds `mailbox_*_unsupported.rs` (`apps/fgos/src/wiring/mod.rs:3-19`).
  - The errno reset covers linux, android, macos, ios and freebsd (`record/sys.rs:108-117`).
- **Tests.**
  - Each Rust test sleep is a condition poll with a deadline (`store/tests/common/record.rs:219-257`, `apps/fgos/tests/mailbox_routes.rs:901-906,1050-1055`), or the fixed hold that the lock-race test exists to create (`mailbox_routes.rs:1642`).
  - The host tests are wiring proofs above the store's owning proofs. For example, `mailbox_routes.rs:956` checks that the entry writes the outcome file, while the outcome table is proved in `store/tests/hook_shell.rs:1022`.
  - I found no test of deleted code.
- **The mask root in Node.** `src/runner/dispatch/confinement/resources.mjs:32-33,46` names `{fgosDir}/runtime/mailbox` and creates it with mode 0700. It is commented as owned by `record/paths.rs`, and the 0700 mode passes the record's `check_dir` (`record/mod.rs:612-642`). This is an accepted mask root of an upper layer, not a second authority.

## Findings

| id | sev | size | file:line | what | introduced by | fix shape (RUL104) | owner lane |
|---|---|---|---|---|---|---|---|
| M-1 | Medium | small | `packages/mailbox/rust/store/src/record/sys.rs:1-117`; `record/mod.rs:680-709` (`open_regular`, `read_regular_capped`); `record/bodies.rs:120-130` (`open_dir`) | **settled.** These hand-written primitives sit beside the T0 door. `sys.rs` calls `geteuid`, `unlinkat`, `dup`/`fdopendir`/`readdir`/`fstatat` and a per-OS errno reset through raw `unsafe` libc. The store also has its own no-follow, non-blocking, capped regular-file read and its own no-follow directory open. Since `8debed9c6` (10-23), `fgos-durable-file` has `beneath::{open_beneath, open_dir_beneath, ensure_dir_beneath, Dir, OpenedFile::read(max)}` (`packages/durable-file/rust/src/beneath.rs:78-120,255-278`), built on `rustix` with no `unsafe`, and `rustix` with `fs` and `process` is already a T0 dependency (`durable-file/rust/Cargo.toml:14,21`). Item `tsk-1lx` (status `todo`, candidate owner HARDEN) asks for this consolidation, and the module comment promises the move (`sys.rs:4-6`). The spec also defers descriptor-relative I/O to the same item (spec line 375). | `38cc72769` 2026-10-22, MAIL | Move the two missing operations, listing a directory without following links and `unlinkat`, onto `beneath::Dir` as `rustix` calls. Use `rustix::process::geteuid`. Replace `open_regular`, `read_regular_capped` and `open_dir` with `open_beneath` plus `OpenedFile::read(max)` and `open_dir_beneath`. This deletes `sys.rs` and every `unsafe` in the mailbox, about 150 lines out and about 40 lines into durable-file. The other copies `tsk-1lx` lists (holder-lock, git, secrets, run-supervisor) follow later, one door at a time. | HARDEN (`tsk-1lx`), MAIL moves its callers |
| M-2 | Medium | small | `packages/mailbox/contracts/limits.v1.json` (every `default`); `core/config-standard/mailbox.yaml`; `store/src/limits.rs:20,103-105`; `apps/fgos/src/wiring/mailbox_config.rs:62-66,134-155` | **settled.** Each limit value has two sources of truth (design principle 7). The loader lays the effective Config section over the contract's embedded `default`s. That section already includes the bundled standard, so in production the contract default never wins. The only thing keeping the two copies equal is a test (`mailbox_config.rs:134-155`). The cost shows in `2dad510cf`: flipping one key touched the contract, the schema, the standard and a registrations test. The spec also contradicts itself at line 531: it says "the core has no … default, so a missing key fails the load", and it says the loader gives a missing key the contract default. | `1430107da` 2026-10-25, MAIL (it moved the values onto Config and kept the contract defaults) | Drop `default` from the contract rows the standard holds, and keep only reader, unit and meaning. `load` takes the effective section alone, and a missing key is a named load error. Point the mailbox crates' tests at a standard fixture, or at `fgos-config` as a dev-dependency, instead of the contract. This retires the equality test and about 30 contract fields. |
| M-3 | Medium | small | `apps/fgos/src/wiring/mailbox_hook.rs:87-114`; `src/setup/agent-hooks.mjs:141-150`; `packages/mailbox/contracts/adapters.v1.json` `hookFacts.*.platform` | **WIP.** On 10-28 `mailbox.enabled` became true by default. Setup installs the mailbox rows on every platform, but `hookFacts` exist for `linux` only, and a CLI uses its facts only on the platform they were measured on (`02ecf25b2`). On macOS, each tool call first runs the main-checkout read and a full Config snapshot (`mailbox_hook.rs:87,94`), which the spec measures at 12 to 29 ms (line 531). Only then does it return at `tested.facts(adapter)` (`:112-114`) without doing anything. On Windows, each tool call spawns the host just to exit 0. | `2dad510cf` 2026-10-28 (the default flip), on top of the per-platform facts from `02ecf25b2` 2026-10-23, MAIL | Move the `TestedClis::embedded().facts(adapter)` check to just after `parse`, before the root and config reads. That is a reorder with no new code. In `rowsOf`, also hold back the mailbox rows when the adapters contract has no `hookFacts` for this platform, so no row is installed where the hook can never act. That is one predicate on an existing filter. | MAIL |
| L-1 | Low | small | `src/cli/command-registry.mjs:814-818`; `bin/fgos.mjs:4978` | **settled.** The published CLI contract has drifted. The registry's `--cli` enum is `['claude','codex']` and the usage text says `<claude|codex>`. The host accepts `pi` and `omp` (`mailbox_hook.rs:48-53`), and the generated pi/omp extension calls `hook mailbox --cli ${cli}` (`agent-hooks.mjs:359,384`). | `105169643` 2026-10-24, MAIL | Add `pi` and `omp` to the enum and the usage string. | MAIL |
| L-2 | Low | small | `src/setup/mailbox-limits.mjs:18-21`; `docs/platform/agent-mailbox/spec.md:403,531,555,763` | **WIP.** These lines still say `mailbox.enabled` defaults to false or is "provisional until the owner answers section 16 item 23". The owner answered on 10-28 (`limits.v1.json` row `mailbox.enabled`). Because the standard now ships `true`, the comment's "absent" case can no longer be reached. | `2dad510cf` 2026-10-28, MAIL | Rewrite the comment and the four spec lines to "on by default; `false` opts out". | MAIL (with DOC for the spec) |
| L-3 | Low | small | `store/src/hook/drain.rs:21-23`; `apps/fgos/src/wiring/mailbox_identity.rs:1-3,9-11`; 22 sites under `packages/mailbox/rust/*/src` and `apps/fgos/src/wiring/mailbox_*.rs` | **settled.** Some comments are false:<br>- `drain.rs` names `resolve_workspace_root` as the storage-root owner, but the root now comes from `mailbox_root::mailbox_fgos_dir`.<br>- `mailbox_identity.rs` says "the mailbox crates never call Identity", but the store depends on `fgos-identity` (`store/Cargo.toml:11-12`, `hook/resolve.rs:213-214`, `hook/shell.rs:238`).<br>- Rung and plan labels appear in code comments ("V4's test entry", "V5", "plan decision 11", "owner decision Q2", "`tsk-1lx`"), which the stable-artifacts rule forbids. | `7fb7c4f4b` 2026-10-22; `a3574712c` 2026-10-23; spread over the V2 to V7 commits, MAIL | Reword each comment to state the invariant, with no labels. | MAIL |
| L-4 | Low | small | `store/src/hook/drain.rs:104-107`; `store/src/hook/shell.rs:447`; `core/src/counters.rs:185` | **settled.** Dead or test-only surface:<br>- `FinishTicket::is_stop_block` has no caller in the repository; `finish` reads the field directly at `:396`.<br>- `arm_budget`'s `on_exit` argument is always `\|\| {}` in production (`mailbox_hook.rs:107-111`); only `store/tests/hook_shell.rs:423` passes a body.<br>- `party_count` is used only by tests. | `39c4fc8c0` 2026-10-22; `2449dddae` 2026-10-22, MAIL | Delete `is_stop_block`. Drop `on_exit`: the child test can watch the exit status and the missing `write-finished` file instead of a marker file. Keep `party_count` only if a test is its owning proof. | MAIL |
| L-5 | Low | small | `store/src/hook/shell.rs:204-207,447-455`; `apps/fgos/src/wiring/mailbox_hook.rs:145`; `store/src/hook/breaker.rs:189-197` | **settled.** The breaker and outcome writes can leave orphan temporary files. Both writes happen while the write gate is still idle, so an armed watchdog can `process::exit(0)` inside `replace_durably`. That leaves `.durable-file-<pid>-<seq>.tmp` (`durable-file/rust/src/lib.rs:269`) in `runtime/mailbox/`, which by design no sweep lists (`record/paths.rs:4-6`). It needs a budget overrun, so it is rare. `mailbox_identity.rs:113-118` already records the same limit for Identity's directory, but `breaker.rs` and `outcome_log.rs` do not. | `bc4abcfee` 2026-10-23, MAIL | No new mechanism. Record the known limit in the module docs of `breaker.rs` and `outcome_log.rs`, as `mailbox_identity.rs` does. | MAIL |
| L-6 | Low | small | `store/tests/head_finder.rs:116-135`; `store/tests/ancestry.rs:20-38` | **settled.** Two test-local `read_dir("/proc")` scans find "the first child of a parent", one through `fgos_identity::os_process_tree().stat` and one through `relation_of`. The T0 door already has `fgos_process::facts::relations()` (`packages/process/rust/src/facts.rs:443`). | `783a0d50d` 2026-10-22, MAIL | Write one `child_of` in `tests/common` over `relations()` and delete both scans. | MAIL |
| L-7 | Low | small | `apps/fgos/src/wiring/mailbox_hook.rs:64-69`; `apps/fgos/src/wiring/mailbox_verbs.rs:170-175` | **settled.** Two copies of `now() -> Timestamp`. | `4cde1feee` 2026-10-23, MAIL | Keep one copy in `mailbox_surface.rs` or `mailbox_root.rs`, where both entries already import. | MAIL |
| L-8 | Low | large | `scripts/lib/mailbox-behaviour-v7{,e,f,g,h,i,j}.mjs` (2014 lines); `scripts/lib/mailbox-behaviour-{run,score}.mjs` (1168); `test/scripts/mailbox-behaviour-*.test.mjs` (9 files) | **WIP, research tooling.** There is one scripts file and one suite test per measurement rung. All of them were written 10-23 and 10-24, and all are listed in `test/suite-baseline.json`, so every `npm test` pays for them. If a rung's finding is already recorded in the spec, its harness and test now prove only the harness itself. | `0d3a2f67e`..`ae427787b` 2026-10-23/24, MAIL | Have MAIL confirm which rungs are done. Retire each done rung's script and test together, and keep the shared `run` and `score` modules only while a live rung uses them. This could remove up to about 2000 script lines and their tests. | MAIL (TEST to review suite cost) |

## Size

| Part | Lines |
|---|---|
| Rust core `src` | 3,738 |
| Rust store `src` | 4,498 |
| Rust store `examples` (cost harness) | 642 |
| Rust core `tests` | 4,714 |
| Rust store `tests` | 7,343 |
| Host wiring `apps/fgos/src/wiring/mailbox_*.rs` | 1,650 |
| Host tests `apps/fgos/tests/mailbox_routes.rs` | 1,682 |
| Node product (`src/setup/mailbox-limits.mjs`, plus the mailbox rows and checks inside `agent-hooks.mjs` and `registrations.mjs`) | 48 plus about 200 |
| Node scripts (`scripts/lib/mailbox-*.mjs` 4,658; `scripts/record-mailbox-hook-fixtures.mjs` 1,365; `scripts/lib/codex-auth-guard.mjs` 128) | 6,151 |
| Node tests (`test/scripts/mailbox-*` and `codex-auth-guard` 2,635; `test/live/mailbox*` 3,902) | 6,537 |

The Rust test-to-source ratio is about 1.5 to 1. The Node tooling around a Rust-owned component is about 12,700 lines.

What a RUL104 pass would remove:
- M-1: about 150 lines and every `unsafe`, adding about 40 lines to durable-file.
- M-2: about 30 contract fields and one equality test.
- L-4, L-6, L-7: about 40 lines.
- L-8: up to about 2,000 script lines and the matching suite tests, if MAIL confirms the rungs are done.
- M-3 and L-1 to L-3 move or reword code and do not change size.

## Proposed additions (owner decides)

- **A bounded child run in a lower door.**
  - Problem: `adapters/version.rs:61-81` spawns `codex --version` and polls `try_wait` with a 10 ms sleep until a deadline. The same loop is written separately in `packages/git/rust/src/driver.rs`, `packages/terminal-control/rust/src/driver/herdr.rs`, `packages/run-supervisor/rust/src/steps.rs` and `apps/fgos-gateway/src/gateway.rs` (`rg -l "try_wait\(\)"`).
  - Evidence: five production copies, and no "run a child with a deadline" entry in `fgos-process` (`facts.rs` and `control.rs` have none).
  - Benefit: one tested door for the timeout and the kill-and-reap.
  - Cost: a new entry in T0, which is why it is listed here and not as a finding.
- **One directory-trust check.**
  - Problem: the "real directory, owned by euid, no group or other write" check exists in `record/mod.rs:612-642`, `packages/git/rust/src/wal.rs:1851` and `packages/git/rust/src/worktree.rs:1588`.
  - Benefit: the trust rule lives once, in `durable-file::beneath` next to `Dir::identity` and `Dir::mode`.
  - It would ride with M-1 if the owner widens `tsk-1lx`.

## Unresolved questions

1. **M-2.** Should the limits contract keep its `default` column as documentation? If yes, the alternative is to generate one file from the other, which needs a decision on which one is the source.
2. **M-3.** Is "macOS and Windows install the mailbox rows but stay quiet" intended, so that the rows are ready once facts are measured there? Or should setup hold the rows back until the adapters contract lists the platform? The reorder inside the hook is safe either way.
3. **L-8.** Which behaviour rungs (v7, v7e to v7j, and the v7k and v7m addenda) are finished, so that their harness and suite test can retire?
4. **M-1.** `tsk-1lx` names HARDEN as a candidate owner. Should it land with the T4 batch, or stay with MAIL?

Status: DONE
Summary: The mailbox sits at T2/T3 with no upward dependency and uses every lower door for process facts, durable writes, the lock, Identity, Git and Config. The drift is 3 Medium items (an unsafe syscall and no-follow-open copy beside durable-file `beneath`, limit values in two sources of truth, and default-on hook rows on platforms with no hook facts) and 8 Low items.
Concerns/Blockers: M-3 and L-2 come from the 10-28 default flip and may still be in progress on the MAIL lane.
