---
id: driver-discipline
kind: procedure
owner: workflow
scope: component
mode: append
specificity: 20
title: Driver Discipline
description: What a driver checks itself - a worker's claim is never evidence, every finding gets a disposition and an independent recheck, and a refusal is an answer
lifecycle: live
valid_from: 2026-11-26
related:
  - "[[dispatch-decide-door]]"
  - "[[run-door-contract]]"
---

# Driver Discipline

## A claim is never evidence

Before accepting any worker contribution or finding, independently inspect the declared output artifact(s):
- The driver must directly verify the existence, format, and substantive correctness of the produced artifact.
- Never rely on worker self-narration, conversational claims, or ungrounded status summaries.
- **Caveat Rule:** A result carrying a caveat (such as non-attributable execution or a recheck-required flag) must **never** be treated as valid acceptance or sign-off evidence. Caveats block session completion and require an uncaveated re-execution.

## Every finding gets a disposition

When an inspection or advisory operation reports findings, the driver must record an explicit disposition for each finding:
- `accepted`: The finding is valid and requires corrective action or revision.
- `rejected`: The finding is demonstrated to be invalid or inapplicable, backed by recorded rationale.
- `deferred`: The finding is valid but explicitly deferred out of current scope, permitted only when allowed by facade disposition criteria.

These three are the generic set. A role-specific skill may define a finer set that applies inside that skill (the architecture panel's accepted, mitigated, answered, invalidated-by-evidence, deferred, unresolved); no mapping between the sets is invented.

Every accepted finding requires an independent recheck operation to confirm remediation. A finding is never discharged by driver disposition alone.

## A refusal is an answer

A refusal is an answer, not a question for the owner. Read its code and condition, re-observe, and change the proposal (another activity, a narrower write scope, wait for the live reservation) or stop. Do not retry the same proposal. An error from a call (a refusal before the run, a failed bind, or a timeout) is read the same way, never retried blind.
