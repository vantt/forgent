# Phase 6 rest (terminal-control, 06B scope) - lead report

Branch `harden/t2-p06b-terminal-rest` (from `635af1aef`). Worktree `/home/vantt/projects/forgent-worktrees/t2-p06b-terminal-rest`. `CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/t2-p06b-target`.

## Commits (in order)

| Commit | What |
|---|---|
| `e8a349d10` | E-26 dead surface + the contract text for it (capabilities, placement request, allocation record, launch/label inputs) |
| `333f0664d` | F-8 + core half of E-14 + one timeout budget + D6 swap (count test replaces p95 case) |
| `1648524f8` | Node half of E-14: `config.mjs`, doctor rows, client error codes, CHANGELOG line |
| `1c8b45be2` | test: route refuses non-integer / non-positive / unregistered config by name |
| `6e385ef5a` | E-13 client |
| `54658b1b4` | E-15 `fixTerminalDir` + `terminal-dir` registration (no doctor row touched) |
| `006f92975` | E-16 `herdr-agent.mjs`, `findAgentBinding` |

## Per item

### E-26 dead surface (Rust)
Final proof, one rg over `packages src bin plugins test apps`: `read_hint|write_hint|GroupHint|label_tab|ReleaseMarkerOutcome::KeptUnknown|role_hint|roleHint|reportState|report_agent|activity_start|ActivitySpec|pane.resize|pane.swap|pane.move|groupHint|groups/` -> hits only in unrelated crates (`event-store` has its own `read_hint`) and two other fake-herdr scripts (see Limits).
- Activity-launch branch: `LaunchSpec.activity`, `ActivitySpec`, `TerminalDriver::activity_start` (+ herdr impl, mem driver, fake script arm `agent start`). Only constructor was `run-supervisor terminal.rs:242 activity: None` (removed with it).
- `label_tab`, `report_agent`, route `reportState`, `Core::label` loses its third argument (callers: route, one test).
- Group hint: writer, reader, `GroupHint`, `groups/` dir creation, the contract file text. Prior `git log -S` not needed: written on every allocate, read only by `store_publish`.
- `ReleaseMarkerOutcome::KeptUnknown` (never built; contract enum drops it). The spec's grep also matches `ReleaseOutcome::KeptUnknown` (live: route result `kept-unknown`, 7 uses, tested) - that one stays.
- `role_hint` in `AllocateRequest`, `GroupPane`, `PlaceRequest`; policy fixture JSON and placement contract.
- Capabilities `pane.resize/swap/move`: `CAPABILITIES` 15 -> 12, driver contract; the "never declared" loop in `herdr_driver_fake` retires (the `all(|c| CAPABILITIES.contains(c))` assert owns it).
- Dead fixtures: `list_and_session_answers_unwrap` and the `tab-get-not-found` entry, and files `pane-list`, `tab-list`, `tab-get`, `session-list`, `tab-get-not-found` (five, not four: the fifth is the same kind, `tab get` is never issued). `fake-herdr.sh` loses `agent start`, `pane report-agent`.
- Retired test: `store_publish the_group_hint_is_rewritten` (behaviour removed).
- Not paid: "`release(close)` reads the incarnation three times -> once". The reads are not repeats: `open()` picks the store; the driver's read before the close comes after the `process-info` spawn and guards a server swap in that window (pane ids belong to one server; a swapped server would close a stranger's pane); the read after is the `a_server_swapped_while_closing_is_unknown` guarantee. No herdr command is involved (socket peer cred + `/proc`). Kept; owners `close_is_refused_when_the_expected_incarnation_is_not_the_live_one`, `a_server_swapped_while_closing_is_unknown`.
- Not in the phase text, left: `layout_geometry` per-pane `process-info` (the O(N^2) spawn pattern). The new count test pins today's numbers (allocate beside a live pane = 8 herdr commands) so any change is deliberate.

