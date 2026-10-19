# Step 3 wave 2, Part 01 review (reviewer: independent, read-only)

Pin: ae141550c2e022310de7a0efea757580c0b2479f. Six files, 14 edges, all read whole at the pin, all edge fields and diffs read, targets and anchors checked against pinned bytes. No checker or probe run; step-03-resolve.py used read-only for 04515/04520/03958.

## Per-file results

### 1. docs/explanation/skill-prose-cleanup-remaining-bare-citations.md (batch-036, unpatched-seeded) - ok
1 edge reviewed. maps-j-03958 (L8 `docs/explanation/skill-prose-cleanup-design.md`): preserve is correct; the path exists at the pin, docs/explanation is a retained root (owner-answers L262), and the reference is a plain retained citation. The full-file read finds no other legacy path.

### 2. docs/explanation/skill-prose-cleanup-smoke-tests.md (batch-036, unpatched-seeded) - ok
1 edge reviewed. maps-j-03959 (L8, same retained design doc): preserve correct. No other legacy path in the file.

### 3. docs/explanation/worker-prompt-iron-law-evidence-timing.md (batch-036, patched-seeded) - ok
3 edges reviewed.
- maps-j-03973 (L26, docs/how-to/produce-failing-test-first-proof-...md): patch to the docs/knowledge alias holder, anchor `#watch-out-for-running-classifyironlaw-before-committing-gives-a-false-not-required-negative`. Checked: the how-to path is absent at the pin and doc-registry aliases it to the target. The target section (L74) describes the retroactive stash-and-reconstruct scramble the adjacent sentence calls the "costly fallback recipe", and the slug matches the heading. The diff is the one-for-one replacement and keeps the trailing `'s`. The adjacent paragraph asserts no counts, ports or defaults, so there is no description mismatch. One small imprecision, not a defect: the target has three "Watch out for" sections, and the chosen one is the right one.
- maps-j-03972 (L11) and maps-j-03974 (L59), `docs/history/<id>/iron-law-evidence.md`: preserve correct. This is an illustrative placeholder convention under docs/history, which is retained and committed. It describes the shipped worker-prompt convention (L12-10, owner-answers L88), so it is not a retiring tree and nothing flips.

### 4. docs/knowledge/fix-a-project-skill-that-skill-reports-as-unknown-skill/fix-invisible-nested-project-skills.md (batch-037, unpatched-seeded) - ok
1 edge reviewed. maps-j-04264 (L15, docs/history/fgos-skill-discovery-gap/CONTEXT.md): the file exists at the pin, docs/history is retained, and it is a lineage citation inside a quoted work-item context. Preserve correct. No other legacy path in the file.

