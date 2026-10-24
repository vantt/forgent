---
title: "YAML Document + Config foundation, Slice D: confinement mask, machine files, native verbs, migration, doctor, comment renderer"
description: "G6 through the Confinement Authority, then ~/.fgos/private with accounts.yaml and gateway-token, the account and token moves, the fgos config verbs, project migration with tombstone, the section 11 doctor rows (through a minimal native-door entry) and the comment renderer for existing files."
status: in-progress
priority: P1
effort: 85h
branch: cfg/slice-d (linked worktree; never the shared main checkout)
tags: [config, rust, confinement, migration, doctor, machine-files]
lane: CFG
spec: docs/platform/config/spec.md
created: 2026-10-23
---

# YAML Document + Config, Slice D

Specs (signed 2026-10-22, amended 2026-10-23): [Config](../../docs/platform/config/spec.md) sections 3, 8, 9, 11, 13, 15 (source of truth), [YAML Document](../../docs/platform/yaml-document/spec.md), [Confinement Authority](../../docs/specs/confinement-authority.md) section 9.2, [Secrets](../../docs/platform/secrets/spec.md) open question 4. Board row: CFG in [the program board](../261017-1313-fgos-platform-program-board/plan.md). Built on: [Slice B plan](../261023-1018-yaml-config-slice-b-config-crate/plan.md) (crate `fgos-config`, landed 2026-10-23 15:00, 2,372 source lines) and Slice A (`fgos-yaml-doc`). Owner-approved order: **D before C**.

> Frame approved by the owner 2026-10-23 20:19 (D first; C landing A in parallel).

> Ceiling raised by the owner 2026-10-24 09:13 (option A): Slice D source ceiling **3,300 lines** (measured 2,181 added / 97 removed after phases 00-08); per-phase caps stand for the remaining phases, and a phase that would pass its cap stops and reports.

## Outcome

1. **G6 closed through the Confinement Authority.** The spec lists machine-private host roots hidden from every confined dispatch whatever its `hostRead` (first entry `{home}/.fgos/private`), with a dated decision line; the bwrap driver masks them with the existing `--tmpfs` directory mask; a harness probe proves it under every built-in policy. Config declares the path, never masks. The same list answers Secrets open question 4 (Secrets adds its paths later as list entries).
2. **Machine files.** `~/.fgos/private/` (0700) holds `accounts.yaml` and `gateway-token` (0600). Account pools and the token move out of `~/.fgos/config.json` in two stages (copy, then remove the source after the per-machine check). Every reader moves in the same change and the old read path is deleted (L10): the gateway reads the token file; the lease, probe, doctor and `dispatch` readers get accounts from the new file. `fgos setup` creates the directory and the token file.
3. **`fgos config show|explain|standard|check|set|unset|patch|migrate|refresh-docs`** as native verbs of the Rust host over `fgos-config`.
4. **`fgos config migrate`** for projects: JSON to YAML with generated doc lines, `[migrate]` reasons, redundancy drop with `--accept-machine-overrides`, Canonical JSON equivalence, tombstone, backups under `.fgos/runtime/config-migrate/` and `~/.fgos/private/config-migrate/`, `$comment` conversion. This repository's project file (it holds `gateway` and the dead `lock` key, which the new snapshot refuses) is the first real input; the live run is parked on owner gate G-D1 (see below, it cannot land before Slice C's readers).
5. **Doctor rows of spec section 11**, computed in Rust (`config.check`) and registered in Node through one thin module. Decision on ordering, below: Slice D adds the minimal native-door entry (`check`, `fix`, `accounts`); the rows land in D, not C.
6. **Comment renderer and `refresh-docs`** for existing files (`@fgos:doc` drift and missing lines; idempotent; never touches `@fgos:why` or free notes).

## Honest ordering of the doctor rows and the door (item 5)

Node reaches Rust only through the native door (owner decision, no spawn), and the door's `config` namespace is spec section 12 / Slice C. Three things force D to open it: (a) the existing doctor row `gateway-token-configured` and every account reader must read `~/.fgos/private/*`, and Node must not parse YAML (`src/util/yaml.mjs` is the tool profile, not a config reader); (b) the rows for permissions, wrong-file keys and `config-secret-outside-private` are the check side of the moves this slice makes; (c) shipping the moves without their rows leaves the machine files unwatched. So **D creates the `config` namespace with the three entries its consumers need: `check` (all section 11 rows, findings only), `fix` (named repairs from `doctor --fix` and setup), `accounts` (the machine inventory, readable without a valid project file)**. Slice C adds `snapshot`, `explain`, `applyPatch` and the facade to the same namespace and moves the remaining readers and writers. Nothing in the door is duplicated later: `accounts` stays the machine-only read, `snapshot` answers the project question. Slice C's scope list below is adjusted to match.

## Phases

