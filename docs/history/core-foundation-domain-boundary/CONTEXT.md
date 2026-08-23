---
type: context
title: Core-foundation vs domain-specific directory/module boundary (tsk-397)
tags: [architecture, module-boundary, domain, engine-vs-prose]
timestamp: 2026-08-19T15:22:00.000Z
status: locked
---

# Core-foundation vs domain-specific directory/module boundary (tsk-397)

Written by `fgos-coding-exploring`, native-first handoff from `fgos-coding-shaping`
(19 live rounds, `docs/history/core-foundation-domain-boundary/DISCUSSION.md`,
§6 is the full design synthesis, §7 is the candidate task list). This
CONTEXT.md is the required exploring-stage artifact — it distills, it does
not re-derive: every decision here was already locked and stress-tested
(including 1 independent completeness/consistency review by a fresh Opus
agent) during shaping. Cite `DISCUSSION.md` for full rationale/evidence;
this file exists so the item's exploring gate has its own real record and
`fgos-coding-planning` has a machine-parseable D-ID table to cite footprints
against.

## Feature boundary

Reorganize fgOS's own repo layout along two axes: **core-foundation**
(harness/workflow-mechanics/task-contract/knowledge/skill/doctrine/agent-type
shared by every domain) vs **domain-specific** (the same six concerns,
owned by one domain — `coding` today, `marketing` future per STR52). End
state: `domains/<name>/` is a self-contained, pure YAML+prose folder
(`registry.yaml`, `workflows/*.yaml`, `skills/*.md`, `task-specs/*.md`,
`specs/*.md`, `knowledge/*.md`, `agents/*.yaml`, `AGENTS.md`) with zero JS
files of its own; `core/` holds the matching domain-agnostic siblings
(`core/skills/`, `core/agents/`, `core/task-specs/`, `core/skills/_shared/`);
`bin/`, `src/`, `herdr-plugin/` stay exactly where they are (D5 — moving
them breaks 881 real references and external installs for zero benefit).
A DISPATCH/ROUTING/DRIVING execution model (already-shipped mechanisms —
`src/runner/dispatch.mjs`, `fgos-routing`, `fgos-<domain>-driving` — no new
concepts) governs how a session's persona gets resolved and how eligibility
for a role/task-spec is matched via skill tags instead of the previously
shipped `claims` list (tsk-2t9c D12, now reversed).

This is a pure architecture/layout item — no user-facing behavior changes,
no external contract changes (`.agents/skills/`, `.claude/skills/`,
`.claude/agents/`, `plugins/fgOS/skills/` all stay byte-identical render
targets; `fgos setup`'s `materializeSkillsIntoProject` output to external
projects is unaffected). The entire blast radius is internal: where
maintainers edit source, and how core code discovers/loads per-domain data.

## Locked decisions

