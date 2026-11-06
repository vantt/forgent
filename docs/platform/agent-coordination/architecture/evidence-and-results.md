# Evidence And Result Architecture

```txt
Document type: Architecture
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Accepted at atomic cutover
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Source material from `docs/architect/agent-coordination/architecture/evidence-and-results.md` at `947dc310396071a4d530216d5c06d05993d63bf5`; live routes and the explicitly stated implementation corrections are adapted here.
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: No current review date recorded; retained source dates are historical
Related:
- docs/platform/agent-coordination/README.md
- docs/platform/runner/spec.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Carriage note: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/architecture/evidence-and-results.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

## Implementation And Design Status

The implementation column below bounds the retained text. Proposed typed interfaces, acceptance scenarios and target-state rules are design obligations, not claims that those interfaces already exist. Historical names in examples are not revived APIs.

| Section | Status | Evidence / limit |
|---|---|---|
| Evidence Sources | Current contract/invariant | `CONFIDENCE_LEVELS` in src/runner/dispatch/run-result.mjs; src/runner/dispatch/evidence-attribution.mjs:25-76 (pre/post hashes, dirty-before exclusion); policy refusals in `normalizeRunResultV3` (run-result.mjs); assignment-runner.mjs:9 |
| Outcome derivation | Current contract | One derivation: the Rust crate `fgos-run-result` through the combined addon (`runResult.deriveOutcome`, called by `deriveOutcome` in run-result.mjs); one vector file `test/fixtures/run-outcome/legacy-derivation.json` (28 rows, category and reason) proves it. Every writer writes contract version 3 (the lease refusal included); version 2 and 3 records stay readable, version 4 is refused as corrupt (`d40d74ea1`, 2026-11-06). |
| Aggregation | Normative evidence-quality boundary, not a shipped majority-scoring module | Run outcome interpretation is `interpretRunResult` and `runOutcome` in run-result.mjs; synthesis must retain unsupported branches rather than treating consensus as external evidence. |

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

- Worker self-report alone cannot produce externally verified confidence (`classifyEvidenceToOutcomeFacts` in src/runner/dispatch/settlement.mjs).
- Exit code zero cannot satisfy missing semantic outputs: the evidence floor still requires the appropriate worker report or external delta (`classifyEvidenceToOutcomeFacts` in src/runner/dispatch/settlement.mjs).
- Pre-existing dirty files cannot count as changes produced by the Run (src/runner/dispatch/evidence-attribution.mjs:55-70).
- RunResult records with another Run's identity are rejected (`expectedRunId` in `validateRunResultV2` and `validateRunResultV3`, src/runner/dispatch/run-result.mjs). This is not a worker-claim runId check: agent-result-claim-contract.mjs:52-90 validates claim shape without that identity check. Delta attribution uses the current Run's pre/post state; it is not a general age-based stale-evidence validator.
- Read-only output may remain `reported`; the runtime gates this by assignment.mutation === read-only, not an unstamped TaskSpec permission (`isReadOnlyAssignment` in src/runner/dispatch/assignment.mjs; `classifyEvidenceToOutcomeFacts` in settlement.mjs).
- Mutating success requires post-run external evidence appropriate to the claim (`classifyEvidenceToOutcomeFacts` in src/runner/dispatch/settlement.mjs).
- Missing required reports/deltas yield `no-evidence` under the evidence floor (`classifyEvidenceToOutcomeFacts` in src/runner/dispatch/settlement.mjs, `deriveEvidenceFloor` in run-result.mjs); corrupt result records fail closed separately (`interpretRunResult`).

## Aggregation

Task or synthesis aggregation cannot raise evidence quality by majority. Failed,
missing, unsupported, or excluded branches remain visible in aggregate output.

## Visibility Boundary

Herdr pane state, terminal text, quietness, and process appearance are useful
diagnostics only. They cannot replace structured runtime and evidence records.

Read the [area portal](../README.md) and [runner spec](../../runner/spec.md)
for the consuming execution and delivery boundaries.

