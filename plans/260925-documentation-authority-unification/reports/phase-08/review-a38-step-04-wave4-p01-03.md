# Wave 4 review: step04-010, bin/fgos.mjs (p01, p02, p03)

Pin dc24ce645. One whole-file verdict across the three streamed parts. Source context (p01 lines 1-2696, p02 lines 2697-5236) was read through EOF from the payloads; the pinned blob was re-read at every edge region. Reference: wave 3 verdict review-a38-step-04-wave3-p08-10.md.

## bin/fgos.mjs
- Set: step04-010. Stratum: wave 4 outcome-change review, whole file.
- Verdict: **ok**.
- Slots reviewed: 29 of 29 (4 parked including the new one, 2 patch slots, 23 preserve slots).
- Outcome defects: none.

### New slot: line 2974 `docs/<quadrant>/` (edgeId null, authorAddedEdge, sweepOrigin L12-63-retiring-placeholder-scan)
- Source: the comment above `case 'docs-index'` reads "Enumerates the real end-user docs under docs/<quadrant>/ for each of the four Diataxis quadrants (enduser-index.mjs's QUADRANTS)". It is a maintained prose comment, so under the Lead ruling the placeholder is an edge. Columns 33..49 match the span text.
- Disposition: parked, timing none, no target or anchor, blockedCategory description-rewrite. This is correct.
  - The claim is a present-tense input-layout claim about a retiring quadrant root.
  - My own search at the pin found no live non-history holder of `docs/<quadrant>/`. The hits are core/skills/fgos-indexing/SKILL.md:20 and :41, core/task-specs/fgos-indexing.md:6, docs/architect (retiring), docs/backlog.md and docs/history (history). A patch target would therefore be invented, which the L12-62 passage-content rule forbids.
  - The park ties to the indexing skill and task-spec rewrite plus Step 5 scanner/writer parity, which is consistent with the request note.
  - No diff hunk is attached (diffHunk null). No executable byte changes. The comment line is untouched.
- It correctly does not conflate `docs/<quadrant>/` with the runtime flag `--quadrant <docs/quadrant-dir>` at line 3064. That string is in stepFiveExcluded.

### Unchanged versus wave 3 (no outcome change)
- Patch hunks are byte-identical to wave 3. The diff has exactly two hunks and both are comment-only.
  - Line 4215 (cli-006): `docs/specs/distribution.md RUL9` becomes `docs/platform/packaging-distribution/spec.md#business-rules RUL9`. The target exists at the pin.
  - Lines 1057-1058 (class6-l-000085): `docs/explanation/long-work-item-ids-max-length-guard.md` becomes the moved `docs/knowledge/why-fgos-add-now-caps-a-work-item-s-id-at-30-characters/...md#why-add-had-this-gap-and-submit-didnt`. The target exists at the pin.
- Parked slots are unchanged and have the same dispositions: cli-001 (1737) and cli-003 (1803), both `docs/architect/knowledge-registry-redesign.md`; cli-005 (3555), `docs/specs/runner.md`; class6-l-000094 (1957), `docs/specs/<area>.md`.
  - cli-005 now also states that the quoted session rule is absent from docs/specs/runner.md. This is the record-text improvement I suggested in wave 3. The disposition is unchanged.
- All 22 other preserve slots keep the same dispositions: `docs/history/*` conventions and named history evidence, `docs/decisions/index.md` at lines 1958 and 2039, and `docs/distillery/deep-dives/tool-registry.md`. This follows L12-10 and L12-60 ruling 3.
- Missed-reference scan of the whole file: the docs path tokens are all slotted, in stepFiveExcluded, or existing live paths.
  - `docs/doc-registry.md`, `docs/doc-registry.json`, `docs/history/${id}`, `docs/decisions/0020-...` (error text at 5108) and `docs/quadrant-dir>` are runtime strings and listed in stepFiveExcluded.
  - `docs/enduser-docs-index.json` (comment at 2043) exists at the pin.
  - No retiring root (`docs/specs`, `docs/architect`, `docs/explanation`, `docs/reference`, `docs/how-to`, `docs/tutorials`) remains un-slotted in any maintained comment.

## Record-text notes (not rework)
- Reason fields on the four older parks still carry the "A51, L12-30/31/32/58/60:" prefix. The new slot's `reason` begins "Description rewrite: A51, ..." and its blockedReason omits the A51 prefix. The text differs slightly from its dependency field. This is cosmetic.
- The new slot's `reason` is long. It correctly quotes its own source passage.

## Lead-judgment questions
- None.

## Counts
- step04-010 (wave 4 outcome-change stratum): 1 file reviewed, 0 rework.
- Slots: 29 reviewed (1 new park changing outcome, 28 unchanged vs wave 3), 0 outcome defects.

Status: DONE
Summary: bin/fgos.mjs is ok. The new line-2974 `docs/<quadrant>/` slot is correctly parked as a description rewrite, because no live holder exists. No other slot's disposition, target, anchor or diff changed versus the wave 3 verdict.
