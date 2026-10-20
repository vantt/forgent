# Review a38 step-03 wave5h part p05

Pin ae141550c2e022310de7a0efea757580c0b2479f. Read-only. No checker, probe or resolver run. Note: progress.md and owner-answers.md are not in the review worktree at that path; the rulings were taken from the brief digest.

## File

- Path: docs/platform/holder-lock/spec.md
- Batch 104, set batch-104 (targeted re-review), stratum: patched (4 patch edges, 0 unpatched)
- Source: 407 lines, read whole through grep outline plus every edge region and the Related block (lines 15-24, 395-407)
- Record digest 2ef3d8c66a4d0720d684da08adc0492a9696c19fdd6d199af22b85dec7e0166f (equals inventoryFileDigest); inventoryInputCommit 1a0f61ac5..., authorInputCommit = pin
- Verdict: **ok**
- Edges reviewed: 4 of 4 (maps-j-06955, 06956, 06957, 06958). authorAddedEdgeIds is empty; legacyScan candidates is 0.

## Per-edge outcomes

| edge | source line | disposition | target | anchor | result |
|---|---|---|---|---|---|
| maps-j-06955 | 18, Related list `docs/specs/distribution.md` | patch, Phase 9 | docs/platform/packaging-distribution/spec.md | none | ok. Whole-file citation by subject; target exists at pin and is the Packaging-Distribution area spec (install, setup, doctor). |
| maps-j-06956 | 19, Related list `docs/specs/runner.md` | patch, Phase 9 | docs/platform/runner/spec.md | none | ok. Runner area spec exists at pin. |
| maps-j-06957 | 402, row "setup and doctor registry" | patch, Phase 9 | docs/platform/packaging-distribution/contracts/setup-doctor-registry.md | contract-setup-doctor-registry | ok. The target's H1 is "Contract: Setup Doctor Registry", so the slug is correct. The contract has sections 3 (doctor), 5 (config merge) and 6 (ownership) that match the row gloss. The relative link `../packaging-distribution/contracts/...` resolves from docs/platform/holder-lock/. |
| maps-j-06958 | 405, row "dispatch cwd lock, resume guard, reconcile" | patch, Phase 9 | docs/platform/runner/subcomponents/h-6979005beaf7/spec.md | business-rules | ok. L12-53 check done: RUL101 sits at target line 196, inside "## Business Rules" (heading line 25, the only H2 before it, so the anchor is exact). It states all three subjects: the dispatch-cwd kernel lock through holder-lock; the `fgos run --resume` guard and reconcile planner reading `lockHolders` with a probe fallback; `clear-cwd-lock` never clearing a cwd lock. The adjacent gloss is true for all three. |

Diff: exactly 4 changed lines in two hunks (Related lines 18-19; table rows 402 and 405). Each hunk matches its edge's diffHunk. Labels follow the basename convention (`distribution.md` became `setup-doctor-registry.md`, `runner.md` became `spec.md`). The row text outside the link is unchanged. No retirement suffix was added; the file is not under docs/specs/** or docs/architect/**, and retiresWithTree is correctly null.

Missed references: none. I grepped the full source for docs/specs, docs/decisions, docs/history, runner.md, distribution and docs/*.md. The only live legacy paths are the four edges above. The other hits are bare decision ids such as D-ADR0055 (not edges, per L12-49), dated prose and a Vietnamese history log. Remaining relative links (event-store, git, process, session-identity, component-boundary, packages/, src/, plans/) are not legacy-root references; the plan 261017-1256 target exists at the pin.

## Record-text notes (not rework)

- Reasons for 06955 and 06956 correctly say whole-file citation with no section claim (wholeFileJustification).
- The reason on 06958 cites L12-53 and matches the evidence.

## Lead-judgment questions

None.

## Counts

- Set batch-104, patched stratum: reviewed 1 file, rework 0.
- Unpatched stratum: 0 files. Outcome defects: 0. Checker limitations: none observed.
