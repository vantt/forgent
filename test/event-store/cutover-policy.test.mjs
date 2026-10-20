import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fixture, append } from './phase07-fixture.mjs';
import { promoteLandedStreams } from '../../src/runner/merge.mjs';
import { initializeWorkRepository } from '../helpers/work-store-release.mjs';
import { initStore, addPorting, movePorting, listPorting, rebuild } from '../../src/state/porting-store.mjs';
import { prepareWorkStore } from '../../src/state/work-event-store.mjs';
import { fixEventStoreRefspec } from '../../src/setup/event-store-fixes.mjs';
import { CONFIG_DEFAULT_REGISTRATIONS, DOCTOR_CHECKS, FIX_REGISTRATIONS, registerCheck } from '../../src/setup/checks.mjs';
import os from 'node:os';

test('porting uses its registered project stream, acknowledges before cache and preserves failed CAS', t => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'porting-cutover-'));
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));
  const dir = initializeWorkRepository(repo);
  initStore(dir);
  const result = addPorting(dir, { id: 'one' });
  assert.equal(result.event.stream, 'project:porting');
  assert.equal(result.event.seq, 1);
  const cache = path.join(dir, 'porting/state.json');
  const before = fs.readFileSync(cache);
  assert.throws(() => movePorting(dir, { id: 'one', to: 'planned', expectedStatus: 'planned' }));
  assert.deepEqual(fs.readFileSync(cache), before);
  movePorting(dir, { id: 'one', to: 'planned', expectedStatus: 'candidate' });
  assert.equal(listPorting(dir).porting.one.status, 'planned');
  assert.equal(rebuild(dir).porting.one.status, 'planned');
  assert.equal(prepareWorkStore(dir, dir).store.read({ streams: ['project'] }, []).sequence.length, 0);
  assert.equal(fs.existsSync(path.join(dir, 'porting/events.jsonl')), false);
});

test('Work Land promotes a real registered branch stream through the native promotion operation', t => {
  const { store } = fixture(t);
  append(store, [{ payload: { id: 'one' } }]);
  store.seal('project', []);
  store.append('branch:item', [{ eventType: 'private.branch', schemaVersion: 1, payload: { value: 1 }, ts: new Date().toISOString() }], {}, 'fixture', []);
  assert.equal(promoteLandedStreams(store, 'item', 'fixture', []).length, 1);
  const read = store.read({ streams: ['project'] }, []);
  assert.ok(read.sequence.some(event => event.type === 'store.promote'));
  assert.ok(read.sequence.some(event => event.type === 'private.branch'));
  assert.deepEqual(promoteLandedStreams(store, 'absent', 'fixture', []), []);
});

test('cutover registers one full config shape, ten checks, three fixes and removes retired checks', () => {
  const defaults = CONFIG_DEFAULT_REGISTRATIONS.filter(row => row.key === 'eventStore');
  assert.equal(defaults.length, 1);
  assert.equal(defaults[0].shape.seal.intervalSec, 300);
  assert.equal(DOCTOR_CHECKS.filter(row => row.id.startsWith('event-store-')).length, 10);
  assert.equal(FIX_REGISTRATIONS.filter(row => row.id.startsWith('event-store-')).length, 3);
  for (const id of ['events-jsonl-not-truncated', 'events-compaction-verified']) assert.equal(DOCTOR_CHECKS.some(row => row.id === id), false);
});

test('CLI maintenance seals due history, suppresses worker push, then publishes from an owner session', async t => {
  const f = fixture(t, { remote: true });
  // Use the production prepared registry and real bare remote.
  const dir = path.join(f.repo, '.fgos');
  fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify({ eventStore: { seal: { intervalSec: 1 }, sync: { intervalSec: 1 } } }));
  // The shared release fixture supplies the real addon; machine id is repo-local.
  fixEventStoreRefspec(f.repo);
  const { store } = prepareWorkStore(dir, dir);
  store.append('project', [{ eventType: 'work.add', schemaVersion: 1, payload: { id: 'old' }, ts: '2020-01-01T00:00:00.000Z' }], {}, 'fixture', []);
  const { execFileSync } = await import('node:child_process');
  const cli = new URL('../../bin/fgos.mjs', import.meta.url).pathname;
  const run = depth => JSON.parse(execFileSync(process.execPath, [cli, 'list', '--dir', f.repo], { env: { ...process.env, FGOS_DISPATCH_DEPTH: String(depth) }, encoding: 'utf8' }));
  assert.equal(run(1).contract, 'fgos.v1');
  assert.equal(store.status([]).lastPush, null);
  assert.equal(run(0).contract, 'fgos.v1');
  assert.equal(store.status([]).lastPush.error, null);
});

