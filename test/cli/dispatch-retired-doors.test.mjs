import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync, execFileSync } from 'node:child_process';
import { initStore, addWork } from '../../src/state/store.mjs';

// `dispatch execute` (prompt, --contract, --assignment) and `dispatch log` are gone: one task
// runs through `fgos run`, planned work through a Workflow. Calling a removed door is a
// validation error that names the door to use, and it never runs or records anything.

const repo = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const FGOS = path.join(repo, 'bin', 'fgos.mjs');
const DISPATCH = path.join(repo, 'src', 'runner', 'dispatch.mjs');

function mkStore() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-retired-doors-'));
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: root });
  const fgosDir = path.join(root, '.fgos');
  fs.mkdirSync(fgosDir);
  initStore(fgosDir);
  addWork(fgosDir, {
    id: 'cand1', title: 'x', kind: 'task', status: 'todo', domain: 'coding',
    workflowStep: 'executing', deps: [], refs: [], risk: 'light', verify: 'true',
  });
  return { root, fgosDir };
}

function run(script, args, cwd) {
  const env = { ...process.env };
  delete env.CLAUDE_CODE_SESSION_ID;
  return spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8', env });
}

function eventLines(fgosDir) {
  const dir = path.join(fgosDir, 'events');
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).reduce((n, f) => n + fs.readFileSync(path.join(dir, f), 'utf8').split('\n').filter(Boolean).length, 0);
}

function writeConfig(fgosDir) {
  fs.writeFileSync(path.join(fgosDir, 'config.json'), JSON.stringify({
    runner: {
      executor: { command: 'claude', args: ['{prompt}'] },
      capabilities: { blocked: { prefer: 'tool-only' } },
      executors: {
        'tool-only': { kind: 'tool', command: 'agy', args: ['{prompt}'], allowCrossProvider: true },
        ag1: { kind: 'agent', command: 'claude', args: ['{prompt}'] },
      },
      modelPolicies: { claude: { standard: 'sonnet' } },
      timeoutMs: 5000,
    },
  }));
}

test('fgos dispatch execute <agent executor> is a validation error pointing at fgos run --provider, and spawns nothing', () => {
  const { root, fgosDir } = mkStore();
  writeConfig(fgosDir);
  const before = eventLines(fgosDir);
  const out = run(FGOS, ['dispatch', 'execute', 'ag1', '--prompt', 'hi', '--for', 'execute'], root);
  assert.equal(out.status, 4, out.stderr);
  assert.match(out.stderr, /fgos dispatch execute was removed/);
  assert.match(out.stderr, /fgos run "<prompt>" --provider ag1 --capability execute \[--writes <paths> --worktree <path>\]/);
  assert.match(out.stderr, /--provider is a preference/);
  assert.match(out.stderr, /fgos run --unit <file>/);
  assert.equal(fs.existsSync(path.join(fgosDir, 'assignments')), false);
  assert.equal(eventLines(fgosDir), before);
});

test('fgos dispatch execute <tool executor> never suggests --provider for it, which fgos run would refuse', () => {
  const { root, fgosDir } = mkStore();
  writeConfig(fgosDir);
  const out = run(FGOS, ['dispatch', 'execute', 'tool-only', '--prompt', 'hi'], root);
  assert.equal(out.status, 4, out.stderr);
  assert.doesNotMatch(out.stderr, /--provider tool-only/);
  assert.match(out.stderr, /"tool-only" is a tool executor, which fgos run cannot name -- call that tool directly/);
});

test('fgos dispatch execute <unregistered executor> suggests a plain fgos run', () => {
  const { root } = mkStore();
  const out = run(FGOS, ['dispatch', 'execute', 'codex', '--prompt', 'hi'], root);
  assert.equal(out.status, 4, out.stderr);
  assert.match(out.stderr, /fgos run "<prompt>" \[--writes <paths> --worktree <path>\]/);
  assert.doesNotMatch(out.stderr, /--provider codex/);
});

