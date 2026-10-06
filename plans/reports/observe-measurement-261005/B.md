# Synthesis: Should fgOS add a dissent/agreement gate to panels?

Role: synthesizer. Sources: panelist-1, panelist-2, panelist-3 reports (paths in evidenceRefs). Read-only; no code or docs modified.

## Panelist positions

- **panelist-1 — no-gate (confidence 0.78).** The information a gate would produce already exists via passive stance capture; a gate adds a blocking step on every panel, directly costing locked priorities #1 (ship speed) and #2 (release humans). Agreement rate is a weak quality signal: LLM panelists share priors, so unanimous agreement is cheap and often correlated error; forced dissent produces performative dissent. Recommends passive measurement plus a non-blocking advisory warning when all panelists agree at confidence ≥ 0.8, and revisiting after ~20 panels with outcome-linked data.
- **panelist-2 — no-gate.** Any gate (mandatory or optional) adds latency, state machines, and human meta-work, violating priorities #1 and #2; reproducible DoD (#3) is already satisfied by the synthesis artifact. Counterfactual: with a gate, panel runs become review queues where a single dissenter stalls shipping; without a gate, agreement statistics accumulate silently at zero velocity cost. Re-evaluate only if quantified data shows passive measurement is insufficient.
- **panelist-3 — no-gate (confidence 0.95).** Panels are advisory/cognitive tools; their DoD is gathering independent perspectives and honest synthesis, not enforced consensus. A gate turns inevitable LLM disagreement into a pass/fail condition, destroying determinism (#3) and re-capturing humans (#2). Forcing consensus breeds sycophancy. If a downstream DAG needs to branch on agreement, it should read the exported stance metadata as a flow condition — not embed blocking logic in the panel.

## Disagreements (kept visible, not averaged away)

- **Advisory warning:** panelist-1 wants a non-blocking synthesis warning when all panelists pick the same choice at confidence ≥ 0.8 (a groupthink flag). panelist-2 and panelist-3 do not propose any active signal; panelist-3 in particular treats downstream branching as the DAG's job, not the panel's. This is a real, unresolved difference: it costs almost nothing (text-only, non-blocking) but adds panel-side behavior that 2 of 3 panelists did not ask for.
- **Evidence bar for revisit:** panelist-1 sets a concrete trigger (~20 panels, outcome-linked correlation, or an observed uncaught groupthink incident); panelist-2 demands "quantified problem that passive measurement cannot address" without a numeric threshold; panelist-3 gives no revisit trigger, treating downstream DAG conditions as the permanent escape hatch. The strength of conviction also differs (0.78 vs. unstated vs. 0.95).

## Convergence

All three independently reach **no-gate** from different angles:

1. Passive stance measurement already captures the observability a gate claims to provide — without blocking anything.
2. A gate is a direct tax on locked priority #1 (consumer shipping speed) and #2 (human release), with unproven benefit and no threshold data to tune it.
3. Agreement is a noisy metric (shared LLM priors, correlated error, performative dissent when forced), so gating on it would key pass/fail on noise and harm reproducible DoD (#3).
4. A gate is easy to add later once evidence exists, and hard to remove once shipped — asymmetry favors waiting.

Counterfactual check: the worst case under no-gate is an undetected groupthink episode that a gate might have caught — and even panelist-1 concedes this is currently unmitigated-by-data but readable by humans via the stance spread in synthesis. The worst case under any gate is guaranteed latency and human re-capture on every panel, with no evidence gates catch defects. Asymmetric risk favors no-gate.

## Recommendation

**no-gate.**

Executable form, merged from the three positions (the minimal subset all can live with):

1. Keep stance strictly passive — no threshold logic in the panel runtime or protocol.
2. Continue recording `stance {choice, confidence}` in panelist outbox metadata as the observability dataset.
3. Adopt panelist-1's cheap, non-blocking advisory as an optional synthesis note (not a runtime mechanism) when all panelists declare the same choice at confidence ≥ 0.8 — flag only, never block. If downstream consumers object even to this, defer it; it is the one point of divergence.
4. Revisit with evidence after ~20 panels: if agreement correlates with later reversals/defects, promote to optional-gate; mandatory-gate only if optional-gate shows a clear defect-catch rate at acceptable latency. Any downstream that needs to branch on agreement reads exported stance metadata as a DAG flow condition (panelist-3's separation of concerns).

**Evidence for the recommendation:** unanimous independent convergence of three panelists on no-gate (confidences 0.78, unstated, 0.95); alignment with all three locked priorities (ship speed, human release, reproducible DoD); absence of any outcome data showing current panels produce incorrect decisions at a rate justifying velocity cost (panelist-2); and the add-later-remove-hard asymmetry (panelist-1). The convergence itself is high-agreement — which, per panelist-1's own argument, is weak evidence of correctness; the mitigation is that the recommendation is reversible (a gate can be added later with data), so the cost of being wrong is low.

stance: no-gate, confidence 0.9
