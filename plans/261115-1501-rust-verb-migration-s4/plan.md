---
title: "Rust verb migration S4 (packaging: retire setup; wire-agents, uninstall, init, doctor native)"
description: "Retire fgos setup and move wire-agents, uninstall, init and doctor onto the Rust host with one doctor registry, one packaging layer in Rust and one bounded Node rows bridge for the layers S5-S7 still own."
status: pending
priority: P1
effort: 27.5d
branch: cook/s4-plan
tags: [refactor, infra, host, rust, migration, packaging, doctor]
blockedBy: []
blocks: []
created: 2026-11-15
---

# Rust verb migration S4: packaging

Detailed plan for step S4 of the program
[`plans/261114-2051-rust-verb-migration-program/plan.md`](../261114-2051-rust-verb-migration-program/plan.md)
(row S4; Outcome, One-door guard, Order; owner questions Q2 and Q3, refined below). S2 and S3 landed on `main`
(S3 as `5723d8453`, plan close `445e65679`); every `file:line` below was read on `origin/main` `445e65679` unless a
phase-00 fact (`F<n>`) says it is still open. Shape copied from the S2+S3 plan: a facts phase first, file-disjoint
phases with a parallel map, a `doors` row as every port's exit, the Node path and its tests deleted in the same
change, parity against the base release, one close phase with docs. Reused, not rebuilt: the config crate's doctor
rows contract (`d2902fa0c`), the F0 parity harness and the S3 runner, the host's categorised refusal and fault
record (S2/S3 phase 01), `legacy_exec.rs`'s payload resolution, the Git, Event Store, Identity, Holder-lock, Mailbox
and Config crates' existing readiness functions, `pin_drift`, `shim.rs`, RepositoryConfig.

## Outcome

`fgos setup` is gone. `fgos wire-agents`, `fgos uninstall`, `fgos init` and `fgos doctor` run in the Rust host. The
packaging layer they share (the agent hook table for five CLIs, the person's agent-config readers, the project
launcher, managed timers, the skill generated-stamp reader, the coexistence manifest) has one Rust owner in
`fgos-distribution`. `fgos doctor` has **one registry** (a contract file listing every row in order with its owner)
and one runner in Rust; each row whose judged layer already has a Rust owner is judged in process by that owner;
the rows of layers that S5-S7 still own in Node are judged by **one bounded Node rows bridge**, an exact-set list in
the registry naming each bridged row with the step that removes it; the same bridge carries `init`'s one Work-store
step until S7 (Q3, answered (a)).

Non-goals (program): no new verb, flag or behaviour (RUL104); no dual-run of a write (migration doc §11,
`docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md:367-382`); no change to the `fgos.v1`
envelope, the exit-code table or the doctor report shape (`data.{ok,next,fixed?,checks[]}`, contract §3,
`docs/platform/packaging-distribution/contracts/setup-doctor-registry.md:49-63`), which `fgctl init`'s closing block
(`packages/distribution/rust/src/init.rs:665`, `:803`) and the external-consumer proofs
(`scripts/ci-external-consumer.sh`, `.ps1`) parse; no on-disk format change an older release could not read; no
Windows-without-Node commitment unless Q2 is answered (a).

Accepted behaviour changes (decided here; each phase that makes one writes its proposed `## [Unreleased]` line;
the step lead writes `CHANGELOG.md` at landing):
- `fgos setup` is retired and answers "unknown verb" like any other unknown verb (precedent: `preflight`,
  `987d6918b`). With it go the shell-rc source line it wrote, the retired runner-config conversion it ran, its copy
  of the release's skills into a project, and the doctor row `shell-integration-sourced` (backlog `p-bkmh4egqlv`,
  `p-tgqxcemygh`; `p-wheblpunzi` becomes moot). `fgctl init` never ran `setup`
  (`init.rs:846-887`), so the supported onboarding path loses nothing (phase 11).
- A malformed call of a ported verb (unknown flag, missing or unknown sub-command, a refused root) is recorded in
  the invocation-fault log and refused with the host's text and the Node category, as S2/S3 did for theirs.
- `fgos doctor` in a project starts one Node child for its bridged rows (until S7); contract §3's "starts no child
  process" is restated as "starts no lifecycle child and writes nothing" (doctor already spawns `git`, `bwrap`,
  `curl`, `fgctl status`, `fgos mailbox status`, per facts F7). Q3 is answered (a).
- What only `setup` did ends with it: see "Decided and reported" V1-V4 (reported to the owner 2026-11-15, not vetoed, they stand).
- Whatever Q2 decides about `requires.node`.

## Decisions taken in this plan (evidence in the phase named)

