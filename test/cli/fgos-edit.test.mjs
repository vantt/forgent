// The CLI wiring of edit and resolve-park-reason: what only bin/fgos.mjs decides (the envelope, the process cwd a
// linked worktree runs from, the required flags). Their cases are owned by test/direct/fgos-edit.test.mjs and
// test/direct/fgos-resolve-park-reason.test.mjs, which call the use cases in process.
// Bộ đồ nghề dùng chung nằm ở ./helpers/fgos-cli-harness.mjs.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import {
  addOk,
  addWork,
  assert,
  envelopeData,
  eventLines,
  fs,
  initGitCwdWithWorktree,
  logPath,
  moveOk,
  path,
  run,
  stateView,
  tmpCwdFromTemplate,
  toDoneViaChain,
} from './helpers/fgos-cli-harness.mjs';

// A Work event was once found in the frozen `.fgos/events.jsonl` baseline after exactly this lifecycle run through
// CLI processes; the in-process store tests cannot see what a CLI process writes.
test('a full add -> edit -> move -> edit CLI lifecycle lands every event in the Event Store and writes no tracked event file', () => {
  const cwd = tmpCwdFromTemplate();
  assert.deepEqual(eventLines(cwd), [], 'tmpCwdFromTemplate(): the store should start empty');

  assert.equal(addOk(cwd, 'write-path-guard').status, 0);
  // boundary: the event path a CLI process writes is the subject.
  assert.equal(run(cwd, ['edit', 'write-path-guard', '--verify', 'echo first']).status, 0);
  // boundary: the event path a CLI process writes is the subject.
  assert.equal(run(cwd, ['move', 'write-path-guard', '--to', 'blocked']).status, 0);
  // boundary: the event path a CLI process writes is the subject.
  assert.equal(run(cwd, ['edit', 'write-path-guard', '--verify', 'echo second']).status, 0);

  const types = eventLines(cwd).map((line) => JSON.parse(line).type);
  assert.deepEqual(types, ['work.add', 'work.edit', 'work.move', 'work.edit'], 'the whole lifecycle landed in the store, in order');
  assert.equal(fs.existsSync(logPath(cwd)), false, 'no frozen events.jsonl baseline is written');
  assert.equal(fs.existsSync(path.join(cwd, '.fgos', 'events')), false, 'no per-writer shard directory is written');
});

test('fgos edit prints the fgos.v1 envelope with the id, the changed fields and the event seq', () => {
  const cwd = tmpCwdFromTemplate();
  addOk(cwd, 'edit-seq-check'); // event #1
  // boundary: the envelope is written by bin/fgos.mjs's dispatcher.
  const result = run(cwd, ['edit', 'edit-seq-check', '--risk', 'heavy']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.seq, 2);
  assert.equal(data.id, 'edit-seq-check');
  assert.deepEqual(data.fields, ['risk']);
});

test('edit --verify-from-children run from inside a linked worktree with --dir at the main checkout bakes the main checkout into the generated verify', () => {
  const { cwd, worktreePath } = initGitCwdWithWorktree();
  const dir = path.join(cwd, '.fgos');
  for (const [id, parent] of [['parent-x'], ['child-1', 'parent-x']]) {
    addWork(dir, { id, title: id, kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'x', ...(parent ? { parent } : {}) });
  }

  // boundary: the generator reads the repo root from the process cwd, which only a CLI process run from the worktree has.
  const result = run(worktreePath, ['edit', 'parent-x', '--verify-from-children', '--dir', cwd]);
  assert.equal(result.status, 0, result.stderr);
  const verify = stateView(cwd).work['parent-x'].verify;
  assert.match(verify, /child-1/);
  assert.ok(verify.includes(`--dir ${cwd}`), `expected --dir "${cwd}" (main checkout, not the worktree) in: ${verify}`);
  assert.ok(!verify.includes(worktreePath), `verify must not bake in the worktree's own path: ${verify}`);
});

test('fgos resolve-park-reason requires --note (exit 4) and records the note it is given', () => {
  const cwd = tmpCwdFromTemplate();
  assert.equal(addOk(cwd, 'resolve-cli-item').status, 0);
  assert.equal(moveOk(cwd, 'resolve-cli-item', 'awaiting-approval', { skipReturnGuard: 'test setup' }).status, 0);
  toDoneViaChain(cwd, 'resolve-cli-item');

  // boundary: a required flag is checked by bin/fgos.mjs before the store is called.
  const missing = run(cwd, ['resolve-park-reason', 'resolve-cli-item']);
  assert.equal(missing.status, 4);
  assert.match(missing.stderr, /requires --note/);

  // boundary: the envelope is written by bin/fgos.mjs's dispatcher.
  const result = run(cwd, ['resolve-park-reason', 'resolve-cli-item', '--note', 'Clean close check']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(envelopeData(result.stdout).id, 'resolve-cli-item');
  assert.equal(stateView(cwd).parkResolutions['resolve-cli-item'][0].note, 'Clean close check');
});
