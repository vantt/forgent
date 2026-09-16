import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  EFFECTIVE_EXECUTION_CONTRACT,
  EFFECTIVE_EXECUTION_CONTRACT_FILE,
  buildEffectiveExecutionContract,
  validateEffectiveExecutionContract,
  renderEffectiveContractSummary,
  readEffectiveExecutionContract,
  stripSecrets,
  assertNoSecrets,
} from '../../src/runner/dispatch/effective-execution-contract.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch/config.mjs';
import { buildAssignment, renderAssignmentPrompt } from '../../src/runner/dispatch/assignment.mjs';
import { renderBrief, briefPaths } from '../../src/runner/dispatch/brief.mjs';
import { executeAssignment } from '../../src/runner/dispatch/assignment-runner.mjs';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-effective-contract-test-'));
}

function initGitRepo(repoDir) {
  execFileSync('git', ['init', '-b', 'main', repoDir], { stdio: 'ignore' });
  execFileSync('git', ['-C', repoDir, 'config', 'user.name', 'Test Runner'], { stdio: 'ignore' });
  execFileSync('git', ['-C', repoDir, 'config', 'user.email', 'test@example.com'], { stdio: 'ignore' });
  fs.writeFileSync(path.join(repoDir, 'README.md'), '# test\n');
  execFileSync('git', ['-C', repoDir, 'add', '.'], { stdio: 'ignore' });
  execFileSync('git', ['-C', repoDir, 'commit', '-m', 'initial commit'], { stdio: 'ignore' });
}

function validAssignment(overrides = {}) {
  return {
    assignmentId: 'asgn_test_validate_001',
    workId: 'tsk-test-01',
    role: 'reviewer',
    mutation: 'read-only',
    budget: { timeoutMs: 60000, maxRuns: 1 },
    policy: { minTier: 'standard', preferExecutor: 'claude' },
    ...overrides,
  };
}

function validDispatchPlan(overrides = {}) {
  return {
    selector: { type: 'assignment', value: 'asgn_test_validate_001' },
    mechanism: 'out-of-process',
    executorId: 'claude',
    capability: 'validate-plan',
    invocation: {
      via: 'cli',
      adapter: 'cli-spawn',
      protocol: 'prompt-stdout-v1',
    },
    policy: {
      tier: 'standard',
      executorPreference: ['claude'],
    },
    ...overrides,
  };
}

test('EFFECTIVE_EXECUTION_CONTRACT has correct id and version', () => {
  assert.equal(EFFECTIVE_EXECUTION_CONTRACT.id, 'effective-execution-contract');
  assert.equal(EFFECTIVE_EXECUTION_CONTRACT.version, 1);
  assert.equal(EFFECTIVE_EXECUTION_CONTRACT_FILE, 'effective-execution-contract.json');
});

test('buildEffectiveExecutionContract projects a well-formed read-only contract', () => {
  const assignment = validAssignment();
  const dispatchPlan = validDispatchPlan();
  const runId = 'run_asgn_test_validate_001_01';
  const runDir = '/tmp/test-assignment/runs/01';
  const cwd = '/tmp/test-assignment';

  const contract = buildEffectiveExecutionContract({
    assignment,
    dispatchPlan,
    runId,
    runDir,
    cwd,
    timeoutMs: 45000,
  });

  assert.equal(contract.contract.id, 'effective-execution-contract');
  assert.equal(contract.contract.version, 1);
  assert.equal(contract.assignmentId, assignment.assignmentId);
  assert.equal(contract.runId, runId);
  assert.equal(contract.mutation, 'read-only');
  assert.deepEqual(contract.workspace.writeScope, []);
  assert.equal(contract.workspace.cwd, path.resolve(cwd));
  assert.equal(contract.limits.executorTimeoutMs, 45000);
  assert.equal(contract.resultClaim.contract.id, 'agent-result-claim');
  assert.equal(contract.resultClaim.contract.version, 2);
  assert.equal(contract.resultClaim.path, path.join(path.resolve(runDir), 'agent-result.json'));
  assert.equal(contract.provenance.executorId, 'claude');
  assert.equal(contract.provenance.adapter, 'cli-spawn');
  assert.ok(contract.provenance.dispatchPlanHash.startsWith('sha256:'));
  assert.equal(contract.tools.shell.enforced, false);
  assert.equal(contract.tools.shell.enforcement, 'instructed');
  assert.equal(contract.enforcementPosture, 'instructed');

  assert.doesNotThrow(() => validateEffectiveExecutionContract(contract));
});

