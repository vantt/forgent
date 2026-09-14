# Documentation Governance

```txt
Document type: Governance
Audience: Human reviewer, architect, maintainer, agent
Purpose: Define fgOS documentation types, authority, lifecycle, provenance, and placement
Design status: Accepted
Implementation: Partial
Provenance: Promoted from `docs/architect/documentation-system-design.md`
Writer type: Human + agent coauthor
Canonical for: fgOS documentation governance
Use this when: Creating, reviewing, moving, or promoting maintained documentation
Do not use this for: Current product behavior or implementation detail
Last reviewed: 2026-09-13
Related:
- `docs/reading-map.md`
- `docs/platform/README.md`
- `docs/architect/documentation-system-design.md`
```

This document is the governance contract for maintained fgOS documentation.
It defines how docs declare authority, where they belong, and how temporary
discussion becomes canonical knowledge.

## 1. Principles

Documentation must support human presence. A human should be able to enter the
docs, understand the current shape, review trade-offs, challenge decisions, and
approve or reject agent recommendations without chat history.

One claim should have one owner. Other documents may summarize and link to that
claim, but must not fork authority.

Agent authorship is provenance, not authority. Authority comes from document
type, status, owner, evidence, and approval.

Generated output never outranks its source.

Documentation is a reading graph, not only a set of files.

## 2. Placement Map

Target platform docs:

```txt
docs/
  README.md
  doc-governance.md
  reading-map.md
  templates/

  platform/
    README.md
    vision.md
    intent-preservation-ledger.md
    platform-foundations.md
    architecture-map.md
    component-boundary.md
    contracts/
    decisions/
    verification/
    history/

    <area>/
      README.md
      vision.md
      intent-preservation-ledger.md
      spec.md
      subcomponents/
      architecture/
      contracts/
      decisions/
      verification/
      operations/
      proposals/
      history/

  user/
    tutorials/
    how-to/
    reference/
    explanation/

  generated/
  knowledge/
  history/
```

There is no `docs/platform/system/` and no `docs/platform/areas/`.
Platform-wide authority lives directly under `docs/platform/`; area-specific
documentation lives under `docs/platform/<area>/`.

During migration, existing `docs/specs/**` and `docs/architect/**` remain valid
legacy/current sources until their content is promoted or redirected.

External governed surfaces may remain outside `docs/`:

```txt
domains/
.agents/skills/
plugins/fgOS/skills/
plans/
```

They are still governed by this taxonomy.

## 3. Document Types

| Type | Authority | Purpose |
|---|---|---|
| Area portal | Canonical navigation | Enter one platform area and choose what to read next |
| Subcomponent portal | Canonical sub-area navigation | Enter one child component inside a larger area |
| Vision | Direction authority | State the full intended direction, mission fit, and non-scope |
| Intent preservation ledger | Intent traceability authority | Preserve big-picture design intent across simplified implementation slices |
| Spec | Canonical state authority | Current behavior, state, entities, operations, and gaps |
| Architecture | Canonical design authority | Why, shape, boundaries, responsibilities, trade-offs |
| Contract | Canonical normative authority | Exact obligations, schemas, state rules, handoff rules |
| Decision | Canonical decision provenance | What was decided, why, alternatives, supersession |
| Verification | Evidence authority | Proof for a claim, contract, behavior, or decision |
| Proposal | Non-canonical candidate | A design option before acceptance |
| Discussion scratchpad | Non-canonical shaping memory | Active human-agent exploration before promotion |
| Guide / runbook | Operational guidance | How to perform supported workflows |
| Generated doc / index | Derived projection | Machine-written view from declared sources |
| History | Archive/evidence | Retired context, old discussions, migration source |
| Knowledge | Retrospective learning | Lessons and reusable observations, not direct design authority |

## 4. Authority Matrix

| Artifact | May establish | Must not establish |
|---|---|---|
| Discussion scratchpad | Open questions, alternatives, evidence, provisional reasoning | Current behavior, binding rules, settled decisions |
| Vision | North-star direction, full intended shape, mission/non-scope | Current implementation detail or phase proof |
| Intent preservation ledger | Preserved intent, deferred capabilities, must-not-preclude constraints, revisit triggers | Current behavior, new design by itself, unbounded wishlist |
| Area portal | Area ownership, subcomponent map, read-first routing | Detailed subcomponent behavior or hidden authority changes |
| Subcomponent portal | Child component ownership, read-first routing, local boundary summary | Area-wide ownership or cross-area contracts without parent links |
| Spec | Current behavior, shared entities, observable flows | Long rationale or hidden design alternatives |
| Architecture | Boundaries, responsibility allocation, design rationale, trade-offs | Detailed present behavior as timeless truth |
| Contract | Exact obligations, invariants, inputs/outputs, compatibility | Optional guidance phrased as mandatory |
| Decision | Decision provenance and supersession | Silent rewriting of historical intent |
| Generated doc | Faithful projection of sources | New policy or interpretation |
| Guide/runbook | Supported procedure | Override of specs or contracts |
| History | Archived context | Current authority |

