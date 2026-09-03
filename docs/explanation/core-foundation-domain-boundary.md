---
authoritative_for: fgOS core/ vs domains/<name>/ architecture split, DISPATCH/ROUTING/DRIVING execution model, eligibility skills-not-claims inversion
---

# `core/` vs `domains/<name>/` — fgOS's own architecture boundary

`tsk-397` (34 locked decisions, 15 implementing children `tsk-397-1`
through `tsk-397-15`) reorganized fgOS's own repo layout along two axes:
**core-foundation** (harness/workflow-mechanics/task-contract/knowledge/
skill/doctrine/agent-type shared by every domain) vs **domain-specific**
(the same six concerns, owned by exactly one domain — `coding` today,
`marketing` following per STR52). This was not the first attempt at this
boundary — prior efforts across the project's life never settled a final
shape; this item locked one.

## Pinned terms

- **core** — the closed port: code/data/prose used identically by every
  domain (`bin/`, `src/`, `herdr-plugin/`, `core/skills/`, `core/agents/`,
  `core/task-specs/`, the domain-agnostic slice of root `AGENTS.md`).
- **domain** (`domains/<name>/`) — the open adapter: everything owned by
  and flavored for exactly one domain. Pure YAML+prose after the
  registry/workflow decisions below — no JS files of its own.
- **task-spec** — the contract-per-task-kind concept (input/output/gates/
  verify-template + Collaboration table) — distinct from a work-item
  field-schema.

## What did NOT move

`bin/`, `src/`, `herdr-plugin/` stay exactly where they are — moving them
would break 881 real references and external installs for zero benefit.
`.agents/skills/`, `.claude/skills/`, `.claude/agents/`, `plugins/fgOS/
skills/` all stay byte-identical render targets; `fgos setup`'s
`materializeSkillsIntoProject` output to external projects is unaffected.
This is a pure internal reorganization — no user-facing behavior change,
no external contract change.

## The end-state shape

`domains/<name>/` is a self-contained, pure YAML+prose folder:
`registry.yaml`, `workflows/*.yaml`, `skills/*.md`, `task-specs/*.md`,
`specs/*.md`, `knowledge/*.md`, `agents/*.yaml`, `AGENTS.md` — zero JS
files. `core/` holds the matching domain-agnostic siblings
(`core/skills/`, `core/agents/`, `core/task-specs/`, `core/skills/
_shared/`). Confirmed live on disk: `core/{agents,coordination-protocols,
skills,task-specs}/` and `domains/coding/{AGENTS.md,harness,registry.yaml,
skills,specs,task-specs,workflows}/`.

## The decisions, grouped by theme

**Data ownership and store (D1–D2).** All domains share ONE fgOS store/
event-log — no per-domain fgOS install. Top-level work-item fields stay a
closed port (`EDITABLE_FIELDS`); `domainFields.<domain>.*` is the only
open per-domain adapter territory.

**Folder structure (D3–D9, D30).** Domain code+skill live in a
self-contained `domains/<name>/` folder — mirroring the real
`plugins/fgOS/` precedent. `workflow-stage-graphs.mjs` becomes a thin
aggregator auto-discovering `domains/*/registry.yaml`, never a
hand-maintained import list. Core (`bin/`, `src/`, `herdr-plugin/`) stays
put (D5). Domain-knowledge (curated) lives at `domains/<name>/knowledge/`,
distinct from `docs/history/` (raw context, unchanged, shared). Canonical
skill authoring moves to `core/skills/` + `domains/<name>/skills/`; the
three existing skill trees become pure render targets via a new assembly
step. `docs/specs/` (12 platform files) stays unchanged; only
`domains/<name>/specs/` is new. `docs/task-specs/coding/*.md` moves to
`domains/coding/task-specs/`. After D29, a domain folder is 100%
YAML+prose, zero JS.

**Execution model (D10, D13–D14, D25).** A three-layer DISPATCH (resolves
persona once) → ROUTING (`fgos-routing`, resolves machinery once/session)
→ DRIVING (`fgos-<domain>-driving`, loops stages, same persona) model —
all already-shipped mechanisms, no new concepts (D21, "CASTING" naming
proposal retracted). `bundleForStage(domain, stage)` returns
`{skill, taskSpec}` together at the DRIVING layer, closing hardcoded
task-spec path citations that used to live in skill prose. Driving never
hard-stops for an implicit stage-persona need — resolves via the same
sync team-collaboration mechanism already shipped (`handoff.mjs`); only
an explicitly-declared async interaction stops driving.

**Eligibility inversion (D11, D20, D22, D26, D32).** The previously
shipped `claims` model (agent declares what task-specs it claims) is
**reversed**: an agent-type now declares role+persona intent plus
`skills` (what it *has*); a task-spec declares `agent`/`requires-skill`
(what it *needs*). One unified eligibility-check mechanism covers both
stage-entry (primary role) and Collaboration-row calls (secondary role).
Multi-match tie-break order: explicit `agent:` pin wins outright >
currently-running agent-type if it qualifies > deterministic declaration
order — never random, never silently ambiguous.

**Doctrine and agents (D16, D23–D24, D33–D34).** `roleGraph` role
`human-advisor` renamed to `advisor`. Doctrine goes domain-scoped:
`domains/<name>/AGENTS.md` (same file type as root `AGENTS.md`, narrower
scope) — root keeps only genuinely domain-agnostic doctrine;
`fgos-routing` reads the domain's own `AGENTS.md` once domain resolves
(explicit `Read`, never a static `@import`). `agents/*.yaml` splits into
`core/agents/` (domain-agnostic) + `domains/<name>/agents/`
(domain-flavored). Agent-type names must be globally unique across
`core/agents/` + every `domains/*/agents/` — enforced by a new doctor
check, since the flat `.claude/agents/` render target would otherwise
silently overwrite on collision. `executor-dispatch-fallback.md` moves to
`core/skills/_shared/`.

**Workflow authoring (D18–D19, D29–D31).** `domains/<name>/workflows/
<name>.yaml` is the home for workflow definitions — ALL workflows
(including `feature`) become real independent files, dissolving an
earlier reference-sharing discipline that becomes moot once there's only
one copy. The `workflows` map is synthesized by core's aggregator
(directory scan, never hand-authored); `defaultWorkflow`/`workflowFor`
are real domain-level selector data in `registry.yaml`.

**Cross-cutting guards (D12, D17, D27–D28).** `architecture-manifest.json`
+ `architecture.test.mjs` gain a domain-siloing rule (core never imports a
specific domain; domains never import each other) — reusing the existing
one-directional-layer mechanism. `core/task-specs/` holds contracts for
the 7 domain-agnostic skills (previously undocumented, blocking the
eligibility match for them). `handoff.mjs`'s `callstackCap` gap resolved:
caps nested sync depth only — sequential/sibling sync calls over a
driving loop's lifetime stay uncapped.

## Where to look for detail

`docs/history/core-foundation-domain-boundary/DISCUSSION.md` §4 (decision
table) and §5 (Q&A log) carry the full round-by-round rationale and scout
evidence behind every D-ID above — this doc summarizes at implementation
altitude, not a substitute for that record.
