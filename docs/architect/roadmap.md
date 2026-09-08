# Architect Roadmap

Document type: Architecture roadmap
Design status: Living planning document
Implementation: Mixed
Last reviewed: 2026-09-04
Canonical for: sequencing architecture work under `docs/architect/`

This roadmap keeps the large architecture streams in one place so the work can
move in a deliberate order and still deliver quickly. It is not the product
backlog and it is not a task registry. Its job is to preserve sequence,
dependency, architectural intent, and the minimum high-level plan needed to
avoid analysis drift while several cross-cutting redesigns are open at the
same time.

The operating principle is:

```txt
Decide the boundary first.
Write the smallest contract that can be implemented.
Deliver one proof slice.
Feed the result back into the architecture only when evidence changes it.
```

## 1. Current Active Streams

| Stream | Primary Docs | Current Role | Depends On | Blocks / Informs |
|---|---|---|---|---|
| Agent Coordination | `agent-coordination/`, `proposals/step-09-group-thinking-substrate.md` | Step 09's implemented group-thinking slice is closed through promoted CoordinationSession/FlowDefinition contracts. Keep the remaining deferred substrate ideas parked unless Step 10 proves a need. | Existing Work lifecycle, runner contracts, and accepted Step 09 proof artifacts. | Coding-domain adoption, runner autonomy, host/gateway visibility. |
| Coding Domain / Step 10 | `proposals/step-10-coding-domain-adoption.md`, `domainization/`, coding-domain specs/history outside this folder | Make the existing coding domain a real consumer of the reusable Work Driver Core plus CoordinationSession/FlowDefinition, without moving Work lifecycle, git, merge, or status authority into Agent Coordination. | Accepted Step 09 slice, component authority guardrails, and the topology contract for any workspace/worktree mutation. | Real project development workflow, future non-coding domains such as marketing/business workflows, fgOS dogfood, runner unification, package cleanliness. |
| Workspace Topology | `workspace-topology.md`, `workspace-topology-roadmap.md`, `workspace-topology-audit.md` | Define repository/workspace/work-state/runtime identities, root ownership, state classes, worktree modes, and mutation topology; absorb the legacy `.fgos/runtime` and hot-history placement debt. | Current eventlog/worktree/coordination reality. | Packaging, Work State, Coding Domain, runtime coordination, config/init/doctor. |
| Component Boundary | `component-boundary/`, `proposals/component-authority-boundary-map.md` | Keep high-level component responsibilities and authority boundaries explicit before source layout or implementation migration. | Current architecture evidence from active streams. | Host Invocation, packaging split, repo-layout cleanup, Rust migration. |
| Host Invocation / fgOS CLI | `host-invocation-routing/` | Define how CLI, remote, gateway, chat, MCP, and future hosts enter one semantic operation path and select providers. | Component boundary and local payload selection. | Node-to-Rust migration, gateway adapter, distribution payload identity. |
| Node To Rust Migration | `host-invocation-routing/node-to-rust-component-migration.md`, `host-invocation-routing/rust-cli-and-proof-components-plan.md` | Move implementation one component at a time from Node to Rust without changing public semantics prematurely. | Host Invocation and Distribution artifact boundaries. | Public Rust `fgos` entry flip, legacy Node compatibility removal. |
| Packaging And Distribution | `packaging-distribution/` | Design correct install, runtime identity, activation, payload records, `fgctl`, local `fgos`, and workshop materialization model. Shared gateway/web are architecture constraints, not current delivery scope. | Component boundary, Host Invocation, current distribution specs. | Rust `fgos` CLI release, project-local version safety, self-host cleanliness, future shared web/gateway. |

## 2. Dependency Shape

The streams are coupled, but they should not move in an arbitrary order.

```txt
Accepted Agent Coordination + Step 09 contracts
  -> Step 10 Coding Domain read-only adoption
  -> Workspace Topology enforcement lane
  -> Step 10 mutating adoption / runner unification
  -> Component Boundary consolidation
  -> Packaging And Distribution
  <-> Host Invocation / fgOS CLI
  -> Node To Rust public release
```

This is not a strict implementation sequence. It is the order in which
architecture assumptions should be stabilized:

