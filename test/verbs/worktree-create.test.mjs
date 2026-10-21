import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createWorktreeUseCase } from '../../src/verbs/worktree/create.mjs';
import { COMMAND_REGISTRY } from '../../src/cli/command-registry.mjs';
import { fixture } from '../git/worktree-fixture.mjs';

test('public worktree create use case returns path and branch through the native port', {skip:process.platform==='win32'},()=>{
  const f=fixture('files',true);
  const ctx={cwd:f.repoPath,repoRoot:f.repoPath,stateRoot:f.temp,writer:'fixture'};
  try {
    const named=createWorktreeUseCase(ctx,{path:'../named',branch:'topic'},f.loader);
    assert.equal(named.path,path.join(f.temp,'named')); assert.equal(named.branch,'refs/heads/topic');
    assert.equal(fs.existsSync(path.join(named.path,'.fgos')),false);
    const detached=createWorktreeUseCase(ctx,{path:'../detached',detach:true,base:f.tip},f.loader);
    assert.equal(detached.branch,null); assert.equal(detached.tip,f.tip);
    assert.throws(()=>createWorktreeUseCase(ctx,{path:'../bad',branch:'x',detach:true},f.loader),/mutually exclusive/);
    assert.equal(createWorktreeUseCase(ctx,{path:'../default'},f.loader).branch,null);
    f.git('tag','-a','release','-m','annotated fixture');
    assert.equal(createWorktreeUseCase(ctx,{path:'../tagged',base:'release'},f.loader).tip,f.tip);
    const route=JSON.parse(fs.readFileSync(new URL('../../packages/host-runtime/contracts/command-routes.json',import.meta.url)));
    assert.equal(route.worktree.route_kind,'legacy-cli');
    assert.equal(COMMAND_REGISTRY.find(v=>v.name==='worktree').requiresExistingStore,false);
  } finally { f.cleanup(); }
});

test('CLI adapter creates the checkout and emits the public JSON envelope', {skip:process.platform==='win32'},async()=>{
  const { execFileSync }=await import('node:child_process');
  const { ensureHostBin, REPO_ROOT }=await import('../../scripts/lib/git-addon-stage.mjs');
  const f=fixture('files',true);
  try {
    // The payload manifest resolves its host inside the checkout; a host built under an
    // external CARGO_TARGET_DIR is materialized under .fgos/runtime like the dev host door does.
    const built=ensureHostBin({...process.env,FGOS_HOST_BIN:''},REPO_ROOT);
    fs.mkdirSync(path.join(REPO_ROOT,'.fgos','runtime'),{recursive:true});
    const hostDir=fs.mkdtempSync(path.join(REPO_ROOT,'.fgos','runtime','tmp-worktree-cli-'));
    const host=path.join(hostDir,'fgos'); fs.copyFileSync(built,host); fs.chmodSync(host,0o755);
    f.cleanup=(cleanup=>()=>{fs.rmSync(hostDir,{recursive:true,force:true});cleanup();})(f.cleanup);
    const manifest=structuredClone(f.loader.descriptor.manifest);
    manifest.entries.fgos=path.relative(REPO_ROOT,host);
    manifest.components.legacyNode={root:'.',entry:'bin/fgos.mjs'};
    const manifestPath=path.join(f.temp,'manifest.json');fs.writeFileSync(manifestPath,JSON.stringify(manifest));
    const env={...process.env,FGOS_HOST_BIN:host,FGOS_ACTIVE_MANIFEST_PATH:manifestPath,FGOS_STATE_ROOT:path.join(f.temp,'fgos')};
    for(const name of ['CLAUDE_CODE_SESSION_ID','CODEX_THREAD_ID','FGOS_SESSION_ID'])delete env[name];
    fs.mkdirSync(env.FGOS_STATE_ROOT,{mode:0o700});
    const output=JSON.parse(execFileSync(process.execPath,[path.join(REPO_ROOT,'bin/fgos.mjs'),'worktree','create',path.join(f.temp,'cli-worker'),'--branch','cli-topic','--base','trunk','--json'],{cwd:f.repoPath,env,encoding:'utf8'}));
    assert.equal(output.contract,'fgos.v1'); assert.equal(output.data.branch,'refs/heads/cli-topic');
    assert.equal(output.data.path,path.join(f.temp,'cli-worker')); assert.equal(fs.existsSync(path.join(output.data.path,'.fgos')),false);
  } finally {f.cleanup();}
});

test('worktree create runs the project setup commands after the port returns, with the main checkout in FGOS_REPO_ROOT', {skip:process.platform==='win32'},()=>{
  const f=fixture('files',true);
  const ctx={cwd:f.repoPath,repoRoot:f.repoPath,stateRoot:f.temp,writer:'fixture'};
  const configPath=path.join(f.repoPath,'.fgos','config.json');
  try {
    fs.writeFileSync(configPath,JSON.stringify({worktreeSetup:{commands:['pwd > setup-marker && printf %s "$FGOS_REPO_ROOT" >> setup-marker']}}));
    const made=createWorktreeUseCase(ctx,{path:'../provisioned',detach:true,base:f.tip},f.loader);
    const marker=fs.readFileSync(path.join(made.path,'setup-marker'),'utf8');
    assert.equal(marker.split('\n')[0],fs.realpathSync(made.path)); assert.ok(marker.endsWith(f.repoPath));
    fs.writeFileSync(configPath,JSON.stringify({worktreeSetup:{commands:['exit 3']}}));
    assert.throws(()=>createWorktreeUseCase(ctx,{path:'../broken',detach:true,base:f.tip},f.loader),/worktree setup command failed/);
  } finally { f.cleanup(); }
});