test('buildEffectiveExecutionContract records provider capacity without credential source or secrets', () => {
  const contract = buildEffectiveExecutionContract({
    assignment: validAssignment(),
    dispatchPlan: validDispatchPlan(),
    runId: 'run_provider_capacity_01',
    runDir: '/tmp/runs/01',
    cwd: '/tmp/test',
    providerCapacity: {
      provider: 'openai-codex',
      accountId: 'tetcu72',
      accountLabel: 'codex/tetcu72',
      credentialProvisioned: false,
      lease: { runId: 'run_provider_capacity_01', assignmentId: 'asgn_test_validate_001', pid: 123 },
    },
  });

  assert.equal(contract.providerCapacity.provider, 'openai-codex');
  assert.equal(contract.providerCapacity.accountId, 'tetcu72');
  assert.equal(contract.providerCapacity.credentialProvisioned, false);
  assert.equal(contract.providerCapacity.credentialSource, undefined);
  assert.doesNotThrow(() => validateEffectiveExecutionContract(contract));
});

test('buildEffectiveExecutionContract projects mutating contract with writeScope in linked worktree', () => {
  const repoDir = mkTempDir();
  initGitRepo(repoDir);
  const worktreeDir = path.join(repoDir, 'worktrees', 'wt-01');
  fs.mkdirSync(path.dirname(worktreeDir), { recursive: true });
  execFileSync('git', ['-C', repoDir, 'worktree', 'add', worktreeDir, '-b', 'feat-01'], { stdio: 'ignore' });

  const assignment = validAssignment({
    assignmentId: 'asgn_test_implement_001',
    role: 'doer',
    mutation: 'mutating',
  });
  const dispatchPlan = validDispatchPlan({
    selector: { type: 'assignment', value: 'asgn_test_implement_001' },
    capability: 'code:implement',
  });
  const runId = 'run_asgn_test_implement_001_01';
  const runDir = path.join(worktreeDir, '.fgos', 'assignments', assignment.assignmentId, 'runs', '01');

  const contract = buildEffectiveExecutionContract({
    assignment,
    dispatchPlan,
    runId,
    runDir,
    cwd: worktreeDir,
  });

  assert.equal(contract.mutation, 'mutating');
  assert.equal(contract.workspace.posture, 'worktree');
  assert.equal(contract.workspace.mainCheckout, repoDir);
  assert.deepEqual(contract.workspace.writeScope, [worktreeDir]);
  assert.deepEqual(contract.tools.shell.allowedCommands, ['git add', 'git commit']);
  assert.equal(contract.tools.shell.enforced, false);
  assert.equal(contract.tools.shell.enforcement, 'instructed');

  assert.doesNotThrow(() => validateEffectiveExecutionContract(contract));
  fs.rmSync(repoDir, { recursive: true, force: true });
});

test('buildEffectiveExecutionContract is honest about permissions: does not label shell as enforced even when confinement is configured', () => {
  const assignment = validAssignment();
  const dispatchPlan = validDispatchPlan({
    policy: {
      confinement: {
        mode: 'required',
        policyId: 'host-write-denied',
        controls: { hostWrite: 'deny', hostRead: 'allow' },
      },
    },
  });

  const contract = buildEffectiveExecutionContract({
    assignment,
    dispatchPlan,
    runId: 'run_conf_01',
    runDir: '/tmp/runs/01',
    cwd: '/tmp/test',
  });

  // Filesystem is enforced by confinement, but shell command execution is NOT
  assert.equal(contract.enforcementPosture, 'enforced');
  assert.equal(contract.permissions.filesystem.enforced, true);
  assert.equal(contract.permissions.filesystem.enforcement, 'enforced');
  assert.equal(contract.tools.shell.enforced, false);
  assert.equal(contract.tools.shell.enforcement, 'instructed');
  assert.equal(contract.permissions.shell.enforced, false);
  assert.equal(contract.permissions.shell.enforcement, 'instructed');
});

