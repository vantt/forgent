# A38 bounded re-review: Step 5 rework (L11-17)

- Reviewer: reviewer:sonnet-session:a6938dd1ef1079f30@2026-10-17
- Author: Lead (L11-17 edits) on top of codex-session:fgos-run_unit-run-17922161b19023@2026-10-17
- Reviewed commit: f836da42c (diff base df9954963)
- Review mode: ordinary

## Entries

| # | Entry | Verdict | Evidence |
|---|-------|---------|----------|
| 1 | X-LOCK-05 deferred, routed to P7-DOC-GAP-02 | ok | Row in step-05-authority-alignment.json now has alignment `deferred`, honest alignmentMeaning, route `Step 9 (P7-DOC-GAP-02)`; md row matches; part-02.json row is also `deferred`. Candidate docs/platform/packaging-distribution/spec.md has zero matches for lock-dirs, lock-fences, lockRoot, lock-fd; its row 7 only lists an unrelated `provider-capacity-lock-stale` check. Legacy docs/specs/distribution.md has rows 5g, 7 and 7b carrying the lock content. Code evidence holds: sha256 of src/setup/registrations.mjs (271d129b...) and src/setup/holder-lock-checks.mjs (782030d7...) match the row pins; registrations.mjs:2223 starts the lock-dirs/lock-fences registerCheck block and holder-lock-checks.mjs:172 begins the lock-fd/probe check. Candidate statementFileSha256 (653c795b...) equals the current file. |
| 2 | P7-DOC-GAP-02 and L11-17 in owner-answers.md | ok | L11-17 states cause, decision (X-LOCK-05 deferred, QF rebind, CONTROL-FRAME repoint), evidence and affected rows; says "no candidate edit now". P7-DOC-GAP-02 states the gap (rows 5g/7/7b missing from candidate), evidence, and "documentation conservation only; no code change", routed to the Step 9 carry. Bounded; no code or candidate change claimed. |
| 3 | QF-01..13 statementFileSha256 | ok | owner-answers.md sha256 at f836da42c is 2f865e2eb5c7818eb1e0d4356ed8d93b606e7cffdcb15ea7f8875e4f632bb1f7; all 13 QF rows equal it in both step-05-authority-alignment.json and part-02.json. |
| 4 | CONTROL-FRAME in part-03.json | ok | Path is now plans/.../phase-07/step-05-remainder-frame.json; sha256 f83d0b4a... equals sha256sum of that file. |
| 5 | Counts | ok | json counts.byAlignment is aligned 12 / deferred 90 / doc-fix 7 / implementation-gap 0 (109); md table shows 12/90/7/0; the X-LOCK-05 md row reads deferred. |
| 6 | Pins block in review-request-a38-step-05-01.md | ok | The PYVERIFY block ran and printed "pins/part limits/stable-id uniqueness OK; seed/draw still reviewer-owned". index.json digests for the two alignment files, parts 02/03 and owner-answers were refreshed in the same commit. |
| 7 | Scope | ok | `git diff --name-only df9954963 f836da42c` lists 7 files, all under plans/260925-documentation-authority-unification/reports/phase-07/; no docs/platform, src or contract file changed. |

Totals: 7 ok, 0 rework.

## Notes

- X-LOCK-05 in part-02.json carries the candidate spec digest, not the owner-answers digest; that is correct, since only QF rows bind owner-answers.md.
- Only the Step 5 bounded rework was checked; the earlier 142/143 review results are not re-derived here.

## Verdict

Step 5 can now be accepted. The one rework and both rebinds are applied correctly, with pins consistent. P7-DOC-GAP-02 stays open and carried to Step 9; it is a tracked conservation item, not a Step 5 blocker.

Status: DONE
Summary: 7 of 7 entries ok, 0 rework; Step 5 acceptable.
