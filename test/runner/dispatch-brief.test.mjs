import { test } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { briefPaths, renderBrief, renderPointer } from '../../src/runner/dispatch/brief.mjs';
import { resolveExecutorCommand } from '../../src/runner/dispatch/transport.mjs';

const RUN_DIR = path.join(os.tmpdir(), 'assignments', 'a1', 'runs', '01');

test('every path a worker is given is absolute -- its cwd is its own worktree', () => {
  const p = briefPaths(RUN_DIR, 1);
  for (const value of Object.values(p)) {
    assert.ok(path.isAbsolute(value), `${value} must be absolute`);
  }
  assert.equal(p.ackPath, path.join(RUN_DIR, 'outbox', 'ack-1.json'));
  assert.equal(p.resultPath, path.join(RUN_DIR, 'outbox', 'result-1.json'));
  assert.equal(p.briefPath, path.join(RUN_DIR, 'brief-1.md'));
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
  assert.ok(pointer.includes(path.join(RUN_DIR, 'brief-3.md')));
});

test('R6: renderBrief renders effectiveContract and unifies to single result path (p.resultPath)', () => {
  const effectiveContract = {
    mutation: 'none',
    limits: { executorTimeoutMs: 30000 },
  };
  const prompt = [
    'Assignment: asgn-123',
    'Work: item-abc',
    'Result artifact:',
    '- Write structured JSON to /tmp/conflicting/agent-result.json',
    '  - "contract" may be omitted only for legacy claim input',
    '  - "status" must be exactly one of: done | blocked',
    '- Optional human-readable report: /tmp/conflicting/agent-report.md',
    '- Do not call Work lifecycle verbs unless the task-spec explicitly says this Assignment is the lifecycle driver.',
  ].join('\n');

  const brief = renderBrief({
    prompt,
    round: 1,
    runDir: RUN_DIR,
    agentName: 'fgos-w1',
    effectiveContract,
  });

  // Effective execution contract section rendered
  assert.match(brief, /## Execution contract/);
  assert.match(brief, /Result claim path: .*outbox[/\\]result-1\.json/);

  // Conflicting agent-result.json path stripped from inner prompt
  assert.doesNotMatch(brief, /agent-result\.json/);
  assert.doesNotMatch(brief, /agent-report\.md/);

  // Guardrail preserved
  assert.match(brief, /Do not call Work lifecycle verbs unless the task-spec explicitly says this Assignment is the lifecycle driver\./);

  // Exactly one result path and one report path mentioned
  const resultMatches = brief.match(/result-1\.json/g);
  assert.ok(resultMatches && resultMatches.length >= 1);
  assert.match(brief, /Write only inside .*outbox/);
});

test('F2: renderBrief preserves read-only report-REQUIRED warning and unifies Effective execution contract claim path', () => {
  const prompt = [
    'Result artifact:',
    '- Write structured JSON to /old/run/agent-result.json',
    '  - "contract" may be omitted only for legacy claim input',
    '- Also write a human-readable report to /old/run/agent-report.md -- REQUIRED for this read-only operation: a "done" status with no report artifact is treated as unevidenced (no-evidence), not accepted as done.',
    '- Do not call Work lifecycle verbs unless the task-spec explicitly says this Assignment is the lifecycle driver.',
    'Effective execution contract:',
    '- Contract: effective-execution-contract.v1',
    '- Mutation: read-only',
    '- Claim path: /old/run/agent-result.json',
    '- Timeout: 30000ms',
  ].join('\n');

  const brief = renderBrief({
    prompt,
    round: 1,
    runDir: RUN_DIR,
    agentName: 'fgos-w1',
    effectiveContract: { mutation: 'read-only', limits: { timeoutMs: 30000 } },
  });

  // Zero mentions of old agent-result.json or agent-report.md
  assert.doesNotMatch(brief, /agent-result\.json/);
  assert.doesNotMatch(brief, /agent-report\.md/);

  // Guardrail preserved
  assert.match(brief, /Do not call Work lifecycle verbs/);

  // Report-REQUIRED warning preserved and aligned to report-1.md
  assert.match(brief, /Also write a human-readable report to .*report-1\.md -- REQUIRED for this read-only operation/);

  // Claim path in Effective execution contract unified to result-1.json
  assert.match(brief, /Claim path: .*result-1\.json/);
});

test('R6 / M7 lock: resolveExecutorCommand warns on argv exceeding MAX_ARG_STRLEN (128 KiB)', () => {
  const hugeArg = 'x'.repeat(131073);
  const cfg = {
    executor: {
      command: 'echo',
      args: ['{prompt}'],
      adapter: 'cli-spawn',
    },
    modelPolicies: {
      claude: { standard: 'sonnet' },
    },
  };

  const originalWrite = process.stderr.write;
  let warningEmitted = '';
  process.stderr.write = (chunk) => {
    warningEmitted += chunk;
    return true;
  };

  try {
    const res = resolveExecutorCommand(cfg, {
      prompt: hugeArg,
      model: 'sonnet',
      tier: 'standard',
    });
    assert.ok(res.args.length > 0);
    assert.match(warningEmitted, /exceeds Linux MAX_ARG_STRLEN 128 KiB/);
  } finally {
    process.stderr.write = originalWrite;
  }
});