1. Agent Coordination defines the reusable coordination/session substrate.
2. Step 09 is now closed for the implemented slice, so Coding Domain can start
   consuming the accepted read-only primitives.
3. Workspace Topology defines root ownership, state classes, and worktree
   mutation invariants before Step 10 opens mutating or fan-out paths.
4. Component Boundary names the components and authority owners.
5. Packaging And Distribution defines how the correct local payload is
   selected, trusted, activated, materialized, and repaired.
6. Host Invocation defines how external surfaces enter semantic operations
   after payload identity is known. In practice, steps 4 and 5 iterate: the
   payload needs a minimum callable ABI, and the host needs a concrete payload
   selection boundary.
7. Node To Rust public release uses the settled payload/provider boundary.

When a later stream discovers a missing assumption, it should feed back into
the earlier stream explicitly instead of patching around it locally.

## 3. Immediate Architecture Order

The practical next order is:

1. Record Step 09 as closed for the implemented slice:
   keep only the promoted CoordinationSession/FlowDefinition contracts as
   canonical; leave deferred group-thinking mechanisms parked.
2. Start Step 10 A0:
   run the node-only Coding Domain boundary/harness facade pass, including
   harnesses that touch Workspace Topology, and resolve raw root/path usage
   behind `TopologyContext` where that slice touches topology behavior.
3. Start Step 10 read-only adoption:
   wire coding's `validate-plan` collaboration through a Work-attached
   CoordinationSession while keeping Work driver, Workflow, lifecycle, and git
   authority outside Agent Coordination.
4. Lock the Workspace Topology contract enough for implementation:
   close durable work-history placement, classify existing config keys, split
   runtime coordination from packaging runtime, and require worker installation
   capsules where local shims are the entry contract.
5. Run topology migration skeletons before mutating Step 10:
   `resolveTopology()` read-only first, then config scope enforcement,
   coordination root split, and hot history relocation/adoption.
6. Continue Step 10 after the read-only proof:
   extract coding evidence interpretation, reconcile session concurrency with
   worker slots, then run the ADR-010 mutating live proof.
7. Stabilize Packaging And Distribution on top of TopologyContext:
   `fgctl`, local `fgos`, runtime identity/activation, payload records,
   init/doctor split, and workspace materialization. Packaging must not decide
   config/event/claim placement.
8. Reflect the new split into Component Boundary:
   separate global bootstrap, shared host surface, project runtime adapter,
   local runtime payload, Work driver, coding repository integration, and state
   authority.
9. Revisit Host Invocation:
   make payload/adapter selection happen before provider routing.
10. Re-evaluate Node To Rust migration:
   update Rust R1 release criteria around artifact identity, compatibility
   payload placement, topology resolution, and install/rollback proof.
11. Only after those are coherent, update generated specs through their owning
    workflow.

## 4. High-Level Delivery Plan

The delivery plan should keep architecture and implementation close without
letting either one block all progress.

