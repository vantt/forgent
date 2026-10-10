# Phase 04 re-measure report (2026-10-10)

## Setup

- Question set fixed before judging: Q1 = the 2026-10-04 dissent-gate question (`q1`), Q2 = queue triage (manual vs automate vs two-week shadow), Q3 = ambiguous "move to the new system". Text and judge prompt: [phase-04-blind-inputs.md](phase-04-blind-inputs.md).
- Candidates. Q1: real council (stored 10-04), fgOS panel after the 10-04 wiring fix (stored), `council-lite` now, plain panel now (no personas, no restate). Q2 and Q3: `council-lite` vs plain panel.
- Plain panel already carries the phase 01 synthesizer schema, so the table isolates personas + restate, not the schema.
- Judge: one independent Opus agent, blind, not the builder; fixed format, titles and run ids stripped, labels shuffled. Judge keys revealed only after scoring.
- Runs: `unit-run-1791616698416-fbd95f8b` (Q1 lite), `...1791616871473-b72ce477` (Q1 plain), `...1791612369544-1ae70a92` / `...1791612985917-0ee3ea03` (Q2 lite / plain), `...1791614056153-258a6078` / `...1791617079636-5f5fd9b3` (Q3 lite / plain). All six: outcome pass.

## Scores (0-2 per row: spread / clarity / counterfactual / evidence / execution)

| Q | Candidate | S | C | CF | E | X | Total |
|---|---|---|---|---|---|---|---|
| Q1 | council-lite now | 2 | 1 | 2 | 2 | 2 | **9** |
| Q1 | real council (10-04) | 2 | 2 | 2 | 1 | 1 | 8 |
| Q1 | plain panel now | 1 | 2 | 1 | 2 | 1 | 7 |
| Q1 | fgOS after fix (10-04) | 1 | 2 | 1 | 0 | 2 | 6 |
| Q2 | council-lite now | 2 | 1 | 2 | 2 | 2 | 9 |
| Q2 | plain panel now | 2 | 2 | 2 | 2 | 1 | 9 |
| Q3 | council-lite now | 2 | 2 | 2 | 1 | 2 | **9** |
| Q3 | plain panel now | 1 | 2 | 1 | 2 | 1 | 7 |

Mean: council-lite 9.0, plain panel 7.7. Q1 against the old reference: 5 (fgOS 10-04, judge now 6) to 9; real council 8 (now 8).

## Reading

- Acceptance (>= 7/10 on the council rubric) met: Q1 9 vs council 8. Rows that moved: perspective spread, counterfactual depth, execution (one next step) on Q1 and Q3.
- Q2: tie at 9. Personas gave no gain; the judge ranked the plain panel first because it commits to a decision rule while lite handed the split back to the owner. The lite synthesizer is split-first, which costs "decision clarity" (1 on Q1 and Q2).
- Evidence discipline: the 10-04 fgOS run was flagged for wrong line citations; no flag on any run made now. Real council was flagged for a false "no sensor exists" claim.
- The restate step surfaced framing mismatches on Q3 (judge credited it); no judge note on Q1 or Q2.
- Cost: same 4 seats, 5 attempts, 1 fallback per run. Duration (Observe): Q1 173s lite vs 208s plain, Q2 173s vs 142s, Q3 126s vs 115s. No extra calls.
- Observe: every run `measurement: unmeasured` (`stanceOptions` empty, agreement/genuineSplit null). The acceptance row "stance + agreement for every run" is not met and not a moved metric; blind score is the only evidence.

## Limits

n = 1 per question and per row; one judge; adjacent scores (8 vs 9, 9 vs 9) are within noise. Real council was run only on Q1 (stored from 10-04, not rerun, no baseline on Q2/Q3). Length differs a lot (real council longest); the judge saw word counts removed but length is visible. Q1 names repo files the judge could check but was not required to. Style tells remain ("voice", "genuine split").

## Decision

Stop here. The score moved, so personas + restate were worth shipping; no row lags badly enough to justify cross-exam, tally or an outcome ledger. The one lagging row is decision clarity in the split-first synthesizer (1 of 2 on Q1, Q2); that is prose in the synthesizer instruction, not a runtime seam, and one run per question does not justify rewriting it. Open item, separate from this plan: declare `stanceOptions` in `council-lite` so Observe can measure agreement; until then do not claim an Observe result.

## Unresolved

- Whether the decision-clarity dip repeats on more questions.
- Whether `stanceOptions` can be declared without changing the seat output contract.
