# Git phase 07 unit 21: empty the mutation census

Worktree `.claude/worktrees/git-p07`, branch `git/p07-switch`, from tip `10416a6b0`. No `git add` or `commit` was run.

**Result.** Census sites fell from 70 to 9. The two Q3 rows are expected. The other 7 are unresolved process primitives (3 JS, 4 Rust). They stay sites; none is allowlisted.

Four slices were delegated to subagents: SafeRestore, apps, door.test, and the bench scripts. The scan, Q1, the specs, the CHANGELOG and integration stayed in this session.

## Before → after per family

| Family | Before | After |
|---|---|---|
| literal `git` spawn | 3 | 2 (Q3: distill, instruction-audit) |
| Rust `Command::new("git")` | 1 | 0 |
| wrapper caller (shell `-c`) | 2 | 0 |
| unresolved binary | 64 | 7 |
| **total** | **70** | **9** |

Named classes, before → after:

| Class | Before | After |
|---|---|---|
| hook-read-context | 21 | 21 |
| configured-binary | 32 | 66 |
| rust-test | 83 | 93 |
| sandbox-door | 2 | 2 |
| argv-runner | — | 3 (new) |
| uncalled-wrapper | — | 6 (new) |
| production-sandbox-probe | 0 | 2 |
| git-driver | 0 | 1 |

The census `packages/git/contracts/mutation-census.v1.json` is rewritten from this tree.

## What closed each group

### Q1 (`configured-binary`, decision a)
- **Spec.** The decision is recorded, dated, in Git spec §12.
- **Static scan.** These sources now count as configured, by data flow:
  - environment reads, including upper-case keys read off an env map;
  - parsed JSON data;
  - Rust string-keyed Value indexing and `.get("…")`;
  - a tool script's `process.argv`;
  - any declared `verify` command or invariant command.
- **goal-check's borrowed shell.** The scan judges the script operand of `['-c', command]` and follows it to the consumer's command. This closes both goal-check `/bin/sh` and `cmd.exe` wrapper rows.
- **Runtime spy.** goal-check marks its consumer-command spawn with `Symbol.for('fgos.git.consumer-command')`, and the spy treats it as configured. So `merge-land.test.mjs`'s racing `git update-ref` no longer fails the suite.
- **Marker guard.** The scan accepts that marker only on a spawn whose binary is not a literal. A probe owns that rule.
- **Follow-up item.** Refusing a configured binary named `git` (option b) is not done here.

### Q2 (SafeRestore confirmed main discard, decision a; subagent)
- **Spec.** Git spec §11 gets a dated paragraph.
- **Request.** `RestoreRequest.confirmedBy` is new and omitted when empty, so request digests are unchanged.
- **Refusals.**
  - An unconfirmed main discard still refuses `restore-discard-requires-producer`.
  - `confirmedBy` on anything else refuses `restore-confirmation-unexpected`.
- **What a confirmed main discard covers.**
  - It covers tracked `.fgos` paths, and may target any commit, since the old HEAD is pinned.
  - It clears a stopped merge, cherry-pick or revert, with unmerged entries allowed. Their bytes are kept in a new serde-default `nativeState` field.
  - The snapshot keeps the delta. Untracked files are left in place, as raw `reset --hard` did.
- **Verb.** `bin/fgos.mjs` `main-checkout-reset`:
  - reads through Inspect;
  - applies SafeRestore under the main-50 handle;
  - returns `operationId` and `snapshot`.
- **Deletion.** `rawMainCheckoutGit` is deleted.
- **Tests.** The three owning tests in `test/cli/fgos-claim.test.mjs`, plus the lock-fence test, keep their assertions and pass.

### Host-binary resolution (holder-lock ×8, run-supervisor, assignment-runner, terminal-control, fanout-batch, checks)
These closed through general data-flow fixes, not per-path rules:
- scope-aware bindings;
- `for…of`, array and rest destructuring;
- arrow functions passed as arguments, whose span detection was a bug;
- conditionals evaluated before `||`/`??`;
- writes into objects after their literal;
- callee parameters bound to call arguments on returned objects;
- re-exports;
- `new URL`/`fileURLToPath`;
- an omitted argument, which is not a binary.

They resolve to the activated `fgos` host, `FGOS_HOST_BIN`, `herdr` or `process.execPath`.

### Process primitives
- **JS.** Callers reached through registries (`table[key](…)`), aliases, parameter defaults and stored methods are now found. Launchers are read by their command operand (`timeout <d> <cmd>`, `env`).
- **Rust (new class `argv-runner`).** A spawn whose binary is a parameter or a field of one is resolved where its value is built:
  - the function's callers, bounded by Rust visibility;
  - struct literals of the parameter's type outside test code.

  A constructor passing Git is a site, an unresolved one stays a site, and a serde-deserialised type is configuration. This closed the gate (`config.command`), steps (`spec.host_bin`), host-runtime provider, herdr (`config.bin()`) and the containment `program` rows.
- **Git crate.** Anything the fgos-git crate hands to a primitive is `git-driver`.

