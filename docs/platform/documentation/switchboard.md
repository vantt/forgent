# Transitional Documentation Authority Switchboard

```txt
Document type: Switchboard doc
Audience: Maintainer, implementer, agent
Purpose: Define the stated scope and preserve its source provenance and limits
Design status: Accepted at atomic cutover
Implementation: Historical source retained; current truth not certified
Provenance: docs/transitional-switchboard.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3
Writer type: Agent draft writer
Canonical: Yes
Canonical for: The document scope stated above; source implementation limits remain explicit
Use this when: Reading the scope, contracts and implementation limits stated here
Do not use this for: Standalone implemented-behavior proof or claims outside the stated scope
Last reviewed: 2026-10-14
Related:
- docs/platform/documentation/switchboard.md#transitional-documentation-authority-switchboard
Supersedes: The mapped source location at atomic cutover
Superseded by: None
```

This document records the former transition and its accepted owner dispositions.
After cutover, start at `docs/reading-map.md`; this table is evidence, not a
second operative authority router. Source metadata remains historical provenance.

## 1. Operating Invariants

1. **One claim has one canonical owner.** Summary documents link; they do not fork authority.
2. **Current owners in the shipped tree.** Use `docs/reading-map.md` and exact promoted or retained owners. No generic legacy-current delegation remains; source lineage is evidence, never a live fallback.
3. **No guessing by file path, date, or bare metadata.**
   Readers and writers must not infer authority from a directory path, a newer git commit date,
   richer prose, or a bare `Canonical:` frontmatter string. Follow the explicit current route below.
4. **Never dual-author prose.**
   Do not write the same normative, behavioral, or architectural content in both legacy roots and
   retired source documents. Update the declared current owner once.
5. **No authority by record.** Source dispositions apply only with the independently accepted atomic cutover; this document does not authorize later work or certify implementation.

## 2. Area Authority Routes

