# Spec: System Overview

```txt
Document type: Area spec
Audience: Human reviewer, architect, maintainer, agent
Purpose: Define the stated scope and preserve its source provenance and limits
Design status: Accepted at atomic cutover
Implementation: Partial — inherited source qualifications; not independently truth-verified
Provenance: docs/specs/system-overview.md at 69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539 (blob c24c5561dc60cce7e53d0a0c5e34ff97414845ac)
Writer type: Agent source carriage
Canonical for: The document scope stated above; source implementation limits remain explicit
Use this when: Reading whole-system architecture and its source history
Do not use this for: Inferring implementation, promotion or superseding source authority
Last reviewed: No current review date recorded; retained source dates are historical
Related:
- docs/platform/component-boundary.md
- docs/platform/architecture-map.md
Supersedes: The former source location at atomic cutover
Superseded by: None
```

Carriage note: migration metadata and physical link rebasing. Original source metadata, dates, design limits and historic claims below are provenance, not fresh review. Carried claims retain their original implementation limits; provenance is not fresh implementation evidence.

Carriage note: original source frontmatter (verbatim provenance).

```yaml
---
area: system-overview
updated: 2026-08-12
decisions: [ca7de3cf, ae461c8b, ed953e09, 14ebeea9, 1a80b4d3, 65c642a8, 43f257ae, 6f2cbc47, a30a3d3c, 1359ab5e, b2d18cc7, 1d336d8a, 02623bff, c74bcef9]
coverage: partial
---
```



> "Forgent (fgOS) is the platform layer for building and running agent applications — the infrastructure, skills, and automation that sit beneath every agent app, so developers can forge new agents instead of building everything from scratch." (README, đoạn mở đầu, verbatim)

## Area Map

<!-- generated:component-authority:system-overview-area-map -->
Area rows from the model: one row per area listing its top-level components. Specs outside docs/platform/<area>/ are listed under (cross-area). <!-- rendered from packages/component-authority/model/ by `node scripts/component-authority-render.mjs`; edit the model, never this block -->

