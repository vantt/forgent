// Node-versus-host parity for the `session` verbs: the table in parity-cases/session.cases.mjs runs on the
// base release (the Node payload the step started from) and on the host binary `run-tests` stages, each on its
// own fresh repository, and the answers are compared after run-specific values are replaced by tokens.
// Run through: FGOS_TEST_PARITY_BASE=<description.json> node scripts/run-tests.mjs test/rust-host/session-parity.test.mjs
// (the recipe is in the header of harness.mjs). The table and this file are deleted once the Node side is gone.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

import { runCaseOnEntry, parseEntry, loadParityTable } from './harness.mjs';
import { initFixtureRepo } from '../helpers/git-fixture.mjs';

const hostBin = process.env.FGOS_HOST_BIN;
const baseFile = process.env.FGOS_TEST_PARITY_BASE;
assert.ok(hostBin && fs.existsSync(hostBin), 'FGOS_HOST_BIN is not set: run this file through node scripts/run-tests.mjs');
assert.ok(baseFile, 'FGOS_TEST_PARITY_BASE is not set (see the recipe in test/rust-host/harness.mjs)');
const base = JSON.parse(fs.readFileSync(baseFile, 'utf8'));

const baseEntry = {
  type: 'node',
  executable: process.execPath,
  target: path.join(base.releasePath, 'bin/fgos.mjs'),
  env: {
    FGOS_HOST_BIN: base.hostBin,
    FGOS_ACTIVE_RELEASE_PATH: base.releasePath,
    FGOS_ACTIVE_MANIFEST_PATH: base.manifestPath,
  },
  spec: 'node:base-release',
};
const hostEntry = parseEntry(`bin:${hostBin}`);

const git = (cwd, args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

/** A fresh world for one entry of one case: a repository, its own HOME, TMPDIR and nothing shared but the state root. */
function makeWorld() {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'p08par-')));
  const repo = path.join(root, 'repo');
  for (const dir of ['repo', 'home', 'tmp', 'bare']) fs.mkdirSync(path.join(root, dir));
  initFixtureRepo(repo);
  fs.mkdirSync(path.join(repo, 'sub'));
  // A directory that is no repository but has a store of its own, so the root it names never depends on what sits above the machine's temp dir.
  fs.mkdirSync(path.join(root, 'bare', '.fgos'));
  return { root, repo, home: path.join(root, 'home'), tmp: path.join(root, 'tmp'), bare: path.join(root, 'bare'), sessions: [] };
}

const deadPid = () => spawnSync(process.execPath, ['-e', 'process.exit(0)']).pid;

function registryPath(world) { return path.join(world.repo, '.fgos', 'sessions.json'); }
function readRegistryRows(world) { return JSON.parse(fs.readFileSync(registryPath(world), 'utf8')); }
function writeRegistryRows(world, rows) { fs.writeFileSync(registryPath(world), `${JSON.stringify(rows, null, 2)}\n`); }

/** The fixture changes a script asks for, applied identically to both worlds. */
function act(world, step) {
  const wt = (n) => world.sessions[n].worktreePath;
  switch (step.do) {
    case 'linkedWorktree':
      world.linked = path.join(world.root, 'linked');
      git(world.repo, ['worktree', 'add', '-q', '--detach', world.linked, 'HEAD']);
      return null;
    case 'frozenWorktree':
      fs.mkdirSync(path.join(world.repo, '.fgos'), { recursive: true });
      fs.writeFileSync(path.join(world.repo, '.fgos', 'frozen.txt'), 'tracked store file\n');
      git(world.repo, ['add', '-f', '.fgos/frozen.txt']);
      git(world.repo, ['commit', '-qm', 'track a store file']);
      world.frozen = path.join(world.root, 'frozen');
      git(world.repo, ['worktree', 'add', '-q', '--detach', world.frozen, 'HEAD']);
      return null;
    case 'otherProject':
      world.other = path.join(world.root, 'other');
      fs.mkdirSync(world.other);
      initFixtureRepo(world.other);
      return null;
    case 'subdirOfSession':
      fs.mkdirSync(path.join(wt(0), 'sub'));
      return null;
    case 'commitInside':
      fs.appendFileSync(path.join(wt(step.session), 'seed.txt'), 'diverge\n');
      git(wt(step.session), ['add', 'seed.txt']);
      git(wt(step.session), ['commit', '-qm', 'commit from inside the session']);
      return null;
    case 'dirty':
      fs.writeFileSync(path.join(wt(step.session), 'wip.txt'), 'not committed yet\n');
      return null;
    case 'markDead': {
      const dead = deadPid();
      const ids = step.sessions.map((n) => world.sessions[n].sessionId);
      writeRegistryRows(world, readRegistryRows(world).map((row) => (ids.includes(row.sessionId) ? { ...row, pid: dead, record: { ...row.record, pid: dead } } : row)));
      return null;
    }
    case 'dropRecord': {
      const id = world.sessions[step.session].sessionId;
      writeRegistryRows(world, readRegistryRows(world).map((row) => {
        if (row.sessionId !== id) return row;
        const { record, ...rest } = row;
        return rest;
      }));
      return null;
    }
    case 'removeWorktreeDir':
      fs.rmSync(wt(step.session), { recursive: true, force: true });
      return null;
    case 'writeRegistry':
      fs.writeFileSync(registryPath(world), step.text);
      return null;
    case 'readRegistry':
      return fs.readFileSync(registryPath(world), 'utf8');
    default:
      throw new Error(`unknown action ${step.do}`);
  }
}

