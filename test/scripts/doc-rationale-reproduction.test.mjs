import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const script=path.resolve('plans/260925-documentation-authority-unification/reports/phase-06/step10-sync287-reproduce.py');
for(const args of [['consistency'],['consistency','--output',path.resolve('plans/unsafe.json')],['consistency','--output','relative.json']])test('reproduction rejects missing or repository output '+JSON.stringify(args),()=>{
 const r=spawnSync('python3',[script,...args],{encoding:'utf8',env:{...process.env,CLAUDE_CODE_SESSION_ID:undefined}});
 assert.notEqual(r.status,0);assert.match(r.stderr,/explicit|external|absolute|scratch|--output/i);
});
import fs from 'node:fs';
const auditor=path.resolve('plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-rebuild.mjs');
for(const kind of ['symlink','dangling-symlink','hardlink'])test('direct audit rejects a '+kind+' output before reading the corpus',t=>{
 const dir=fs.mkdtempSync('/tmp/fgos-work/rationale-output-');t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const cwd=path.join(dir,'cwd');fs.mkdirSync(cwd);let output;
 if(kind==='symlink'){fs.symlinkSync(process.cwd(),path.join(dir,'linked'),'dir');output=path.join(dir,'linked','package.json');}
 else if(kind==='dangling-symlink'){output=path.join(dir,'dangling.json');fs.symlinkSync(path.join(process.cwd(),'nonexistent-reproduction-output.json'),output);}
 else{const original=path.join(dir,'original');fs.writeFileSync(original,'unchanged');output=path.join(dir,'linked.json');fs.linkSync(original,output);}
 const r=spawnSync('node',[auditor,'--check','--output',output],{cwd,encoding:'utf8',env:{...process.env,CLAUDE_CODE_SESSION_ID:undefined}});
 assert.notEqual(r.status,0);assert.match(r.stderr,/external scratch|unsafe output/i);
 if(kind==='hardlink')assert.equal(fs.readFileSync(path.join(dir,'original'),'utf8'),'unchanged');
});

for(const [manifest,key] of [['step10-round5-reproduction.json','scripts'],['step10-sync4d-reproduction.json','readOnlyScripts']])test('documented ownership commands work from a fresh reviewer output directory: '+manifest,t=>{
 const dir=fs.mkdtempSync('/tmp/fgos-work/reviewer-fresh-');t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const base='plans/260925-documentation-authority-unification/reports/phase-06/';
 const scripts=JSON.parse(fs.readFileSync(base+manifest,'utf8'))[key];
 for(const [name,source] of Object.entries(scripts))fs.writeFileSync(path.join(dir,name),source);
 for(const name of ['ownership.mjs','audit-ownership.mjs','checks.mjs']){
  const r=spawnSync('node',[path.join(dir,name),'--output-dir',dir],{encoding:'utf8',env:{...process.env,CLAUDE_CODE_SESSION_ID:undefined},timeout:120000,maxBuffer:5e6});
  assert.equal(r.status,0,name+'\n'+r.stdout+'\n'+r.stderr);
 }
 const check=JSON.parse(fs.readFileSync(path.join(dir,manifest.replace('-reproduction.json','-checks.json')),'utf8'));
 assert.equal(check.A.unaccountedPairs.length,0);
 assert.ok(check.A.accountedPairs.some(r=>r.commit.startsWith('bd217ecf1')&&r.authority==='L10-35a'));
 assert.equal(check.A.accountedPairs.filter(r=>r.commit.startsWith('bd217ecf1')).length,2);
});
