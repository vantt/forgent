import '../../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { requestFromFlags, RunRequestError, buildRunRequest, foldRunSetting } from '../../../src/runner/execution/run-request.mjs';
import { resolveGitRoots } from '../../../src/runner/execution/run.mjs';
import { RunnerConfigError } from '../../../src/runner/dispatch/runner-config-error.mjs';
import { makeFixtureDir } from '../../helpers/fixture-dir.mjs';
import { activateGitFixture } from '../../helpers/git-fixture.mjs';
import { capabilityServedBy, writeProjectConfig } from '../../helpers/config-fixture.mjs';

test('requestFromFlags with neither flag returns empty scalars', () => {
  assert.deepEqual(requestFromFlags({}), { scalars: [] });
  assert.deepEqual(requestFromFlags(), { scalars: [] });
  assert.deepEqual(requestFromFlags({ params: undefined, param: undefined }), { scalars: [] });
});

test('requestFromFlags with only params returns parsed params and empty scalars', () => {
  const result = requestFromFlags({ params: '{"maxRounds": 3, "rebuttal": true}' });
  assert.deepEqual(result, {
    params: { maxRounds: 3, rebuttal: true },
    scalars: [],
  });
});

test('requestFromFlags with only param returns scalars with key and raw string', () => {
  const result = requestFromFlags({ param: 'maxRounds=2' });
  assert.deepEqual(result, {
    scalars: [{ key: 'maxRounds', raw: '2' }],
  });
  assert.equal(result.scalars[0].value, '2');
});

test('param splits on the first equals sign preserving later equals signs', () => {
  const result = requestFromFlags({ param: 'expr=a=b=c' });
  assert.deepEqual(result, {
    scalars: [{ key: 'expr', raw: 'a=b=c' }],
  });
});

test('scalars preserve raw string values without trimming or coercion', () => {
  const result = requestFromFlags({
    param: ['float=1.5', 'text=abc', 'spaced=  hello  '],
  });
  assert.deepEqual(result, {
    scalars: [
      { key: 'float', raw: '1.5' },
      { key: 'text', raw: 'abc' },
      { key: 'spaced', raw: '  hello  ' },
    ],
  });
});

test('empty param value is refused as param-invalid', () => {
  assert.throws(
    () => requestFromFlags({ param: 'maxRounds=' }),
    (err) => err instanceof RunRequestError && err.code === 'param-invalid',
  );
});

test('missing equals sign in param is refused as param-invalid', () => {
  assert.throws(
    () => requestFromFlags({ param: 'maxRounds' }),
    (err) => err instanceof RunRequestError && err.code === 'param-invalid',
  );
});

test('empty param key is refused as param-invalid', () => {
  assert.throws(
    () => requestFromFlags({ param: '=2' }),
    (err) => err instanceof RunRequestError && err.code === 'param-invalid',
  );
});

test('bare param flag without value is refused as param-invalid', () => {
  assert.throws(
    () => requestFromFlags({ param: true }),
    (err) => err instanceof RunRequestError && err.code === 'param-invalid',
  );
  assert.throws(
    () => requestFromFlags({ param: [true] }),
    (err) => err instanceof RunRequestError && err.code === 'param-invalid',
  );
});

test('non-string param value is refused as param-invalid', () => {
  assert.throws(
    () => requestFromFlags({ param: 123 }),
    (err) => err instanceof RunRequestError && err.code === 'param-invalid',
  );
});

test('params array is refused as param-invalid', () => {
  assert.throws(
    () => requestFromFlags({ params: '[1, 2, 3]' }),
    (err) => err instanceof RunRequestError && err.code === 'param-invalid',
  );
});

test('params primitive JSON values are refused as param-invalid', () => {
  for (const input of ['"string"', '123', 'true', 'false', 'null']) {
    assert.throws(
      () => requestFromFlags({ params: input }),
      (err) => err instanceof RunRequestError && err.code === 'param-invalid',
      `expected refusal for ${input}`,
    );
  }
});

test('params non-string flag is refused as param-invalid', () => {
  assert.throws(
    () => requestFromFlags({ params: true }),
    (err) => err instanceof RunRequestError && err.code === 'param-invalid',
  );
});

test('params with invalid JSON syntax is refused as param-invalid', () => {
  assert.throws(
    () => requestFromFlags({ params: '{malformed' }),
    (err) => err instanceof RunRequestError && err.code === 'param-invalid',
  );
});

test('repeated key in param is refused as param-request-conflict', () => {
  assert.throws(
    () => requestFromFlags({ param: ['maxRounds=1', 'maxRounds=2'] }),
    (err) => err instanceof RunRequestError && err.code === 'param-request-conflict',
  );
});

