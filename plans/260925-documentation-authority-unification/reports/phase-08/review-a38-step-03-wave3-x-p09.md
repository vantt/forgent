# Review a38 step-03 wave3 expansion, Part 09

Pin: ae141550c2e022310de7a0efea757580c0b2479f (worktree 5a4ca0621, read-only). No checker or probe was run.
Method: each of the 6 consumers was read whole at the pin with `git show`. For every record I printed edgeId, sourceSpans, matchedExpression, disposition, unitId, target, anchor, timing, reason, blocked/dependency fields, targetFacts, searchWitness, the diff and the legacy-scan candidates. Targets and registry aliases were checked at the pin. L12-38 and the authoring-rules digest were applied. All files are under 60 KB, so each was read in full.

## Per-file results (all batch-065, stratum full-set-expansion)

| File | Edges | Verdict |
|---|---:|---|
| docs/explanation/fgos-gateway-lifecycle-verb.md | 0 | ok |
| docs/explanation/fgos-lifecycle-tracking-concurrent-desync.md | 2 | ok |
| docs/explanation/fgos-preflight-verb.md | 0 | ok |
| docs/explanation/fgos-return-skip-redundant-verify.md | 1 | ok |
| docs/explanation/fgos-write-rejected-structural-deadlock.md | 2 | ok |
| docs/explanation/footprint-diff-research-md-noise.md | 7 | ok |

### Zero-edge files (gateway-lifecycle-verb, preflight-verb)
Both were read in full, and each has empty edges, an empty diff and an empty scan-candidate list.
- gateway-lifecycle-verb: it names only code paths, `.fgos/gateway.json`, `~/.fgos/config.json` and the retained `AGENTS.md`. It has no legacy-root path, Markdown link or retiring basename. I found no missed reference.
- preflight-verb: it has the bare "decision 0017" with no path (not an edge, L12-38(7)), plus `scripts/*` code paths. I found no missed reference.

### fgos-lifecycle-tracking-concurrent-desync
- 03862 (L22, `docs/history/events-jsonl-merge-abort-truncation-gap/RESEARCH.md`): preserve. The file exists at the pin and docs/history is a retained path. Correct.
- 03863 (L36, `docs/how-to/resolve-an-events-jsonl-truncation.md`): patch, Phase 9.
  - The doc-registry alias maps it to `docs/knowledge/how-to-respond-when-fgos-doctor-reports-a-shared-fgos-events/resolve-an-events-jsonl-truncation.md`, which exists at the pin.
  - Anchor `why-this-is-different-from-a-merge-conflict-break` is a real heading, and L22-25 under it describes the stash/checkout/reset/clean-on-shared-main fingerprint.
  - The adjacent description "git-stash/checkout/reset/clean-on-shared-main-checkout fingerprint ... already documents" is true for the target, so there is no false-description problem.
  - The diff is a single hunk replacing only the path, with the anchor appended.
  - It is consistent with sibling dated explanation files that patched aliases (03738, 03740, 03850, 03851 and others).

### fgos-return-skip-redundant-verify
- 03864 (L59, relative link `events-jsonl-concurrent-data-loss-investigation.md`): preserve. It resolves to the retained `docs/explanation/events-jsonl-concurrent-data-loss-investigation.md`, which exists at the pin. Correct.
- The bare `coding-worker-contract.md` at L19 sits in dated history, where bare names are exempt (L12-38(5)). The only same-basename holders are `core/skills/_shared` and `docs/reference/coding-worker-contract-shape.md`, neither a retiring-tree path.

### fgos-write-rejected-structural-deadlock
- 03865 (L47) and 03866 (L54): both parked, step5-parity.
  - The doc describes the literal recovery path emitted by the production refusal message. `src/runner/merge.mjs:996` at the pin still emits `docs/how-to/fix-fgos-write-rejected-merge-block.md`. L52-59 also makes a historical "does not exist on disk" claim, so repointing alone would falsify it.
  - The registry alias is recorded in the searchWitness (alias lookup hit, 20 live hits, hitsSha256 bound). The reason states the rename commit.
  - Category equals dependencyCategory.
  - Disposition matches the sibling records 03924/03925, which are parked step5-parity. Correct.

### footprint-diff-research-md-noise (7 edges)
- 03867 (L2), 03868 (L10), 03871 (L33), 03872 (L39) and 03873 (L40): preserve, illustrative `<feature>`/`<id>` patterns under the retained docs/history directory. Correct under ruling 4. The reasons say "no literal placeholder file is asserted", which is true.
- 03869 (L23): preserve. `docs/history/data-dictionary-no-stuck-merge-abort-drift/RESEARCH.md` exists at the pin. Correct.
- 03870 (L26, `docs/specs/distribution.md`): preserve, tree retires at Phase 9.
  - The reference is a past item's footprint list inside a dated explanation, a pure historical fact and not a read instruction. Preserve is correct.
  - No retirement or "superseded by" framing is present, so no successor note is required. The six sibling explanation preserves that carry a successor note all sit under the "Removed door" banner, which this file lacks.
- No missed references. L16 `.agents/skills/...` is a generated render target, outside the legacy path-edge scope. L9, L58 and L66 are code or test coordinates.

## Outcome defects
None.

## Record-text notes (not rework)
- maps-j-03870: the reason's "Source-bound passage" quotes text from L15-23, truncated mid-token (`"docs/his`). The edge's actual unit is L26, which is the sentence "(`plan.md` + `docs/specs/distribution.md`)". This is cosmetic record text.

## Lead-judgment questions
None. L12-38 settles every case here.

## Counts
- Set batch-065, stratum full-set-expansion: reviewed 6 files (12 edges) / rework 0.
- Edges by disposition: preserve 8 (03862, 03864, 03867-03873 minus none; 03862, 03864, 03867, 03868, 03869, 03870, 03871, 03872, 03873 = 9 preserve), patch 1 (03863), parked 2 (03865, 03866). Total 12.
- Overlap: none within this part.

Status: DONE
