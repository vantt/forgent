Status: done

Position: Do not add a mechanical dissent/agreement gate to the generic `panel` pattern now. Provider-distinct panelists plus a provider-distinct synthesizer are enough for this small core; use `reviewed` when adversarial checking is actually required.

Reasons:

1. Independence is real, not prompt theater. Each panelist excludes its siblings and the synthesizer excludes every panelist (`src/runner/execution/patterns/panel.mjs:41-57, 73-82`). `bind()` rejects a same-provider candidate (`src/runner/execution/bind.mjs:183-207`), with tests proving three distinct panelists, refusal when capacity is insufficient, and a distinct synthesizer (`test/runner/execution/run.test.mjs:574-618`).
2. The requested quota needs a semantic judge for “non-overlapping objection,” “>70% agreement,” and confidence. That is a second opaque model protocol, re-prompts, and a tally contract with no caller or evidence. The settled design deliberately keeps patterns as small, pure loops with history-derived state and no new store (`docs/specs/runner.md:3016-3026`).
3. Red-team is already a named, enforceable adversarial path: high/critical rigor and code get it (`src/runner/execution/patterns/reviewed.mjs:22-26, 48-52`), and presets require it for code-change/RFC (`src/runner/execution/patterns/presets.mjs:7-12, 37-42`).

What would change my mind: a representative evaluation corpus shows independent panels repeatedly converge on materially wrong recommendations that a bounded dissent/counterfactual round catches, with acceptable latency and false-positive cost.

Next step: run that comparison on 20 archived decision prompts; record missed-risk rate, added calls, and latency. If it wins, add it as an opt-in advisory preset, not a global panel gate.

Blind spot: a cheap generic core can under-serve high-stakes advisory decisions; the corpus must include them.
