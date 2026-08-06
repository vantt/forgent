import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { judgeVerifySemanticCorrectness } from '../../src/intake/judge-executor.mjs';
import { resolveDiscovery } from '../../src/intake/discovery.mjs';
import { addWork, listWork, answerAwaiting } from '../../src/state/store.mjs';

// tsk-5cf D1a: judgeVerifySemanticCorrectness gave contradictory verdicts
// round to round on the same item's claim (reproduced live on tsk-4xg: 10
// rounds, at least two flat reversals of the judge's own prior stated
// criteria). Root cause: buildVerifyCheckPrompt built each round's prompt
// from only {title, description, proposedVerify} -- zero memory of the
// judge's own prior-round reasoning. This file proves the fix: an optional
// 4th argument threads the immediately-prior round's own rejection reason
// into the next round's prompt, the same "give the judge its own prior
// context" shape buildDiscoveryPrompt already uses for view.discovery[id].
//
// Fake executors only -- every "command" spawned here is a node script this
// file writes to a mkdtemp directory at test time, mirroring
// discovery.test.mjs's/judge-executor.test.mjs's own convention. No real
// agent CLI is ever invoked.

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-judge-verify-stability-test-'));
}

// The prompt is substituted into argv (resolveExecutorCommand's `{prompt}`
// template), never stdin -- this fake captures argv[2] verbatim to a file
// so the test can assert on the real prompt content, not a paraphrase.
function writeCapturingExecutor(dir, verdict) {
  const scriptPath = path.join(dir, 'capturing-executor.mjs');
  const capturePath = path.join(dir, 'captured-prompt.txt');
  fs.writeFileSync(
    scriptPath,
    `
    import fs from 'node:fs';
    fs.writeFileSync(${JSON.stringify(capturePath)}, process.argv[2] ?? '');
    process.stdout.write(${JSON.stringify(JSON.stringify(verdict))});
    process.exit(0);
    `,
  );
  return { scriptPath, capturePath };
}

function cfgFor(scriptPath) {
  return {
    executor: { command: process.execPath, args: [scriptPath, '{prompt}'] },
    models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
    timeoutMs: 5000,
  };
}

test('judgeVerifySemanticCorrectness with no priorRejection sends a prompt with no prior-round section', () => {
  const dir = mkTempDir();
  const { scriptPath, capturePath } = writeCapturingExecutor(dir, { agrees: true });
  const cfg = cfgFor(scriptPath);

  const result = judgeVerifySemanticCorrectness({ title: 'x', description: 'y', tier: 'standard' }, 'npm test', cfg);
  assert.equal(result.agrees, true);

  const capturedPrompt = fs.readFileSync(capturePath, 'utf8');
  assert.ok(!capturedPrompt.includes('Vòng trước đã từ chối'));
});

test('judgeVerifySemanticCorrectness threads a supplied priorRejection into the prompt verbatim', () => {
  const dir = mkTempDir();
  const { scriptPath, capturePath } = writeCapturingExecutor(dir, { agrees: true });
  const cfg = cfgFor(scriptPath);
  const priorReason = 'vòng trước từ chối vì: quá chung chung, chỉ grep một từ khoá';

  const result = judgeVerifySemanticCorrectness(
    { title: 'x', description: 'y', tier: 'standard' },
    'node --test test/setup/plugin-marketplace-doctor-check.test.mjs',
    cfg,
    priorReason,
  );
  assert.equal(result.agrees, true);

  const capturedPrompt = fs.readFileSync(capturePath, 'utf8');
  assert.ok(capturedPrompt.includes('Vòng trước đã từ chối'));
  assert.ok(capturedPrompt.includes(priorReason));
});

test('judgeVerifySemanticCorrectness with a blank/whitespace priorRejection omits the prior-round section, same as omitted', () => {
  const dir = mkTempDir();
  const { scriptPath, capturePath } = writeCapturingExecutor(dir, { agrees: true });
  const cfg = cfgFor(scriptPath);

  judgeVerifySemanticCorrectness({ title: 'x', description: 'y', tier: 'standard' }, 'npm test', cfg, '   ');

  const capturedPrompt = fs.readFileSync(capturePath, 'utf8');
  assert.ok(!capturedPrompt.includes('Vòng trước đã từ chối'));
});

