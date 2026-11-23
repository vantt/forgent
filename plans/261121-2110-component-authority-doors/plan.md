---
contract: plan-v1
title: "Component authority doors: locate and declare, the plan-time mapping rule, twin and debt retirement, and primitive-and-alias land checks"
status: running
lead: head:lead-forgent-261121-2110-compon-e8af7
base: 575d2750d4576110b3f74772bee79d4c0d0ac8a8
priority: P1
blockedBy:
  - 261121-2109-component-authority
  - 261118-1341-s6a-execution-tier-rust
  - 261120-0625-work-data-model
  - 261121-1309-git-windows-custody
  - 261121-1456-windows-ci-packaging-reds
footprint:
  - plans/261121-2110-component-authority-doors/**
  - packages/component-authority/**
  - docs/platform/component-authority/spec.md
  - Cargo.toml
  - Cargo.lock
  - apps/fgos/Cargo.toml
  - apps/fgos/src/main.rs
  - packages/host-runtime/rust/src/catalog.rs
  - test/cli/subcommand-flag-drift.test.mjs
  - apps/fgos/src/routing.rs
  - apps/fgos/src/invocation_doors.rs
  - apps/fgos/src/cli_projector.rs
  - apps/fgos/src/wiring/mod.rs
  - apps/fgos/src/wiring/authority.rs
  - apps/fgos/src/wiring/mailbox_root.rs
  - apps/fgos/src/wiring/run_dirs.rs
  - apps/fgos/src/wiring/run.rs
  - apps/fgos/tests/authority.rs
  - apps/fgos-gateway/src/gateway.rs
  - apps/fgctl/src/help.rs
  - packages/host-runtime/contracts/command-manifest.json
  - packages/host-runtime/contracts/command-routes.json
  - packages/host-runtime/contracts/command-route-annotations.json
  - packages/host-runtime/rust/src/providers/external_process/bound_invocation_supervisor.rs
  - packages/herdr-fgos-common/rust/src/fgos.rs
  - packages/holder-lock/rust/src/state_root.rs
  - packages/holder-lock/rust/src/route.rs
  - packages/holder-lock/rust/src/borrow_vectors.rs
  - packages/holder-lock/rust/src/borrow_windows.rs
  - packages/holder-lock/rust/Cargo.toml
  - packages/run-supervisor/rust/src/route.rs
  - packages/run-supervisor/rust/src/adopt.rs
  - packages/run-supervisor/rust/src/supervise.rs
  - packages/run-supervisor/rust/src/supervise/windows.rs
  - packages/run-supervisor/rust/src/attempt_step.rs
  - packages/run-supervisor/rust/src/controller/launch.rs
  - packages/run-supervisor/rust/src/gate/windows.rs
  - packages/run-supervisor/rust/src/steps.rs
  - packages/run-supervisor/rust/Cargo.toml
  - packages/terminal-control/rust/src/route.rs
  - packages/terminal-control/rust/src/driver/herdr.rs
  - packages/terminal-control/rust/Cargo.toml
  - packages/session-host/rust/src/route.rs
  - packages/session-host/rust/Cargo.toml
  - packages/run-result/rust/src/lib.rs
  - packages/distribution/rust/src/init.rs
  - packages/distribution/rust/Cargo.toml
  - packages/git/rust/src/driver.rs
  - packages/git/node-addon/src/single_load.rs
  - packages/process/rust/src/containment/linux.rs
  - packages/process/rust/src/mapped.rs
  - test/rust-host/vectors/envelope/version.json
  - packages/process/rust/src/platform/windows_spawn.rs
  - packages/config/rust/src/detect.rs
  - packages/config/rust/Cargo.toml
  - packages/mailbox/rust/store/src/adapters/version.rs
  - packages/mailbox/rust/store/src/nudge.rs
  - packages/mailbox/rust/store/Cargo.toml
  - packages/convention/contracts/convention.rules.v1.json
  - docs/platform/packaging-distribution/spec.md
  - src/setup/agent-hooks.mjs
  - src/setup/shell-rc.mjs
  - src/setup/agy-permissions.mjs
  - src/setup/registrations.mjs
  - src/setup/checks.mjs
  - src/cli/command-registry.mjs
  - src/runner/dispatch/**
  - src/runner/execution/**
  - src/runner/capability-config.mjs
  - src/runner/agent-listing.mjs
  - src/util/host-bin-path.mjs
  - src/runner/worktree.mjs
  - src/runner/merge.mjs
  - src/runner/operation-choice.mjs
  - src/runner/work-dispatch.mjs
  - src/runner/repo-locks.mjs
  - src/workflow/unit-handoff.mjs
  - src/state/porting-store.mjs
  - src/state/store.mjs
  - scripts/lib/mailbox-live-confined.mjs
  - scripts/lib/git-ports.mjs
  - scripts/write-test-marker.mjs
  - packages/execution/rust/src/checks.rs
  - packages/distribution/rust/src/agent_hooks.rs
  - packages/git/contracts/mutation-census.v1.json
  - test/suite-baseline.json
  - scripts/fgos-session-start-hook.mjs
  - scripts/agents-vectors.mjs
  - src/session-host/head-request.mjs
  - src/workflow/definition.mjs
  - test/runner/write-scope.test.mjs
  - test/git/write-scope-parity.test.mjs
  - test/state/domain-registry-compiled.test.mjs
  - test/helpers/agents-vectors.helper.mjs
  - test/helpers/executor-model-vectors.helper.mjs
  - scripts/plan-contract-check.mjs
  - test/scripts/plan-contract-check.test.mjs
  - test/architecture.test.mjs
  - scripts/component-authority-render.mjs
  - test/component-authority/**
  - src/report/decision-index.mjs
  - test/report/decision-index.test.mjs
  - src/setup/instruction-registry.mjs
  - docs/platform/packaging-distribution/contracts/setup-doctor-registry.md
  - docs/platform/README.md
  - docs/platform/component-boundary.md
  - docs/platform/governance.md
  - docs/platform/architecture-map.md
  - docs/platform/system-overview/spec.md
  - docs/platform/observe/spec.md
  - docs/platform/workflow/spec.md
  - scripts/lib/mailbox-behaviour-v7e.mjs
  - scripts/lib/mailbox-behaviour-v7h.mjs
  - scripts/lib/mailbox-behaviour-v7i.mjs
  - scripts/lib/mailbox-behaviour-v7j.mjs
  - test/live/mailbox-behaviour.v7e-addendum.json
  - test/live/mailbox-behaviour.v7h-addendum.json
  - test/live/mailbox-behaviour.v7i-addendum.json
  - test/live/mailbox-behaviour.v7j-addendum.json
  - test/live/mailbox-behaviour.v7k-addendum.json
  - test/live/mailbox-behaviour.v7m-addendum.json
  - test/live/mailbox-behaviour.v7n-addendum.json
  - test/live/mailbox-claude.live.mjs
  - test/live/mailbox-behaviour.live.mjs
  - test/scripts/mailbox-behaviour-v7e.test.mjs
  - test/scripts/mailbox-behaviour-v7h.test.mjs
  - test/scripts/mailbox-behaviour-v7i.test.mjs
  - test/scripts/mailbox-behaviour-v7j.test.mjs
  - test/scripts/mailbox-behaviour-v7n.test.mjs
  - test/scripts/mailbox-live-confined.test.mjs
  - docs/platform/agent-mailbox/spec.md
  - packages/mailbox/rust/store/src/adapters/extension.rs
  - test/setup/**
  - test/runner/dispatch/**
  - test/runner/dispatch-*
  - test/runner/capability-config.test.mjs
  - test/runner/agent-listing.test.mjs
  - test/runner/merge*
  - test/runner/worktree*
  - test/runner/repo-locks*
  - test/runner/operation-choice*
  - test/runner/work-dispatch*
  - test/workflow/unit-handoff*
  - test/state/store*
  - test/state/porting*
  - test/util/**
  - core/skills/_shared/plan-contract.md
  - core/skills/fgos-shaping/**
  - domains/coding/skills/fgos-coding-planning/**
  - domains/coding/skills/fgos-coding-implement/**
  - domains/coding/skills/fgos-coding-validating/**
  - domains/coding/skills/fgos-coding-shaping/**
  - .agents/skills/**
  - plugins/fgOS/skills/**
  - .claude/skills/**
  - CHANGELOG.md
  - packages/distribution/rust/src/doctor.rs
  - apps/fgos/src/wiring/doctor/mod.rs
source:
  - plans/discussions/ds-at6x3xj2ng-component-authority/DISCUSSION.md
created: 2026-11-21
---

# Component authority doors

Provenance: follows from backlog rows `p-esa3lau6kd` and `p-7nja6ilwkr`, both done with `261121-2109-component-authority`
(their Done-when were met there); they left `source` on 2026-11-23 because a running plan may not cite a done row.

## Outcome

`fgos authority locate "<sentence>"` returns the components, decision kinds, doors and contracts in the model
that match a description of the work. `fgos authority declare` adds or moves a model row through admission,
and always asks the owner before adding a new component or decision kind. Planning, implement and the
documentation-writing skills must call these doors. The plan contract requires an **Authority map**: each new
decision, function or module maps to a model row or to a `declare`, and a plan that overlaps something existing
names the survivor. `scripts/plan-contract-check.mjs` and the validating reviewer reject a plan without one. Every
door `debt` entry is gone, and the old copy of each is deleted in the same change, with its last SHA recorded
(CA-D2). The one exception is named debt (owner decision D6, 2026-11-23): the row `doctor-readiness-registry`, and
`installation-shim-location` while backlog `p-rypvkc3kai` is open, keep their `debt` with `retiredBy` naming the
Workflow/Work port (S6b/S7 of `261114-2051-rust-verb-migration-program`) or that backlog item, and the door guard
allows debt on no other row. The door guard matches by primitive and by canonical name plus aliases, never by bare words (decision
0031), and counts matches inside allowed files. A new-named copy of an owned primitive turns `npm test` red.
The structural model is YAML, which people can read and annotate like the config standard. Only the Rust crate
`packages/component-authority/rust` reads and writes it, through `fgos-yaml-doc`. The renderer is the crate verb
`fgos authority render`, and Node code gets model data only from `fgos authority model --json`. No JSON model file
and no JavaScript reader of the model remain (phase 1b).

The model, spec, contract index and generated views come from the sibling plan
[`261121-2109-component-authority`](../261121-2109-component-authority/plan.md), which this plan is blocked by.

## Facts (prior art, written 2026-11-21 at bf061ff35, refreshed 2026-11-23 at df345c11a)

- The verb wiring pattern is `fgos convention`: `apps/fgos/src/routing.rs:89`
  (`("convention", fgos_convention::AVAILABLE_SUBCOMMANDS)`), `apps/fgos/Cargo.toml:12`, the
  `packages/host-runtime/contracts/command-*.json` manifests, `invocation_doors.rs` and `cli_projector.rs`.
- Door debt: 75 entries in the same 22 rows (76 at bf061ff35). Every debt file is in a phase footprint. Phase 2 of the sibling plan moves each row to
  `packages/component-authority/model/doors/<slug>.json`, and phases 2-4 and 6-9 here list the slug and debt
  files of each row they retire. A running plan (s6a) may retire some debt first, so every retirement phase
  re-reads its rows before it starts.
- Today `checkDoors` (`test/architecture.test.mjs:1860`) matches hand-written regexes per job and does not
  count matches inside `allowed` files. No row uses `ratchet`.
- The planning gap: "Door check" (`core/skills/_shared/plan-contract.md:88-90`) is a footprint-overlap check, and
  "Prior art" has no search step. Only `fgos-coding-implement/SKILL.md:76-82` asks for a search before writing a
  helper, in prose (discussion §3 row 3a(5)).
- Documentation H2 search (pkm + OHS) and admission are signed but not built (discussion §3 row 1b).

## Prior art reused, and what was missing

Reused: the convention verb pattern; the questions crate, to read whether an owner question is answered; the
admission model (independent reviewer within the owner's approved frame, owner asked outside it), run as a step of
plan validation until H2 admission exists; the Git one-door scan's primitive matching
(`scripts/git-one-door-scan.mjs`); vectors-replay as the cut-over safety net (488d3ab28, 046ee5547). Missing: a
lookup door, a write door for the model, a plan-time mapping rule, counting inside allowed files, and alias
matching. The YAML model (phase 1b) reuses the shared YAML loader and writes no parser. `fgos-yaml-doc`
(`packages/yaml-doc/rust`) is the only reader and writer of the model, inside the crate. Node code reaches the
model through `invokeHost` (`src/util/host-bin.mjs`) calling `fgos authority model --json`, never through
`parseYaml`. No npm `yaml` dependency is added. `scripts/component-authority-render.mjs` is ported into the crate
and deleted (owner correction 2026-11-23 14:15).

## Authority map

| New thing | Model row | Note |
|---|---|---|
| `fgos authority locate`, `fgos authority declare` | door rows `component-authority-locate`, `component-authority-declare`, owner `component-authority` | the only lookup and the only write path into the model |
| Authority-map rule in the plan contract | decision kind `component-authority` | extends the plan contract; the existing footprint "Door check" keeps its job and is renamed "Footprint check" so the two are not confused |
| Model read and written as YAML, by the crate only (phase 1b) | component `yaml-document`, door row `yaml-parser-loads` | reuse `fgos-yaml-doc`; no parser, no npm `yaml`, no JavaScript reader |
| `fgos authority render`, `fgos authority model --json` (phase 1b) | component `component-authority`; `render` is the survivor of `scripts/component-authority-render.mjs` | the `.mjs` is deleted in the same commit; Node readers use `invokeHost` |
| Retired twins and copies | each row in `doors/<slug>.yaml` | survivor: the row's allowed door; retired: the debt file, last SHA in the commit |

## Acceptance criteria

1. `fgos authority locate "ghi file nguyên tử"` and `fgos authority locate "atomic file write"` both rank the
   `durable-file` component first, in a `fgos.v1` envelope. Check: `cargo test -p fgos-component-authority`
   and `apps/fgos/tests/authority.rs`.
2. `fgos authority declare --kind component --row <file>` refuses without `--approved-by <q-id>` naming an
   answered owner question. It refuses a duplicate canonical name or alias, a missing parent or owner, and a
   second contract provider. Moving a decision kind refuses without `--plan <dir>`. Check: the crate tests.
3. `node --test test/scripts/plan-contract-check.test.mjs` proves three cases. A `draft` or `ready` plan without
   an `## Authority map` section fails. A map line naming a row that is not in the model and is not a `declare`
   fails. An overlap line without `survivor:` fails. `running`, `done` and `withdrawn` plans are not checked.
   The planning, implement, validating and shaping skills, and `plan-contract.md`, require `locate` before writing
   and `declare` when creating. `npm run build:skills` leaves no diff.
4. No door row in `packages/component-authority/model/doors/` has a `debt` field except the named debt of D6:
   `doctor-readiness-registry`, and `installation-shim-location` while `p-rypvkc3kai` is open, each with a
   `retiredBy`. The guard fails `debt` on any other row, and fails a named-debt row without `retiredBy`. Each
   retirement commit names the deleted path and its last SHA. Check: `node --test test/architecture.test.mjs`.
5. The door guard matches by `primitives` and `names` (canonical plus aliases), and records an allowed `count` per
   file. A synthetic `rename`+`fsync` copy under a new name outside `durable-file` fails `node --test
   test/architecture.test.mjs`, and so does one extra match inside an allowed file. A comment does not fail it.
6. `rg -l architecture-manifest.json` finds only history. `CHANGELOG.md` `## [Unreleased]` names the new verb.
   `npm test` and `cargo test --workspace` are green.
7. `locate` and `declare` work on the model of the project they run in. In a temporary project with no model,
   `locate` answers `authority: inactive` with exit 0, the first `declare` creates an empty schema-valid model under
   `.fgos/authority/model/` (fgOS's own repository keeps `packages/component-authority/model/`) and writes its row (still refusing a new component or decision kind without an answered owner question), and
   `locate` then finds that row. Check: `cargo test -p fgos --test authority` (phase 5, step 6).
8. Every model file under `packages/component-authority/model/` (and the model `declare` creates under
   `.fgos/authority/model/`) is YAML with the same rows. No `*.json` model file is left. Only
   `packages/component-authority/rust` reads or writes the model, through `fgos-yaml-doc` with no new parser and no
   npm `yaml` dependency. `scripts/component-authority-render.mjs` is gone, and its views come from
   `fgos authority render`. No `.mjs` opens a model file: Node tests and readers use `fgos authority model --json`.
   A comment in a model file is ignored. `fgos authority render --check` and `npm run build:skills` leave no diff.
   Check: phase 1b's Verify.

## Non-goals

- Meaning search for `locate` beyond names, aliases and the meaning sentence. That waits for documentation H2's
  pkm + OHS door. No second search engine is built here (CA-D3).
- A second admission engine. Until H2 admission exists, `declare` checks the row and the owner answer, and the
  independent review runs as a plan validation step.
- RUL ids (T8); contract contents.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Crate and `fgos authority locate`](phase-01-crate-and-locate.md) | - | packages/component-authority/rust/, Cargo.toml, Cargo.lock, apps/fgos/Cargo.toml, apps/fgos/src/main.rs, test/cli/subcommand-flag-drift.test.mjs, apps/fgos/src/routing.rs, apps/fgos/src/invocation_doors.rs, apps/fgos/src/cli_projector.rs, apps/fgos/src/wiring/mod.rs, apps/fgos/src/wiring/authority.rs, apps/fgos/tests/authority.rs, packages/host-runtime/contracts/command-manifest.json, packages/host-runtime/contracts/command-routes.json, packages/host-runtime/contracts/command-route-annotations.json, src/cli/command-registry.mjs (lent by phase 2 while it is parked), test/rust-host/vectors/envelope/version.json (generated verb list, regenerated for the new verb) | 1 | done |
| 1b | [The structural model moves to YAML, read only by the Rust crate](phase-01b-model-to-yaml.md) | 1 | packages/component-authority/model/, packages/component-authority/contracts/model.v1.json, packages/component-authority/rust/, Cargo.lock, apps/fgos/src/wiring/authority.rs, apps/fgos/src/routing.rs, apps/fgos/src/invocation_doors.rs, apps/fgos/src/cli_projector.rs, apps/fgos/tests/authority.rs, packages/host-runtime/contracts/command-manifest.json, packages/host-runtime/contracts/command-routes.json, packages/host-runtime/contracts/command-route-annotations.json, packages/host-runtime/rust/src/catalog.rs, src/cli/command-registry.mjs, test/cli/subcommand-flag-drift.test.mjs, test/rust-host/vectors/envelope/version.json, scripts/component-authority-render.mjs, test/component-authority/, test/architecture.test.mjs, src/report/decision-index.mjs, test/report/decision-index.test.mjs, src/setup/instruction-registry.mjs, test/setup/instruction-registry.test.mjs, packages/git/contracts/mutation-census.v1.json, test/suite-baseline.json, docs/platform/component-authority/spec.md, docs/platform/packaging-distribution/contracts/setup-doctor-registry.md, docs/platform/README.md, docs/platform/component-boundary.md, docs/platform/governance.md, docs/platform/architecture-map.md, docs/platform/system-overview/spec.md, docs/platform/observe/spec.md, docs/platform/workflow/spec.md | 2 | done |
| 2a | [Retire the Node agent hook table](phase-02a-agent-hook-table.md) | 1b | src/setup/agent-hooks.mjs, scripts/lib/mailbox-live-confined.mjs, test/setup/agent-hooks.test.mjs, test/scripts/mailbox-live-confined.test.mjs, scripts/lib/mailbox-behaviour-v7e.mjs, scripts/lib/mailbox-behaviour-v7h.mjs, scripts/lib/mailbox-behaviour-v7i.mjs, scripts/lib/mailbox-behaviour-v7j.mjs, test/live/mailbox-behaviour.v7e-addendum.json, test/live/mailbox-behaviour.v7h-addendum.json, test/live/mailbox-behaviour.v7i-addendum.json, test/live/mailbox-behaviour.v7j-addendum.json, test/live/mailbox-behaviour.v7k-addendum.json, test/live/mailbox-behaviour.v7m-addendum.json, test/live/mailbox-behaviour.v7n-addendum.json, test/scripts/mailbox-behaviour-v7e.test.mjs, test/scripts/mailbox-behaviour-v7h.test.mjs, test/scripts/mailbox-behaviour-v7i.test.mjs, test/scripts/mailbox-behaviour-v7j.test.mjs, test/scripts/mailbox-behaviour-v7n.test.mjs, packages/mailbox/rust/store/src/adapters/extension.rs, test/suite-baseline.json, packages/git/contracts/mutation-census.v1.json, packages/component-authority/model/doors/agent-hook-table.yaml, test/live/mailbox-claude.live.mjs, test/live/mailbox-behaviour.live.mjs, test/architecture.test.mjs, packages/component-authority/model/doors/retired-node-s5-hook-script.yaml, packages/component-authority/model/doors/writer-and-session-id-environment.yaml, packages/component-authority/model/doors/delete-guard-keyword-list.yaml, packages/distribution/rust/src/doctor.rs, apps/fgos/src/wiring/doctor/mod.rs, docs/platform/agent-mailbox/spec.md | 5 | done |
| 2b | [Close the delete-guard keyword list twin](phase-02b-delete-guard-keyword-list.md) | 2a | packages/distribution/rust/src/agent_hooks.rs, packages/component-authority/model/doors/delete-guard-keyword-list.yaml | 6 | done |
| 2c | [Retire the wire-agents settings wording](phase-02c-person-agent-config-writes.md) | 1b | src/cli/command-registry.mjs, packages/host-runtime/contracts/command-manifest.json, packages/component-authority/model/doors/person-agent-config-writes.yaml | 5 | done |
| 2d | [Retire the Node shell-rc detector](phase-02d-shell-rc-fgos-lines.md) | 1b | src/setup/shell-rc.mjs, scripts/fgos-session-start-hook.mjs, test/setup/shell-rc.test.mjs, test/suite-baseline.json, packages/git/contracts/mutation-census.v1.json, packages/component-authority/model/doors/shell-rc-fgos-lines.yaml | 4 | done |
| 2e | [Retire the dead Node agy sub-home finder](phase-02e-execution-doctor-judgments.md) | 1b | src/setup/agy-permissions.mjs, test/setup/agy-permissions.test.mjs, packages/execution/rust/src/checks.rs, test/architecture.test.mjs, test/suite-baseline.json, packages/git/contracts/mutation-census.v1.json, packages/component-authority/model/doors/execution-doctor-judgments.yaml | 3 | done |
| 2f | [Close the Node doctor body map](phase-02f-doctor-readiness-registry.md) | 1b | packages/component-authority/model/doors/doctor-readiness-registry.yaml | 3 | draft |
| 2g | [Close the herdr driver's own shim path](phase-02g-installation-shim-location.md) | 1b | packages/component-authority/model/doors/installation-shim-location.yaml | 3 | draft |
| 3a | [Move the live write-scope callers onto the Rust rule](phase-03a-footprint-write-scope-overlap-rule.md) | 1b | src/session-host/head-request.mjs, src/workflow/definition.mjs | 3 | done |
| 3a2 | [Delete the JS write-scope port](phase-03a2-delete-write-scope-port.md) | 3a | src/runner/dispatch/write-scope.mjs, test/runner/write-scope.test.mjs, test/git/write-scope-parity.test.mjs, test/state/domain-registry-compiled.test.mjs, test/suite-baseline.json, packages/git/contracts/mutation-census.v1.json, packages/component-authority/model/doors/footprint-write-scope-overlap-rule.yaml | 7 | draft |
| 3b | [Close the Node tool-provider twin](phase-03b-tool-lookup-by-capability.md) | 1b | packages/component-authority/model/doors/tool-lookup-by-capability.yaml | 3 | draft |
| 3c | [Retire the Node executor-fact twins](phase-03c-derive-executor-facts.md) | 1b | src/runner/capability-config.mjs, test/runner/capability-config.test.mjs, src/runner/agent-listing.mjs, test/runner/agent-listing.test.mjs, scripts/agents-vectors.mjs, test/helpers/agents-vectors.helper.mjs, test/helpers/executor-model-vectors.helper.mjs, test/setup/packaged-definitions.test.mjs, test/suite-baseline.json, packages/git/contracts/mutation-census.v1.json, packages/component-authority/model/doors/derive-executor-facts.yaml | 8 | draft |
| 3d | [Close the Node dispatch decider twin](phase-03d-decide-a-dispatch.md) | 1b | packages/component-authority/model/doors/decide-a-dispatch.yaml | 3 | draft |
| 3e | [Close the Node and holder-lock global-directory copies](phase-03e-global-fgos-directory.md) | 1b | packages/component-authority/model/doors/global-fgos-directory.yaml | 4 | draft |
| 4 | [Retire the invocation-root and .fgos-join copies](phase-04-path-root-copies.md) | 1b | apps/fgos/src/wiring/mailbox_root.rs, src/util/host-bin-path.mjs, src/runner/worktree.mjs, src/runner/merge.mjs, src/runner/operation-choice.mjs, src/runner/work-dispatch.mjs, src/state/porting-store.mjs, src/state/store.mjs, test/util/, test/runner/merge*, test/runner/worktree*, test/runner/operation-choice*, test/runner/work-dispatch*, test/state/store*, test/state/porting*, packages/component-authority/model/doors/resolve-invocation-root.yaml, packages/component-authority/model/doors/join-fgos-onto-project-root.yaml | 4 | done |
| 5 | [`declare`, the Authority-map rule and the skill wiring](phase-05-declare-and-skill-wiring.md) | 1b | packages/component-authority/rust/, Cargo.lock, apps/fgos/src/main.rs, test/cli/subcommand-flag-drift.test.mjs, apps/fgos/src/routing.rs, apps/fgos/src/invocation_doors.rs, apps/fgos/src/cli_projector.rs, apps/fgos/src/wiring/authority.rs, apps/fgos/tests/authority.rs, packages/host-runtime/contracts/command-manifest.json, packages/host-runtime/contracts/command-routes.json, packages/host-runtime/contracts/command-route-annotations.json, core/skills/_shared/plan-contract.md, core/skills/fgos-shaping/, domains/coding/skills/fgos-coding-planning/, domains/coding/skills/fgos-coding-implement/, domains/coding/skills/fgos-coding-validating/, domains/coding/skills/fgos-coding-shaping/, scripts/plan-contract-check.mjs, test/scripts/plan-contract-check.test.mjs, .agents/skills/, plugins/fgOS/skills/, .claude/skills/ | 4 | done |
| 6 | [Retire the checkout copies](phase-06-checkout-copies.md) | 2c, 4 | src/cli/command-registry.mjs, src/runner/repo-locks.mjs, src/workflow/unit-handoff.mjs, src/runner/merge.mjs, scripts/lib/git-ports.mjs, test/runner/repo-locks*, test/workflow/unit-handoff*, test/runner/merge*, packages/component-authority/model/doors/checkout-make-provision-remove.yaml | 6 | done |
| 7 | [Retire the Rust argument-parser, run-dirs and packaging copies](phase-07-rust-parse-rundirs-packaging.md) | 5 | packages/holder-lock/rust/src/route.rs, packages/holder-lock/rust/Cargo.toml, packages/run-supervisor/rust/src/route.rs, packages/run-supervisor/rust/src/adopt.rs, packages/run-supervisor/rust/src/supervise.rs, packages/run-supervisor/rust/Cargo.toml, packages/terminal-control/rust/src/route.rs, packages/terminal-control/rust/Cargo.toml, packages/session-host/rust/src/route.rs, packages/session-host/rust/Cargo.toml, apps/fgctl/src/help.rs, scripts/write-test-marker.mjs, apps/fgos/src/wiring/run_dirs.rs, packages/run-result/rust/src/lib.rs, packages/distribution/rust/src/init.rs, Cargo.lock, packages/component-authority/model/doors/parse-cli-arguments.yaml, packages/component-authority/model/doors/list-run-directories.yaml, packages/component-authority/model/doors/no-node-from-native-packaging.yaml | 5 | done |
| 8 | [Retire process-control, /proc, kernel-lock and bounded-child copies in the process tier](phase-08-process-primitive-copies.md) | 2a, 7 | packages/git/rust/src/driver.rs, scripts/lib/mailbox-live-confined.mjs, packages/holder-lock/rust/src/borrow_vectors.rs, packages/git/node-addon/src/single_load.rs, packages/host-runtime/rust/src/providers/external_process/bound_invocation_supervisor.rs, packages/process/rust/src/containment/linux.rs, packages/process/rust/src/mapped.rs, packages/process/rust/src/platform/windows_spawn.rs, packages/run-supervisor/rust/src/attempt_step.rs, packages/run-supervisor/rust/src/controller/launch.rs, packages/run-supervisor/rust/src/gate/windows.rs, packages/run-supervisor/rust/src/steps.rs, packages/run-supervisor/rust/src/supervise.rs, packages/run-supervisor/rust/src/supervise/windows.rs, packages/run-supervisor/rust/Cargo.toml, Cargo.lock, packages/component-authority/model/doors/process-control-signal.yaml, packages/component-authority/model/doors/process-facts-proc.yaml, packages/component-authority/model/doors/kernel-lock-primitive.yaml, packages/component-authority/model/doors/run-bounded-child.yaml | 6 | done |
| 5c | Node model readers in temp projects (fix of 5's project model rule, reported by the supervisor in phase 8's file) | 5 | src/setup/instruction-registry.mjs, src/report/decision-index.mjs, test/setup/instruction-registry.test.mjs, test/report/decision-index.test.mjs | 7 | done |
| 9 | [Retire the remaining bounded-child copies](phase-09-bounded-child-copies.md) | 3e, 8 | apps/fgos-gateway/src/gateway.rs, apps/fgos/src/wiring/run.rs, packages/config/rust/src/detect.rs, packages/config/rust/Cargo.toml, packages/distribution/rust/src/init.rs, packages/distribution/rust/Cargo.toml, packages/holder-lock/rust/src/borrow_windows.rs, packages/holder-lock/rust/Cargo.toml, packages/mailbox/rust/store/src/adapters/version.rs, packages/mailbox/rust/store/src/nudge.rs, packages/mailbox/rust/store/Cargo.toml, packages/terminal-control/rust/src/driver/herdr.rs, packages/terminal-control/rust/Cargo.toml, Cargo.lock, packages/component-authority/model/doors/run-bounded-child.yaml, packages/component-authority/model/doors/global-fgos-directory.yaml | 7 | draft |
| 10 | [Door guard by primitive and aliases, counted, no debt but the named debt](phase-10-land-checks.md) | 2a, 2b, 2c, 2d, 2e, 4, 6, 7, 8 | test/architecture.test.mjs, packages/component-authority/model/doors/, packages/component-authority/contracts/model.v1.json, docs/platform/component-authority/spec.md | 9 | done |
| 10b | [Fill `names`, `primitives` and allowed `count` on every door row, and fix the guard's latent notes](phase-10b-fill-door-names-primitives-count.md) | 10 | packages/component-authority/model/doors/, test/architecture.test.mjs | 11 | running |
| 11 | [Sweep and integration](phase-11-sweep-and-integration.md) | 5, 10 | packages/convention/contracts/convention.rules.v1.json, docs/platform/packaging-distribution/spec.md, src/cli/command-registry.mjs, CHANGELOG.md, docs/platform/component-authority/spec.md, plans/261121-2110-component-authority-doors/ | 10 | draft |
| 12 | Retire every named debt right after the release (owner answer B to q-aanvfxaopa, 2026-11-24) | 11 | to be cut by the planner: the rows phase 10 names, including the process-tier survivors (winpid reader, single-instance lock, own-child polls), which need footprint outside this plan's | 11 | draft |

**Per-row re-cut (q-swxkda2x5r A, applied 2026-11-23 by the planner).** The old phases 2 and 3 are replaced by one
phase per door row (2a-2g, 3a-3e). Each retires one row's twin and moves only that row's callers. The old phase
files are gone; their blocked unit reports stay under `reports/` (unit-261123-0819-p02-result.md,
unit-261123-0819-p03-result.md). Phases 6, 8 and 9 now depend on the single rows they share files with (6 on 2c,
8 on 2a, 9 on 3e). Phase 4 no longer waits on phase 3, because no new phase shares its files.

**Re-cut per owner decision D6 (2026-11-23 16:3x, discussion `ds-wham5txfkv` step 0, applied by the planner).**
Doors closes before the Workflow/Work port. Phase 10 locks every door except the named debt of 2f (and 2g while
`p-rypvkc3kai` is open), with `retiredBy` the port or that item, so phases 10 and 11 no longer depend on 2f or 2g.
2f and 2g stay in the table and run only if their wait clears before phase 10 starts; otherwise the port (or
`p-rypvkc3kai`) removes the debt in the change that deletes the last body, and phase 11 records the hand-off. The
owner closed O6 the same day: there is no warn-only switch for the door guard.

Phase 3a was cut in two. The order was that 3a deletes the four dead Node files (`dispatch/config-twin.mjs`,
`evidence-attribution.mjs`, `settlement.mjs`, `execution/unit.mjs`) instead of rewiring them. They have no live
product importer, but at `a1b4054ba` other dead closure modules (`dispatch/assignment-runner.mjs`, `plan.mjs`,
`resolve.mjs`, `transport.mjs`, `session-attempt.mjs`, `execution-contract.mjs`, `execution/unit-summary-twin.mjs`) and 35
test files still import them, and all of those belong to `261122-2108-delete-dead-node-execution-closure` (its
phases 5-8). Deleting the four here would mean doing that plan's work inside doors. So nothing in doors rewires them,
and `261122-2108` phase 8 deletes them with the rest of the closure. 3a now only moves the two live callers onto the
addon's `writeScope` and has no wait. The new 3a2 deletes `write-scope.mjs`, its tests and the debt once phase 8
has removed the four, its last importers. Phase 10 already waited on that phase through 3b and 3d, so the split
adds no wait to doors closing.

**Provider (owner order, 2026-11-23 09:01, restated in D6 step 0):** every writing unit of every phase is
dispatched with `--provider claude` (`fgos run ... --provider claude`, or `provider: claude` on the unit in a
`--units` file). A unit that cannot get claude parks and reports; it does not fall back to another provider.

**Waits (each such phase stays `draft` until its wait clears; details are in the phase file):**
- Phase 1 is done (207b6459d). Phase 1b can run now, and every other phase waits for it.
- Phase 1b is done: `component-authority-doors/p1b` published to origin/main as 57087d7bd (2026-11-23 17:29), all units
  on `--provider claude`, cargo and node checks run by the lead, one independent review with two fix rounds. The land
  door then reported `git-wal-corrupt` after the push, so local main still needs `fgos git recover` (raised to
  lead:SUPERVISOR; the confined lead cannot run it). Carried forward: `test/architecture.test.mjs` reads tier
  exceptions as `{from, to}` while `model.v1.json` and the crate use `{path, tier, reason}` (the list is empty;
  phase 10 owns that test and aligns it); decision-index and instruction projection now need a host (the 1b risk).
- 2c, 2e and 3a are done (2026-11-23, all claude units, lead checks, independent review): 2e landed as b81101706,
  2c as 24b28aa6f, 3a as c3125be3b, after the owner's `fgos git recover` (q-7t27x2qfk2: land-2187705 recovered, 5 ops
  kept, writers 2459310, 2284602, 4006723, 3689246 and remote 91299783). None of the kept ops blocked a land; the
  plan edit landed first (4aa141c2d), and 3a needed one retry for `merge-slot-busy` from another lander.
- 2a, 2d, 4 and 5 started 2026-11-23 19:52 (claude units c-202902, c-202913, c-202925, c-202935; worktrees `-p2a`,
  `-p2d`, `-p4b`, `-p5b` off 20ad16de0). 2a and 2d both write `test/suite-baseline.json`, so they land one after the
  other; 2b waits for 2a.
  Landed once local main caught up (the supervisor's land e2bec445f carried a853b89fb; q-hlbqhlyrct below): 2d as
  a853b89fb (published 20:10), 4 as 4853f26a1 (the five Work-file `.fgos` joins plus `src/runner/merge.mjs:679` from review; the three
  `resolve-invocation-root` debts stay named debt for phase 10 per q-jol5tcok22 A, with `apps/fgos/src/wiring/mailbox_verbs.rs:297`
  as a second `mailbox_fgos_dir` caller), 5 as 174a1e45e (declare verb, project model path rule, Authority-map rule
  and skill wiring; two lead-prepared fix rounds after the lead's checks and one independent review). Lead decision in
  5: the Authority-map check applies to `draft`/`ready` plans created on or after 2026-11-24 (`AUTHORITY_MAP_REQUIRED_FROM`),
  so the 35 existing plans without a map stay landable. Kept on purpose in 5: the project test's approved-declare half
  returns early under an agent caller (same pattern as `apps/fgos/tests/questions_verb.rs:292`), so CI or a person's
  shell proves it. 2a reran with the six widened paths (q-bioobcr52m A) and stopped at step 3 with nothing changed:
  `fgos wire-agents` cannot install a workspace's hook rows, and `fgos doctor --fix` (the door that can) takes no row.
  2a is `draft` again and waits on q-xs6oex5amb (recommended: `fgos doctor --fix --only <row>`); 2b waits on 2a.
  The owner answered q-xs6oex5amb option A in the lead's chat (2026-11-23 22:24): `fgos doctor --fix` gains
  `--only <row-id>`, and the harnesses install workspace hooks through it. 2a then also writes
  `packages/distribution/rust/src/doctor.rs` and `apps/fgos/src/wiring/doctor/mod.rs`, which are outside the footprint;
  the supervisor landed those two lines in the plan and phase 2a footprints (2026-11-23 22:35) and asked Miu to record
  the answer in the store; 2a starts now.
- 2a is done: landed as 326b79eb7 (claude units, lead checks, one independent review, five fix rounds). It adds
  `fgos doctor --fix --only <fix-id>`; the mailbox harnesses install workspace hooks through it; `src/setup/agent-hooks.mjs`
  is deleted (last SHA 871a77074) with its byte-level cases owned by `agent_hooks.rs` and its goldens, while
  `test/setup/agent-hooks.test.mjs` keeps the proofs that run the generated hook code, now installed through the Rust door.
  Addenda v7e, v7h, v7i, v7j, v7k and v7m are retired; v7n keeps its measured bytes and its test no longer compares it with
  a rebuild (plan 261117-0831's rule: no hash-only refresh); backlog p-irt4weqipe owns the new frozen set. Lead-run proofs:
  hook execution tests 17/17, v7n 3/3, the phase's node set 138/151 with 0 failing (13 skipped), doctor crate 26/26,
  agent_hooks 12/12, doctor projection 8/8. The supervisor landed the widened footprint (the v7n test and the
  agent-mailbox spec, whose links now name `agent_hooks.rs`). Not run here: the live suites and the bwrap path of the new
  install. For phase 11: `docs/platform/packaging-distribution/spec.md:169` and `docs/reading-map.md:190` still name the
  deleted file, `fgos doctor --fix --only` needs a CHANGELOG line and a line in the doctor registry contract doc, and
  `retired-node-s4-verb-code.yaml` can now turn `uninstallAgentHooks`/`deleteGuardPrefilter` into patterns.
- 2b is done with no change of its own: 2a deleted the row's only debt file and emptied its `debt` (with `retiredBy`), and
  `agent_hooks.rs` already pins the keyword list to `contracts/delete-guard-prefilter.v1.json`
  (`the_prefilter_data_renders_the_regular_expression_the_case_globs_and_the_matches_of_the_vectors`, run in the 12/12 above).
- 6 is done, narrowed by the owner's answer q-lnjt5zzbfq B (in the lead's chat, 2026-11-23 23:18): it only rewords the
  `worktree` verb text (no `worktreeSetup` token) and drops that one debt; landed as a640ef6a6. The checkout crate has no
  create at a given branch, path and base, no prune of a missing checkout and no remove under a held custody, so the
  four other debts of `checkout-make-provision-remove` (repo-locks, unit-handoff, merge catch-up, git-ports) stay; phase
  10 names them with `retiredBy` the backlog item the supervisor was asked to open (event ae0b8d15fffe796f).
- 7 is done: landed as 5684c9727 (one review, one lead-prepared fix round). The run-supervisor, terminal-control and
  session-host route argv readers and `scripts/write-test-marker.mjs` read through the CLI argument parser; the host's
  run-dir listers ask `fgos-execution`'s assignment layout and case runs root. Kept as named debt: the run-result walk
  (`fgos-execution` depends on `fgos-run-result`), the `init.rs` node probe (until `requires.node` goes), holder-lock's own
  route flag reader, and `packages/run-supervisor/rust/src/controller/adopt_scan.rs` (`list_open_attempt_dirs`, an
  unlisted twin found by review that keeps the retired Node rules; a backlog item must pick the survivor). fgctl's
  `--name=value` grammar is `allowed`. Lead-run proofs: the three route crates 436 pass (the one failure, the
  head-request contract missing `config patch`, also fails on main), run_dirs 2/2, write-test-marker, internal-routes
  and architecture green except the git-dependent config-door case. For phase 11: prune the two Node-only `openAttempts`
  rows of `test/rust-host/fixtures/run-dirs-vectors.json` with the Node listers (p-24xw2cwdvo), and rename the
  `parseArgs` import of `test/scripts/write-test-marker.test.mjs`.
- 8 started 2026-11-23 23:33 (claude unit c-469562, worktree `-p8` off main).
  8 is `draft` again, parked on q-aanvfxaopa (asked 2026-11-23 23:37; supervisor raise in the same turn). The first unit
  (c-469562) changed nothing: cargo was refused in its sandbox and most debts lack a survivor
  (reports/unit-261123-2333-p8-result.md). Slice 1 landed as 7d084487a: the driver.rs test kill goes through
  `identity_of` + `signal_by_identity`, and that debt is gone from `process-control-signal`. Two moves were dropped:
  the git PATH lookup (the unit hid a hand PATH split from the pattern, and `resolve_program` has no
  absolute-entries-only mode) and the node lookup in `attempt_step.rs` (the land's one-door census scan cannot
  follow `resolve_program`'s return, so it reported two unresolved-binary sites at `attempt_step.rs:179`). Lead
  proofs: fgos-git all green; fgos-run-supervisor 268 pass, 2 red (the head-request contract missing `config patch`,
  red on main; the handover test hit ETXTBSY once and passed 3/3 alone); `test/architecture.test.mjs` 84 pass, A4
  red on main as well. Independent review: no blocking finding. The rest of the phase (own-child try_wait polls,
  the V7n module, the winpid read, the single_load flock) waits for the owner's answer. Worktree `-p8` kept (dirty:
  the first unit's untracked report, copied here). For a later phase: teach the census scan to follow
  `resolve_program` before moving any PATH lookup onto it.
- Owner answer to q-aanvfxaopa, option B, in the lead's chat (2026-11-24 00:1x): everything left is named debt, and
  ALL debt is handled right after component-authority releases. Why: the component must run early so it can guard
  further improvement. The lead applied it: 8 is `done` (slice 1 plus named debt). 10 no longer waits on 3a2, 3b-3e
  or 9, and 11 no longer waits on them either; phase 10 names every debt still in the model, each with a `retiredBy`
  (a row's existing plan, program step or backlog item where it has one, otherwise `261121-2110-component-authority-doors#phase-12`).
  New phase 12 (after 11) retires them all; the planner cuts it, and the supervisor widens the footprint it needs.
  2f, 2g, 3a2, 3b-3e and 9 keep their own waits and fold into 12 when those clear. The supervisor writes the answer
  back to the store (`questions answer` is not in the lead's grant).
- 10 is done: landed as 3aa23ccc5 (claude units, lead checks, one independent review, one fix for a D-local citation
  the land gate caught). The guard matches `names` as identifiers and `primitives` as regexes on code tokens, counts
  allowed files, and locks the named list: the 17 rows that still hold debt, each with `retiredBy`
  (reports/unit-261124-0015-p10-result.md). The crate loads `names`, `primitives` and `count` (888bb3563), but no
  model row writes them: the land gates use the activated host, whose crate would refuse them. Lead proofs:
  architecture 90/91 (A4 red on main too), crate 37 + 23, host authority 4/4. 10b fills them once a release that
  carries 888bb3563 is activated (the supervisor's call; 10b stays `draft` until then), and first fixes the review's latent notes: a Rust char
  literal `'"'` read as a string start, strings not blanked outside JS and Rust, a pattern and a primitive on one
  token counted twice, a count above the real total never reported stale, and the stale `cặp cổng` header comment
  at `test/architecture.test.mjs:13`. Criterion 4's `rg -l '^debt:'` also lists the 56 `debt: []` files; it means
  non-empty debt.
- 11 steps 1-5a landed as 9db8081b4 (claude unit; report unit-261124-0035-p11-result.md, which records the named-debt
  hand-off row by row). The convention rule `doc-architecture-manifest-1` became `component-authority-model-1`, the
  packaging spec and the command-registry comment are repointed, decision-history lines placed, CHANGELOG has three
  lines (authority locate|declare with the Authority-map rule, `doctor --fix --only`, the door guard and its named
  debt), and the spec says Implemented. Lead proofs: `cargo test -p fgos-convention` green; the land gate ran
  convention-conformance, convention-client and definition-files green; criterion 6's `rg` lists only lines marked
  "(retired; last commit 00dddf7ae)". 11 is `draft` again for step 6 only: `npm test` and `cargo test --workspace` on
  the combined tree, which the confined lead cannot run (its cargo build directory and `.fgos/runtime` are
  read-only); asked of the supervisor. Out-of-footprint follow-ups, for the secretary: `docs/reading-map.md:190`,
  `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md` (`doctor --fix --only`),
  `packages/distribution/rust/src/rc_lines.rs:7-8`, `docs/platform/secrets/spec.md:68`,
  `docs/explanation/agy-permission-denylist-not-allowlist.md:61`, `retired-node-s4-verb-code.yaml` patterns,
  `test/rust-host/fixtures/run-dirs-vectors.json` Node-only rows (p-24xw2cwdvo), the `parseArgs` import name in
  `test/scripts/write-test-marker.test.mjs`, and the seat-binding and agent-mailbox decision-history lines.
- What is left of the plan: 11 step 6 (a full suite run), 10b (after a release carrying 888bb3563 is activated),
  and 12 (after the release; the planner cuts it). 2f, 2g, 3a2, 3b-3e and 9 fold into 12.
- 5c started 2026-11-23 23:58 (claude unit c-189804, worktree `-p5c`): the supervisor's 9 main reds
  (instruction-registry x8, decision-index:241). Cause confirmed by the lead: `model_dir` reads a root as the fgOS
  repository only when it carries `packages/component-authority/contracts/model.v1.json`. The test fixtures lack
  that file, so the host answers `{"authority":"inactive"}` and the Node readers iterate an absent field.
  5c is done: landed as 339a43126 (claude unit in a fresh worktree `-p5c2`, report unit-261124-0003-p5c2-result.md).
  The two readers treat an inactive answer as no model, and the two fixtures carry the own contract. Lead proof:
  the two test files pass 65/65 with the fix and fail 8 without it; the land gates ran them green. The first
  `-p5c` units wrote the same edits but settled `policy-refusal` (invalid result claim) and then `inconclusive`
  (the worktree was already dirty), so nothing was committed there; worktree `-p5c` is left for the supervisor.
  For phase 10: the `join-fgos-onto-project-root` pattern misses joins written as `'.fgos/<sub>'`; the
  `subcommand-flag-drift` test fails on main for the `doc` verb (not this plan's). For phase 11:
  `packages/distribution/rust/src/rc_lines.rs:7-8` and `docs/platform/packaging-distribution/spec.md:925` still name
  `src/setup/shell-rc.mjs`. Follow-ups noted by the phase 5 review, not done here: a sequence append in
  `packages/yaml-doc` (declare appends a row by text, checked by parse-back), a partial first declare leaves a model
  that needs a hand clean-up and two declares are not locked, and the checker's host call takes no repository root.
- Owner answers 2026-11-23 20:21 (via Miu), written back by the supervisor: q-bioobcr52m option A, so 2a is widened by
  exactly six paths (`test/live/mailbox-claude.live.mjs`, `test/live/mailbox-behaviour.live.mjs`, `test/architecture.test.mjs`
  and the door rows `retired-node-s5-hook-script.yaml`, `writer-and-session-id-environment.yaml`,
  `delete-guard-keyword-list.yaml`), only to re-point or remove references to `src/setup/agent-hooks.mjs`; the live
  scripts move onto the Rust installer (`fgos wire-agents`); if it cannot target a temporary workspace the unit stops and
  reports. `test/architecture.test.mjs` is also phase 10's file, so 2a and 10 never run at once.
  q-jol5tcok22 option A: phase 4 counts as done once its join half lands; phase 10 names the three
  `resolve-invocation-root` debts with their `retiredBy` (mailbox-verb move, S7).
  q-hlbqhlyrct (owner answer 20:55: the supervisor runs the recover and the secretary rotation edit
  `personas.secretary.soft` 0.15 -> 0.30): both are refused from the confined supervisor head (`fgos git` read-only
  floor; `fgos config set` refuses a confined session) and no unconfined `lead:SUPERVISOR` is live. Local main has
  caught up anyway: the supervisor's land `e2bec445f` (20:56) carries `a853b89fb`, so lands to main go again. The
  recover of any still-pending operation and the config edit wait on an unconfined actor.
- 2f, 2g, 3b, 3c, 3d and 3e were not started on the 19:58 order: their footprints are clear but no wait has cleared
  (S6b/S7 unplanned; p-rypvkc3kai and p-n22bigucgp `proposed`; 261122-2108 phase 8 `draft`, its files still present).
  The 13:15 reports of 2f, 2g, 3b and 3d are copied into `reports/`; worktrees `-p2f`, `-p2g`, `-p3b`, `-p3d` can go.
  For phase 10: `packages/distribution/rust/src/agent_config.rs` still holds a dead copy of the agy sub-home finder
  (`find_agy_sub_homes`, `check_agy_sub_homes_configured`) that the `execution-doctor-judgments` row's pattern misses.
  For phase 11: `docs/platform/secrets/spec.md:68` and `docs/explanation/agy-permission-denylist-not-allowlist.md:61`
  still name the deleted `src/setup/agy-permissions.mjs` finder. 3a makes the domain registry load the native addon
  at import time (present under every activated host; a bare `node bin/fgos.mjs` now names the missing addon).
- Parked 2026-11-23 15:33 (supervisor, event d492b9bc8c9e776f): phase 1b waits for runner capacity. Gemini is at its
  provider limit, and the deepseek and thehive fallbacks failed three units on infrastructure (the 10 MB output limit,
  a request deadline, an invalid snapshot). Branch `component-authority-doors/p1b` keeps unit 1 (30aea9d42). It resumes
  when lead:SUPERVISOR reports capacity and closes the release window. Owner orders that wait for the lead to apply here:
  the phase 10 split (event 8d551d5b), the router rule for the routing phases (d63021bb), and phase 1 of
  `261122-2108` going first (1c09e852). lead:SUPERVISOR relays them.
- 2a and 2b do not wait for the mailbox lane (owner decision 2026-11-23, via Miu). 2a deletes the Node hook table and
  retires or re-points the frozen v7e/v7h/v7i/v7j sets (and v7k/v7m/v7n, whose frozen confinement module it
  changes) in the same change. Backlog `p-irt4weqipe` owns the mailbox re-measurement afterwards, and it blocks
  nothing here. 2b waits only for 2a.
- 2f waits for Rust migration steps S6b and S7 (`261114-2051-rust-verb-migration-program`), which move the last
  Node-owned doctor bodies. It no longer blocks phase 10 or 11 (D6): its row is named debt, `retiredBy` the port.
- 2g waits for backlog item `p-rypvkc3kai` (the herdr crate edge, kept out of this plan by the owner's answer). It no
  longer blocks phase 10 or 11 (D6): while the item is open its row is named debt, `retiredBy` the item.
- 3a has no wait. 3a2, 3b, 3c, 3d and 3e wait for phase 8 of `261122-2108-delete-dead-node-execution-closure`, which owns deleting the dead Node
  execution closure (the rows' `retiredBy`, `p-24xw2cwdvo`). These phases close the door rows and retire what that
  plan leaves live; they never edit its files while it runs. 3e also waits for `p-n22bigucgp` (the home-directory
  rule).
- 2c, 2d, 2e and 3a can run once 1b lands.

**Waves.** Shared files decide them. `packages/git/contracts/mutation-census.v1.json` and `test/suite-baseline.json`
have one writer per wave (2e, 2d, 2a, 3a2 and 3c, in waves 3, 4, 5, 7 and 8). `Cargo.lock` has one writer per wave
(phases 1, 1b, 5, 7, 8 and 9). `src/cli/command-registry.mjs` and the command manifest are written by phases 1, 5, 2c,
6 and 11, each in a different wave. `doors/global-fgos-directory.yaml` is written by 3e and then 9;
`doors/run-bounded-child.yaml` by 8 and then 9; `test/architecture.test.mjs` by 1b, then 2e, then 10.
Phase 1b sits alone in wave 2 because it rewrites every model file that the later phases edit, so every other
undone phase moved two waves later and depends on it, directly or through another phase. Generated skill
surfaces are regenerated with `npm run build:skills` in phase 5 only. A retirement phase that finds a caller
outside its footprint stops and reports instead of widening.

**Footprint widening (2026-11-23).** Only paths that no running plan lists were added (checked against
`261123-0726-contract-check-in-confined-heads`, `261123-0821-runner-recheck-replays-account-view` and
`261122-0118-heads-stable-and-able`): `packages/execution/rust/src/checks.rs`,
`packages/distribution/rust/src/agent_hooks.rs`, `packages/git/contracts/mutation-census.v1.json`,
`test/suite-baseline.json`, `scripts/fgos-session-start-hook.mjs`, `scripts/agents-vectors.mjs`,
`src/session-host/head-request.mjs`, `src/workflow/definition.mjs`, `test/runner/write-scope.test.mjs`,
`test/git/write-scope-parity.test.mjs`, `test/state/domain-registry-compiled.test.mjs`,
`test/helpers/agents-vectors.helper.mjs` and `test/helpers/executor-model-vectors.helper.mjs`. The draft plan
`261122-2108-delete-dead-node-execution-closure` also lists the two helpers and the dispatch directories. 3a and 3c
run only after its phase 8, so the two plans never write those files at the same time.

**Owner approval (2026-11-21 23:34):** the owner approved this plan as written (option A of the approval question lead:SUPERVISOR put to him). It stays `draft` only for the refresh below. Once that refresh passes, the planner or supervisor sets `ready` with no further owner question.

**Refresh (2026-11-23, planner wake on the settled discussion).** Every `blockedBy` plan is `done`, the debt rows
were re-read (above), `base` moved to `df345c11a`, and the contract check passes, so the plan is `ready`. Footprint
overlap that remains is held by admission, not by `blockedBy` (`packages/supervision/rust/src/portfolio.rs:252-265`
admits no plan whose footprint overlaps a `running` one):
- `261122-0056-orchestration-skeleton` (running) shares the host routing and command manifests,
  `apps/fgos/src/cli_projector.rs`, `apps/fgos/src/wiring/mod.rs`, `apps/fgos-gateway/src/gateway.rs`,
  `scripts/plan-contract-check.mjs` and its test, `core/skills/_shared/plan-contract.md`, the generated skill
  surfaces and `CHANGELOG.md`. This plan starts after it is done.
- `261122-1950-owner-communication-standard` (ready) shares `plan-contract.md`, the coding and shaping skills, the
  generated skill surfaces and `CHANGELOG.md`; `261122-2217-docos-pkm-locate-door` (draft) shares `Cargo.toml`,
  `Cargo.lock`, the host routing files, `src/cli/command-registry.mjs` and `test/architecture.test.mjs`. Whichever
  is admitted first holds the other; their order is the secretary's call, not this plan's.
- Each phase re-reads its files at its own start, because the plans above will have changed them.

## Owner questions

**q-klz3vkxjee (lead:SUPERVISOR, 2026-11-23 12:2x, within the approved frame):** `packages/host-runtime/rust/src/catalog.rs` joins the footprint for the one `authority.locate` OperationDescriptor row phase 1 needs; no running plan lists it.


- q-sieckdvccb (add `apps/fgos/src/main.rs` and `test/cli/subcommand-flag-drift.test.mjs` to the footprint so the authority verb can be registered and listed): option A, decided by lead:SUPERVISOR 2026-11-23 10:3x within the approved frame. No running plan lists either file (checked against 0726, 0821, 0118 and 0828).
- q-swxkda2x5r (phases 2-3 need callers outside the footprint): the owner answered A on 2026-11-23. A planner re-cuts
  phases 2-4 into one phase per door row, re-checks 6, 8 and 9, and widens the footprint by exactly the callers of
  each row it plans. Applied 2026-11-23 to phases 2 and 3 (see "Per-row re-cut" above). Phase 4 already lists its
  two rows' callers and stays whole until a unit finds an outside caller. The frozen mailbox rows and the herdr crate edge become their own backlog items or wait for
  their owning lane. The outcome and acceptance criteria stay as they are, and no door row is dropped.
- Owner order 2026-11-23 12:5x, relayed by lead:SUPERVISOR (scope addition, approved): `locate` and `declare` use
  the model of the project they run in; the first `declare` in a project without a model creates an empty one; with
  no model, `locate` and the skills report inactive. Folded into phase 5 as step 6, with acceptance 7. Phase 5
  already owns the verb, its wiring and its tests, so the footprint does not change, and a separate phase would
  share all of phase 5's files.
- Owner addition 2026-11-23 12:50, relayed by lead:SUPERVISOR: in a project other than fgOS the model lives under
  `.fgos/authority/model/`; the fgOS repository keeps `packages/component-authority/model/`. Applied to phase 5
  step 6 (one path rule in the authority wiring), the step 5 gate, and acceptance 7. Footprint unchanged.
- q-3iylevstr2 (`locate` in projects without a model): the owner answered A on 2026-11-23. `locate` is a gated
  capability. The skills call it only where the project has `packages/component-authority/model/`, and record
  `authority: inactive` otherwise, as the impact-analysis gate does. `plan-contract-check` skips the Authority-map
  rule when there is no model. Applied in phase 5, step 5.
- Owner decision 2026-11-23 14:08 (option a), relayed by lead:SUPERVISOR: the structural model moves from JSON to
  YAML, inside this plan, right after phase 1 and before every phase that reads or writes the model. Applied as
  phase 1b, with acceptance 8, a YAML note in phase 5 (`declare` writes through the YAML door's comment-keeping
  editor; the new-project model is YAML), and `.json` to `.yaml` model paths in phases 2a-3e, 6, 9 and 10. The
  footprint gains six paths that no running plan lists: `scripts/component-authority-render.mjs`,
  `test/component-authority/**`, `src/report/decision-index.mjs`, `test/report/decision-index.test.mjs`,
  `src/setup/instruction-registry.mjs` and `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`.
  The other plans checked were the eight other `running` plans as of this edit.
- Owner reminder 2026-11-23, relayed by lead:SUPERVISOR: reuse the shared YAML loader and write no parser. Phase 1b's
  Prior art and Authority map name `fgos-yaml-doc` (landed 33f1e9f4f).
- Owner correction 2026-11-23 14:15, relayed by lead:SUPERVISOR: no JavaScript reads or writes the model. Phase 1b
  is rewritten so that only the crate touches the YAML. The renderer becomes the crate verb `fgos authority render`
  and the `.mjs` is deleted in the same change. Node tests and readers (`test/architecture.test.mjs`,
  `decision-index.mjs`, `instruction-registry.mjs`) get model data from `fgos authority model --json` through
  `invokeHost`. Model-validity cases of `test/component-authority/**` move to crate tests. Phase 5's checker asks
  the same verb and no longer applies the path rule in Node. Footprint additions: the seven generated view docs,
  plus phase 1 verb-wiring files that are already in the plan footprint. No running plan lists the docs.
- Owner decision 2026-11-23 (via Miu, relayed by lead:SUPERVISOR 14:15): 2a and 2b do not wait for the mailbox
  re-measurement. The wait is dropped. 2a retires or re-points the frozen sets and their tests in the same change,
  and names `p-irt4weqipe` as the owner of the re-measurement. 2a's footprint gains its freeze files, builders,
  tests and `packages/mailbox/rust/store/src/adapters/extension.rs`. Only `261122-0118-heads-stable-and-able` lists
  any `test/live/` path among running plans, `test/live/head-grant-probe.live.mjs`, which is not one of them.

- D6 (owner, 2026-11-23 16:3x, discussion `ds-wham5txfkv`, relayed by lead:SUPERVISOR): option (a), doors closes
  with the named debt of 2f (and 2g while `p-rypvkc3kai` is open), `retiredBy` the port; O6 closed with no warn-only
  switch; 3a's dead files are not rewired; every writing unit pins `--provider claude`. Applied in the re-cut above,
  phases 3a, 3a2, 2f, 2g, 10 and 11, and acceptance 4. Footprint unchanged: every path of 3a and 3a2 was already in it.

None open. Shape choices the planner settled from the evidence:
- Verb name `fgos authority` with subcommands `locate` and `declare`, after the `fgos convention` pattern.
- Until H2 exists, `declare` checks the owner answer through the question store (`--approved-by`), and the
  independent review runs at plan validation.
- The Authority-map rule applies only to `draft` and `ready` plans, so plans already running are not failed after
  the fact.

## Risks and rollback

- **A retirement breaks behaviour that the twin covered.** Before deleting a Node copy, record vectors from it and
  replay them on the survivor (the 488d3ab28 pattern). Proof point for validating: each retirement phase names
  its vectors or the existing test that owns the behaviour.
- **The primitive guard is too broad and blocks legitimate code.** Primitives are scoped per door row, and every
  allowed file carries a count and a reason. The synthetic tests prove both a catch and a pass.
- **The bounded-child consolidation (19 copies) is larger than two phases.** Phases 8 and 9 each stop at two days
  and report what is left. The rest becomes a new phase in this plan, not debt.
- **Rollback:** each phase is its own commit. A retirement is reverted by its commit, which restores the deleted
  copy. Phase 10 is reverted before any retirement it depends on.

## Outstanding questions

None.

Lead, 2026-11-24 02:20: the supervisor's run cleared both waits. Release 9e5ae72c (main 728212c1f, carries 888bb3563) is activated, so 10b runs now (phase file written). Phase 11 step 6 is read from `plans/reports/report-261124-0215-manual-supervisor-suite-and-release.md` and its triage; see the phase 11 note below the table.

Supervisor, 2026-11-24 01:50 +07 (event 67369ca905e0f96d): the lead is gone and is not restarted while the plan only waits. Parked on the unconfined full-suite run started 01:38 on `main` `980d1276d` (docs-only since): `npm test` then `cargo test --workspace`, logs `.fgos/runtime/tmp/suite-npm.log` and `.fgos/runtime/tmp/suite-cargo.log` (each ends with an `exit N` line). The next supervisor wake that finds both exit lines starts the lead again; the lead reads the logs and closes from them.
