# Documentation System Discussion

```txt
Document type: Discussion scratchpad
Design status: Discussion
Implementation: N/A
Last reviewed: 2026-09-13
Canonical for: nothing
```

This file is a temporary working note for redesigning the fgOS documentation
system. It is intentionally disposable.

Use this file to keep active discussion, open questions, candidate rules,
placement ideas, and decisions that are not ready to become canonical. When a
point becomes clear and accepted, move it into the correct canonical document
and remove it from this scratchpad.

Do not use this file as design authority, runtime instruction, or product
documentation.

## Current Goal

Make the system-design documentation complete but simple, clear, and easy to
understand.

The redesign should produce two durable outcomes:

- a documentation placement map that defines where each kind of document lives;
- a writing/governance mechanism that defines document types, structure,
  audience, purpose, authority, and lifecycle.

## Working Observations

- The current repo has many generated or work-produced documents spread across
  several locations.
- `docs/specs/reading-map.md` is useful for agent orientation, but it has grown
  into a long inventory that mixes navigation, implementation map, history, and
  source pointers.
- `docs/architect/` is the active area for rewriting the system design docs.
- `docs/architect/agent-coordination/` already has the strongest shape:
  `vision`, `vocabulary`, `architecture`, `contracts`, `decisions`,
  `proposals`, `roadmap`, `verification`, `playbooks`, and `history`.
- `docs/architect/agent-coordination/documentation-governance.md` is a good
  candidate model for a broader documentation governance rule.
- The larger problem is not only document placement. Each artifact also needs a
  clear audience and purpose.
- Provenance is not uniformly declared today. Some generated artifacts declare
  their generator clearly (`docs/doc-registry.md`, `docs/decisions/index.md`,
  `docs/ui-spec/generated/*`), but many hand-written discussion/design/history
  files can only be classified by path conventions and local context.
- Known generated/projection sources found during scan:
  - `fgos doc-registry` writes `docs/doc-registry.md` and
    `docs/doc-registry.json`.
  - `fgos decision-index` writes `docs/decisions/index.md`.
  - `fgos docs-index` writes `docs/enduser-docs-index.json`.
  - `ui-spec-tools/build.mjs` writes `docs/ui-spec/generated/*`.
  - setup/projection scripts generate skill/agent wrapper surfaces such as
    `.agents/skills/**` and plugin skill mirrors.
- `docs/specs/**` investigation result:
  - No current source/code path was found that deterministically regenerates
    all `docs/specs/*.md` from another source, unlike `doc-registry`,
    `decision-index`, `docs-index`, or `ui-spec/generated`.
  - The files are hand/agent-curated area specs and reading maps, updated by
    scribing/sync/realignment work and committed in git.
  - Some architecture docs call them "generated specs" or "generated/curated
    state"; current evidence suggests this means "spec projection/state layer
    maintained through an owning workflow", not "machine-generated output that
    must never be hand-edited".
  - `docs/specs/reading-map.md` is explicitly hand map-like: it has no
    frontmatter and historical scribing guidance says the reading map is
    hand-written / "a map, not documentation".
  - `docs/specs/*` should therefore be classified as `curated spec-state` or
    `hand/agent-curated living spec`, not as `generated artifact`.
- Open provenance gap: hand-authored-by-discussion, generated-by-agent,
  generated-by-tool, migrated, promoted, and historical evidence are not
  consistently machine-declared across all docs.

## Candidate Principle

Every maintained documentation artifact should state:

- who uses it;
- what decision, action, or understanding it supports;
- whether it is authority or only supporting material;
- when to use it;
- when not to use it.
- what wrote it or is allowed to write it.

Human presence principle:

- The folder structure, document structure, and writing style must help a human
  reader understand the system and participate in decisions with agents.
- Documentation quality is not only measured by whether an agent can route,
  execute, or verify work. It is also measured by whether a person can enter the
  material, read the current shape, review trade-offs, and approve or challenge
  an agent's recommendation.
- If the design optimizes for agent consumption while making human review
  spatially confusing, too fragmented, or too procedural to read, system quality
  degrades.
- Therefore every canonical system area should expose:
  - a human-readable portal;
  - a concise current-state summary;
  - visible open questions and decision points;
  - clear separation between accepted truth, proposal, evidence, and history;
  - enough rationale for a person to challenge the direction without needing
    chat history.

Working discussion rule:

- When a question is uncertain, high-impact, or would benefit from independent
  critique, consult an independent GPT-5.6-style reviewer before presenting a
  firm recommendation. Record the uncertainty and the resulting rationale here
  when it affects the documentation-system design.

Candidate required header fields:

```txt
Document type: <type>
Audience: <audience>
Purpose: <purpose>
Design status: Discussion | Proposed | Accepted | Superseded | N/A
Implementation: Not started | Partial | Implemented | Verified | Drifted | Active | N/A
Last reviewed: YYYY-MM-DD
Canonical for: <subject or "nothing">
Use this when: <short rule>
Do not use this for: <short rule>
```

## Candidate Document Types

These are not final.

| Type | Main audience | Purpose | Authority |
|---|---|---|---|
| Vision | human architect, product owner, agent | preserve product identity and boundaries | Yes |
| Architecture | architect, implementer, reviewer, agent | explain responsibilities, boundaries, flows, and invariants | Yes |
| Contract | implementer, tests, runtime adapter, agent | define exact schema, behavior, state, or interface rules | Yes |
| Doctrine | agent, reviewer, maintainer | guide judgment where exact contracts are too narrow | Yes, but below contract |
| Agent instruction | agent runtime/session | tell an agent how to execute a specific workflow or capability | Execution authority only |
| Playbook | human or agent operator | run a manual procedure, bootstrap, or fallback | Operational only |
| Proposal | architect, decision maker | discuss an option before acceptance | No |
| ADR | architect, reviewer, future maintainer | record one accepted or rejected decision | Yes for accepted decisions |
| Roadmap | maintainer, implementer | sequence implementation work | No new design authority |
| Verification | reviewer, agent, maintainer | preserve proof, tests, traces, and evidence | Evidence, not design authority |
| History | future maintainer | preserve old rationale and source material | No |
| End-user docs | fgOS user | teach, guide, explain, or provide reference | User-facing, not system-design authority |
| Knowledge | agent, maintainer | preserve retrospective learning | Memory/evidence, not direct authority |

## Candidate Writer Types

These are not final. Writer type is a separate axis from document type.

