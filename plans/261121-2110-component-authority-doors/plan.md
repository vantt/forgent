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
  - scripts/plan-contract-check.mjs
  - test/scripts/plan-contract-check.test.mjs
  - test/architecture.test.mjs
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
(CA-D2). The door guard matches by primitive and by canonical name plus aliases, never by bare words (decision
0031), and counts matches inside allowed files. A new-named copy of an owned primitive turns `npm test` red.

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
matching.

## Authority map

| New thing | Model row | Note |
|---|---|---|
| `fgos authority locate`, `fgos authority declare` | door rows `component-authority-locate`, `component-authority-declare`, owner `component-authority` | the only lookup and the only write path into the model |
| Authority-map rule in the plan contract | decision kind `component-authority` | extends the plan contract; the existing footprint "Door check" keeps its job and is renamed "Footprint check" so the two are not confused |
| Retired twins and copies | each row in `doors/<slug>.json` | survivor: the row's allowed door; retired: the debt file, last SHA in the commit |

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
4. No door row in `packages/component-authority/model/doors/` has a `debt` field, and the schema no longer allows
   one. Each retirement commit names the deleted path and its last SHA. Check: `node --test test/architecture.test.mjs`.
5. The door guard matches by `primitives` and `names` (canonical plus aliases), and records an allowed `count` per
   file. A synthetic `rename`+`fsync` copy under a new name outside `durable-file` fails `node --test
   test/architecture.test.mjs`, and so does one extra match inside an allowed file. A comment does not fail it.
6. `rg -l architecture-manifest.json` finds only history. `CHANGELOG.md` `## [Unreleased]` names the new verb.
   `npm test` and `cargo test --workspace` are green.

## Non-goals

- Meaning search for `locate` beyond names, aliases and the meaning sentence. That waits for documentation H2's
  pkm + OHS door. No second search engine is built here (CA-D3).
- A second admission engine. Until H2 admission exists, `declare` checks the row and the owner answer, and the
  independent review runs as a plan validation step.
