// Records-only adapter over the two unchanged, embedded Step 0 extractors.
// Input: {paths: [...], virtual: [{path, content}]}; output goes to stdout only.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root=process.cwd(), plan='plans/260925-documentation-authority-unification';
const scratch='/tmp/fgos-work/w3-ledger-fix-brief/extractors';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const input=JSON.parse(fs.readFileSync(0,'utf8'));
const recipes=[['step10-round5-reproduction.json','scripts','step10-sync287-lib.mjs'],['step10-sync4d-reproduction.json','readOnlyScripts','lib.mjs']];
const libs=[],proofs=[];
for(let i=0;i<recipes.length;i++){
 const [name,key,lib]=recipes[i], manifest=`${plan}/reports/phase-06/${name}`;
 const source=JSON.parse(fs.readFileSync(manifest,'utf8'))[key][lib];
 const dir=`${scratch}/${i}`;fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(`${dir}/${lib}`,source);
 const old=process.argv;process.argv=[...old,'--output-dir',dir];
 libs.push(await import(`${dir}/${lib}`));process.argv=old;
 proofs.push({manifest,lib,sha256:sha(source)});
}
const catalog={};
for(const p of input.paths??[]){
 const a=libs[0].unitsOf(p),b=libs[1].unitsOf(p);assert.deepEqual(a,b,`extractors disagree: ${p}`);
 catalog[p]={fileSha256:sha(fs.readFileSync(p)),units:a};
}
for(const [i,v] of (input.virtual??[]).entries()){
 const f=`${scratch}/virtual-${i}${path.extname(v.path)}`;fs.writeFileSync(f,v.content);
 const a=libs[0].unitsOf(f),b=libs[1].unitsOf(f);assert.deepEqual(a,b,`virtual extractors disagree: ${v.path}`);
 catalog[v.path]={fileSha256:sha(v.content),units:a};
}
const bindingDigests=(input.bindingRows??[]).map(row=>{
 const payload=Object.fromEntries(['targetOwner','targetAnchor','targetUnitDigest','targetAncestry'].map(k=>[k,row[k]??null]));
 if(row.targetAnchor==null&&(row.successorGroup||row.successorGroupMemberDigests)){payload.successorGroupMemberDigests=row.successorGroup?row.successorGroup.members.map(m=>m.unitDigest).sort():row.successorGroupMemberDigests;}
 const keys=Object.keys(payload).sort();
 return sha(JSON.stringify(Object.fromEntries(keys.map(k=>[k,payload[k]])))+'\n');
});
console.log(JSON.stringify({root,extractors:proofs,catalog,bindingDigests}));
