# Platform Documentation

```txt
Document type: Platform portal
Audience: Human reviewer, architect, maintainer, agent
Purpose: Route readers through platform-wide and area-specific fgOS docs
Design status: Accepted
Implementation: Partial
Provenance: Promoted from documentation-system redesign
Writer type: Human + agent coauthor
Canonical for: Platform documentation entry and area registry
Use this when: You need to understand or change fgOS platform behavior or design
Do not use this for: User-facing task guidance or generated indexes
Last reviewed: 2026-09-25
Related:
- `docs/platform/governance.md`
- `docs/platform/documentation/history/switchboard.md`
- `docs/reading-map.md`
Supersedes: Transitional legacy-source delegations; preserved provenance does not establish current authority
Superseded by: None recorded
```

This is the portal for fgOS platform documentation.

## 1. Platform-wide Anchors

These docs are cross-area authority and live directly under `docs/platform/` in
the target structure.

| Entry | Role | Current exact owner / retained scope |
|---|---|---|
| [vision.md](vision.md) | Whole-platform mission and direction | [vision.md](vision.md); retained [binding laws](platform-foundations.md) and [original lifecycle direction](vision.md) keep their scopes |
| [intent-preservation-ledger.md](intent-preservation-ledger.md) | Whole-platform preserved intent | [intent-preservation-ledger.md](intent-preservation-ledger.md), with exact design/evidence distinctions |
| [platform-foundations.md](platform-foundations.md) | Orientation, non-law rules and carried decision narratives | [platform-foundations.md](platform-foundations.md) exclusively owns complete binding laws |
| [architecture-map.md](architecture-map.md) | Architecture entry | Retained [full map](architecture-map.md); exact boundary owner [component-boundary.md](component-boundary.md) |
| [component-boundary.md](component-boundary.md) | Component boundaries and responsibilities | [component-boundary.md](component-boundary.md), no retiring-tree delegation |
| [herdr-web-dashboard/contracts/](herdr-web-dashboard/contracts/) | Cross-area contracts | Retained [handoff contract](runner/contracts/routing-handoff.md) and explicit contract-level owners |

## 2. Area Registry

Target area docs live at `docs/platform/<area>/`. Owner rows below are generated from `packages/component-authority/model/`; edit the model (the YAML files) and run `fgos authority render`.

<!-- generated:component-authority:readme-owner-table -->
Component owners, one row per component and subcomponent, sorted by id. <!-- rendered from packages/component-authority/model/ by `fgos authority render`; edit the model, never this block -->

