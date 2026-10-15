# Fresh reader answers: whole-system architecture batch (ws-1)

All paths are from the repository root. Anchors are the ones printed by `node scripts/list-doc-anchors.mjs`. Almost every file in scope is a candidate. The switchboard says to enter at the candidate portal and take binding claims from the legacy owner (`docs/platform/documentation/switchboard.md#4-resolution-algorithm-for-readers-and-writers`). Those legacy owners (`docs/architecture-map.md`, `docs/specs/runner.md`, `docs/architect/roadmap.md`, `docs/work-item-lifecycle-vision.md`) are outside my reading scope, so I name them but have not read them.

## Scenario A: new notification service (pushes "item is waiting for a human" to chat)

1. What to read first?
   - Start at `docs/platform/README.md#4-how-to-change-platform-docs`. It sends me to governance and to the switchboard.
   - Then the switchboard row for "Whole-system architecture and component boundaries" (`docs/platform/documentation/switchboard.md#2-area-authority-routes`). It is marked `candidate`. The binding owner is `docs/architecture-map.md`. `docs/platform/component-boundary.md` is only the candidate entry. Detail sits in `docs/architect/component-boundary/**`.
   - Then `docs/platform/component-boundary.md#3-update-rule` and `docs/platform/component-boundary.md#4-current-high-level-components`.
   - Then the ritual for adding a component in `docs/platform/architecture-map.md#9-luật-vận-hành-bản-đồ`.
   - Then `docs/platform/architecture-map.md#slice-sắp-cắm-planned-mỗi-cái-phải-qua-nghi-thức-9-trỏ-pbi`. It lists an "attention hub" slice, status idea, contract CTR008.
   - Then `docs/platform/system-overview/spec.md#cross-area-flows`. Its last paragraph says the system-to-human attention channel is "not built yet" and the surface polls instead.

2. What kind of work is this?
   - It is whole-system boundary work: a new platform component (or a surface slice). Component-boundary says a change that creates a component must check the boundary map (`docs/platform/component-boundary.md#3-update-rule`, `docs/platform/governance.md#11-linking-discipline`).
   - The map also decides module versus slice. "A component truly needing two homes means split it; a feature touching many homes is a slice" (`docs/platform/architecture-map.md#9-luật-vận-hành-bản-đồ`). A chat pusher is most likely a slice or adapter over the existing attention-hub idea, not a new engine. It belongs in the Host And Surface layer, which says it "translates ... chat ... interactions into calls against the engines, without becoming lifecycle or evidence truth" (`docs/platform/component-boundary.md#5-high-level-component-authority-register`).
   - Because the shape is not settled, it needs a design discussion first (`docs/platform/README.md#4-how-to-change-platform-docs`).

3. What contract does it touch?
   - CTR008, the attention envelope between system and attention hub. Status "idea", with `gate-opened`, `question-raised` and `blocked` kinds (`docs/platform/architecture-map.md#7-sổ-đăng-ký-contract`).
   - CTR004, the human gate: ask/answer and `awaiting-human`. It is the event the notification reports (`docs/platform/architecture-map.md#7-sổ-đăng-ký-contract`, `docs/platform/system-overview/spec.md#shared-entities`).
   - Possibly CTR007 (signal) and CTR001 (CLI envelope), depending on how it listens.
   - The notification service must not own the work-state write. State-write ownership sits with the Work Lifecycle Engine (`docs/platform/component-boundary.md#4-current-high-level-components`).
   - Caveat: the carried advisory says it is "architectural advisory only" with "Canonical for: nothing" and notes that its old Agent Coordination Engine was replaced (`docs/platform/component-boundary.md#1-purpose-1`). Do not use the older register rows naming Agent Coordination Engine as current.

