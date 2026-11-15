// Session parity table: every `fgos session` call the base release answers, as a short script of steps run on
// a fresh repository per entry. A step is a call (`args`, run in `cwd`) or an action (`do`) that changes the
// fixture the same way for both entries. `$SID0`, `$SID1` in an argument name the sessions the script started,
// in order. `mode`: `bytes` compares exit status, stdout and stderr after the run-specific values (ids, paths,
// hashes, times, pids) are replaced by stable tokens; `exit` compares the exit status alone, for the calls whose
// text the host words once for every ported verb (a missing or unknown sub-command).
//
// `cwd`: `repo` (the project root), `sub` (a subdirectory of it), `tmp` (a directory that is no repository),
// `wt0` (the first session's worktree), `wt0/sub` (a subdirectory of it), `linked` (a linked worktree of the
// repository), `frozen` (a linked worktree that carries its own real `.fgos`).
export const cases = [];

const call = (args, extra = {}) => ({ args, ...extra });
const add = (id, steps, extra = {}) => cases.push({ id: `session-${id}`, steps, ...extra });

add('list-empty', [call(['session', 'list'])]);
add('list-json', [call(['session', 'list', '--json'])]);
add('gc-empty', [call(['session', 'gc'])]);

add('start', [call(['session', 'start']), call(['session', 'list'])]);
add('start-json-item', [call(['session', 'start', '--item', 'tsk-abc', '--json']), call(['session', 'list'])]);
add('start-bare-item', [call(['session', 'start', '--item'])]);
add('start-empty-item', [call(['session', 'start', '--item', ''])]);
add('start-item-equals', [call(['session', 'start', '--item=tsk-abc'])]);
add('start-unknown-flag', [call(['session', 'start', '--bogus'])]);
add('start-unknown-flags-in-order', [call(['session', 'start', '--zeta', '1', '--alpha', '--item=x'])]);
add('list-unknown-flag', [call(['session', 'list', '--bogus'])]);
add('end-unknown-flag', [call(['session', 'end', 'x', '--forse'])]);
add('gc-unknown-flag', [call(['session', 'gc', '--all'])]);

add('missing-sub', [call(['session'], { mode: 'exit' })]);
add('unknown-sub', [call(['session', 'bogus'], { mode: 'exit' })]);

// Accepted difference: outside a project the base release answers from, and makes, a `.fgos` in the current directory
// (`list` answers `[]`, `start` fails on the missing repository); the host refuses with the project refusal (exit 4)
// and creates nothing. Only the host runs; the case asserts the refusal and that the directory stayed as it was.
for (const where of ['outside', 'uninitialised']) {
  add(`outside-a-project-${where}`, ['list', 'gc'].map((sub) => call(['session', sub], { cwd: where })).concat([
    call(['session', 'start'], { cwd: where }),
    call(['session', 'end', 'x'], { cwd: where }),
  ]), { acceptedDifference: { exit: 4, stderr: /^fgos: not inside an fgOS project: no \.fgos directory above .* \[not-in-project\]\n$/ } });
}

add('start-from-a-non-repository', [call(['session', 'start'], { cwd: 'tmp' })]);
// A linked worktree with no store of its own: the base release makes a store in the worktree (the answer is the
// same); the host acts on the main checkout's store, so only the answer is compared.
add('start-from-a-linked-worktree', [{ do: 'linkedWorktree' }, call(['session', 'start'], { cwd: 'linked' })], { stateless: true });
add('start-from-a-frozen-worktree', [{ do: 'frozenWorktree' }, call(['session', 'start'], { cwd: 'frozen' })]);
add('end-from-a-frozen-worktree', [{ do: 'frozenWorktree' }, call(['session', 'end', 'x'], { cwd: 'frozen' })]);
add('gc-from-a-frozen-worktree', [{ do: 'frozenWorktree' }, call(['session', 'gc'], { cwd: 'frozen' })]);
add('dir-names-another-project-from-a-subdirectory', [
  { do: 'otherProject' },
  call(['session', 'list', '--dir', '$OTHER'], { cwd: 'sub' }),
  call(['session', 'start', '--dir', '$OTHER', '--json'], { cwd: 'repo' }),
  call(['session', 'list', '--dir', '$OTHER'], { cwd: 'repo' }),
// The base release makes a store of its own below the project when it is run from a subdirectory; the host
// acts on the project's store (the one difference, accepted), so the fixture's subdirectory is not compared.
], { ignoreSub: true });
add('dir-that-does-not-exist', [call(['session', 'list', '--dir', '/nonexistent/project'])]);

