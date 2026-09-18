# ADR-001: Work Owns Delivery Lifecycle

Document type: ADR
Design status: Accepted
Implementation: Implemented
Last reviewed: 2026-08-31
Canonical for: delivery lifecycle authority

## Context

Coordination introduces Assignments, Runs, results, possible sessions, and
temporary tasks. Letting those objects mutate lifecycle independently would
create conflicting status, approval, and merge truth.

## Decision

Work and existing Work engine verbs are the sole authority for Work status,
stage, claim/return, acceptance, approval, durable branch, and merge lifecycle.

Coordination objects may provide evidence or recommendations to a Work driver,
but cannot perform lifecycle transitions except through authorized Work verbs.

## Consequences

- Session/task status must remain collaboration-local.
- Agent consensus cannot approve or complete Work.
- Work-attached dispatch must return results to the driver.
- Standalone coordination can exist without gaining delivery authority.
- Lifecycle leakage is a high-severity review finding.