function cwdOf(world, name = 'repo') {
  const session = () => fs.realpathSync(world.sessions[0].worktreePath);
  const table = {
    repo: () => world.repo,
    sub: () => path.join(world.repo, 'sub'),
    tmp: () => world.bare,
    linked: () => world.linked,
    frozen: () => world.frozen,
    wt0: session,
    'wt0/sub': () => path.join(session(), 'sub'),
  };
  assert.ok(table[name], `unknown cwd ${name}`);
  return table[name]();
}

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g;
const ISO = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/g;

/** Replaces the values that differ between two runs by tokens numbered in order of first appearance. */
function normaliser(world, { nativeCause = false } = {}) {
  const seen = { uuid: new Map(), sha: new Map() };
  const token = (kind, value) => {
    if (!seen[kind].has(value)) seen[kind].set(value, `<${kind.toUpperCase()}${seen[kind].size}>`);
    return seen[kind].get(value);
  };
  return (text) => text
    .split('\n')
    .filter((line) => !/^warning: worktree-cwd-unreadable /.test(line))
    .join('\n')
    .replaceAll(world.root, '<WORLD>')
    .replace(UUID, (id) => token('uuid', id))
    .replace(/(<UUID\d+>)-[A-Za-z0-9]{6}\b/g, '$1-<RAND>')
    .replace(/\b[0-9a-f]{64}\b/g, '<H64>')
    .replace(/\b[0-9a-f]{40}\b/g, (sha) => token('sha', sha))
    .replace(ISO, '<TS>')
    .replace(/"pid": \d+/g, '"pid": <PID>')
    .replace(/"startTime": "\d+"/g, '"startTime": "<START>"')
    .replace(/(not valid JSON\): ).*/g, '$1<DETAIL>')
    .replace(/"data_hash": "<H64>",?\s*/g, '')
    // A refusal of the Git port: the Node CLI prints the addon's JSON error, the host the cause alone.
    .replace(nativeCause ? /(for "[^"]*": )(?:\{"code".*?"cause":"([^"]*)".*\}|([a-z-]+))\n/g : /$^/g, '$1<NATIVE>\n');
}

function stateOf(world, { ignoreSub }) {
  const norm = normaliser(world);
  const dirNames = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).sort().map(norm) : null);
  return {
    registry: fs.existsSync(registryPath(world)) ? norm(fs.readFileSync(registryPath(world), 'utf8')) : null,
    sessionCheckouts: dirNames(path.join(world.tmp, 'fgos-sessions')),
    gitWorktrees: git(world.repo, ['worktree', 'list', '--porcelain']).split('\n').filter((line) => line.startsWith('worktree ')).length,
    // `logs` holds the fault records of malformed calls, which the host also writes for a missing or unknown sub-command.
    fgosEntries: dirNames(path.join(world.repo, '.fgos'))?.filter((name) => name !== 'logs'),
    strayStoreBelowTheRoot: ignoreSub ? null : fs.existsSync(path.join(world.repo, 'sub', '.fgos')),
  };
}

async function runScript(entry, testCase) {
  const world = makeWorld();
  const outputs = [];
  const children = [];
  try {
    for (const step of testCase.steps) {
      if (step.do) {
        const out = act(world, step);
        if (out !== null) outputs.push({ action: step.do, text: out });
        continue;
      }
      const args = step.args.map((arg) => {
        const sid = /^\$SID(\d)$/.exec(arg);
        if (sid) return world.sessions[Number(sid[1])].sessionId;
        return arg === '$OTHER' ? world.other : arg;
      });
      const result = await runCaseOnEntry(entry, {
        id: testCase.id,
        args,
        cwd: cwdOf(world, step.cwd),
        env: { HOME: world.home, TMPDIR: world.tmp },
        modes: ['exact-bytes'],
      });
      assert.equal(result.launchError, null, `${testCase.id}: ${JSON.stringify(result.launchError)}`);
      children.push(...result.spawnedChildren);
      if (args[1] === 'start' && result.exitCode === 0) {
        const data = JSON.parse(result.stdoutText).data;
        world.sessions.push({ sessionId: data.sessionId, worktreePath: data.worktreePath });
      }
      outputs.push({
        args: step.args,
        mode: step.mode ?? 'bytes',
        exit: result.exitCode,
        stdout: step.mode === 'exit' ? '' : result.stdoutText,
        stderr: step.mode === 'exit' ? '' : result.stderrText,
      });
    }
    const norm = normaliser(world, { nativeCause: testCase.nativeCause });
    return {
      outputs: outputs.map((o) => (o.text === undefined ? { ...o, stdout: norm(o.stdout), stderr: norm(o.stderr) } : { ...o, text: norm(o.text) })),
      state: stateOf(world, { ignoreSub: testCase.ignoreSub }),
      children,
    };
  } finally {
    // Session checkouts first (they are outside the world), then the world itself.
    for (const session of world.sessions) fs.rmSync(session.worktreePath, { recursive: true, force: true });
    fs.rmSync(world.root, { recursive: true, force: true });
  }
}

const cases = await loadParityTable('session');
for (const testCase of cases) {
  test(`the host answers like the base release: ${testCase.id}`, async () => {
    const [node, host] = [await runScript(baseEntry, testCase), await runScript(hostEntry, testCase)];
    assert.deepEqual(host.outputs, node.outputs, `${testCase.id}: calls differ`);
    assert.deepEqual(host.state, node.state, `${testCase.id}: the resulting state differs`);
    const hostNodeStarts = host.children.filter((child) => path.basename(child.cmd) === 'node');
    assert.deepEqual(hostNodeStarts, [], `${testCase.id}: the host started node`);
  });
}
