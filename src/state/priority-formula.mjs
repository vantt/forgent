// priority-formula.mjs — pure calculation for work-item-priority-matrix
// (tsk-4y5, D6). No fs/Date.now/mutation — same discipline as
// src/state/impact.mjs and src/state/graph-metrics.mjs.
//
// priority = invert((impact * weight(urgent)) / max(effort, floor) * discount(risk))
//
// `invert()` matters: work.priority's schema/sort contract is ASC with
// absent-last (Data Dictionary #25) — smaller number = higher priority —
// while impact/urgent/effort/risk combine into a raw score where BIGGER
// means MORE important. Getting this backwards silently reorders every
// item's priority; see CONTEXT.md D6 for why this is called out as the
// single highest-consequence correctness risk in this feature.

export const URGENCY_WEIGHTS = Object.freeze({ low: 0.5, medium: 1, high: 2, critical: 4 });
export const RISK_DISCOUNTS = Object.freeze({ light: 1, standard: 0.85, heavy: 0.6 });
export const EFFORT_FLOOR = 1;
export const PRIORITY_SCALE = 10000;

// D5: reuses fgos-coding-planning's own mode vocabulary (SKILL.md step 2's mode
// gate: tiny/small/standard/high-risk/spike) rather than a bespoke numeric
// estimator with no precedent in the repo. `spike` gets a low number
// deliberately: a spike's own effort (answering one yes/no question) is
// typically small even though its OUTCOME is high-stakes for what comes
// after -- that stakes signal belongs to `risk`/`impact`, not `effort`.
export const MODE_EFFORT = Object.freeze({ tiny: 1, small: 2, standard: 4, 'high-risk': 8, spike: 2 });

export function effortForMode(mode) {
  return MODE_EFFORT[mode] ?? MODE_EFFORT.standard;
}

export function weightForUrgency(urgent) {
  return URGENCY_WEIGHTS[urgent] ?? URGENCY_WEIGHTS.medium;
}

export function discountForRisk(risk) {
  return RISK_DISCOUNTS[risk] ?? RISK_DISCOUNTS.standard;
}

// tsk-4hb: `risk` is free text (Data Dictionary #6, docs/specs/work-state.md),
// so a value outside RISK_DISCOUNTS is spec-legal, not a data error --
// discountForRisk's own `?? standard` fallback cannot tell "absent" (a
// legitimate default) apart from "present but unrecognized" (silently
// masked, same discount either way). This pure query lets a caller that
// already does side effects (addDecision) log the distinction instead of
// leaving it invisible.
export function isRecognizedRisk(risk) {
  return Object.hasOwn(RISK_DISCOUNTS, risk);
}

// D8: de-risking value feeds `impact` as a bonus (never `risk`) — sub-linear
// (sqrt) so a very large blast radius still yields a bounded bonus rather
// than dominating the whole score. 0 when no measurement exists yet (the
// clarify rough pass, before a code target is known).
export function derisknBonus(blastRadius) {
  if (!Number.isFinite(blastRadius) || blastRadius <= 0) return 0;
  return Math.sqrt(blastRadius);
}

// D4/D8: the SAME blast-radius measurement also discounts `risk` further —
// never boosts, only ever shrinks the multiplier further below the
// keyword-based baseline. Reading the same number twice for two different
// roles is not circular (see CONTEXT.md D8): neither role depends on the
// other's *output*, both read the same upstream measurement independently.
export function discountForRiskWithBlastRadius(risk, blastRadius) {
  const base = discountForRisk(risk);
  if (!Number.isFinite(blastRadius) || blastRadius <= 0) return base;
  return base / (1 + Math.sqrt(blastRadius) / 10);
}

// D3: impact = blocks (STR21 rankImpact, always available) + semantic
// relatedness (judge-estimated, always available) + de-risk bonus (only
// once a real blast-radius measurement exists — 0 at the clarify rough
// pass, per D8).
export function computeImpact({ blocks = 0, semanticRelatedness = 0, blastRadius } = {}) {
  return blocks + semanticRelatedness + derisknBonus(blastRadius);
}

/**
 * D6's calculated `priority`. `effort`/`blastRadius` are optional (absent
 * at the clarify rough pass, per plan.md's phased design) — `effort`
 * defaults to `EFFORT_FLOOR` (assume the cheapest case until decompose
 * knows better, never divide-by-zero), `blastRadius` defaults to no bonus
 * / no extra discount (handled inside `derisknBonus`/
 * `discountForRiskWithBlastRadius`).
 */
export function computePriority({ impact = 0, urgent, effort = EFFORT_FLOOR, risk, blastRadius } = {}) {
  const w = weightForUrgency(urgent);
  const e = Math.max(effort, EFFORT_FLOOR);
  const d = discountForRiskWithBlastRadius(risk, blastRadius);
  const raw = (impact * w * d) / e;
  return Math.round(PRIORITY_SCALE / (raw + 1));
}