| Area / surface | authorityStatus | fileClass | Current Route / Canonical Owner | Retained / Subordinate Sources | Role / Scope Summary |
|---|---|---|---|---|---|
| Platform laws | promoted | maintained-authority + generated | docs/platform/platform-foundations.md (complete binding law holder) | Generated summaries are non-authority | Full binding wording/rationale/sources/review thresholds remain exclusively in docs/platform/platform-foundations.md. |
| Platform vision and work lifecycle | promoted | maintained-authority | docs/platform/vision.md | None | Keep locked laws at their single carried authority; vision entry never forks them. |
| Whole-system architecture and component boundaries | promoted | maintained-authority | docs/platform/architecture-map.md (full map); docs/platform/component-boundary.md (boundary entry) | docs/platform/component-boundary.md (complete boundary authority file) | The full system map and component boundary entry are maintained at these destinations. |
| System overview | promoted | maintained-authority | docs/platform/system-overview/spec.md | None | Current Area Map and Shared Entities owner. |
| Work state / work lifecycle engine | promoted | maintained-authority | docs/platform/work-state/spec.md | docs/platform/work-state/contracts/cli-io-contract.md (CLI I/O) | State/events/fsm/store owners route through exact work-state contracts and subcomponents; preserve the accepted RUL10 source constraints. |
| Runner / dispatch / merge lifecycle | promoted | maintained-authority | docs/platform/runner/spec.md | docs/platform/runner/contracts/routing-handoff.md | Exact contracts, business rules and decisions follow the runner entry; handoff remains the carried contract. |
| Packaging-distribution | promoted | maintained-authority + retained-source | docs/platform/packaging-distribution/README.md | docs/platform/packaging-distribution/spec.md; docs/platform/packaging-distribution/history/distribution-vision.md (original vision) | Exact contracts/architecture under packaging-distribution; preserve the exact packaging and distribution boundaries. |
| Host invocation routing | promoted | maintained-authority | docs/platform/host-invocation-routing/README.md | Exact contracts/architecture/decisions under docs/platform/host-invocation-routing/ | The retired source is provenance, not a current fallback. |
| Agent coordination | promoted | maintained-authority + history-evidence | docs/platform/agent-coordination/README.md | Exact contracts/decisions/verification under docs/platform/agent-coordination/; docs/platform/runner/spec.md | History and verification keep evidence roles; no retiring fallback. |
| Agent confinement | promoted | maintained-authority | docs/platform/agent-confinement/spec.md | src/runner/dispatch/confinement/** | Exact runtime confinement contract and backend registry; preserve the CTR011 contract. |
| Claude plugin surface | promoted | maintained-authority | docs/platform/claude-plugin/spec.md | plugins/fgOS/** | Slash-command and manifest owners; generated wrappers retain their declared source owners. |
| Herdr gateway and web dashboard | promoted | maintained-authority | docs/platform/herdr-web-dashboard/spec.md | docs/platform/herdr-web-dashboard/operations/operator-runbook.md; docs/platform/runner/spec.md | Client behavior versus cockpit operations remain distinct. |
| End-user authoring, index, and knowledge registry | promoted | maintained-authority + retained-source | `docs/platform/work-state/contracts/knowledge-registry.md#spec-soạn--nuôi-tài-liệu-người-dùng-cuối-enduser-docs-authoring` (write-side); `docs/platform/work-state/contracts/knowledge-registry.md#spec-chỉ-mục-đọc-theo-tag-tài-liệu-người-dùng-cuối-enduser-docs-index` (read-side); `docs/platform/work-state/contracts/knowledge-registry.md` (registry) | Retained end-user roots and `docs/knowledge/**`; original source spellings are lineage only | Work-state owns the two complete carried contracts and registry identity/lifecycle/attestation. Index code truth: `src/report/enduser-index-generate.mjs`; cutover regeneration: `fgos docs-index`, verified by `fgos doctor` check `enduser-docs-index-stale`. |
| Decision citation drift | promoted | maintained-authority | docs/platform/decision-citation-drift/spec.md | scripts/check-decision-citation-drift.mjs | Default roots, invariants and the baseline ratchet are owned by this checker. |
| Distillery / reference learning | promoted | maintained-authority | docs/platform/distillery/spec.md | .agents/skills/distill/SKILL.md | Spec owns behavior, canonical skill owns operations; render parity remains separate. |
| Observe (metrics and friction) | promoted | maintained-authority | docs/platform/observe/spec.md | packages/observe/rust/** | Spec versus Rust implementation roles stay distinct. |
| Skills and domainization | promoted | maintained-authority + generated | domains/<domain>/AGENTS.md; docs/platform/domainization/architecture/domainization.md; core/skills/** | .agents/skills/** and plugins/fgOS/skills/** generated surfaces | Canonical domain doctrine/skill sources own semantics; never hand-author generated surfaces; regenerate them from those canonical sources. |
| UI specification | retained | maintained-authority | docs/platform/ui-spec/spec.md (entry for docs/ui-spec/**) | Relevant promoted area spec | Use carried UI paths and visual/functional boundary; preserve visual and functional boundaries. |
| Coexistence | retained | maintained-authority | docs/platform/coexistence/spec.md | src/install/coexist.mjs | Keep root doctrine and implementation roles distinct. |
| Documentation system | retained | maintained-authority | docs/platform/governance.md (governance); docs/reading-map.md (reader routing); this switchboard (authority routing) | docs/platform/proposals/documentation-system-unification.md (proposal); plans/260925-documentation-authority-unification/plan.md (migration history after close) | Keep retained root authorities; retain historical migration evidence separately. |

## 3. Root Document Routes

| Root document | authorityStatus | fileClass | Current Role / Route |
|---|---|---|---|
| docs/platform/documentation/operations/portals/docs-portal.md | retained | maintained-authority | Top-level overview after coordinated reading-map merge. |
| docs/platform/architecture-map.md | retained | maintained-authority | Full system map; the component-boundary file is its focused boundary entry. |
| docs/backlog.md | non-authority | hand-maintained | Hand-maintained product backlog; no renderer exists, and its header does not establish an event projection. |
| docs/platform/coexistence/spec.md | retained | maintained-authority | Non-interference doctrine, carried path. |
| docs/platform/packaging-distribution/history/distribution-vision.md | non-authority | retained-source | Historical vision; current navigation through Packaging-Distribution portal. |
| docs/platform/governance.md | retained | maintained-authority | Canonical types/authority/placement/lifecycle governance. |
| docs/doc-registry.md | non-authority | generated | End-user knowledge registry projection; generator-owned, no platform authority. |
| docs/platform/documentation/history/id-systems-audit.md | non-authority | history-evidence | Identifier audit evidence and rationale; carried path. |
| docs/platform/work-state/contracts/cli-io-contract.md | retained | maintained-authority | Root CLI/runner I/O envelope/exit contract; retain the modern identity and CLI I/O boundaries. |
| docs/platform/herdr-web-dashboard/operations/operator-runbook.md | retained | maintained-authority | Supported cockpit procedures; carried path. |
| docs/platform/platform-foundations.md | retained | maintained-authority | Exclusive binding laws L1-L10 with rationale/sources/review thresholds; complete law holder carries the laws. |
| docs/reading-map.md | retained | maintained-authority | Top-level reader routing to this switchboard and exact promoted owners. |
| docs/platform/runner/contracts/routing-handoff.md | retained | maintained-authority | Agent-to-agent handoff and trust boundary; carried path. |

## 4. Resolution After Cutover

1. Identify the claim and start at `docs/reading-map.md`, then its exact area owner.
2. Follow contract-level routes; retained root law, I/O and handoff owners keep their scopes.
3. Do not infer authority from paths, dates or bare metadata; never dual-author.
4. Retired documentation roots are provenance, not read/write destinations.
5. This switchboard records the transition, not a second operative authority router.

## 5. Related Files

| Relationship | File |
|---|---|
| reader orientation | [docs/reading-map.md](../../reading-map.md) |
| platform portal | [docs/platform/README.md](../README.md) |
| documentation governance | [docs/platform/governance.md](../governance.md) |
| migration authoring rules | [docs/platform/migration-authoring-rules.md](../migration-authoring-rules.md) |
| Historical authority map (evidence) | [plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md](../../../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md) |
| historical unification plan | [plans/260925-documentation-authority-unification/plan.md](../../../plans/260925-documentation-authority-unification/plan.md) |


## Source Metadata

````text
```txt
Document type: Transitional switchboard
Audience: Human reviewer, architect, maintainer, implementer, agent
Purpose: Provide an explicit, non-speculative authority routing switchboard during documentation unification
Design status: Accepted (Phase 01)
Implementation: Implemented (Phase 01)
Provenance: Derived from plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md
Writer type: Human + agent coauthor
Canonical for: Platform documentation authority routing during transition
Use this when: You need to know which document owns a platform claim during migration
Do not use this for: Full future engine architecture or post-cutover canonical topology
Last reviewed: 2026-09-25
Related:
- `docs/reading-map.md`
- `docs/platform/README.md`
- `docs/platform/governance.md`
- `docs/platform/migration-authoring-rules.md`
- `plans/260925-documentation-authority-unification/plan.md`
```
````
