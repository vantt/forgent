# D00 - Incident Normalization

**Capability:** execute

**Depends on:** none

## Purpose

Establish the evidence baseline and prevent the design from solving an anecdote
while missing the actual incident class.

## Read First

`docs/specs/reading-map.md`, `docs/specs/runner.md`,
`docs/platform-foundations.md`, the source incident report, and
`architecture-decision-lock.md`.

## File Lease

- May edit: `incident-evidence-matrix.md`, `requirements-traceability.md`
- May add: `evidence/d00-*.md`
- Must not edit: every other path

## Work

Normalize every numbered incident into observation, asserted cause, directly
available evidence, confidence, platform owner, design disposition, committed
capability, negative capability, and future proof. Separate an external root
cause from the fgOS behavior needed to preserve or explain it. Mark claims the
report cannot prove; do not upgrade temporal correlation to causation.

Reconcile summary counts with rows. A row may have primary and secondary
dispositions, but the counting rule must be explicit. Confirm all DOEA decisions
are motivated by at least one incident or an explicit platform law.

## Required Shape

Stable incident IDs, direct source anchors, evidence strength, ownership,
disposition rationale, committed/deferred response, planned verification, and a
gap register for facts unavailable from committed evidence.

## Adversarial Checks

- Double-counted totals; unsupported “already resolved” claims.
- External failures presented as fgOS-owned prevention.
- Process listings, TTL, or Git snapshots treated as causal proof.
- Deferred semantic changes required by a committed capability.

## Acceptance

Every incident has one primary row; every row names what this track will and
will not do; no row grants mutation authority; totals reproduce from the table;
and no HIGH scope gap remains.

## Verification

```sh
git diff --check
rg '^\| [0-9]+ ' plans/260914-dispatch-operability-evidence-attribution/incident-evidence-matrix.md
rg 'DOEA-(0[1-9]|1[0-3])' plans/260914-dispatch-operability-evidence-attribution
```

## Handoff

Commit the accepted matrix. D01 inherits its vocabulary and cites incident IDs
for each RunResult/RunObservation dimension.