| # | Decision | Why | Phase |
|---|---|---|---|
| D1 | Parity compares the host with the step's **base release**: entry A `node:<base>/bin/fgos.mjs` plus the staged env, entry B the host; runner and tables live only on the integration branch and are deleted by the close | S2/S3 D1 and its phase-00 decision (c): 0.34 s a case against 2.7 s through the staged host; after a flip Node refuses the verb | 00, every port, 12 |
| D2 | **One doctor registry**: `packages/distribution/contracts/doctor-registry.v1.json` lists every row and fix in run order with `id`, `description`, `owner` (`rust:<component>` or `bridge:<S5|S6a|S6b|S7>`), `fixes`/`repairs`, `pointer`; config's 15 rows stay in `packages/config/contracts/doctor-rows.v1.json` and are referenced as one group entry at their position. Node keeps only the **bodies** of bridged rows, keyed by id; an exact-set test pins Node's bridged ids to the registry's | one source of truth for ids, order and descriptions (design principle 7); the config crate's contract (`d2902fa0c`) is the existing shape, reused | 03 |
| D3 | Doctor engine (status derivation, `ok`/`next`, fix sequencing, `--strict`, the JSON envelope and the `--pretty` render; there is no other text form, `bin/fgos.mjs:3912-3926`) lives in `fgos-distribution::doctor` (packaging owns contract §3); row adapters live in the host, one file per component group under `apps/fgos/src/wiring/doctor/`, each calling its component crate's public function; `fgctl`'s closing block reads the report through the same Rust type, which is lenient (every field optional, unknown fields ignored), because a global `fgctl` reads the doctor of whatever release a project pins | hexagonal: the engine knows a row port, the host links every crate (`apps/fgos/Cargo.toml` already depends on all of them); one shape for writer and reader; `init.rs:665-680, 803-821` read untyped values today, so a strict type would turn older pins into "not a doctor result" | 03 |
| D4 | **Row move rule, checked by a test**: a row is judged in Rust in S4 only if every fact its judge reads has a Rust owner today or is S4's own packaging layer; otherwise it is bridged with the highest Node step among its imports (tier from `docs/architecture-manifest.json` `tiers`). The registry records each bridged row's judge module; an architecture test computes that module's import closure and fails when the label is not its highest step or when the closure has no Node-only layer left (the row must move). A `doors` row bans Node and legacy-verb spawns in `apps/fgos/src/wiring/doctor/**` and `apps/fgos/src/wiring/init.rs` (only `bridge.rs` starts Node). No `bridge:S4` label survives the close | the program's rule ("doctor and init never call back into Node for a layer that already moved") holds by test, not by a reviewer reading a table; `seat-binding-dry-bind` imports `bind()` (`src/setup/seat-binding-checks.mjs:3`, S5) and stays bridged even though a seat-binding crate exists | 00, 03, 12 |
| D5 | **The Node rows bridge** is one Node module in the legacy payload, `src/setup/doctor-bridge.mjs`, which the host runs as `node <components.legacyNode.root>/src/setup/doctor-bridge.mjs` through the spawn path `legacy_exec.rs` already owns (`resolve_payload_path`, 69; the recursion guard, 35-46, 249); it is no verb, no route and no `fgos internal` route (that namespace is the host's own routes for the payload, `apps/fgos/src/main.rs:137-144`). Two operations: `rows` (the listed fix ids, then the listed check ids; typed result contract `packages/distribution/contracts/doctor-bridge.v1.json` on stdout, never `fgos.v1`) and `work-store-init` (init's Work step). Fixes run in exact registry order, never reordered; each run of consecutive bridged fixes is one bridge call, and all bridged checks are one call (on `445e65679` the fix order alternates owners, so expect about three fix segments; 00 F9 counts them). The spawn is one function shared with `execute_legacy_cli` (environment, payload resolution, signal forwarding); the child gets a fresh recursion guard, and a guard inherited by the host does not stop it (the bridge is a bounded child, not a legacy route); a deadline from 00's per-row timings kills its process tree; a body's stdout is routed to stderr and the bridge prints one JSON line per result, so a crash keeps the results of fixes already run; it writes no fault or lifecycle record. When Node is missing, the bridge fails or times out, each bridged row becomes `fail` with the cause, `fix: null`, and `next` gets one entry naming the cause; the doctor still answers and exits as today. Deleted with its last row (S7) | the bridge the program's Q3 (a) names (migration doc §7 item 4, `node-to-rust-migration.md:294-297`: a real per-operation semantic bridge, never parsed CLI output); the payload is found only through the manifest fields (AGENTS.md "Legacy-Node CLI Ownership Boundary"); a crash of one layer never hides the other rows | 03, 10 |
| D6 | The packaging layer moves whole into `fgos-distribution`: `agent_hooks.rs` (render, check and remove the hooks of Claude Code, Codex, agy, omp, pi; the delete-guard prefilter rendered from a data file), `agent_config.rs` (the person's agent-config readers and the `wire-agents` plan: plugin marketplace, agy permissions and sub-homes, mailbox accept), `launcher.rs` (the `fgos` launcher beside `fgctl`, beside existing `shim.rs`), `timer.rs` (managed systemd/launchd timers), `rc_lines.rs` (read-only shell-rc detection for uninstall), `coexistence.rs`, `skill_stamp.rs` (reader of the render's anchored stamp) | doctor fixes, `uninstall`, `wire-agents` and `init` all use these modules (scout of `src/setup/registrations.mjs:29-59`, `uninstall-project.mjs:20-25`); moving only some verbs would leave a twin, or make the Node doctor reach these modules through host routes until S7 (Q3 (b)) | 01, 02 |
| D7 | `fgos setup` answers "unknown verb" (as `preflight`, `987d6918b`); the contract §4 condition (the 30-day preview fallback window, `setup-doctor-registry.md:143`) ended 2026-10-18 (`docs/platform/packaging-distribution/spec.md:57`) and the owner-approved program puts the retirement in S4 | the gate the contract names is met; the program row is the authorization | 11 |
| D8 | Uninstall keeps today's two rules (`src/setup/skill-wrappers.mjs:752-778`): a directory is fgOS's when it carries the render's anchored stamp (772); an unstamped directory with an owned name is reported as foreign and kept (773). The stamp's shape and the owned-name rule (`ownedSkillNames`: `core/skills` and `domains/*/skills` of the running payload, plus `_shared`) get one contract with vectors, `skill-stamp.v1.json`, read by the Node render's tests (the writer) and by `skill_stamp.rs` (the reader); the two implementations of the naming rule are a declared twin in the `doors` row, `retiredBy` "the render moves to Rust" (no step owns that: the render is repository tooling) | uninstall's `skills.foreign` answer needs the owned names (F12); the render stays Node, so its rule is read, not copied, through one vector file, the F0 twin pattern | 02, 09 |
| D9 | The delete-guard prefilter keyword list becomes data (`packages/distribution/contracts/delete-guard-prefilter.v1.json`), rendered by `agent_hooks.rs` and read by the Node guard's test (`test/git/main-checkout-delete-guard.test.mjs:8`) until S1 moves the guard | the guard's test runs each refusal through the prefilter; one list, two readers, no twin | 01 |
| D10 | Init is a host module `apps/fgos/src/wiring/init.rs` composing, in Node's order and fail-safe rules (`src/verbs/state/init.mjs:43-90`): machine id (`fgos-identity`), legacy config settle (`fgos-config` migrate in process, replacing Node's `invokeHost` hop, `src/verbs/state/settle-legacy-config.mjs:14`), Event Store lock dirs, the Work-store step (bridge, Linux only), coexistence manifest, config files, HEAD probe and Git recovery (`fgos-git` `incidents.rs`); same `data` keys | the only tier-7 call is `initStore` = `rebuild` (`src/state/store.mjs:62-64, 1985-1989`); everything else already has a Rust owner | 10 |
| D11 | A verb answer that prints its envelope and still exits non-zero (`doctor --strict`, `wire-agents`/`uninstall` with `failed[]`, `src/cli/verb-exit.mjs:10-14`) uses one host answer type carrying `data` and `exit`; `config check` (`apps/fgos/src/cli_presenter.rs:257-260`, `packages/config/rust/src/provider.rs`) moves onto it, so the three ported verbs add no per-verb arm; `MailboxAnswer` (`cli_presenter.rs:109-127`) keeps its own path because it also prints a warning line | RUL104: the presenter gets simpler, not three downcasts bigger | 03 |
| D12 | `src/git/status.mjs` is deleted when its last callers go (doctor Git rows in 04, `init` in 10; 10 lands after 04 and deletes the file); the `compose Git status and recovery` row's allowed entry goes with it | the row's own `retiredBy` says "S4: init and doctor move to the host, and the client with them" | 04, 10 |
| D13 | `fgctl`'s own root walk (`packages/distribution/rust/src/workspace.rs`) is replaced by the root door in `fgos-git` (`invocation_root.rs`) with a policy for `fgctl` (trusted main checkout, no `--dir`), removing the `resolve the invocation root` row's debt entry, whose reason says it "moves with packaging (S4)" | one root decision for the whole system (owner 2026-11-14, one door is system-wide) | 02 |
| D14 | Node modules of `src/setup/` are deleted by the phase that removes their last import, in the landing order of the "Order and landing" section; the close phase's "retired Node S4 verb code" row catches any survivor | L10 without a cross-phase race | all |
| D15 | Crate edges approved with this plan: `fgos-distribution` -> `fgos-config` (the hook table, the timers, the agy permissions and the mailbox opt-in read config: `src/setup/agent-hooks.mjs:18`, `managed-timer.mjs:18`, `agy-permissions.mjs:25`, `mailbox-limits.mjs:6`; config does not depend on distribution) and `fgos-distribution` -> `fgos-process` (the `systemctl`, `launchctl` and `claude` spawns go through the process door instead of new `Command::new` sites; 00 confirms against the process-control `doors` row). No identity edge: the pi/omp extension's attempt-id prefix travels as data in `agent-hooks.v1.json`, which the identity crate's test reads. The step lead commits `Cargo.lock` alone; any other edge stops the phase | the S2/S3 rule (D10 there); `fgos-distribution` depends today only on `fgos-git`, `fgos-durable-file`, `fgos-host-runtime`, `fgos-holder-lock` (`packages/distribution/rust/Cargo.toml`) | 01, 02 |
| D16 | S4 lands on `main` as one series after phase 12; the state "doctor native with every row bridged" (after 03, before 04-07) exists only on the integration branch, which merges `main` at least weekly and reruns the exact-set tests | the program's rule: nothing of a step reaches `main` alone; a 27-day branch next to WORK, MAIL and S1 edits must not drift | landing |
| D17 | "Is the hooks path wired to the project's `.githooks`" is answered by `fgos-git`'s RepositoryConfig report (a `wired` field), read by the Rust doctor row, by `uninstall` and by `scripts/install-git-hooks.mjs` through the Node client; `git-hooks.mjs`'s own `wired()` (16-22) goes | one answer instead of a Node judgment and a Rust copy | 04, 09 |
| D18 | Shell-rc detection has one Rust owner, `rc_lines.rs`; the Node `detectRcFiles` stays only for the repository's session-start hook (`scripts/fgos-session-start-hook.mjs:13`, wired in `.claude/settings.json:162`), as declared debt with `retiredBy` "S7: the Node payload retires" (the hook prints the rc file names as context). Matching an rc line needs the path of the payload's `scripts/fgos-shell-integration.sh` (`integrationScriptPath`, `registrations.mjs:356`): Rust takes it from `components.legacyNode.root`, and the script keeps shipping because existing rc lines source it | one rule; the hook is repository tooling that swallows errors (33-37), so deleting its import would break it silently | 02, 09, 11 |

## Phase-lead rules (every phase)

- Repo `/home/vantt/projects/forgent` on fg-server2. Read `AGENTS.md`, `docs/reading-map.md`, this plan, then the phase file.
- Branch `rust-verb-migration-program/s4-pNN`, cut from the integration branch `rust-verb-migration-program/s4`
  (cut from `main` when wave A starts). Worktree `/home/vantt/projects/forgent-worktrees/rvm-s4-pNN`, created with
  `/usr/bin/git worktree add -b <branch> <path> <base>`; assert the path is in `git worktree list` before any
  destructive step.
- `export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/rvm-s4-pNN-target` (ext4, never `/tmp`); delete it
  when the phase lands. The parity base build uses its own target `rvm-s4-base-target`, never a phase's.
- Tests: `node scripts/run-tests.mjs <files>` (focused). Ask the step lead before `npm test` or `cargo test --workspace`.
  Run every test that imports or reads a file you change (`rg -l <symbol|file> test apps packages`).
- No plan ids, phase numbers or finding codes in code, test names or commits. No env switch or test-only branch.
- Before each commit `/usr/bin/git diff --cached --stat`; explain any large deletion; stage explicit paths; never `git stash`.
- Push at least every 30 minutes. Never push to `main`. Do not edit `CHANGELOG.md` or `Cargo.lock`.
- Every Rust change: `cargo fmt --all`, then regenerate the census (`node scripts/git-one-door-scan.mjs --root . --write-census`), never hand-merge it.
- Report path: `fgos convention path --kind report --type phase --slug s4-pNN-<slug> --plan 261115-1501-rust-verb-migration-s4 --json`
  (from the main checkout). End with `Status / Summary / Concerns`, the proposed `## [Unreleased]` line, and the
  table "retired test -> owner now".