| Component | Parent | Role | Owner doc | Paths |
| --- | --- | --- | --- | --- |
| `admission` | `documentation` | Defines how a change that opens or moves documentation authority is admitted. | `docs/platform/documentation/subcomponents/admission/spec.md` | `docs/platform/documentation/subcomponents/admission/` |
| `agent-confinement` | — | Single authority for agent isolation, container boundaries, and sandboxing. | `docs/platform/agent-confinement/spec.md` | `docs/platform/agent-confinement/` |
| `agent-coordination` | — | Agent coordination area portal; former coordination engine retired, execution uses runner/Workflow. | `docs/platform/agent-coordination/spec.md` | — |
| `agent-coordination-engine` | — | Authority for CoordinationSession manifest/events, actor bounds, session recovery, and synthesis boundary. | `docs/platform/agent-coordination/spec.md` | — |
| `agent-mailbox` | — | Placing a message from one agent session into context of the right live head. | `docs/platform/agent-mailbox/spec.md` | `packages/mailbox/` |
| `agent-protocol` | — | Pure per-CLI adapters (claude, codex, agy, pi, omp) translating CLI output to status. | `docs/platform/agent-protocol/spec.md` | `packages/agent-protocol/` |
| `canonical-json` | — | Authority for canonical JSON bytes per RFC 8785. | `docs/platform/component-boundary.md` | `packages/canonical-json/` |
| `claude-plugin` | — | Claude Code slash-command surface and plugin wrappers. | `docs/platform/claude-plugin/spec.md` | — |
| `coding-domain` | — | Coding Domain Core, policies, repo scope, footprint, worktree isolation, merge catchup, and code verification doctrine. | `docs/platform/component-boundary.md` | — |
| `collaboration-patterns` | `execution-core` | Domain-neutral small collaboration loops (solo, reviewed, panel) and presets. | `docs/platform/runner/spec.md` | `src/runner/execution/loops/`, `src/runner/execution/patterns/` |
| `component-authority` | — | Defines the single structural model of layers, components, decision kinds, doors, contracts, and file-to-component mappings. | `docs/platform/component-authority/spec.md` | `packages/component-authority/`, `docs/platform/component-authority/` |
| `config` | — | Configuration authority: project and global config, schema and facade. | `docs/platform/config/spec.md` | `src/config/` |
| `containment-port` | `process` | OS-neutral process domain per attempt with drivers and containment guarantees. | `docs/platform/process/spec.md` | `packages/process/contracts/` |
| `convention` | — | Deterministic artifact names, repository-relative placement, path classification, and conformance checking. | `docs/platform/convention/spec.md` | `src/convention/` |
| `decision-citation-drift` | — | Read-only detection check for bare citations and decision drift. | `docs/platform/decision-citation-drift/spec.md` | — |
| `dispatch-transport` | — | Supervised attempt dispatch, execution planning, isolation request, and executor adapters. | `docs/platform/runner/spec.md` | `src/runner/dispatch/` |
| `distillery` | — | Porting lifecycle and state consumer for external repository extraction. | `docs/platform/distillery/spec.md` | — |
| `doc-checks` | `documentation` | Defines the command checking maintained documentation, body rules, and commit gate. | `docs/platform/documentation/subcomponents/doc-checks/spec.md` | `docs/platform/documentation/subcomponents/doc-checks/` |
| `document-identity` | `documentation` | Defines how maintained documentation is placed in axes so writers find before create. | `docs/platform/documentation/subcomponents/document-identity/spec.md` | `docs/platform/documentation/subcomponents/document-identity/`, `packages/documentation/` |
| `documentation` | — | Platform documentation umbrella, architecture docs, and maintained doc tree. | `docs/platform/documentation/spec.md` | `docs/platform/documentation/` |
| `domain-components` | — | Domain-specific behavior, workflows, skills, task specs, and doctrine. | `docs/platform/component-boundary.md` | — |
| `domain-registry-loader` | — | General runtime definition registry and config loader for domains, workflows, and declarations. | `docs/platform/component-boundary.md` | — |
| `durable-file` | — | Authority for how records reach disk durably: temp file, fsync, atomic install. | `docs/platform/component-boundary.md` | `packages/durable-file/` |
| `enduser-docs-authoring` | — | Authority for authoring and maintaining end-user documentation. | `docs/platform/work-state/spec.md` | — |
| `enduser-docs-index` | — | Authority for tag-based indexing of end-user documentation. | `docs/platform/work-state/spec.md` | — |
| `event-store` | — | Authority for how an fgOS event becomes durable, is sealed into git objects on refs/fgos/*, and is read back. | `docs/platform/event-store/spec.md` | `src/event-store/` |
| `execution-core` | — | Single authority for how a Unit runs (mechanism, posture, gates) through run door. | `docs/platform/runner/spec.md` | `src/runner/execution/` |
| `executor-model` | `execution-core` | Authority for what an executor entry means and facts derived from it. | `docs/platform/runner/contracts/executor-model.md` | `docs/platform/runner/contracts/` |
| `fgos-gateway` | — | Detached gateway daemon serving REST API, MCP search/execute, and embedded web dashboard. | `docs/platform/herdr-web-dashboard/spec.md` | — |
| `git` | — | Repository facts, typed Git operations, index, refs, worktrees, and WAL recovery. | `docs/platform/git/spec.md` | `src/git/` |
| `graph` | — | Deterministic facts about directed graphs with typed edges and exclusion pairs. | `docs/platform/graph/spec.md` | `packages/graph/` |
| `group-thinking` | — | Versioned group-thinking protocol pack definitions and skill for structured multi-agent deliberation. | `docs/platform/component-boundary.md` | — |
| `h-02842f76ffd2` | `runner` | Runner data dictionary definitions and data schema mapping. | `docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md` | `docs/platform/runner/subcomponents/h-02842f76ffd2/` |
| `h-2e032393add1` | `runner` | Runner gap tracking and known technical limits. | `docs/platform/runner/subcomponents/h-2e032393add1/spec.md` | `docs/platform/runner/subcomponents/h-2e032393add1/` |
| `h-37aced3896a8` | `runner` | Runner settled edge case records and historical resolutions. | `docs/platform/runner/subcomponents/h-37aced3896a8/spec.md` | `docs/platform/runner/subcomponents/h-37aced3896a8/` |
| `h-6979005beaf7` | `runner` | Runner business rules: the numbered RUL series of the runner. | `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md` | `docs/platform/runner/subcomponents/h-6979005beaf7/` |
| `h-6df5686d0d54` | `runner` | Runner actors, access control definitions, and caller bounds. | `docs/platform/runner/subcomponents/h-6df5686d0d54/spec.md` | `docs/platform/runner/subcomponents/h-6df5686d0d54/` |
| `h-ce5b9771a26a` | `runner` | Runner entry points, trigger routes, and invocation hooks. | `docs/platform/runner/subcomponents/h-ce5b9771a26a/spec.md` | `docs/platform/runner/subcomponents/h-ce5b9771a26a/` |
| `h-d3b49ef7edf5` | `runner` | Runner visual architecture diagrams and sequence maps. | `docs/platform/runner/subcomponents/h-d3b49ef7edf5/spec.md` | `docs/platform/runner/subcomponents/h-d3b49ef7edf5/` |
| `h-f34e0d170d89` | `runner` | Runner implementation pointers and source coordinate mapping. | `docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md` | `docs/platform/runner/subcomponents/h-f34e0d170d89/` |
| `herdr-transport` | — | Default transport for out-of-process runs, pane execution liveness, and herdr dashboard plugin. | `docs/platform/herdr-web-dashboard/spec.md` | — |
| `herdr-web-dashboard` | — | Web dashboard surface and interface daemon for fgOS work observation. | `docs/platform/herdr-web-dashboard/spec.md` | — |
| `holder-lock` | — | Authority for who holds which resource as kernel sees it, lock registry, and state root resolution. | `docs/platform/holder-lock/spec.md` | `src/holder-lock/` |
| `host-invocation-routing` | — | Host invocation routing, provider routing, legacy CLI transition, and external provider docs. | `docs/platform/host-invocation-routing/spec.md` | — |
| `host-surface` | — | CLI entrypoints, top-level verbs, argument parsing, and command execution. | `docs/platform/README.md` | `bin/`, `src/cli/`, `src/verbs/` |
| `identity` | — | Foundation authority for writer, machine, and project identities. | `docs/platform/identity/spec.md` | `src/identity/` |
| `launch-gate` | `run-supervisor` | Process root of the agent inside containment domain, owns IO, GO signal, and ceiling. | `docs/platform/run-supervisor/spec.md` | `packages/run-supervisor/rust/src/gate/` |
| `learning-docs-registry` | — | Retrospective knowledge capture, doc registry, Diataxis index, and evolve signals. | `docs/platform/work-state/contracts/knowledge-registry.md` | `src/report/` |
| `observe` | — | Measurement and scorecard calculation across substrate entities, metrics, friction repository, and shards. | `docs/platform/observe/spec.md` | `src/observe/` |
| `packaging-distribution` | — | Packaging, distribution, installation, upgrade, and doctor readiness. | `docs/platform/packaging-distribution/spec.md` | `src/setup/` |
| `platform-foundations` | — | Core platform utilities, foundation laws L1-L10, and cross-cutting helpers. | `docs/platform/platform-foundations.md` | `src/util/` |
| `process` | — | Process liveness, signalling by identity, and native process facts door. | `docs/platform/process/spec.md` | `src/native/` |
| `questions` | — | One authority for questions a session sends to owner: asked, stored, answered, received. | `docs/platform/questions/spec.md` | `packages/questions/`, `docs/platform/questions/` |
| `resource-referee` | — | Applying ruleset data to facts about units and resource claims. | `docs/platform/resource-referee/spec.md` | `packages/resource-referee/` |
| `run-result` | — | Evidence and confidence boundary for assignment run results. | `docs/platform/runner/spec.md` | `packages/run-result/` |
| `run-supervisor` | — | Rust supervisor process owning attempt lifecycle, deadlines, containment domain, and adopt door. | `docs/platform/run-supervisor/spec.md` | `src/run-supervisor/` |
| `runner` | — | Top-level runner orchestration, paths, locks, rigor, and agent definitions. | `docs/platform/runner/spec.md` | `src/runner/` |
| `seat-binding` | — | Authority for which executor, invocation, model, effort, tier and account runs an agent seat. | `docs/platform/seat-binding/spec.md` | `src/seat-binding/` |
| `secrets` | — | Secrets vault and safe token management. | `docs/platform/secrets/spec.md` | `packages/secrets/` |
| `session-host` | — | Authority for placing an agent session, worker or head: start, alive, front, retire. | `docs/platform/session-host/spec.md` | `src/session-host/` |
| `session-rotation` | — | Session handoff and rotation mechanics across session boundaries. | `docs/platform/runner/spec.md` | `src/session-rotation/` |
| `supervision` | — | Coordinates the plans of a project with no person sitting by. | `docs/platform/supervision/spec.md` | `src/portfolio/` |
| `team-cognition-engine` | — | Typed deliberation interpretation, aggregation-method semantics, and cognitive outcomes. | `docs/platform/agent-coordination/spec.md` | — |
| `terminal-control` | — | Foundation component for terminal multiplexer pane allocation and key addressing. | `docs/platform/terminal-control/spec.md` | `src/terminal-control/` |
| `ui-spec` | — | Visual contracts and UI specifications for fgOS web surfaces. | `docs/platform/ui-spec/spec.md` | — |
| `work-driver` | — | Ready-work selection, Stage Operation choice, cross-flow routing, park/halt and recovery around Work execution; invokes lifecycle verbs and dispatch surfaces without owning domain workflow semantics. | `docs/platform/component-boundary.md` | — |
| `work-state` | — | Domain-agnostic work-unit lifecycle, status board, claim/return, and human gates. | `docs/platform/work-state/spec.md` | `src/state/`, `src/intake/`, `src/evolve/` |
| `workflow` | — | Workflow guide schema, case ledger, reservations, admission, and worktree binding. | `docs/platform/workflow/spec.md` | `src/workflow/` |
| `write-door` | `documentation` | Defines the one door through which any agent writes, changes, or moves documentation. | `docs/platform/documentation/subcomponents/write-door/spec.md` | `docs/platform/documentation/subcomponents/write-door/` |
| `write-scope` | — | Authority for what a declared path scope means and whether two scopes overlap. | `docs/platform/write-scope/spec.md` | `packages/write-scope/` |
| `yaml-document` | — | Lossless reading, editing, and merging of YAML documents with positions. | `docs/platform/yaml-document/spec.md` | `packages/yaml-doc/` |
<!-- /generated:component-authority:readme-owner-table -->

Hand-written registry rows the model does not hold (non-component areas and portal links retained from the prior area registry):

| Area | Current exact owner / retained scope |
|---|---|
| [runner](runner/README.md) | [runner/spec.md](runner/spec.md), exact contracts/rules/decisions linked there; retained root handoff contract |
| [work-state](work-state/README.md) | [work-state/spec.md](work-state/spec.md), exact area contracts; retained root CLI I/O authority |
| [packaging-distribution](packaging-distribution/README.md) | [Area spec](packaging-distribution/spec.md), exact contracts and implementation alignment, not legacy-source fallback |
| [host-invocation-routing](host-invocation-routing/README.md) | Exact area contracts/architecture/decisions linked by the portal |
| [convention](convention/spec.md) | [convention/spec.md](convention/spec.md) — implemented executable naming and placement authority; no document-body health rules |
| [component-authority](component-authority/spec.md) | [component-authority/spec.md](component-authority/spec.md) — single structural model of authority, components, decision kinds, doors, contracts, and file mapping; holds design ownership and grants no runtime permission |
| [agent-mailbox](agent-mailbox/spec.md) | [agent-mailbox/spec.md](agent-mailbox/spec.md) — first slice signed at G0 on 2026-10-20 (numeric values and later parts stay proposals; implementation not started): first slice is delivery of a message into a live agent session (Claude Code, Codex, agy, one machine, same project; the recipient is an independently started head, never a runner Unit attempt); acknowledgement, expiry and cross-machine are recorded as later parts; V-011 narrowed by V-013 (2026-10-20); revised after a second architecture panel before signing |
| [secrets](secrets/spec.md) | [secrets/spec.md](secrets/spec.md) — draft proposal, not signed: where a secret lives, one resolver and one `${VAR}` expansion that fails loud, a `SecretSource` port (first adapter a 0600 file), login-store writers per agent CLI, and trust rules for loading a secret into the one process that needs it; config loading depends on it later |
| [agent-coordination](agent-coordination/README.md) | Surviving current contracts and qualified design; retired-engine records are history, execution uses runner/Workflow |
| system-architecture | Architecture routes: [architecture intent](system-architecture/architecture/architecture-intent.md), [roadmap](system-architecture/architecture/roadmap.md), [workspace topology](system-architecture/architecture/workspace-topology.md), [topology audit](system-architecture/architecture/workspace-topology-audit.md); related [topology roadmap](system-architecture/architecture/workspace-topology-roadmap.md) and [system vision](system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md) |
| [system-overview](system-overview/spec.md) | System overview; use [component boundaries](component-boundary.md#4-current-high-level-components) for current ownership routes |
| [holder-lock](holder-lock/spec.md) | Kernel lock port, registry, predecessor-domain rules and guarantee levels |
| [process](process/spec.md) | Process facts and control; shared judge vectors and platform limits |
| [event-store](event-store/spec.md) | Signed durability design ([D-ADR0055, 2026-10-17](event-store/spec.md#26-decision-record)); implementation not started, acceptance under the [proof gates](event-store/spec.md#23-proof-gates); navigation does not implement it |
| [agent-confinement](agent-confinement/README.md) | Area portal; retained sources are identified there |
| [claude-plugin](claude-plugin/README.md) | Area portal; retained sources are identified there |
| [decision-citation-drift](decision-citation-drift/README.md) | Area portal; retained sources are identified there |
| [distillery](distillery/README.md) | Area portal; retained sources are identified there |
| [herdr-web-dashboard](herdr-web-dashboard/README.md) | Area portal; retained sources are identified there |
| [observe](observe/README.md) | Area portal; retained sources are identified there |
| `skills` | domain and skill docs under [../../domains/](../../domains/), [../../.agents/skills/](../../.agents/skills/), [../../plugins/fgOS/skills/](../../plugins/fgOS/skills/) |
| [ui-spec](ui-spec/README.md) | Retained [../ui-spec/](../ui-spec/) for visual contracts; functional behavior remains area-owned |
| `documentation-system` | Full-horizon proposal: [proposals/documentation-system-unification.md](proposals/documentation-system-unification.md); historical documentation migration plan: `plans/260925-documentation-authority-unification/plan.md`; implemented end-user registry foundation: `archive/plans/260825-1841-knowledge-registry/plan.md` |

## 3. Decision Surface

| Status | Question | Where |
|---|---|---|
| Settled | Platform-wide docs live directly under `docs/platform/`; area docs live under `docs/platform/<area>/` | `docs/platform/governance.md` |
| Settled | No `system` folder and no `areas` layer under `docs/platform/` | `docs/platform/governance.md` |
| Historical migration record | Authority-unification execution order | `plans/260925-documentation-authority-unification/plan.md`; this portal does not certify implementation or authorize a further phase |
| Open | Final area list and naming | Inventory and minimum constitution in the historical H1 migration plan |
| Preserved | Full multi-profile Knowledge and Documentation Engine and separate Agent Context Engine | [proposals/documentation-system-unification.md](proposals/documentation-system-unification.md) and [intent-preservation-ledger.md](intent-preservation-ledger.md) |

## 4. How To Change Platform Docs

1. Open [governance](governance.md) for document types, metadata and links; its header records source provenance.
2. Follow governance sections 5 and 8 for the one-owner rule. [The former switchboard](documentation/history/switchboard.md) and [migration authoring rules](documentation/history/migration-authoring-rules.md) are transition evidence, not operative routers.
3. Read this portal and the relevant area portal/spec.
4. Read the relevant vision and intent-preservation ledger when the change
   narrows, stages, or simplifies the full design.
5. Use a discussion scratchpad for multi-round shaping.
6. Promote settled content into the right canonical doc.
7. Update links and verification pointers. For cross-area changes, follow the
   [map registration and verification ritual](architecture-map.md#9-luật-vận-hành-bản-đồ),
   [boundary change rule](component-boundary.md#5-how-to-change) and
   [six-question acceptance test](platform-foundations.md#l5-definition-of-done-sáu-câu-hỏi).

Documentation authoring routes: [types](governance.md#3-document-types),
[metadata](governance.md#5-metadata), [links and boundary checks](governance.md#11-linking-discipline),
[cross-area proposal collection](proposals/README.md), and
[proposal shape](documentation/architecture/documentation-system-design.md#67-proposal).
These are reading links; each linked document states its authority and implementation limits.

## 5. Related Files

| Relationship | File |
|---|---|
| governs docs | [governance.md](governance.md) |
| historical transition evidence, not current routing | [documentation/history/switchboard.md](documentation/history/switchboard.md) |
| migration authoring rules (history) | [documentation/history/migration-authoring-rules.md](documentation/history/migration-authoring-rules.md) |
| routes readers | [../reading-map.md](../reading-map.md) |
| defines platform direction | [vision.md](vision.md) |
| preserves platform intent | [intent-preservation-ledger.md](intent-preservation-ledger.md) |
| defines durable laws | [platform-foundations.md](platform-foundations.md) |
| maps architecture | [architecture-map.md](architecture-map.md) |
| maps component boundaries | [component-boundary.md](component-boundary.md) |
| preserves deferred documentation-system architecture | [intent-preservation-ledger.md](intent-preservation-ledger.md) |
| proposes full documentation operating system | [proposals/documentation-system-unification.md](proposals/documentation-system-unification.md) |
| plans near-term authority unification | `plans/260925-documentation-authority-unification/plan.md` |
