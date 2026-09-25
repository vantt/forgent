# Transitional Documentation Authority Switchboard

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
- `docs/doc-governance.md`
- `docs/platform/migration-authoring-rules.md`
- `plans/260925-documentation-authority-unification/plan.md`
```

This switchboard is the operative authority router for repository-local platform
documentation during the active unification migration. It stops authority split
and reader guesswork before atomic cutover.

## 1. Operating Invariants

1. **One claim has one canonical owner.** Summary documents link; they do not fork authority.
2. **`docs/platform/**` is the target topology, not yet the universal live authority.**
   Do not treat `docs/platform/**` as fully canonical across all areas. Currently, only
   Packaging-Distribution, Host Invocation Routing, and Agent Coordination have promoted portals,
   and each retains explicit legacy source delegations for detailed contracts, ADRs, or proofs.
   All other platform areas remain `legacy-current` under `docs/specs/**` or root documents.
3. **No guessing by file path, date, or bare metadata.**
   Readers and writers must not infer authority from a directory path, a newer git commit date,
   richer prose, or a bare `Canonical:` frontmatter string. Follow the explicit current route below.
4. **Never dual-author prose.**
   Do not write the same normative, behavioral, or architectural content in both legacy roots and
   candidate target documents. Update the declared current owner once, then record candidate impact.
5. **Phase status truth.**
   Phase 00 (truth reset) and Phase 01 (containment switchboard and ratchets) are completed;
   Phases 02–09 remain unauthorized. This switchboard does not promote, migrate, relocate, or
   delete any legacy source.

## 2. Area Authority Routes

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
| Skills and domainization | legacy-current | maintained-authority + generated | `domains/<domain>/AGENTS.md`, `docs/architect/domainization/README.md`, canonical skills (`.agents/skills/**`, `core/skills/**`) | `plugins/fgOS/skills/**` (generated mirrors) | `domains/<domain>/AGENTS.md` owns domain-specific doctrine; canonical skill definitions live in `.agents/skills/` and `core/skills/`; generated mirrors are projections. |
| UI specification | legacy-current | maintained-authority | `docs/ui-spec/00-overview.md` (entry for `docs/ui-spec/**`) | Relevant area spec | Visual and UI layout contracts; functional behavior owned by area specs. |
| Coexistence | legacy-current | maintained-authority | `docs/coexistence.md` | `src/install/coexist.mjs` | Living doctrine for running alongside foreign agent harnesses. |
| Documentation system | legacy-current | maintained-authority + retained-source | `docs/doc-governance.md` (governance); `docs/reading-map.md` (reader routing); this switchboard (authority routing) | `docs/platform/proposals/documentation-system-unification.md` (long-horizon proposal), `plans/260925-documentation-authority-unification/plan.md` (migration plan) | Governance and routing documents are active authority; proposal is non-canonical architecture; plan is active migration. |

## 3. Root Document Routes

| Root document | authorityStatus | fileClass | Current Role / Route |
|---|---|---|---|
| `docs/README.md` | legacy-current | maintained-authority | Top-level documentation overview. |
| `docs/architecture-map.md` | legacy-current | maintained-authority | Full current system architecture map (v0.2, ADR0010). |
| `docs/backlog.md` | non-authority | generated | Product backlog projection from event-sourced PBI records. Do not edit manually. |
| `docs/coexistence.md` | legacy-current | maintained-authority | Living doctrine for non-interference with foreign agent harnesses. |
| `docs/distribution-vision.md` | non-authority | retained-source | Historical vision; superseded for active navigation by Packaging-Distribution portal. |
| `docs/doc-governance.md` | legacy-current | maintained-authority | Canonical documentation governance (types, authority, placement, lifecycle). |
| `docs/doc-registry.md` | non-authority | generated | Projection of end-user knowledge registry; does not own platform authority. |
| `docs/id-systems-audit.md` | non-authority | history-evidence | Audit and rationale for identifier systems; non-authority evidence. |
| `docs/io-contract.md` | legacy-current | maintained-authority | Canonical CLI/runner I/O envelope and exit code contract. |
| `docs/operator-runbook-herdr-cockpit.md` | legacy-current | maintained-authority | Supported operator procedures for herdr cockpit. |
| `docs/platform-foundations.md` | legacy-current | maintained-authority | Canonical platform operating laws (L1–L8). Target file is summary/entry. |
| `docs/reading-map.md` | legacy-current | maintained-authority | Top-level reader routing; links to this switchboard. |
| `docs/routing-handoff-contract.md` | legacy-current | maintained-authority | Canonical agent-to-agent handoff contract and trust boundary. |
| `docs/work-item-lifecycle-vision.md` | non-authority | retained-source | Directional foundation; active navigation starts at `docs/platform/vision.md`. |

## 4. Resolution Algorithm for Readers and Writers

1. **Identify the topic or claim** you need to read or update.
2. **Find the surface row** in Section 2 (Area Authority Routes) or Section 3 (Root Document Routes).
3. **If `authorityStatus` is `promoted`:**
   - Navigate to the promoted portal (`docs/platform/<area>/README.md`).
   - Follow the portal's explicit current-source mapping.
   - If the portal delegates the specific contract, ADR, or proof to a retained source, that retained source owns that claim.
4. **If `authorityStatus` is `legacy-current`:**
   - Navigate directly to the current canonical route listed in the table (typically `docs/specs/<area>.md` or root doc).
   - Do NOT attempt to read or author candidate files under `docs/platform/<area>/` for that topic.
5. **If `authorityStatus` is `candidate`:**
   - Enter at the target portal for orientation, but use the retained legacy source for binding claims.
   - Do not treat candidate text as binding authority until Phase 08 promotion.
6. **For authors during migration:**
   - Consult [docs/platform/migration-authoring-rules.md](platform/migration-authoring-rules.md).
   - Update only the single declared current owner.
   - Never dual-author.
   - Edits under legacy roots (`docs/specs`, `docs/architect`) require a reviewed exception in `scripts/check-legacy-docs-ratchet.exceptions.json`.

## 5. Related Files

| Relationship | File |
|---|---|
| reader orientation | [docs/reading-map.md](reading-map.md) |
| platform portal | [docs/platform/README.md](platform/README.md) |
| documentation governance | [docs/doc-governance.md](doc-governance.md) |
| migration authoring rules | [docs/platform/migration-authoring-rules.md](platform/migration-authoring-rules.md) |
| Phase 00 authority map (evidence) | [plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md](../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md) |
| active unification plan | [plans/260925-documentation-authority-unification/plan.md](../plans/260925-documentation-authority-unification/plan.md) |
