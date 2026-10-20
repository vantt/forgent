import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

// Execute the real hook against a scratch index. No source checkout is staged.
for(const mode of ['added','renamed','copied','type-changed','fence'])test(`retired layout hook: ${mode}`,t=>{
  const repo=fs.mkdtempSync(path.join(os.tmpdir(),'es-hook-'));
  t.after(()=>fs.rmSync(repo,{recursive:true,force:true}));
  const git=(...args)=>execFileSync('git',['-C',repo,...args],{encoding:'utf8'}).trim();
  git('init','-q');git('config','user.name','Fixture');git('config','user.email','fixture@example.test');
  const blob=execFileSync('git',['-C',repo,'hash-object','-w','--stdin'],{input:'fixture',encoding:'utf8'}).trim();
  const target=mode==='fence'?'.fgos/events':'.fgos/events.jsonl';
  if(['renamed','copied'].includes(mode))git('update-index','--add','--cacheinfo',`100644,${blob},source`);
  if(mode==='type-changed')git('update-index','--add','--cacheinfo',`120000,${blob},${target}`);
  const tree=git('write-tree');
  const commit=execFileSync('git',['-C',repo,'commit-tree',tree],{input:'baseline',encoding:'utf8'}).trim();
  git('update-ref','HEAD',commit);
  if(mode==='renamed')git('update-index','--force-remove','source');
  git('update-index','--add','--cacheinfo',`100644,${blob},${target}`);
  const result=spawnSync(process.execPath,[path.resolve('.githooks/pre-commit')],{cwd:repo,encoding:'utf8'});
  if(mode==='fence')assert.doesNotMatch(result.stderr,/retired event paths/);
  else {assert.equal(result.status,1,result.stderr);assert.match(result.stderr,/retired event paths cannot be added/);}
});
