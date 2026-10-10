# Evidence And Result Architecture

```txt
Document type: Architecture
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

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/architecture/evidence-and-results.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

## Implementation And Design Status

The implementation column below bounds the retained text. Proposed typed interfaces, acceptance scenarios and target-state rules are design obligations, not claims that those interfaces already exist. Historical names in examples are not revived APIs.

| Section | Status | Evidence / limit |
|---|---|---|
| Evidence Sources | Current contract/invariant | src/runner/dispatch/run-result.mjs:19 CONFIDENCE_LEVELS; src/runner/dispatch/evidence-attribution.mjs:25-76 (pre/post hashes, dirty-before exclusion); run-result.mjs:520-532 policy refusals; assignment-runner.mjs:9 |
| Aggregation | Mixed implementation and proposal; no blanket implementation claim | git grep -i majority/aggregat in src/runner/execution src/workflow: no evidence-quality aggregation code; panel/findings semantics in runner.md:3055 (findings are outcome, not failed) |

## Principle

```txt
Executors claim outcomes.
RunResult normalizes claims.
Evidence supports confidence.
Drivers decide what the evidence permits.
```

## Evidence Sources

Depending on the selected TaskSpec or validated inline execution contract,
evidence may include:

- structured worker result artifact;
- process settlement and exit metadata;
- post-run file snapshots and expected-file checks;
- git delta scoped to the Run;
- command/test output captured after execution;
- artifact paths, hashes, timestamps, and provenance;
- independent reviewer or verifier result.

No one source proves every operation type.

## Confidence Boundaries

- Worker self-report alone cannot produce externally verified confidence (src/runner/dispatch/run-result.mjs:1276-1285).
- Exit code zero cannot satisfy missing semantic outputs (src/runner/dispatch/run-result.mjs:1305-1325).
- Pre-existing dirty files cannot count as changes produced by the Run (src/runner/dispatch/evidence-attribution.mjs:55-70).
- Stale or cross-Run evidence must be rejected (src/runner/dispatch/run-result.mjs:155,297; evidence-attribution.mjs:69,197).
- Read-only output may remain `reported`; the runtime gates this by assignment.mutation === read-only, not an unstamped TaskSpec permission (src/runner/dispatch/assignment.mjs:938-940; run-result.mjs:1276-1285).
- Mutating success requires post-run external evidence appropriate to the claim (src/runner/dispatch/run-result.mjs:1276-1285).
- Missing/malformed required evidence must not false-pass (src/runner/dispatch/run-result.mjs:1305-1325).

## Aggregation

Task or synthesis aggregation cannot raise evidence quality by majority. Failed,
missing, unsupported, or excluded branches remain visible in aggregate output.

## Visibility Boundary

Herdr pane state, terminal text, quietness, and process appearance are useful
diagnostics only. They cannot replace structured runtime and evidence records.

