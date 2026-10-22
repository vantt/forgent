import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { DOCTOR_CHECKS, FIX_REGISTRATIONS } from '../../src/setup/registrations.mjs';
import { writeProjectConfig } from '../helpers/config-fixture.mjs';

function mkTempDir() {
  const dir = path.join(tmpdir(), 'fgos-doctor-coord-test-' + Math.random().toString(36).slice(2));
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
  return dir;
}

const checkPolicy = DOCTOR_CHECKS.find(c => c.id === 'runner-coordination-orgPolicy-shape').check;
const fixPolicy = FIX_REGISTRATIONS.find(c => c.id === 'runner-coordination-orgPolicy-shape').fix;

test('runner-coordination-orgPolicy-shape: valid policy -> unchanged', () => {
  const cwd = mkTempDir();
  const configPath = path.join(cwd, '.fgos', 'config.json');
  writeProjectConfig(cwd, { runner: { coordination: { orgPolicy: { dischargeOn: ['accepted', 'rejected'] } } } });
  
  const res = checkPolicy(cwd);
  assert.equal(res.passed, true);
  
  const fixRes = fixPolicy(cwd);
  assert.equal(fixRes.changed, false);
});

test('runner-coordination-orgPolicy-shape: malformed policy -> check fail -> fixer reset về ["accepted"]', () => {
  const cwd = mkTempDir();
  const configPath = path.join(cwd, '.fgos', 'config.json');
  writeProjectConfig(cwd, { runner: { coordination: { orgPolicy: { dischargeOn: null } } } });
  
  const res = checkPolicy(cwd);
  assert.equal(res.passed, false);
  assert.match(res.message, /must be an array of non-empty strings/);
  
  const fixRes = fixPolicy(cwd);
  assert.equal(fixRes.changed, true);
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  assert.deepEqual(config.runner.coordination.orgPolicy.dischargeOn, ['accepted']);
});
