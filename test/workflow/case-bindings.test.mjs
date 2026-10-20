// test/workflow/case-bindings.test.mjs — one record file per worktree identity; crash-safe; masked views are never "unbound"

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

import {
  bindWorktree,
  bindingsDir,
  bindingKeyOf,
  commitBinding,
  createPendingBinding,
  readBinding,
  repairCaseBindings,
  unbindWorktree,
  SENTINEL_NAME,
} from '../../src/workflow/case-bindings.mjs';
import { acquireDispatchCwdLock } from '../../src/runner/dispatch/cwd-lock.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';
import { conductorWorkflow, eventsOf, openCase, withHold } from '../helpers/workflow-case-fixture.mjs';

const SRC = (name) => path.resolve('src/workflow', name);

function twoCases() {
  const repoRoot = makeFixtureDir('fgos-bind-');
  const a = openCase({ repoRoot });
  const b = openCase({ repoRoot, workflow: conductorWorkflow() });
  return { repoRoot, a, b };
}

const dirIn = (repoRoot, name) => {
  const dir = path.join(repoRoot, 'worktrees', name);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

/** Run a module script in its own process and wait; `signal` is the signal it died of. */
function runChild(code) {
  const child = spawn(process.execPath, ['--input-type=module', '-e', code], { stdio: ['ignore', 'pipe', 'inherit'] });
  let out = '';
  child.stdout.on('data', (chunk) => { out += chunk; });
  return new Promise((resolve) => child.once('exit', (status, signal) => resolve({ status, signal, out: out.trim() })));
}

async function withDispatchDepth(depth, action) {
  const saved = process.env.FGOS_DISPATCH_DEPTH;
  if (depth === undefined) delete process.env.FGOS_DISPATCH_DEPTH;
  else process.env.FGOS_DISPATCH_DEPTH = String(depth);
  try {
    return await action();
  } finally {
    if (saved === undefined) delete process.env.FGOS_DISPATCH_DEPTH;
    else process.env.FGOS_DISPATCH_DEPTH = saved;
  }
}

test('two cases bind one worktree reached by two spellings of its path: the second is refused as already bound', async () => {
  await withDispatchDepth(undefined, () => {
    const { repoRoot, a, b } = twoCases();
    const real = dirIn(repoRoot, 'wt');
    const link = path.join(repoRoot, 'worktrees', 'alias');
    fs.symlinkSync(real, link);
    assert.equal(bindingKeyOf(real), bindingKeyOf(link), 'one identity for every spelling');

    const first = withHold(a, (hold) => bindWorktree({ mainRoot: repoRoot, hold, caseId: a.caseId, worktree: real }));
    assert.equal(first.ok, true);
    const second = withHold(b, (hold) => bindWorktree({ mainRoot: repoRoot, hold, caseId: b.caseId, worktree: link }));
    assert.equal(second.ok, false);
    assert.equal(second.answer, 'worktree-already-bound');
    assert.equal(second.record.caseId, a.caseId);
    assert.equal(readBinding({ mainRoot: repoRoot, worktree: link, caseId: a.caseId }).answer, 'bound', 'the owner reaches it by either spelling');
    assert.equal(eventsOf(b).filter((e) => e.type === 'binding').length, 0, 'the refused case recorded nothing');
  });
});

test('a binding is one file: concurrent creators leave exactly one winner, and a never-bound worktree is unbound without opening a ledger', async () => {
  await withDispatchDepth(undefined, async () => {
    const { repoRoot, a } = twoCases();
    const wt = dirIn(repoRoot, 'race');

    // A ledger nobody may read: an answer that opened it would throw.
    const bad = path.join(repoRoot, '.fgos', 'workflow-runs', 'wf-unreadable');
    fs.mkdirSync(bad, { recursive: true });
    fs.writeFileSync(path.join(bad, 'events.jsonl'), '{"seq": 7, garbage');
    fs.chmodSync(path.join(bad, 'events.jsonl'), 0o000);
    assert.equal(readBinding({ mainRoot: repoRoot, worktree: wt, caseId: a.caseId }).answer, 'unbound');
    assert.ok(fs.existsSync(path.join(bindingsDir(repoRoot), SENTINEL_NAME)), 'the host marked the directory before answering');
    fs.chmodSync(path.join(bad, 'events.jsonl'), 0o600);

    const script = (caseId) => `
      import { createPendingBinding } from ${JSON.stringify(SRC('case-bindings.mjs'))};
      const r = createPendingBinding({ mainRoot: ${JSON.stringify(repoRoot)}, caseId: ${JSON.stringify(caseId)}, generation: 1, worktree: ${JSON.stringify(wt)} });
      console.log(JSON.stringify({ created: r.created, answer: r.answer ?? null }));
    `;
    const results = await Promise.all(['case-one', 'case-two', 'case-three', 'case-four'].map((id) => runChild(script(id))));
    const outcomes = results.map((r) => JSON.parse(r.out));
    assert.equal(outcomes.filter((o) => o.created).length, 1, JSON.stringify(outcomes));
    assert.ok(outcomes.filter((o) => !o.created).every((o) => o.answer === 'binding-unsettled'), 'the losers see a pending record, never "unbound"');
  });
});

test('masked or unmarked views answer binding-view-unavailable, never unbound', async () => {
  const { repoRoot, a } = twoCases();
  const wt = dirIn(repoRoot, 'masked');
  // A confined reader sees an empty or absent directory and may not write the sentinel.
  await withDispatchDepth(2, () => {
    assert.equal(readBinding({ mainRoot: repoRoot, worktree: wt, caseId: a.caseId }).answer, 'binding-view-unavailable');
    assert.equal(createPendingBinding({ mainRoot: repoRoot, caseId: a.caseId, generation: 1, worktree: wt }).answer, 'binding-view-unavailable');
    fs.mkdirSync(bindingsDir(repoRoot), { recursive: true });
    assert.equal(readBinding({ mainRoot: repoRoot, worktree: wt, caseId: a.caseId }).answer, 'binding-view-unavailable', 'the directory exists but carries no sentinel');
  });
  await withDispatchDepth(undefined, () => {
    assert.equal(readBinding({ mainRoot: repoRoot, worktree: wt, caseId: a.caseId }).answer, 'unbound', 'the host marks it, and then an absent file means unbound');
  });
});

test('a crash at any step of binding never reads as unbound; repair settles it from the ledger', async () => {
  await withDispatchDepth(undefined, async () => {
    const { repoRoot, a } = twoCases();
    const afterPending = dirIn(repoRoot, 'after-pending');
    const afterEvent = dirIn(repoRoot, 'after-event');

    // 1. killed right after the pending record was made.
    const one = await runChild(`
      import { createPendingBinding } from ${JSON.stringify(SRC('case-bindings.mjs'))};
      createPendingBinding({ mainRoot: ${JSON.stringify(repoRoot)}, caseId: ${JSON.stringify(a.caseId)}, generation: 1, worktree: ${JSON.stringify(afterPending)} });
      process.kill(process.pid, 'SIGKILL');
    `);
    assert.equal(one.signal, 'SIGKILL');
    assert.equal(readBinding({ mainRoot: repoRoot, worktree: afterPending, caseId: a.caseId }).answer, 'binding-unsettled');

    // 2. killed after the `binding` event, before the record became committed.
    const two = await runChild(`
      import { createPendingBinding } from ${JSON.stringify(SRC('case-bindings.mjs'))};
      import { acquireAdvanceLock } from ${JSON.stringify(SRC('case-lock.mjs'))};
      import { appendWorkflowEvent } from ${JSON.stringify(SRC('store.mjs'))};
      const hold = acquireAdvanceLock(${JSON.stringify(repoRoot)}, ${JSON.stringify(a.caseId)});
      const made = createPendingBinding({ mainRoot: ${JSON.stringify(repoRoot)}, caseId: ${JSON.stringify(a.caseId)}, generation: 2, worktree: ${JSON.stringify(afterEvent)} });
      appendWorkflowEvent({ repoRoot: ${JSON.stringify(repoRoot)}, workflowRunId: ${JSON.stringify(a.caseId)}, hold, event: { type: 'binding', payload: { caseId: ${JSON.stringify(a.caseId)}, generation: 2, key: made.key, worktreeRoot: made.record.worktreeRoot, state: 'bound' } } });
      process.kill(process.pid, 'SIGKILL');
    `);
    assert.equal(two.signal, 'SIGKILL');
    for (const answerer of [a.caseId, 'another-case']) {
      assert.equal(readBinding({ mainRoot: repoRoot, worktree: afterEvent, caseId: answerer }).answer, 'binding-unsettled', `as ${answerer}`);
    }

    // A record that does not parse is unsettled too.
    const garbled = dirIn(repoRoot, 'garbled');
    fs.writeFileSync(path.join(bindingsDir(repoRoot), `${bindingKeyOf(garbled)}.json`), '{"state": "comm');
    assert.equal(readBinding({ mainRoot: repoRoot, worktree: garbled, caseId: a.caseId }).answer, 'binding-unsettled');
    fs.rmSync(path.join(bindingsDir(repoRoot), `${bindingKeyOf(garbled)}.json`));

    const actions = withHold(a, () => repairCaseBindings({ mainRoot: repoRoot, caseId: a.caseId }));
    assert.deepEqual(actions.map((x) => x.action).sort(), ['committed', 'removed']);
    assert.equal(readBinding({ mainRoot: repoRoot, worktree: afterEvent, caseId: a.caseId }).answer, 'bound', 'the event was on the ledger, so the binding stands');
    assert.equal(readBinding({ mainRoot: repoRoot, worktree: afterPending, caseId: a.caseId }).answer, 'unbound', 'no event: it never reached anything');
  });
});

test('a late cleanup with an old generation leaves the new binding in place; unbinding waits for a quiet attempt', async () => {
  await withDispatchDepth(undefined, () => {
    const { repoRoot, a } = twoCases();
    const wt = dirIn(repoRoot, 'reused');
    const bind = () => withHold(a, (hold) => bindWorktree({ mainRoot: repoRoot, hold, caseId: a.caseId, worktree: wt }));
    const unbind = (generation, key) => withHold(a, (hold) => unbindWorktree({ mainRoot: repoRoot, hold, caseId: a.caseId, generation, key, worktree: wt }));

    const first = bind();
    assert.equal(first.generation, 1);
    assert.equal(bind().already, true, 'binding again is the same binding');
    assert.deepEqual(unbind(1, first.key), { unbound: true });
    const second = bind();
    assert.equal(second.generation, 2);

    assert.deepEqual(unbind(1, first.key), { unbound: false, reason: 'generation-mismatch' });
    assert.equal(readBinding({ mainRoot: repoRoot, worktree: wt, caseId: a.caseId }).record.generation, 2, 'the old cleanup removed nothing of the new owner');

    // The attempt is not quiet while its custody lease is held.
    const held = acquireDispatchCwdLock(path.join(repoRoot, '.fgos'), wt);
    try {
      assert.deepEqual(unbind(2, second.key), { unbound: false, reason: 'attempt-not-quiet' });
    } finally {
      held.release();
    }
    assert.deepEqual(unbind(2, second.key), { unbound: true });
    const states = eventsOf(a).filter((e) => e.type === 'binding').map((e) => `${e.payload.generation}:${e.payload.state}`);
    assert.deepEqual(states, ['1:bound', '1:unbound', '2:bound', '2:unbound']);
  });
});

test('only the owner of a pending record commits it', async () => {
  await withDispatchDepth(undefined, () => {
    const { repoRoot, a, b } = twoCases();
    const wt = dirIn(repoRoot, 'owned');
    const made = createPendingBinding({ mainRoot: repoRoot, caseId: a.caseId, generation: 1, worktree: wt });
    assert.equal(commitBinding({ mainRoot: repoRoot, key: made.key, caseId: b.caseId, generation: 1 }).committed, false);
    assert.equal(commitBinding({ mainRoot: repoRoot, key: made.key, caseId: a.caseId, generation: 9 }).committed, false);
    assert.equal(commitBinding({ mainRoot: repoRoot, key: made.key, caseId: a.caseId, generation: 1 }).committed, true);
    assert.equal(readBinding({ mainRoot: repoRoot, worktree: wt, caseId: a.caseId }).answer, 'bound');
  });
});
