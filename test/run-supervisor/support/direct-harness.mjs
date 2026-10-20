// A real project for the direct-mode tests: a git repository with a bwrap-confined executor whose agent is
// fixtures/direct-agent.mjs, and `fgos run` started as a real process, the way a person starts it.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { makeFixtureDir } from '../../helpers/fixture-dir.mjs';

export const BIN_FGOS = path.resolve('bin/fgos.mjs');
const AGENT = path.resolve('test/run-supervisor/fixtures/direct-agent.mjs');

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function waitUntil(predicate, { timeoutMs = 30_000, intervalMs = 5, what = 'condition' } = {}) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = predicate();
    if (value) return value;
    if (Date.now() > deadline) throw new Error(`timed out after ${timeoutMs} ms waiting for ${what}`);
    await sleep(intervalMs);
  }
}

export function bwrapUsable() {
  const probe = spawnSync('/usr/bin/bwrap', ['--unshare-pid', '--as-pid-1', '--ro-bind', '/', '/', '--proc', '/proc', 'true']);
  return probe.status === 0;
}

export function pidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; } catch (err) { return err.code === 'EPERM'; }
}

/** Host pids whose command line carries `token` (a grandchild of an agent in its own pid namespace has no host pid we know). */
export function pidsWithToken(token) {
  const found = [];
  for (const entry of fs.readdirSync('/proc')) {
    if (!/^\d+$/.test(entry)) continue;
    try {
      if (fs.readFileSync(`/proc/${entry}/cmdline`, 'utf8').includes(token)) found.push(Number(entry));
    } catch { /* gone */ }
  }
  return found;
}

export function killToken(token) {
  for (const pid of pidsWithToken(token)) { try { process.kill(pid, 'SIGKILL'); } catch { /* gone */ } }
}

const git = (cwd, ...args) => execFileSync('git', args, { cwd, stdio: 'ignore' });

/** `agent` options reach the agent through AGENT_OPTS; `config` is merged into .fgos/config.json. */
export function createProject({ agent = {}, runner = {}, dispatch = null, timeoutMs = 30_000 } = {}) {
  const repoDir = makeFixtureDir('fgos-direct-repo-');
  const stateDir = makeFixtureDir('fgos-direct-state-');
  const tmpDir = makeFixtureDir('fgos-direct-tmp-');
  git(repoDir, 'init', '-b', 'main');
  git(repoDir, 'config', 'user.name', 'Direct Test');
  git(repoDir, 'config', 'user.email', 'direct@test.local');
  fs.writeFileSync(path.join(repoDir, 'README.md'), '# Direct\n');
  git(repoDir, 'add', 'README.md');
  git(repoDir, 'commit', '-m', 'init');
  fs.mkdirSync(path.join(repoDir, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(repoDir, '.fgos', 'config.json'), JSON.stringify({
    runner: {
      defaultExecutor: 'noisy',
      rigorToTier: { standard: 'standard' },
      modelPolicies: { noisy: { standard: 'noisy-model' } },
      timeoutMs,
      executors: {
        noisy: {
          kind: 'agent',
          allowCrossProvider: true,
          providerModel: 'noisy',
          invocations: [{
            id: 'noisy-cli', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' },
            command: process.execPath, args: [AGENT, '{prompt}'], env: { AGENT_OPTS: JSON.stringify(agent) },
          }],
        },
      },
      capabilities: { 'docs:write': { prefer: ['noisy'] } },
      ...runner,
    },
    ...(dispatch ? { dispatch } : {}),
  }, null, 2));
  const env = { ...process.env, XDG_STATE_HOME: stateDir, HOME: repoDir, TMPDIR: tmpDir };
  delete env.CLAUDE_CODE_SESSION_ID;
  delete env.CODEX_THREAD_ID;
  delete env.FGOS_SESSION_ID;
  return {
    repoDir, stateDir, tmpDir, env,
    /** Change what the agent does (and the run timeout) for the runs started from now on. */
    reconfigure({ agent: nextAgent, timeoutMs: nextTimeoutMs } = {}) {
      const file = path.join(repoDir, '.fgos', 'config.json');
      const config = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (nextAgent) config.runner.executors.noisy.invocations[0].env = { AGENT_OPTS: JSON.stringify(nextAgent) };
      if (nextTimeoutMs) config.runner.timeoutMs = nextTimeoutMs;
      fs.writeFileSync(file, JSON.stringify(config, null, 2));
    },
    unitFile(id, extra = {}) {
      const file = path.join(repoDir, `${id}.json`);
      fs.writeFileSync(file, JSON.stringify({ id, objective: `Run ${id}`, capability: 'docs:write', writes: [], ...extra }));
      return file;
    },
    /** Every attempt directory (`runs/NN`) under the assignments tree. */
    attemptDirs() {
      const root = path.join(repoDir, '.fgos', 'assignments');
      const found = [];
      const walk = (dir) => {
        let entries;
        try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          const child = path.join(dir, entry.name);
          // A dot name under runs/ is a run directory still being staged; it is renamed into place, never run from.
          if (path.basename(dir) === 'runs') { if (!entry.name.startsWith('.')) found.push(child); } else walk(child);
        }
      };
      walk(root);
      return found.sort();
    },
    homesLeft() {
      const root = path.join(tmpDir, 'fgos-confinement');
      try { return fs.readdirSync(root).filter((name) => fs.readdirSync(path.join(root, name)).length > 0); } catch { return []; }
    },
  };
}

/** `fgos run --unit <file>` as a real child process. */
export function startRun(project, unitFile, { cwd = project.repoDir, args = [] } = {}) {
  const child = spawn(process.execPath, [BIN_FGOS, 'run', '--unit', unitFile, '--dir', project.repoDir, ...args], {
    cwd, env: project.env, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  const exited = new Promise((resolve) => child.on('exit', (code, signal) => resolve({ code, signal })));
  return { child, exited, output: () => ({ stdout, stderr }) };
}

export const readJson = (file) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } };
