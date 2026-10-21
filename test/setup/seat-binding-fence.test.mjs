// The fence: a project config converted to the seat-binding schema must never bind under a release from
// before it. The old release is a real extraction of the main-branch source from before the wave (pinned
// by commit), loaded in a child process with a throwaway HOME whose global file is real-shaped, so it still
// carries rigorToTier and the bare verbs, as the owner's global file does.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

import { convertRunnerConfig, ladderCommentLines, registeredCapabilitiesOf } from '../../src/setup/seat-binding-conversion.mjs';
import { createSeatBindingClient } from '../../src/seat-binding/client.mjs';
import { DOCTOR_CHECKS } from '../../src/setup/checks.mjs';
import { discoverWorkflows } from '../../src/workflow/loader.mjs';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const BIN = path.join(REPO_ROOT, 'bin', 'fgos.mjs');
/** The last main-branch commit the wave's work does not touch: its release is the one the fence protects against. */
const PRE_SEAT_BINDING_COMMIT = '105c73726';

const fixture = (name) => JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'test', 'fixtures', 'seat-binding-config', `${name}.json`), 'utf8')).runner;
const workflows = [...discoverWorkflows({ packageRoot: REPO_ROOT }).values()];
const ladder = () => ladderCommentLines(createSeatBindingClient().tierLadder().definitions);
const convert = (runner) => convertRunnerConfig(runner, { globalRunner: fixture('global-runner'), registeredCapabilities: registeredCapabilitiesOf(workflows), ladder: ladder(), workflows });

// The shapes of the three workspaces the wave lands on. mdview and mcp-skill-hub declare no capability rigor.
const SHAPES = {
  'forgentX-like': () => fixture('forgentx-runner'),
  'mdview-like (no capability rigor)': () => ({
    executor: { command: 'claude', args: ['{prompt}'] },
    timeoutMs: 5000,
    modelPolicies: { claude: { nano: 'haiku', standard: 'sonnet', advanced: 'sonnet', flagship: 'opus', frontier: 'opus' } },
    rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
    patterns: { defaultRule: { mutatingMinRigor: 'standard' } },
    capabilities: { 'group-cognition:explore': { description: 'explore' } },
  }),
  'mcp-skill-hub-like (no prefer anywhere)': () => ({
    executor: { command: 'claude', args: ['{prompt}'] },
    timeoutMs: 5000,
    modelPolicies: { claude: { nano: 'haiku', standard: 'sonnet', advanced: 'sonnet', flagship: 'opus', frontier: 'opus' } },
    rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
    patterns: { defaultRule: { mutatingMinRigor: 'standard' } },
    capabilities: { 'architecture:synthesize': { description: 'synthesis' } },
  }),
};

let oldRelease = null;
function extractOldRelease() {
  if (oldRelease) return oldRelease;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-pre-seat-binding-'));
  const archive = execFileSync('git', ['archive', PRE_SEAT_BINDING_COMMIT, 'src', 'package.json'], { cwd: REPO_ROOT, maxBuffer: 64 * 1024 * 1024 });
  const untar = spawnSync('tar', ['-x', '-C', dir], { input: archive });
  assert.equal(untar.status, 0, String(untar.stderr));
  fs.symlinkSync(path.join(REPO_ROOT, 'node_modules'), path.join(dir, 'node_modules'));
  oldRelease = dir;
  return dir;
}

/** The old release's own loader, run in a child: what it threw, and every key its fill-missing writer added. */
function loadWithOldRelease(projectDir, home, entry) {
  const configUrl = new URL(`file://${path.join(extractOldRelease(), 'src', 'runner', 'dispatch', 'config.mjs')}`).href;
  const script = `
    const m = await import(${JSON.stringify(configUrl)});
    let threw = null; let loaded = false;
    try { m[${JSON.stringify(entry)}](${JSON.stringify(projectDir)}); loaded = true; } catch (err) { threw = err.message; }
    console.log(JSON.stringify({ loaded, threw }));
    const paths = (object, prefix = '') => Object.entries(object).flatMap(([key, value]) => [prefix + key, ...(value && typeof value === 'object' && !Array.isArray(value) ? paths(value, prefix + key + '.') : [])]);
    globalThis.process.stderr.write('\\nDEFAULT_PATHS ' + JSON.stringify(paths(m.DEFAULT_RUNNER_CONFIG)) + '\\n');
  `;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    env: { ...process.env, HOME: home, USERPROFILE: home },
    encoding: 'utf8',
  });
  const answer = JSON.parse(result.stdout.trim().split('\n').pop());
  const added = /added missing default config keys to [^:]+: ([^\n]+)/.exec(result.stderr)?.[1]?.split(', ') ?? [];
  const defaults = JSON.parse(/DEFAULT_PATHS (.+)/.exec(result.stderr)[1]);
  return { ...answer, added, defaults };
}