test('buildEffectiveExecutionContract reports an Authority-resolved unconfined backend as instructed', () => {
  const contract = buildEffectiveExecutionContract({
    assignment: validAssignment(),
    dispatchPlan: validDispatchPlan({ policy: { confinement: { mode: 'required', policyId: 'missing-backend' } } }),
    runId: 'run_unconfined_01', runDir: '/tmp/runs/01', cwd: '/tmp/test',
    confinement: {
      requirement: { mode: 'unconfined', policyId: null },
      backend: { id: 'none', type: 'none' },
    },
  });
  assert.equal(contract.enforcementPosture, 'instructed');
  assert.equal(contract.permissions.filesystem.enforced, false);
});

test('validateEffectiveExecutionContract rejects missing required contract fields', () => {
  const contract = buildEffectiveExecutionContract({
    assignment: validAssignment(), dispatchPlan: validDispatchPlan(), runId: 'run_required_01', runDir: '/tmp/runs/01', cwd: '/tmp/test',
  });
  for (const mutate of [
    (value) => { delete value.workspace.mainCheckout; },
    (value) => { delete value.permissions; },
    (value) => { delete value.enforcementPosture; },
    (value) => { delete value.adapterFamily; },
    (value) => { delete value.limits.executorTimeoutMs; },
  ]) {
    const malformed = structuredClone(contract);
    mutate(malformed);
    assert.throws(() => validateEffectiveExecutionContract(malformed), RunnerConfigError);
  }
});

test('stripSecrets removes secret keys and environment variables from contract provenance', () => {
  const dirty = {
    apiKey: 'sk-ant-1234567890',
    token: 'ghp_secrettoken',
    user: 'alice',
    env: { ANTHROPIC_API_KEY: 'sk-real-secret', PATH: '/usr/bin' },
    headers: { Authorization: 'Bearer topsecret' },
    nested: {
      secretValue: 'password123',
      safeName: 'claude',
    },
  };

  const clean = stripSecrets(dirty);
  assert.equal(clean.apiKey, undefined);
  assert.equal(clean.token, undefined);
  assert.equal(clean.env, undefined);
  assert.equal(clean.headers, undefined);
  assert.equal(clean.user, 'alice');
  assert.equal(clean.nested.secretValue, undefined);
  assert.equal(clean.nested.safeName, 'claude');
  assert.doesNotThrow(() => assertNoSecrets(clean));
});

test('validateEffectiveExecutionContract throws if a prohibited secret field is present', () => {
  const assignment = validAssignment();
  const dispatchPlan = validDispatchPlan();
  const contract = buildEffectiveExecutionContract({
    assignment,
    dispatchPlan,
    runId: 'run_01',
    runDir: '/tmp/runs/01',
    cwd: '/tmp',
  });

  const dirtyContract = { ...contract, authToken: 'leak' };
  assert.throws(
    () => validateEffectiveExecutionContract(dirtyContract),
    (err) => err instanceof RunnerConfigError && /prohibited secret field/i.test(err.message),
  );
});

test('buildEffectiveExecutionContract throws if DispatchPlan drops required fields', () => {
  const assignment = validAssignment();

  // Missing mechanism
  assert.throws(
    () => buildEffectiveExecutionContract({
      assignment,
      dispatchPlan: { executorId: 'claude', invocation: { adapter: 'cli-spawn' } },
      runId: 'run_01',
      runDir: '/tmp/runs/01',
      cwd: '/tmp',
    }),
    (err) => err instanceof RunnerConfigError && /mechanism is required/i.test(err.message),
  );

  // Missing executorId
  assert.throws(
    () => buildEffectiveExecutionContract({
      assignment,
      dispatchPlan: { mechanism: 'out-of-process', invocation: { adapter: 'cli-spawn' } },
      runId: 'run_01',
      runDir: '/tmp/runs/01',
      cwd: '/tmp',
    }),
    (err) => err instanceof RunnerConfigError && /executorId must be a non-empty string/i.test(err.message),
  );

  // Missing adapter
  assert.throws(
    () => buildEffectiveExecutionContract({
      assignment,
      dispatchPlan: { mechanism: 'out-of-process', executorId: 'claude', invocation: {} },
      runId: 'run_01',
      runDir: '/tmp/runs/01',
      cwd: '/tmp',
    }),
    (err) => err instanceof RunnerConfigError && /adapter must be a non-empty string/i.test(err.message),
  );
});

