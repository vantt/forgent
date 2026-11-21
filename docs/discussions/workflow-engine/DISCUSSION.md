discussion: open

# Workflow engine and domain task types

## 1. Trạng thái hiện tại

2026-11-21: the shaper head `head:shaper-workflow-engine` took over from the secretary's opening. Domain is coding (the source item is a coding-domain workflow). Scouted the current wiring (see §3). The owner's answers on tsk-1pv are recorded in §3 as owner-stated, not yet minted as D-IDs (only one round so far). Nothing is settled.

2026-11-21 10:45, owner reframed the discussion: before adding bugfix, confirm the vision already settled (a task type such as code-implement or bug-fix is carried by a team under a lead; the lead gets a persona and skills plus a workflow; the workflow is a broad frame distilled from experience, not a narrow constraint; nothing hardcoded), and check how far the code got, so a new mechanism is not invented beside settled ones. Also the owner's stability concern: the supervisor is not stable yet and work is drifting into deeper patterns.

Scan result (§3, "Prior art"): the vision is already settled in several decisions (D-ADR0070, 0072, 0073, 0076 and the domainization boundary). Bugfix then needs only a new workflow file plus one `workflowFor` line, so no new mechanism. Not yet verified: whether the code already reads a per-kind workflow end to end, and where "a team under a lead per task type" is settled (the current `lead` persona leads one plan, not one task type).

Q1 (`q-t6xfzdl3eu`) was cancelled: its premise (a missing `stage-fsm.mjs`) is stale, since Work already records `workflowStep` from its Workflow (commit `07bd0c594`).

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
| Prior art: workflow is a guide plus a case ledger; the agent chooses the order, the harness admits and records; "soft inside, hard outside" | settled, owner 2026-10-19 12:32 | D-ADR0070, `docs/platform/workflow/spec.md` §17; matches the owner's "broad frame, not a bound" |
| Prior art: one word per layer (workflow = definition file, case = one run of it, unit, loop, pattern, seat) | settled, owner 2026-10-24 12:45 | D-ADR0073, same spec §17 |
| Prior art: who sits a seat (persona, model) is chosen only by `bind()`; a workflow may declare `seats:` and a tier | settled | D-ADR0072, `docs/platform/seat-binding/spec.md`; the persona carries voice, style and decision boundary (`core/agents/*.yaml`) |
| Prior art: Work is only the surface; Workflow and Execution are the engine; finish Workflow first | settled, owner 2026-11-16 | D-ADR0076; matches the owner's stability concern |
| Prior art: the domain registry owns `defaultWorkflow` and `workflowFor`; `workflows/<name>.yaml` owns steps, skillMap, taskSpecMap and operations; filename is the workflow name | settled design | `docs/platform/domainization/architecture/domainization.md` §5; so bugfix is one file plus one registry line |
| Prior art: Work already records `workflowStep` from its Workflow; dispatch no longer knows Work | done in code | commits `07bd0c594`, `ad9a23a9f` |
| Per-kind wiring end to end (does anything read `workflowFor[kind]` outside the resolver?) | not verified | only `domain-registry.mjs` and `work-compat.mjs` reference `resolveWorkflow` in `src/`; need a code read before claiming a gap |
| Where is "a team under a lead per task type" settled? Today `lead` leads one plan | not found yet | `core/agents/lead.yaml`; `docs/platform/workflow/spec.md` §7.8 has a conductor case driven by `fgos-cook`; ask the owner for the earlier discussion if the scan cannot find it |
| `feature.yaml` carries no `seats:` yet; spec §10.2 describes a guide part to be added at cutover | open | `grep seats` gives 0 in `domains/coding/workflows/feature.yaml` |
| Title says "domain task types"; is more than bugfix in scope (other kinds, other domains)? | open | the item only covers coding bugfix |

## 4. Quyết định đã chốt

| ID | Decision | Date |
|---|---|---|
| (none yet) | | |

## 5. Q&A log

- 2026-11-21 (owner, via secretary, on tsk-1pv): small slice first; bugfix shortened; applies to every bug; own stage names; domain-specific logic plugs in through the coding domain pack with no coding logic in the shared supervisor layer.
- 2026-11-21 10:35: shaper scouted `domain-registry.mjs`, `registry.yaml` and `feature.yaml`; found `stage-fsm.mjs` absent. Q1 parked as `q-t6xfzdl3eu`.
- 2026-11-21 10:45 (owner): the vision to be confirmed and the stability concern, summarised in §1. Shaper scanned `docs/platform/workflow/spec.md`, `domainization.md`, `seat-binding/spec.md`, `core/agents/lead.yaml` and the git log for `resolveWorkflow` and `workflowFor`; result in §3. Q1 cancelled as stale.

## 6. Thiết kế đã chốt {#design}

Not yet. Nothing is settled enough to synthesize.

## 7. Danh mục hạng mục / task {#tasks}

Not yet.
