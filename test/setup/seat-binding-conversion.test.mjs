// The pure conversion of a project's runner config from "rigor picks the tier" to "the config declares
// the tier". The fixtures are copies of the real forgentX project runner section and of the real global
// runner section (machine inventory and executor definitions left out), so the conversion is proved on
// the shapes it will meet, with the global layer still carrying rigorToTier and the bare verbs.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { convertRunnerConfig } from '../../src/setup/seat-binding-conversion.mjs';
import { MODEL_POLICY_TIERS, ensureRunnerConfigForDir, loadRunnerConfigFromDir } from '../../src/runner/dispatch/config.mjs';
import { discoverWorkflows } from '../../src/workflow/loader.mjs';

const readFixture = (name) => JSON.parse(fs.readFileSync(new URL(`../fixtures/seat-binding-config/${name}.json`, import.meta.url), 'utf8')).runner;
const forgentx = () => readFixture('forgentx-runner');
const globalRunner = () => readFixture('global-runner');

// The ladder fgos setup writes as $comment; its one source is a later change, so the tests pass a stand-in.
const LADDER = [
  'nano: mechanical, no reasoning',
  'mini: light reasoning on given input',
  'standard: follow an existing plan',
  'advanced: find the way without an answer given',
  'flagship: judgment, design, critique',
  'frontier: the costliest decision',
];

const workflows = [...discoverWorkflows({ packageRoot: process.cwd() }).values()];
const registeredCapabilities = [...new Set(workflows.flatMap((workflow) => workflow.steps.flatMap((step) => step.units.map((unit) => (unit.template ?? unit).capability))).filter(Boolean))];
const convert = (runner, extra = {}) => convertRunnerConfig(runner, { globalRunner: globalRunner(), registeredCapabilities, ladder: LADDER, workflows, ...extra });

// A project with no capability rigor, shaped like the mdview and mcp-skill-hub configs.
const plainProject = () => ({
  executor: { command: 'claude', args: ['{prompt}'] },
  timeoutMs: 5000,
  modelPolicies: { claude: { nano: 'haiku', standard: 'sonnet', advanced: 'sonnet', flagship: 'opus', frontier: 'opus' } },
  rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
  patterns: { defaultRule: { mutatingMinRigor: 'standard' } },
  capabilities: { 'architecture:synthesize': { description: 'synthesis' } },
});

function withHome(homeRunner, fn) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-conversion-home-'));
  fs.mkdirSync(path.join(home, '.fgos'), { recursive: true });
  if (homeRunner) fs.writeFileSync(path.join(home, '.fgos', 'config.json'), JSON.stringify({ runner: homeRunner }));
  const prevHome = process.env.HOME;
  const prevUserProfile = process.env.USERPROFILE;
  const prevWrite = process.stderr.write;
  process.env.HOME = home;
  process.env.USERPROFILE = home;
  process.stderr.write = () => true;
  try {
    return fn();
  } finally {
    process.stderr.write = prevWrite;
    process.env.HOME = prevHome;
    if (prevUserProfile !== undefined) process.env.USERPROFILE = prevUserProfile;
    else delete process.env.USERPROFILE;
  }
}

function writeProject(runner) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-conversion-project-'));
  fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.fgos', 'config.json'), `${JSON.stringify({ runner }, null, 2)}\n`);
  return dir;
}

const without = (object, keys) => Object.fromEntries(Object.entries(object).filter(([key]) => !keys.includes(key)));
const changedPaths = (result) => result.changes.map((change) => change.path);

test('the forgentX config converts: the standard tier, the capability tiers and ceilings, mini, the ladder and the marker', () => {
  const before = forgentx();
  const result = convert(before);
  const { runner } = result;
  assert.equal(runner.rigorToTier, undefined);
  assert.deepEqual(runner.defaults, { tier: 'standard' });
  // Capability rigor high is the global ceiling's own tier; critical is above it and carries its own ceiling.
  assert.equal(runner.capabilities['architecture:frame'].tier, 'flagship');
  assert.equal(runner.capabilities['architecture:frame'].maxTier, undefined);
  assert.equal(runner.capabilities['architecture:critique'].tier, 'flagship');
  for (const name of ['architecture:shape', 'architecture:synthesize', 'architecture:explain']) {
    assert.equal(runner.capabilities[name].tier, 'frontier', name);
    assert.equal(runner.capabilities[name].maxTier, 'frontier', name);
  }
  assert.equal(runner.maxTier, 'flagship');
  assert.deepEqual(runner.tierFallback.mini, before.tierFallback.nano);
  assert.deepEqual(runner.$comment, LADDER);
  assert.deepEqual(runner.patterns.seatBinding, { schema: 1 });
  // Capability rigor stays: it still sets the number of checkers.
  assert.equal(runner.capabilities['architecture:synthesize'].rigor, 'critical');
  // Nothing else moved.
  const expected = structuredClone(before);
  delete expected.rigorToTier;
  assert.deepEqual(
    without(runner, ['defaults', '$comment', 'capabilities', 'tierFallback', 'patterns']),
    without(expected, ['defaults', '$comment', 'capabilities', 'tierFallback', 'patterns']),
  );
  assert.deepEqual(without(runner.tierFallback, ['mini']), expected.tierFallback);
  assert.deepEqual(without(runner.patterns, ['seatBinding']), expected.patterns);
});

