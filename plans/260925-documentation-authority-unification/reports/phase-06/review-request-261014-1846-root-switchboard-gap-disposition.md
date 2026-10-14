# Bounded disposition request: historical switchboard gap

Author session: codex-session:21@2026-10-14
Content commit: 55ec1e0c40410b70b1e4024232a233d4e3d96b3d
Review mode: ordinary
State: ready-for-review

Review exactly one pending registryGap in ledger/decisions/s5-root-switchboard-gap-successor.json: `claim_334a8ede523cc86a70852c42b9db587c`. The committed Lead review at 729bea758 approved only that the gap was pre-existing, not its disposition. Propose supersede by the explicitly changed same-subject current area-routes table, carried whole to the mapped candidate switchboard. Original source is pinned to `08a0fd2d2ed988db996980332054a9b4559eab18`; edit of record `f5a1a2ddaca29e82ac6f6c3362114b51233c64a7`. Old digest 560b636f and current digest 130d0132 are recomputed below from actual units, not inferred identities. Full old/current shown text and diff preserve all existing area-authority facts while accounting for the explicit added routes.

```json
{
  "claimId": "claim_334a8ede523cc86a70852c42b9db587c",
  "sourcePath": "docs/transitional-switchboard.md",
  "sourceAnchor": "unheaded-block-4",
  "sourceUnitDigest": "560b636f8fe9010bd9e2dc1036ebf2532111e0925f9c452c19d32dea42b7bff8",
  "disposition": "supersede",
  "targetOwner": "docs/platform/documentation/switchboard.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "130d01325ca439a9c92832cb477fc845a32ef7d393c7b2d584dcf348ff298902",
  "authoredBy": "codex-session:21@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "Historical switchboard area-routes table at 08a0fd2d2ed988db996980332054a9b4559eab18 is superseded by the explicit f5a1a2dda route-table change and its whole same-subject current candidate table. Old/current full text and diff show additive candidate topology routes with existing area/authority facts retained. Current source row claim_3a0662d27a8829517966d15cf279af44 independently carries the current source table to this exact target (review 729bea758); that approval does not approve this predecessor. No identity graft, gap waiver or authority promotion."
}
```

Complete historical source/predecessor: `docs/transitional-switchboard.md#unheaded-block-4`
Native unit SHA256: `560b636f8fe9010bd9e2dc1036ebf2532111e0925f9c452c19d32dea42b7bff8`
Shown text SHA256: `560b636f8fe9010bd9e2dc1036ebf2532111e0925f9c452c19d32dea42b7bff8`