| D-ID | Summary |
|------|---------|
| D1 | Domains share ONE fgOS store/event-log — no per-domain fgOS install. |
| D2 | Top-level work-item fields are a closed port (`EDITABLE_FIELDS`); `domainFields.<domain>.*` is the only open per-domain adapter territory. |
| D3 | Domain code+skill live in a self-contained `domains/<name>/` folder, top-level — mirrors the real `plugins/fgOS/` precedent. |
| D4 | `workflow-stage-graphs.mjs` becomes a thin aggregator auto-discovering `domains/*/registry.yaml` (D30) — never a hand-maintained import list. |
| D5 | Core (`bin/`, `src/`, `herdr-plugin/`) stays at its current top-level location — not physically relocated. |
| D6 | Domain-knowledge (curated, team-maintained) lives at `domains/<name>/knowledge/`, distinct from `docs/history/` (raw context, unchanged, shared, no domain tag). |
| D7 | Canonical skill-source authoring moves to `core/skills/` + `domains/<name>/skills/`; `.agents/skills/`, `.claude/skills/`, `plugins/fgOS/skills/` all become pure render targets (new assembly step). |
| D8-revised | `docs/specs/` (12 platform/core files) stays completely unchanged — only `domains/<name>/specs/` is new, empty, for future domain BA specs. |
| D9 | `docs/task-specs/coding/*.md` (13 real files) move to `domains/coding/task-specs/`, keeping the name "task-specs" (tsk-2t9c's own per-task-kind contract concept — distinct from work-item field-schema). |
| D10 | Dispatcher domain/workflow-aware wiring stays in scope (bugfix-workflow is imminent, not speculative). |
| D11 | Extend `workflow-stage-graphs.mjs`'s existing resolver-function pattern to file-path lookups (`resolveTaskSpecPath`), closing `registrations.mjs`'s raw `path.join` gap. |
| D12 | Extend `architecture-manifest.json` + `architecture.test.mjs` with a domain-siloing rule (core never imports a specific domain; domains never import each other) — reuses the existing one-directional-layer mechanism. |
| D13 | Three-layer dispatch model: DISPATCH (`dispatch.mjs`, resolves persona once) → ROUTING (`fgos-routing`, resolves machinery once/session) → DRIVING (`fgos-<domain>-driving`, loops stages, same persona). |
| D14 | `bundleForStage(domain, stage)` returns `{skill, taskSpec}` together, at the DRIVING layer — closes hardcoded task-spec path citations in skill prose. |
| D15 | Persona/agent-type resolution keyed by `(domain, stage, role)`, not just `(domain, role)`. Team collaboration = sync calls from one holder, never multi-holder. |
| D16 | Rename `roleGraph` role `human-advisor` → `advisor`. |
| D17 | Merge dispatcher-wiring task into the registry-split task — dissolves the reference-identity gate by removing the flat-property read paths in one pass. |
| D18 | `domains/<name>/workflows/<name>.mjs` (later superseded by D29's `.yaml`) is the official home for workflow definitions. |
| D19 | Workflow-file authoring format (one unified per-stage block) is separate from runtime shape (existing separated maps) — normalized at load time, resolver signatures unchanged. |
| D20 | Eligibility declaration inverted: agent-type declares role+persona (`soul` intent) + `skills` (what it has, no separate `soul` field); task-spec declares `agent`(D26)/`requires-skill` (what it needs) — replaces tsk-2t9c D12's shipped `claims` model. |
| D21 | The 3 dispatch layers (D13) map directly onto already-named, already-built mechanisms — no new vocabulary ("CASTING" proposal retracted). |
| D22 | DISPATCH eligibility-check is ONE unified mechanism at every role-requiring point — stage-entry (primary role) and Collaboration-row calls (secondary role) both resolve through the same D20 match. |
| D23 | Doctrine domain-scoped: `domains/<name>/AGENTS.md` (same file type as root `AGENTS.md`, narrower scope). Root keeps only genuinely domain-agnostic doctrine; `fgos-routing` reads the domain's own `AGENTS.md` once domain resolves (explicit Read, not static `@import`). |
| D24 | `agents/*.yaml` splits into `core/agents/` (domain-agnostic) + `domains/<name>/agents/` (domain-flavored authorship) — mirrors D7's skill split exactly; eligibility (D20) is unaffected by file location. |
| D25 | Driving never hard-stops for an implicit stage-persona need — resolves via the same sync team-collaboration mechanism already shipped (`handoff.mjs`/`roleGraph.edges`, tsk-2t9c). Only an explicitly-declared async interaction (e.g. `review`) stops driving. |
| D26 | Rename task-spec eligibility field `assignable-to` → `agent`. |
| D27 | `core/task-specs/` — new folder, task-spec contracts for the 7 domain-agnostic skills (previously undocumented, blocking D20's own eligibility match for them). |
| D28 | `handoff.mjs`'s `callstackCap` gap resolved: caps NESTED sync depth only; sequential/sibling sync calls over a driving loop's lifetime are uncapped. |
| D29 | ALL workflows (including `feature`) become real independent `workflows/<name>.yaml` files — dissolves D7a's reference-sharing identity discipline (moot once there is only one copy). |
| D30 | `domains/<name>/registry.mjs` → `registry.yaml` — after D29, its remaining content (`roleGraph` + flags) is pure data; a domain folder is now 100% YAML+prose, zero JS. |
| D31 | `workflows` map is synthesized by core's aggregator (directory scan, never authored); `defaultWorkflow`/`workflowFor` are real domain-level selector data, declared in `registry.yaml`. |
| D32 | Eligibility multi-match tie-break: explicit `agent:` pin wins outright > currently-running agent-type if it qualifies > deterministic declaration order. Never random, never silently ambiguous. |
| D33 | Agent-type names must be globally unique across `core/agents/` + every `domains/*/agents/` — new doctor check (flat `.claude/agents/` render target would otherwise silently overwrite on collision). |
| D34 | `.agents/skills/_shared/executor-dispatch-fallback.md` moves to `core/skills/_shared/` — referenced by any dispatching skill regardless of domain. |

Full rationale, scout evidence, and the round-by-round record for every
D-ID above: `docs/history/core-foundation-domain-boundary/DISCUSSION.md`
§4 (decision table) and §5 (Q&A log).

## Pinned terms

- **core** — the closed port: code/data/prose used identically by every
  domain (`bin/`, `src/`, `herdr-plugin/`, `core/skills/`, `core/agents/`,
  `core/task-specs/`, the domain-agnostic slice of root `AGENTS.md`).
- **domain** (`domains/<name>/`) — the open adapter: everything owned by
  and flavored for exactly one domain (`coding` today). Pure YAML+prose
  after D29/D30 — no JS files of its own.
- **task-spec** — tsk-2t9c's contract-per-task-kind concept (input/output/
  gates/verify-template + Collaboration table), NOT the work-item
  field-schema (`EDITABLE_FIELDS`). Confirmed twice in this discussion
  after two wrong earlier guesses (D8/D8-revised, D9).
- **role** — a fixed seat in `roleGraph` (`implementer`/`researcher`/
  `reviewer`/`helper`/`advisor` post-D16), data, checked for legality.
- **persona/agent-type** — who actually fills a role for a given call;
  resolved via skill-tag eligibility match (D20/D32), independent of
  where the agent-type's own source file physically lives (D24/D33).
- **DISPATCH/ROUTING/DRIVING** — not new layers; direct names for
  `dispatch.mjs`/`fgos-routing`/`fgos-<domain>-driving` (D13/D21).

## Scout evidence (exploring pass, round 19 handoff)

- `docs/architecture-manifest.json:80` classifies
  `src/state/workflow-stage-graphs.mjs` as **kernel** layer — planning
  must account for the existing 5-layer one-directional-import rule
  (`architecture.test.mjs`) when D12's new domain-siloing rule lands
  alongside it; both rules live in the same enforcement mechanism.
- Impact-analysis capability gate (`fgos tool query --capability
  impact-analysis --status present`): **GitNexus present** (`mcp`,
  `Verification` responsibility). Index was stale after this session's own
  commits (D1-D34) — re-indexed during this exploring pass (`npx gitnexus
  analyze`, 72.8s, 19,129 nodes / 26,811 edges / 554 clusters / 300 flows).
  **Full posture confirmed fresh** — planning can trust blast-radius
  queries without re-indexing first, but should re-check freshness again
  if planning spans more than a short session (per `CLAUDE.md`'s own
  capability-gate doctrine).
- 459 real matches for `workflow-stage-graphs` across 178 files (`rg`,
  scoped to `src`/`bin`/`test`/`docs`/`dogfood-fixture`) confirm this is a
  widely-depended-on kernel module — every task in §7 that touches it
  (`{#task-domain-registry-split}` especially) needs a real, not
  cursory, regression pass.
- 13 real task-spec files exist today at `docs/task-specs/coding/*.md`,
  0 at any core-skill location — both counts independently re-verified
  during shaping (round 19's opus review re-confirmed this exact count).

## Canonical references

- Full design + task list: `docs/history/core-foundation-domain-boundary/DISCUSSION.md` (§6 design synthesis, §7 candidate tasks — ~15 tasks after review-driven additions).
- Independent completeness review: `plans/reports/discussion-review-260819-2122-tsk397-boundary-report.md` (Opus agent, A:9/B:6/C:4 findings, all applied).
- Prior shipped design this item extends without reversing: `docs/history/fgos-marketing-domain-foundation/CONTEXT.md` (tsk-2t9c — `roleGraph`, `taskSpecMap`, `handoff.mjs`, the sync/async Collaboration model).
- `docs/decisions/0026-vision-orchestrator-roottask-executor-native-vs-cli-spawn.md` — Native-First Dispatch Doctrine this item's own handoff (shaping → exploring → planning) follows.

## User-mandated planning constraints (carry into `fgos-coding-planning`)

Stated directly by the user at handoff time — not optional, not subject to
planning's own discretion:

1. **This is a very large change** (repo-wide core/domain boundary
   reorganization) — the plan must be thorough enough to avoid breaking
   the repo; do not under-scope verify/regression coverage to save time.
2. **Two independent review rounds are required after implementation**,
   not one — plan for both explicitly (who/what runs each, what each is
   checking) before the item is considered done.
3. **Every child item (if planning decomposes into the ~15 §7 candidate
   tasks) merges back to the PARENT** (`fgw/tsk-397`), never directly to
   `main`.
4. **Before `fgw/tsk-397` (the root) itself merges to `main`, tag current
   `main` first** as a rollback point — this is a real repo-wide change,
   the tag is the safety net.
5. **Stop after planning + validating are complete** (item ready to enter
   `executing`) — do not proceed to `fgos-coding-implement` or take any
   executing action without the user's explicit go-ahead.

## Outstanding questions

None