4. How much risk?
   - Medium to high. Adding a component moves the whole-system boundary map. It adds a new non-deterministic outbound boundary, which requires a contract row (`docs/platform/architecture-map.md#7-sổ-đăng-ký-contract`).
   - The platform-foundations design gate asks "which component owns the authority" and "what proves done" (`docs/platform/platform-foundations.md#4-design-gate`).
   - Map rule 1 extends the definition of done, so it only takes effect through a decision record touching locked law L5 (`docs/platform/architecture-map.md#9-luật-vận-hành-bản-đồ`, `docs/platform/platform-foundations.md#l5-definition-of-done-sáu-câu-hỏi`).
   - Authority is split and every file here is a candidate (`docs/platform/documentation/switchboard.md#1-operating-invariants`, invariant 2).

5. What proof means done?
   - A row in the architecture map component or slice register (home, tag, contract, maturity) before any code (`docs/platform/architecture-map.md#9-luật-vận-hành-bản-đồ`).
   - A manifest row, so the architecture test stays green (same anchor, rule 3).
   - A contract row, either a CTR008 definition or a new versioned one (same anchor, plug-in ritual).
   - A board item (PBI) for any `planned` row (`docs/platform/architecture-map.md#12-chỗ-đứng-trong-hệ-tài-liệu`).
   - Either an updated component-boundary map or an explicit `No component-boundary change` note (`docs/platform/component-boundary.md#5-how-to-change`).
   - The six-question definition of done (`docs/platform/platform-foundations.md#l5-definition-of-done-sáu-câu-hỏi`).

6. What learning gets left behind?
   - A decision record and a map version bump (`docs/platform/architecture-map.md#9-luật-vận-hành-bản-đồ`, rule 5).
   - Update the owning area docs once, not in both legacy and candidate copies (`docs/platform/migration-authoring-rules.md#1-core-principles`).
   - If the first slice is simpler than the full chat or attention-hub vision, add an intent-ledger entry (`PF-I###`) with a must-not-preclude clause (`docs/platform/governance.md#8-intent-preservation`, `docs/platform/intent-preservation-ledger.md#3-required-entry-shape`).
   - The open item is the attention channel noted in `docs/platform/system-overview/spec.md#cross-area-flows`.

Owner I consider authoritative: `docs/architecture-map.md` for the full map, with `docs/platform/component-boundary.md` as its candidate entry (`docs/platform/documentation/switchboard.md#2-area-authority-routes`). Neither the map nor the component-boundary file is yet canonical; component-boundary says "Canonical: Yes, after review", the status line of a draft.

## Scenario B: gateway host surface starts an execution-core run directly, with no work item first

1. What to read first?
   - `docs/platform/documentation/switchboard.md#2-area-authority-routes`. It routes "Host invocation routing" to the promoted portal `docs/platform/host-invocation-routing/README.md` (promoted but outside my scope). It routes "Runner / dispatch / merge lifecycle" to `docs/specs/runner.md` and `docs/routing-handoff-contract.md`, both legacy-current. Follow the switchboard resolution algorithm: promoted means the portal, legacy-current means the named legacy file (`docs/platform/documentation/switchboard.md#4-resolution-algorithm-for-readers-and-writers`).
   - `docs/platform/component-boundary.md#4-current-high-level-components`. The Execution Core row says `fgos run` is the "single run door for new work" and that the core "strictly forbids" Work lifecycle dependencies. The fgos Gateway row says the gateway has REST and MCP `execute` on one process.
   - `docs/platform/system-overview/spec.md#cross-area-flows`. Every flow there starts at `fgos add` (a work item).
   - `docs/platform/platform-foundations.md#l10-add-through-not-alongside-mở-rộng-qua-cửa-không-đắp-cạnh-cửa`.

2. What kind of work is this?
   - Cross-area routing and contract work. It changes an entry path (host surface to engines) and which door starts runs. It may or may not be a component-boundary change.
   - It should be a design discussion first, then an update to the owning area specs (`docs/platform/README.md#4-how-to-change-platform-docs`).

