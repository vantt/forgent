import test from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { DOCTOR_CHECKS, FIX_REGISTRATIONS } from '../../src/setup/registrations.mjs';

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
  fs.writeFileSync(configPath, JSON.stringify({ runner: { coordination: { orgPolicy: { dischargeOn: ['accepted', 'rejected'] } } } }));
  
  const res = checkPolicy(cwd);
  assert.equal(res.passed, true);
  
  const fixRes = fixPolicy(cwd);
  assert.equal(fixRes.changed, false);
});

test('runner-coordination-orgPolicy-shape: malformed policy -> check fail -> fixer reset về ["accepted"]', () => {
  const cwd = mkTempDir();
  const configPath = path.join(cwd, '.fgos', 'config.json');
  fs.writeFileSync(configPath, JSON.stringify({ runner: { coordination: { orgPolicy: { dischargeOn: null } } } }));
  
  const res = checkPolicy(cwd);
  assert.equal(res.passed, false);
  assert.match(res.message, /must be an array of non-empty strings/);
  
  const fixRes = fixPolicy(cwd);
  assert.equal(fixRes.changed, true);
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  assert.deepEqual(config.runner.coordination.orgPolicy.dischargeOn, ['accepted']);
});

const checkClaims = DOCTOR_CHECKS.find(c => c.id === 'coordination-abandoned-claims').check;
const fixClaims = FIX_REGISTRATIONS.find(c => c.id === 'coordination-abandoned-claims').fix;

function processStartFingerprint(pid) {
  try {
    return fs.statSync('/proc/' + pid).mtimeMs;
  } catch {
    return undefined;
  }
}

test('coordination-abandoned-claims: live claim không bị xóa', () => {
  const cwd = mkTempDir();
  const sessionsDir = path.join(cwd, '.fgos', 'coordination', 'sessions');
  fs.mkdirSync(sessionsDir, { recursive: true });
  
  const liveClaimDir = path.join(sessionsDir, 'live.claim');
  fs.mkdirSync(liveClaimDir);
  
  const processStartTime = processStartFingerprint(process.pid);
  fs.writeFileSync(path.join(liveClaimDir, 'claim.json'), JSON.stringify({ pid: process.pid, ...(processStartTime === undefined ? {} : { processStartTime }), token: '123' }));
  
  const res = checkClaims(cwd);
  assert.equal(res.passed, true);
  
  const fixRes = fixClaims(cwd);
  assert.equal(fixRes.changed, false);
  
  assert.equal(fs.existsSync(liveClaimDir), true);
});

test('coordination-abandoned-claims: dead claim bị xóa', () => {
  const cwd = mkTempDir();
  const sessionsDir = path.join(cwd, '.fgos', 'coordination', 'sessions');
  fs.mkdirSync(sessionsDir, { recursive: true });
  
  const deadClaimDir = path.join(sessionsDir, 'dead.claim');
  fs.mkdirSync(deadClaimDir);
  
  fs.writeFileSync(path.join(deadClaimDir, 'claim.json'), JSON.stringify({ pid: 999999, token: '123' })); // extremely unlikely to be a live pid
  
  const res = checkClaims(cwd);
  assert.equal(res.passed, false);
  assert.match(res.message, /demonstrably dead claims/);
  
  const fixRes = fixClaims(cwd);
  assert.equal(fixRes.changed, true);
  assert.equal(fs.existsSync(deadClaimDir), false);
});

test('coordination-abandoned-claims: unknown staging fail diagnostic nhưng không auto-delete', () => {
  const cwd = mkTempDir();
  const sessionsDir = path.join(cwd, '.fgos', 'coordination', 'sessions');
  fs.mkdirSync(sessionsDir, { recursive: true });
  
  const stagingDir = path.join(sessionsDir, '.staging-unknown');
  fs.mkdirSync(stagingDir);
  
  const past = new Date(Date.now() - 20 * 60 * 1000); // 20 mins ago
  fs.utimesSync(stagingDir, past, past);
  
  const res = checkClaims(cwd);
  assert.equal(res.passed, false);
  assert.match(res.message, /Leaving them intact/);
  
  const fixRes = fixClaims(cwd);
  assert.equal(fixRes.changed, false); // DOES NOT DELETE unknown staging
  assert.equal(fs.existsSync(stagingDir), true);
});
