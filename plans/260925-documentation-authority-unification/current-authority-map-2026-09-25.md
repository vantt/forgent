# Current Documentation Authority Map — 2026-09-25

```txt
Document type: Phase 00 truth-reset evidence
Scope: Repository-local platform documentation routes only
Snapshot commit: ac19f6d1e868c53b2bc59a2c9642ee0e37e7eb08
Authority effect: Records current authority; does not promote, migrate, delete, or supersede any source
```

## 1. Routing Rule

Use explicit declarations, not path, date, prose quality, or a bare `Canonical:`
metadata field:

1. Enter through `docs/reading-map.md` and `docs/platform/README.md`.
2. If an area portal declares a current-source or conflict order, follow it.
3. A target marked draft, partial, candidate, or “after review” does not silently
   outrank a declared current source.
4. When a portal assigns navigation to a target but exact contracts or proof to a
   retained source, use both for their declared scopes; do not infer that one file
   owns every claim in the area.
5. Surface an undeclared conflict. Do not choose by newest timestamp.

Status vocabulary in this snapshot:

- `promoted`: the target portal owns current navigation for its declared scope and
  explicitly routes any retained source.
- `candidate`: a target exists, but a root or legacy source still owns the claim.
- `legacy-current`: no promoted target owns the claim; the named root/spec/
  architecture source remains current.
- `conflicted`: live declarations assign competing owners without a resolving
  scope rule. No unresolved `conflicted` row remained after the routing correction
  in this Phase 00 change; future evidence may re-open one.

## 2. Area Routes

