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
