# ADR-007: Domain Harness Seam And Non-Driving Inline Evidence

```txt
Document type: Decision
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

## Context

The Vision requires domain planning to enrich or reject agent proposals
without forking the execution core, and forbids building a generic plugin
framework before two unlike consumers prove a common need. It also requires
that a selected Workflow step/operation graph remains a hard constraint:
supporting inline execution must not replace a declared operation or bypass
the Work item's recorded `workflowStep`.

## Decision

1. **One pure seam per domain.** A domain may provide exactly one pure
   function, `enrichAndValidateContract(contract, { domain, work })`, returning
   an enriched contract or a rejection. The foundation calls it after the
   generic validator and before the normalizer (ADR-006). It may add context
   references, constraints, an evidence rule, and policy hints written into the
   existing Assignment `policy` field. It may reject. It may not dispatch,
   choose an executor/provider/tier, or touch Work lifecycle;
   governed execution owns binding/plan choice (`bind()` for Unit execution and `compileDispatchPlan` validation for Assignment dispatch), not the harness.
2. **Standalone uses the generic validator only.** An agent-led request with
   no domain context passes foundation validation alone. This is the evidence
   that the foundation boundary does not depend on any domain.
3. **Inline-on-Work is supporting, never driving.** When a Work item has a
   declared Workflow step:
   - `supports` must name a legal step operation; the coding harness checks
     `operationsForStep(domain, work.workflowStep, work.kind)` and rejects an
     unmatched operation (`enrich-and-validate-contract.mjs:109-119`);
   - a declared semantic operation uses its declared path rather than becoming
     an inline extension to the graph;
   - inline RunResult remains supporting evidence, not an independent Work
     progression/acceptance authority.
4. **No registry or lifecycle hooks yet.** Additional seams require a second
   real consumer demonstrating the need.

## Consequences

- The implemented coding seam adds repository read-only scope, Work context
  and a required `agent-report.md` output for reported evidence
  (`domains/coding/harness/enrich-and-validate-contract.mjs:126-147`).
- The declared graph stays a hard constraint; inline cannot become a bypass.
- Research/marketing harnesses are possible unlike consumers, not implemented
  seams or proof that the two-consumer threshold has already been met.
- Future harness capabilities (resource/footprint analysis, isolation advice)
  extend this function's inputs/outputs rather than adding new seams.

## Rejected Alternatives

- A harness registry or plugin SDK: no second consumer yet.
- Letting inline results drive Workflow progression under policy prose would
  weaken the Work/Workflow authority boundary.
- Semantic matching to detect inline/declared overlap: fuzzy; `supports` plus
  the non-driving rule is deterministic.