| Phase | Goal | Architecture Output | Delivery Output | Exit Criteria |
|---|---|---|---|---|
| P0: Roadmap control | Keep active streams ordered and prevent cross-area drift. | This roadmap plus links from the architecture index. | None. | Every active stream has a named home, dependency, and next action. |
| P1: Step 10 A0 boundary/facade pass | Separate Coding Domain harness authority before adoption work builds on it. | Node-only Coding Domain boundary/facade plan: harness inventory, owner classification, topology-touching harness list, generic Domain Adapter ports, Coding Domain Adapter facade names, forbidden dependencies, and tests. | Minimal Coding Domain Adapter facades for the harnesses Step 10B will use; topology-touching harnesses either consume `TopologyContext` or record a named blocker. No Rust migration or large physical move. | Later Step 10 slices call stable Coding Domain Adapter facades instead of raw harness files/paths; topology-related harness behavior is not left as hidden cleanup. |
| P2: Step 10 read-only proof | Use the accepted Step 09 substrate for real coding-domain value without opening mutation authority. | Step 10 read-only bridge notes or ADR: Work-attached `validate-plan` sessions, declared Assignment provenance, lifecycle-blind session engine. | `validate-plan` can run through both interactive and headless doors and produce comparable session/evidence records. | Coding consumes CoordinationSession read-only; Workflow and Work lifecycle authority remain outside Agent Coordination. |
| P3: Topology contract lock | Settle the root/capability contract before moving legacy state. | `workspace-topology.md` promoted from draft once durable history placement closes; roadmap/audit remain companions. | No broad behavior migration yet. | A new engineer can answer root/capability choice for each operation without chat history. |
| P4: Topology resolver skeleton | Make topology a runtime input instead of prose. | TopologyContext API shape and adoption notes. | Read-only `resolveTopology()` for Git main, linked worktree, symlink path, fresh clone-like workspace, and non-Git mode. | Existing behavior still works, but callers can stop inferring raw `.fgos` paths. |
| P5: Legacy root migration | Remove the implementation pressure that makes topology and packaging drift. | Work-state / coordination migration notes, checkpoint/import rules, config key scope table. | Config readers use TopologyContext; claims/sessions/leases resolve through `runtimeCoordinationRoot`; hot events move out of tracked workspace with legacy import. | Worker config stays branch-local; shared coordination remains shared by `workStateId`; submit/return/pick do not dirty main with hot history. |
| P6: Step 10 mutating gate | Lift ADR-010 §5 only with the named live proof. | New ADR for mutating Work-attached sessions; evidence adapter boundary; occupancy/concurrency rule. | One executing item uses mutating Assignments in distinct worktrees, refuses overlapping footprint, survives crash/resume, and still merges only through `approve`. | Coding-domain mutation is proven as a CoordinationSession consumer without moving git/merge/status authority into Agent Coordination. |
| P7: Runner unification | Remove duplicate coding execution cores after the mutating proof. | Work Driver contract: one engine, two doors. | `implement-item` becomes a verified Assignment; `spawnWorker` and `fgos-coding-driving` reduce to thin entry paths; fan-out calls the driver rather than spawning raw agents. | Interactive and headless coding paths have equivalent capability and evidence semantics. |
| P8: Workspace/runtime skeleton | Prove the smallest useful distribution model on top of topology. | `runtime-identity-and-activation.md`: release store, workspace activation binding, work-state writer compatibility, manifest, pin, projection scope, and owner/failure rules. | Using existing Node payload if needed: `fgctl` stages an immutable release, verifies identity, prepares one workspace capsule, publishes workspace `activation.json`, and local `fgos` reports workspace + work-state + payload identity. | We can answer where release content lives, where each workspace binding lives, which work-state can be mutated, and how local `fgos` reports identity without dirtying/racing worktrees. |
| P9: Local init/doctor contract | Lock bootstrap vs workspace repair authority. | Same doc or later `fgctl-and-local-fgos-contract.md` only if the command contract grows large. | `fgctl init` invokes local `fgos init`, bootstrap-safe `doctor --fix`, and final read-only `doctor` without changing runtime identity from local `fgos`. | Fresh project init is reproducible; runtime drift is reported; runtime repair/upgrade remains `fgctl` authority. |
| P10: Host invocation alignment | Align Rust CLI/host entry with payload selection. | Host Invocation doc update. | One proof operation such as build/version/doctor routed through selected local payload. | Provider routing cannot start before project payload/adapter identity is known. |
| P11: Rust release gate | Convert Rust migration from code migration to distributable release. | Rust R1 release criteria updated with artifact/package/topology requirements. | Rust host can be installed as public local `fgos` while delegating unmigrated operations to legacy Node payload. | Install/upgrade/rollback evidence exists; Node compatibility payload identity is pinned. |
| P12: Spec consolidation | Move settled architecture back into generated specs. | Spec source changes through owning workflow. | Regenerated `docs/specs/*` and changelog/backlog alignment. | A stranger agent can read specs and see the settled distribution/host boundary without this chat. |

The fastest safe delivery path is P1 → P2 → P3 → P4 → P5 → P6 → P7 for coding
domain adoption and runner unification, then P8 → P11 for local packaging and
Rust `fgos` release. The gateway/project-runtime-adapter lane remains a design
constraint only until distribution and host invocation need a concrete adapter
proof.

