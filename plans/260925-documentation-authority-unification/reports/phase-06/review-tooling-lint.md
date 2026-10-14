# Review of 3553347a6: ordinary review-report lint and shared verdict helpers

Verdict: approve. Blocking findings: 0.

## Gate equivalence (validateManualReview)

I compared the old logic (3553347a6^, scripts/check-doc-inventory-gates.mjs ~621-660) with the new logic line by line. I also ran a differential test.

- `reviewReportHeader` (check-doc-inventory-gates.mjs:621) uses the same regex and `.trim()` as the old `header` closure. The closure still exists at :663 and delegates to it.
- `reviewTableCells` (:626) is the old split, trim and `\|` restore, moved without change.
- Checkpoint branch (:672): old behaviour was `cells[0]==claimId && cells[1]=='ok' && cells[2]==reviewNote` and then `cells.length===3`. New behaviour is the same four conjuncts. The cells are read once with the same helper. Pack, seed and score header checks (:667-670) are untouched.
- Ordinary branch (:673): the commit check `/^[0-9a-f]{40}$/` on `row.reviewReportCommit` is kept, then `ordinaryVerdictCellProblems(cells,row).length===0`. The helper (:638-649) is equivalent to the old expression:
  - Cell count must be exactly 5. In the old code a wrong count made the whole predicate false.
  - Claim, verdict `ok` (the default `verdicts=['ok']`) and note equality (the default `checkNote=true`) are unchanged.
  - Source cell must be 64 lowercase hex. The row digest must be 16-64 hex. The cell must `startsWith` the row digest. Unchanged.
  - Target: with `targetOwner` the row digest must be 64 hex and equal the cell. Without `targetOwner` the cell must be `none`. Unchanged.
  - The old predicate was a short-circuit AND and the new one is a list of problems. A line is accepted in both only when every condition holds, so the accept set is identical.
- Differential fuzz, 200k random cases (scratch fuzz.mjs, old and new modules loaded from `git archive`):
  - Row digest lengths 15, 16, 40, 64, uppercase, empty and undefined.
  - Source cells that are 64 hex but do not extend the row digest, and 40 hex.
  - 2 to 6 cells, so including a 3-cell row in ordinary mode and a 5-cell row in checkpoint mode.
  - Valid and invalid target digests, `targetOwner` set and unset, a non-40-hex commit, and note and claim mismatches.
  - Result: 0 differences in the findings JSON, with 3503 accepted cases, so both outcomes are exercised. The 64-hex-not-prefix 5-cell row and the checkpoint 3-cell versus ordinary 3-cell rows are covered.

No widened acceptance was found.

## Lint (propose-doc-decisions.mjs)

- Read-only:
  - `--lint-review` with `--out` throws, with no file written (verified, exit 1).
  - A missing `--shard` throws, exit 1.
  - The CLI path only reads and `console.log`s.
  - Tests assert that shard bytes and `git status --porcelain` are unchanged.
- Exit codes: `result.ok ? 0 : 1`. Thrown errors go through the existing runCli error path, which exits 1.
- `--shard` is repeatable only when mode is `--lint-review` (:643). `--apply-review` and the other modes still reject a repeated `--shard`. The change does not affect `--apply-review`.
- `REVIEW_VERDICTS` has the same contents `['ok','rework','hold']` as the two inline literals it replaced (`indexVerdicts` and `parseReviewVerdicts`), so what `--apply-review` accepts is unchanged. The gate itself still hardcodes `ok`. The wider set applies only inside the lint, through the opt-in `verdicts` parameter.
- `target-digest-unverifiable` (:365 area) is reported whenever the row has a `targetOwner`, no recorded digest and no `--inventory`, so it never passes silently. If `--inventory` is given but the anchor is not found, `targetDigestOf` returns null. The helper then fails `/^[0-9a-f]{64}$/` and reports `target-digest-mismatch`, so that case also fails. The message is misleading in that case (it says "does not match"), but it is not an accept.
- Label rows: non-claim rows in a verdict table need 5 cells but are otherwise ignored. A row whose first cell merely contains a claim ID is flagged `non-bare-first-cell`. The gate and applier skip such rows, so flagging them is correct.

## Tests

- `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/doc-*.test.mjs` (10 files, 162 tests): 161 passed and 1 failed on the first run, then 0 failures on 3 full reruns and on 8 reruns of doc-review-format.test.mjs. The failure was "the public seeded Markdown can be scored without exposing the seed or private selection key". It is a seed-pack test that this commit does not touch. I did not reproduce it. A likely cause is that a random nonce occasionally appears in the public text, so the secret-not-in-text assertion fails. This is a pre-existing flake and not caused by the diff.
- The worktree was verified clean (0 status lines) after the review.

## Non-blocking notes

1. Low: the unknown-anchor case under `--inventory` reports `target-digest-mismatch`, which hides the real cause. The cause is that the target unit was not found. Fixing it would mean emitting a distinct `target-unit-not-found` reason when `targetDigestOf` returns null.
2. Low: the lint does not check `reviewReportCommit` or the note. That is correct before commit and application, and the doc comment says so. The gate still enforces both.
3. Low: the lint does not check that every shard claim has a verdict row. Only `claimRows` is reported, so a report that covers some of the shard's claims lints clean. `applyDecisions` and `indexVerdicts` ("missing verdict") catch this later. Consider comparing `claimRows` with the number of shard rows.
4. Informational: the seeded-Markdown test is flaky (see Tests).
