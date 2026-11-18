import { bindable } from '../helpers/work-seat-config.mjs';
import '../helpers/process-tmp-root.mjs';
import { seedStubAgentClis } from '../helpers/agent-clis.mjs';
seedStubAgentClis('claude', 'codex', 'omp', 'pi', 'agy', 'glm', 'disallowed-provider');
import { activateGitFixture } from '../helpers/git-fixture.mjs';
import { initializeWorkRepository } from '../helpers/work-store-release.mjs';
import { committedConfigDir, committedRunnerConfig } from '../helpers/committed-config.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { loadRunnerConfigForDir, validateRunnerConfigShape } from '../../src/runner/dispatch/config.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch/runner-config-error.mjs';
import { resolveExecutorCommand, resolveExecutorEnv, DispatchError, DEFAULT_ADAPTER, EXECUTOR_ADAPTERS } from '../../src/runner/dispatch/transport.mjs';
import { decideDispatchMechanism } from '../../src/runner/dispatch/mechanism.mjs';
import { resolveAgentTypeForTaskSpec } from '../../src/runner/dispatch/cli.mjs';
import { buildPrompt, executorIdForWork } from '../../src/runner/work-compat.mjs';
import { spawnWorker, resolveAgentTypeForWork, resolveWorkForDispatch, workDispatchHint } from '../../src/runner/work-dispatch.mjs';
import { executeAssignment } from '../../src/runner/dispatch/assignment-runner.mjs';
import { fanoutBatchExecutorCli } from '../../src/runner/fanout-batch.mjs';
import { resolveExecutorConfig, lookupExecutor, resolveCapabilityDetailsFromHints } from '../../src/runner/dispatch/resolve.mjs';
import { initStore, addWork, listWork } from '../../src/state/store.mjs';
import { compileDispatchPlan as compileDispatchPlanRaw, effectiveDispatchPolicy, purposeSeatOf } from '../../src/runner/dispatch/plan.mjs';
import { buildAssignment } from '../helpers/declared-assignment.mjs';
import { holdLockInChild } from '../helpers/hold-lock-in-child.mjs';
import { dispatchCwdHolder } from '../../src/run-supervisor/cwd-lock.mjs';
import { moveMachineKeysTo, writeGlobalConfig, writeProjectConfig, writeRawProjectConfig } from '../helpers/config-fixture.mjs';
import { fgosDirFromRoot } from '../../src/util/fgos-file-registry.mjs';

// Fake executors only — every "command" spawned here is a node script this
// file writes to a mkdtemp directory at test time. No real agent CLI is
// ever invoked, and nothing here writes `.fgos/` or touches the main repo.

// A config with an executors block is given what Seat Binding needs to bind a Work seat (see the helper).
const compileDispatchPlan = (cfg, ...rest) => compileDispatchPlanRaw(cfg?.executors ? bindable(cfg) : cfg, ...rest);

function mkTempDir() {
  return fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-dispatch-test-')));
}

/** tsk-2ig: a real, minimal git repo (not just a bare tmpdir) — `fgosDir`
 * returned is `<repoRoot>/.fgos`, matching `paths.mjs`'s real
 * `fgosDirFromRoot` shape, so `captureDispatchAttestation`'s
 * `path.dirname(fgosDir)` resolves to a real repo root with a real HEAD. */
function mkTempGitRepo() {
  const repoRoot = mkTempDir();
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'seed'], { cwd: repoRoot });
  const headCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  activateGitFixture(repoRoot);
  const fgosDir = fgosDirFromRoot(repoRoot);
  fs.mkdirSync(fgosDir, { recursive: true });
  return { repoRoot, fgosDir, headCommit };
}

/** Write a fake executor node script that dumps its argv + cwd as JSON to
 * stdout and exits 0. Returns the absolute script path. */
function writeEchoExecutor(dir) {
  const scriptPath = path.join(dir, 'echo-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    const args = process.argv.slice(2);
    process.stdout.write(JSON.stringify({ args, cwd: process.cwd() }));
    process.exit(0);
    `,
  );
  return scriptPath;
}

/** Write a fake executor that delays for a specified time (ms) before returning JSON. */
function writeSlowExecutor(dir, delayMs = 300) {
  const scriptPath = path.join(dir, 'slow-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    setTimeout(() => {
      process.stdout.write(JSON.stringify({ ok: true }));
      process.exit(0);
    }, ${delayMs});
    `,
  );
  return scriptPath;
}


/** Write a fake executor that writes stdout and stderr as several SEPARATE
 * writes (not one flush), so onChunk observes multiple 'data' events instead
 * of collapsing to a single chunk. */
function writeMultiChunkExecutor(dir) {
  const scriptPath = path.join(dir, 'multi-chunk-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    process.stdout.write('out-chunk-1\\n');
    process.stdout.write('out-chunk-2\\n');
    process.stderr.write('err-chunk-1\\n');
    process.exit(0);
    `,
  );
  return scriptPath;
}

function sampleWork(overrides = {}) {
  return {
    id: 'sample-work',
    title: 'Add the widget',
    kind: 'feature',
    status: 'doing',
    deps: [],
    risk: 'light',
    refs: ['src/widget.mjs', 'docs/specs/widget.md'],
    verify: 'npm test',
    ...overrides,
  };
}

function baseConfig(executorArgs) {
  return {
    executor: { command: process.execPath, args: executorArgs },
    modelPolicies: { claude: { nano: 'haiku', standard: 'sonnet', frontier: 'opus' }, node: { nano: 'haiku', standard: 'sonnet', frontier: 'opus' } },
    defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } },
    timeoutMs: 5000,
  };
}

// --- buildPrompt: four framing sections + item fields -----------------

test('buildPrompt includes all five framing sections', () => {
  const prompt = buildPrompt(sampleWork());
  assert.match(prompt, /# Goal/);
  assert.match(prompt, /# Description/);
  assert.match(prompt, /# Worktree boundary/);
  assert.match(prompt, /# Expected proof/);
  assert.match(prompt, /# Constraints/);
});

test('buildPrompt for a coding-domain (or no-domain) work item also contains a new "# Agent skill" section naming the fgos-coding-implement SKILL.md', () => {
  const prompt = buildPrompt(sampleWork());
  assert.match(prompt, /# Agent skill/);
  assert.ok(prompt.includes('.claude/skills/fgos-coding-implement/SKILL.md'));
});

// --- tsk-5mj D1/D6/D7: stage-aware buildPrompt (discovery dispatch) ------

test('buildPrompt omitting stage defaults to "executing", byte-identical to every pre-tsk-5mj call', () => {
  assert.equal(buildPrompt(sampleWork()), buildPrompt(sampleWork(), undefined, 'executing'));
});

test('buildPrompt with stage:"discovery" points the Agent skill section at fgos-coding-discovering\'s SKILL.md and selects the discovery template', () => {
  const prompt = buildPrompt(sampleWork(), undefined, 'discovery');
  assert.match(prompt, /# Agent skill/);
  assert.ok(prompt.includes('.claude/skills/fgos-coding-discovering/SKILL.md'));
  assert.match(prompt, /discovery stage/);
});

test('buildPrompt describes the fgos-discovered report-not-write channel while keeping the never-call-fgos constraint (wgi-8)', () => {
  const prompt = buildPrompt(sampleWork());
  assert.match(prompt, /# Reporting discovered work/);
  assert.match(prompt, /```fgos-discovered/);
  assert.match(prompt, /"title"/);
  // the channel is a REPORT, never a write — the D3 write constraint stays intact
  assert.match(prompt, /Never call `fgos` yourself/);
  assert.match(prompt, /report, not a write/);
});

