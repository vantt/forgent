# G7 batch g7-c4 review (commit 8a9385eca)

Scope: 41 composed specs, rest of `docs/platform/agent-coordination/**`. Verdicts: [g7-g7-c4-review.json](g7-g7-c4-review.json).

## Counts

- APPROVE: 41
- REWORK: 0
- Mechanical: 41/41 files hash to `beforeSha256` at 8a9385eca. 41/41 pass the forward `patch --batch --fuzz=0 -p1` check, matching `expectedAfterSha256`. 41/41 roll back to `beforeSha256`. No `.orig` or `.rej` files. Scratch is in `/tmp/fgos-work/g7-g7-c4/<n>/`.

## Semantic checks

- 34 specs change only one line: the Related-list entry `docs/specs/runner.md` becomes `docs/platform/runner/spec.md`. That file exists and is the runner area's candidate spec, with provenance `docs/specs/runner.md`.
- There are 4 decision-record anchors in `docs/platform/runner/decisions/h-36d872fbb0e5.md`: `#0062-...`, `#0034-...`, `#lớp-còn-thiếu-...` and `#lịch-sử-quyết-định-...`. All 4 resolve through the repo's anchor function, `extractMarkdownConservationUnits` in `scripts/generate-doc-inventory.mjs`. That function writes an em dash surrounded by spaces as a single hyphen, which matches the existing links in `architecture-map.md`.
- Two line-number corrections come from `step-07-final-actions.json`. I checked both against the source:
  - `assignment-runner.mjs:349-385,495-516,973-975`: `provenance.kind` is checked at lines 351, 370, 514 and 974.
  - `execution-contract.mjs:372-383`: this range is the budget block. The dropped `345-346` was role validation, which is not what the budget sentence claims. No claim text changed.
- No claim was dropped or weakened, and the patches make no unrelated edits.

## Notes for the Lead (non-blocking)

1. Four legacy references stay in the after-bytes on purpose because they are individually parked: `assignment-run-runresult.md:39` (f04503), `ADR-006…:67` (f04511), `master-coordinator.md:105` (f06394) and `deprecated-and-reserved.md:31` (f06456). When the parks are composed, their `beforeSha256` must be these specs' `expectedAfterSha256`, or the parks must be merged into these specs. A park composed against the current bytes will not apply after these specs at `--fuzz=0`.
2. The three `history/documentation-migration/*.md` files keep `Superseded by: Runtime ownership in docs/specs/runner.md`, following the L12-26 history-file preserve rule (matrix row f04521). After step 6 deletes `docs/specs/**`, this line names a file that no longer exists. That follows the recorded disposition and is not a defect in this spec. G6 checks the premises behind preserve dispositions.
3. In `dispatch-control-plane-redesign.md`, line 150 still says "runner spec's (…)" but now points to the runner decision record. This is a cosmetic wording issue.