add('start-from-inside-a-session-worktree', [
  call(['session', 'start']),
  call(['session', 'start'], { cwd: 'wt0' }),
  call(['session', 'list']),
]);
add('start-from-below-a-session-worktree', [
  call(['session', 'start']),
  { do: 'subdirOfSession' },
  call(['session', 'start'], { cwd: 'wt0/sub' }),
  call(['session', 'list']),
]);

add('end-without-an-id', [call(['session', 'end'])]);
add('end-force-before-the-id', [call(['session', 'start']), call(['session', 'end', '--force', '$SID0'])]);
add('end-unknown', [call(['session', 'end', 'nope'])]);
add('end-unknown-force', [call(['session', 'end', 'nope', '--force'])]);
add('end-clean', [call(['session', 'start']), call(['session', 'end', '$SID0']), call(['session', 'list'])]);
add('end-twice', [call(['session', 'start']), call(['session', 'end', '$SID0']), call(['session', 'end', '$SID0'])]);
add('end-with-force-flag', [call(['session', 'start']), call(['session', 'end', '$SID0', '--force', '--json']), call(['session', 'list'])]);
add('end-diverged-then-forced', [
  call(['session', 'start']),
  { do: 'commitInside', session: 0 },
  call(['session', 'end', '$SID0']),
  call(['session', 'list']),
  call(['session', 'end', '$SID0', '--force']),
  call(['session', 'list']),
]);
add('end-dirty-and-forced-keeps-everything', [
  call(['session', 'start']),
  { do: 'commitInside', session: 0 },
  { do: 'dirty', session: 0 },
  call(['session', 'end', '$SID0', '--force']),
  call(['session', 'list']),
], { nativeCause: true });

add('gc-reclaims-a-dead-start-process', [
  call(['session', 'start']),
  call(['session', 'start', '--item', 'tsk-live']),
  { do: 'markDead', sessions: [0] },
  call(['session', 'gc']),
  call(['session', 'list']),
]);
add('gc-spares-a-diverged-and-a-dirty-orphan', [
  call(['session', 'start']),
  call(['session', 'start']),
  call(['session', 'start']),
  { do: 'commitInside', session: 0 },
  { do: 'dirty', session: 1 },
  { do: 'markDead', sessions: [0, 1, 2] },
  call(['session', 'gc']),
  call(['session', 'list']),
]);
add('gc-from-inside-a-live-session-worktree', [
  call(['session', 'start']),
  call(['session', 'start']),
  { do: 'markDead', sessions: [0, 1] },
  call(['session', 'gc'], { cwd: 'wt0' }),
  call(['session', 'list']),
]);
add('gc-keeps-a-row-whose-process-it-cannot-judge', [
  call(['session', 'start']),
  { do: 'dropRecord', session: 0 },
  call(['session', 'gc']),
  call(['session', 'list']),
]);
add('gc-reclaims-a-row-whose-worktree-is-gone', [
  call(['session', 'start']),
  { do: 'removeWorktreeDir', session: 0 },
  call(['session', 'gc']),
  call(['session', 'list']),
]);

for (const [id, text] of [['not-json', '{bad'], ['not-an-array', '{}']]) {
  add(`registry-${id}`, [
    { do: 'writeRegistry', text },
    call(['session', 'list']),
    call(['session', 'start']),
    call(['session', 'gc']),
    call(['session', 'end', 'x']),
    { do: 'readRegistry' },
  ]);
}

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { strict as assert } from 'node:assert';

