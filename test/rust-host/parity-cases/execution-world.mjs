// The world the four Execution read-door parity tables (`dispatch-decide`, `dispatch-explain`,
// `hook-dispatch-decide`, `agents`) run their calls in, and the one runner they share. A table is
// `{ cases, runPreparedCase }`; this module gives it `runTable`, so each table lists only its cases.
//
// A case is `{ id, steps, world? }`. A step is `{ do: <action>, ... }` (prepares the world) or `{ args, cwd?, stdin?,
// env? }` (one call, answered by the base release and by the host). `cwd` is `repo` (default), `sub`, `outside` (a
// directory that is no repository), `linked` (a linked worktree of `repo`). A world has a git project with one
// commit, its own HOME with a private `.fgos`, TMPDIR and state root, and no `claude` on PATH.
//
// Both entries are compared on exit status, stdout and stderr with the world, the runtime paths and the answers'
// time and hash replaced by tokens. The host starts no Node child for these calls (the Work hint of
// `decide --work` is the one that does, and it has its own wiring test in `apps/fgos/tests/cli_tests.rs`, so no
// table case names `--work` with an item).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { strict as assert } from 'node:assert';

import { runCaseOnEntry } from '../harness.mjs';
import { initFixtureRepo } from '../../helpers/git-fixture.mjs';
import { writeRawGlobalConfig, writeRawProjectConfig } from '../../helpers/config-fixture.mjs';

/** The global config of a world that registers an executor served by a CLI: `decide outproc` is out-of-process. */
export const OUT_OF_PROCESS_GLOBAL = [
  'runner:',
  '  executors:',
  '    outproc:',
  '      kind: agent',
  '      providerModel: claude',
  '      invocations:',
  '        - id: outproc-cli',
  '          via: cli',
  '          adapter: cli-spawn',
  '          command: claude',
  '          args: ["-p"]',
  '',
].join('\n');

/** The base release's own payload, which the host entry reads too, so both entries list the same shipped personas. */
function basePayloadEnv() {
  const file = process.env.FGOS_TEST_PARITY_BASE;
  assert.ok(file, 'FGOS_TEST_PARITY_BASE is not set');
  const base = JSON.parse(fs.readFileSync(file, 'utf8'));
  return { FGOS_ACTIVE_RELEASE_PATH: base.releasePath, FGOS_ACTIVE_MANIFEST_PATH: base.manifestPath };
}

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g;
const ISO = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/g;

function git(cwd, ...args) {
  return execFileSync('git', ['-C', cwd, ...args], { stdio: 'pipe', encoding: 'utf8' });
}

const write = (file, text) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
};

export function makeWorld() {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'erdpar-')));
  const dirs = Object.fromEntries(['repo', 'home', 'tmp', 'state', 'outside'].map((name) => [name, path.join(root, name)]));
  for (const dir of Object.values(dirs)) fs.mkdirSync(dir);
  fs.chmodSync(dirs.state, 0o700);
  fs.mkdirSync(path.join(dirs.home, '.fgos'), { mode: 0o700 });
  fs.writeFileSync(path.join(dirs.state, 'machine-id'), 'parity-machine\n');
  initFixtureRepo(dirs.repo);
  fs.mkdirSync(path.join(dirs.repo, 'sub'));
  return { root, ...dirs };
}

/** What a step of kind `do` does to the world. */
function act(world, step) {
  const project = world.repo;
  switch (step.do) {
    case 'globalConfig':
      writeRawGlobalConfig(world.home, step.text);
      return;
    case 'projectConfig':
      writeRawProjectConfig(project, step.text);
      return;
    case 'file':
      write(path.join(project, step.path), step.text);
      return;
    case 'linkedWorktree':
      world.linked = path.join(world.root, 'linked');
      git(project, 'worktree', 'add', '-q', '-b', 'linked-branch', world.linked);
      return;
    case 'noCommit':
      // A repository with no commit: a fresh one beside the project.
      world.empty = path.join(world.root, 'empty');
      fs.mkdirSync(world.empty);
      git(world.empty, 'init', '-q');
      return;
    default:
      assert.fail(`unknown step ${step.do}`);
  }
}

const cwdOf = (world, name = 'repo') => ({
  repo: world.repo,
  sub: path.join(world.repo, 'sub'),
  outside: world.outside,
  linked: world.linked,
  empty: world.empty,
})[name] ?? assert.fail(`unknown cwd ${name}`);

