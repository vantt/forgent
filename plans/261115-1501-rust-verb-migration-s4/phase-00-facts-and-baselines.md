---
phase: 0
title: "Facts, row ownership table, parity cases and baselines"
status: pending
effort: 1.5d
wave: A
blockedBy: []
---

# Phase 00: Facts and baselines

Read-only. Answers the prior-art questions and the open facts every later phase relies on, produces the **doctor row
ownership table** (D4) that the registry's bridge set must equal, pins each verb's argv, output and exit behaviour as
parity cases, and records the numbers the exit criteria compare against. The report reaches the step lead before 03
lands; a fact that contradicts a phase names the phase and the line it changes.

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s4-p00`, worktree
`/home/vantt/projects/forgent-worktrees/rvm-s4-p00` from `origin/main`. Report slug `s4-p00-facts`.

## Prior art (scouted for this plan on `445e65679`; re-verify each with one command and record the sha)

| Subject | What existed | Change that added, moved or removed it | Intended |
|---|---|---|---|
| `doctor` route | always `legacy-cli` (`git log -G'"doctor"' -- packages/host-runtime/contracts/command-routes.json`: only the generator commit `d2a9d3284`); no Rust `fgos doctor` ever | - | - |
| doctor shape | 147 rows in 45 s, repo rows and incident readers inside | readiness only, pointer rows, 109 rows (`plans/261106-1216-doctor-readiness-only/`, owner decision 65); one shim probe per run, three rows read component answers (`daa6ef903`, T9 P10, decision 81) | yes |
| a crate owning its doctor rows | config's 15 rows and 6 fixes as a contract plus fixtures, judged by `packages/config/rust/src/doctor.rs` | `d2902fa0c` (2026-10-23) | yes: the shape D2/D3 reuse |
| `fgctl init` tail | runs `fgos init`, `doctor --json`, `--fix`, `doctor --json` through the shim, closing block | `43142bde1`, `9fcaafb00` (2026-11-12) | yes |
| `requires.node` preflight | `check_node_requirement` | `8e6961c26` (fgctl init, P12), `bd60c3677` (hardened preflight) | yes |
| `setup` | Node verb, deprecated since 2026-09-14 | one use case `setupUseCase` (`302fe8937`); runs every fix (tsk-5hi) | deprecation intended; removal gated by the 30-day window, ended 2026-10-18 |
| `wire-agents` | the only writer of a person's agent config (RUL111) | `e1fca6f5f` (2026-11-09), `d1356df76`, `e726916fe` | yes |
| `fgos uninstall` | project half of `fgctl uninstall` | `3e17b18e7`, `5b6f40a93`, `235a4096b`, `797b16b57` (link refusal); fgctl half `c5cea8e25` | yes |
| `fgos init` Work step | `initStoreUseCase` | `6a89b070f` (Work store left out where the Event Store cannot run) | yes |
| retired-verb answer | `preflight` retired: "unknown verb like any other" | `987d6918b` (2026-11-13) | yes: D7 copies it |

Record also, with `git log -S` (and the pre-rename names): `runDoctor`, `DOCTOR_CHECKS`, `registerFix`,
`installAgentHooks`/`uninstallAgentHooks`, `deleteGuardPrefilter`, `materializeSkillsIntoProject`, `insertSourceLine`,
`writeCoexistenceManifest`, `settleLegacyConfig`, `fn resolve_workspace_root`, and any older Rust
`agent_hooks`/`readiness`/`fn uninstall_project` under `apps` or `packages` (expect none).

Rust that already does each job's core (reuse, never copy): config findings and repairs (`packages/config/rust/src/doctor.rs`,
`migrate.rs`), Event Store diagnostics (`packages/event-store/rust/src/diagnostics.rs`), Git WAL and incidents
(`packages/git/rust/src/{wal,incidents}.rs`, `apps/fgos/src/wiring/git_incidents.rs`), RepositoryConfig hooks path
(`inspectHooks`/`ensureHooks`, the Node client is `src/setup/git-hooks.mjs:7-60`), identity mint and probe
(`packages/identity/rust`), holder-lock semantics, borrow vectors and status (`packages/holder-lock/rust`), pin drift
(`init.rs` `pin_drift`, golden `packages/distribution/rust/tests/goldens/pin-drift-cases.json`), release verification
(`verify.rs`), shims (`shim.rs`), mailbox status (`apps/fgos/src/wiring/mailbox_*.rs`), terminal control
(`packages/terminal-control`), seat binding (`packages/seat-binding/rust`).

## Open facts (each answered with `file:line`)

- **F1 parity base.** Prove the S2/S3 recipe for these verbs: a linked worktree at the step base staged by
  `node scripts/run-tests.mjs` with its own Cargo target `rvm-s4-base-target`, entry A `node:<base>/bin/fgos.mjs` plus
  the staged env (`test/rust-host/harness.mjs:22-31`, `parityBaseEntrySpec` 181). Run one `doctor --json` and one
  `uninstall` case through it. Say whether doctor rows that read the active release (`rust-host-binary-present`,
  `active-release-matches-checkout`, `activation-matches-pin`) answer the same on both entries or must be marked volatile.
- **F2 row ownership table (D4).** For every row and fix (110 rows, 27 fixes on `445e65679`; the contract inventory
  `setup-doctor-registry.md:177-179` and the live `fgos doctor --json`): id, registration line, judge module, the
  import closure of the judge with each module's tier (`docs/architecture-manifest.json` `tiers`; `src/setup/` is 9,
  so judge the modules it reaches, not `src/setup` itself), the Rust function that already answers each fact (or
  "missing"), the owner it gets (`rust:<component>` or `bridge:<step>`), its fixes and `repairs`, pointer or not, and
  whether its message is volatile (`node-version-and-git` in Rust reports a spawned `node --version`, not the
  payload's `process.version`: volatile), its per-run memo keys (`createDoctorRun().once`, `registrations.mjs:195`:
  `shim-probe:*` (hook rows), `config-check:*` (config rows and the bridged `runner-patterns-config`, 530),
  `event-store-doctor:*` (Event Store and Git rows), `work-view:*` (Work rows), `gitFacts` shared by
  `node-version-and-git` and the Git rows, 392), and the judge module the registry records for a bridged row (D4).
  Known corrections to the plan's scout: `seat-binding-dry-bind` imports `bind()`
  (`src/setup/seat-binding-checks.mjs:3`, S5); `terminal-control-checks.mjs:13` imports `resolveHerdrBin` from
  `src/runner/dispatch/transport.mjs` (S6a); `dispatch-decide-hook-wired` is a hook-wiring row (packaging), not S5.
- **F3 route table and the bridge start.** The exact route lines of the five verbs (`command-routes.json` near 328,
  681, 1146, 1250, 1276) and the recount rule for exit criterion 1. Confirm D5's start path: `fgos internal` is the
  host's own route namespace, dispatched before the route table and absent from `command-routes.json`
  (`apps/fgos/src/main.rs:137-144`), so the bridge is a payload module the host runs through `legacy_exec.rs`
  (`resolve_payload_path` 69, guard 35-46 and 249), not a selector; name what the release builder must include for
  `src/setup/doctor-bridge.mjs` (the payload walker takes every tracked source file, so likely nothing).
- **F4 every caller of the five verbs.** Process spawns (`init.rs:857-862`, `uninstall.rs:387`), the CI consumer
  scripts (`scripts/ci-external-consumer.sh:267-282, 494`, `.ps1:185-186, 237-243`), skills, docs, hooks, `src/`
  spawns, tests; which parse JSON and which fields (`parse_reversal`, `uninstall.rs:345`).
- **F5 argv, store and root.** Per verb: flags, `--dir` handling (`mainCheckoutRootOf`, `bin/fgos.mjs:126`;
  `wire-agents` ignores `--dir`), registry `store` (`init` `open` 445, `setup` `open` 2331, `uninstall` `none` 2350,
  `wire-agents` `none` 2378, `doctor` `none` 2398), root policy (`init` `strict-cwd`, `bin/fgos.mjs:3874`), and what
  the host's F0 doors will do with each (admission; no Event Store trigger for a call that found no store, as fixed
  in the S2 close). Prove the doctor-in-a-non-fgOS-repository rule (`test/setup/checks-doctor-config.test.mjs`) maps
  to a host case.
- **F6 init.** Each step's refusal (`init.mjs:9` doc: only the machine id, the legacy settle and the Work step can
  refuse), `data` keys (`init.mjs:41`), `eventStorePlatformSupported` (`src/event-store/native.mjs:11`), what
  `initStore` = `rebuild` writes, how long it takes on this repo, and whether the first Work read already builds the
  view (if it does, record it for S7; D10 keeps the step).
- **F7 doctor processes and time.** Every spawn a doctor run makes (`git`, `bash` shell probe, `bwrap`, `curl`,
  `fgctl status --json` at `registrations.mjs:678`, host `mailbox status` at 1756, holder-lock host spawn at
  `holder-lock-checks.mjs:150`, identity probe, seat-binding host spawns, backlog `p-eiwz6yypdg`); per-row wall time
  (a temporary timing wrapper in the worktree only, never committed); medians of 15 runs for `doctor --json` in a
  fresh project and in this repo, `doctor --fix` fresh, machine load.
- **F8 uninstall.** The full plan/apply algorithm (`src/setup/uninstall-project.mjs`): every Node module it calls,
  `assertInside` (38), link refusal (`firstSymlinkUnder`, `refuseSymlink`), backup-before-change (156-160), the
  timers it removes, how it detects the git hooks it wired, every `data` key, exit 1 on `failed`.
- **F9 fix order.** The fix order on `445e65679` alternates owners (hooks, lock dirs, runtime socket dir, timers,
  six config fixes, `bin-discovery-cache`, confinement and credential fixes, identity, Event Store, Workflow case
  bindings, three Git fixes); list every fix with its owner after S4 and count the consecutive bridged segments (each
  is one bridge call, D5); name every known ordering edge (e.g. `copy-to-destination` before the machine files,
  `spec.md:799`).
- **F10 platform branches.** Every `process.platform` / `win32` / `darwin` branch in the moved modules (timers:
  systemd and launchd, Windows none; hook files and `.cmd` launchers; agy paths), so the Rust `cfg` matches.
- **F11 tooling users.** `scripts/lib/mailbox-live-confined.mjs:39` (imports `agent-hooks.mjs`),
  `scripts/fgos-session-start-hook.mjs:13` (imports `detectRcFiles`; wired in `.claude/settings.json:162`, D18),
  `scripts/install-git-hooks.mjs:14-24` (imports `git-hooks.mjs`, D17), `scripts/build-skill-wrappers.mjs:14`
  (imports `skill-wrappers.mjs`), `scripts/event-store/forge-probe.sh:25` (imports `fixGitFetchMapping` from
  `git-checks.mjs`), `scripts/regenerate-observe-fixtures.mjs:22`, `src/setup/agent-cli-trust.mjs`, the MAIL
  experiment files `scripts/lib/mailbox-behaviour-v7{e,h,i}.mjs` (frozen `ADDED` sets list `src/setup/agent-hooks.mjs`)
  and `test/scripts/mailbox-behaviour-v7h.test.mjs:30-44`: what each needs after the move.
- **F12 skill ownership in uninstall.** Known: `generatedSkillDirs` (`src/setup/skill-wrappers.mjs:752-778`) takes a
  stamped directory as fgOS's (772) and reports an unstamped directory with an owned name as foreign (773); the owned
  names come from `ownedSkillNames(packageRoot)` (`uninstall-project.mjs:66`). Confirm the payload root it reads in a
  release, the `_shared` and `isOwnTmpFile` rules, and the vector cases D8's contract needs.
- **F13 wire-agents.** The `claude plugin` calls, backups, `--json`, HOME handling, `absent`, `failed`, exit
  (`src/setup/agent-wiring.mjs`; `verb-exit.mjs:10`); the doctor rows whose messages name `fgos wire-agents`
  (`agent-wiring.mjs`, `agy-permissions.mjs`, `mailbox-claude-accept.mjs`) and the tests asserting those strings.
- **F14 registry users outside doctor.** `src/verbs/merge/iron-law-level.mjs:11` imports `IRON_LAW_LEVELS`,
  `DEFAULT_IRON_LAW_LEVEL` from `registrations.mjs`: where those constants belong after the registry shrinks; the
  bridged row `runner-patterns-config` and `retiredJsonAdvice` (`registrations.mjs:107`, from `runner-config-conversion.mjs`).
- **F15 every text naming `fgos setup`.** Found on `445e65679` (`grep -rn "fgos setup" src apps packages scripts core
  domains bin .githooks README.md`): user-facing messages `src/setup/registrations.mjs:451` (the retiring rc row) and
  954 (hooks path row), registry descriptions `src/cli/command-registry.mjs:1098, 1320, 2339` (and the generated
  `command-manifest.json`), the mailbox limits contract (`packages/mailbox/contracts/limits.v1.json:34`: key
  `mailbox.enabled` has `"reader": "setup"`; its test `packages/mailbox/rust/core/tests/limits_contract.rs:7`),
  `core/config-standard/mailbox.yaml:93`, `core/config-schema/mailbox.schema.yaml:288`, `apps/fgos/src/help.rs:989-995`,
  `apps/fgctl/src/help.rs`, `README.md`; code comments only (`src/setup/bin-discovery.mjs:8, 111, 116`,
  `src/state/worker-slots.mjs:54-69`, `packages/seat-binding/rust/src/tier.rs:2`, `packages/mailbox/rust/store/src/limits.rs:108`,
  `scripts/fgos-shell-integration.sh:21`); test names in `scripts/check-decision-codes.baseline.json:222-224`; 166
  files under `docs/` (most are dated knowledge history and stay). The Event Store lock refusal already names
  `fgos doctor --fix` (`packages/event-store/rust/src/locks.rs:131`).
- **F16 refusals of each arm.** Every `requireField`, explicit `StoreError` and plain `Error` of the five arms with
  text and category; each becomes a parity case.
- **F17 collisions.** Re-read the program board rows MAIL, WORK, RULE, TEST, CFG and S1's state; `git log` for
  `plans/261023-1649-yaml-config-slice-c-node-door-cutover` and `plans/261106-1216-doctor-readiness-only` phase 09;
  `origin/spike/paseo-external` (adds a doctor row and edits `apps/fgos/src/main.rs`); ask MAIL about its frozen
  experiment file sets (F11); list any other open branch touching `src/setup/`, `packages/distribution/` or the host
  list files.
- **F18 `active-release-matches-checkout`.** It uses the release builder's source enumeration
  (`setup-doctor-registry.md:105-114`; the row imports `scripts/build-rust-distribution.mjs`). Is the source walker
  available in Rust (an `fgos-git` or `fgos-distribution` function)? If not, say what 07 needs: the walker moved into
  Rust and called by the builder, or the row bridged as repository tooling with its own item.
- **F20 existing `doors` rows naming S4 files.** Every row whose `allowed` or `debt` names a file S4 edits or deletes
  (known: "installation shim and activation record location" allows `src/setup/project-launcher.mjs`; "writer and
  session id environment" allows `src/setup/agent-hooks.mjs` and `registrations.mjs`; "locate and read a project config
  file" allows `runner-config-conversion.mjs`; "compose Git status and recovery", "global fgOS directory", "resolve the
  invocation root"; the process-control and `/proc` rows name `scripts/lib/mailbox-live-confined.mjs`), with the phase
  that edits each.
- **F21 the bridge's environment.** What `execute_legacy_cli` gives its child (`legacy_exec.rs:198-293`: environment,
  guard, signal forwarding through `CHILD_PID`); which bridged rows spawn a legacy host route (they fail under the
  guard today too); the longest bridged row (for the deadline); `init`'s own worktree guard and the end trigger it runs
  today (F5, F6).
- **F19 one-door check of the new jobs.** For each job S4 gives a door row (plan exit criterion 5), list every place
  that does it today in Node, Rust and scripts (`rg` the primitive: hook file names `.claude/settings.json`,
  `.codex/hooks.json`, `.agents/hooks.json`; `systemctl`, `launchctl`; `coexistence.json`; the stamp header;
  `registerCheck`), so each row's `allowed` and `debt` start complete.

## Behaviour pinned so far (from the code on `445e65679`; 00 confirms each row, the verb phase turns it into cases)

| Verb | argv | `data` on success | Exit and refusals |
|---|---|---|---|
| `doctor` | `--fix`, `--strict`, `--pretty`, `--dir` (`command-registry.mjs:2384-2412`) | `{ok, next[], fixed?[{id,changed,message}], checks[{id,description,passed,status,message,fix?,detail?}]}` | 0; 1 with `--strict` when `!ok` (`verb-exit.mjs:14`); thrown errors per category |
| `init` | `--dir` (strict-cwd) | `{dir, detectedHarnesses, legacyConfig?, legacyConfigNote?, legacyConfigWarning?, workStore?, workStoreNote?, config, gitHeadless?, gitRecovery?, gitRecoveryWarning?}` | 0 ready, 4 refused, 1 failed (`command-registry.mjs:452-456`) |
| `uninstall` | `--yes`, `--dry-run`, `--dir` | `{applied, hooks[], skills{removed,kept,foreign,skipped}, changes[], keeps[], leftToYou[], backups[], failed[], hooksUnwired, hooksSkippedExisting, shellRcSourceLinesFound[], shellRcRemovalInstructions}` | 1 when `failed` is non-empty (`verb-exit.mjs:12`); `refusing to remove … not inside` |
| `wire-agents` | `--yes`, `--json`; ignores `--dir` | `{agents[{agent,changes[],permissions[]}], absent[], files[], applied, backups?, done?, failed?}` | 1 when `failed` is non-empty (`verb-exit.mjs:10`) |
| `setup` | `--pretty`, `--dir` | (retired) | after 11: "unknown verb", exit 4 |

## Parity cases (one list per verb; the verb phase writes the file)

For each verb: every success shape, every refusal (F16), `--dir` forms (a project, a non-project, a linked worktree,
a subdirectory), a `--flag=value` token (refused as unknown, S2/S3 rule), a missing project shim where relevant.
Comparison: `semantic-json` for envelopes (minus `generated_at`), `exact-bytes` for stderr refusals, `fs-delta` for
writes on a fresh fixture per entry (HOME included for `wire-agents` and `doctor --fix`). Doctor fixtures (at least):
a fresh `git init` project with no `.fgos`, a project after `fgctl init`, this repository, a project with a broken
config file, a project with hooks wired by an older release, a linked worktree. Mark each case whose host answer
differs by an accepted change (plan.md Outcome).

## Baselines

- `node scripts/git-one-door-scan.mjs --root .` summary (undeclared count; `git-driver`, `sandbox-door` classes).
- Route counts (79 selectors: 65 `legacy-cli`, 14 native on `445e65679`; `catalog.rs:369` count 31).
- Medians of 15 runs through the staged host: `doctor --json` (fresh project, this repo), `doctor --fix` (fresh),
  `init` (repeat), `uninstall` (plan), `wire-agents` (plan, fake HOME), `setup` (for the record); per-row time (F7).
- `cargo check` msvc and darwin for `fgos`, `fgos-distribution`, `fgctl`.

## Files

- Create: the report only. Modify: none. Delete: none. Tests retired: none.

## Acceptance

- Prior-art table re-verified (sha + one line); F1-F21 answered with `file:line`; the row ownership table complete
  (every live row and fix, counts per owner); parity case lists for all four verbs; baselines with commands and load.
- Any fact that changes a phase's design reaches the step lead before 03 lands, naming phase and line.

## Risk and rollback

- A late fact changes a phase mid-way (M x M): wave-A phases may build Rust modules at once, but no flip lands before
  this report. Rollback: nothing to roll back.
