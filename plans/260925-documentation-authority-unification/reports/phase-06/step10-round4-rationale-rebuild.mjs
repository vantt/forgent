import fs from 'node:fs';
import path from 'node:path';
import {execFileSync as exec} from 'node:child_process';
import crypto from 'node:crypto';
const inputCommit='9b0526380', priorApprovalCommit='62751458b';
const outputArg=process.argv.indexOf('--output');
if(outputArg<0||!process.argv[outputArg+1])throw Error('Explicit --output external scratch JSON path required');
const output=path.resolve(process.argv[outputArg+1]);
if(output.startsWith(process.cwd()+'/')||!output.startsWith('/tmp/fgos-work/'))throw Error('Output must be under /tmp/fgos-work, outside repository');
let ancestor=path.dirname(output);
while(!fs.existsSync(ancestor))ancestor=path.dirname(ancestor);
const realOutput=path.resolve(fs.realpathSync(ancestor),path.relative(ancestor,output));
if(realOutput.startsWith(process.cwd()+'/')||!realOutput.startsWith('/tmp/fgos-work/'))throw Error('Unsafe output: external scratch path required');
const outputStat=fs.lstatSync(output,{throwIfNoEntry:false});
if(outputStat&&(outputStat.isSymbolicLink()||outputStat.nlink!==1))throw Error('Unsafe output: external scratch file must not be a symlink or hardlink');
fs.mkdirSync(path.dirname(output),{recursive:true});