### F-8 contracts made true
- `release` results add `unknown`; `reconcile-scan` lists `unsupported`, `unknown`; `capability` text matches `herdr.rs:254`, `driver-absent` removed; `reason` is `Display` (`impl Display for Refusal`, used in `send`), no `{refusal:?}` left in the core.
- New members, pinned by `contracts.test.mjs` (one case): scan finding `paneId` (already in), `capabilities.defaults` + `policies`, `configRefusals.terminal-config-below-floor` and the route `errorStdout.code` enum.
- Route contract: `timeoutMs` and the floor text.
- One timeout budget: the client sends `timeoutMs`; the route sets a deadline of nine tenths of it; `HerdrConfig::timeout()` = min(per-command cap, time left). Without `timeoutMs` (in-process supervisor) the 15 s cap stays. The `activity_start` `timeout + 15 s` stack went with E-26. Proof: `herdr_driver_fake a_command_never_runs_past_the_operations_budget` (30 s cap, 0.8 s budget, hang), route inline `the_operation_budget_bounds_every_herdr_command`.
- Contract text for the removed items is in `e8a349d10` (code and contract together, L10).

### E-14 core half
- `core_config` (route.rs) is the one refusal step: positive integers (message names the value), the measured floor (`LIMITS_FLOOR` 40x8): `terminal-config-below-floor`, message `layout.minCols=30 < 40, the measured floor: ...`, exit 2 with the new error code; the policy is resolved by the same step from the core registry (the second step after it is gone).
- `capabilities` answers `defaults` (from the same consts `core_config` falls back to) and `policies` (`POLICY_NAMES`).
- Owners: route inline `an_envelope_below_the_measured_floor_is_refused_by_name` (both keys + the floor itself allowed), `config_defaults_and_overrides`.
- Per D-T2-7 the grace-vs-agent-ready rule and the `retainFailedPaneMs` shape stay in Node (`terminalConfigProblems`); the big lead already recorded the T5 input in the parent plan's phase-06 Received list. I did not edit the board or the parent ledger from this branch.

### E-14 Node half
- `config.mjs`: `KNOWN_POLICIES`, `LAYOUT_FLOOR` deleted; `GRACE_MARGIN_MS` no longer exported; `resolveTerminalConfig(..., { defaults })` takes the core defaults; `values` is a flat map by dotted name (callers read only `allocationGraceMs`, `retainFailedPaneMs`); `terminalConfigProblems` keeps the two Node rules. `DEFAULT_TERMINAL_CONFIG` stays as the setup shape and the route wiring test pins it equal to `capabilities.defaults` and `capabilities.policies` equal to the placement contract.
- Doctor `terminal-config` sends the explicit settings with `capabilities`, prints the core's refusal (`routeMessage` + code) beside the Node rules; one extra `capabilities` call only on the refusal path. `terminal-allocations` reads the grace default from `capabilities`. Rows, ids and descriptions unchanged (phase 7 owns them). Route down -> `warning:` pass, as the sibling row.
- Trade-off: the core reports its first refusal, not every broken layout key at once (the Node rules still list together).
- Client: sends `timeoutMs`; `terminal-config-*` codes pass through; the error carries `routeMessage`.
- Retired with owners: the regex over `route.rs` text (owner: route wiring case compares the real `capabilities` answer with `DEFAULT_TERMINAL_CONFIG` and the placement contract); the Node unregistered-policy case and the positive-integer limit sub-cases (owners: route inline `config_defaults_and_overrides` now asserts every bad shape is refused with code `usage`; floor case above); the Node limit case shrinks to one floor wiring case.

### D6 test swap
p95 case (200 host spawns) retired in `333f0664d`; `herdr_driver_fake each_operation_runs_a_fixed_number_of_herdr_commands` pins 11 rows over the ten ops (capabilities 0, allocate new tab 1, allocate beside a live pane 8, attach 4, launch refused 1, send refused 2, read 2, inspect 3, label 2, scan over 3 records 6, release close 2). `launch` is counted at its first refusal (an attached pane): a real launch waits on a clock, so its count is not fixed.