test('prompt and brief agree with effective execution contract on claim path, mutation, and limits', () => {
  const assignment = validAssignment({ mutation: 'read-only' });
  const dispatchPlan = validDispatchPlan();
  const runDir = '/tmp/assignment-1/runs/01';
  const contract = buildEffectiveExecutionContract({
    assignment,
    dispatchPlan,
    runId: 'run_01',
    runDir,
    cwd: '/tmp/assignment-1',
    timeoutMs: 120000,
  });

  const prompt = renderAssignmentPrompt(assignment, {
    runDir,
    effectiveContract: contract,
  });

  const brief = renderBrief({
    prompt,
    round: 1,
    runDir,
    agentName: 'worker-1',
    effectiveContract: contract,
  });

  const claimPath = contract.resultClaim.path;
  const timeoutStr = `${contract.limits.executorTimeoutMs}ms`;

  // Check prompt contains the agreed fields
  assert.ok(prompt.includes(claimPath), 'prompt must contain exact claim path from contract');
  assert.ok(prompt.includes('Mutation: read-only'), 'prompt must state read-only mutation');
  assert.ok(prompt.includes(timeoutStr), 'prompt must state exact timeout from contract');

  // Check brief contains the agreed fields
  assert.ok(brief.includes(claimPath), 'brief must contain exact claim path from contract');
  assert.ok(brief.includes('Mutation: read-only'), 'brief must state read-only mutation');
  assert.ok(brief.includes(timeoutStr), 'brief must state exact timeout from contract');
  assert.ok(brief.includes('effective-execution-contract.json'), 'brief must link to persisted contract file');
});

test('readEffectiveExecutionContract reads, parses, and validates the contract on disk', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });

  const assignment = validAssignment();
  const dispatchPlan = validDispatchPlan();
  const contract = buildEffectiveExecutionContract({
    assignment,
    dispatchPlan,
    runId: 'run_read_01',
    runDir,
    cwd: tempDir,
  });

  const contractPath = path.join(runDir, EFFECTIVE_EXECUTION_CONTRACT_FILE);
  fs.writeFileSync(contractPath, `${JSON.stringify(contract, null, 2)}\n`);

  const readBack = readEffectiveExecutionContract(runDir);
  assert.deepEqual(readBack, contract);
  assert.ok(Object.isFrozen(readBack));

  // Throws if missing
  fs.unlinkSync(contractPath);
  assert.throws(
    () => readEffectiveExecutionContract(runDir),
    (err) => err instanceof RunnerConfigError && /not found/i.test(err.message),
  );

  // Throws if corrupt JSON
  fs.writeFileSync(contractPath, '{ corrupt: json');
  assert.throws(
    () => readEffectiveExecutionContract(runDir),
    (err) => err instanceof RunnerConfigError && /invalid JSON/i.test(err.message),
  );

  fs.rmSync(tempDir, { recursive: true, force: true });
});