test('buildPrompt embeds work.description verbatim under the Description section', () => {
  const description = 'Line one.\nLine two with detail: do X, then Y — no truncation expected.';
  const prompt = buildPrompt(sampleWork({ description }));
  assert.match(prompt, /# Description\nLine one\.\nLine two with detail: do X, then Y — no truncation expected\./);
});

test('buildPrompt degrades to "(không có)" when the work item has no description', () => {
  const prompt = buildPrompt(sampleWork());
  assert.match(prompt, /# Description\n\(không có\)/);
});

// tsk-3xd D1/D3 (docs/history/tsk-3xd-decompose-child-directive-prose/
// CONTEXT.md): `action`/`readFirst` render into a new "# Directive" section
// -- `action` from the item's own new field, `readFirst` derived from the
// existing `footprint` field (not a stored field of its own, D1).

test('buildPrompt includes a "# Directive" section naming action and files to read first', () => {
  const prompt = buildPrompt(sampleWork());
  assert.match(prompt, /# Directive/);
  assert.match(prompt, /# Files to read first/);
});

test('buildPrompt embeds work.action verbatim under the Directive section', () => {
  const action = 'D1: implement the parser per the locked format.';
  const prompt = buildPrompt(sampleWork({ action }));
  assert.match(prompt, /# Directive\nD1: implement the parser per the locked format\./);
});

test('buildPrompt degrades action to "(không có)" when the work item has no action', () => {
  const prompt = buildPrompt(sampleWork());
  assert.match(prompt, /# Directive\n\(không có\)/);
});

test('buildPrompt renders readFirst from the item\'s own footprint, joined, under "Files to read first"', () => {
  const prompt = buildPrompt(sampleWork({ footprint: ['src/parser.mjs', 'test/parser.test.mjs'] }));
  assert.match(prompt, /# Files to read first\nsrc\/parser\.mjs, test\/parser\.test\.mjs/);
});

test('buildPrompt degrades readFirst to "(không có)" when the work item has no footprint', () => {
  const prompt = buildPrompt(sampleWork());
  assert.match(prompt, /# Files to read first\n\(không có\)/);
});

test('buildPrompt renders docsRefPointer under "Files to read first" when docsRef is set on work item', () => {
  const prompt = buildPrompt(sampleWork({ docsRef: 'docs/history/my-feature' }));
  assert.match(prompt, /# Files to read first\n\(không có\)\ndocs\/history\/my-feature\/plan\.md and \.\.\.\/CONTEXT\.md \(if present\) — the locked decisions and chosen approach for this item/);
});

test('buildPrompt normalizes trailing slash in docsRef when rendering docsRefPointer', () => {
  const prompt1 = buildPrompt(sampleWork({ docsRef: 'docs/history/my-feature/' }));
  const prompt2 = buildPrompt(sampleWork({ docsRef: 'docs/history/my-feature' }));
  assert.equal(prompt1, prompt2);
  assert.ok(prompt1.includes('docs/history/my-feature/plan.md'));
});

test('buildPrompt renders "(none)" for docsRefPointer when work.docsRef is absent or empty', () => {
  const prompt = buildPrompt(sampleWork());
  assert.match(prompt, /# Files to read first\n\(không có\)\n\(none\)/);
});

test('buildPrompt for non-executing stage (e.g. discovery) does not leak literal {docsRefPointer} template variable', () => {
  const prompt = buildPrompt(sampleWork({ docsRef: 'docs/history/my-feature' }), undefined, 'discovery');
  assert.doesNotMatch(prompt, /\{docsRefPointer\}/);
});

test('buildPrompt with no feedback stays byte-identical to the pre-feedback shape (no Human feedback section)', () => {
  assert.equal(buildPrompt(sampleWork()), buildPrompt(sampleWork(), undefined));
  assert.doesNotMatch(buildPrompt(sampleWork(), {}), /# Human feedback/);
});

test('buildPrompt embeds the human answer and latest rejection reason verbatim under Human feedback', () => {
  const feedback = {
    answer: 'CHỐT (a): detectTrunk — origin/HEAD rồi HEAD, fallback main.',
    reason: 'Thiếu test master-trunk; giữ code, chỉ bổ sung test.',
  };
  const prompt = buildPrompt(sampleWork(), feedback);
  assert.match(prompt, /# Human feedback/);
  assert.ok(prompt.includes(feedback.answer));
  assert.ok(prompt.includes(feedback.reason));
  assert.match(prompt, /fix THIS before anything else/);
});

test('buildPrompt renders a reason-only feedback without an answer block', () => {
  const prompt = buildPrompt(sampleWork(), { reason: 'only the objection' });
  assert.match(prompt, /# Human feedback/);
  assert.ok(prompt.includes('only the objection'));
  assert.doesNotMatch(prompt, /Human answer/);
});

test('buildPrompt embeds title, kind, refs, and verify from the work item', () => {
  const work = sampleWork();
  const prompt = buildPrompt(work);
  assert.match(prompt, /Add the widget/);
  assert.match(prompt, /feature/);
  assert.match(prompt, /src\/widget\.mjs/);
  assert.match(prompt, /docs\/specs\/widget\.md/);
  assert.match(prompt, /npm test/);
});

test('buildPrompt forbids the worker from calling fgos itself', () => {
  const prompt = buildPrompt(sampleWork());
  assert.match(prompt, /never call `fgos`/i);
});

test('buildPrompt handles a work item with empty refs', () => {
  const prompt = buildPrompt(sampleWork({ refs: [] }));
  assert.match(prompt, /\(none\)/);
});

// --- runner config checks that compare two fields: each field's own shape is the runner schema's ---

test('the runner config check refuses a runner config that still carries rigorToTier, naming the retired key and the fix', () => {
  const runner = {
    executor: { command: 'claude', args: ['-p', '{prompt}', '--model', '{model}'] },
    modelPolicies: { claude: { nano: 'haiku', standard: 'sonnet', flagship: 'opus' } },
    rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'flagship' },
    timeoutMs: 120000,
  };

  assert.throws(
    () => validateRunnerConfigShape(runner, 'test'),
    (err) => err instanceof RunnerConfigError && /retired "rigorToTier".*delete the key/.test(err.message),
  );
});

test('loadRunnerConfigForDir refuses a project-local account inventory (providers or llmAccounts), naming the key', () => {
  const repo = mkTempGitRepo();
  writeProjectConfig(repo.repoRoot, {
      runner: {
        executor: { command: 'claude', args: ['{prompt}'] },
        modelPolicies: { claude: { standard: 'sonnet' } },
        timeoutMs: 1000,
        providers: {
          'openai-codex': {
            accounts: {
              tetnu: { credentialSource: { kind: 'codex-home', home: '${HOME}/.codex-tetnu' } },
            },
          },
        },
      },
    });
  withHome(mkTempDir(), () => {
    assert.throws(() => loadRunnerConfigForDir(repo.repoRoot), (err) => err instanceof RunnerConfigError && err.code === 'config-key-in-wrong-file' && /runner\.providers/.test(err.message));
    writeProjectConfig(repo.repoRoot, { runner: { executor: { command: 'claude', args: ['{prompt}'] }, llmAccounts: { openai: { main: { credentialSource: { kind: 'codex-home', home: '${HOME}/.codex' } } } } } });
    assert.throws(() => loadRunnerConfigForDir(repo.repoRoot), (err) => err instanceof RunnerConfigError && err.code === 'config-key-in-wrong-file' && /runner\.llmAccounts/.test(err.message));
  });
  fs.rmSync(repo.repoRoot, { recursive: true, force: true });
});

// --- executors.<id>.invocations[] (tsk-5tm-4 D11): executor-keyed
// alternative to flat command/args, ADDITIVE -- executors field name
// itself stays unchanged (cfg.executors already means something else,
// tier-keyed, tsk-4eu) -----------------------------------------------

test('resolveExecutorCommand resolves command/args/provider from invocations[0] for an invocations[]-shaped executor', () => {
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: {
      agy: {
        kind: 'agent',
        allowCrossProvider: true,
        invocations: [{ via: 'cli', adapter: 'cli-spawn', command: 'agy', args: ['-p', '{prompt}', '--model', '{model}'] }],
      },
    },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'hello', model: 'sonnet', tier: 'standard', executorId: 'agy' });
  assert.equal(resolved.command, 'agy');
  assert.deepEqual(resolved.args, ['-p', 'hello', '--model', 'sonnet']);
  assert.equal(resolved.adapter, 'cli-spawn');
  assert.equal(resolved.provider, 'gemini');
});

test('resolveExecutorCommand picks the invocation whose "via" is "cli" even when it is not invocations[0] (D9 Gate B2 — never invocations[0] blindly)', () => {
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: {
      agy: {
        kind: 'agent',
        invocations: [
          { via: 'mcp', command: 'mcp:agy' },
          { via: 'cli', command: 'claude', args: ['-p', '{prompt}'] },
        ],
      },
    },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'hello', model: 'sonnet', tier: 'standard', executorId: 'agy' });
  assert.equal(resolved.command, 'claude');
  assert.deepEqual(resolved.args, ['-p', 'hello']);
});

test('resolveExecutorCommand throws when a executor declares "invocations" but none is dispatchable via "cli" (D9 Gate B3 — never silently falls through to the global executor)', () => {
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: {
      agy: {
        kind: 'tool',
        invocations: [{ via: 'mcp', command: 'mcp:agy' }],
      },
    },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    timeoutMs: 5000,
  };
  assert.throws(
    () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'agy' }),
    /declares "invocations" but none is dispatchable via "cli"/,
  );
});

test('resolveExecutorCommand still enforces cross-provider governance for an invocations[]-shaped executor — allowCrossProvider stays required', () => {
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: {
      agy: { kind: 'agent', invocations: [{ via: 'cli', adapter: 'cli-spawn', command: 'agy', args: ['{prompt}'] }] },
    },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    timeoutMs: 5000,
  };
  assert.throws(
    () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'agy' }),
    RunnerConfigError,
  );
});

test('the committed .fgos/config.json runner section declares the consolidated gemini executor (executor-provider-naming 2026-09-17, replacing the former "agy" executor id): invocations[]-shaped, kind agent, allowCrossProvider true, run through agy with the tier model passed on every invocation', () => {
  const cfg = committedRunnerConfig();
  const executor = cfg.executors?.gemini;
  assert.ok(executor, 'executors.gemini must exist');
  assert.equal(executor.kind, 'agent');
  assert.equal(executor.allowCrossProvider, true);
  assert.ok(Array.isArray(executor.invocations));
  const ids = executor.invocations.map((inv) => inv.id);
  for (const id of ['agy-herdr-bwrap', 'agy-cli-bwrap']) {
    assert.ok(ids.includes(id), `gemini must declare the "${id}" invocation`);
  }
  // gemini runs through the Antigravity CLI; omp and pi do not serve it.
  assert.ok(executor.invocations.every((inv) => inv.command === 'agy'), `gemini invocations must all run agy, got ${JSON.stringify(executor.invocations.map((inv) => inv.command))}`);
  for (const inv of executor.invocations) {
    // Without --model agy runs its default model whatever the tier asked for.
    const at = inv.args.indexOf('--model');
    assert.ok(at >= 0 && inv.args[at + 1] === '{model}', `${inv.id} must pass --model {model}`);
    assert.deepEqual(inv.confinement, { backend: 'bwrap' }, `${inv.id} runs confined`);
  }
  const headless = executor.invocations.find((inv) => inv.id === 'agy-cli-bwrap');
  assert.equal(headless.via, 'cli');
  assert.equal(headless.adapter, 'cli-spawn');
  assert.ok(headless.args.includes('{prompt}'));
});

// Synthetic cfg, not committedRunnerConfig() (tsk-1cn): committedRunnerConfig()
// reads the committed HEAD, so a branch's own .fgos/config.json edit is
// invisible to it until committed, and a test asserting that change through
// the helper would fail until then.
// This mirrors the entry actually added to runner.executors.claude.
function claudeExecutorCfg() {
  return {
    executor: { command: 'claude', args: ['-p', '{prompt}', '--model', '{model}', '--permission-mode', 'acceptEdits'] },
    executors: {
      claude: {
        kind: 'agent',
        invocations: [{ via: 'cli', adapter: 'cli-spawn', command: 'claude', args: ['-p', '{prompt}', '--model', '{model}', '--permission-mode', 'acceptEdits'] }],
      },
    },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    timeoutMs: 5000,
  };
}

test('resolveExecutorCommand resolves the named "claude" executor to the same command/args the top-level "executor" default already produces (tsk-1cn: addressability, not new behavior)', () => {
  const cfg = claudeExecutorCfg();
  const named = resolveExecutorCommand(cfg, { prompt: 'hello', model: 'sonnet', tier: 'standard', executorId: 'claude' });
  const unnamed = resolveExecutorCommand(cfg, { prompt: 'hello', model: 'sonnet', tier: 'standard' });
  assert.equal(named.command, unnamed.command);
  assert.deepEqual(named.args, unnamed.args);
});

test('resolveExecutorCommand never requires allowCrossProvider for the named "claude" executor, since its resolved command is already in CLAUDE_CLI_COMMANDS (tsk-1cn, unlike agy/codex/pi)', () => {
  const cfg = claudeExecutorCfg();
  assert.equal(cfg.executors.claude.allowCrossProvider, undefined);
  assert.doesNotThrow(() => resolveExecutorCommand(cfg, { prompt: 'hello', model: 'sonnet', tier: 'standard', executorId: 'claude' }));
});

test('EXECUTOR_ADAPTERS registers adapters: cli-spawn (default) and herdr-spawn', () => {
  assert.deepEqual(Object.keys(EXECUTOR_ADAPTERS), ['cli-spawn', 'herdr-spawn']);
  assert.equal(DEFAULT_ADAPTER, 'cli-spawn');
});

test('the committed .fgos/config.json runner section loads and is well-formed', () => {
  const cfg = committedRunnerConfig();
  assert.deepEqual(Object.keys(cfg.modelPolicies.claude).sort(), ['flagship', 'advanced', 'frontier', 'mini', 'nano', 'standard'].sort());
});

test('the committed .fgos/config.json runner section wires the consolidated gemini executor to gemini\'s own modelPolicies, not claude\'s (D9, tsk-5tm-5 — the bug this piece originally fixed)', () => {
  const cfg = committedRunnerConfig();
  assert.equal(cfg.executors?.gemini?.providerModel, 'gemini');
  assert.equal(typeof cfg.modelPolicies?.gemini?.nano, 'string');
  assert.ok(cfg.modelPolicies.gemini.nano.length > 0);
});

test('the committed .fgos/config.json runner section grants the worker acceptEdits plus test commands only — no git write grant (the runner commits)', () => {
  const cfg = committedRunnerConfig();
  const { args } = cfg.executor;
  assert.ok(args.includes('--permission-mode'));
  assert.equal(args[args.indexOf('--permission-mode') + 1], 'acceptEdits');
  const allowed = args.includes('--allowedTools') ? args[args.indexOf('--allowedTools') + 1].split(',') : [];
  const testCommand = /^(Skill|Bash\((rtk (proxy )?)?(cargo (build|check|test|clippy|fmt)|node --test|cargo|node):\*\))$/;
  for (const tool of allowed) assert.match(tool, testCommand, `allowlist grants only test commands, found ${tool}`);
  assert.ok(!args.some((arg) => /git (add|commit)/.test(arg)), 'no git add/commit grant on the default executor');
  assert.ok(!args.includes('--dangerously-skip-permissions'));
});

test('the committed .fgos/config.json runner section no longer declares a coding-classify-intake executor (tsk-49u): tsk-4ns already stripped its only consumer (fgos-submit-assist\'s dispatch-fallback branch), leaving the config entry orphaned, so it was removed via the same ADR0020 hand-commit-to-main path its own rename (tsk-3fj) originally used', () => {
  const cfg = committedRunnerConfig();
  assert.equal(cfg.executors?.['coding-classify-intake'], undefined, 'executors.coding-classify-intake should no longer exist -- retired after tsk-4ns removed its only consumer');
});

test('the committed .fgos/config.json runner section no longer declares a gather executor (tsk-5tm-2 D6): the one cross-provider path, retired -- no architectural reason on record for cross-provider, and native Task-tool dispatch already met the one documented reason (parallelizing wall-clock)', () => {
  const cfg = committedRunnerConfig();
  assert.equal(cfg.executors?.gather, undefined, 'executors.gather should no longer exist -- retired per D6');
});

test('the committed .fgos/config.json runner section declares "impact-analysis"/"pane-labeling" in its capabilities catalog (D4/D14, tsk-in1-3)', () => {
  const cfg = committedRunnerConfig();
  assert.equal(typeof cfg.capabilities?.['impact-analysis']?.description, 'string');
  assert.ok(cfg.capabilities['impact-analysis'].description.length > 0);
  assert.equal(typeof cfg.capabilities?.['pane-labeling']?.description, 'string');
});

/** Runs `fn` with HOME and USERPROFILE at `home` (the machine's global directory is `<home>/.fgos`), restoring both afterwards. */
function withHome(home, fn) {
  const prevHome = process.env.HOME;
  const prevUserProfile = process.env.USERPROFILE;
  process.env.HOME = home;
  process.env.USERPROFILE = home;
  try {
    return fn();
  } finally {
    process.env.HOME = prevHome;
    if (prevUserProfile !== undefined) process.env.USERPROFILE = prevUserProfile;
    else delete process.env.USERPROFILE;
  }
}

/** Runs `fn` with a PATH that holds exactly empty executables named `names`, so the executor the config door
 * detects does not depend on what is installed on the machine running the suite. */
function withOnlyOnPath(names, fn) {
  const dir = mkTempDir();
  for (const name of names) {
    const binName = process.platform === 'win32' ? `${name}.cmd` : name;
    fs.writeFileSync(path.join(dir, binName), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  }
  const originalPath = process.env.PATH;
  process.env.PATH = dir;
  try {
    return fn();
  } finally {
    process.env.PATH = originalPath;
  }
}

const projectRunner = (extra = {}) => ({ runner: { executor: { command: 'claude', args: ['{prompt}'] }, modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } }, defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } }, timeoutMs: 5000, ...extra } });

// --- loadRunnerConfigForDir: the one read-only loader over the config door ---

test('loadRunnerConfigForDir reads the runner section of the project file', () => {
  const dir = mkTempDir();
  writeProjectConfig(dir, projectRunner());
  const cfg = withHome(mkTempDir(), () => loadRunnerConfigForDir(dir));
  assert.equal(cfg.executor.command, 'claude');
  assert.equal(cfg.timeoutMs, 5000);
});

test('loadRunnerConfigForDir on a project with no config file reads the standard, creates nothing, and a detected claude becomes the executor', () => {
  const dir = mkTempDir();
  const cfg = withHome(mkTempDir(), () => withOnlyOnPath(['claude'], () => loadRunnerConfigForDir(dir)));
  assert.equal(cfg.executor.command, 'claude');
  assert.equal(cfg.timeoutMs, 900000);
  assert.equal(fs.existsSync(fgosDirFromRoot(dir)), false);
});

test('with no executor set and no assistant CLI on PATH the config loads, a named executor resolves, and the default refuses where it is used, naming the command that sets one', () => {
  const dir = mkTempDir();
  writeProjectConfig(dir, { runner: { executors: { fake: { kind: 'agent', carries: 'repo-content', allowCrossProvider: true, invocations: [{ via: 'cli', command: 'fake-cli', args: ['{prompt}'] }] } } } });
  const home = mkTempDir();
  moveMachineKeysTo(dir, home);
  const cfg = withHome(home, () => withOnlyOnPath([], () => loadRunnerConfigForDir(dir)));
  assert.equal(cfg.executor, undefined);
  assert.equal(resolveExecutorConfig(cfg, 'standard', 'fake', undefined, 'repo-content').command, 'fake-cli');
  assert.throws(
    () => resolveExecutorConfig(cfg, 'standard', undefined),
    (err) => err instanceof RunnerConfigError && err.code === 'runner-executor-missing' && /fgos config set runner\.executor/.test(err.message),
  );
});

test('loadRunnerConfigForDir refuses a project file that does not parse, with the door\'s failure id', () => {
  const dir = mkTempDir();
  writeRawProjectConfig(dir, '{ not valid json');
  assert.throws(
    () => withHome(mkTempDir(), () => loadRunnerConfigForDir(dir)),
    (err) => err instanceof RunnerConfigError && err.code === 'config-parse',
  );
});

test('loadRunnerConfigForDir merges a project runner section over the global file, project winning per key', () => {
  const dir = mkTempDir();
  writeProjectConfig(dir, projectRunner());
  const homeDir = mkTempDir();
  writeGlobalConfig(homeDir, { runner: { timeoutMs: 999999, idleTimeoutMs: 1234 } });
  const cfg = withHome(homeDir, () => loadRunnerConfigForDir(dir));
  // Project's own timeoutMs wins over global's.
  assert.equal(cfg.timeoutMs, 5000);
  // Global fills a key the project never set.
  assert.equal(cfg.idleTimeoutMs, 1234);
});

test('loadRunnerConfigForDir lets a global modelPolicies tier key fill a gap when the tier is valid', () => {
  const dir = mkTempDir();
  writeProjectConfig(dir, projectRunner());
  const homeDir = mkTempDir();
  writeGlobalConfig(homeDir, { runner: { modelPolicies: { claude: { frontier: 'opus' } } } });
  const cfg = withHome(homeDir, () => loadRunnerConfigForDir(dir));
  assert.equal(cfg.modelPolicies.claude.standard, 'sonnet');
  assert.equal(cfg.modelPolicies.claude.frontier, 'opus');
});

test('loadRunnerConfigForDir refuses a global file that holds the retired rigorToTier key, naming the key and the fix', () => {
  const dir = mkTempDir();
  writeProjectConfig(dir, projectRunner());
  const homeDir = mkTempDir();
  writeGlobalConfig(homeDir, { runner: { rigorToTier: { low: 'nano' } } });
  assert.throws(
    () => withHome(homeDir, () => loadRunnerConfigForDir(dir)),
    (err) => err instanceof RunnerConfigError && err.message.includes('~/.fgos/config.yaml') && /rigorToTier no longer exists/.test(err.message) && /delete the key/.test(err.message) && !err.message.includes(dir),
  );
});

