#!/usr/bin/env node
// Explicit host mode: capability failures are failures, never skipped proofs.
import '../../test/helpers/process-tmp-root.mjs';
import { initializeWorkRepository } from '../../test/helpers/work-store-release.mjs';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { listWork, settleClaim, readRawEvents } from '../../src/state/store.mjs';
if(!process.argv.includes('--host'))throw Error('explicit --host required (ptrace and host PID visibility)');
const storeUrl=new URL('../../src/state/store.mjs',import.meta.url).href;
const runtimeUrl=new URL('../../src/state/runtime-coordination.mjs',import.meta.url).href;
const root=fs.mkdtempSync(path.join(os.tmpdir(),'settle-host-'));
process.env.FGOS_SESSION_ID='settle-host-proof';
const source=`
import fs from 'node:fs';
import path from 'node:path';
import {initStore,addWork,settleClaim} from ${JSON.stringify(storeUrl)};
import {acquireClaim} from ${JSON.stringify(runtimeUrl)};
const dir=process.argv[1];initStore(dir);
addWork(dir,{id:'one',title:'one',kind:'task',status:'todo',deps:[],refs:[],risk:'light',verify:'true'});
const claim=acquireClaim(dir,{id:'one',actor:'session',preClaimStatus:'todo',claimRole:'session'});
fs.copyFileSync(path.join(dir,'runtime/claims/one.json'),path.join(dir,'before-claim'));
fs.copyFileSync(path.join(dir,'cache/state.json'),path.join(dir,'before-cache'));
try {settleClaim(dir,{id:'one',claimId:claim.claimId,finalStatus:'blocked',reason:'proof'});throw Error('append unexpectedly acknowledged');}
catch(e){if(!/ENOSPC|No space left/i.test(e.message+' '+e.code))throw e;}
`;
try{
 for(const mode of ['enospc','kill']){
  const repo=path.join(root,mode);const dir=initializeWorkRepository(repo);
  const evidence=path.join(root,`${mode}.json`);
  const run=spawnSync('python3',[new URL('./settle-fault.py',import.meta.url).pathname,mode,evidence,process.execPath,'--input-type=module','-e',source,dir],{env:process.env,encoding:'utf8',timeout:60000});
  assert.equal(run.status,0,`${run.error??''}\n${run.stderr}`);
  const record=JSON.parse(fs.readFileSync(evidence));assert.equal(record.containsSettleAttempt,true);
  assert.deepEqual(fs.readFileSync(path.join(dir,'runtime/claims/one.json')),fs.readFileSync(path.join(dir,'before-claim')));
  assert.deepEqual(fs.readFileSync(path.join(dir,'cache/state.json')),fs.readFileSync(path.join(dir,'before-cache')));
  assert.equal(readRawEvents(dir).some(e=>e.type==='work.attempt'),false);
  assert.equal(listWork(dir).work.one.status,'doing');
  const claim=JSON.parse(fs.readFileSync(path.join(dir,'before-claim')));
  // Real next trigger must reclaim the dead kernel holder and append normally.
  settleClaim(dir,{id:'one',claimId:claim.claimId,finalStatus:'blocked',reason:'recovered'});
  assert.equal(fs.existsSync(path.join(dir,'runtime/claims/one.json')),false);
  assert.equal(listWork(dir).work.one.status,'blocked');
  assert.equal(readRawEvents(dir).filter(e=>e.type==='work.attempt').length,1);
  console.log(JSON.stringify({proof:'V-AUTH-01',mode,verdict:'PASS',injection:record}));
 }
}finally{fs.rmSync(root,{recursive:true,force:true});}