function normaliser(world, entry) {
  const runtime = ['FGOS_ACTIVE_MANIFEST_PATH', 'FGOS_HOST_BIN', 'FGOS_ACTIVE_RELEASE_PATH']
    .map((name) => ({ ...process.env, ...(entry.env ?? {}) })[name])
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  return (text) => {
    let out = text.replaceAll(world.root, '<WORLD>');
    for (const known of runtime) out = out.replaceAll(known, '<RUNTIME>');
    return out
      .replace(/<RUNTIME>(?:\/\.fgos\/runtime\/git-addon\/[0-9a-f]+)?/g, '<RUNTIME>')
      // The one decided difference: the host's decide usage names the verb the caller types, the Node text a script path
      // (the contract `decide.v1.json` records both as `expect` and `nativeExpect`).
      .replace('usage: node src/runner/dispatch.mjs decide', 'usage: fgos dispatch decide')
      .replace(UUID, '<UUID>')
      .replace(ISO, '<TS>')
      .replace(/"data_hash": "[0-9a-f]{64}"/g, '"data_hash": "<H64>"');
  };
}

async function runScript(entry, testCase) {
  const world = makeWorld();
  const norm = normaliser(world, entry);
  const outputs = [];
  const children = [];
  try {
    for (const step of testCase.steps) {
      if (step.do) {
        act(world, step);
        continue;
      }
      const result = await runCaseOnEntry(entry, {
        id: testCase.id,
        args: step.args.map((arg) => arg.replaceAll('$REPO', world.repo).replaceAll('$OUTSIDE', world.outside)),
        cwd: cwdOf(world, step.cwd),
        stdin: step.stdin?.replaceAll('$REPO', world.repo).replaceAll('$OUTSIDE', world.outside),
        env: {
          HOME: world.home, USERPROFILE: world.home, TMPDIR: world.tmp, FGOS_STATE_ROOT: world.state,
          XDG_RUNTIME_DIR: path.join(world.root, 'no-runtime'), NO_COLOR: '1', CLAUDE_PROJECT_DIR: '',
          ...(entry.env ? {} : basePayloadEnv()),
          ...Object.fromEntries(Object.entries(step.env ?? {}).map(([key, value]) => [key, value.replaceAll('$REPO', world.repo)])),
        },
        timeoutMs: 180000,
        modes: ['exact-bytes'],
      });
      assert.equal(result.launchError, null, `${testCase.id}: ${JSON.stringify(result.launchError)}`);
      children.push(...result.spawnedChildren);
      outputs.push({ args: step.args, exit: result.exitCode, stdout: norm(result.stdoutText), stderr: norm(result.stderrText) });
    }
    for (let dir = path.dirname(world.root); ; dir = path.dirname(dir)) {
      assert.ok(!fs.existsSync(path.join(dir, '.fgos')), `${testCase.id}: a run left ${path.join(dir, '.fgos')} above its fixture`);
      if (dir === path.dirname(dir)) break;
    }
    return { outputs, children };
  } finally {
    fs.rmSync(world.root, { recursive: true, force: true });
  }
}

/** Runs one case on the base release (entry A) and the host (entry B), each on a fresh world, and compares them. */
export async function runTable(entryA, entryB, testCase) {
  const differences = [];
  try {
    const [base, host] = [await runScript(entryA, testCase), await runScript(entryB, testCase)];
    try { assert.deepEqual(host.outputs, base.outputs); } catch (error) { differences.push(`the calls differ: ${error.message.split('\n').slice(0, 60).join('\n')}`); }
    const nodeStarts = host.children.filter((child) => path.basename(child.cmd) === 'node').length;
    if (nodeStarts > 0) differences.push(`the host started ${nodeStarts} node children`);
  } catch (error) {
    differences.push(String(error.message ?? error));
  }
  return { caseId: testCase.id, passed: differences.length === 0, differences };
}

/** `{ cases, add, call }` helpers of a table named `name` whose calls start with `prefix`. */
export function tableOf(name, prefix) {
  const cases = [];
  return {
    cases,
    call: (args, extra = {}) => ({ args: [...prefix, ...args], ...extra }),
    add: (id, steps) => cases.push({ id: `${name}-${id}`, steps }),
  };
}
