# Contract: Instruction Composition And Projection

```txt
Document type: Contract
Audience: Maintainer, component owner, domain owner, implementation agent
Purpose: Define how fgOS instruction fragments compose into effective agent instructions and render into host-visible files
Design status: Draft
Implementation status: Planned
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Architecture discussion
Last reviewed: 2026-09-14
Related:
- docs/platform/packaging-distribution/README.md
- docs/platform/packaging-distribution/spec.md
- docs/platform/packaging-distribution/contracts/skill-package-distribution.md
- docs/platform/packaging-distribution/contracts/projection-ledger.md
```

## 1. Purpose

Instruction composition defines how rules and agent instructions from platform, component, domain, workspace, command, and skill sources become the effective instructions an agent should follow.

Rendering is downstream. The hard contract is composition semantics: order, authority, override rules, conflict handling, and proof that a rule has effect.

## 2. Boundary

| Concern | Owner |
| --- | --- |
| Meaning of a rule or instruction | Owning platform/component/domain |
| Composition engine, registry shape, stale checks, projection health | Packaging-distribution |
| Host-specific file syntax | Host adapter |
| Runtime execution behavior after instructions are read | Owning runtime/workflow component |

Packaging-distribution does not decide whether a component's rule is wise. It decides how registered instruction sources are composed, validated, rendered, and repaired.

## 3. Target Shape

```txt
canonical instruction sources
  -> instruction registry
  -> composition engine
  -> effective instruction set
  -> render adapters
  -> host/workspace projections
```

The composition engine produces the effective instruction set before any Markdown or host-specific file is rendered.

## 4. Source-Of-Truth Rule

Instruction source belongs near the authority that owns the meaning.

`docs/platform/<component>/` is the design/spec/contract surface. Documentation paths such as `docs/platform/<component>/instructions/*.md` (and `docs/platform/**` generally) must never be used as a runtime instruction source. They define architecture contracts and explain rationale, but they are not discovered or loaded by agent runtimes.

Canonical runtime instruction sources live strictly in source-owned authority roots:

```txt
core/instructions/
components/<component>/instructions/
domains/<domain>/instructions/
```

| Instruction type | Canonical source |
| --- | --- |
| Platform law or repo-wide operating rule | Root platform source, root instruction source, or locked platform law document when the law itself is documentary authority |
| Domain doctrine | `domains/<domain>/instructions/` or another domain-owned instruction source |
| Component-specific procedure | `components/<component>/instructions/` or another component-owned source root |
| Skill-specific operating rule | Canonical skill source |
| Host syntax wrapper | Generated adapter target, not canonical source |

Component and domain additions must not hand-edit generated projections directly. They register canonical fragments and let the projection path render the correct host/workspace files.

## 5. Instruction Unit

Each instruction fragment should compile into a machine-readable instruction unit:

```txt
id
owner
sourcePath
scope
kind
mode
appliesTo
specificity
dependsOn?
refines?
supersedes?
conflictsWith?
renderHints?
```

Required meanings:

| Field | Meaning |
| --- | --- |
| `id` | Stable rule id, unique across the effective set unless explicitly superseded. |
| `owner` | Component/domain/platform authority that owns the rule. |
| `scope` | Where the rule applies: repo, domain, component, command, skill, host, or session. |
| `kind` | Rule force: `law`, `boundary`, `procedure`, `host-adapter`, or `preference`. |
| `mode` | Composition operation: `append`, `refine`, `override`, or `forbid`. |
| `appliesTo` | Host/runtime audience filter. |
| `specificity` | Scope distance used after kind and explicit relationships. |

## 6. Rule Force

Composition must classify rule force before sorting by textual order.

| Kind | Rule |
| --- | --- |
| `law` | Cannot be overridden by narrower scopes. It may only be superseded by the required decision/review process for that law. |
| `boundary` | Declares authority. Conflicts fail the composition instead of picking a winner. |
| `procedure` | Default operating procedure. Narrower scopes may refine it if the source permits refinement. |
| `host-adapter` | Describes host syntax or packaging. It cannot change semantic meaning. |
| `preference` | Advisory/default behavior. Narrower scopes may override it. |

Priority numbers may break ties within the same kind and scope. They must not be the primary source of authority.

## 7. Composition Order

The target order is:

```txt
laws
  -> boundaries
  -> procedures from broad to narrow
  -> preferences from broad to narrow
  -> host adapters last
```

Scope specificity, broad to narrow:

```txt
platform/repo
  -> component
  -> domain
  -> workspace/project
  -> command
  -> skill
  -> session
```

Host adapters run last because they translate an already-composed instruction set into host syntax. They must not silently drop or alter semantic rules unless `appliesTo` excludes that host.

## 8. Override And Conflict Rules

Override is valid only when the overridden rule permits it.

Refine is valid when a narrower rule narrows, clarifies, or gives an execution-specific form to a broader procedure without contradicting it.

Composition must fail when:

- two active instruction units share the same `id` without a valid supersession relationship;
- two active `boundary` rules assign incompatible authority;
- a narrower rule attempts to override a `law`;
- a host adapter drops an applicable semantic rule;
- a required dependency is missing;
- two fragments require incompatible ordering and neither declares supersession.

Failing composition is preferable to rendering instructions that look complete but have ambiguous effect.

## 9. Effective Instruction Set

The composition output should be machine-readable before rendering.

Target path shape:

```txt
.fgos/instructions/effective/repo.json
.fgos/instructions/effective/domain-<domain>.json
.fgos/instructions/effective/component-<component>.json
```

Each effective rule should carry provenance:

```json
{
  "id": "docs-only-verification",
  "kind": "procedure",
  "effectiveText": "Docs-only changes may use doc/render checks instead of runtime test suites.",
  "sources": [
    "AGENTS.md",
    "components/packaging-distribution/instructions/verification.md"
  ],
  "refines": ["default-verification"],
  "supersedes": []
}
```

When someone asks why an instruction did or did not apply, the effective set is the debug surface. Rendered Markdown is not the authority for composition.

## 10. Projection Targets

`AGENTS.md` is the primary portable instruction projection when the host supports it.

Host-specific projections are optional adapters:

| Target | Use |
| --- | --- |
| Root `AGENTS.md` | Repo-wide portable instructions. |
| Scoped `AGENTS.md` files | Domain/component/workspace portable instructions. |
| Claude-specific files or plugin text | Only for host syntax, plugin command behavior, or compatibility gaps. |
| Gemini `GEMINI.md` or extension context | Only for extension context, command behavior, or compatibility gaps. |
| Codex/OpenAI adapter files | Only where skill or command packaging needs host-specific structure. |

Do not create `CLAUDE.md`, `GEMINI.md`, or equivalent files merely to duplicate an `AGENTS.md` projection.

## 11. Doctor/Fix Obligations

Before instruction composition becomes a release promise, `fgos doctor` and `fgos doctor --fix` should detect and repair:

- stale generated instruction projections;
- invalid instruction registry entries;
- duplicate ids without supersession;
- illegal override/refine relationships;
- host adapter projections that omit applicable semantic rules;
- generated projections edited by hand when provenance says they are managed.

`fgos doctor` remains read-only. `fgos doctor --fix` may regenerate projections through registered fixes. Current legacy `fgos setup` may consume the same fix path while it remains implemented, but new design should not depend on it.

## 12. Projection Ledger Fit

Instruction projections are host-visible generated files. The long-term projection ledger should record:

- selected runtime identity;
- canonical instruction source;
- effective instruction set digest;
- render adapter;
- destination path;
- repair/overwrite ownership.

Until the ledger exists, docs must mark instruction projection repair as planned.
