import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DOCTOR_CHECKS } from '../../src/setup/checks.mjs';

const ID = 'activation-matches-pin';
const CASES = JSON.parse(fs.readFileSync(
  fileURLToPath(new URL('../../packages/distribution/rust/tests/goldens/pin-drift-cases.json', import.meta.url)), 'utf8'));

function workspace(t, { activation, pin, rawPin }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-pin-drift-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  execFileSync('git', ['init', '-q'], { cwd: root });
  fs.mkdirSync(path.join(root, '.fgos', 'installation'), { recursive: true });
  if (activation) {
    const record = { artifactDigest: activation.artifactDigest, releasePath: '/nowhere', status: 'ready' };
    if (activation.pinOverrideReason) record.pinOverrideReason = activation.pinOverrideReason;
    fs.writeFileSync(path.join(root, '.fgos', 'installation', 'activation.json'), JSON.stringify(record));
  }
  if (pin === 'unreadable') rawPin = '{ "projectRuntime": {} }';
  if ((pin && pin !== 'unreadable') || rawPin !== undefined) {
    fs.writeFileSync(path.join(root, '.fgos', 'distribution.json'),
      rawPin ?? JSON.stringify({ schemaVersion: 1, projectRuntime: { policy: 'exact-digest', ...pin } }));
  }
  return root;
}

const row = () => DOCTOR_CHECKS.find((c) => c.id === ID);
const cases = CASES.cases;

test('the doctor row exists once', () => {
  assert.equal(DOCTOR_CHECKS.filter((c) => c.id === ID).length, 1);
});

// The row's own answer: the level of a row (a `warning:` message is a warning) and the fix of a failing one are the
// engine's, proved by its own tests; here the row says what it found and, when it names one, its command.
const judge = (root) => row().check(root);

for (const c of cases) {
  test(`activation-matches-pin: ${c.name}`, async (t) => {
    const root = workspace(t, c);
    const result = await judge(root);
    assert.equal(result.passed, true, 'a drift row never fails doctor');
    if (c.line === null) {
      assert.ok(!result.message?.startsWith('warning:'), result.message);
      return;
    }
    assert.ok(result.message.startsWith(`warning: ${c.line}`), result.message);
    if (c.line.startsWith('active')) {
      assert.match(result.fixCommand, /fgctl init/);
      assert.match(result.fixCommand, /fgctl upgrade/);
    }
  });
}

test('activation-matches-pin skips when there is no pin or no activation, and never fails', async (t) => {
  const noPin = workspace(t, { activation: cases[0].activation });
  const skippedNoPin = await judge(noPin);
  assert.deepEqual([skippedNoPin.passed, skippedNoPin.status], [true, 'skip']);
  const noActivation = workspace(t, { pin: cases[0].pin });
  const skippedNoActivation = await judge(noActivation);
  assert.deepEqual([skippedNoActivation.passed, skippedNoActivation.status], [true, 'skip']);
});

test('activation-matches-pin warns that the committed pin is unreadable when the file is not valid JSON, even with no activation', async (t) => {
  const garbage = workspace(t, { rawPin: '{ not json' });
  const result = await judge(garbage);
  assert.equal(result.passed, true);
  assert.match(result.message, /^warning: the committed pin is unreadable: \.fgos\/distribution\.json/);
});
