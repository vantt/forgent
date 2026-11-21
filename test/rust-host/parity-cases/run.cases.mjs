// `fgos run` parity table: every way to run and the refusals of each, on a fresh world per entry (a project with a
// hermetic stub agent executor, its own HOME and machine backend registry, a linked worktree of it). The stub agent is
// a Node script that writes the result a seat reports, confined like every seat (bwrap); no real agent CLI runs. Each
// call compares the exit status, the stderr text and the envelope's data, normalised for what differs between two
// runs (the world's path, ids, times, hashes), with `data.results[-1].runResult.agentClaim.summary` and
// `data.results[-1].commit` named first.
//
// `cwd`: `repo` (the project's main checkout), `wt` (a linked worktree of it), `other` (a second project). Arguments
// may name `$WT`, `$UNIT` (a read-only unit file of the world) and `$REPO`.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { strict as assert } from 'node:assert';

import { runCaseOnEntry } from '../harness.mjs';
import { makeFixtureDir } from '../../helpers/fixture-dir.mjs';
import { activateGitFixture } from '../../helpers/git-fixture.mjs';
import { globalConfigPath, projectConfigPath } from '../../helpers/config-fixture.mjs';

export const cases = [];

const add = (id, args, extra = {}) => cases.push({ id: `run-${id}`, args, cwd: 'repo', ...extra });
const DOCS = ['--capability', 'docs:write'];

// The three ways to run, and what each builds.
add('prompt-read-only', ['Write the release notes', ...DOCS]);
add('prompt-json', ['Write the release notes', ...DOCS, '--json']);
add('provider-as-a-soft-preference', ['Check it', ...DOCS, '--provider', 'test-node']);
add('unit-file', ['--unit', '$UNIT', '--pattern', 'solo']);
add('pattern', ['Check it', ...DOCS, '--pattern', 'solo']);
add('verify-that-finds-problems', ['Write the release notes', ...DOCS, '--pattern', 'solo', '--verify', 'exit 3']);
add('timeout', ['Port the parser', ...DOCS, '--timeout', '90m']);
add('request-parameter', ['Check it', ...DOCS, '--pattern', 'reviewed', '--param', 'maxRounds=1']);
add('writes-from-a-linked-worktree', ['Write notes', ...DOCS, '--writes', 'notes.md', '--worktree', '$WT']);
add('sync-only-unit', ['--sync', 'main', ...DOCS, '--writes', 'docs'], { cwd: 'wt' });
add('resume-of-a-run-with-no-record', ['--resume', 'unit-run-no-such']);
add('case-that-does-not-exist', ['Check it', ...DOCS, '--case', 'wf-missing', '--activity', 'review']);
add('dir-naming-another-project', ['Check it', ...DOCS, '--dir', '$REPO'], { cwd: 'other' });

// Refusals before any unit run exists.
add('unknown-provider', ['Check it', ...DOCS, '--provider', 'no-such-executor']);
add('writes-outside-a-linked-worktree', ['Write notes', ...DOCS, '--writes', 'notes.md']);
add('writes-with-an-empty-list', ['Write notes', ...DOCS, '--writes', ',', '--worktree', '$WT']);
add('case-without-an-activity', ['Check it', ...DOCS, '--case', 'wf-1']);
add('activity-without-a-case', ['Check it', ...DOCS, '--activity', 'review']);
add('sync-without-writes', ['--sync', 'main'], { cwd: 'wt' });
add('timeout-that-is-not-a-duration', ['Check it', ...DOCS, '--timeout', '90min']);
add('timeout-below-the-floor', ['Check it', ...DOCS, '--timeout', '30s']);
add('timeout-with-resume', ['--resume', 'unit-run-x', '--timeout', '90m']);
add('override-tier-above-the-resolved-tier', ['Check it', ...DOCS, '--override', '{"tier":"frontier"}']);
add('prompt-and-unit', ['Check it', '--unit', '$UNIT']);
add('two-prompts', ['Check', 'it']);
add('prompt-only-flag-with-unit', ['--unit', '$UNIT', '--provider', 'test-node']);
add('nothing-to-run', []);
add('params-that-are-not-json', ['Check it', ...DOCS, '--params', '{']);
add('unknown-flag', ['Check it', '--no-such-flag']);

