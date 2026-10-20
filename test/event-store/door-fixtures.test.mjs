import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ensureGitAddon, root } from '../helpers/git-addon.mjs';

test('E3 census creates its own repositories and ignores caller repository paths', {timeout:60000},()=>{
  const built=ensureGitAddon();
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'fgos-door-fixture-'));
  try {
    const state=path.join(temp,'state');fs.mkdirSync(state,{mode:0o700});
    const foreign=path.join(temp,'foreign.git');
    execFileSync('git',['init','-q','--bare',foreign]);
    const before=fs.readdirSync(foreign).sort();
    const descriptor=path.join(temp,'descriptor.json');
    fs.writeFileSync(descriptor,JSON.stringify({manifest:JSON.parse(fs.readFileSync(built.manifest,'utf8')),releaseRoot:root}));
    execFileSync(process.execPath,['scripts/git/e3-bench.mjs','census','--descriptor',descriptor,'--state',state,'--repo',foreign,'--remote',foreign],{cwd:root,timeout:45000,stdio:'pipe'});
    assert.deepEqual(fs.readdirSync(foreign).sort(),before);
    assert.equal(execFileSync('git',['--git-dir',foreign,'for-each-ref'],{encoding:'utf8'}),'');
    const fixtures=fs.readdirSync(state).filter(name=>name.startsWith('e3-census-'));
    assert.equal(fixtures.length,1);
    const fixture=path.join(state,fixtures[0]);
    for(const name of ['local.git','remote.git']){
      const repo=path.join(fixture,name);
      assert.equal(execFileSync('git',['--git-dir',repo,'rev-parse','--is-bare-repository'],{encoding:'utf8'}).trim(),'true');
      assert.match(execFileSync('git',['--git-dir',repo,'for-each-ref','--format=%(refname)'],{encoding:'utf8'}),/refs\/fgos\/events\/e3-census/);
    }
  } finally {fs.rmSync(temp,{recursive:true,force:true});}
});
