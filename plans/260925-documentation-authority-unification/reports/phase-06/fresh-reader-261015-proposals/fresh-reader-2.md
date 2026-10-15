# Fresh reader answers: proposals and redesigns batch

Paths are relative to the worktree root. Anchors are taken from `node scripts/list-doc-anchors.mjs`.

## Scenario A: implement the open coordination worker private-home and relay boundary

1. What to read first?
   - Start at the portal `docs/platform/README.md#3-decision-surface`. Its table shows that migration order is only Proposed and that area routing is still in progress, and `docs/platform/README.md#2-area-registry` points coordination to `agent-coordination/README.md` (not in my scope, not opened).
   - Then `docs/platform/documentation/switchboard.md#2-area-authority-routes`: the Agent coordination row is `promoted`, and says exact accepted contracts, schemas, ADRs and verification stay in `docs/architect/agent-coordination/**` until explicitly superseded. Step 4 of `docs/platform/documentation/switchboard.md#4-resolution-algorithm-for-readers-and-writers` says follow the promoted portal and its current-source mapping.
   - Then the proposal itself: `docs/platform/proposals/coordination-worker-provider-boundary.md#decision-proposed`. It says the boundary is subordinate to the existing Dispatch and Execution control plane and adds no parallel runtime. Its own `Related:` header lists the capability envelope, probe contract, progress note, capability audit and dispatch control plane (outside my scope). The envelope proposal is `docs/platform/proposals/coordination-capability-envelope.md#reading-context-and-authority`.
   - The collection index is `docs/platform/proposals/README.md#active-proposals`. It does not list this file (the active list is a historical snapshot).

2. What kind of work is this?
   - Implementing a design that is a proposal, not an accepted design. The file is `Document type: Proposal`, `Design status: Candidate`, `Canonical: No`, `Canonical for: Nothing; non-canonical candidate conservation carrier` (`docs/platform/proposals/coordination-worker-provider-boundary.md#coordination-envelope-worker-provider-and-control-boundary`). Its carried source header says `Design status: Discussion`, `Implementation: Not started; supporting OS-only probes exist`, `Canonical for: nothing until accepted`.
   - A proposal is a "Non-canonical candidate: a design option before acceptance" (`docs/platform/governance.md#3-document-types`) and may not establish current behavior, binding rules or settled decisions (`docs/platform/governance.md#4-authority-matrix`; the closest row is the discussion scratchpad row, since the matrix has no proposal row).
   - It is design/implementation work that must first become accepted and promoted (`docs/platform/documentation/architecture/documentation-system-design.md#11-promotion-workflow`).

3. What contract does it touch?
   - Binding on the maintainer in these files: nothing in the proposal itself. The candidate metadata says "Do not use this for: Current authority, implementation proof or cutover approval" (`docs/platform/proposals/coordination-worker-provider-boundary.md#coordination-envelope-worker-provider-and-control-boundary`).
   - What the proposal says it would touch (as design intent only): the Dispatch and Execution control plane, the transport adapter environment handling, the assignment runner outbox, and the credential and inference relay boundary (`docs/platform/proposals/coordination-worker-provider-boundary.md#new-evidence-since-the-first-capability-audit`, `#provider-transport-alternatives`, `#minimum-public-action-gaps-and-ownership`). It names its own seams as "not permission to edit listed modules".
   - The binding contracts are owned elsewhere: the switchboard routes agent coordination to `docs/architect/agent-coordination/**` and runner coordination to `docs/specs/runner.md` (`docs/platform/documentation/switchboard.md#2-area-authority-routes`). I did not open those; the proposal's own `Related:` list also points outside scope.
   - Editing legacy roots needs a reviewed exception (`docs/platform/migration-authoring-rules.md#2-legacy-roots-ratchet-and-exceptions`), and never dual-author prose (`docs/platform/migration-authoring-rules.md#1-core-principles`).
   - Component-boundary check: moving ownership of runtime authority or state writes requires updating or noting `docs/platform/component-boundary.md` (`docs/platform/governance.md#11-linking-discipline`).