| Writer type | Meaning | Typical artifacts | Hand-edit policy |
|---|---|---|---|
| Human author | A person intentionally writes or edits the document. | vision notes, decisions, discussion outcomes | editable by people |
| Human + agent coauthor | A person and an agent shape the document through discussion. | design discussion, architecture drafts, governance drafts | editable, but preserve settled rationale |
| Agent draft writer | An agent creates a draft for review, not automatically canonical. | proposals, reports, draft docs | editable/promotable after review |
| Runtime generator | A command deterministically writes a projection from source state. | `docs/doc-registry.md`, `docs/decisions/index.md`, `docs/enduser-docs-index.json` | do not hand-edit; change source or generator |
| Build generator | A build/spec tool writes derived artifacts from source files. | `docs/ui-spec/generated/*` | do not hand-edit; edit source surfaces/config |
| Migration script | A script moves or rewrites existing docs as part of a controlled migration. | `docs/knowledge/**` migration outputs, registry path moves | edit only through migration protocol while active |
| Execution worker | A doer/reviewer/red-team/panel run writes evidence or reports. | `plans/**`, `verification/**`, report files | evidence; do not silently rewrite after use |
| Mirror/projection writer | Setup/projection materializes runtime instruction copies from authoring sources. | `.agents/skills/**`, plugin skill mirrors | edit source, not generated mirror |
| Registry/event writer | fgOS event/state layer records facts that later projections read. | `.fgos` state/log, projected indexes | not a markdown author; source-of-truth writer |

Open issue:

- Should writer type be a required metadata field on every document, or should
  it be inferred from path unless a file overrides the default?

## Candidate Distinctions

### Prose

`Prose` is a writing format, not a sufficient document type.

Prose can carry a vision, doctrine, proposal, architecture explanation,
playbook, or agent instruction. Therefore, if `prose` remains in the vocabulary,
it should describe expression style rather than authority.

### Doctrine

Doctrine is durable judgment guidance. It should be used when the system needs
agents or humans to make consistent calls in situations that cannot be fully
encoded as contracts.

Doctrine must not silently override a contract.

### Agent Instruction

Agent instruction is execution guidance for an agent in a specific context,
workflow, skill, or capability.

Agent instruction may be more operational and change more frequently than
doctrine. It should not become product architecture by accident.

### Contract

Contract is exact behavior that consumers must obey and tests can verify.

When a contract and prose disagree, the contract should win unless an accepted
decision explicitly changes it.

### Architecture

Architecture explains durable boundaries, responsibilities, component
relationships, and invariants. It should explain why contracts belong where
they do, but should not duplicate every schema field.

## Candidate Placement Map

This is a draft, not a final rule.

| Location | Candidate role |
|---|---|
| `docs/architect/**` | system design for humans and agents who need to understand or change fgOS architecture |
| `docs/architect/<area>/README.md` | portal and reading path for one design area |
| `docs/architect/<area>/vision.md` | highest-level identity and boundary for one design area |
| `docs/architect/<area>/vocabulary/` | canonical terms for one design area |
| `docs/architect/<area>/architecture/` | accepted boundaries, responsibilities, flows, and invariants |
| `docs/architect/<area>/contracts/` | accepted exact behavior, schema, state, evidence, and interface rules |
| `docs/architect/<area>/decisions/` | ADRs for accepted or rejected durable decisions |
| `docs/architect/<area>/proposals/` | non-canonical drafts and alternatives |
| `docs/architect/<area>/roadmap/` | implementation sequence and rollout plan |
| `docs/architect/<area>/verification/` | proof, test evidence, live traces, review, red-team reports |
| `docs/architect/<area>/playbooks/` | manual/bootstrap/fallback operating procedures |
| `docs/architect/<area>/history/` | non-canonical archived source material |
| `docs/specs/**` | BA/state/behavior specs; relationship to `docs/architect/**` still needs to be settled |
| `domains/**/AGENTS.md` | domain doctrine loaded by agents |
| `domains/**/skills/**/SKILL.md` | domain agent instruction for executable workflows |
| `.agents/skills/**/SKILL.md` | installed agent instruction surface |
| `docs/how-to/**` | end-user task guidance |
| `docs/reference/**` | end-user lookup/reference |
| `docs/tutorials/**` | end-user learning path |
| `docs/explanation/**` | end-user conceptual explanation |
| `docs/knowledge/**` | retrospective learning and accumulated lessons |
| `docs/history/**` | non-canonical archive and discussion history |
| `plans/**` | implementation track plans and execution evidence |

## Open Questions

- If a future human-first root such as `docs/system/` exists, what other
  top-level documentation spaces should sit beside it?
- Should `docs/architect/` become the official root for all system-design docs,
  or should a new `docs/design/` root be introduced?
- What is the final relationship between `docs/specs/**` and
  `docs/architect/**`?
- Are specs a contract-like layer, a BA state layer, or a legacy mixed layer
  that should be gradually split?
- Should documentation governance be global under `docs/architect/`, or should
  each area keep its own governance file?
- What is the minimal required metadata set that is useful without creating
  bureaucratic noise?
- Should every document declare `Audience` and `Purpose`, or only maintained
  design documents?
- What is the exact authority order across Vision, ADR, Contract, Architecture,
  Doctrine, Agent Instruction, Proposal, Verification, and History?
- Where should generated documentation live?
- How should generated files declare their source and regeneration command?
- Which documents are meant for human reading, agent loading, runtime execution,
  or end-user learning?
- How should `docs/knowledge/**` be used without becoming a second design
  authority system?
- Should `plans/**` stay outside `docs/`, or should selected plan outputs be
  promoted into `verification/` or `history/`?
- Should old documents be moved, relabeled, indexed, or left in place with
  clearer frontmatter?
- What is the deletion/archive policy for temporary discussion files like this
  one?

## Things To Chốt

- Final document type vocabulary.
- Final audience vocabulary.
- Final purpose vocabulary.
- Final writer type vocabulary.
- Final authority order.
- Final placement map.
- Final required metadata/header.
- Promotion rule from proposal/discussion into canonical docs.
- Rule for generated docs.
- Rule for provenance/source declaration: generated automatically, hand-authored
  discussion, agent-produced draft, promoted canonical content, migrated file,
  or evidence/log artifact.
- Rule for proof/evidence placement.
- Rule for doctrine versus agent instruction.
- Rule for end-user docs versus system-design docs.
- Migration strategy for existing `docs/specs`, `docs/history`,
  `docs/knowledge`, `docs/architect`, and `plans`.

## Discussion Log

### 2026-09-13 — Brainstorm: Spec Khác Architecture Như Thế Nào?

Prompt under discussion:

> Cần brainstorm để quyết định `spec` và `architecture` khác gì nhau.

Current framing:

- Both can be canonical.
- Both can mention boundaries, behavior, entities, and decisions.
- The useful distinction cannot be "technical vs non-technical" or "high-level
  vs detailed" only, because some specs are high-level and some architecture
  docs carry detailed boundaries.

Candidate distinction axes:

1. **Question answered**
   - Architecture answers: "What shape should the system have, and why are the
     boundaries here?"
   - Spec answers: "Given the accepted shape, what behavior/state/interface
     must a reader or implementer observe?"
2. **Primary reader mode**
   - Architecture is read to decide, review, redesign, or understand tradeoffs.
   - Spec is read to implement, verify, maintain, or rebuild current behavior.
