Role: Alternative Shaper. Operation: shape-alternative-proposal. Category
assigned by the coordinator: **"gateway-change"** (one of design-panel-
prompt.md's three required alternative categories — see intake.md). This
is the coordinator's reading of what "gateway-change" means for this case:
an alternative that moves ownership of the identity/fencing problem to a
DIFFERENT boundary than the Node-side phase-designs package currently
assumes — e.g., treating Herdr/gateway-side capability (launch identity,
`absent-proven`, incarnation) as the primary lever rather than Node-side
plumbing-then-wait-for-gateway. You may disagree with this reading if the
evidence argues for a genuinely different "gateway-change" shape — say so
explicitly and why.

You are inside the SAME repository the case is about
(`/home/vantt/projects/forgentX`). You have real read access to every path
below. You have NOT seen any sibling proposal — none exists yet; you are
independent of the system shaper by construction (separate dispatch,
separate context). You do NOT have access to `plans/reports/design-review-*.md`
or `plans/260911-2305-runtime-recovery/{design-audit-final,detailed-design-review}.md`
— deliberately withheld for independence.

## Operating packet (condensed doctrine)

Notice: the option nobody proposed because it looked too small;
**solution classes, not variants** — buying instead of building, deleting
instead of abstracting, changing who owns the code instead of changing the
code, changing the process instead of the system; the no-build path's real
concrete consequences (a rate, a cost, a trigger — never one sentence).

Reason: state the priors you are applying, up front, grounded in something
observed — not contrarianism. A reframe still owes a candidate: "the real
problem is elsewhere" and stopping there is evasion, not output.

Falsification: same discipline as the system shaper — criteria named
before critique, each a condition that could actually occur.

Avoid — the single most damaging failure in the whole panel: **the
designated loser**. Five drawbacks and one vague benefit that no reader
could believe its own author endorses. Test: would you defend this option
if asked directly? If not, it isn't real yet.

## Read, in order

1. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/interpretation.md`
2. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/scout-report.md`
   — especially its finding that `runId` is never plumbed into
   `herdr-round.mjs`'s agent-name construction, and that `agentGet(name)`
   has no verified `absent-proven` behavior against a live gateway. This is
   the load-bearing evidence for a genuine gateway-change candidate.
3. `/home/vantt/projects/forgentX/docs/architect/agent-coordination/architecture/run-handle.md`
4. `/home/vantt/projects/forgentX/docs/architect/agent-coordination/architecture/runtime-recovery-design.md`
5. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/phase-designs/launch-reconciliation.md`
   (S2 — the phase most directly gateway-dependent)
6. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/detailed-design.md`
7. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/phase-designs/README.md`
8. every other file under `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/phase-designs/`
9. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/simplicity-and-complexity-budget.md`
10. `/home/vantt/projects/forgentX/docs/architect/agent-coordination/contracts/assignment-run-runresult.md`

## Your task

Produce a genuine, defensible **"gateway-change"** alternative to the
current phase-designs package's Node-side-first sequencing. Consider
solution classes such as: does the gateway (Herdr) already have, or could
cheaply gain, a capability (e.g. a real `absent-proven`/launch-identity
lookup) that would let S2 skip the Node-side plumbing work the scout found
missing entirely? Is there a "buy" move — using an existing Herdr
primitive differently — versus the "build" move the current package
assumes? Name the no-build path's real consequence if no gateway change
happens (what breaks, how often, how bad).

Structure per the standard shape: priors; the proposal; why it follows
from evidence; load-bearing constraint; what it makes harder; the
no-build path (mandatory sub-section: real, concrete consequences); first
reversible step; evidence vs. assumption; falsification criteria (written
now, before any critique).

## Output

Write your full proposal directly in your response (this becomes
`agent-report.md`). Do not write files of your own. Do not attack a
sibling proposal. Do not recommend which of the (eventual) three
alternatives should win.
