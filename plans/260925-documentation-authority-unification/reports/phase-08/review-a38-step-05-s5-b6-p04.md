# Review: step-05 seam 5, batch 6, part p04

## test/fixtures/usage/pi-multiturn-normal.jsonl
Verdict: ok. Items reviewed: 222 (99 literal references, 123 dynamic tuples). No diff, no rollback diff, no parks, no co-cut paths.

Basis for the verdict:
- The fixture is a 13-line recorded pi session transcript. The only reader is test/runner/usage-parsers.test.mjs, at lines 21 and 142 of the pin. It runs parsePiUsage and parseUsageForAdapter over the file and asserts only token counts (12924+14083, 391+172, 512+640, 13827+14895). It never reads, compares or constructs a document path or document wording from the fixture, so it is not a consumer of any referenced document.
- Every docs/architect/**, docs/how-to/** and docs/specs/runner.md string sits inside recorded agent prompt, tool-argument or tool-result text. Nothing here builds a path. A rewrite would only falsify the historical transcript and change the parser fixture without any document-path benefit.
- The 123 dynamic tuples (path.join(...), template literals, `tempDir = mkTempDir()` and similar) are fragments of code or text quoted inside the transcript's JSON strings. They execute nothing, so REJECT with no pathOperand is true.
- Same-passage agreement holds: lines 4, 5 and 13 carry 99 literals and 123 tuples, all REJECT/preserve. The windows show no admitted operation.
- No preserve rests on a "retained" witness for a docs/specs or docs/architect target. The reason text says "immutable recorded transcript", not "retained".
- No docs/decisions or ADR citation exists anywhere in the file, so no successorNote is owed. A grep of the pinned bytes finds 0 hits.
- The 136 docs/architect, 32 docs/how-to and 17 docs/specs strings are all covered by the 222 items.

OUTCOME defects: none.

Record-text notes (not outcome defects):
1. nonDocumentUse is `config-or-metadata` on 122 of 123 tuples and on all 99 literals. A label like "recorded-transcript-data" would describe the use more truthfully. The label is vague but not false.
2. dynamic-019662 (line 13) carries nonDocumentUse `plans-report-artifact` with the R11 reason. It is one tuple in a transcript that also contains docs paths. This is consistent with the R11 ruling (plans/** is not a census root). The outcome is the same as the rest of the passage (reject/preserve), so there is no R7 conflict. Only the label differs from its same-passage siblings.
3. proofCommand reads "Phase 9 owning importer replay". The real owner is test/runner/usage-parsers.test.mjs, parsePiUsage and parseUsageForAdapter. Naming those tests and assertion lines would satisfy the R22 "record the owning test name and assertion lines" instruction more precisely. Under R22 no replay is needed for a preserve.
4. Literal rows with matchedExpression ending in `\n` or `??` are span captures that include JSON escapes. They are harmless.

Lead-judgment questions: none.

Counts: 222 items, 222 reject/preserve, 0 admit, 0 patch, 0 park, 0 successorNote needed. The pathOperand obligation does not apply (no admitted tuple). Every rejected tuple's nonDocumentUse is true in substance.