function homeWithRealGlobal() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-fence-home-'));
  fs.mkdirSync(path.join(home, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(home, '.fgos', 'config.json'), `${JSON.stringify({ runner: fixture('global-runner') }, null, 2)}\n`);
  return home;
}

function projectWith(runner) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-fence-project-'));
  fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.fgos', 'config.json'), `${JSON.stringify({ runner }, null, 2)}\n`);
  return dir;
}

const configOf = (dir) => path.join(dir, '.fgos', 'config.json');

/** Every value of `expected` is in `actual`, at any depth; `actual` may have more keys. */
function assertContains(actual, expected, where = 'runner') {
  if (expected !== null && typeof expected === 'object' && !Array.isArray(expected)) {
    for (const [key, value] of Object.entries(expected)) assertContains(actual?.[key], value, `${where}.${key}`);
  } else {
    assert.deepEqual(actual, expected, where);
  }
}

function removePath(object, dotted) {
  const keys = dotted.split('.');
  const last = keys.pop();
  const parent = keys.reduce((value, key) => value?.[key], object);
  if (parent) delete parent[last];
}

function newSetup(dir, home) {
  const env = { ...process.env, HOME: home, USERPROFILE: home, FGOS_SESSION_ID: 'seat-binding-fence-test', FGOS_CLAUDE_COMMAND: '/nonexistent/fgos-test-claude-binary' };
  const result = spawnSync(process.execPath, [BIN, 'setup'], { cwd: dir, env, encoding: 'utf8' });
  assert.equal(result.status, 0, `setup failed: ${result.stderr}`);
  return JSON.parse(result.stdout).data;
}

for (const [shape, project] of Object.entries(SHAPES)) {
  test(`a release from before the wave refuses the converted ${shape} config and never binds; new setup then ends green`, () => {
    // The global file as the new setup leaves it, with rigorToTier still in it.
    const home = homeWithRealGlobal();
    newSetup(projectWith({}), home);
    assert.ok(JSON.parse(fs.readFileSync(path.join(home, '.fgos', 'config.json'), 'utf8')).runner.rigorToTier, 'the global file still carries rigorToTier');

    // The old release still loads the global layer with a project in the old shape.
    assert.equal(loadWithOldRelease(projectWith(project()), home, 'loadRunnerConfigFromDir').loaded, true);

    const converted = convert(project()).runner;
    const dir = projectWith(converted);
    const before = fs.readFileSync(configOf(dir));

    // A plain load refuses and leaves the file as it was.
    const loaded = loadWithOldRelease(dir, home, 'loadRunnerConfigFromDir');
    assert.equal(loaded.loaded, false);
    assert.match(loaded.threw, /unknown key|not allowed|Allowed keys/);
    assert.deepEqual(fs.readFileSync(configOf(dir)), before);

    // Its fill-missing writer adds default keys before it validates, and still refuses afterwards.
    const ensured = loadWithOldRelease(dir, home, 'ensureRunnerConfigForDir');
    assert.equal(ensured.loaded, false);
    assert.ok(ensured.threw);
    const after = JSON.parse(fs.readFileSync(configOf(dir), 'utf8')).runner;
    assert.ok(ensured.added.includes('rigorToTier'));
    assert.ok(ensured.added.every((key) => ensured.defaults.includes(key)), `only default keys are added: ${ensured.added}`);
    const withoutAdded = structuredClone(after);
    for (const key of ensured.added) removePath(withoutAdded, key);
    assert.deepEqual(withoutAdded, converted, 'everything else in the file is as it was');

    // The new release converts what the old one left: it only removes the retired key, whatever else the old
    // writer filled in, and its own fill-missing pass then adds nothing the conversion has to undo.
    assert.deepEqual(convert(after).changes.map((change) => change.path), ['runner.rigorToTier']);
    const data = newSetup(dir, home);
    assert.equal(data.seatBindingConversion.status, 'converted');
    const final = JSON.parse(fs.readFileSync(configOf(dir), 'utf8')).runner;
    assert.equal(final.rigorToTier, undefined);
    assertContains(final, converted);
    assert.equal(DOCTOR_CHECKS.find((check) => check.id === 'seat-binding-config').check(dir).passed, true);
    assert.deepEqual(newSetup(dir, home).seatBindingConversion.status, 'unchanged');
  });

  test(`the schema marker alone is enough to fence the ${shape} config from a release before the wave`, () => {
    const home = homeWithRealGlobal();
    const dir = projectWith({ ...project(), patterns: { ...project().patterns, seatBinding: { schema: 1 } } });
    const loaded = loadWithOldRelease(dir, home, 'loadRunnerConfigFromDir');
    assert.equal(loaded.loaded, false);
    assert.match(loaded.threw, /unknown key "seatBinding"/);
  });
}
