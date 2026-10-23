---
phase: 06
title: "Terminal-control: observation-only scan (CF02), tuple ownership (CF03), honest durability (CF04), Process spawn door and deadline wait (CF10), the core owns its rules (E-14), dead surface and Node copies deleted (E-13, E-15, E-16, E-26), contracts made true (F-8)"
status: pending
depends_on: [01]
parallel: "with phases 02–05 (disjoint files; see plan.md parallel marks)"
effort: ~2d
net_size: "Node −150 / Rust −70 / tests −70 floor, −280 expected (estimate)"
---

# Phase 06 — Terminal-control

## Context

Arbitration D1 step 6, §2.2 (correctness inside the core; delete list; rules move to Rust; contracts made true; Node budget), §3 verdicts 3 and 4, D6 (the p95 bar becomes a herdr-invocation count), §5 (E-14 config defaults → CFG). [plan.md](plan.md) D-T2-6 (CF02 removes the doctor-driven expiry close) and D-T2-7 (E-14 scope). Correctness seat CF02–CF04, CF10; simplicity E-13..E-16, E-26, F-8 (its terminal `config.mjs` line numbers are wrong for this file: current `KNOWN_POLICIES :15`, `LAYOUT_FLOOR :19`, `DEFAULT_TERMINAL_CONFIG :24`, `terminalConfigProblems :90`). E-15 lands here and **not** with the doctor rewrite (phase 7), red-team.

## Requirements

### Core correctness (Rust, `packages/terminal-control/rust/src`)

- **CF02 (D-T2-6).** `reconcile_scan` (`core.rs:752-770`) closes nothing. `scan_record`'s retained branch (`core.rs:805-819`) reports `RetainExpired` with the pane id and never calls `close_unrecorded`; the expiry-close code path is deleted (no other caller: `rg -n "reconcile_scan|reconcileScan|reconcile-scan"` outside tests finds only the doctor route, 2026-10-23). `Finding` (`port.rs`, seat `:203-207`) carries `paneId` so a person can find the pane (G-8). Phase 1's retargeted `retain_closes_only_past_until_on_the_same_incarnation` turns green under its new name.
- **CF03.** <!-- Updated: Red Team 2026-10-23 - no recorded shell tuple exists --> In `foreground_is_owned` (`core.rs:772-777`), the guard stays one predicate, used by both the immediate close and the expiry path. It changes in three ways:
  - **The launched process** is judged by its **recorded tuple**: pid, start time and boot identity, from `LaunchedMarker.identity` (`record.rs:53-58`). A foreground entry with the launched pid but a different live tuple is not owned. The tuple is read through the Process identity door the crate already uses (`driver/herdr.rs:413`), once before and once after herdr's `process_info` answer, and both reads must match.
  - **The shell** is judged by herdr's own `shell_pid` for that pane. That is the same live answer as today: there is no recorded shell tuple (`record.rs:12-23`), and a pane whose shell exited is gone in herdr. No new record field.
  - **An empty foreground list**, an unreadable tuple or a mismatch → not owned → `kept-unknown`, no close.

  Red tests (phase 1, plus two cases here): "a launched command that finished leaves the shell in the foreground and the pane closes"; "an allocated pane that never launched closes"; "a foreground process that only shares the launched pid is kept". This replaces the pid-only predicate and adds no identity mechanism.
- **CF04.** `install_result` (`store.rs:144-166`): when the final name exists but a later durability step failed (`error.installed` is `Some`), the result is an error that keeps the installed fact (`Installed` returned beside the error, e.g. `Err(InstallUnproven { installed, source })`), and callers (`publish_once` users: allocate, launch-requested, released markers) answer `unknown` with a named cause instead of plain success. Prior art `90934bd96` kept the old mapping on purpose; this is the explicit correction. The inline test (phase 1) owns it.
- **CF10.**
  - `exec` (`driver/herdr.rs:229-274`) spawns through `fgos_process::control::spawn_with_fds(cmd, &[])` (`packages/process/rust/src/control.rs:94`). That door takes, in the parent and just before fork, the list of every descriptor from 3 up that is not close-on-exec, at any number, and closes that list in the child (`control.rs:236-247`, `inheritable_fds` `:264`).
  - It waits with a deadline on `fgos_process::control::exit_descriptor(pid)` (`control.rs:30`) with `poll`. That is the same pattern the Git driver uses (`packages/git/rust/src/driver.rs:1254-1266`).
  - The 1 ms `try_wait` loop and the `3..1024` `pre_exec` loop are deleted. Non-Linux keeps the existing short-step fallback, and the readers stay bounded by `READER_GRACE`. Phase 1's fd-2048 case goes green.
  - <!-- Updated: Red Team 2026-10-23 --> **Named residual (arbitration verdict 4 chose this door):** a descriptor that another thread opens *without* close-on-exec between the parent's list and the fork is not covered. The door documents this (`control.rs:86-90`). fgOS opens every descriptor close-on-exec, which bounds the risk. Closing it at fork time (`close_range`) is a T0 Process door change and goes to the board as an input for the Process owner. T2 does not change it.

