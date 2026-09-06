import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { briefPaths, renderBrief, renderPointer } from '../../src/runner/dispatch/brief.mjs';

const RUN_DIR = '/tmp/assignments/a1/runs/01';

test('every path a worker is given is absolute -- its cwd is its own worktree', () => {
  const p = briefPaths(RUN_DIR, 1);
  for (const value of Object.values(p)) {
    assert.ok(path.isAbsolute(value), `${value} must be absolute`);
  }
  assert.equal(p.ackPath, `${RUN_DIR}/outbox/ack-1.json`);
  assert.equal(p.resultPath, `${RUN_DIR}/outbox/result-1.json`);
  assert.equal(p.briefPath, `${RUN_DIR}/brief-1.md`);
});

test('the round number is in every filename, so a stale report cannot pass for a current one', () => {
  const p = briefPaths(RUN_DIR, 7);
  assert.match(p.briefPath, /brief-7\.md$/);
  assert.match(p.ackPath, /ack-7\.json$/);
  assert.match(p.reportPath, /report-7\.md$/);
  assert.match(p.resultPath, /result-7\.json$/);
});

test('the brief carries the prompt verbatim, however many lines it has', () => {
  const prompt = 'line one\n\nline two\n  indented three\n';
  const brief = renderBrief({ prompt, round: 1, runDir: RUN_DIR, agentName: 'fgos-w1' });
  assert.ok(brief.includes(prompt));
});

test('the brief teaches write-then-rename and puts the result last', () => {
  const brief = renderBrief({ prompt: 'do it', round: 1, runDir: RUN_DIR, agentName: 'fgos-w1' });
  assert.match(brief, /rename/i);
  assert.ok(
    brief.indexOf('report-1.md') < brief.indexOf('result-1.json'),
    'the result file ends the round, so it is written after the report exists',
  );
});

test('the brief never mentions an fgOS command -- a worker is not expected to know what dispatched it', () => {
  const brief = renderBrief({ prompt: 'do it', round: 1, runDir: RUN_DIR, agentName: 'fgos-w1' });
  // The agent's own name may well start with `fgos-`; what must not appear is
  // an instruction to RUN anything named fgos.
  assert.doesNotMatch(brief, /\bfgos [a-z]/i);
});

test('the pointer is one line and names the brief', () => {
  const pointer = renderPointer({ runDir: RUN_DIR, round: 3 });
  assert.ok(!pointer.includes('\n'));
  assert.ok(pointer.includes(`${RUN_DIR}/brief-3.md`));
});
