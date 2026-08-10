import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computePriority,
  computeImpact,
  weightForUrgency,
  discountForRisk,
  isRecognizedRisk,
  discountForRiskWithBlastRadius,
  derisknBonus,
  EFFORT_FLOOR,
} from '../../src/state/priority-formula.mjs';

// --- monotonicity (plan.md's own named proof point: the single
// highest-consequence correctness risk in this feature is a sign/inversion
// bug, since work.priority's ASC/absent-last sort contract (Data Dictionary
// #25) is the OPPOSITE direction of "bigger raw score = more important"). ---

test('computePriority: higher impact yields a strictly smaller stored priority (all else equal)', () => {
  const low = computePriority({ impact: 1, urgent: 'medium', effort: 4, risk: 'standard' });
  const high = computePriority({ impact: 50, urgent: 'medium', effort: 4, risk: 'standard' });
  assert.ok(high < low, `expected higher impact -> smaller priority number, got low=${low} high=${high}`);
});

test('computePriority: higher urgency yields a strictly smaller stored priority (all else equal)', () => {
  const lowUrgency = computePriority({ impact: 10, urgent: 'low', effort: 4, risk: 'standard' });
  const highUrgency = computePriority({ impact: 10, urgent: 'critical', effort: 4, risk: 'standard' });
  assert.ok(highUrgency < lowUrgency, `expected higher urgency -> smaller priority number, got low=${lowUrgency} high=${highUrgency}`);
});

test('computePriority: higher effort yields a strictly LARGER stored priority (all else equal — effort divides, never boosts)', () => {
  const cheap = computePriority({ impact: 10, urgent: 'medium', effort: 1, risk: 'standard' });
  const expensive = computePriority({ impact: 10, urgent: 'medium', effort: 20, risk: 'standard' });
  assert.ok(expensive > cheap, `expected higher effort -> larger (lower-priority) number, got cheap=${cheap} expensive=${expensive}`);
});

test('computePriority: higher risk (as a pure discount, no blast radius) yields a strictly LARGER stored priority (never a boost)', () => {
  const lightRisk = computePriority({ impact: 10, urgent: 'medium', effort: 4, risk: 'light' });
  const heavyRisk = computePriority({ impact: 10, urgent: 'medium', effort: 4, risk: 'heavy' });
  assert.ok(heavyRisk > lightRisk, `expected higher risk -> larger (lower-priority) number, got light=${lightRisk} heavy=${heavyRisk}`);
});

test('computePriority always returns a non-negative integer (schema requires Number.isInteger && >= 0)', () => {
  const cases = [
    { impact: 0, urgent: undefined, effort: undefined, risk: undefined },
    { impact: 1e6, urgent: 'critical', effort: 0.001, risk: 'heavy' },
    { impact: 1, urgent: 'low', effort: 1e6, risk: 'light' },
  ];
  for (const c of cases) {
    const p = computePriority(c);
    assert.equal(Number.isInteger(p), true, `expected integer, got ${p} for ${JSON.stringify(c)}`);
    assert.ok(p >= 0, `expected non-negative, got ${p} for ${JSON.stringify(c)}`);
  }
});

test('computePriority defaults: absent urgent reads as medium, absent effort reads as EFFORT_FLOOR', () => {
  const explicit = computePriority({ impact: 10, urgent: 'medium', effort: EFFORT_FLOOR, risk: 'standard' });
  const defaulted = computePriority({ impact: 10, risk: 'standard' });
  assert.equal(defaulted, explicit);
});

// --- D8: de-risk bonus feeds impact, never risk directly; the same
// blast-radius number discounts risk further, never boosts it. ---

test('derisknBonus is 0 when no blast-radius measurement exists (clarify rough pass)', () => {
  assert.equal(derisknBonus(undefined), 0);
  assert.equal(derisknBonus(0), 0);
  assert.equal(derisknBonus(-1), 0);
});

test('derisknBonus grows sub-linearly (sqrt) with blast radius, never negative', () => {
  const small = derisknBonus(4);
  const large = derisknBonus(400);
  assert.ok(small > 0 && large > small);
  assert.equal(large, Math.sqrt(400));
});

test('computeImpact sums blocks + semantic relatedness + de-risk bonus, defaulting each to 0', () => {
  assert.equal(computeImpact(), 0);
  assert.equal(computeImpact({ blocks: 3 }), 3);
  assert.equal(computeImpact({ blocks: 3, semanticRelatedness: 2 }), 5);
  assert.equal(computeImpact({ blocks: 3, semanticRelatedness: 2, blastRadius: 4 }), 5 + Math.sqrt(4));
});

test('discountForRiskWithBlastRadius never exceeds the pure keyword discount (blast radius only ever shrinks it further)', () => {
  for (const risk of ['light', 'standard', 'heavy']) {
    const base = discountForRisk(risk);
    const withBlast = discountForRiskWithBlastRadius(risk, 100);
    assert.ok(withBlast <= base, `expected blast-radius discount <= base for risk=${risk}, got base=${base} withBlast=${withBlast}`);
  }
});

test('discountForRiskWithBlastRadius falls back to the pure keyword discount when no blast radius is given', () => {
  for (const risk of ['light', 'standard', 'heavy']) {
    assert.equal(discountForRiskWithBlastRadius(risk, undefined), discountForRisk(risk));
  }
});

test('weightForUrgency/discountForRisk fall back to a sane default for an unrecognized or absent value', () => {
  assert.equal(weightForUrgency(undefined), weightForUrgency('medium'));
  assert.equal(weightForUrgency('not-a-level'), weightForUrgency('medium'));
  assert.equal(discountForRisk(undefined), discountForRisk('standard'));
  assert.equal(discountForRisk('not-a-risk'), discountForRisk('standard'));
});

// tsk-4hb: discountForRisk's own fallback cannot tell "absent" apart from
// "present but unrecognized" -- isRecognizedRisk exists so a caller that
// already does side effects can make that distinction observable.
test('isRecognizedRisk distinguishes a real RISK_DISCOUNTS key from an absent or unrecognized one', () => {
  assert.equal(isRecognizedRisk('light'), true);
  assert.equal(isRecognizedRisk('standard'), true);
  assert.equal(isRecognizedRisk('heavy'), true);
  assert.equal(isRecognizedRisk(undefined), false);
  assert.equal(isRecognizedRisk('medium'), false, 'a real-world unrecognized value seen in production (tsk-4hb\'s own log evidence)');
  assert.equal(isRecognizedRisk('not-a-risk'), false);
});
