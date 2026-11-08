import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fixture, append, installFetchMapping } from '../event-store/phase07-fixture.mjs';
import { checkEventStore, eventStoreSetupContext, eventStoreDoctor } from '../../src/setup/event-store-checks.mjs';
import { writeProjectConfig, writeRawProjectConfig } from '../helpers/config-fixture.mjs';
import { DOCTOR_CHECKS, FIX_REGISTRATIONS, createDoctorRun } from '../../src/setup/registrations.mjs';

test('doctor pass bodies are read-only in a real repo; no implicit repair of corrupt logs', t => {
  const f = fixture(t); append(f.store, [{}]);
  for (const name of ['open-root', 'machine-id', 'incidents']) assert.equal(checkEventStore(f.repo, `event-store-${name}`, f.ctx).passed, true, name);
  const active = path.join(f.repo, '.git/fgos/events/project/active.jsonl');
  const bytes = fs.readFileSync(active); fs.writeFileSync(active, Buffer.from(bytes.toString().replace('"title":"one"', '"title":"bad"')));
  const before = fs.readFileSync(active);
  checkEventStore(f.repo, 'event-store-incidents', f.ctx);
  assert.deepEqual(fs.readFileSync(active), before);
});
test('incidents is a pointer: it warns past twice the seal interval and never fails, even far past the old failing age', t => {
  for (const [age, expected] of [[599, 'pass'], [601, 'warn'], [3601, 'warn']]) {
    const f = fixture(t); append(f.store, [{ ts: new Date(Date.now() - age * 1000).toISOString() }]);
    const got = checkEventStore(f.repo, 'event-store-incidents', f.ctx);
    assert.equal(got.passed, true, JSON.stringify(got));
    assert.equal(got.message.startsWith('warning:'), expected === 'warn', got.message);
    if (expected === 'warn') assert.match(got.message, /unsealed events age \d+s; run `fgos events status`$/);
  }
});
test('a missing machine id fails', t => {
  const empty = fixture(t, { machine: false });
  assert.equal(checkEventStore(empty.repo, 'event-store-machine-id', empty.ctx).passed, false);
});
test('incidents counts orphan branch streams and persisted integrity problems, and fails closed only through the open-root row', t => {
  const f = fixture(t);
  assert.equal(checkEventStore(f.repo, 'event-store-incidents', f.ctx).message, 'no unsealed backlog, integrity problem or unpublished event');
  fs.mkdirSync(path.join(f.repo, '.git/fgos/events/branch:gone'));
  assert.equal(checkEventStore(f.repo, 'event-store-incidents', f.ctx).message, 'warning: 1 orphan branch stream(s); run `fgos events status`');
  append(f.store, [{}]);
  fs.writeFileSync(path.join(f.repo, '.git/fgos/events/project/integrity.json'), JSON.stringify({ code: 'event-store-ref-moved', ranges: [] }));
  assert.match(checkEventStore(f.repo, 'event-store-incidents', f.ctx).message, /^warning: 1 orphan branch stream\(s\); 1 integrity problem\(s\); run `fgos events status`$/);
  assert.equal(checkEventStore(f.temp, 'event-store-open-root', { ...f.ctx, trustedMain: f.temp }).passed, false);
});
test('incidents reports a peer mirror the reader skipped and the warning the last sync kept for it', async t => {
  const { syncUseCase } = await import('../../src/verbs/events/sync.mjs');
  const f = fixture(t, { remote: true });
  installFetchMapping(f); append(f.store, [{}]);
  assert.equal(checkEventStore(f.repo, 'event-store-incidents', f.ctx).passed, true);
  // A peer pushed a ref whose commit is no sealed history (no seal.json).
  const remote = (...args) => execFileSync('git', ['-C', path.join(f.temp, 'remote'), ...args], { encoding: 'utf8', input: '',
    env: { ...process.env, GIT_AUTHOR_NAME: 'Peer', GIT_AUTHOR_EMAIL: 'peer@example.test', GIT_COMMITTER_NAME: 'Peer', GIT_COMMITTER_EMAIL: 'peer@example.test' } }).trim();
  remote('update-ref', 'refs/fgos/events/peer-bb', remote('commit-tree', '-m', 'not a seal', remote('mktree')));
  syncUseCase(f.ctx);
  const row = checkEventStore(f.repo, 'event-store-incidents', f.ctx);
  assert.equal(row.passed, true, 'a pointer never fails');
  assert.match(row.message, /^warning: 2 integrity problem\(s\); run `fgos events status`$/, 'the skipped mirror and the sync warning are both counted');
});
test('shared machine ref warns only after reading another clone origin on the own mirror', async t => {
  const { syncUseCase } = await import('../../src/verbs/events/sync.mjs');
  const first = fixture(t, { remote: true });
  installFetchMapping(first); append(first.store, [{}]); syncUseCase(first.ctx);
  const second = fixture(t, { remote: true });
  second.git('remote', 'set-url', 'origin', path.join(first.temp, 'remote'));
  installFetchMapping(second); append(second.store, [{}]); syncUseCase(second.ctx);
  assert.match(checkEventStore(second.repo, 'event-store-machine-id', second.ctx).message, /^warning: event-store-machine-ref-shared/);
  assert.equal(checkEventStore(second.repo, 'event-store-incidents', second.ctx).message.startsWith('warning:'), false);
});

