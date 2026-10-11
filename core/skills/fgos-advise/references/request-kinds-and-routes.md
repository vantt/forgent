# Request kinds and routes

The one kind-to-route map for [`fgos-advise`](../SKILL.md). It describes
selection only. The Workflow YAML (`core/workflows/*.yaml`) or preset
(`src/runner/execution/patterns/presets.mjs`) stays authoritative for topology,
rounds, blind, and gates, and for the seats of every route except the four
generic-panel bases, whose seat lenses `--seats` may fill. Every route id below
exists in one of those two places.

## Signals

Infer these from the request and context; never ask for them.

| Signal | Values | Effect |
|---|---|---|
| Thinking need | choose / stress-test or review / generate and rank / converge and revise / explore / gather / single opinion | selects the kind |
| Use of the answer | decide now / revise an artifact / vote or rank myself / input to a plan / approve and roadmap | separates kinds; whether a gate is acceptable |
| Candidate answers | none / 2-4 discrete (verbatim) / many | choose versus generate; stance options |
| Artifact | path or text present / absent | needed by kind B |
| Domain | in-repo software architecture / other | architecture goes to the specialist skill; any other domain only shapes the request text |
| Attendance | will answer a gate / unattended / unknown | unknown counts as unattended |
| Authority | advice / implement | implement leaves this skill for `fgos-run` |

## Request kinds

- **A. Choose among supplied options.** "X, Y or Z?" The person will act on the advice.
- **B. Stress-test or review a concrete artifact or decision.** Red-team, poke holes, review this doc.
- **C. Generate and rank ideas.** No options exist yet and the person wants to prioritise them.
- **D. Converge or revise judgments.** Forecasts, estimates, incident reflection: independent views first, then reconsidered.
- **E. Explore an ambiguous problem.** No decision is framed yet.
- **F. Gather evidence from several angles.** Facts, not a verdict.
- **G. A single bounded expert opinion.** Not a panel.

Two overlays apply on top of a kind: **architecture-in-repo** routes to the
specialist skill; **"approve, then roadmap" explicitly wanted** routes to
`business-discussion`.

## Selection table

| Kind | Route | Why | Do NOT use when |
|---|---|---|---|
| A | **`council-lite`**, plus `--stance-options` taken verbatim from the person's words | One blind panel with 3 fixed postures (assumptions, ship-maintain, feedback loops); split-first verdict; no gate | Options must first be generated (use C). The person wants to vote (use C). In-repo architecture (use the overlay) |
| A + architecture | `architecture-advisory` via `fgos-architecture-panel` | Repo framing, 3 lenses, reviewed synthesis, expertise gate | The question is not architectural, or a cheap verdict is enough (use `council-lite`) |
| B | preset **`rfc`** (reviewed, 1 round, reviewer and red-team) | Attacks one concrete artifact or decision | No artifact (ask question 2). Architecture artifact (use the specialist). Implementation requested (`fgos-run`) |
| C | **`nominal-group`** | Silent generation, consolidation, then a **human vote** at `voting-ranking`; never claims a winner | The person is unattended: run it anyway and report that it parked at the vote. Options already supplied (use A) |
| D | **`delphi`** | The only route with 2 blind rounds, an anonymized summary, and each seat's own previous answer | One-shot advice is enough (use A). About twice the cost |
| E | **`group-cognition`** | Blind sense-making, reviewed critique, split-first synthesis | Options already framed (use A). An artifact exists (use B) |
| "approve + roadmap" overlay | **`business-discussion`** | The only workflow with an approval gate and a roadmap step | The person only wants a verdict or critique (use A or B). Unattended |
| F | preset **`research-fan-out`** | 3 researchers plus a synthesizer; no verdict rule | A decision is wanted (use A or D) |
| G | preset **`consult`** | Solo advisor | The person said "panel", "independent" or "several" |
| Reopen settled architecture | `architecture-advisory-reopen` via the specialist | Revisits the parent reports with no new blind seats | No prior run exists |
| Implement and review | `fgos-run` | Not advisory | Any advisory request |

Tie-break: pick the narrower, gate-free route.

Launch doors: Workflows start with `fgos workflow start <id> --request ...
[--context-ref ...] [--stance-options ...] [--seats ...]`; presets run with
`fgos run --pattern <preset> --unit <file>`, which has no `--request` or
`--context-ref`, so the request and the artifact path go in the unit's
`objective`. Both are described in `fgos-group-thinking`.

## council-lite versus nominal-group

Both deal with options. They differ in who produces the options and who decides.

- **nominal-group** produces options by silent generation, and the person ranks
  them at a gate. It is for divergence plus participation.
- **council-lite** judges options the person already has. It runs 3 analytic
  postures in one blind pass with no gate and returns positions, agreement or
  split, what would change the verdict, and one next step.

So "judge **these** options" is `council-lite`; "come up with and rank
options" is `nominal-group`. There is no plain-panel route: a panel with no
verdict rule is `research-fan-out` (kind F).

Known cost of `council-lite`: decision clarity scored 1 of 2 on two measured
questions because the verdict is split-first
(`archive/plans/261007-0910-council-parity-verdict-persona-restate/reports/phase-04-remeasure-report.md`, n=1 per question, single judge). When the
person asked "which one?", the result must say so. The evidence supports
"preferred for kind A", not "proven better".

