import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DOCTOR_CHECKS, runDoctor } from '../../src/setup/checks.mjs';

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

for (const c of cases) {
  test(`activation-matches-pin: ${c.name}`, async (t) => {
    const root = workspace(t, c);
    const doctor = await runDoctor(root, { checks: [row()], fixes: [] });
    const [result] = doctor.checks;
    assert.equal(doctor.ok, true, 'a drift row never fails doctor');
    if (c.line === null) {
      assert.notEqual(result.status, 'warn');
      return;
    }
    assert.equal(result.status, 'warn');
    assert.ok(result.message.startsWith(`warning: ${c.line}`), result.message);
    if (c.line.startsWith('active')) {
      assert.match(result.fix, /fgctl init/);
      assert.match(result.fix, /fgctl upgrade/);
    }
    assert.deepEqual(doctor.next, [], 'a warning is not a next step');
  });
}

test('activation-matches-pin skips when there is no pin or no activation, and never fails', async (t) => {
  const noPin = workspace(t, { activation: cases[0].activation });
  assert.equal((await runDoctor(noPin, { checks: [row()], fixes: [] })).checks[0].status, 'skip');
  const noActivation = workspace(t, { pin: cases[0].pin });
  assert.equal((await runDoctor(noActivation, { checks: [row()], fixes: [] })).checks[0].status, 'skip');
});

test('activation-matches-pin warns that the committed pin is unreadable when the file is not valid JSON, even with no activation', async (t) => {
  const garbage = workspace(t, { rawPin: '{ not json' });
  const doctor = await runDoctor(garbage, { checks: [row()], fixes: [] });
  assert.equal(doctor.ok, true);
  assert.equal(doctor.checks[0].status, 'warn');
  assert.match(doctor.checks[0].message, /^warning: the committed pin is unreadable: \.fgos\/distribution\.json/);
});
