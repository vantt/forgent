---
contract: plan-v1
title: "Confinement to Rust: the role's own work runs inside the cage, a peers head keeps its own pid namespace, and the Node confinement twins are ported and deleted"
status: draft
priority: P1
blockedBy:
  - 261122-2108-delete-dead-node-execution-closure
base: cc78d4bf6f81702827c501cacbeb46958618ac23
footprint:
  - plans/261124-1853-confinement-to-rust/**
  - packages/execution/engine/src/confinement/**
  - packages/execution/engine/tests/confinement_policy.rs
  - packages/execution/engine/tests/confinement_driver.rs
  - packages/execution/engine/tests/confinement_request.rs
  - packages/execution/contracts/confinement-driver/bwrap.v1.json
  - src/runner/dispatch/confinement/**
  - src/runner/dispatch/session-attempt.mjs
  - src/runner/dispatch/effective-execution-contract.mjs
  - test/runner/dispatch-confinement-*.test.mjs
  - test/runner/confinement-registry-fixture.helper.mjs
  - packages/component-authority/model/doors/process-facts-proc.yaml
  - packages/git/contracts/mutation-census.v1.json
  - docs/platform/agent-confinement/spec.md
  - CHANGELOG.md
source:
  - plans/discussions/ds-4qpcunq7n7-confinement-to-rust/DISCUSSION.md
  - p-fsg6aolefe
  - p-oqs75qwyco
  - p-ndortdckid
  - p-ia2v33b54u
  - p-btxvtb34u3
created: 2026-11-24
---

# Confinement to Rust

Mode: standard. This plan takes phases 4 and 5 of `261124-0004-heads-operate-without-owner` as the owner split them
on 2026-11-24 (`plans/discussions/ds-4qpcunq7n7-confinement-to-rust/DISCUSSION.md`). The product rules it builds are
PC-D7 and PC-D10 of `plans/discussions/ds-liu5g4k3gh-privileged-chores-research/DISCUSSION.md` (the cage holds the
role's own work, including the project's declared verify commands; in forgent `npm test` and `cargo test --workspace`)
and the tighter design of backlog `p-oqs75qwyco`. None is reopened here.

## Outcome

- A confined head runs its own work inside its cage: the verify commands the project declares (`land.gates`), owner
  answers, mail and friction records. The cage still never opens `.fgos`, `.git` or the release to a grant.
- A peers-granted head (secretary, supervisor) keeps its own pid namespace: it can neither list nor signal host
  processes and cannot rewrite another session's registration, key or socket, while ListAgents and SendMessage still
  work both ways. If the spike of phase 4 shows they cannot, the grant stays as it is and the report names the verb the
  tighter design needs (a valid end, below).
- The change is written once, in Rust, in the code that already cages heads: a head launches through
  `launchSessionInHost` into `packages/execution/engine/src/confinement/` (`policy/resolver.rs`, `driver/bwrap.rs`).
  The Node twins `src/runner/dispatch/confinement/workspace-paths.mjs`, `resources.mjs` and `drivers/bwrap.mjs` are
  ported (any behaviour only they hold moves to the Rust twin), every remaining caller moves, and the three files and
  their tests are deleted. The `process facts: read /proc` door no longer allows `drivers/bwrap.mjs`.

## Acceptance criteria

1. Each phase's verify command passes (listed in its phase file).
2. `git ls-files src/runner/dispatch/confinement/workspace-paths.mjs src/runner/dispatch/confinement/resources.mjs src/runner/dispatch/confinement/drivers/bwrap.mjs`
   prints nothing, and `rg -n "drivers/bwrap.mjs" packages/component-authority/model/doors/process-facts-proc.yaml`
   finds nothing.
3. `npm test` and `cargo test --workspace` are green on the integrated tree (phase 5).
4. `plans/261124-1853-confinement-to-rust/reports/integration.md` holds the before table of phase 1 and an after table
   taken on the active release: the declared verify commands, `friction record`, mail send from Miu and
   `questions answer` from Miu each pass inside a confined head, and the pid-namespace row states which branch phase 4
   took with its evidence.

## Non-goals

- Phases 1, 2, 3, 6 and 7 of `261124-0004` (the charter, the argv window and its table, help and mail, the release
  rule, their integration). A cause that needs `.fgos` writable is not opened in the cage; it is written down as a
  window job for 0004's permission table.
- Rows in `test/live/head-grant-probe.live.mjs`: 0004 owns that file. This plan runs the probe as it is and records the
  cage rows in its own report.
- A new verb. If peer liveness must be answered by the run supervisor (phase 4, branch 3), that verb is a new item
  (RUL104), not built here.
- Porting the rest of `src/runner/dispatch/` or `src/session-host/`: `261122-2108` deletes the dead closure; the
  HARDEN per-layer round owns what stays.
- Starting any lead.

## Prior art (reused, missing)

Reused: the Rust confinement already live for heads (`packages/execution/engine/src/confinement/`: `policy/resolver.rs`
binds the peer sessions at step 5b, `driver/bwrap.rs` drops `--unshare-pid` for a peers launch at about line 854,
`request/attestation.rs` checks the pid flag); its tests `packages/execution/engine/tests/confinement_*.rs`; the
peer-sessions grant and its accepted escape hatch in `docs/platform/agent-confinement/spec.md` §9.1; the
`validateWorkspacePaths` ban on `.fgos`, `.git` and the release; the live grant probe of plan 0118 phase 11; the
`friction record` and `questions answer` socket verbs of plan 0118 phase 2, which phase 3 re-proves rather than
rebuilds; the inventory of `plans/discussions/ds-wham5txfkv-node-rust-port-inventory/DISCUSSION.md` §6 for what the
Node confinement files are.

Missing, built here: writable per-head private caches and targets so declared verify commands run; a pid namespace for
peers heads with only the head's own registration files writable; deletion of the Node twins.

Checked before writing: 0004 phases 4 and 5 planned these fixes in Node in place; the split moves them to the Rust
twin, which is the code the head launch runs today (`src/session-host/head-start.mjs` calls `launchSessionInHost`).

Since this draft: plan 261127-1220 landed a toolchain-cache resource in
`packages/execution/engine/src/confinement/policy/resolver.rs` (`2fea3d10d6`, agent-confinement spec §9.4). Rebase on
it and keep the resource when moving the resolver.

## Authority map

| New thing | Model row | Note |
|---|---|---|
| Writable per-head private caches and targets for declared verify commands | `agent-confinement` | Rust resolver; contract `CTR011` (confinement authority) unchanged in shape |
| Peers head keeps its own pid namespace; peer-sessions binding read-only except the head's own files | `agent-confinement` | Rust driver and resolver; spec §9.1 rewritten |
| Node confinement twins ported to Rust | `agent-confinement` | Overlaps the Node twins, survivor: `agent-confinement` (`packages/execution/engine/src/confinement/`); retired: `src/runner/dispatch/confinement/workspace-paths.mjs`, `src/runner/dispatch/confinement/resources.mjs`, `src/runner/dispatch/confinement/drivers/bwrap.mjs` |
| Door allowance of `drivers/bwrap.mjs` | `process-facts-proc` | Allowance removed with the file; survivor: `process-facts-proc` (its Rust twin row stays); retired: the `src/runner/dispatch/confinement/drivers/bwrap.mjs` allowance |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Diagnose the cage on the active release](phase-01-cage-diagnosis.md) | - | plans/261124-1853-confinement-to-rust/reports/cage-diagnosis.md | 1 | draft |
| 2 | [Port and delete the Node confinement twins](phase-02-retire-node-twins.md) | - | src/runner/dispatch/confinement/**, src/runner/dispatch/session-attempt.mjs, src/runner/dispatch/effective-execution-contract.mjs, test/runner/dispatch-confinement-*.test.mjs, test/runner/confinement-registry-fixture.helper.mjs, packages/execution/engine/src/confinement/**, packages/execution/engine/tests/confinement_policy.rs, packages/execution/engine/tests/confinement_driver.rs, packages/execution/engine/tests/confinement_request.rs, packages/execution/contracts/confinement-driver/bwrap.v1.json, packages/component-authority/model/doors/process-facts-proc.yaml, packages/git/contracts/mutation-census.v1.json, plans/261124-1853-confinement-to-rust/reports/node-twins.md | 1 | draft |
| 3 | [Cage: the role's own work runs inside (Rust)](phase-03-cage-loosen.md) | 1, 2 | packages/execution/engine/src/confinement/policy/**, packages/execution/engine/tests/confinement_policy.rs, docs/platform/agent-confinement/spec.md, plans/261124-1853-confinement-to-rust/reports/cage-loosen.md | 2 | draft |
| 4 | [Cage: a peers head keeps its own pid namespace (Rust)](phase-04-cage-pid-namespace.md) | 3 | packages/execution/engine/src/confinement/**, packages/execution/engine/tests/confinement_driver.rs, packages/execution/engine/tests/confinement_policy.rs, packages/execution/engine/tests/confinement_request.rs, docs/platform/agent-confinement/spec.md, plans/261124-1853-confinement-to-rust/reports/cage-pid-namespace.md | 3 | draft |
| 5 | [Integration, full suite and the after table](phase-05-integration.md) | 1, 2, 3, 4 | CHANGELOG.md, plans/261124-1853-confinement-to-rust/reports/integration.md | 4 | draft |

Wave reading (checked with `node scripts/plan-contract-check.mjs` and `fgos resource-check --plan`): wave 1 holds the
read-only diagnosis (its report only) beside the port, which owns the Node twins and, for behaviour only Node holds,
the Rust confinement tree; the two share no path. Phase 3 edits the Rust policy after both, phase 4 the driver and the
peer-sessions binding after phase 3 (they share `policy/resolver.rs` and the spec, so they are serial). Phase 5 alone
writes `CHANGELOG.md`.

Order against other plans: `261122-2108` (draft) owns `src/runner/dispatch/**` and several
`test/runner/dispatch-confinement-*` files; this plan is `blockedBy` it and starts only once it is `done`, so the port
sees only live code. If 2108's result leaves a live caller of the three files outside this footprint, the lead of
phase 2 stops and asks the supervisor rather than widening the footprint itself. `261124-0004` no longer names any
confinement path, so the two plans do not overlap; 0004's `CHANGELOG.md` line is the one shared hot file, written by
each plan's last phase. `261124-1433-authority-declare-update` (running) also
writes `CHANGELOG.md`, and the cross-plan check fails a `ready` plan on that overlap, so this plan stays `draft` until
1433 is `done`; the planner or the supervisor then flips `status: ready` once the check passes. Nothing is lost: 2108,
which this plan waits on, is still ahead.

## Owner questions

None. The split, the scope and the order are the owner's (discussion, 2026-11-24); PC-D7 and PC-D10 are locked. The
planner's shape choices are written as decisions in phase files 2 and 4.

## Risks and rollback

- **A loosened cage opens shared state.** Proof point: phase 3 adds, per new binding, one test that it is writable and
  is not under `.fgos`, `.git` or the release; validating checks the proof exists.
- **Deleting a Node twin loses a behaviour the Rust twin lacks.** Proof point: phase 2 writes a behaviour-by-behaviour
  comparison in `reports/node-twins.md` and names, for each deleted Node test, the Rust test that now owns it.
- **The pid namespace breaks Miu's peer messaging.** Proof point: phase 4's spike in a throwaway head before any
  change; on failure the grant stays and the report names the needed verb.
- Rollback: each phase lands as its own commit set; reverting a phase is `git revert` of its commits, then a release
  by the owner. The plan reverts as a whole in reverse phase order.

## Outstanding questions

None