test('PRODUCTION-DOOR FIXTURE: executeAssignment persists effective-execution-contract.json before spawn', async () => {
  const tempDir = mkTempDir();
  initGitRepo(tempDir);

  // Configure a real runner environment with mock executor CLI
  const runnerCfg = {
    timeoutMs: 30000,
    models: { standard: 'test-model' },
    executor: {
      command: 'mock-cli',
      adapter: 'cli-spawn',
    },
    executors: {
      'mock-cli': {
        command: 'mock-cli',
        adapter: 'cli-spawn',
      },
    },
  };

  const fgosDir = path.join(tempDir, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  fs.writeFileSync(path.join(fgosDir, 'config.json'), JSON.stringify(runnerCfg, null, 2));

  // Write a mock script that acts as the executor CLI:
  // It verifies effective-execution-contract.json ALREADY exists when it runs,
  // then writes agent-result.json and agent-report.md
  const mockScript = `#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

// Find runDir from args or cwd
let runDir = null;
for (let i = 0; i < process.argv.length; i++) {
  if (process.argv[i] === '--prompt' && process.argv[i + 1]) {
    const m = process.argv[i + 1].match(/Write structured JSON to (.*agent-result\\.json)/);
    if (m) {
      runDir = path.dirname(m[1]);
    }
  }
}

if (!runDir) {
  const candidate = path.join(process.cwd(), '.fgos', 'assignments');
  if (fs.existsSync(candidate)) {
    const asgns = fs.readdirSync(candidate);
    if (asgns.length > 0) {
      runDir = path.join(candidate, asgns[0], 'runs', '01');
    }
  }
}

if (runDir) {
  const contractPath = path.join(runDir, 'effective-execution-contract.json');
  if (!fs.existsSync(contractPath)) {
    console.error('FAIL: effective-execution-contract.json does not exist before executor spawn!');
    process.exit(2);
  }
  fs.writeFileSync(path.join(runDir, 'contract-witness.txt'), 'contract-exists-verified');

  // Write valid v2 worker claim
  const claim = {
    contract: { id: 'agent-result-claim', version: 2 },
    status: 'done',
    summary: 'Mock execution successfully completed.',
    assessment: { verdict: 'pass' },
    evidenceRefs: [],
  };
  fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify(claim, null, 2));
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), 'Substantive report content for read-only validation.\\n');
}
process.exit(0);
`;

  const mockBinPath = path.join(tempDir, 'mock-cli.mjs');
  fs.writeFileSync(mockBinPath, mockScript, { mode: 0o755 });

  const assignment = buildAssignment({
    workId: 'tsk-prod-door-test',
    stage: 'planning',
    operation: 'validate-plan',
  });

  const updatedCfg = {
    ...runnerCfg,
    // The cli-spawn profile requests confinement, but the compiled
    // capability resolves unconfined and Authority therefore prepares the
    // explicit { id: 'none', type: 'none' } backend. The persisted contract
    // must report that real outcome, not this requested fragment.
    executor: {
      command: process.execPath,
      args: [mockBinPath],
      adapter: 'cli-spawn',
      allowCrossProvider: true,
      confinement: { mode: 'required', policyId: 'missing-backend', controls: { hostWrite: 'deny' } },
    },
    executors: {
      claude: { command: process.execPath, args: [mockBinPath], adapter: 'cli-spawn', allowCrossProvider: true },
    },
  };

  const result = await executeAssignment(assignment, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig: updatedCfg,
    timeoutMs: 25000,
  });

  assert.equal(result.status, 'done');

  // 1. Verify contract file exists on disk under runs/01/
  const runDir = path.join(fgosDir, 'assignments', assignment.assignmentId, 'runs', '01');
  const contractOnDisk = readEffectiveExecutionContract(runDir);

  // 2. Verify witness written by worker proves contract was there before worker spawned
  const witnessPath = path.join(runDir, 'contract-witness.txt');
  assert.ok(fs.existsSync(witnessPath), 'worker must have executed and found the contract');
  assert.equal(fs.readFileSync(witnessPath, 'utf8'), 'contract-exists-verified');

  // 3. Verify contract content matches acceptance criteria
  assert.equal(contractOnDisk.assignmentId, assignment.assignmentId);
  assert.equal(contractOnDisk.runId, `run_${assignment.assignmentId}_01`);
  assert.equal(contractOnDisk.mutation, 'read-only');
  assert.equal(contractOnDisk.workspace.cwd, tempDir);
  assert.deepEqual(contractOnDisk.workspace.writeScope, []);
  assert.equal(contractOnDisk.limits.executorTimeoutMs, 25000);
  assert.equal(contractOnDisk.resultClaim.path, path.join(runDir, 'agent-result.json'));
  assert.equal(contractOnDisk.executorId, 'claude');
  assert.equal(contractOnDisk.adapter, 'cli-spawn');
  assert.equal(contractOnDisk.adapterFamily, 'cli-spawn');
  assert.equal(contractOnDisk.enforcementPosture, 'instructed');

  // 4. Verify no secrets
  assert.doesNotThrow(() => assertNoSecrets(contractOnDisk));

  fs.rmSync(tempDir, { recursive: true, force: true });
});
