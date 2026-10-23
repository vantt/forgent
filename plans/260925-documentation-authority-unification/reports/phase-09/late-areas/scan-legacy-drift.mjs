// Records-only scan. Raw git calls below read history/blobs only; no repository mutation.
// Default rescans HEAD and writes legacy-drift.json. --check replays its recorded source HEAD
// against the current hashed candidates; it is reproducible after an artifact-only runner commit.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {extractMarkdownConservationUnits,extractMixedFileConservationUnit} from '../../../../../scripts/generate-doc-inventory.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../../..');
const P='plans/260925-documentation-authority-unification';
const R=P+'/reports/phase-09/late-areas';
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024,stdio:['ignore','pipe','pipe']});
const head=process.argv.includes('--check')?json(R+'/legacy-drift.json').head:git('rev-parse','HEAD').trim();
const finalPin=json(P+'/reports/phase-08/step-07-final-determinism.json').sourceCommit;
const inventoryPin=json(P+'/reports/phase-02-identity-registry.json').commit;
const roots=['docs/specs','docs/architect','docs/decisions'];
function changed(pin){return [...new Set(git('log','--format=','--name-only','--diff-filter=AM',pin+'..'+head,'--',...roots).split('\n').filter(Boolean))].sort();}
const finalFiles=changed(finalPin), inventoryFiles=changed(inventoryPin);
const files=[...new Set([...finalFiles,...inventoryFiles])].sort();
const sourceTargets=new Map(), claimTargets=new Map();
const sourceBindings=[];
function add(map,key,values){if(!key)return;const s=map.get(key)||new Set();for(const v of values)if(v?.startsWith('docs/platform/'))s.add(v.split('#')[0]);map.set(key,s);}
const shards=[];
for(const name of fs.readdirSync(path.join(root,P,'ledger/decisions')).filter(n=>n.endsWith('.json')).sort()){
 const file=P+'/ledger/decisions/'+name;const data=json(file);shards.push({path:file,sha256:sha(read(file))});
 for(const row of data.files||[])add(sourceTargets,row.path,[...(row.targets||[]),row.targetOwner]);
 for(const list of Object.values(data).filter(Array.isArray))for(const row of list){
  if(!row||typeof row!=='object'||!row.targetOwner)continue;
  add(claimTargets,row.claimId,[row.targetOwner]);
  add(sourceTargets,row.sourcePath||row.sourceFile,[row.targetOwner]);
  if(row.sourcePath&&row.sourceUnitDigest&&row.targetUnitDigest)sourceBindings.push({...row,shard:file});
 }
}
// Reuse immutable native identities to join old claim-only ledgers to their source paths.
const identities=json(P+'/reports/phase-06/working-identity-registry.json');
for(const u of identities.units||[])add(sourceTargets,u.sourcePath,[...(claimTargets.get(u.claimId)||[])]);
const explicit={
 'docs/specs/seat-binding.md':['docs/platform/seat-binding/spec.md'],
 'docs/specs/workflow.md':['docs/platform/workflow/spec.md'],
 'docs/specs/reading-map.md':['docs/reading-map.md','docs/platform/README.md'],
 'docs/specs/platform-foundations.md':['docs/platform/platform-foundations.md'],
 'docs/decisions/index.md':['docs/decisions/index.md'],
};
for(const [s,targets] of Object.entries(explicit)){
 const set=sourceTargets.get(s)||new Set();for(const t of targets)if(fs.existsSync(path.join(root,t)))set.add(t);sourceTargets.set(s,set);
}
function extract(file,text){return file.toLowerCase().endsWith('.md')?extractMarkdownConservationUnits(text):extractMixedFileConservationUnit(file,text);}
const cache=new Map();
function targetUnits(file){if(!cache.has(file)){
 try{cache.set(file,extract(file,read(file)));}catch{cache.set(file,[]);}
}return cache.get(file);}
const records=[];
for(const file of files){
 let current;try{current=git('show',head+':'+file);}catch{records.push({sourcePath:file,status:'absent-at-head',postFinalPin:finalFiles.includes(file),postInventoryPin:inventoryFiles.includes(file),candidateSuccessors:[...(sourceTargets.get(file)||[])],candidateCarriesCurrentChange:null,missingCarriage:[],note:'Path was added/modified in the window but is absent at HEAD; no source units asserted.'});continue;}
 // Source comparisons are pinned to HEAD. Candidate hashes are current working bytes, explicit below.
 let before='';try{before=git('show',finalPin+':'+file);}catch{}
 let inventoryBefore='';try{inventoryBefore=git('show',inventoryPin+':'+file);}catch{}
 const beforeDigests=new Set(extract(file,before).map(u=>u.textDigest));
 const inventoryDigests=new Set(extract(file,inventoryBefore).map(u=>u.textDigest));
 const candidates=[...(sourceTargets.get(file)||[])].sort();
 const sourceLines=current.split('\n');
 const units=extract(file,current).map(u=>{
  const exact=[];
  for(const t of candidates)for(const c of targetUnits(t))if(c.textDigest===u.textDigest)exact.push({path:t,anchor:c.anchor,unitDigest:c.textDigest});
  // An explicit fresh carriage binding is distinct from native digest equality.
  const bound=sourceBindings.filter(b=>b.sourcePath===file&&b.sourceUnitDigest===u.textDigest&&candidates.includes(b.targetOwner)&&targetUnits(b.targetOwner).some(t=>t.anchor===b.targetAnchor&&t.textDigest===b.targetUnitDigest)).map(b=>({path:b.targetOwner,anchor:b.targetAnchor,unitDigest:b.targetUnitDigest,bindingSha256:b.bindingSha256,shard:b.shard}));
  const changedSinceFinal=!beforeDigests.has(u.textDigest),changedSinceInventory=!inventoryDigests.has(u.textDigest);
  const status=exact.length?'exact-unit-digest':bound.length?'explicit-adapted-binding':'not-proven-carried';
  return {sourceAnchor:u.anchor,unitKind:u.unitKind,sourceUnitDigest:u.textDigest,location:{startLine:u.startLine,endLine:u.endLine},changedSinceFinalPin:changedSinceFinal,changedSinceInventoryPin:changedSinceInventory,status,exactMatches:exact,adaptedBindings:bound,...(status==='not-proven-carried'?{missingCarriage:sourceLines.slice(u.startLine-1,u.endLine).join('\n').trim()}: {})};
 });
 const missing=units.filter(u=>u.status==='not-proven-carried');
 const changeUnits=units.filter(u=>u.changedSinceInventoryPin);
 const finalChangeUnits=units.filter(u=>u.changedSinceFinalPin);
 const present=new Set(units.map(u=>u.sourceUnitDigest));
 // Deletions/replacements also need review: stale target clauses cannot be inferred absent from current-source matches.
 const removed=extract(file,inventoryBefore).filter(u=>!present.has(u.textDigest)).map(u=>({sourceAnchor:u.anchor,unitDigest:u.textDigest,candidateExactOccurrences:candidates.flatMap(t=>targetUnits(t).filter(c=>c.textDigest===u.textDigest).map(c=>({path:t,anchor:c.anchor}))),disposition:'review-source-deletion-or-replacement; not automatically a stale claim'}));
 records.push({sourcePath:file,status:inventoryBefore?'modified':'added',postFinalPin:finalFiles.includes(file),postInventoryPin:inventoryFiles.includes(file),sourceSha256:sha(current),sourceAtFinalPinSha256:before?sha(before):null,sourceAtInventoryPinSha256:inventoryBefore?sha(inventoryBefore):null,candidateSuccessors:candidates.map(p=>({path:p,sha256:sha(read(p)),samePath:p===file})),candidateCarriesCurrentChange:changeUnits.every(u=>u.status!=='not-proven-carried'),candidateCarriesPostFinalChange:finalChangeUnits.every(u=>u.status!=='not-proven-carried'),allCurrentUnitsCarried:missing.length===0,counts:{currentUnits:units.length,changedSinceInventory:changeUnits.length,changedSinceFinal:finalChangeUnits.length,missingCurrent:missing.length,missingChangedSinceInventory:changeUnits.filter(u=>u.status==='not-proven-carried').length,missingChangedSinceFinal:finalChangeUnits.filter(u=>u.status==='not-proven-carried').length},units,missingCarriage:missing.map(u=>({sourceAnchor:u.sourceAnchor,sourceUnitDigest:u.sourceUnitDigest,changedSinceFinalPin:u.changedSinceFinalPin,changedSinceInventoryPin:u.changedSinceInventoryPin,content:u.missingCarriage})),removedOrReplacedInventoryUnits:removed,owner:file==='docs/specs/distribution.md'||file==='docs/specs/runner.md'?'D1b (packaging/runner re-sync)':'Lead / owning area; report only, not repaired by D6'});
}
const result={version:1,authority:'L13-4 section 4; w2-d6-brief task 3',head,finalSourcePin:finalPin,finalSourcePinEvidence:'reports/phase-08/step-07-final-determinism.json sourceCommit; L12-124',inventoryPin,inventoryPinEvidence:'reports/phase-02-identity-registry.json commit',pinQualification:'The brief calls the L12-124 final source pin the inventory pin. Both windows are enumerated: final-pin window is the requested fresh G9 delta; original Phase 2 inventory window also catches late-added areas (Seat Binding and Workflow). No pin is silently substituted.',roots,enumeration:'git log --format= --name-only --diff-filter=AM <pin>..HEAD -- docs/specs docs/architect docs/decisions; union includes edits reverted before HEAD. Source units use git show HEAD:path; candidates use explicitly hashed working-tree bytes.',candidateResolution:'Ledger file targets plus native identity claim joins and explicit late-area routes. Exact native unit digests are primary; fresh explicit source/target bindings are separately labelled, never called digest equality. Whole-source carriage and post-pin changed-unit carriage are separate. Not-proven-carried is a conservative gap, not semantic proof of loss. Heading digests include direct section payload and following-block digest.',limitations:['No implementation-truth or independent-review acceptance asserted.','Candidate file mapping is bounded by existing ledgers; missing mappings are reported, not guessed.','Header/link/status adaptations in older candidates can be false negatives without explicit fresh source bindings.','docs/decisions/index.md is a generated retained projection: same-path equality is reported explicitly, not claimed as a new platform authority.','Original-unit deletions/replacements list remaining exact occurrences for owner triage; adaptation can still conceal stale text.'],counts:{postFinalPinFiles:finalFiles.length,postInventoryPinFiles:inventoryFiles.length,files:records.length,filesWithUnprovenChange:records.filter(r=>r.candidateCarriesCurrentChange===false).length,missingChangedUnits:records.reduce((n,r)=>n+(r.counts?.missingChangedSinceInventory||0),0)},postFinalPinPaths:finalFiles,postInventoryPinPaths:inventoryFiles,ledgerInputs:shards,records};
const output=JSON.stringify(result,null,2)+'\n', destination=path.join(root,R,'legacy-drift.json');
if(process.argv.includes('--check')){if(read(R+'/legacy-drift.json')!==output)throw Error('legacy-drift.json differs from current replay');}
else fs.writeFileSync(destination,output);
console.log(JSON.stringify(result.counts));