### Rules move to the core (E-14, D-T2-7)

- The core validates the envelope's `layout` config: known policy (from its own registry, `policy/mod.rs`), positive limits, and the measured 40×8 floor (`route.rs:121-146` today accepts any ≥ 1); a violation is a refusal naming key, value and floor (`terminal-config-below-floor: layout.minCols=30 < 40`).
- `capabilities` answers the core's defaults and policy registry (`defaults: {...}`, `policies: [...]`) so Node stops restating them: `src/terminal-control/config.mjs` deletes `KNOWN_POLICIES` (`:15`), `LAYOUT_FLOOR` (`:19`) and the copy of the defaults (`:24`, kept only as the `registerConfigDefault` shape until CFG lands "differences only", H27), and `terminalConfigProblems` (`:90`) keeps only the two rules whose inputs are not the core's: grace ≥ the agent ready timeout (`READY_TIMEOUT_MS`, `src/runner/dispatch/herdr-deadlines.mjs:7`) + 30 s, and the `retainFailedPaneMs` shape. These two go to T5 as an input (board + parent ledger line, same turn).
- The regex test over `route.rs` source text (`test/setup/terminal-control-checks.test.mjs`, seat cite `:325-332`; re-grep) is retired; the core's rule tests own the floor (`route.rs` inline `:365-381` or `policy_fixtures.rs`), one new case "an envelope below the measured floor is refused by name".

### Contracts made true (F-8)

- `packages/terminal-control/contracts/terminal-control.port.v1.json`: `release` results add `unknown` (`route.rs:244-246`, `core.rs:696`); `reconcile-scan` lists `unsupported` and `unknown` (`route.rs:483`); the `capability` field description matches `herdr.rs:254` (`"herdr"`), `driver-absent` removed; `reason` text is `Display`, not `Debug` (`core.rs:585`).
- `driver-capabilities.v1.json`: drop `pane.resize`, `pane.swap`, `pane.move` (with the three `CAPABILITIES` entries `driver/mod.rs:23-25`; `herdr_driver_fake.rs:77-79` already forbids drivers to declare them).
- `placement-policy.v1.json:19` request matches `PlaceRequest` (`policy/mod.rs:31-35`) after `roleHint` goes.
- `allocation-record.v1.json`: drop `kept-unknown` (`:34`, never written) and the group hint (`:36-39`).
- One timeout budget: the client's `timeoutMs` is sent in the envelope and the driver derives its per-command deadline from it (today three stacked: `herdr.rs:23` 15 s, `client.mjs:21` 60 s SIGKILL, `herdr.rs:589`).
- New members this phase adds, each written into `terminal-control.port.v1.json` and pinned by `test/terminal-control/contracts.test.mjs` in the same commit (arbitration §2.2 E-14 and §2.4 "each finding carries its pane id"): `reconcile-scan` findings gain `paneId` (`port.rs:203-207` today `{key, kind, detail}`); `capabilities` gains `defaults` and `policies` (today `{driver, capabilities, serverIncarnation}`, contract `:116-123`, `route.rs:257`); the refusal cause `terminal-config-below-floor`. <!-- Updated: Red Team 2026-10-23 -->

### Dead surface (E-26) and Node deletes (E-13, E-15, E-16)

