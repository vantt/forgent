// test/runner/execution/patterns/retired-keys.test.mjs -- the retired pattern keys a config may still carry are
// found by their dotted path, a descendant of a retired key included.

import '../../../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectRetiredPatternKeys } from '../../../../src/runner/execution/patterns/retired-keys.mjs';

test('detectRetiredPatternKeys matches descendant dotted paths', () => {
  const descendantHits = detectRetiredPatternKeys('runner.patterns.research-fan-out-gated.loop');
  assert.equal(descendantHits.length, 1);
  assert.equal(descendantHits[0].key, 'runner.patterns.research-fan-out-gated');
  assert.equal(descendantHits[0].replacement, 'runner.patterns.research-fan-out');

  const tuningHits = detectRetiredPatternKeys('runner.patterns.reviewed.maxRounds.child');
  assert.equal(tuningHits.length, 1);
  assert.equal(tuningHits[0].key, 'runner.patterns.reviewed.maxRounds');
});