test('the runner config check does not warn for a "executors.<id>" entry that declares providerModel explicitly', () => {
  const runner = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { 'glm-cli': { kind: 'agent', providerModel: 'z-ai', invocations: [{ id: 'glm-cli-cli', via: 'cli', command: 'glm', args: [] }] } },
    modelPolicies: { claude: { standard: 'sonnet' }, 'z-ai': { standard: 'glm-4.6' } },
    defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } },
    timeoutMs: 1000,
  };
  const original = console.warn;
  const calls = [];
  console.warn = (...args) => calls.push(args);
  try {
    validateRunnerConfigShape(runner, 'test');
    assert.equal(calls.length, 0);
  } finally {
    console.warn = original;
  }
});

test('the runner config check does not warn for a "executors.<id>" entry with a Claude CLI command and no providerModel (correct default case)', () => {
  const runner = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { 'custom-claude-executor': { kind: 'agent', invocations: [{ id: 'custom-claude-executor-cli', via: 'cli', command: 'claude', args: ['{prompt}'] }] } },
    modelPolicies: { claude: { standard: 'sonnet' } },
    defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } },
    timeoutMs: 1000,
  };
  const original = console.warn;
  const calls = [];
  console.warn = (...args) => calls.push(args);
  try {
    validateRunnerConfigShape(runner, 'test');
    assert.equal(calls.length, 0);
  } finally {
    console.warn = original;
  }
});

test('the runner config check warns (never throws) for an agent "executors.<id>" entry with no providerModel/provider and no invocation that yields a command', () => {
  const runner = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { 'bare-agent': { kind: 'agent' } },
    modelPolicies: { claude: { standard: 'sonnet' } },
    defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } },
    timeoutMs: 1000,
  };
  const original = console.warn;
  const calls = [];
  console.warn = (...args) => calls.push(args);
  try {
    assert.doesNotThrow(() => validateRunnerConfigShape(runner, 'test'));
    assert.equal(calls.length, 1);
    assert.match(calls[0][0], /bare-agent/);
  } finally {
    console.warn = original;
  }
});

test('the runner config check does not warn for an "invocations[]"-shaped "executors.<id>" entry with no providerModel/provider and a non-Claude cli command (codex-cli shape) — assignment-policy.mjs and resolve.mjs already agree for this shape', () => {
  const runner = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: {
      'codex-cli': {
        kind: 'agent',
        invocations: [{ via: 'cli', adapter: 'cli-spawn', command: 'codex', args: ['{prompt}'] }],
      },
    },
    modelPolicies: { claude: { standard: 'sonnet' } },
    defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } },
    timeoutMs: 1000,
  };
  const original = console.warn;
  const calls = [];
  console.warn = (...args) => calls.push(args);
  try {
    validateRunnerConfigShape(runner, 'test');
    assert.equal(calls.length, 0);
  } finally {
    console.warn = original;
  }
});

test('the runner config check skips provider-family warning when every invocation is non-CLI (R8, gitnexus shape: mcp-only)', () => {
  const runner = {
    executor: { command: 'claude', args: ['{prompt}'] },
    capabilities: { 'impact-analysis': { prefer: 'gitnexus' } },
    executors: {
      gitnexus: {
        kind: 'tool',
        for: ['impact-analysis'],
        invocations: [{ via: 'mcp', command: 'mcp:gitnexus', tools: { 'impact-analysis': 'mcp__gitnexus__impact' } }],
      },
    },
    modelPolicies: { claude: { standard: 'sonnet' } },
    defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } },
    timeoutMs: 1000,
  };
  const original = console.warn;
  const calls = [];
  console.warn = (...args) => calls.push(args);
  try {
    assert.doesNotThrow(() => validateRunnerConfigShape(runner, 'test'));
    assert.equal(calls.length, 0, 'warning must be skipped when every invocation is non-CLI');
  } finally {
    console.warn = original;
  }
});

// --- tsk-2ig: worktree-dispatch attestation (baseCommit/headRef) ---------

test('resolveExecutorCommand captures a real baseCommit/headRef when fgosDir points at a real repo', () => {
  const cfg = baseConfig(['-p', '{prompt}']);
  const { repoRoot, fgosDir, headCommit } = mkTempGitRepo();
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', fgosDir });
  assert.equal(resolved.baseCommit, headCommit);
  assert.equal(resolved.headRef, 'main');
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('resolveExecutorCommand: baseCommit/headRef are both null when fgosDir is omitted (no attempt made)', () => {
  const cfg = baseConfig(['-p', '{prompt}']);
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet' });
  assert.equal(resolved.baseCommit, null);
  assert.equal(resolved.headRef, null);
});

test('resolveExecutorCommand: baseCommit/headRef fail closed to null (never throw) when fgosDir does not point at a git repo', () => {
  const cfg = baseConfig(['-p', '{prompt}']);
  const dir = mkTempDir(); // plain tmpdir, no .git anywhere in its ancestry assumed by the read
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', fgosDir: dir });
  assert.equal(resolved.baseCommit, null);
  assert.equal(resolved.headRef, null);
});

// --- tsk-4hl (post-tsk-2ig independent review): attestRoot overrides
// fgosDir's own root -- a worker dispatches inside its OWN worktree
// (loop.mjs's wt.path), a different checkout than fgosDir's root (always
// the main checkout, ADR0020). Two unrelated real repos here (different
// HEAD commits, different branch names) makes "which root actually got
// read" unambiguous. ---

test('resolveExecutorCommand: attestRoot, when given, is read INSTEAD of fgosDir\'s own root (tsk-4hl fix)', () => {
  const cfg = baseConfig(['-p', '{prompt}']);
  const mainRepo = mkTempGitRepo(); // fgosDir points here
  const workerRepo = mkTempGitRepo(); // attestRoot points here -- a different repo entirely
  // mkTempGitRepo's single seed commit is fully deterministic (same tree,
  // message, author, second-precision timestamp) -- two independently
  // created repos can legitimately hash to the SAME commit. One extra
  // commit here makes workerRepo's HEAD genuinely distinct, so this test
  // proves attestRoot was actually read, not a coincidental hash collision.
  fs.writeFileSync(path.join(workerRepo.repoRoot, 'second.txt'), 'second\n');
  execFileSync('git', ['add', 'second.txt'], { cwd: workerRepo.repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'second'], { cwd: workerRepo.repoRoot });
  workerRepo.headCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: workerRepo.repoRoot, encoding: 'utf8' }).trim();
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', fgosDir: mainRepo.fgosDir, attestRoot: workerRepo.repoRoot });
  assert.equal(resolved.baseCommit, workerRepo.headCommit, 'must attest the attestRoot repo, never fgosDir\'s own root');
  assert.notEqual(resolved.baseCommit, mainRepo.headCommit);
  fs.rmSync(mainRepo.repoRoot, { recursive: true, force: true });
  fs.rmSync(workerRepo.repoRoot, { recursive: true, force: true });
});

test('resolveExecutorCommand: attestRoot works even when fgosDir is omitted entirely', () => {
  const cfg = baseConfig(['-p', '{prompt}']);
  const { repoRoot, headCommit } = mkTempGitRepo();
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', attestRoot: repoRoot });
  assert.equal(resolved.baseCommit, headCommit);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

// --- resolveExecutorCommand: per-element argv substitution, never shell -

test('resolveExecutorCommand substitutes {prompt} and {model} per array element', () => {
  const cfg = baseConfig(['-p', '{prompt}', '--model', '{model}']);
  const { command, args } = resolveExecutorCommand(cfg, { prompt: 'do the thing', model: 'sonnet' });
  assert.equal(command, process.execPath);
  assert.deepEqual(args, ['-p', 'do the thing', '--model', 'sonnet']);
});

test('codex\'s cli-bypass invocation consumes model placeholder in invocation args: analytical assignment resolves model from policy into argv', () => {
  const cfg = loadRunnerConfigForDir(committedConfigDir());
  const assignment = buildAssignment({
    stage: 'planning',
    operation: 'validate-plan',
    policy: {
      preferExecutor: 'openai',
      rigor: 'high',
    },
  });

  // The tier a seat runs at is the config's; the assignment's rigor is a demand and moves nothing.
  const effectivePolicy = effectiveDispatchPolicy({
    assignment,
    runnerConfig: { ...cfg, defaults: { tier: 'flagship' } },
  });

  assert.equal(effectivePolicy.providerModel, 'openai');
  assert.equal(effectivePolicy.rigor, 'high');
  assert.equal(effectivePolicy.tier, 'flagship');
  // A cell is a model string or { model, effort }; only the model reaches --model.
  const flagshipCell = cfg.modelPolicies.openai.flagship;
  const flagshipModel = typeof flagshipCell === 'string' ? flagshipCell : flagshipCell?.model;
  assert.ok(typeof flagshipModel === 'string' && flagshipModel.length > 0, 'project config names an openai flagship model');
  assert.equal(effectivePolicy.model, flagshipModel);

  const prompt = 'Analyze system architecture for potential failure modes';
  const resolved = resolveExecutorCommand(cfg, {
    prompt,
    model: effectivePolicy.model,
    executorId: 'openai',
    invocationId: 'codex-cli-bwrap',
  });

  assert.equal(resolved.command, 'codex');
  assert.ok(resolved.args.includes('--model'), 'resolved args must include --model flag');
  assert.ok(resolved.args.includes(flagshipModel), 'resolved args must include the resolved flagship model');
  const modelFlagIndex = resolved.args.indexOf('--model');
  assert.equal(resolved.args[modelFlagIndex + 1], flagshipModel, '--model flag must be immediately followed by the resolved flagship model');
  assert.ok(resolved.args.includes(prompt), 'resolved args must include prompt as a separate argv element');
  assert.equal(resolved.args[resolved.args.length - 1], prompt, '{prompt} must remain a separate argv element, not shell-concatenated');
  assert.deepEqual(resolved.args, [
    'exec',
    '--skip-git-repo-check',
    '-s',
    'danger-full-access',
    '--model',
    flagshipModel,
    prompt,
  ]);
});

test('resolveExecutorCommand keeps shell metacharacters and newlines in the prompt literal (argv, never a shell string)', () => {
  const cfg = baseConfig(['-p', '{prompt}']);
  const trickyPrompt = 'line one\nline two; rm -rf / && echo $(whoami) `id` | cat > /tmp/x';
  const { args } = resolveExecutorCommand(cfg, { prompt: trickyPrompt, model: 'sonnet' });
  assert.equal(args[1], trickyPrompt);
});

test('resolveExecutorCommand substitutes both placeholders even inside the same argv element', () => {
  const cfg = baseConfig(['{model}:{prompt}']);
  const { args } = resolveExecutorCommand(cfg, { prompt: 'p', model: 'm' });
  assert.deepEqual(args, ['m:p']);
});

test('resolveExecutorCommand defaults to the "cli-spawn" adapter when the executor block omits one', () => {
  const cfg = baseConfig(['{prompt}']);
  const { adapter } = resolveExecutorCommand(cfg, { prompt: 'p', model: 'm' });
  assert.equal(adapter, 'cli-spawn');
});

test('resolveExecutorCommand falls back to the global executor when no tier is given — every pre-P41 call site keeps working', () => {
  const cfg = baseConfig(['{prompt}']);
  const { command } = resolveExecutorCommand(cfg, { prompt: 'p', model: 'm' });
  assert.equal(command, process.execPath);
});

test('resolveExecutorCommand throws for an unknown adapter even on a raw config object that skipped the config door', () => {
  const cfg = { executor: { command: 'x', args: ['{prompt}'], adapter: 'not-a-real-adapter' }, modelPolicies: { claude: { standard: 'sonnet' } }, timeoutMs: 5000 };
  assert.throws(() => resolveExecutorCommand(cfg, { prompt: 'p', model: 'm' }), RunnerConfigError);
});

// --- tsk-62v: executor-aware resolve precedence (D4) — executors > global
// executor (tsk-in1-2 D6 retired the intermediate executors.<tier> rung)

test('resolveExecutorCommand honors a executors.<executorId> override ahead of the global executor', () => {
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { 'fgos-code-implement': { kind: 'agent', invocations: [{ id: 'fgos-code-implement-cli', via: 'cli', command: '/executor/executor', args: ['{prompt}'] }],  allowCrossProvider: true } },
    modelPolicies: { claude: { frontier: 'opus', standard: 'opus' }, node: { frontier: 'opus', standard: 'opus' } },
    timeoutMs: 5000,
  };
  const byExecutor = resolveExecutorCommand(cfg, { prompt: 'p', model: 'opus', tier: 'frontier', executorId: 'fgos-code-implement' });
  assert.equal(byExecutor.command, '/executor/executor');
  // no executorId at all -> falls back to the global executor, unaffected
  const noExecutorId = resolveExecutorCommand(cfg, { prompt: 'p', model: 'opus', tier: 'frontier' });
  assert.equal(noExecutorId.command, '/global/executor');
});

test('resolveExecutorCommand falls back to the global executor when the executors entry names no executor of its own (metadata-only) — executors.<tier> is retired, no intermediate stop', () => {
  // Global executor command is Claude's own here (unlike a same-named test
  // predating D5) deliberately -- this test's own purpose is metadata-only
  // fallback resolution, not cross-provider governance (D5, tsk-in1-4:
  // governance is no longer exempted by "kind" alone, so a non-Claude
  // placeholder here would trip an unrelated throw; see the dedicated
  // cross-provider-governance tests above for that boundary instead).
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { 'fgos-code-implement': { kind: 'agent', target: 'general-purpose', tier: 'frontier' } },
    modelPolicies: { claude: { frontier: 'opus', standard: 'opus' }, node: { frontier: 'opus', standard: 'opus' } },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'opus', tier: 'frontier', executorId: 'fgos-code-implement' });
  assert.equal(resolved.command, 'claude');
});

// --- tsk-4eu: regression proof for the live symptom — "judge-decompose"
// used to fall through to the global executor (no "Read"), because its
// old home (executors.judge, a non-tier key) was never reachable by the
// tier-keyed lookup. Its own command/args (mirroring judge-discovery's
// already-correct shape) must now resolve directly via executors.
test('resolveExecutorCommand resolves "judge-decompose" through its own executors entry, args containing "Read"', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}', '--allowedTools', 'Bash(git add:*),Bash(git commit:*)'] },
    executors: {
      'judge-decompose': {
        kind: 'agent',
        invocations: [{ id: 'judge-decompose-cli', via: 'cli', command: 'claude', args: ['{prompt}', '--allowedTools', 'Task,WebSearch,WebFetch,Read,Bash(rg:*),Bash(git add:*),Bash(git commit:*)'] }]
      },
    },
    modelPolicies: { claude: { nano: 'haiku', standard: 'sonnet', frontier: 'opus' }, node: { nano: 'haiku', standard: 'sonnet', frontier: 'opus' } },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'judge-decompose' });
  assert.ok(resolved.args.some((arg) => arg.includes('Read')));
});