test('the real Work Land caller seals project before committing and promotes a registered branch afterward', async t => {
  const { execFileSync } = await import('node:child_process');
  const { root, ensureGitAddon } = await import('../helpers/git-addon.mjs');
  const { hostBin } = await import('../helpers/work-store-release.mjs');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'work-land-cutover-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const payload = path.join(temp, 'payload');
  fs.cpSync(path.join(root, 'src'), path.join(payload, 'src'), { recursive: true });
  fs.cpSync(path.join(root, 'packages'), path.join(payload, 'packages'), { recursive: true, filter: source => !/\/(target|node_modules|\.git)(\/|$)/.test(source) });
  fs.cpSync(path.join(root, 'domains'), path.join(payload, 'domains'), { recursive: true });
  fs.copyFileSync(path.join(root, 'package.json'), path.join(payload, 'package.json'));
  const contracts = path.join(payload, 'packages/event-store/contracts');
  fs.writeFileSync(path.join(contracts, 'land-fixture.v1.json'), JSON.stringify({ v: 1, types: [{ type: 'landfixture.note', domain: 'landfixture', schemaVersion: 1, scope: 'branch', sealOnWrite: false }] }));
  const manifestPath = path.join(contracts, 'consumers.v1.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath));
  manifest.consumers.push({ id: 'landfixture', contractFile: 'packages/event-store/contracts/land-fixture.v1.json', cachePath: '.fgos/cache/land-fixture.json', rebuildModule: 'src/state/store.mjs' });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  fs.mkdirSync(path.join(temp, 'bin'));
  const host = path.join(temp, 'bin/fgos'); fs.copyFileSync(hostBin, host); fs.chmodSync(host, 0o755);
  const built = ensureGitAddon();
  const component = JSON.parse(fs.readFileSync(built.manifest)).components.nativeAddon;
  fs.copyFileSync(built.addon, path.join(temp, 'fgos.node'));
  fs.writeFileSync(path.join(temp, 'manifest.json'), JSON.stringify({ entries: { fgos: 'bin/fgos' }, components: { legacyNode: { root: 'payload', entry: 'bin/fgos.mjs' }, nativeAddon: { ...component, path: 'fgos.node' } } }));
  const repo = path.join(temp, 'repo'); initializeWorkRepository(repo);
  const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).trim();
  git('checkout', '-qb', 'main');
  fs.writeFileSync(path.join(repo, 'base'), 'base'); git('add', 'base'); git('commit', '-qm', 'base');
  git('checkout', '-qb', 'fgw/item'); fs.writeFileSync(path.join(repo, 'change'), 'land'); git('add', 'change'); git('commit', '-qm', 'change'); git('checkout', '-q', 'main');
  fs.writeFileSync(path.join(repo, '.fgos/config.json'), JSON.stringify({ invariantChecks: { commands: [] } }));
  const script = `
    const {prepareWorkStore}=await import(${JSON.stringify(path.join(payload, 'src/state/work-event-store.mjs'))});
    const {mergeRunnerItem,withMergeSlot}=await import(${JSON.stringify(path.join(payload, 'src/runner/merge.mjs'))});
    const {LockScope}=await import(${JSON.stringify(path.join(payload, 'src/holder-lock/index.mjs'))});
    const dir=${JSON.stringify(path.join(repo, '.fgos'))}, repo=${JSON.stringify(repo)};
    const {store}=prepareWorkStore(dir,dir);
    store.append('project',[{eventType:'work.add',schemaVersion:1,payload:{id:'seed'},ts:new Date().toISOString()}],{},'fixture',[]);
    store.append('branch:item',[{eventType:'landfixture.note',schemaVersion:1,payload:{text:'land'},ts:new Date().toISOString()}],{},'fixture',[]);
    const scope=new LockScope('land-fixture');
    const result=await withMergeSlot(scope,repo,'main',()=>mergeRunnerItem(repo,{id:'item',verify:'true',risk:'light'},{scope}));
    if(result.outcome!=='merged') throw new Error(JSON.stringify(result));
    const events=store.read({streams:['project']},[]).sequence;
    if(!events.some(e=>e.type==='store.promote') || !events.some(e=>e.type==='landfixture.note')) throw new Error('promotion missing');
    console.log('land and promotion passed');
  `;
  const output = execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: repo, env: { ...process.env, FGOS_HOST_BIN: host }, encoding: 'utf8' });
  assert.match(output, /land and promotion passed/);
  assert.equal(fs.readFileSync(path.join(repo, 'change'), 'utf8'), 'land');
});

test('doctor reports a failed store read as one failed row and keeps the remaining checks available', () => {
  registerCheck({ id: 'cutover-unavailable-fixture', description: 'fixture', check: () => { throw new Error('event-store-incomplete-history'); } });
  assert.deepEqual(DOCTOR_CHECKS.at(-1).check('/unavailable'), { passed: false, message: 'event-store-incomplete-history' });
});
