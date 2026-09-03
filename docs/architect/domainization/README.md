# fgOS Domainization Architecture

Document type: Architecture advisory
Design status: Discussion / Visionary advisory
Implementation: Partial
Last reviewed: 2026-09-03
Canonical for: domainization direction only; owning contracts still live in specs, domain files, and engine contracts
Related: [Component Boundary Advisory](../component-boundary/component-boundary-advisory.md), [System Overview](../../specs/system-overview.md), [Work Item Lifecycle Vision](../../work-item-lifecycle-vision.md), [Work-State Spec](../../specs/work-state.md)

## 1. Purpose

This document records the architecture direction for turning fgOS into a
multi-domain platform without letting domain-specific behavior leak into the
foundation.

Domainization answers a narrower question than the whole-system component map:

```txt
What belongs to core foundation?
What belongs to one domain?
How does core discover and govern domain-provided material?
Which files are authoring sources, and which files are render/runtime targets?
```

It does not define every fgOS component. For the system-level component and
authority map, read [Component Boundary Advisory](../component-boundary/component-boundary-advisory.md).

## 2. Boundary Rule

The core rule is:

```txt
core = closed port, shared by every domain
domains/<name>/ = open adapter, owned by one domain
```

Put a concern in core only when it has the same meaning and is read the same
way across every domain. Put domain-local behavior in `domains/<name>/`, then
let core consume it through a resolver, loader, or explicit contract.

Source placement is not authority. A domain file may be consumed by core, and a
core resolver may normalize domain data, but domain-owned vocabulary and
workflow declarations remain domain-owned.

## 3. Target Domain Shape

A domain is a self-contained authoring unit:

```txt
domains/<name>/
  manifest.yaml
  workflows/*.yaml
  skills/*.md
  task-specs/*.md
  specs/*.md
  knowledge/*.md
  agents/*.yaml
  AGENTS.md
```

The intended domain folder is YAML plus Markdown/prose. Domain authors should
not need to write JavaScript to declare a domain. Core code owns scanning,
parsing, validation, normalization, and runtime projection.

## 4. Concern Placement

| Concern | Core Placement | Domain Placement | Boundary |
|---|---|---|---|
| Work store | One shared fgOS store/event log | Domain identity and domain-local fields | Domains do not get separate fgOS installs or stores. |
| Work fields | Top-level work schema and closed editable field set | `domainFields.<domain>.*` | Top-level fields are platform ports; domain fields are adapter territory. |
| Workflow engine | Domain/workflow resolver and normalized runtime shape | `manifest.yaml` and `workflows/*.yaml` | Core loads and validates; domains declare vocabulary and legal operations. |
| Task-specs | `core/task-specs/` for domain-agnostic skills | `domains/<name>/task-specs/` | Task-spec is executable contract by task kind, not work-item field schema. |
| Skills | `core/skills/` for shared skills | `domains/<name>/skills/` | Authoring source is split; generated skill trees remain render targets. |
| Knowledge | Platform-wide decisions and shared knowledge registries | `domains/<name>/knowledge/` | Knowledge is curated expertise, distinct from raw feature context. |
| Context | `docs/history/<feature>/` | Same shared context location | Context is raw, feature-scoped material; do not tag it as domain knowledge. |
| Doctrine | Root `AGENTS.md` for domain-agnostic doctrine | `domains/<name>/AGENTS.md` | Routing reads domain doctrine after domain resolution. |
| Agent types | `core/agents/` for domain-agnostic agent types | `domains/<name>/agents/` | Location records authorship/flavor, not an execution-use restriction. |
| External render targets | `.agents/skills/`, `.claude/skills/`, `.claude/agents/`, plugin skill trees | None | Render targets keep host-facing shape stable while authoring sources move. |

## 5. Manifest And Workflow Boundary

`manifest.yaml` owns domain-level identity, selector, and policy data:

```txt
roleGraph
worktreeBacked
statusLabels
parkReason
classification
defaultWorkflow
workflowFor
```

`workflows/*.yaml` owns workflow-specific data:

```txt
stages
stepMap
transitions
skillMap
taskSpecMap
legal operations
```

The `workflows` map is not authored. Core derives it by scanning
`domains/<name>/workflows/*.yaml`; the filename is the workflow name.

Core then normalizes author-friendly YAML into the runtime shape consumed by
existing resolver functions such as `getDomain`, `resolveWorkflow`,
`skillForStage`, and future path/bundle resolvers.

The filename is uniform across authored extension kinds. `kind` (for example
`fgos.domain`) selects the schema; it is not encoded in a second filename.
The runtime registry is a derived index built after manifests and workflows
are validated, so authors do not maintain both a manifest and a registry.

## 6. Resolver Boundary

Cross-boundary access should go through resolver functions, not raw path joins
or direct imports of a specific domain file.

Important resolver responsibilities:

- resolve a domain and workflow for a work item;
- resolve a task-spec path from `(domain, specId)`;
- resolve a stage bundle from `(domain, stage, item kind)` into `{skill, taskSpec}`;
- expose role graph and workflow legality without letting callers inspect raw
  YAML layout;
- preserve current runtime signatures where possible while changing the data
  source behind them.

This keeps domain files replaceable and keeps core code from depending on a
particular domain's source layout.

## 7. Doctrine Loading

Root doctrine stays domain-agnostic. Domain doctrine lives at:

```txt
domains/<domain>/AGENTS.md
```

Do not rely on tool-specific automatic discovery of nested `AGENTS.md` files.
The reliable contract is explicit loading: once routing resolves `work.domain`,
it reads `domains/<domain>/AGENTS.md` before handing control to the domain
driver or stage skill.

This mirrors the stage-level bundle rule: routing resolves domain doctrine once
per session; driving resolves skill/task-spec material per stage.

## 8. Skill And Agent Authoring

Skill authoring sources split by ownership:

```txt
core/skills/
domains/<domain>/skills/
```

Existing generated/render targets remain stable:

```txt
.agents/skills/
.claude/skills/
plugins/fgOS/skills/
```

Agent-type authoring follows the same ownership split:

```txt
core/agents/
domains/<domain>/agents/
```

Generated Claude-facing agents still land in one flat `.claude/agents/` target.
Because that render target is flat, agent-type names must be globally unique
across core and every domain. This should be enforced by doctor/setup checks,
not left as a silent overwrite risk.

## 9. Eligibility Boundary

Eligibility should be declared in the direction that minimizes maintenance:

```txt
agent type declares what it has:
  role
  persona / decision boundary
  skills

task-spec declares what it needs:
  agent        # optional explicit pin
  requires-skill
```

Avoid the inverse shape where every agent type lists every task-spec id it can
handle. That creates an N-by-M maintenance problem: adding one task-spec forces
edits across many agent files.

Selection order:

1. `agent` pin on the task-spec wins outright.
2. Without a pin, keep the current agent type when it satisfies
   `requires-skill`.
3. Otherwise choose deterministically from matching agent types by declaration
   order.

The same eligibility mechanism applies to stage-entry work and to declared
collaboration calls. They differ only in which task-spec is being matched.

## 10. Dispatch / Routing / Driving

Domainization uses the existing execution concepts:

```txt
DISPATCH = chooses or validates the persona/executor for a work order
ROUTING = resolves the item's domain and loads domain doctrine
DRIVING = loops through the domain workflow stages
```

Driving should not stop merely because a stage would benefit from a different
persona. The default answer is a synchronous collaboration call through the
declared role graph while the same holder continues driving. Driving stops only
for an interaction that explicitly declares asynchronous handoff, such as a
review gate.

Synchronous collaboration needs a nesting-depth cap, not a lifetime call-count
cap. Sequential sync calls across stages are valid; nested sync calls can loop
and should be bounded.

## 11. Enforcement

Domain boundaries should be mechanically checked where possible:

- core must not import a specific domain directly;
- one domain must not import another domain directly;
- cross-domain/core access should go through core resolvers or data contracts;
- generated render targets should be rebuilt from canonical authoring sources;
- setup/doctor should know about generated skill/agent outputs and uniqueness
  checks;
- task-spec and agent eligibility should fail loud when no valid match exists.

This should reuse the existing architecture-manifest/test approach where
possible instead of introducing a separate package system only for enforcement.

## 12. What Stays Out

Domainization is not a mandate to relocate all core runtime code.

`bin/`, `src/`, and `herdr-plugin/` can remain at top level while still being
core. Moving heavily referenced runtime paths only to make the tree look
symmetrical creates churn without clarifying authority.

Domainization is also not a mandate to make every domain file private to that
domain. A domain-authored skill or agent type may be eligible elsewhere if its
declared capabilities match. File location records ownership and default
flavor; contracts decide legal use.

## 13. Implementation Slices

The domainization material decomposes into these implementation slices:

- split domain declaration into `manifest.yaml` plus `workflows/*.yaml`, with core
  aggregation and normalization;
- move coding task-specs from `docs/task-specs/coding/` to
  `domains/coding/task-specs/`;
- add `resolveTaskSpecPath(domain, specId)`;
- add `bundleForStage(domain, stage, item kind)` returning `{skill, taskSpec}`;
- split skill authoring into `core/skills/` and `domains/<domain>/skills/`,
  then assemble existing render targets;
- split agent authoring into `core/agents/` and `domains/<domain>/agents/`,
  then render the flat `.claude/agents/` target with uniqueness checks;
- move domain-specific doctrine into `domains/<domain>/AGENTS.md` and teach
  routing to read it after domain resolution;
- create `core/task-specs/` for domain-agnostic skills;
- invert eligibility from agent `claims` to agent `skills` plus task-spec
  `requires-skill` / `agent`;
- add a domain-siloing architecture check;
- cap nested sync collaboration depth.

Each slice should leave existing host-facing surfaces stable unless its own
contract explicitly says otherwise.