4. How much risk?
   - High. The proposal says implementation is not started, full provider execution is "unready", acceptance of the sketch and a shared implementation lease are separate from authorization to investigate, and a later implementation must follow distribution/setup/doctor and impact-analysis requirements (`docs/platform/proposals/coordination-worker-provider-boundary.md#readiness-and-next-experiments`).
   - It touches credentials, process isolation and the control plane, and it states that "no claim about current provider proxy compatibility has been verified" (`#provider-transport-alternatives`).
   - Candidate material does not outrank the switchboard map; readers must surface conflicts rather than infer authority from path or date (`docs/platform/governance.md#13-migration-rule`).

5. What proof means done?
   - The proposal sets no acceptance proof of its own; it lists next experiments (a synthetic broker without provider credentials, then a frozen adapter candidate tested for startup and useful tool execution) and says OS-only mount passes do not prove provider usability (`docs/platform/proposals/coordination-worker-provider-boundary.md#readiness-and-next-experiments`). Those are labeled prototype-only.
   - Documentation proof of "accepted" would be promotion into the owning canonical doc with evidence, owner and review status (`docs/platform/documentation/architecture/documentation-system-design.md#11-promotion-workflow`), plus an implementation-alignment table for design that can run ahead of implementation (`docs/platform/governance.md#5-metadata`).
   - Done-ness for code (tests etc.) is defined outside the files I may read; I cannot cite it.

6. What learning gets left behind?
   - Settled design goes to the owning canonical doc (spec, architecture, contract, decision, verification) and the proposal becomes history (`docs/platform/governance.md#7-discussion-scratchpad-workflow`; `docs/platform/documentation/architecture/documentation-system-design.md#11-promotion-workflow`).
   - If implemented in a smaller slice than the full vision, record deferred intent in the area's intent-preservation ledger (`docs/platform/governance.md#8-intent-preservation`).
   - Record candidate impact in the migration ledger or phase notes when an active legacy doc is edited (`docs/platform/migration-authoring-rules.md#1-core-principles`).
   - What a proposal establishes: only an option and open questions. What it does not: current behavior, binding rules, accepted decisions, implementation proof (`docs/platform/governance.md#4-authority-matrix`).

## Scenario B: a design review cites the group-thinking plan-loop file as the current design

1. What to read first?
   - The cited file's own header: `docs/platform/system-architecture/history/proposals-redesigns/group-thinking-plan-loop.md#group-thinking-plan-loop-design-proposal`. It is `Document type: History`, `Canonical: No`, "Do not use this for: Current authority, implementation proof or cutover approval". The added note says "Historical snapshot... Archive that retired mechanism... Current plan-loop skills do not revive the retired session engine. Not started is stale".
   - Then the router: `docs/platform/documentation/switchboard.md#1-operating-invariants` (no guessing authority by path, date or bare metadata) and `docs/platform/documentation/switchboard.md#4-resolution-algorithm-for-readers-and-writers`. The Skills and domainization row in `docs/platform/documentation/switchboard.md#2-area-authority-routes` is the nearest route for the current skills (domain AGENTS.md, `core/skills/**`); I did not open those.
   - `docs/platform/governance.md#3-document-types` shows History is "Archive/evidence".

2. What kind of work is this?
   - A review-and-routing question, not an implementation task. The document type is History / retired proposal, so it cannot be a build target (`docs/platform/governance.md#4-authority-matrix`: History "must not establish current authority").
   - Its internal text says the design is "accepted, revised" (Option C in `docs/platform/system-architecture/history/proposals-redesigns/group-thinking-plan-loop.md#2-options-considered-and-why-two-were-rejected`), but the carried source metadata says `Design status: Discussion`, `Implementation: Not started`, "not yet an accepted contract". The candidate wrapper says "Not started is stale". The in-body status is provenance, not authority (`docs/platform/governance.md#1-principles`: agent authorship is provenance, not authority; authority comes from type, status, owner, evidence and approval).

3. What contract does it touch?
   - It describes a mechanism built on the CoordinationSession substrate (chained cell sessions, a plan-status query; see `#3-accepted-design` in the same file), which the wrapper says is retired. It is not a contract. The accepted contracts, if any, are owned by `docs/architect/agent-coordination/**` per `docs/platform/documentation/switchboard.md#2-area-authority-routes`; the proposal's `Related:` points to the CoordinationSession contract there (not opened).
   - Related proposals show the same pattern: `docs/platform/proposals/coordination-capability-envelope.md#reading-context-and-authority` says "not an accepted decision, implementation plan, or permission to change existing contracts" and cites this plan-loop proposal as an input.

