# Minimum Documentation Constitution

```txt
Document type: Specification
Audience: Human reviewer, architect, implementer, agent
Purpose: State the minimum rules the documentation migration needs before inventory-driven transformation
Design status: Accepted (frozen 2026-10-06 by the owner)
Implementation: Implemented (validated by scripts/check-doc-constitution.mjs; conservation, candidate-status and retirement dry-run checks wired; the evidence relocation verifier and the cutover lease are designed, not built)
Provenance: plans/260925-documentation-authority-unification/plan.md §6.3
Writer type: Human + agent coauthor
Canonical for: Migration-time placement, cardinality, metadata, conflict, promotion and retirement rules
Use this when: Placing, authoring, promoting or retiring a platform document during the migration
Do not use this for: The full future documentation engine manifest or runtime context rules
Last reviewed: 2026-10-06
Related:
- `plans/260925-documentation-authority-unification/minimum-constitution.json`
- `plans/260925-documentation-authority-unification/claim-and-disposition-vocabulary.json`
- `plans/260925-documentation-authority-unification/claim-ledger.schema.json`
- `docs/doc-governance.md`
```

This is the minimum constitution of plan §6.3. It is the machine-checkable
form of the rules in [docs/doc-governance.md](../../docs/doc-governance.md),
restricted to what the migration consumes. It is not a second prose governance
and not the future `docs/doc-types.yaml` manifest. Everything else is listed in
section 9 with a revisit trigger, so nothing is lost by omission.

The data lives in [minimum-constitution.json](minimum-constitution.json). The
values it refers to live in
[claim-and-disposition-vocabulary.md](claim-and-disposition-vocabulary.md)
(version 2). The shape of one ledger row is
[claim-ledger.schema.json](claim-ledger.schema.json). The validator is
[scripts/check-doc-constitution.mjs](../../scripts/check-doc-constitution.mjs).

## 1. What Was Reused

| Source | Reused for |
|---|---|
| [docs/doc-governance.md](../../docs/doc-governance.md) | Document types, placement map, authority matrix, conflict rules, metadata, subcomponent shape, writing method, typed relationships |
| [transitional-switchboard.md](../../docs/transitional-switchboard.md) | Authority statuses and file classes; the rule that the switchboard, not a path or date, decides authority |
| [migration-authoring-rules.md](../../docs/platform/migration-authoring-rules.md) | One-owner discipline, candidate marker, legacy ratchet |
| Knowledge registry (`archive/plans/260825-1841-knowledge-registry/`, `src/state/knowledge-registry.mjs`) | The invariant `activeDoc(topic, role) <= 1` becomes the singleton rule. Registry lifecycle names are reserved for later. No second registry. |
| [documentation-system-unification.md](../../docs/platform/proposals/documentation-system-unification.md) §4.2 | Only the §6.3 items; the rest is deferred |

The archived registry plan holds a profile schema only for the Diataxis
knowledge profile (`role`, `framework`, `mode`). It has nothing for platform
documents, so the placement and cardinality rules below are new data, not a
copy.

## 2. Document Kinds And Placement

Twenty-four document kinds. Each has placement patterns or, for `redirect-stub`, a header marker. A pattern may use
`<area>`, `<subcomponent>`, `<collection>`, `<name>` and `<feature>` (one path segment each) and `**` (one or more segments). Cardinality
`singleton` means one canonical document per scope instance (the registry
invariant); `collection` means many documents, each with its own topic. Either
way one claim has one owner.