- RUL ids (T8); contract contents.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Crate and `fgos authority locate`](phase-01-crate-and-locate.md) | - | packages/component-authority/rust/, Cargo.toml, Cargo.lock, apps/fgos/Cargo.toml, apps/fgos/src/main.rs, test/cli/subcommand-flag-drift.test.mjs, apps/fgos/src/routing.rs, apps/fgos/src/invocation_doors.rs, apps/fgos/src/cli_projector.rs, apps/fgos/src/wiring/mod.rs, apps/fgos/src/wiring/authority.rs, apps/fgos/tests/authority.rs, packages/host-runtime/contracts/command-manifest.json, packages/host-runtime/contracts/command-routes.json, packages/host-runtime/contracts/command-route-annotations.json, src/cli/command-registry.mjs (lent by phase 2 while it is parked) | 1 | parked: waits for lead:SUPERVISOR to land the two footprint lines (q-sieckdvccb option A) and for the runner recheck fix 261123-0821 (binding mismatch on c-41164); work on branch component-authority-doors/p01b ([lead report](reports/lead-261123-0915-wave-1-parked.md)) |
| 2 | [Retire the setup and CLI twins](phase-02-setup-cli-twins.md) | - | src/setup/agent-hooks.mjs, src/setup/shell-rc.mjs, src/setup/agy-permissions.mjs, src/setup/registrations.mjs, src/setup/checks.mjs, src/cli/command-registry.mjs, scripts/lib/mailbox-live-confined.mjs, packages/herdr-fgos-common/rust/src/fgos.rs, test/setup/, packages/component-authority/model/doors/agent-hook-table.json, packages/component-authority/model/doors/delete-guard-keyword-list.json, packages/component-authority/model/doors/person-agent-config-writes.json, packages/component-authority/model/doors/shell-rc-fgos-lines.json, packages/component-authority/model/doors/execution-doctor-judgments.json, packages/component-authority/model/doors/doctor-readiness-registry.json, packages/component-authority/model/doors/installation-shim-location.json | 1 | parked: callers outside the footprint, owner question q-swxkda2x5r ([report](reports/unit-261123-0819-p02-result.md)) |
| 3 | [Retire the dispatch twins and the global-directory copies](phase-03-dispatch-twins.md) | - | src/runner/dispatch/, src/runner/execution/, src/runner/capability-config.mjs, src/runner/agent-listing.mjs, packages/holder-lock/rust/src/state_root.rs, test/runner/dispatch/, test/runner/dispatch-*, test/runner/capability-config.test.mjs, test/runner/agent-listing.test.mjs, packages/component-authority/model/doors/footprint-write-scope-overlap-rule.json, packages/component-authority/model/doors/tool-lookup-by-capability.json, packages/component-authority/model/doors/derive-executor-facts.json, packages/component-authority/model/doors/decide-a-dispatch.json, packages/component-authority/model/doors/global-fgos-directory.json | 1 | parked: callers outside the footprint, owner question q-swxkda2x5r ([report](reports/unit-261123-0819-p03-result.md)) |
| 4 | [Retire the invocation-root and .fgos-join copies](phase-04-path-root-copies.md) | 3 | apps/fgos/src/wiring/mailbox_root.rs, src/util/host-bin-path.mjs, src/runner/worktree.mjs, src/runner/merge.mjs, src/runner/operation-choice.mjs, src/runner/work-dispatch.mjs, src/state/porting-store.mjs, src/state/store.mjs, test/util/, test/runner/merge*, test/runner/worktree*, test/runner/operation-choice*, test/runner/work-dispatch*, test/state/store*, test/state/porting*, packages/component-authority/model/doors/resolve-invocation-root.json, packages/component-authority/model/doors/join-fgos-onto-project-root.json | 2 | draft |
| 5 | [`declare`, the Authority-map rule and the skill wiring](phase-05-declare-and-skill-wiring.md) | 1 | packages/component-authority/rust/, Cargo.lock, apps/fgos/src/main.rs, test/cli/subcommand-flag-drift.test.mjs, apps/fgos/src/routing.rs, apps/fgos/src/invocation_doors.rs, apps/fgos/src/cli_projector.rs, apps/fgos/src/wiring/authority.rs, apps/fgos/tests/authority.rs, packages/host-runtime/contracts/command-manifest.json, packages/host-runtime/contracts/command-routes.json, packages/host-runtime/contracts/command-route-annotations.json, core/skills/_shared/plan-contract.md, core/skills/fgos-shaping/, domains/coding/skills/fgos-coding-planning/, domains/coding/skills/fgos-coding-implement/, domains/coding/skills/fgos-coding-validating/, domains/coding/skills/fgos-coding-shaping/, scripts/plan-contract-check.mjs, test/scripts/plan-contract-check.test.mjs, .agents/skills/, plugins/fgOS/skills/, .claude/skills/ | 2 | draft |
| 6 | [Retire the checkout copies](phase-06-checkout-copies.md) | 2, 4 | src/cli/command-registry.mjs, src/runner/repo-locks.mjs, src/workflow/unit-handoff.mjs, src/runner/merge.mjs, scripts/lib/git-ports.mjs, test/runner/repo-locks*, test/workflow/unit-handoff*, test/runner/merge*, packages/component-authority/model/doors/checkout-make-provision-remove.json | 3 | draft |
| 7 | [Retire the Rust argument-parser, run-dirs and packaging copies](phase-07-rust-parse-rundirs-packaging.md) | 5 | packages/holder-lock/rust/src/route.rs, packages/holder-lock/rust/Cargo.toml, packages/run-supervisor/rust/src/route.rs, packages/run-supervisor/rust/src/adopt.rs, packages/run-supervisor/rust/src/supervise.rs, packages/run-supervisor/rust/Cargo.toml, packages/terminal-control/rust/src/route.rs, packages/terminal-control/rust/Cargo.toml, packages/session-host/rust/src/route.rs, packages/session-host/rust/Cargo.toml, apps/fgctl/src/help.rs, scripts/write-test-marker.mjs, apps/fgos/src/wiring/run_dirs.rs, packages/run-result/rust/src/lib.rs, packages/distribution/rust/src/init.rs, Cargo.lock, packages/component-authority/model/doors/parse-cli-arguments.json, packages/component-authority/model/doors/list-run-directories.json, packages/component-authority/model/doors/no-node-from-native-packaging.json | 3 | draft |
| 8 | [Retire process-control, /proc, kernel-lock and bounded-child copies in the process tier](phase-08-process-primitive-copies.md) | 2, 7 | packages/git/rust/src/driver.rs, scripts/lib/mailbox-live-confined.mjs, packages/holder-lock/rust/src/borrow_vectors.rs, packages/git/node-addon/src/single_load.rs, packages/host-runtime/rust/src/providers/external_process/bound_invocation_supervisor.rs, packages/process/rust/src/containment/linux.rs, packages/process/rust/src/mapped.rs, packages/process/rust/src/platform/windows_spawn.rs, packages/run-supervisor/rust/src/attempt_step.rs, packages/run-supervisor/rust/src/controller/launch.rs, packages/run-supervisor/rust/src/gate/windows.rs, packages/run-supervisor/rust/src/steps.rs, packages/run-supervisor/rust/src/supervise.rs, packages/run-supervisor/rust/src/supervise/windows.rs, packages/run-supervisor/rust/Cargo.toml, Cargo.lock, packages/component-authority/model/doors/process-control-signal.json, packages/component-authority/model/doors/process-facts-proc.json, packages/component-authority/model/doors/kernel-lock-primitive.json, packages/component-authority/model/doors/run-bounded-child.json | 4 | draft |
| 9 | [Retire the remaining bounded-child copies](phase-09-bounded-child-copies.md) | 3, 8 | apps/fgos-gateway/src/gateway.rs, apps/fgos/src/wiring/run.rs, packages/config/rust/src/detect.rs, packages/config/rust/Cargo.toml, packages/distribution/rust/src/init.rs, packages/distribution/rust/Cargo.toml, packages/holder-lock/rust/src/borrow_windows.rs, packages/holder-lock/rust/Cargo.toml, packages/mailbox/rust/store/src/adapters/version.rs, packages/mailbox/rust/store/src/nudge.rs, packages/mailbox/rust/store/Cargo.toml, packages/terminal-control/rust/src/driver/herdr.rs, packages/terminal-control/rust/Cargo.toml, Cargo.lock, packages/component-authority/model/doors/run-bounded-child.json, packages/component-authority/model/doors/global-fgos-directory.json | 5 | draft |
| 10 | [Door guard by primitive and aliases, counted, no debt](phase-10-land-checks.md) | 2, 3, 4, 6, 7, 8, 9 | test/architecture.test.mjs, packages/component-authority/model/doors/, packages/component-authority/contracts/model.v1.json, docs/platform/component-authority/spec.md | 6 | draft |
| 11 | [Sweep and integration](phase-11-sweep-and-integration.md) | 5, 10 | packages/convention/contracts/convention.rules.v1.json, docs/platform/packaging-distribution/spec.md, src/cli/command-registry.mjs, CHANGELOG.md, docs/platform/component-authority/spec.md, plans/261121-2110-component-authority-doors/ | 7 | draft |

Phases 1-3 run in parallel in wave 1, phases 4-5 in wave 2 and phases 6-7 in wave 3 (phases 3, 4 and 6 share test files under `test/runner/`, so they are serialized). `Cargo.lock` has one writer per wave (phases 1,
5, 7, 8, 9). Phases 8 and 9 both touch `doors/run-bounded-child.json`, in different waves. Generated skill
surfaces are regenerated with `npm run build:skills` in phase 5 only. A retirement phase that finds a caller
outside its footprint stops and reports instead of widening.

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

- q-sieckdvccb (add `apps/fgos/src/main.rs` and `test/cli/subcommand-flag-drift.test.mjs` to the footprint so the authority verb can be registered and listed): option A, decided by lead:SUPERVISOR 2026-11-23 10:3x within the approved frame. No running plan lists either file (checked against 0726, 0821, 0118 and 0828).
- Open with the owner: q-swxkda2x5r (phases 2-3 re-cut) and q-3iylevstr2 (locate gated in projects without a model).

None. Shape choices the planner settled from the evidence:
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
