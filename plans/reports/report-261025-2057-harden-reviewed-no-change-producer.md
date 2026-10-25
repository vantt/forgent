# Report: reviewed producer that changed nothing

## Cause (confirmed)
A writing seat that claims done with no changed files settles `confidence.level: no-evidence`, `assessment.verdict: inconclusive`, no failure (settlement.mjs ~:353-359). run-result.mjs deriveOutcome maps that to category `verdict` / `verdict-inconclusive`, and `outcomeOfRunResult` (unit-run-history.mjs) maps any verdict other than `findings` to `execution-failure`. reviewed.mjs treated every `execution-failure` producer as a round-ending error, so the reviewer never ran.

## Change (src/runner/execution/patterns/reviewed.mjs)
- New `changedNothing(res)` (~:21): outcome `execution-failure`, posture not read-only, confidence `no-evidence`, verdict `inconclusive`, no `failure`. New `endsRound(res)` (~:44) = error outcome and not `changedNothing`.
- `endsRound` replaces the producer error check in the live round (~:272), the settled-history replay (~:184), `isRoundSettledInHistory` (~:103), `assessRound` (~:120) and `reviewedHistoryOutcome` (~:140), so live and history agree. A resumed round also reuses a no-change producer result (existingProducer) instead of relaunching it.
- Checker/verify errors still end the round as before; a failed producer carries `failure` or another confidence level and still stops.
- settlement.mjs, run-result.mjs, unit-run-history.mjs and other patterns untouched. docs/specs/runner.md does not state the old behaviour (grepped); no change.
- CHANGELOG.md: one line under Unreleased.

## Tests (test/runner/execution/patterns/reviewed.test.mjs)
- Added (red first, own commit): "a producer that changed nothing is still reviewed, and the reviewer's verdict decides the round" (pass and findings).
- Added: "a producer that crashed stops the round before any reviewer" (failure code, confidence failed). The existing "propagates execution-failure and other hard error outcomes" covers checker-side errors only, so a producer-side case was added.
- Run: reviewed.test.mjs and run-case-admission.test.mjs (the only two files matching `patterns/reviewed`): 34 tests, 34 pass, 0 fail.

Status: DONE
