// RunResult.confinement names the sandbox backend the worker really ran under,
// read from what the Confinement Authority prepared for the launch, never from
// the mode a caller requested. It is backend provenance only; it says nothing
// about which writes belong to the run.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { settleRunOutcome } from '../../src/runner/dispatch/assignment-runner.mjs';
import { acquireRunControl } from '../../src/runner/dispatch/run-lock.mjs';

function runDirWithPreparedBackend(backend) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-confinement-label-'));
  const runDir = path.join(base, 'run');
  fs.mkdirSync(path.join(runDir, 'protected', 'prepared-invocation'), { recursive: true });
  if (backend) {
    fs.writeFileSync(
      path.join(runDir, 'protected', 'prepared-invocation', 'lc-1.json'),
      JSON.stringify({ contract: 'prepared-invocation.v1', requirement: { mode: 'required', policyId: 'host-write-denied' }, backend }),
    );
  }
  return { base, runDir };
}

async function settle(runDir, extra = {}) {
  const { controlToken } = acquireRunControl(runDir, { controllerId: 'test-ctrl' });
  const outcome = await settleRunOutcome({
    runDir,
    runMeta: { runId: 'run_label_01', assignmentId: 'asgn_label' },
    controlEpoch: 1,
    controlToken,
    exitCode: 0,
    settledAt: new Date().toISOString(),
    effectiveCwd: runDir,
    gitBefore: null,
    dirtyBefore: [],
    // The policy a caller asked for is not evidence of what ran.
    effectivePolicy: { confinement: { mode: 'required', policyId: 'host-write-denied' } },
    opts: { cwd: runDir, repoRoot: runDir },
    ...extra,
  });
  return outcome.runResult;
}

test('a launch the Authority prepared under bwrap settles with confinement "bwrap"', async () => {
  const { base, runDir } = runDirWithPreparedBackend({ id: 'bwrap', type: 'bwrap', version: 'local-bwrap-v1' });
  try {
    const result = await settle(runDir, { launchCommandId: 'lc-1' });
    assert.equal(result.confinement, 'bwrap');
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});

test('a launch prepared with no backend settles with confinement null, whatever mode was requested', async () => {
  const { base, runDir } = runDirWithPreparedBackend({ id: 'none', type: 'none', version: 'none' });
  try {
    const result = await settle(runDir, { launchCommandId: 'lc-1' });
    assert.equal(result.confinement, null);
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});

test('without a prepared launch record, an enforced attestation from the dispatch names the backend', async () => {
  const { base, runDir } = runDirWithPreparedBackend(null);
  try {
    const enforced = await settle(runDir, { attestation: { outcome: 'enforced', backend: { id: 'bwrap', type: 'bwrap' } } });
    assert.equal(enforced.confinement, 'bwrap');
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
  const second = runDirWithPreparedBackend(null);
  try {
    const unconfined = await settle(second.runDir, { attestation: { outcome: 'unconfined', backend: null } });
    assert.equal(unconfined.confinement, null);
  } finally {
    fs.rmSync(second.base, { recursive: true, force: true });
  }
});
