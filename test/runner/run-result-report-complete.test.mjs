// The Dispatch settlement that reads a seat's report declares whether it is complete, for each adapter kind:
// complete only when a worker-written report exists and the seat ended on its own; never null.

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { settleRunOutcome } from '../../src/runner/dispatch/assignment-runner.mjs';
import { acquireRunControl } from '../../src/run-supervisor/run-lock.mjs';

const REPORT = '# Findings\n\nThe module reads the config once and caches the parsed value for later calls.\n';

async function settle(adapter, { report = true, claim = true, ...extra } = {}) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-report-complete-'));
  const runDir = path.join(base, 'run');
  const outbox = path.join(runDir, 'worker-output', 'outbox');
  fs.mkdirSync(outbox, { recursive: true });
  if (report) fs.writeFileSync(path.join(outbox, 'report-1.md'), REPORT);
  if (claim) fs.writeFileSync(path.join(outbox, 'result-1.json'), JSON.stringify({ contract: { id: 'agent-result-claim', version: 2 }, status: 'done', summary: 'read the config' }));
  try {
    const { controlToken } = acquireRunControl(runDir, { controllerId: 'test-ctrl' });
    const outcome = await settleRunOutcome({
      runDir,
      runMeta: { runId: 'run_complete_01', assignmentId: 'asgn_complete' },
      controlEpoch: 1,
      controlToken,
      exitCode: 0,
      settledAt: new Date().toISOString(),
      effectiveCwd: runDir,
      gitBefore: null,
      dirtyBefore: [],
      opts: { cwd: runDir, repoRoot: runDir, adapter },
      ...extra,
    });
    return outcome.runResult.reportDeclaration;
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
}

for (const adapter of ['cli-spawn', 'herdr-spawn']) {
  test(`${adapter}: a report the seat wrote and then claimed on is declared complete`, async () => {
    assert.deepEqual(await settle(adapter), { complete: true, incompleteReason: null });
  });

  test(`${adapter}: a seat that left no report declares no-report`, async () => {
    assert.deepEqual(await settle(adapter, { report: false }), { complete: false, incompleteReason: 'no-report' });
  });

  test(`${adapter}: a report from a seat that timed out declares seat-did-not-finish`, async () => {
    assert.deepEqual(await settle(adapter, { claim: false, isTimeout: true, exitCode: null }), { complete: false, incompleteReason: 'seat-did-not-finish' });
  });
}
