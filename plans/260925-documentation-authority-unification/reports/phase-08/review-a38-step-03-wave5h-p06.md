# Review a38 step-03 wave5h p06

Pin ae141550c2e022310de7a0efea757580c0b2479f. Read-only, no checker or probe run. Source read via git show at the pin.

## File 1: docs/platform/runner/decisions/h-36d872fbb0e5.md (batch-115)

- Set: batch-115 (targeted re-review). Stratum: patched (diff is one Related line, 07617).
- Bindings: blob ba513fc647c1, record line sha256 8b644e815dc1, diff sha256 a3468681d9c8, record digest 69944091cf07.
- Reading: all 70 edges in one page. The source is 1769 lines / 182 KB, so I read the header (L1-45), the heading outline, L112 and the surrounding area, and every edge region plus a full grep for legacy readings (specs/, decisions/, runner.md, platform-foundations, NNNN-*.md, docs/history|how-to|explanation|distillery|reference).
- Verdict: **rework** (one missed reference).

### Outcome defect

1. **Missed reference, L112 `specs/runner.md:26`** (source line 112, columns 2-20, "trích tại `session.mjs:1-6` và `specs/runner.md:26`").
   - The record has no edge for it. `checks.coverage.legacyScan` lists it as a contextual exclusion with the reason "Actual consumer/stated-parent coordinates do not resolve to a retiring legacy document ...".
   - L12-53 rules that "an elided legacy path with a locator in history (`specs/runner.md:26`, batch-115 L112) gets a preserve edge for coverage". The partial `specs/<name>.md` form is covered by L12-32(4) and L12-34(5).
   - The exclusion reason is also false. It is the elided form of docs/specs/runner.md, which exists at the pin, and it is not unrelated.
   - Correction: add an author-added preserve edge at L112 cols 2-20 with text `specs/runner.md:26`, normalizedReference docs/specs/runner.md. The reason should say "tree retires at Phase 9" and carry a non-executable successor note to docs/platform/runner/spec.md. It should be framed as a captured history citation (the "tsk-1an tái hiện" account inside the retired-decisions history). Remove the contextual exclusion, and make sure the reason does not claim the path is unrelated.

### Edges that pass, by focus

- **The ten L12-52(1) edges** (07625, 07628, 07636, 07640, 07641, 07644, 07649, 07650, 07651, 07667) are all correct.
  - Each preserves and carries an internal-correspondence note.
  - The note names the exact consumer heading and its line, and I checked all six against the source: 0021 L211, 0025 L511, 0026 L583, 0028 L757, 0029 L819, 0030 L921.
  - Number and title both match the resolved deleted full name, which is right for elided short forms like `docs/decisions/0025` and `0030`.
  - No self-link, no successor note, and the removal commit is stated.
- **07617** is a Phase 9 patch of Related to docs/platform/runner/spec.md, which exists at the pin. The record diff matches (one `-`/`+` line at L18). It is a whole-area Related pointer with no count or section claim, so it is acceptable.
- **07616** (Provenance L10) preserves per L12-47, with a successor note to the runner spec.
- **07618** preserves as correction evidence (L12-40, L12-51(1)).
- **07615, 07619, 07620, 07627, 07629, 07643, 07653, 07672-07674** preserve the retained root `docs/decisions` directory. These are literals inside the retired-corpus history account, so preserve is fine.
- **The `docs/history/*`, how-to, distillery and explanation edges** (07621, 07630-07635, 07637, 07639, 07646, 07648, 07654, 07656-07658, 07661-07671, 07675-07677) preserve with the correct renamed/removed facts and successor notes. I spot-checked that the successor knowledge paths exist at the pin: executor-aware dispatch, gate-bypass-design, and the iron-law evidence contract.
- **The remaining edges** all preserve and look correct: 07622, 07652, 07659 and 07660 (specs/runner.md successor notes), 07624, 07626, 07638, 07642, 07645, 07647, 07655, 07678-07682, and the two L23 `runner.md:<line>` coverage edges.
- **Contextual exclusions other than L112** are fine as bare basenames or directory fragments inside dated history: `0000-index.md` L1084, `confinement-authority.md`, `agent-report.md`, and `docs/how-to|reference|explanation` at L1733.
- No other legacy reading is missed in the greps.

### Record-text notes (not rework)

- 07638, 07645 and 07647 say the removed `docs/decisions/0000-index.md` has "no successor file". L12-51 record-text asks to name the generated index docs/decisions/index.md (it exists at the pin) beside the removed index.
- The ten internal-correspondence notes were not judged for shape, per the brief.

## File 2: docs/platform/system-architecture/history/architect-readme.md (batch-117)

- Set: batch-117 (targeted re-review). Stratum: unpatched (diff is empty, no patch edges).
- Bindings: blob a48c61785552, record line sha256 decc74c90f06, empty diff, record digest c5f844433fb0.
- Reading: all 18 edges and the full source (85 lines).
- Verdict: **ok**.

### Edges

- **07786** (Related L17, `docs/architect/README.md`) is correct for L12-52(2).
  - It parks as description-rewrite with category/dependency category equal.
  - It correctly states that carriage begins at the "## Added in candidate: README source carriage" marker at L24, with the introductory boundary at L26.
  - It treats the Related line above that marker as live wrapper text, and keeps literal body links unchanged.
  - The wrapper's other Related entry (`docs/platform/README.md`) is not a retiring path.
- **07785** (Provenance L9) preserves, and the reason quotes the carriage declaration.
- **07787** (L26 carriage sentence) preserves.
- **07788-07802** (the carried body links at L42-85) preserve inside literal carriage. Reasons cite the declaration and make no existence claims, as L12-35(4) requires.
- No missed reference: L35 `agent-coordination/` and `component-boundary/` are bare directory fragments inside carriage, which are exempt.

## Counts

| Set | Stratum | Files reviewed | Rework | Edges |
|---|---|---|---|---|
| batch-115 | patched | 1 | 1 | 70 |
| batch-117 | unpatched | 1 | 0 | 18 |

Reviewed / rework overall: 2 files / 88 edges, 1 file rework. Rework is 100% in batch-115 and 0% in batch-117. Under A51 the batch-115 rework breaches 3% and expansion is Lead's call. L12-53 already states batch-115 expansion is "every remaining file" for the earlier request. No pooling.

## Lead-judgment questions

- Is the L112 edge to be added in this pass, or is the L12-53 ruling already satisfied elsewhere? I found no edge in the record and a contrary exclusion text, so I report it as rework.

## Checker limitations

None found in these two files.
