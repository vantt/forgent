# Wave 3 review: step04-010, bin/fgos.mjs (p08, p09, p10)

Pin dc24ce645, worktree 774adbd01. Category A (outcome changed by the mechanical sweeps). One whole-file verdict across the streamed parts.

## bin/fgos.mjs
- Set: step04-010. Stratum: mandatory final-state review, whole file.
- Verdict: **ok**.
- Slots reviewed: 36 of 36 (3 parked, 2 patches covering 3 slot rows, 31 preserve rows). p08 and p09 context (lines 1-5236) was loaded from the payloads, and the pinned blob was re-read at every edge region.
- Outcome defects: none.

### Patch slots
1. **cli-006** (source line 4215). Converted from the wave-2 park to a patch.
   - The old text `docs/specs/distribution.md RUL9` becomes `docs/platform/packaging-distribution/spec.md#business-rules RUL9`.
   - Target and anchor: the spec exists at the pin. Line 644 holds "RUL9 (doctor's default path never writes anything)" under `#### Business Rules` (line 610). That is the only "Business Rules" heading in the file, so the slug `business-rules` resolves uniquely.
   - Witness: the RUL9 text says the default path never writes, and that `--fix` is the deliberate exception, reversed per `tsk-2qz`. This matches the comment's "Diagnostic by default ... writing nothing" and its "deliberate reversal" gloss on the next lines.
   - Ruling: the heading sits under `## Retained Distribution Source Detail`. The L12-62 binding Lead ruling overrides that retained-detail frame for this rule, and the record says so. This matches the wave-2 reviewer's recommendation.
   - The RUL9 label and backtick form are kept.
   - The hunk applies verbatim at line 4215. It is a comment-only change with no behavior change.
2. **class6-l-000085** (inventory rows 1056 and 1057, source lines 1057-1058). The old `docs/explanation/long-work-item-ids-max-length-guard.md` is missing at the pin. The file was moved verbatim to `docs/knowledge/why-fgos-add-now-caps-a-work-item-s-id-at-30-characters/long-work-item-ids-max-length-guard.md`, so a dead-link patch is correct under L12-60 ruling 1.
   - The anchor `why-add-had-this-gap-and-submit-didnt` matches the heading "Why `add` had this gap and `submit` didn't" (line 21 of the target).
   - The comment says "this closes the gap that let `add` accept an arbitrarily long id", which is exactly what that section explains.
   - The path is split across two `//` lines, as the original was. The hunk applies verbatim and has no behavior change.

### Parked slots
- **cli-001** (line 1737) and **cli-003** (line 1803): `docs/architect/knowledge-registry-redesign.md` §7.4 and §8.
  - The only candidate holder is `docs/platform/proposals/knowledge-registry-redesign.md` (§7.4 Attestation, §8 Producer Enforcement).
  - Its header says "non-canonical candidate conservation carrier; Canonical: No", so it is carriage and not a patch target (L12-30(3)).
  - My own search found no live holder, so the park is correct.
- **cli-005** (line 3555): `docs/specs/runner.md: "a session worktree is ..."`. The quoted rule is not present in `docs/specs/runner.md` or in any `docs/platform` or `docs/knowledge` file at the pin. The nearest text is in `docs/history/tsk-ikd-return-main-worktree-guard/RESEARCH.md:26`, which is history. Parking is the right call.
- **class6-l-000094** (line 1957): `docs/specs/<area>.md`. This is a placeholder pattern inside a writer and index contract that assumes one specs-per-area layout. A description-rewrite park is correct.

### Preserve slots
- All other docs paths exist at the pin, so none is a dead link under L12-60(4).
- `docs/history/<feature>/` convention strings, the named `docs/history/*` items, `docs/decisions/index.md` and `docs/distillery/deep-dives/tool-registry.md` stay literal as external-project conventions, design-origin provenance, or retained native paths. This follows L12-10 and L12-60 ruling 3.
- The two `docs/decisions/index.md` slots (lines 1958 and 2039) were checked as native generated-projection paths.

### Missed references and Step 5 exclusions
- A full-file scan of non-slot lines found no missed maintained-comment edge.
- Remaining hits are bare filenames (`CONTEXT.md`, `plan.md`, `distribution-vision.md`, `AGENTS.md`), which are not edges.
- Line 270 cites `plans/260825-0842-fgos-logs-dir-bucketing`, an archived dated plan, so it is history.
- Runtime strings and code (the `docs/doc-registry.*` writers, `docs/history/${id}`, the `docs/decisions/0020-...` error text, `docs/<quadrant-dir>`) are listed in `stepFiveExcluded`, which is correct.

## Record-text notes (not rework)
- The cli-001, cli-003, cli-005 and class6-l-000094 `reason` fields still repeat "A51, L12-30/31/32/58/60:" prefixes, and the `blockedReason` omits "60". This is cosmetic.
- cli-005 says "conserve the complete quoted session rule" but never notes that the quote is absent from `docs/specs/runner.md` at the pin. Mentioning that would make the park more informative.

## Lead-judgment questions
- None. cli-006 follows the L12-62 binding ruling.

## Counts
- step04-010 (mandatory re-review stratum): 1 file reviewed, 0 rework.
- Slots: 36 reviewed (5 park/patch decisions plus 31 preserve rows), 0 outcome defects.

Status: DONE
Summary: bin/fgos.mjs is ok with 0 outcome defects over all 36 slots. The cli-006 patch to the packaging-distribution spec (#business-rules, RUL9) and the id-guard knowledge patch both resolve, and the diffs are comment-only.
