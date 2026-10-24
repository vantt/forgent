---
title: "YAML Document + Config foundation, Slice C: native-door cutover (yaml and config namespaces, one Node facade, every reader and writer moved, js-yaml and src/config deleted)"
description: "Three landings: A (yaml namespace, js-yaml deleted, RUL101 superseded), B (config namespace entries snapshot/explain/applyPatch/init, crate additions, Node facade), C (the cutover: ~100 Node reader sites, 5 writers, Rust readers, fixture helper flip, guards, then the live migration of this repository as its first committed step)."
status: in-progress
priority: P1
effort: 131h
branch: cfg/slice-c-yaml (A), cfg/slice-c-door (B), cfg/slice-c (C): linked worktrees; never the shared main checkout
tags: [config, yaml, node-door, cutover, migration, rust]
lane: CFG
spec: docs/platform/config/spec.md
created: 2026-10-23
---

# YAML Document + Config, Slice C

Specs (signed 2026-10-22, amended 2026-10-23): [Config](../../docs/platform/config/spec.md) sections 5, 12, 13, 15 (source of truth), [YAML Document](../../docs/platform/yaml-document/spec.md) sections 10, 12, [Distribution](../../docs/specs/distribution.md) (RUL101, RUL107). Board row: CFG in [the program board](../261017-1313-fgos-platform-program-board/plan.md). Built on: [Slice D plan](../261023-1627-yaml-config-slice-d-migrate-and-machine-files/plan.md) (**written, not yet landed when this plan was made; every fact about D below is tagged [D-ASSUMED] and re-read by phase 00 against D as landed**), [Slice B plan](../261023-1018-yaml-config-slice-b-config-crate/plan.md) (landed, crate `fgos-config`, 2,372 source lines), Slice A (landed, `fgos-yaml-doc`). Owner-approved order: **D before C** for the config cutover; landing A touches nothing D owns except two addon files (see order).

> Frame approved by the owner 2026-10-23 20:19 (D first; C landing A in parallel).

## Outcome

