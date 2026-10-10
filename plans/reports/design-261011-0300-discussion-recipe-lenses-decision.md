# Discussion recipes and lenses: design and evidence (2026-10-11)

Prepared overnight for the owner to review. Nothing in the repository was changed except these two reports.

## 1. Question

Can `fgos-advise` fill a few simple parameters so the runtime rebuilds a standard discussion workflow from existing parts (the owner's "recipe" idea), so that group-cognition-shaped discussions fit the user's problem, without making the system more complex?

## 2. Verdict

- **The mechanism is feasible and small.** One flag, `--lenses "a|b|c"` on `fgos workflow start`, about 55 production lines, expands a registered base deterministically and passes the same validator. Technical risk is low.
- **The benefit is not demonstrated.** Custom lenses did not beat the plain base in a blind comparison: net zero over five questions (section 4).
- **Recommendation: do not build the flag yet.** The owner's own constraint is "do not add complexity"; a mechanism without a measured gain breaks it. Keep `fgos-advise` as a selector, ship one small bug fix (section 6), and reopen with a stated trigger.
- **Confidence:** high on feasibility, moderate on "no gain" (n = 5 questions, one judge family, a one-point scale, so small effects are invisible).

## 3. What was checked

| Item | Result | Source |
|---|---|---|
| A run stores its full definition in the `workflow.start` event | yes, so status, resume and the detached advance need no registry lookup | `src/workflow/store.mjs:40-47` |
| The runtime already accepts an in-memory workflow with the same validator | yes | `src/workflow/runner.mjs:765-767` |
| `fgos run` can carry pattern params | no; only workflow templates carry `params` | `bin/fgos.mjs:2672`, `run.mjs:533-538` |
| A 60-line pure expander (lenses, optional critique removal, optional gate) over `group-cognition` and `council-lite` | 4 of 4 recipes validate | scratch prototype |
| A real 4-lens run through `startWorkflow({workflow})` | completed all 3 steps; `fgos workflow status` reads it; 4 seats on 4 provider families, every panelist reported a valid stance | wf-run-1791655904917-67798f73 |
| 4 lenses need 4 panelist families plus a different family for the synthesizer | held: 5 families were used | same run |
| Rust host forwards flags to the node entry | generic forwarding; `--stance-options` is not special-cased in Rust | `apps/fgos/src/main.rs` |

## 4. The A/B experiment

Setup: the same `group-cognition` base in every arm, with the checker briefing fixed in memory (rfc-style reviewer and red-team tasks) so only the studied factor differs. Arms: `plain` (3 default seats), `lensed` (3 skill-written lenses plus a Restatement instruction), `restate` (3 seats, Restatement only, no lens). Judge: one independent Opus agent, blind, labels shuffled per question, provider and model names and run ids stripped, key stored separately; the council 0-2 rubric over five rows. Lenses were written before any output was seen.

| Question | Judge pass | plain | lensed | restate |
|---|---|---|---|---|
| Retainer (3-year, 20% discount) | 2-way | 9 | 10 | |
| Retainer | 3-way | 9 | 10 | 9 |
| Move to the new system (ambiguous) | 2-way | 8 | 9 | |
| Move to the new system | 3-way | 10 | 9 | 9 |
| Bakery, one 8,000 dollar purchase | 2-way | 9 | 8 | |
| Logistics routing software | 2-way | 9 | 9 | |
| Onboarding feels long (ambiguous) | 2-way | 9 | 10 | |

Reading:

- Counting each question once (the 3-way pass for the first two): lensed minus plain = +1, -1, -1, 0, +1, a net of zero. Lensed won 2, lost 2, tied 1.
- The same question flipped between two judge passes ("Move to the new system": +1 then -1), so the noise is about the size of the effect.
- Restatement alone did not reproduce the lens gain (9 and 9).
- My guess that lenses help decision-type questions and not ambiguous ones is not supported: lenses won one of each and lost one of each.
- Lensed seats did follow their lens (each report names it and stays inside it), so the mechanism works; it just did not move the judged quality.
- Cost was about the same (320 to 490 seconds per run, one attempt per seat, no fallback).

Limits: five questions, one judge family, one run per arm, the author wrote the lenses and the questions, and the judge could see which text used lens words. This screens for a large effect only.

## 4a. Run ids (for audit; stored under `.fgos/assignments`, untracked)

Round 1 plain/lensed: retainer wf-run-1791656918863-7cd36dc8 / wf-run-1791657354982-840cbb92, move wf-run-1791657847911-a74c4937 / wf-run-1791658204764-1d6afabe. Restate-only: wf-run-1791658612300-1344b959 / wf-run-1791659082317-eff95d20. Round 2 lensed/plain: bakery wf-run-1791659535089-b937c731 / wf-run-1791659942665-065a878c, routing wf-run-1791660361079-57eeaaa1 (plain) / wf-run-1791660682539-5fcb3887, onboarding wf-run-1791661063572-409d1949 (lensed) / wf-run-1791661468401-6ed23ecc.

## 5. Options for the owner

| Option | What it means | Cost | When to pick |
|---|---|---|---|
| A. Build nothing new (recommended) | Keep `fgos-advise` as a selector over the 7 workflows and 3 presets; log requests no route serves | none | The default. Evidence does not justify new machinery. |
| B. Build `--lenses` anyway | The lead's design in the companion report: one flag, `applyLenses`, refusals for council-lite and architecture-advisory, lenses stored in the start event, about 55 lines, one optional new file | small code, tests, spec, CHANGELOG; touches the shared workflow runner (higher-risk area) | If the owner values per-request control for its own sake, accepting that quality gain is unproven. Mark it experimental. |
| C. More fixed workflows | Add variants such as group-cognition with a gate | one YAML each | Only if 3 or more logged real requests need the same missing shape. |

Why not the larger recipe fields: `critique` on/off and `gate` need step rewiring (a small DAG editor). The panel split on `critique` (2 seats for, 2 against) and only one seat wanted `gate`; the lead dropped both because bases already exist for those shapes (`council-lite` has no critique, `business-discussion` and `nominal-group` have gates).

## 6. One change worth doing regardless (small, YAML only)

The `reviewed` units of `group-cognition` and `business-discussion` declare no `roleTasks`, so their reviewer and red-team default to "the work is the latest commit in this worktree" (`src/runner/execution/patterns/role-tasks.mjs:21-36`). For a non-code question that briefs the checkers on the wrong thing. The `rfc` preset was fixed in commit 64d0d4836. Give these two units the same `roleTasks` (about 30 YAML lines plus one test). Both experiment arms already ran with this fix, so its own effect was not isolated; the argument is correctness, not score.

## 7. Reopen triggers for lenses

- Three or more logged requests where the skill's "unmet knob" rule fired on a custom lens, or
- a better-powered test (at least 8 new questions, two judge families) shows lensed at or above plain with a margin above the noise seen here.

If reopened, start from the companion report and the prototype described in section 3.

## 8. Unresolved questions

- Does a lens help when the question names real stakeholders in a repo (the experiment used non-code questions only)?
- Are synthesizer prompts, not seat prompts, the larger lever for "decision clarity"? The judge's comments pointed there (it rewarded candidates that gave a conditional default). Not tested.
- Should the stale `fgos-panel` skill copies in other projects be cleaned by `fgos setup`? Raised by the rename work; not part of this decision.

Companion: [lead synthesis of the design panel](design-261011-0300-recipe-panel-lead-synthesis.md).