test('resolveExecutorCommand with a executors block present but no matching executorId stays on today\'s tier/global behavior, byte-identical', () => {
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { 'some-other-executor': { kind: 'agent', invocations: [{ id: 'some-other-executor-cli', via: 'cli', command: '/other/executor', args: ['{prompt}'] }] } },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'fgos-code-implement' });
  assert.equal(resolved.command, '/global/executor');
});

test('resolveExecutorCommand result carries "provider", defaulting to "command" when the executor block declares no explicit provider alias', () => {
  const cfg = { executor: { command: '/global/executor', args: ['{prompt}'] }, modelPolicies: { claude: { standard: 'sonnet' } }, timeoutMs: 5000 };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'm' });
  assert.equal(resolved.provider, '/global/executor');
});

test('resolveExecutorCommand result carries an explicit "provider" alias when the executor block declares one', () => {
  const cfg = { executor: { command: '/usr/local/bin/agy-cli', provider: 'agy', args: ['{prompt}'] }, modelPolicies: { claude: { standard: 'sonnet' } }, timeoutMs: 5000 };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'm' });
  assert.equal(resolved.provider, 'agy');
  assert.equal(resolved.command, '/usr/local/bin/agy-cli');
});

// tsk-2uf-1 Phase 00 R6 follow-up: no cited existing test discriminated
// this fallback (each either pinned an explicit "provider" alias, or had
// no providerModel with a command for which the old and new fallback
// coincidentally agreed) -- glm-cli's real shape (a "claude" command
// routed to z-ai via env override, no "provider" alias of its own) is the
// one case where the old fallback (raw executor.command, "claude") and
// the new one (governance.providerFamily, "z-ai") actually diverge.
test('resolveExecutorCommand result carries the providerModel-derived family, not the raw command, for an executor with providerModel set and no "provider" alias (glm-cli shape)', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: {
      'glm-cli': {
        kind: 'agent',
        providerModel: 'z-ai',
        allowCrossProvider: true,
        invocations: [{ via: 'cli', adapter: 'cli-spawn', command: 'claude', args: ['{prompt}'] }],
      },
    },
    modelPolicies: { claude: { standard: 'sonnet' } },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'm', executorId: 'glm-cli' });
  assert.equal(resolved.command, 'claude');
  assert.equal(resolved.provider, 'z-ai');
  assert.notEqual(resolved.provider, resolved.command);
});

test('resolveExecutorCommand throws a RunnerConfigError when a kind:"cli" executor is not registered and fgosDir is given', () => {
  const dir = initializeWorkRepository(mkTempDir());
  initStore(dir);
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { 'fgos-code-implement': { kind: 'agent', target: 'agy' } },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    timeoutMs: 5000,
  };
  assert.throws(
    () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'fgos-code-implement', fgosDir: dir }),
    RunnerConfigError,
  );
});

test('resolveExecutorCommand throws a RunnerConfigError when a kind:"cli" executor is registered but not present on this machine', () => {
  const dir = initializeWorkRepository(mkTempDir());
  initStore(dir);
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { 'fgos-code-implement': { kind: 'agent', target: 'agy-definitely-not-on-path-xyz' } },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    timeoutMs: 5000,
  };
  assert.throws(
    () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'fgos-code-implement', fgosDir: dir }),
    RunnerConfigError,
  );
});

test('resolveExecutorCommand resolves a metadata-only kind:"cli" executor straight through to the global executor for the command (executors.<tier> is retired, no intermediate stop)', () => {
  const dir = initializeWorkRepository(mkTempDir());
  initStore(dir);
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { 'fgos-code-implement': { kind: 'agent', target: 'agy', tier: 'standard', allowCrossProvider: true } },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'fgos-code-implement', fgosDir: dir });
  assert.equal(resolved.command, '/global/executor');
});

test('resolveExecutorCommand skips the fgos-tool-query presence check entirely when fgosDir is omitted, even with a kind:"cli" executor present', () => {
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { 'fgos-code-implement': { kind: 'agent', target: 'agy-not-registered-anywhere', allowCrossProvider: true } },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    timeoutMs: 5000,
  };
  assert.doesNotThrow(() =>
    resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'fgos-code-implement' }),
  );
});

// --- presence/cross-provider gate predicate (D13, tsk-592):
// kind === 'cli' -> kind !== 'task' -- mcp/skill/http/binary executors are
// now gated the same way a kind:"cli" executor always has been ------------

for (const kind of ['mcp', 'skill', 'http', 'binary']) {
  test(`resolveExecutorCommand throws a RunnerConfigError when a kind:"${kind}" executor is not registered and fgosDir is given (D13)`, () => {
    const dir = initializeWorkRepository(mkTempDir());
    initStore(dir);
    const cfg = {
      executor: { command: '/global/executor', args: ['{prompt}'] },
      executors: { 'fgos-code-implement': { kind, target: 'agy' } },
      modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
      timeoutMs: 5000,
    };
    assert.throws(
      () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'fgos-code-implement', fgosDir: dir }),
      RunnerConfigError,
    );
  });

  test(`resolveExecutorCommand throws a RunnerConfigError when a kind:"${kind}" executor is registered but not present on this machine (D13)`, () => {
    const dir = initializeWorkRepository(mkTempDir());
    initStore(dir);
    const scanTarget = ['mcp', 'skill'].includes(kind) ? mkTempDir() : undefined;
    const cfg = {
      executor: { command: '/global/executor', args: ['{prompt}'] },
      executors: { 'fgos-code-implement': { kind, target: 'agy-definitely-not-on-path-xyz' } },
      modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
      timeoutMs: 5000,
    };
    assert.throws(
      () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'fgos-code-implement', fgosDir: dir }),
      RunnerConfigError,
    );
  });

  test(`resolveExecutorCommand throws when a kind:"${kind}" executor resolves to a non-Claude command with no allowCrossProvider (D13)`, () => {
    const cfg = {
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { 'fgos-code-implement': { kind, invocations: [{ id: 'fgos-code-implement-cli', via: 'cli', command: 'agy', args: ['{prompt}'] }] } },
      modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
      timeoutMs: 5000,
    };
    assert.throws(
      () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'fgos-code-implement' }),
      RunnerConfigError,
    );
  });
}

test('resolveExecutorCommand still skips both the presence check and the cross-provider check for a kind:"task" executor, even unregistered and non-Claude-shaped (D13: kind !== "task" excludes task by construction)', () => {
  const dir = initializeWorkRepository(mkTempDir());
  initStore(dir);
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { 'my-agent-executor': { kind: 'agent', agentType: 'code-simplifier' } },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    timeoutMs: 5000,
  };
  assert.doesNotThrow(() =>
    resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'my-agent-executor', fgosDir: dir }),
  );
});

// executors.<id>.needs/for presence-matching (D5/D6, tsk-1o7, US-027) was
// retired at tsk-5tm-1 D1: resolveExecutorConfig no longer runs any
// presence/staleness gate at all (dead code -- 2/3 real entries were
// kind:"task", the third's needs added no signal beyond the OS's own
// ENOENT). The 2 tests that lived here asserted that gate's own
// capability-match behavior, which no longer exists to test -- removed
// rather than left passing for the wrong reason (trivial doesNotThrow with
// no gate underneath it).

// --- executors.<id>.agentType (D1/D2, tsk-3sw): kind:"task" executor with
// no own command/args resolves via a synthesized executor, Claude-only ---

function agentTypeCfg() {
  return {
    executor: {
      command: 'claude',
      args: ['-p', '{prompt}', '--model', '{model}', '--permission-mode', 'acceptEdits', '--allowedTools', 'Bash(git add:*),Bash(git commit:*)'],
    },
    executors: { 'my-agent-executor': { kind: 'agent', agentType: 'code-simplifier' } },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    timeoutMs: 5000,
  };
}

test('resolveExecutorCommand resolves a kind:"task" executor naming only agentType into the global executor\'s own command, args minus --model, plus --agent <agentType>', () => {
  const cfg = agentTypeCfg();
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'my-agent-executor' });
  assert.equal(resolved.command, 'claude');
  assert.deepEqual(resolved.args, [
    '-p', 'p', '--permission-mode', 'acceptEdits', '--allowedTools', 'Bash(git add:*),Bash(git commit:*)', '--agent', 'code-simplifier',
  ]);
  assert.ok(!resolved.args.includes('--model'));
});

test('resolveExecutorCommand resolves an agentType executor identically whether fgosDir is given (cli-dispatch/spawnWorker-style) or omitted (task-dispatch-style)', () => {
  const cfg = agentTypeCfg();
  const dir = initializeWorkRepository(mkTempDir());
  initStore(dir);
  const withFgosDir = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'my-agent-executor', fgosDir: dir });
  const withoutFgosDir = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'my-agent-executor' });
  // command/args/adapter/provider (the actual agentType-resolution shape this
  // test is about) stay identical regardless of fgosDir. baseCommit/headRef
  // (tsk-2ig attestation) are deliberately excluded here: they are ONLY
  // attempted when fgosDir is given (mkTempDir() is not a git repo, so both
  // happen to read back null today, but that is not this test's concern).
  const { baseCommit: _bc1, headRef: _hr1, ...withFgosDirShape } = withFgosDir;
  const { baseCommit: _bc2, headRef: _hr2, ...withoutFgosDirShape } = withoutFgosDir;
  assert.deepEqual(withFgosDirShape, withoutFgosDirShape);
});

// --- D20/D22 resolvedAgentType wiring (review finding H1, tsk-397): a
// caller-supplied dynamic resolution (resolveAgentTypeForTaskSpec, via
// spawnWorker's own resolveAgentTypeForWork) fills in
// ONLY when the executor is command-less/agent-type-shaped and declares no
// static agentType of its own -- exactly the same branch the static
// agentTypeCfg() tests above exercise, just fed dynamically instead of
// from static config ---

test('resolveExecutorCommand uses a caller-supplied resolvedAgentType when the executor is command-less and declares no static agentType of its own', () => {
  const cfg = {
    executor: { command: 'claude', args: ['-p', '{prompt}', '--model', '{model}'] },
    executors: { 'my-agent-executor': { kind: 'agent' } }, // no static agentType
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'my-agent-executor', resolvedAgentType: 'fgos-placeholder' });
  assert.deepEqual(resolved.args, ['-p', 'p', '--agent', 'fgos-placeholder']);
});

test('resolveExecutorCommand prefers a static agentType over a caller-supplied resolvedAgentType — an executor\'s own config always wins first (D2 precedence, unchanged)', () => {
  const cfg = agentTypeCfg(); // executors['my-agent-executor'].agentType = 'code-simplifier'
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'my-agent-executor', resolvedAgentType: 'a-different-agent' });
  assert.ok(resolved.args.includes('code-simplifier'));
  assert.ok(!resolved.args.includes('a-different-agent'));
});

test('resolveExecutorCommand ignores resolvedAgentType entirely for an executor with its own command/args (agy/claude/codex/pi\'s real shape) — the D20 wiring never changes dispatch for any executor this repo actually configures today', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { agy: { kind: 'agent', invocations: [{ id: 'agy-cli', via: 'cli', command: 'agy', args: ['-p', '{prompt}'] }],  allowCrossProvider: true } },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'agy', resolvedAgentType: 'fgos-placeholder' });
  assert.equal(resolved.command, 'agy');
  assert.ok(!resolved.args.includes('--agent'));
  assert.ok(!resolved.args.includes('fgos-placeholder'));
});

test('resolveExecutorCommand omitting resolvedAgentType is byte-identical to every pre-D20-wiring caller', () => {
  const cfg = {
    executor: { command: 'claude', args: ['-p', '{prompt}', '--model', '{model}'] },
    executors: { 'my-agent-executor': { kind: 'agent' } },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'my-agent-executor' });
  assert.ok(!resolved.args.includes('--agent'));
  // Falls through to the global executor (no adapter/command resolved via agentType) unchanged.
  assert.equal(resolved.command, 'claude');
  assert.deepEqual(resolved.args, ['-p', 'p', '--model', 'sonnet']);
});

test('resolveExecutorCommand still prefers a executor\'s own command/args over agentType when both are declared (judge-discovery\'s real shape) — agentType is never consulted', () => {
  const cfg = {
    executor: { command: 'claude', args: ['-p', '{prompt}', '--model', '{model}'] },
    executors: {
      'judge-discovery': {
        kind: 'agent',
        agentType: 'should-never-be-used',
        invocations: [{ id: 'judge-discovery-cli', via: 'cli', command: 'claude', args: ['-p', '{prompt}', '--model', '{model}', '--allowedTools', 'Task,Bash(rg:*)'] }]
      },
    },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'judge-discovery' });
  assert.deepEqual(resolved.args, ['-p', 'p', '--model', 'sonnet', '--allowedTools', 'Task,Bash(rg:*)']);
  assert.ok(!resolved.args.includes('--agent'));
});

test('resolveExecutorCommand falls through to the global executor for a executor with neither command/args nor agentType', () => {
  // Claude command here, same reason as the sibling metadata-only test
  // above (D5, tsk-in1-4): unrelated to cross-provider governance.
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { 'fgos-code-implement': { kind: 'agent', tier: 'standard' } },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'fgos-code-implement' });
  assert.equal(resolved.command, 'claude');
});

// --- decideDispatchMechanism (tsk-3ik-1, Native-First Dispatch Doctrine
// rules 1/2/4, decision 0026) — pure decision, no cfg lookup ---

test('decideDispatchMechanism: no native mechanism always resolves out-of-process, regardless of live access or force flag (rule 1)', () => {
  assert.equal(decideDispatchMechanism({ hasNativeMechanism: false, hasLiveTaskAccess: true, forceCliSpawn: false }), 'out-of-process');
  assert.equal(decideDispatchMechanism({ hasNativeMechanism: false, hasLiveTaskAccess: false, forceCliSpawn: false }), 'out-of-process');
  assert.equal(decideDispatchMechanism({}), 'out-of-process');
});

test('decideDispatchMechanism: native mechanism + live Task access + no force -> in-process (rule 2)', () => {
  assert.equal(decideDispatchMechanism({ hasNativeMechanism: true, hasLiveTaskAccess: true, forceCliSpawn: false }), 'in-process');
});

test('decideDispatchMechanism: native mechanism but no live Task access -> out-of-process (safe fallback, never assumes access)', () => {
  assert.equal(decideDispatchMechanism({ hasNativeMechanism: true, hasLiveTaskAccess: false, forceCliSpawn: false }), 'out-of-process');
});

test('decideDispatchMechanism: forceCliSpawn wins over native mechanism + live Task access (rule 4 exception)', () => {
  assert.equal(decideDispatchMechanism({ hasNativeMechanism: true, hasLiveTaskAccess: true, forceCliSpawn: true }), 'out-of-process');
});


