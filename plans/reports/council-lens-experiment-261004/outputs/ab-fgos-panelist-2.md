## Position

Do **not** add the council’s mechanical dissent/agreement gate to the generic `panel` pattern now. Provider-distinct, independently run panelists plus a separately-provider-bound synthesizer is the useful floor; for work that needs adversarial scrutiny, use `reviewed`/a declared workflow with red-team. A quota, counterfactual loop, anonymous cross-exam, and weighted tally is a new deliberation subsystem, not a small panel improvement. It needs a named owner and an explicit output contract before it earns its maintenance cost.

## Why

1. `panel` is deliberately tiny: it launches independent read-only members in parallel, then passes their raw results to a synthesizer (`src/runner/execution/patterns/panel.mjs:44-60`, `71-86`). The runner spec locks the three patterns as small, pure loops with no new store, deriving state from history (`docs/specs/runner.md:3016-3026`). Re-prompts, anonymity, tally state, and “non-overlap” judging break that shape.
2. Independence is real, not hand-wavy: every member is constrained against every other member, and the synthesizer against all of them (`panel.mjs:51-57`, `73-81`); integration tests refuse provider reuse and require a fourth family for synthesis (`test/runner/execution/run.test.mjs:574-632`). Fix provider monoculture before inventing consensus arithmetic.
3. The existing hard-review path already has the relevant lever: high/critical rigor gets reviewer plus red-team, and code always adds red-team (`src/runner/execution/patterns/reviewed.mjs:22-27`, `37-54`); findings drive a bounded recheck loop and remain an explicit outcome (`311-352`).

## What would change my mind

Evidence that independent providers still converge falsely on consequential decisions, plus a concrete workflow caller, a stable structured dissent schema, and an owner for scoring semantics. My blind spot: this may underweight systemic correlated-model failures even across providers.

## Next step

Add a decision-facing workflow preset that requires structured dissent disclosure in the synthesizer output; measure its false-consensus cases before generalizing any gate into `panel`.
