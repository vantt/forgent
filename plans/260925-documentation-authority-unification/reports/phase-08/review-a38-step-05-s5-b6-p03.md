# Review p03 (seam 5 judgment files, batch 6), pin 5eb9dc609

Scope: 8 fixture files, 69 items (46 literal references + 23 dynamic/ordinal tuples... counted from payload: 24+5+7+2+2+4+4+19). No diffs, no parks, no admits: every item is REJECT / preserve.

## Per file
- test/fixtures/run-outcome/legacy-derivation.json: ok, 24 items. Consumers are test/runner/run-outcome.test.mjs and packages/run-result/rust/src/lib.rs:795. Both feed `record` to runOutcome and compare category/satisfied/infraFailure only. Paths are recorded `evidence.changedFiles` / exclusion `path` values and are never opened. Reject is correct.
- test/fixtures/run-result/real-shapes/03-v1-done-inferred.json: ok, 5 items. Same recorded-evidence changedFiles shape. No test or Rust consumer found by git grep at the pin (only the archived plan mentions the directory). Reject/preserve is correct.
- .../05-v1-done-reported.json: ok, 7 items. Same.
- .../09-v2-failed-needs-input-provider.json: ok, 2 items (docs/specs/runner.md, coordination-session.md as recorded excluded paths). Same.
- .../10-v2-failed-refuse-provider.json: ok, 2 items. Same.
- .../14-v2-completed-blocked-reported.json: ok, 4 items. Same.
- .../15-v2-completed-not-applicable-failed.json: ok, 4 items. Same.
- test/fixtures/usage/pi-multiturn-no-agent-end.jsonl: ok, 19 items (13 literal references on lines 4/5/12, 6 dynamic tuples dynamic-019600..019605). Sole consumer is parsePiUsage in test/runner/usage-parsers.test.mjs:37-47, which asserts token counts only. Paths are inside recorded assignment prompt text. Reject is correct, including the absolute sibling-worktree path (004119) and the `docs/how-to/` and `docs/architect/agent-coordination/` prefixes.

## OUTCOME defects
None. Same-passage items agree (all reject/preserve), no admitted item, no patch, no park, no diff to check. Retired decision citations: none of these items cite a decision id, so no successorNote is owed. Paths into docs/specs/** and docs/architect/** are rejects, not preserves resting on a retained witness, which is the correct treatment.

## Record-text notes
- Every item uses nonDocumentUse `config-or-metadata`. The true use is "recorded runtime transcript or result payload data (string content never opened as a path)". Label is loose but not false enough to change the outcome.
- Dynamic tuples dynamic-019600..019605: `targetSetOrConstruction` is an unrelated slice of prompt text (e.g. "scope:\n\n(1) Execute the schema migration matrix..."), not a construction. Harmless for a reject, but not informative.
- The 03-v1-done-inferred reasons embed the quoted path; fine.

## Lead-judgment questions
- None blocking. Optional: real-shapes/*.json has no consumer at the pin outside the archive. If Phase 9 intends to retain them, the reject stands either way, since they only hold recorded strings.

Counts: 8 files ok, 0 rework, 69 items reviewed, 0 outcome defects, 3 record-text notes.

Status: DONE
