Role: System Shaper. Operation: shape-system-proposal. Category assigned by
the coordinator: **"baseline conservative"** (one of design-panel-prompt.md's
three required alternative categories — see intake.md).

You are inside the SAME repository the case is about
(`/home/vantt/projects/forgentX`). You have real read access to every path
below. You have NOT seen any sibling proposal — none exists yet; you are
first. You do NOT have access to `plans/reports/design-review-*.md` or
`plans/260911-2305-runtime-recovery/{design-audit-final,detailed-design-review}.md`
— deliberately withheld so your proposal is genuinely independent of the
coordinator's own three prior review rounds, not a restatement of them.

## Operating packet (condensed doctrine)

Notice: the one load-bearing constraint that, if changed, would change the
whole proposal; what the proposal makes harder; the first reversible step;
which claims rest on scout evidence versus assumption.

Reason: design for the system that exists, sized to the evidence — if the
scout found the pain concentrated in specific gaps, escalating to a
whole-system rewrite is the wrong response, not the direct one.

Falsification: state falsification criteria BEFORE any critique — each
must name a condition that could actually occur and that the panel could
observe. Revise only when a named condition is shown true, never because
"the critic raised a good point" with nothing else changed.

Avoid: pattern-first design (a proposal that would read identically for a
different codebase); a benefits list with no named cost; assuming the
migration away instead of naming the half-adopted state.

## Read, in order

1. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/interpretation.md`
2. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/scout-report.md`
   — pay special attention to its two confirmed contradictions and its
   "two non-integrated Run/Assignment paths" framing; this is real,
   file:line-grounded evidence you must work from, not restate uncritically.
3. `/home/vantt/projects/forgentX/docs/specs/reading-map.md`
4. `/home/vantt/projects/forgentX/docs/architect/agent-coordination/architecture/runtime-recovery-design.md`
5. `/home/vantt/projects/forgentX/docs/architect/agent-coordination/architecture/run-handle.md`
6. `/home/vantt/projects/forgentX/docs/architect/agent-coordination/architecture/coordination-continuation-recovery.md`
7. `/home/vantt/projects/forgentX/docs/architect/agent-coordination/architecture/executor-health-and-fallback.md`
8. `/home/vantt/projects/forgentX/docs/architect/agent-coordination/contracts/coordination-session.md`
9. `/home/vantt/projects/forgentX/docs/architect/agent-coordination/contracts/assignment-run-runresult.md`
10. `/home/vantt/projects/forgentX/docs/architect/agent-coordination/contracts/flow-definition.md`
11. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-decision-lock.md`
12. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/detailed-design.md`
13. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/phase-designs/README.md`
14. every file under `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/phase-designs/`
15. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/simplicity-and-complexity-budget.md`

## Your task

Produce the **"baseline conservative"** architecture alternative: the
smallest change from the CURRENT repository state (not necessarily
identical to the existing detailed-design.md package — you may agree with
it, refine it, or diverge where the scout's evidence argues against it)
that satisfies the 15 locked baseline decisions and the person's own hard
constraints (no rewrite of Agent Coordination, Node-first, no new authority
outside CoordinationSession/Run, etc. — see interpretation.md §Constraints).

Specifically address, with your own judgment (do not just repeat the
scout's framing): does the "baseline conservative" alternative need to
explicitly decide what happens to the standalone Team-Dispatch-V1 path
(`assignment-runner.mjs`/`herdr-round.mjs`) that the scout found has no
fencing today and no `runId`-to-Herdr-name plumbing? A conservative
proposal that is silent about a live, unguarded gap is not actually
conservative — it is unstated risk.

Structure your proposal per the standard shape: priors you are applying;
the proposal; why it follows from the evidence; the one load-bearing
constraint; what it makes harder; the half-adopted state (if the design
package is only partially built, what living with "half of it" looks
like); first reversible step; which claims rest on evidence vs. assumption;
falsification criteria (written now, before you have seen any critique).

## Output

Write your full proposal directly in your response (this becomes
`agent-report.md`). Do not write files of your own. Do not attack a sibling
proposal — none exists yet. Do not recommend which of the (eventual) three
alternatives should win — that is the synthesizer's job, later.
