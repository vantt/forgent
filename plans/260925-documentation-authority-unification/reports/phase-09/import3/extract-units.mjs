// Records-only adapter: import2's unchanged dual frozen extractors, scratch plumbing only.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const P='plans/260925-documentation-authority-unification';
fs.mkdirSync('/tmp/fgos-work', {recursive:true});
const scratch=fs.mkdtempSync('/tmp/fgos-work/import3-extract-');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
try {
const input=JSON.parse(fs.readFileSync(0,'utf8')),libs=[],proofs=[];
for(const [i,[name,key,lib]] of [
 ['step10-round5-reproduction.json','scripts','step10-sync287-lib.mjs'],
 ['step10-sync4d-reproduction.json','readOnlyScripts','lib.mjs']
].entries()){
 const manifest=P+'/reports/phase-06/'+name;
 const source=JSON.parse(fs.readFileSync(manifest,'utf8'))[key][lib];
 const dir=scratch+'/'+i;fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/'+lib,source);
 const old=process.argv;process.argv=[...old,'--output-dir',dir];
 libs.push(await import(dir+'/'+lib));process.argv=old;proofs.push({manifest,lib,sha256:sha(source)});
}
const catalog={};
for(const p of input.paths||[]){
 const a=libs[0].unitsOf(p),b=libs[1].unitsOf(p);assert.deepEqual(a,b,p);
 catalog[p]={fileSha256:sha(fs.readFileSync(p)),units:a};
}
for(const [i,v] of (input.virtual||[]).entries()){
 const f=scratch+'/virtual-'+i+path.extname(v.path);fs.writeFileSync(f,v.content);
 const a=libs[0].unitsOf(f),b=libs[1].unitsOf(f);assert.deepEqual(a,b,v.path);
 catalog[v.path]={fileSha256:sha(v.content),units:a};
}
for(const entry of Object.values(catalog))for(const u of entry.units)
 if(u.unitKind==='heading')u.ancestry.push(u.title);
console.log(JSON.stringify({extractors:proofs,catalog}));
} finally {
 fs.rmSync(scratch, {recursive:true,force:true});
}
