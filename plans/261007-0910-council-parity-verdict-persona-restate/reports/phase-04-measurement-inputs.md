# Phase 04 measurement inputs (fixed before any run)

Status: drafted 2026-10-07, nothing run. Purpose: re-measure fgOS discussion output against council on the same rubric as the 2026-10-04 A/B ([comparison](../../reports/council-ab-comparison-261004.md): council 8, fgOS 5 after the synthesizer fix). Everything below is decided before the first run so the outputs cannot steer it.

## Preconditions

- The advisory-capability agent has finished and its runtime changes are on main (shared writer baton, quota contention).
- `fgos doctor` is green for the target project (`agent-cli-project-trusted`, `confined-pane-accounts`).
- Seat order for the project is set so panel seats and the synthesizer are four distinct provider families (gemini, xai, openai, then claude for the synthesizer), and the accounts with quota are known.
- Phase 01 is on main; phases 02 and 03 are either landed or explicitly skipped (record which, because the score is only for what ran).

## Questions

Same question as 2026-10-04 (Q0, kept for comparability) plus three open fgOS decisions that really have two sides, chosen by the owner on 2026-10-07 (the earlier probe, account-order and persona-location questions were answered by the owner or by the design and are not asked). A question whose answer the design already gives (for example whether to probe a provider before assigning a seat: account rotation, pool fallback and early login-failure detection already answer it) is not asked. Chosen so the answer is not in the repo already; the earlier mdview question ended with all seats agreeing because the feature already existed.

| # | Question | Why it is contestable |
|---|---|---|
| Q0 | Should fgOS add a mandatory dissent or agreement gate to the `panel` pattern, or are provider-distinct panelists plus the `reviewed` red-team enough? | Reused for comparability with the first round |
| A | When a discussion seat fails part way through, should fgOS replace it with another provider on its own (today: convenient, but the quality can change without anyone noticing), or stop and ask a person? | Finishing the run against a silent change in who answered; ties to the rule that a person is asked only when really needed |
| B | Should fgOS ship a ready set of lens personas to every project, or only on request? | Customers get opinionated lenses for free, against not imposing a viewpoint they did not choose |
| C | When every seat agrees without exception, should fgOS add a round of challenge on its own, or accept the result? | Guarding against easy consensus, against spending a round when the answer was simply in the repo |

Run each question once through each arm. If cost allows, run Q0 twice per arm to see run-to-run spread.

## Arms

- **fgOS arm:** `delphi` workflow on forgentX with the fixed seat order, request text = the question only. Take the final-consensus report as the output. Record every seat's executor, any fallback attempt, wall time.
- **Council arm:** the real council skill in full mode with three lenses, run in a fresh session on the same repo, same question. Record agent calls, providers, wall time. Known limit: in the first round council ran on a single provider.

## Normalisation (so the shell costs no points)

Before judging, convert both outputs to plain markdown with the same five headings only if the output already has them; do not rewrite content. Remove JSON wrappers, run ids, absolute paths and tool noise. Strip the words "council", "Delphi", "seat" labels' provider names and any provider or model name. Label the two outputs X and Y with the assignment drawn at random per question and recorded in a sealed note not shown to the judge.

## Judge

One judge, a model from a family that took part in neither arm's synthesizer if possible, otherwise opus as before; state which. The judge sees the question, outputs X and Y, and this prompt and nothing else:

> Score each output from 0 to 2 on five criteria. Judge only the text; do not reward length. Give one sentence of evidence per score.
> 1. Perspective spread: are materially different viewpoints visible and fairly stated?
> 2. Decision clarity: is there a stated position, what would change it, and one next step?
> 3. Counterfactual depth: does it test the position against the strongest alternative?
> 4. Evidence discipline: are claims tied to specific, checkable sources, with what was not verified said plainly?
> 5. Execution quality: is it usable as is (structure, brevity, no filler)?
> Then say which output you would act on and why in two sentences. Do not guess the source.

Rubric rows are the council's own 0 to 2 rubric, same as the first round, so results are comparable.

## Recording

One table per question: score per criterion per arm, total, judge's pick, cost (agent calls, providers, seconds), fallbacks, stance and agreement counts from `metrics discussions` for the fgOS run. Keep the full outputs and judge prompt next to the table under `reports/`.

## Decision rules fixed now

- Success: fgOS total at least 7 of 10 on the pooled questions, or every row below 7 mapped to a named gap.
- Rows that lag are mapped to: anonymous cross-exam, returned-to-person tally, outcome ledger, or "shape only" (more prompt). Only a lagging row justifies the shared-seam phase with the advisory plan.
- If the score does not move versus 5, report it and stop adding gates; do not tune the prompt to the questions after seeing results.

## Limits to state in the report

Few questions, one judge, one run per arm, the author of this plan knows the topics of A to C. Say so; do not claim more than that.

## Open for the owner

A, B and C are the owner's choice. Replace any with a question the owner actually needs decided; that makes the run worth more than a benchmark.