## Port recipe (every verb phase and every doctor-row phase)

1. **Rust owner.** The judgment or use case moves into the module that owns the job (named per phase), with unit
   tests at the lowest layer. A doctor row's adapter calls its component's public function; it never re-derives a fact.
2. **Host wiring (verbs).** One operation descriptor in `packages/host-runtime/rust/src/catalog.rs` (`CATALOG`, line
   17; count assertion line 369, today 31); the provider in `apps/fgos/src/main.rs` (`COMPOSITION_PROVIDERS` 103,
   registration block 245-333); a projector arm in `apps/fgos/src/cli_projector.rs` (`project_cli_invocation` 37)
   reading only `fgos_host_runtime::cli_args`; the sub-command line in `routing.rs` `NATIVE_SUBCOMMANDS` (79) when the
   verb has sub-commands; the annotation in `packages/host-runtime/contracts/command-route-annotations.json`;
   `native: true` in `src/cli/command-registry.mjs`; regenerate `command-routes.json` and `command-manifest.json`
   (`node scripts/export-command-selectors.mjs`). Refusals use the categorised refusal with Node's category and text;
   an unknown flag gets Node's exact text from the annotation's flag list (S2/S3 decision (f)).
   **Doctor rows:** the row's `owner` in the registry flips from `bridge:*` to `rust:<component>`; its adapter file
   registers the row function; the Node body and its registration are deleted.
3. **Parity.** The verb's table `test/rust-host/parity-cases/<verb>.cases.mjs` (every refusal of the arm included,
   00 F-list) runs green against the base release before the Node code is deleted; doctor rows are compared per row
   (`id`, `status`, `passed`, `fix`, and `message` bytes except rows 00 marks volatile) on the 00 fixture set.
4. **Delete in the same phase:** the `bin/fgos.mjs` arm and imports no other arm uses (and their
   `ARM_STATIC_IMPORTS` lines, `test/architecture.test.mjs:1660-1729`), the Node use case or row bodies, their
   `files` entries in `docs/architecture-manifest.json`, their `EXIT_OF` entries (`src/cli/verb-exit.mjs`), and every
   Node test whose behaviour now has a Rust owner (rows of deleted files leave `test/suite-baseline.json`; tests or
   docs naming a deleted test as owner are updated).
5. **Exit:** the phase's `doors` row(s) pass with a negative case in the report; its retired names are listed for the
   close's "retired Node S4 verb code" row; no entry is added to the `parse CLI arguments (twin)` row's debt; a ported
   verb never joins `LENIENT_ROOT_VERBS` (`routing.rs:99`, exact-set test).

## Order and landing

```text
00 facts ──────────────────────────────┐ (report before any flip lands)
01 agent wiring modules ──┐            │
02 machine services ──────┼────────────┤
03 doctor engine + registry + bridge (host doctor flips, every row bridged)
   └─> 04 git+ES rows | 05 config+identity+observe rows | 06 holder-lock+terminal+mailbox rows (needs 02)
       07 packaging rows (needs 01, 02) | 08 wire-agents (01, 02) | 09 uninstall (01, 02) | 10 init (02, 03)
11 retire setup (needs 00 only) ──────────────────────────────────────────────┐
                                                                               └─> 12 close ─> S4 lands on main
```

- Landing order inside the integration branch (fast-forward only): 01 and 02 (any order; they flip nothing), 03 (after
  00's report); then 04, 05, 06, 08, 09, 11, 10 (after 04, D12), 07 last (it removes the last imports of most
  `src/setup` packaging modules, D14). The branch merges `main` at least weekly (D16).
- Each phase report names its `## [Unreleased]` line; the step lead writes them at landing.

## Phases

| # | Phase | Wave | Blocked by | Effort | Q3 (answered a) | File |
|---|---|---|---|---|---|---|
| 00 | Facts, row ownership table, parity cases, baselines | A | - | 1.5d | any | [phase-00-facts-and-baselines.md](phase-00-facts-and-baselines.md) |
| 01 | Agent wiring modules in Rust: hook table, agent-config readers and plan, launcher | A | - | 3.5d | (a), (b) | [phase-01-agent-wiring-modules.md](phase-01-agent-wiring-modules.md) |
| 02 | Machine services in Rust: timers, rc lines, coexistence, skill stamp; `fgctl` root through the root door | A | - | 2.5d | (a), (b) | [phase-02-machine-services-and-fgctl-root.md](phase-02-machine-services-and-fgctl-root.md) |
| 03 | Doctor engine, one registry, Node rows bridge; host `doctor` flips with every row bridged | A | 00 report before landing | 3.5d | (a) | [phase-03-doctor-engine-registry-bridge.md](phase-03-doctor-engine-registry-bridge.md) |
| 04 | Git and Event Store rows in Rust | B | 03 | 2d | (a) | [phase-04-git-event-store-rows.md](phase-04-git-event-store-rows.md) |
| 05 | Config, Identity and Observe rows in Rust | B | 03 | 2d | (a) | [phase-05-config-identity-observe-rows.md](phase-05-config-identity-observe-rows.md) |
| 06 | Holder-lock, Terminal-control and Mailbox rows in Rust | B | 02, 03 | 2d | (a) | [phase-06-holder-lock-terminal-mailbox-rows.md](phase-06-holder-lock-terminal-mailbox-rows.md) |
| 07 | Packaging rows in Rust: install, activation, hook wiring, agent-config reports | B | 01, 02, 03 | 2.5d | (a) | [phase-07-packaging-rows.md](phase-07-packaging-rows.md) |
| 08 | `wire-agents` native | B | 00, 01, 02 | 1.5d | (a), (b) | [phase-08-wire-agents.md](phase-08-wire-agents.md) |
| 09 | `uninstall` native | B | 00, 01, 02 | 2d | (a), (b) | [phase-09-uninstall.md](phase-09-uninstall.md) |
| 10 | `init` native (Work step through the bridge) | B | 02, 03; lands after 04 | 2d | (a) | [phase-10-init.md](phase-10-init.md) |
| 11 | Retire `setup` | B | 00 | 1d | any | [phase-11-retire-setup.md](phase-11-retire-setup.md) |
| 12 | Close: docs, proof consolidation, parity re-run, retired-code row, gates | C | all | 1.5d | any | [phase-12-close.md](phase-12-close.md) |