3. **Time orientation**
   - Architecture may include direction, constraints, alternatives, proposed
     boundaries, and accepted design.
   - Spec should describe the current accepted/live behavior or explicitly mark
     gaps.
4. **Authority shape**
   - Architecture owns rationale, responsibility boundaries, component shape,
     and design invariants.
   - Spec owns area facts: entry points, data dictionary, behaviors,
     business rules, actors, edge cases, open gaps, and pointers.
5. **Change mode**
   - Architecture can move faster during design churn under `docs/architect/`.
   - Spec should update after decisions settle, through an owning sync workflow,
     so it remains a stable read-first surface.
6. **Proof expectation**
   - Architecture is validated by coherence, ADRs, design review, and proof
     plans.
   - Spec is validated by alignment with implemented behavior, tests, contracts,
     or explicitly named open gaps.

Candidate concise rule:

- Architecture is the **why/shape/boundary layer**.
- Spec is the **current behavior/state/reference layer**.

Potential authority rule:

- If a question is about component responsibility or accepted design direction,
  start with architecture.
- If a question is about how the system currently behaves, what data means, or
  what an implementer must preserve, start with spec.
- If they disagree, the disagreement is drift; neither silently overwrites the
  other. Use status/provenance:
  - accepted architecture may define the intended correction;
  - current spec may define current implemented behavior;
  - a migration/verification item reconciles them.

Open risk:

- If `spec` becomes a dump for all settled architecture narrative, it will grow
  into unreadable history.
- If `architecture` keeps settled behavior forever, specs become stale and
  agents miss the current source of behavior truth.

Settled direction:

- The distinction is accepted, but `spec` and `architecture` should not present
  as two equal top-level truths. That would confuse readers and agents.
- Need a hierarchy where one top-level documentation system explains which door
  to use:
  - `docs/doc-governance.md` owns the taxonomy and route rules;
  - `docs/reading-map.md` tells what to read first;
  - `docs/architect/**` is the design/decision/boundary workspace;
  - `docs/specs/**` is the stable current behavior/state reference layer.
- Open design choice: whether the top-level portal should route by task
  ("understand design", "implement behavior", "verify", "operate") rather than
  by directory name.

Human navigation objection:

- Relying on readers to pass through `doc-governance.md` or `reading-map.md`
  first is not enough.
- Human readers scan spatially: directory names, grouping, and relative
  placement must make the relationship obvious even before governance is read.
- Therefore the final structure must be legible from the tree itself. Governance
  can define the rule, but the folder layout must visually encode it.
- The next design needs an information architecture that makes `architecture`
  and `spec` visibly related without making them look like two unrelated
  top-level truths.

Follow-up question:

> Ngoài `system` sẽ có cái gì?

Candidate answer:

- `system` should not become the whole `docs/` universe. It should contain the
  documentation needed to understand, change, verify, and operate fgOS itself as
  a system.
- Other top-level spaces should be named by reader intent / artifact nature, so
  a human scanning the tree can tell whether they are reading:
  - stable system truth;
  - user-facing guidance;
  - generated projections;
  - execution evidence;
  - historical/archive material;
  - agent runtime instructions.
- Candidate sibling spaces to discuss:
  - `docs/system/` — maintained system knowledge: areas, architecture, specs,
    contracts, verification, operations, decisions relevant to fgOS internals.
  - `docs/user/` or existing Diataxis-style `docs/how-to`,
    `docs/reference`, `docs/explanation`, `docs/tutorials` — user-facing fgOS
    product documentation.
  - `docs/generated/` or explicit generated subtrees — deterministic
    projections such as registries, indexes, UI spec outputs.
  - `docs/history/` — archive, migrations, retired source material, discussion
    history that is no longer authority.
  - `docs/knowledge/` — retrospective/learning captures, if kept distinct from
    system authority.
  - `plans/` — execution plans and work evidence, likely outside `docs/`
    unless promoted into `docs/system/.../verification`.
  - `domains/` and `.agents/skills/` — agent doctrine/instruction surfaces,
    probably not moved under `docs/` because they are loaded/executed by
    runtime workflows, but must be governed by the documentation taxonomy.

Open design tension:

- A clean human tree wants fewer roots.
- Runtime/generated surfaces sometimes need to stay where tools already expect
  them.
- Therefore the governance may need to distinguish "documentation space" from
  "physical source path": some governed artifacts live outside `docs/`.

Follow-up question:

> Có tên nào khác phù hợp hơn `system`?

Candidate root names:

| Name | Strength | Risk |
|---|---|---|
| `system` | Plain, broad, matches "system design"; can contain both spec and architecture without privileging either | May sound too generic; could be confused with OS/runtime system only |
| `product` | Emphasizes fgOS as a product used by others, not only internal architecture | Specs/architecture/contracts may sound less naturally placed under it |
| `platform` | Strong fit for fgOS as a platform layer; concrete and mission-aligned | Could blur with product marketing/user docs; not every internal area feels "platform" |
| `core` | Short, signals internals | Too narrow; may imply only core package, not distribution/skills/operations |
| `design` | Directly names architecture/design intent | Makes specs feel secondary again; risks recreating `architect` under a new name |
| `engineering` | Signals implementation-facing maintained knowledge | Too team/process-oriented; less friendly to product/BA/state specs |
| `internals` | Clear distinction from user docs | Sounds like code internals, not product/system behavior; less inviting |
| `foundation` | Resonates with platform foundations and durable laws | Abstract; may be unclear as a navigation root |
| `operating-model` | Good for workflows/agent operations | Too narrow for specs/contracts/architecture |

Current leaning:

- `platform` may be the most fgOS-specific name.
- `system` may be the clearest general name.
- `design` is not preferred because it makes `spec` feel like a guest under a
  design/architecture umbrella.
- If the root must contain `spec`, `architecture`, `contracts`,
  `verification`, and `operations` as peers under each area, the name should not
  imply only design narrative.

Follow-up question:

> Có cần thêm `areas/` không, hay dùng trực tiếp `<area>` dưới root?

Candidate shapes:

```txt
docs/platform/
  areas/
    runner/
    distribution/
  shared/
  README.md
```

versus:

```txt
docs/platform/
  runner/
  distribution/
  shared/
  README.md
```

Trade-off:

- Keeping `areas/` makes it explicit that `runner`, `distribution`, etc. are
  system/product areas, while other root children such as `shared/`,
  `governance/`, `generated/`, or `README.md` are not areas.
- Removing `areas/` makes the tree shorter and more direct for human scanning.
- If the root is dedicated only to maintained platform/system docs, direct
  `<area>` folders may be clear enough.
- If the root also contains many non-area support folders, `areas/` prevents
  mixing first-class areas with meta/support material.

Current leaning:

- Prefer direct `<area>` folders if the root can stay clean and dedicated:

  ```txt
  docs/platform/
    runner/
    distribution/
    work-state/
    shared/
  ```