test('the CLI entrypoint guard still fires when dispatch.mjs is invoked through a symlink sitting in a path with a space', () => {
  // Regression for the same silent-no-op class run-tests.mjs had: a raw
  // `import.meta.url === \`file://${process.argv[1]}\`` guard never matches
  // when argv[1] is a symlink (import.meta.url resolves to the REAL file)
  // or when the invocation path contains a space (import.meta.url
  // percent-encodes it, the raw template literal never does). Neither
  // requires copying dispatch.mjs's whole barrel/dispatch/* module tree --
  // a symlink still resolves its relative imports against the real file's
  // own location, so this exercises the guard alone.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch cli symlink-'));
  try {
    assert.match(dir, / /, 'fixture dir must actually contain a space to exercise this case');
    const dispatchPath = path.resolve('src/runner/dispatch.mjs');
    const link = path.join(dir, 'dispatch-link.mjs');
    fs.symlinkSync(dispatchPath, link);
    const result = spawnSync(process.execPath, [link, 'reconcile'], { encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /dispatch reconcile requires a run directory/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('an unknown CLI subcommand still exits non-zero with a usage message naming fgos dispatch decide and fgos run, never resolve or execute', () => {
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(process.execPath, [dispatchPath, 'bogus'], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unknown subcommand/);
  assert.doesNotMatch(result.stderr, /resolve <executorId>/);
  assert.doesNotMatch(result.stderr, /execute <executorId>/);
  assert.match(result.stderr, /fgos dispatch decide/);
  assert.match(result.stderr, /fgos run "<prompt>"/);
});

// --- tsk-129: the "execute" CLI entry point tees live chunks to stderr ---
// (P39's onChunk mechanism already existed and was already tested at the
// spawnWorker/adapter layer; the CLI entrypoint's `execute` branch simply
// never wired it in, so a real spawned `execute` call stayed silent from
// the one "fgos: dispatch ..." line until the final JSON, however long the
// child actually ran -- RESEARCH.md's own finding for this item.)

// --- tsk-322: guard helper for --repo-root without --cwd when process.cwd() diverges ---

// spawnWorker runs a Work item's worker as one Unit run; its contract (fields, error classes,
// limits the launch enforces) is tested in test/runner/spawn-worker.test.mjs.

// --- cross-provider governance (D2/D3, tsk-32n) --------------------------
// fgosDir omitted on purpose in most of these (mirroring the existing
// precedence tests above): the D6 tool-registration check only fires when
// fgosDir is given, and these tests isolate the D2/D3 governance check from
// that unrelated existing behavior. The one test that exercises both
// together registers+marks-present the executor first, same as the
// existing D6 tests do.

test('resolveExecutorCommand throws when a kind:"cli" executor resolves to a non-Claude command with no allowCrossProvider', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { 'fgos-code-implement': { kind: 'agent', invocations: [{ id: 'fgos-code-implement-cli', via: 'cli', command: 'agy', args: ['{prompt}'] }] } },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    timeoutMs: 5000,
  };
  assert.throws(
    () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'fgos-code-implement' }),
    RunnerConfigError,
  );
});

test('resolveExecutorCommand dispatches normally when the same non-Claude executor sets allowCrossProvider: true', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { 'fgos-code-implement': { kind: 'agent', invocations: [{ id: 'fgos-code-implement-cli', via: 'cli', command: 'agy', args: ['{prompt}'] }],  allowCrossProvider: true } },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'fgos-code-implement' });
  assert.equal(resolved.command, 'agy');
});

test('resolveExecutorCommand never requires allowCrossProvider for a kind:"cli" executor naming no command of its own, falling through to the global Claude executor', () => {
  // The exact false-positive D2 was written to rule out: kind:"cli" alone
  // (metadata-only, no command/adapter override) must NOT gate on
  // allowCrossProvider when the final resolved command is Claude's own.
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { 'fgos-code-implement': { kind: 'agent' } },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'fgos-code-implement' });
  assert.equal(resolved.command, 'claude');
});

test('resolveExecutorCommand never requires allowCrossProvider for a kind:"cli" executor that resolves to Claude\'s own CLI', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { 'fgos-code-implement': { kind: 'agent', invocations: [{ id: 'fgos-code-implement-cli', via: 'cli', command: 'claude', args: ['{prompt}'] }] } },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'fgos-code-implement' });
  assert.equal(resolved.command, 'claude');
});

test('resolveExecutorCommand cross-provider governance is kind-independent (D5, tsk-in1-4): a kind:"tool" executor resolving to a non-Claude command via its own flat command/args still needs allowCrossProvider — no kind alone ever exempts it, only an agentType-resolved path does (kind:"task" used to be the exempt-by-kind value; retired)', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { distill: { kind: 'tool', invocations: [{ id: 'distill-cli', via: 'cli', command: 'agy', args: ['{prompt}'] }] } },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    timeoutMs: 5000,
  };
  assert.throws(
    () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'distill' }),
    RunnerConfigError,
  );
  cfg.executors.distill.allowCrossProvider = true;
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'distill' });
  assert.equal(resolved.command, 'agy');
});

test('resolveExecutorCommand exempts an agentType-resolved executor from cross-provider governance regardless of kind — it always reuses the global executor\'s own command (always Claude in practice), never a real non-Claude backend', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { 'my-agent': { kind: 'agent', agentType: 'general-purpose' } },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'my-agent' });
  assert.equal(resolved.command, 'claude');
});

test('resolveExecutorCommand with no executors block at all never triggers cross-provider governance, byte-identical to pre-tsk-32n behavior', () => {
  const cfg = {
    executor: { command: 'agy', args: ['{prompt}'] },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard' });
  assert.equal(resolved.command, 'agy');
});

test('resolveExecutorCommand throws for a non-Claude "cli" executor even when fgosDir is given (cross-provider governance is independent of the retired presence gate, tsk-5tm-1 D1)', () => {
  const dir = initializeWorkRepository(mkTempDir());
  initStore(dir);
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { 'fgos-code-implement': { kind: 'agent', invocations: [{ id: 'fgos-code-implement-cli', via: 'cli', command: 'agy', args: ['{prompt}'] }] } },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    timeoutMs: 5000,
  };
  assert.throws(
    () =>
      resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'fgos-code-implement', fgosDir: dir }),
    RunnerConfigError,
  );
});

function writeRunnerConfigFixture(root, cfg) {
  fs.mkdirSync(fgosDirFromRoot(root), { recursive: true });
  // `execute <agent>` names the capability it runs under; every fixture
  // carries the writing one the CLI tests dispatch with.
  const capabilities = { execute: { serves: { outputKind: 'change', mutates: true } }, ...cfg.capabilities };
  // A project config as setup writes it: with the seat-binding schema marker.
  const patterns = { ...cfg.patterns, seatBinding: { schema: 1 } };
  writeProjectConfig(root, { runner: { ...cfg, capabilities, patterns } });
}

// --- executors.<id>.carries (D15, tsk-5td; first real consumer tsk-2ie5/
// tsk-2c1) — a real pre-dispatch gate on the ACTUAL content class a caller declares it's sending ---

// --- tsk-45f piece 3: an mcp invocation's optional "tools" capability->tool map --

test('the runner config check accepts an mcp invocation\'s "tools" map when every key is declared in "capabilities"', () => {
  const runner = {
    executor: { command: 'claude', args: ['{prompt}'] },
    capabilities: { 'impact-analysis': { prefer: 'gitnexus' } },
    executors: {
      gitnexus: {
        kind: 'tool',
        for: ['impact-analysis'],
        invocations: [{ via: 'mcp', command: 'mcp:gitnexus', tools: { 'impact-analysis': 'mcp__gitnexus__impact' } }],
      },
    },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } },
    timeoutMs: 1000,
  };
  assert.doesNotThrow(() => validateRunnerConfigShape(runner, 'test'));
});

test('the runner config check rejects an mcp invocation\'s "tools" map whose key is not declared in "capabilities"', () => {
  const runner = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: {
      gitnexus: {
        kind: 'tool',
        invocations: [{ via: 'mcp', command: 'mcp:gitnexus', tools: { 'not-declared-anywhere': 'mcp__gitnexus__impact' } }],
      },
    },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    timeoutMs: 1000,
  };
  assert.throws(() => validateRunnerConfigShape(runner, 'test'), RunnerConfigError);
});

function carriesCfg(carries) {
  return {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { gather: { kind: 'agent', invocations: [{ id: 'gather-cli', via: 'cli', command: 'agy', args: ['{prompt}'] }],  for: ['judge'], carries, allowCrossProvider: true } },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    timeoutMs: 5000,
  };
}

test('resolveExecutorCommand throws when a executor declares carries but the caller declares no contentCarries at all (fail closed, never silently allow)', () => {
  const cfg = carriesCfg('user-text');
  assert.throws(
    () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'gather' }),
    RunnerConfigError,
  );
});

test('resolveExecutorCommand throws when contentCarries is not one of EXECUTOR_CARRIES', () => {
  const cfg = carriesCfg('repo-content');
  assert.throws(
    () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'gather', contentCarries: 'nonsense' }),
    RunnerConfigError,
  );
});

test('resolveExecutorCommand refuses a "carries: user-text" executor handed repo-content — refused before spawn (D15 verify item 8)', () => {
  const cfg = carriesCfg('user-text');
  assert.throws(
    () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'gather', contentCarries: 'repo-content' }),
    RunnerConfigError,
  );
});

test('resolveExecutorCommand accepts a "carries: user-text" executor handed user-text (exact match)', () => {
  const cfg = carriesCfg('user-text');
  assert.doesNotThrow(() =>
    resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'gather', contentCarries: 'user-text' }),
  );
});

test('resolveExecutorCommand accepts a "carries: repo-content" executor handed EITHER content class — the wider permission covers both', () => {
  const cfg = carriesCfg('repo-content');
  assert.doesNotThrow(() =>
    resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'gather', contentCarries: 'user-text' }),
  );
  assert.doesNotThrow(() =>
    resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'gather', contentCarries: 'repo-content' }),
  );
});

test('resolveExecutorCommand never triggers the carries gate for a executor that declares no carries at all — byte-identical to every pre-D15 executor', () => {
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { 'submit-assist-classify': { kind: 'agent', invocations: [{ id: 'submit-assist-classify-cli', via: 'cli', command: 'agy', args: ['{prompt}'] }],  allowCrossProvider: true } },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    timeoutMs: 5000,
  };
  assert.doesNotThrow(() =>
    resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'submit-assist-classify' }),
  );
});

// --- lookupExecutor and purposeSeatOf: a name is looked up as an executor id first, and a purpose
// (a capability row name) is answered by what serves it -- a tool's live probe, else Seat Binding -------

test('lookupExecutor never binds a purpose, neither through a capability prefer nor through an executor\'s own "for"', () => {
  const cfg = {
    executors: { 'totally-unrelated-name': { kind: 'agent', invocations: [{ id: 'totally-unrelated-name-cli', via: 'cli', command: 'agy' }], for: ['review'] }, agy: { kind: 'agent', invocations: [{ id: 'agy-cli', via: 'cli', command: 'agy' }]} },
    capabilities: { 'fgos-coding-implement': { prefer: 'agy' } },
  };
  for (const purpose of ['review', 'fgos-coding-implement']) {
    const result = lookupExecutor(cfg, purpose);
    assert.equal(result.executorId, null);
    assert.equal(result.configured, false);
  }
});

const PURPOSE_MODELS = { claude: { standard: 'sonnet' }, gemini: { standard: 'gemini-flash' } };

test('purposeSeatOf answers a purpose with the executor Seat Binding binds, its invocation and the binding itself', () => {
  const cfg = bindable({
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: {
      claude: {
        kind: 'agent',
        providerModel: 'claude',
        invocations: [
          { id: 'cli', via: 'cli', command: 'claude', args: ['{prompt}', '--full'] },
          { id: 'cli-bwrap', via: 'cli', command: 'claude', args: ['{prompt}', '--bwrap'], confinement: { backend: 'bwrap' } },
        ],
      },
    },
    capabilities: { advise: { prefer: [{ executor: 'claude', invocation: 'cli-bwrap' }] } },
    modelPolicies: PURPOSE_MODELS,
  });
  const answer = purposeSeatOf(cfg, 'advise');
  assert.equal(answer.configured, true);
  assert.equal(answer.executorId, 'claude');
  assert.equal(answer.executor, cfg.executors.claude);
  assert.equal(answer.invocationId, 'cli-bwrap');
  assert.equal(answer.bindingSource, 'seat-binding');
  assert.equal(answer.binding.executor, 'claude');
  assert.equal(answer.binding.invocation, 'cli-bwrap');
});

test('purposeSeatOf names the next prefer entry when the first one\'s CLI is not on this machine, where a first-entry read named the absent one', () => {
  const cfg = bindable({
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: {
      absent: { kind: 'agent', providerModel: 'gemini', invocations: [{ id: 'absent-cli', via: 'cli', command: 'fgos-test-cli-that-is-not-installed', args: ['{prompt}'] }],  allowCrossProvider: true },
      agy: { kind: 'agent', providerModel: 'gemini', invocations: [{ id: 'agy-cli', via: 'cli', command: 'agy', args: ['{prompt}'] }],  allowCrossProvider: true },
    },
    capabilities: { judge: { prefer: ['absent', 'agy'] } },
    modelPolicies: PURPOSE_MODELS,
  });
  const answer = purposeSeatOf(cfg, 'judge');
  assert.equal(answer.executorId, 'agy');
  assert.equal(answer.bindingSource, 'seat-binding');
});

test('purposeSeatOf reports a refusal, not an executor, when no preferred executor can serve the seat', () => {
  const cfg = bindable({
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { agy: { kind: 'agent', providerModel: 'gemini', invocations: [{ id: 'agy-cli', via: 'cli', command: 'agy', args: ['{prompt}'] }],  allowCrossProvider: true } },
    capabilities: { judge: { prefer: 'agy' } },
    modelPolicies: { claude: { standard: 'sonnet' } },
  });
  const answer = purposeSeatOf(cfg, 'judge');
  assert.equal(answer.configured, true);
  assert.equal(answer.executorId, null);
  assert.equal(answer.refused.reason, 'tier-cell-missing');
  assert.match(answer.refused.detail, /judge/);
});

test('purposeSeatOf leaves a purpose with no pool of its own unconfigured, however many executors exist', () => {
  const cfg = bindable({
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { agy: { kind: 'agent', providerModel: 'gemini', invocations: [{ id: 'agy-cli', via: 'cli', command: 'agy', args: ['{prompt}'] }],  allowCrossProvider: true } },
    capabilities: { judge: {}, 'other:*': { prefer: 'agy' } },
    modelPolicies: PURPOSE_MODELS,
  });
  for (const purpose of ['judge', 'other:thing', 'no-such-purpose']) {
    const answer = purposeSeatOf(cfg, purpose);
    assert.equal(answer.configured, false, purpose);
    assert.equal(answer.executorId, null, purpose);
  }
});

test('a string prefer naming an agent executor does not make its capability a candidate when that executor is asked about', () => {
  const cfg = {
    executors: { agy: { kind: 'agent', invocations: [{ id: 'agy-cli', via: 'cli', command: 'agy' }]} },
    capabilities: { judge: { prefer: 'agy' } },
  };
  const { capability } = resolveCapabilityDetailsFromHints({ cfg, executorId: 'agy', resolvedExecutor: cfg.executors.agy, hints: {} });
  assert.equal(capability, 'agy');
});