Critical path: 03 (3.5, its flip waits for 00's report at day 1.5) -> 07 (2.5; 01 is done by day 3.5) -> 12 (1.5):
about 7.5 lead-days; next longest 01 (3.5) -> 09 (2) -> 12 = 7. Total work about 27.5 lead-days. Q3 (b) would have made the
plan 00, 01, 02, 08, 09, 11, 12 plus one 1.5-day phase in which doctor's packaging rows and fixes reach the Rust
modules through `fgos internal` host routes (about 15 days); Q3 (c) would have been 00, 11, 12 (about 4 days) and the
program's S7 row gains the four verbs.

### Parallel map

```text
Wave A: [00 facts] [01 agent wiring modules] [02 machine services + fgctl root] [03 engine + registry + bridge]
        (all start together; 03 lands only after 00's report; 01 and 02 add Rust modules and flip nothing)
Wave B: [04 git+ES] [05 config+identity+observe] [06 lock+terminal+mailbox] [07 packaging rows]
        [08 wire-agents] [09 uninstall] [10 init] [11 retire setup]
        (04-07 and 10 need 03 landed; 06, 07 need 02; 07, 08, 09 need 01; 11 needs only 00)
Wave C: [12 close]
```

### Hot files (one writer at a time, in landing order; generated files are regenerated, never hand-merged)

| File | Writers in order |
|---|---|
| `packages/distribution/rust/src/lib.rs` (module lines) | 01, 02, 03 (additive `mod` lines) |
| `packages/distribution/contracts/doctor-registry.v1.json` | 03 creates; 04, 05, 06, 11, 07 flip their rows' `owner` or delete rows (separate lines) |
| `packages/distribution/rust/src/init.rs` | 02 (the root call, D13), 03 (the closing block reads the shared report type), 07 (`pin_drift` is the row's one reader) |
| `src/setup/checks.mjs`, `src/setup/doctor-bridge.mjs` | 03 (bridge), 04 (`mainCheckoutHookWired` re-export stays), 09 (`integrationScriptPath` and `mainCheckoutHookWired` out), 11, 10 (`work-store-init`) |
| `src/setup/git-hooks.mjs` | 04 (D17: `wired()` reads the RepositoryConfig report), 09 (`uninstallGitHooks`, `mainCheckoutHookWired` out) |
| `src/setup/{shell-rc,skill-wrappers,agent-hooks}.mjs` | `shell-rc`: 09 (uninstall's use out), 11 (insertion out; detection stays, D18); `skill-wrappers`: 02 (reads the stamp contract in its test), 09 (`generatedSkillDirs` out), 11 (`materializeSkillsIntoProject`, `createProjectSkillGuard` out); `agent-hooks`: 01 (prefilter from data), 09 (`uninstallAgentHooks` out), 07 (file out) |
| `apps/fgos/src/wiring/mod.rs`, `apps/fgos/tests/cli_tests.rs` | 03, 08, 09, 10 (one `mod` line or one case each) |
| `packages/distribution/rust/Cargo.toml` (D15 edges) | 01 or 02, whichever lands first; `Cargo.lock` by the step lead |
| `packages/config/rust/src/provider.rs` | 03 (D11) |
| `.github/workflows/{ci.yml,release-assets-check.yml,holder-lock-cross-platform.yml}` | 03 (`ci.yml:91` names `doctor-fresh-run.test.mjs`, which stays), 06 (`holder-lock-cross-platform.yml:16,18` path filters), 07 (`release-assets-check.yml:101, 115` run `curl-check` and `project-launcher` tests) |
| tests shared by phases: `test/setup/agent-wiring.test.mjs` (08, 11), `dir-resolution.test.mjs` (09, 11), `claude-code-hooks.test.mjs` (11, 07), `test/cli/verb-exit.test.mjs` (03, 08, 09), `test/setup/helpers/setup-checks-harness.mjs` (03, 04, 09) | in landing order, separate cases |
| `apps/fgos/src/wiring/doctor/mod.rs` | 03 creates; 04-07 add one `mod` line each; per-group files are owned by one phase each |
| `apps/fgos/src/{main.rs,cli_projector.rs,cli_presenter.rs,routing.rs}`, `packages/host-runtime/rust/src/catalog.rs` | 03 (doctor, D11), 08, 09, 11 (setup's help), 10 |
| `apps/fgos/src/help.rs` | 11 (the two help tests that name `setup`, `help.rs:556-560, 980-996`, move onto `compound`) |
| `packages/host-runtime/contracts/command-route-annotations.json`, `src/cli/command-registry.mjs` | 03, 08, 09, 11, 10 |
| `command-routes.json`, `command-manifest.json`, `test/rust-host/vectors/envelope/version.json` (generated or regenerated) | every flip and 11 regenerate |
| `bin/fgos.mjs` | 03 (doctor arm 3547-3558 out, `ansi.mjs` import 114 kept until 11), 08 (3531-3534), 09 (3519-3527), 11 (3500-3515, renders 3702-3720, the `ansi.mjs` import), 10 (847-850) |
| `src/setup/registrations.mjs` | 03 (descriptions and order out; body map stays), 04, 05, 06, 11 (`shell-integration-sourced`), 07 (row and fix registrations out, separate hunks) |
| `src/cli/verb-exit.mjs` | 03 (doctor), 08, 09 |
| `test/architecture.test.mjs` (`ARM_STATIC_IMPORTS` 1660-1729) | 11 (the `ansi.mjs` line 1697 when setup and doctor arms are gone), any phase whose arm had a static import |
| `docs/architecture-manifest.json` | every phase (its `doors` rows, deleted `files` entries); 12 adds the retired-code row |
| `test/suite-baseline.json` | every phase that deletes a test file removes its row(s) |
| `test/rust-host/verb-parity.test.mjs` (integration branch only, never on `main`) | the step lead adds it as the first commit of the integration branch (S3's runner, deleted by its close, is restored from `92671a21d^`); 03, 08, 09, 10 add their table names; 04-07 extend the doctor table's fixtures; 12 reruns every table and deletes runner and tables |
| `packages/git/contracts/mutation-census.v1.json` (generated) | every phase regenerates its own |

## File set (complete, for the overlap check; 00 re-verifies every path)

Create:
- Rust: `packages/distribution/rust/src/{agent_hooks.rs,agent_config.rs,launcher.rs}` (01),
  `packages/distribution/rust/src/{timer.rs,rc_lines.rs,coexistence.rs,skill_stamp.rs}` (02),
  `packages/distribution/rust/src/doctor.rs` (03), `apps/fgos/src/wiring/doctor/{mod.rs,bridge.rs,packaging.rs}` (03, 07),
  Node `src/setup/doctor-bridge.mjs` (03, the bridge module, deleted at S7),
  `apps/fgos/src/wiring/doctor/{git.rs,event_store.rs}` (04), `{config.rs,identity.rs,observe.rs}` (05),
  `{holder_lock.rs,terminal.rs,mailbox.rs}` (06), `apps/fgos/src/wiring/{wire_agents.rs,uninstall.rs,init.rs}` (08, 09, 10)
- Contracts: `packages/distribution/contracts/{doctor-registry.v1.json,doctor-bridge.v1.json}` (03),
  `packages/distribution/contracts/{delete-guard-prefilter.v1.json,agent-hooks.v1.json}` (01, the hook table rows as
  data with vectors), `packages/distribution/contracts/skill-stamp.v1.json` (02)
- Tests (transitional, never reach `main`): `test/rust-host/verb-parity.test.mjs` (restored from `92671a21d^` by the step lead) and
  `test/rust-host/parity-cases/{doctor,init,uninstall,wire-agents}.cases.mjs` (deleted by 12)
- Reports under `plans/261115-1501-rust-verb-migration-s4/reports/`

Modify:
- Host and kernel: `apps/fgos/src/{main.rs,cli_projector.rs,cli_presenter.rs,routing.rs,help.rs,legacy_exec.rs}`
  (`legacy_exec.rs`: the spawn function the bridge shares, D5), `apps/fgos/src/wiring/mod.rs`, `apps/fgos/tests/cli_tests.rs`,
  `packages/host-runtime/rust/src/{catalog.rs,contracts.rs}`, `packages/config/rust/src/provider.rs` (D11)
- Distribution: `packages/distribution/rust/Cargo.toml` (D15), `packages/distribution/rust/src/{lib.rs,init.rs,uninstall.rs,workspace.rs,shim.rs}` (`init.rs` closing
  block reads the shared report type, D3; `uninstall.rs` unchanged in behaviour; `workspace.rs` through the root door,
  D13), `apps/fgctl/src/{main.rs,help.rs}` (only where `help.rs` names `fgos setup`), `apps/fgctl/tests/*` where they name setup
- Crates whose public readiness function a row needs and 00 finds missing (each named by 00; expected small):
  `packages/{git,event-store,identity,holder-lock,terminal-control,observe,mailbox}/rust/src/*`; `fgos-git`'s
  RepositoryConfig report gains `wired` (D17)
- Contracts: `command-route-annotations.json`, the two generated route files, census, `packages/config/contracts/doctor-rows.v1.json` (only its registry reference, 05)
- Node: `bin/fgos.mjs`, `src/cli/command-registry.mjs`, `src/cli/verb-exit.mjs`, `src/setup/registrations.mjs`,
  `src/setup/{checks,git-hooks,shell-rc,skill-wrappers}.mjs`, the bridged row modules that stay (their imports shrink),
  `scripts/lib/mailbox-live-confined.mjs` (01, F11), `scripts/event-store/forge-probe.sh` (04: it imports
  `fixGitFetchMapping` from `git-checks.mjs`), the MAIL experiment files that list `src/setup/agent-hooks.mjs`
  (`scripts/lib/mailbox-behaviour-v7{e,h,i}.mjs`, `test/scripts/mailbox-behaviour-v7h.test.mjs`; 07, after MAIL answers, collision table)
- CI: `.github/workflows/{ci.yml,release-assets-check.yml,holder-lock-cross-platform.yml}` (lines naming deleted tests or paths)
- Tests: `test/architecture.test.mjs`, `test/suite-baseline.json`, `test/git/main-checkout-delete-guard.test.mjs` (D9),
  `test/rust-host/{command-routes,closing-block,fgctl-init-preflight-tail,fgctl-upgrade}.test.mjs`,
  `test/cli/{fgos-manifest,verb-exit,subcommand-flag-drift,unknown-flag-rejection}.test.mjs`, the `test/setup/*.test.mjs`
  files each phase names, `test/seat-binding/route-doctor-check.test.mjs`, `test/holder-lock/windows-doctor.test.mjs`,
  `test/state/domain-registry-compiled.test.mjs`, `test/verbs/{init-without-event-store,settle-legacy-config}.test.mjs`,
  `test/state/init-config-files.test.mjs`, `test/e2e/coexistence-canary.test.mjs`, `test/install-packaging.test.mjs`
  (162-167, the npm channel's `init` refusal text, 10), `test/git/{recovery,worktree-recovery,commit-parent-death}.test.mjs`
  and `test/direct/merge-gate.test.mjs:441` (they import `src/git/status.mjs`, 10), `test/setup/helpers/setup-checks-harness.mjs`
  and the about 30 tests that read `DOCTOR_CHECKS` through it (03), `test/scripts/install-git-hooks.test.mjs` (04, 09)
- Docs (12 only, except where a phase must fix a doc its change makes false): `docs/platform/packaging-distribution/{spec.md,vision.md}`,
  `contracts/setup-doctor-registry.md`, `contracts/release-manifest.md` (only under Q2 (a)),
  `contracts/skill-package-distribution.md`, `verification/implementation-alignment.md`,
  `docs/platform/host-invocation-routing/spec.md` (§2 counts, §5/§9 bridge), `contracts/command-route-descriptor.md`,
  `docs/platform/coexistence/spec.md`, `docs/reading-map.md` (rows 137, 149, 159 and new paths), `AGENTS.md`
  ("Install/setup/doctor gate": the registry path; "`fgos setup` is deprecated" sentence), `README.md` (uninstall and
  setup lines), `docs/how-to/install-fgos-in-a-project-and-use-doctor.md`, `docs/how-to/recover-main-checkout-after-ignored-files-wipe.md`
  (it runs `fgos setup`), `core/skills/_shared/capability-catalog.md`, `core/config-standard/mailbox.yaml:93` and
  `core/config-schema/mailbox.schema.yaml:288` (text naming `setup`), render surfaces via `npm run build:skills`,
  `docs/backlog.md` (close `p-bkmh4egqlv`, `p-tgqxcemygh`, `p-wheblpunzi`; note `p-pvs4go2qei`)

Delete (by the phase in brackets; the phase files are the authority, D14; 00 checks each with `rg` against the landing order):
- [04] `src/setup/{git-checks,git-retention-note,event-store-checks}.mjs` (after `node-version-and-git` and its `gitFloor` move with the Git rows, and `forge-probe.sh` uses the host)
- [05] `src/setup/{config-checks,identity-checks}.mjs`, the Observe row bodies
- [06] `src/setup/holder-lock-checks.mjs`, `terminal-control-checks.mjs` (only if F2 moves its rows), the mailbox row bodies
- [08] `wireAgentsUseCase` and the `wire-agents` renderer (the file `agent-wiring.mjs` goes in 07)
- [09] `src/setup/{uninstall-project,managed-timer}.mjs`; `uninstallAgentHooks`, `uninstallGitHooks`, `mainCheckoutHookWired`, `generatedSkillDirs`
- [11] `src/setup/{setup-use-case,runner-config-conversion,ansi}.mjs` (the advice the bridged `runner-patterns-config` row reads moves next to it, F14), `shell-rc.mjs`'s insertion (detection stays, D18), `materializeSkillsIntoProject`, `createProjectSkillGuard`
- [10] `src/verbs/state/{init,settle-legacy-config}.mjs`, `src/install/coexist.mjs`, `src/git/status.mjs`, `src/setup/event-store-fixes.mjs`
- [07] `src/setup/{agent-hooks,claude-code-hooks,agy-permissions,mailbox-claude-accept,project-launcher,agent-wiring}.mjs`; `version-info.mjs`, `mailbox-limits.mjs`, `omp-natives-checks.mjs` if 00 finds no other user
- Their tests (owners named per phase); the transitional parity runner and tables [12]


### Added during execution

Found by comparing `git diff --name-only origin/main...HEAD` with this section at the close; each was touched by the phase named and stays inside its job.

- Goldens read by the owning crates' tests (03, 01, 02, 08, 09): `apps/fgctl/tests/goldens/uninstall-answer-{plan,failed}.json`, `packages/distribution/rust/tests/goldens/{agent-hooks-vectors,bin-cache-file,doctor-base-release,launcher-digests,managed-timer-units}.json`.
- Rust rows' readers moved or extended for the in-process rows (04, 05, 06): `packages/git/rust/src/{repository_config,repository_facts}.rs` with `packages/git/rust/tests/{repository_config,repository_facts}.rs`; `packages/event-store/rust/src/{legacy_import,refspec}.rs`; `packages/identity/rust/src/{machine,signing}.rs` with `packages/identity/rust/tests/{attempt_writer_id,machine,signing}.rs`; `packages/mailbox/rust/store/src/limits.rs`; `packages/observe/rust/src/shard.rs`; `packages/seat-binding/rust/src/tier.rs`; `packages/process/rust/src/{spawn.rs,platform/windows_spawn.rs}`.
- Node modules whose last bridged-row reader or helper moved (04-07, 11): `src/event-store/{index,native}.mjs`, `src/util/{identity-mint,release-targets,session-identity}.mjs`, `domains/coding/slice-kinds.yaml`.
- Tests and helpers that named a deleted path or a moved row: `test/cli/helpers/fgos-cli-harness.mjs`, `test/helpers/{cli-entry,doctor-bridge-labels}.mjs`, `test/config/{config-door,facade}.test.mjs`, `test/distribution/{native-addon,source-payload}.test.mjs`, `test/event-store/{phase07-fixture.mjs,topologies.test.mjs,triggers.test.mjs}`, `test/observe/invocation-fault-log.test.mjs`, `test/report/{authoritative-match,context-render,decision-index}.test.mjs`, `test/runner/dispatch-runtime-inspect.test.mjs`, `test/util/session-identity.test.mjs`, `test/workflow/propose-classify.test.mjs`, `test/rust-host/fixtures/invocation-root-table.json`.
- Docs that named setup or the Node doctor: `docs/platform/packaging-distribution/verification/{install-and-release-proof,packaging-checklist}.md`, `docs/platform/work-state/architecture/implementation-pointers.md`.
- Removed at the close: `test/rust-host/verb-parity.test.mjs` and `test/rust-host/parity-cases/` (the runner and the four tables, as planned).
## Collision watch

Checked on `origin/main` `445e65679`. Landed and closed for S4's purpose: capability reads (`1c30f30f8`, verdict
`8d6a07c4c`), one-door-debt (last phase, doctor readers, `67a4c9380`; its plan.md status cell still says
`pending`), account health A (`ba500c323`), S2+S3 (`5723d8453`; status cell also stale). 00 re-checks each with
`git log` before wave B lands.

| Shared file or area | S4 change | Other plan or lane | Mitigation |
|---|---|---|---|
| `src/setup/registrations.mjs` (Work rows 1422-1562, `domain-registry-compiled` 1113, `worker-slots-ceiling-usable` 1971) | rows stay bridged (`bridge:S7`); S4 only removes other rows | doctor-readiness-only phase 09 (WORK's six Work rows and the Work pointer, `plans/261106-1216-doctor-readiness-only/plan.md:71`), held with the Work lane | if WORK lands first, rebase and keep the registry contract's ids equal (exact-set test fails by name); if S4 lands first, WORK edits the bridged bodies and the registry entries |
| `apps/fgos/src/{main.rs,routing.rs}`, `command-registry.mjs` (hook entry), generated routes | doctor, init, uninstall, wire-agents lines | program S1 (hook verdicts; may run beside any step) | additive list lines; regenerate after the second landing; S1 does not touch `src/setup/` |
| `test/git/main-checkout-delete-guard.test.mjs` | reads the prefilter from the D9 data file instead of `agent-hooks.mjs` | S1 ports the guard verdict and owns this test after it | if S1 lands first, 01 edits S1's Rust test reader instead; one owner of the list either way |
| `src/setup/agent-hooks.mjs` (mailbox hook rows), `managed-timer.mjs` (mailbox sync timer), `scripts/lib/mailbox-live-confined.mjs` | moved to Rust (01, 02) | MAIL lane (board "Các luồng", running) | 00 reads the MAIL row and its open branch; if MAIL edits the hook rows, the edit lands in the Rust table's data file; one owner |
| `src/config/facade.mjs` (`initConfigFile`, `checkConfig`, `fixConfig`) | init and config rows call the crate directly; the facade stays for its other callers | CFG Slice C (`plans/261023-1649-yaml-config-slice-c-node-door-cutover`, status cell `in-progress` since 10-23) | 00 checks whether Slice C is live; S4 deletes no facade function another caller uses |
| `AGENTS.md` ("Install/setup/doctor gate") | the registry path and the setup sentence (12) | RULE lane (running since 10-21; writes `AGENTS.md` only after its own cutover) | one section; rebase |
| `test/suite-baseline.json` | rows of deleted test files | TEST lane (test governance) | different rows; rebase |
| `docs/architecture-manifest.json` | new `doors` rows; `files` entries out; debt entries removed (`workspace.rs`, `setup-use-case.mjs`) | any landing plan adding rows | additive; second lander reruns `test/architecture.test.mjs`; a stale debt entry fails by name |
| `packages/git/contracts/mutation-census.v1.json` | regenerated | every product change | regenerate after each landing |
| `scripts/lib/mailbox-behaviour-v7{e,h,i}.mjs`, `test/scripts/mailbox-behaviour-v7h.test.mjs` (frozen preregistered file sets list `src/setup/agent-hooks.mjs`; the test copies it) | 07 deletes `agent-hooks.mjs` | MAIL lane (experiment evidence) | 00 asks MAIL how the frozen sets treat a deleted file; 07 waits for the answer (an item, not a block on other phases) |
| `src/setup/registrations.mjs` (+13 lines), new `src/setup/paseo-checks.mjs`, `setup-doctor-registry.md`, `apps/fgos/src/main.rs` | registry and host files | unmerged branch `origin/spike/paseo-external` (9 commits) adds a doctor row | if it lands first, its row enters the registry contract with an owner (exact-set test fails by name otherwise); if S4 lands first, the spike adds its row to the contract |
| `.github/workflows/{ci.yml,release-assets-check.yml,holder-lock-cross-platform.yml}` | lines naming deleted tests and paths | `ci/cache-and-cancel` (open, edits CI files) | different lines; rebase |

Open branches on `origin` (`git for-each-ref refs/remotes/origin`, 2026-11-15): the landed one-door-debt phase
branches, `ci/cache-and-cancel` (CI files only) and `spike/paseo-external` (row above); 00 F17 rechecks.

S4 internal shared files: see "Hot files". Disjoint by construction: 01 owns `agent_hooks.rs`, `agent_config.rs`,
`launcher.rs` and their contracts; 02 owns `timer.rs`, `rc_lines.rs`, `coexistence.rs`, `skill_stamp.rs`,
`workspace.rs`; 03 owns `doctor.rs`, `wiring/doctor/{mod,bridge}.rs`, `cli_presenter.rs`, `contracts.rs`; 04-07 each
own their `wiring/doctor/<group>.rs` and their Node check modules; 08, 09, 10 own their `wiring/<verb>.rs` and Node
use case; 11 owns `setup-use-case.mjs`, `help.rs`.

## Exit criteria (measurable)

1. `command-routes.json`: `doctor`, `init`, `uninstall`, `wire-agents` have `route_kind: native` and an `operation_id`;
   `setup` has no route and answers "unknown verb" (exit 4) like `preflight`. Counts recomputed from the generated
   table at close (today 79 selectors: 65 `legacy-cli`, 14 native; expected 78: 60 legacy, 18 native; the bridge is
   no selector, D5).
2. No Node process for `wire-agents`, `uninstall`, and for `init`/`doctor` outside the bridge: the parity runner's PATH
   `node` shim records zero `node` children for every `wire-agents` and `uninstall` case, one bridge child per bridged
   fix segment plus one for the checks per doctor run (segment count from 00 F9), and one per Linux `init`; one
   `cli_tests.rs` case per verb with a failing PATH `node` wrapper shows `wire-agents` and `uninstall` succeed and
   `doctor` answers with its bridged rows as `fail`, `fix: null` and one `next` entry naming Node.
3. One registry: `doctor-registry.v1.json` lists exactly the live row and fix ids (110 rows, 27 fixes today minus
   `shell-integration-sourced`; numbers recomputed by 00); the bridged ids equal 00's row table and Node's body ids
   (exact-set tests both sides); no `registerCheck`/`registerFix` call outside the bridge bodies (`doors` row); the
   D4 import-closure test passes and no row is labelled `bridge:S4`.
4. Parity: every table ran green host-vs-base-release on the integration head before the close deleted it; case
   counts per verb in the close report; accepted differences only those under Outcome.
5. `doors` rows exist and pass, each with a negative case: "doctor readiness registry", "Node rows bridge" (debt
   none, `retiredBy` S7), "agent hook table", "person's agent config writes" (only `wire-agents`, RUL111), "managed
   timer", "skill generated stamp" (writer the render, reader `skill_stamp.rs`), "project wiring reversal", "init
   steps", "retired Node S4 verb code"; the `compose Git status and recovery`, `global fgOS directory` and `resolve the
   invocation root` rows have lost their S4 entries (stale checks pass).
6. `fgctl init` on a fresh project (release built from the integration head) ends on `Ready` with exit 0 on
   fg-server2; the external-consumer proofs pass unchanged: `scripts/ci-external-consumer.sh` on Linux and
   `scripts/ci-external-consumer.ps1` on windows-latest (exit 0 or 2 as today, `ci-external-consumer.ps1:185-197`);
   the `fgctl` tests read golden doctor outputs of the base release through the lenient report type (D3).
7. Gates green on the integration head: `npm test`, `cargo test --workspace`, `cargo fmt --all --check`,
   `cargo clippy --workspace --all-targets -- -D warnings`, `cargo check` of the touched crates for
   `x86_64-pc-windows-msvc` and `aarch64-apple-darwin`, doc-health, decision-citation drift,
   `node scripts/export-command-selectors.mjs --check`, the one-door scan with 0 undeclared and the Git classes not
   above 00's numbers.
8. Latency (release host, 15 runs, median, 00's fixtures): `fgos doctor --json` and `fgos doctor --fix` in a fresh
   project and in this repo not above 00's medians; `fgos init` (repeat run), `fgos uninstall` (plan),
   `fgos wire-agents` (plan) below 00's Node medians; numbers in the close report.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| `fgctl init`, the CI consumer proofs or an agent loop read a changed doctor report | M x H | report-shape non-goal; parity per row; lenient report type and golden base-release outputs in the `fgctl` tests (D3); `closing-block.test.mjs` and `init.rs` tests in 03 and 12; exit criterion 6 |
| A row moved to Rust reads a Node-only fact through a copied rule (a hidden twin) | M x H | D4 import-closure test; the `doors` ban on Node and legacy spawns in the row adapters and `init.rs`; each adapter calls a crate function |
| The bridge child misbehaves: wrong environment, an inherited recursion guard, a hang, an orphan on Ctrl-C, a stray stdout write | M x H | D5: one spawn function shared with `execute_legacy_cli`, fresh guard, deadline with tree kill, signal forwarding, one JSON line per result with stdout of bodies routed to stderr; host tests for each (03) |
| The bridge outlives S7 or grows | M x M | exact-set list with step names; a new Node-layer row enters only with a step label; `doors` row with `retiredBy` S7; program S5-S7 rows gain "remove your bridged rows" (item) |
| Fix order changes behaviour (e.g. `copy-to-destination` before the machine files, `spec.md:799`) | M x H | fixes in exact registry order, one bridge call per consecutive bridged segment, never reordered (D5); parity of `doctor --fix` on a legacy-config project |
| Windows `fgctl init` tail: the config crate refuses on Windows and the host's in-process settle turns a warning into a failure | M x H | 10 keeps Node's rule (`config-platform-unsupported` returns the steps and a warning, `settle-legacy-config.mjs:31-36`); `.ps1` proof in exit criterion 6 |
| Doctor gets slower (`--fix` starts Node once per fix segment) | M x M | baseline medians for `--json` and `--fix` (00, exit criterion 8); rows that spawn the host from Node today (holder-lock, identity, mailbox status) become in-process |
| Hook files written by Rust differ in bytes from Node's and doctor, agents or the run supervisor's trust store (which hashes hook bytes, `src/run-supervisor/trust-store.mjs:498`) see a change | M x M | data-file vectors generated from Node (01); parity `fs-delta` on `doctor --fix`; the "recognised as ours and replaced in place" rule kept (`spec.md:807`) |
| A doc, skill or CI workflow names `fgos setup` or a deleted test after S4 | H x L | 00 F15 list; 11 and 12 grep `core/`, `domains/`, `plugins/`, `docs/`, `README.md`, `.github/workflows/`; `npm run build:skills` |
| Windows and macOS: `.cmd` resolution of `claude`, launchd plists nobody can run | M x M | the process door resolves `.cmd` with an msvc unit test (01, 08); units and plists rendered from a run-time platform value with vectors for both, only the `systemctl`/`launchctl` calls under `cfg` (02) |
| Collisions with WORK, MAIL (frozen experiment files), S1, the paseo spike | M x M | collision table; 00 re-reads the board rows and open branches before wave B lands |
| A 27-day integration branch drifts from `main` | H x M | weekly `main` merge and exact-set tests (D16) |

Rollback: each phase reverts on the integration branch; the landed step reverts as one series. In the field,
rollback of a native verb is a release rollback through `fgctl` (migration doc §13): the previous release still has
the Node arms. No on-disk format changes: hook files, timer units, the coexistence manifest, `.fgos/` layout and the
doctor report keep their shapes, so an older release reads everything S4 wrote.

## Red Team Review

### Session — 2026-11-15
**Reviewers:** 3 (Failure Mode; Assumption Destroyer, about 60 claims checked on `445e65679`; Scope, One-door and
Collisions), plus the planner's own checks (`fgos internal` namespace, `locks.rs:131`, `generatedSkillDirs`).
**Findings:** 59 raw, merged to 26 (24 accepted, 1 accepted in part, 1 rejected). **Severity:** 1 Critical, 13 High, 12 Medium.

| # | Finding | Severity | Disposition | Applied to |
|---|---|---|---|---|
| 1 | The bridge cannot be `fgos internal doctor-bridge` as a `legacy-cli` selector: `internal` is the host's own namespace, dispatched before the route table and absent from `command-routes.json` (`apps/fgos/src/main.rs:137-178`); Node has no such verb | Critical | Accept: the bridge is a payload module the host runs through `legacy_exec.rs`'s resolution, no verb, no route (D5) | D5, 00 F3, 03, 10, exit 1 |
| 2 | Bridge spawn undefined: environment, an inherited recursion guard, deadline, signals, stdout framing, fault records | High | Accept: one spawn function shared with `execute_legacy_cli`, fresh guard, deadline, signal forwarding, one JSON line per result, no records | D5, 03 |
| 3 | A strict shared report type breaks a global `fgctl` reading an older pinned release's doctor | High | Accept: lenient type, golden base-release outputs | D3, 03, exit 6 |
| 4 | Fix order alternates owners; "at most twice" contradicts segment splitting | High | Accept: exact registry order, one call per consecutive bridged segment, exit criteria use the segment count | D5, exit 2, 8 |
| 5 | Delete lists contradict the phases and live importers (`claude-code-hooks`, `agent-wiring`, `managed-timer`, `event-store-fixes`, `mainCheckoutHookWired`, `git-checks` via `gitFloor` and `forge-probe.sh`, `status.mjs`'s four other test users) | High | Accept: one delete list keyed by last importer and landing order, phases authoritative; `node-version-and-git` moves with the Git rows in 04 | Delete list, 04, 09, 10 |
| 6 | D4 is a hand-made table, not a check | High | Accept: import-closure architecture test, spawn ban in adapters, no `bridge:S4` at close | D4, 03, 12 |
| 7 | Windows `fgctl init` tail: the in-process legacy settle may refuse where Node warns; only the `.sh` proof was gated | High | Accept: Node's platform rule kept; `.ps1` proof in exit 6 | 10, exit 6 |
| 8 | Q3's options misstated the program's: its (b) still moves `wire-agents` and `uninstall`; a Node-to-host call is the normal direction, not a harm | High | Accept: Q3 rewritten; (b) is the program's (b) with its real cost, (c) is the minimum | Q3 |
| 9 | Q3 hid the budget change (the program's "about 2 days" was the bridge alone; S4 itself was unsized) | High | Accept: stated in Q3 | Q3 |
| 10 | rc detection: a live repository hook (`scripts/fgos-session-start-hook.mjs:13`, `.claude/settings.json:162`) imports it; twin without `retiredBy` | High | Accept: D18 | D18, 02, 09, 11 |
| 11 | CI workflows name deleted tests and paths (`release-assets-check.yml:101, 115`, `holder-lock-cross-platform.yml:16, 18`, `ci.yml:91`) | High | Accept: in file set and hot files; `doctor-fresh-run.test.mjs` stays as the cross-OS doctor wiring proof | 03, 06, 07, file set |
| 12 | Existing `doors` rows name S4 files (installation shim row allows `project-launcher.mjs`; writer-id row allows `agent-hooks.mjs`, `registrations.mjs`; project config row allows `runner-config-conversion.mjs`) | High | Accept: the launcher extends the existing shim row; each phase edits the rows its change touches; 00 F19 lists them all | 01, 07, 11, 00 |
| 13 | `setup` was the only product wiring of the hooks path for a project shipping `.githooks`; `wired()` judged twice | High | Accept in part: `wired` moves into RepositoryConfig (D17); the loss is reported under "Decided and reported" (V1), not asked | D17, V1 |
| 14 | D15 "no edge" false: the packaging modules read config; spawns need the process door; the extension's identity prefix | High | Accept: edges to `fgos-config` and `fgos-process` approved; the prefix travels as data | D15 |
| 15 | Hot files missed shared files (`init.rs` 02/03/07, `wiring/mod.rs`, `cli_tests.rs`, `checks.mjs`, `git-hooks.mjs`, `shell-rc`, `skill-wrappers`, `agent-hooks`, shared tests) | Medium | Accept | Hot files |
| 16 | Split memo: config judged in Rust and again by the bridged `runner-patterns-config`; `gitFacts` shared with `node-version-and-git` | Medium | Accept: rows sharing a memo key move together where they can (`node-version-and-git` with Git); the config double read is accepted cost (same files, read after fixes); the engine builds the run context after fixes | 00 F2, 03, 04 |
| 17 | Hook-table door patterns are literal names and miss split-path readers and writers (`trust-store.mjs:498`, `check-hook-registrations-guarded.mjs:26`, `worker-home.mjs:145`, `record-mailbox-hook-fixtures.mjs:230`) | Medium | Accept | 01 |
| 18 | The rc-line match needs the payload's `scripts/fgos-shell-integration.sh` path; the script must keep shipping | Medium | Accept | D18, 02, 09 |
| 19 | Collisions missed: MAIL's frozen v7e/h/i file sets and their test; `origin/spike/paseo-external` adds a doctor row | Medium | Accept | collision table, 00 F17, 07 |
| 20 | `test/install-packaging.test.mjs:162-167` checks Node `init`'s npm-channel refusal | Medium | Accept | 10 |
| 21 | Retired tests without an exact owner (fresh doctor run, HOME untouched, lock-dirs fix, `curl-check`, the Windows holder-lock proof) | Medium | Accept: named per phase | 03, 06, 07, 08, 10 |
| 22 | Two stamp forms (wrapper marker and assembled header); the render also reads the stamp | Medium | Accept: contract covers both; the row says "writer and reader" | 02 |
| 23 | Q2 lacked harm for (b) and gain for (c); user-visible removals decided silently | Medium | Accept: Q2 completed; "Decided and reported" list with veto | Q2, V1-V4 |
| 24 | D11 ignores `MailboxAnswer`; `provider.rs` missing; phase 03 invented a doctor "text render" | Medium | Accept | D11, D3, 03 |
| 25 | `node-version-and-git` in Rust must judge the payload's Node, not a Node of its own | Medium | Resolved at the close: the rows bridge's `end` line carries the `process.version` of the Node that ran the call and the row judges that against `requires.node` (a missing Node, or one that never ends its call, fails it); no `node --version` is spawned | 00, 04, 12 |
| 26 | Ratchet the bridged row count per step | Medium | Reject: it would block a legitimate new WORK readiness row; the step label requirement and the exact-set test bound the bridge instead | - |

Also accepted without a row: `runDoctor` ends at 312 (not 327); init exit codes at `command-registry.mjs:452-456`; the
malformed-file skip in `agent-hooks.mjs` is at 35-37, 358, 404; the host spec citation for the bridge rule is the
migration doc §7 only; the deprecated verb keeping the Compatibility help section is `compound`
(`command-registry.mjs:696`); the parity runner is restored from `92671a21d^`; init's end trigger and Event Store
refs are compared in its parity; `--dir` and the default envelope of `uninstall` pinned for `fgctl`'s parser.

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-00 to phase-12.
- Decision deltas checked: 18 (D1-D18) plus Q2, Q3 and V1-V4.
- Reconciled stale references: the `internal doctor-bridge` route (removed everywhere), "at most twice" (segments),
  the delete list against each phase and the landing order, `mainCheckoutHookWired`, `node-version-and-git` (04, not
  07), `locks.rs` (no change needed), Q3 option letters in the phase table ("Q3 needs") and in the critical-path text.
- Unresolved contradictions: 0.

## Validation Log

### Verification results
- Tier: Full (13 phases). Claims checked: about 110 (60 by the assumption reviewer, about 50 planner spot checks with
  `sed`/`grep` on `445e65679`: every `registrations.mjs` row line, the `bin/fgos.mjs` arms, `init.rs`/`uninstall.rs`
  functions, every named test path, the doors rows, the route table shape).
- Verified: about 100 | Wrong, all fixed: 10 (the `internal` route design; `locks.rs` message already current; three
  delete owners; `runDoctor` end line; init exit-code lines; malformed-file skip lines; the host spec §5 citation;
  D15 edges) | Open, owned by 00: F1-F21.
- Decided by the planner (priority 2: the analysis picked one): D1-D18 and V1-V4 (reported, not vetoed 2026-11-15, they stand).
  Batched for the owner: Q2, Q3.

## Decided and reported (reported, not vetoed, they stand; each is in the frame the program row approved, "retire `setup`")

- **V1. The hooks path is no longer wired by a product verb.** `setup` was the only product path that set
  `core.hooksPath` to a project's own `.githooks` (`setup-use-case.mjs:56`; `installGitHooks` acts only when
  `<main>/.githooks` exists, `git-hooks.mjs:23-33`). The only project that ships `.githooks` is the fgOS source, which
  wires it with `npm run setup:hooks` (AGENTS.md "Scratch artifacts"); the doctor row `main-checkout-hook-wired` keeps
  reporting it and names that command. Veto means: register a fix for that row (fill-only, the same code).
- **V2. No command copies the release's skills into a project.** Only `setup` did (`materializeSkillsIntoProject`);
  `fgctl init`, the supported onboarding, never ran it; Claude gets fgOS skills from the plugin `wire-agents` installs;
  existing copies stay. Non-Claude agents in an external project get no fgOS skills from the supported path (item).
  Veto means: a fix or an `init` step that renders skills into the project (new behaviour, a separate item).
- **V3. The retired runner-config conversion ends with `setup`.** The bridged `runner-patterns-config` row keeps
  naming the retired keys (its advice moves next to it).
- **V4. No shell-rc source line is written any more.** Existing lines keep working (the integration script still
  ships); `uninstall` still names them; the row `shell-integration-sourced` goes (`p-bkmh4egqlv`).

## Decision log

2026-11-15 15:55, owner answers relayed by HARDEN: Q3 = (a), all four verbs move in S4 with the one bounded Node rows bridge. Q2 = (b), decided by HARDEN inside the approved frame and reported with no veto: Node stays required until S6, revisited there. V1-V4 were reported to the owner and not vetoed, so they stand. All phases are unblocked; phase 07 still waits for MAIL on the frozen v7e/v7h/v7i file sets (asked by mailbox 2026-11-15).

## Owner questions (batch)

Answered 2026-11-15 (see "Decision log"): Q3 = (a), Q2 = (b); no phase waits on them. Labels follow the program plan's Q2 and Q3.

### Q2: does `fgctl init` keep refusing a machine without Node?

- **What is happening:** every release manifest carries `requires.node` (`>=18`, written from `package.json` engines
  by `scripts/build-rust-distribution.mjs:461-463`), and `fgctl init` refuses without Node at preflight
  (`check_node_requirement`, `packages/distribution/rust/src/init.rs:376-405`, called at 453-455) before it activates
  anything. Today the tail also needs Node, because `init` and `doctor` are Node verbs (`init.rs:846-887`). After S4
  under Q3 (a) the tail needs Node only for the bridged doctor rows and `init`'s Work step.
- **Cause:** `requires.node` is one release-wide gate (`contracts/release-manifest.md:70-73, 104`), not a per-route
  need; the runner (`run`, `workflow`, most of `dispatch`) is Node until S6. On Windows the owner chose the level
  "installs and activates" (backlog `p-ffz65fjo6u`, 2026-11-13), but the runtime is not supported there yet: about
  50 doctor rows fail on windows-latest (Config is not available on Windows, the Event Store runs on Linux only), so a
  Windows `fgctl init` ends "not ready" whatever Node does. Every machine that runs fgOS today has Node (only the
  owner uses fgOS, on three Linux machines).
- **Options:**
  - (a) Node optional at install: preflight warns instead of refusing; the host refuses a legacy route by name when
    Node is missing (`legacy-node-missing`, exit 2, naming the Node version to install); `node-version-and-git` is the
    doctor row that says so, and bridged rows report it. About 1.5 days as one extra phase; needs Q3 (a). Gain:
    install, activate, diagnose and the 18 native verbs work on a machine without Node. Harm: such a machine cannot
    run `fgos run` or `workflow`; the release contract changes meaning.
  - (b) Keep Node required until S6: no cost now; `requires.node` and its preflight stay; `node-version-and-git` moves
    to Rust with the same verdict. Harm: a Windows machine must install Node before `fgctl init` activates, so the
    "installs and activates" level needs Node there until S6.
  - (c) Make a Node-free product committed scope for S6: 60-120 lead-days after S5 (program estimate). Gain: a
    Windows or locked-down machine runs every verb without Node. Harm: the largest cost of the program, committed
    before S5's port pace is known.
- **Recommendation:** (b). No user gains today (every fgOS machine has Node, and Windows is not ready for other
  reasons); (a) ships an install that cannot run a task. Revisit (a) or (c) at S6 with S5's measured pace; under
  Q3 (a), option (a) stays a 1.5-day change.
- **Answer (2026-11-15 15:55, HARDEN inside the approved frame, reported to the owner, no veto):** (b). Node stays required until S6, revisited there; no extra phase.
- **Scope of the answer:** the `requires.node` gate and the host's answer when Node is missing. Not the step order,
  not Windows runtime support (`p-ffz65fjo6u`).

### Q3: do `init` and `doctor` move in S4, with one bounded Node bridge?

- **What is happening:** `doctor` has 110 rows and 27 fixes (`src/setup/registrations.mjs`, registry 147-312). By the
  import trace (scout, corrected for three rows), about 60 rows judge layers that already have a Rust owner (Git,
  Event Store, Config, Identity, Holder-lock, Mailbox, Observe, Distribution) or S4's own packaging layer (hooks,
  launcher, agent config); about 50 judge layers that S5 (about 23), S6a (about 18), S6b (2) and S7 (8) still own in
  Node (00 fixes the exact table, D4). `init`'s only Node-owned step is the Work-store rebuild
  (`src/verbs/state/init.mjs:49-52`, `src/state/store.mjs:62-64`). The program sized only the bridge ("about 2 days
  inside S4", program plan Q3); S4 itself was left to this plan.
- **Cause:** the program placed packaging after S2/S3 so that `doctor`/`init` read moved layers through Rust, but
  doctor also judges S5-S7 layers, and a native verb reaches Node only through a real per-operation bridge (migration
  doc §7 item 4, `node-to-rust-migration.md:294-297`). The owner's priority of 2026-11-14 was "packaging-distribution
  first, then bottom-up".
- **Options:**
  - (a) All four move now, with one bounded bridge (this plan): one Rust registry and engine; about 60 rows judged in
    process by their Rust owners; about 50 rows and `init`'s Work step through the bridge, an exact-set list naming each
    row's step; S5-S7 each move their rows out; S7 deletes the bridge. About 27.5 lead-days (critical path about 7.5):
    the bridge is about 2 of them; the rest is the engine, the registry, `init`, and porting the 60 rows that under (b)
    move at S7 instead. Gain: the packaging layer and the doctor have one Rust owner now; rows that spawn the host from
    Node today become in-process; `init` needs Node only for the Work step; Q2 (a) becomes a small change. Harm: a
    temporary second judge (the bridge) lives until S7; `doctor --fix` starts Node once per bridged fix segment.
  - (b) The program's (b): `wire-agents` and `uninstall` move now with the packaging modules in Rust; `doctor` and
    `init` stay Node verbs until their last layer moves (S7), and doctor's packaging rows and fixes call the Rust
    modules through `fgos internal` host routes, the normal Node-to-host direction (as `seat-binding` does). About 15
    lead-days. Gain: no bridge, no native-to-Node path; S4 is about half the size. Harm: `doctor` and `init`, on the
    install path, move last (60-120+ lead-days away) and all 110 rows then move at once or in S5-S7 as Node-to-host
    calls; the 60 Rust-layer rows keep spawning the host from Node until then; the host routes added for the packaging
    rows live until doctor moves.
  - (c) Minimum: S4 retires `setup` only; the four verbs move together after S7. About 4 lead-days. Harm: changes the
    approved S4 row; packaging, the owner's first priority, moves last.
- **Recommendation:** (a). It keeps the approved S4 row as written ("the other four native or hybrid per Q3") and the
  owner's "packaging first", gives the packaging layer and the doctor registry one Rust owner, and bounds the only
  temporary path by data that each later step shrinks. It costs about 12.5 lead-days more than (b) inside S4, most of
  which (b) would spend at S7 instead. Choose (b) if a smaller S4 matters more than having `doctor` and `init` in
  the host before S7. This differs from the program plan's conditional advice ("(a) only if Q2 is (a) or (c)")
  because that advice weighed only Windows-without-Node; the row count and the shared packaging layer were not known.
- **Answer (owner, 2026-11-15 15:55, relayed by HARDEN):** (a). All four verbs (`wire-agents`, `uninstall`, `init`, `doctor`) move in S4 with the one bounded Node rows bridge.
- **Scope of the answer:** where `init` and `doctor` run in S4 and whether one Node rows bridge may exist until S7.
  It does not change the order of S5-S7. Under (a) each of S5-S7 gains "move your bridged doctor rows to Rust" (item
  for the program plan); under (b) the program's S7 row gains `doctor` and `init`; under (c) it gains all four verbs.

## Items for the program plan (big lead)

- Q3 answered (a): rows S5, S6a, S6b, S7 of the program plan each gain "move the step's bridged doctor rows (and, for
  S7, `init`'s Work step) into Rust and remove them from the bridge; S7 deletes the bridge module
  `src/setup/doctor-bridge.mjs` and its host caller". Each of those steps restores the parity runner from history for
  its rows (as S4 restores S3's) and keeps 00's doctor fixtures.
- The S2+S3 plan and the one-door-debt plan still carry `status: pending` though landed; update them with `ak plan`.
- MAIL: how the frozen v7e/v7h/v7i preregistered file sets treat the deleted `src/setup/agent-hooks.mjs` (07 waits).
- Outside S4: `apps/fgctl/src/help.rs` keeps its own argument reading (`parse CLI arguments (twin)` debt, `retiredBy`
  S7); non-Claude agents in an external project get no fgOS skills through the supported onboarding (V2): its own
  backlog item if wanted; `active-release-matches-checkout` if 00 F18 leaves it bridged as repository tooling.
