import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fixture, loaderOptions } from './phase07-fixture.mjs';
import '../helpers/work-store-release.mjs';

for (const session of [undefined, 'claimant-session']) test(`public Work mutations reconcile same-writer drift (${session ?? 'plain CLI'}) with the real store`, t => {
  const f = fixture(t);
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
  const env = { ...process.env, FGOS_STATE_ROOT: f.stateRoot };
  for (const key of ['FGOS_SESSION_ID', 'CODEX_THREAD_ID', 'CLAUDE_CODE_SESSION_ID']) delete env[key];
  if (session) env.FGOS_SESSION_ID = session;
  const output = execFileSync(process.execPath, ['--input-type=module', '-e', source, f.repo], {
    env, encoding: 'utf8', timeout: 30000,
  });
  assert.ok(JSON.parse(output).seq >= 5);
});