const root=process.cwd(),P='plans/260925-documentation-authority-unification/',R=P+'reports/phase-06/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const {extractMarkdownConservationUnits}=await import(root+'/scripts/generate-doc-inventory.mjs');
const {generateBindingRationale,checkBindingRationale,checkLegacyRationale,describeBindingLinks,bindingCorrections,frozenRationale,resolveSourceOccurrence,auditSourceOccurrences,describeSectionChange,checkSectionExplanation,sectionAccountLabels,classifySectionAccounting}=await import(root+'/scripts/doc-binding-repair.mjs');
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
const requests=fs.readdirSync(R).filter(n=>/^review-request-step10-.*-(345f15d95|287a22d33).json$/.test(n)).flatMap(n=>(read(R+n).entries||[]).map(e=>({...e,request:n})));
const witnesses=new Map();
for(const e of requests){if(e.sourceWitness?.commit){const id=e.claimId||e.relatedClaimId;if(!witnesses.has(id))witnesses.set(id,[]);witnesses.get(id).push(e.sourceWitness.commit);}}
const forced=new Set();
for(const {row} of rows)if(['53ebf4b5','53d2f574','2ae0cd4f','0f63a4c3','0145c136','deb1e406'].some(p=>row.claimId.startsWith('claim_'+p)))forced.add(row.claimId);
for(const name of fs.readdirSync(R).filter(n=>/^review-step10-.*-345f15d95.md$/.test(n))){const text=fs.readFileSync(R+name,'utf8');for(const line of text.split('\n')){const m=/^\| (claim_[0-9a-f]+) \| rework \|/.exec(line);if(m)forced.add(m[1]);}}
// Notes accepted by review also require the Lead's explicit rationale rebuild.
for(const prefix of ['a63132a3','66f7be3b','5f999566','e5cc66ff','94922910','239931ca','ae47f4eb','c1741ef0','d9bc09e7','4eeb2f40'])for(const {row} of rows)if(row.claimId.startsWith('claim_'+prefix))forced.add(row.claimId);
for(const e of requests.filter(e=>e.request.includes('historical-02')))forced.add(e.claimId);
// Whole same-defect family, not just previously sampled rows.
for(const {row} of rows)if(/current direct target changed by the disclosed|provisional current-source draft|scaffold ranges are corrected/i.test(row.rationale))forced.add(row.claimId);
const docEdits=read(R+'step10-round3-doc-edits.json').changes.map(e=>({...e,before:e.label==='L10-24/citation-refuseHelp'?'bin/fgos.mjs:4373,4461':e.label==='L10-24/citation-scaffold'?'bin/fgos.mjs:4640-4643; bin/fgos.mjs:4373-4380':e.before})).concat(read(R+'step10-round4-doc-edits.json').changes);
const frozen=read(R+'step10-frozen-rationales.json').rows;
const requestIds=new Set(requests.map(e=>e.claimId||e.relatedClaimId));
const sourceMissing=[],flags=[],selected=[],sectionAudits=[];
const apply=process.argv.includes('--apply');
const priorChanges=fs.existsSync(R+'step10-round3-rationale-edits.json')?read(R+'step10-round3-rationale-edits.json').changes:[];
const generatedKeys=new Set(priorChanges.map(x=>JSON.stringify([x.file,x.collection,x.claimId,x.sourceUnitDigest])));
const resolved=[];let targetsChanged=0;
for(const rec of rows){const {row,native}=rec;const p=row.sourcePath||native?.sourcePath,sd=row.sourceUnitDigest;
 const find=(p,c)=>units(p,c).filter(u=>u.textDigest.startsWith(sd));
 let matches=p?find(p,null):[];let source=matches.length===1?matches[0]:null;
 const sr={...row,sourceAnchor:row.sourceAnchor||native?.sourceAnchor};
 if(matches.length>1)source=matches.find(u=>u.anchor===sr.sourceAnchor);
 if(!source&&p){const pins=[row.sourceCommit,native?.sourceCommit,native?.lineage?.fromCommit,...(witnesses.get(row.claimId)||[]),...((row.rationale||'').match(/\b[0-9a-f]{9,40}\b/g)||[]),inputCommit,reg.commit,reg.carriedFromCommit,'ab4d6274a','19ca8de23','2300d6557','8b4be4fcf','120af6b3d',...(native?.retiredAtCommit?[native.retiredAtCommit+'^']:[])];for(const pin of [...new Set(pins.filter(Boolean))]){matches=find(p,pin);if(matches.length){source=matches.find(u=>u.anchor===sr.sourceAnchor)||(matches.length===1?matches[0]:null);if(source)break;}}}
 if(p==='docs/specs/runner.md' && sd.startsWith('95a357e2')) {
   const current=units(p),registered=sr.sourceAnchor;
   const pins=[read(R+'step10-round4-footer-witness.json').result[0].pin,...exec('git',['log','--format=%H','--',p],{encoding:'utf8'}).trim().split('\n')];
   let witness;
   for(const pin of pins){const us=units(p,pin);if(us.some(u=>u.anchor===registered&&u.textDigest.startsWith(sd))){witness={pin,us};break;}}
   if(!witness)throw Error('No own-anchor footer witness '+row.claimId);
   source=row.successorGroup?witness.us.find(u=>u.anchor===registered&&u.textDigest.startsWith(sd)):resolveSourceOccurrence(sr,current,witness.us);
   const matching=current.filter(u=>u.textDigest.startsWith(sd));
   source={...source,occurrence:matching.findIndex(u=>u.anchor===source.anchor)+1,registeredAnchor:registered,anchorShift:+source.anchor.split('-').at(-1)-(+registered.split('-').at(-1)),occurrenceWitness:witness.pin};
 }
 const target=row.targetOwner?units(row.targetOwner).find(u=>u.anchor===row.targetAnchor):null;
 rec.source=source;rec.target=target;resolved.push(rec);
 const issues=frozenRationale(row,frozen)!==null?[]:checkLegacyRationale(row.rationale,{source,target,targetIdentity:row.targetOwner?{path:row.targetOwner,anchor:row.targetAnchor}:null});
 if(!source)sourceMissing.push({file:rec.file,claimId:row.claimId,path:p,sourceUnitDigest:sd,hasCitations:/\(source line|byte.identical|full native unit digest is equal/i.test(row.rationale)});
 const targetChanged=target&&row.targetUnitDigest&&!target.textDigest.startsWith(row.targetUnitDigest);
 if(targetChanged)targetsChanged++;
 const touchesEdits=target&&docEdits.some(e=>e.path===target.path&&e.line>=target.startLine&&e.line<=target.endLine);
 if(issues.length)flags.push({file:rec.file,claimId:row.claimId,issues});
 if((row.rationale.includes('Section accounting ('))||generatedKeys.has(JSON.stringify([rec.file,rec.collection,row.claimId,row.sourceUnitDigest]))||issues.length||forced.has(row.claimId)||touchesEdits||(targetChanged&&!rec.file.endsWith('/retired-unit-decisions.json')))selected.push({...rec,source,target,issues,targetChanged});
}

const occurrenceGroups=new Map();
for(const rec of resolved)if(rec.source?.occurrence&&!rec.row.successorGroup){const key=rec.file+'#'+rec.collection; if(!occurrenceGroups.has(key))occurrenceGroups.set(key,[]);occurrenceGroups.get(key).push({claimId:rec.row.claimId,source:rec.source});}
for(const group of occurrenceGroups.values())auditSourceOccurrences(group);
// Check every repeated-source family across every shard, not just the runner
// footer regression. References with the same registered anchor are historical
// aliases; distinct registered occurrences must remain physically distinct.
const sourceOccurrenceFamilies=new Map(),sourceOccurrenceAudits=[];
for(const rec of resolved){
 if(!rec.source||rec.row.successorGroup)continue;
 const key=JSON.stringify([rec.file,rec.collection,rec.source.path,rec.source.commit||null,rec.row.sourceUnitDigest]);
 if(!sourceOccurrenceFamilies.has(key))sourceOccurrenceFamilies.set(key,[]);
 sourceOccurrenceFamilies.get(key).push(rec);
}
for(const [family,members] of sourceOccurrenceFamilies){
 const own=new Map(members.map(rec=>[rec.row.sourceAnchor||rec.native?.sourceAnchor,rec]));
 if(own.size<2)continue;
 const records=[...own.values()].map(rec=>({claimId:rec.row.claimId,source:rec.source}));
 auditSourceOccurrences(records);
 sourceOccurrenceAudits.push({family:JSON.parse(family),occurrences:records.map(r=>({claimId:r.claimId,anchor:r.source.anchor,startLine:r.source.startLine,endLine:r.source.endLine}))});
}
// All input prose below comes from the resolved binding or an exact correction
// manifest fragment found in its payload. No previous rationale is rendered.
const oldFiles=new Map();
function oldRow(rec){if(!oldFiles.has(rec.file)){try{oldFiles.set(rec.file,JSON.parse(exec('git',['show',priorApprovalCommit+':'+rec.file],{encoding:'utf8',maxBuffer:50e6,stdio:['ignore','pipe','ignore']})));}catch{oldFiles.set(rec.file,{});}}return oldFiles.get(rec.file)[rec.collection]?.find(r=>r.claimId===rec.row.claimId&&r.sourceUnitDigest===rec.row.sourceUnitDigest);}
const approved=new Map();
const ancestors=exec('git',['rev-list','--topo-order',priorApprovalCommit],{encoding:'utf8',maxBuffer:20e6}).trim().split('\n');
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
for(const e of docEdits)corrections.push({...e,id:e.label,manifest:e.label.startsWith('L10-31')?'step10-round4-doc-edits.json':'step10-round3-doc-edits.json',evidence:e.label.startsWith('L10-24')?'bin/fgos.mjs:4414-4417,4503':null});
function scope(u){return u?.level?u.sectionText:u?.text;}
const manifestPins=new Map();
function evidence(e,manifest){
 if(!manifestPins.has(manifest)){
 const meta=read(R+manifest);
 const creation=exec('git',['log','--reverse','--format=%H','--',R+manifest],{encoding:'utf8'}).trim().split('\n')[0];
 manifestPins.set(manifest,meta.inputCommit||meta.beforeCommit||meta.inputHEAD||creation||inputCommit);
 }
 const pin=manifestPins.get(manifest);
 const annotate=ref=>ref.replace(/([\w./-]+\.(?:mjs|rs|md|yaml):\d+(?:[-,]\d+)*)/g,`$1 (evidence commit ${pin})`);
 if(typeof e==='string')return annotate(e);
 if(Array.isArray(e))return e.map(x=>annotate(x.ref||`${x.path}:${x.startLine}-${x.endLine}`)+(x.blob?' (pinned blob '+x.blob+')':'')).join('; ');
 return null;
}
const sourceByTarget=new Map();
for(const r of resolved)if(r.source&&r.target){if(!sourceByTarget.has(r.target.path))sourceByTarget.set(r.target.path,[]);sourceByTarget.get(r.target.path).push(r.source);}
const contributionIndexes=new Map();
function contributions(p){
 if(!contributionIndexes.has(p)){
 const index=new Map();
 for(const u of sourceByTarget.get(p)||[])for(const line of scope(u).split('\n')){
   const key=line.replace(/\[([^\]]+)\]\(([^\s)]+)\)/g,'<link>');
   if(!index.has(key))index.set(key,u);
 }
 contributionIndexes.set(p,index);
 }
 return contributionIndexes.get(p);
}
const establishedFiles=new Map();
function establishedRow(rec){
 if(!establishedFiles.has(rec.file))establishedFiles.set(rec.file,JSON.parse(exec('git',['show',inputCommit+':'+rec.file],{encoding:'utf8',maxBuffer:50e6})));
 return establishedFiles.get(rec.file)[rec.collection]?.find(r=>r.claimId===rec.row.claimId&&r.sourceUnitDigest===rec.row.sourceUnitDigest);
}
function sectionExplanationOf(rec,source,target,applicable){
 if(!source?.level||!target||source.unavailable||target.unavailable)return null;
 const d=describeSectionChange(source,target,applicable);
 const priorAccount=establishedRow(rec)?.rationale||'';
 const registeredIds=[...new Set(fs.readFileSync(R+'owner-answers.md','utf8').match(/\b(?:A\d+|L\d+-\d+[a-z]?)\b/g)||[])];
 const labels=sectionAccountLabels(priorAccount,registeredIds);
 const removedWitnesses=[],addedWitnesses=[];
 const normalize=t=>t.replace(/^(#{1,6}) .*$/m,'<heading>').replace(/\[([^\]]+)\]\(([^\s)]+)\)/g,'<link>');
 const hasLine=(text,line)=>normalize(text).split('\n').includes(normalize(line));
 // Whole-line physical witnesses from other target sections and named histories.
 const paths=new Set([target.path]);
 for(const m of (rec.row.remainder||'').matchAll?.(/(docs\/platform\/[^\s;,]+\.md)#/g)||[])paths.add(m[1]);
 const history=target.path.includes('/agent-coordination/')?target.path.replace('/agent-coordination/','/agent-coordination/history/retired-engine/files/'):null;
 if(history&&fs.existsSync(history))paths.add(history);
 if(target.path.startsWith('docs/platform/runner/'))paths.add('docs/platform/runner/spec.md');
 for(const p of paths)for(const u of units(p)){
  if(u.path===target.path&&u.anchor===target.anchor)continue;
  if(d.unexplainedRemoved.some(l=>hasLine(scope(u),l)))removedWitnesses.push({path:u.path,anchor:u.anchor,commit:u.commit||null,text:scope(u),textDigest:u.textDigest});
 }
 // A literal snapshot may distribute source lines across native boundaries.
 // The authenticated whole FILE is a distinct witness, never the bound section.
 if(target.path.includes('/history/')){
  const text=fs.readFileSync(target.path,'utf8');
  if(d.unexplainedRemoved.some(l=>hasLine(text,l)))removedWitnesses.push({path:target.path,anchor:'file-block',text,textDigest:sha(text)});
 }
 for(const line of d.unexplainedAdded){const u=contributions(target.path).get(line.replace(/\[([^\]]+)\]\(([^\s)]+)\)/g,'<link>'));
  if(u)addedWitnesses.push({path:u.path,anchor:u.anchor,commit:u.commit||null,text:scope(u),textDigest:u.textDigest});
 }
 const explainedRemoved=checkSectionExplanation({...d,unexplainedAdded:[]},{removedWitnesses});
 const contributionFindings=checkSectionExplanation({...d,unexplainedRemoved:[]},{addedWitnesses});
 // Additive candidate declarations are additions, not conserved source lines.
 // Count/print their exact text; never use the target itself as a witness.
 const declared=/Added in candidate|Document type:|Design status: Candidate/.test(scope(target));
 const kind=d.equal?'equal-section':d.unexplainedRemoved.length?'split-or-corrected-section':d.unexplainedAdded.length?'additive-candidate-section':'heading-and-links';
 let description=d.unexplainedRemoved.length?'Removed direct-section lines have distinct live carrier witnesses '+[...new Set(removedWitnesses.map(w=>w.path+'#'+w.anchor))].join(', ')+'. ':'';
 if(d.unexplainedAdded.length)description+=contributionFindings.length&&declared?'Added lines are explicit candidate declarations or labelled corrections in the bound target; these are additions, not source-carriage evidence. ':'Added lines are authenticated sibling-source contributions. ';
 const classified=classifySectionAccounting(d,{labels,account:inputCommit+':'+rec.file,kind,description});
 const findings=[...explainedRemoved,...(!declared?contributionFindings:[])];
 return {...classified,removedWitnesses,addedWitnesses,...(findings.length?{conservationFindings:findings}:{})};
}
function factsOf(rec){
 const {row,native}=rec;const source=rec.source||{path:row.sourcePath||native.sourcePath,anchor:row.sourceAnchor||native.sourceAnchor,textDigest:row.sourceUnitDigest,unavailable:true};let target=rec.target;
 if(rec.file.endsWith('/retired-unit-decisions.json')&&target&&row.targetUnitDigest&&!target.textDigest.startsWith(row.targetUnitDigest))target=null;
 if(!target&&row.targetOwner){
  const pins=[row.sourceCommit,native?.sourceCommit,native?.lineage?.fromCommit,row.reviewReportCommit,inputCommit,'ce575996f','ed782e245','120af6b3d'];
  for(const pin of pins.filter(Boolean)){target=units(row.targetOwner,pin).find(u=>u.anchor===row.targetAnchor&&u.textDigest.startsWith(row.targetUnitDigest));if(target)break;}
  if(!target)for(const pin of exec('git',['log','--format=%H','--',row.targetOwner],{encoding:'utf8'}).trim().split('\n').filter(Boolean)){target=units(row.targetOwner,pin).find(u=>u.anchor===row.targetAnchor&&u.textDigest.startsWith(row.targetUnitDigest));if(target)break;}
  if(!target)target={path:row.targetOwner,anchor:row.targetAnchor,textDigest:row.targetUnitDigest,unavailable:true};
 }
 const original=oldRow(rec),lastReviewed=approved.get(row.claimId)||(original?.reviewStatus==='reviewed'&&original.targetUnitDigest?{targetUnitDigest:original.targetUnitDigest,commit:original.reviewReportCommit||inputCommit}:null);
 const applicable=bindingCorrections(target,[...corrections,...corrections.filter(e=>e.path!==target?.path&&scope(source)?.includes(e.before)&&scope(target)?.includes(e.after)).map(e=>({...e,originalCarrier:e.path,path:target.path}))]).filter(e=>scope(source)?.includes(e.before)||e.label?.startsWith('L10-31')||(e.label?.startsWith('L10-24')&&units(e.path,'19ca8de23').some(u=>scope(u)?.includes(e.before)))).map(e=>({id:e.id+(e.composedWith.length?' (composed with '+e.composedWith.join(', ')+')':''),before:e.before,after:e.after,...(!scope(source)?.includes(e.before)?{intermediate:true,witness:{commit:e.label?.startsWith('L10-24')?'19ca8de23':'9b0526380',text:units(e.path,e.label?.startsWith('L10-24')?'19ca8de23':'9b0526380').map(u=>scope(u)).join('\n')}}:{}),evidence:[e.manifest,evidence(e.evidence,e.manifest)].filter(Boolean).join('; ')}));
 // Exact historical/current pointer lines, not a remembered description of them.
 if(row.claimId.startsWith('claim_a63132a3'))for(const name of ['main-checkout-lock','pre-commit']){
  const before=source.text.split('\n').find(l=>l.includes(name)),after=target.text.split('\n').find(l=>l.includes(name));
  if(before!==after)applicable.push({id:'L10-25/'+name,before,after,evidence:'step10-systemic-a63132a3-witness.json; bound historical/current Pointers units'});
 }
 const sourceContext=source.ancestry?.join(' / ')||source.anchor,targetContext=target?.ancestry?.join(' / ')||target?.anchor;
 let reason=target?`Account for ${source.path}#${source.anchor} under ${target.path}#${target.anchor}; source context ${JSON.stringify(sourceContext)}, target context ${JSON.stringify(targetContext)}.`:`Keep ${source.path}#${source.anchor} in its existing source ownership outside platform documentation authority.`;
 if(target){
  if(source.textDigest===target.textDigest)reason+=' The complete bound unit is carried with an equal native digest.';
  else if(!source.unavailable&&scope(target)?.includes(scope(source)))reason+=' The complete source direct section occurs verbatim inside the bound target section; native unit digests differ.';
  else if(source.level||target.level)reason+=' The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.';
  else reason+=' The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.';
 }
 if(source.occurrence)reason+=` SOURCE occurrence ${source.occurrence} of 8; registered anchor ${source.registeredAnchor} shifts +${source.anchorShift} to ${source.anchor}, with identical text and preserved occurrence order authenticated at ${source.occurrenceWitness} (L10-30).`;
 if(['0145c136','deb1e406'].some(p=>row.claimId.startsWith('claim_'+p)))reason+=' L10-32/A34: current renamed section supersedes the prior target at historical witness ce575996f; upstream 09fe3ab32 and f4ed59997 replaced that section. No unchanged-current-target assertion or historical approval is carried.';
 if(row.remainder)reason+=` Recorded residual: ${typeof row.remainder==='string'?row.remainder:JSON.stringify(row.remainder)}.`;
 const references=target?.path==='docs/platform/proposals/component-authority-boundary-map.md'?fs.readFileSync('docs/platform/component-boundary.md','utf8').split('\n').flatMap((text,i)=>text.includes('proposals/component-authority-boundary-map.md')?[{path:'docs/platform/component-boundary.md',line:i+1,text}]:[]):[];
 const sectionExplanation=sectionExplanationOf(rec,source,target,applicable);
 return {source,target,lastReviewed,disposition:row.disposition,reason,links:describeBindingLinks(source,target),corrections:applicable,references,sectionExplanation};
}
const historicalTargetWitnesses=[],historicalTargetFindings=[];
for(const rec of resolved.filter(r=>r.file.endsWith('/retired-unit-decisions.json')&&r.row.targetOwner&&(!r.target||r.row.targetUnitDigest&&!r.target.textDigest.startsWith(r.row.targetUnitDigest)))){
 const facts=factsOf(rec),t=facts.target;
 const record={file:rec.file,collection:rec.collection,claimId:rec.row.claimId,sourceUnitDigest:rec.row.sourceUnitDigest,targetOwner:rec.row.targetOwner,targetAnchor:rec.row.targetAnchor,boundTargetDigest:rec.row.targetUnitDigest,historicalCommit:t?.commit||null,historicalTextDigest:t?.textDigest||null,currentDigest:rec.target?.textDigest||null,unavailable:!!t?.unavailable};
 historicalTargetWitnesses.push(record);
 if(t?.unavailable||!t?.commit||!t.textDigest.startsWith(rec.row.targetUnitDigest))historicalTargetFindings.push(record);
}
const allHeadingComparisons=[],allHeadingFindings=[];
for(const rec of resolved.filter(r=>r.source?.level&&r.row.targetOwner)){
 // Existing authored accounts are preserved; do not invent a new classification
 // for a row whose prose is outside the regenerated family. Record raw facts,
 // while the separate independent audit checks every actual prose assertion.
 if(!rec.row.rationale.includes('Section accounting (')&&rec.target){
  const d=describeSectionChange(rec.source,rec.target,[]);
  allHeadingComparisons.push({file:rec.file,claimId:rec.row.claimId,sourceUnitDigest:rec.row.sourceUnitDigest,sourceAnchor:rec.source.anchor,targetAnchor:rec.target.anchor,equal:d.equal,removedLines:d.unexplainedRemoved.length,addedLines:d.unexplainedAdded.length,existingAccountPreserved:true});
  continue;
 }
 try{const facts=factsOf(rec);if(rec.row.rationale.includes('Section accounting (')&&facts.sectionExplanation?.conservationFindings?.length)allHeadingFindings.push({file:rec.file,claimId:rec.row.claimId,sourceUnitDigest:rec.row.sourceUnitDigest,findings:facts.sectionExplanation.conservationFindings});allHeadingComparisons.push({file:rec.file,claimId:rec.row.claimId,sourceUnitDigest:rec.row.sourceUnitDigest,sourceAnchor:facts.source.anchor,targetAnchor:facts.target?.anchor,historicalTargetCommit:facts.target?.commit||null,sectionExplanation:facts.sectionExplanation?{kind:facts.sectionExplanation.kind,description:facts.sectionExplanation.description.slice(0,600),descriptionSHA256:sha(facts.sectionExplanation.description),removedWitnesses:facts.sectionExplanation.removedWitnesses.map(({text,...w})=>({...w,bytes:text.length})),addedWitnesses:facts.sectionExplanation.addedWitnesses.map(({text,...w})=>({...w,bytes:text.length}))}:null});}
 catch(e){allHeadingFindings.push({file:rec.file,collection:rec.collection,claimId:rec.row.claimId,sourceUnitDigest:rec.row.sourceUnitDigest,error:e.message});}
}
if(apply&&(allHeadingFindings.length||historicalTargetFindings.length)){fs.writeFileSync(output,JSON.stringify({allHeadingFindings,historicalTargetFindings},null,2)+'\n');throw Error('Whole-section conservation findings must be resolved before apply: '+JSON.stringify(allHeadingFindings)+JSON.stringify(historicalTargetFindings));}
const changes=[],generatedFindings=[],files=new Map();
const regenerationRows=selected.filter(rec=>rec.row.rationale.includes('Section accounting (')||['claim_08f9b4c1','claim_61244b0a'].some(p=>rec.row.claimId.startsWith(p)));
for(const rec of regenerationRows){
 const facts=factsOf(rec),saved=rec.targetChanged?null:frozenRationale(rec.row,frozen),after=saved??generateBindingRationale(facts);
 if(facts.source.level&&facts.target&&!facts.source.unavailable&&!facts.target.unavailable)sectionAudits.push({file:rec.file,claimId:rec.row.claimId,source:facts.source,target:facts.target,disposition:rec.row.disposition,remainder:rec.row.remainder,corrections:facts.corrections,sectionExplanation:facts.sectionExplanation,...describeSectionChange(facts.source,facts.target,facts.corrections)});
 if(!apply){generatedFindings.push(...(rec.row.rationale===after?[]:[{type:'rationale-binding-inconsistent'}]).map(f=>({file:rec.file,claimId:rec.row.claimId,type:f.type})));continue;}
 if(after===rec.row.rationale)continue;
 if(!files.has(rec.file))files.set(rec.file,read(rec.file));
 const rows=files.get(rec.file)[rec.collection],row=rows.find(r=>r.claimId===rec.row.claimId&&r.sourceUnitDigest===rec.row.sourceUnitDigest),before=structuredClone(row);
 row.rationale=after;row.reviewStatus='pending';row.authoredBy='codex-session:unit-run-1792126341980-e0c35701@2026-10-16';
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
 const report={inputCommit,authorSession:'codex-session:unit-run-1792126341980-e0c35701@2026-10-16',mechanism:'Binding-derived rebuild; no prior rationale appended; exact correction-manifest fragments matched to target payload.',rowsScanned:rows.length,shardsScanned:new Set(rows.map(r=>r.file)).size,flagsBefore:flags,sectionAudits,changes};
 fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({scanned:rows.length,shards:report.shardsScanned,flagged:flags.length,regenerated:changes.length,reopenedReviewed:changes.filter(x=>x.before.reviewStatus==='reviewed').length,changedTargetBindings:changes.filter(x=>x.before.targetUnitDigest!==x.after.targetUnitDigest).length}));
}else{
 const report={inputCommit,rowsScanned:rows.length,shardsScanned:new Set(rows.map(r=>r.file)).size,generatedRowsChecked:regenerationRows.length,sourceOccurrenceAudits,historicalTargetWitnesses,historicalTargetFindings,allHeadingComparisons,allHeadingFindings,sectionAudits,legacyFindings:flags,generatedFindings,sourceWitnessLimits:sourceMissing,scope:'Checks contextual bound source/target ranges and anchors, native/text equality claims; historical quotations marked Prior rationale are historical. Exact regeneration checks every row rebuilt this turn. Missing historical source text is disclosed, never invented.',ok:flags.length===0&&generatedFindings.length===0&&!allHeadingFindings.length&&!historicalTargetFindings.length};
 fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({scanned:rows.length,shards:report.shardsScanned,generated:regenerationRows.length,legacyFindings:flags.length,generatedFindings:generatedFindings.length,sourceWitnessLimits:sourceMissing.length,ok:report.ok}));
 process.exitCode=report.ok?0:1;
}