Conflict rules:

- Contracts outrank guides/runbooks.
- Current specs outrank stale architecture wording about present behavior.
- Newer approved decisions supersede older decisions.
- Generated output never outranks its source.
- A conflict is a documentation defect. Surface and reconcile it; do not let an
  agent silently choose a winner.

## 5. Metadata

Maintained docs should use a compact header. Use plain fields or front matter
consistently within a doc family.

Required baseline:

```txt
Document type:
Audience:
Purpose:
Design status:
Implementation:
Provenance:
Writer type:
Canonical for:
Use this when:
Do not use this for:
Last reviewed:
Related:
```

Metadata is an orientation block, not the only navigation surface. Because this
project keeps metadata inside fenced code blocks, `Related:` entries are plain
text and do not render as clickable links. Any maintained doc that lists related
paths in metadata must also expose those relationships as markdown links in the
body, either in a dedicated `Related Files` section or an existing read-first /
canonical-docs table.

Optional governance fields for higher-risk docs:

```txt
Owner:
Approvers:
Approved at:
Effective at:
Review due:
Supersedes:
Superseded by:
Evidence:
Change trigger:
```

Docs that contain normative design or behavior claims should also track
implementation alignment. Use a compact table in the doc itself or link to a
verification doc:

| Design claim | Implementation status | Evidence | Gap / next action |
|---|---|---|---|
| Short, testable claim | `implemented`, `partial`, `planned`, `superseded`, or `unknown` | Code/test/doc links | What remains or why no action is needed |

Use this whenever design can move ahead of implementation. It prevents accepted
architecture, current shipped behavior, and future target state from collapsing
into one undifferentiated document.

Generated docs additionally declare:

```txt
Source of truth:
Generator:
Generator version:
Generated at:
Freshness check:
Do not edit: true
```

## 6. Writer Types

| Writer type | Meaning |
|---|---|
| Human author | A person intentionally wrote or edited the doc |
| Human + agent coauthor | Human and agent shaped the doc together |
| Agent draft writer | Agent produced draft text for review |
| Runtime generator | A command writes a projection from source state |
| Build generator | A build/spec tool writes derived artifacts |
| Migration script | A controlled migration rewrites or moves docs |
| Execution worker | Worker/reviewer/panel writes evidence or reports |
| Mirror/projection writer | Setup/projection materializes runtime instruction copies |
| Registry/event writer | Event/state layer records facts later projected into docs |

## 7. Discussion Scratchpad Workflow

Use a discussion scratchpad for multi-round shaping.

Lifecycle:

```txt
Open -> Active -> Stabilizing -> Promoting -> Drained -> Delete/Archive
```

Rules:

- Mark it as non-canonical.
- Capture questions, hypotheses, evidence, proposals, tentative decisions, and
  promotion targets.
- Promote settled content into the right canonical document.
- Replace promoted content with a pointer or remove it from the scratchpad.
- Delete after draining by default.
- Archive only when the discussion itself has long-term diagnostic or rationale
  value.

Promotion targets:

- Current truth -> spec.
- Full intended direction -> vision.
- Settled intent that is deferred or simplified in implementation -> intent
  preservation ledger.
- Design rationale or boundary -> architecture.
- Mandatory precision -> contract.
- Choice and rationale -> decision.
- Proof -> verification.

## 8. Intent Preservation

Use an intent preservation ledger when an area has a full design direction that
will be implemented through smaller, simpler slices.

The ledger protects against a common failure mode: an agent later reads only the
simplified slice, mistakes it for the final intended shape, and extends the
system from that reduced form. The result is patchwork that drifts away from
the original vision.

Vision and intent ledger work together:

| Document | Role |
|---|---|
| Vision | States the full intended direction and why it matters. |
| Intent preservation ledger | Tracks which parts of that intent are implemented, deferred-preserved, superseded, rejected, or still unknown. |
| Spec | States what is currently true. |
| Architecture | Explains the accepted design shape and trade-offs. |
| Verification | Proves whether current implementation matches the claim. |

Ledger entries should include:

| Field | Meaning |
|---|---|
| `ID` | Stable area-scoped id, such as `AC-I004` or `HI-I002`. |
| `Original intent` | The full design intent that must not be lost. |
| `Source` | Vision, discussion, decision, or older source document. |
| `Status` | `implemented`, `partial`, `deferred-preserved`, `accepted-not-implemented`, `superseded`, `rejected`, or `unknown`. |
| `Current slice` | What the current simplified implementation actually covers. |
| `Must not preclude` | What future evolution must remain able to do. |
| `Revisit trigger` | Concrete condition that should reopen the intent. |
| `Proof / evidence` | Links to implementation, verification, or decision evidence. |

Rules:

- A simple implementation does not shrink the vision by itself.
- Omission from a phase does not mean rejection.
- Mark a preserved intent `superseded` or `rejected` only with explicit human
  decision and rationale.
- Every implementation plan that narrows a vision should include an intent
  traceability table and a must-not-preclude check.
