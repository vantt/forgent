# Historical File: ADR-007: Domain Harness Seam And Non-Driving Inline Evidence

```txt
Document type: History
Audience: Human reviewer, maintainer and documentation agent
Purpose: Preserve the complete classified input as non-authority historical evidence
Design status: Candidate
Implementation: Historical snapshot; not current implementation or authority
Provenance: docs/platform/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md at d23045c2de83e3508fda8fd2580b43ece2e1e046; SHA256 f0a2a38c872c18d9f1e86f11a0b0a0788b7108ef8a49e5a17e9b3e5076bcabe9
Writer type: Documentation maintainer
Canonical for: Historical evidence only; no current authority
Use this when: Auditing original claims or section-level retirement
Do not use this for: Current runtime behaviour, accepted proposals or executable routing
Last reviewed: Pending independent whole-area review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: None; this is an exact historical carrier
Superseded by: Current execution ownership in docs/specs/runner.md
Added in candidate: Historical framing only; literal file bytes are unchanged
```

The coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see `docs/specs/runner.md` **CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)**. Original statuses and instructions below are dated evidence, not current claims.

## Literal Snapshot

~~~~text
# ADR-007: Domain Harness Seam And Non-Driving Inline Evidence

```txt
Document type: Decision
Audience: Human reviewers, maintainers, documentation agents
Purpose: Preserve source material for ADR-007: Domain Harness Seam And Non-Driving Inline Evidence
Design status: Candidate
Implementation: Not re-verified; source implementation statements remain in the body
Provenance: Retained from docs/architect/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Preserved decision material for ADR-007: Domain Harness Seam And Non-Driving Inline Evidence; no authority cutover
Use this when: Comparing this candidate with its pinned legacy source
Do not use this for: Inferring current implementation or supersession of retained sources
Last reviewed: UNPROVEN; independent content review pending
Related:
- docs/platform/agent-coordination/vision.md
- docs/platform/agent-coordination/decisions/ADR-001-work-lifecycle-authority.md
- docs/platform/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
```
Document type: ADR
Design status: Accepted
Implementation: Implemented
Last reviewed: 2026-09-01
Canonical for: the foundation/domain seam for agent-led contracts and the Work-attached inline boundary
Related: [Vision V-006/V-008/V-012](../vision.md), [ADR-001](ADR-001-work-lifecycle-authority.md), [ADR-006](ADR-006-assignment-provenance-and-contract-snapshot.md), [Work Integration](../architecture/work-integration.md), [Dispatch Control Plane](../architecture/dispatch-control-plane.md) (the domain harness enriches a DispatchRequest's policy/provenance; it never creates a second resolver)

## Context

The Vision requires domain planning to enrich or reject agent proposals
without forking the execution core, and forbids building a generic plugin
framework before two unlike consumers prove a common need. It also requires
that a declared Workflow/Stage graph stay a hard constraint when selected: an
agent-led contract attached to a Work item must not become a way to perform a
Stage Operation outside the active Stage.

## Decision

1. **One pure seam per domain.** A domain may provide exactly one pure
   function, `enrichAndValidateContract(contract, { domain, work })`, returning
   an enriched contract or a rejection. The foundation calls it after the
   generic validator and before the normalizer (ADR-006). It may add context
   references, constraints, an evidence rule, and policy hints written into the
   existing Assignment `policy` field. It may reject. It may not dispatch,
   choose an executor/provider/tier, or touch Work lifecycle;
   `compileDispatchPlan` remains the sole execution chooser.
2. **Standalone uses the generic validator only.** An agent-led request with
   no domain context passes foundation validation alone. This is the evidence
   that the foundation boundary does not depend on any domain.
3. **Inline-on-Work is supporting, never driving.** When a Work item has a
   declared Workflow/Stage:
   - an inline contract must declare `supports: <operation id>` naming a
     Stage Operation legal in the Work's current Stage; the harness rejects
     otherwise;
   - a semantic action that already is a declared Stage Operation must use the
     declared path; inline may not replace or extend it;
   - the RunResult of an inline Assignment is non-driving evidence: driver
     operation choice never interprets it as a Stage verdict or lifecycle
     signal. Only declared-operation RunResults feed driver decisions.
4. **No registry or lifecycle hooks yet.** Additional seams require a second
   real consumer demonstrating the need.

## Consequences

- Coding gains repository scope, context, evidence, and tier guidance for
  agent-led consults without a second Assignment runner.
- The declared graph stays a hard constraint; inline cannot become a bypass.
- Research and coding consumers exercise the same build/dispatch/result path,
  differing only by one pure function.
- Future harness capabilities (resource/footprint analysis, isolation advice)
  extend this function's inputs/outputs rather than adding new seams.

## Rejected Alternatives

- A harness registry or plugin SDK: no second consumer yet.
- Letting inline results drive Stage transitions under policy prose: not
  mechanically enforceable; weakens ADR-001 and the declared graph.
- Semantic matching to detect inline/declared overlap: fuzzy; `supports` plus
  the non-driving rule is deterministic.
~~~~