test('same key in both params and param is refused as param-request-conflict', () => {
  assert.throws(
    () => requestFromFlags({ params: '{"maxRounds": 1}', param: 'maxRounds=2' }),
    (err) => err instanceof RunRequestError && err.code === 'param-request-conflict',
  );
});

test('distinct keys across params and param are accepted and combined', () => {
  const result = requestFromFlags({
    params: '{"reviewer": "human"}',
    param: ['maxRounds=2', 'rebuttal=false'],
  });
  assert.deepEqual(result, {
    params: { reviewer: 'human' },
    scalars: [
      { key: 'maxRounds', raw: '2' },
      { key: 'rebuttal', raw: 'false' },
    ],
  });
});

// --- buildRunRequest: what `fgos run` refuses, and builds, before a unit run exists -----------------------------
// Real repositories and a real project config stand behind each case; the Workflow's case port is the one seam
// (the Execution Core never imports it), so a recorder stands in for it and shows what the request handed over.

function runRepo() {
  const root = makeFixtureDir('run-request-');
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: root });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root });
  activateGitFixture(root);
  fs.writeFileSync(path.join(root, 'README.md'), '# fixture\n');
  execFileSync('git', ['add', 'README.md'], { cwd: root });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: root });
  writeProjectConfig(root, {
    runner: {
      defaultExecutor: 'test-node',
      defaults: { tier: 'standard' },
      modelPolicies: { node: { standard: 'node-std' } },
      executors: { 'test-node': { kind: 'agent', description: 'Test agent', command: process.execPath, args: ['{prompt}'], providerModel: 'node', allowCrossProvider: true } },
      capabilities: { 'docs:write': capabilityServedBy('test-node', 'docs:write') },
      patterns: { seatBinding: { schema: 1 } },
    },
  });
  return root;
}

const seen = { ports: [], activities: [] };
const caseAdmission = {
  createPort: (options) => { seen.ports.push(options); return { port: options.repoRoot }; },
  activityUnitOf: (options) => { seen.activities.push(options); return { pattern: 'solo', params: {} }; },
};
const build = (root, flags, positional = [], at = root) => buildRunRequest({ dir: root, ...flags }, positional, { cwd: at, gitRoots: resolveGitRoots, caseAdmission });
const refusal = (root, flags, positional, pattern, at) => assert.throws(
  () => build(root, flags, positional, at),
  (err) => err instanceof RunnerConfigError && err.category === 'validation' && pattern.test(err.message),
  `${JSON.stringify(flags)} ${JSON.stringify(positional ?? [])} should be refused as ${pattern}`,
);

test('buildRunRequest refuses a call that names nothing to run, or more than one way to run it, or an unquoted prompt', () => {
  const root = runRepo();
  refusal(root, {}, [], /fgos run requires --unit <file\|-> or --resume <unitRunId>, a "<prompt>", or --sync <ref>/);
  refusal(root, { unit: 'x.yaml' }, ['Check it'], /either a "<prompt>", --unit or --resume/);
  refusal(root, { resume: 'unit-run-1' }, ['Check it'], /either a "<prompt>", --unit or --resume/);
  refusal(root, { capability: 'docs:write' }, ['fix', 'the', 'typo'], /quote the prompt/);
});

test('buildRunRequest refuses the flags that build a unit beside --unit or --resume, and --sync beside either', () => {
  const root = runRepo();
  for (const flag of ['provider', 'persona', 'writes', 'capability', 'rigor', 'input', 'verify']) {
    refusal(root, { unit: 'x.yaml', [flag]: 'v' }, [], new RegExp(`--${flag} only applies to fgos run "<prompt>"`));
  }
  refusal(root, { unit: 'x.yaml', sync: 'main' }, [], /--sync only applies to fgos run "<prompt>" or a bare --sync/);
  refusal(root, { resume: 'unit-run-1', sync: 'main' }, [], /--sync only applies/);
});

test('buildRunRequest refuses a --writes that is empty, that has no linked worktree to run in, or that names the main checkout as its worktree', () => {
  const root = runRepo();
  refusal(root, { capability: 'docs:write', writes: true }, ['Write notes'], /--writes needs at least one path/);
  refusal(root, { capability: 'docs:write', writes: 'notes.md' }, ['Write notes'], /--writes needs a linked worktree: create one with `git worktree add <path>` and pass --worktree <path>/);
  refusal(root, { capability: 'docs:write', writes: 'notes.md', worktree: root }, ['Write notes'], /--writes needs a linked worktree/);
});

test('buildRunRequest records the write scope of a prompt run from a linked worktree', () => {
  const root = runRepo();
  const wt = makeFixtureDir('run-request-wt-');
  fs.rmSync(wt, { recursive: true, force: true });
  execFileSync('git', ['worktree', 'add', '-q', '-b', 'wt', wt], { cwd: root, stdio: 'ignore' });
  const request = build(root, { capability: 'docs:write', writes: 'notes.md,docs/a.md' }, ['Write notes'], wt);
  assert.deepEqual(request.unitData.writes, ['notes.md', 'docs/a.md']);
  assert.equal(request.cwd, wt);
});