| Phase | Content | Owning proof | Waits for |
|---|---|---|---|
| [00](phase-00-facts.md) | Prior art, exists vs missing, reuse, enumerated readers, board start line, impact gate, worktree. No code. | facts re-verified with file:line | - |
| [01](phase-01-confinement-spec-amendment.md) | **G6, first.** Amend the Confinement Authority spec (machine-private roots, dated decision line, probe requirement), Secrets question 4 answer, Config G6 note. Board post and collision check first. Docs only. | spec text re-read against code; links resolve | 00 |
| [02](phase-02-confinement-mask.md) | `MACHINE_PRIVATE_ROOTS`, resolver, always-on `--tmpfs` mask, refusal, attestation, probe `machine-private-hidden` under every built-in policy, driver version bump | harness probe (real bwrap) + `dispatch-confinement-machine-private.test.mjs` | 01 |
| [03](phase-03-crate-skeleton-and-session-class.md) | Crate additions skeleton (module stubs, deps, feature), `session_class` seam; **03b marker (owner gate G-D2)** | `tests/session.rs`; 03b: probe case in 02's harness | 00 (03b: 02, G-D2) |
| [04](phase-04-machine-files.md) | `~/.fgos/private` directory, token file rules (read, create-only), accounts-only read, mode findings | `tests/machine_files.rs` | 03 |
| [05](phase-05-key-moves.md) | Two-stage move of account pools and token out of the global JSON, destination first, snapshot tolerates a copy the destination already holds | `tests/relocate.rs` (observer seam, crash windows) | 04 |
| [06](phase-06-comment-renderer.md) | Doc scan, `Edit::Docs`, `refresh`, shared helpers extracted from the write transaction | `tests/golden_docs.rs` | 03 |
| [07](phase-07-project-migration.md) | `migrate` for a project file: conversion, drops, equivalence, tombstone, backup, resume | `tests/golden_migrate.rs`, `tests/migrate_files.rs`, older-reader test | 06 (05 for the shared failure ids) |
| [08](phase-08-findings-engine.md) | `doctor.rs` and `contracts/doctor-rows.v1.json`: every section 11 row, per-source, plus the fixes | `tests/golden_doctor.rs` | 04, 05, 06, 07 |
| [09](phase-09-read-verbs.md) | Host provider and projector: `show`, `explain`, `standard`, `check`; routes, registry entry | projector unit tests + `inspect` golden | 08, 03 |
| [10](phase-10-write-verbs.md) | `set`, `unset`, `patch`, `migrate`, `refresh-docs` | provider unit tests + one e2e per family | 09, 05, 07 |
| [11](phase-11-native-door.md) | Addon namespace `config` (`check`, `fix`, `accounts`), `versions()` marker, Node client module | `config_door.test.mjs` (one per entry) | 08, 04, 05 |
| [12](phase-12-node-doctor-and-setup.md) | `src/setup/config-checks.mjs`, retire the `gateway` default, setup creates the machine files, `gateway-token-configured` on the token file | one wiring test per row family | 11 |
| [13](phase-13-account-readers.md) | `withMachineAccounts`, every inventory reader, error texts, test fixtures | existing lease/probe/doctor tests moved to the accounts file | 11, 12 |
| [14](phase-14-gateway-token-reader.md) | `apps/fgos-gateway` reads the token file; message text | gateway unit tests | 04 |
| [15](phase-15-machine-rollout.md) | Per-machine runbook, copy stage, **owner gate G-D3** per machine for stage 2, evidence | live `fgos config check` + doctor on each machine | 05, 08, 12, 13, 14 landed and activated |
| [16](phase-16-live-migration-of-this-repo.md) | **Owner gate G-D1**: the live run on this repository's project file | rehearsal golden (phase 07) + live doctor | 07, G-D1 answer |
| [17](phase-17-docs-closeout.md) | Spec status and decision lines, distribution and runner spec lines, CHANGELOG, board, backlog, final gates, budget count | `cargo test --workspace`, `npm test`, sequential | all except 16 |

Parallelism (file-disjoint, see ownership): after 00, tracks {01 -> 02 -> 03b}, {03 -> 04 -> 05}, {03 -> 06 -> 07}, {14 after 04} run in parallel. 08 joins 04-07; 09 and 10 are sequential (same provider file); 11 joins 08; 12 -> 13 sequential (same Node setup file). A question parked on G-D1 blocks only 16; G-D2 blocks only 03b; G-D3 blocks only stage 2 on one machine.

Effort by phase (hours, excluding owner wait; sum 85): 00 2, 01 2, 02 8, 03 3, 04 5, 05 7, 06 5, 07 9, 08 6, 09 6, 10 6, 11 4, 12 5, 13 5, 14 2, 15 3, 16 2 (rehearsal; the live run is counted in Slice C), 17 4.

## File ownership (no two parallel phases touch the same file)

| Phase | Owns |
|---|---|
| 01 | `docs/specs/confinement-authority.md`, `docs/platform/secrets/spec.md` (question 4 line only), `docs/platform/config/spec.md` (G6 row, one line) |
| 02 | `src/runner/dispatch/confinement/resources.mjs`, `drivers/bwrap.mjs`, `probes/harness.mjs`, `authority.mjs` (attestation line), `policies.mjs` (re-export), `test/runner/dispatch-confinement-machine-private.test.mjs`, updated argv pins in the confinement tests listed by phase 00 |
| 03 | `packages/config/rust/Cargo.toml`, `src/lib.rs` (every new module declared as a stub here, so later phases never edit it), `src/session.rs`, `tests/session.rs`; 03b: one `--setenv` line in `bwrap.mjs` (after 02) |
| 04 | `src/machine.rs`, `tests/machine_files.rs`, `contracts/fixtures/machine-files.v1.json`, one id in `contracts/failure-codes.v1.json` |
| 05 | `src/relocate.rs`, `src/snapshot.rs` (the tolerate-a-held-copy rule only), `tests/relocate.rs`, `contracts/fixtures/relocate.v1.json`, ids appended to `failure-codes.v1.json` |
| 06 | `src/docs.rs`, `src/write.rs` (extract `produce` and `snapshot_with`, add `Edit::Docs`), `tests/golden_docs.rs`, `contracts/fixtures/docs.v1.json`, existing `tests/write_golden.rs` (only if a signature moved) |
| 07 | `src/migrate.rs`, `contracts/migration.v1.json`, `contracts/comment-grammar.v1.json` (one tag line), `tests/golden_migrate.rs`, `tests/migrate_files.rs`, `contracts/fixtures/migrate.v1.json`, `test/config/tombstone-older-reader.test.mjs`, ids appended to `failure-codes.v1.json` |
| 08 | `src/doctor.rs`, `contracts/doctor-rows.v1.json`, `contracts/fixtures/doctor.v1.json`, `tests/golden_doctor.rs`, `tests/failure_matrix.rs` + `contracts/fixtures/failure-matrix.v1.json` (appended cases for the new ids) |
| 09 | `src/inspect.rs`, `src/provider.rs` (feature `host-provider`), `apps/fgos/Cargo.toml`, `apps/fgos/src/cli_projector.rs`, `apps/fgos/src/main.rs`, `packages/host-runtime/rust/src/catalog.rs`, `packages/host-runtime/contracts/command-route-annotations.json`, `command-routes.json` (generated), `src/cli/command-registry.mjs` |
| 10 | `src/provider.rs` (append), `cli_projector.rs` (append), `apps/fgos/tests/cli_tests.rs` (config cases) |
| 11 | `packages/git/node-addon/src/config.rs`, `src/lib.rs` (module line and `versions()` key), `Cargo.toml` of the addon, `src/native/door.mjs` (marker check), `src/config/machine-config.mjs`, `test/config/config-door.test.mjs` |
| 12 | `src/setup/config-checks.mjs`, `src/setup/registrations.mjs` (gateway row and default only, plus the import line), `bin/fgos.mjs` (no change expected; setup already calls `runFixes`), `test/setup/config-checks.test.mjs` |
| 13 | `src/config/machine-config.mjs` (`withMachineAccounts`, appended), the reader sites phase 00 enumerates, `bin/fgos.mjs` (two message strings), their tests |
| 14 | `apps/fgos-gateway/src/gateway.rs`, `apps/fgos-gateway/Cargo.toml`, `apps/fgos-gateway/Cargo.lock` |
| 15 | `plans/reports/guide-*` (new runbook, name by `fgos convention name`), board `log.md` lines; no source |
| 16 | `.fgos/config.yaml`, `.fgos/config.json` (tombstone), `.fgos/runtime/config-migrate/` (ignored) |
| 17 | `docs/platform/config/spec.md`, `docs/specs/reading-map.md`, `docs/specs/distribution.md` (row 5b and the doctor row list), `docs/specs/runner.md` (account inventory location sentences), `docs/platform/component-boundary.md` (Config row), `docs/backlog.md` (p-a189ff31), `CHANGELOG.md`, board `plan.md` and `log.md` |