test('fgos dispatch execute --contract points at fgos run --unit', () => {
  const { root } = mkStore();
  const out = run(FGOS, ['dispatch', 'execute', 'codex', '--contract', 'c.json'], root);
  assert.equal(out.status, 4, out.stderr);
  assert.match(out.stderr, /fgos run --unit <file>/);
});

test('fgos dispatch execute --assignment points at fgos run --unit or a Workflow', () => {
  const { root } = mkStore();
  const out = run(FGOS, ['dispatch', 'execute', '--assignment', 'asgn-1'], root);
  assert.equal(out.status, 4, out.stderr);
  assert.match(out.stderr, /--assignment was removed/);
  assert.match(out.stderr, /fgos run --unit <file>/);
  assert.match(out.stderr, /fgos workflow start/);
});

test('fgos dispatch log is a validation error pointing at the unit run directory, and writes no event', () => {
  const { root, fgosDir } = mkStore();
  const before = eventLines(fgosDir);
  const out = run(FGOS, ['dispatch', 'log', 'codex', '--id', 'cand1', '--provider', 'openai', '--command', 'codex'], root);
  assert.equal(out.status, 4, out.stderr);
  assert.match(out.stderr, /fgos dispatch log was removed/);
  assert.match(out.stderr, /\.fgos\/assignments\/<unitRunId>\//);
  assert.equal(eventLines(fgosDir), before);
});

test('fgos dispatch decide --work resolves the item through the Work layer handed in by bin', () => {
  const { root } = mkStore();
  const out = run(FGOS, ['dispatch', 'decide', '--work', 'cand1'], root);
  assert.equal(out.status, 0, out.stderr);
  assert.equal(JSON.parse(out.stdout).data.executorId, 'fgos-coding-implement');
});

test('node src/runner/dispatch.mjs decide --work refuses and points at fgos dispatch decide --work', () => {
  const { root } = mkStore();
  const out = run(DISPATCH, ['decide', '--work', 'cand1'], root);
  assert.equal(out.status, 1);
  assert.match(out.stderr, /fgos dispatch decide/);
  assert.equal(out.stdout, '');
});

for (const sub of ['execute', 'log', 'fanout-batch']) {
  test(`node src/runner/dispatch.mjs ${sub} is an unknown subcommand`, () => {
    const { root, fgosDir } = mkStore();
    const before = eventLines(fgosDir);
    const out = run(DISPATCH, [sub, 'cand1', '--prompt', 'hi', '--id', 'a', '--provider', 'p', '--command', 'c'], root);
    assert.equal(out.status, 1);
    assert.match(out.stderr, new RegExp(`unknown subcommand "${sub}"`));
    assert.equal(eventLines(fgosDir), before);
  });
}

test('fgos hook dispatch-decide (agy payload) denies an out-of-process subagent call and points at a door fgos run accepts, not dispatch execute', () => {
  const { root, fgosDir } = mkStore();
  writeConfig(fgosDir);
  const env = { ...process.env };
  delete env.CLAUDE_CODE_SESSION_ID;
  const out = spawnSync(process.execPath, [FGOS, 'hook', 'dispatch-decide', '--format=agy'], {
    cwd: root,
    encoding: 'utf8',
    env,
    input: JSON.stringify({ toolCall: { name: 'Agent', args: { subagent_type: 'blocked' } }, workspacePaths: [root] }),
  });
  assert.equal(out.status, 0, out.stderr);
  const decision = JSON.parse(out.stdout.trim().split('\n').at(-1));
  assert.equal(decision.decision, 'deny');
  assert.match(decision.reason, /fgos run "<prompt>" --capability blocked/);
  assert.match(decision.reason, /"tool-only" is a tool executor/);
  assert.doesNotMatch(decision.reason, /dispatch execute|--provider tool-only/);
});
