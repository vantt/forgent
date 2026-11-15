// `fgctl uninstall` against a real release: the project's own shim runs the release's host, whose `fgos uninstall`
// answer is the one `fgctl` reads (`changes`, `keeps`, `leftToYou`, `backups`, `failed`). The fake-shim cases in
// apps/fgctl/tests/uninstall_surface.rs replay answers of that host; this is the one place the two meet.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { useReleaseFixture, fixture, runFgctl, removeStateHome } from './fgctl-init-fixture.mjs';

useReleaseFixture();

const GOLDENS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'apps', 'fgctl', 'tests', 'goldens');
const golden = (name) => JSON.parse(fs.readFileSync(path.join(GOLDENS, name), 'utf8')).data;
/** Each key of an answer and what kind of value it holds: the shape `fgctl` parses. */
const shapeOf = (data) => Object.fromEntries(Object.entries(data).map(([key, value]) => [key, Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value]));

test('fgctl uninstall reverses the wiring through the shim of a real release and then removes the activation', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-uninstall-home-'));
  const state = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-uninstall-state-'));
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-uninstall-proj-'));
  try {
    execFileSync('git', ['init'], { cwd: project });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: project });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: project });
    const opts = { cwd: project, stateHome: state, env: { HOME: home } };
    const init = runFgctl(['init', '--from', fixture.releaseDir], opts);
    assert.equal(init.status, 0, init.stderr);
    const settings = path.join(project, '.claude', 'settings.json');
    assert.match(fs.readFileSync(settings, 'utf8'), /hook dispatch-decide/, 'the install wired the hook the reversal takes out');

    // The recorded answers the fgctl fake-shim cases replay still have the shape this host prints.
    const live = spawnSync(path.join(project, '.fgos', 'installation', 'bin', 'fgos'), ['uninstall'], {
      cwd: project,
      env: { ...process.env, FGOS_STATE_HOME: state, HOME: home, FGOS_ACTIVE_RELEASE_PATH: '', FGOS_ACTIVE_MANIFEST_PATH: '' },
      encoding: 'utf8',
    });
    const liveData = JSON.parse(live.stdout).data;
    assert.deepEqual(shapeOf(golden('uninstall-answer-plan.json')), shapeOf(liveData), 'goldens/uninstall-answer-plan.json is stale: record it again from this host');
    const failedGolden = golden('uninstall-answer-failed.json');
    assert.deepEqual(Object.keys(failedGolden.failed[0]).sort(), ['error', 'id']);
    assert.equal(failedGolden.skills, null, 'the failed-backup answer is the short one');
    assert.deepEqual(Object.keys(golden('uninstall-answer-plan.json').hooks[0]).sort(), Object.keys(liveData.hooks[0]).sort());

    const plan = runFgctl(['uninstall'], opts);
    assert.equal(plan.status, 0, plan.stderr);
    assert.match(plan.stdout, /settings\.json: remove the fgOS hook dispatch-decide/);
    assert.match(plan.stdout, /Keeps:/);
    assert.ok(fs.existsSync(path.join(project, '.fgos', 'installation', 'activation.json')), 'a plan removes nothing');

    const applied = runFgctl(['uninstall', '--yes'], opts);
    assert.equal(applied.status, 0, applied.stderr);
    assert.doesNotMatch(fs.readFileSync(settings, 'utf8'), /hook dispatch-decide/);
    const left = fs.readdirSync(path.dirname(settings));
    assert.ok(left.some((name) => name.startsWith('settings.json.pre-uninstall-')), `the file was copied first: ${left}`);
    assert.equal(fs.existsSync(path.join(project, '.fgos', 'installation')), false, 'the activation goes after the reversal');
    assert.ok(fs.existsSync(path.join(project, '.fgos', 'distribution.json')), 'the committed pin stays');
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
    removeStateHome(state);
    fs.rmSync(project, { recursive: true, force: true });
  }
});