test('buildRunRequest refuses an unknown --provider naming the valid ones, and an unknown --persona', () => {
  const root = runRepo();
  refusal(root, { capability: 'docs:write', provider: 'test-node,nope' }, ['Check it'], /unknown --provider "nope"; valid providers: test-node/);
  refusal(root, { capability: 'docs:write', persona: 'no-such-voice' }, ['Check it'], /persona "no-such-voice" not found/);
});

test('buildRunRequest refuses --sync without --writes or a ref, an empty --input, and an empty --verify', () => {
  const root = runRepo();
  refusal(root, { sync: 'main', capability: 'docs:write' }, [], /--sync needs --writes/);
  refusal(root, { sync: true, writes: 'docs' }, [], /--sync requires a ref/);
  refusal(root, { capability: 'docs:write', input: true }, ['Check it'], /--input needs at least one repo-relative path/);
  refusal(root, { capability: 'docs:write', verify: true }, ['Check it'], /--verify requires a command/);
});

test('buildRunRequest builds the unit a prompt stands for: a bounded ascii id, its objective, capability, inputs and verify', () => {
  const root = runRepo();
  const { unitData } = build(root, { capability: 'docs:write', provider: 'test-node', rigor: 'high', input: 'README.md', verify: 'npm test' }, ['Write the release notes']);
  assert.match(unitData.id, /^adhoc-write-the-release-notes-[0-9a-f]{4}$/);
  assert.deepEqual({ ...unitData, id: undefined }, { id: undefined, objective: 'Write the release notes', capability: 'docs:write', writes: [], rigor: 'high', prefer: ['test-node'], inputs: ['README.md'], verify: 'npm test' });
  const long = build(root, { capability: 'docs:write' }, [`Sửa lỗi đăng nhập: "quote" & <tag> ${'x'.repeat(200)}`]).unitData;
  assert.match(long.id, /^adhoc-[a-z0-9-]{1,40}-[0-9a-f]{4}$/);
  assert.ok(long.id.startsWith('adhoc-sua-loi-dang-nhap-quote-tag-xxxxxxx'), long.id);
  assert.match(build(root, { capability: 'docs:write' }, ['!!! ???']).unitData.id, /^adhoc-task-[0-9a-f]{4}$/);
  const bare = build(root, {}, ['Check it']).unitData;
  assert.deepEqual([bare.capability, bare.inputs, bare.verify], ['execute', undefined, undefined]);
});

test('buildRunRequest makes a sync-only unit of a bare --sync <ref>', () => {
  const root = runRepo();
  const wt = makeFixtureDir('run-request-sync-wt-');
  fs.rmSync(wt, { recursive: true, force: true });
  execFileSync('git', ['worktree', 'add', '-q', '-b', 'wt', wt], { cwd: root, stdio: 'ignore' });
  const { unitData } = build(root, { sync: 'main', writes: 'docs', capability: 'docs:write' }, [], wt);
  assert.equal(unitData.syncBase, 'main');
  assert.equal(unitData.objective, undefined);
  assert.match(unitData.id, /^adhoc-sync-main-[0-9a-f]{4}$/);
});

test('foldRunSetting fills the key where unset, adds one unscoped override when none is, and never changes its input', () => {
  assert.deepEqual(foldRunSetting([], 'reasoningEffort', 'high'), [{ reasoningEffort: 'high' }]);
  const scoped = [{ scope: { unit: 'u', seat: 's' }, persona: 'p' }, { executor: 'x', reasoningEffort: 'low' }];
  const folded = foldRunSetting(scoped, 'reasoningEffort', 'high');
  assert.deepEqual(folded, [{ scope: { unit: 'u', seat: 's' }, persona: 'p', reasoningEffort: 'high' }, { executor: 'x', reasoningEffort: 'low' }]);
  assert.deepEqual(scoped, [{ scope: { unit: 'u', seat: 's' }, persona: 'p' }, { executor: 'x', reasoningEffort: 'low' }], 'the input is untouched');
  // Only scoped overrides: a trailing unscoped one carries the setting for a role none of them names.
  assert.deepEqual(foldRunSetting([{ scope: { unit: 'u' } }], 'timeoutMs', 5), [{ scope: { unit: 'u' }, timeoutMs: 5 }, { timeoutMs: 5 }]);
});

