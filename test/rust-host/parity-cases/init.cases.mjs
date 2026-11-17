// `fgos init` parity table: every call the base release answers, on a fresh world per entry (a project, its own
// HOME with a `.fgos` directory, TMPDIR and a state root). Each case compares the answers (exit status, envelope,
// stderr) and everything the run left on disk (project, HOME and state root, with the machine id, the stamps and
// the world root replaced by tokens), and that no store appeared above the world. The host starts one Node child
// at most: the bridge's Work store step.
//
// `cwd`: `repo`, `sub` (a subdirectory), `outside` (a directory that is no repository), `linked` (a linked
// worktree of `repo`). `world` options: `commits` (default true; false leaves a repository with zero commits),
// `fence` (default true; the activation fence the product's activation leaves), `legacyGlobal`, `legacyProject`,
// `differs` (the private token differs from the legacy one), `readOnlyHome`, `harness` (a `.claude` directory and a
// bee AGENTS.md block), `interrupted` (an interrupted Land the recovery settles).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { strict as assert } from 'node:assert';

import { runCaseOnEntry } from '../harness.mjs';
import { writeRawLegacyGlobalConfig, writeRawLegacyProjectConfig, gatewayTokenPath } from '../../helpers/config-fixture.mjs';
import { createGitLand } from '../../../src/git/index.mjs';
import { ensureGitAddon, root as repoRoot } from '../../../scripts/git-addon.mjs';

export const cases = [];

const call = (args, extra = {}) => ({ args: ['init', ...args], ...extra });
const add = (id, steps, world = {}) => cases.push({ id: `init-${id}`, steps, world });

// Fresh and repeated.
add('fresh-project', [call([])]);
add('fresh-project-json', [call(['--json'])]);
add('repeat-run-changes-nothing', [call([]), call([])]);
add('no-activation-fence', [call([])], { fence: false });
add('zero-commits', [call([])], { commits: false });
add('harness-markers', [call([])], { harness: true });
add('interrupted-git-operation-is-recovered', [call([])], { interrupted: true });
add('interrupted-git-operation-second-run-has-nothing', [call([]), call([])], { interrupted: true });

// The legacy JSON config of an older release.
add('legacy-global-and-project', [call([])], { legacyGlobal: true, legacyProject: true });
add('legacy-global-and-project-twice', [call([]), call([])], { legacyGlobal: true, legacyProject: true });
add('legacy-project-only', [call([])], { legacyProject: true });
add('legacy-global-only', [call([])], { legacyGlobal: true });
add('legacy-destination-differs-is-refused', [call([])], { legacyGlobal: true, differs: true });
add('legacy-global-with-a-home-that-cannot-be-written', [call([])], { legacyGlobal: true, readOnlyHome: true });
add('read-only-home-warns-about-the-config-files', [call([])], { readOnlyHome: true });

// Where init may run.
add('from-a-subdirectory-is-refused', [call([], { cwd: 'sub' })]);
add('from-a-linked-worktree-is-refused', [{ do: 'linkedWorktree' }, call([], { cwd: 'linked' })]);
add('outside-any-repository-fails-after-the-machine-id', [call([], { cwd: 'outside' })]);
add('dir-names-the-project-from-elsewhere', [call(['--dir', '<repo>'], { cwd: 'outside' })]);
add('dir-names-a-subdirectory-is-refused', [call(['--dir', '<repo>/sub'], { cwd: 'outside' })]);
add('dir-names-a-missing-path', [call(['--dir', '/nonexistent/fgos-parity-project'])]);
add('dir-names-a-plain-directory', [call(['--dir', '<outside>'])]);
add('dir-names-a-file', [call(['--dir', '/etc/hostname'])]);
add('dir-empty', [call(['--dir', ''])]);
add('dir-bare', [call(['--dir'])]);

// Refused calls: the flag text is the registry's.
add('unknown-flag', [call(['--bogus'])]);
add('yes-is-not-a-flag', [call(['--yes'])]);
add('dir-with-equals', [call(['--dir=/tmp'])]);
add('json-with-equals', [call(['--json=1'])]);
add('extra-positional-is-accepted', [call(['whatever'])]);

const STAMP = /\d{8}T\d{9}Z/g;
const ISO = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/g;
const MACHINE_ID = /[a-z0-9][a-z0-9-]*-[a-z2-7]{6}\b/g;

function git(dir, ...args) {
  return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function fence(repo) {
  const dir = path.join(repo, '.fgos/locks/activation.lock');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'TOMBSTONE'), JSON.stringify({ lock: 'activation', by: 'fgos git', at: 'fixture' }));
}

const TOKEN = 'SENTINEL-4417';