import { runCaseOnEntry } from '../harness.mjs';
import { initFixtureRepo } from '../../helpers/git-fixture.mjs';

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
  // Where no project exists at all: an empty directory, and a repository nobody initialised.
  fs.mkdirSync(path.join(root, 'outside'));
  fs.mkdirSync(path.join(root, 'uninitialised'));
  git(path.join(root, 'uninitialised'), ['init', '-q', '-b', 'main']);
  git(path.join(root, 'uninitialised'), ['config', 'user.email', 'test@example.com']);
  git(path.join(root, 'uninitialised'), ['config', 'user.name', 'Test']);
  fs.writeFileSync(path.join(root, 'uninitialised', 'seed.txt'), 'seed\n');
  git(path.join(root, 'uninitialised'), ['add', 'seed.txt']);
  git(path.join(root, 'uninitialised'), ['commit', '-qm', 'seed']);
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
    outside: () => path.join(world.root, 'outside'),
    uninitialised: () => path.join(world.root, 'uninitialised'),
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
  const dirNames = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).map(norm).sort() : null);
  return {
    registry: fs.existsSync(registryPath(world)) ? norm(fs.readFileSync(registryPath(world), 'utf8')) : null,
    sessionCheckouts: dirNames(path.join(world.tmp, 'fgos-sessions')),
    gitWorktrees: git(world.repo, ['worktree', 'list', '--porcelain']).split('\n').filter((line) => line.startsWith('worktree ')).length,
    // `logs` holds the fault records of malformed calls, which the host also writes for a missing or unknown sub-command.
    fgosEntries: dirNames(path.join(world.repo, '.fgos'))?.filter((name) => name !== 'logs'),
    outside: dirNames(path.join(world.root, 'outside')),
    uninitialisedStore: fs.existsSync(path.join(world.root, 'uninitialised', '.fgos')),
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
    // A run leaves no store above its own tree: a stray `.fgos` there would make a later fixture treat that directory as its project.
    for (let dir = path.dirname(world.root); ; dir = path.dirname(dir)) {
      assert.ok(!fs.existsSync(path.join(dir, '.fgos')), `${testCase.id}: a run left ${path.join(dir, '.fgos')} above its fixture`);
      if (dir === path.dirname(dir)) break;
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


/** Runs one case on the base release (entry A) and the host (entry B), each on a fresh repository, and compares them. */
export async function runPreparedCase(entryA, entryB, testCase) {
  const differences = [];
  try {
    if (testCase.acceptedDifference) {
      // Only the host runs: the base release's answer is the behaviour being retired.
      const host = await runScript(entryB, testCase);
      const { exit, stderr } = testCase.acceptedDifference;
      for (const output of host.outputs) {
        if (output.exit !== exit) differences.push(`${output.args.join(' ')}: exit ${output.exit}, expected ${exit}`);
        if (!stderr.test(output.stderr)) differences.push(`${output.args.join(' ')}: stderr ${JSON.stringify(output.stderr)}`);
      }
      if (host.state.outside.length) differences.push(`a refused call left ${JSON.stringify(host.state.outside)} in the empty directory`);
      if (host.state.uninitialisedStore) differences.push('a refused call made a .fgos in the repository nobody initialised');
      return { caseId: testCase.id, passed: differences.length === 0, differences };
    }
    const [node, host] = [await runScript(entryA, testCase), await runScript(entryB, testCase)];
    const same = (left, right, what) => {
      try { assert.deepEqual(left, right); } catch (error) { differences.push(`${what} differ: ${error.message.split('\n').slice(0, 40).join('\n')}`); }
    };
    same(host.outputs, node.outputs, 'the calls');
    if (!testCase.stateless) same(host.state, node.state, 'the resulting states');
    const nodeStarts = host.children.filter((child) => path.basename(child.cmd) === 'node');
    if (nodeStarts.length) differences.push(`the host started node: ${JSON.stringify(nodeStarts)}`);
  } catch (error) {
    differences.push(String(error.message ?? error));
  }
  return { caseId: testCase.id, passed: differences.length === 0, differences };
}