4. How much risk?
   - High if the team builds to it: building to a retired, stale-status snapshot would revive a mechanism that the wrapper says current skills do not revive. The wrapper also says the metadata is "provenance, not candidate authority" (`docs/platform/system-architecture/history/proposals-redesigns/group-thinking-plan-loop.md#group-thinking-plan-loop-design-proposal`).
   - Authority conflicts are a documentation defect to surface, not for an agent or reviewer to resolve silently (`docs/platform/governance.md#4-authority-matrix`).

5. What proof means done?
   - Done for this review means the status claim is corrected, not that anything is built: show that the file is History, Canonical: No, and not-started is stale (`docs/platform/system-architecture/history/proposals-redesigns/group-thinking-plan-loop.md#group-thinking-plan-loop-design-proposal`), and cite the owner route in `docs/platform/documentation/switchboard.md#4-resolution-algorithm-for-readers-and-writers`.
   - If someone wants it revived, it would have to be re-proposed, accepted and promoted with evidence, owner and review status (`docs/platform/documentation/architecture/documentation-system-design.md#11-promotion-workflow`).
   - Cannot determine in scope which document currently owns the plan-loop design; the wrapper only says "current plan-loop skills" exist and does not name a path.

6. What learning gets left behind?
   - Reviewers should record the corrected status in the review note and, if wanted, ask the navigation owner to add a pointer from the history file to the current owner. This batch's own header says conservation review is pending (`Last reviewed: Pending independent review`).
   - Governance principle: one claim, one owner; do not fork authority (`docs/platform/governance.md#1-principles`). History keeps retired intent as evidence, not as a build spec (`docs/platform/governance.md#3-document-types`).

## Scenario C: add a new cross-area proposal and make it findable with a visible status

1. What to read first?
   - `docs/platform/README.md#4-how-to-change-platform-docs` (read governance, then migration-authoring-rules and the switchboard, then this portal and the area portal).
   - `docs/platform/governance.md#2-placement-map` for placement, `docs/platform/governance.md#3-document-types` and `docs/platform/governance.md#5-metadata` for type and header, then `docs/platform/migration-authoring-rules.md#3-authoring-new-platform-documentation`.
   - `docs/platform/proposals/README.md#architect-level-proposals` for the cross-area collection index (a candidate snapshot, so I would treat its list as historical).

2. What kind of work is this?
   - Documentation authoring of a Proposal: a "Non-canonical candidate" (`docs/platform/governance.md#3-document-types`). It should stay a discussion or proposal until it is promoted (`docs/platform/governance.md#7-discussion-scratchpad-workflow`).
   - Placement: the collection index says this folder holds proposals "whose scope crosses one architecture area" and area-specific proposals stay in the area's own `proposals/` folder (`docs/platform/proposals/README.md#architect-level-proposals`). Platform-wide docs live directly under `docs/platform/` and area docs under `docs/platform/<area>/` (`docs/platform/governance.md#2-placement-map`).
   - Required proposal shape: Problem, Proposed Change, Alternatives, Decision Requested, Impact Map, Unresolved Questions, Expiry/Promotion Outcome (`docs/platform/documentation/architecture/documentation-system-design.md#67-proposal`).

3. What contract does it touch?
   - The documentation contracts: metadata baseline (`docs/platform/governance.md#5-metadata`), linking discipline with body links, not just metadata (`docs/platform/governance.md#11-linking-discipline`), and the component-boundary check if ownership changes (same anchor).
   - The authority route: new candidate material must declare candidate status in its header (`Design status: Proposed` or `Candidate`) and not dual-author claims already owned by a legacy doc (`docs/platform/migration-authoring-rules.md#3-authoring-new-platform-documentation`, `docs/platform/migration-authoring-rules.md#1-core-principles`).
   - Legacy roots are frozen: no new maintained files under `docs/specs` or `docs/architect`; new maintained platform docs go under `docs/platform/**` (`docs/platform/migration-authoring-rules.md#2-legacy-roots-ratchet-and-exceptions`).