### 5. docs/knowledge/how-to-wire-an-existing-skill-s-inline-reasoning-step-throug/wire-a-skills-classify-step-through-an-agent-executor-executor.md (batch-037, patched-seeded) - REWORK
6 edges reviewed: 4 correct, 1 outcome defect (maps-j-04520), 1 correct preserve with a note (maps-j-04517).
- maps-j-04515 (L47, docs/reference/executor-cross-provider-governance.md): patch OK. The alias holder exists at the pin. The anchor is the H1 `executor-cross-provider-governance`, which is the nearest common parent because the claim spans "Field", "When the check applies" and "What happens on a violation". The adjacent text matches the target: absent or false refuses at resolve time, and the check is kind-independent since D5/D9. Diff is correct.
- maps-j-04516 (L88, docs/reference/forgentx-tool-registry-configuration.md): patch OK. The anchor slug is the true slug of the L208 heading, which states the tool-registry entry is never an automatic presence gate (tsk-62v, tsk-5tm-1 D1). The adjacent claim (the automatic check was retired at tsk-5tm-1 D1) matches target L211-241. Diff is correct.
- maps-j-04517 (L97, docs/specs/runner.md): preserve OK. The sentence is dated removed-door framing ("the earlier `execute` door was removed, decision 0062 in docs/specs/runner.md"), which is the exact L12-35(3) case. The successor note docs/platform/runner/decisions/h-36d872fbb0e5.md exists at the pin and carries `### 0062` (L1716). It is a history citation, not a live read instruction.
- maps-j-04518 (L149) and maps-j-04519 (L156): `docs/history/<feature>/CONTEXT.md` Related entries, both files exist at the pin and docs/history is retained. Preserve correct.
- **OUTCOME DEFECT: maps-j-04520 (L159, `docs/how-to/diagnose-a-blocked-return-from-an-unrelated-verify-failure.md`).**
  - Recorded disposition: preserve, with a "historical QA/implementation evidence, lineage" reason.
  - Rule: L12-34(4) makes Related entries live navigation. A Related target that no longer exists or retires is patched to its exact live holder, and the earlier lineage-preserve exception was superseded. The review request also states "Related wrappers are live navigation even on historical carriers".
  - Facts: the path does not exist at the pin (renamed at 1338628f7). doc-registry aliases it to `docs/knowledge/how-to-diagnose-a-fgos-return-blocked-by-a-verify-failure-un/diagnose-a-blocked-return-from-an-unrelated-verify-failure.md`. The live holder has a section matching the entry's own description ("real gaps hit while returning the sibling items tsk-5l2-1/tsk-5l2-2"): L111 `## Real example: two genuine gaps in return's own branch-source verify path, not stale tests`, which names tsk-5l2-1 and tsk-5l2-2.
  - Inconsistency: the same file patches the other two renamed-alias citations (04515, 04516), and the sibling file patches 03973 the same way. This is the only one left as a preserved dangling pointer.
  - Correction: patch at Phase 9 to the holder path above, anchor `real-example-two-genuine-gaps-in-return-s-own-branch-source-verify-path-not-stale-tests` (verify the extractor slug; fall back to the H1 slug only if the Lead prefers a whole-file claim). The alternative is to park it with a real blocker. Preserve cannot be justified, because the line is neither carriage, a Superseded-by wrapper, nor dated retirement framing.

### 6. docs/knowledge/why-plugin-skills-need-a-cli-path-fallback/plugin-skill-cli-path-resolution-fallback.md (batch-037, unpatched-seeded) - ok
2 edges reviewed. These are the author-added edges at L42 for `docs/how-to` (C4) and `docs/explanation` (C19), both preserved. The text describes `package.json`'s `files` field. I checked the pin: package.json still lists exactly `docs/how-to` and `docs/explanation`, both directories exist, and both are retained roots. Preserve is correct; it is a real description of a shipped manifest, not a navigation pointer. The README.md candidate exclusion at L41 is sound (an illustrative artifact filename, not a retiring path). No other hits.

## Record-text notes (not rework)
- maps-j-04520 reason: once the disposition changes, "evidence lineage" and the successor note both need rewriting.
- Wave-2 L12-26/31/35 reasons on the preserved docs/history and docs/explanation edges are boilerplate but true.

## Lead-judgment questions (outside my six files; same defect class)
1. maps-j-03951 (docs/explanation/skill-prose-cleanup-design.md L77, a body citation "a real smoke test (docs/how-to/smoke-test-fgos-code-implement-with-a-trivial-item.md)", renamed at 9ee11df05) and maps-j-04835 (docs/knowledge/why-fgos-skills-split-into-skillmd-plus-references-under-300-lines, L71, renamed at 0c32f3433) are also preserved with an "evidence lineage" reason on a renamed or missing target. They are not in my assignment. If the Lead accepts the 04520 correction, these two need the same navigation-versus-lineage check by whoever owns their parts. Their prose is a how-to pointer ("a real smoke test (path)"), which looks like navigation, not carriage.
2. 04520 depends on the Lead confirming that a body `## Related` section is "Related" in the L12-34(4) sense. The rule text says "Related header", and this one is a body list.

## Per-set counts
| Set | Stratum | Files reviewed | Rework |
|---|---|---:|---:|
| batch-036 | unpatched-seeded | 2 | 0 |
| batch-036 | patched-seeded | 1 | 0 |
| batch-037 | unpatched-seeded | 2 | 0 |
| batch-037 | patched-seeded | 1 | 1 (wire-a-skills-classify..., maps-j-04520) |

Part total: 6 files, 14 edges reviewed; 1 file needing rework, with 1 outcome defect. The batch-037 patched-seeded stratum is 1 of 1 files (100%), above the 3% threshold, so the expansion rule applies to every surviving file of batch-037 if the Lead upholds the defect.
