# S6a close (phase 22 part a)

Branch `s6/p22`, rebased onto `origin/main` (last at 49dc48a0e); canary built from `a1d4ee029` (the branch head on `9a8788892`; the later review fixes are docs, door rows and the shared terminal reader, proven by the gates below). Lead: lead:S6A. Owner decision B (2026-11-22 18:23): S6a closes at the
execution door; the dead Node closure is backlog p-24xw2cwdvo.

## 1. Doors rows

Enumerated with `rg` over the door roots (comments and Rust test code excluded by the check itself), then each row's
seeded caught and passed cases in `test/architecture.test.mjs`.

| Row | Change | Allowed (enumerated hits) |
|---|---|---|
| run a unit | new | engine `unit_run/**`, `unit_run_host/host.rs` (the one engine call), `run.rs`, `execution_routes.rs`, `dispatch_subs/probes.rs` (probe-session runs one Unit) |
| case admission crosses the process boundary only through the peer protocol | new, retiredBy S6b | engine `unit_run/peer.rs`, `run.rs`, `execution_routes.rs`, `src/native/execution-door.mjs`, `src/workflow/admission-peer.mjs` |
| Execution's Node seam | new, retiredBy "S6b for the Workflow callers, S7 for the Work callers; ..." | `execution-door.mjs` + 50 importers, each with its owner step (25 Workflow S6b, 13 Work/Node payload S7, 5 session-host facades plan 261122-0118 tail, bind facade, 3 doctor-bridge rows, 2 dead files p-24xw2cwdvo) |
| the Node addon never links the Execution engine | extended | the Cargo guard now walks the addon's whole path-dependency closure (`no crate the Node addon links, directly or through another crate, is the Execution engine`); `cargo tree -p fgos-node-addon -e normal` shows no `fgos-execution-engine` (0 lines) |
| person's agent config writes | S6a part done; retiredBy S7 (help text debt) | unchanged |
| agent definition tier directories | S6a part done; retiredBy S7 (agent-definitions.mjs importers) | unchanged |
| tool lookup by capability | job renamed to the Rust owner; retiredBy p-24xw2cwdvo (dead twin) | unchanged |
| the Node bind facade has only its named callers | dead callers -> p-24xw2cwdvo, head start -> S7; retiredBy names p-24xw2cwdvo, S6b, S7 | unchanged |
| derive executor facts / decide a dispatch / execution doctor judgments | retiredBy p-24xw2cwdvo (every remaining Node twin is dead or reached only by the mailbox live scripts) | unchanged |
| list run directories (twin) / process facts: read /proc | retiredBy names p-24xw2cwdvo for the dead Node copies; the Rust twins move onto `fgos-execution` `assignment_layout.rs` | unchanged |
| Node callers reach Execution only through its seam, never into the Node Execution closure | new (review), retiredBy p-24xw2cwdvo | the two closure dirs, head-start, head-request, head-stop, rotate, seat-binding-checks, blind-steps-proven-pools, loop.mjs, `src/workflow/definition.mjs`, `domains/coding/harness/enrich-and-validate-contract.mjs`, two mailbox scripts |

Rows closed outright: none — every S6a row's remaining entries are dead Node files kept by option B or live owners of
another step. Parity tables `test/rust-host/parity-cases/**`: none on main (nothing to delete). `test/golden-recorders/`
left (option B).

Patterns widened after review: "run a unit" also catches `export const runUnit =` and `export { runUnit }`; the
admission row also catches a spawn of `admission-peer.mjs` and a generic `impl<T> CaseAdmission for`.

Doctor registry: no `bridge:S6a` owner was left on main; 19 layers no row read were dropped, the judges of
`runner-patterns-config`, `seat-binding-dry-bind` and `blind-steps-use-proven-pools` now name what their bodies read,
and the three remaining layers are labelled S6b. `test/architecture.test.mjs` now fails on a layer no row reads, a
layer labelled S6a, and a `bridge:S6a` owner.

## 2. Reverse-read check (base release reads Rust-written records)

Base release: `sha256:f032b2c70f91...` (the main checkout's `previousArtifactDigest`; its payload still carries the Node
`src/runner/execution/run.mjs` and `src/verbs/dispatch/show-run.mjs`). The phases recorded no committed reverse-read
fixture files, so two sources of Rust-written records were read:

(a) Two unit runs the main checkout's native release `sha256:1e544460...` (no Node run) wrote at 19:10 and 19:13,
copied read-only into a scratch project; (b) the five unit runs the canary wrote (section 3). Each holds the
assignment, run, run result, receipt, envelope, lease (`attempt.lock`, predecessor), provider-capacity selection,
supervisor binding, steps and closed record, and the private-home and provisioning records under `protected/`.

| Record | `fgos dispatch inspect --assignment` (base) | `fgos dispatch show-run` (base) |
|---|---|---|
| (a) unit-run-1795349581716-a575c98d/producer/1 | exit 0, resolved, attempt closed, unit completed, phase settled, reconciliation not-needed | exit 0, settled true, closed, completed, executor gemini, cli-spawn, bwrap |
| (a) unit-run-1795348103496-30a9d112/producer/1 | exit 0, resolved, closed, completed | exit 0, settled true, run contract assignment-run.v2, executor gemini |
| (b) canary read-only run, herdr attempt (failed, see 3) | exit 0, resolved, closed, failed, settled | exit 0, settled true, closed, failed, claude |
| (b) canary read-only run | exit 0, resolved, closed, completed, settled | exit 0, settled true, closed, completed, claude |
| (b) canary writing run | exit 0, resolved, closed, completed, settled | exit 0, settled true, closed, completed, claude |
| (b) canary workflow case step | exit 0, resolved, closed, completed, settled | exit 0, settled true, closed, completed, gemini |
| (b) canary Work operation step | exit 0, resolved, closed, completed, settled | exit 0, settled true, closed, completed, gemini |