```text
| Area / surface | authorityStatus | fileClass | Current Route / Canonical Owner | Retained / Subordinate Sources | Role / Scope Summary |
|---|---|---|---|---|---|
| Platform laws | candidate | maintained-authority + retained-source + generated | `docs/platform-foundations.md` (authoritative text); enter at `docs/platform/platform-foundations.md` (candidate entry/summary) | `docs/specs/platform-foundations.md` (non-authority spec projection; binding source: `docs/platform-foundations.md`) | Complete binding wording, rationale, sources, and review thresholds are owned exclusively by `docs/platform-foundations.md`; generated projections never establish authority. |
| Platform vision and work lifecycle | candidate | maintained-authority + retained-source | `docs/work-item-lifecycle-vision.md` and `docs/platform-foundations.md` (retained sources/locked wording); enter at `docs/platform/vision.md` (candidate entry/navigation) | `docs/work-item-lifecycle-vision.md` | Target vision is candidate ("Yes, after review"); retained root docs own locked mission/priority wording. |
| Whole-system architecture and component boundaries | candidate | maintained-authority + retained-source | `docs/architecture-map.md` (full architecture map); enter at `docs/platform/component-boundary.md` (candidate boundary portal) | `docs/architect/component-boundary/**` | `docs/architecture-map.md` owns full architecture map; component-boundary entry routes to detailed sources under `docs/architect/component-boundary/`. |
| System overview | legacy-current | maintained-authority | `docs/specs/system-overview.md` | None | Live Area Map and Shared Entities sections remain the consolidated current cross-area spec. |
| Work state / work lifecycle engine | legacy-current | maintained-authority + retained-source | `docs/specs/work-state.md` | `docs/io-contract.md`, `docs/work-item-lifecycle-vision.md` | `docs/specs/work-state.md` owns core state, events, fsm, store, and envelope. `docs/io-contract.md` owns CLI I/O contract. |
| Runner / dispatch / merge lifecycle | legacy-current | maintained-authority | `docs/specs/runner.md` | `docs/routing-handoff-contract.md` | `docs/specs/runner.md` owns runner loop, dispatch, merge gate, and worker log. Agent-to-agent boundary owned by `docs/routing-handoff-contract.md`. |
| Packaging-distribution | promoted | maintained-authority + retained-source | `docs/platform/packaging-distribution/README.md` | `docs/specs/distribution.md`, `docs/distribution-vision.md`, `docs/architect/packaging-distribution/**` | Portal owns active navigation and implementation-alignment; legacy specs are consulted only in roles assigned by portal. |
| Host invocation routing | promoted | maintained-authority + retained-source | `docs/platform/host-invocation-routing/README.md` | `docs/architect/host-invocation-routing/**` | Portal owns active navigation; retained sources under `docs/architect/host-invocation-routing/**` remain legacy-current only where not drained. |
| Agent coordination | promoted | maintained-authority + history-evidence | `docs/platform/agent-coordination/README.md` | `docs/architect/agent-coordination/**`, `docs/specs/runner.md` | Target portal owns navigation and status summary; exact accepted contracts, schemas, ADRs, and verification remain in `docs/architect/agent-coordination/**` until explicitly superseded. |
| Agent confinement | legacy-current | maintained-authority | `docs/specs/confinement-authority.md` | `src/runner/dispatch/confinement/**` | Spec owns runtime confinement contract, machine backend registry, and driver rules; verified by test suite. |
| Claude plugin surface | legacy-current | maintained-authority | `docs/specs/fgos-plugin.md` | `plugins/fgOS/**` | Spec owns slash-command wrappers and plugin manifest behavior. |
| Herdr gateway and web dashboard | legacy-current | maintained-authority | `docs/specs/herdr-web-dashboard.md` | `docs/operator-runbook-herdr-cockpit.md`, `docs/specs/runner.md` | Spec owns web dashboard client behavior; runbook owns cockpit operations. |
| End-user authoring, index, and knowledge registry | non-authority | maintained-authority (user profile) + generated | `docs/specs/enduser-docs-authoring.md`, `docs/specs/enduser-docs-index.md` | `docs/doc-registry.{md,json}`, `docs/knowledge/**` | Distinct user/end-user knowledge corpus; does not own platform authority. |
| Decision citation drift | legacy-current | maintained-authority | `docs/specs/decision-citation-drift.md` | `scripts/check-decision-citation-drift.mjs` | Spec owns citation drift detection invariants and baseline ratchet rules. |
| Distillery / reference learning | legacy-current | maintained-authority | `docs/specs/distillery.md` | `.agents/skills/distill/SKILL.md` | Spec owns bounded reference-learning behavior; skill owns operational surface. |
| Observe (metrics and friction) | legacy-current | maintained-authority | `docs/specs/observe.md` | `packages/observe/rust/**` | Spec owns observation behavior (metrics and friction); the Rust package owns the implementation. |
| Skills and domainization | legacy-current | maintained-authority + generated | `domains/<domain>/AGENTS.md`, `docs/architect/domainization/README.md`, canonical skills (`.agents/skills/**`, `core/skills/**`) | `plugins/fgOS/skills/**` (generated mirrors) | `domains/<domain>/AGENTS.md` owns domain-specific doctrine; canonical skill definitions live in `.agents/skills/` and `core/skills/`; generated mirrors are projections. |
| UI specification | legacy-current | maintained-authority | `docs/ui-spec/00-overview.md` (entry for `docs/ui-spec/**`) | Relevant area spec | Visual and UI layout contracts; functional behavior owned by area specs. |
| Coexistence | legacy-current | maintained-authority | `docs/coexistence.md` | `src/install/coexist.mjs` | Living doctrine for running alongside foreign agent harnesses. |
| Documentation system | legacy-current | maintained-authority + retained-source | `docs/doc-governance.md` (governance); `docs/reading-map.md` (reader routing); this switchboard (authority routing) | `docs/platform/proposals/documentation-system-unification.md` (long-horizon proposal), `plans/260925-documentation-authority-unification/plan.md` (migration plan) | Governance and routing documents are active authority; proposal is non-canonical architecture; plan is active migration. |
```

Complete current candidate target: `docs/platform/documentation/switchboard.md#unheaded-block-4`
Native unit SHA256: `130d01325ca439a9c92832cb477fc845a32ef7d393c7b2d584dcf348ff298902`
Shown text SHA256: `130d01325ca439a9c92832cb477fc845a32ef7d393c7b2d584dcf348ff298902`

```text
| Area / surface | authorityStatus | fileClass | Current Route / Canonical Owner | Retained / Subordinate Sources | Role / Scope Summary |
|---|---|---|---|---|---|
| Platform laws | candidate | maintained-authority + retained-source + generated | `docs/platform-foundations.md` (authoritative text); enter at `docs/platform/platform-foundations.md` (candidate entry/summary) | `docs/specs/platform-foundations.md` (non-authority spec projection; binding source: `docs/platform-foundations.md`) | Complete binding wording, rationale, sources, and review thresholds are owned exclusively by `docs/platform-foundations.md`; generated projections never establish authority. |
| Platform vision and work lifecycle | candidate | maintained-authority + retained-source | `docs/work-item-lifecycle-vision.md` and `docs/platform-foundations.md` (retained sources/locked wording); enter at `docs/platform/vision.md` (candidate entry/navigation) | `docs/work-item-lifecycle-vision.md` | Target vision is candidate ("Yes, after review"); retained root docs own locked mission/priority wording. |
| Whole-system architecture and component boundaries | candidate | maintained-authority + retained-source | `docs/architecture-map.md` (full architecture map); enter at `docs/platform/component-boundary.md` (candidate boundary portal) | `docs/architect/component-boundary/**` | `docs/architecture-map.md` owns full architecture map; component-boundary entry routes to detailed sources under `docs/architect/component-boundary/`. |
| System overview | legacy-current | maintained-authority | `docs/specs/system-overview.md` | None | Live Area Map and Shared Entities sections remain the consolidated current cross-area spec. |
| Work state / work lifecycle engine | legacy-current | maintained-authority + retained-source | `docs/specs/work-state.md` | `docs/io-contract.md`, `docs/work-item-lifecycle-vision.md` | `docs/specs/work-state.md` owns core state, events, fsm, store, and envelope. `docs/io-contract.md` owns CLI I/O contract. Candidate route `docs/platform/work-state/**` (scope candidate-target): candidate target, not read by any reader; canonical route stays `docs/specs/work-state.md`. |
| Runner / dispatch / merge lifecycle | legacy-current | maintained-authority | `docs/specs/runner.md` | `docs/routing-handoff-contract.md` | `docs/specs/runner.md` owns runner loop, dispatch, merge gate, and worker log. Agent-to-agent boundary owned by `docs/routing-handoff-contract.md`. |
| Packaging-distribution | promoted | maintained-authority + retained-source | `docs/platform/packaging-distribution/README.md` | `docs/specs/distribution.md`, `docs/distribution-vision.md`, `docs/architect/packaging-distribution/**` | Portal owns active navigation and implementation-alignment; legacy specs are consulted only in roles assigned by portal. |
| Host invocation routing | promoted | maintained-authority + retained-source | `docs/platform/host-invocation-routing/README.md` | `docs/architect/host-invocation-routing/**` | Portal owns active navigation; retained sources under `docs/architect/host-invocation-routing/**` remain legacy-current only where not drained. |
| Agent coordination | promoted | maintained-authority + history-evidence | `docs/platform/agent-coordination/README.md` | `docs/architect/agent-coordination/**`, `docs/specs/runner.md` | Target portal owns navigation and status summary; exact accepted contracts, schemas, ADRs, and verification remain in `docs/architect/agent-coordination/**` until explicitly superseded. |
| Agent confinement | legacy-current | maintained-authority | `docs/specs/confinement-authority.md` | `src/runner/dispatch/confinement/**` | Spec owns runtime confinement contract, machine backend registry, and driver rules; verified by test suite. |
| Claude plugin surface | legacy-current | maintained-authority | `docs/specs/fgos-plugin.md` | `plugins/fgOS/**` | Spec owns slash-command wrappers and plugin manifest behavior. |
| Herdr gateway and web dashboard | legacy-current | maintained-authority | `docs/specs/herdr-web-dashboard.md` | `docs/operator-runbook-herdr-cockpit.md`, `docs/specs/runner.md` | Spec owns web dashboard client behavior; runbook owns cockpit operations. |
| End-user authoring, index, and knowledge registry | non-authority | maintained-authority (user profile) + generated | `docs/specs/enduser-docs-authoring.md`, `docs/specs/enduser-docs-index.md` | `docs/doc-registry.{md,json}`, `docs/knowledge/**` | Distinct user/end-user knowledge corpus; does not own platform authority. |
| Decision citation drift | legacy-current | maintained-authority | `docs/specs/decision-citation-drift.md` | `scripts/check-decision-citation-drift.mjs` | Spec owns citation drift detection invariants and baseline ratchet rules. |
| Distillery / reference learning | legacy-current | maintained-authority | `docs/specs/distillery.md` | `.agents/skills/distill/SKILL.md` | Spec owns bounded reference-learning behavior; skill owns operational surface. |
| Observe (metrics and friction) | legacy-current | maintained-authority | `docs/specs/observe.md` | `packages/observe/rust/**` | Spec owns observation behavior (metrics and friction); the Rust package owns the implementation. |
| Skills and domainization | legacy-current | maintained-authority + generated | `domains/<domain>/AGENTS.md`, `docs/architect/domainization/README.md`, canonical skills (`.agents/skills/**`, `core/skills/**`) | `plugins/fgOS/skills/**` (generated mirrors) | `domains/<domain>/AGENTS.md` owns domain-specific doctrine; canonical skill definitions live in `.agents/skills/` and `core/skills/`; generated mirrors are projections. |
| UI specification | legacy-current | maintained-authority | `docs/ui-spec/00-overview.md` (entry for `docs/ui-spec/**`) | Relevant area spec | Visual and UI layout contracts; functional behavior owned by area specs. |
| Coexistence | legacy-current | maintained-authority | `docs/coexistence.md` | `src/install/coexist.mjs` | Living doctrine for running alongside foreign agent harnesses. |
| Documentation system | legacy-current | maintained-authority + retained-source | `docs/doc-governance.md` (governance); `docs/reading-map.md` (reader routing); this switchboard (authority routing) | `docs/platform/proposals/documentation-system-unification.md` (long-horizon proposal), `plans/260925-documentation-authority-unification/plan.md` (migration plan) | Governance and routing documents are active authority; proposal is non-canonical architecture; plan is active migration. |
```

```diff
--- docs/transitional-switchboard.md
+++ docs/platform/documentation/switchboard.md
@@ -7 +7 @@
-| Work state / work lifecycle engine | legacy-current | maintained-authority + retained-source | `docs/specs/work-state.md` | `docs/io-contract.md`, `docs/work-item-lifecycle-vision.md` | `docs/specs/work-state.md` owns core state, events, fsm, store, and envelope. `docs/io-contract.md` owns CLI I/O contract. |
+| Work state / work lifecycle engine | legacy-current | maintained-authority + retained-source | `docs/specs/work-state.md` | `docs/io-contract.md`, `docs/work-item-lifecycle-vision.md` | `docs/specs/work-state.md` owns core state, events, fsm, store, and envelope. `docs/io-contract.md` owns CLI I/O contract. Candidate route `docs/platform/work-state/**` (scope candidate-target): candidate target, not read by any reader; canonical route stays `docs/specs/work-state.md`. |

```

A36 differing digest set: `claim_334a8ede523cc86a70852c42b9db587c` (full digests differ). Judgment; all one row is deep-read. Recompute both unit digests and current target anchor, compare full shard/request equality and the f5a1a2dda table diff. Current source claim_3a0662d27a8829517966d15cf279af44 was reviewed ok at 729bea758; it does not approve this predecessor. No identity graft, automatic approval, gap waiver or authority promotion. Source and consumers remain unchanged.

Write a committed ordinary table with Reviewer/Author session/Review mode headers and one Claim | Verdict | Note | Source digest | Target digest row, full 64-hex native digests. This gap stays pending before independent application; Step 5 remains open. Both-prior D/E/native proof is in root-authorities-turn21-verification.json. No truth, push, main write/merge, Step 6 or protected checker change.