| Area / surface | Status | Explicit current route | Live evidence checked |
|---|---|---|---|
| Platform laws | candidate | Enter at `docs/platform/platform-foundations.md`; read the complete binding wording, rationale, sources, and thresholds in `docs/platform-foundations.md`; use `docs/specs/platform-foundations.md` as its curated/spec projection. | The target anchor §§1–3 explicitly retains both owners; the root file says it is the full source retained during migration. |
| Platform vision and work lifecycle | candidate | Enter at `docs/platform/vision.md`; use `docs/work-item-lifecycle-vision.md` and `docs/platform-foundations.md` for retained original direction and locked mission/priority wording. | Target vision metadata says “Yes, after review”; both root files identify their target entry and retained role. |
| Whole-system architecture and component boundaries | candidate | Use `docs/architecture-map.md` for the full current architecture map; enter component-boundary work at `docs/platform/component-boundary.md`, then follow its current detailed sources under `docs/architect/component-boundary/`. | Both target anchors explicitly name the root/architect documents as current detailed or full legacy sources. |
| System overview | legacy-current | `docs/specs/system-overview.md`, then the owning area routes in this table. | Its live Area Map and Shared Entities sections remain the only consolidated current cross-area spec. |
| Work state / work lifecycle engine | legacy-current | `docs/specs/work-state.md`; use `docs/io-contract.md` for the CLI/runner I/O contract and `docs/work-item-lifecycle-vision.md` only for retained direction. | `docs/specs/reading-map.md` routes state modules to the work-state spec; no `docs/platform/work-state/` portal exists. |
| Runner / dispatch / merge lifecycle | legacy-current | `docs/specs/runner.md`, plus `docs/routing-handoff-contract.md` for agent-to-agent handoff and the promoted Agent Coordination route for coordination-only claims. | `docs/specs/reading-map.md` maps runner sources to the runner spec; no `docs/platform/runner/` portal exists. |
| Packaging-distribution | promoted | `docs/platform/packaging-distribution/README.md`, then its target vision/spec/contracts and implementation-alignment map; consult `docs/specs/distribution.md`, `docs/distribution-vision.md`, and `docs/architect/packaging-distribution/**` only in the roles the portal assigns. | Portal §§2–3 and §9 define the order and say the platform area is the active navigation surface. |
| Host invocation routing | promoted | `docs/platform/host-invocation-routing/README.md`, then its target docs; retained `docs/architect/host-invocation-routing/**` remains legacy/current only where the portal or target inventory has not redirected/drained it. | Portal §§2, 3, and 8 state partial route migration and retained-source behavior. |
| Agent coordination | promoted | `docs/platform/agent-coordination/README.md` owns navigation and migration status; its Status Summary chooses target indexes/summaries, while exact accepted contracts, schemas, ADRs, and proof remain under the portal-linked `docs/architect/agent-coordination/**` or `docs/specs/runner.md` until explicitly superseded. | Portal metadata limits its own scope; Read First and Status Summary explicitly route detailed authority. |
| Agent confinement | legacy-current | `docs/specs/confinement-authority.md`, then `src/runner/dispatch/confinement/**` and linked tests for implementation proof. | `docs/specs/reading-map.md` names this spec/source pair; no target area portal exists. |
| Claude plugin surface | legacy-current | `docs/specs/fgos-plugin.md`, then `plugins/fgOS/**`. | `docs/specs/system-overview.md` and `docs/specs/reading-map.md` identify this spec and implementation. |
| Herdr gateway and web dashboard | legacy-current | `docs/specs/herdr-web-dashboard.md` for dashboard behavior, `docs/specs/runner.md` for runner/gateway integration, and `docs/operator-runbook-herdr-cockpit.md` for operations. | The detailed reading map names the dashboard source and spec; no target area portal exists. |
| End-user authoring, index, and knowledge registry | legacy-current | Treat as the distinct user/end-user corpus: `docs/specs/enduser-docs-authoring.md`, `docs/specs/enduser-docs-index.md`, generated `docs/doc-registry.{md,json}`, and registry-backed `docs/knowledge/**`. Do not treat it as platform authority. | Governance separates `user/`, `knowledge/`, and platform topology; live `fgos knowledge status --json` reports the registry state. |
| Decision citation drift | legacy-current | `docs/specs/decision-citation-drift.md`, `scripts/check-decision-citation-drift.mjs`, and its tests. | The detailed reading map names this exact source/spec/test route. |
| Distillery / reference learning | legacy-current | `docs/specs/distillery.md` for current bounded behavior and `.agents/skills/distill/SKILL.md` for the portable operating surface. | The system overview marks the spec partial and separately records the skill-spec gap. |
| Skills and domainization | legacy-current | `domains/<domain>/AGENTS.md`, canonical domain/core skill sources, and `docs/architect/domainization/README.md`; generated mirrors are projections, not authority. | `docs/platform/README.md` routes the area to domain/skill trees; the detailed map labels wrappers/mirrors and domainization sources. |
| UI specification | legacy-current | `docs/ui-spec/**`; use the relevant implementation/spec owner for behavior outside visual/UI contracts. | `docs/platform/README.md` routes `ui-spec` to this existing root; no target area portal exists. |
| Coexistence | legacy-current | `docs/coexistence.md`. | The root document identifies itself as the living execution doctrine; no promoted target claims it. |
| Documentation system | legacy-current | `docs/doc-governance.md` governs docs and `docs/reading-map.md` routes readers. `docs/platform/proposals/documentation-system-unification.md` is long-horizon, non-canonical architecture; this plan is the proposed H1 program, with only Phase 00 authorized. | The governance and reading-map headers say Accepted/current; the proposal header says canonical for nothing until accepted. |

## 3. Root Document Routes

| Root document | Status | Current role / route |
|---|---|---|
| `docs/README.md` | legacy-current | Accepted top-level documentation entry. |
| `docs/architecture-map.md` | legacy-current | Full current architecture map; target `docs/platform/architecture-map.md` is a compact candidate entry. |
| `docs/backlog.md` | legacy-current | Generated backlog projection from its declared event-sourced PBI records; never hand-edit. |
| `docs/coexistence.md` | legacy-current | Living coexistence doctrine. |
| `docs/distribution-vision.md` | promoted | Retained source/history only; current navigation is the Packaging-Distribution portal. |
| `docs/doc-governance.md` | legacy-current | Accepted documentation-governance authority. |
| `docs/doc-registry.md` | legacy-current | Generated end-user knowledge projection, not platform claim authority. |
| `docs/id-systems-audit.md` | legacy-current | Final audit/evidence for the named identifier decisions; not a general current-area portal. |
| `docs/io-contract.md` | legacy-current | Current CLI/runner I/O contract until a target contract explicitly supersedes it. |
| `docs/operator-runbook-herdr-cockpit.md` | legacy-current | Current operator guide; it does not own runner or coordination truth. |
| `docs/platform-foundations.md` | legacy-current | Complete locked-law source. The target foundation file is an entry/summary only. |
| `docs/reading-map.md` | legacy-current | Accepted reader-routing authority during transition. |
| `docs/routing-handoff-contract.md` | legacy-current | Current runner handoff contract. |
| `docs/work-item-lifecycle-vision.md` | legacy-current | Retained vision source; current navigation starts at `docs/platform/vision.md`. |

