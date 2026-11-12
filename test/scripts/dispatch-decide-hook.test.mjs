import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { machineHome, writeProjectConfig, writeRawProjectConfig } from '../helpers/config-fixture.mjs';
import { runHook, normalizeHookPayload } from '../../src/runner/hook.mjs';

// The verdict of the Agent/Task guard, judged in-process: one fixture table run for each payload format (the
// standard one of Claude Code and Codex, and agy's), because both must answer alike. Real configs on real git
// repositories stand behind each row; nothing stands in for `decide`.

const HOME = machineHome();

function mkTempGitRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-decide-hook-'));
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '--allow-empty', '-m', 'init'], { cwd: repoRoot });
  return repoRoot;
}

function writeRunnerConfigFixture(root, cfg) {
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  // A project config in the seat-binding schema: the loader refuses one that has no marker.
  writeProjectConfig(root, { runner: { ...cfg, patterns: { ...cfg.patterns, seatBinding: { schema: 1 } } } });
}

const IN_PROCESS_CONFIG = {
  executor: { command: 'claude', args: ['{prompt}'] },
  modelPolicies: { claude: { standard: 'sonnet' } },
  defaults: { tier: 'standard' },
  timeoutMs: 5000,
};
const OUT_OF_PROCESS_CONFIG = {
  ...IN_PROCESS_CONFIG,
  capabilities: { blocked: { prefer: 'tool-only' } },
  executors: { 'tool-only': { kind: 'tool', command: 'agy', args: ['{prompt}'], allowCrossProvider: true } },
};

/** The payload each format sends for a tool call; `stray` is a cwd the payload claims, which no verdict may read. */
const FORMATS = {
  standard: {
    format: null,
    payload: (project, tool, input, stray) => ({ tool_name: tool, tool_input: input, cwd: stray ?? project }),
    env: (project) => ({ ...process.env, HOME, CLAUDE_PROJECT_DIR: project }),
  },
  agy: {
    format: 'agy',
    payload: (project, tool, input, stray) => ({ toolCall: { name: tool, args: input }, workspacePaths: [project], ...(stray ? { cwd: stray } : {}) }),
    env: () => ({ ...process.env, HOME }),
  },
};

/** What a format's answer says: `blocked`, and the text the agent is shown. */
function verdictOf(format, out) {
  if (format === 'agy') {
    assert.equal(out.exitCode, 0, 'agy always exits 0');
    const decision = JSON.parse(out.stdout.trim());
    return { blocked: decision.decision === 'deny', text: decision.reason ?? '' };
  }
  assert.equal(out.stdout, '', 'the standard protocol answers on stderr');
  return { blocked: out.exitCode === 2, text: out.stderr };
}

async function judge(name, project, tool, input, { stray, cwd = project } = {}) {
  const f = FORMATS[name];
  const out = await runHook('dispatch-decide', {
    stdin: JSON.stringify(f.payload(project, tool, input, stray)),
    format: f.format,
    env: f.env(project),
    cwd,
  });
  return verdictOf(name, out);
}