## 3. Canary

Scratch full clone under `forgent-worktrees` (its own `.fgos`, origin re-pointed to a scratch bare repository so no
push or fetch could reach the main checkout), nothing in flight. Candidate built with `cargo build --locked --release
--workspace` and `node scripts/build-rust-distribution.mjs`: `sha256:129e501acbb6...`. Base activated first with
`fgctl init --from <base> --override-pin`, then `fgctl upgrade --from <candidate>` (activation ready,
previous = base).

| Step | Command | Result |
|---|---|---|
| read-only run | `fgos run "<probe>" --provider claude --json` | first try in a herdr pane: `execution-failure` (infrastructure), the claude CLI stopped at its folder-trust screen for the new clone path (environment, not the release); outside herdr: `unit-run-1795352247596-ae5962fe` pass, invocation `claude-cli-bwrap`, exit 0 |
| writing run | `fgos worktree create <wt> --branch canary-write`, `fgos run "<create canary-probe.txt>" --provider claude --writes canary-probe.txt --worktree <wt> --json` | `unit-run-1795352274258-50149fae` pass, runner commit `49736b6ab` with only `canary-probe.txt`, exit 0 (the admission peer served the writing run) |
| workflow case step | `fgos workflow start --units <one read-only unit> --foreground --json` | `wf-run-1795352311003-bad559fe`, unit `unit-run-1795352311133-fd399da1` pass (gemini, `agy-cli-bwrap`), step done, exit 0 |
| Work operation step | `fgos add tsk-canary1 ...`, `fgos discover tsk-canary1 --verdict clear --verify true`, `fgos plan tsk-canary1` | validate-plan ran as `unit-run-1795352369596-36ba4e84` through `runUnitInHost` (settled, completed); the validator answered not READY for the empty probe item (`validate-plan-insufficient-evidence`), Work did not advance: the expected verdict |
| doctor | `fgos doctor --json` | 100 ok, 9 warn, 8 fail; every fail is the scratch clone's environment (skills not installed, hook path, a missing tool, a stale item step, provider quarantines, folder trust, the timers the canary disabled) |
| credential renewal | not run | renewal reads and writes the owner's real login stores (`runner.llmAccounts`); no account was due and no isolated login exists, so it could not run without touching the owner's accounts |
| reactivate base | `fgctl repair` | activation back to `sha256:f032b2c7...`; the base read every canary record (section 2) |

Side effects found and cleaned: `fgctl init`/`repair` run `fgos doctor --fix`, which installs per-project systemd
user timers (watcher, mailbox sync) for the clone; the watcher woke a supervisor head in the clone three times
(each cancelled within seconds, no agent work). The timers and their unit files were removed, the processes stopped,
the clone, the worktree, the bare repository and the build tree deleted. The candidate stays staged in the machine
release store (`sha256:129e501a...`, 73 MB).

## 4. Plan acceptance

| # | Check | Output |
|---|---|---|
| 1 | command-routes check (V21) | exit 0; `run native`, `dispatch native`, `worktree native`, `resync-worktree native` |
| 2 | the five paths gone | `src/verbs/dispatch` and `src/runner/dispatch.mjs` gone; `src/runner/execution` (23 .mjs), `src/runner/dispatch` (54), `src/run-supervisor` (12) still exist: partly met by owner decision B, the dead closure is backlog p-24xw2cwdvo; production callers reach Execution only through `src/native/execution-door.mjs` (door rows "Execution's Node seam" and the closure-bypass row) |
| 3 | worktree door | acceptance 3 of plan 261118-1455-s6a-worktree-door (landed) |
| 4 | no S6a retiredBy, no `bridge:S6a` | manifest check exit 0; `rg '"bridge:S6a"' doctor-registry` finds nothing (exit 1) |
| 5 | `npm test`, `cargo test --workspace` | full `node scripts/run-tests.mjs` before the rebase: 7877 tests, 8 fails, all known reds (migrate drift x2, decisions-corpus x2, rul11 anchor, terminal-groups title, guide-schema x2); `cargo test -p fgos` after the rebase: 804 passed, 0 failed. `cargo test --workspace` and the full suite on the integration head are the lead's integration gate. `cargo clippy -p fgos -D warnings` is red on main in `packages/execution/engine/src/credentials/renew.rs:370,426` (plan 261122-0118's land), not in this branch; `--no-deps` clippy of `fgos` is clean |
| 6 | `fgos run` argv unchanged | no flag added in this phase; the canary runs used the existing argv |
| 7 | architecture test with the new rows | `test/architecture.test.mjs` 87/87 pass |
| 8 | one-door scan | `node scripts/git-one-door-scan.mjs --root .`: 0 undeclared (base 0) |
| 9 | canary and reverse-read tables | sections 2 and 3; credential renewal not run (reason above) |