test('the ladder lands next to modelPolicies, tierFallback and maxTier as one runner-level $comment', () => {
  const keys = Object.keys(convert(forgentx()).runner);
  assert.equal(keys.indexOf('$comment') + 1, keys.indexOf('modelPolicies'));
  assert.ok(keys.includes('tierFallback') && keys.includes('maxTier'));
});

test('converting a converted config changes nothing and reports nothing', () => {
  const once = convert(forgentx());
  const twice = convert(once.runner);
  assert.deepEqual(twice.changes, []);
  assert.deepEqual(twice.reports, []);
  assert.deepEqual(twice.runner, once.runner);
});

test('the conversion is deterministic and leaves its input alone', () => {
  const input = forgentx();
  const pristine = structuredClone(input);
  const first = convert(input);
  assert.deepEqual(input, pristine);
  assert.deepEqual(convert(forgentx()), first);
});

test('a project with no capability rigor converts to a default tier and the marker, and a unit rigor of high stops raising its tier', () => {
  const result = convert(plainProject());
  assert.deepEqual(changedPaths(result), ['runner.defaults.tier', 'runner.rigorToTier', 'runner.$comment', 'runner.patterns.seatBinding.schema']);
  assert.equal(result.runner.capabilities['architecture:synthesize'].tier, undefined);
  assert.equal(result.runner.tierFallback, undefined);
  const raised = result.reports.filter((report) => report.kind === 'unit-rigor-no-longer-sets-tier');
  assert.deepEqual(raised.map((r) => `${r.workflow}/${r.unit}`).sort(), ['architecture-advisory-reopen/synthesize-recommendation', 'architecture-advisory/synthesize-recommendation']);
  for (const report of raised) assert.deepEqual([report.rigor, report.was, report.now], ['high', 'flagship', 'standard']);
});

test('every guide rigor floor and every capability a --rigor used to raise is listed, so the printed diff shows what changes', () => {
  const { reports } = convert(plainProject());
  const floors = reports.filter((report) => report.kind === 'guide-rigor-floor');
  assert.equal(floors.length, workflows.filter((workflow) => workflow.guide?.frameDefaults?.rigorFloor !== undefined).length);
  assert.ok(floors.every((floor) => floor.detail.includes('never set a tier')));
  const run = reports.filter((report) => report.kind === 'run-rigor-no-longer-sets-tier');
  const listed = run.flatMap((report) => report.capabilities);
  for (const capability of registeredCapabilities) assert.ok(listed.includes(capability), capability);
  assert.deepEqual(run[0].byRigor.high, { was: 'flagship', now: 'standard' });
});

test('the global layer supplies the rigor table when the project has none, and the project table wins when it has one', () => {
  const fromGlobal = convert(without(plainProject(), ['rigorToTier']), { globalRunner: { rigorToTier: { low: 'nano', standard: 'advanced', high: 'flagship', critical: 'frontier' } } });
  assert.equal(fromGlobal.runner.defaults.tier, 'advanced');
  assert.deepEqual(changedPaths(fromGlobal), ['runner.defaults.tier', 'runner.$comment', 'runner.patterns.seatBinding.schema']);
  const fromProject = convert({ ...plainProject(), rigorToTier: { low: 'nano', standard: 'mini', high: 'flagship', critical: 'frontier' } }, { globalRunner: { rigorToTier: { standard: 'advanced' } } });
  assert.equal(fromProject.runner.defaults.tier, 'mini');
});