3. What contract does it touch?
   - The CLI/API envelope, CTR001, and the verb manifest (`docs/platform/architecture-map.md#7-sổ-đăng-ký-contract`).
   - CTR003 (orchestrator to worker) and CTR009 (executor) on the dispatch side.
   - CTR002: a run with no work item skips the single write door, so that guarantee must be restated for this path.
   - CTR006 and `docs/routing-handoff-contract.md` for agent-to-agent handoff (named as owner in `docs/platform/documentation/switchboard.md#3-root-document-routes`).
   - Law L10: a new behavior extends the existing door and never opens a parallel path next to it. The gateway should call the same run door, not a second one (`docs/platform/platform-foundations.md#l10-add-through-not-alongside-mở-rộng-qua-cửa-không-đắp-cạnh-cửa`). L4 asks "who reads this output?" for each interface (`docs/platform/platform-foundations.md#l4-routing-model-theo-audience-của-từng-interface`).
   - Inconsistency to flag: the component-boundary table calls the gateway REST contract "CTR010", while the architecture-map register defines CTR010 as `confinement-authority.v1` (`docs/platform/component-boundary.md#4-current-high-level-components` against `docs/platform/architecture-map.md#7-sổ-đăng-ký-contract`). I cannot decide which is right from the in-scope files.

4. How much risk?
   - High. It alters the cross-area flow that all current descriptions treat as work-first, and it touches the host/surface authority line "without becoming lifecycle or evidence truth" (`docs/platform/component-boundary.md#5-high-level-component-authority-register`).
   - It also moves whether a run may exist with no state record, which brushes the durability and single-writer laws (`docs/platform/platform-foundations.md#l10-add-through-not-alongside-mở-rộng-qua-cửa-không-đắp-cạnh-cửa`).
   - Part of the picture is already implied: the Execution Core is described as independent of Work state, so the change may only wire a surface. That is a reading of a candidate source, not verified.