### E-13 client
- Deleted: `export { OPS as TERMINAL_CONTROL_OPS }` and the `OPS` list; `PROTOCOL` no longer exported. Proof: `rg -n "TERMINAL_CONTROL_OPS|export const PROTOCOL" src test` -> only other modules' own `PROTOCOL`.
- Deleted sync arms `launch`, `send`, `label`. Proof: `rg -n "\.(launch|send)\(" src plugins bin scripts test apps` -> no client call (only `process.send`, `reqwest .send()`); `label`: only the route itself via `rename.sh`.
- Kept `allocate` sync: `test/run-supervisor/terminal-groups.test.mjs:91` calls it (file not mine).
- One spawn path: NOT paid. Remaining sync callers: `cli.mjs:1044-1045` (inspect, release), `herdr-round.mjs:409,483` (attach, read), `settle-attempt.mjs:92` (read), `worker-session-boot.mjs:37` and the checks (capabilities, reconcile-scan). All T5 files or not mine.
- `client.mjs` 235 lines (target 200, not met: the 35 lines are the second path); `config.mjs` 111 (target 100, not met: merge, route extraction, retain read remain).
- Mutation re-proofs (core mutated, owner seen to fail, reverted): `send` foreground guard off -> `a_brief_sent_to_a_pane_whose_shell_holds_the_foreground_is_not_typed_and_nothing_runs` fails; `wait_for_shell` skipped -> 7 `core_failures` cases fail incl. `the_launcher_is_typed_only_after_the_shell_has_run_a_probe`; queue made immediate -> both `calls of one group never overlap` and the real-host case fail.
- Retired: `group-queue` real-host case (owner `calls of one group never overlap`); in the wiring case the "nothing typed" and "only probes typed" detail asserts (owners above).
- Kept, re-proof failed: `client-route` "unknown keys and a missing herdr come back as results" and "a bad request or a wrong protocol throws a named error". The seat's named owners (`herdr_driver_fake:161-172`, `route.rs:364-378`) prove the driver and the exit codes, not that the route serialises a refusal as a result or that the client names a route error. Nothing else does. I added to the bad-request case the usage exit for a `send` with neither text nor keys (the arm lost its only proof when the client arm went).
- Rust subsets `core_failures` `:246-262` and `:384-406`: already retired by `7fa1566c5` before this branch.

### E-15
Deleted `fixTerminalDir`, `registerFix terminal-dir`, the test. `store_publish directories_are_private` now asserts the `terminal` dir and every dir under it is 0700 (the store creates them recursively). Doctor rows untouched in that commit. `setup-doctor-registry.md` lost the id because `registrations.test.mjs` pins that list to the registry.

### E-16
- `herdr-agent.mjs`: `rg -n "herdr-agent(\.mjs)?['\"]" src test bin scripts plugins apps packages` -> importers were `herdr-round.mjs` (now `proof-helpers.mjs`, one line, T5 file: name it on the board), `test/runner/dispatch-confinement-authority.test.mjs:10` (redirected), its own test. `isReadyState`/`READY_STATES`: no caller.
- `findAgentBinding`: only its own two tests.
- Test move, not delete: `herdr-agent.test.mjs` deleted, but its six `normalizeAgentName` cases test live behaviour (`proof-helpers`, the 32-char limit herdr refused at); they moved whole to `proof-helpers.test.mjs`. Only the ready-state case retired (behaviour removed).
- `docs/architecture-manifest.json` drops the file's row (`architecture.test.mjs` fails otherwise).
- `provider-account-probe.mjs:122-125`: proved dead, left for T5 (H26). Proof: `rg -n "herdr-diagnosis|detectionScreen|herdrDiagnosis" src bin scripts plugins test packages apps docs` -> the only code hit is the read itself; tests write the file by hand; `writeVisibility` patches in `herdr-round` (`round.note` sites, 12) never carry `screen`. Why not deleted: removing the read makes the `blocked-trust-prompt` outcome class unreachable, and that class is a documented public output (`command-registry.mjs:1418` description, `docs/specs/runner.md` RUL79, 3 test sites in `provider-account-probe.test.mjs`). That is a public-contract change, not a 4-line read. Input for T5: the class, the description, the spec row and the tests go together.