async function makeWorld(options) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'p10par-')));
  const dirs = Object.fromEntries(['repo', 'home', 'tmp', 'state', 'outside'].map((name) => [name, path.join(root, name)]));
  for (const dir of Object.values(dirs)) fs.mkdirSync(dir);
  fs.chmodSync(dirs.state, 0o700);
  fs.mkdirSync(path.join(dirs.home, '.fgos'), { mode: 0o700 });
  const repo = dirs.repo;
  git(repo, 'init', '-q', '-b', options.interrupted ? 'trunk' : 'main');
  git(repo, 'config', 'user.email', 'test@example.com');
  git(repo, 'config', 'user.name', 'Test');
  fs.mkdirSync(path.join(repo, 'sub'));
  fs.writeFileSync(path.join(repo, '.gitignore'), '.fgos/cache/\n.fgos/runtime/\n.fgos/locks/\n.fgos/logs/\n');
  fs.writeFileSync(path.join(repo, 'seed.txt'), options.interrupted ? 'base\n' : 'seed\n');
  if (options.harness) {
    fs.mkdirSync(path.join(repo, '.claude'));
    fs.writeFileSync(path.join(repo, 'AGENTS.md'), '# Agents\n<!-- BEE:START -->\nbee\n<!-- BEE:END -->\n');
  }
  if (options.commits !== false) {
    git(repo, 'add', '.');
    git(repo, 'commit', '-q', '-m', 'seed');
  }
  if (options.fence !== false) fence(repo);
  if (options.legacyGlobal) {
    writeRawLegacyGlobalConfig(dirs.home, JSON.stringify({ gateway: { port: 4001, token: TOKEN }, bin: { globalFgosPath: '/opt/fgos' } }));
  }
  if (options.legacyProject) writeRawLegacyProjectConfig(repo, JSON.stringify({ gateBypass: { level: 'light' }, ironLaw: { level: 'ask' } }));
  if (options.differs) {
    fs.mkdirSync(path.join(dirs.home, '.fgos/private'), { recursive: true, mode: 0o700 });
    fs.writeFileSync(gatewayTokenPath(path.join(dirs.home, '.fgos')), 'SENTINEL-8820\n', { mode: 0o600 });
  }
  if (options.interrupted) await interruptLand(dirs);
  return { root, ...dirs, readOnlyHome: options.readOnlyHome };
}

/** An interrupted Land in the project: prepared in the journal and never finished, as a killed run leaves it. */
async function interruptLand(dirs) {
  const { repo, state } = dirs;
  const target = git(repo, 'rev-parse', 'HEAD');
  git(repo, 'checkout', '-qb', 'source');
  fs.writeFileSync(path.join(repo, 'a'), 'incoming\n');
  git(repo, 'add', 'a');
  git(repo, 'commit', '-q', '-m', 'source');
  const source = git(repo, 'rev-parse', 'HEAD');
  git(repo, 'checkout', '-q', 'trunk');
  const built = ensureGitAddon();
  const loader = { descriptor: { manifest: JSON.parse(fs.readFileSync(built.manifest)), releaseRoot: repoRoot } };
  const land = createGitLand({ stateRoot: state, repoPath: repo, trustedMain: repo, writer: 'fixture' }, loader);
  try {
    await land.prepare({ operationId: 'interrupted-land', request: { source, target, destination: 'refs/heads/trunk', message: 'consumer land', squash: false, footprint: [], subtree: null, files: [] } });
  } finally {
    land.close();
  }
}

function act(world, step) {
  assert.equal(step.do, 'linkedWorktree', `unknown action ${step.do}`);
  world.linked = path.join(world.root, 'linked');
  git(world.repo, 'worktree', 'add', '-q', '--detach', world.linked, 'HEAD');
}

const cwdOf = (world, name = 'repo') => ({ repo: world.repo, sub: path.join(world.repo, 'sub'), outside: world.outside, linked: world.linked })[name] ?? assert.fail(`unknown cwd ${name}`);

function normaliser(world) {
  return (text) => text.replaceAll(world.root, '<WORLD>').replace(STAMP, '<STAMP>').replace(ISO, '<TS>').replace(/"writer":\{"id":\d+/g, '"writer":{"id":<PID>').replace(/"(?:data_hash|generated_at)": "[^"]*",?\s*/g, '').replace(/(--[a-z-]+)=(?:<\d+>|1\b|\/tmp\b)/g, '$1=<V>');
}

/** What a run left under the world, relative to it: each file's path, mode and normalised text, Git objects left out. */
function disk(world, norm) {
  const out = {};
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, entry.name);
      const rel = norm(path.relative(world.root, full));
      if (entry.name === '.git' || rel.includes('.fgos/runtime') || rel.startsWith('state/git-')) continue;
      if (entry.isDirectory()) {
        out[`${rel}/`] = null;
        walk(full);
      } else if (entry.isFile()) {
        const text = faultLog(rel, norm(fs.readFileSync(full, 'utf8')));
        if (text === null) continue;
        out[rel] = `${(fs.statSync(full).mode & 0o777).toString(8)} ${path.basename(full) === 'machine-id' ? text.replace(MACHINE_ID, '<MACHINE-ID>') : text}`;
      }
    }
  };
  walk(world.root);
  const logs = 'repo/.fgos/logs/';
  if (!Object.keys(out).some((key) => key.startsWith(logs) && key !== logs)) delete out[logs];
  return out;
}

