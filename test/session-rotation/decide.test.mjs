import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decideRotation, thresholdsFor } from '../../src/session-rotation/decide.mjs';

const config = { soft: 0.4, hard: 0.7, keep: 10, windowSize: 1000000, personas: { miu: { soft: 0.2, hard: 0.5, reload: ['a.md'] }, half: { hard: 0.9 } } };
const run = (over) => decideRotation({ fraction: 0.5, config, persona: 'other', ...over });

test('below the soft threshold nothing rotates', () => assert.equal(run({ fraction: 0.39 }).rotate, 'none'));
test('at rest between soft and hard rotates soft', () => assert.equal(run({ fraction: 0.4 }).rotate, 'soft'));
test('at or above hard rotates hard', () => assert.equal(run({ fraction: 0.7 }).rotate, 'hard'));
test('a pending owner question holds soft but not hard', () => {
  assert.deepEqual(run({ pendingQuestion: true }), { rotate: 'none', reason: 'pending-question' });
  assert.equal(run({ fraction: 0.8, pendingQuestion: true }).rotate, 'hard');
});
test('a running background task or cron blocks every level', () => {
  assert.equal(run({ fraction: 0.9, backgroundTasks: [{ id: 'x' }] }).reason, 'background-work-running');
  assert.equal(run({ fraction: 0.5, sessionCrons: [{}] }).rotate, 'none');
});
test('an unmeasured session never rotates', () => assert.equal(run({ fraction: null }).reason, 'no-measure'));
test('a persona override replaces the global thresholds, a partial one keeps the other global', () => {
  assert.equal(run({ persona: 'miu', fraction: 0.25 }).rotate, 'soft');
  assert.equal(run({ persona: 'miu', fraction: 0.5 }).rotate, 'hard');
  assert.deepEqual(thresholdsFor(config, 'half'), { soft: 0.4, hard: 0.9 });
});
test('soft above hard is refused by name', () => assert.throws(() => thresholdsFor({ ...config, personas: { p: { soft: 0.9 } } }, 'p'), /soft 0.9 is above hard 0.7/));