| Kind | Placement (`<A>` = `docs/platform/<area>/`, `<S>` = `<A>subcomponents/<subcomponent>/`) | Cardinality | Canonical |
|---|---|---|---|
| `platform-portal` | `docs/platform/README.md` | singleton | yes |
| `area-portal` | `<A>README.md` | singleton per area | yes |
| `subcomponent-portal` | `<S>README.md` | singleton per subcomponent | yes |
| `collection-index` | `<A><collection>/README.md`, `<S><collection>/README.md` | singleton per directory | yes |
| `reading-map` | `docs/reading-map.md` | singleton | yes |
| `vision` | `docs/platform/vision.md`, `<A>vision.md` | singleton per scope | yes |
| `intent-preservation-ledger` | `docs/platform/intent-preservation-ledger.md`, `<A>intent-preservation-ledger.md` | singleton per scope | yes |
| `platform-foundations` | `docs/platform/platform-foundations.md` | singleton | yes |
| `spec` | `<A>spec.md`, `<S>spec.md` | singleton per area or subcomponent | yes |
| `architecture` | `architecture-map.md`, `component-boundary.md`, `<A>architecture/**`, `<S>architecture/**` | singleton (platform), collection | yes |
| `contract` | `docs/platform/contracts/**`, `<A>contracts/**`, `<S>contracts/**` | collection | yes |
| `decision` | `docs/platform/decisions/**`, `<A>decisions/**`, `<S>decisions/**` | collection | yes |
| `verification` | `docs/platform/verification/**`, `<A>verification/**`, `<S>verification/**` (authority class `verification-record`) | collection | yes |
| `guide-runbook` | `<A>operations/**`, `<A>playbooks/**` | collection | yes |
| `vocabulary` | `<A>vocabulary/**` | collection | yes |
| `proposal` | `docs/platform/proposals/**`, `<A>proposals/**` | collection | no |
| `roadmap` | `<A>roadmap.md`, `<A>roadmap/**` | singleton, collection | no |
| `rollout-plan` | `<A><name>-rollout-plan.md` | collection | no |
| `discussion-scratchpad` | `docs/history/<feature>/DISCUSSION.md` | singleton per feature | no |
| `generated-doc` | `docs/generated/**` and declared generator outputs | collection | no |
| `history` | `docs/platform/history/**`, `<A>history/**`, `<A>reports/**`, `<S>history/**`, `docs/history/<feature>/**` | collection | no |
| `knowledge` | `docs/knowledge/**` | collection | no |
| `evidence-payload` | `docs/platform/verification/<collection>/**`, `<A>verification/<collection>/**`, `<S>verification/<collection>/**` | collection | no (metadata exempt) |
| `redirect-stub` | none; header marker `Document type: Redirect` | collection | no |

Evidence is not authority (plan §3 item 10). Proof, run and report files nested
below a `verification` directory are `evidence-payload` documents: not canonical,
exempt from candidate and promotion metadata, owned by the nearest `verification/README.md`
of the area (which stays a canonical `collection-index` and keeps the promotion
requirement). The kind is assigned by location only; a headerless file anywhere else
still counts as missing metadata. `--check-placement` also reports evidence whose
verification index is missing.

`reading-map` stays at `docs/reading-map.md`, outside `docs/platform/`: it routes the
whole repository (platform, knowledge and history corpora) as the target tree of
`doc-governance.md` shows. `docs/specs/reading-map.md` retires at the cutover and
`AGENTS.md` is repointed in the consumer-rewrite phase.

`docs/platform/<area>/reports/**` are dated snapshots and are `history` (non-canonical);
no file moves. The authority class `evidence` belongs only to non-authority kinds
(`evidence-payload`, `history`); the canonical `verification` kind has class
`verification-record`.

Each path belongs to exactly one kind. A kind's header marker wins; otherwise the
most specific pattern wins (fewest `**`, then most path segments, then fewest placeholders), and equally
specific patterns of different kinds are an error. The directories `contracts`,
`decisions`, `verification`, `history` and `proposals` directly under
`docs/platform/` are platform-wide collections and never area names.

The promoted areas keep their existing subdirectories (`playbooks`, `roadmap`,
`vocabulary`, `reports`, nested `verification`); the constitution admits them as
kinds and patterns instead of renaming them at the cutover. Measured on the plan
branch: all 440 Markdown files under `docs/platform/**` classify to exactly one
kind (439) or a recorded exception (1: `migration-authoring-rules.md`, temporary).
`node scripts/check-doc-constitution.mjs --no-ledger --check-placement` repeats
the measurement.

Placement rules:

- Maintained platform authority lives under `docs/platform/**`.
- No `docs/platform/system/` and no `docs/platform/areas/`.
- No new maintained prose under `docs/specs/**` or `docs/architect/**`; the
  [legacy ratchet](../../scripts/check-legacy-docs-ratchet.mjs) enforces it.