/**
 * The invocation-fault log without the records that depend on timing or on words of a lifecycle trigger: the
 * detached `events sync` child (it fails or not depending on whether the world still exists when it runs), and
 * the end trigger's text for a project root Git cannot establish (the host's trigger words it by its own cause).
 * A log left with no record is no file.
 */
function faultLog(rel, text) {
  if (!rel.endsWith('invocation-faults.jsonl')) return text;
  const kept = text.split('\n').filter((line) => line && !line.includes('"faultClass":"event-store-child"'))
    .map((line) => (line.includes('"faultClass":"event-store-end-trigger"') ? line.replace(/"message":"[^"]*(?:\\"[^"]*)*","cwd"/, '"message":"<END-TRIGGER-REFUSAL>","cwd"') : line));
  return kept.length === 0 ? null : `${kept.join('\n')}\n`;
}

/** The refs of the project: what the Event Store or Git recovery left. */
const refs = (world) => (fs.existsSync(path.join(world.repo, '.git')) ? git(world.repo, 'for-each-ref', '--format=%(refname)').split('\n').sort() : []);

async function runScript(entry, testCase) {
  const world = await makeWorld(testCase.world);
  const norm = normaliser(world);
  const outputs = [];
  const children = [];
  try {
    if (world.readOnlyHome) fs.chmodSync(path.join(world.home, '.fgos'), 0o500);
    for (const step of testCase.steps) {
      if (step.do) {
        act(world, step);
        continue;
      }
      const args = step.args.map((arg) => arg.replace('<repo>', world.repo).replace('<outside>', world.outside));
      const result = await runCaseOnEntry(entry, {
        id: testCase.id,
        args,
        cwd: cwdOf(world, step.cwd),
        env: { HOME: world.home, USERPROFILE: world.home, TMPDIR: world.tmp, FGOS_STATE_ROOT: world.state, NO_COLOR: '1' },
        timeoutMs: 120000,
        modes: ['exact-bytes'],
      });
      assert.equal(result.launchError, null, `${testCase.id}: ${JSON.stringify(result.launchError)}`);
      children.push(...result.spawnedChildren);
      outputs.push({ args: step.args, exit: result.exitCode, stdout: norm(result.stdoutText).replace(MACHINE_ID, '<MACHINE-ID>'), stderr: norm(result.stderrText) });
    }
    // A run leaves no store above its own tree: a stray `.fgos` there would make a later fixture treat that directory as its project.
    for (let dir = path.dirname(world.root); ; dir = path.dirname(dir)) {
      assert.ok(!fs.existsSync(path.join(dir, '.fgos')), `${testCase.id}: a run left ${path.join(dir, '.fgos')} above its fixture`);
      if (dir === path.dirname(dir)) break;
    }
    assert.ok(!fs.existsSync(path.join(world.outside, '.fgos')), `${testCase.id}: a run created a store outside any repository`);
    return { outputs, disk: disk(world, norm), refs: refs(world), children };
  } finally {
    fs.chmodSync(path.join(world.home, '.fgos'), 0o700);
    fs.rmSync(world.root, { recursive: true, force: true });
  }
}

/** The one key the host adds to the answer where the activation fence is missing. */
const WAL_FENCE_WARNING = ',"gitWalWarning":"Git WAL not initialised: git-fence-missing; run `fgctl init` (or `fgctl upgrade`) in this project to place the activation fence, then run fgos init again"';

/** Runs one case on the base release (entry A) and the host (entry B), each on a fresh world, and compares them. */
export async function runPreparedCase(entryA, entryB, testCase) {
  const differences = [];
  try {
    const [base, host] = [await runScript(entryA, testCase), await runScript(entryB, testCase)];
    // Accepted change: the host also creates the Git WAL, and without the activation fence it says so (the base
    // release never touched the WAL). The warning is pinned here and left out of the comparison.
    if (testCase.world.fence === false) {
      for (const output of host.outputs) {
        assert.ok(output.stdout.includes(WAL_FENCE_WARNING), `${testCase.id}: the host did not warn about the missing fence: ${output.stdout}`);
        output.stdout = output.stdout.replace(WAL_FENCE_WARNING, '');
      }
    }
    const same = (left, right, what) => {
      try { assert.deepEqual(left, right); } catch (error) { differences.push(`${what} differ: ${error.message.split('\n').slice(0, 60).join('\n')}`); }
    };
    same(host.outputs, base.outputs, 'the calls');
    same(host.disk, base.disk, 'what the run left on disk (HOME, project, state root)');
    same(host.refs, base.refs, 'the refs of the project');
    // The only Node the host starts is the bridge's Work store step, once per call that reaches it.
    const nodeStarts = host.children.filter((child) => path.basename(child.cmd) === 'node').length;
    const calls = testCase.steps.filter((step) => step.args).length;
    if (nodeStarts > calls) differences.push(`the host started ${nodeStarts} node children for ${calls} call(s)`);
  } catch (error) {
    differences.push(String(error.message ?? error));
  }
  return { caseId: testCase.id, passed: differences.length === 0, differences };
}