- Keep the ledger close to vision: platform-wide at
  `docs/platform/intent-preservation-ledger.md`, area-specific at
  `docs/platform/<area>/intent-preservation-ledger.md`.

## 9. Subcomponent Structure

Use subcomponent structure when one area contains multiple child components with
their own ownership, contracts, verification, or implementation status.

An area can represent a whole platform component. A subcomponent is a child
inside that area. Subcomponents must make the area easier to understand; they
must not hide cross-area authority or create a second source of truth.

Default shape:

```txt
docs/platform/<area>/
  README.md
  vision.md
  intent-preservation-ledger.md
  spec.md
  subcomponents/
    README.md
    <subcomponent>/
      README.md
      spec.md
      architecture/
      contracts/
      verification/
      decisions/
      history/
```

Rules:

- Every large area README should include a `Subcomponent Map`, even when
  subcomponents do not yet have their own directories.
- Create a subcomponent directory only when the child has enough independent
  behavior, contracts, proof, or lifecycle to justify local navigation.
- Area-level `vision.md` and `intent-preservation-ledger.md` remain the parent
  direction. A subcomponent may have its own vision/ledger only when its intent
  is large enough to drift independently.
- Area-level `spec.md` summarizes current area behavior and links to
  subcomponent specs; it does not duplicate every subcomponent detail.
- Subcomponent docs must link back to the parent area README and to the relevant
  [component-boundary.md](platform/component-boundary.md) entry when read from
  this governance doc; inside area docs use the correct relative path.
- Cross-area contracts stay at the owning area or platform contract surface;
  subcomponent contract docs can own local obligations but must link to the
  cross-area owner.
- If a subcomponent changes parent/child component boundaries, update
  `docs/platform/component-boundary.md`.

## 10. Writing Method

Each document must have exactly one H1 heading, and that H1 is the document
title. All document sections start at H2. Do not use H1 for numbered sections,
subsections, banners, or visual grouping.

Maintained canonical docs should use numbered section headings:

```txt
## 1. Current Summary
## 2. Scope
### 2.1. In Scope
### 2.2. Out Of Scope
```

Numbering makes sections easier to cite in reviews, discussions, decisions,
and migration notes. Keep numbers stable when possible; when a document is
heavily rewritten, clarity is more important than preserving old numbers.

Discussion scratchpads should also use numbered headings once they stabilize,
but raw discussion logs may remain chronological and unnumbered.

## 11. Linking Discipline

Use links to preserve the reading graph.

- Area README links to spec, architecture, contracts, verification, active
  proposals/discussions, and related areas.
- Area README links to its subcomponent map and child component portals.
- Subcomponent README links to parent area README, parent spec, local spec,
  local contracts, local verification, and relevant boundary entries.
- Spec links to area README, owned/consumed contracts, architecture,
  verification, and relevant platform laws.
- Architecture links to affected specs, contracts, decisions, and proof.
- Contract links to owner, consumers, implementation/source when applicable,
  tests/proof, and compatibility notes.
- Decision links to affected docs, evidence, and supersession.
- Verification links to the claim it proves and any known limitations.

Related-file rule:

- `Related:` in metadata is for quick scanning and machine-readable path hints.
- Renderable related-file links belong in the document body.
- Prefer relative markdown links so docs remain readable after checkout moves,
  rendered previews, and future path migrations.
- Use typed relationship labels such as `defines`, `constrains`,
  `evidenced by`, `supersedes`, `consumes`, or `source during migration`.
- If a related file is planned but not created yet, mark it explicitly as
  `planned` instead of leaving an unclickable or broken path.

Component-boundary discipline:

- Any doc change that creates, removes, renames, splits, merges, or reassigns a
  component must check `docs/platform/component-boundary.md`.
- Any design change that moves ownership of a state write, runtime authority,
  decision, cross-area contract, or parent/child component relationship must
  update `docs/platform/component-boundary.md` or its current detailed source.
- If the component boundary does not change, record `No component-boundary
  change` in the implementation alignment table, verification note, discussion
  summary, or PR note.
- Area docs should link to the relevant component-boundary entry whenever the
  area owns or consumes a cross-area boundary.

Prefer typed relationships where useful:

```txt
defines
constrains
implements
explains
evidenced_by
supersedes
consumes
```

## 12. Framework Use

fgOS uses a native documentation model.

- Diataxis applies to `docs/user/**`.
- Google developer style influences clarity, directness, and scan-friendly
  writing.
- OKF-like ideas influence typed metadata, indexes, and git-readable knowledge.

These influences do not replace fgOS authority and provenance rules.

## 13. Migration Rule

Do not bulk-move old docs before classifying them by type, authority, lifecycle,
and provenance. Migrate one area at a time, with redirect/stub pointers for
important old paths.

## 14. Related Files

| Relationship | File |
|---|---|
| documentation portal | [README.md](README.md) |
| reader routing | [reading-map.md](reading-map.md) |
| platform portal | [platform/README.md](platform/README.md) |
| source design discussion | [architect/documentation-system-design.md](architect/documentation-system-design.md) |