### Configured executables
bwrap/provider probes, provider renewal and worker boot now resolve as configured. `gh` in the github adapter is unreachable: `mergeGitHubPR` is imported in `approve.mjs` but never used, so its rows went to `uncalled-wrapper`.

`uncalled-wrapper` is reported only when no scanned file names the function outside its definition and import clauses. Tests that call it stay under the runtime spy. `migrateUseCase` is the other uncalled case: only tests call it.

### Tool scripts (subagent)
- `test-timing` now uses a literal `/usr/bin/time`.
- `stress-test-files` now has one spawn per case, each with a literal binary.
- `e3-bench` and `herdr-cockpit-notify` take operator-supplied binaries (CLI args, global config), so they resolve as configured.

### `borrow_vectors.rs`
- **Code change.** `git --version` now runs in the run's own temp dir (`current_dir(&dir)`), and that dir is removed if git is missing.
- **New proof.** The `production-sandbox-probe` class now accepts a `-C`/`current_dir` repository proven by data flow to come from `temp_dir()` at every non-test caller. It is no longer a path or same-function guess.
- **Scope.** The probe's public `init_repo` has only test callers outside the file.

### Shell script in a variable (`shell-rc.mjs`)
The scan judges the script text itself. A double-quoted interpolation counts as a data operand.

### Shapes the shared scan missed (door.test review)
The scan now catches these two:
- a Rust `use std::process::Command as X`;
- `.args(["-c", "…"])` scripts.

It also again matches path-qualified `tokio::process::Command::new`, which I briefly broke and fixed.

## Step 2: apps patch, gateway, `repo_root()` (subagent)
- **Applied.** `u20-apps.patch` applied cleanly.
- **State root.** The gateway resolves its main checkout with `GitDriver::open_at(cwd)?.trusted_main_root()`. Its state root comes from `fgos_holder_lock::state_root::state_root()` inside `open_at`, the same door as Node `resolveStateRoot`. No new env variable or API was added.
- **Deleted.** `herdr_fgos_common::fgos::repo_root()` is deleted.
- **herdr-dashboard.** It is outside the cargo workspace and outside this unit's write scope. Its change is `outbox/needs-writes-herdr-dashboard.patch`: a `main_checkout_root()` helper on `fgos-git`, plus Cargo changes.
  - That patch's `Cargo.lock` was edited by hand and is unverified.
  - Host command: `cd herdr-dashboard && cargo build --locked`. If `--locked` rejects it, run a plain `cargo build` once.

## Step 3: door.test (subagent)
- **Retargeted.** `test/event-store/door.test.mjs` now uses `scan()` from `scripts/git-one-door-scan.mjs`. The private argv scanner (≈350 lines) is deleted (L10). The event-publication shapes are checked through the shared scan in a temp tree.
- **Kept.** The retired event-reader census is not a Git-spawn check, so it is kept.
- **Retired tests and their owners:**
  - the scanner-mechanics tests → `test/git/one-door.test.mjs`'s shapes;
  - the E3 fixture exemption → that exemption no longer exists; the census owns those sites;
  - the bounded-time evaluator test → its evaluator was deleted.
- **Counts.** 7/7 pass, together with one-door. The full per-assertion map is in the subagent's notes, summarised above.

## Tests (design principle 8)
- **Added to the owning test** (`test/git/one-door.test.mjs`): five probe shapes under `test/fixtures/git-one-door/`:
  - `rust-command-alias`;
  - `rust-shell-args`;
  - `rust-argv-runner`: git through a struct field into a primitive;
  - `launcher-operand`: git as a `timeout` operand;
  - `consumer-marker-on-git`.

  Each covers a resolution path this unit added; no existing probe reached them.
- **Added to `packages/git/rust/tests/safe_restore.rs`** (four, each naming its behaviour):
  - unconfirmed or stray confirmation refuses;
  - a linked-producer confirmation refuses;
  - a confirmed backward reset pins the old HEAD and snapshots the delta;
  - a stopped merge is cleared and its bytes retained.
- **Changed.** `test/scripts/test-timing.test.mjs` drops the `timeBinary` key, which no longer exists. No assertion changed.
- **Spy and door share one rule.** `sandboxNamedPaths` in `scripts/lib/git-spawn-match.mjs` is now the rule both apply. Before, the spy demanded the process cwd sit inside the sandbox even when the door was given `-C`, so every CLI-door spawn (`ci-external-consumer.sh`) was logged as a site.

## Residue: 9 sites