## Questions the skill may ask

Only these four; when more than one applies, batch them in one message.

1. The subject is absent.
2. Kind B, and no artifact can be read.
3. Kind A was named but the options are neither supplied nor discoverable. If
   options can be generated, do not ask: use kind C.
4. The only ambiguity is authority: advice or an actual change?

Never ask for: pattern, seat count, seat lenses, rounds, blind, gate,
attendance, provider, model, executor, tier.

## Launch inputs

| Input | When |
|---|---|
| `--request "<verbatim>"` | Always |
| `--context-ref <path>` | Artifacts or evidence the person named or that are plainly in scope (workflow routes). With `--seats`, every seat and checker receives them, so put domain documents here |
| `--seats "a\|b\|c"` | Only for `group-cognition`, `business-discussion`, `nominal-group`, `delphi`, and only when the request supports at least 2 distinct angles. 2-4 non-redundant entries (default 3). A lens is a short plain-text concern of 3-160 characters, one line, no braces, no `\|`, distinct; the person's own concerns, never invented standards or facts. An entry `@name` is a persona found as `<name>.yaml` in `fgos/agents/`, `domains/*/agents/` or `core/agents/` (listed and read first, name copied verbatim, never invented, never twice); it applies to that seat alone and an unknown name refuses the start. `council-lite`, `architecture-advisory` and presets refuse it. No seat maximum: more seats than provider families share a family; each is a pane and quota, so say so when asked for more than is sensible |
| `--stance-options "a\|b\|c"` | Only for `council-lite`, `delphi`, `nominal-group`, `group-cognition`, and only when the person's words contain 2-4 mutually exclusive answers. Never paraphrased, never invented. For `nominal-group` the options normally do not exist yet, so omit |
| `--worktree` / `--dir` | Same meaning as in `fgos-architecture-panel`: target project versus state root |

Everything else (rounds, blind, human gate, topology) comes only from the chosen
route, and so do the seats of `council-lite` and `architecture-advisory` (the
`council-*` postures; the architecture system, alternative and constraint
lenses). On the four generic-panel bases the seats are `--seats` lenses, or the
default three unspecialised seats when it is omitted. Domain flavour goes into
the request text, the lenses and `--context-ref` documents. Do not pass stance
options on the architecture route.

When a needed knob is not exposed, follow the unmet-knob rule in `SKILL.md`.
If the same knob keeps coming up across real requests, that is evidence for a
future runtime override, not a reason for a new workflow per request.

## Verification cases

Dry run: give each request to a fresh agent that has only `fgos-advise` and
this reference. Record the kind, route and flags it would launch before it
starts anything. Pass means it matches the row. Rephrase each request without
method words and expect the same route.

| # | Request | Expected route and configuration |
|---|---|---|
| 1 | (non-code) "Support queue: keep manual triage, automate, or a two-week shadow trial? Logs in `docs/ops/queue.md`. Run it while I'm out." | Kind A: `council-lite --request "<verbatim>" --stance-options "manual\|automate\|shadow trial" --context-ref docs/ops/queue.md`. No question, no gate. Result notes split-first |
| 2 | (non-code) "Red-team our 8% cafe price increase; proposal in `docs/pricing-v2.md`." | Kind B: `rfc` with the doc named in the unit objective. No stance (one proposal), no gate |
| 3 | (non-code) "Ideas to cut onboarding drop-off; I'll pick the top three." | Kind C: `nominal-group`. No stance. Warn that it parks at `voting-ranking` |
| 4 | "Independent estimates, then revise: how many months until the Rust host replaces the Node CLI?" | Kind D: `delphi`. Open estimate, so no stance |
| 5 | "Panel: should the plugin loader live in core or a plugin?" | Kind A plus architecture overlay: `fgos-architecture-panel` then `architecture-advisory --request "<verbatim>"`. Close gate expected. No stance |
| 6 | Negative: (a) "Review this" with nothing in scope. (b) "Implement rate limiting and get it reviewed." | (a) exactly one question (question 2). (b) `fgos-run`; no discussion workflow starts |
| 7 | (non-code) "Why does our month-end close keep slipping? Use `docs/finance/close-policy.md` and `docs/finance/reconciliation-aging.md`." | Kind E: `group-cognition --request "<verbatim>" --seats "reconciliation bottlenecks and evidence quality\|handoff timing and ownership\|automation failure modes" --context-ref docs/finance/close-policy.md --context-ref docs/finance/reconciliation-aging.md`; pre-launch line lists the three lenses in order; no persona names, no stance options |
| 8 | "Compare these 4 options with 6 perspectives: A, B, C, D." | Kind A: `council-lite` (its postures are fixed, `--seats` is refused there); say the 6 perspectives cannot be served on this route and offer `group-cognition` with `--seats` if the person wants lenses instead |

Live check, one run per route class: `fgos workflow status <id>` reaches
`completed` or parks at the expected gate, and the roles match the YAML. For
case 1, `fgos metrics discussions --since <date>` shows `measured` and the
stance counts; for cases 3 and 4 it shows `unmeasured`. Text tests alone cannot
prove the intake understands intent; the dry run and live runs are the proof.
