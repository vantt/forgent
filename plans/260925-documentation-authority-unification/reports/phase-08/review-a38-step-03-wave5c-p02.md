# Wave 5c review, part p02: docs/doc-registry.json

Pin ae141550c; record step-03-records/batch-127.jsonl (set batch-127, mandatory file, indivisible generated file). Source 13,916 lines / 665,762 bytes. I read the record per field, the full source structure, the generator and the readers. No checker or probe was run.

## Verdict: rework (one defect class, 332 edges; every disposition is correct)

Edges reviewed: 825 of 825 (maps-j-01910 .. maps-j-02734). All 825 are parked / step5-parity, target null, anchor null, diff empty.

### Verified OK
- **Spans.** All 825 spans match the pinned source (line text, matchedExpression). Columns are 1-based. No duplicate spans.
- **Field and line claims.** All 825 "at source line N" values equal the span line. Field labels match the source for 4 purposeTitle edges (1882 x2, 2739, 4497) and 146 currentPath edges. The aliases-array label is right for 343 edges and wrong for 332 (see Defect).
- **Missed references.** None. The inventory legacy, planning and evidence regexes give 2 matches in the file, both covered. A separate scan for docs/(how-to|explanation|reference|tutorials)/ found 0 uncovered tokens. Specs, architect, history, decisions, contracts and ui-spec tokens are also all covered.
- **Park target.** `src/report/knowledge-projection.mjs computeKnowledgeProjection(view)` serializes `JSON.stringify({topics, docs})` from the event view. `src/setup/registrations.mjs` (checkDocRegistryStale / fixDocRegistryStale) calls it and compares or writes docs/doc-registry.json. `fgos doc-registry` is registered at command-registry.mjs:1856. This matches owner-answers L12-26 and L12-38. A generated file is never hand-patched, so parking it is correct, with no alias rewrite or store access.
- **Reason text.**
  - 669 edges say "renamed at <sha> to <path>". For all 340 distinct (sha, source, target) triples, `git show --name-status -M <sha>` confirms the rename. No source path still exists at the pin.
  - 153 "exists at author pin" edges: every path is in the pinned tree. This covers 146 currentPath values, 6 aliases and 1 purposeTitle (docs/decisions/index.md, 3 edges).
  - maps-j-01913 (docs/specs/runner.md) says "tree retires at Phase 9". The file exists and docs/specs/** retires.
  - maps-j-01911 (`docs/specs/<area>.md`) and maps-j-01912 (`docs/history/<feature>/`) say "illustrative convention/pattern ... no literal placeholder asserted". Correct for the wildcard forms inside a title.
- **No false never-existed or removed-at claims.**

### OUTCOME defect (description)
**D1: 332 sourceCaptureIds entries are described as "aliases array value".**
- Edges: maps-j-01915 (line 5794) through maps-j-02588 (line 11614), whose source line is a member of a `"sourceCaptureIds": [` array. There are 332; the other 343 array edges are really in `aliases`.
- Source example: line 5793 `"sourceCaptureIds": [` and line 5794 `"docs/how-to/add-a-changelog-entry-for-a-user-visible-change.md"`.
- Where it appears: the `blockedReason` / `dependency` text "generated aliases array value ... verify ... lookup identity/alias preservation ... aliases are lookup data". It is repeated in the `searchWitness.assessment` text.
- Rule: L12-32(5) and review-method "false adjacent description". The smallest real blocker must be accurate (owner-answers L12-30 item 2).
- Why it matters:
  - sourceCaptureIds are the doc's capture/provenance keys, not alias lookup data.
  - Readers do consume them: `checkDocSourceUnreachable` and `checkDocSourceConservation` in src/setup/registrations.mjs (about lines 4107-4180) resolve path-shaped sourceCaptureIds through the registry. `doc.attest` in src/state/knowledge-registry.mjs appends to the same field, and src/state/cleanup-harness.mjs reads it.
  - The park therefore also depends on that reader parity, which the text omits.
- Correction: relabel those 332 edges "sourceCaptureIds array value". Name the doc-source-unreachable and doc-source-conservation reader parity next to the generator. Keep the park and everything else.

### Record-text notes (not rework)
- 12 of the 340 rename triples (13 edges: maps-j-01956, 01983, 02044, 02059, 02082, 02087, 02088, 02089, 02090, 02103, 02112, 02137, 02534) name a rename target that is itself absent at the pin. The target was deleted or renamed again by a later commit. Examples: c681f353c capacity to executor rename, then deleted at a416d326d; 217e30f74 then beeca503d. The "renamed at X to Y" claim is true for that commit. It would be tighter to say "later moved or deleted".
- The reasons are templated per field, but each carries a real per-edge fact (line, sha or target), so I do not call it boilerplate.
- docs/enduser-docs-index.json is mentioned inside a purposeTitle (line 3606) and has no edge. It is free prose in generated title text and not a mapped legacy root. No action.
- About 330 alias values of the form `docs/<topic-slug>/<role>.md` (an old pre-knowledge layout) have no edge. They are outside the mapped legacy roots and are lookup data. Flagged only so Lead knows they were not counted.

### Lead-judgment questions
1. step-03-wave5c-lead-ruling-gaps.json lists no open edges for batch-127. I found nothing that needs a new ruling.
2. Does D1 count as a file rework? I counted it, because 40% of the edges carry a false field label. If Lead treats it as record-text only, the numerator is 0.

## Counts
- batch-127 / mandatory stratum: reviewed files 1, rework 1 (100%, above the 3% threshold). The denominator is 1 and there is no other file in the set to expand to.
- Patched and unpatched strata for batch-127: population 0, reviewed 0, rework 0.
- Edges: 825 reviewed, 332 with a description defect, 0 with a wrong disposition, target, anchor or diff, 0 missed references.

Status: DONE
Summary: docs/doc-registry.json parks all 825 edges on generator parity; spans, targets, rename and existence claims, and coverage are correct and no references are missed. Rework is needed because 332 sourceCaptureIds entries are mislabeled "aliases array value" and the reader parity is not named.