`docs/doc-registry.md` and `docs/backlog.md` are included because they are root
Markdown surfaces, but their generated status means they do not establish new
platform-documentation authority.

## 4. Always-Loaded Bypasses

The always-loaded path was checked in `AGENTS.md`, `CLAUDE.md`,
`core/instructions/platform-laws.md`, and
`.fgos/instructions/effective/repo.json`.

- `CLAUDE.md` imports `AGENTS.md`; it adds no separate platform-doc route before
  that import.
- `AGENTS.md` directly routes to `docs/specs/system-overview.md`,
  `docs/specs/reading-map.md`, area specs, `docs/specs/runner.md`,
  `docs/specs/platform-foundations.md`, `docs/platform-foundations.md`,
  `docs/backlog.md`, and `docs/routing-handoff-contract.md`. These bypass the
  transitional `docs/reading-map.md` route.
- `core/instructions/platform-laws.md` and its generated effective projection
  directly bind all L1–L8 anchors to `docs/platform-foundations.md`.
- The generated block in `AGENTS.md` repeats those same anchors.

Phase 00 records these consumers but does not rewrite them. Rewriting shipped or
always-loaded consumers belongs to the later consumer-inventory/cutover gates and
must distinguish this repository's route from conventions shipped to other
projects.

## 5. Locked-Law Result

A direct read of L5 and L8 in `docs/platform-foundations.md` found no
`docs/specs/**` or `docs/architect/**` path in either law's wording, source,
consequence, or review threshold. Relocating those roots therefore does not by
itself supersede L5 or L8.

The law source path is nevertheless embedded in
`core/instructions/platform-laws.md`, the generated effective instruction set,
the generated `AGENTS.md` block, and L8 anchor tests. Moving
`docs/platform-foundations.md` later requires coordinated anchor/projection
rewrites and anchor-suite proof; Phase 00 does not move it.

## 6. Repository Evidence

Read-only checks against the snapshot found:

- exactly three target area portals under `docs/platform/**`:
  Packaging-Distribution, Host Invocation Routing, and Agent Coordination;
- 566 non-Markdown files below `docs/architect/**`;
- no production-code text match that directly opens a specifically named
  non-Markdown proof payload under that tree, but many source comments, test
  references, one test-held contract path, and possible dynamic/glob consumers;
- 167 references to `docs/specs/**`, `docs/architect/**`, or `docs/platform/**`
  across the searched always-loaded/core/domain/plugin skill Markdown set;
- the historical registry code commit `5c948d2a4` is an ancestor of the snapshot;
- `fgos knowledge status --json`: 479 topics/documents, 147 active and 332
  provisional documents;
- legacy user-facing Markdown counts: 137 `explanation`, 20 `how-to`, 6
  `reference`, and 0 `tutorials`;
- `fgos doctor --json` ran but was not green because of pre-existing repository
  and machine findings; the registry enforcement/projection/alias checks were
  individually present and mostly green, while `doc-current-path-missing` and
  `doc-source-conservation` reported existing failures.

These checks do not authorize payload relocation. Dynamic/glob runtime-consumer
inventory remains a blocking requirement before any evidence move or deletion.

## 7. Phase Boundary

This map performs no source promotion, migration, deletion, legacy redirect,
claim conservation, alias implementation, ratchet, or consumer rewrite. Those
remain Phase 01–09 work and are unauthorized by the Phase 00 authorization.
