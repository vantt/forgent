// fgos-gate-approve.test.mjs -- the `gate-approve` verb's CLI-level surface,
// plus `gate-check` (tsk-65q), the read-only wrapper around
// canAutoApprove/canAutoApproveMergedGate the Gate-section checks in
// fgos-coding-exploring/fgos-coding-validating now call instead of
// reimplementing their own cwd-relative module resolver.
// Bộ đồ nghề dùng chung nằm ở ./helpers/fgos-cli-harness.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addOk, eventLines, run, stateView, tmpCwd } from './helpers/fgos-cli-harness.mjs';

test('gate-approve rejects the retired "planApprove" gate name, exit 4 (validation), no event written (tsk-4vz)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'gate-approve-plan-retired');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['gate-approve', 'gate-approve-plan-retired', '--gate', 'planApprove', '--actor', 'human', '--verify', 'npm test']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /planApprove.*retired/);
  assert.equal(eventLines(cwd).length, before, 'no event should be written on a rejected gate name');
});

test('gate-approve still accepts "validateApprove", the live merged gate, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'gate-approve-validate-ok');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['gate-approve', 'gate-approve-validate-ok', '--gate', 'validateApprove', '--actor', 'bypass', '--verify', 'npm test']);
  assert.equal(result.status, 0);
  assert.equal(eventLines(cwd).length, before + 1);
  const view = stateView(cwd);
  assert.equal(view.gates['gate-approve-validate-ok'].validateApprove.actor, 'bypass');
});

test('gate-approve still accepts "contextApprove", the live exploring gate, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'gate-approve-context-ok');
  const result = run(cwd, ['gate-approve', 'gate-approve-context-ok', '--gate', 'contextApprove', '--actor', 'human', '--verify', 'npm test']);
  assert.equal(result.status, 0);
  const view = stateView(cwd);
  assert.equal(view.gates['gate-approve-context-ok'].contextApprove.actor, 'human');
});

// tsk-65q: `gate-check` wraps canAutoApprove/canAutoApproveMergedGate
// behind bin/fgos.mjs's own static relative imports, which resolve
// against the CLI file's own location, never the caller's cwd or repo
// root -- unlike the ad hoc dynamic-import resolver the Gate sections used
// to embed inline, which crashed unconditionally on a pure global npm
// install (no local src/state/*.mjs at cwd or at the calling repo's own
// root). `run()` already spawns the CLI by absolute path from a fresh
// mkdtemp() dir under os.tmpdir() -- a cwd that genuinely has no local
// checkout of src/state/*.mjs anywhere near it, the exact condition that
// crashed the old resolver. Every assertion below passing IS the
// regression proof: it only works if bin/fgos.mjs's own import of
// gate-bypass.mjs resolved correctly from that cwd.

test('gate-check --gate contextApprove: false at the default level "off" (no gate-bypass.json), no crash from a cwd with no local checkout (tsk-65q)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'gate-check-context-off');
  const artifactPath = path.join(cwd, 'CONTEXT.md');
  fs.writeFileSync(artifactPath, '## Outstanding questions\nNone\n');
  const result = run(cwd, ['gate-check', 'gate-check-context-off', '--gate', 'contextApprove', '--artifact', artifactPath]);
  assert.equal(result.status, 0);
  const data = JSON.parse(result.stdout).data;
  assert.equal(data.canAutoApprove, false);
});

test('gate-check --gate contextApprove: true once gate-bypass level covers the item\'s tier and the artifact has no open items (tsk-65q)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'gate-check-context-true');
  fs.writeFileSync(path.join(cwd, '.fgos', 'gate-bypass.json'), JSON.stringify({ level: 'standard' }));
  const artifactPath = path.join(cwd, 'CONTEXT.md');
  fs.writeFileSync(artifactPath, '## Outstanding questions\nNone\n');
  const result = run(cwd, ['gate-check', 'gate-check-context-true', '--gate', 'contextApprove', '--artifact', artifactPath]);
  assert.equal(result.status, 0);
  const data = JSON.parse(result.stdout).data;
  assert.equal(data.canAutoApprove, true);
});

test('gate-check --gate contextApprove: false when the artifact still has an open "## Outstanding questions" item, even at a covering level (tsk-65q)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'gate-check-context-open');
  fs.writeFileSync(path.join(cwd, '.fgos', 'gate-bypass.json'), JSON.stringify({ level: 'heavy' }));
  const artifactPath = path.join(cwd, 'CONTEXT.md');
  fs.writeFileSync(artifactPath, '## Outstanding questions\nWhich library?\n');
  const result = run(cwd, ['gate-check', 'gate-check-context-open', '--gate', 'contextApprove', '--artifact', artifactPath]);
  assert.equal(result.status, 0);
  const data = JSON.parse(result.stdout).data;
  assert.equal(data.canAutoApprove, false);
});

test('gate-check --gate validateApprove: true once gate-bypass level covers, plan has no open items, cost is REVERSIBLE, no crash from a cwd with no local checkout (tsk-65q)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'gate-check-validate-true');
  fs.writeFileSync(path.join(cwd, '.fgos', 'gate-bypass.json'), JSON.stringify({ level: 'standard' }));
  const planPath = path.join(cwd, 'plan.md');
  fs.writeFileSync(planPath, '## Outstanding questions\nNone\n');
  const result = run(cwd, ['gate-check', 'gate-check-validate-true', '--gate', 'validateApprove', '--plan', planPath, '--children', '[]', '--cost', 'REVERSIBLE']);
  assert.equal(result.status, 0);
  const data = JSON.parse(result.stdout).data;
  assert.equal(data.canAutoApprove, true);
});

test('gate-check --gate validateApprove: false when the cost verdict is not REVERSIBLE, even at a covering level (tsk-65q)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'gate-check-validate-cost');
  fs.writeFileSync(path.join(cwd, '.fgos', 'gate-bypass.json'), JSON.stringify({ level: 'heavy' }));
  const planPath = path.join(cwd, 'plan.md');
  fs.writeFileSync(planPath, '## Outstanding questions\nNone\n');
  const result = run(cwd, ['gate-check', 'gate-check-validate-cost', '--gate', 'validateApprove', '--plan', planPath, '--children', '[]', '--cost', 'EXPENSIVE']);
  assert.equal(result.status, 0);
  const data = JSON.parse(result.stdout).data;
  assert.equal(data.canAutoApprove, false);
});

test('gate-check rejects an unknown --gate value, exit 4 (validation) (tsk-65q)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'gate-check-bad-gate');
  const result = run(cwd, ['gate-check', 'gate-check-bad-gate', '--gate', 'planApprove']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /gate-check.*contextApprove.*validateApprove/);
});

test('gate-check requires an id, exit 4 (validation) (tsk-65q)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['gate-check', '--gate', 'contextApprove']);
  assert.equal(result.status, 4);
});