4. How much risk?
   - Low to moderate. Risk is authority drift: a proposal read as binding, or a second owner for a claim. The switchboard says candidate text is not binding until promotion and that readers must not infer authority from path, date or richer prose (`docs/platform/documentation/switchboard.md#1-operating-invariants`, `docs/platform/documentation/switchboard.md#4-resolution-algorithm-for-readers-and-writers`).
   - Also: the live portal's decision surface marks migration order as Proposed with phase authorization limits (`docs/platform/README.md#3-decision-surface`); registering a proposal does not change that.

5. What proof means done?
   - The header declares type, `Design status`, `Canonical for` and `Do not use this for` (`docs/platform/governance.md#5-metadata`); the body has the required proposal sections (`docs/platform/documentation/architecture/documentation-system-design.md#67-proposal`); related files are clickable links in the body (`docs/platform/governance.md#11-linking-discipline`).
   - It is discoverable: linked from the proposals index (`docs/platform/proposals/README.md#active-proposals`) and from each affected area portal, which should link active proposals (`docs/platform/governance.md#11-linking-discipline`). The portal's Decision Surface and Area Registry are where status shows for the documentation-system proposal today (`docs/platform/README.md#3-decision-surface`, `docs/platform/README.md#2-area-registry`).
   - A note on whether the component boundary changed, e.g. "No component-boundary change" (`docs/platform/governance.md#11-linking-discipline`).
   - I could not find in scope which exact index file a new cross-area proposal must be registered in; the proposals README is itself a candidate snapshot with a stale list ("navigation owner owes reviewed update"), so the exact registration target is unresolved here.

6. What learning gets left behind?
   - The proposal's "Expiry / Promotion Outcome" section records where settled content will go (spec, architecture, contract, decision, verification), and the proposal then remains history (`docs/platform/documentation/architecture/documentation-system-design.md#11-promotion-workflow`, `docs/platform/proposals/README.md#architect-level-proposals`).
   - If the design will be built in a smaller slice, add it to an intent-preservation ledger (`docs/platform/governance.md#8-intent-preservation`).
   - Record candidate impact in migration tracking (`docs/platform/migration-authoring-rules.md#1-core-principles`).

## Files opened, in order

1. `docs/platform/README.md`
2. `docs/platform/proposals/README.md`
3. `docs/platform/proposals/coordination-worker-provider-boundary.md`
4. `docs/platform/documentation/switchboard.md`
5. `docs/platform/governance.md` (lines 1-500)
6. `docs/platform/migration-authoring-rules.md`
7. `docs/platform/proposals/dispatch-control-plane-redesign.md` (first 60 lines)
8. `docs/platform/proposals/coordination-capability-envelope.md` (first 60 lines)
9. `docs/platform/system-architecture/history/proposals-redesigns/group-thinking-plan-loop.md` (first 60 lines)
10. `docs/platform/documentation/architecture/documentation-system-design.md` (lines 1-45, 395-413, 592-616)

I also ran `node scripts/list-doc-anchors.mjs` on files 1, 2, 3, 4, 5, 6, 7, 8, 9 and 10, and `wc -l` on files 3, 4, 5, 6 and 9.

## Files opened before finding the owner document

- Scenario A: 3 files opened (README, proposals/README, the proposal) before the switchboard, which I consider the owner of the authority route. The owner of the binding agent-coordination contracts (`docs/architect/agent-coordination/**`, `docs/platform/agent-coordination/README.md`) is out of scope and I never opened it.
- Scenario B: 8 files opened before I read the cited file itself (file 9). Its header and wrapper note are the owner of its own status. The owner of the current plan-loop design could not be identified in scope.
- Scenario C: 4 files opened before `docs/platform/governance.md` (file 5), which I consider the owner of placement, type and metadata rules (the portal in file 1 already routes to it).

Status: DONE_WITH_CONCERNS
Summary: Answered all six questions for scenarios A, B and C with anchors checked against the anchor tool. Only the owner of the current plan-loop design, the binding agent-coordination contracts, and the exact registration target for a new cross-area proposal could not be resolved inside the permitted files.
Concerns/Blockers: `docs/platform/proposals/README.md` is a candidate snapshot with a stale active list that omits the worker-provider-boundary proposal, so findability for scenario C is ambiguous. `docs/platform/README.md` does not link to `proposals/README.md` directly.