- A file's class comes from its claims and consumers, not from its location.
- `domains/`, `.agents/skills/`, `plugins/fgOS/skills/` and `plans/` stay outside
  the topology; the cutover does not move them.

The four other corpora keep their own places: user knowledge (`docs/knowledge/**`
and the live Diataxis roots, governed by the knowledge registry), history and
evidence, and consumer-project material such as the distillery.

### 2.1. Observed document types

The inventory reads a free-text `Document type:` header from 94 files and finds
45 distinct values (measured at commit `79530b221`). 37 map to a kind through `documentTypeAliases`. Eight do not
and are listed as unmapped for an owner decision:

| Value | Files | Example |
|---|---:|---|
| Migration plan | 2 | `docs/architect/agent-coordination/documentation-standardization-plan.md` |
| Architecture design | 1 | `docs/architect/documentation-system-design.md` |
| Governance | 1 | `docs/doc-governance.md` |
| Governance guide | 1 | `docs/platform/migration-authoring-rules.md` |
| Transitional switchboard | 1 | `docs/transitional-switchboard.md` |
| Documentation portal | 1 | `docs/README.md` |
| User docs portal | 1 | `docs/user/README.md` |
| `<type>` | 1 | `docs/architect/agent-coordination/documentation-governance.md` (unfilled template placeholder) |

## 3. Required Metadata

A maintained or candidate document under `docs/platform/**` opens with a fenced
`txt` header directly under its single H1. Owner decision of 2026-10-06: two
levels.

| Level | Applies to | Fields |
|---|---|---|
| Candidate core | Candidate material during migration | Document type, Audience, Purpose, Design status, Last reviewed, Related |
| Promotion fields | A candidate becoming canonical, and every maintained canonical document at the cutover | The whole "Required baseline" of [doc-governance.md §5](../../docs/doc-governance.md) (twelve fields, including `Canonical for`), read from that file by the validator and not copied here, plus `Supersedes` and `Superseded by` |
| Generated documents add | Generated documents | Source of truth, Generator, Generator version, Generated at, Freshness check, Do not edit |

`doc-governance.md` is not edited. Evidence for the candidate level: 72 documents
under `docs/platform/**` carry a header, all 72 carry the six core fields
(including the three promoted portals), and only 13 carry the whole governance
baseline (measured by script on the plan branch, 2026-10-06).

Promotion gap report (report only, not fatal): `node scripts/check-doc-constitution.mjs
--no-ledger --promotion`. Of 440 Markdown files under `docs/platform/**`, 302 are
evidence payloads (exempt) and 105 are canonical documents. Of those 105, 55 carry a
header and 50 do not; none carries the whole promotion list, because none has
`Supersedes` or `Superseded by`, and only 5 carry the twelve baseline fields. The
gaps are filled during the area transformation.

Structure rules from governance §10 and §5: exactly one H1, sections start at
H2 and are numbered in maintained canonical documents, and every path in
`Related:` is also a relative markdown link in the body. Candidate or promoted status comes from the `authorityStatus` of the area or route in the
[transitional switchboard](../../docs/transitional-switchboard.md), never from the
text of `Design status`: promoted portals say Draft today, so Draft, Proposed and
Candidate in that field are descriptive only. Only the cutover changes the switchboard.

## 4. Generated And History Classification

| Class | Disposition | Rules |
|---|---|---|
| Generated (`generated`, `non-authority`) | `regenerate-from-source` | Names its source and generator, says Do not edit, never outranks its source, is reproducible and carries freshness information |
| History (`history-evidence`, `non-authority`) | `retain-as-evidence` or `archive-with-reason` | Establishes no current claim, is not default reading authority, is kept only through an explicit relationship or alias with a recorded reason; evidence payloads move before the cutover only after consumers and digests are checked |
| Unclassified (`unclassified`) | `unknown-blocking` only | No switchboard route yet; blocks the cutover |

## 5. Authority Conflict Handling

A conflict is a documentation defect. No agent silently picks a winner.

Precedence, from governance §4:

1. Contracts outrank guides and runbooks.
2. A current spec outranks stale architecture wording about present behavior.
3. A newer approved decision supersedes an older one.
4. Generated output never outranks its source.

Procedure:

1. Detect: duplicate-content groups, semantic-conflict groups, two claim rows
   with different owners, or a reader report.
2. Record: keep every conflicting row as `unknown-blocking` with review status
   `blocking`, and relate the rows.
3. Classify: identical duplicate, stale versus current, contradictory decision,
   or contract versus guide.
4. Resolve mechanically only when one precedence rule applies; otherwise record
   an owner decision with its rationale.
5. Encode the outcome in dispositions (`promote`, `merge`, `supersede`,
   `delete-as-duplicate`, `reject-with-rationale`, `redirect`) so one owner remains.
6. Close only when no claim has two owners and the surviving rows are reviewed.

## 6. Promotion Gate

Promotion is atomic for the whole platform-documentation system (plan §3, item
5). Until the cutover every target is a candidate. A document is ready when:

| Check | Enforced by |
|---|---|
| Every retained claim has exactly one target owner and no `unknown-blocking` row remains | [check-doc-inventory-gates.mjs](../../scripts/check-doc-inventory-gates.mjs) |
| No unreviewed legacy growth | [check-legacy-docs-ratchet.mjs](../../scripts/check-legacy-docs-ratchet.mjs) |
| Candidate fields on candidate material, promotion fields on a document becoming canonical, and placement | [check-doc-candidate-status.mjs](../../scripts/check-doc-candidate-status.mjs) (status read from the switchboard, never from `Design status`); promotion fields also reported by `check-doc-constitution.mjs --promotion` |
| Relative links and `Related` paths resolve | [check-doc-candidate-status.mjs](../../scripts/check-doc-candidate-status.mjs) |
| Every claim row is `reviewed` | [check-doc-inventory-gates.mjs](../../scripts/check-doc-inventory-gates.mjs) `--strict` |
| Intent ledger updated when a vision is narrowed; component-boundary check recorded | review (governance §8, §11) |

## 7. Retirement Gate

A legacy source is deleted or redirected only at the cutover and only when:

| Check | Enforced by |
|---|---|
| The file has one non-blocking disposition | [check-doc-inventory-gates.mjs](../../scripts/check-doc-inventory-gates.mjs) |
| No claim row is blocking or unreviewed | [check-doc-inventory-gates.mjs](../../scripts/check-doc-inventory-gates.mjs) `--strict` |
| Every dropped-claims register entry has a reviewed disposition | [check-doc-inventory-gates.mjs](../../scripts/check-doc-inventory-gates.mjs) `--strict` |
| Immutable historical references resolve through the alias table | [check-doc-retirement.mjs](../../scripts/check-doc-retirement.mjs) over the [alias table](alias-table.json) ([contract](alias-table-and-resolver-contract.md)) |
| Every consumer edge is rewritten or proven non-authority | [check-doc-retirement.mjs](../../scripts/check-doc-retirement.mjs) `--cutover` |
| Relocated evidence matches its digests | planned: relocation verifier (policy and consumer proof: [evidence-payload-relocation-policy.md](evidence-payload-relocation-policy.md)) |
| Every previous claim identity is present or has a recorded removal | [check-doc-inventory-gates.mjs](../../scripts/check-doc-inventory-gates.mjs) (always fatal) |
| Rows that share a `semanticClaimId` name one distinct owner | [check-doc-inventory-gates.mjs](../../scripts/check-doc-inventory-gates.mjs) (always fatal) |
| Every canonical document carries all promotion fields | [check-doc-constitution.mjs](../../scripts/check-doc-constitution.mjs) `--promotion` |
| A row reviewed at cutover carries its own reviewed rationale, not the item's `proposedRationale` fallback | [check-doc-constitution.mjs](../../scripts/check-doc-constitution.mjs) `--cutover` |
| The ledger validator passes in cutover mode (owner, anchor, classified kind, reviewed; usage drift fatal) | [check-doc-constitution.mjs](../../scripts/check-doc-constitution.mjs) `--cutover` |
| The legacy ratchet is clean | [check-legacy-docs-ratchet.mjs](../../scripts/check-legacy-docs-ratchet.mjs) |
| The cutover runs under the documentation-cutover lease | planned: lease door (design: [cutover-write-lease-design.md](cutover-write-lease-design.md)) |

