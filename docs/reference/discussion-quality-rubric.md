# Discussion quality rubric

Rubric identifier: **`discussion-quality.v1`**. Five criteria, each an integer
from **0 to 2**, equally weighted; total **0–10**. Use this identifier in
`fgos metrics eval record`. Changing criterion meaning, anchors or weighting
requires a new rubric version; do not compare totals across versions.

## Source wording

The council's *Fast scoring rubric (0-2 each, 10 max)* in
[`demos/session-pack.md`](../../upstreams/council-of-high-intelligence/demos/session-pack.md)
(at the reference revision `fd9f4e5`) says:

> 1. Perspective spread: distinct viewpoints, not paraphrases
> 2. Decision clarity: actionable recommendation with thresholds
> 3. Counterfactual depth: strongest alternative is seriously tested
> 4. Evidence discipline: claims tagged and justified
> 5. Execution quality: concrete owners, deadlines, rollback criteria
>
> Interpretation:
> - 9-10 strong
> - 7-8 usable
> - <=6 revise profile/triad/model routing

These are the five criteria used in the
[2026-10-04 council comparison](../../plans/reports/council-ab-comparison-261004.md).
That comparison used an Opus judge and included both the pre-fix and post-fix
fgOS synthesis. The council verdict's separate self-rated diversity scorecard
is **not** this rubric.

## Fixed scoring anchors for `discussion-quality.v1`

The source names criteria but does not define each integer. The following
anchors operationalize them for repeatable judging; they are fgOS's scoring
convention, not a quotation of historical judge instructions.

| Score key | 0 | 1 | 2 |
|---|---|---|---|
| `perspective-spread` | One viewpoint, or paraphrases presented as distinct views | Distinct views appear but their material tension is flattened or only partly preserved | Distinct views and their material disagreements are preserved and compared |
| `decision-clarity` | No actionable recommendation | An actionable recommendation, but conditions or thresholds are vague | An actionable recommendation with explicit conditions or thresholds |
| `counterfactual-depth` | No serious alternative | An alternative is named and partly examined | The strongest alternative is seriously tested, including what could change the decision |
| `evidence-discipline` | Unsupported claims or invented evidence | Some claims are justified, but important evidence/inference boundaries remain unclear | Important claims are tagged and justified, with uncertainty and unverifiable claims explicit |
| `execution-quality` | No concrete executable next step | A concrete next step, but owner, deadline or rollback criteria are incomplete | Concrete owners, deadlines and rollback criteria |

Judge only the submitted deliverable, not an imagined better underlying panel.
Quote a short passage for every score; state what is missing. Citation presence
alone does not prove a claim true. A blind judge without repository access
must mark citation correctness as unverified rather than invent verification.

The [historical comparison](../../plans/reports/council-ab-comparison-261004.md)
is a calibration reference, not a fresh evaluation under these newly explicit
anchors. It identified an input-plumbing defect and warned that format, provider
changes and a single question/judge confounded the result. Do not copy its
scores into new records as if current setups had been judged.

## Recording and comparison

The record shape is owned by
[`observe.eval.v1`](../../packages/observe/contracts/observe.eval.v1.json);
The store accepts free criterion names for other versioned rubrics. For
`discussion-quality.v1`, write and read validation require **exactly all five
keys** above; extras and missing keys are invalid. A missing criterion is not a
zero, and a partial score vector must not be presented as a comparable total.

Follow [the blind-comparison how-to](../how-to/compare-discussion-setups-with-metrics-eval.md)
to isolate the judge and record real run identities. Agreement is a different,
passive sensor: unanimity is neither proof of quality nor a rubric score.