- Rust: the unreachable activity-launch branch (`core.rs:433-434,447,463-469,550-551`, `driver/mod.rs:179-186`, `herdr.rs:579-591`), `TerminalDriver::label_tab` (`driver/mod.rs:196`, `herdr.rs:608-611`), the group hint writer/reader/type (`core.rs:230-236`, `store.rs:115-121`), `ReleaseMarkerOutcome::KeptUnknown` (`record.rs:65`), `allocate.roleHint` (`core.rs:354,366`), `reportState` (`route.rs:252`), the dead fixtures `herdr_driver_fixtures.rs:88-93` and the four fixture files for commands the driver never issues; the three-times incarnation read in `release(close)` (`core.rs:148`, `herdr.rs:480,489`) → once. Each by `rg` in the commit body (seat lines; re-grep).
- Node `src/terminal-control/client.mjs`: delete `export { OPS as TERMINAL_CONTROL_OPS }` (`:240`) and `export const PROTOCOL` (`:19`, keep a local const) — no importer (`rg -l "TERMINAL_CONTROL_OPS"` → client only, 2026-10-23); delete the sync arms with no Node caller (seat: `allocate` sync, `launch`, `send`, `label`; the lead re-proves each with `rg -n "\.(launch|send|label)\(" src` against Terminal Control clients). Keep both spawn paths unless every remaining sync caller can move to the async one inside T2 files; otherwise the one-spawn-path fold is "not paid" (T5 callers `terminal-slot.mjs`, `settle-attempt.mjs` are not edited here).
- E-15: delete `fixTerminalDir` (`src/setup/terminal-control-checks.mjs:133-156`) and `registerFix({ id: 'terminal-dir', … })` (`src/setup/registrations.mjs:4491`); the store creates the directory recursively with mode 0700 (`store.rs:124-130`). Spec §9 "Setup and doctor" line updated in phase 9.
- E-16: delete `src/runner/dispatch/herdr-agent.mjs` and `test/runner/herdr-agent.test.mjs`; `herdr-round.mjs:26` imports `normalizeAgentName` from `./proof-helpers.mjs` (one-line edit in a T5 file, named on the board); delete `findAgentBinding` (`visibility-session.mjs:158-171`) and its cases (`test/runner/dispatch-visibility-session.test.mjs:83-84`). The `provider-account-probe.mjs:122-125` read is deleted only if `rg` proves no writer of `herdr-diagnosis.json` and of a `screen` field in `visibility.json` (`visibility-session.mjs:67` writes the file); otherwise it goes to T5 (H26) unchanged.

### Tests (principle 8)