// Integration-level: resolveDiscovery's own second-pass call site now reads
// view.gates[id].ask (the exact text a real dispute round parks on) and
// threads it forward automatically -- proving the wiring, not just the
// function signature.

function tmpStoreDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-resolve-discovery-stability-'));
}

function sampleWork(overrides = {}) {
  return {
    id: 'item-x',
    title: 'Produce the output file',
    kind: 'feature',
    status: 'todo',
    deps: [],
    risk: 'low',
    refs: [],
    verify: 'chưa xác định — P15 bổ sung',
    stage: 'clarify',
    ...overrides,
  };
}

// Round 1: caller-supplied clear verdict, second pass disagrees -> parks.
// Round 2 (after fgos answer resumes it): same caller-supplied verdict --
// the fake executor asserts the round-2 prompt it receives contains round
// 1's own disagreement reason, proving resolveDiscovery actually threads
// view.gates[id].ask through, not just that the function accepts the arg.
test('resolveDiscovery threads the prior dispute\'s ask text into the next round\'s second-pass prompt', () => {
  const scriptDir = mkTempDir();
  const capturePath = path.join(scriptDir, 'round2-captured-prompt.txt');
  const scriptPath = path.join(scriptDir, 'round-aware-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    import fs from 'node:fs';
    const prompt = process.argv[2] ?? '';
    if (prompt.includes('Kiểm tra độc lập một lệnh verify')) {
      if (prompt.includes('Vòng trước đã từ chối')) {
        fs.writeFileSync(${JSON.stringify(capturePath)}, prompt);
        process.stdout.write(${JSON.stringify(JSON.stringify({ agrees: true }))});
      } else {
        process.stdout.write(${JSON.stringify(JSON.stringify({ agrees: false, reason: 'round-1 disagreement: too generic' }))});
      }
    } else {
      process.stdout.write(${JSON.stringify(JSON.stringify({ clear: true, verify: 'node --test test/x.test.mjs' }))});
    }
    process.exit(0);
    `,
  );
  const cfg = cfgFor(scriptPath);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const round1 = resolveDiscovery(storeDir, 'item-x', cfg);
  assert.equal(round1.outcome, 'verify-disputed');
  assert.match(listWork(storeDir).gates['item-x'].ask, /round-1 disagreement: too generic/);

  // Resume from awaiting-human the same way `fgos answer` does, then retry
  // with a caller-supplied verdict (mirrors a live session proposing a
  // corrected verify after reading round 1's dispute).
  answerAwaiting(storeDir, { id: 'item-x', answer: 'retrying with the same verify' });

  const round2 = resolveDiscovery(storeDir, 'item-x', cfg);
  assert.equal(round2.outcome, 'clear');
  assert.ok(fs.existsSync(capturePath), 'round 2 prompt was never captured -- second pass never saw the prior-round section');
  const round2Prompt = fs.readFileSync(capturePath, 'utf8');
  assert.match(round2Prompt, /round-1 disagreement: too generic/);
});

// tsk-12t D1/D2/D4/D6: judgeVerifySemanticCorrectness's own mechanical
// pre-check for the documented node --test / --test-name-pattern
// reporter-format trap (docs/how-to/avoid-vacuous-pass-with-node-test-
// test-name-pattern.md) -- Node's default reporter never prints a
// TAP-style `# pass`/`# fail` line, so a verify grepping for that shape
// can never correctly detect pass/fail regardless of what the tested code
// does. A known-bad verify string built the same way the how-to doc's own
// "First attempt" real example was: `node --test --test-name-pattern=...`
// combined with a `grep -qE "^# pass ..."` check.
const KNOWN_BAD_VERIFY =
  'node --test --test-name-pattern="verify-from" file.test.mjs 2>&1 | grep -qE "^# pass [1-9]"';

test('rejects known-bad node --test reporter pattern before calling the LLM', () => {
  // No real executor is ever configured -- D4's short-circuit means
  // judgeVerifySemanticCorrectness must return before touching `cfg` at
  // all, so an intentionally-unusable cfg (`command: '/nonexistent'`)
  // still proves the mechanical rejection rather than accidentally
  // exercising a real spawn attempt.
  const cfg = { executor: { command: '/nonexistent-binary', args: [] }, models: { standard: 'sonnet' }, timeoutMs: 5000 };

  const result = judgeVerifySemanticCorrectness({ title: 'x', tier: 'standard' }, KNOWN_BAD_VERIFY, cfg);

  assert.equal(result.agrees, false);
  assert.equal(result.mechanical, true);
  assert.match(result.reason, /node --test/);
  assert.match(result.reason, /avoid-vacuous-pass-with-node-test-test-name-pattern\.md/);
});

test('does not call the LLM judge when the mechanical pattern trips', () => {
  const dir = mkTempDir();
  const { scriptPath, capturePath } = writeCapturingExecutor(dir, { agrees: true });
  const cfg = cfgFor(scriptPath);

  const result = judgeVerifySemanticCorrectness({ title: 'x', tier: 'standard' }, KNOWN_BAD_VERIFY, cfg);

  assert.equal(result.agrees, false);
  assert.ok(!fs.existsSync(capturePath), 'the configured executor was spawned -- the mechanical check did not short-circuit before the LLM call');
});

test('does not allow --force to bypass a mechanical pattern rejection', () => {
  const dir = mkTempDir();
  const { scriptPath } = writeCapturingExecutor(dir, { agrees: true });
  const cfg = cfgFor(scriptPath);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDiscovery(storeDir, 'item-x', cfg, undefined, { clear: true, verify: KNOWN_BAD_VERIFY, force: true });

  assert.equal(result.outcome, 'verify-disputed');
  assert.equal(result.secondPass.mechanical, true);
  assert.equal(listWork(storeDir).work['item-x'].status, 'awaiting-human');
});

// tsk-5ld: the two --force branches (discovery.mjs:684-706) with no test
// exercising them at all -- succeeding on a genuine (non-mechanical)
// disagreement, and refusing when the item is already parked. Both mirror
// tsk-25g's own decompose.test.mjs coverage for resolveDecompose's parallel
// --force logic (commit cd0cc56, merged to main).

test('resolveDiscovery --force overrides a disputed (non-mechanical) verify, logs the override, and advances to decompose (tsk-5ld)', () => {
  const dir = mkTempDir();
  // Disagrees on the second pass (a real judgement call, not the mechanical
  // known-bad-pattern short-circuit) -- the branch --force is meant to
  // override.
  const { scriptPath } = writeCapturingExecutor(dir, { agrees: false, reason: 'lệnh này không kiểm chứng đúng claim' });
  const cfg = cfgFor(scriptPath);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDiscovery(storeDir, 'item-x', cfg, undefined, { clear: true, verify: 'npm test -- reporting', force: true });

  assert.equal(result.outcome, 'clear');
  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'decompose');
  const overrideLog = (view.decisions ?? []).find((d) => d.id === 'item-x' && /--force overrode a disputed verify/.test(d.text));
  assert.ok(overrideLog, 'expected a decision log entry naming the overridden disagreement');
  assert.match(overrideLog.rationale, /lệnh này không kiểm chứng đúng claim/);
});

test('resolveDiscovery --force refuses when the item is already awaiting-human (points at fgos answer instead) (tsk-5ld)', () => {
  const dir = mkTempDir();
  const { scriptPath } = writeCapturingExecutor(dir, { agrees: false, reason: 'lệnh này không kiểm chứng đúng claim' });
  const cfg = cfgFor(scriptPath);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ status: 'awaiting-human' }));

  assert.throws(
    () => resolveDiscovery(storeDir, 'item-x', cfg, undefined, { clear: true, verify: 'npm test -- reporting', force: true }),
    /already "awaiting-human"/,
  );
});
