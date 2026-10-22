import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fixture, append } from '../event-store/phase07-fixture.mjs';
import { checkEventStore, eventStoreSetupContext, eventStoreDoctor } from '../../src/setup/event-store-checks.mjs';
import { fixEventStoreRefspec } from '../../src/setup/event-store-fixes.mjs';
import { DOCTOR_CHECKS, FIX_REGISTRATIONS, createDoctorRun } from '../../src/setup/registrations.mjs';

test('doctor pass bodies are read-only in a real repo; no implicit repair of corrupt logs', t => {
  const f = fixture(t); append(f.store, [{}]);
  for (const name of ['git-version', 'open-root', 'machine-id', 'refspec', 'unsealed', 'integrity', 'native-addon', 'orphan-branches', 'sync']) assert.equal(checkEventStore(f.repo, `event-store-${name}`, f.ctx).passed, true, name);
  const active = path.join(f.repo, '.git/fgos/events/project/active.jsonl');
  const bytes = fs.readFileSync(active); fs.writeFileSync(active, Buffer.from(bytes.toString().replace('"title":"one"', '"title":"bad"')));
  const before = fs.readFileSync(active);
  assert.equal(checkEventStore(f.repo, 'event-store-integrity', f.ctx).passed, false);
  assert.deepEqual(fs.readFileSync(active), before);
});
test('unsealed thresholds 599, 601 and 3601 seconds', t => {
  for (const [age, expected] of [[599, 'pass'], [601, 'warn'], [3601, 'fail']]) {
    const f = fixture(t); append(f.store, [{ ts: new Date(Date.now() - age * 1000).toISOString() }]);
    const got = checkEventStore(f.repo, 'event-store-unsealed', f.ctx);
    assert.equal(got.passed, expected !== 'fail', JSON.stringify(got));
    assert.equal(got.message.startsWith('warning:'), expected === 'warn');
  }
});
test('mapping facts fail missing/unsafe mappings and changed URL; machine missing fails', t => {
  const f = fixture(t, { remote: true });
  assert.equal(checkEventStore(f.repo, 'event-store-refspec', f.ctx).passed, false);
  fixEventStoreRefspec(f.repo, f.ctx);
  assert.equal(checkEventStore(f.repo, 'event-store-refspec', f.ctx).passed, true);
  f.git('config', '--add', 'remote.origin.push', 'refs/fgos/events/*:refs/fgos/events/*');
  assert.equal(checkEventStore(f.repo, 'event-store-refspec', f.ctx).passed, false);
  f.git('config', '--unset-all', 'remote.origin.push'); f.git('remote', 'set-url', 'origin', path.join(f.temp, 'other'));
  assert.equal(checkEventStore(f.repo, 'event-store-refspec', f.ctx).passed, false);
  const empty = fixture(t, { machine: false });
  assert.equal(checkEventStore(empty.repo, 'event-store-machine-id', empty.ctx).passed, false);
});
test('sync without unpublished events passes; missing addon fails rather than silently passing', t => {
  const f = fixture(t, { remote: true });
  assert.equal(checkEventStore(f.repo, 'event-store-sync', f.ctx).message, 'no unpublished events');
  assert.equal(checkEventStore(f.repo, 'event-store-native-addon', { loaderOptions: { descriptor: { manifest: {}, releaseRoot: f.repo } } }).passed, false);
});

