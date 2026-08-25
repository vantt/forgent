// test/verbs/merge/approve.test.mjs
// Tests for mergedSha diagnostic logging in approve (tsk-64o).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { APPROVE_FAULT_LOG_BASENAME } from '../../../src/cli/approve-fault-log.mjs';
import {
  commitPendingBeforeApprove,
  envelopeData,
  initGitCwdMain,
  makeRunnerProposedItem,
  makeRunnerProposedLeafItem,
  run,
  writeFakeGh,
} from '../../cli/helpers/fgos-cli-harness.mjs';

function writeMergeSuccessWithCommitFake(dir, oid = 'fake-merge-sha-42') {
  return writeFakeGh(dir, 'gh-merge-commit-ok.cjs',
    `const args = process.argv.slice(2);
if (args[1] === 'view') {
  process.stdout.write(JSON.stringify({ state: 'OPEN', mergeable: 'MERGEABLE', mergeStateStatus: 'CLEAN', mergedAt: null, closed: false, closedAt: null, mergeCommit: { oid: ${JSON.stringify(oid)} } }));
  process.exit(0);
}
process.exit(0);`);
}

test('approve (leaf-into-root merge): produces a diagnostic log record carrying mergedSha and mergedInto', () => {
  const cwd = initGitCwdMain();
  makeRunnerProposedLeafItem(cwd, 'diag-leaf-root', 'diag-leaf-child', { verify: 'true' });
  commitPendingBeforeApprove(cwd, 'diag-leaf-child');

  const result = run(cwd, ['approve', 'diag-leaf-child']);
  assert.equal(result.status, 0, result.stderr);

  const logPath = path.join(cwd, '.fgos', 'logs', APPROVE_FAULT_LOG_BASENAME);
  assert.ok(fs.existsSync(logPath), 'diagnostic log file must exist');

  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
  const records = lines.map((line) => JSON.parse(line));
  const record = records.find((r) => r.id === 'diag-leaf-child');

  assert.ok(record, 'diagnostic log record for leaf item must exist');
  assert.equal(record.phase, 'leaf-into-root merge');
  assert.equal(typeof record.mergedSha, 'string');
  assert.ok(record.mergedSha.length > 0);
  assert.equal(record.mergedInto, 'fgw/diag-leaf-root');
});

test('approve (root-into-main merge): produces a diagnostic log record carrying mergedSha and mergedInto', () => {
  const cwd = initGitCwdMain();
  makeRunnerProposedItem(cwd, 'diag-root-item', { verify: 'true' });

  const result = run(cwd, ['approve', 'diag-root-item']);
  assert.equal(result.status, 0, result.stderr);

  const logPath = path.join(cwd, '.fgos', 'logs', APPROVE_FAULT_LOG_BASENAME);
  assert.ok(fs.existsSync(logPath), 'diagnostic log file must exist');

  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
  const records = lines.map((line) => JSON.parse(line));
  const record = records.find((r) => r.id === 'diag-root-item');

  assert.ok(record, 'diagnostic log record for root item must exist');
  assert.equal(record.phase, 'root-into-main merge');
  assert.equal(typeof record.mergedSha, 'string');
  assert.ok(record.mergedSha.length > 0);
  assert.equal(record.mergedInto, 'main');
});

test('approve (--github): produces a diagnostic log record carrying mergedSha and mergedInto', () => {
  const cwd = initGitCwdMain();
  makeRunnerProposedItem(cwd, 'diag-gh-item', { verify: 'true' });
  const fake = writeMergeSuccessWithCommitFake(cwd, 'fake-merge-sha-42');

  const result = run(cwd, ['approve', 'diag-gh-item', '--github', '--pr', '42'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 0, result.stderr);

  const logPath = path.join(cwd, '.fgos', 'logs', APPROVE_FAULT_LOG_BASENAME);
  assert.ok(fs.existsSync(logPath), 'diagnostic log file must exist');

  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
  const records = lines.map((line) => JSON.parse(line));
  const record = records.find((r) => r.id === 'diag-gh-item');

  assert.ok(record, 'diagnostic log record for github item must exist');
  assert.equal(record.phase, 'github merge');
  assert.equal(record.mergedSha, 'fake-merge-sha-42');
  assert.equal(record.mergedInto, 'main');
});

test('approve (failure path on lock-timeout): fires fault record carrying detail, mergedSha, and mergedInto', () => {
  const cwd = initGitCwdMain();
  makeRunnerProposedItem(cwd, 'diag-fault-item', { verify: 'true' });

  const result = run(cwd, ['approve', 'diag-fault-item'], { FGOS_TEST_FORCE_APPROVE_LOCK_TIMEOUT: 'diag-fault-item' });
  assert.equal(result.status, 0, result.stderr);

  const data = envelopeData(result.stdout);
  assert.equal(data.deliveryUnrecorded, true);
  assert.ok(data.diagnosticLog);

  const lines = fs.readFileSync(data.diagnosticLog, 'utf8').trim().split('\n');
  const records = lines.map((line) => JSON.parse(line));
  const faultRecord = records.find((r) => r.id === 'diag-fault-item' && r.detail);

  assert.ok(faultRecord, 'failure fault record must exist');
  assert.equal(faultRecord.phase, 'root-into-main merge');
  assert.match(faultRecord.detail, /lock-timeout/);
  assert.equal(typeof faultRecord.mergedSha, 'string');
  assert.ok(faultRecord.mergedSha.length > 0);
  assert.equal(faultRecord.mergedInto, 'main');
});