## 8. Validation

Governance sync: constitution entries that encode `doc-governance.md` carry a
`governanceRef` naming its heading, and the validator checks the heading exists.
The JSON is a checked projection of the governance prose, not a second source.

Amendments: the rules are frozen in meaning (frozen 2026-10-06 by the owner). An addition (a kind, a placement, a
gate check) is a recorded exception with evidence and keeps the pinned vocabulary
major version; changing a rule needs a new major version and an owner decision.

Enforcement wiring (2026-10-06, no rule changed): eleven gate checks that named a
planned deliverable now name the script that enforces them, so the retirement dry-run
([check-doc-retirement.mjs](../../scripts/check-doc-retirement.mjs)) can evaluate every
check of both gates. Only `evidence-digests` and `write-lease` stay planned.

`node scripts/check-doc-constitution.mjs` checks that the vocabulary,
constitution and schema agree (every referenced id exists, no duplicates, every
disposition has allowed file classes, every claim kind is served by a document
kind, gates name real scripts). With an inventory it also validates each ledger
row against the schema and vocabulary.

Row checks include: a rationale where the disposition requires one (a row may rely
on its inventory item's rationale); a target owner that is under `docs/platform/**`
and classifies to a kind; no `reviewed` status on an `unknown-blocking` or
`unclassified` row; and, per item, a disposition allowed for its file class.
Policy: structural breakage is fatal. Invalid ledger rows are reported with
counts per reason but do not fail the run, because rows still waiting for an
owner, a kind or a review are valid data. `--strict-rows` makes invalid rows
fatal for steps that must hand over a clean ledger. Empty plan §6.2 fields are
counted as gaps, never as invalid.

## 9. Deferred To The Future Engine

| Item | Revisit trigger |
|---|---|
| `docs/doc-types.yaml` manifest and platform-docs registry profile | The engine plan is authorized after the verified cutover |
| Per-type lifecycle states and transitions | The platform-docs profile is designed |
| Required typed relationships and graph validation | Typed documentation graph work starts |
| Required sections per type and templates | The authoring skill is built |
| Four-axis classification with plural purpose and audience | The engine manifest is written |
| `authorityPolicy` evidence and approval gates | Contribution events are introduced |
| `originKind` and contribution events | The engine event model is designed |
| Claim and clause level decision supersession | Decision records move into the engine registry |
| Semantic and doctor checks per type | The engine validator is built |
| Machine-checked generator and freshness rules | The maintenance minimum viable product is scoped |
| Agent Context Engine, context packets, budgeting | A separate plan is authorized |
| Executable proof receipt and attester ABI | The proof contract seam is implemented |
| Consolidation of every user-facing knowledge location | A reviewed scope amendment admits it |
| Objective credibility signals instead of stored subjective scores | The engine event model is designed |
| A small interchange conformance floor beneath profile governance | The engine manifest is written |
| Generated progressive-disclosure indexes | The maintenance minimum viable product is scoped |

These are recorded in the platform
[intent ledger](../../docs/platform/intent-preservation-ledger.md) as PF-I011 to
PF-I020 and PF-I021; the four that PF-I007 to PF-I010 already cover are cross-referenced there.
The last three rows (the OKF lessons of plan §12.3 that no earlier entry named) were added on 2026-10-06 as an additive exception after the completeness check.

## 10. Related Files

| Relationship | File |
|---|---|
| machine-readable constitution | [minimum-constitution.json](minimum-constitution.json) |
| vocabulary | [claim-and-disposition-vocabulary.md](claim-and-disposition-vocabulary.md) |
| ledger row schema | [claim-ledger.schema.json](claim-ledger.schema.json) |
| validator | [scripts/check-doc-constitution.mjs](../../scripts/check-doc-constitution.mjs) |
| governance | [docs/doc-governance.md](../../docs/doc-governance.md) |
| switchboard | [docs/transitional-switchboard.md](../../docs/transitional-switchboard.md) |
| plan | [plan.md](plan.md) |