test('resolveExecutorCommand\'s allowCrossProvider error names the executor and the executors key to set the flag on', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { agy: { kind: 'agent', invocations: [{ id: 'agy-cli', via: 'cli', command: 'agy', args: ['{prompt}'] }] } }, // no allowCrossProvider
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
  };
  assert.throws(
    () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'agy' }),
    (err) => {
      assert.match(err.message, /executor "agy"/);
      assert.match(err.message, /Set executors\.agy\.allowCrossProvider: true/);
      return true;
    },
  );
});

// --- capabilities.<name>.prefer/overrides shape validation (D2) -----------

test('the runner config check accepts "prefer" naming a real executor that declares no matching "for" (D5 -- supersedes D2\'s own load-time symmetry check)', () => {
  const runner = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { agy: { kind: 'agent' } }, // no "command"/"args"/"for" at all
    capabilities: { 'fgos-coding-implement': { prefer: 'agy' } },
    modelPolicies: { claude: { standard: 'sonnet' } },
    defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } },
    timeoutMs: 1000,
  };
  assert.doesNotThrow(() => validateRunnerConfigShape(runner, 'test'));
});

test('the runner config check rejects "prefer" naming an executor id that does not exist at all', () => {
  const runner = {
    executor: { command: 'claude', args: ['{prompt}'] },
    capabilities: { 'fgos-coding-implement': { prefer: 'no-such-executor' } },
    modelPolicies: { claude: { standard: 'sonnet' } },
    timeoutMs: 1000,
  };
  assert.throws(() => validateRunnerConfigShape(runner, 'test'), RunnerConfigError);
});

// --- executor-id-consolidation Step 2.2: "prefer" as an ORDERED candidate
// array (cascade, account-rotator-style), each entry a bare executor-id
// string or {executor, invocation?} ----------------------------------------

test('the runner config check accepts "prefer" as an array of bare executor-id strings', () => {
  const runner = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { agy: { kind: 'agent' }, claude2: { kind: 'agent' } },
    capabilities: { advise: { prefer: ['agy', 'claude2'] } },
    modelPolicies: { claude: { standard: 'sonnet' } },
    defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } },
    timeoutMs: 1000,
  };
  assert.doesNotThrow(() => validateRunnerConfigShape(runner, 'test'));
});

test('the runner config check accepts "prefer" as an array of {executor, invocation} objects when the invocation id is really declared', () => {
  const runner = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: {
      claude: { kind: 'agent', invocations: [{ id: 'cli-bwrap', via: 'cli', command: 'claude', args: ['{prompt}'] }] },
      agy: { kind: 'agent', invocations: [{ id: 'cli-bwrap', via: 'cli', command: 'agy', args: ['{prompt}'] }] },
    },
    capabilities: {
      advise: { prefer: [{ executor: 'claude', invocation: 'cli-bwrap' }, { executor: 'agy', invocation: 'cli-bwrap' }] },
    },
    modelPolicies: { claude: { standard: 'sonnet' } },
    defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } },
    timeoutMs: 1000,
  };
  assert.doesNotThrow(() => validateRunnerConfigShape(runner, 'test'));
});

test('the runner config check rejects a "prefer" array naming an invocation id that is not declared on that executor', () => {
  const runner = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { claude: { kind: 'agent', invocations: [{ id: 'cli', via: 'cli', command: 'claude', args: ['{prompt}'] }] } },
    capabilities: { advise: { prefer: [{ executor: 'claude', invocation: 'cli-bwrap' }] } },
    modelPolicies: { claude: { standard: 'sonnet' } },
    timeoutMs: 1000,
  };
  assert.throws(
    () => validateRunnerConfigShape(runner, 'test'),
    (err) => err instanceof RunnerConfigError && /invocation "cli-bwrap" on executor "claude" but no such invocation id is declared/.test(err.message),
  );
});

test('resolveExecutorConfig resolves the confined invocation Seat Binding bound, named by its invocation id', () => {
  const cfg = {
    executor: { command: 'node', args: ['{prompt}'] },
    executors: {
      claude: {
        kind: 'agent',
        invocations: [
          { id: 'cli', via: 'cli', command: 'claude', args: ['{prompt}', '--full'] },
          { id: 'cli-bwrap', via: 'cli', command: 'claude', args: ['{prompt}', '--bwrap'] },
        ],
      },
    },
  };
  const resolved = resolveExecutorConfig(cfg, 'standard', 'claude', undefined, undefined, undefined, 'cli-bwrap');
  assert.deepEqual(resolved.args, ['{prompt}', '--bwrap']);
});

test('executorIdForWork is exported and resolves a coding-domain (or no-domain) work item to fgos-coding-implement, the same lookup spawnWorker already applies internally', () => {
  assert.equal(executorIdForWork(sampleWork()), 'fgos-coding-implement');
});

test('executorIdForWork respects the step parameter and the work.workflowStep property, and has length 2 (dead role param removed)', () => {
  assert.equal(executorIdForWork.length, 2);
  assert.equal(executorIdForWork(sampleWork(), 'discovery'), 'fgos-coding-discovering');
  assert.equal(executorIdForWork(sampleWork(), 'planning'), 'fgos-coding-planning');
  assert.equal(executorIdForWork({ domain: 'coding', workflowStep: 'exploring' }), 'fgos-coding-exploring');
  assert.equal(executorIdForWork({ domain: 'coding', workflowStep: 'planning' }), 'fgos-coding-planning');
});

test('resolveAgentTypeForTaskSpec implements D32 tie-break scenarios correctly', () => {
  const agentDefs = [
    { name: 'agent-alpha', skills: ['code-review', 'implementation'] },
    { name: 'agent-beta', skills: ['implementation', 'planning'] },
    { name: 'agent-gamma', skills: ['code-review'] },
  ];

  // (a) agent: pin in taskSpec header wins outright, skipping skill matching
  assert.equal(
    resolveAgentTypeForTaskSpec(
      { agent: ['agent-gamma'], 'requires-skill': ['implementation'] },
      agentDefs,
      'agent-alpha',
    ),
    'agent-gamma',
  );

  // (b) no pin, currentAgentType matches requires-skill -> stay with currentAgentType
  assert.equal(
    resolveAgentTypeForTaskSpec(
      { 'requires-skill': ['implementation'] },
      agentDefs,
      'agent-beta',
    ),
    'agent-beta',
  );

  // (c) no pin, currentAgentType doesn't match -> select first matching agent in declaration order
  assert.equal(
    resolveAgentTypeForTaskSpec(
      { 'requires-skill': ['implementation'] },
      agentDefs,
      'agent-gamma',
    ),
    'agent-alpha',
  );
});

test('resolveAgentTypeForTaskSpec refuses (returns null) across all 4 unvalidated/mismatched fail-close sites', () => {
  const agentDefs = [
    { name: 'agent-alpha', skills: ['code-review', 'implementation'] },
    { name: 'agent-beta', skills: ['implementation', 'planning'] },
  ];

  // 1. null/falsy taskSpecHeader -> returns null
  assert.equal(resolveAgentTypeForTaskSpec(null, agentDefs, 'agent-alpha'), null);
  assert.equal(resolveAgentTypeForTaskSpec(undefined, agentDefs, 'agent-alpha'), null);

  // 2. pinned agent not in roster -> returns null (refuses unvalidated pinned name)
  assert.equal(
    resolveAgentTypeForTaskSpec({ agent: ['nonexistent-agent'] }, agentDefs, 'agent-alpha'),
    null,
  );

  // 3. no requires-skill & no pin -> returns null
  assert.equal(resolveAgentTypeForTaskSpec({}, agentDefs, 'agent-alpha'), null);
  assert.equal(resolveAgentTypeForTaskSpec({ 'requires-skill': [] }, agentDefs, 'agent-alpha'), null);
  assert.equal(resolveAgentTypeForTaskSpec({ 'requires-skill': '  ' }, agentDefs, 'agent-alpha'), null);

  // 4. no agent in roster matches required skills -> returns null
  assert.equal(
    resolveAgentTypeForTaskSpec(
      { 'requires-skill': ['nonexistent-skill'] },
      agentDefs,
      'agent-alpha',
    ),
    null,
  );
});

test('resolveWorkForDispatch hands dispatch a generic hint, never the Work item', () => {
  const root = mkTempDir();
  const fgosDir = initializeWorkRepository(root);
  addWork(fgosDir, { id: 'tsk-hint', title: 'Hint', kind: 'task', status: 'todo', deps: [], risk: 'heavy', refs: ['a.md'], verify: 'npm test', domain: 'coding' });
  const hint = resolveWorkForDispatch({ workId: 'tsk-hint', fgosDir });
  assert.deepEqual(Object.keys(hint).sort(), ['agentType', 'domain', 'rigor', 'workExecutorId']);
  assert.equal(hint.rigor, 'high', 'risk: heavy reaches dispatch as rigor high');
  assert.equal(hint.domain, 'coding');
  assert.equal(resolveWorkForDispatch({ workId: 'no-such-item', fgosDir }), null);
});

test('decide --work keeps the item rigor: a risk-heavy item plans at rigor high, a low item never drops below the capability floor', () => {
  const cfg = {
    executors: { 'fgos-coding-implement': { invocations: [{ id: 'fgos-coding-implement-cli', via: 'cli', command: 'claude', args: ['{prompt}'] }] } },
    capabilities: { 'fgos-coding-implement': { rigor: 'standard' } },
    modelPolicies: { claude: { standard: 's', flagship: 'f', frontier: 'x', nano: 'n' } },
  };
  const heavy = sampleWork({ id: 'tsk-heavy', risk: 'heavy' });
  const heavyPlan = compileDispatchPlan(cfg, { workId: heavy.id, workHint: workDispatchHint(heavy) });
  assert.equal(heavyPlan.executorId, 'fgos-coding-implement');
  assert.equal(heavyPlan.policy.rigor, 'high');
  const low = sampleWork({ id: 'tsk-low', rigor: 'low' });
  const lowPlan = compileDispatchPlan(cfg, { workId: low.id, workHint: workDispatchHint(low) });
  assert.equal(lowPlan.policy.rigor, 'standard', 'the capability floor is not lowered by the item rigor');
  const critical = sampleWork({ id: 'tsk-critical', rigor: 'critical' });
  assert.equal(compileDispatchPlan(cfg, { workId: critical.id, workHint: workDispatchHint(critical) }).policy.rigor, 'critical');
});

test('decide --work: an item with a malformed legacy rigor still resolves its executor, as before the hint', () => {
  const cfg = {
    executors: { 'fgos-coding-implement': { invocations: [{ id: 'fgos-coding-implement-cli', via: 'cli', command: 'claude', args: ['{prompt}'] }] } },
    modelPolicies: { claude: { standard: 's', flagship: 'f', frontier: 'x', nano: 'n' } },
  };
  const legacy = sampleWork({ id: 'tsk-legacy-rigor', rigor: 'extreme' });
  const hint = workDispatchHint(legacy);
  assert.equal(hint.rigor, 'extreme', 'handed on for dispatch to judge');
  const plan = compileDispatchPlan(cfg, { workId: legacy.id, workHint: hint });
  assert.equal(plan.executorId, 'fgos-coding-implement');
});

test('dispatch doors refuse a Work item instead of ignoring it', async () => {
  assert.throws(() => compileDispatchPlan({}, { work: 'tsk-x', workItem: { id: 'tsk-x' } }), /compileDispatchPlan\(\) takes no Work item/);
  await assert.rejects(() => executeAssignment({ assignmentId: 'a' }, { work: { id: 'tsk-x' } }), /executeAssignment\(\) takes no Work item/);
});

// --- CLI entry point: --for / --carries / the new "log" subcommand --------

// --- CLI subcommand --cwd flag coverage ---------------------------------

// --- fanout-batch and fgos schedule --candidates -------------------------

test('fanoutBatchExecutorCli returns slotsFull when worker slots ceiling is full', async () => {
  const repo = mkTempGitRepo();
  const fgosDir = repo.fgosDir;
  initStore(fgosDir);
  // Write shared config with ceiling = 1 into .fgos/config.json
  writeProjectConfig(repo.repoRoot, { workerSlots: { ceiling: 1 } });
  // Add 1 doing item to consume the slot
  addWork(fgosDir, { id: 't1', title: 'Running Item', kind: 'task', status: 'doing', domain: 'coding', workflowStep: 'executing', deps: [], refs: [], risk: 'light', verify: 'npm test' });

  const result = await fanoutBatchExecutorCli(['c1', 'c2'], { repoRoot: repo.repoRoot });
  assert.equal(result.slotsFull, true);
  assert.deepEqual(result.deferred, ['c1', 'c2']);
  assert.deepEqual(result.fired, []);
});

test('fanoutBatchExecutorCli trims candidates to free slots when ceiling is configured', async () => {
  const repo = mkTempGitRepo();
  const fgosDir = repo.fgosDir;
  initStore(fgosDir);
  writeProjectConfig(repo.repoRoot, { workerSlots: { ceiling: 1 } });

  // Planning-stage items: the standard registers a CLI executor for the executing stage, so only these hand back to the caller's own Task tool.
  addWork(fgosDir, { id: 'c1', title: 'Cand 1', kind: 'task', status: 'todo', domain: 'coding', workflowStep: 'planning', deps: [], refs: [], risk: 'light', verify: 'npm test' });
  addWork(fgosDir, { id: 'c2', title: 'Cand 2', kind: 'task', status: 'todo', domain: 'coding', workflowStep: 'planning', deps: [], refs: [], risk: 'light', verify: 'npm test' });

  const result = await fanoutBatchExecutorCli(['c1', 'c2'], { repoRoot: repo.repoRoot, hasLiveTaskAccess: true });
  assert.equal(result.slotsFull, undefined);
  assert.deepEqual(result.deferred, ['c2']);
  assert.equal(result.mechanismChanged.length, 1);
  assert.equal(result.mechanismChanged[0].id, 'c1');
});

test('fgos schedule --candidates filters schedule to specified candidates', () => {
  const repo = mkTempGitRepo();
  const fgosDir = repo.fgosDir;
  initStore(fgosDir);
  addWork(fgosDir, { id: 'w1', title: 'Item 1', kind: 'task', status: 'todo', domain: 'coding', workflowStep: 'executing', deps: [], refs: [], risk: 'light', verify: 'npm test' });
  addWork(fgosDir, { id: 'w2', title: 'Item 2', kind: 'task', status: 'todo', domain: 'coding', workflowStep: 'executing', deps: [], refs: [], risk: 'light', verify: 'npm test' });
  const fgosScript = path.resolve(process.cwd(), 'bin/fgos.mjs');

  const outAll = execFileSync(process.execPath, [fgosScript, 'schedule', '--json', '--dir', repo.repoRoot], { encoding: 'utf8' });
  const schedAll = JSON.parse(outAll);
  const wavesAll = schedAll.data ? schedAll.data.waves : schedAll.waves;
  assert.ok(wavesAll[0].includes('w1'));
  assert.ok(wavesAll[0].includes('w2'));

  const outScoped = execFileSync(process.execPath, [fgosScript, 'schedule', '--candidates', 'w1', '--json', '--dir', repo.repoRoot], { encoding: 'utf8' });
  const schedScoped = JSON.parse(outScoped);
  const wavesScoped = schedScoped.data ? schedScoped.data.waves : schedScoped.waves;
  assert.deepEqual(wavesScoped, [['w1']]);
});