- Use `areas/` only if the root becomes crowded with many non-area siblings.

Settled direction for now:

- Do not add an `areas/` layer initially.
- Use direct area folders under the maintained platform/system root:

  ```txt
  docs/platform/<area>/
  ```

- This keeps spatial navigation short and makes the area the first visible
  organizing unit for human readers.
- `areas/` remains an escape hatch only if `docs/platform/` later becomes too
  crowded with non-area support folders.

Candidate full tree to refine:

```txt
docs/
  README.md
  doc-governance.md
  reading-map.md
  templates/

  platform/
    README.md
    shared/
    runner/
    distribution/
    work-state/
    agent-coordination/
    skills/
    setup-doctor/
    ui-spec/

  user/
    README.md
    tutorials/
    how-to/
    reference/
    explanation/

  generated/
  knowledge/
  history/
```

Per-area target:

```txt
docs/platform/<area>/
  README.md
  spec.md
  architecture/
  contracts/
  decisions/
  verification/
  operations/
  proposals/
  history/
```

Governed external surfaces:

```txt
domains/
.agents/skills/
plugins/fgOS/skills/
plans/
```

### 2026-09-13 — Next Discussion: Per-Area Minimum Shape

Prompt:

> Ok, tiếp tục.

Next design question:

- Once the target root is `docs/platform/<area>/...`, what is the minimum
  required shape of one area?

Candidate minimum:

```txt
docs/platform/<area>/
  README.md
  spec.md
  architecture/
  contracts/
  decisions/
  verification/
```

Candidate optional folders:

```txt
  operations/
  playbooks/
  proposals/
  history/
  generated/
```

Candidate semantics:

- `README.md` is the area portal. It says what the area owns, what to read first,
  and which docs are canonical.
- `spec.md` is the current state/behavior reference for the area.
- `architecture/` contains why/shape/boundary/rationale documents that are too
  broad or too design-oriented for `spec.md`.
- `contracts/` contains exact interfaces, schemas, state machines, or behavioral
  rules that tests/implementers can verify.
- `decisions/` contains accepted/rejected durable decisions local to the area.
- `verification/` contains proof, test evidence, traces, review/red-team
  results, and conformance reports.
- `operations/` contains runbooks and maintenance/diagnostic procedures.
- `playbooks/` contains human/agent procedures that are reusable but not exact
  contracts.
- `proposals/` contains non-canonical alternatives and design drafts.
- `history/` contains archived source material, old discussions, migrated
  context, and retired docs.
- `generated/` exists only for area-local generated projections.

Open design question:

- Should empty optional folders be created for every area, or only created when
  the first document of that type exists?

Current leaning:

- Create only required files/folders for every area.
- Create optional folders on demand.
- The `README.md` template should list which optional sections are expected and
  where they will appear when present, so humans still know the shape without
  seeing a forest of empty directories.

### 2026-09-13 — Candidate Area README Template

Purpose:

- The area `README.md` is the human-first portal for one platform area.
- It must let a stranger human understand what the area owns, what to read
  first, what is settled, what is open, and where to join a decision.
- It should also give agents deterministic routing without becoming an
  agent-only instruction file.

Candidate sections:

```txt
# <Area Name>

Document type: Area portal
Audience: Human reviewer, architect, implementer, agent
Purpose: Enter this area, understand ownership, choose what to read next
Design status: Accepted
Implementation: Active
Last reviewed: YYYY-MM-DD
Canonical for: <area navigation and ownership>
Use this when: You need to understand or change <area>
Do not use this for: Exact behavior details or historical rationale

## What This Area Owns

Short prose summary of the boundary.

## Read First

1. `spec.md` for current behavior/state.
2. `architecture/...` for why/shape/boundaries.
3. `contracts/...` for exact interfaces or state rules.
4. `verification/...` for proof/evidence.

## Current Shape

Concise human summary of the live model.

## Decision Surface

What is settled, what is open, and where a person should review/challenge.

## Canonical Documents

Table mapping doc purpose to local path and authority.

## Related Areas

Cross-area dependencies and shared contracts.

## Maintenance Notes

Who/what updates this area, generated sources if any, and review cadence.
```

Candidate rule:

- `README.md` should be short enough to read in one sitting.
- It should not duplicate `spec.md` or architecture docs.
- Its job is orientation and participation, not exhaustive content.

Open design question:

- Should `Decision Surface` be required in every area portal, or only in areas
  with active design churn?

Current leaning:

- Require it, even if it says "No active open decision." This keeps human review
  and agent decision points visible.

### 2026-09-13 — Frameworks And Recent Good Writing Patterns

Prompt:

> Có nên áp dụng các framework như Diataxis hoặc Google OKF giúp nâng chất lượng
> tài liệu. Các tài liệu viết gần đây về confinement authority và
> runtime-recovery có một số phần viết tốt, nên đọc sơ và xem cấu trúc có gì hay.

External framework scout:

- Diataxis is useful for user-facing docs because it separates four user needs:
  tutorial, how-to, reference, and explanation. It should remain the primary
  shape for `docs/user/**`, not the full shape of system-design docs.
- Google developer documentation style is useful as a writing style reference:
  clear, consistent, audience-first, project-specific guidance first, style
  guide second, and clarity over rigid rule-following.
- OKF is useful for human+agent knowledge portability: markdown files, typed
  frontmatter, an index/entry point, and git-native review. It should influence
  metadata/indexing and validation, but not replace fgOS's own document type and
  authority taxonomy.

Local pattern scout:

- `docs/specs/confinement-authority.md` has strong structure:
  - explicit status block at the top;
  - numbered architecture decision;
  - "why this matters" subsection;
  - historical problem table mapped to settled solution;
  - goals and non-goals;
  - threat model matrix;
  - component boundary with owns/does-not-own;
  - canonical contract section.
- `docs/architect/agent-coordination/architecture/runtime-recovery-design.md`
  has strong structure:
  - precise `Design status` / `Implementation` warning;
  - reading order;
  - identity table;
  - ownership and dependency diagram/table;
  - recovery choice matrix;
  - explicit "not a checkpoint" concept section;
  - concurrency/durability rules;
  - agent-facing contract;
  - compatibility/rollout slices;
  - proof matrix.
- `run-handle.md` and `coordination-continuation-recovery.md` are good examples
  of companion contract docs:
  - they state what they own and do not own;
  - they decompose identity/facts, transitions, ports, outcomes, guard sequence,
    snapshot, typed plan, and apply rules;
  - they avoid pretending a lower-level runtime fact has higher-level authority.

Recommendation:

- Do not adopt any outside framework wholesale as the system-design structure.
- Adopt a layered house style:
  - Diataxis for `docs/user/**` document purpose.
  - Google style as editorial quality guidance.
  - OKF-inspired typed metadata, index/entry points, and validation for
    human+agent-readable knowledge.
  - fgOS-native authority/provenance taxonomy for system docs.
  - Confinement/runtime-recovery local patterns as templates for area specs,
    architecture entries, and detailed contracts.

