import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { initStore, addPorting, movePorting, listPorting, rebuild } from '../../src/state/porting-store.mjs';
import { PortingError } from '../../src/state/porting.mjs';
import { appendEvent } from '../../src/state/events.mjs';

// Every test gets its own mkdtemp dir — never touch the repo's .fgos/.
function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-porting-store-'));
}

test('initStore creates <dir>/porting/events.jsonl and state.json, never touching <dir>\'s own root', () => {
  const dir = tmpDir();
  initStore(dir);
  assert.ok(fs.existsSync(path.join(dir, 'porting', 'events.jsonl')));
  assert.ok(fs.existsSync(path.join(dir, 'porting', 'state.json')));
  assert.ok(!fs.existsSync(path.join(dir, 'events.jsonl')));
  assert.ok(!fs.existsSync(path.join(dir, 'state.json')));
});

test('addPorting seeds a candidate row, forcing status to candidate regardless of caller-supplied status', () => {
  const dir = tmpDir();
  const { view } = addPorting(dir, { id: 'p1', title: 'Widget', status: 'ported' });
  assert.equal(view.porting.p1.status, 'candidate');
  assert.equal(view.porting.p1.title, 'Widget');
});

test('addPorting requires a non-empty "id"', () => {
  const dir = tmpDir();
  assert.throws(
    () => addPorting(dir, {}),
    (err) => err instanceof PortingError && err.category === 'validation',
  );
  assert.throws(
    () => addPorting(dir, { id: '' }),
    (err) => err instanceof PortingError && err.category === 'validation',
  );
});

test('addPorting rejects a duplicate id as validation, checked BEFORE the event is appended', () => {
  const dir = tmpDir();
  addPorting(dir, { id: 'dup' });
  assert.throws(
    () => addPorting(dir, { id: 'dup' }),
    (err) => err instanceof PortingError && err.category === 'validation',
  );
  const raw = fs.readFileSync(path.join(dir, 'porting', 'events.jsonl'), 'utf8').trim().split('\n');
  assert.equal(raw.length, 1, 'the rejected duplicate must never reach the log');
});

test('movePorting delegates transition legality to transitionPorting — an illegal edge surfaces as precondition, not duplicated logic here', () => {
  const dir = tmpDir();
  addPorting(dir, { id: 'p1' });
  assert.throws(
    () => movePorting(dir, { id: 'p1', to: 'in-progress' }),
    (err) => err instanceof PortingError && err.category === 'precondition',
  );
});

test('movePorting CAS mismatch surfaces as conflict — delegated to transitionPorting, not duplicated here', () => {
  const dir = tmpDir();
  addPorting(dir, { id: 'p1' });
  assert.throws(
    () => movePorting(dir, { id: 'p1', to: 'planned', expectedStatus: 'planned' }),
    (err) => err instanceof PortingError && err.category === 'conflict',
  );
});

test('movePorting on a legal edge appends the event and the view reflects the new status', () => {
  const dir = tmpDir();
  addPorting(dir, { id: 'p1' });
  const { view } = movePorting(dir, { id: 'p1', to: 'planned', expectedStatus: 'candidate' });
  assert.equal(view.porting.p1.status, 'planned');
});

test('movePorting on an id never added throws PortingError(validation)', () => {
  const dir = tmpDir();
  assert.throws(
    () => movePorting(dir, { id: 'ghost', to: 'planned' }),
    (err) => err instanceof PortingError && err.category === 'validation',
  );
});

test('listPorting always rebuilds fresh from the log, never off a stale view file', () => {
  const dir = tmpDir();
  addPorting(dir, { id: 'p1' });
  fs.writeFileSync(path.join(dir, 'porting', 'state.json'), `${JSON.stringify({ porting: {} })}\n`, 'utf8');
  const view = listPorting(dir);
  assert.ok(view.porting.p1, 'listPorting must rebuild from the log, ignoring the stale view file on disk');
});

test('write order is append-then-rebuild: a simulated crash between the two steps recovers the correct view from the log alone via rebuild()', () => {
  const dir = tmpDir();
  initStore(dir);
  const logPath = path.join(dir, 'porting', 'events.jsonl');

  // Simulate a crash: append the event directly (bypassing addPorting's own
  // view refresh), so state.json is left exactly as initStore wrote it —
  // stale relative to the log.
  appendEvent(logPath, { type: 'porting.add', payload: { id: 'crash-p1', status: 'candidate', title: 'Crash test' } });
  const staleView = JSON.parse(fs.readFileSync(path.join(dir, 'porting', 'state.json'), 'utf8'));
  assert.deepEqual(staleView.porting, {}, 'view is stale immediately after the simulated crash');

  const recovered = rebuild(dir);
  assert.equal(recovered.porting['crash-p1'].status, 'candidate');
  assert.equal(recovered.porting['crash-p1'].title, 'Crash test');

  const persisted = JSON.parse(fs.readFileSync(path.join(dir, 'porting', 'state.json'), 'utf8'));
  assert.deepEqual(persisted, recovered, 'rebuild() must also persist the recovered view to state.json');
});

test('porting-store never reads or writes the existing .fgos-shaped root events.jsonl/state.json — only the nested porting/ subdir', () => {
  const dir = tmpDir();
  fs.mkdirSync(dir, { recursive: true });
  const rootLogContents = '{"seq":1,"type":"work.add","payload":{"id":"w1"}}\n';
  fs.writeFileSync(path.join(dir, 'events.jsonl'), rootLogContents, 'utf8');

  addPorting(dir, { id: 'p1' });

  assert.equal(
    fs.readFileSync(path.join(dir, 'events.jsonl'), 'utf8'),
    rootLogContents,
    'the root-level work-item log must be left byte-for-byte untouched',
  );
  assert.ok(!fs.existsSync(path.join(dir, 'state.json')), 'porting-store must never write a root-level state.json');
});
