# Review a38 step-03 wave5c x-p08

Part 08, one whole file. Request: `step-03-wave5c-expansion-review-request.md`. Reviewer was read-only; no checker or probe was run.

## File

- Path: `docs/doc-registry.json`
- Set: batch-127
- Stratum: L12-51-changed-file-targeted-re-review
- Edges reviewed: 825 of 825
- Verdict: **ok**

## Method

1. Loaded the record with python3. Pulled per-edge fields and `searchWitness` category counts only, with no whole-line dumps.
2. Read the pinned source (665,762 bytes, 13,916 lines) through script-driven extraction. This covers every edge region and every key family (`purposeTitle`, `currentPath`, `aliases`, `sourceCaptureIds`).
3. Re-derived the legacy reference set independently from the pinned bytes.
   - The regex `docs/(how-to|explanation|reference|tutorials|decisions|specs|history|architect)/...` gives exactly **825 occurrences**, equal to the 825 edges.
   - There is no duplicate span, no omitted occurrence and no extra edge.
   - Sweeps for partial forms (`specs/`, `architect/`, `decisions/`, `history/`), retiring basenames and `NNNN-*.md` found nothing else.
   - The one remaining hit is the bare `ADR0036` in a purposeTitle (line 4627). Under L12-49 a bare decision number is not an edge.
4. Checked each edge's `sourceSpans` text against the source at line and column. Columns are 1-based start, exclusive end. All 825 matched `matchedExpression`, and every `unitId` equals `line-L<line>`.
5. Checked the key-family split.
   - 825 edges = 343 aliases + 332 sourceCaptureIds + 146 currentPath + 4 purposeTitle.
   - `inventoryEdgeIds` equals the edge-id set.
   - `diff` is empty, `authorAddedEdgeIds` is empty and `legacyScan.candidates` is empty. That fits an all-park record.
6. Checked disposition. All 825 are `parked`, with `blockedCategory` equal to `dependencyCategory` equal to `step5-parity`, `target` and `anchor` null, and timing `none`.
   - The owner is `src/report/knowledge-projection.mjs` `computeKnowledgeProjection`.
   - It is called from `src/setup/registrations.mjs` at the pin, including `runKnowledgeMigration`, `checkDocRegistryStale` and `fixDocRegistryStale`.
   - The registry is a generated projection of the knowledge-registry event view, so hand-patching or identity rewrites are correctly refused.
7. Checked the L12-51 fix on the 332 `sourceCaptureIds` edges.
   - All 332 (329 renamed + 3 exists) carry the capture/provenance-key wording and the "L12-51 reader parity" sentence.
   - The sentence names `doc-source-unreachable` (`checkDocSourceUnreachable`) and `doc-source-conservation` (`checkDocSourceConservation`), `src/setup/registrations.mjs`.
   - It also names `doc.attest` in `src/state/knowledge-registry.mjs` and the `src/state/cleanup-harness.mjs` reader.
   - Verified against git at the pin: both checks are registered at registrations.mjs L4217 and L4222 and read `doc.sourceCaptureIds` (L4124, L4169). `knowledge-registry.mjs` L736-766 appends capture ids. `cleanup-harness.mjs` L410-419 reads them. The claim is true.
   - The non-capture families (aliases, currentPath, purposeTitle) correctly do not carry the sentence.
8. Checked `targetFacts` and the reason facts against git.
   - 154 "exists" paths: all exist as files or directories at the pin.
   - 669 "renamed" facts over 340 distinct (path, commit, successor) triples across 331 commits: every commit is an ancestor of the pin, and `git show -M30%` shows the path as a rename (or deletion) to the stated successor.
   - No renamed path still exists at the pin.
   - Illustrative edges 01911 and 01912 (`docs/specs/<area>.md`, `docs/history/<feature>/`) correctly assert no literal file and carry no `targetFacts`.
   - 01913 `docs/specs/runner.md` correctly says "tree retires at Phase 9". The retained roots (how-to, explanation, reference, decisions/index.md) carry no such suffix.
9. Checked witness groups. Categories are citation-only 388, dead 579 and carriage 9.
   - They are consistent with their counts: dead has zero live and zero carriage hits, citation-only has live hits, carriage has carriage hits only and zero live.
   - No group is miscategorised.

## OUTCOME defects

None.

## Record-text notes (not rework)

- Twelve "renamed at X to <successor>" facts name a successor that does not exist at the pin, because it was later moved or deleted.
  - Examples: `docs/how-to/smoke-test-fgos-executing-with-a-trivial-item.md` (02059) names `docs/how-to/smoke-test-fgos-code-implement-with-a-trivial-item.md`.
  - A second example names `docs/knowledge/how-to-wire-a-skill-to-an-executor-by-purpose-not-by-name/...`, deleted in `beeca503d`.
  - The rename-at-commit claim is true. The reason text does not claim the successor currently exists, so this is not a defect.
- 3 aliases edges and 3 sourceCaptureIds edges (maps-j-01940, maps-j-01941 and siblings) and the 146 currentPath edges say "current retained path stays literal".
  - They name retained roots (`docs/how-to`, `docs/reference`, `docs/explanation`). Parking them on Step 5 parity is conservative but not wrong, because the generated registry is rewritten only through the generator.

## Lead-judgment questions

1. The flat alias values of the form `docs/<topicId>/<file>.md` (for example `docs/how-to-add-a-changelog-md-entry-for-a-user-visible-change/...`), and the `docs/knowledge/...` currentPath values, are not edges.
   - Reason: the flat dirs never existed in the pin tree and are not retiring roots. `docs/knowledge/**` is retained.
   - I agree with excluding them. Flagging only because the scan rule is about retiring roots; confirm if the Lead wants never-existing flat alias directories covered.
2. `purposeTitle` edges 01910-01913 are title prose built from captures (illustrative patterns and citations).
   - They are parked under step5-parity, not preserved as capture/provenance text.
   - The disposition is conservative and consistent with the generator-owned regeneration. No change needed unless the Lead prefers to preserve them as capture text.

## Counts

- Set batch-127, stratum L12-51-changed-file-targeted-re-review: reviewed 825 edges in 1 file, rework 0 edges, 0 files.

Status: DONE
