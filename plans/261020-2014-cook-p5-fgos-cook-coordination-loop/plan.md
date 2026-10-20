---
status: in-progress
created: 2026-10-20
---

# COOK P5: the `fgos-cook` skill (coordination loop)

Roadmap P5 ([roadmap](../reports/roadmap-261016-2212-fgos-cook-and-git-component.md)). Owner approved the lane 2026-10-20 20:09. A coordinator skill takes a plan written by AgentKit's `ak:plan` (third-party: read, never modify), opens a **conductor case** on the coding guide with a frame sized from the plan, picks the next slice, dispatches through the two doors naming the case, checks results itself, judges findings, adapts, integrates and reports. Owner is asked only in the decision-question template, batched.

## Out of scope

- The route table (capability, rigor, tier, pattern, persona per slice kind): waits for the Seat Binding spec. One reference names it pending and lists the inputs the loop needs. No rigor-to-tier rule is invented.
- Parallel writing slices (Git G3 not ready): the loop runs slices serially, one worktree bound to the case. The skill says so.
- No new runtime mechanism (RUL104), no `src/` change, no Seat Binding files, no AgentKit files.

## Facts and prior art

Reused as is:

| What | Where | Use |
|---|---|---|
| Case doctrine (observe, choose, dispatch naming the case, verify, disposition, adapt, close) | `core/skills/_shared/coordination-driver.md` | the skill fills its nine hook slots; it does not restate the loop |
| ak:cook worker brief | `core/skills/_shared/ak-cook-worker-contract.md` | slice brief when the chosen executor declares `ak:cook` |
| Decision question, executor fallback | `_shared/decision-question.md`, `_shared/executor-dispatch-fallback.md` | questions; `fgos dispatch decide` before any dispatch |
| Conductor loop and the ten plan-reading points | research 261016-2141 §3, §5 (not its table) | loop and reading guide |
| Shape | `core/skills/fgos-advise/` | SKILL.md plus one reference per decision table |
| Guide | `domains/coding/workflows/feature.yaml` (guide part, `coding/feature`) | activities, milestones, MUST rows; opened with `fgos workflow start coding/feature --frame ... --worktree ...` (probed in a scratch repo: opens a conductor case, `status` shows milestones, routes, frame left, binding) |
| Old `/fgOS:cook`, renamed `/fgOS:deliver` (ad6c3d6b2) | Work item lifecycle, one sentence to `awaiting-approval` | different job (Work), kept; `fgos-cook` never touches Work |
| `fgos workflow start --plan` | retired (cb9bf5f58); `fgos-run` Mode B points at "a later conductor skill" | Mode B pointer now names `fgos-cook` |

Missing, found by reading and one probe (evidence, not built):

- A conductor settle never records a milestone. `createCaseAdmissionPort().settle` writes `achieved: []` (`src/workflow/case-admission-port.mjs:275`); the projection achieves a milestone only from a settle's `achieved` list, a playbook `step.complete`, or a gate answer (`src/workflow/case-projection.mjs:126`). The tests write `achieved` by hand (`test/workflow/conductor-case.test.mjs:45`). Probe: on a fresh `coding/feature` case, `fgos run --case ... --activity implement-item` refuses `entry-milestone-unmet: "plan-validated" is not reached`, and no dispatch can ever reach it. So a conductor loop cannot pass its first activities until a settle records what the activity produced. This blocks the live run (P6), not the skill text. Coordinator decision 2026-10-20: this is a gap against RUL-WF-2 (an activity's `produces` become achieved, delivery milestones gated by receipts), fixed by a separate lead in `src/workflow` in parallel. This lane does not wait and does not touch `src/`; the loop is written assuming the fix (validate-plan reaches plan-validated, implement-item reaches child-verified with receipts) and the skill stops by name (`milestone-not-recorded`) if a passing settle leaves the milestone unreached. Dependency: the live run needs that fix on main.

## Units

| # | Unit | Done when |
|---|---|---|
| 1 | `core/skills/fgos-cook/SKILL.md`: route (understand, open case, loop), nine hook values, boundaries | renders; guards green |
| 2 | `references/reading-ak-plans.md`: how to read an ak plan as an artifact (ten points), frame sizing, what goes in `inputs` | linked from SKILL.md |
| 3 | `references/case-and-doors.md`: the exact commands (open, dispatch, status, close), serial single-worktree layout, slice brief, self-check, finding disposition, adaptation bounds, integration and handoff, notebook | linked |
| 4 | `references/route-table-pending.md`: names the table as pending on Seat Binding; lists the inputs the loop needs from it; states what the loop does until then | linked |
| 5 | `fgos-run` Mode B pointer, CHANGELOG line, reading-map entry; spec line only if a contract fact changes | docs guards green |
| 6 | `npm run build:skills`, skill and doc guards, architecture test, full suite once | results in the lead report |

## Acceptance

- A fresh agent with no chat history can run the loop from SKILL.md and its three references and knows which command each step uses.
- Every dispatch names the case; the skill never pins provider, model or tier; slices run serially and the skill says why.
- The owner is asked only for: frame approval at the start, consent gates, frame widening, an ambiguity in the plan, repeated refusals across distinct approaches; each in the decision-question template, batched.
- The skill never merges; handoff leaves the integrated branch to the approve door.
- The pending table and the milestone gap are stated, not hidden.

## Reversal triggers

- Seat Binding settles what rigor and tier mean: write the table then; this plan does not.
- Git G3 lands the land operation: lift the serial limit and rewrite integration in the case reference.
- A settle starts recording milestones: delete the `milestone-not-recorded` stop; keep the self-check only if the live trial shows it still catches something.