| Area | Components | What it owns | Owner doc |
| --- | --- | --- | --- |
| `(cross-area)` | `canonical-json`, `coding-domain`, `domain-components`, `domain-registry-loader`, `durable-file`, `group-thinking`, `host-surface`, `platform-foundations`, `work-driver` | Authority for canonical JSON bytes per RFC 8785.; Coding Domain Core, policies, repo scope, footprint, worktree isolation, merge catchup, and code verification doctrine.; Domain-specific behavior, workflows, skills, task specs, and doctrine.; General runtime definition registry and config loader for domains, workflows, and declarations.; Authority for how records reach disk durably: temp file, fsync, atomic install.; Versioned CoordinationProtocol definitions and skill for structured multi-agent deliberation.; CLI entrypoints, top-level verbs, argument parsing, and command execution.; Core platform utilities, foundation laws L1-L10, and cross-cutting helpers.; Ready-work selection, Stage Operation choice, cross-flow routing, park/halt and recovery around Work execution; invokes lifecycle verbs and dispatch surfaces without owning domain workflow semantics. | `docs/platform/component-boundary.md`, `docs/platform/README.md`, `docs/platform/platform-foundations.md` |
| `agent-confinement` | `agent-confinement` | Single authority for agent isolation, container boundaries, and sandboxing. | `docs/platform/agent-confinement/spec.md` |
| `agent-coordination` | `agent-coordination`, `agent-coordination-engine`, `team-cognition-engine` | Agent coordination area portal; former coordination engine retired, execution uses runner/Workflow.; Authority for CoordinationSession manifest/events, actor bounds, session recovery, and synthesis boundary.; Typed deliberation interpretation, aggregation-method semantics, and cognitive outcomes. | `docs/platform/agent-coordination/spec.md` |
| `agent-mailbox` | `agent-mailbox` | Placing a message from one agent session into context of the right live head. | `docs/platform/agent-mailbox/spec.md` |
| `agent-protocol` | `agent-protocol` | Pure per-CLI adapters (claude, codex, agy, pi, omp) translating CLI output to status. | `docs/platform/agent-protocol/spec.md` |
| `claude-plugin` | `claude-plugin` | Claude Code slash-command surface and plugin wrappers. | `docs/platform/claude-plugin/spec.md` |
| `component-authority` | `component-authority` | Defines the single structural model of layers, components, decision kinds, doors, contracts, and file-to-component mappings. | `docs/platform/component-authority/spec.md` |
| `config` | `config` | Configuration authority: project and global config, schema and facade. | `docs/platform/config/spec.md` |
| `convention` | `convention` | Deterministic artifact names, repository-relative placement, path classification, and conformance checking. | `docs/platform/convention/spec.md` |
| `decision-citation-drift` | `decision-citation-drift` | Read-only detection check for bare citations and decision drift. | `docs/platform/decision-citation-drift/spec.md` |
| `distillery` | `distillery` | Porting lifecycle and state consumer for external repository extraction. | `docs/platform/distillery/spec.md` |
| `documentation` | `documentation` | Platform documentation umbrella, architecture docs, and maintained doc tree. | `docs/platform/documentation/spec.md` |
| `event-store` | `event-store` | Authority for how an fgOS event becomes durable, is sealed into git objects on refs/fgos/*, and is read back. | `docs/platform/event-store/spec.md` |
| `git` | `git` | Repository facts, typed Git operations, index, refs, worktrees, and WAL recovery. | `docs/platform/git/spec.md` |
| `graph` | `graph` | Deterministic facts about directed graphs with typed edges and exclusion pairs. | `docs/platform/graph/spec.md` |
| `herdr-web-dashboard` | `fgos-gateway`, `herdr-transport`, `herdr-web-dashboard` | Detached gateway daemon serving REST API, MCP search/execute, and embedded web dashboard.; Default transport for out-of-process runs, pane execution liveness, and herdr dashboard plugin.; Web dashboard surface and interface daemon for fgOS work observation. | `docs/platform/herdr-web-dashboard/spec.md` |
| `holder-lock` | `holder-lock` | Authority for who holds which resource as kernel sees it, lock registry, and state root resolution. | `docs/platform/holder-lock/spec.md` |
| `host-invocation-routing` | `host-invocation-routing` | Host invocation routing, provider routing, legacy CLI transition, and external provider docs. | `docs/platform/host-invocation-routing/spec.md` |
| `identity` | `identity` | Foundation authority for writer, machine, and project identities. | `docs/platform/identity/spec.md` |
| `observe` | `observe` | Measurement and scorecard calculation across substrate entities, metrics, friction repository, and shards. | `docs/platform/observe/spec.md` |
| `packaging-distribution` | `packaging-distribution` | Packaging, distribution, installation, upgrade, and doctor readiness. | `docs/platform/packaging-distribution/spec.md` |
| `process` | `process` | Process liveness, signalling by identity, and native process facts door. | `docs/platform/process/spec.md` |
| `questions` | `questions` | One authority for questions a session sends to owner: asked, stored, answered, received. | `docs/platform/questions/spec.md` |
| `resource-referee` | `resource-referee` | Applying ruleset data to facts about units and resource claims. | `docs/platform/resource-referee/spec.md` |
| `run-supervisor` | `run-supervisor` | Rust supervisor process owning attempt lifecycle, deadlines, containment domain, and adopt door. | `docs/platform/run-supervisor/spec.md` |
| `runner` | `dispatch-transport`, `execution-core`, `run-result`, `runner`, `session-rotation` | Supervised attempt dispatch, execution planning, isolation request, and executor adapters.; Single authority for how a Unit runs (mechanism, posture, gates) through run door.; Evidence and confidence boundary for assignment run results.; Top-level runner orchestration, paths, locks, rigor, and agent definitions.; Session handoff and rotation mechanics across session boundaries. | `docs/platform/runner/spec.md` |
| `seat-binding` | `seat-binding` | Authority for which executor, invocation, model, effort, tier and account runs an agent seat. | `docs/platform/seat-binding/spec.md` |
| `secrets` | `secrets` | Secrets vault and safe token management. | `docs/platform/secrets/spec.md` |
| `session-host` | `session-host` | Authority for placing an agent session, worker or head: start, alive, front, retire. | `docs/platform/session-host/spec.md` |
| `supervision` | `supervision` | Coordinates the plans of a project with no person sitting by. | `docs/platform/supervision/spec.md` |
| `terminal-control` | `terminal-control` | Foundation component for terminal multiplexer pane allocation and key addressing. | `docs/platform/terminal-control/spec.md` |
| `ui-spec` | `ui-spec` | Visual contracts and UI specifications for fgOS web surfaces. | `docs/platform/ui-spec/spec.md` |
| `work-state` | `enduser-docs-authoring`, `enduser-docs-index`, `learning-docs-registry`, `work-state` | Authority for authoring and maintaining end-user documentation.; Authority for tag-based indexing of end-user documentation.; Retrospective knowledge capture, doc registry, Diataxis index, and evolve signals.; Domain-agnostic work-unit lifecycle, status board, claim/return, and human gates. | `docs/platform/work-state/spec.md`, `docs/platform/work-state/contracts/knowledge-registry.md` |
| `workflow` | `workflow` | Workflow guide schema, case ledger, reservations, admission, and worktree binding. | `docs/platform/workflow/spec.md` |
| `write-scope` | `write-scope` | Authority for what a declared path scope means and whether two scopes overlap. | `docs/platform/write-scope/spec.md` |
| `yaml-document` | `yaml-document` | Lossless reading, editing, and merging of YAML documents with positions. | `docs/platform/yaml-document/spec.md` |
<!-- /generated:component-authority:system-overview-area-map -->

Hand-written area notes the model does not hold:

- distill-skill — skill portable vận hành vòng học (init/add/delta/seal/check); spec: chưa có (harvest sẽ viết)
- platform-foundations — orientation and non-law rules/decision narratives: `docs/platform/platform-foundations.md`; exclusive binding L1–L10 wording, rationale and thresholds: `docs/platform/platform-foundations.md` (also listed under `(cross-area)` in the generated map when present in the model).

## Shared Entities

Hand-written shared entities (Meaning / Touched by) retained from the prior overview; the generated ownership block below lists model `owns` rows only.

| Entity | Meaning | Touched by |
|---|---|---|
| Nguồn tham chiếu (reference source) | Một repo/tài liệu ngoài được quét để học feature | distillery (owns), distill-skill (đọc/ghi index) |
| Luật nền (platform law) | Một luật thiết kế đã khóa, có D-ID và ngưỡng xem lại | platform-foundations (owns); mọi area tương lai tuân theo |
| Work item (`work`) | Đơn vị việc duy nhất của forgent: trạng thái FSM + deps phẳng + tier, đủ trường trả lời sáu câu harness. Một việc có thể đậu lại chờ người quyết (`awaiting-human`, mang câu hỏi) — bất đồng bộ, không chặn việc khác | work-state (owns), runner (đọc frontier — frontier LOẠI việc `awaiting-human`, runner không bao giờ pick việc đang chờ người) |
| Bản ghi kết quả (outcome) | Bản ghi hai nửa gắn theo id work item — dự đoán lúc nhận việc, thực tế lúc việc tới trạng thái cuối (thành công lẫn thất bại) — cộng dồn theo id, không bao giờ đè nhau; nguồn tín hiệu cho vòng học compound. Mang thêm nhãn Diataxis `docType` và con trỏ tài-liệu `docPath` (cộng-thêm, tùy chọn) khi capture khai — là móc linkage tài-liệu↔việc | work-state (owns fold + đọc qua `fgos metrics outcomes`); mọi skill claim/return/settle ghi; enduser-docs-authoring đọc `docType`/`docPath` |
| Cổng chờ-người (human-gate) | Điểm một việc dừng chờ người quyết trước khi đi tiếp; mang cặp câu hỏi/câu trả lời gộp theo id. Primitive chung — spine cho mọi cổng-người của vòng đời (intake, exploring, planning, review PR) | work-state (owns — verb `fgos ask`/`answer`, đọc qua `fgos list`) |

[unknown — các entity khác cần harvest interview; xem Open Gaps]

Ownership rows generated from `packages/component-authority/model/`:

<!-- generated:component-authority:system-overview-shared-entities -->
Ownership rows across every area: each thing a component declares it owns, with that component. <!-- rendered from packages/component-authority/model/ by `node scripts/component-authority-render.mjs`; edit the model, never this block -->

| Entity | Owner | Owner doc |
| --- | --- | --- |
| documentation admission frame and review gate | `admission` | `docs/platform/documentation/subcomponents/admission/spec.md` |
| agent confinement enforcement | `agent-confinement` | `docs/platform/agent-confinement/spec.md` |
| bwrap isolation driver | `agent-confinement` | `docs/platform/agent-confinement/spec.md` |
| private home hiding | `agent-confinement` | `docs/platform/agent-confinement/spec.md` |
| coordination area navigation and historical evidence | `agent-coordination` | `docs/platform/agent-coordination/spec.md` |
| CoordinationSession manifest/events | `agent-coordination-engine` | `docs/platform/agent-coordination/spec.md` |
| Assignment membership | `agent-coordination-engine` | `docs/platform/agent-coordination/spec.md` |
| actor/topology/bounds | `agent-coordination-engine` | `docs/platform/agent-coordination/spec.md` |
| session recovery | `agent-coordination-engine` | `docs/platform/agent-coordination/spec.md` |
| session synthesis boundary | `agent-coordination-engine` | `docs/platform/agent-coordination/spec.md` |
| Team Cognition invocation | `agent-coordination-engine` | `docs/platform/agent-coordination/spec.md` |
| optional protocol/dynamic planning consumption | `agent-coordination-engine` | `docs/platform/agent-coordination/spec.md` |
| agent mailbox delivery and head registration | `agent-mailbox` | `docs/platform/agent-mailbox/spec.md` |
| agent CLI output parsing and protocol status mapping | `agent-protocol` | `docs/platform/agent-protocol/spec.md` |
| RFC 8785 canonical JSON serialization | `canonical-json` | `docs/platform/component-boundary.md` |
| claude code slash-command surface | `claude-plugin` | `docs/platform/claude-plugin/spec.md` |
| coding domain policies, worktree isolation doctrine, merge/catchup, code verification doctrine | `coding-domain` | `docs/platform/component-boundary.md` |
| product/design, cook, bugfix, and small-change policies | `coding-domain` | `docs/platform/component-boundary.md` |
| repo scope, footprint, worktree/branch/isolation | `coding-domain` | `docs/platform/component-boundary.md` |
| merge/catchup, technical approval | `coding-domain` | `docs/platform/component-boundary.md` |
| coding evidence adapters | `coding-domain` | `docs/platform/component-boundary.md` |
| collaboration loop definitions and preset configurations | `collaboration-patterns` | `docs/platform/runner/spec.md` |
| who owns what: components, subcomponents, decision kinds, doors, contract index, file-to-component mappings | `component-authority` | `docs/platform/component-authority/spec.md` |
| single structural model at packages/component-authority/model/ | `component-authority` | `docs/platform/component-authority/spec.md` |
| locate and declare doors for structural registration | `component-authority` | `docs/platform/component-authority/spec.md` |
| configuration files, schemas, and effective config snapshot | `config` | `docs/platform/config/spec.md` |
| config facade src/config/facade.mjs | `config` | `docs/platform/config/spec.md` |
| containment port contract and process domain guarantees | `containment-port` | `docs/platform/process/spec.md` |
| artifact placement rules | `convention` | `docs/platform/convention/spec.md` |
| path conventions and slugs | `convention` | `docs/platform/convention/spec.md` |
| convention check | `convention` | `docs/platform/convention/spec.md` |
| citation-format defect checks | `decision-citation-drift` | `docs/platform/decision-citation-drift/spec.md` |
| dispatch planning and launch | `dispatch-transport` | `docs/platform/runner/spec.md` |
| executor adapter invocation | `dispatch-transport` | `docs/platform/runner/spec.md` |
| confinement request assembly | `dispatch-transport` | `docs/platform/runner/spec.md` |
| Assignment-to-DispatchPlan resolution | `dispatch-transport` | `docs/platform/runner/spec.md` |
| governance/egress | `dispatch-transport` | `docs/platform/runner/spec.md` |
| launch, timeout, cancellation, retry attempt metadata | `dispatch-transport` | `docs/platform/runner/spec.md` |
| porting lifecycle and reference analysis | `distillery` | `docs/platform/distillery/spec.md` |
| doc health checks and body rules | `doc-checks` | `docs/platform/documentation/subcomponents/doc-checks/spec.md` |
| document axis model, locate before write, and claim units | `document-identity` | `docs/platform/documentation/subcomponents/document-identity/spec.md` |
| documentation architecture and maintained corpus | `documentation` | `docs/platform/documentation/spec.md` |
| domain-specific workflows, skills, task specs, and doctrine | `domain-components` | `docs/platform/component-boundary.md` |
| runtime definition registry, domain and workflow loader, flow definition validation | `domain-registry-loader` | `docs/platform/component-boundary.md` |
| workflow/stage/operation declarations, task-spec/skill references, roles | `domain-registry-loader` | `docs/platform/component-boundary.md` |
| FlowDefinition validation/projection | `domain-registry-loader` | `docs/platform/component-boundary.md` |
| atomic and durable file write primitives, fsync | `durable-file` | `docs/platform/component-boundary.md` |
| end-user documentation authoring and maintenance | `enduser-docs-authoring` | `docs/platform/work-state/spec.md` |
| end-user documentation tag-based indexing | `enduser-docs-index` | `docs/platform/work-state/spec.md` |
| event sealing, refs/fgos/* publication | `event-store` | `docs/platform/event-store/spec.md` |
| event streams and causal ordering | `event-store` | `docs/platform/event-store/spec.md` |
| unit run execution loop | `execution-core` | `docs/platform/runner/spec.md` |
| run admission and settlement | `execution-core` | `docs/platform/runner/spec.md` |
| posture enforcement | `execution-core` | `docs/platform/runner/spec.md` |
| Run creation | `execution-core` | `docs/platform/runner/spec.md` |
| in-process Run mechanism | `execution-core` | `docs/platform/runner/spec.md` |
| executor model and derived facts | `executor-model` | `docs/platform/runner/contracts/executor-model.md` |
| executor doctor judgments | `executor-model` | `docs/platform/runner/contracts/executor-model.md` |
| REST API, MCP gateway, embedded web dashboard bundle | `fgos-gateway` | `docs/platform/herdr-web-dashboard/spec.md` |
| git repository operations | `git` | `docs/platform/git/spec.md` |
| worktree allocation and removal | `git` | `docs/platform/git/spec.md` |
| refs management and publication | `git` | `docs/platform/git/spec.md` |
| directed graph analysis, cycle detection, topological sorting | `graph` | `docs/platform/graph/spec.md` |
| group-thinking protocol definitions, public request and replay adapters | `group-thinking` | `docs/platform/component-boundary.md` |
| versioned data-first CoordinationProtocol definitions | `group-thinking` | `docs/platform/component-boundary.md` |
| fgos-group-thinking skill | `group-thinking` | `docs/platform/component-boundary.md` |
| selects an explicit registered protocol, builds a public request, launches/resumes through coordination surfaces, renders public replay/evidence | `group-thinking` | `docs/platform/component-boundary.md` |
| runner data dictionary definitions | `h-02842f76ffd2` | `docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md` |
| runner gap tracking and known limits | `h-2e032393add1` | `docs/platform/runner/subcomponents/h-2e032393add1/spec.md` |
| runner settled edge case records | `h-37aced3896a8` | `docs/platform/runner/subcomponents/h-37aced3896a8/spec.md` |
| runner business rules | `h-6979005beaf7` | `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md` |
| runner actors and access controls | `h-6df5686d0d54` | `docs/platform/runner/subcomponents/h-6df5686d0d54/spec.md` |
| runner entry point triggers and routes | `h-ce5b9771a26a` | `docs/platform/runner/subcomponents/h-ce5b9771a26a/spec.md` |
| runner visual architecture diagrams | `h-d3b49ef7edf5` | `docs/platform/runner/subcomponents/h-d3b49ef7edf5/spec.md` |
| runner implementation pointers | `h-f34e0d170d89` | `docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md` |
| herdr transport, pane liveness, and dashboard plugin adapter | `herdr-transport` | `docs/platform/herdr-web-dashboard/spec.md` |
| web dashboard portal | `herdr-web-dashboard` | `docs/platform/herdr-web-dashboard/spec.md` |
| kernel locks and lock scopes | `holder-lock` | `docs/platform/holder-lock/spec.md` |
| main checkout mutex | `holder-lock` | `docs/platform/holder-lock/spec.md` |
| lock registry | `holder-lock` | `docs/platform/holder-lock/spec.md` |
| host invocation routing | `host-invocation-routing` | `docs/platform/host-invocation-routing/spec.md` |
| provider routing | `host-invocation-routing` | `docs/platform/host-invocation-routing/spec.md` |
| CLI/API/plugin/gateway/Herdr/webhook/chat entrypoints | `host-surface` | `docs/platform/README.md` |
| auth, envelopes, visibility | `host-surface` | `docs/platform/README.md` |
| process control, operator diagnostics | `host-surface` | `docs/platform/README.md` |
| cli command dispatch | `host-surface` | `docs/platform/README.md` |
| top-level verb routing | `host-surface` | `docs/platform/README.md` |
| cli IO and exit codes | `host-surface` | `docs/platform/README.md` |
| writer identity minting and verification | `identity` | `docs/platform/identity/spec.md` |
| machine and project id minting | `identity` | `docs/platform/identity/spec.md` |
| launcher env scrub | `identity` | `docs/platform/identity/spec.md` |
| agent process gate, env scrub application, and hard ceiling enforcement | `launch-gate` | `docs/platform/run-supervisor/spec.md` |
| knowledge registry and resolution | `learning-docs-registry` | `docs/platform/work-state/contracts/knowledge-registry.md` |
| retrospective learning and doc indexing | `learning-docs-registry` | `docs/platform/work-state/contracts/knowledge-registry.md` |
| retrospective knowledge capture | `learning-docs-registry` | `docs/platform/work-state/contracts/knowledge-registry.md` |
| doc slot/topic registry, projections, traces | `learning-docs-registry` | `docs/platform/work-state/contracts/knowledge-registry.md` |
| end-user docs index | `learning-docs-registry` | `docs/platform/work-state/contracts/knowledge-registry.md` |
| learning outputs | `learning-docs-registry` | `docs/platform/work-state/contracts/knowledge-registry.md` |
| friction repository and metrics collection | `observe` | `docs/platform/observe/spec.md` |
| case lifecycle journals and telemetry | `observe` | `docs/platform/observe/spec.md` |
| Measurement and scorecard calculation across substrate entities (run, session, executor, case, work) | `observe` | `docs/platform/observe/spec.md` |
| case lifecycle journal (.fgos/observe/cases/) | `observe` | `docs/platform/observe/spec.md` |
| independent friction repository (.fgos/observe/friction/) | `observe` | `docs/platform/observe/spec.md` |
| writer shards | `observe` | `docs/platform/observe/spec.md` |
| store locks (.fgos/observe/.lock) | `observe` | `docs/platform/observe/spec.md` |
| snapshots | `observe` | `docs/platform/observe/spec.md` |
| declaring ObservationSource / LegacyFrictionSource traits | `observe` | `docs/platform/observe/spec.md` |
| packaging, release artifacts, and distribution | `packaging-distribution` | `docs/platform/packaging-distribution/spec.md` |
| doctor readiness registry and check execution | `packaging-distribution` | `docs/platform/packaging-distribution/spec.md` |
| setup and global/project config precedence | `packaging-distribution` | `docs/platform/packaging-distribution/spec.md` |
| config defaults, config merge | `packaging-distribution` | `docs/platform/packaging-distribution/spec.md` |
| install/upgrade/distribution health | `packaging-distribution` | `docs/platform/packaging-distribution/spec.md` |
| required binaries/services/directories | `packaging-distribution` | `docs/platform/packaging-distribution/spec.md` |
| doctor checks/fixes registry | `packaging-distribution` | `docs/platform/packaging-distribution/spec.md` |
| pure foundation utilities | `platform-foundations` | `docs/platform/platform-foundations.md` |
| common path and text helpers | `platform-foundations` | `docs/platform/platform-foundations.md` |
| process liveness judgement | `process` | `docs/platform/process/spec.md` |
| process signalling and process domain facts | `process` | `docs/platform/process/spec.md` |
| owner question shape and states | `questions` | `docs/platform/questions/spec.md` |
| questions verbs and receipt hook | `questions` | `docs/platform/questions/spec.md` |
| resource referee evaluation and claim arbitration | `resource-referee` | `docs/platform/resource-referee/spec.md` |
| Worker result parsing | `run-result` | `docs/platform/runner/spec.md` |
| evidence collection coordination | `run-result` | `docs/platform/runner/spec.md` |
| artifact freshness/provenance checks | `run-result` | `docs/platform/runner/spec.md` |
| confidence decision | `run-result` | `docs/platform/runner/spec.md` |
| RunResult normalization | `run-result` | `docs/platform/runner/spec.md` |
| failure classification for one Assignment Run | `run-result` | `docs/platform/runner/spec.md` |
| run outcome derivation | `run-result` | `docs/platform/runner/spec.md` |
| evidence policy evaluation | `run-result` | `docs/platform/runner/spec.md` |
| result normalization | `run-result` | `docs/platform/runner/spec.md` |
| attempt supervision and receipts | `run-supervisor` | `docs/platform/run-supervisor/spec.md` |
| adopt door and cleanup | `run-supervisor` | `docs/platform/run-supervisor/spec.md` |
| attempt timeout enforcement | `run-supervisor` | `docs/platform/run-supervisor/spec.md` |
| runner paths and repo locks | `runner` | `docs/platform/runner/spec.md` |
| agent definitions and rigor rules | `runner` | `docs/platform/runner/spec.md` |
| seat ranking and tier ladder | `seat-binding` | `docs/platform/seat-binding/spec.md` |
| account assignment policy | `seat-binding` | `docs/platform/seat-binding/spec.md` |
| executor binding | `seat-binding` | `docs/platform/seat-binding/spec.md` |
| executor/provider/model/tier/mechanism selection | `seat-binding` | `docs/platform/seat-binding/spec.md` |
| exactly two routing identities (capability, executor-id); purpose/--for is capability compatibility syntax; job is not a routing identity (ADR-004 (reserved unused job routing identity)) | `seat-binding` | `docs/platform/seat-binding/spec.md` |
| secrets storage and credential retrieval | `secrets` | `docs/platform/secrets/spec.md` |
| agent session placement port | `session-host` | `docs/platform/session-host/spec.md` |
| direct and terminal adapters | `session-host` | `docs/platform/session-host/spec.md` |
| session rotation mechanics | `session-rotation` | `docs/platform/runner/spec.md` |
| session handoff contract | `session-rotation` | `docs/platform/runner/spec.md` |
| project supervisor orchestration | `supervision` | `docs/platform/supervision/spec.md` |
| portfolio status and plan lane pool | `supervision` | `docs/platform/supervision/spec.md` |
| typed deliberation interpretation | `team-cognition-engine` | `docs/platform/agent-coordination/spec.md` |
| aggregation-method semantics | `team-cognition-engine` | `docs/platform/agent-coordination/spec.md` |
| source/dissent/omission coverage validation | `team-cognition-engine` | `docs/platform/agent-coordination/spec.md` |
| cognitive outcomes linked to immutable RunResult/artifact evidence | `team-cognition-engine` | `docs/platform/agent-coordination/spec.md` |
| terminal pane allocation and lifecycle | `terminal-control` | `docs/platform/terminal-control/spec.md` |
| multiplexer driver port | `terminal-control` | `docs/platform/terminal-control/spec.md` |
| visual contracts and dashboard UI specification | `ui-spec` | `docs/platform/ui-spec/spec.md` |
| Ready-work selection | `work-driver` | `docs/platform/component-boundary.md` |
| automation loop policy | `work-driver` | `docs/platform/component-boundary.md` |
| declared Stage Operation choice | `work-driver` | `docs/platform/component-boundary.md` |
| cross-flow routing | `work-driver` | `docs/platform/component-boundary.md` |
| park/halt behavior | `work-driver` | `docs/platform/component-boundary.md` |
| recovery/anti-loop around Work execution | `work-driver` | `docs/platform/component-boundary.md` |
| invoking lifecycle verbs and dispatch surfaces | `work-driver` | `docs/platform/component-boundary.md` |
| work item identity, status, and stage | `work-state` | `docs/platform/work-state/spec.md` |
| claim and return lifecycle | `work-state` | `docs/platform/work-state/spec.md` |
| lifecycle event truth | `work-state` | `docs/platform/work-state/spec.md` |
| related refs, context refs, document refs | `work-state` | `docs/platform/work-state/spec.md` |
| questions, human gates | `work-state` | `docs/platform/work-state/spec.md` |
| lifecycle verbs | `work-state` | `docs/platform/work-state/spec.md` |
| domain-agnostic Work event truth | `work-state` | `docs/platform/work-state/spec.md` |
| workflow guide and case ledger | `workflow` | `docs/platform/workflow/spec.md` |
| admission port implementation | `workflow` | `docs/platform/workflow/spec.md` |
| reservations and route events | `workflow` | `docs/platform/workflow/spec.md` |
| documentation write procedure and template enforcement | `write-door` | `docs/platform/documentation/subcomponents/write-door/spec.md` |
| write scope parsing, overlap detection, and set-level collisions | `write-scope` | `docs/platform/write-scope/spec.md` |
| lossless YAML document parsing and modification | `yaml-document` | `docs/platform/yaml-document/spec.md` |
<!-- /generated:component-authority:system-overview-shared-entities -->

## Actors & Roles (global)

- Product owner (user) — khóa/supersede luật, duyệt gate, chốt quyết định sản phẩm.
- Agent (Claude/Codex session) — đọc doctrine + spec, thi hành công việc, capture settlement.
- Worker (trợ lý nền do runner phái) — làm MỘT việc trong nhánh cô lập, chỉ để lại commit; không ghi trạng thái, không sửa cây chính.

[unknown — vai trò khác nếu có, cần harvest]

## Cross-Area Flows

**Vòng tự hành việc (work-state ↔ runner):** người vận hành khai việc (`fgos add`) → runner `--once` lấy việc sẵn-sàng từ frontier → claim `doing` (runner ghi nửa dự đoán của bản ghi outcome) → trợ lý nền làm trong nhánh `fgw/` → runner tự chấm bằng proof của việc → đạt: `awaiting-approval` (đề xuất + nhánh, runner ghi nửa thực tế) → NGƯỜI duyệt qua cổng `review`/`approve`/`reject` — một cổng duy nhất cho mọi đề xuất (xem "Cổng duyệt PR nội bộ" dưới) — merge sạch tự động khi duyệt → `done` → việc phụ thuộc mở khóa. Trượt/lỗi: bảng phục hồi → thử-lại/đỗ-lại (ghi nửa thực tế)/dừng (ghi nửa thực tế); một cổng duyệt gãy (merge conflict hoặc verify đỏ sau merge) đậu đề xuất lại ở `blocked` mang lý do, không tự rebase, không halt cả vòng. Cả hai nửa đọc lại được qua `fgos check` (đã gỡ trong c36f8d746) — nguồn của vòng học compound.

**Cổng duyệt PR nội bộ (work-state ↔ runner):** một đề xuất `awaiting-approval` — dù đến từ runner (nhánh `fgw/<id>`) hay từ cửa pull `take`/`return` (dải commit) — đi qua CÙNG một cổng: `review` (xem diff), `approve` (merge nếu có nhánh, rồi verify; hoặc chỉ verify nếu code đã trên main), `reject` (từ chối, không revert). Duyệt sạch đóng cạnh `→done` mang role NGƯỜI; gãy đóng cạnh MỚI `awaiting-approval→blocked` mang lý do. Xem docs/platform/runner/operations/h-51f5cd7279fd.md#cổng-duyệt-pr-nội-bộ-approval-gate-reviewapprovereject "Cổng duyệt PR nội bộ" cho hợp đồng đầy đủ.

**Cửa pull giao–nhận việc (work-state, thay thế runner cho MỘT item):** một tác nhân ngoài runner — người, một phiên đang sống, hay một runner thứ hai — `fgos take` đúng một item từ CÙNG tập frontier runner dùng, rồi tự `fgos return`; `return` không tin lời người gọi, tự đo working tree sạch + HEAD tiến + verify thật trước khi item thành `awaiting-approval` mang `headAtReturn` — mirror đúng contract `awaiting-approval` của runner. Gặt-lại lúc khởi động của runner không bao giờ giẫm lên claim này (xem docs/platform/work-state/spec.md#7-pull-door-take-and-return "Cửa pull giao–nhận việc", docs/platform/runner/spec.md). Dải `headAtTake→headAtReturn` là nguồn diff của đề xuất này khi nó tới cổng duyệt PR nội bộ (trên).

**Vòng tài liệu người-dùng-cuối (enduser-docs-authoring → enduser-docs-index):** khi việc mang status `retrospective`, kỷ luật soạn tài liệu đọc capture thật của việc, phân đúng một ngăn Diataxis, lưu tag + móc đường-dẫn lên capture (`fgos compound --doc-type --doc-path`), gom **mọi** capture của đường dẫn đó (`fgos doc-sources`), rồi grow-or-create một tài liệu sống theo tồn-tại-tệp — tích luỹ không mất (write-side). Sau đó `fgos docs-index` liệt kê tài liệu và truy ngược mỗi tài liệu về capture qua `docPath` (read-side); tài liệu how-to đầu tiên nay liên kết thật tới capture `doc-fgos-rollup-howto`. Ngăn Diataxis là trục cấu trúc duy nhất; purpose/audience là metadata, không phải trục thứ hai.

**Hướng mặt-người đa-surface (đã chốt, chưa xây — backlog STR37/STR38, per D b2d18cc7):** mọi mặt người — cửa lệnh hôm nay, web/chat/webhook mai sau — là DA; ruột chỉ có một, và chỗ da gặp ruột là hợp đồng cửa-lệnh (envelope kết quả + phân loại exit đóng). Một listener nhận transport ngoài (web/chat) sống ở đất host-adapter và DỊCH yêu cầu thành verb — gọi cửa lệnh như một người dùng, không bao giờ mở đường ghi riêng; kèm cổng xác danh "ai được nói verb nào" trước khi dịch (mô tả tự do đổ vào intake là vector tiêm lệnh vì proof của việc chạy như lệnh — nguồn chưa kiểm phải qua cổng). Chuẩn hóa đi trước **đã xong** (STR37): envelope bọc kết quả trên MỌI verb qua một cửa in duy nhất + một manifest verb máy-đọc (`--help --json`, mỗi verb có cờ `access` read/mutation) để mọi surface sinh giao diện từ manifest thay vì hard-code. Còn lại của hướng này: listener host-adapter + cổng xác danh (backlog STR38). Chiều hệ→người chủ động (kênh chú-ý) chưa xây — surface tạm poll danh sách việc + so hash thay đổi của envelope; poll bắt đầu khó chịu là tín hiệu kênh chú-ý đến lượt.

[unknown — vòng học distillery → porting → platform law cần harvest xác nhận từng bước; xem Open Gaps]

## Open Gaps

- distillery: spec chỉ phủ porting lifecycle (docs/platform/distillery/spec.md#distillery-porting-lifecycle) — các khả năng khác (tìm nguồn mới, so sánh chéo, xếp hạng candidate) chưa có spec.
- distill-skill: chưa có area spec — harvest từ SKILL.md + lệnh thực chạy (`init/add/delta/seal/check`).
- Shared entities ngoài 2 dòng đã liệt kê: cần harvest interview.
- Cross-area flow học→port→luật: các bước và actor quan sát gì ở mỗi bước — cần harvest.

## Pointers (implementation)

- `README.md` — mô tả sản phẩm + mục lục tài liệu
- `.agents/skills/distill/SKILL.md` — định nghĩa skill distill (Node zero-dep)
- `node .agents/skills/distill/scripts/distill.mjs check` — lệnh verify hiện hành (ghi tại `.bee/config.json`)

## Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)

Các ADR dưới đây được di dời nguyên văn từ `docs/decisions/` (tsk-1lv-4) -- corpus đó đã retired, `state.decisions` (qua `fgos decision --scope`) giữ record ngắn làm nguồn thật, phần narrative đầy đủ sống ở đây. Thứ tự theo số ADR gốc.


### D-ADR0016 — Mốc MVP của fgOS

[valid_from:: 2026-07-20]

#### Bối cảnh

Trước quyết định này fgOS chưa có phát biểu MVP/milestone chính thức nào — grep "MVP"/"milestone" trong `docs/` trả 0 hit. Định nghĩa "có harness" ở `platform-foundations.md` L5 (sáu câu hỏi) và thang trưởng thành hạ tầng L6 (F0–F5, fgOS tự tuyên F4 tại 2026-07-16) đo ĐỘ CHÍN CỦA HẠ TẦNG, không đo "người dùng cuối LÀM ĐƯỢC GÌ". Một câu MVP nháp xuất hiện trong báo cáo tích hợp P50 (2026-07-20) nhưng gắn nhãn "chưa chốt" và chỉ sống trong một file HTML report — không phải tài liệu sản phẩm đã ship.

Mốc dogfood tự-phát-triển (STR25) đã ĐẠT 2026-07-17: item thật đi trọn vòng submit→clarify→decompose→execute→PR→merge, không cần bee đỡ. Nghĩa là VÒNG cốt lõi đã chạy; cái còn thiếu để thành "sản phẩm cho người lạ" là hai điều trong chính câu MVP: người-mới-chỉ-dùng-tài-liệu-đã-ship, và tối-thiểu-ngồi-canh.

#### Quyết định

1. **Phát biểu MVP của fgOS (chốt):**

   > Một người mới — không có ngữ cảnh trước, chỉ dựa vào tài liệu ĐÃ SHIP — cài fgOS, nộp MỘT yêu cầu thật bằng văn xuôi tự do, và nhận lại một thay đổi code thật: chạy được, có test, sẵn sàng merge — với tối thiểu sự canh chừng của con người.

2. **"Tối thiểu ngồi canh" có răng đo được:** con người chỉ can thiệp ở các CỔNG-NGƯỜI thật sự cần một quyết định (clarify không hội tụ được vì thiếu thông tin chỉ người có; duyệt/merge). Con người KHÔNG phải can thiệp để gỡ hệ tự-kẹt (park oan, loop lỗi, phán đoán lồng-nhau hỏng). Một lần bắt người gỡ-kẹt là một lỗi tính vào MVP, không phải một cổng-người hợp lệ.

3. **Trục MVP bổ sung cho L5/L6, không thay thế:** L5 (định nghĩa "có harness") và L6 (thang chín hạ tầng) đo phía HỆ; câu MVP này đo phía NGƯỜI DÙNG CUỐI. Ba trục cùng tồn tại, không trùng.

4. **Phạm vi MVP là "một yêu cầu → một code change".** Nó KHÔNG đòi goal-directed planning (khai goal → tự sắp cả backlog, STR67) — đó là tính năng lớn hơn, mở rộng CƠ HỘI vượt MVP tối thiểu, không phải điều kiện của MVP.

#### Hệ quả

- **Ưu tiên hướng MVP** (dẫn ra từ phát biểu này): (a) độ tin cậy của loop tự chạy — mọi "gỡ-kẹt-thủ-công" là bug MVP (ví dụ STR68: phán đoán discovery lồng-nhau trả văn xuôi thay vì JSON → park oan item rõ ràng, vi phạm trực tiếp "tối thiểu ngồi canh"); (b) chất lượng tài liệu ĐÃ SHIP đủ cho người lạ (STR64); (c) trải nghiệm cổng-người khi loop THẬT SỰ cần người (STR61 đã ship; STR69/STR70 là enabler).
- **STR67 (goal-directed planning)** dùng chính câu MVP này làm target đầu vào cho ca dogfood đầu tiên của nó — nhưng nằm NGOÀI phạm vi MVP tối thiểu (điểm 4).
- **Không supersede gì** — thêm một trục mục tiêu sản phẩm mới, không đổi luật L1–L10.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

### D-ADR0018 — Mốc MVP2 của fgOS

[valid_from:: 2026-07-27]

#### Bối cảnh

Quyết định `0016` chốt phát biểu MVP của fgOS: một người mới nộp MỘT yêu cầu
thật bằng văn xuôi tự do và nhận lại một thay đổi code thật, chạy được, có
test, sẵn sàng merge — với tối thiểu sự canh chừng của con người. MVP1 đã
chứng minh vế đó khi con người là người BẤM NÚT khởi động vòng lặp: nộp yêu
cầu rồi tự tay `pick` để hệ chạy tiếp không cần canh (`0016` điểm 2).

Việc còn lại là kiểm tra vế thứ hai: liệu VÒNG LÕI ấy (discover → decompose →
implement → return → review tới `done`) có ra kết cục TƯƠNG ĐƯƠNG hay không
khi không có bất kỳ cú bấm-tay nào khởi động nó — một dispatcher chạy độc lập
(`fgos-runner --once`) tự claim và tự đóng vòng, không cần con người chọn
việc. Đây chính là nội dung CoS đã amend của PBI `p-52601a01`
(`.bee/backlog.jsonl`, 2026-07-27T11:09:16Z): dựng và đối chiếu hai ca dry-run
sống trên testbed `repo/dogfood-fixture/` đã có sẵn — một do
`/fgOS:submit` + `/fgOS:pick` trong cùng phiên tương tác kích hoạt, một do
`/fgOS:submit` + `fgos-runner --once` độc lập kích hoạt — và ghi nhận kết
quả đối chiếu, không phải chỉ lập kế hoạch.

#### Quyết định

1. **Phát biểu MVP2 (chốt, mở rộng `0016`):**

   > MVP1 (`0016`) đã chứng minh một yêu cầu do con người BẤM NÚT khởi động
   > đi trọn vòng lõi tới `done`. MVP2 chứng minh CHÍNH vòng lõi đó
   > (discover → decompose → implement → return → review tới `done`) đạt
   > kết cục TƯƠNG ĐƯƠNG khi khởi động **không có bất kỳ cú bấm-tay nào** —
   > một dispatcher chạy độc lập (headless) tự đóng trọn vòng, không cần
   > con người chọn việc.

2. **"Tương đương" có răng đo được (kế thừa khung đo của `0016` điểm 2):**
   cả hai ca — ca tương tác (`/fgOS:pick`) và ca headless
   (`fgos-runner --once`) — phải cùng đạt: verify xanh, một commit thật trên
   nhánh riêng của item, và dọn worktree sạch sau khi xong. Một khác biệt
   giữa hai kết cục là một GAP THẬT, được ghi nhận thành một dòng `proposed`
   mới trong `repo/plans/backlog.md`, không âm thầm bỏ qua.

3. **Trục MVP2 bổ sung cho trục MVP1, không thay thế:** `0016` chứng minh
   vòng lõi CHẠY ĐƯỢC khi con người khởi động; `0018` chứng minh CHÍNH vòng
   lõi ấy chạy được khi con người KHÔNG khởi động. Đây là cùng một vòng lõi
   được kiểm chứng dưới hai đường kích hoạt khác nhau, không phải một tính
   năng mới.

4. **Phạm vi MVP2 vẫn là "một yêu cầu → một code change"** — kế thừa nguyên
   trạng giới hạn phạm vi của `0016` điểm 4 (không đòi goal-directed
   planning). MVP2 chỉ đổi CÁCH vòng lõi được khởi động, không mở rộng
   những gì vòng lõi phải làm.

#### Hệ quả

- Testbed và hạ tầng dùng để chứng minh MVP2 (`repo/dogfood-fixture/`,
  `repo/.fgos-runner.json`, `src/runner/worktree.mjs`) đã có sẵn từ trước —
  quyết định này không kéo theo việc dựng hạ tầng mới, chỉ ghi nhận phát
  biểu mốc và kết quả đối chiếu hai ca chạy thật.
- Bất kỳ khoảng cách nào giữa ca tương tác và ca headless được đối chiếu ra
  (kể cả trường hợp một trong hai đường không thể chạy an toàn với hạ tầng
  hiện có) là một phát hiện gap thật của chính mốc MVP2 này, được nạp vào
  `repo/plans/backlog.md` như một dòng `proposed`, không phải điều kiện thất
  bại của quyết định — quyết định vẫn đứng, gap trở thành việc kế tiếp.
- **Không supersede `0016`** — `0018` mở rộng trục MVP đã chốt bằng vế
  headless, không đổi phát biểu MVP1 hay luật L1–L10.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
