# Review Prompt - Code Implementation Track Policy

Use this prompt to ask another agent or reviewer to critique the design.

```text
Please review this design plan:

plans/260915-code-implementation-track-policy/plan.md

Context:
- We often create long code implementation plans through conversation, then hand
  them to agents for execution across many cells/phases.
- Current `fgos-plan-loop` is a generic Work-independent track coordinator.
- Current `fgos-code-panel` is documented as a single code change, but the user
  expectation is increasingly "run this code implementation plan."
- Running full `npm test` after every cell is too expensive and often
  unnecessary; full proof should happen at declared checkpoints and final close.
- We do not want to put `npm test` or code-specific logic into the generic
  CoordinationSession engine or generic plan-loop core.

Please give a critical review, not a summary.

Questions to answer:
1. Is the proposed three-layer seam sound?
   - Coordination Engine: generic session/mutation/quorum/event log
   - Generic Track Orchestrator: plan/cell/review/fix/close loop
   - Code Implementation Policy: targeted verification and full-test checkpoints
2. Should `fgos-code-panel` become the code-domain facade for long
   implementation tracks, or should that responsibility get a new skill/name?
3. Does the plan keep SOLID boundaries, or does it still leak code-test logic
   into generic plan-loop?
4. Is the MVP order right?
   - MVP1 policy addendum
   - MVP2 skill wording fix
   - MVP3 plan template
   - MVP5 lightweight validator
   - MVP6 plan-loop policy injection
   - MVP7 code-panel facade
5. Is convention-first safe, or should a validator come before changing skill
   wording?
6. Does targeted-per-cell plus full-at-checkpoint preserve Definition of Done,
   or are there missing gates?
7. What specific wording would prevent agents from running full suite in every
   cell while still letting reviewer/red-team escalate when blast radius
   requires it?
8. What should be rejected or postponed from this plan?

Please structure your response as:
- Accepted decisions
- Rejected or risky decisions, with reasons
- Missing design seams
- Recommended MVP scope
- Concrete wording or contract changes
- Final go/no-go recommendation

Be adversarial about architecture boundaries. Do not assume the design is right
because it sounds tidy.
```