| Site | Why it stays | What retires it |
|---|---|---|
| `core/skills/distill/scripts/distill.mjs:49`, `core/skills/instruction-audit/scripts/instruction-audit.mjs:74` | Q3, waiting for the owner | Owner decision |
| `src/runner/dispatch/confinement/authority.mjs:823` | The binary is `snapshot.resolve(id).config.executable`, a method on a registry object; the scan does not model method returns of objects | Method-return data flow, or the authority passing the probed executable explicitly |
| `src/runner/dispatch/provider-capacity.mjs:485` `spawnHolding` | A method handed on as `spawnFn` into `runCredentialProbe`. Those calls are already resolved (codex/omp/pi/timeout), but the scan cannot link the method to the parameter that receives it | Value-flow of function references into parameters |
| `src/runner/dispatch/transport.mjs:408` `cliSpawnAdapter` | Called as `adapter.execute(invocation)` through `cliSpawnAdapter.execute = …`; the invocation comes from executor config | Same value-flow |
| `packages/holder-lock/rust/src/port.rs:946` | `argv = borrowed_argv(&spec.argv)` keeps `argv[0]`, but the scan has no model of that function. The BorrowSpec constructors are the git driver, the JSON route and the probe | Per-function argv model |
| `packages/holder-lock/rust/src/semantics.rs:118` (Windows) | `helper.argv().next()`: the tuple-struct `HelperExe(path)` is built from an addon argument | Tuple-struct and closure flow |
| `packages/process/rust/src/containment/linux.rs:28/50` and `:128` | bwrap path from `bwrap_path(env)` (a `match` over config or fixed locations) and `self.prefix()` | `if let`/`match` flow |

## Verification (this sandbox)

The wrapper `t.sh` sets:
- umask 077;
- private `FGOS_STATE_ROOT`/`FGOS_TEST_FIXTURE_ROOT` under `/tmp/fgos-work/u21`;
- `ensureGitAddon` from this tree;
- `node --test --import=./scripts/lib/test-git-config-guard.mjs --import=./test/helpers/git-spawn-spy.mjs`, with the spy log printed.

Results:
- `node scripts/git-one-door-scan.mjs --write-census`: 9 sites, exit 1, as expected from the residue.
- **Focused set** (one-door, event-store door, test-timing, herdr-cockpit-notify, fgos-claim, fgos-lock-fence, architecture, sandbox-git): 123/123 pass, and the spy recorded nothing after the door fix.
- **`test/scripts/*` plus `test/runner/merge-land.test.mjs`:** 542/544 before the marker. The 2 failures are unit 20's baseline: `runSelectedTests … fixture root` (`/var/tmp` is read-only) and `integration: a real mutant` (EROFS on main `.fgos/locks`). After the marker, `merge-land` plus goal-check plus one-door gave 35/35 and the spy was clean.
- **Subagent A** (claim, lock-fence, setup checks): 149/150. The one failure, `leaf-notify-drift` (`git-fence-missing` in its fixture), is in u15b/u20's baseline list.
- **Rust:**
  - `cargo test --locked -p fgos-holder-lock`: all pass.
  - `cargo test --locked -p fgos-git --no-fail-fast` (subagent): 238 pass, 9 ignored. Under umask 077, one existing mode test, `incoming_executable_mode…`, fails because `git apply` honours umask; it passes at umask 022.
  - `cargo test --locked -p fgctl --test git_wal_activation_gate`: 2/2.
  - `cargo test --locked -p herdr-fgos-common`: 26/26.
  - `cargo clippy --locked -p fgos-holder-lock -p fgos-git -p herdr-fgos-common -p fgctl --all-targets -- -D warnings`: clean.
  - `rustfmt --check`: clean on the new tests and the lines changed in `restore.rs`. `borrow_vectors.rs`, `restore.rs` and `safe_restore.rs` were already unformatted at HEAD, so their whole-file checks still report diffs.

**The host must run:**
- `cargo test --workspace && cargo clippy --workspace --all-targets -- -D warnings`.
- `cargo build --locked --manifest-path apps/fgos-gateway/Cargo.toml && cargo test --locked --manifest-path apps/fgos-gateway/Cargo.toml`. Its own workspace needs crates that are not in this offline cache.
- herdr-dashboard with the outbox patch, as above.
- `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<p07 build> npm test`. The spy should now record nothing.

## Concerns
- **Forward reset of a repo that tracks `.fgos`.** A plain forward `main-checkout-reset` without `--confirm` now refuses `restore-protected-fgos-path`, which the raw reset allowed. `--confirm` covers it. Real repos usually ignore `.fgos`; fixtures track it.
- **Test-only callers.** `uncalled-wrapper` and `argv-runner` depend on finding callers. A dynamic `import()` property call, or a Rust caller reached through a trait object, would be missed. The runtime spy covers what tests reach.
- **`borrow_vectors.rs` behaviour.** When git is missing, `run()` now creates and then removes its temp dir before returning `Unavailable`.

## needsWrites
- `herdr-dashboard/Cargo.toml`, `herdr-dashboard/Cargo.lock`, `herdr-dashboard/src/main.rs`. These are outside the write scope; the patch is `outbox/needs-writes-herdr-dashboard.patch`. Without it, herdr-dashboard no longer compiles against the deleted `repo_root()`.

Status: DONE_WITH_CONCERNS
Summary: The census fell from 70 to 9 sites. The two expected Q3 rows remain, plus 7 unresolved process primitives that need method or closure value-flow. Q1 is recorded and wired into scan and spy, Q2 shipped through SafeRestore, the gateway moved to fgos-git, and door.test now uses the shared scan.
Concerns/Blockers: Seven non-Q3 sites remain open. The herdr-dashboard change is a needsWrites patch with a hand-edited, unverified Cargo.lock. The gateway and full workspace builds need the host.