/** Write a fake executor that commits an empty commit in whatever cwd it
 * runs in (the picked worktree, its own `cwd`) -- simulates a real worker actually doing+committing work, so
 * `fgos return` finds real progress to verify against. */
function writeCommittingExecutor(dir) {
  const scriptPath = path.join(dir, 'committing-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    import { execFileSync } from 'node:child_process';
    execFileSync('git', ['commit', '--allow-empty', '-m', 'fake work'], { stdio: 'ignore' });
    process.stdout.write(JSON.stringify({ ok: true }));
    process.exit(0);
    `,
  );
  return scriptPath;
}

test('fanoutBatchExecutorCli returns candidate as unavailable when executor is governance-blocked', async () => {
  const { repoRoot, fgosDir } = mkTempGitRepo();
  const dir = mkTempDir();
  const scriptPath = writeCommittingExecutor(dir);
  writeRunnerConfigFixture(repoRoot, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { 'fgos-coding-implement': { kind: 'agent', invocations: [{ id: 'fgos-coding-implement-cli', via: 'cli', command: process.execPath, args: [scriptPath] }] } },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    timeoutMs: 5000,
  });
  addWork(fgosDir, {
    id: 'cand1',
    title: 'Candidate 1',
    kind: 'task',
    status: 'todo',
    domain: 'coding',
    workflowStep: 'executing',
    deps: [],
    refs: [],
    risk: 'light',
    verify: process.platform === 'win32' ? 'node -e "process.exit(0)"' : 'true',
  });

  const result = await fanoutBatchExecutorCli(['cand1'], { repoRoot, hasLiveTaskAccess: false });

  assert.equal(result.fired.length, 0);
  assert.equal(result.mechanismChanged.length, 0);
  assert.equal(result.unavailable.length, 1);
  assert.equal(result.unavailable[0].id, 'cand1');
  assert.equal(result.unavailable[0].executorId, 'fgos-coding-implement');
});

// --- resolveAgentTypeForWork (D20/D22 wiring, review finding H1, tsk-397) ---
// DOMAINS.coding is a fixed, module-load-time registry (not injectable per
// call), so these fixtures write a real domains/coding/task-specs/
// implement-item.md + core/agents/*.yaml under a temp cwd -- the SAME
// taskSpec id DOMAINS.coding.taskSpecMap.executing already names
// ('implement-item', proven by the bundleForStage test above), just with a
// controlled header/roster so the resolution itself is isolated and
// deterministic.

function writeTaskSpecFixture(cwd, headerLine) {
  const dir = path.join(cwd, 'domains', 'coding', 'task-specs');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'implement-item.md'), `# task-spec: implement-item\n\n${headerLine}\n\n## Input\n`);
}

function writeAgentFixture(cwd, name, skills) {
  const dir = path.join(cwd, 'core', 'agents');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${name}.yaml`), `name: ${name}\nskills: [${skills.join(', ')}]\n`);
}

test('resolveAgentTypeForWork resolves the real coding/executing taskSpec (implement-item) against a controlled agent roster', () => {
  const cwd = mkTempDir();
  writeTaskSpecFixture(cwd, 'domain: coding | stage: executing | role: implementer | requires-skill: fgos-coding-implement');
  writeAgentFixture(cwd, 'general-worker', ['fgos-coding-implement', 'fgos-coding-planning']);

  const resolved = resolveAgentTypeForWork({ domain: 'coding', stage: 'executing' }, cwd, undefined, { payloadRoot: cwd });
  assert.equal(resolved, 'general-worker');
});

test('resolveAgentTypeForWork honors an explicit agent: pin over skill-matching (D32 tie-break priority 1)', () => {
  const cwd = mkTempDir();
  writeTaskSpecFixture(cwd, 'domain: coding | stage: executing | role: implementer | agent: pinned-worker | requires-skill: fgos-coding-implement');
  writeAgentFixture(cwd, 'general-worker', ['fgos-coding-implement']);
  writeAgentFixture(cwd, 'pinned-worker', []); // no matching skills -- the pin still wins

  const resolved = resolveAgentTypeForWork({ domain: 'coding', stage: 'executing' }, cwd, undefined, { payloadRoot: cwd });
  assert.equal(resolved, 'pinned-worker');
});

test('resolveAgentTypeForWork returns null when no real agentDefs exist to resolve against (empty roster is a legitimate "nothing to resolve", not an error)', () => {
  const cwd = mkTempDir();
  writeTaskSpecFixture(cwd, 'domain: coding | stage: executing | role: implementer | requires-skill: fgos-coding-implement');
  // No core/agents/ or domains/coding/agents/ written -- empty roster.
  const resolved = resolveAgentTypeForWork({ domain: 'coding', stage: 'executing' }, cwd, undefined, { payloadRoot: cwd });
  assert.equal(resolved, null);
});

test('resolveAgentTypeForWork names an unparsable agent file on stderr once per process, not on every lookup', () => {
  const cwd = mkTempDir();
  writeTaskSpecFixture(cwd, 'domain: coding | stage: executing | role: implementer | requires-skill: fgos-coding-implement');
  writeAgentFixture(cwd, 'general-worker', ['fgos-coding-implement']);
  fs.writeFileSync(path.join(cwd, 'core', 'agents', 'broken.yaml'), 'name: broken\ndescription: a: b\n');
  const written = [];
  const realWrite = process.stderr.write;
  process.stderr.write = (chunk) => { written.push(String(chunk)); return true; };
  try {
    for (let i = 0; i < 3; i += 1) assert.equal(resolveAgentTypeForWork({ domain: 'coding', stage: 'executing' }, cwd, undefined, { payloadRoot: cwd }), 'general-worker');
  } finally {
    process.stderr.write = realWrite;
  }
  const rosterWarnings = written.filter((line) => line.startsWith('warning: agent roster:'));
  assert.equal(rosterWarnings.length, 1);
  assert.match(rosterWarnings[0], /broken\.yaml: cannot be parsed: .*line 2/);
});

test('resolveAgentTypeForWork returns null for a stage with no registered taskSpec (bundleForStage\'s own {skill:null,taskSpec:null} case) -- nothing to resolve from', () => {
  const cwd = mkTempDir();
  const resolved = resolveAgentTypeForWork({ domain: 'coding', stage: 'nonexistent-stage' }, cwd, undefined, { payloadRoot: cwd });
  assert.equal(resolved, null);
});

// --- tsk-gb3: per-executor env overrides and GLM OpenRouter executor ---

test('resolveExecutorEnv substitutes ${VAR} against baseEnv and passes literals unchanged', () => {
  const baseEnv = {
    FOO: 'bar',
    EMPTY_VAR: '',
  };

  const rawEnv = {
    LITERAL: 'https://openrouter.ai/api',
    SUBSTITUTED: '${FOO}',
    SUBSTITUTED_EMPTY: '${EMPTY_VAR}',
    UNSET: '${UNSET_VAR}',
    EMPTY_LITERAL: '',
    MULTI: '${FOO}_baz_${FOO}',
  };

  const resolved = resolveExecutorEnv(rawEnv, baseEnv);

  assert.equal(resolved.LITERAL, 'https://openrouter.ai/api');
  assert.equal(resolved.SUBSTITUTED, 'bar');
  assert.equal(resolved.SUBSTITUTED_EMPTY, '');
  assert.equal(resolved.UNSET, '');
  assert.equal(resolved.EMPTY_LITERAL, '');
  assert.equal(resolved.MULTI, 'bar_baz_bar');
});

test('resolveExecutorEnv returns empty object when rawEnv is absent or invalid', () => {
  assert.deepEqual(resolveExecutorEnv(undefined), {});
  assert.deepEqual(resolveExecutorEnv(null), {});
  assert.deepEqual(resolveExecutorEnv('not-an-object'), {});
});

test('resolveExecutorCommand returns env block from resolved executor', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: {
      glm: {
        kind: 'agent',
        invocations: [{ id: 'glm-cli', via: 'cli', command: 'claude', args: ['-p', '{prompt}'], env: {
          ANTHROPIC_BASE_URL: 'https://openrouter.ai/api',
          ANTHROPIC_AUTH_TOKEN: '${TEST_OPENROUTER_KEY}',
        } }],
        allowCrossProvider: true,
      },
    },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
  };

  const res = resolveExecutorCommand(cfg, { prompt: 'hi', model: 'sonnet', tier: 'standard', executorId: 'glm' });
  assert.equal(res.command, 'claude');
  assert.deepEqual(res.env, {
    ANTHROPIC_BASE_URL: 'https://openrouter.ai/api',
    ANTHROPIC_AUTH_TOKEN: '${TEST_OPENROUTER_KEY}',
  });
});

test('registered executors.glm entry resolves command "claude" and env block from its invocation', () => {
  // The project config under test merges with the global one at HOME; a real
  // ~/.fgos/config.json on the machine must not leak executors into it.
  const originalHome = process.env.HOME;
  process.env.HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-test-home-'));
  try {
    const { repoRoot } = mkTempGitRepo();
    const glmConfig = {
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: {
        glmbridge: {
          kind: 'agent',
          description: 'Claude Code CLI routing to OpenRouter GLM 5.2 model',
          invocations: [{ id: 'glmbridge-cli', via: 'cli', command: 'claude', args: ['-p', '{prompt}', '--model', '{model}'], env: {
            ANTHROPIC_BASE_URL: 'https://openrouter.ai/api',
            ANTHROPIC_AUTH_TOKEN: '${GLM_OPENROUTER_API_KEY}',
            ANTHROPIC_MODEL: 'z-ai/glm-5.2',
            ANTHROPIC_API_KEY: '',
          } }],
          allowCrossProvider: true,
        },
      },
      modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
      defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } },
      timeoutMs: 1000,
    };
    const fgosDir = fgosDirFromRoot(repoRoot);
    writeProjectConfig(repoRoot, { runner: glmConfig });
  
    const cfg = loadRunnerConfigForDir(repoRoot);
    assert.ok(cfg.executors.glmbridge, 'executors.glm is registered');
    assert.equal(cfg.executors.glmbridge.kind, 'agent');
    const [glmInvocation] = cfg.executors.glmbridge.invocations;
    assert.equal(glmInvocation.command, 'claude');
    assert.equal(glmInvocation.env.ANTHROPIC_BASE_URL, 'https://openrouter.ai/api');
    assert.equal(glmInvocation.env.ANTHROPIC_AUTH_TOKEN, '${GLM_OPENROUTER_API_KEY}');
    assert.equal(glmInvocation.env.ANTHROPIC_MODEL, 'z-ai/glm-5.2');
    assert.equal(glmInvocation.env.ANTHROPIC_API_KEY, '');
  
    const res = resolveExecutorCommand(cfg, { prompt: 'test', model: 'sonnet', tier: 'standard', executorId: 'glmbridge' });
    assert.equal(res.command, 'claude');
    assert.equal(res.provider, 'claude');
  } finally {
    process.env.HOME = originalHome;
  }
});

// --- DispatchPlan / compileDispatchPlan & decide --for capabilities.prefer (tsk-5x7-1) ---

test('compileDispatchPlan builds a canonical DispatchPlan for all four selector forms (0b)', () => {
  const cfg = {
    executors: { agy: { kind: 'agent', invocations: [{ id: 'agy-cli', via: 'cli', command: 'agy', args: ['{prompt}'] }],  allowCrossProvider: true } },
    capabilities: { 'fgos-coding-implement': { prefer: 'agy' } },
    modelPolicies: SLICE_D_MODEL_POLICIES,
  };

  // Form 1: executor selector
  const plan1 = compileDispatchPlan(cfg, { executorId: 'agy' });
  assert.equal(plan1.selector.type, 'executor');
  assert.equal(plan1.selector.value, 'agy');
  assert.equal(plan1.mechanism, 'out-of-process');
  assert.equal(plan1.executorId, 'agy');
  assert.deepEqual(plan1.invocation, { via: 'cli', adapter: 'cli-spawn', protocol: 'prompt-stdout-v1' });
  // governance (self-review finding, 2026-08-25): must be the REAL
  // resolveExecutorConfig output, not an approximation -- proves the plan
  // reuses the same resolution execution actually goes through.
  assert.deepEqual(plan1.governance, {
    providerFamily: 'gemini',
    egress: { kind: 'cross-provider', target: 'agy', content: 'repo-content' },
  });
  assert.ok(plan1.reasonCodes.includes('native-first.0033.cli-spawn-shaped'));

  // Form 2: purpose selector (--for)
  const plan2 = compileDispatchPlan(cfg, { for: 'fgos-coding-implement' });
  assert.equal(plan2.selector.type, 'purpose');
  assert.equal(plan2.selector.value, 'fgos-coding-implement');
  assert.equal(plan2.mechanism, 'out-of-process');
  assert.equal(plan2.executorId, 'agy');
  assert.equal(plan2.capability, 'fgos-coding-implement');

  // Form 3: work selector (--work)
  const sample = sampleWork();
  const plan3 = compileDispatchPlan(cfg, { workId: sample.id, workHint: { workExecutorId: executorIdForWork(sample) } });
  assert.equal(plan3.selector.type, 'work');
  assert.equal(plan3.selector.value, sample.id);
  assert.equal(plan3.mechanism, 'out-of-process');
  assert.equal(plan3.executorId, 'agy', 'the executor Seat Binding binds, not the step skill');
  assert.equal(plan3.capability, 'fgos-coding-implement');

  // Form 4: adHocAgent selector (--needs-soul)
  const plan4 = compileDispatchPlan(cfg, { needsSoul: true });
  assert.equal(plan4.selector.type, 'adHocAgent');
  assert.equal(plan4.selector.value, true);
  assert.equal(plan4.mechanism, 'out-of-process');
  assert.equal(plan4.configured, false);
});

test('compileDispatchPlan selector precedence matches actual resolution precedence: an explicit executorId always wins over work/purpose, even when both are passed (self-review finding)', () => {
  const cfg = {
    executors: { agy: { kind: 'agent', invocations: [{ id: 'agy-cli', via: 'cli', command: 'agy', args: ['{prompt}'] }],  allowCrossProvider: true } },
  };
  const sample = sampleWork();
  // Both executorId AND work are passed -- resolution's own `if (!executorId
  // && workIdArg)` guard means the work item is never even touched, so
  // selector must report 'executor', never 'work'.
  const plan = compileDispatchPlan(cfg, { executorId: 'agy', workId: sample.id, workHint: { workExecutorId: executorIdForWork(sample) } });
  assert.equal(plan.selector.type, 'executor');
  assert.equal(plan.selector.value, 'agy');
  assert.equal(plan.executorId, 'agy');
});

test('compileDispatchPlan governance shape is consistent across every branch, including "unavailable" for a genuinely unregistered purpose (self-review finding, second round)', () => {
  const plan = compileDispatchPlan({}, { for: 'no-such-purpose' });
  assert.equal(plan.mechanism, 'unavailable');
  assert.equal(plan.configured, false);
  // Every other branch reports governance as {providerFamily, egress} --
  // this one used to be the sole holdout still shaped {carries: [], egress}.
  assert.deepEqual(plan.governance, { providerFamily: null, egress: null });
});

test('compileDispatchPlan.invocation selects the real via:"cli" entry among an executor\'s invocations[], never blindly invocations[0] (self-review finding)', () => {
  const cfg = {
    executors: {
      mixedInvocations: {
        kind: 'tool',
        allowCrossProvider: true,
        invocations: [
          { via: 'mcp', tools: {} },
          { via: 'cli', command: 'real-cli-command', args: ['{prompt}'], adapter: 'cli-spawn' },
        ],
      },
    },
  };
  const plan = compileDispatchPlan(cfg, { executorId: 'mixedInvocations' });
  // The old `invocations[0]` approximation would have reported the mcp
  // entry's own (nonexistent) `via`/adapter here instead of the cli one.
  assert.equal(plan.invocation.via, 'cli');
  assert.equal(plan.invocation.adapter, 'cli-spawn');
});

test('compileDispatchPlan never reports a governance-blocked executor as dispatchable -- mechanism/configured must reflect the real refusal, not a silently-degraded governance stub (second-round self-review finding)', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: {
      // cross-provider (non-Claude command), deliberately no allowCrossProvider
      // declared -- resolveExecutorConfig throws for this at real dispatch time.
      blockedExec: { kind: 'agent', invocations: [{ id: 'blockedexec-cli', via: 'cli', command: 'some-other-cli', args: ['{prompt}'] }] },
    },
  };
  const plan = compileDispatchPlan(cfg, { executorId: 'blockedExec' });
  // Before this fix: mechanism stayed "out-of-process" and governance
  // silently degraded to null -- a caller reading only mechanism would
  // wrongly conclude this executor is dispatchable, when the exact same
  // executorId passed to `execute` throws. The plan must never claim
  // success while hiding that.
  assert.equal(plan.mechanism, 'unavailable');
  // `configured` means "does this executorId resolve to a real config
  // entry" (third-round advisor finding, real) -- blockedExec DOES have
  // one (executors.blockedExec), so configured stays true; the refusal
  // itself is carried by mechanism + blockedReason, never by overloading
  // this field with a second meaning.
  assert.equal(plan.configured, true);
  assert.ok(plan.reasonCodes.includes('governance.blocked'));
  assert.ok(plan.blockedReason && plan.blockedReason.includes('cross-provider'), `expected a cross-provider blockedReason, got: ${plan.blockedReason}`);
});

