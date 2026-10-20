# Review a38 step-03 wave5c x-p10

Part 10, one file, batch-130 (stratum L12-51-every-remaining-batch126-or130-file).

## docs/operator-runbook-herdr-cockpit.md

- Set: batch-130
- Stratum: L12-51-every-remaining-batch126-or130-file
- Verdict: **ok**
- Edges reviewed: 2 of 2 (maps-j-05084, maps-j-05085). The source is 74 lines and was read whole. The full diff was read.
- Record hashes were not recomputed. I used the index values: recordSha256 16a30a28..., diffSha256 36bd7d07.... The diff printed from the record shows two one-line hunks, which matches the index.
- Not a retiresWithTree record. It lives at docs/ root, not under docs/specs/** or docs/architect/**.

### Edges

| Edge | Source | Disposition | Target / anchor | Result |
|---|---|---|---|---|
| maps-j-05084 | L3, cols 177-197, `docs/specs/runner.md RUL40` | patch, Phase 9 | docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#business-rules | ok |
| maps-j-05085 | L59, cols 134-154, `docs/specs/runner.md RUL40` | patch, Phase 9 | same target and anchor | ok |

Evidence:
- The target file exists at the pin. Line 72 is the `RUL40 (đã xây — STR40, scripts/herdr-cockpit.sh ...)` bullet, under `## Business Rules`, so the anchor `business-rules` is right.
- The RUL40 text carries the "re-scope 2026-09-06" hard-law clause. It says herdr is never the source of truth and that Dispatch may use herdr's agent API as transport and failure detector. This matches both source citations, which name the "RUL40 re-scope" decision.
- The new text keeps "RUL40" after the path, so the rule is still named. Each citation changes only the path, plus `#business-rules`. Quoted decision names and bare decision ids (d3dbe7f5, ef6ed305) are untouched. These are not edges under L12-49.
- The record has no author-added edges, no legacyScan candidates and no contextual exclusions.
- The old docs/specs/runner.md still exists in the worktree, so the patch is a Phase 9 retarget and there is no dead-link issue.
- I found no missed legacy reference. Other path mentions are not legacy roots: `scripts/herdr-cockpit.sh` and `bin/fgos-runner.mjs` (both exist), `.fgos/logs/*.log`, and herdr.dev.

### Outcome defects
None.

### Record-text notes (not rework)
None.

### Lead-judgment question
- L11 says `See upstreams/herdr/SKILL.md`. That is a live navigation pointer, and the path does not exist in the worktree. `git ls-tree` at the pin shows no upstreams/herdr/SKILL.md. This is a dead link under L12-38, but it is not a legacy docs root, and the inventory contains no edge for it.
  - The record has no row for it and no legacyScan candidate. It may be out of scope for the migration inventory.
  - Lead should confirm it falls outside the step-03 inventory. If not, it parks as a name-drifted dead link.
  - I did not count it as a rework defect.

### Counts
- batch-130: reviewed 1 file, rework 0.
- Stratum L12-51-every-remaining-batch126-or130-file: reviewed 1 file, rework 0. There is no overlap with the changed-file stratum for this file.
- Edges: 2 reviewed, 0 defects.

Status: DONE
Summary: The single file has 2 patch edges and both are correct: target path and anchor `business-rules`, unchanged RUL40 label, and no extra changes in the diff. No rework. One Lead question: the dead non-inventory pointer `upstreams/herdr/SKILL.md` at L11.
