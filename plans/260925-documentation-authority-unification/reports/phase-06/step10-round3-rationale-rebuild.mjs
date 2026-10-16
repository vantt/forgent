import fs from 'node:fs';
import path from 'node:path';
import {execFileSync as exec} from 'node:child_process';
import crypto from 'node:crypto';
const inputCommit='5035fed52';
const root=process.cwd(),P='plans/260925-documentation-authority-unification/',R=P+'reports/phase-06/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const {extractMarkdownConservationUnits}=await import(root+'/scripts/generate-doc-inventory.mjs');
const {generateBindingRationale,checkBindingRationale,checkLegacyRationale,describeBindingLinks,bindingCorrections}=await import(root+'/scripts/doc-binding-repair.mjs');
const reg=read(R+'working-identity-registry.json'),known=new Map(['units','identityGaps','retiredUnits'].flatMap(k=>reg[k].map(u=>[u.claimId,u])));
const cache=new Map();
function units(p,commit=null){const key=JSON.stringify([p,commit]);if(cache.has(key))return cache.get(key);let text;
 try{text=commit?exec('git',['show',commit+':'+p],{encoding:'utf8',maxBuffer:50e6,stdio:['ignore','pipe','ignore']}):fs.readFileSync(p,'utf8');}catch{cache.set(key,[]);return [];}
 let us;if(!p.endsWith('.md'))us=[{anchor:'file-block',startLine:1,endLine:text.split('\n').length,text,textDigest:sha(text),ancestry:[]}];
 else {const ls=text.split('\n'),raw=extractMarkdownConservationUnits(text),stack=[];us=raw.map((u,i)=>{if(u.unitKind==='heading')while(stack.length&&stack.at(-1).level>=u.level)stack.pop();const ancestry=stack.map(x=>x.title);if(u.unitKind==='heading')stack.push(u);const next=raw.slice(i+1).find(v=>v.unitKind==='heading');return {...u,sectionText:ls.slice(u.startLine-1,next?next.startLine-1:ls.length).join('\n').trim(),text:ls.slice(u.startLine-1,u.endLine).join('\n').trim(),ancestry};});}
 us=us.map(u=>({...u,path:p,...(commit?{commit}:{})}));cache.set(key,us);return us;
}
const rows=[];
for(const dir of [P+'pilot/decisions',P+'ledger/decisions'])for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.json'))){const file=dir+'/'+name,j=read(file);for(const collection of ['claims','registryGaps'])for(const row of j[collection]||[])if(row.sourceUnitDigest)rows.push({file,collection,row,native:known.get(row.claimId)});}
const retired=read(P+'ledger/retired-unit-decisions.json');for(const [collection,rs] of Object.entries(retired))if(Array.isArray(rs))for(const row of rs)if(row?.claimId&&row?.rationale)rows.push({file:P+'ledger/retired-unit-decisions.json',collection,row,native:known.get(row.claimId)});
const requests=fs.readdirSync(R).filter(n=>/^review-request-step10-.*-345f15d95.json$/.test(n)).flatMap(n=>(read(R+n).entries||[]).map(e=>({...e,request:n})));
const witnesses=new Map();
for(const e of requests){if(e.sourceWitness?.commit){const id=e.claimId||e.relatedClaimId;if(!witnesses.has(id))witnesses.set(id,[]);witnesses.get(id).push(e.sourceWitness.commit);}}
const forced=new Set();
for(const name of fs.readdirSync(R).filter(n=>/^review-step10-.*-345f15d95.md$/.test(n))){const text=fs.readFileSync(R+name,'utf8');for(const line of text.split('\n')){const m=/^\| (claim_[0-9a-f]+) \| rework \|/.exec(line);if(m)forced.add(m[1]);}}
// Notes accepted by review also require the Lead's explicit rationale rebuild.
for(const prefix of ['a63132a3','66f7be3b','5f999566','e5cc66ff','94922910','239931ca','ae47f4eb','c1741ef0','d9bc09e7','4eeb2f40'])for(const {row} of rows)if(row.claimId.startsWith('claim_'+prefix))forced.add(row.claimId);
for(const e of requests.filter(e=>e.request.includes('historical-02')))forced.add(e.claimId);
// Whole same-defect family, not just previously sampled rows.
for(const {row} of rows)if(/current direct target changed by the disclosed|provisional current-source draft|scaffold ranges are corrected/i.test(row.rationale))forced.add(row.claimId);
const docEdits=read(R+'step10-round3-doc-edits.json').changes;
const sourceMissing=[],flags=[],selected=[];
const apply=process.argv.includes('--apply');
const priorChanges=fs.existsSync(R+'step10-round3-rationale-edits.json')?read(R+'step10-round3-rationale-edits.json').changes:[];
const generatedKeys=new Set(priorChanges.map(x=>JSON.stringify([x.file,x.collection,x.claimId,x.sourceUnitDigest])));
const resolved=[];let targetsChanged=0;
for(const rec of rows){const {row,native}=rec;const p=row.sourcePath||native?.sourcePath,sd=row.sourceUnitDigest;
 const find=(p,c)=>units(p,c).filter(u=>u.textDigest.startsWith(sd));
 let matches=p?find(p,null):[];let source=matches.find(u=>u.anchor===(row.sourceAnchor||native?.sourceAnchor))||matches[0];
 if(!source&&p){const pins=[row.sourceCommit,native?.sourceCommit,native?.lineage?.fromCommit,...(witnesses.get(row.claimId)||[]),...((row.rationale||'').match(/\b[0-9a-f]{9,40}\b/g)||[]),inputCommit,reg.commit,reg.carriedFromCommit,'ab4d6274a','19ca8de23','2300d6557','8b4be4fcf','120af6b3d',...(native?.retiredAtCommit?[native.retiredAtCommit+'^']:[])];for(const pin of [...new Set(pins.filter(Boolean))]){matches=find(p,pin);if(matches.length){source=matches.find(u=>u.anchor===(row.sourceAnchor||native?.sourceAnchor))||matches[0];break;}}}
 const target=row.targetOwner?units(row.targetOwner).find(u=>u.anchor===row.targetAnchor):null;
 rec.source=source;rec.target=target;resolved.push(rec);
 const issues=checkLegacyRationale(row.rationale,{source,target,targetIdentity:row.targetOwner?{path:row.targetOwner,anchor:row.targetAnchor}:null});
 if(!source)sourceMissing.push({file:rec.file,claimId:row.claimId,path:p,sourceUnitDigest:sd,hasCitations:/\(source line|byte.identical|full native unit digest is equal/i.test(row.rationale)});
 const targetChanged=target&&row.targetUnitDigest&&!target.textDigest.startsWith(row.targetUnitDigest);
 if(targetChanged)targetsChanged++;
 const touchesEdits=target&&docEdits.some(e=>e.path===target.path&&e.line>=target.startLine&&e.line<=target.endLine);
 if(issues.length)flags.push({file:rec.file,claimId:row.claimId,issues});
 if(generatedKeys.has(JSON.stringify([rec.file,rec.collection,row.claimId,row.sourceUnitDigest]))||issues.length||forced.has(row.claimId)||touchesEdits||(targetChanged&&!rec.file.endsWith('/retired-unit-decisions.json')))selected.push({...rec,source,target,issues,targetChanged});
}

// All input prose below comes from the resolved binding or an exact correction
// manifest fragment found in its payload. No previous rationale is rendered.
const oldFiles=new Map();
function oldRow(rec){if(!oldFiles.has(rec.file))oldFiles.set(rec.file,JSON.parse(exec('git',['show',inputCommit+':'+rec.file],{encoding:'utf8',maxBuffer:50e6})));return oldFiles.get(rec.file)[rec.collection]?.find(r=>r.claimId===rec.row.claimId&&r.sourceUnitDigest===rec.row.sourceUnitDigest);}
const approved=new Map();
const ancestors=exec('git',['rev-list','--topo-order',inputCommit],{encoding:'utf8',maxBuffer:20e6}).trim().split('\n');
for(const name of fs.readdirSync(R).filter(n=>/^review-.*\.md$/.test(n))){
 const text=fs.readFileSync(R+name,'utf8'),pin=/^Content commit:\s*([0-9a-f]{9,40})\b/m.exec(text)?.[1];
 if(!pin)continue;const rank=ancestors.findIndex(c=>c.startsWith(pin));if(rank<0)continue;
 for(const line of text.split('\n')){const cells=line.trim().split(/(?<!\\)\|/).slice(1,-1).map(s=>s.trim());
  if(cells.length===5&&cells[1]==='ok'&&/^claim_/.test(cells[0])&&/^[a-f0-9]{64}$/.test(cells[4])){
   const prior=approved.get(cells[0]);if(!prior||rank<prior.rank)approved.set(cells[0],{targetUnitDigest:cells[4],commit:pin,report:R+name,rank});
  }
 }
}
const corrections=[];
for(const [file,key,defaultPath,label] of [
 ['root-authorities-truth-corrections-turn21.json','corrections','docs/platform/work-state/spec.md','A35'],
 ['root-source-truth-fragments-turn22.json','corrections','docs/platform/work-state/spec.md','A35'],
 ['step8-truth-corrections.json','corrections',null,'A40'],
 ['step9-truth-corrections.json','edits',null,'A41/A42'],
 ['step10-correction-truth.json','entries','docs/reading-map.md','A42'],
]){
 const j=read(R+file);
 for(const [i,e] of j[key].entries())corrections.push({...e,path:e.path||defaultPath,id:e.finding||e.reason||`${label}/${file.replace('.json','')}-${i+1}`,manifest:file});
}
for(const e of docEdits)corrections.push({...e,id:e.label,manifest:'step10-round3-doc-edits.json',evidence:e.label.startsWith('L10-24')?'bin/fgos.mjs:4414-4417,4503':null});
function scope(u){return u?.level?u.sectionText:u?.text;}
function evidence(e){if(typeof e==='string')return e;if(Array.isArray(e))return e.map(x=>x.ref||`${x.path}:${x.startLine}-${x.endLine}`).join('; ');return null;}
function factsOf(rec){
 const {row,native}=rec;const source=rec.source||{path:row.sourcePath||native.sourcePath,anchor:row.sourceAnchor||native.sourceAnchor,textDigest:row.sourceUnitDigest,unavailable:true};let target=rec.target;
 if(!target&&row.targetOwner){
  const pins=[row.sourceCommit,native?.sourceCommit,native?.lineage?.fromCommit,row.reviewReportCommit,inputCommit,'ce575996f','ed782e245','120af6b3d'];
  for(const pin of pins.filter(Boolean)){target=units(row.targetOwner,pin).find(u=>u.anchor===row.targetAnchor&&u.textDigest.startsWith(row.targetUnitDigest));if(target)break;}
  if(!target)target={path:row.targetOwner,anchor:row.targetAnchor,textDigest:row.targetUnitDigest,unavailable:true};
 }
 const original=oldRow(rec),lastReviewed=approved.get(row.claimId)||(original?.reviewStatus==='reviewed'&&original.targetUnitDigest?{targetUnitDigest:original.targetUnitDigest,commit:original.reviewReportCommit||inputCommit}:null);
 const applicable=bindingCorrections(target,corrections).map(e=>({id:e.id+(e.composedWith.length?' (composed with '+e.composedWith.join(', ')+')':''),before:e.before,after:e.after,evidence:[e.manifest,evidence(e.evidence)].filter(Boolean).join('; ')}));
 // Exact historical/current pointer lines, not a remembered description of them.
 if(row.claimId.startsWith('claim_a63132a3'))for(const name of ['main-checkout-lock','pre-commit']){
  const before=source.text.split('\n').find(l=>l.includes(name)),after=target.text.split('\n').find(l=>l.includes(name));
  if(before!==after)applicable.push({id:'L10-25/'+name,before,after,evidence:'step10-systemic-a63132a3-witness.json; bound historical/current Pointers units'});
 }
 const sourceContext=source.ancestry?.join(' / ')||source.anchor,targetContext=target?.ancestry?.join(' / ')||target?.anchor;
 let reason=target?`Account for ${source.path}#${source.anchor} under ${target.path}#${target.anchor}; source context ${JSON.stringify(sourceContext)}, target context ${JSON.stringify(targetContext)}.`:`Keep ${source.path}#${source.anchor} in its existing source ownership outside platform documentation authority.`;
 if(target){
  if(source.textDigest===target.textDigest)reason+=' The complete bound unit is carried with an equal native digest.';
  else if(!source.unavailable&&scope(target)?.includes(source.text))reason+=' The source text occurs verbatim inside the bound target section; section-level unit digests differ.';
  else if(source.level||target.level)reason+=' The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.';
  else reason+=' The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.';
 }
 if(row.remainder)reason+=` Recorded residual: ${typeof row.remainder==='string'?row.remainder:JSON.stringify(row.remainder)}.`;
 const references=target?.path==='docs/platform/proposals/component-authority-boundary-map.md'?fs.readFileSync('docs/platform/component-boundary.md','utf8').split('\n').flatMap((text,i)=>text.includes('proposals/component-authority-boundary-map.md')?[{path:'docs/platform/component-boundary.md',line:i+1,text}]:[]):[];
 return {source,target,lastReviewed,disposition:row.disposition,reason,links:describeBindingLinks(source,target),corrections:applicable,references};
}
const changes=[...priorChanges],generatedFindings=[],files=new Map();
for(const rec of selected){
 const facts=factsOf(rec),after=generateBindingRationale(facts);
 if(!apply){generatedFindings.push(...checkBindingRationale(rec.row.rationale,facts).map(f=>({file:rec.file,claimId:rec.row.claimId,type:f.type})));continue;}
 if(after===rec.row.rationale)continue;
 if(!files.has(rec.file))files.set(rec.file,read(rec.file));
 const rows=files.get(rec.file)[rec.collection],row=rows.find(r=>r.claimId===rec.row.claimId&&r.sourceUnitDigest===rec.row.sourceUnitDigest),before=structuredClone(row);
 row.rationale=after;row.reviewStatus='pending';row.authoredBy='codex-session:unit-run-1792114313040-56132651@2026-10-16';
 for(const key of ['reviewedBy','reviewedAt','reviewReport','reviewReportCommit','reviewMode','reviewPackCommit','reviewPackId','seedScoreId','reviewNote'])delete row[key];
 // Same-line Lead-authorized doc edits change only the target digest/ancestry.
 // No positional rebinding, native sync or registry mutation is performed.
 const changedDoc=docEdits.some(e=>e.path===row.targetOwner);
 if(rec.targetChanged&&changedDoc){row.targetUnitDigest=rec.target.textDigest;row.targetAncestry=rec.target.ancestry;}
 const previous=changes.findIndex(c=>c.file===rec.file&&c.collection===rec.collection&&c.claimId===row.claimId&&c.sourceUnitDigest===row.sourceUnitDigest);
 const originalBefore=previous>=0?changes[previous].before:before;
 const originalIssues=previous>=0?changes[previous].issues:rec.issues;
 if(previous>=0)changes.splice(previous,1);
 changes.push({file:rec.file,collection:rec.collection,claimId:row.claimId,sourceUnitDigest:row.sourceUnitDigest,before:originalBefore,after:structuredClone(row),issues:originalIssues,facts});
}
if(apply){
 for(const [file,j] of files)fs.writeFileSync(file,JSON.stringify(j,null,2)+'\n');
 const report={inputCommit,authorSession:'codex-session:unit-run-1792114313040-56132651@2026-10-16',mechanism:'Binding-derived rebuild; no prior rationale appended; exact correction-manifest fragments matched to target payload.',rowsScanned:rows.length,shardsScanned:new Set(rows.map(r=>r.file)).size,flagsBefore:priorChanges.length?read(R+'step10-round3-rationale-edits.json').flagsBefore:flags,changes};
 fs.writeFileSync(R+'step10-round3-rationale-edits.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({scanned:rows.length,shards:report.shardsScanned,flagged:flags.length,regenerated:changes.length,reopenedReviewed:changes.filter(x=>x.before.reviewStatus==='reviewed').length,changedTargetBindings:changes.filter(x=>x.before.targetUnitDigest!==x.after.targetUnitDigest).length}));
}else{
 const report={inputCommit,rowsScanned:rows.length,shardsScanned:new Set(rows.map(r=>r.file)).size,generatedRowsChecked:selected.length,legacyFindings:flags,generatedFindings,sourceWitnessLimits:sourceMissing,scope:'Checks contextual bound source/target ranges and anchors, native/text equality claims; historical quotations marked Prior rationale are historical. Exact regeneration checks every row rebuilt this turn. Missing historical source text is disclosed, never invented.',ok:flags.length===0&&generatedFindings.length===0};
 fs.writeFileSync(R+'step10-round3-rationale-consistency.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({scanned:rows.length,shards:report.shardsScanned,generated:selected.length,legacyFindings:flags.length,generatedFindings:generatedFindings.length,sourceWitnessLimits:sourceMissing.length,ok:report.ok}));
 process.exitCode=report.ok?0:1;
}