test('buildRunRequest folds --effort, --timeout and --account into the same overrides, in one pass each, for a prompt, a --unit file and a case run alike', () => {
  const root = runRepo();
  const settings = { effort: 'high', timeout: '90m', account: 'node/acct1' };
  const folded = { reasoningEffort: 'high', timeoutMs: 5_400_000, account: 'node/acct1' };
  const prompt = build(root, { capability: 'docs:write', ...settings }, ['Check it']);
  assert.deepEqual(prompt.overrides, [folded]);
  assert.equal(prompt.accountPin, 'strict', 'fgos run pins the account strictly: no seat taking it refuses the run');
  assert.deepEqual(build(root, { unit: 'u.yaml', ...settings }).overrides, [folded]);
  const withCase = build(root, { unit: 'u.yaml', case: 'wf-1', activity: 'review', ...settings });
  assert.deepEqual(withCase.overrides, [folded]);
  // A scoped --override is filled where it names no value of its own, and an unscoped one is reused, not duplicated.
  const override = JSON.stringify([{ scope: { unit: 'u', seat: 's' }, persona: 'p' }, { timeoutMs: 1000 }]);
  assert.deepEqual(build(root, { unit: 'u.yaml', override, effort: 'low', timeout: '5m' }).overrides, [
    { scope: { unit: 'u', seat: 's' }, persona: 'p', reasoningEffort: 'low', timeoutMs: 300_000 },
    { timeoutMs: 1000, reasoningEffort: 'low' },
  ]);
  assert.deepEqual(build(root, { unit: 'u.yaml' }).overrides, [], 'no setting, no override');
});

test('buildRunRequest refuses --effort or --account without a value, a malformed or oversized --timeout, and invalid --override JSON', () => {
  const root = runRepo();
  refusal(root, { unit: 'u.yaml', effort: true }, [], /--effort requires a level/);
  refusal(root, { unit: 'u.yaml', account: true }, [], /--account requires pool\/account/);
  refusal(root, { unit: 'u.yaml', timeout: '90' }, [], /--timeout/);
  refusal(root, { unit: 'u.yaml', timeout: '9h' }, [], /at most 4h/);
  refusal(root, { unit: 'u.yaml', override: '{nope' }, [], /invalid JSON for --override/);
});

test('buildRunRequest refuses --timeout, --account, --param, --params and a case beside --resume: a resumed run keeps what it started with', () => {
  const root = runRepo();
  refusal(root, { resume: 'unit-run-1', timeout: '90m' }, [], /--timeout cannot change a resumed unit run/);
  refusal(root, { resume: 'unit-run-1', account: 'acct1' }, [], /--account cannot change a resumed unit run/);
  refusal(root, { resume: 'unit-run-1', param: 'maxRounds=2' }, [], /--param cannot change a resumed unit run/);
  refusal(root, { resume: 'unit-run-1', params: '{"maxRounds":2}' }, [], /--params cannot change a resumed unit run/);
  refusal(root, { resume: 'unit-run-1', case: 'wf-1', activity: 'review' }, [], /--case cannot change a resumed unit run/);
});

test('buildRunRequest names the case a run is an activity of, and refuses case flags that lack their partner or carry an unknown route', () => {
  const root = runRepo();
  seen.activities.length = 0;
  const request = build(root, { unit: 'u.yaml', case: 'wf-1', activity: 'review', route: 'may-instead', reason: 'why' });
  assert.deepEqual(request.caseRef, { caseId: 'wf-1', activity: 'review', route: 'may-instead', reason: 'why' });
  assert.deepEqual(request.activityUnit, { pattern: 'solo', params: {} });
  assert.deepEqual(seen.activities, [{ mainRoot: root, caseId: 'wf-1', activity: 'review' }]);
  assert.deepEqual(build(root, { unit: 'u.yaml' }).caseRef, undefined, 'a standalone run names no case');
  refusal(root, { unit: 'u.yaml', activity: 'review' }, [], /--activity needs --case <caseId>/);
  refusal(root, { unit: 'u.yaml', case: 'wf-1' }, [], /--case needs --activity <id>/);
  refusal(root, { unit: 'u.yaml', case: 'wf-1', activity: 'review', route: 'sideways' }, [], /--route must be should, may-instead or unlisted/);
});

test('buildRunRequest hands the case port its project root, and the request parameters through the one request door', () => {
  const root = runRepo();
  seen.ports.length = 0;
  const request = build(root, { unit: 'u.yaml', param: 'maxRounds=2', 'stance-options': 'a|b', pattern: 'solo' });
  assert.deepEqual(seen.ports, [{ repoRoot: root }]);
  assert.deepEqual(request.request.scalars.map((s) => [s.key, s.raw]), [['maxRounds', '2']]);
  assert.deepEqual(request.stanceOptions, ['a', 'b']);
  assert.equal(request.pattern, 'solo');
  assert.equal(request.raiseAuthorized, false, 'no door of this release can attest a person');
  assert.throws(() => build(root, { unit: 'u.yaml', params: '[1]' }), (err) => err instanceof RunnerConfigError && err.code === 'param-invalid' && err.phase === 'pre-admission');
});