Detailed plans must not replace this project-level sequence with local task
detail. When a Step 10 detailed plan changes the A0-G adoption shape, or when
Workspace Topology / Packaging discoveries change the dependency order, update
this roadmap in the same review so the project-level plan stays visible.

## 5. Planning Rules For Fast Delivery

1. Do not wait for the full gateway design before proving local payload
   identity, activation, and install/repair. The local payload identity is
   useful immediately for the Rust `fgos` CLI.
2. Do not flip the public Rust `fgos` entry until distribution can prove
   artifact identity, rollback, and legacy compatibility placement.
3. Do not keep `setup` alive as a third user-facing concept. Collapse its old
   responsibilities into `fgctl init`, local `fgos init`, and local
   `fgos doctor --fix`.
4. Do not let shared gateway become the schema compatibility layer for every
   historical project version. Put project-specific translation in the local
   Project Runtime Adapter. This is an architecture constraint, not current
   gateway/web delivery scope.
5. Do not solve self-development by nested repositories. Solve it through
   payload/projection ownership, quarantine, and product-package exclusion.
6. Do not edit generated specs during live architecture churn. Distill under
   `docs/architect/`, then update generated sources once decisions settle.
7. Prefer proof slices that test an authority boundary, not cosmetic command
   wiring.
8. Activation is workspace-scoped: acquire artifact, stage shared release,
   verify manifest, prepare workspace, publish ready workspace binding, then
   allow project-state mutation. Each step needs one owner and one failure
   rule.

## 6. Parallel Work Lanes

To ship faster, these lanes can proceed in parallel as long as their handoff
contracts are respected.

| Lane | Can Proceed Now | Must Wait For |
|---|---|---|
| Agent Coordination refinement | Yes, but only for explicitly deferred Step 09 mechanisms or bug fixes inside accepted contracts. | Anything that changes Work mutation, git authority, or runtime identity must wait for Step 10/topology decisions. |
| Step 10 A0 boundary/facade pass | Yes, first. Include coding harnesses that touch Workspace Topology and resolve them behind Coding Domain Adapter facades plus `TopologyContext` when touched. | Rust migration and broad physical moves wait for facade proof. |
| Step 10 read-only coding adoption | Yes after the minimum facade needed by `validate-plan` exists. | Mutating assignments, fan-out, and footprint claims wait for topology resolver + coordination root/occupancy rules. |
| Workspace Topology contract | Yes, highest priority beside Step 10 read-only. Close durable history placement and promote the contract. | Nothing except confirming legacy/adoption wording against current work-state reality. |
| Topology resolver implementation | Yes after contract lock, and can run while Step 10 read-only proceeds. | Migration of event/claim/config call sites should wait for the resolver API shape. |
| Legacy root migration | Partly. Inventory and tests can start now. | Actual hot-history/coordination moves wait for resolver skeleton and legacy import rules. |
| Coding Domain extraction | Yes at authority/classification level. Keep coding-specific repo/worktree/merge policy out of foundation. | Physical moves wait for Step 10 evidence adapter/driver contracts and topology root migration. |
| Component Boundary cleanup | Yes at advisory/index level. | Physical repo moves should wait until Step 10 and topology prove the ownership boundaries. |
| Packaging Distribution | Yes for docs already depending on topology. | Implementation waits for topology P2/P3 and the legacy root migration decisions it consumes. |
| Host Invocation design | Yes for provider routing internals and Rust CLI shape. | Public entry semantics wait for runtime identity/activation contract and topology-aware local shim behavior. |
| Rust migration implementation | Yes behind current entrypoints. | Public release flip waits for distribution gates plus topology-aware install/doctor proof. |

## 7. Do Not Collapse These Boundaries

These distinctions must stay visible while the roadmap moves:

