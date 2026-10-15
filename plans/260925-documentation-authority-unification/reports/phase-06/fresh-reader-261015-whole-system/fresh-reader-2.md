# Fresh reader answers: whole-system architecture batch

Notes that apply to every scenario. `docs/platform/documentation/switchboard.md` is itself marked candidate, Canonical: No (header block), yet it calls itself the operative authority router (`docs/platform/documentation/switchboard.md#1-operating-invariants`). `docs/platform/**` is "the target topology, not yet the universal live authority" (same anchor, invariant 2). Candidate files under `docs/platform/system-architecture/**` all say "Canonical for: Nothing until promotion; current source remains docs/architect/..." in their header blocks.

## Scenario A: new notification service (pushes "item is waiting for a human" to chat)

1. What to read first
   - `docs/platform/README.md#4-how-to-change-platform-docs` (entry steps), then `docs/platform/documentation/switchboard.md#4-resolution-algorithm-for-readers-and-writers`, then `docs/platform/component-boundary.md#3-update-rule` and `docs/platform/component-boundary.md#4-current-high-level-components`.
   - The register of component roles and consumers: `docs/platform/component-boundary.md#5-high-level-component-authority-register` (this is carried-in advisory text; the doc says its detailed source is `docs/architect/component-boundary/component-boundary-advisory.md`, which I did not open).
   - Trigger state: `docs/platform/system-overview/spec.md#shared-entities` (the human-gate / `awaiting-human` entity is owned by work-state).
2. What kind of work
   - A whole-system component and authority-boundary change (new component, new cross-area dependency, new outbound surface), not just an area spec edit. `docs/platform/component-boundary.md#3-update-rule` lists exactly these triggers (platform component, ownership of a decision or state write, cross-area dependency, host-surface boundary).
   - The closest existing home is the "Host And Surface Layer" row, which the register describes as translating "webhook/chat/Herdr interactions" into engine calls "without becoming lifecycle or evidence truth" (`docs/platform/component-boundary.md#5-high-level-component-authority-register`). The component table in `docs/platform/component-boundary.md#4-current-high-level-components` also lists "Host And Surface Layer". A reader must decide whether the notifier is a surface adapter or a new platform-support component; the docs do not decide that for me.
   - Owner of the boundary decision: the candidate entry is `docs/platform/component-boundary.md`. It says it is a "compact navigation surface" and that detail lives in `docs/architect/component-boundary/**`. The switchboard row "Whole-system architecture and component boundaries" is `candidate` and says binding claims come from retained legacy sources: `docs/architecture-map.md` and `docs/architect/component-boundary/**` (`docs/platform/documentation/switchboard.md#2-area-authority-routes`). So the binding owner is the legacy source; `docs/platform/component-boundary.md` is the enter-here portal. Edits under `docs/architect` need a reviewed exception (`docs/platform/migration-authoring-rules.md#2-legacy-roots-ratchet-and-exceptions`).
3. What contract it touches
   - Component boundary map and the rule that a state write or decision has one owning component (`docs/platform/component-boundary.md#3-update-rule`).
   - Work lifecycle: only Work verbs move lifecycle state, and Host/Surface "must not become lifecycle truth" (`docs/platform/component-boundary.md#5-high-level-component-authority-register`, rows Work Lifecycle Engine and Host And Surface Layer; the Contract Authority Matrix in `docs/platform/component-boundary.md#7-contract-authority-matrix` names "Work Integration Boundaries" and "Visibility And Herdr" as Work Lifecycle and Host/Surface owned).
   - The `awaiting-human` gate is a work-state entity (`docs/platform/system-overview/spec.md#shared-entities`; area owner per switchboard is legacy `docs/specs/work-state.md`, `docs/platform/documentation/switchboard.md#2-area-authority-routes`). The architecture map's Event vs Signal table is relevant to whether the notifier consumes events or signals (`docs/platform/architecture-map.md#event-signal-bảng-luật`; carried text, not binding).
   - The area registry lists no notification area, so a new area name would be an open item (`docs/platform/README.md#3-decision-surface`, "Open: Final area list and naming").
