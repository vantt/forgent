discussion: open

# Workflow engine and domain task types

## 1. Trạng thái hiện tại

2026-11-21: the shaper head `head:shaper-workflow-engine` took over from the secretary's opening. Domain is coding (the source item is a coding-domain workflow). Scouted the current wiring (see §3). The owner's answers on tsk-1pv are recorded in §3 as owner-stated, not yet minted as D-IDs (only one round so far). Nothing is settled.

Open: Q1 (`q-t6xfzdl3eu`, parked) asks which module the first slice wires `resolveWorkflow` into.

## 2. Mục tiêu & đề bài

Today a coding Work item always walks one workflow, `coding/feature` (discovery, exploring, planning, executing, and so on). `resolveWorkflow(domain, kind)` already exists in `src/state/domain-registry.mjs` and the registry already has `defaultWorkflow: feature` and an empty `workflowFor: {}`, but the item-walking code does not consult it per item kind. The owner wants a domain to carry more than one workflow, starting with a shorter `bugfix` workflow for coding, with domain-specific logic living in the coding domain pack and none of it in the shared supervisor layer. The outcome of this discussion is a settled slice that a planner can plan: which code paths are wired, what the bugfix workflow's stages are, and how the domain pack plugs in.

## 3. Vấn đề rõ / chưa rõ

| Point | State | Evidence / note |
|---|---|---|
| Bugfix first slice is small, not all four modules | owner-stated 2026-11-21 (tsk-1pv answer) | one round only, not a D-ID yet |
| Bugfix workflow is shorter than feature | owner-stated | exact stage list not yet written |
| Applies to every `kind: bug` | owner-stated | no `risk:light` subset |
| Bugfix uses its own stage names (not shared `executing`) | owner-stated | consequence: its own `skillMap`/`taskSpecMap` entries |
| Domain-specific bugfix logic plugs in via the coding domain pack; no coding logic in the shared supervisor layer | owner-stated | boundary rule for the planner |
| `resolveWorkflow` exists but only `domain-registry.mjs` and `work-compat.mjs` reference it; `workflowFor` is `{}` for coding | clear | `src/state/domain-registry.mjs:207`, `domains/coding/registry.yaml:97-98` |
| Coding has one workflow file, `feature.yaml`, with steps carrying `phase`, `skill`, `operations`, `transitions` | clear | `domains/coding/workflows/feature.yaml` |
| Which module is the "small slice" wired first (frontier, stage move, intake)? | open, Q1 `q-t6xfzdl3eu` | the item tsk-1pv names stage-fsm, frontier and intake, but `src/state/stage-fsm.mjs` does not exist at this commit, so the names need re-checking |
| Exact bugfix stage list and their names | open | blocked by Q1 for the wiring, not for drafting the stage list |
| Where the existing `fix-verify-red` task spec belongs in bugfix | open | `feature.yaml` currently has it as an operation of `executing` |
| Title says "domain task types"; is more than bugfix in scope (other kinds, other domains)? | open | the item only covers coding bugfix |

## 4. Quyết định đã chốt

| ID | Decision | Date |
|---|---|---|
| (none yet) | | |

## 5. Q&A log

- 2026-11-21 (owner, via secretary, on tsk-1pv): small slice first; bugfix shortened; applies to every bug; own stage names; domain-specific logic plugs in through the coding domain pack with no coding logic in the shared supervisor layer.
- 2026-11-21 10:35: shaper scouted `domain-registry.mjs`, `registry.yaml` and `feature.yaml`; found `stage-fsm.mjs` absent. Q1 parked as `q-t6xfzdl3eu`.

## 6. Thiết kế đã chốt {#design}

Not yet. Nothing is settled enough to synthesize.

## 7. Danh mục hạng mục / task {#tasks}

Not yet.