Candidate system-design template ingredients to preserve:

- Status/implementation block at the top.
- Scope and reading order.
- Identity/ownership table.
- Owns / does-not-own boundary.
- Current behavior/state for specs.
- Goals and non-goals for design entries.
- Decision surface: settled/open/review-needed.
- Contract/schema section only when exact behavior is being defined.
- Proof matrix or verification pointers.
- Rollout/compatibility only when the design is not fully implemented.

Open design question:

- Should `docs/doc-governance.md` explicitly name these adopted influences
  (Diataxis, Google style, OKF-inspired metadata), or keep them implicit and
  only define the fgOS house style?

Current leaning:

- Name them explicitly but subordinate them:
  - "Inspired by / compatible with", not "fgOS implements framework X".
  - This prevents future writers from forcing every system-design doc into
    tutorial/how-to/reference/explanation or OKF's generic type list.

### 2026-09-13 — Independent Reviewer Pass Before Locking

Prompt:

> Tự thảo luận với agent khác về cấu trúc tài liệu một lần trước khi chốt, xem
> có ideas gì khác không.

Dispatch notes:

- `advise` through the default `claude-bwrap` executor was refused by provider
  weekly quota.
- `codex-bwrap` succeeded through Dispatch Control Plane and returned an
  independent documentation-architecture critique. No files were edited by the
  dispatched reviewer.

Independent reviewer summary:

- The direction is strong:
  - separates user learning from platform/system truth;
  - keeps specs and architecture close within each area;
  - avoids an unnecessary `areas/` wrapper.
- Main risks are governance risks rather than folder-name risks.

Strongest critique:

1. There is no explicit home for cross-area truth. Platform laws, system-wide
   architecture, shared contracts, and decisions spanning multiple areas could
   be forced into an arbitrary area or duplicated.
2. `README.md`, `spec.md`, `architecture/`, `contracts/`, and `decisions/`
   need a sharp authority matrix, otherwise the same fact will drift across all
   of them.
3. Root-level and area-local `history`, `generated`, and `knowledge` can become
   ambiguous catch-alls unless lifecycle, retention, generator, freshness, and
   do-not-edit rules are explicit.
4. The human presence principle needs concrete obligations:
   - what requires human review;
   - where open decisions are visible;
   - how dissent is recorded;
   - how agents cite provenance and uncertainty.
5. Governed external surfaces (`domains/`, `.agents/skills/`,
   `plugins/fgOS/skills/`, `plans/`) need docs-visible ownership/index rules,
   otherwise they become a parallel documentation system.
6. Per-area trees should not be over-templated; absence should be meaningful,
   and small/young areas should not need empty optional folders.

Alternative proposed by reviewer:

```txt
docs/
  platform/
    README.md
    system/
    <area>/
```

Meaning:

- keep `docs/platform/<area>/...` direct;
- do not introduce `areas/`;
- add a small `docs/platform/system/` home for cross-area truth:
  platform-wide architecture, laws, shared contracts, and system decisions.

Reviewer recommendations before locking:

- Publish a one-page authority matrix in `docs/doc-governance.md`.
- Define an area registry, human-readable first and optionally
  machine-readable, with area purpose, owner, lifecycle, README, key contracts,
  and external surfaces.
- Make `current`, `proposed`, `superseded`, `historical`, and `generated`
  first-class lifecycle/provenance states.
- Require each area README to answer L5-style questions in human language:
  purpose, current state, read-first, active decisions/open questions, key
  contracts, proof, and participation path.
- Define cross-area contract ownership: one canonical location, named consumers,
  compatibility/version rules, and links from participating areas.
- Keep user docs curated under Diataxis, but bridge user-facing claims back to
  authoritative platform/reference material.
- Add a migration policy before moving old docs: redirects/stubs, provenance,
  and classification of each legacy doc as current truth, historical evidence,
  or generated projection.

Impact on current direction:

- Keep the direct-area root:

  ```txt
  docs/platform/<area>/
  ```

- Earlier candidate was to add a reserved cross-area home:

  ```txt
  docs/platform/system/
  ```

- Do not lock the migration until these two governance pieces are defined:
  authority/provenance matrix and area registry.

User follow-up:

> Nếu hỏi như vậy thì trong bộ tài liệu chúng ta có 2 tài liệu quan trọng là
> vision toàn hệ thống cần keep track và bộ component boundary cũng cần keep
> track.

Implication:

- Cross-area living authority must be tracked deliberately.
- However, calling the cross-area home `system/` may make it look like another
  area beside `runner`, `distribution`, and `work-state`.
- If a human later scans the tree, `system/` can become indistinguishable from
  the area folders. This weakens the area-first spatial model.

Revised candidate: place cross-area platform authority directly under
`docs/platform/`, not under `docs/platform/system/`.

```txt
docs/platform/
  README.md
  vision.md
  platform-foundations.md
  architecture-map.md
  component-boundary.md
  contracts/
    routing-handoff-contract.md
  decisions/
  verification/
  history/

  runner/
  distribution/
  work-state/
```

Open naming/detail:

- Should `component-boundary` remain a full sub-area under
  `docs/platform/component-boundary/`, or become a system-wide architecture doc
  under `docs/platform/component-boundary.md` or
  `docs/platform/architecture/component-boundary.md`?
- Settled: `component-boundary` is a system architecture document, not an area.
  It gives a whole-system view of:
  - layers;
  - parent components;
  - child components;
  - each part's responsibility;
  - component and authority boundaries.
  It should live directly under the cross-area platform authority layer, not
  under an area-like `system/` folder.

Candidate rule:

- `docs/platform/vision.md` tracks whole-system product/platform intent:
  mission, scope, non-scope, direction, and quality laws that affect all areas.
- `docs/platform/component-boundary.md` tracks the component
  and authority boundary map across all areas: layers, parent components, child
  components, responsibilities, and ownership boundaries.
- Area docs may link to these documents, but should not duplicate their
  normative content.

Open placement detail:

- Whether cross-area architecture docs should be flat files at platform root:

  ```txt
  docs/platform/architecture-map.md
  docs/platform/component-boundary.md
  ```

  or grouped under a non-area support folder:

  ```txt
  docs/platform/architecture/
    architecture-map.md
    component-boundary.md
  ```

Current leaning:

- Prefer flat root files for the small set of very important cross-area anchors:
  `vision.md`, `platform-foundations.md`, `architecture-map.md`,
  `component-boundary.md`.
- Use folders only where multiple same-kind cross-area artifacts are expected
  (`contracts/`, `decisions/`, `verification/`, `history/`).

### 2026-09-13 — Folder Structure Settled, Return To Document Structure

Prompt:

