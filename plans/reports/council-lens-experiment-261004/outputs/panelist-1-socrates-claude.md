# Position: do NOT add a mechanical dissent/agreement gate to `panel` now (council-socrates)

Scope: read panel.mjs, reviewed.mjs, presets.mjs, core/workflows/*.yaml, grep for dissent/anonymi.

## Assumptions tested
1. "Panel output is a consensus that needs policing." Contradiction: panel.mjs:84-87 returns only `synthResult.outcome` plus raw results. There is no tally, no agreement metric, no vote. A >70% agreement gate needs a structured stance field per panelist; none exists (panelist results carry only `outcome`; `findings`/`pass` are non-semantic here). Gate would need a new result contract first.
2. "Provider-distinct panelists + red-team is the existing safeguard." Contradiction: red-team lives in reviewed.mjs:22-27,50-52 and critiques a *producer artifact*. Panel has no producer; the synthesizer is the only judge and is only provider-distinct (panel.mjs:77-81), not adversarial. Also `findings` outcomes from panelists are not propagated (panel.mjs:62-69 only checks ERROR_OUTCOMES). So the premise "already enough" is false for dissent specifically; provider distinctness gives independence, not disagreement.
3. "The gate belongs in the pattern." Contradiction: the discussion shapes (delphi anonymized feedback delphi.yaml:28; remaining dissent delphi.yaml:48; group-cognition counter-arguments :38) already live as Workflows. Cross-examination (3) and genuine-split return (4) are multi-round flows, which are Workflow territory, not a parallel-then-synth pattern (88 lines, deliberately thin).

## Verdict
Don't gate the pattern yet. Cheapest, real step: make the synthesizer contract require a "dissent preserved" section and propagate panelist `findings`; route users wanting cross-exam to delphi/group-cognition. A mechanical dissent quota on LLM prose is gameable (quota satisfied by filler objections) without evidence it fires in real runs.

## Reasons (evidence)
- panel.mjs:84-87: no aggregate structure to gate on.
- panel.mjs:62-69: panelist findings dropped.
- delphi.yaml:28,48 / group-cognition.yaml:38: anonymized + dissent already modeled in Workflows.

## Would change my mind
Evidence (runs/logs) of synthesizer flattening a real minority view in research-fan-out; or a structured stance schema landing for panelist results.

## Next step
Add an optional `dissent` field to panelist/synth result contract + test that synth input includes panelist findings; measure flattening on 5 real runs before building any quota.

Caveat: did not read docs/specs panel sections beyond runner.md grep, nor the council-of-high-intelligence source.