| Boundary | Why It Matters |
|---|---|
| `fgctl` vs local `fgos` | Machine bootstrap/service control is not project workflow authority. |
| Work Core vs Work Driver Core vs Domain | Work Core owns Work truth and legal transitions; Work Driver Core is reusable platform core that interprets domain-owned workflow declarations; Coding Domain owns coding declarations/adapters, not a separate driver. |
| Shared web vs shared gateway vs project runtime | One dashboard can serve many projects later, but current delivery only needs the architecture boundary: project semantics must come from the selected local payload. |
| Gateway contract vs Project Runtime Adapter | Gateway owns a stable UI/chat contract later; the local adapter owns version-specific semantic translation and must be shaped so future gateway does not become semantic authority. |
| Installer repair vs local doctor fix | `fgctl repair/upgrade` may change runtime identity; local `fgos doctor --fix` repairs under the installed identity. |
| Canonical workshop material vs host-visible projections | Skills/agents/prose live in the immutable release payload/workshop area and are projected into `.agents/`, `.claude/`, or instruction files through the workspace projection ledger. |
| Runtime payload vs product package surface | fgOS workshop files must not dirty the clean product package, especially during fgOS self-development. |
| Distribution selection vs provider routing | Distribution selects the trusted project payload; Host Invocation routes operations inside that selected payload. |
| Global daemon/MCP substrate vs project verbs | Global services may accelerate registry/store/event/mailbox/process supervision, but must not own all project semantics. |

## 8. Packaging And Distribution Sub-Roadmap

Packaging And Distribution remains a high-pressure architecture stream because
it gates Rust release, shared web/gateway shape, and clean local project
operation. Its implementation order now runs behind Workspace Topology's typed
roots instead of owning placement itself.

Recommended split:

1. `runtime-identity-and-activation.md`
   - immutable release manifest;
   - workspace activation binding;
   - pin;
   - projection ledger outline;
   - migration journal outline;
   - invocation lease;
   - downgrade/refusal and state-schema compatibility;
   - drift report;
   - rollback/quarantine;
   - runtime identity reported by local `fgos`.
2. `fgctl-and-local-fgos-contract.md`, only if command responsibilities grow
   too large for the runtime identity document
   - `fgctl init/repair/upgrade/gateway`;
   - local `fgos init`;
   - local `fgos doctor` and `fgos doctor --fix`;
   - setup removal;
   - failure semantics.
3. `project-runtime-adapter-protocol.md`
   - future shared web/gateway constraint;
   - stable UI command context;
   - project-local adapter;
   - capability discovery;
   - event/progress/error transform;
   - out-of-process v1;
   - idempotency and payload attestation.
4. `workshop-materialization.md`, after host path/projection policy becomes a
   blocker
   - skills;
   - agents;
   - prose;
   - AGENTS.md;
   - `.agents/skills`;
   - `.claude/skills`;
   - self-development cleanliness.

## 9. Spec Update Rule

For now, new architecture writing stays under `docs/architect/`.

`docs/specs/*` is treated as generated/curated state. It should not be edited
opportunistically while the design is still moving. Once a decision settles,
update the generated source or owning workflow first, then regenerate/check the
spec projection.

## 10. Roadmap Status

| Area | Current Status | Next Architecture Action |
|---|---|---|
| Agent Coordination | Step 09 implemented slice is closed and canonical through promoted contracts; deferred mechanisms remain parked. | Keep stable unless Step 10 proves a missing substrate primitive. |
| Coding Domain / Step 10 | Ready to resume after Step 09. | Start with node-only boundary/harness facade pass, then read-only `validate-plan` session bridge, evidence adapter, concurrency/occupancy reconciliation, mutating live proof, and Work Driver unification. |
| Component Boundary | Existing advisory exists. | Update after Step 10 and topology prove the ownership split; do not use file layout as the source of authority. |
| Workspace Topology | Contract draft and companion roadmap/audit exist; durable history placement remains the named lock blocker. | Close durable history placement, then implement resolver skeleton and migrate config/coordination/hot history behind typed roots. |
| Host Invocation | Existing routing/migration docs exist. | Add payload/adapter selection and TopologyContext preconditions. |
| Node To Rust | Migration path exists. | Reframe public R1 release around distribution artifact proof plus topology-aware activation/install proof. |
| Packaging Distribution | Runtime identity contract now depends on Workspace Topology and has resolved the major placement/lifecycle conflicts. | Hold implementation until topology contract/resolver can supply typed roots; continue doc-only adapter constraints in parallel. |