> Ok đồng ý, chốt về cấu trúc folder. Tuy nhiên lần cuối anh kêu em consult
> agent khác về cấu trúc, cách viết tài liệu thì nó lại tư vấn về cấu trúc
> folder. Giờ quay lại cấu trúc tài liệu đi.

Settled folder direction:

- Cross-area platform authority lives directly under `docs/platform/`.
- Area docs live under `docs/platform/<area>/`.
- No `docs/platform/system/`.
- No `docs/platform/areas/`.
- Platform-level contracts live under `docs/platform/contracts/`; area-owned
  contracts live under `docs/platform/<area>/contracts/`.

Next discussion focus:

- Document structure and writing method, not folder placement.
- Need templates that support:
  - human understanding;
  - human review/challenge/approval;
  - agent routing/execution;
  - authority/provenance clarity;
  - migration from existing docs without over-bureaucracy.

Candidate method:

- Every maintained doc has a short front matter/header declaring identity,
  audience, purpose, status, provenance, and authority.
- Every doc begins with a human-readable "why/what" entry section before details.
- Every canonical design doc exposes a decision surface:
  what is settled, what is open, what needs review, and what would change the
  recommendation.
- Use tables for identity, ownership, contracts, proof, and status; use prose for
  rationale and mental model.
- Avoid dumping long history into canonical docs. Keep history linked and
  summarized.

Candidate per-type templates to design next:

- Area portal `README.md`.
- Area `spec.md`.
- Architecture/design doc.
- Contract doc.
- Decision doc.
- Verification/proof doc.
- Proposal/discussion doc.
- Generated artifact header.

Final synthesis requirement:

- The outcome of this discussion must be synthesized into one whole-system
  documentation-system design document.
- That final design document should explain:
  - goals and principles;
  - target folder structure;
  - document type taxonomy;
  - authority/provenance/lifecycle matrix;
  - writing method and templates;
  - discussion scratchpad workflow;
  - linking discipline;
  - generated-doc rules;
  - migration strategy from current docs.
- The final design document may later feed smaller canonical docs such as
  `docs/doc-governance.md`, `docs/reading-map.md`, and templates, but the user
  wants one coherent design artifact to read and adjust first.

### 2026-09-13 — Panel Pass: Document Structure And Governance

Prompt:

> Bật panel để làm. Nhớ Claude đang hết quota.

Execution notes:

- `claude-bwrap` was avoided because Claude quota was exhausted.
- Reviewer A ran through `codex-bwrap` and focused on document structure and
  writing method.
- Reviewer B ran through `codex-bwrap` and focused on governance, authority,
  provenance, lifecycle, and human/agent safety.
- An earlier `agy-bwrap` attempt produced too much runtime/auth noise to use as
  the clean governance reviewer; the clean pass came from `codex-bwrap`.

Reviewer A: document structure and writing method:

- Final design must be a single normative system design, not merely a directory
  description.
- Required design-document sections:
  - purpose, target readers, and human-review principles;
  - canonical document model: types, roles, authority, precedence, lifecycle,
    metadata;
  - reading model: root anchors, area portals, reader journeys;
  - writing model: templates, language conventions, diagrams, linking,
    provenance, evidence;
  - change model: discussion -> proposal/decision -> canonical promotion ->
    verification -> archive/history;
  - traceability model from product claim to spec/architecture/contract/decision
    and verification;
  - governance: review thresholds, ownership, stale-document handling,
    disagreement recording, human/agent responsibilities;
  - worked examples.
- Strong writing rules:
  - conclusion before mechanism;
  - separate facts, decisions, requirements, and proposals visibly;
  - one document owns each claim; others link and summarize;
  - every normative statement should be testable and linked to evidence;
  - preserve meaningful dissent; "no objections" is not informed agreement;
  - diagrams must clarify boundaries/ownership/flow, not decorate;
  - progressive disclosure: portal -> overview -> spec -> architecture/contracts/
    decisions -> proof;
  - agent authorship is provenance, not authority.

Reviewer A risks:

- Broad taxonomy can recreate navigation problems unless area README is reliable.
- `spec.md` can drift unless it carries evidence date and verification links.
- Architecture, decisions, and contracts can repeat rules differently unless
  precedence and ownership are explicit.
- Metadata can become ritual unless it answers: who can change this, how was it
  validated, is review overdue?
- Strong links need quality: reciprocal links where important, claim-level links
  where possible, no orphans.

Reviewer B: governance, authority, provenance:

- Recommended authority classes:
  - `DISCUSSION.md`: non-canonical; may hold questions, alternatives, evidence,
    provisional reasoning; must not establish current behavior, binding rules,
    or settled decisions.
  - Specs: canonical state authority for current behavior, shared entities, and
    observable flows.
  - Architecture docs: canonical design authority for why, boundaries,
    responsibility allocation, and trade-offs.
  - Contracts: canonical normative authority for exact obligations,
    invariants, inputs/outputs, compatibility and handoff rules.
  - Decisions/history: canonical decision provenance; who decided what, when,
    why, alternatives, supersession.
  - Generated docs/indexes: derived authority only; faithful projection of
    declared sources.
  - Guides/runbooks: canonical operational guidance, subordinate to contracts
    and specs.
- Conflict rule:
  - contract overrides guide;
  - current spec overrides stale architecture description on present state;
  - newer approved decision supersedes older one;
  - generated output never overrides its source;
  - conflict is a documentation defect requiring surfacing, not silent agent
    reconciliation.
- Promotion rules:
  - label discussion assertions as question, hypothesis, evidence, proposal, or
    settled candidate;
  - before promotion, identify target canonical artifact:
    - current truth -> spec;
    - design rationale/boundary -> architecture;
    - mandatory precision -> contract;
    - choice/history -> decision record/history;
  - promotion carries evidence, owner, and review status;
  - update affected docs enough that the reading graph remains truthful;
  - replace promoted discussion content with a canonical pointer;
  - unresolved items stay unresolved with owner/next trigger;
  - agents may draft, cross-link, check consistency, and flag conflicts, but
    cannot silently elevate drafts to binding authority.

Reviewer B metadata recommendations:

```txt
title
doc_type
canonicality: canonical | discussion | generated
authority_scope
status: draft | proposed | approved | superseded | archived
owner
writers
approvers
approved_at
effective_at
last_reviewed_at
review_due
supersedes
superseded_by
depends_on
related_docs
evidence
change_trigger
```

Generated docs additionally:

```txt
source_of_truth
generator
generator_version
generated_at
freshness_check
do_not_edit: true
```

Reviewer B failure modes:

- Polished agent prose treated as approved decision.
- `DISCUSSION.md` becomes shadow spec because it is fresher/easier to edit.
- Same rule written in spec, architecture, and contract without one owner.
- Agents silently fix contradictions instead of surfacing competing authorities.
- Generated files appear canonical because provenance/freshness is missing.
- Historical decisions edited to match today instead of superseded.
- Reading graph becomes raw link list instead of typed relationships.
- Agent authorship captured but not human accountability/approval/evidence.
- Review dates lapse and "current behavior" becomes unverified claim.
- Operational convenience promoted into normative contract without compatibility
  analysis and approval.

