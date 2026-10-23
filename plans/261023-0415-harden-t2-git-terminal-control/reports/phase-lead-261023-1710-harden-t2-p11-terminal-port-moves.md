# Phase 11 (conditional Q2 = a): last pane access behind the terminal-control port - lead report

Branch `harden/t2-p11-terminal-port-moves`, cut from `fd734fa2b`. Worktree `/home/vantt/projects/forgent-worktrees/t2-p11-terminal-port-moves`. `CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/t2-p11-target`.

## Commits

| Commit | Move |
|---|---|
| `79a24863a` | anchor pane (E-10) |
| `5bac2ff01` | agent kinds and integrations (E-11) |
| `96e0c7cc6` | socket from the session name (E-12) |
| `5d6280bd4` | attach ownership; `pane-owned.sh` deleted (E-17) |
| `ea3c7136c` | refusal text fixed, spec exceptions removed, spec and CHANGELOG |
| census | regenerated as the last commit (hashes only; 5 unresolved sites, same five) |

## Per move

### E-10 anchor pane
- `capabilities` takes `FGOS_HERDR_ANCHOR_PANE` from the envelope `env` (route reads it, trimmed; empty is not sent) and answers `anchorPane: {state: absent | resolved | unresolvable, reason?}` from the driver's existing `pane get` (`pane_liveness`). No herdr command runs when no pane is named, and none when herdr is absent (the answer is `unresolvable` with the refusal text).
- `Core::capabilities` now takes a `CapabilitiesAsk { anchor_pane, agents }` (Default = no extras), one argument instead of growing a parameter list.
- Deleted: `checkAnchorPane`, the `execFileSync` import in `src/setup/terminal-control-checks.mjs`. An empty value stays a Node check (the variable's own shape). File is 120 lines (was 138).
- Owners: driver case `capabilities_say_whether_the_named_anchor_pane_resolves` (live, gone, absent herdr), route inline `the_anchor_pane_comes_from_the_envelope_env_only`, Node row case with injected answers (it also pins that the trimmed pane rides in the client env).
- Retired: the Node case that wrote a fake `herdr pane get` script (owner: the driver case).

### E-11 agent kinds and integrations
- `capabilities {agents: true}` answers `agentKinds` and `integrations`, parsed in the driver (`parse_agent_kinds`, `parse_integrations`) from `agent start --help` and `integration status`; `"unknown"` when the text cannot be read or the command fails. Without the flag nothing extra runs.
- Deviation, on purpose: the phase text has the fields always present. That would add two herdr commands to every `capabilities` call, and `ensureWorkerSession` polls `capabilities` every 500 ms. The optional `agents` flag keeps `capabilities` at 0 extra commands; the doctor row sets it only when an executor uses a herdr pane (same condition as before).
- Deleted: `readHerdrAgentKinds`, `readHerdrIntegrationStatus`, `defaultHerdrRun` in `registrations.mjs`. `checkHerdrExecutorKinds(runnerCfg, ask)` keeps id and conditions; `ask` defaults to the route.
- Fixtures: `agent-start-help.txt`, `integration-status.txt`, parsed in `herdr_driver_fixtures.rs`; the fake herdr answers both.
- Retired: `readHerdrAgentKinds ...` and `readHerdrIntegrationStatus ...` cases (owners: the two fixture cases; the unknown answer and the command count: `agent_kinds_and_integrations_come_from_herdrs_own_text_and_are_unknown_when_it_cannot_be_read`). One wiring case runs the real route against the fake herdr.

### E-12 socket
- `HerdrConfig::socket()` = the caller's own `HERDR_SOCKET_PATH`, else the socket derived from `HERDR_SESSION` (the one place the layout is written: default session `herdr.sock`, others under `sessions/<name>/`; invalid names derive nothing). Used by `exec` and by the incarnation read, so a named session no longer needs `status server`.
- The route no longer lets the process-inherited `HERDR_SOCKET_PATH` replace a named session (a cockpit socket inherited by a confined caller was the hole this closes).
- `capabilities` answers `endpoint.socketPath` (explicit, derived, or the default session's path when nothing is named).
- Node: `socketPathForSession` deleted; `envForSession`/`isolatedSessionEnv` name the session and drop any inherited socket; `worker-session-boot.mjs` asks the route (a route that does not answer, or names no socket, stops as `worker-session-server-unknown` naming the failure, before anything is looked at or started); `confinement/resources.mjs` `herdrSocketDir` uses `dirname(HERDR_SOCKET_PATH)` when the caller has one, else asks the route, cached per process and session, and refuses the grant when the route does not answer.
- Proof: `rg -n "herdr\.sock|\.config/herdr|'\.config', 'herdr'" src` -> nothing (three prose comments reworded).
- Owners: driver cases `a_session_names_its_own_socket_and_reaches_herdr_through_its_environment` and `the_socket_follows_herdrs_layout_for_the_default_session_a_named_one_and_the_callers_own`, route inline `a_named_session_is_never_pointed_at_the_inherited_socket`, boot cases (route names the socket; route down), blind case (route names the directory), one route wiring assertion. Retired: Node `C2: a session name resolves to that session own socket` (owner: the layout driver case) and the boot case `a route that does not answer keeps the socket...` (owner: `a route that names no socket stops the boot before anything is looked at or started`).

### E-17 attach ownership
- The core learns the caller from the OS: `Core::new` names this process; the route builds `with_caller(parent_of_this_process())` (host is a child of its caller). `attach` walks the caller's ancestry as tuples (pid, start time, boot) through `fgos_process::facts` (`identity::ancestry`) and requires the pane's shell (`process_info.shell_pid`) to be one of them. Unreadable, unnamed or mismatched = `unknown` with reason `pane-not-owned: ...` naming the shell and the tuples seen. Runs before the store is read, so a key already bound to the pane is no way around it (`attach` -> `attach_owned` for the race retry).
- Deleted: `plugins/fgOS/skills/terminal/pane-owned.sh`, its sourcing in `rename.sh` and `close.sh`, `test/skills/terminal-pane-ownership.test.mjs` (4 cases against a fake herdr and fake fgos).
- Real-process proof, `test/plugins/terminal-skill-attach.test.mjs`: `rename.sh` and `close.sh` are accepted through the skill's own call path (script -> subshell -> host route, pane shell = the test process), a pane whose shell is a live sibling process is refused by both scripts, and a direct route call names the refusal (`pane-not-owned: the shell of pane ... is not among the caller's ancestors`) and records nothing. Core owners: `attach_takes_only_a_pane_whose_shell_is_the_caller_or_one_of_its_ancestors` (stranger, own, and on Linux the parent), `a_caller_the_os_does_not_name_never_takes_a_pane_even_through_a_key_already_bound_to_it`.
- Callers moved in the same commit: core tests that attach now make the test process the pane's shell (`run_caller_in`), the fake herdr takes `FAKE_HERDR_SHELL_PID`, `fake-herdr-pane.mjs` takes `shellPid`, and the two Node suites that attach through the route (`client-route`, `terminal-groups` anchor case) say whose pane it is. `packages/run-supervisor` does not call `attach` (rg proved); its suite is green.

## The rg proof

`rg -n "herdr" src plugins --glob '!*.md'` -> 329 lines. The execution-bearing ones, after filtering for exec/spawn/`herdr <verb>`/binary use:

```
src/runner/dispatch/worker-session-boot.mjs:167:    const child = spawnFn(herdrBin, ['--session', sessionName, 'server'], { detached: true, stdio: 'ignore' });
```

is the only exec of the herdr binary outside the driver. Everything else is the binary path handed to the route (`herdrBin`, `FGOS_HERDR_BIN`, `resolveHerdrBin`), adapter names (`herdr-spawn`), prose, and `command -v herdr` presence probes in the two skill scripts (no exec). The phase's own grep, `rg -n "execFileSync\(.*herdr|'pane', 'get'|herdr\.sock|\.config/herdr" src plugins`, finds nothing; `rg -n "(spawn|spawnSync|execFile|execFileSync|exec|execSync)\(\s*(herdrBin|bin|resolveHerdrBin|'herdr')" src plugins` hits only other binaries (`fgos`, gateway, bwrap, claude...).

## Delta lines (`git diff fd734fa2b..HEAD`, census excluded)

| Area | + | - | net |
|---|---|---|---|
| Node src | 85 | 104 | -19 |
| Skill shell | 11 | 49 | -38 |
| Node tests | 166 | 233 | -67 |
| Rust src | 241 | 21 | +220 |
| Rust tests | 165 | 21 | +144 |
| Rust fixtures | 19 | 1 | +18 |
| Contracts | 9 | 4 | +5 |
| Docs + CHANGELOG | 7 | 7 | 0 |

Targets missed: Node -57 including shell (target -120) and Rust +220 (target +90). Why: Node keeps an `ask` seam in the row, the route lookups in `worker-session-boot` and `resources` (a real failure path each, plus the per-process cache), and the sibling-process test helpers; Rust carries four answers, two parsers, the layout rule, the ancestry walk, and about 40 lines of inline route/identity tests that count in `src`. Production Rust alone is about +180.

## Test-cost line

- Rust added 11 (fake: anchor, agent facts, layout; fixtures: 2; core_rules: 2; route inline: 2; identity inline: 1; plus the socket-session case replacing one) and 3 rows in `each_operation_runs_a_fixed_number_of_herdr_commands` (capabilities with an anchor pane = 1, with agent facts = 2, attach 2 -> 3). Retired 1 (replaced).
- Node added 6 (agent-kinds wiring, boot route-names-socket, boot no-socket stop, blind route directory, skill attach refusal naming, anchor row replaced one); retired 9 (2 scrape cases, anchor fake-herdr case, the layout case, the boot route-down case, 4 ownership-file cases).
- New host/herdr spawns in the suite: 8 host route calls (agent wiring 3, blind 1, skill attach 2, client-route 2) plus 1 in the anchor row case; retired spawns: the 4 ownership-file cases (each ran a bash script with fake binaries) and the fake-herdr `pane get` script runs. Production: `attach` costs one more herdr command (`process-info`) and the process-table reads; `capabilities` costs 0 more unless asked.

## Verification

- `cargo test --no-fail-fast -p fgos-terminal-control`: lib 12, core_failures 29, core_rules 20, herdr_driver_fake 26, herdr_driver_fixtures 14, policy_fixtures 6, store_publish 5 pass (live test ignored); `-p fgos-run-supervisor`: 135 pass, 0 fail.
- `cargo clippy -p fgos-terminal-control -p fgos-run-supervisor --all-targets -- -D warnings`: clean; `cargo check -p fgos`: clean.
- Node, one-file command, 705 tests, 0 fail, no `run-tests: ERROR` line: `test/terminal-control/*`, `test/setup/{terminal-control-checks,registrations,visibility-checks,checks,checks-doctor-config}`, `test/plugins/terminal-skill-attach`, `test/runner/dispatch-worker-session*`, `dispatch-confinement-*`, `execution/{handoff-refs,run}`, `dispatch-visibility-session`, `dispatch/worker-env-case-context`, `herdr-*`, `dispatch-worker-home`, `dispatch-reconciliation-import-graph`, `test/run-supervisor/{terminal-groups,terminal-crash-matrix}`, `test/rust-host/internal-routes`, `test/architecture`, `test/verbs/dispatch-observe`.
- `node scripts/git-one-door-scan.mjs`: 5 unresolved-binary sites (`bin/fgos.mjs` x2, `merge.mjs` x2, `worktree.mjs`); the census file changed (file hashes only) and was regenerated with `--write-census` as the last commit.

## Concerns and open points

1. **macOS (resolved after the first report: the big lead asked for a macOS `relation_of`; done in a follow-up commit, compile-checked for `aarch64-apple-darwin` only; terminal-control cannot be checked for that target because `fgos-holder-lock` already fails to compile there (`has_borrowed_copy`), unrelated).** Original concern, now moot except on Windows: The Process door reads a parent only on Linux (`relation_of`). Off Linux `attach` passes only a pane whose shell is the caller itself, so `/fgOS:terminal`, `/fgOS:terminal-close` and a dispatch anchor are silent no-ops there (the deleted script walked `ps`). The spec and contract say so. Fixing it means a macOS `relation_of` in `packages/process` (T0's crate). Owner or big lead call.
2. **Behaviour change.** A `FGOS_HERDR_ANCHOR_PANE` that the dispatching process does not run inside (a detached controller, a daemon) is now ignored: the group opens its own tab, which is what the round already does when the attach fails. In the CHANGELOG line.
3. **Blind-read grant** has a new failure mode: with no `HERDR_SOCKET_PATH` and no answering route it refuses (`confinement-grant-invalid`) instead of hiding a guessed directory. Silent hiding-nothing was the alternative; I judged that worse.
4. `capabilities` got an optional `agents` request flag (deviation above).
5. Files outside the phase's Modify list that changed: comment-only edits in `src/runner/dispatch/herdr-round.mjs` and `worker-home.mjs` (so the socket-layout grep is clean; `herdr-round.mjs` is a T5 file, name it on the board), `packages/terminal-control/rust/src/identity.rs` (ancestry), `test/helpers/fake-herdr-pane.mjs`, `test/run-supervisor/terminal-groups.test.mjs`, `test/setup/visibility-checks.test.mjs` (owner of the scrape cases), `test/runner/dispatch-confinement-blind.test.mjs`.
6. No Git-area file changed except the census regeneration, so OPC review does not apply.
7. The worker session-server start stays raw (`worker-session-boot.mjs:167`), named as the only exception in the spec.

## Unresolved questions

- none open; the macOS door change has never run on a Mac (only compiled).
