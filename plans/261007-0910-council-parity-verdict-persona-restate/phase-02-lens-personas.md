---
phase: 2
title: "Lens personas per seat"
status: done
priority: P2
effort: "1d"
dependencies: [1]
---

# Phase 02: Lens personas per seat

## Overview
Promote a small set of council-style lenses (assumption-destroyer, ship/maintain, feedback loops; add 2–3 only if a real question needs them) from the experiment folder into `core/agents/`, and let a discussion workflow give each seat its own lens.

## Requirements
- Each persona declares method, blind spot and a rule to end with a stated position (as in the experiment files).
- Per-seat binding must work through existing owners (template persona/params or `scope.role` override). If it needs a runtime seam, STOP and replan.
- Provider independence stays with `bind()`; persona is task posture only, not a registry or actor identity.

## Related Code Files
- Create: `core/agents/<lens>.yaml` (from `plans/reports/council-lens-experiment-261004/personas/`).
- Modify: discussion workflows to name lenses per seat; renderer only if `method`/`blind_spot` cannot be carried in `description` (decide, do not assume).
- Check: how persona is rendered into briefs, and how a panel's seats receive different personas on main.

## Implementation Steps
1. Answer open question 1: can a panel seat get its own persona via template params on main? Show evidence from a dry run's `brief-N.md`.
2. Add the persona files; run the agent-definition projection/build the repo requires for new `core/agents` files; check no hand edits to render targets.
3. Wire lenses into one workflow first (Delphi or a new small `council-lite` workflow), run it for real, confirm each brief carries a different lens.
4. Keep the roster small; justify any persona beyond three with a real question that needs it.

## Success Criteria
- [ ] Real run: each seat's brief shows a distinct lens and each report follows its method.
- [ ] A seat's lens measurably changes its position or reasoning versus the same seat without it (one comparison, recorded).
- [ ] No runtime code change; if one was needed, plan stopped and re-shaped.

## Risk Assessment
Distinct lenses on the same provider reintroduce correlated priors (the council's own weakness); `bind()` keeps providers distinct. A persona that nudges toward a conclusion defeats the purpose: review wording for steering.