test('orphan branches warn, persisted integrity fails, and nonrepositories fail closed', t => {
  const f = fixture(t);
  fs.mkdirSync(path.join(f.repo, '.git/fgos/events/branch:gone'));
  assert.match(checkEventStore(f.repo, 'event-store-orphan-branches', f.ctx).message, /^warning:.*branch:gone/);
  append(f.store, [{}]);
  fs.writeFileSync(path.join(f.repo, '.git/fgos/events/project/integrity.json'), JSON.stringify({ code: 'event-store-ref-moved', ranges: [] }));
  assert.equal(checkEventStore(f.repo, 'event-store-integrity', f.ctx).passed, false);
  assert.equal(checkEventStore(f.temp, 'event-store-open-root', { ...f.ctx, trustedMain: f.temp }).passed, false);
});
test('refspec check rejects broad namespace wildcards and agrees with Git on missing/installed mappings', async t => {
  const { checkGit } = await import('../../src/setup/git-checks.mjs');
  const f = fixture(t, { remote: true });
  const prior = process.env.FGOS_STATE_ROOT; process.env.FGOS_STATE_ROOT = f.stateRoot;
  try {
    for (const installed of [false, true]) {
      if (installed) fixEventStoreRefspec(f.repo, f.ctx);
      assert.equal(checkEventStore(f.repo, 'event-store-refspec', f.ctx).passed, checkGit(f.repo, 'git-publication-refspecs', f.ctx.loaderOptions).passed);
    }
    f.git('config', '--add', 'remote.origin.fetch', '+refs/*:refs/unsafe/*');
    assert.equal(checkEventStore(f.repo, 'event-store-refspec', f.ctx).passed, false);
  } finally { if (prior === undefined) delete process.env.FGOS_STATE_ROOT; else process.env.FGOS_STATE_ROOT = prior; }
});
test('shared machine ref warns only after reading another clone origin on the own mirror', async t => {
  const { syncUseCase } = await import('../../src/verbs/events/sync.mjs');
  const first = fixture(t, { remote: true });
  fixEventStoreRefspec(first.repo, first.ctx); append(first.store, [{}]); syncUseCase(first.ctx);
  const second = fixture(t, { remote: true });
  second.git('remote', 'set-url', 'origin', path.join(first.temp, 'remote'));
  fixEventStoreRefspec(second.repo, second.ctx); append(second.store, [{}]); syncUseCase(second.ctx);
  assert.match(checkEventStore(second.repo, 'event-store-machine-id', second.ctx).message, /^warning: event-store-machine-ref-shared/);
  assert.equal(checkEventStore(second.repo, 'event-store-sync', second.ctx).message.startsWith('warning:'), false);
});

test('refspecs allow ordinary pushes and protective negative fetches but refuse Event Store pushes', t => {
  const f = fixture(t, { remote: true }); fixEventStoreRefspec(f.repo, f.ctx);
  f.git('config', '--add', 'remote.origin.fetch', '^refs/fgos/local-events/*');
  for (const refspec of ['HEAD', ':', '+:', 'refs/heads/*:refs/heads/*', ':refs/fgos/events/old']) {
    f.git('config', 'remote.origin.push', refspec);
    assert.equal(checkEventStore(f.repo, 'event-store-refspec', f.ctx).passed, true, refspec);
  }
  for (const refspec of ['refs/*:refs/*', '+refs/fgos/*:refs/fgos/*', 'refs/fgos/events/machine']) {
    f.git('config', 'remote.origin.push', refspec);
    assert.equal(checkEventStore(f.repo, 'event-store-refspec', f.ctx).passed, false, refspec);
  }
});
test('live worktree branch keys are not orphaned; removal makes the same stream orphaned', t => {
  const f = fixture(t); f.git('commit', '--allow-empty', '-qm', 'root');
  const linked = path.join(f.temp, 'linked');
  f.git('worktree', 'add', '-qb', 'Feature/Live_One', linked);
  fs.mkdirSync(path.join(f.repo, '.git/fgos/events/branch:feature-live-one'));
  assert.equal(checkEventStore(f.repo, 'event-store-orphan-branches', f.ctx).message, 'no orphan branch streams');
  f.git('worktree', 'remove', linked);
  assert.match(checkEventStore(f.repo, 'event-store-orphan-branches', f.ctx).message, /^warning:.*branch:feature-live-one/);
});
test('one doctor invocation reuses its status snapshot; a new invocation observes new data', t => {
  const f = fixture(t);
  const context = eventStoreSetupContext(f.repo, f.ctx);
  assert.strictEqual(context.status(), context.status());
  const check = eventStoreDoctor(f.repo, f.ctx);
  assert.equal(check('event-store-integrity').passed, true);
  append(f.store, [{}]);
  fs.writeFileSync(path.join(f.repo, '.git/fgos/events/project/integrity.json'), JSON.stringify({ code: 'event-store-ref-moved' }));
  assert.equal(check('event-store-integrity').passed, true);
  assert.equal(eventStoreDoctor(f.repo, f.ctx)('event-store-integrity').passed, false);
});