Shared edits handled in order: `contracts/failure-codes.v1.json` (04, 05, 07 append in that order; 08 appends none), `src/write.rs` (06 only; 07 and 10 call it), `src/lib.rs` (03 only), `bwrap.mjs` (02, then 03b), `src/setup/registrations.mjs` (12 then 13; a shared board file, post a log line first), `packages/host-runtime/contracts/command-route*.json` and `apps/fgos/src/main.rs` (HARDEN, DOC, SEAT, TEST also touch them per the board's table: merge `origin/main` first and post), `CHANGELOG.md` (17 only).

## Frame (to be approved by the owner with this plan; budget below is the proposal)

- **Scope:** the files in the ownership table and nothing else. Out of frame (ask first): any Node reader of a config file other than the account readers and the doctor rows (Slice C), the Node facade, converting the global file, the `init` door, the `detected` PATH probe, deriving the confined fact beyond the seam of phase 03, a change to a locked law, a change to the YAML Document spec, any third-party crate, a file mask in the confinement driver (directories only), Windows.
- **Budget (honest, measured against Slice B's real numbers).** Slice B planned about 1,300 Rust source lines and landed 2,372 (1.82x); it planned about 1,000 Rust test lines and landed 2,679 (2.7x) plus 12,028 fixture lines; it planned 52h and finished the crate in about 3 hours of wall clock with parallel agents. Slice D estimate: first-principles base 1,365 Rust source lines x 1.8 = about **2,450 lines of Rust source**; Rust tests about 1.1x the source (Slice B's measured ratio) = about **2,700 lines**; golden fixture JSON about 7,000 lines (data, counted apart, less than Slice B because verbs are thin); Node source about 600 lines net (cap 650); Node tests about 900 lines; docs about 250 lines; effort **85h** excluding owner wait.
- **Per-module caps (a phase that would pass its cap stops and reports in the decision-question template instead of landing):**

| Module | Phase | Cap (lines) | Base x 1.8 |
|---|---|---|---|
| `session.rs` | 03 | 40 | 20 |
| `machine.rs` | 04 | 190 | 100 |
| `relocate.rs` (+ `snapshot.rs` delta) | 05 | 280 (+30) | 150 |
| `docs.rs` (+ `write.rs` delta) | 06 | 180 (+60) | 100 (+25) |
| `migrate.rs` | 07 | 420 | 230 |
| `doctor.rs` | 08 | 400 | 220 |
| `inspect.rs` | 09 | 170 | 90 |
| `provider.rs` | 09 + 10 | 340 | 190 |
| `apps/fgos` projector, main, catalog | 09 + 10 | 330 | 150 |
| node-addon `config.rs` | 11 | 110 | 60 |
| gateway token read | 14 | 60 | 30 |

  Sum of caps: 2,610 lines. **Hard ceiling: 2,900 lines of Rust source** (all of the above, blank lines and comments included), counted by `find packages/config/rust/src packages/git/node-addon/src/config.rs apps/fgos/src packages/host-runtime/rust/src/catalog.rs -name '*.rs' | xargs wc -l` before and after (the delta is the count; the apps/fgos baseline is subtracted), reported in every commit message. Node source cap: confinement 260, `machine-config.mjs` 90, `config-checks.mjs` 140, reader and registration edits 120, command-registry entry 50 (sum 660). If the ceiling or a cap is reached the phase stops and asks; it never trims requested behaviour to fit.
- Crate size after D: about 4,800 lines of Rust source. That is a signal, not a defect (the crate is the Config component), but see Ideas I1.

## Constraints

- AGENTS.md: L10 (every mover moves every reader and deletes the old path in the same change; where a path cannot go in this slice, an item is opened and named), principle 1 one door (each phase says what it reused), principle 2 layering (the confinement list is data in the Confinement Authority's own module; Config imports nothing from it), principle 8 one proof per behaviour (table below), no test-only switch, flag or env branch (the observer seams are public parameters like `commit_observed`), RUL104 better not bigger, install/setup/doctor gate (phase 12 registers every new file expectation), conventional commits without AI references except the session attribution line.
- Resource safety: `free -g` first and at least 8 GB available (19 GB available at planning time); every cargo command carries `--jobs 4`. Crate tests first. `cargo test --workspace --jobs 4`, `npm test` and `cargo test` inside `apps/fgos-gateway` are never run together: one finishes, its exit code is read on the very next statement, then the next starts. Long runs go through the harness's background facility; wait on the concrete PID the harness returned, never on `pgrep -f`.
- Linked worktree `cfg/slice-d` only (the shared main checkout holds other sessions' unstaged work). Merge `origin/main` at the start and end of every phase and before any test used as evidence.
- Every landing on main gets one line at the top of the board's `log.md` (newest first); phases 01 and 02 post **before** editing the shared confinement files (the board's "File chung dễ va" table does not list `src/runner/dispatch/confinement/**`; the last committer is OPC/MP-B2, both done; phase 01 re-checks and says so in the line).
- Scratch under `.fgos/runtime/tmp/` (fallback `${TMPDIR:-/tmp}/fgos-work/`). Names of reports and guides come from `fgos convention name|path --json`; parallel agents pick distinct slugs.
- Impact-analysis gate: `fgos tool query --capability impact-analysis --status present`, record `full | degraded | inactive` (phase 00). Symbols edited here: `resolveConfinementResources`, `prepareBwrap`, `blindRefusals`, `runAllConfinementProbes`, `edit` and `validate` in `write.rs`, `load_sources`/`build` in `snapshot.rs`, `load_gateway_config`, `fixGatewayTokenConfigured`, `checkGatewayTokenConfigured`. Run `impact` on each before editing and `detect_changes()` before each commit; cross-check with `rg` when the index looks stale (the repo's own gate says a zero result is not proof).

## Delegation economy (suggested)

Cheapest model that does the job reliably. **Haiku:** 00 (re-verification), 03 skeleton, 14, 17 text edits, 15 runbook text. **Sonnet (default):** 01 (Vietnamese spec text), 02, 04-13, the rehearsal in 16, the final gates. **Opus** only after a failed sonnet attempt (likeliest: 05 crash-window proofs, 07 migration equivalence). **Independent sonnet review before landing:** 02 (mask ordering and the probe's falsifier), 05 (destination-first and the JSON rewrite), 07 (equivalence and tombstone), 12 (rows and fixes). `kongming` only if a design fork resists analysis; none expected.

## Owning proof per behaviour (design principle 8)

| Behaviour | Owning proof (lowest layer) | One wiring proof above |
|---|---|---|
| A machine-private root is unreadable to a confined worker under `host-write-denied` and `workspace-write`, `hostRead` allow and blind (acceptance 18, first half) | harness probe `machine-private-hidden` (real bwrap, with falsifier) | `dispatch-confinement-machine-private.test.mjs` for resolver and argv shape (pure) |
| A leased run still gets its one credential with the mask on (acceptance 18, second half) | `dispatch-confinement-credential-hygiene.test.mjs` extended by one case | none |
| Private directory and token file rules: modes, no symlink, one line, create-only (acceptance 7) | `tests/machine_files.rs` | gateway: one test reads the token file (phase 14) |
| Accounts read without a valid project file; none when confined | `tests/machine_files.rs` | door: one test per entry (phase 11) |
| Two-stage move, destination first, crash windows, destination wins (acceptance 20) | `tests/relocate.rs` | `apps/fgos/tests/cli_tests.rs` one e2e of `migrate --global` |
| Doc drift and missing lines, refresh idempotent, `why` and notes untouched (acceptance 1) | `tests/golden_docs.rs` | verb wiring in `cli_tests.rs` |
| Migration: conversion, drops, equivalence, `--accept-machine-overrides`, tombstone, resume, backups (acceptance 10, 19) | `tests/golden_migrate.rs` + `tests/migrate_files.rs` | verb wiring in `cli_tests.rs` |
| An older release refuses the tombstone and writes no `config.json` (acceptance 17) | `test/config/tombstone-older-reader.test.mjs` (today's Node reader is the older release) | none |
| Every section 11 row: semantics, severity, fix | `tests/golden_doctor.rs` | `test/setup/config-checks.test.mjs`: id, severity and fix mapping only |
| No value in any finding, `show`, `explain`, `check` output (acceptance 15) | `golden_no_echo.rs` (Slice B) with cases appended in 04 and 08 | none |
| Verb argument projection | `cli_projector.rs` unit tests | `cli_tests.rs` |
| The lease, probe and doctor read accounts from `accounts.yaml` | the existing lease, probe and doctor tests, moved to the accounts file by a fixture helper (no copies of their cases) | none |

## Test matrix

| Layer | What | Where |
|---|---|---|
| Pure, golden JSON | doc scan, migration conversion, relocation plan, doctor rows, projector | `tests/golden_*.rs` over `contracts/fixtures/*.v1.json`, one runner per fixture file |
| Real filesystem | private directory, token, accounts-only read, two-stage move, migration files and backups | `tests/machine_files.rs`, `tests/relocate.rs`, `tests/migrate_files.rs` in temp dirs |
| Real bwrap | the mask under each policy and hostRead value | harness probe, run by the test when `bwrap` works and by `fgos doctor` |
| Node unit | confinement resolver and argv, door client, doctor rows, reader switch | `test/runner/`, `test/config/`, `test/setup/` |
| End to end | one `fgos config` CLI case per verb family; one rehearsal of the real project file on a copy | `apps/fgos/tests/cli_tests.rs`; phase 07 rehearsal fixture |

## Decisions taken (inside the spec's silence; each pinned by a fixture or test, reversible by editing one)

| # | Decision | Reason |
|---|---|---|
| D1 | The G6 list is data in `resources.mjs` beside `BLIND_HIDDEN_ROOTS`: `MACHINE_PRIVATE_ROOTS = ['{home}/.fgos/private']`; `{home}` is the host home, injected for tests and probes. It reuses the resource kind `hidden-root`, the `--tmpfs` mask and `--remount-ro`. No second mechanism, no file mask. | Spec section 9: "a directory keeps the existing `--tmpfs` mechanism". One list so Secrets adds a path by adding a line and a probe case. |
| D2 | The mask applies to every confined dispatch with a mount view (bwrap) whatever `hostRead` says; a root that does not exist on the host is skipped (named limit: it must exist before the dispatch starts, so `fgos setup` creates it); a workspace, cwd or repo root inside a machine-private root is refused with `machine-private-hides-workspace` (the blind refusals' sibling). | `hostRead: allow` is today's built-in value; hiding only under `blind` is the gap the spec names. A bind view of `/` shows files created later, so the directory must exist at launch. |
| D3 | The probe `machine-private-hidden` joins the standard probe set (not blind-only), runs once per built-in policy and once more under blind; the probe fingerprint carries a digest of the list and `BWRAP_DRIVER_VERSION` is bumped. | Spec section 9: "a probe in the confinement harness checks the mask under each built-in policy"; the argv of every confined dispatch changes, so stale proofs must be refreshed. |
| D4 | The session class comes from one pure function `session_class(lookup)` in `fgos-config` (callers pass the environment lookup; the crate still reads no environment). It is fail-open and says so: the marker is set by the Confinement Authority's driver only if G-D2 is answered A. The real boundary stays the mount view (read-only root, G6 mask); the class refusal and `accounts: unavailable-confined` are politeness for a worker that did not unset the marker. | Slice B left "how does a session learn it is confined" unresolved (Unresolved 1); D's verbs and door need a class argument. The threat model is written so nobody mistakes the marker for the boundary. |
| D5 | Token file rules (read, create, validate) live in `fgos-config::machine`. The gateway links `fgos-config` by path, as it already links `fgos-yaml-doc`. Phase 14 measures the cost; if the gateway's lock grows by more than the validator's crates plus 20% build time it stops and reports (options: a lean local reader, or a leaf crate). | One authority for the token file rule; the gateway is outside the workspace with its own lock. |
| D6 | The token reader refuses a file that is a symlink, not regular, wider than 0600, or not exactly one non-empty line (<= 512 printable ASCII chars after one optional final newline) with `config-token-invalid` (reason names which, never the value). | Same discipline as the Secrets file adapter (`packages/secrets/rust/src/file_source.rs`); doctor `config-global-permissions` offers the chmod fix. |
| D7 | `accounts::read` is `build` over the accounts source alone plus the standard layer, so it needs no valid project or global file. Node merges its result into the merged runner config at the two assembly points (`withMachineAccounts`), never inside `loadGlobalConfig`. | `bin-discovery.mjs:110-121` reads the global file and writes it back whole; an overlay inside `loadGlobalConfig` would put the accounts back into `config.json` on the next cache write. |
| D8 | The snapshot ignores (with a notice, `shadowed-by-destination`) a `x-fgos-file: accounts` or `token` key found in the global JSON when the destination already holds that path; a key with no destination is refused as before. | Spec section 13: after an interrupted move "the destination wins". Without this, the copy stage would make every snapshot fail until stage 2. |
| D9 | Global moves are two stages. `migrate --global` copies (destination written and verified, source kept: safe while older releases still read the old keys). `migrate --global --finish --machine-checked` removes the source keys after re-verifying equality; without the flag it prints the machine check and refuses with `config-machine-check-required`. `doctor --fix` runs stage 1 only (copy a global-file key to its destination, source kept) and never removes a source key: a key held in both files with equal values looks the same after an interrupted move and after a finished stage 1, so removal always needs the explicit verb and the machine check. | Spec section 13 gates the removal on the machine check and requires a zero-gap activation; one-step move would break older releases or leave accounts missing between activation and move. |
| D10 | Removing keys from the global JSON is a JSON rewrite in `relocate.rs` (key order kept, two-space indent, final newline, as `writeGlobalConfig` does), under the `global-config` lock with a revision compare, after a backup. It is the only writer of a legacy JSON file and goes away with global conversion. | Slice B D11 refuses transaction writes to JSON; the removal needs a writer, and the file is not converted in this slice. |
| D11 | `migrate` builds the YAML through the write transaction's own `produce` (same comment blocks, same redundancy rule, same schema validation) and holds one `project-config` lock across: create `config.yaml` (create-only), recheck the JSON revision, write the tombstone. YAML first, tombstone second. A crash between leaves both files; `migrate` run again accepts an existing `config.yaml` whose effective value passes the equivalence check and writes the tombstone (report `resumed`); anything else stays `config-legacy-shadowed`. | A tombstone first could lose the project's values on a crash; YAML first leaves a recoverable shadow state. |
| D12 | The migrated reason is `[migrate] carried over from config.json, reason never recorded`, written after the writer-id actor like `[setup:suggested]`; the tag is one line in `comment-grammar.v1.json`; `config-comment-migrated-why` keys on that tag. The spec's `@fgos:why [migrate] ...` text is amended to say so. | Spec section 7: the actor is never typed by the caller; a tag in the reason is the existing mechanism. |
| D13 | Retired paths and the prune-empty rule are data in `contracts/migration.v1.json` (first entry `lock.predecessorKillWaitMs`, with the reason and the commit `a620881e7`). | Spec section 10 names the key; data keeps the next retirement a one-line change. |
| D14 | A `global-only` path in a project file is dropped when its value equals the standard or is `null`; any other value aborts naming the path. An account or token key in a project file aborts with `config-key-in-wrong-file`. The migration never moves a project value into a machine file. | The project file is untrusted for machine keys (spec section 3); promoting a value would be the takeover the scope rules exist to stop. This repository's `gateway` section (port equal to standard, token null) falls under the first sentence. |
| D15 | A `$comment` whose text equals what the schema would render as doc lines is dropped; any other `$comment` text becomes plain `#` notes above its parent key (never an `@fgos:` line); the key is removed. | Spec section 13 says `$comment` becomes doc lines; doc lines belong to Config's render (a foreign one is `config-doc-drift`), so foreign text becomes a free note. Spec amended. |
| D16 | Backup file names are the first 16 hex digits of the content revision plus the original name (no clock in the crate), created create-only at mode 0600 in directories at 0700; age is the file's mtime. | Deterministic, idempotent on a re-run, no time dependency. |
| D17 | `migrate --dry-run` runs everything except the writes and prints the report. | The owner must see the drop list and the machine-override paths before accepting; the real-file rehearsal needs it. About 10 lines. |
| D18 | `patch <file>` takes a YAML or JSON list of `{set: <path-text>, value: <any>}` and `{unset: <path-text>}`; `set` and `unset` pick the target file from the schema (`x-fgos-file`, then scope: `global-only` -> global, otherwise project) and accept `--global` to choose the global file for a `both` key; the expected revision is read just before the commit. | Spec section 11 names the verbs and leaves the file format and target choice open. |
| D19 | Severities live in `doctor-rows.v1.json`, not in code: `config-format-legacy-json` warns until Slice C raises it (every project is still legacy JSON when D lands); `config-doc-drift` warns in doctor and fails in `fgos config check`; `config-schema`, `config-parse`, `config-legacy-shadowed`, `config-key-in-wrong-file` (no destination) and `config-global-permissions` fail; the rest warn. | Spec section 7 and 11; the contract file keeps one source. |
| D20 | `config.check` evaluates each source on its own (a broken project file does not hide global, accounts or token findings) and returns findings that carry row id, file, line, column, path and fix id, never a value. | Spec section 9 no-echo rule; doctor must still report the machine files when a project file is broken. |
| D21 | The door's `config` namespace in D: `check`, `fix`, `accounts`. Slice C adds `snapshot`, `explain`, `applyPatch`. | Section "Honest ordering". |
| D22 | `trusted_root` for the verbs and the door is `RepoHandle::trusted_main_root()` of `fgos-git` (the function `fgos identity project` already uses, `packages/identity/rust/src/project.rs:144`). | Reuse; Slice B D2 left resolving the main checkout to the caller. |
| D23 | The `gateway` `registerConfigDefault` (`src/setup/registrations.mjs:2970`) is deleted in this slice: it seeds a `global-only` section (and `token: null`) into every project file, which is how this repository's project file got `gateway`. The standard file `core/config-standard/gateway.yaml` holds the port. The doctor row id `gateway-token-configured` stays and reads the token file. | L10: the token key leaves config; leaving the seed would recreate the key. |
| D24 | Converting the global file to YAML is not built. `migrate --global` means the two-stage key move only. | Spec section 13 defers it until no release on the machine reads the JSON; it is not in the approved scope list. |
| D25 | Doctor rows register in a per-area module `src/setup/config-checks.mjs` imported once from `registrations.mjs`, the pattern of `seat-binding-checks.mjs` and `identity-checks.mjs`. | The spec's "registered in `src/setup/checks.mjs`" is out of date: that file is a re-export shim (`src/setup/checks.mjs:1-8`). |

## Risks (likelihood x impact)

| Risk | L x I | Mitigation | Phase |
|---|---|---|---|
| The mask changes the argv of every confined dispatch; a pinned test, a probe cache or a live dispatch breaks | M x H | phase 00 lists every pin; driver version bump forces re-probe; real-bwrap probe with falsifier; independent review; rollback is one revert | 02 |
| A worker's own workspace or a grant lies under `~/.fgos/private` | L x M | refusal `machine-private-hides-workspace` before launch; nothing in the default config puts one there | 02 |
| The private directory does not exist when a dispatch starts, so nothing is masked | M x M | `fgos setup` and the doctor fix create it; named limit in the spec; doctor row `config-machine-files` fails when missing | 02, 12 |
| Activation of the readers happens before accounts are copied: leases and the gateway fail on that machine | M x H | stage 1 copy is run on each machine before or at activation (runbook); stage 2 only after the machine check; the readers' error names the file and the verb | 13, 14, 15 |
| An older release on a machine loses its accounts or token | L x H | stage 2 never runs without `--machine-checked`; `doctor --fix` never removes a source key; G-D3 owner evidence per machine | 05, 15 |
| The migration changes an effective value (other projects hold stale seeds) | M x H | equivalence check on every run; machine-override list needs the flag; rehearsal on a copy of this repository's file; backup; `--dry-run` | 07 |
| Every other project's legacy JSON fails `config-schema` the day the rows land | M x M | phase 08 runs `check` read-only over every config file on the owner machines before the rows are registered and records the results; a failure is data for the schema owner or a named warning | 08, 12 |
| The new snapshot rule (D8) hides a real wrong-file key | L x M | applies only when the destination holds the same path; notice and doctor warning keep it visible; golden cases for equal, unequal and absent destination | 05 |
| JSON rewrite of the global file reformats it or drops content | L x H | key order and unknown content preserved, byte-for-byte golden on a representative file, backup first, revision compare | 05 |
| The tombstone lands while Node readers still parse `config.json`: this repository breaks | H x H if done early | G-D1 and phase 16 forbid the live run before Slice C's readers; rehearsal only in D | 16 |
| The confined fact is a marker a worker can unset | M x L | the boundary is the mount view; stated in D4 and the spec; no behaviour depends on the marker for safety | 03 |
| Gateway build cost grows with `fgos-config` | M x L | measured in phase 14 against the D5 threshold | 14 |
| Source budget exceeded (Slice B ran 1.82x over) | M x M | per-module caps, ceiling 2,900, running total in every commit message | all |
| Shared files collide with other lanes (`registrations.mjs`, routes json, `main.rs`) | M x M | board post first, merge `origin/main` at every phase start, land second rebases | 09, 12, 13 |
| Out of RAM | M x H | `free -g` gate, `--jobs 4`, sequential gates | all |

## Rollback

Each phase is its own commit group on `cfg/slice-d`; rollback is `git revert` of its commits. 01 docs only. 02 reverts to the old argv (the list and probe go together; stale probe proofs refresh themselves). 03-08 new crate files plus the two small edits in `snapshot.rs` and `write.rs`, reverted with their phase. 09-11 new route, provider and addon namespace, nothing else calls them. 12-14 are the reader switch: reverting restores the old readers, but only valid while accounts and token are still in `config.json` (stage 2 not run); once stage 2 ran, rollback of the readers needs `fgos config migrate` in reverse, which this slice does not build, so **the order is: land and activate 12-14, run stage 1 everywhere, wait, only then stage 2 per machine**. 15 is runbook text and per-machine actions with backups. 16 is reverted by restoring the backup (command in the report). 17 docs only.

## Owner gates (decision-question template, core/skills/_shared/decision-question.md)

Slice-level frame approval: the scope, the budget (2,450 estimate, 2,900 ceiling), the doctor-rows-in-D choice and the three gates below. Gates are posted when their phase is reached, each parks only what it names.

### G-D1: when does this repository's project file get migrated for real? (parks phase 16 only)

**What is happening.** The scope says this repository's project file is the first real migration, because the new snapshot refuses it (`gateway` section, dead `lock` key) and Slice C must not cut over before it is migrated. But the migration leaves `.fgos/config.json` holding the tombstone text, and until Slice C every Node reader parses `.fgos/config.json` as JSON (`src/config/shared-config-file.mjs`, seven direct readers, `readSharedConfig`): the day the tombstone lands, every `fgos` verb in this repository fails. D is ordered before C, so the real run cannot happen inside D without a second Node config path.

**Cause.** Checked: `rg readSharedConfig src` and the board's reader list (phase 00 records the count); the tombstone is exactly the text older releases must fail on (spec section 13), and today's Node reader is such a release for this purpose.

**Options.**
- **A. Build and rehearse the migration in D (full run on a copy of the real file, report, equivalence, tombstone against today's reader), and run the live migration as the first step of Slice C's cutover landing, in the same change that moves the readers.** Gain: no second JavaScript config path; the file is migrated exactly once. Harm: "first real migration" happens in Slice C's landing, not D's. Cost: none extra.
- **B. Run the live migration in D and keep this repository working with a tombstone-aware Node reader until Slice C.** Gain: D closes completely. Harm: a JavaScript config reader that C then deletes (against the owner's "JavaScript does not implement this layer" and L10), about 60-80 lines plus tests. Cost: that plus risk to every Node verb in this repository.
- **C. Run it live in D and accept this repository's `fgos` verbs being broken until Slice C.** Gain: none worth having. Harm: the repository that builds fgOS cannot run fgOS. Not offered as viable.

**Recommendation.** A. The rehearsal on the real file proves everything D can prove; the only thing deferred is the final file swap, which is cheap and belongs with the readers it protects.

**Scope of the answer.** A yes authorizes: phase 16 stays parked until Slice C's cutover phase and is then executed there by the same command. It does not authorize: skipping the rehearsal, or touching any other project's file.

### G-D2: how does a session learn it is confined? (parks phase 03b only)

**What is happening.** The write doors must refuse a confined session (`config-write-confined`) and a confined snapshot has no accounts layer. The crate takes the class as an argument; no primitive in the repository says "this session is confined" (Slice B Unresolved 1; `rg` over `packages` and `src` finds none).

**Cause.** Checked: the bwrap driver puts no marker in the worker's environment (`drivers/bwrap.mjs:594` builds `resolvedEnv` from the invocation only); `fgos-identity` resolves a writer from the process tree and has no such fact.

**Options.**
- **A. The driver sets one marker variable in the confined worker's environment; `session_class` reads it.** Gain: a real class today for both doors, about 20 lines (driver line, function, one probe assertion). Harm: a worker can unset it; the marker is politeness, the mount view stays the boundary (stated in the spec). Cost: one `--setenv` pair in the argv (the file phase 02 already changes).
- **B. Defer: `session_class` returns `Unconfined` and Slice C decides.** Gain: nothing built that might be wrong. Harm: acceptance 14 and the confined-accounts refusal are untested in D; a confined worker that finds a binary is treated as unconfined by the doors (the filesystem still stops it writing config).
- **C. A process-tree or namespace fact in `fgos-identity`.** Gain: not forgeable by env. Harm: cross-lane (IDENT), about 120 lines, false positives in containers. Cost: a design review.

**Recommendation.** A. It gives the doors a real input now, costs one driver line, and Slice C can replace it with a stronger fact without changing the function's signature.

**Scope of the answer.** A authorizes the `--setenv` marker and the read in `session_class`. It does not authorize treating the marker as a security boundary, a change to `fgos-identity`, or any dependence of safety on it.

### G-D3: machine check per machine before stage 2 (parks stage 2 on that machine only; phase 15)

**What is happening.** Stage 2 removes `runner.llmAccounts`, `runner.providers.<p>.accounts` and `gateway.token` from `~/.fgos/config.json`. Any release still installed on that machine that reads those keys will lose accounts or the token.

**Cause.** The check is a fact about the machine, not about the repo: list every activated release (`~/.fgos` releases, each project's `.fgos/installation/activation.json`) and confirm each contains this slice. On the main machine there is one release and one project (spec gate G2); the second machine is unchecked.

**Options.** A. Owner confirms (per machine) that every release is at or above this slice, then runs stage 2. B. Leave the keys in both files indefinitely (safe, doctor keeps warning `config-key-in-wrong-file`). C. Run stage 2 without the check (not offered).

**Recommendation.** A on the main machine once phase 13 and 14 have run there for a few days; B on the second machine until it is checked.

**Scope of the answer.** A yes authorizes `fgos config migrate --global --finish --machine-checked` on the named machine, with the backup the verb writes. It does not authorize any other machine.

## Slice C after D (scope list kept consistent)

C keeps: the native-door entries `snapshot`, `explain`, `applyPatch` in the `config` namespace D created, the Node facade replacing `src/config/*`, moving every remaining reader (seven direct readers of `config.json`, `mergeWithGlobalConfig`, the five `JSON.stringify` writers, the write-on-read) and deleting the old paths, the real `detected` PATH probe and the executor template data, `init` and its setup call, the main-checkout `trusted_root` for the door's `snapshot` (D reuses `trusted_main_root`), the stronger confined fact if wanted, `LOCK_FILES` rows for the two new locks in `src/setup/holder-lock-checks.mjs`, `.githooks/pre-commit` running `fgos config check`, retiring the other 13 `registerConfigDefault` calls and `DEFAULT_RUNNER_CONFIG`, the architecture test "no config read outside the facade", raising `config-format-legacy-json` to a failure, and (if G-D1 = A) **the live migration of this repository as its first step**. C no longer carries: doctor rows, the `fgos config` verbs, `~/.fgos/private` creation, migration, the comment renderer, G6. Slice C's own precondition from D: every machine has run stage 1 (the snapshot refuses a wrong-file key that has no destination).

## Success criteria (observable)

- `cargo test -p fgos-config --jobs 4`, `cargo test -p fgos --jobs 4`, `cargo test --manifest-path apps/fgos-gateway/Cargo.toml --jobs 4` green; `cargo clippy` with `-D warnings` and `cargo fmt --check` clean on the touched crates; node tests named in each phase green.
- Acceptance 18: in the harness, under `host-write-denied` and `workspace-write`, `hostRead` allow and blind, the worker gets `ENOENT` for a planted file under a fake `~/.fgos/private`, the falsifier (mask removed) reads it, and a leased run still gets its one credential. Probe results are attached to the landing line.
- Acceptance 1, 7, 10, 12 (wrong-file part), 15, 17, 19, 20 each have a named passing test; acceptance 14 and the `unavailable-confined` refusal pass if G-D2 = A, otherwise they are recorded as Slice C's.
- `fgos config check` on a copy of this repository's project file reports the `gateway` and `lock` findings; `fgos config migrate --dry-run` on the same copy lists the drops, passes the equivalence check, and the migrated copy passes `fgos config check` with no failure; today's Node reader throws on its tombstone and writes nothing.
- On the owner's main machine after phase 15: `~/.fgos/private` is 0700, `accounts.yaml` and `gateway-token` are 0600, `fgos config check` and `fgos doctor` show no failure from the new rows, the gateway starts from the token file, one nested lease works, and stage 1 left the old keys in place (doctor warns `config-key-in-wrong-file`, severity warn, until stage 2).
- Budget: Rust source at or under 2,900 lines (target about 2,450), Rust tests about 2,700, fixtures about 7,000, Node source at or under 660, reported in the landing commit and board line.
- `rg -n "gateway\.token" src bin apps --glob '!target' --glob '!*.md'` finds no reader of the token in config files; `rg -n "runner\.llmAccounts of ~/.fgos/config.json" bin src` finds nothing.
- `cargo test --workspace --jobs 4` and `npm test` green, run sequentially; the existing 18 red `npm test` cases (backlog p-5d2e1c9a) are not made worse.

## Ideas for the owner (beyond the spec; none is in the budget unless chosen)

| Idea | Problem and evidence | Benefit |
|---|---|---|
| I1. Split `fgos-config` into a leaf (`fgos-config-core`: schema, snapshot, write) and a use-case layer (migrate, doctor, relocate, verbs) | After D the crate is about 4,800 lines in one package; the gateway pulls the whole validator graph only to read one file (D5). | Smaller dependency edge for the gateway and addon; clearer layering. Costs a mechanical move and a second Cargo.toml (about 150 lines of moves, no behaviour change). |
| I2. `fgos config token rotate` | The token is never rotated: `fixGatewayTokenConfigured` is idempotent by design (`registrations.mjs:2945`), and a leaked token has no remedy. | A reasoned rotation (write new file, gateway restart message) in about 60 lines. |
| I3. Convert the global file to YAML (`migrate --global --convert`) | D24 defers it; every machine keeps two formats (spec section 13). | Ends the dual format once the machine check passes; reuses `migrate.rs`, about 100 lines. |
| I4. Prune stale backups | `config-migrate-backup-stale` only reports (D16). Backups of the global file hold accounts. | A `fgos config backups prune --older-than 30d`, about 40 lines, with the same private-directory rules. |
| I5. A file mask in the confinement driver for single secret files | Secrets question 4 also names `.fgos/secrets.local.env` (a file, not a directory) as readable by a confined worker; D1 keeps directories only. | Closes that case; needs `--ro-bind /dev/null <file>` or equivalent and a probe; about 60 lines in the Confinement Authority. |
| I6. Tùm lum seen outside scope (RUL11), each its own item if chosen | `~/.fgos/config.json.bak-20261021-llmaccounts` on the owner's machine holds an account pool outside `private/` (the new row will list it; moving it is the fix); other `registerConfigDefault` entries may seed `global-only` keys into project files (phase 00 lists them); 104 test files still write `config.json` by hand (G5). | Smaller Slice C; no stale secrets. |

## Unresolved questions

1. G-D1, G-D2, G-D3 answers (above).
2. Does the owner's second machine (spec gate G2) run any release older than this slice? Unknown until checked; it only gates stage 2 there.
3. Does Slice C want `config-format-legacy-json` as a failure from the cutover day or one release later? Left to C's plan; the row's severity is data (D19).
