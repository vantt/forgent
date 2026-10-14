// A before/after snapshot of a checkout shows what changed, never who changed
// it. The main checkout is a live working tree shared with other sessions, so
// a change observed there during a round is correlated evidence only: the
// round is accepted and the change is reported as a warning in its result.
// Nothing here rejects a round; a rejection needs a write observed and bound
// to the run, which no dispatch door has yet.

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { executeExecutorCli } from '../../src/runner/dispatch/cli.mjs';
import { executeAssignment } from '../../src/runner/dispatch/assignment-runner.mjs';
import { runOutcome } from '../../src/runner/dispatch/run-result.mjs';
import { buildAssignment } from '../helpers/declared-assignment.mjs';
import { interpretAssignmentRunResult } from '../../src/runner/operation-choice.mjs';

// Attestation records go to a fixture-owned store, never the machine's own.
const attestationStore = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-stray-write-attestations-'));
const previousStore = process.env.FGOS_CONFINEMENT_ATTESTATION_STORE_PATH;
process.env.FGOS_CONFINEMENT_ATTESTATION_STORE_PATH = attestationStore;
after(() => {
  if (previousStore === undefined) delete process.env.FGOS_CONFINEMENT_ATTESTATION_STORE_PATH;
  else process.env.FGOS_CONFINEMENT_ATTESTATION_STORE_PATH = previousStore;
  fs.rmSync(attestationStore, { recursive: true, force: true });
});

// argv: <prompt>. The worker announces it started, waits for the test's
// signal, then either commits a tracked change in its own workspace (its cwd)
// or, given "stray:<abs path>", writes that file and leaves its workspace alone.
const WORKER_SCRIPT = `
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const [prompt = ''] = process.argv.slice(2);
fs.writeFileSync('worker-ready', '');
const deadline = Date.now() + 15000;
while (!fs.existsSync('worker-go') && Date.now() < deadline) await new Promise((r) => setTimeout(r, 25));
if (prompt.startsWith('stray:')) {
  fs.writeFileSync(prompt.slice('stray:'.length), 'export const misplaced = 1;\\n');
} else {
  fs.mkdirSync('docs', { recursive: true });
  fs.writeFileSync('docs/note.md', '# written in my workspace\\n');
  execFileSync('git', ['add', 'docs/note.md']);
  execFileSync('git', ['commit', '-q', '-m', 'docs: add note']);
}
console.log('done');
`;

function fixture() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-stray-write-'));
  const root = path.join(base, 'main');
  const worktree = path.join(base, 'wt');
  fs.mkdirSync(root);
  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: root });
  fs.writeFileSync(path.join(root, '.gitignore'), ['worker-ready', 'worker-go', '.fgos/', ''].join('\n'));
  execFileSync('git', ['add', '.gitignore'], { cwd: root });
  execFileSync('git', ['commit', '-q', '-m', 'initial'], { cwd: root });
  execFileSync('git', ['worktree', 'add', '-q', '-b', 'lane', worktree], { cwd: root });
  const script = path.join(base, 'worker.mjs');
  fs.writeFileSync(script, WORKER_SCRIPT);
  const runner = {
    modelPolicies: { fake: { standard: 'fake-standard' } },
    rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
    timeoutMs: 20000,
    executors: {
      fake: {
        kind: 'agent',
        providerModel: 'fake',
        allowCrossProvider: true,
        invocations: [{ id: 'plain', via: 'cli', adapter: 'cli-spawn', command: process.execPath, args: [script, '{prompt}'] }],
      },
    },
    capabilities: {
      execute: { description: 'changes files', serves: { outputKind: 'change', mutates: true } },
    },
  };
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(root, '.fgos', 'config.json'), JSON.stringify({ runner }, null, 2));
  return { base, root, worktree };
}