5. What proof means done?
   - Update the legacy-current owners once (`docs/specs/runner.md`, `docs/specs/system-overview.md`, the host-invocation portal's retained sources). Edits to legacy roots need a reviewed exception, and never write the same prose in a candidate doc (`docs/platform/migration-authoring-rules.md#2-legacy-roots-ratchet-and-exceptions`, `docs/platform/migration-authoring-rules.md#1-core-principles`).
   - Record either an updated boundary map or `No component-boundary change` (`docs/platform/component-boundary.md#3-update-rule`).
   - The map's register and manifest rows stay one-to-one with any new module (`docs/platform/architecture-map.md#9-luật-vận-hành-bản-đồ`).
   - The six-question done test (`docs/platform/platform-foundations.md#l5-definition-of-done-sáu-câu-hỏi`).

6. What learning gets left behind?
   - A decision record in the owning spec's decision history. If this changes a locked law, supersede its decision ID, do not edit in place (`docs/platform/platform-foundations.md#2-authority`).
   - A spec fact for the host-invocation area. If the simplified slice narrows the full routing vision, add a ledger entry (`docs/platform/governance.md#8-intent-preservation`).
   - Update the cross-area flow description once, at its owner.

Owner I consider authoritative: split. `docs/platform/host-invocation-routing/README.md` for host entry (promoted, named in the switchboard, outside my scope). `docs/specs/runner.md` for the run door, per `docs/platform/component-boundary.md#4-current-high-level-components`. `docs/platform/system-overview/spec.md` is only a candidate carriage of `docs/specs/system-overview.md`, which is the legacy-current cross-area owner (`docs/platform/documentation/switchboard.md#2-area-authority-routes`).

## Scenario C: reorder the architecture roadmap, say the topology contract is implemented, reword the vision's priority list, all in one change

This bundles three claims with three different owners. By the one-claim-one-owner rule it should be three changes (`docs/platform/migration-authoring-rules.md#1-core-principles`, `docs/platform/documentation/switchboard.md#1-operating-invariants`).

1. What to read first?
   - `docs/platform/documentation/switchboard.md#2-area-authority-routes` and `docs/platform/migration-authoring-rules.md#1-core-principles` for the owner of each claim.
   - Roadmap: `docs/platform/system-architecture/architecture/roadmap.md#2-dependency-shape`, `#3-immediate-architecture-order`, `#1-current-active-streams`, `#10-roadmap-status`. Its header says it is a candidate carriage and the "current source remains docs/architect/roadmap.md".
   - Topology: `docs/platform/system-architecture/architecture/workspace-topology.md#10-open-decision`, `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#hard-gates-before-distribution-activation-planning` and `#t0-document-contract-lock`, and `docs/platform/system-architecture/architecture/workspace-topology-audit.md#summary` (I only read its head).
   - Vision: `docs/platform/vision.md#3-product-priority` and the switchboard row "Platform vision and work lifecycle".

2. What kind of work is this?
   - Three kinds mixed. (a) A sequencing edit to a living planning document (roadmap). (b) A status or implementation claim, which is spec or verification territory, not architecture. Governance says an architecture doc "must not establish detailed present behavior as timeless truth" and that implementation status needs an alignment table with evidence (`docs/platform/governance.md#4-authority-matrix`, `docs/platform/governance.md#5-metadata`). (c) A direction/priority wording change to the vision.
   - Also a migration-time edit: the legacy owner is frozen for unreviewed edits (`docs/platform/migration-authoring-rules.md#2-legacy-roots-ratchet-and-exceptions`).

3. What contract does it touch?
   - (a) The roadmap's own sequencing: topology is already a prerequisite of mutating Step 10 and activation (`docs/platform/system-architecture/architecture/roadmap.md#2-dependency-shape`). The roadmap states it is not a strict sequence. Putting topology before the coding-domain stream is mostly consistent with `docs/platform/system-architecture/architecture/roadmap.md#1-current-active-streams`, where Coding Domain depends on the topology contract for workspace mutation.
   - (b) The topology contract is "Architecture contract draft; pending decision on durable work-history placement", with a named lock blocker (`docs/platform/system-architecture/architecture/workspace-topology.md#10-open-decision`; `docs/platform/system-architecture/architecture/roadmap.md#10-roadmap-status` says "Contract draft ... durable history placement remains the named lock blocker"). Nothing I read shows it implemented. The audit lists gaps, and the roadmap lists migration slices T0 to T6.
   - (c) Product priority order. The vision says "Lower priorities do not override higher" (`docs/platform/vision.md#3-product-priority`). Locked mission and priority wording is owned by retained root docs (`docs/platform-foundations.md`, `docs/work-item-lifecycle-vision.md`), and the vision is candidate with "Canonical: No" (`docs/platform/documentation/switchboard.md#2-area-authority-routes`, `docs/platform/vision.md#1-purpose`). Preserved platform intent PF-I001 ties it to a user decision (`docs/platform/intent-preservation-ledger.md#4-platform-level-preserved-intents`).

4. How much risk?
   - (a) Low to medium. It is a living plan, but ordering edits propagate to what readers think blocks what. It also affects `docs/platform/system-architecture/architecture/roadmap.md#9-spec-update-rule`, which says new architecture writing stays under `docs/architect/`.
   - (b) High for honesty: stating "implemented" without evidence makes the doc claim more than the proof supports, and contradicts the blocker recorded in the same corpus. I cannot confirm real implementation from the files I am allowed to read; it would need the code or tests.
   - (c) High. It is a user decision. Silently rewording it can alter meaning. Per the platform law text, changing a locked item means superseding its decision ID (`docs/platform/platform-foundations.md#2-authority`). Present the original decision, concern, trade-off and options to the user before touching it.
   - Bundling them hides which claim fails review.

5. What proof means done?
   - (a) One edit at the roadmap's owner (`docs/architect/roadmap.md`) with a reviewed ratchet exception, and no duplicate prose in the candidate carriage (`docs/platform/migration-authoring-rules.md#2-legacy-roots-ratchet-and-exceptions`).
   - (b) An implementation-alignment row with code/test evidence, or the claim does not go in (`docs/platform/governance.md#5-metadata`). If the real blocker is still open, the correct statement is the existing "draft; pending decision" (`docs/platform/system-architecture/architecture/workspace-topology.md#10-open-decision`).
   - (c) An explicit user decision on the wording, applied at the retained root owner (`docs/platform/documentation/switchboard.md#2-area-authority-routes`).
   - Check the boundary map and record `No component-boundary change` if it holds (`docs/platform/component-boundary.md#3-update-rule`).

6. What learning gets left behind?
   - A decision record for any ordering change that reflects a new dependency finding (feed it back to the earlier stream, as the roadmap's dependency section says).
   - For the vision: a decision superseding the old priority text, plus a ledger update if the wording narrows intent (`docs/platform/governance.md#8-intent-preservation`).
   - Record candidate impact in migration tracking (`docs/platform/migration-authoring-rules.md#1-core-principles`, item 4).

Owner I consider authoritative: three owners. Roadmap and topology: the legacy `docs/architect/roadmap.md` and `docs/architect/workspace-topology*.md` (the carriage headers say "current source remains"). No dedicated switchboard row names them, so the owner comes from their Provenance and Canonical-for fields, not from the switchboard. Vision priority: `docs/platform-foundations.md` and `docs/work-item-lifecycle-vision.md`, with `docs/platform/vision.md` as candidate entry.

## Files opened, in order

1. `docs/platform/README.md`
2. `docs/platform/documentation/switchboard.md`
3. `docs/platform/component-boundary.md`
4. `docs/platform/architecture-map.md`
5. `docs/platform/system-overview/spec.md`
6. `docs/platform/system-architecture/architecture/architecture-intent.md` (header and anchor list only)
7. `docs/platform/system-architecture/architecture/roadmap.md`
8. `docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md`
9. `docs/platform/system-architecture/architecture/workspace-topology.md`
10. `docs/platform/system-architecture/architecture/workspace-topology-audit.md` (head only)
11. `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md` (head and gates)
12. `docs/platform/system-architecture/history/architect-readme.md`
13. `docs/platform/vision.md`
14. `docs/platform/platform-foundations.md`
15. `docs/platform/governance.md`
16. `docs/platform/intent-preservation-ledger.md`
17. `docs/platform/migration-authoring-rules.md`

I also ran `node scripts/list-doc-anchors.mjs` on each file above. No other path was opened.

## Files opened before I found the owning document

- Scenario A: 2 files before I knew the binding owner (README, then the switchboard row pointing to `docs/architecture-map.md`). 3 files before I opened the candidate entry that carries the update rule (`component-boundary.md`). 4 files before I read the plug-in ritual (`architecture-map.md`).
- Scenario B: 2 files before the switchboard named the owners (`host-invocation-routing` portal and `docs/specs/runner.md`). 3 files before `component-boundary.md` confirmed the run door and gateway rows. The owners themselves were not readable under the brief.
- Scenario C: 2 files before the switchboard gave the vision owner. 6 files opened before the roadmap carriage (7th), whose Provenance names its owner. 8 files before the topology carriage (9th). The roadmap and topology owners have no switchboard row, which cost extra reading.

Status: DONE_WITH_CONCERNS
Summary: Answered all six questions for scenarios A, B and C using only the 17 in-scope files, with anchors taken from the script output; the binding owners are legacy documents I could not open.
Concerns/Blockers: (1) The component-boundary file labels the gateway REST contract CTR010, while the architecture map gives CTR010 to confinement-authority. (2) The roadmap and workspace-topology carriages have no switchboard row, so ownership comes only from their own headers. (3) Whether the topology contract is implemented cannot be verified from in-scope files; the docs say it is a draft with an open blocker.