test('the conversion runs again when rigorToTier reappears, and then only removes it', () => {
  const converted = convert(forgentx()).runner;
  // A fill-missing writer puts the default table back into the project file.
  const reappeared = { ...converted, rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' } };
  const again = convert(reappeared);
  assert.deepEqual(changedPaths(again), ['runner.rigorToTier']);
  assert.deepEqual(again.runner, converted);
});

test('the real fill-missing writer never puts rigorToTier back into a converted file, so the conversion has nothing left to do', () => {
  const converted = convert(forgentx()).runner;
  const dir = writeProject(converted);
  withHome(globalRunner(), () => ensureRunnerConfigForDir(dir));
  const rewritten = JSON.parse(fs.readFileSync(path.join(dir, '.fgos', 'config.json'), 'utf8')).runner;
  assert.equal(rewritten.rigorToTier, undefined);
  assert.equal(rewritten.patterns.seatBinding.schema, 1);
  assert.deepEqual(changedPaths(convert(rewritten)), [], 'converting what the writer left is a no-op');
});

test('the marker alone does not make a config converted, and a config without the marker is converted even with no rigorToTier', () => {
  const marked = { ...plainProject(), patterns: { seatBinding: { schema: 1 } } };
  assert.deepEqual(changedPaths(convert(marked)), ['runner.defaults.tier', 'runner.rigorToTier', 'runner.$comment']);
  const unmarked = convert(without(plainProject(), ['rigorToTier']));
  assert.deepEqual(changedPaths(unmarked), ['runner.defaults.tier', 'runner.$comment', 'runner.patterns.seatBinding.schema']);
});

test('a key the project already declares is never overwritten', () => {
  const project = plainProject();
  project.defaults = { tier: 'advanced' };
  project.maxTier = 'standard';
  project.capabilities['architecture:synthesize'] = { rigor: 'critical', tier: 'flagship' };
  const { runner } = convert(project);
  assert.equal(runner.defaults.tier, 'advanced');
  assert.equal(runner.capabilities['architecture:synthesize'].tier, 'flagship');
  // The capability's tier is flagship, above the ceiling standard, so the ceiling it needs is flagship, not the rigor's frontier.
  assert.equal(runner.capabilities['architecture:synthesize'].maxTier, 'flagship');
});

test('mini copies nano, else standard, is recorded, and is left alone when it exists or nothing can be copied', () => {
  const fallback = (tierFallback) => convert({ ...plainProject(), tierFallback });
  assert.deepEqual(fallback({ nano: ['a'], standard: ['b'] }).runner.tierFallback.mini, ['a']);
  const fromStandard = fallback({ standard: ['b'], flagship: ['c'] });
  assert.deepEqual(fromStandard.runner.tierFallback.mini, ['b']);
  assert.ok(changedPaths(fromStandard).includes('runner.tierFallback.mini'));
  assert.deepEqual(fallback({ nano: ['a'], mini: ['z'] }).runner.tierFallback.mini, ['z']);
  const none = fallback({ flagship: ['c'] });
  assert.equal(none.runner.tierFallback.mini, undefined);
  assert.ok(none.reports.some((report) => report.kind === 'tier-fallback-mini-unset'));
  // The copy is a copy: changing one list does not change the other.
  const copied = fallback({ nano: ['a'] }).runner.tierFallback;
  copied.mini.push('x');
  assert.deepEqual(copied.nano, ['a']);
});

test('a bare verb hands only its confinement to the prefixed capabilities that relied on it; every other key is reported', () => {
  const project = plainProject();
  project.capabilities = {
    audit: {
      description: 'bare audit',
      serves: { mutates: false },
      confinement: { mode: 'required', policy: 'host-write-denied' },
      prefer: ['claude'],
      rigor: 'high',
      persona: 'code-reviewer',
      minCheckers: ['reviewer'],
    },
    'docs:review': { description: 'has its own entry and its own prefer', prefer: ['claude'] },
  };
  const result = convertRunnerConfig(project, { globalRunner: {}, registeredCapabilities: ['code:audit', 'docs:audit', 'docs:review'], ladder: LADDER });
  assert.deepEqual(result.runner.capabilities['code:audit'], { confinement: { mode: 'required', policy: 'host-write-denied' } });
  assert.deepEqual(result.runner.capabilities['docs:audit'], { confinement: { mode: 'required', policy: 'host-write-denied' } });
  // The bare entry itself is a capability named audit: its own rigor becomes its own tier.
  assert.deepEqual(result.runner.capabilities.audit, { ...project.capabilities.audit, tier: 'flagship' });
  assert.equal(result.runner.capabilities['docs:review'].confinement, undefined);
  const notCopied = result.reports.filter((report) => report.kind === 'bare-verb-keys-not-copied');
  assert.deepEqual(notCopied.map((report) => report.capability), ['code:audit', 'docs:audit']);
  for (const report of notCopied) assert.deepEqual(report.keys, ['prefer', 'rigor', 'persona', 'minCheckers']);
  // The copy is a copy.
  result.runner.capabilities['code:audit'].confinement.mode = 'preferred';
  assert.equal(project.capabilities.audit.confinement.mode, 'required');
});

test('a global bare verb that carries only setup defaults hands its confinement over and nothing else, and the global file stays as it is', () => {
  const global = globalRunner();
  const pristine = structuredClone(global);
  const { runner, reports } = convertRunnerConfig(plainProject(), { globalRunner: global, registeredCapabilities: ['docs:review', 'coding:advise'], ladder: LADDER });
  assert.deepEqual(runner.capabilities['docs:review'], { confinement: global.capabilities.review.confinement });
  assert.deepEqual(runner.capabilities['coding:advise'], { confinement: global.capabilities.advise.confinement });
  assert.equal(reports.filter((report) => report.kind === 'bare-verb-keys-not-copied').length, 0);
  assert.deepEqual(global, pristine);
  assert.equal(runner.capabilities.review, undefined);
});

test('a prefixed entry that lacks a usable prefer while its bare verb has one is reported, never merged', () => {
  const project = plainProject();
  project.capabilities = { audit: { prefer: ['claude'] }, 'code:audit': { description: 'no prefer of its own' } };
  const result = convertRunnerConfig(project, { globalRunner: {}, registeredCapabilities: ['code:audit'], ladder: LADDER });
  assert.deepEqual(result.reports.filter((report) => report.kind === 'bare-verb-prefer-no-longer-inherited'), [{ kind: 'bare-verb-prefer-no-longer-inherited', capability: 'code:audit', bareVerb: 'audit' }]);
  assert.equal(result.runner.capabilities['code:audit'].prefer, undefined);
});

test('the conversion refuses to run without the ladder', () => {
  for (const ladder of [undefined, '', [], [3]]) {
    assert.throws(() => convertRunnerConfig(plainProject(), { ladder }), /ladder/);
  }
});

test('the converted forgentX config loads through the real loader with the real global layer still carrying rigorToTier and the bare verbs', () => {
  const converted = convert(forgentx()).runner;
  const dir = writeProject(converted);
  const cfg = withHome(globalRunner(), () => loadRunnerConfigFromDir(dir));
  assert.equal(cfg.defaults.tier, 'standard');
  assert.equal(cfg.patterns.seatBinding.schema, 1);
  assert.equal(JSON.stringify(cfg).includes('$comment'), false);
  assert.equal(cfg.capabilities['architecture:synthesize'].tier, 'frontier');
  // The global bare verbs are still there as exact keys.
  assert.ok(cfg.capabilities.review.confinement);
});

test('the converted minimal project loads through the real loader too', () => {
  const converted = convert(plainProject()).runner;
  const dir = writeProject({ ...converted, executors: { claude: { kind: 'agent', providerModel: 'claude', command: 'claude', args: ['{prompt}'], invocations: [{ id: 'claude-cli', via: 'cli', adapter: 'cli-spawn', command: 'claude', args: ['{prompt}'], confinement: { backend: 'bwrap' } }] } } });
  const cfg = withHome(globalRunner(), () => loadRunnerConfigFromDir(dir));
  assert.equal(cfg.defaults.tier, 'standard');
});

// ---- the converted tier equals what the seat ran at before --------------------------------------

// What the seat ran at before the rigor table was retired, as a reference oracle: the tier of the stronger
// of the unit rigor (standard here) and the capability's own rigor, under the global ceiling, which the
// capability's own rigor tier raises when that tier is higher. The converted side is the declared tier:
// the capability's tier, else the default, under the capability's ceiling, else the global one.
const TABLE = { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' };
const RIGOR_ORDER = ['low', 'standard', 'high', 'critical'];
function tierBefore(runner, capability) {
  const table = { ...TABLE, ...runner.rigorToTier };
  const capRigor = runner.capabilities[capability].rigor;
  const rigor = capRigor && RIGOR_ORDER.indexOf(capRigor) > RIGOR_ORDER.indexOf('standard') ? capRigor : 'standard';
  const tier = table[rigor];
  const capTier = capRigor ? table[capRigor] : undefined;
  const above = (a, b) => MODEL_POLICY_TIERS.indexOf(a) > MODEL_POLICY_TIERS.indexOf(b);
  const ceiling = runner.maxTier && capTier && above(capTier, runner.maxTier) ? capTier : runner.maxTier;
  return { tier: ceiling && above(tier, ceiling) ? ceiling : tier, ceiling };
}

function tierConverted(runner, capability) {
  const entry = runner.capabilities[capability];
  const tier = entry?.tier ?? runner.defaults.tier;
  const ceiling = entry?.maxTier ?? runner.maxTier;
  return { tier: ceiling && MODEL_POLICY_TIERS.indexOf(tier) > MODEL_POLICY_TIERS.indexOf(ceiling) ? ceiling : tier, ceiling };
}

test('for every capability of the forgentX config the converted tier and ceiling equal the seat tier the rigor table gave at a unit rigor of standard', () => {
  const original = forgentx();
  const converted = convert(original).runner;
  const names = Object.keys(original.capabilities);
  assert.ok(names.length >= 30);
  for (const name of names) {
    const before = tierBefore(original, name);
    const after = tierConverted(converted, name);
    assert.deepEqual(after, before, `${name}: before ${JSON.stringify(before)}, converted ${JSON.stringify(after)}`);
  }
});
