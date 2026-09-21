# Phase 00 - Unit 0C Baseline and Replay Harness Report

- Outcome: `passed`
- Next Unit Ready: `true` (ready for Unit 0D)
- Reproducible Command: `node scripts/measure-coordination-baseline.mjs --corpus test/fixtures/coordination-baseline/sessions --output plans/260919-coordination-skill-harness-simplification/reports/phase-00-unit-0c-baseline-replay-measurement.json`
- Generated JSON Path: `plans/260919-coordination-skill-harness-simplification/reports/phase-00-unit-0c-baseline-replay-measurement.json`

## 1. Executive Summary

Unit 0C implements a fully deterministic, reproducible baseline and replay measurement harness (`scripts/measure-coordination-baseline.mjs`) adhering strictly to the `coordination-baseline.v1` contract. The harness measures canonical skill footprints, evaluates eight deterministic scenario fixtures, and performs semantic normalization and hashing across local and portable replay corpora without mutating state.

## 2. Baseline Metadata & Metrics

- Contract Version: `coordination-baseline.v1`
- Source Commit: `7853e4d7d6881665fb57e2a5d730428ae4e96486`
- Node Environment: `v24.18.0`
- Lockfile Digest: `sha256:b097ecd850ca73e265a2dcbf94c63aa48c118069db53d42b00996fecd83fe2fc`
- Dirty Fingerprint: `sha256:7b2db82364d74f71e260384650c698173020464d54f2abe7359f9083077816d8`

### Skills Instruction Footprint
| Skill Path | Bytes | Words | Lines |
|---|---:|---:|---:|
| `core/skills/fgos-plan-loop/SKILL.md` | 42,631 | 5,160 | 760 |
| `core/skills/fgos-architecture-panel/SKILL.md` | 63,985 | 9,006 | 971 |
| `domains/coding/skills/fgos-code-panel/SKILL.md` | 53,835 | 7,049 | 915 |

### Measured Corpus Sessions (Authoritative Replay)
| Session ID | Schema | Events | Dispatches | Retries | Waves | Prompt Bytes | Status / Outcome |
|---|---:|---:|---:|---:|---:|---:|---|
| `s1-clean` | 1 | 4 | 1 | 0 | null | 34 | `completed` |
| `s2-clean` | 2 | 4 | 1 | 0 | null | 34 | `active` |
| `s3-clean` | 3 | 7 | 2 | 0 | null | 34 | `completed` |

### Declared Scenario Fixture Expectations (Comparison Baseline)
> Note: Scenario metrics reflect declared benchmark fixture expectations from canonical scenario definitions.

| Scenario ID | Prompt Bytes | Input Tokens | Output Tokens | Dispatches | Waves | Duration (ms) | Evidence Outcome |
|---|---:|---:|---:|---:|---:|---:|---|
| `clean-plan-loop-shaped` | 154 | null | null | 3 | 2 | 0 | `verified` |
| `accepted-finding-remediation-recheck` | 240 | null | null | 5 | 3 | 0 | `verified` |
| `architecture-advisory` | 185 | null | null | 4 | 2 | 0 | `verified` |
| `human-turn-reopen` | 210 | null | null | 5 | 3 | 0 | `verified` |
| `rfc-review` | 160 | null | null | 3 | 2 | 0 | `verified` |
| `nominal-group-technique` | 175 | null | null | 4 | 2 | 0 | `verified` |
| `delphi-method` | 190 | null | null | 4 | 3 | 0 | `verified` |
| `explicit-close-success-refusal` | 145 | null | null | 2 | 2 | 0 | `verified` |

Tokens are strictly set to `null` per specification because providers did not report live token consumption for fixtures.

### Replay Corpus Verification
- Corpus Present: `true`
- Portable Session Count: `3`
- Schemas Breakdown: Schema 1: 1, Schema 2: 1, Schema 3: 1
- Semantic Digest: `sha256:19cec57f20b09491d0654e1bd5183db46f3b63412ad4ee2084779486e4e5bc7a`
- Failures: `0`

## 3. Behavior and Invariant Proofs

The test suite (`test/runner/coordination-baseline-measurement.test.mjs`) proves all required invariants:
1. **Determinism**: Multiple harness runs over identical inputs yield identical `semanticDigest` values.
2. **Portable Fixtures Coverage**: Portable fixtures under `test/fixtures/coordination-baseline/sessions/` explicitly cover Schemas 1, 2, and 3 without error.
3. **Mutation Sensitivity**: Changing any replay-relevant semantic field (manifest status, objective, event payloads, or `run-retried` events) alters the `semanticDigest`.
4. **Read-Only Guarantee**: Tested with filesystem mtime checks verifying source manifests and events are never modified during replay.
5. **No Silent Pass on Missing Corpus**: Passing a non-existent corpus directory outputs `corpusPresent: false`, `sessionCount: 0`, and `semanticDigest: null`.
6. **Authoritative Retry Counting**: Verified that `run-retried` ledger events increment `retryCount` accurately.
7. **Wave Contract Honesty**: Replay sessions without formal wave contracts report `sequentialWaves: null` rather than synthesizing heuristic counts.

Test Output:
```
✔ baseline harness contract and output shape (242.007975ms)
✔ baseline harness produces deterministic semanticDigest across multiple runs (423.828823ms)
✔ portable fixtures cover schema 1, 2, and 3 cleanly (2.096756ms)
✔ mutation-sensitive negative test: modifying a semantic field alters the semantic digest (1.239325ms)
✔ read-only corpus proof: corpus input is never mutated (0.640578ms)
✔ missing corpus is reported clearly without silent pass (0.150063ms)
✔ unsupported schema and corrupt event log are reported in failures and fail CLI with non-zero exit (0.989592ms)
✔ negative test: missing assignment record causes replay failure without synthesizing fake assignment (0.574597ms)
✔ F-03: replayCorpusFromDirectory returns measuredSessions and formatMarkdownReport distinguishes measured vs declared fixtures (52.487768ms)
✔ F-02: mutation test for run-retried event counting and semantic digest sensitivity (1.895067ms)
ℹ tests 10
ℹ suites 0
ℹ pass 10
ℹ fail 0
```

## 4. Changed Files and Symbols

- `scripts/measure-coordination-baseline.mjs` (new script): `runBaselineHarness`, `replayCorpusFromDirectory`, `normalizeSemanticSession`, `stableStringify`, `measureSkills`, `loadScenarios`, `formatMarkdownReport`.
- `test/fixtures/coordination-baseline/sessions/` (new portable fixtures): `s1-clean`, `s2-clean`, `s3-clean`.
- `test/fixtures/coordination-baseline/scenarios.json` (new scenario definitions).
- `test/runner/coordination-baseline-measurement.test.mjs` (new test suite).
- `plans/260919-coordination-skill-harness-simplification/reports/phase-00-unit-0c-baseline-replay-measurement.json`.

## 5. Residual Risks

- The local repository corpus has no legacy Schema 2 sessions, so Schema 2 replay reliance is anchored on portable test fixtures.
- GitNexus capability resolver returned `out-of-process` (`executorId: "gemini"`), noted as conflict with inline execution rules; work was conducted inline with test evidence.

## 6. Readiness for Unit 0D

All requirements for Unit 0C are satisfied and verified. Ready to proceed to **Unit 0D — Shared pure legality facts**.