## Verification (results)

```
cargo test --no-fail-fast -p fgos-terminal-control
  lib 9 ok, core_failures 29 ok, core_rules 17 ok, herdr_driver_fake 23 ok, herdr_driver_fixtures 12 ok,
  herdr_driver_live 0 passed 1 ignored, policy_fixtures 6 ok, store_publish 5 ok
cargo test --no-fail-fast -p fgos-run-supervisor      -> 135 passed, 0 failed
cargo clippy -p fgos-terminal-control -p fgos-run-supervisor --all-targets -- -D warnings -> clean
cargo check -p fgos                                    -> clean
Node (one-file command): client-route, group-queue, contracts, terminal-control-checks, terminal-skill-attach,
  dispatch-visibility-session, proof-helpers, run-supervisor/terminal-groups, dispatch-worker-session-boot,
  registrations, architecture, dispatch-confinement-authority  -> tests 216, pass 216, fail 0, no run-tests ERROR line
also green: test/setup/checks.test.mjs + checks-doctor-config.test.mjs (124), herdr-private-home-trust, herdr-claude-invocations,
  dispatch-reconciliation-import-graph, verbs/dispatch-observe, dispatch-worker-home
```
Greps: `rg "read_hint|label_tab|roleHint|role_hint|reportState|pane\.resize|fixTerminalDir|KNOWN_POLICIES|LAYOUT_FLOOR|TERMINAL_CONTROL_OPS|herdr-agent" packages/terminal-control src` -> nothing. `rg "pre_exec|try_wait" driver/herdr.rs` -> one hit, `child.try_wait()` in CF10's deadline loop (CF10 is out of this scope; the loop wakes on the exit descriptor, the 1 ms spin and the `3..1024` loop are gone).

## Delta vs estimate

| | Actual | Phase estimate |
|---|---|---|
| Node src | -88 (+86/-174) | -150 |
| Rust src | -33 (+134/-167, includes +30 inline route tests) | -70 |
| Node tests | -105 (+121/-226) | floor -70 / expected -280 (client-route 72-120 kept, see E-13) |
| Rust tests | +25 (+72/-47) | included above |
| Contracts/fixtures | contracts 0 net, fixtures -5 | - |

## Test-cost line

Added 9: herdr command count over the ops, budget bound (driver), route floor case, route budget case, contracts members case, doctor floor refusal case, doctor Node-rules-plus-core case, doctor route-down warning, and the `send` usage-exit assert inside an existing case (not a new test). Retired: p95 case, real-host queue case, hint test, fixtures unwrap test, `fixTerminalDir` test, regex test, Node policy case, Node limit sub-cases, `herdr-agent` ready-state case, two `findAgentBinding` cases, five fixture files; six name cases moved. Host spawns in the suite drop by about 200 (p95 case) plus the real-host queue case (7 allocate/close calls); the wiring case waits 200 ms for the launch handshake instead of 600 ms.

## Limits and follow-ups for the big lead

- Census: `packages/git/contracts/mutation-census.v1.json` holds hashes of every file I changed (client, config, checks, herdr.rs, route.rs, tests). I did not regenerate it (Git area). Regenerate after the merge.
- Docs now stale, phase 9: `docs/specs/distribution.md` lines 75, 78, 199 and `docs/platform/terminal-control/spec.md:133` still say setup creates the directory through the `terminal-dir` fix; the terminal spec's op list and group hint text; `docs/how-to/install-fgos-in-a-project-and-use-doctor.md:464` names `herdr-diagnosis.json`.
- Other fake herdr scripts still answer `pane report-agent`: `test/helpers/fake-herdr-pane.mjs:203`, `packages/run-supervisor/rust/tests/fixtures/fake-herdr-pane.py:142` (not mine; harmless).
- `herdr-round.mjs` import line: one line in a T5 file, to name on the board.
- CHANGELOG: two lines (floor refusal + capabilities + budget; `terminal-dir` repair gone).

Unresolved: none that block merge.