test('live worktree branch keys are not orphaned; removal makes the same stream orphaned', t => {
  const f = fixture(t); f.git('commit', '--allow-empty', '-qm', 'root');
  const linked = path.join(f.temp, 'linked');
  f.git('worktree', 'add', '-qb', 'Feature/Live_One', linked);
  fs.mkdirSync(path.join(f.repo, '.git/fgos/events/branch:feature-live-one'));
  assert.doesNotMatch(checkEventStore(f.repo, 'event-store-incidents', f.ctx).message, /orphan/);
  f.git('worktree', 'remove', linked);
  assert.match(checkEventStore(f.repo, 'event-store-incidents', f.ctx).message, /^warning: 1 orphan branch stream\(s\)/);
});
test('one doctor invocation reuses its status snapshot; a new invocation observes new data', t => {
  const f = fixture(t);
  const context = eventStoreSetupContext(f.repo, f.ctx);
  assert.strictEqual(context.status(), context.status());
  const check = eventStoreDoctor(f.repo, f.ctx);
  assert.equal(check('event-store-incidents').message.startsWith('warning:'), false);
  append(f.store, [{}]);
  fs.writeFileSync(path.join(f.repo, '.git/fgos/events/project/integrity.json'), JSON.stringify({ code: 'event-store-ref-moved' }));
  assert.equal(check('event-store-incidents').message.startsWith('warning:'), false, 'the run keeps its snapshot');
  assert.match(eventStoreDoctor(f.repo, f.ctx)('event-store-incidents').message, /^warning: 1 integrity problem/);
});

test('a doctor run remembers a failed setup context instead of retrying it per row, and doctor reports an unreadable shared config', t => {
  const f = fixture(t);
  writeRawProjectConfig(f.repo, '{ eventStore: half-written');
  const check = eventStoreDoctor(f.repo, f.ctx);
  const first = check('event-store-open-root');
  assert.equal(first.passed, false);
  assert.match(first.message, /event-store-config: config-parse/, 'doctor sees the parse failure, never the defaults');
  writeProjectConfig(f.repo, {});
  assert.deepEqual(check('event-store-open-root'), { passed: false, message: first.message }, 'every row of the run reports the one remembered failure');
  assert.equal(eventStoreDoctor(f.repo, f.ctx)('event-store-open-root').passed, true, 'a new run observes the repaired file');
  writeRawProjectConfig(f.repo, '{ eventStore: half-written');
  const pointer = eventStoreDoctor(f.repo, f.ctx)('event-store-incidents');
  assert.equal(pointer.passed, true, 'a pointer never fails; the open-root row carries the failure');
  assert.match(pointer.message, /^warning: incidents not read: event-store-config: config-parse/);
});

test('doctor reports a malformed seal coalescing window on every row, and a repaired value passes', t => {
  const f = fixture(t);
  for (const bad of [0, -5, 2.5, '30', null]) {
    writeProjectConfig(f.repo, { eventStore: { seal: { coalesceSec: bad } } });
    const row = eventStoreDoctor(f.repo, f.ctx)('event-store-open-root');
    assert.equal(row.passed, false, `coalesceSec ${JSON.stringify(bad)}`);
    assert.match(row.message, /event-store-config: config-schema .*eventStore\.seal\.coalesceSec/);
  }
  writeProjectConfig(f.repo, { eventStore: { seal: { coalesceSec: 5 } } });
  assert.equal(eventStoreDoctor(f.repo, f.ctx)('event-store-open-root').passed, true);
  assert.equal(eventStoreSetupContext(f.repo, f.ctx).config.seal.coalesceSec, 5);
  writeProjectConfig(f.repo, {});
  assert.equal(eventStoreSetupContext(f.repo, f.ctx).config.seal.coalesceSec, 30, 'the default is 30 seconds');
});

test('the four Event Store rows and one fix are registered and every row of a run shares one doctor', t => {
  const rows = DOCTOR_CHECKS.filter(({ id }) => id.startsWith('event-store-'));
  assert.deepEqual(rows.map(({ id }) => id).sort(), ['open-root', 'machine-id', 'incidents', 'legacy-layout'].map(name => `event-store-${name}`).sort());
  assert.deepEqual(FIX_REGISTRATIONS.filter(({ id }) => id.startsWith('event-store-')).map(({ id }) => id).sort(), ['event-store-lock-dirs']);
  const f = fixture(t);
  const run = createDoctorRun();
  const keys = [];
  const once = run.once;
  run.once = (key, compute) => { keys.push(key); return once(key, compute); };
  for (const row of rows) assert.equal(typeof row.check(f.repo, run).passed, 'boolean', row.id);
  assert.deepEqual([...new Set(keys)], [`event-store-doctor:${f.repo}`], 'one eventStoreDoctor per run');
  assert.equal(keys.length, rows.length);
});

test('incidents warns for real unpublished project events and not for a private local stream', t => {
  const f = fixture(t, { remote: true });
  assert.equal(checkEventStore(f.repo, 'event-store-incidents', f.ctx).message, 'no unsealed backlog, integrity problem or unpublished event');
  f.store.append('local', [{ eventType: 'private.local', schemaVersion: 1, payload: { secret: true }, ts: '2026-10-19T01:00:00.000Z' }], {}, 'fixture', []);
  assert.doesNotMatch(checkEventStore(f.repo, 'event-store-incidents', f.ctx).message, /unpublished/);
  append(f.store, [{}]);
  assert.match(checkEventStore(f.repo, 'event-store-incidents', f.ctx).message, /unpublished events; run `fgos events status`$/);
});