### 2026-09-13 — Whole-System Design Document Created

Output created:

- `docs/architect/documentation-system-design.md`

Purpose:

- Single proposed design document for the whole fgOS documentation system.
- Intended for human review and adjustment before promotion into canonical
  governance, reading map, platform portal, templates, and migration tasks.

Preview:

- `http://design-lap:7700/s/9cfb424dec3d`

Next expected step:

- Human review of the proposed design document.
- Adjust design content.
- Then promote settled parts into:
  - `docs/doc-governance.md`;
  - `docs/reading-map.md`;
  - `docs/platform/README.md`;
  - `docs/templates/**`;
  - migration plan/tasks.

### 2026-09-13 — First Canonical Promotion Completed

Promoted files:

- `docs/doc-governance.md`
- `docs/reading-map.md`
- `docs/README.md`
- `docs/platform/README.md`
- `docs/user/README.md`
- `docs/generated/README.md`
- `docs/templates/area-readme.md`
- `docs/templates/spec.md`
- `docs/templates/architecture.md`
- `docs/templates/contract.md`
- `docs/templates/decision.md`
- `docs/templates/verification.md`
- `docs/templates/discussion.md`
- `docs/templates/generated.md`

Updated:

- `docs/architect/documentation-system-design.md` is now marked accepted and
  partially promoted.

Still not done:

- No existing legacy docs have been moved yet.
- No area has been migrated into `docs/platform/<area>/` yet.
- No migration plan has been written yet.
- `docs/specs/**` and `docs/architect/**` remain active legacy/current sources
  until migrated or redirected.

### 2026-09-13 — Temporary Discussion File Workflow

Prompt:

> Human collab agent để shaping kiến trúc. Trong quá trình thảo luận, có nhiều
> ý hay nhưng chưa chốt và nếu chưa ghi ra tài liệu canonical thì có nhiều tình
> huống mất luôn chi tiết hay đã ghi nhận, đã chốt tạm. Như vậy có cần phải có
> một file dạng tạm để ghi nhận và khi mọi thứ hoàn tất thì có thể xóa file tạm
> này (`discussion` chẳng hạn), hoặc quy trình đúng hơn là gì?

Need:

- Preserve useful ideas, tentative decisions, objections, and questions during
  human-agent architecture shaping.
- Avoid losing details between chat turns or sessions.
- Avoid promoting unfinished discussion into canonical authority too early.
- Avoid leaving temporary discussion files as permanent shadow authority.

Candidate workflow:

1. Start with a `DISCUSSION.md` / `*-discussion.md` scratchpad for any
   multi-round architecture shaping.
2. Mark it clearly as non-canonical:
   - `Document type: Discussion scratchpad`
   - `Canonical for: nothing`
   - `Design status: Discussion`
   - `Delete when: accepted content has been promoted`
3. During discussion, keep:
   - current summary;
   - open questions;
   - tentative decisions;
   - rejected alternatives;
   - good wording/insights not yet placed;
   - links to evidence/source docs;
   - promotion targets.
4. When a point stabilizes, promote it to the right canonical doc:
   - area portal;
   - spec;
   - architecture;
   - contract;
   - decision;
   - verification;
   - governance.
5. After promotion, remove or mark that point as promoted in the scratchpad.
6. When no unpromoted value remains, delete or archive the scratchpad according
   to the retention rule.

Candidate sections for a discussion scratchpad:

```txt
# <Topic> Discussion

Document type: Discussion scratchpad
Audience: Human collaborator, shaping agent
Purpose: Preserve active shaping context until promoted
Design status: Discussion
Implementation: N/A
Provenance: Human + agent coauthor
Canonical for: nothing
Use this when: The design is still being shaped
Do not use this for: Accepted architecture, implementation truth, runtime instruction
Delete when: All settled content is promoted or explicitly discarded

## Current Summary
## Open Questions
## Tentative Decisions
## Promoted Decisions
## Rejected / Parked Alternatives
## Evidence And Source Links
## Promotion Targets
## Raw Discussion Log
```

Open retention choice:

- Delete scratchpads after promotion to keep docs clean.
- Or move selected scratchpads to `history/` when they preserve valuable
  rationale not captured elsewhere.

Current leaning:

- Default: delete once promoted.
- Keep/archive only when the discussion itself has long-term diagnostic or
  rationale value.
- Canonical docs must contain enough rationale that readers do not need the
  scratchpad for normal understanding.

Settled lifecycle:

```txt
Open -> Active -> Stabilizing -> Promoting -> Drained -> Delete/Archive
```

Meaning:

- `Open`: create when a topic needs multi-round shaping.
- `Active`: record current summary, open questions, tentative decisions,
  alternatives, evidence, and useful raw insights.
- `Stabilizing`: some points are becoming stable enough to map to promotion
  targets.
- `Promoting`: move settled content into canonical docs.
- `Drained`: no valuable unpromoted content remains.
- `Delete/Archive`: default delete; archive only when the discussion itself is
  useful evidence/rationale.

Promotion rule:

- A point may be removed from the scratchpad only when it has either:
  - been promoted into a canonical document; or
  - been explicitly discarded.

Candidate promotion table:

```txt
| Item | Status | Target |
|---|---|---|
| Folder structure | Settled | docs/doc-governance.md, docs/platform/README.md |
| Human presence principle | Settled | docs/doc-governance.md |
| Area README template | Draft | docs/templates/area-readme.md |
| Spec vs architecture distinction | Settled | docs/doc-governance.md |
```

### 2026-09-13 — Area README Template Settled

Settled purpose:

- Area README is the human-first portal into one platform area.
- It owns orientation, ownership summary, read-first routing, decision surface,
  and participation path.
- It does not own exact behavior, detailed contracts, or historical rationale.

Settled sections:

```txt
# <Area Name>

<common metadata header>

## What This Area Owns
## Current Shape
## Read First
## Decision Surface
## Canonical Documents
## Key Contracts
## Related Areas
## How To Change This Area
## Maintenance Notes
```

Template notes:

- `Decision Surface` is required, even when it says "No active open decision."
- `Read First` should be a table mapping reader need to local path.
- `How To Change This Area` must mention opening/updating a discussion
  scratchpad when shaping is needed, then promoting settled content into
  canonical docs.

### 2026-09-13 — Candidate Area Spec Template

Purpose:

- `spec.md` is the current behavior/state/reference layer for one area.
- It is read by implementers, reviewers, agents, and humans who need to know
  what the area currently does or must preserve.
- It is not the main home for design alternatives, long rationale, or historical
  discussion.

Candidate sections:

