import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fixture, loaderOptions } from './phase07-fixture.mjs';
import { resolveActiveHostBin } from '../../src/util/host-bin-path.mjs';
import { root } from '../helpers/git-addon.mjs';

test('public Work mutations, same-writer drift and settle use the real facade and one batch', t => {
  const f = fixture(t);
  // A disposable release descriptor binds this checkout and the actual addon
  // to a real host. No alternate store implementation or test-only branch.
  const host = resolveActiveHostBin({ fgosDir: path.join(root, '.fgos') }).bin;
  assert.ok(host, 'a real host is required');
  const release = path.join(f.temp, 'release');
  fs.mkdirSync(path.join(release, 'bin'), { recursive: true });
  const bin = path.join(release, 'bin/fgos');
  fs.copyFileSync(host, bin); fs.chmodSync(bin, 0o755);
  fs.symlinkSync(root, path.join(release, 'payload'));
  const component = loaderOptions.descriptor.manifest.components.nativeAddon;
  fs.copyFileSync(path.join(root, component.path), path.join(release, 'fgos.node'));
  fs.writeFileSync(path.join(release, 'manifest.json'), JSON.stringify({
    entries: { fgos: 'bin/fgos' },
    components: { legacyNode: { root: 'payload', entry: 'bin/fgos.mjs' }, nativeAddon: { ...component, path: 'fgos.node' } },
  }));
  const storeUrl = new URL('../../src/state/store.mjs', import.meta.url).href;
  const claimsUrl = new URL('../../src/state/runtime-coordination.mjs', import.meta.url).href;
  const source = `
    import assert from 'node:assert/strict';
    import fs from 'node:fs';
    import * as work from ${JSON.stringify(storeUrl)};
    import { acquireClaim, getItemDurableRevision } from ${JSON.stringify(claimsUrl)};
    const dir = process.argv[1] + '/.fgos';
    assert.deepEqual(work.initStore(dir), {work:{}, decisions:[]});
    const added = work.addWork(dir, {id:'one',title:'One',kind:'task',status:'todo',deps:[],risk:'light',refs:[],verify:'true'});
    assert.equal(added.event.seq, 1);
    assert.ok(added.event.origin && added.event.h.length === 64);
    assert.throws(() => work.addWork(dir, {id:'one'}), /already exists/);
    const claim = acquireClaim(dir, {id:'one',actor:'session',preClaimStatus:'todo',preClaimRevision:getItemDurableRevision(added.view,'one')});
    work.editWork(dir, {id:'one',patch:{title:'Edited by claimant'}});
    const settled = work.settleClaim(dir, {id:'one',claimId:claim.claimId,finalStatus:'todo',phase:'execute',result:'failed',patch:{description:'settled patch'}});
    assert.equal(settled.event.type, 'work.attempt');
    assert.ok(Number.isSafeInteger(settled.event.seq));
    assert.equal(settled.view.work.one.title, 'Edited by claimant');
    assert.equal(settled.view.work.one.description, 'settled patch');
    assert.equal(fs.existsSync(dir + '/runtime/claims/one.json'), false);
    const topic = work.registerTopicStore(dir, {topicId:'topic-one',purposeSlug:'test-topic',purposeTitle:'Test topic',entities:[]});
    assert.ok(topic.event.origin && topic.event.seq > settled.event.seq);
    assert.equal(work.readRawEvents(dir).filter(e => e.type === 'work.attempt').length, 1);
    assert.equal(work.rebuild(dir).work.one.description, 'settled patch');
    const saved=JSON.parse(fs.readFileSync(dir+'/cache/state.json'));
    assert.equal('snapshot' in saved, false);
    assert.equal(Object.values(saved.cursor.cover)[0], topic.event.seq);
    console.log(JSON.stringify({seq:topic.event.seq,origin:topic.event.origin}));
  `;
  const output = execFileSync(process.execPath, ['--input-type=module', '-e', source, f.repo], {
    env: { ...process.env, FGOS_HOST_BIN: bin, FGOS_STATE_ROOT: f.stateRoot }, encoding: 'utf8', timeout: 30000,
  });
  assert.ok(JSON.parse(output).seq >= 5);
});
