# panelist-1 (council-socrates): dissent/agreement gate for `panel`

**Position:** Do NOT port the four council gates. Add one narrow, deterministic split-preserving field to `runPanel`. Provider-distinct panelists plus reviewed's red-team are not "already enough" for a bare `panel`, but gates 1-3 cost more than they buy.

## Assumptions tested
1. **"Provider-distinct panelists give dissent."** Panelists never see each other (panel.mjs:51-57, `independentOf` + readOnly), so herding between them is already zero. Distinct providers cut correlated error, not the failure that matters: the synthesizer collapsing a split. `runPanel` returns only the synthesizer's outcome (panel.mjs:84-87). Panelist `findings` vs `pass` are discarded from the verdict, and no split record exists.
2. **"reviewed's red-team covers it."** Red-team is a checker over ONE producer (reviewed.mjs:243-275), default only at rigor high/critical or code capabilities (reviewed.mjs:22-27, 50-52). It is a different shape from a panel. It only protects workflows that chain panel -> reviewed (group-cognition.yaml). The bare `panel` presets (presets.mjs:21,29) get none. Today "principled dissent" is just prose in the synthesizer objective (group-cognition.yaml:36, delphi.yaml:46).
3. **"Agreement is mechanically measurable."** Result outcomes are an enum (panel.mjs:6-13). Only pass/findings is machine-readable. ">70% agree" over free-text answers needs a claim contract that does not exist. A dissent quota ("2 non-overlapping objections") needs semantic judgment, i.e. another LLM, so it is not mechanical. Re-prompting costs dispatches against priority #1 (Ship Faster).

## Verdict
Gate 4-lite only: tally panelist outcomes and findings deterministically, pass the tally to the synthesizer as input, and return it in the result. A genuine split (mixed pass/findings) is surfaced and never forced to consensus. Gates 1-3 are deferred.

## What would change my mind
- Evidence (logs/retros) of panels where the synthesizer papered over a real split, so the cheap tally is insufficient.
- A structured panelist claim schema (position + confidence), which makes agreement checks truly mechanical.

## Next step
Add a computed `agreement` field ({pass, findings, split} from memberResults outcomes plus extractFindings-style counts) to the runPanel return and the synthesizer `inputs`. Add a test in test/runner for the unanimous and split cases.

## Limits / escalate
I did not read the council project itself, the synthesizer role config, or any panel tests. Claims are from panel.mjs, reviewed.mjs, presets.mjs and core/workflows/*.yaml only.
