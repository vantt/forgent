// The CLI wiring of move: what only bin/fgos.mjs decides (the refusal of an empty reason flag, the forwarding of
// --override-reason, --skip-return-guard, --answer and --approve, the envelope). The cases of move are owned by
// test/direct/fgos-move.test.mjs, which calls moveUseCase in process.
// Bộ đồ nghề dùng chung nằm ở ./helpers/fgos-cli-harness.mjs.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import {
  addOk,
  assert,
  commitPendingBeforeApprove,
  envelopeData,
  eventLines,
  initGitCwdMainFast,
  makeRunnerProposedItem,
  run,
  stateView,
  path,
  takeOk,
  tmpCwdFromTemplate,
} from './helpers/fgos-cli-harness.mjs';
import { putInAwaiting } from '../../src/state/store.mjs';

// A question in the decision-question template, as `fgos ask` requires.
const QUESTION = [
  '## Chuyện gì đang xảy ra', '', 'Background needed to understand this question without opening another file.', '',
  '## Nguyên nhân', '', 'This directly affects the outcome: still relevant?', '',
  '## Các lựa chọn', '', '(a) giữ cách hiện tại; (b) đổi sang cách đã đề xuất ở trên.', '',
  '## Khuyến nghị', '', '(b), vì nó giải quyết đúng vấn đề đã nêu.', '',
  '## Phạm vi của câu trả lời', '', 'Đồng ý chỉ cho phép làm đúng thay đổi này, không gì thêm.',
].join('\n');

test('move refuses an empty or missing flag value (--override-reason, --skip-return-guard, --to, --expect, --reason) as validation, exit 4, writing no event', async () => {
  const cwd = initGitCwdMainFast();
  await makeRunnerProposedItem(cwd, 'move-empty-override', { verify: 'true' });
  commitPendingBeforeApprove(cwd, 'move-empty-override');
  assert.equal(addOk(cwd, 'move-guard-empty').status, 0);
  await takeOk(cwd, 'move-guard-empty');

  // boundary: an empty flag value is refused by bin/fgos.mjs's flag parsing.
  const override = run(cwd, ['move', 'move-empty-override', '--to', 'delivered', '--override-reason', '']);
  assert.equal(override.status, 4, override.stderr);
  assert.match(override.stderr, /--override-reason requires a non-empty reason/);
  // boundary: an empty flag value is refused by bin/fgos.mjs's flag parsing.
  const skip = run(cwd, ['move', 'move-guard-empty', '--to', 'awaiting-approval', '--skip-return-guard', '']);
  assert.equal(skip.status, 4, skip.stderr);
  assert.match(skip.stderr, /--skip-return-guard requires a non-empty reason/);

  // boundary: a bare --to, an empty --expect and an empty --reason are refused by bin/fgos.mjs's flag parsing.
  for (const args of [['--to'], ['--to', 'todo', '--expect', ''], ['--to', 'todo', '--reason', '']]) {
    const before = eventLines(cwd).length;
    const result = run(cwd, ['move', 'move-empty-override', ...args]);
    assert.equal(result.status, 4, `${args.join(' ')}: ${result.stderr}`);
    assert.equal(eventLines(cwd).length, before, `${args.join(' ')} writes no event`);
  }

  assert.equal(stateView(cwd).work['move-empty-override'].status, 'awaiting-approval');
  assert.equal(stateView(cwd).work['move-guard-empty'].status, 'doing');
});

test('fgos move maps a refused edge to exit 2, a CAS mismatch to exit 3 and an unknown id to exit 4; a legal move prints its envelope and appends one event', () => {
  const cwd = tmpCwdFromTemplate();
  assert.equal(addOk(cwd, 'move-exit-codes').status, 0);
  const before = eventLines(cwd).length;

  // boundary: the exit code each refusal category maps to is decided by the CLI process.
  assert.equal(run(cwd, ['move', 'move-exit-codes', '--to', 'done']).status, 2);
  // boundary: the exit code each refusal category maps to is decided by the CLI process.
  assert.equal(run(cwd, ['move', 'move-exit-codes', '--to', 'blocked', '--expect', 'doing']).status, 3);
  // boundary: the exit code each refusal category maps to is decided by the CLI process.
  assert.equal(run(cwd, ['move', 'never-added', '--to', 'blocked']).status, 4);
  assert.equal(eventLines(cwd).length, before, 'no refusal writes an event');

  // boundary: the envelope is written by bin/fgos.mjs's dispatcher.
  const result = run(cwd, ['move', 'move-exit-codes', '--to', 'blocked']);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(envelopeData(result.stdout), { id: 'move-exit-codes', from: 'todo', to: 'blocked', seq: before + 1 });
  assert.equal(eventLines(cwd).length, before + 1);
});

test('fgos move forwards --override-reason and --skip-return-guard to their own target and prints the envelope', async () => {
  const cwd = initGitCwdMainFast();
  await makeRunnerProposedItem(cwd, 'move-override', { verify: 'true' });
  commitPendingBeforeApprove(cwd, 'move-override');
  assert.equal(addOk(cwd, 'move-guard-override').status, 0);
  await takeOk(cwd, 'move-guard-override');

  // boundary: the flag is forwarded and the envelope written by bin/fgos.mjs.
  const delivered = run(cwd, ['move', 'move-override', '--to', 'delivered', '--override-reason', 'evidence in incident-42']);
  assert.equal(delivered.status, 0, delivered.stderr);
  assert.equal(envelopeData(delivered.stdout).to, 'delivered');
  // boundary: the flag is forwarded and the envelope written by bin/fgos.mjs.
  const proposed = run(cwd, ['move', 'move-guard-override', '--to', 'awaiting-approval', '--skip-return-guard', 'evidence in incident-99']);
  assert.equal(proposed.status, 0, proposed.stderr);
  assert.equal(envelopeData(proposed.stdout).to, 'awaiting-approval');
});

test('fgos move forwards --answer and --approve out of awaiting-human', async () => {
  const cwd = initGitCwdMainFast();
  assert.equal(addOk(cwd, 'move-approve-item').status, 0);
  await takeOk(cwd, 'move-approve-item');
  putInAwaiting(path.join(cwd, '.fgos'), { id: 'move-approve-item', ask: QUESTION });

  // boundary: --answer and --approve are forwarded by bin/fgos.mjs's flag parsing.
  const result = run(cwd, ['move', 'move-approve-item', '--to', 'todo', '--answer', 'approved plan', '--approve']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(stateView(cwd).work['move-approve-item'].status, 'todo');
  assert.equal(stateView(cwd).gates['move-approve-item'].approved, true);
});
