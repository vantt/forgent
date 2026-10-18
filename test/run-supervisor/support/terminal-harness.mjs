// A project for the terminal-mode tests: a git repository, a fake herdr that keeps one real pane
// (the python stand-in the Rust supervisor tests use), a herdr "server" socket this process listens on,
// and a controller started as its own process so a test can kill it. The agent is a real process the
// gate starts in the pane; what the pane's screen shows and what an agent protocol sees is whatever the
// test writes into the fake's files.
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { makeFixtureDir } from '../../helpers/fixture-dir.mjs';

export const FAKE_HERDR = path.resolve('packages/run-supervisor/rust/tests/fixtures/fake-herdr-pane.py');
const AGENT = path.resolve('test/run-supervisor/fixtures/terminal-agent.mjs');
const CONTROLLER = path.resolve('test/run-supervisor/fixtures/terminal-controller.mjs');

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function waitUntil(predicate, { timeoutMs = 60_000, intervalMs = 20, what = 'condition' } = {}) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = predicate();
    if (value) return value;
    if (Date.now() > deadline) throw new Error(`timed out after ${timeoutMs} ms waiting for ${what}`);
    await sleep(intervalMs);
  }
}

export const readJson = (file) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } };
const readLines = (file) => { try { return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean); } catch { return []; } };

const VERDICTS = {
  idle: { agent: 'claude', state: 'idle', visible_idle: true, visible_working: false, visible_blocker: false, matched_rule: { id: 'live_prompt_box', priority: 950, region: 'prompt_box_body', state: 'idle' }, evaluated_rules: [{ id: 'live_prompt_box', matched: true, evidence: { region_preview: '' } }] },
  working: { agent: 'claude', state: 'working', visible_idle: false, visible_working: true, visible_blocker: false },
  blocked: { agent: 'claude', state: 'blocked', visible_idle: false, visible_working: false, visible_blocker: true },
};

/** The environment the host, the supervisor and the controller share. */
function sharedEnv(project) {
  const env = { ...process.env };
  for (const name of ['CLAUDE_CODE_SESSION_ID', 'CODEX_THREAD_ID', 'FGOS_SESSION_ID', 'HERDR_PANE_ID', 'HERDR_TAB_ID', 'HERDR_WORKSPACE_ID', 'HERDR_SESSION']) delete env[name];
  return {
    ...env,
    FGOS_HERDR_BIN: project.herdrBin,
    HERDR_SOCKET_PATH: project.herdrSocket,
    FGOS_STATE_ROOT: project.stateRoot,
    TERMINAL_AGENT_DIR: project.agentDir,
    ...(project.registryPath ? { FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH: project.registryPath } : {}),
  };
}

/** bwrap with a pid namespace works on this machine. */
export function bwrapUsable() {
  return spawnSync('/usr/bin/bwrap', ['--unshare-pid', '--as-pid-1', '--ro-bind', '/', '/', '--proc', '/proc', 'true']).status === 0;
}

/**
 * `confined`: the repository and the agent's own files live outside /tmp (a confined agent gets a private
 * tmpfs over /tmp), and the machine's bwrap backend registry is a file of the project's own.
 */