// The stub agent: it writes the report and the result a seat leaves where its brief says, and the notes a writing
// unit is told to write.
const ECHO_WORKER = `
import fs from 'node:fs';
import path from 'node:path';
const prompt = process.argv.slice(2).join(' ');
const match = /Write structured JSON to (\\S+result-1\\.json)/.exec(prompt);
if (match) {
  const dir = path.dirname(match[1]);
  const outbox = path.join(dir, 'worker-output', 'outbox');
  const runDir = fs.existsSync(outbox) ? outbox : dir;
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'report-1.md'), '# Report\\nAssignment execution completed successfully.\\n');
  fs.writeFileSync(path.join(runDir, 'result-1.json'), JSON.stringify({ status: 'done', summary: 'Done' }));
}
// A unit told to write notes writes them where it runs.
if (prompt.includes('Write notes')) fs.writeFileSync('notes.md', 'notes\\n');
`;

const git = (cwd, args) => execFileSync('git', args, { cwd, stdio: 'ignore' });
const writeConfig = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `# @fgos:v1\n\n${JSON.stringify(value, null, 2)}\n`);
};

function makeProject(dir) {
  fs.mkdirSync(dir, { recursive: true });
  git(dir, ['init', '-q', '-b', 'main']);
  git(dir, ['config', 'user.name', 'Parity']);
  git(dir, ['config', 'user.email', 'parity@test.local']);
  activateGitFixture(dir);
  fs.writeFileSync(path.join(dir, '.gitignore'), '.fgos/\n');
  fs.writeFileSync(path.join(dir, 'README.md'), '# Parity\n');
  git(dir, ['add', '.gitignore', 'README.md']);
  git(dir, ['commit', '-q', '-m', 'init']);
}

/** A world: a project with the stub executor, a linked worktree of it, a second project and their machine. */
function makeWorld() {
  const root = fs.realpathSync(makeFixtureDir('fgos-parity-run-'));
  const world = { root, home: path.join(root, 'home'), repo: path.join(root, 'repo'), wt: path.join(root, 'wt'), other: path.join(root, 'other') };
  fs.mkdirSync(world.home, { recursive: true });
  const worker = path.join(root, 'echo-worker.mjs');
  fs.writeFileSync(worker, ECHO_WORKER);
  makeProject(world.repo);
  makeProject(world.other);
  git(world.repo, ['worktree', 'add', '-q', '-b', 'wt', world.wt]);
  // The executor that decides what program runs is a machine key: it lives in the world's global config.
  writeConfig(globalConfigPath(world.home), {
    runner: {
      defaultExecutor: 'test-node',
      executors: {
        'test-node': {
          kind: 'agent', description: 'Test agent', allowCrossProvider: true, providerModel: 'node',
          invocations: [{ id: 'cli-default', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command: process.execPath, args: [worker, '{prompt}'] }],
        },
      },
    },
  });
  const project = {
    runner: {
      defaults: { tier: 'standard' },
      modelPolicies: { node: { nano: 'node-nano', standard: 'node-std', advanced: 'node-adv', flagship: 'node-flagship', frontier: 'node-frontier' } },
      capabilities: { 'docs:write': { prefer: [{ executor: 'test-node' }], rigor: 'standard', tier: 'standard' } },
      patterns: { seatBinding: { schema: 1 } },
      loops: { reviewed: { maxRounds: 2, checkersByRigor: { standard: ['reviewer'] } } },
    },
  };
  writeConfig(projectConfigPath(world.repo), project);
  writeConfig(projectConfigPath(world.other), project);
  world.unit = path.join(root, 'unit.yaml');
  fs.writeFileSync(world.unit, 'id: u-parity\nobjective: Test objective\ncapability: docs:write\nwrites: []\n');
  world.registry = path.join(root, 'confinement-backends.json');
  fs.writeFileSync(world.registry, JSON.stringify({ contract: 'confinement-backend-registry.v1', confinementBackends: { bwrap: { type: 'bwrap', enabled: true, executable: '/usr/bin/bwrap' } } }));
  return world;
}

/** The agent CLIs the shipped standard names: no directory holding one is on a world's PATH, so no real seat can start. */
const AGENT_CLIS = ['claude', 'codex', 'gemini', 'pi', 'agy', 'omp'];
const AGENT_FREE_PATH = (process.env.PATH ?? '').split(path.delimiter)
  .filter((dir) => dir && !AGENT_CLIS.some((cli) => fs.existsSync(path.join(dir, cli))))
  .join(path.delimiter);

const ISO = /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z\b/g;

/** Two runs of the same call differ in the world's path, the ids they mint, the times and the hashes of what they wrote. */
function normaliser(world) {
  return (text) => text
    .replaceAll(world.root, '<WORLD>')
    .replace(/unit-run-\d+-[0-9a-f]+/g, 'unit-run-<ID>')
    .replace(/(adhoc-[a-z0-9-]*?-)[0-9a-f]{4}\b/g, '$1<HEX>')
    .replace(/\b(?:asg|att|run|rsv|lease|attempt)-[0-9A-Za-z_-]{6,}/g, '<ID>')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/g, '<UUID>')
    .replace(ISO, '<TS>')
    .replace(/sha256:[0-9a-f]{64}/g, 'sha256:<H64>')
    .replace(/\b[0-9a-f]{64}\b/g, '<H64>')
    .replace(/\b[0-9a-f]{40}\b/g, '<SHA>')
    // A JSON parser's own complaint is the language runtime's text (V8 against serde_json), not fgOS's.
    .replace(/(--params must be valid JSON: )[^\n"]*/g, '$1<JSON-PARSE-ERROR>')
    .replace(/"(durationMs|elapsedMs|startedAtMs|endedAtMs|pid|atMs)": \d+/g, '"$1": "<N>"');
}

const argOf = (world) => (arg) => ({ $WT: world.wt, $UNIT: world.unit, $REPO: world.repo })[arg] ?? arg;
const cwdOf = (world, name) => ({ repo: world.repo, wt: world.wt, other: world.other })[name] ?? assert.fail(`unknown cwd ${name}`);

/** The envelope's data, or the raw text when stdout is no envelope. */
function dataOf(text) {
  try {
    return JSON.parse(text).data;
  } catch {
    return { text };
  }
}

async function runOn(entry, testCase) {
  const world = makeWorld();
  const norm = normaliser(world);
  try {
    const result = await runCaseOnEntry(entry, {
      id: testCase.id,
      args: ['run', ...testCase.args.map(argOf(world))],
      cwd: cwdOf(world, testCase.cwd),
      env: { PATH: AGENT_FREE_PATH, HOME: world.home, USERPROFILE: world.home, FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH: world.registry, FGOS_CLAUDE_COMMAND: '/nonexistent/fgos-parity-claude', NO_COLOR: '1' },
      timeoutMs: 180000,
      modes: ['exact-bytes'],
    });
    assert.equal(result.launchError, null, `${testCase.id}: ${JSON.stringify(result.launchError)}`);
    const data = dataOf(norm(result.stdoutText));
    const last = Array.isArray(data?.results) ? data.results.at(-1) : undefined;
    return {
      exit: result.exitCode,
      stderr: norm(result.stderrText),
      summary: last?.runResult?.agentClaim?.summary,
      commit: last?.commit,
      data,
    };
  } finally {
    fs.rmSync(world.root, { recursive: true, force: true });
  }
}

/** Runs one case on the base release (entry A) and the host (entry B), each on a fresh world, and compares them. */
export async function runPreparedCase(entryA, entryB, testCase) {
  const differences = [];
  try {
    const [base, host] = [await runOn(entryA, testCase), await runOn(entryB, testCase)];
    const same = (left, right, what) => {
      try { assert.deepEqual(left, right); } catch (error) { differences.push(`${what} differ: ${error.message.split('\n').slice(0, 80).join('\n')}`); }
    };
    same(host.exit, base.exit, 'the exit statuses');
    same(host.summary, base.summary, 'the agent claim summaries');
    same(host.commit, base.commit, 'the commits');
    same(host.stderr, base.stderr, 'the stderr texts');
    same(host.data, base.data, 'the envelope data');
  } catch (error) {
    differences.push(String(error.message ?? error));
  }
  return { caseId: testCase.id, passed: differences.length === 0, differences };
}
