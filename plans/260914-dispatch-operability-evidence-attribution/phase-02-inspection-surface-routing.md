# D02 - Inspection Surface And Routing

**Capability:** execute

**Depends on:** D01

## Purpose

Define one public inspection operation while keeping host routing, subject
resolution, and mutation authority in their proper owners.

## Read First

Accepted D00-D01 artifacts, `phase-designs/inspection-surface-and-routing.md`,
host invocation contracts/catalogs, current Dispatch/Coordination read paths,
and `docs/routing-handoff-contract.md` as read-only evidence.

## File Lease

- May edit: `phase-designs/inspection-surface-and-routing.md`, `requirements-traceability.md`
- May add: `evidence/d02-*.md`
- Must not edit: every other path

## Work

Define `dispatch.runtime.inspect` as one semantic operation projected by CLI,
REST, and chat. Specify exactly-one selector validation and complete Run,
Assignment, and cwd resolution, including duplicate IDs, multiple current Runs,
worktree/common-dir identity, and profile-dependent concurrency. Specify output,
completeness, ports, dependency direction, errors, redaction, and the
recovery-authority hint. Invocation routing maps OperationId to provider only.

## Required Shape

- Request/response schemas and examples for all selectors.
- Resolution pseudocode and ambiguity/conflict truth tables.
- Port authority table and host projection parity table.
- Dependency rule forbidding mutation/recovery imports.
- Rules for returning or withholding recovery-authority hints.

## Adversarial Checks

- First-match wins; highest attempt becomes current without authority.
- cwd drops history/concurrency; router interprets selector flags.
- Inspection contacts a worker or mutation door; human output hides conflicts.

## Acceptance

One operation covers all selectors without becoming recovery; resolution is
deterministic or typed ambiguous; read-only is structural; host projections are
semantically identical; and no HIGH finding remains.

## Verification

```sh
git diff --check
rg 'dispatch\.runtime\.inspect|exactly one|identity-conflict|authority-conflict|read-only' plans/260914-dispatch-operability-evidence-attribution/phase-designs/inspection-surface-and-routing.md
```

## Handoff

D03 attributes returned observations without changing resolution or authority.