4. How much risk
   - Medium. Adds a cross-area dependency and a new outbound egress surface, but the register says Host/Surface is a replaceable adapter layer. Higher if it needs its own state or decides when to notify (that would be a state-write authority change). The docs give no numeric rating; this is my judgement.
   - Documentation risk: candidate/legacy split. Writing the new component's prose in both `docs/platform/**` and `docs/architect/**` is forbidden (`docs/platform/migration-authoring-rules.md#1-core-principles`).
5. What proof means done
   - Either the boundary doc (or its current detailed source) is updated, or the change records `No component-boundary change` in the implementation alignment, verification note or PR note (`docs/platform/component-boundary.md#5-how-to-change`; `docs/platform/architecture-map.md#4-change-rule`).
   - The design gate questions: log or state, which component owns authority, which contract, what proves done, what learning remains (`docs/platform/platform-foundations.md#4-design-gate`).
   - Code-level proof (tests) is not defined in the files I was allowed to open; the Definition of done law is in the legacy law text (`docs/platform/platform-foundations.md#l5-definition-of-done-sáu-câu-hỏi`, carried text, candidate).
6. What learning gets left behind
   - A settled boundary goes into the owning component-boundary source (legacy source during migration) and the candidate anchor stays the entry; a deferred or simplified notifier slice must be recorded in the platform ledger so it is not mistaken for the final shape (`docs/platform/intent-preservation-ledger.md#4-platform-level-preserved-intents`, `docs/platform/governance.md#8-intent-preservation`).
   - Candidate impact is noted in migration tracking, not by dual-authoring (`docs/platform/migration-authoring-rules.md#1-core-principles`, rule 4).

## Scenario B: let the gateway host surface start an execution-core run directly, without first creating a work item

1. What to read first
   - `docs/platform/documentation/switchboard.md#2-area-authority-routes` rows "Runner / dispatch / merge lifecycle" (owner `docs/specs/runner.md`, legacy-current, with `docs/routing-handoff-contract.md` for agent-to-agent boundaries) and "Herdr gateway and web dashboard" (owner `docs/specs/herdr-web-dashboard.md`). I did not open those (out of scope).
   - `docs/platform/component-boundary.md#4-current-high-level-components`: rows "Execution Core", "fgos Gateway", "Host And Surface Layer", "Work Lifecycle Engine". The Execution Core row says it is the single run door for new work and "strictly forbids L3 Work lifecycle dependencies (`src/state/**`)". The Work Lifecycle row says it does not own stage or sequencing.
   - `docs/platform/system-overview/spec.md#cross-area-flows` for the work-state to runner flow (carried text; its owner remains `docs/specs/system-overview.md`, switchboard row "System overview", legacy-current).
2. What kind of work
   - A cross-area routing / authority change across Host And Surface, Execution Core and Work Lifecycle (`docs/platform/component-boundary.md#3-update-rule`: "ownership of a state write, decision, runtime authority, or contract", "boundary between ... host surface ..."). Not a documentation-only change.
   - Owners are split: the run door and dispatch are owned by the legacy runner spec; the gateway surface by the legacy dashboard spec; the whole-map entry is the candidate component-boundary portal. All binding claims stay in legacy sources until Phase 08 promotion (`docs/platform/documentation/switchboard.md#4-resolution-algorithm-for-readers-and-writers`, items 4 and 5).
   - Host invocation routing is a promoted area with its own portal `docs/platform/host-invocation-routing/README.md` (`docs/platform/documentation/switchboard.md#2-area-authority-routes`; I did not open it) and the README area registry (`docs/platform/README.md#2-area-registry`). A gateway/host entry-point change belongs there too.