1. **No JavaScript YAML parser.** `src/util/yaml.mjs` keeps `parseYaml(text, { filename })` and `describeYamlError` over the addon's `yaml` namespace (tool profile); `src/util/third-party/js-yaml.mjs` (3,614 lines) and its hash test are deleted; RUL101 is superseded by a new decision id; objects handed to JavaScript are built with define semantics; a Rust panic never crosses the boundary; one Node wiring proof per namespace.
2. **One Node config door.** The addon's `config` namespace (D opened `check`, `fix`, `accounts`) gains `snapshot`, `explain`, `applyPatch` and `init`; one facade module `src/config/facade.mjs` (it absorbs D's `machine-config.mjs`) is the only Node code that reads or writes a config file. The effective value comes from the crate (project over global over standard, accounts layer when unconfined, `command` keys from the main checkout), never from a JavaScript merge.
3. **Every reader and writer moved, the old path deleted in the same change (L10).** About 100 Node call sites in about 35 files (re-counted by phase 00), the 7 bypass readers (plus a shell reader and a second `bin` cache reader the inventory did not list), the 5 `JSON.stringify` writers, the write-on-read in `ensureRunnerConfigForDir`, `mergeWithGlobalConfig`, config-specific `mergeConfigDefaults`, the 13 remaining `registerConfigDefault` calls, `DEFAULT_RUNNER_CONFIG`, `sanitizeGlobalLayer`, `stripConfigComments`, the tier-ladder `$comment` code, `src/config/*`. Rust readers move: `apps/fgos-gateway` (the rest of `gateway.*`), `packages/herdr-fgos-common`, `packages/work-state`, `herdr-dashboard`.
4. **The cutover, once.** Landing C merges the readers, the deletions, the fixture helper flip and the **live migration of this repository** (`fgos config migrate`, Slice D's G-D1 answer A) as one change; per-machine activation follows Slice D's G-D3 evidence.
5. **Guards.** Architecture tests fail on any read of a config file outside the facade and on any YAML library outside the door.

## Scope reconciliation (the request, Slice D's "C keeps" list, and what is deliberately not built)

| Item | Where | Note |
|---|---|---|
| `yaml` namespace, js-yaml deletion, RUL101 supersession, define semantics, panic capture, one wiring proof per namespace | 01-04 | independent of D except two addon files |
| `config` entries `snapshot`, `explain`, `applyPatch` | 05-06 | `explain` and `applyPatch` have **no in-repo Node caller after the five writers are gone** (phase 00 proves it with `rg`); they are in scope because the request and spec section 12 name them and land with one wiring proof each. Option to defer: saves about 45 lines (Unresolved 1) |
| `init` and its setup call (Slice D's list) | 05, 06, 15 | a fourth door entry; consumer is `fgos setup` |
| Real `detected` PATH probe and the executor template data (Slice D's list) | 05 | Rust, data in a contract file; the JS copy in `config.mjs` dies in 10 |
| Facade replacing `shared-config-file.mjs` and `global-config.mjs`; all readers and writers moved | 07, 10-16 | |
| `trusted_root` from the main checkout, session class into the snapshot | 06 | D22 helper reused; the confined fact stays D4's fail-open marker (the "stronger fact" is **not built**, Ideas I6) |
| Rust readers moved (gateway rest, herdr, work-state, dashboard) | 16 | |
| `LOCK_FILES` rows for the two locks, `.githooks/pre-commit` runs `fgos config check` (Slice D's list) | 17 | |
| Retire the 13 `registerConfigDefault` calls, `DEFAULT_RUNNER_CONFIG` | 10, 14 | D deleted the `gateway` one (D23) |
| `config-format-legacy-json` raised to a failure (Slice D's list) | 22 | data edit, after rollout evidence (decision C17) |
| Architecture tests: no config read outside the facade, no YAML library outside the door | 03, 19 | |
| Fixture helper flip | 18 | one change in `test/helpers/config-fixture.mjs` |
| Live migration of this repository | 21 | first committed step of landing C |
| Cutover preconditions as a stopping phase | 20 | |
| **Not built:** a stronger confined fact, `fgctl init` writing the header-only file, converting the global file (D24), a JavaScript fallback anywhere, Windows (gate G4) | | named so nobody assumes them |

## Landings and order (why three)

The new snapshot refuses this repository's project file (a `gateway` section on a `global-only` node, the dead `lock` key) and every Node verb reads that file, so reader moves cannot land one by one on main: the first reader that lands breaks every verb here until the file is migrated, and the migration (a tombstone) breaks every reader not yet moved. Hence **one cutover change**. Everything that is purely additive lands earlier, so the cutover diff is only the risky part:

| Landing | Phases | What changes at runtime | Branch |
|---|---|---|---|
| **A** yaml door | 00 (yaml part), 01-04 | every YAML parse goes through the addon; js-yaml gone | `cfg/slice-c-yaml` |
| **B** additive config door | 05-08 | nothing calls it yet: crate additions, addon entries, facade, cost measurement | `cfg/slice-c-door` |
| **C** cutover | 09-23 | readers and writers move, files deleted, this repository migrated, guards on | `cfg/slice-c` |

A may start before D lands except where it shares files with D phase 11 (`packages/git/node-addon/src/lib.rs`, `Cargo.toml`, `src/native/door.mjs`): the later lander rebases. B and C wait for D landed on main (D phases 00-15, 17; D phase 16 is the rehearsal this plan's phase 21 executes live).

## Phases

| Phase | Content | Owning proof | Waits for |
|---|---|---|---|
| [00](phase-00-facts.md) | Prior art, D as landed, enumerated readers/writers/tests/YAML consumers, per-reader outcome table, board start line. No code | facts re-verified file:line; D-ASSUMED tags resolved | A: nothing. B, C part: D landed |
| [01](phase-01-addon-yaml-namespace.md) | Addon `yaml` namespace, the shared `marshal` helper (JSON text out, panic guard, failure shape) | `marshal.rs` unit tests; yaml-doc goldens (Slice A) own parse semantics | 00 |
| [02](phase-02-yaml-door-repoint.md) | `src/util/yaml.mjs` over the addon, `describeYamlError`, ABI marker, Node wiring proofs, retire the Node-test mapping fixture | `test/util/yaml.test.mjs` (wiring only) | 01 |
| [03](phase-03-delete-js-yaml-and-yaml-guard.md) | Delete js-yaml and its hash test; YAML guard rewritten; scripts that parse YAML outside a release stage the addon; cargo-deny bans | architecture test (YAML guard) | 02 |
| [04](phase-04-landing-a-docs.md) | RUL101 supersession (new id), spec status lines, CHANGELOG, backlog, board; landing A | text re-read against code | 03 |
| [05](phase-05-crate-additions.md) | Crate: `init`, machine view, `PathDetectors` + `detected.v1.json` | `tests/golden_init.rs`, `tests/detect_path.rs`, `tests/machine_view.rs` | 00, D landed |
| [06](phase-06-addon-config-entries.md) | Addon `snapshot`, `explain`, `applyPatch`, `init`; class, trusted root, cache, `sections`; marker `config: 2` | `test/config/config-door.test.mjs` (one per entry) | 05, 02 |
| [07](phase-07-node-facade.md) | `src/config/facade.mjs` (absorbs `machine-config.mjs`), null-prototype marshal, error type, manifest row | `test/config/facade.test.mjs` | 06 |
| [08](phase-08-cost-gate.md) | Cold start, warm read and marshal cost measured; stop condition and owner gate G-C2 | measurement report | 07 |
| [09](phase-09-parity-sweep.md) | Effective-value parity sweep (old readers vs new snapshot) over every project; fixture refusal census | report, no source | 08 (landing B on the branch) |
| [10](phase-10-runner-loaders.md) | Runner loaders in `dispatch/config.mjs`: one read-only loader, explicit-path rule, deletions | `dispatch*.test.mjs` moved, one loader wiring case | 07, 09 |
| [11](phase-11-loader-callers.md) | About 20 `ensureRunnerConfigForDir` / `loadRunnerConfigFromDir` callers (not `bin/fgos.mjs`) | existing tests, moved | 10 |
| [12](phase-12-single-value-readers.md) | State and runner single-value readers (gate bypass with provenance, ceiling, iron law, invariant and setup commands, event store, terminal, grace, compaction, guard, gateway port) | existing tests, moved; one trusted-root wiring test | 07, 09 |
| [13](phase-13-setup-side-readers.md) | Setup-side readers outside `registrations.mjs`, the `seat-binding-config` row, `config-checks.mjs` import | existing tests, moved | 07, 09 |
| [14](phase-14-registrations.md) | `registrations.mjs`: about 45 readers, 13 registered defaults, their fixes, 3 writers, `ensureSharedConfigDefaults` | existing doctor tests, moved | 10, 13 |
| [15](phase-15-bin-and-setup-flow.md) | `bin/fgos.mjs` (8 reader sites, setup flow, `init`), `bin` cache out of config (incl. the shell reader), tier-ladder module deleted | `bin-discovery` and setup tests, moved | 11, 13, 14 |
| [16](phase-16-rust-consumers.md) | Gateway rest of `gateway.*`, `herdr-fgos-common`, `herdr-dashboard`, `work-state` | each crate's own unit tests | 05 (crate), D 14 |
| [17](phase-17-hook-lock-rows-and-fail-closed.md) | `.githooks/pre-commit` config check, `LOCK_FILES` rows, `dispatch-decide` hook on a config refusal | hook test, lock-row test | 07 |
| [18](phase-18-fixture-flip-and-old-module-deletion.md) | Fixture helper writes YAML in one change; every test moved; `src/config/*` and its tests deleted | the whole suite | 10-17 |
| [19](phase-19-architecture-guards.md) | Guards: no config read outside the facade (Node, Rust, shell), manifest rows | `test/architecture.test.mjs` | 18 |
| [20](phase-20-cutover-preflight.md) | **Stops if any precondition fails**; owner gate G-C1 per machine | the checklist output | 19, D landed and activated |
| [21](phase-21-live-migration-and-final-gates.md) | Live migration of this repository, final gates | rehearsal golden (D) + live doctor | 20, G-C1 |
| [22](phase-22-landing-and-rollout.md) | Landing C, per-machine activation, the other workspaces, severity raise, evidence | live `fgos config check` and doctor on each machine | 21 |
| [23](phase-23-docs-closeout.md) | Spec status and history lines, distribution, runner and seat-binding spec lines, CHANGELOG, board, backlog, budget count | `cargo test --workspace`, `npm test`, sequential | 22 |

Parallelism (file-disjoint, see ownership): after 07 and 09 land on `cfg/slice-c`, tracks {10 -> 11}, {12}, {13 -> 14 -> 15}, {16}, {17} run in parallel (15 also waits for 11). 18 joins them all; 19, 20, 21, 22, 23 are sequential. A question parked on G-C2 blocks 09 onward; G-C1 blocks only the machine it names.

Effort by phase (hours, excluding owner wait; sum 131): 00 3, 01 5, 02 5, 03 4, 04 2, 05 7, 06 7, 07 6, 08 2, 09 5, 10 8, 11 4, 12 6, 13 6, 14 10, 15 7, 16 6, 17 4, 18 12, 19 5, 20 3, 21 4, 22 6, 23 4. Slice B planned 52h and finished the crate in about 3 hours of wall clock with parallel agents; this is a calibration, not a promise: the reader moves are many small edits and the fixture strictness census (phase 09) may move hours between 10-14 and 18.

## File ownership (no two parallel phases touch the same file)

| Phase | Owns |
|---|---|
| 01 | `packages/git/node-addon/src/{yaml,marshal}.rs` (new), `src/lib.rs` (module lines, `versions()` key `"yaml": 1`), `Cargo.toml` (`fgos-yaml-doc` line) |
| 02 | `src/util/yaml.mjs`, `src/native/door.mjs` (marker `typeof v.yaml`, `fromDoorJson` helper), `test/util/yaml.test.mjs`, `packages/yaml-doc/contracts/fixtures/{yaml-test-mapping.v1.json (deleted),README.md}`, `packages/yaml-doc/rust/tests/fixture_shape.rs` (mapping check removed) |
| 03 | `src/util/third-party/js-yaml.mjs` (deleted), `test/architecture.test.mjs` (YAML guard section only), `docs/architecture-manifest.json` (two js-yaml rows), `test/rust-host/release-tree.test.mjs` (`:63-76`), `.github/cargo-deny.toml` (bans), `scripts/project-agents.mjs`, `scripts/build-domain-registry.mjs`, `scripts/lib/git-spawn-match.mjs` (stage the addon before the first parse, only if phase 00 proves they run outside a release) |
| 04 | `docs/specs/distribution.md`, `docs/platform/yaml-document/spec.md` (status lines), `docs/platform/component-boundary.md` (YAML row), `docs/specs/reading-map.md`, `docs/backlog.md`, `CHANGELOG.md`, board `plan.md` and `log.md` |
| 05 | `packages/config/rust/src/{write,detect,machine}.rs` (appended; D owns the rest), `packages/config/contracts/detected.v1.json` (new), `contracts/fixtures/{init,detect,machine-view}.v1.json`, `tests/{golden_init,detect_path,machine_view}.rs`, ids appended to `contracts/failure-codes.v1.json` |
| 06 | `packages/git/node-addon/src/config.rs` (appended), `src/lib.rs` (`"config": 2`), `src/native/door.mjs` (`config >= 2` check), `test/config/config-door.test.mjs` (appended) |
| 07 | `src/config/facade.mjs` (new), `src/config/machine-config.mjs` (deleted) and the import lines of its importers (list from phase 00: at least `src/setup/config-checks.mjs`, the D account-reader sites), `docs/architecture-manifest.json` (facade row), `test/config/facade.test.mjs` (new) |
| 08 | `plans/reports/measure-*` (name from `fgos convention name`), nothing else |
| 09 | scratch under `.fgos/runtime/tmp/`, `plans/reports/sweep-*`, nothing else |
| 10 | `src/runner/dispatch/config.mjs`, `src/runner/dispatch.mjs`, `src/runner/dispatch/{llm-accounts,provider-capacity,resolve}.mjs`, `src/runner/execution/{seat-policy,run}.mjs`, `src/state/tool-registry.mjs` (only if it imports a deleted symbol), `test/helpers/committed-config.mjs`, `test/runner/{dispatch,dispatch-config-patterns,config-seat-binding-layers,tier-fallback-config}.test.mjs` |
| 11 | `bin/fgos-runner.mjs`, `src/runner/{operation-choice,fanout-batch}.mjs`, `src/workflow/{runner,case-start}.mjs`, `src/runner/dispatch/{assignment-runner,cli}.mjs`, and their tests |
| 12 | `src/state/{gate-bypass,events-compaction,events-jsonl-truncation-guard}.mjs`, `src/verbs/merge/iron-law-level.mjs`, `src/runner/{claim-port,loop,merge,worktree,gateway-control}.mjs`, `src/event-store/config.mjs`, `src/terminal-control/config.mjs`, `src/run-supervisor/gate-kill-grace.mjs`, and their tests |
| 13 | `src/setup/{git-checks,run-supervisor-checks,agy-permissions,model-pool-checks,seat-binding-checks,blind-steps-proven-pools,executor-posture-coverage,agent-cli-trust,executor-profile-warnings,config-checks}.mjs`, `src/verbs/dispatch/{inspect,reconcile}.mjs`, and their tests |
| 14 | `src/setup/registrations.mjs`, `src/setup/checks.mjs`, `test/setup/{registrations,checks*}.test.mjs` |
| 15 | `bin/fgos.mjs`, `src/setup/{bin-discovery,tier-ladder-comment (deleted)}.mjs`, `scripts/fgos-shell-integration.sh`, `core/config-schema/bin.schema.yaml` (deleted) and its line in `packages/config/rust/src/bundle.rs`, `test/setup/{bin-discovery,tier-ladder-comment (deleted)}.test.mjs`, `test/scripts/fgos-shell-integration.test.mjs` |
| 16 | `apps/fgos-gateway/src/{gateway,cf_access}.rs`, `packages/herdr-fgos-common/rust/{Cargo.toml,src/settings.rs}`, `herdr-dashboard/{Cargo.toml,Cargo.lock,src/main.rs}`, `packages/work-state/rust/{Cargo.toml,src/lib.rs}`, root `Cargo.lock` |
| 17 | `.githooks/pre-commit`, `src/setup/holder-lock-checks.mjs`, `scripts/dispatch-decide-hook.mjs`, their tests |
| 18 | `test/helpers/config-fixture.mjs`, `test/helpers/config-fixture.test.mjs`, every remaining test file that touches config bytes (list from phase 09), `src/config/{shared-config-file,global-config}.mjs` and `test/config/{shared-config-file,global-config}.test.mjs` (deleted) |
| 19 | `test/architecture.test.mjs` (config sections), `docs/architecture-manifest.json` (final rows) |
| 20 | `plans/reports/guide-*` (new checklist and runbook, name from `fgos convention name`), board `log.md` |
| 21 | `.fgos/config.yaml` (new), `.fgos/config.json` (tombstone), `.fgos/runtime/config-migrate/` (ignored backup) |
| 22 | board `plan.md` and `log.md`, `plans/reports/landing-*`, `packages/config/contracts/doctor-rows.v1.json` (one severity value) |
| 23 | `docs/platform/config/spec.md`, `docs/platform/yaml-document/spec.md`, `docs/specs/{seat-binding,runner,distribution,reading-map}.md`, `docs/platform/component-boundary.md`, `docs/backlog.md`, `CHANGELOG.md`, board |

Shared edits handled in order: `src/native/door.mjs` and `packages/git/node-addon/src/lib.rs` (D 11, then 01 and 02, then 06); `docs/architecture-manifest.json` (03, 07, 19); `test/architecture.test.mjs` (03, then 19); `packages/config/rust/src/write.rs` and `machine.rs` (D, then 05); `src/setup/registrations.mjs` (D 12, 07's import line, then 14 alone); `bin/fgos.mjs` (15 alone; 11 skips it); `packages/config/contracts/failure-codes.v1.json` (D, then 05); `CHANGELOG.md` (04 appends the A lines, 23 the rest). Boards' "File chung dễ va" rows touched: see "Board announcements".

## Frame (to be approved by the owner with this plan; the budget is a proposal)

- **Scope:** the files in the ownership table and nothing else. Out of frame (ask first): converting the global file (D24), a stronger confined fact, `fgctl init` writing config, any third-party crate, a change to a locked law, a change to the YAML Document or Config spec beyond status, decision and history lines, a JavaScript fallback parser or merger, Windows (G4), behaviour changes to a reader beyond the outcome table of phase 00.
- **Budget, measured against B and D (B planned 1,300 Rust source lines and landed 2,372, 1.82x; D estimates 2,450 with caps summing 2,610):**

| Module | Phase | Estimate (base x 1.8) | Cap (lines, comments and blanks included) |
|---|---|---|---|
| node-addon `yaml.rs` | 01 | 45 | 70 |
| node-addon `marshal.rs` (JSON text out, panic guard, failure shape) | 01 | 45 | 80 |
| crate `write.rs` delta (`init`) | 05 | 40 | 80 |
| crate `detect.rs` delta (`PathDetectors`) | 05 | 45 | 80 |
| crate `machine.rs` delta (machine view) | 05 | 25 | 50 |
| node-addon `config.rs` delta (4 entries, class, trusted root, cache, sections) | 06 | 100 | 190 |
| gateway, herdr, work-state, dashboard (gross added; deletions counted apart) | 16 | 30 | 60 |

  Sum of estimates about 330 lines of Rust source, sum of caps 610, **hard ceiling 700 lines added** counted by `find packages/git/node-addon/src/yaml.rs packages/git/node-addon/src/marshal.rs packages/git/node-addon/src/config.rs packages/config/rust/src apps/fgos-gateway/src packages/herdr-fgos-common/rust/src herdr-dashboard/src packages/work-state/rust/src -name '*.rs' | xargs wc -l` before and after (baseline taken after D landed; deletions reported separately, about 100 expected), reported in every commit message. Rust tests about 1.1x the added source (about 360 lines), fixture JSON about 400 lines.
- **Node source (the number this slice must shrink):** added about 750 lines (facade 260 cap including D's 90 it absorbs, `yaml.mjs` 50, loaders 70, readers 260, setup flow 90, helper 20), **removed about 1,550** (`src/config` 235, `dispatch/config.mjs` defaults, sanitize, strip, bootstrap, detect and ensure about 330, `registrations.mjs` seeds, fixes, writers and checks about 520, `tier-ladder-comment.mjs` 38, D's `machine-config.mjs` 90, `yaml.mjs` 67, reader rewrites about 270) **plus the vendored `js-yaml.mjs` 3,614 lines counted apart**. Cap on lines added: 900. Success criterion: net (added minus removed, vendored file excluded) at most **-400**, counted by `git diff --numstat origin/main...HEAD -- src bin scripts ':!src/util/third-party'` summed, reported per phase. A phase that would pass its cap, or a net that cannot reach -400, stops and reports in the decision-question template; it never trims requested behaviour to fit.
- **Tests:** new about 650 lines (door and facade wiring about 330, architecture guards about 150, hook and lock-row about 80, yaml wiring about 60, helper about 30); retired about 450 (`test/config/*` 245, `config-fixture.test.mjs` 44, `tier-ladder-comment.test.mjs` 77, `yaml.test.mjs` shrinks 154 to about 60), plus the edits of every test that wrote or read config bytes (count in phase 09). Reported net.

## Constraints

- AGENTS.md: **L10** (a mover moves every consumer and deletes the old path in the same change; the cutover is one change for that reason), principle 1 one door (each phase says what it reused: `fgos-config`, `fgos-yaml-doc`, the `config` namespace D opened, `scripts/lib/git-addon-stage.mjs`, `findConfigFileWrites` lexer, D's `trusted_main_root` helper), principle 2 layering (`facade.mjs` is `kernel`; it imports only `native/door.mjs`; checked by `test/architecture.test.mjs` against `docs/architecture-manifest.json`), principle 8 one proof (table below; each retired test names its new owner or says the behaviour was removed), no test-only switch, flag or env branch (the observer seams of B and D are public parameters), RUL104 better not bigger (net Node lines must fall), install/setup/doctor gate (the `bin` cache file and the new hook call are registered; no new env var is added by C), legacy-node boundary (the compatibility channels fail by name when the addon is missing; no fallback), conventional commits without AI references except the session attribution line.
- Resource safety: `free -g` first and at least 8 GB available (19 GB available at planning time); every cargo command carries `--jobs 4`. Crate tests first. `cargo test --workspace --jobs 4`, `npm test` and `cargo test --manifest-path apps/fgos-gateway/Cargo.toml --jobs 4` (and `herdr-dashboard`'s own) are never run together: one finishes, its exit code is read on the very next statement, then the next starts. Long runs go through the harness's background facility; wait on the concrete PID the harness returned, never on `pgrep -f <pattern>`. Do not run `scripts/test-select.mjs` to read its help: it starts a cargo build.
- Linked worktrees only (`cfg/slice-c-yaml`, `cfg/slice-c-door`, `cfg/slice-c`; the shared main checkout holds other sessions' unstaged work; no autostash pull there). Merge `origin/main` at the start and end of every phase and before any test used as evidence.
- Every landing gets one line at the top of the board's `log.md` (newest first); phase 00 posts the start line naming every shared file below.
- Scratch under `.fgos/runtime/tmp/` (fallback `${TMPDIR:-/tmp}/fgos-work/`). Names of reports and guides come from `fgos convention name|path --json`; parallel agents pick distinct slugs.
- Focused Node test runs need the staged addon: `npm test` stages it (`scripts/run-tests.mjs:121-130`, `stageDoorManifest`); a bare `node --test file` in a checkout fails with `git-addon-unavailable` by design once landing A is in. Phase 00 records the exact focused-run command that stages it and every phase's validation line uses it.
- Impact-analysis gate: `fgos tool query --capability impact-analysis --status present`, record `full | degraded | inactive` (phase 00). Symbols edited: `parseYaml`, `describeYamlError`, `loadNativeAddon` (`src/native/door.mjs:60` marker), `versions` (`packages/git/node-addon/src/lib.rs:24`), `loadRunnerConfig`, `loadRunnerConfigFromDir`, `ensureRunnerConfigForDir`, `withDefaultExecutor`, `readSharedConfig`, `readSharedConfigOrEmpty`, `loadGlobalConfig`, `mergeWithGlobalConfig`, `writeSharedConfig`, `writeGlobalConfig`, `ensureSharedConfigDefaults`, `runFixes`, `refreshGlobalBinCache`, `load_gateway_config`, `read_settings`, `read_shared_level`. Run `impact` on each before editing and `detect_changes()` before each commit; cross-check with `rg` when the index looks stale (a zero result is not proof, `bin/fgos.mjs` has no indexed symbols).

## Delegation economy (suggested)

Cheapest model that does the job reliably. **Haiku:** 00 (re-run), 03 deletions, 04, 08 (measure), 11 (mechanical renames), 20 (checklist script), 23 text. **Sonnet (default):** everything else, including 00's enumerations, 01, 02, 05-07, 09, 10, 12-19, 21. **Opus** only after a failed sonnet attempt (likeliest: 10 loader semantics, 14 registrations deletions, 18 the test churn). **Independent sonnet review before landing:** 06 (define semantics, class, trusted root), 10 (loader outcomes), 14 (deletion list against phase 00), 18 (helper flip), 21 (live migration). `kongming` only if a design fork resists analysis; none expected (the forks are settled below).

## Owning proof per behaviour (design principle 8)

| Behaviour | Owning proof (lowest layer) | One wiring proof above |
|---|---|---|
| YAML text means what the `tool` profile says (136 golden cases, every case of the old Node test) | `packages/yaml-doc/contracts/fixtures/parse.v1.json` runner (Slice A) | `test/util/yaml.test.mjs`: one value, one error with position, one `__proto__` key, one adversarial input the process survives |
| A panic in an addon entry becomes a named refusal and prints nothing | `marshal.rs` unit test over `guarded` | the yaml wiring case above |
| Effective value, provenance, scope, merge, standard layer, accounts layer | Slice B goldens (`golden_snapshot.rs`, `golden_scope.rs`) | `config-door.test.mjs` `snapshot` case |
| `init` creates a header-only file, never overwrites, no standard value | `tests/golden_init.rs` | door `init` case; setup test (phase 15) |
| `runner.executor` detected from `PATH`, only for `x-fgos-absent: detected` | `tests/detect_path.rs` (real temp `PATH`) | none |
| A machine view without a project file | `tests/machine_view.rs` | gateway unit test (phase 16) |
| Write transaction, conflict, reason rules, confined refusal | Slice B `write_*` tests, D relocate and migrate tests | door `applyPatch` case (one success, one `config-write-confined`) |
| Snapshot objects have no prototype; `__proto__` cannot change one | `facade.test.mjs` | `config-door.test.mjs` (raw door output is JSON text) |
| `command` values come from the main checkout whatever root the caller passes (acceptance 13) | Slice B `golden_snapshot.rs` trusted-root cases | `test/runner/worktree-config-trust.test.mjs` (new, real linked worktree; extends no old test) |
| A reader's outcome on a refusal (propagate, or its documented fail-closed value) | the reader's existing test, moved to the facade fixture | none |
| `gateBypass.level` falls back to the legacy file only when the level came from `standard` | `test/state/gate-bypass.test.mjs` (existing cases moved, one added) | none |
| No config read outside the facade; no YAML library anywhere | `test/architecture.test.mjs` | none |
| The tombstone makes an older reader fail without writing | D's `tombstone-older-reader.test.mjs` | none (phase 21 re-runs it against the real file) |
| Parity: old effective value equals new except the named differences | phase 09 report (one-off, not a test) | phase 21 re-runs it on this repository |

## Test matrix

| Layer | What | Where |
|---|---|---|
| Pure, golden JSON | init, machine view | `tests/golden_init.rs`, `tests/machine_view.rs` over `contracts/fixtures/*.v1.json` |
| Real filesystem | `PATH` probe, hook staged check, shell reader | `tests/detect_path.rs`; `test/e2e/...hook...`; `test/scripts/fgos-shell-integration.test.mjs` |
| Rust unit | `marshal::guarded`, consumers | `marshal.rs` tests; gateway, herdr, work-state unit tests |
| Node wiring | one case per door entry and per namespace, facade shape | `test/util/yaml.test.mjs`, `test/config/config-door.test.mjs`, `test/config/facade.test.mjs` |
| Node, moved | every reader's existing test over the new fixture helper | `test/runner`, `test/setup`, `test/state`, `test/verbs`, `test/workflow`, `test/cli`, `test/e2e` |
| Architecture | config-read guard, YAML guard, manifest layering | `test/architecture.test.mjs` |
| Live | one rehearsal and one live migration of the real file; per machine doctor, lease, gateway | phases 09, 21, 22 |

## Decisions taken (inside the spec's silence; each reversible by editing one place)

| # | Decision | Reason |
|---|---|---|
| C1 | Three landings (A yaml, B additive config door, C cutover); only C is atomic. | The cutover cannot be incremental (see "Landings"); A and B are additive and shrink C's diff. |
| C2 | The addon returns **JSON text**, never napi-built objects. `config` results parse with `JSON.parse` (own keys, so `__proto__` is an own key) and the facade makes each object prototype-free; `yaml` results parse the same way into ordinary objects (today's contract: `Object.getPrototypeOf(doc) === Object.prototype`, `test/util/yaml.test.mjs:119`) and the few values JSON cannot carry (`.nan`, `.inf`, `-.inf`, only in the `tool` profile) come as a patch list `[[path…, kind]]` the Node helper applies. Integers past 2^53 and `-0` already survive JSON text as the nearest double, as today. | One define-semantics point, one helper (`fromDoorJson`, `src/native/door.mjs`), no per-node napi calls; the spec allows "define own properties or prototype-free objects". |
| C3 | `snapshot` takes `{ projectRoot?, globalDir, sections?, origins? }`. No `projectRoot` is the **machine view** (global + accounts + standard; the gateway and the doctor rows that run without a project). `sections` filters the returned top-level keys in Rust; `origins` adds provenance for the requested paths only. | The gateway must never read a project file (its section is `global-only`; a project holding `gateway` would fail its start). Full-snapshot marshalling of the 25 KB `runner` for a one-key read is waste; phase 08 measures both. |
| C4 | The addon resolves `trusted_root` with D22's `RepoHandle::trusted_main_root` helper; **no repository found: the trusted root is the project root** (a plain directory has no linked worktree to distrust). Memoised per canonical project root while the `.git` entry's (dev, ino, mtime) is unchanged; measured in phase 08. | Most tests run in temp directories that are not repositories; spec section 5 rule 6 is about linked worktrees. |
| C5 | The addon owns a bounded multi-slot snapshot cache (8 entries keyed by request; each hit re-reads and re-hashes every source, so it is never stale). | B's `SnapshotCache` holds one slot and "the door owns the instance" (B D15): a doctor run alternates between project and machine requests and would thrash one slot. Entries are content-validated, which is what spec section 5 rule 4 requires. |
| C6 | `--config <path>` of `fgos discover`, `fgos plan` and the third verb at `bin/fgos.mjs:3969` (the "explicit-path load", one of the spec's seven bypass readers) is read with the YAML door (`parseYaml`, tool profile; JSON is YAML) and checked by `validateRunnerConfigShape`, as today. It is a named input file, not project config: no layer, no standard, no scope rules. | Keeps the flag and its 82 test uses without a second config parser; the guard names `config.json`/`config.yaml`/`accounts.yaml`/`gateway-token`, not an arbitrary flag path. Removing the flag is the alternative (Unresolved 4). |
| C7 | Reader outcome rule: a refusal **propagates** (a typed `ConfigDoorError` with the failure id) unless the reader's own header or the spec documents a fail-closed value that cannot widen anything; those keep it and are listed in phase 00's table (expected: `readGateBypassLevel` -> `off`, herdr toggles all off and web dashboard static serving on, `gateway-control` port 4170, compaction and fallback-interval -> unset). Nothing returns an empty object for a broken file. | Spec section 5 rule 2 and acceptance 4: a malformed file never becomes an empty object; `readSharedConfigOrEmpty` is the pattern being retired. |
| C8 | `gateBypass.level`: when its provenance is `standard`, the reader still consults the legacy `.fgos/gate-bypass.json` (and so does the Rust `work-state` reader). | The standard fills `gateBypass.level: off` (`core/config-standard/gateBypass.yaml`), so without this rule a project holding only the legacy file (this repository holds both, `.fgos/gate-bypass.json` is `{ "level": "standard" }`) would silently drop to `off`. Behaviour kept exactly; retiring the legacy file is a separate item. |
| C9 | `ensureRunnerConfigForDir` and `loadRunnerConfigFromDir` become one read-only `loadRunnerConfigForDir(dir)`; nothing is created by a read. A directory with no config gets the in-memory standard plus the detected executor; with no executor detected the error names `fgos config set runner.executor` instead of writing a placeholder (`NO_ASSISTANT_CLI_FOUND__edit_...`). | Spec section 5 rule 1 and section 8. |
| C10 | `init` is the one create door: header-only file (grammar line, pointer to `fgos config standard`), no standard value, no overwrite (`created: false` when the file exists). `fgos setup` calls it for a missing project file and a missing global file; an existing legacy `config.json` is left alone (migration is D's verb). New machines therefore get a YAML global file; existing ones keep JSON (D24). | Spec section 6, `init` row. |
| C11 | The `bin.globalFgosPath` cache moves to `~/.fgos/runtime/bin-cache.json` (plain JSON, written with `replaceDurably`, read by `resolveFgosBin` and by the shell wrapper), `core/config-schema/bin.schema.yaml` is deleted. A stale `bin` key left in a global file is reported by `config-unknown-key` (warning) and is not rewritten. | Spec section 8 row 2; the cache writer `writeGlobalConfig` must go (one of the five `JSON.stringify` writers) and a JSON rewrite of the global file is exactly what D10 limited to the key moves. |
| C12 | The Rust readers link `fgos-config` by path and keep their documented fail outcomes (C7). Dependency growth is measured as in D5; over the D5 threshold the phase stops (gate G-C3). | One authority; herdr-dashboard has its own lock. |
| C13 | The doctor row `config-awareness` (`registrations.mjs:2069-2093`, `describeConfigAwareness`) is retired: which level is active is `fgos config show` provenance plus rows `config-legacy-shadowed` and `config-format-legacy-json`. | RUL104: a second way to answer the same question would be larger, not better. Phase 00 confirms no spec row promises it by name. |
| C14 | The `dispatch-decide` PreToolUse hook (`scripts/dispatch-decide-hook.mjs`, header says it fails open on any failure) **refuses** when `decide` fails with a `config-*` refusal and keeps failing open on an infrastructure hiccup (stdin, spawn, timeout). | Spec section 11: "enforcement hooks such as `dispatch-decide` fail closed" for a config that does not parse; the header's fail-open covers a different case. Confirm at frame approval (Unresolved 2). |
| C15 | `.githooks/pre-commit` runs the native verb `fgos config check` through the host binary it already resolves (`resolveActiveHostBin`, `.githooks/pre-commit:560`) when a staged path is a config file; a failure refuses the commit; **no host binary found warns and continues**, the same posture as its lock check (`:154`). | Spec section 11; a hook is a cold client of the host (`:109-112`), so no addon load and no Node facade. |
| C16 | D's `withMachineAccounts` is deleted: the unconfined snapshot already carries the accounts layer. `readMachineAccounts` stays for the doctor and for callers that run without a valid project file. | D7 was an interim seam while Node had no snapshot (L10). |
| C17 | `config-format-legacy-json` becomes a failure in phase 22, after every workspace in the preflight list is migrated or the owner names an exception; it is a one-value edit in `doctor-rows.v1.json` (D19). | A legacy-JSON project cannot be written by any door (`config-format-legacy-json`, B D11): the row says so. |
| C18 | Seat Binding `$comment`: `stripConfigComments`, `tier-ladder-comment.mjs`, the `seat-binding-config` row and the `bin/fgos.mjs` refresh are deleted; a decision line in `docs/specs/seat-binding.md` records that the representation clause of D-ADR0072 is superseded (spec section 7 requires it in the same change). | Migration (D) converts `$comment` to doc lines; nothing writes one afterwards. |
| C19 | Scripts that parse YAML outside a release payload stage the addon with `ensureGitAddon` from `scripts/lib/git-addon-stage.mjs` (the leaf the test launcher and the git scripts already use) before their first parse; the first run builds with cargo, later runs reuse the digest-keyed stage. | There is no fallback parser (spec), and a bare checkout cannot load the in-process door (`.githooks/pre-commit:109-112`). |
| C20 | The fixture helper writes `config.yaml` (and the global `config.yaml`) holding the value as JSON text with the `# @fgos:v1` header; JSON text is valid `strict-config` YAML. Reads go through `readProjectConfig`/`readGlobalConfig` helpers built on the door. The legacy-JSON read path keeps one proof (facade test over a real `config.json`, plus B's `files_select.rs`). | The format switch is one change in the helper (spec G5); the tests need valid files, not generated comments. |
| C21 | RUL id for the YAML supersession: the next free `RUL` id at landing time (phase 04 re-greps; `RUL107` is the highest in `docs/specs/distribution.md` today). | |

## Reader semantics that change (the reason for phase 00's table and phase 09's sweep)

1. **Effective value instead of one file.** `readSharedConfig(dir).section` returned only what the project file held. The facade returns project over global over standard. Where the standard equals the old code default (Slice B's `registry_defaults.rs` proves it for the 13 non-catalog sections) nothing changes; where a project file held a **stale or partial `runner`**, the new snapshot adds the standard's catalog entries it lacks (that is the point of the standard, spec section 3) and drops values the global sanitiser used to drop silently (now refused by name: `rigorToTier`, extended cells in the global file). Both happen at the first snapshot, **before and after** migration, so migration cannot hide them; phase 09 measures them per project and the owner reads the report before G-C1.
2. **Strictness.** The whole merged value is validated; one bad key refuses every reader (B D19). Test fixtures that were tolerated (partial executors, unknown shapes) are refused; phase 09 counts them, phase 18 fixes the fixtures (never weakens an assertion).
3. **Prototype-free objects.** Consumers that call `obj.hasOwnProperty`, `obj.toString` or compare with `assert.deepEqual` against literals break; phase 00 greps for those, the test helper offers `plainConfig(value)`.
4. **Doctor rows that inspected the file's own contents** (seat-binding schema marker, capability catalog doctrine) now see the effective value; each is listed in phase 00 with its decision.
5. **Accounts** come from the snapshot's accounts layer when unconfined and are absent when confined; the lease path refuses a confined caller by name (`config-accounts-unavailable-confined`).

## Cutover preconditions (phase 20 stops if any fails; each is evidence, not belief)

1. Slice D is on main and activated on the machine under test (`fgos config --help` lists the verbs; `addon.versions().config >= 1`).
2. On every machine and every activated project, `fgos config check` passes the new snapshot on both files, **or that project is migrated first** (`fgos config migrate`, its own item). Projects come from activation records (`<project>/.fgos/installation/activation.json`; phase 00 lists them with a `find`), expected set: design-lap: forgentX, mdview, mcp-skill-hub; fg-server: `~/projects/forgent`; fg-server2: `~/projects/forgent`; plus this repository. Known blockers: this repository (migrated in phase 21), and on each machine the owner's global-file cleanup that B's D10 named (`runner.rigorToTier`, extended tier cells).
3. Account pools and the gateway token are in `~/.fgos/private` on each machine (D stage 1) **and** no older release on that machine reads the old keys: D's stage 2 (`migrate --global --finish --machine-checked`) done with the owner's recorded G-D3 answer. The technical minimum is stage 1 (D8 makes the snapshot tolerate a held copy); the stricter reading is the requested one, so a machine without stage 2 is simply not activated yet.
4. The Windows release waits for gate G4: no Windows asset is produced from landing C.
5. `fgctl` still works on a tombstoned checkout (it is Rust and reads no Node config): `fgctl status` run on a scratch copy; this is what makes rollback possible.
6. `cargo test --workspace --jobs 4`, `npm test`, the gateway and dashboard test suites green on `cfg/slice-c` merged with `origin/main`, run sequentially (the 18 red `npm test` cases, backlog p-5d2e1c9a, are not made worse).

## Risks (likelihood x impact)

| Risk | L x I | Mitigation | Phase |
|---|---|---|---|
| The first snapshot changes the effective `runner` of other projects (stale catalogs gain standard entries; global sanitiser drops become refusals) | H x H | parity sweep per project before any reader moves; owner reads it before G-C1; per-project `migrate --dry-run`; nothing activates on a machine whose projects fail | 09, 20 |
| A reader is missed and keeps parsing `config.json` after the tombstone | M x H | the phase 00 enumeration is the edit list; `rg` completeness commands in success criteria; guard test for Node, Rust and shell; independent review | 00, 14, 19 |
| Cold-start latency of every `fgos` verb grows (bundle parse, validator compile, addon hash check for processes that never touched Git) | M x M | phase 08 measures against thresholds before any reader moves; stop and gate G-C2 | 08 |
| Test fixtures refused by strict validation: large test churn | H x M | census in phase 09 sizes it; fixtures are fixed, assertions are never weakened; helper flip last | 09, 18 |
| Prototype-free objects break a consumer | M x M | phase 00 grep (`hasOwnProperty`, `.toString`, `deepEqual`), facade tests, `plainConfig` | 00, 07, 18 |
| The addon is not loadable where Node runs (bare checkout, global npm shim, scripts, focused `node --test`) and YAML or config reads now fail | M x H | named error with next step (`fgctl init`), scripts stage the addon, doctor row text, CHANGELOG, the focused-run command recorded; no fallback by design | 03, 07, 23 |
| Pull-before-activate window: an old release meets the tombstone, or the new release meets an old file | M x M | loud named failure, nothing written (acceptance 17); the runbook orders stage, pull and upgrade back to back; rollback below | 22 |
| Hooks now fail closed on a config refusal and block a legitimate commit or tool call | L x M | narrow rule (config ids only); doctor row and `fgos config check` name the file; override is fixing the file | 17 |
| Trusted-root resolution costs a git open per read, or misbehaves in a non-repository | M x M | memo, fallback to project root, measured | 06, 08 |
| `fgos config set --global` is refused while the global file is JSON | H x L | named refusal (`config-format-legacy-json`) with the reason; conversion is D24 / Ideas I2 | 22 |
| Dependency growth of `fgos-config` in `herdr-dashboard` and the gateway | M x L | D5 threshold, gate G-C3 | 16 |
| Rust source budget exceeded (B ran 1.82x over base) | M x M | caps per module, ceiling 700, running total in every commit | all |
| Shared files collide with other lanes | M x M | board post first, merge `origin/main` at every phase start, land second rebases | all |
| Out of RAM | M x H | `free -g` gate, `--jobs 4`, sequential gates | all |

## Rollback (what a person does when something breaks)

Landing A, B: each is one merge on main; `git revert -m 1 <merge>` restores the previous state (A: js-yaml returns, the addon's `yaml` namespace stays unused; B: the facade and entries stay unused). Nothing else depends on them until C.

**Landing C and activation, by symptom.** Every step prints paths and ids, never values.

| Symptom | Cause | What to do |
|---|---|---|
| Any `fgos` verb in a project fails with a `config-*` refusal naming a file, line, column | that file does not pass the new snapshot (after pull or activation) | run `fgos config check`; it lists every refusal with the fix id; apply it. If it is not fixable in minutes: restore the file below. `fgos config check` and `fgos doctor` still run: refusals never stop them (D20) |
| `git-addon-unavailable` / `git-addon-not-shipped` from a verb that parses YAML | the running release has no loadable addon (channel without it, target mismatch) | `fgctl status`, then `fgctl upgrade --from ~/.local/state/fgos/releases/<previousArtifactDigest>` (the digest is `previousArtifactDigest` in `.fgos/installation/activation.json`), then `fgctl verify` |
| The old release is active and a freshly pulled checkout holds the tombstone (`moved to .fgos/config.yaml; upgrade fgOS`) | pull before activation | by design the old release refuses and writes nothing; activate the new release (`fgctl stage`, `fgctl upgrade`), or, to stay on the old release, restore the project file |
| This repository or another migrated project must go back to JSON | migration rollback | committed: `git revert <migration commit>` (restores `.fgos/config.json`, removes `.fgos/config.yaml`); not committed: copy `.fgos/runtime/config-migrate/<rev16>-config.json` over `.fgos/config.json` (mode 0644) and delete `.fgos/config.yaml`. The report of `fgos config migrate` prints both commands |
| Accounts or the gateway token are missing on a machine | readers read only `~/.fgos/private` | `fgos config check` names `config-machine-files`; D's stage 1 recreates the files from the global file while the old keys remain; after D's stage 2 restore the stage-2 backup over `~/.fgos/config.json` (D phase 15 step 8) |
| The whole cutover must be undone | any | `git revert -m 1 <landing C merge>` restores every Node reader, `src/config/*`, the five writers and the JSON project file in one commit; first re-activate the previous release on each machine (`fgctl upgrade --from <previousArtifactDigest>`), then pull. The addon's extra entries and the Rust readers from landing B stay and are harmless |
| Wrong effective values after the cutover (not a refusal) | parity sweep missed a difference | `fgos config show --path <p>` and `fgos config explain <p>` name where a value comes from; the project sets the value it wants with `fgos config set <p> <v> --reason <why>`; phase 09's report is the list of expected differences |

The global file is only read by C, never rewritten (the `bin` key stays as it is), so there is no global-file rollback. Machines are rolled back one at a time; a machine that was not activated needs nothing.

## Board announcements (post before editing; the board's "File chung dễ va" rows and the lanes to message)

Post the start line at phase 00 (lane CFG, Slice C, three landings, every shared file below), one line at each landing (A after phase 04, B after phase 08, C after phase 22) and one per machine activation. Message by role (`fgos identity session --role lead:<LANE>`), never by pane or "the other machine".

| Shared file (board row) | Lanes to notify |
|---|---|
| `src/setup/registrations.mjs`, `bin/fgos.mjs`, `CHANGELOG.md`, `docs/specs/runner.md` | `lead:COOK` (bin), `lead:HARDEN`, `lead:SEAT`, `lead:DOC` |
| `docs/platform/*/spec.md`, `docs/platform/component-boundary.md`, `packages/host-runtime/contracts/command-routes.json` (not edited by C, but D edits it), `apps/fgos/src/main.rs` (not edited by C) | `lead:HARDEN`, `lead:DOC` |
| `test/**` (every test that wrote or read config bytes), `test/architecture.test.mjs`, `test/suite-baseline.json` | `lead:TEST` (the board row says CFG only replaces config writes with the helper and changes no other test; this slice changes more where strictness forces it, so message before phase 18) |
| `src/util/yaml.mjs`, `src/config/*`, `apps/fgos-gateway`, `Cargo.toml` workspace, `.github/cargo-deny.toml` | the CFG row's own co-owners: `lead:TEST`, `lead:DOC` |
| `src/runner/dispatch/config.mjs`, `seat-policy.mjs`, `seat-binding-checks.mjs`, `tier-ladder-comment.mjs` | `lead:SEAT` (SEAT-TRIM deletes conversion code in the same file) |
| `src/event-store/config.mjs`, `src/state/events-*.mjs`, `src/runner/claim-port.mjs`, `merge.mjs`, `worktree.mjs` | `lead:WORK` (ES), `lead:HARDEN` (4.3 lanes touched these) |
| `src/setup/holder-lock-checks.mjs`, `packages/holder-lock/contracts/lock-registry.v1.json` (read only) | `lead:HARDEN` |
| `.githooks/pre-commit`, `scripts/dispatch-decide-hook.mjs` | `lead:HARDEN`, `lead:MAIL` (hooks) |
| `docs/specs/seat-binding.md`, `AGENTS.md` (not edited) | `lead:SEAT`, `lead:RULE` |
| `docs/backlog.md`, board `plan.md` | `lead:DOC`; every lane reads the board before its next landing |

## Owner gates (decision-question template, `core/skills/_shared/decision-question.md`)

Frame approval (with this plan): the scope, the three landings, the budget (Rust about 330 lines with ceiling 700; Node net at most -400; effort 131h) and the confirmations in Unresolved 1-3. Gates are posted when their phase is reached; each parks only what it names.

### G-C1: may the cutover be activated on this machine now? (parks that machine only; phase 20)

**What is happening.** Landing C turns every reader of `config.json` in Node and Rust into a reader of the new snapshot and migrates this repository's project file to YAML with a tombstone in `.fgos/config.json`. A machine that activates it while another release on it still reads `~/.fgos/config.json` accounts or token, or while a project it hosts does not pass `fgos config check`, loses leases or stops every verb there.

**Cause.** Checked by phase 20's checklist for that machine: the list of activated releases and projects from activation records, `fgos config check` per project and for the global file, `~/.fgos/private` modes and contents (names only), D's stage 2 evidence and G-D3 answer, the parity sweep differences for each project.

**Options.**
- **A. Activate machines whose checklist is fully green, one at a time, starting with the machine that has one release and one project (D's G2); leave the others on the old release.** Gain: no machine is surprised. Harm: two releases coexist for a while; the shared repository checkout on an old-release machine must not be pulled past the tombstone. Cost: none extra.
- **B. Wait until every machine is ready, then activate all.** Gain: one release everywhere. Harm: one unchecked machine (fg-server2 for D's stage 2) blocks all.
- **C. Activate with D stage 1 only where an older release remains.** Gain: no wait. Harm: the older release still breaks on the tombstone in this repository's checkout, and the owner confirmed no older release as a precondition. Not offered as viable.

**Recommendation.** A.

**Scope of the answer.** A yes authorizes activation and the pull on the named machine only. It does not authorize another machine, a project migration, or skipping a red checklist line.

### G-C2: the measured cost is over the threshold (conditional; parks phase 09 onward; phase 08)

**What is happening.** Phase 08 measures the first config read in a cold Node process, a warm read, and the marshal of the `runner` section against these proposed ceilings: first snapshot at most 25 ms over today's cold read, a warm one-section read at most 0.3 ms, `runner` at most 3 ms, an addon load for a process that never touched Git at most 12 ms (spec G1 measured 0.5 ms plus an 8.4 ms hash check once). If a number is over, every `fgos` verb and every PreToolUse hook pays it.

**Cause.** Checked: the numbers and what dominates them (bundle parse, validator compile, hash check, marshal).

**Options.** A. Accept (state the numbers in the closeout). B. Reduce in Rust before cutover: compile the validator lazily per section, validate only the requested sections plus the merge keys, or cache the parsed bundle in the addon (one phase more, about 4h, no spec change). C. Keep a smaller cached view in Node (a second source of truth; not offered).

**Recommendation.** B if the first snapshot is over, A otherwise.

**Scope of the answer.** B authorizes changes inside `fgos-config` and the addon only; no behaviour of any verb changes.

### G-C3: dependency growth of `fgos-config` in the small Rust readers (conditional; phase 16)

**What is happening.** `herdr-dashboard` and `herdr-fgos-common` read a few booleans; linking `fgos-config` pulls the validator crate graph into their locks. D5 set the threshold (more than the validator's crates plus 20% build time).

**Options.** A. Accept. B. Split `fgos-config` into a leaf and a use-case layer (D's idea I1, about 150 lines of moves). C. Keep a lean local reader (a second authority; not offered).

**Recommendation.** A unless the threshold is passed, then B.

**Scope of the answer.** B authorizes the crate split only.

## Success criteria (observable)

- `cargo test -p fgos-config -p fgos-node-addon --jobs 4`, `cargo test -p fgos --jobs 4`, `cargo test --manifest-path apps/fgos-gateway/Cargo.toml --jobs 4`, `cargo test --manifest-path herdr-dashboard/Cargo.toml --jobs 4`, `cargo clippy ... -- -D warnings` and `cargo fmt --check` clean on the touched crates; `cargo deny --config .github/cargo-deny.toml check advisories bans sources` clean; `cargo test --workspace --jobs 4` and `npm test` green, run sequentially; the 18 red `npm test` cases are not made worse.
- `rg -n "js-yaml|third-party/js-yaml|loadAll" src bin scripts test core --glob '*.{mjs,cjs}'` finds nothing; `src/util/third-party/js-yaml.mjs` and its hash test are gone; `package.json#dependencies` is still empty.
- `rg -n "readSharedConfig|readSharedConfigOrEmpty|loadGlobalConfig|writeSharedConfig|writeGlobalConfig|mergeWithGlobalConfig|sharedConfigFilePath|ensureRunnerConfigForDir|ensureSharedConfigDefaults|describeConfigAwareness|stripConfigComments|withMachineAccounts|machine-config|sanitizeGlobalLayer|DEFAULT_RUNNER_CONFIG|registerConfigDefault" src bin scripts test --glob '*.{mjs,cjs}'` finds nothing; `src/config/` holds only `facade.mjs`.
- `rg -n "config\.json|config\.yaml|accounts\.yaml|gateway-token" src bin scripts apps packages herdr-dashboard --glob '*.{mjs,cjs,rs,sh}'` finds only the facade, `fgos-config`, the messages and tombstone text the guard allowlists, and the Rust constants of the crate.
- Acceptance 4 (a read never writes: a run in a project with no config creates no file), 5 (a short project file inherits the rest of the standard), 8 (Rust and Node read through one implementation), 13 (a worker's worktree edit does not change a merge-gate command), 14 (a confined write is refused through the Node door), 15 (`gateway.token` is `<redacted>` in `check` output), 16 (a snapshot object has no prototype; `__proto__` is an own key in the `yaml` result and cannot change a prototype), 17 (an older reader refuses the tombstone) each have a named passing test or live check.
- This repository: `.fgos/config.yaml` exists, `.fgos/config.json` holds the tombstone, `fgos config check` and `fgos doctor` show no failure from config rows, every Node verb runs, the parity report lists only the expected differences.
- Net Node source (vendored file excluded) at most -400 and Rust source added at most 700, reported per phase and in the landing lines; the cold-start numbers of phase 08 are in the closeout.

## Ideas for the owner (beyond the spec; none is in the budget unless chosen)

| Idea | Problem and evidence | Benefit |
|---|---|---|
| I1. Pre-trim this repository's JSON by hand (drop `gateway` and `lock`, both dead or equal to the standard) so reader moves can land incrementally against the legacy-JSON read the snapshot already supports, and convert last | landing C is one large change because the file is refused today (D19) | smaller landings and finer rollback; costs one hand edit of a tracked file and gives up G-D1's "migration is the first step" |
| I2. Convert the global file to YAML (D's I3) | `fgos config set --global` and `doctor --fix` refuse a JSON global file (`config-format-legacy-json`); after C nothing but a person writes it | ends the dual format, about 100 lines reusing `migrate.rs` |
| I3. One `findExecutableOnPath` | JS has two (`src/state/tool-registry.mjs:135`, `src/runner/paths.mjs:150`) and phase 05 adds a third in Rust | a Rust verb or door entry the two JS callers use; its own item (RUL11) |
| I4. A `fgos config sweep` verb | phase 09's parity sweep is a scratch script; every project that upgrades would want the same report | the report as a verb, about 120 lines |
| I5. Retire the legacy `.fgos/gate-bypass.json` fallback | decision C8 keeps it; it is read in Node and Rust | one less file format; needs a migration of repositories that hold only it |
| I6. A stronger confined fact than D4's marker | D4's marker can be unset by a worker; the mount view is the boundary | a process-tree or namespace fact in `fgos-identity`, cross-lane |
| I7. `fgctl init` writing the header-only project file | `init` exists in the crate after phase 05 | onboarding creates the file in Rust, not through `fgos setup` |

## Unresolved questions

1. Keep `explain` and `applyPatch` in the door now (as requested, no in-repo Node caller after C) or defer them until a caller exists (saves about 45 lines)? Default: keep.
2. Confirm C14: `dispatch-decide` refuses on a `config-*` refusal and stays open on an infrastructure failure.
3. Confirm C13 (retire `config-awareness`) and C11 (the `bin` cache leaves config; a stale `bin` key only warns).
4. C6 keeps `--config <path>` through the YAML door; the alternative is removing the flag from `discover`, `plan` and the third verb.
5. D as landed may differ from [D-ASSUMED] (marker name, `session_class` signature, door entry names, location of `accounts::read`); phase 00 adapts and records, a changed D contract goes back to the owner only if it changes this scope.
6. Third-party projects outside the owner's machines: C17 raises `config-format-legacy-json` to a failure for them too; is a release note enough (CHANGELOG), or should the severity wait a release?
7. Whether fg-server2 can reach D's stage 2 before landing C is unknown (G2 left it unchecked); under G-C1 option A it simply activates later.

## Coordinator answers (2026-10-23 19:00, settled by analysis; owner may overrule at frame approval)

1. No `explain` or `applyPatch` addon entry without an in-repo Node caller (RUL104): `fgos config explain|set|unset|patch` are Rust native verbs from Slice D; add a door entry only in the change that adds its first Node caller.
2. `dispatch-decide` refuses on `config-*` refusals (spec section 11: enforcement hooks fail closed on a config that does not parse or breaks the profile) and keeps today's behaviour on infrastructure failures; changing the infrastructure case is out of this slice.
3. Retire the `config-awareness` doctor row (the snapshot's provenance answers it) and move `bin.globalFgosPath` to `~/.fgos/runtime/bin-cache.json` (spec section 8: a cache, not config).
4. `--config <path>`: keep it only if a caller outside the test suite uses it (phase 00 checks with rg); otherwise remove the flag and its tests in the same change (L10).