- D6: `test/terminal-control/client-route.test.mjs:122-137` ("read through the route is fast enough to poll", p95 < 1000 ms) is replaced, in the same commit, by a count in `herdr_driver_fake.rs`: "each operation runs a fixed number of herdr commands" (the fake records invocations; one case over the ten ops). No timing bar remains.
- Retire with their owners named in the commit body: `store_publish.rs:57` `the_group_hint_is_rewritten` (behaviour removed); `test/runner/herdr-agent.test.mjs` (module removed); the `fixTerminalDir` and `KNOWN_POLICIES` cases of `test/setup/terminal-control-checks.test.mjs` (behaviour removed / owned by the core's floor case); `client-route.test.mjs:72-120` cases and `group-queue.test.mjs:95-128` **only after** the lead re-proves each owner the simplicity seat named (`herdr_driver_fake.rs:390-423,161-172`, `core_failures.rs:409-423,448-484`, `route.rs:364-378`, `group-queue.test.mjs:40-70`) by a mutation check; `client-route.test.mjs:47` stays the one wiring proof. `core_failures.rs:246-262` ⊂ `:105-125` and `:384-406` = `:313-335` retire only with the same re-proof.
- Kept on purpose: `herdr_driver_live.rs`; `herdrSpawnAdapter`; `pane-owned.sh`.

## Files

**Modify**: `packages/terminal-control/rust/src/{core.rs,store.rs,record.rs,route.rs,port.rs,driver/mod.rs,driver/herdr.rs,policy/mod.rs}`, `packages/terminal-control/rust/Cargo.toml` (none expected; `fgos-process` already a dependency), `packages/terminal-control/contracts/{terminal-control.port.v1.json,driver-capabilities.v1.json,placement-policy.v1.json,allocation-record.v1.json}`, `packages/terminal-control/rust/tests/{core_failures.rs,core_rules.rs,herdr_driver_fake.rs,herdr_driver_fixtures.rs,store_publish.rs,policy_fixtures.rs}`, `src/terminal-control/{client.mjs,config.mjs}`, `src/setup/terminal-control-checks.mjs` (E-14/E-15 parts only; rows unchanged until phase 7), `src/setup/registrations.mjs` (the `terminal-dir` line only), `src/runner/dispatch/{herdr-round.mjs (import line),visibility-session.mjs,provider-account-probe.mjs (conditional)}`, tests `test/terminal-control/{client-route,group-queue,contracts}.test.mjs`, `test/setup/terminal-control-checks.test.mjs`, `test/runner/dispatch-visibility-session.test.mjs`. **Delete**: `src/runner/dispatch/herdr-agent.mjs`, `test/runner/herdr-agent.test.mjs`, the dead fixtures, the code named above. **Tests to retire**: as listed, each with its owner or "behaviour removed".

## Steps

<!-- Updated: Red Team 2026-10-23 - split for one-lead size -->
Two leads, one after the other: **06A** (Rust core and contracts: CF10, CF03, CF04, CF02, E-26, F-8, the core half of E-14, D6) on `harden/t2-p06a-terminal-core`, then **06B** (Node: the Node half of E-14, E-13, E-15, E-16, and the Node test retirements) on `harden/t2-p06b-terminal-node`, after 06A merged.

1. Branch from the track branch after phase 1 merged.
2. Commits: CF10 (`fix(terminal-control): herdr commands inherit no caller descriptor and are awaited with a deadline`); CF03; CF04; CF02 (`fix(terminal-control): the allocation scan reports and never closes`); E-26 dead surface; F-8 contracts; E-14 core rules + `capabilities` fields + Node `config.mjs`; E-13 client; E-15; E-16; D6 test swap.
3. T5 input (D-T2-7 rules) on the board and in the parent ledger the same turn.
4. Report: Δ lines, test-cost line, `client.mjs`/`config.mjs` line counts, the folds "not paid".

## Verification (exact)

```sh
export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/t2-p06-target
cargo test -p fgos-terminal-control
cargo test -p fgos-run-supervisor     # in-process terminal callers
cargo clippy -p fgos-terminal-control --all-targets -- -D warnings
```

Node (one-file command): `test/terminal-control/client-route.test.mjs test/terminal-control/group-queue.test.mjs test/terminal-control/contracts.test.mjs test/setup/terminal-control-checks.test.mjs test/runner/dispatch-worker-session-boot.test.mjs test/runner/dispatch-visibility-session.test.mjs test/run-supervisor/terminal-groups.test.mjs`.

`wc -l src/terminal-control/client.mjs src/terminal-control/config.mjs` → ≤ 200, ≤ 100. `rg -n "pre_exec|try_wait" packages/terminal-control/rust/src/driver/herdr.rs` → nothing. `rg -n "read_hint|label_tab|KeptUnknown|roleHint|reportState|pane\.resize" packages/terminal-control src` → nothing.

## Net size

Node −150 (client −40, config −45, `fixTerminalDir` −25 (the rest of `terminal-control-checks.mjs` is counted in phase 7 only), herdr-agent −22, visibility −14, registrations −1, probe −4 if proved). Rust −70 (E-26 −120, CF02 −15, CF10 ±0, CF03 +10, CF04 +15, E-14 +40). Tests: floor −70, expected −280 (−200 of it are the client-route/group-queue/checks retirements that need a mutation re-proof; floor counts only herdr-agent test −60, hint test −15, fixtures −30, `fixTerminalDir` cases −15 and +50 new cases).

## Test-cost line

Added 4 (floor refusal, invocation count, CF02/CF03 extensions from phase 1); retired ≈ 15 cases + 1 file + 4 fixtures; host spawns in the suite drop by the retired `client-route` cases (≈ 200 host spawns of the p95 case alone).

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A sub-floor config that runs today is refused at runtime | L × M | Doctor already fails it; named refusal; guide checks `terminal-config` before activation (phase 17); CHANGELOG |
| Users with a positive `retainFailedPaneMs` lose the doctor-driven close | L × L | D-T2-6, CHANGELOG, spec §9/§15 (phase 9); unresolved question for the owner |
| CF04 turns a transient fsync error into a refused allocate | L × M | Answer is `unknown` with the installed fact; the supervisor's existing unknown handling applies; one case |
| `spawn_with_fds` changes stdio or env handling of herdr children | L × M | `herdr_driver_fake.rs` argv/env cases stay the owners; fd-2048 case |
| A descriptor opened without close-on-exec by another thread during the spawn reaches herdr | L × M | Named residual of the Process door (`control.rs:86-90`); fgOS opens descriptors close-on-exec; input to the Process owner |
| Retiring Node route cases loses a behaviour only Node saw | M × M | Mutation re-proof before each retirement; `:47` wiring stays |
| `herdr-round.mjs` import edit collides with T5/SEAT work | L × L | One line; board note |

## Rollback

Revert per commit. On-disk: the group hint file is no longer written (old release writes, never reads it); allocation records unchanged.

## Done when

Phase 1's CF02, CF03, CF04, CF10 tests green; the greps clean; budgets met; T5 told of D-T2-7; report linked.