3. What contract it touches
   - Cross-area flow and entity contract: the "work item" as the single unit of work (`docs/platform/system-overview/spec.md#shared-entities`; carried candidate text, legacy owner `docs/specs/system-overview.md`). Skipping item creation changes that flow and the audit/state trail.
   - Agent-to-agent handoff contract `docs/routing-handoff-contract.md` (named in the switchboard row for runner, `docs/platform/documentation/switchboard.md#2-area-authority-routes`).
   - The Execution Core / Work Lifecycle independence rule and the Host-surface "no lifecycle or evidence truth" rule (`docs/platform/component-boundary.md#4-current-high-level-components`; `docs/platform/component-boundary.md#5-high-level-component-authority-register`).
   - Law L10 "add through the door, not alongside the door" in the carried law text is likely relevant (`docs/platform/platform-foundations.md#l10-add-through-not-alongside-mở-rộng-qua-cửa-không-đắp-cạnh-cửa`); binding text is root `docs/platform-foundations.md` (`docs/platform/platform-foundations.md#2-authority`). I only read its heading, not its body.
4. How much risk
   - High. It crosses at least three components and weakens an existing intake rule (work first, then run). It may touch locked platform laws; locked laws are changed by superseding the decision id, not by editing in place, and their binding source is the legacy root doc (`docs/platform/platform-foundations.md#2-authority`; switchboard row "Platform laws", `docs/platform/documentation/switchboard.md#2-area-authority-routes`). The docs do not give a numeric rating; this is my judgement.
5. What proof means done
   - Update the owning area spec(s) in the legacy route (with a reviewed exception for edits under `docs/specs` / `docs/architect`: `docs/platform/migration-authoring-rules.md#2-legacy-roots-ratchet-and-exceptions`), and update `docs/platform/component-boundary.md` or the detailed source, or record `No component-boundary change` (`docs/platform/component-boundary.md#5-how-to-change`).
   - Pass the design gate (`docs/platform/platform-foundations.md#4-design-gate`). If a law-driven change affects ownership, also update component-boundary (`docs/platform/platform-foundations.md#5-component-boundary-link`).
   - Executable proof (tests, run evidence) is defined by the legacy runner spec, which I may not open.