export async function createTerminalProject({ name = 'tp', confined = false } = {}) {
  // A unix socket path is limited to about a hundred characters; everything socket-ish lives under /tmp.
  const scratch = fs.mkdtempSync(path.join('/tmp', `fgos-${name}-`));
  const outside = confined ? makeFixtureDir(`fgos-${name}-`) : scratch;
  const repoDir = path.join(outside, 'repo');
  const herdrDir = path.join(scratch, 'herdr-files');
  const agentDir = path.join(outside, 'agent');
  const stateRoot = path.join(scratch, 'state');
  for (const dir of [repoDir, herdrDir, agentDir, stateRoot]) fs.mkdirSync(dir, { recursive: true });
  const git = (...args) => execFileSync('git', args, { cwd: repoDir, stdio: 'ignore' });
  git('init', '-b', 'main');
  git('config', 'user.name', 'Terminal Test');
  git('config', 'user.email', 'terminal@test.local');
  fs.writeFileSync(path.join(repoDir, 'README.md'), '# Terminal\n');
  git('add', 'README.md');
  git('commit', '-m', 'init');

  // The supervisor reaches herdr through `FGOS_HERDR_BIN` and nothing else of this environment, so the
  // fake's own directory is baked into a wrapper instead of travelling as a variable.
  const herdrBin = path.join(scratch, 'herdr');
  fs.writeFileSync(herdrBin, `#!/bin/sh\nFAKE_HERDR_DIR=${herdrDir} exec ${FAKE_HERDR} "$@"\n`, { mode: 0o755 });

  const herdrSocket = path.join(scratch, 'herdr.sock');
  const server = net.createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(herdrSocket, resolve); });

  let registryPath = null;
  if (confined) {
    registryPath = path.join(scratch, 'confinement-backends.json');
    fs.writeFileSync(registryPath, JSON.stringify({ contract: 'confinement-backend-registry.v1', confinementBackends: { bwrap: { type: 'bwrap', enabled: true, executable: '/usr/bin/bwrap' } } }));
  }

  const project = {
    registryPath, scratch, repoDir, herdrDir, agentDir, stateRoot, herdrSocket, herdrBin,
    children: [],
    worktreeDir: null,
    env() { return sharedEnv(project); },

    /** A linked worktree of the project's repository, for a unit that declares `writes`. */
    addWorktree() {
      project.worktreeDir = path.join(outside, 'worktree');
      git('worktree', 'add', '-b', 'unit-branch', project.worktreeDir);
      return project.worktreeDir;
    },

    /** An executor whose agent is the fixture. `commandName` makes the CLI the agent protocol sees (codex, ...). */
    executor({ kind = 'claude', commandName = null, confinement = null } = {}) {
      let command = process.execPath;
      let args = [AGENT, '{prompt}'];
      if (commandName) {
        fs.mkdirSync(path.join(outside, 'bin'), { recursive: true });
        command = path.join(outside, 'bin', commandName);
        fs.writeFileSync(command, `#!/bin/sh\nexec ${process.execPath} ${AGENT} "$@"\n`, { mode: 0o755 });
        args = ['{prompt}'];
      }
      return {
        kind: 'agent',
        command,
        args,
        adapter: 'herdr-spawn',
        allowCrossProvider: true,
        env: { TERMINAL_AGENT_DIR: agentDir },
        interactiveMode: { exitCommand: '/exit', kind },
        ...(confinement ? { confinement } : {}),
      };
    },

    /** The controller as a process: `fgos run`'s own door (`executeAssignment`) for one herdr-spawn seat. */
    startController({ env: extraEnv = {}, ...job } = {}) {
      // The Assignment is built from this checkout's task specs, so the controller starts in it; the work
      // happens in `repoDir` (the job's cwd).
      const child = spawn(process.execPath, [CONTROLLER], {
        cwd: process.cwd(),
        env: { ...project.env(), ...extraEnv, TERMINAL_CONTROLLER_JOB: JSON.stringify({ repoDir, workId: job.workId ?? `tsk-${name}`, executor: project.executor(), ...job }) },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (chunk) => { stdout += chunk; });
      child.stderr.on('data', (chunk) => { stderr += chunk; });
      const exited = new Promise((resolve) => child.on('exit', (code, signal) => resolve({ code, signal })));
      const run = {
        child, exited,
        output: () => ({ stdout, stderr }),
        /** The one JSON line the controller prints when it settles. */
        answer: () => { try { return JSON.parse(stdout.trim().split('\n').filter((l) => l.startsWith('{')).pop()); } catch { return null; } },
      };
      project.children.push(child);
      return run;
    },

    /**
     * `fgos run --unit <file>` as a real process, the door a person uses, in a project whose one executor has
     * a confined headless invocation and a confined herdr-spawn one: with herdr present bind() picks the pane.
     */
    startFgosRun({ unit = {}, executorId = 'seat', executorIds = [executorId], worktree = null, herdrConfinement = { backend: 'bwrap' } } = {}) {
      const configDir = path.join(repoDir, '.fgos');
      fs.mkdirSync(configDir, { recursive: true });
      const executor = project.executor({ commandName: 'claude', confinement: herdrConfinement });
      fs.writeFileSync(path.join(configDir, 'config.json'), JSON.stringify({
        runner: {
          defaultExecutor: executorIds[0],
          rigorToTier: { standard: 'standard' },
          timeoutMs: 60_000,
          executors: Object.fromEntries(executorIds.map((id) => [id, {
            kind: 'agent',
            allowCrossProvider: true,
            providerModel: id,
            invocations: [
              { id: `${id}-cli`, via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command: executor.command, args: ['{prompt}'] },
              { id: `${id}-herdr`, via: 'cli', adapter: 'herdr-spawn', confinement: herdrConfinement, command: executor.command, args: ['{prompt}'], env: executor.env, interactiveMode: executor.interactiveMode, resourceBindings: [{ resource: 'private-home', target: { kind: 'env', name: 'HOME' } }] },
            ],
          }])),
          modelPolicies: Object.fromEntries(executorIds.map((id) => [id, { standard: 'sonnet' }])),
          capabilities: { 'docs:write': { prefer: executorIds.map((id) => ({ executor: id, invocation: `${id}-cli` })) } },
        },
      }, null, 2));
      const unitFile = path.join(repoDir, 'unit.json');
      fs.writeFileSync(unitFile, JSON.stringify({ id: 'u-1', objective: 'Inspect the docs', capability: 'docs:write', writes: [], ...unit }));
      const child = spawn(process.execPath, [path.resolve('bin/fgos.mjs'), 'run', '--unit', unitFile, '--dir', repoDir, ...(worktree ? ['--worktree', worktree] : [])], {
        cwd: repoDir,
        env: { ...project.env(), HERDR_ENV: '1' },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (chunk) => { stdout += chunk; });
      child.stderr.on('data', (chunk) => { stderr += chunk; });
      project.children.push(child);
      return { child, exited: new Promise((resolve) => child.on('exit', (code, signal) => resolve({ code, signal }))), output: () => ({ stdout, stderr }) };
    },

    // --- the fake herdr ---------------------------------------------------------------------------
    calls() { return readLines(path.join(herdrDir, 'calls.log')).map((l) => l.replace(/\t+$/, '').replaceAll('\t', ' ')); },
    callsStarting(prefix) { return project.calls().filter((c) => c.startsWith(prefix)); },
    sent() { return readLines(path.join(herdrDir, 'sent.jsonl')).map((l) => JSON.parse(l)); },
    setVerdict(kind) { fs.writeFileSync(path.join(herdrDir, 'explain.json'), JSON.stringify(VERDICTS[kind])); },
    setFlag(flag, on = true) { const file = path.join(herdrDir, flag); if (on) fs.writeFileSync(file, ''); else fs.rmSync(file, { force: true }); },
    setScreen(text) { fs.writeFileSync(path.join(herdrDir, 'screen.txt'), text); },

    // --- the agent --------------------------------------------------------------------------------
    /** What the agent wrote: next to the test's own files, or in its private home when it is confined. */
    agentNote(name) {
      const own = path.join(agentDir, name);
      if (fs.existsSync(own)) return own;
      const root = path.join(os.tmpdir(), 'fgos-confinement');
      let homes = [];
      try { homes = fs.readdirSync(root).map((d) => path.join(root, d, 'home', name)).filter((f) => fs.existsSync(f)); } catch { /* none */ }
      return homes.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0] ?? own;
    },
    agentStarts() { return readLines(project.agentNote('agent-starts.txt')).map(Number); },
    agentEnv() { return readJson(project.agentNote('agent-env.json')); },
    letAgentExit() { fs.writeFileSync(path.join(agentDir, 'exit-now'), ''); },

    // --- the attempt ------------------------------------------------------------------------------
    attemptDirs() {
      const root = path.join(repoDir, '.fgos', 'assignments');
      const found = [];
      const walk = (dir) => {
        let entries;
        try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          const child = path.join(dir, entry.name);
          // An attempt directory is `runs/NN`; admission builds it under a staging name first.
          if (path.basename(dir) === 'runs') { if (/^\d{2}$/.test(entry.name)) found.push(child); } else walk(child);
        }
      };
      walk(root);
      return found.sort();
    },
    attemptDir() { return project.attemptDirs()[0] ?? null; },
    /** Wait until the supervisor has typed the brief (the text and the submit key) at the pane. */
    async waitBriefTyped() {
      await waitUntil(() => project.sent().length >= 2, { what: 'the brief typed at the pane' });
      return project.sent()[0].text;
    },
    /** The agent shows the brief taken: the protocol reads `working`, so the supervisor confirms delivery. */
    briefTaken() { project.setVerdict('working'); },
    /** Play the agent's work: what it wrote and the result claim the brief named. */
    writeResult(briefText, { status = 'done', summary = 'terminal mode test finished.' } = {}) {
      const resultPath = /(\S*outbox\/result-1\.json)/.exec(briefText)?.[1];
      if (!resultPath) throw new Error(`the brief names no result path:\n${briefText}`);
      fs.writeFileSync(path.join(repoDir, 'terminal-worker-output.txt'), 'terminal worker mutation\n');
      fs.mkdirSync(path.dirname(resultPath), { recursive: true });
      fs.writeFileSync(`${resultPath}.tmp`, JSON.stringify({ status, summary }));
      fs.renameSync(`${resultPath}.tmp`, resultPath);
      return resultPath;
    },

    stop() {
      for (const child of project.children) { try { child.kill('SIGKILL'); } catch { /* gone */ } }
      try {
        const pid = Number(fs.readFileSync(path.join(herdrDir, 'script.pid'), 'utf8'));
        if (pid > 0) process.kill(pid, 'SIGKILL');
      } catch { /* no pane was ever started */ }
      for (const pid of project.agentStarts()) { try { process.kill(pid, 'SIGKILL'); } catch { /* gone */ } }
      server.close();
      // FGOS_KEEP_TEST_FIXTURES=1 keeps the project for a look at what a failed run left.
      if (process.env.FGOS_KEEP_TEST_FIXTURES) process.stderr.write(`kept terminal test project: ${scratch} (${outside})\n`);
      else fs.rmSync(scratch, { recursive: true, force: true });
    },
  };
  project.setVerdict('idle');
  return project;
}

export const hostBinUsable = () => Boolean(process.env.FGOS_HOST_BIN) && fs.existsSync(process.env.FGOS_HOST_BIN);
export const noHost = !hostBinUsable() && 'FGOS_HOST_BIN must name a host binary built from this checkout';
export const tmpRoot = os.tmpdir();
