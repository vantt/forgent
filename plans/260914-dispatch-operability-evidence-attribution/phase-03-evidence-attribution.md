# D03 - Evidence Attribution

**Capability:** execute

**Depends on:** D02

## Purpose

Prevent observations and temporal correlations from becoming false claims of
worker causation.

## Read First

Accepted D00-D02 artifacts, `phase-designs/evidence-attribution.md`, existing
workspace capture, confinement evidence, adapter claims, and incident evidence.
Source inspection is read-only.

## File Lease

- May edit: `phase-designs/evidence-attribution.md`, `requirements-traceability.md`
- May add: `evidence/d03-*.md`
- Must not edit: every other path

## Work

Specify observation, attribution, and policy as orthogonal records. Define the
closed vocabulary, minimum evidence, coverage/provenance, downgrade, conflicts,
and path aggregation. Cover pre-existing dirt, concurrent writers, confinement
attestations, and worker refs. Specify policy refusal while preserving execution
and assessment, with language that communicates uncertainty without accusation.

## Required Shape

- Normative schema and evidence-source capability table.
- Decision table for `proven`, `correlated`, `excluded`, `unattributed`.
- Coverage/conflict/downgrade algorithm and policy cross-product examples.
- Machine-code and human-explanation language rules.

## Adversarial Checks

- Git difference or worker claim becomes proof.
- One proven path upgrades unrelated paths; missing baseline becomes excluded.
- Policy overwrites execution; unattributed is presented as safe or guilty.

## Acceptance

Every causal claim has a positively covering source; uncertainty only stays or
downgrades; policy preserves evidence and substantive results; no HIGH finding
remains.

## Verification

```sh
git diff --check
rg 'proven|correlated|excluded|unattributed|policy' plans/260914-dispatch-operability-evidence-attribution/phase-designs/evidence-attribution.md
```

## Handoff

D04 may consume evidence strength, but cannot turn correlation, timeout, or a
lookup miss into dead proof.