test('a doctor run remembers a failed setup context instead of retrying it per row, and doctor reports an unreadable shared config', t => {
  const f = fixture(t);
  const config = path.join(f.repo, '.fgos/config.json');
  fs.mkdirSync(path.dirname(config), { recursive: true });
  fs.writeFileSync(config, '{ eventStore: half-written');
  const check = eventStoreDoctor(f.repo, f.ctx);
  const first = check('event-store-git-version');
  assert.equal(first.passed, false);
  assert.match(first.message, /event-store-config: cannot parse shared config/, 'doctor sees the parse failure, never the defaults');
  fs.writeFileSync(config, '{}');
  assert.deepEqual(check('event-store-open-root'), { passed: false, message: first.message }, 'every row of the run reports the one remembered failure');
  assert.equal(eventStoreDoctor(f.repo, f.ctx)('event-store-open-root').passed, true, 'a new run observes the repaired file');
});

test('the ten Event Store rows and three fixes are registered and every row of a run shares one doctor', t => {
  const rows = DOCTOR_CHECKS.filter(({ id }) => id.startsWith('event-store-'));
  assert.deepEqual(rows.map(({ id }) => id).sort(), ['git-version', 'open-root', 'machine-id', 'refspec', 'unsealed', 'integrity', 'sync', 'native-addon', 'legacy-layout', 'orphan-branches'].map(name => `event-store-${name}`).sort());
  assert.deepEqual(FIX_REGISTRATIONS.filter(({ id }) => id.startsWith('event-store-')).map(({ id }) => id).sort(), ['event-store-lock-dirs', 'event-store-machine-id', 'event-store-refspec']);
  const f = fixture(t);
  const run = createDoctorRun();
  const keys = [];
  const once = run.once;
  run.once = (key, compute) => { keys.push(key); return once(key, compute); };
  for (const row of rows) assert.equal(typeof row.check(f.repo, run).passed, 'boolean', row.id);
  assert.deepEqual([...new Set(keys)], [`event-store-doctor:${f.repo}`], 'one eventStoreDoctor per run');
  assert.equal(keys.length, rows.length);
});

test('sync warns for real unpublished project events', t => {
  const f = fixture(t, { remote: true });
  assert.equal(checkEventStore(f.repo, 'event-store-sync', f.ctx).message, 'no unpublished events');
  f.store.append('local', [{ eventType: 'private.local', schemaVersion: 1, payload: { secret: true }, ts: '2026-10-19T01:00:00.000Z' }], {}, 'fixture', []);
  assert.equal(checkEventStore(f.repo, 'event-store-sync', f.ctx).message, 'no unpublished events');
  append(f.store, [{}]);
  assert.match(checkEventStore(f.repo, 'event-store-sync', f.ctx).message, /^warning:/);
});

test('doctor warns about a tracked porting log outside consumer roots', t => {
  const f = fixture(t);
  const name = 'custom/intake/porting/events.jsonl';
  fs.mkdirSync(path.dirname(path.join(f.repo, name)), { recursive: true });
  fs.writeFileSync(path.join(f.repo, name), '{}\n');
  f.git('add', name); f.git('commit', '-qm', 'nonstandard legacy porting log');
  const result = checkEventStore(f.repo, 'event-store-legacy-layout', f.ctx);
  assert.equal(result.passed, true);
  assert.match(result.message, /warning:.*fgos events migrate/);
});