async function waitFor(file) {
  const deadline = Date.now() + 15000;
  while (!fs.existsSync(file)) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${file}`);
    await new Promise((r) => setTimeout(r, 25));
  }
}

const head = (dir) => execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' }).trim();
const skip = process.platform === 'win32' && 'git worktree + POSIX paths fixture';

test('a file another session writes into the main checkout during a round is not blamed on the round', { skip }, async () => {
  const { base, root, worktree } = fixture();
  try {
    const headBefore = head(worktree);
    const round = executeExecutorCli('fake', { for: 'execute', prompt: 'commit', cwd: worktree, repoRoot: root });
    await waitFor(path.join(worktree, 'worker-ready'));
    // Another session, not the executor, writes a report into the main checkout.
    fs.mkdirSync(path.join(root, 'plans', 'other', 'reports'), { recursive: true });
    fs.writeFileSync(path.join(root, 'plans', 'other', 'reports', 'code-review.md'), '# someone else\n');
    fs.writeFileSync(path.join(worktree, 'worker-go'), '');
    const result = await round;
    assert.equal(result.status, 0, result.stderr);
    assert.notEqual(head(worktree), headBefore, 'the worker committed its own work');
    assert.deepEqual(result.warnings, [{
      code: 'stray-write-correlated',
      level: 'correlated',
      basis: ['pre-post-git-snapshot'],
      repoRoot: root,
      paths: ['plans/'],
    }]);
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});

test('a worker that writes into the main checkout instead of its workspace is flagged, not rejected', { skip }, async () => {
  // The incident the old refusal was built for (a worker handed a worktree
  // wrote into the main checkout) is still named in the result; with snapshot
  // evidence alone it is a warning, the accepted residual risk.
  const { base, root, worktree } = fixture();
  try {
    const stray = path.join(root, 'misplaced.mjs');
    const round = executeExecutorCli('fake', { for: 'execute', prompt: `stray:${stray}`, cwd: worktree, repoRoot: root });
    await waitFor(path.join(worktree, 'worker-ready'));
    fs.writeFileSync(path.join(worktree, 'worker-go'), '');
    const result = await round;
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(result.warnings?.map((w) => [w.code, w.paths]), [['stray-write-correlated', ['misplaced.mjs']]]);
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});

// The Assignment door (Workflow units, `execute --contract`) measures the
// round's own cwd. When that cwd is a checkout other sessions also commit to
// -- the main checkout -- a commit landing mid-round moves HEAD, and the
// commit's files used to be read as the read-only round's mutation.
// Observed 2026-10-14 12:03:38: a framing seat of an architecture-advisory
// run was refused read-only-mutation for five reports another session
// committed to main while it ran.
test('a commit another session lands in a read-only round\'s checkout is not the round\'s mutation', { skip }, async () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-stray-commit-'));
  const repo = path.join(base, 'repo');
  const harness = path.join(base, 'harness');
  fs.mkdirSync(repo);
  fs.mkdirSync(harness);
  try {
    execFileSync('git', ['init', '-q'], { cwd: repo });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repo });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repo });
    fs.writeFileSync(path.join(repo, '.gitignore'), '.fgos/\n');
    execFileSync('git', ['add', '.gitignore'], { cwd: repo });
    execFileSync('git', ['commit', '-q', '-m', 'initial'], { cwd: repo });

    // The worker keeps its handshake outside the checkout, then writes only
    // its report and claim into the run directory.
    const script = path.join(harness, 'reviewer.mjs');
    fs.writeFileSync(script, `
import fs from 'node:fs';
import path from 'node:path';
const harness = ${JSON.stringify(harness)};
fs.writeFileSync(path.join(harness, 'worker-ready'), '');
const deadline = Date.now() + 15000;
while (!fs.existsSync(path.join(harness, 'worker-go')) && Date.now() < deadline) await new Promise((r) => setTimeout(r, 25));
const runsDir = path.join(process.cwd(), '.fgos', 'assignments');
for (const asgn of fs.readdirSync(runsDir)) {
  const runDir = path.join(runsDir, asgn, 'runs', '01');
  if (!fs.existsSync(runDir)) continue;
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Validation Report\\nPlan is sound.\\n');
  fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Plan sound' }));
}
process.stdout.write('reviewed\\n');
`);
    const runnerConfig = {
      executor: { allowCrossProvider: true, command: process.execPath, args: [script, '{prompt}'] },
      modelPolicies: { claude: { standard: 'test-model' } },
      rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
      timeoutMs: 20000,
    };
    const assignment = buildAssignment({ workId: 'tsk-stray-commit', stage: 'planning', operation: 'validate-plan' });
    const round = executeAssignment(assignment, { cwd: repo, repoRoot: repo, runnerConfig });
    await waitFor(path.join(harness, 'worker-ready'));
    // Another session commits reports to the same checkout mid-round.
    fs.mkdirSync(path.join(repo, 'plans', 'other', 'reports'), { recursive: true });
    fs.writeFileSync(path.join(repo, 'plans', 'other', 'reports', 'code-review.md'), '# someone else\n');
    execFileSync('git', ['add', 'plans'], { cwd: repo });
    execFileSync('git', ['commit', '-q', '-m', 'docs(report): add a review'], { cwd: repo });
    fs.writeFileSync(path.join(harness, 'worker-go'), '');
    const result = await round;
    assert.equal(result.classification.execution.status, 'completed');
    assert.equal(result.classification.failure, null);
    assert.deepEqual(result.classification.policy, { disposition: 'allow', code: null });
    assert.equal(runOutcome(result).category, 'ok');
    assert.deepEqual(result.evidence.changedFiles, ['plans/other/reports/code-review.md']);
    assert.deepEqual(result.warnings, [{
      code: 'read-only-mutation-correlated',
      level: 'correlated',
      basis: ['pre-post-git-snapshot'],
      paths: ['plans/other/reports/code-review.md'],
    }]);
    // The settled record says the same when read back from disk.
    const stored = JSON.parse(fs.readFileSync(path.join(repo, '.fgos', 'assignments', assignment.assignmentId, 'runs', '01', 'result.json'), 'utf8'));
    assert.equal(stored.classification.policy.disposition, 'allow');
    assert.equal(stored.warnings[0].code, 'read-only-mutation-correlated');
    // Reading it back re-derives the outcome from the same evidence (the floor
    // a coordinator applies); the correlated change must not fail it there.
    const reread = runOutcome(stored, { evidenceFloor: {
      exitCode: 0,
      agentClaim: stored.agentClaim,
      workerArtifacts: stored.settleReports.map((r) => r.path),
      changedFiles: stored.evidence.changedFiles,
      hasDirtyBeforeMutation: false,
      isReadOnlyOperation: true,
    } });
    assert.equal(reread.category, 'ok');
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});

// An Assignment round launched through the executor CLI door (herdr, legacy
// adapters) watches the main checkout as well as its workspace. A read-only
// round that leaves its worktree alone while a file appears in the main
// checkout is the agy incident: accepted with a warning, and the warning must
// reach the settled result so Work, reading it, does not advance on it.
test('a read-only Assignment round that writes into the main checkout carries the warning in its result and Work does not advance', { skip }, async () => {
  const { base, root, worktree } = fixture();
  const harness = path.join(base, 'harness');
  fs.mkdirSync(harness);
  try {
    const stray = path.join(root, 'misplaced.mjs');
    const script = path.join(harness, 'stray-reviewer.mjs');
    fs.writeFileSync(script, `
import fs from 'node:fs';
import path from 'node:path';
fs.writeFileSync(${JSON.stringify(stray)}, 'export const misplaced = 1;\\n');
for (const top of [process.cwd(), ${JSON.stringify(root)}]) {
  const runsDir = path.join(top, '.fgos', 'assignments');
  if (!fs.existsSync(runsDir)) continue;
  for (const asgn of fs.readdirSync(runsDir)) {
    const runDir = path.join(runsDir, asgn, 'runs', '01');
    if (!fs.existsSync(runDir)) continue;
    fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Validation Report\\nPlan is sound.\\n');
    fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Plan sound' }));
  }
}
process.stdout.write('reviewed\\n');
`);
    const runnerConfig = {
      executor: { allowCrossProvider: true, command: process.execPath, args: [script, '{prompt}'] },
      modelPolicies: { claude: { standard: 'test-model' } },
      rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
      timeoutMs: 20000,
    };
    const assignment = buildAssignment({ workId: 'tsk-stray-asgn', stage: 'planning', operation: 'validate-plan' });
    const result = await executeAssignment(assignment, { cwd: worktree, repoRoot: root, runnerConfig, legacySpawn: true });
    assert.ok(fs.existsSync(stray), 'the worker wrote outside its workspace');
    assert.deepEqual(
      (result.warnings ?? []).filter((w) => w.code === 'stray-write-correlated').map((w) => w.paths),
      [['misplaced.mjs']],
      `settled warnings: ${JSON.stringify(result.warnings)}`,
    );
    const interpreted = interpretAssignmentRunResult({ choice: { operation: 'validate-plan', assignment }, runResult: result, repoRoot: root });
    assert.equal(interpreted.canAdvanceEdge, false);
    assert.equal(interpreted.reason, 'assignment-validate-plan-correlated-mutation');
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});