6. What learning gets left behind
   - Settled decision in the legacy runner/dashboard spec decision history (the carried text refers to decisions living in the spec's own history sections: `docs/platform/system-overview/spec.md#lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4`) plus the component-boundary update note. If the intake rule is deferred or narrowed, a ledger row (`docs/platform/intent-preservation-ledger.md#4-platform-level-preserved-intents`; entries use `PF-I###`, `docs/platform/intent-preservation-ledger.md#3-required-entry-shape`).

## Scenario C: reorder the architecture roadmap (topology before coding domain), say the topology contract is implemented, and reword the vision's product-priority list

This is three claims with three different owners. Never dual-author, and one change must not edit all three at once (`docs/platform/migration-authoring-rules.md#1-core-principles`; `docs/platform/documentation/switchboard.md#1-operating-invariants`, invariants 1 and 4).

1. What to read first
   - `docs/platform/migration-authoring-rules.md#1-core-principles` and `#2-legacy-roots-ratchet-and-exceptions`, then `docs/platform/documentation/switchboard.md#4-resolution-algorithm-for-readers-and-writers`.
   - Roadmap: `docs/platform/system-architecture/architecture/roadmap.md#1-current-active-streams`, `#2-dependency-shape`, `#3-immediate-architecture-order`, `#10-roadmap-status`. The roadmap's own header says it is a candidate carriage and the current source is `docs/architect/roadmap.md`. The switchboard has no explicit row for the roadmap; the nearest route is the "Whole-system architecture and component boundaries" row, whose retained source is `docs/architect/component-boundary/**` and whose map owner is `docs/architecture-map.md` (`docs/platform/documentation/switchboard.md#2-area-authority-routes`). The roadmap header names `docs/architect/roadmap.md` as the source (`docs/platform/system-architecture/architecture/roadmap.md#architect-roadmap`).
   - Topology status: `docs/platform/system-architecture/architecture/workspace-topology.md#10-open-decision`, `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#hard-gates-before-distribution-activation-planning`, `docs/platform/system-architecture/architecture/workspace-topology-audit.md#audit-conclusion`.
   - Vision: `docs/platform/vision.md#3-product-priority`.
2. What kind of work
   - Three kinds in one: (a) sequencing change to a living planning doc; (b) an implementation-status claim; (c) a wording change to a platform-wide mission/priority statement.
   - (a) Owner is legacy `docs/architect/roadmap.md` (candidate carriage at `docs/platform/system-architecture/architecture/roadmap.md` is "Canonical for: Nothing until promotion"). Edit needs a ratchet exception (`docs/platform/migration-authoring-rules.md#2-legacy-roots-ratchet-and-exceptions`). The roadmap itself says new architecture writing stays under `docs/architect/` (`docs/platform/system-architecture/architecture/roadmap.md#9-spec-update-rule`).
   - (b) Owner of topology truth is the topology contract (legacy `docs/architect/workspace-topology.md`; candidate carriage under `docs/platform/system-architecture/architecture/`). Its carried text says "Architecture contract draft; pending decision on durable work-history placement" (`docs/platform/system-architecture/architecture/workspace-topology.md#10-open-decision`). Statuses in candidate files are provenance, not fresh review (their header notes).
   - (c) The switchboard says retained root docs own locked mission and priority wording; `docs/platform/vision.md` is a candidate entry (`docs/platform/documentation/switchboard.md#2-area-authority-routes`, row "Platform vision and work lifecycle"). The priority list text is also tracked in the project's root instructions (not opened). Vision is a candidate, "Canonical: No" (`docs/platform/vision.md#platform-vision`).
3. What contract it touches
   - Roadmap sequencing is explicitly not a contract or backlog; it preserves order and dependencies (`docs/platform/system-architecture/architecture/roadmap.md#2-dependency-shape`). But the order encodes stabilization assumptions: topology is placed before Step 10 mutating adoption but after Step 10 read-only adoption (`docs/platform/system-architecture/architecture/roadmap.md#3-immediate-architecture-order`, item 4 to 6), and Packaging must not decide placement (same anchor, item 7). Moving topology before the whole coding-domain stream contradicts the carried "Step 10 A0 and read-only adoption first" order, so it needs a stated reason.
   - Topology contract: hard gates before distribution activation planning (`docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#hard-gates-before-distribution-activation-planning`) and slices T0 to T6 (`#t0-document-contract-lock`, `#t6-projection-ledger`). The roadmap status table says "Contract draft ... durable history placement remains the named lock blocker" (`docs/platform/system-architecture/architecture/roadmap.md#10-roadmap-status`).
   - Vision priority list: tied to platform laws and decision ids in root `docs/platform-foundations.md`; a locked law changes only by superseding its decision id (`docs/platform/platform-foundations.md#2-authority`). The platform ledger PF-I001 preserves the mission "not only dogfooding" (`docs/platform/intent-preservation-ledger.md#4-platform-level-preserved-intents`).
4. How much risk
   - Roadmap reorder: low to medium (documentation sequencing; ratchet exception needed).
   - "Topology is implemented": high as a truth claim. The sources I read call the contract a draft with an open decision and a T0-T6 migration sequence; the audit is an evidence snapshot of gaps, not proof of implementation (`docs/platform/system-architecture/architecture/workspace-topology-audit.md#audit-conclusion`). Writing "implemented" without evidence also breaks the status honesty rule that candidate text is not proof of implemented behavior (headers of the candidate files; `docs/platform/documentation/switchboard.md#4-resolution-algorithm-for-readers-and-writers`, item 5).
   - Vision reword: high if it changes meaning (user-decision territory; mission/priority order is locked wording and "Lower priorities do not override higher priorities", `docs/platform/vision.md#3-product-priority`). A pure wording clarification is lower risk but is still routed to the retained root owner, not to the candidate.
5. What proof means done
   - For the status claim: evidence (implementation, tests, decision evidence) must be linked; ledger statuses require "Proof / evidence" and `implemented` means "implemented and has evidence" (`docs/platform/intent-preservation-ledger.md#2-status-vocabulary`; `#3-required-entry-shape`).
   - For the roadmap: update roadmap status table consistently (`docs/platform/system-architecture/architecture/roadmap.md#10-roadmap-status`) and keep the component-boundary check or record `No component-boundary change` (`docs/platform/component-boundary.md#5-how-to-change`).
   - For the exception: the exception ledger entry fields and expected digest (`docs/platform/migration-authoring-rules.md#2-legacy-roots-ratchet-and-exceptions`). The repo's automated check is the ratchet script named there (I did not run it).
   - For the vision: the user's explicit decision if it reverses a locked priority; the doc says a human decision and rationale are required to supersede a preserved intent (`docs/platform/governance.md#8-intent-preservation`).
6. What learning gets left behind
   - Candidate impact recorded in migration tracking, not mirrored prose (`docs/platform/migration-authoring-rules.md#1-core-principles`, rule 4).
   - If the topology reorder narrows or defers anything, add or update a ledger row with revisit trigger (`docs/platform/intent-preservation-ledger.md#4-platform-level-preserved-intents`; `docs/platform/governance.md#8-intent-preservation`).
   - Recommendation: split into three separately owned changes. Do not state "implemented" until evidence exists.

## Files opened, in order

1. docs/platform/README.md
2. docs/platform/documentation/switchboard.md
3. docs/platform/architecture-map.md
4. docs/platform/component-boundary.md
5. docs/platform/system-overview/spec.md
6. docs/platform/system-architecture/architecture/architecture-intent.md
7. docs/platform/system-architecture/architecture/roadmap.md
8. docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md
9. docs/platform/system-architecture/architecture/workspace-topology.md
10. docs/platform/system-architecture/architecture/workspace-topology-audit.md
11. docs/platform/system-architecture/architecture/workspace-topology-roadmap.md
12. docs/platform/system-architecture/history/architect-readme.md
13. docs/platform/vision.md
14. docs/platform/platform-foundations.md
15. docs/platform/governance.md
16. docs/platform/intent-preservation-ledger.md
17. docs/platform/migration-authoring-rules.md

Several files (architecture-intent, system-vision, topology audit, topology roadmap, architect-readme, system-overview) were only skimmed (header block, first sections, heading list). The listed anchors came from `node scripts/list-doc-anchors.mjs` output. I did not open any file outside the list.

## Files opened before finding the owning document

- Scenario A: 3 files opened before the document I treat as the entry owner (`docs/platform/component-boundary.md`, the 4th file): README, switchboard, architecture-map. Caveat: the binding owner is legacy (`docs/architect/component-boundary/**`, `docs/architecture-map.md`), named by the switchboard (2nd file), so the pointer to the binding owner was known after 1 file (README), confirmed at file 2.
- Scenario B: 1 file before the switchboard (README); the owner `docs/specs/runner.md` is named in the switchboard row (file 2) and not opened. Inside scope, the portal `docs/platform/component-boundary.md` was the 4th file (3 before).
- Scenario C: roadmap owner (`docs/architect/roadmap.md`, named only in the candidate roadmap header, 7th file) found after 6 files; the switchboard does not route the roadmap. Vision owner (retained root docs) found at file 2 (1 before). Topology contract owner (legacy `docs/architect/workspace-topology.md`) named in the 9th file, 8 before.

Status: DONE_WITH_CONCERNS
Summary: Answered all six questions for scenarios A, B and C with anchors taken from the anchor-listing tool; the output file is written. Binding owners are legacy documents I was not allowed to open, so proof details (tests, exact contract text) are only pointed to, not read.
Concerns/Blockers: The switchboard has no row for the architecture roadmap or workspace topology, so for Scenario C the owner was inferred from candidate file headers. Several carried files were only skimmed, and risk levels are my judgement, not stated by the docs.