```txt
# Spec: <Area Name>

<common metadata header>

## Current Summary
## Scope
## Entry Points And Triggers
## Actors And Access
## Data / Concepts
## Behaviors And Operations
## Rules And Invariants
## Contracts Owned
## Contracts Consumed
## Edge Cases Settled
## Open Gaps
## Verification
## Pointers
## Decision History Summary
```

Writing method:

- Write in present tense for current behavior.
- Use tables for entities, operations, rules, and contracts.
- Keep each behavior operation shaped as:
  - runs when;
  - blocked when;
  - what changes;
  - afterwards / side effects.
- Put only a short decision-history summary in the spec; long rationale belongs
  in decisions/history/architecture.
- Open gaps must be explicit, not hidden in prose.

Open design question:

- Should every `spec.md` include `Decision History Summary`, or should that be
  omitted unless the area has important retired/migrated decisions?

### 2026-09-13 — Linking Discipline

Prompt:

> Có một ý quan trọng cần chỉ ra là links giữa các tài liệu liên quan cần phải
> thiết lập tốt.

Principle:

- Good documentation is not only good individual files. It is also a good
  reading graph.
- Related documents must be linked deliberately so a human can move from portal
  to current state, rationale, contract, proof, proposal, and history without
  relying on chat context or full-tree search.

Candidate linking rules:

1. Every area README links to:
   - its `spec.md`;
   - main architecture docs;
   - owned contracts;
   - verification/proof docs;
   - active proposals or discussions;
   - related areas.
2. Every `spec.md` links to:
   - the area README;
   - contracts it owns/consumes;
   - architecture docs that explain non-obvious boundaries;
   - verification docs/tests;
   - relevant platform-level laws or component-boundary entries.
3. Every architecture doc links to:
   - the spec it affects;
   - contracts created or changed by the design;
   - decisions/proposals that justify it;
   - verification/proof expectations;
   - component-boundary and architecture-map entries when cross-area.
4. Every contract links to:
   - owning area or platform contract registry;
   - consumers;
   - implementation/source entry points if applicable;
   - tests/proof;
   - version/compatibility notes.
5. Every decision links to:
   - affected specs;
   - affected architecture docs;
   - affected contracts;
   - evidence/proposal/discussion source;
   - superseded/superseding decisions.
6. Every verification doc links to:
   - the claim/contract/spec it proves;
   - command/test evidence;
   - known limitations.

Candidate metadata field:

```txt
Related:
```

Use:

- Short list of sibling/counterpart docs.
- Prefer explicit links over vague "see docs".
- Do not create circular prose duplication; link to the authority instead.

Open tooling question:

- Should `docs/doc-governance.md` require a lightweight link check or registry
  later, so moved docs do not break the reading graph?

### 2026-09-13 — Next Step: Design Map + Architect Documentation Governance

Prompt under discussion:

> "Việc tiếp theo nên là cùng anh chốt một design-map và một
> documentation-governance cấp docs/architect/, rồi mới migrate hoặc gắn nhãn
> các tài liệu cũ."

Current interpretation:

- This should not mean writing two large bureaucratic documents.
- It should mean establishing two thin, durable control documents:
  - `design-map`: where each kind of design/support artifact belongs;
  - `documentation-governance`: how a document declares type, audience,
    purpose, authority, lifecycle, and promotion rules.
- These two documents should become the map and grammar for future cleanup.
- Migration should wait until these are clear enough, otherwise moving old docs
  only redistributes confusion.

Candidate sequencing:

1. Agree on a minimal `docs/architect/documentation-governance.md` that applies
   to all architect-level system design docs.
2. Agree on a minimal `docs/architect/design-map.md` that maps artifact type to
   canonical location.
3. Reconcile this with the existing stronger area-local model in
   `docs/architect/agent-coordination/documentation-governance.md`.
4. Use the map to classify old documents before moving anything.
5. Migrate gradually: promote accepted content into canonical docs, move
   evidence to verification/history, mark generated docs clearly, and delete
   only disposable scratchpads after their contents are promoted.

Open decision:

- Should `documentation-governance.md` and `design-map.md` be separate files, or
  one short `documentation-governance.md` with a placement section?
- Naming question: should the placement map be called `doc-map` instead of
  `design-map`?
  - `doc-map` suggests it covers the whole documentation system.
  - `design-map` suggests it covers only system-design documentation.
  - Current concern: the redesign may need both scopes, but the immediate
    canonical map under `docs/architect/` should probably not claim ownership of
    all end-user docs, runtime agent instructions, generated knowledge, and
    execution plans unless that broader scope is intentional.
- Scope question: should the redesign go one level higher and manage the whole
  set of produced documentation artifacts, not only architecture docs?
  - Current leaning: yes, create a repo-level documentation map/governance, but
    keep architecture-specific authority rules as a stricter sub-profile.
  - Risk if yes: the top-level rule may become too broad and bureaucratic.
  - Risk if no: architecture cleanup succeeds locally while generated docs,
    knowledge, plans, agent instructions, and end-user docs keep drifting into
    overlapping authority systems.
- Distinction question: how is the existing `docs/specs/reading-map.md`
  different from the proposed `doc-map`?
  - `reading-map` should tell a reader or agent what to read first for a task or
    area.
  - `doc-map` should define the documentation artifact taxonomy, ownership,
    authority, and placement rules.
  - Current issue: `reading-map` currently mixes navigation with broad inventory
    and source/component mapping, so it feels like a doc map, code map, and
    reading path in one file.
- Consolidation question: can `doc-map` and `reading-map` be merged into one
  file, and should they be?
  - Candidate answer: they can be physically adjacent or one portal can link to
    both, but the responsibilities should remain separate.
  - Risk of merging: the file becomes both a reader route and a governance
    contract, causing either the route to be too heavy or the governance to be
    too shallow.
  - Possible compromise: `docs/README.md` or `docs/index.md` as a top-level
    portal with two sections/links: "Read first" and "Where docs belong".
- Consolidation question: should `doc-map` be merged into
  `docs/doc-governance.md`?
  - Settled for now: yes for the first version, if the placement map remains a
    compact normative section and not a giant inventory.
  - Reason: taxonomy, authority, lifecycle, and placement are one governance
    contract. Splitting placement too early can make future writers read two
    rule files to answer one question.
  - Guardrail: `doc-governance.md` must not become a generated index of every
    current file. It should map artifact classes to homes, not enumerate all
    documents.
  - Escape hatch: split out `doc-map.md` later only if the placement matrix grows
    large enough to hurt readability.

## Parking Lot

- `docs/ui-spec/generated/` already shows a useful generated-docs separation
  pattern.
- `docs/architect/agent-coordination/documentation-governance.md` should be
  mined before inventing a new global governance structure.
- `docs/specs/reading-map.md` may need to shrink into a true reading map, with
  inventory moved elsewhere or generated.
- Some current specs include retired decision history directly in the spec file;
  this may preserve context but makes the spec hard to read.