for (const name of Object.keys(FORMATS)) {
  test(`dispatch-decide hook, ${name} format: an Agent call with no registered executor resolves in-process and passes`, async () => {
    const repo = mkTempGitRepo();
    writeRunnerConfigFixture(repo, IN_PROCESS_CONFIG);
    assert.equal((await judge(name, repo, 'Agent', { subagent_type: 'general-purpose' })).blocked, false);
    // The Task tool is enforced the same way, and a missing subagent_type is the Agent tool's own default.
    assert.equal((await judge(name, repo, 'Task', {})).blocked, false);
  });

  test(`dispatch-decide hook, ${name} format: a call that resolves to a registered out-of-process executor is blocked with a door fgos run accepts`, async () => {
    const repo = mkTempGitRepo();
    writeRunnerConfigFixture(repo, OUT_OF_PROCESS_CONFIG);
    const { blocked, text } = await judge(name, repo, 'Agent', { subagent_type: 'blocked' });
    assert.equal(blocked, true);
    assert.match(text, /BLOCKED/);
    assert.match(text, /fgos run "<prompt>" --capability blocked/);
    assert.match(text, /"tool-only" is a tool executor/);
    assert.doesNotMatch(text, /--provider tool-only|dispatch execute|dispatch\.mjs execute/);
  });

  test(`dispatch-decide hook, ${name} format: a payload cwd of /tmp, a missing path or the home directory is judged against the project, which blocks`, async () => {
    const repo = mkTempGitRepo();
    writeRunnerConfigFixture(repo, OUT_OF_PROCESS_CONFIG);
    for (const stray of ['/tmp', '/nonexistent/elsewhere', os.homedir(), path.dirname(repo)]) {
      // The hook process itself may have been started anywhere too.
      const { blocked } = await judge(name, repo, 'Agent', { subagent_type: 'blocked' }, { stray, cwd: '/tmp' });
      assert.equal(blocked, true, `payload cwd ${stray} must not move the verdict away from the project`);
    }
  });

  test(`dispatch-decide hook, ${name} format: a refused project config blocks, naming the refusal ids and fgos config check`, async () => {
    const repo = mkTempGitRepo();
    fs.mkdirSync(path.join(repo, '.fgos'), { recursive: true });
    writeRawProjectConfig(repo, 'runner: [unclosed\n');
    const { blocked, text } = await judge(name, repo, 'Agent', { subagent_type: 'general-purpose' });
    assert.equal(blocked, true, text);
    assert.match(text, /config-[a-z-]+/);
    assert.match(text, /fgos config check/);
  });

  test(`dispatch-decide hook, ${name} format: an empty payload and a payload that is not JSON allow the call`, async () => {
    const f = FORMATS[name];
    for (const stdin of ['', '   \n', 'not json{{{', '[1,2]', 'null']) {
      const out = await runHook('dispatch-decide', { stdin, format: f.format, env: f.env('/nonexistent'), cwd: '/tmp' });
      assert.equal(verdictOf(name, out).blocked, false, JSON.stringify(stdin));
    }
  });

  test(`dispatch-decide hook, ${name} format: a tool that is not Agent or Task is never judged`, async () => {
    const repo = mkTempGitRepo();
    writeRunnerConfigFixture(repo, OUT_OF_PROCESS_CONFIG);
    assert.equal((await judge(name, repo, 'Bash', { command: 'ls', subagent_type: 'blocked' })).blocked, false);
  });

  test(`dispatch-decide hook, ${name} format: a project directory that does not exist blocks instead of judging some other directory`, async () => {
    const { blocked, text } = await judge(name, '/nonexistent/project', 'Agent', { subagent_type: 'general-purpose' });
    assert.equal(blocked, true);
    assert.match(text, /project directory "\/nonexistent\/project" does not exist/);
  });

  test(`dispatch-decide hook, ${name} format: a project that is not inside any git checkout allows the call`, async () => {
    const notARepo = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-decide-hook-no-git-'));
    assert.equal((await judge(name, notARepo, 'Agent', { subagent_type: 'general-purpose' })).blocked, false);
  });
}

test('the harness project directory is the one a verdict is judged against: the environment first, then the directory the hook started in, never the payload', () => {
  const payload = JSON.stringify({ tool_name: 'Agent', tool_input: {}, cwd: '/payload-cwd' });
  assert.equal(normalizeHookPayload(payload, { env: { CLAUDE_PROJECT_DIR: '/from-env' }, cwd: '/started-here' }).projectDir, '/from-env');
  assert.equal(normalizeHookPayload(payload, { env: {}, cwd: '/started-here' }).projectDir, '/started-here');
  const agy = JSON.stringify({ toolCall: { name: 'Agent', args: {} }, workspacePaths: ['/workspace', '/other'], cwd: '/payload-cwd' });
  assert.equal(normalizeHookPayload(agy, { env: { CLAUDE_PROJECT_DIR: '/from-env' }, cwd: '/started-here' }).projectDir, '/workspace');
});

test('hook entry script: a legacy registration that names the script still gets the same verdict as fgos hook dispatch-decide', () => {
  const repo = mkTempGitRepo();
  writeRunnerConfigFixture(repo, OUT_OF_PROCESS_CONFIG);
  const script = fileURLToPath(new URL('../../scripts/dispatch-decide-hook.mjs', import.meta.url));
  // boundary: the script is only an entry; its exit code and stream are what a registered harness reads
  const result = spawnSync(process.execPath, [script], {
    encoding: 'utf8',
    cwd: repo,
    env: { ...process.env, HOME, CLAUDE_PROJECT_DIR: repo },
    input: JSON.stringify({ tool_name: 'Agent', tool_input: { subagent_type: 'blocked' }, cwd: '/tmp' }),
  });
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /BLOCKED/);
});