test('compileDispatchPlan answers a tool purpose in-process without attempting cli resolution -- an mcp-only executor with no via:"cli" invocation at all must NOT be reported as governance-blocked', () => {
  const toolRoot = mkTempDir();
  fs.mkdirSync(path.join(toolRoot, 'tool-index'));
  const cfg = {
    capabilities: { 'some-purpose': { prefer: 'mcpOnlyExec' } },
    executors: {
      mcpOnlyExec: {
        kind: 'tool',
        for: ['some-purpose'],
        scanTarget: 'tool-index',
        invocations: [{ via: 'mcp', tools: { 'some-purpose': 'the_real_tool' } }],
      },
    },
  };
  const plan = compileDispatchPlan(cfg, { for: 'some-purpose', repoRoot: toolRoot });
  assert.equal(plan.mechanism, 'in-process');
  assert.equal(plan.mcpTool, 'the_real_tool');
  assert.equal(plan.configured, true);
  assert.equal(plan.executorId, 'mcpOnlyExec');
  // No cli dispatch happens for this mechanism -- invocation is honestly
  // null, never a fabricated cli shape for a purely-mcp executor.
  assert.equal(plan.invocation, null);
});

// --- DispatchPlan policy merge: bindingSource/tier/model/providerModel/
// provenance/policy (Dispatch Core Contract Normalization, Slice D) ---
//
// compileDispatchPlan() used to leave these fields entirely off its return
// value; a caller wanting tier/model/provenance had to call
// effectiveDispatchPolicy() separately (assignment-runner.mjs did,
// then cross-checked the two executor choices and threw on disagreement).
// These tests pin the merged behavior: one resolution, additive fields,
// same mismatch guarantee, now enforced inside compileDispatchPlan itself.

const SLICE_D_MODEL_POLICIES = Object.freeze({
  claude: { nano: 'haiku', standard: 'sonnet', advanced: 'sonnet', flagship: 'sonnet', frontier: 'opus' },
  agy: { nano: 'haiku', standard: 'sonnet', advanced: 'sonnet', flagship: 'sonnet', frontier: 'opus' },
  'some-other-cli': { nano: 'haiku', standard: 'sonnet', advanced: 'sonnet', flagship: 'sonnet', frontier: 'opus' },
});

test('compileDispatchPlan merges tier/model/providerModel/provenance/policy for an executor-id selector (Slice D)', () => {
  const cfg = {
    // `providerModel` declared explicitly: a bare (non-invocations[])
    // executor entry with none of its own is a known, documented gap
    // (config.mjs's warnIfProviderFamilyUnreliable) where
    // the dispatch policy's provider derivation defaults to
    // "claude" -- pre-existing, orthogonal to what this test pins.
    executors: { agy: { kind: 'agent', invocations: [{ id: 'agy-cli', via: 'cli', command: 'agy', args: ['{prompt}'] }],  providerModel: 'agy', allowCrossProvider: true } },
    modelPolicies: SLICE_D_MODEL_POLICIES,
  };
  const plan = compileDispatchPlan(cfg, { executorId: 'agy' });
  assert.equal(plan.executorId, 'agy');
  assert.equal(plan.bindingSource, 'executor-id');
  assert.equal(plan.tier, 'standard');
  assert.equal(plan.model, 'sonnet');
  assert.equal(plan.providerModel, 'gemini');
  assert.equal(plan.provenance.executor.value, 'agy');
  assert.equal(plan.policy.executorId, 'agy');
});

test('compileDispatchPlan merges the same fields for a --for capability selector from the seat Seat Binding bound', () => {
  const cfg = {
    executors: { agy: { kind: 'agent', invocations: [{ id: 'agy-cli', via: 'cli', command: 'agy', args: ['{prompt}'] }],  allowCrossProvider: true } },
    capabilities: { 'fgos-coding-implement': { prefer: 'agy' } },
    modelPolicies: SLICE_D_MODEL_POLICIES,
  };
  const plan = compileDispatchPlan(cfg, { for: 'fgos-coding-implement' });
  assert.equal(plan.executorId, 'agy');
  assert.equal(plan.bindingSource, 'seat-binding');
  assert.equal(plan.tier, 'standard');
  assert.equal(plan.model, 'sonnet');
  assert.equal(plan.policy.executorId, 'agy');
  assert.equal(plan.provenance.tier.source.scope, 'seat-binding');
});

test('compileDispatchPlan applies the capability\'s tier and rigor when synthesizing policy for a --for capability selector', () => {
  const cfg = {
    executors: {
      'agy-herdr-bwrap': {
        kind: 'agent',
        invocations: [{ id: 'agy-herdr-cli', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command: 'agy', args: ['{prompt}', '--model', '{model}'] }],
        providerModel: 'gemini',
        allowCrossProvider: true,
      },
    },
    capabilities: {
      'fgos-coding-implement': {
        prefer: 'agy-herdr-bwrap',
        rigor: 'high',
        tier: 'flagship',
      },
    },
    defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } },
    modelPolicies: {
      gemini: { standard: 'gemini-flash-high', flagship: 'gemini-pro' },
    },
  };

  const plan = compileDispatchPlan(cfg, { for: 'fgos-coding-implement' });
  assert.equal(plan.policy.rigor, 'high', 'the capability rigor is recorded as a demand');
  assert.equal(plan.executorId, 'agy-herdr-bwrap');
  assert.equal(plan.bindingSource, 'seat-binding');
  assert.equal(plan.providerModel, 'gemini');
  assert.equal(plan.tier, 'flagship');
  assert.equal(plan.model, 'gemini-pro');
  assert.equal(plan.provenance.provider.value, 'gemini');
});

test('compileDispatchPlan does not bind a --for purpose through an executor\'s own "for" array (no capabilities.<name>.prefer)', () => {
  const cfg = {
    executors: { agy: { kind: 'agent', invocations: [{ id: 'agy-cli', via: 'cli', command: 'agy', args: ['{prompt}'] }],  for: ['fgos-coding-implement'], allowCrossProvider: true } },
    capabilities: { 'fgos-coding-implement': {} },
    modelPolicies: SLICE_D_MODEL_POLICIES,
  };
  const plan = compileDispatchPlan(cfg, { for: 'fgos-coding-implement' });
  assert.equal(plan.configured, false);
  assert.equal(plan.mechanism, 'unavailable');
  assert.ok(plan.reasonCodes.includes('selector.unregistered'));
});

test('compileDispatchPlan merges policy fields from a real Assignment (assignmentItem), matching the dispatch policy\'s own output', () => {
  const cfg = {
    executors: { agy: { kind: 'agent', invocations: [{ id: 'agy-cli', via: 'cli', command: 'agy', args: ['{prompt}'] }],  allowCrossProvider: true } },
    modelPolicies: SLICE_D_MODEL_POLICIES,
    defaults: { tier: 'frontier' },
  };
  const assignmentItem = {
    assignmentId: 'test-assignment-1',
    operation: 'implement-item',
    role: 'implementer',
    policy: { preferExecutor: 'agy', rigor: 'critical' },
    skills: [],
  };
  const plan = compileDispatchPlan(cfg, { assignment: assignmentItem.assignmentId, assignmentItem });
  assert.equal(plan.executorId, 'agy');
  assert.equal(plan.tier, 'frontier');
  assert.equal(plan.model, 'opus');
  assert.equal(plan.provenance.rigor.source.scope, 'opPolicy');
  assert.equal(plan.provenance.rigor.source.id, 'implement-item');
  assert.equal(plan.policy.role, 'implementer');
});

test('compileDispatchPlan throws the dispatch-decide-mismatch error when a real Assignment\'s cliOverride.preferExecutor disagrees with the decided executor', () => {
  const cfg = {
    executors: {
      agy: { kind: 'agent', invocations: [{ id: 'agy-cli', via: 'cli', command: 'agy', args: ['{prompt}'] }],  allowCrossProvider: true },
      claude: { kind: 'agent', invocations: [{ id: 'claude-cli', via: 'cli', command: 'claude', args: ['{prompt}'] }] },
    },
    modelPolicies: SLICE_D_MODEL_POLICIES,
  };
  const assignmentItem = {
    assignmentId: 'test-assignment-mismatch',
    operation: 'implement-item',
    role: 'implementer',
    policy: {},
    skills: [],
  };
  // compileDispatchPlan itself decides "agy" (explicit executorId); the
  // caller's cliOverride tells the policy resolver to prefer "claude"
  // instead -- a real, structural disagreement, not a transient bug.
  assert.throws(
    () => compileDispatchPlan(cfg, {
      executorId: 'agy',
      assignment: assignmentItem.assignmentId,
      assignmentItem,
      cliOverride: { preferExecutor: 'claude' },
    }),
    /dispatch decide mismatch for operation "implement-item"/,
  );
});

test('compileDispatchPlan never throws over a policy mismatch on a synthesized (non-Assignment) request -- decide --for/--executor-id stays non-fatal', () => {
  const cfg = {
    executors: {
      agy: { kind: 'agent', invocations: [{ id: 'agy-cli', via: 'cli', command: 'agy', args: ['{prompt}'] }],  allowCrossProvider: true },
      claude: { kind: 'agent', invocations: [{ id: 'claude-cli', via: 'cli', command: 'claude', args: ['{prompt}'] }] },
    },
    modelPolicies: SLICE_D_MODEL_POLICIES,
  };
  // No assignment/assignmentItem at all -- plan.mjs synthesizes one
  // internally. A caller-supplied cliOverride.preferExecutor that disagrees
  // with the decided executorId must never turn a working `decide` call
  // into a thrown error (the PreToolUse decide-before-dispatch hook depends
  // on this staying non-fatal).
  const plan = compileDispatchPlan(cfg, { executorId: 'agy', cliOverride: { preferExecutor: 'claude' } });
  assert.equal(plan.executorId, 'agy');
  assert.equal(plan.mechanism, 'out-of-process');
  assert.equal(plan.tier, null);
  assert.equal(plan.model, null);
  assert.equal(plan.policy, null);
  assert.ok(plan.reasonCodes.includes('policy.executor-mismatch-ignored'));
});

test('compileDispatchPlan preserves the requested capability\'s provenance when an explicit executor-id overrides it (Slice E required proof case: explicit executor override preserves requested capability provenance)', () => {
  const cfg = {
    executors: {
      agy: { kind: 'agent', invocations: [{ id: 'agy-cli', via: 'cli', command: 'agy', args: ['{prompt}'] }],  providerModel: 'agy', allowCrossProvider: true },
    },
    modelPolicies: SLICE_D_MODEL_POLICIES,
  };
  // Caller explicitly names BOTH an executor override AND the capability it
  // is overriding for -- selector.type must report "executor" (the winning
  // target), but `capability` must still carry the caller's originally
  // requested capability, never silently discarded or replaced by
  // whatever the resolved executor happens to declare in its own `for[]`.
  const plan = compileDispatchPlan(cfg, { executorId: 'agy', for: 'code:implement' });
  assert.equal(plan.selector.type, 'executor');
  assert.equal(plan.selector.value, 'agy');
  assert.equal(plan.executorId, 'agy');
  assert.equal(plan.capability, 'code:implement');
});

test('compileDispatchPlan governance-blocked and unavailable branches never populate the new policy fields (no partial/misleading merge)', () => {
  const blockedCfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { blockedExec: { kind: 'agent', invocations: [{ id: 'blockedexec-cli', via: 'cli', command: 'some-other-cli', args: ['{prompt}'] }] } },
    modelPolicies: SLICE_D_MODEL_POLICIES,
  };
  const blockedPlan = compileDispatchPlan(blockedCfg, { executorId: 'blockedExec' });
  assert.equal(blockedPlan.mechanism, 'unavailable');
  assert.equal(blockedPlan.tier, undefined);
  assert.equal(blockedPlan.policy, undefined);

  const unavailablePlan = compileDispatchPlan({}, { for: 'no-such-purpose' });
  assert.equal(unavailablePlan.mechanism, 'unavailable');
  assert.equal(unavailablePlan.tier, undefined);
  assert.equal(unavailablePlan.policy, undefined);
});
