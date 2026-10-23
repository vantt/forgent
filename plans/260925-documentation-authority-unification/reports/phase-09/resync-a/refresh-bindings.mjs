// Refresh only bindings into the changed writable candidates. Native unit identities are never minted.
// Default: reviewable proposal in scratch. --apply: render complete affected JSON shards + receipt.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
import {units,normalize} from './map-carriage.mjs';
import {extractMarkdownConservationUnits as extract} from '../../../../../scripts/generate-doc-inventory.mjs';
const P='plans/260925-documentation-authority-unification',R=P+'/reports/phase-09/resync-a',S='/tmp/fgos-work/w2-d1b';
const read=p=>fs.readFileSync(p,'utf8'),json=p=>JSON.parse(read(p)),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:64*1024*1024});
const changed=git('diff','--name-only').trim().split('\n').filter(p=>/^docs\/platform\/(runner|work-state|packaging-distribution)\//.test(p));
if(changed.includes('docs/platform/work-state/contracts/knowledge-registry.md'))throw Error('protected document changed');
const list=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?list(d+'/'+e.name):e.name.endsWith('.md')?[d+'/'+e.name]:[]);
const all=['runner','work-state','packaging-distribution'].flatMap(a=>list('docs/platform/'+a)).flatMap(units);
const oldCache=new Map();function oldUnits(file){if(!oldCache.has(file)){const text=git('show','HEAD:'+file),ls=text.split('\n'),stack=[];oldCache.set(file,extract(text).map(u=>{if(u.unitKind==='heading'){while(stack.length&&stack.at(-1).level>=u.level)stack.pop();stack.push(u);}return {...u,path:file,ancestry:stack.map(v=>v.title),content:ls.slice(u.startLine-1,u.endLine).join('\n').trim()};}));}return oldCache.get(file);}
const words=s=>new Set(normalize(s).split(/\s+/));const overlap=(a,b)=>{let n=0;for(const x of a)if(b.has(x))n++;return 2*n/(a.size+b.size);};
const choices=new Map();
for(const u of all){u.normalized=normalize(u.content);u.words=words(u.content);}
function choose(b){const key=JSON.stringify([b.targetOwner,b.targetAnchor,b.targetUnitDigest]);if(choices.has(key))return choices.get(key);
 const old=oldUnits(b.targetOwner).find(u=>u.anchor===b.targetAnchor&&u.textDigest===b.targetUnitDigest)||oldUnits(b.targetOwner).find(u=>u.anchor===b.targetAnchor);
 if(!old)throw Error('No recorded preimage '+b.targetOwner+'#'+b.targetAnchor);
 const norm=normalize(old.content),ws=words(old.content),sameKind=all.filter(u=>u.unitKind===old.unitKind),exact=sameKind.filter(t=>t.textDigest===b.targetUnitDigest||t.normalized===norm),pool=exact.length?exact:sameKind;
 const ranked=pool.map(t=>({t,score:t.textDigest===b.targetUnitDigest?3:t.normalized===norm?2:overlap(ws,t.words),context:t.ancestry.filter(a=>old.ancestry.includes(a)).length})).sort((a,b)=>b.score-a.score||b.context-a.context||((b.t.path===old.path)-(a.t.path===old.path))||((b.t.anchor===old.anchor)-(a.t.anchor===old.anchor)));
 let result={...ranked[0],old};
 if(b.targetOwner==='docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md'&&b.targetAnchor==='unheaded-block-7'){
  const t=all.find(t=>t.path===b.targetOwner&&t.anchor==='unheaded-block-4');result={t,score:overlap(ws,t.words),old,explicitReason:'The deleted tier-from-rigor paragraph is superseded by the direct-tier Seat Binding contract, not by Work stage replay.'};
 }
 choices.set(key,result);return result;
}
const selected=u=>Object.fromEntries(['anchor','unitKind','title','textDigest','startLine','endLine','ancestry'].map(k=>[k,u[k]??null]));
function binding(u){const keys={targetAnchor:u.anchor,targetAncestry:u.ancestry,targetOwner:u.path,targetUnitDigest:u.textDigest},us=all.filter(t=>t.path===u.path),at=us.indexOf(u);return {...keys,bindingSha256:sha(JSON.stringify(Object.fromEntries(Object.keys(keys).sort().map(k=>[k,keys[k]])))+'\n'),placement:{selected:selected(u),previous:at?selected(us[at-1]):null,next:us[at+1]?selected(us[at+1]):null,content:u.content}};}
function invalidate(row){row.reviewStatus='pending';for(const k of ['reviewedBy','reviewedAt','reviewBindingSha256','reviewReceipt','reviewVerdict'])delete row[k];}
const refresh=[],outputs=[];
for(const name of fs.readdirSync(P+'/ledger/decisions').filter(n=>n.endsWith('.json')&&n!=='s13-resync-a.json').sort()){
 const file=P+'/ledger/decisions/'+name,before=git('show','HEAD:'+file),data=JSON.parse(before);
 // Always rebuild from the pinned preimage; never reinterpret a previous refresh as an origin.
 // Refuse unrecorded concurrent changes instead of overwriting another writer.
 if(read(file)!==before){const receipt=json(R+'/binding-refresh.json'),owned=receipt.outputs.find(o=>o.path===file);if(!owned||owned.afterSha256!==sha(read(file))||owned.beforeSha256!==sha(before))throw Error('unrecorded shard change '+file);}
 function visit(x,pointer){if(Array.isArray(x)){let any=false;for(let i=0;i<x.length;i++)any=visit(x[i],pointer+'/'+i)||any;return any;}if(!x||typeof x!=='object')return false;
  let any=false;
  if(x.targetOwner&&x.targetAnchor&&x.targetUnitDigest&&changed.includes(x.targetOwner)){
   const {t,score,old}=choose(x),b=binding(t),prior=structuredClone(x);
   const bindingChanged=['targetOwner','targetAnchor','targetUnitDigest','targetAncestry','bindingSha256'].some(k=>JSON.stringify(x[k])!==JSON.stringify(b[k]));
   const placementChanged=x.placement&&JSON.stringify(x.placement)!==JSON.stringify(b.placement);
   if(bindingChanged||placementChanged){Object.assign(x,b);invalidate(x);}
   if(JSON.stringify(x)!==JSON.stringify(prior)){refresh.push({shard:file,pointer,before:prior,after:structuredClone(x),matchScore:score,preimageContent:old.content,reason:score>=2?'native content conserved; update placement/digest/ancestry as necessary':'changed or deduplicated holder; reviewed source/target text delta retained'});any=true;}
  }
  for(const [k,v]of Object.entries(x))if(!['placement','sourceOccurrence'].includes(k))any=visit(v,pointer+'/'+k)||any;
  if(any&&('reviewStatus'in x||'bindings'in x)){invalidate(x);}return any;
 }
 visit(data,'');const after=JSON.stringify(data,null,2)+'\n';if(after!==before)outputs.push({path:file,beforeSha256:sha(before),afterSha256:sha(after),content:after});
}
for(const r of refresh){const doc=JSON.parse(outputs.find(o=>o.path===r.shard).content);r.after=r.pointer.slice(1).split('/').reduce((v,k)=>v[k],doc);}
const proposal={version:1,sourceHead:git('rev-parse','HEAD').trim(),changedCandidates:changed,refresh,outputs};
if(!process.argv.includes('--apply')){
 fs.writeFileSync(S+'/binding-refresh-proposal.json',JSON.stringify(proposal,null,2)+'\n');
 console.log(JSON.stringify({shards:outputs.length,refresh:refresh.length,semanticRefresh:refresh.filter(r=>r.matchScore<2).length,low:refresh.filter(r=>r.matchScore<0.5).map(r=>[r.shard,r.pointer,r.before.targetOwner,r.before.targetAnchor,r.after.targetOwner,r.after.targetAnchor,r.matchScore])},null,2));
}else{
 const previous=json(S+'/binding-refresh-proposal.json');
 if(JSON.stringify(proposal)!==JSON.stringify(previous))throw Error('proposal changed since review');
 const carriage=json(S+'/proposed-carriage.json'),adjudications=json(R+'/adjudications.json');
 const rows=carriage.map(r=>{const t=all.find(u=>u.path===r.targetOwner&&u.anchor===r.targetAnchor&&u.textDigest===r.targetUnitDigest);if(!t)throw Error('stale target');
 let disposition;
 if(r.equivalentText)disposition={kind:'current-source-content-present',reason:'Only heading depth, link destination or whitespace adaptation; full current source content is present in the named holder.',evidence:[]};
 else if(r.structuralAdaptation)disposition={kind:'structural-heading-adaptation',reason:'Translated/reorganized section heading; direct payload is separately bound. No source behavior is discarded.',evidence:[]};
 else if(adjudications[r.sourcePath]?.[r.sourceAnchor])disposition={kind:'adapted-or-retired-legacy-clause',...adjudications[r.sourcePath][r.sourceAnchor]};
 else if(normalize(t.content).includes(normalize(r.sourceContent)))disposition={kind:'current-source-content-in-candidate-envelope',reason:'Full current content occurs inside the retained candidate scaffold.',evidence:[]};
 else throw Error('unadjudicated source delta '+r.sourcePath+'#'+r.sourceAnchor);
 return {sourcePath:r.sourcePath,sourceAnchor:r.sourceAnchor,sourceUnitDigest:r.sourceUnitDigest,sourceAncestry:r.sourceAncestry,sourceContent:r.sourceContent,unitKind:r.unitKind,...binding(t),disposition,reviewStatus:'pending'};
 });
 const recipe='sha256(UTF-8(compact JSON with sorted keys targetAncestry,targetAnchor,targetOwner,targetUnitDigest + LF))';
 const shard={version:1,shard:'s13-resync-a',authorSession:'fgos-run_unit-run-17927673e1bf0d',authority:'W2 D1b permitted-scope re-sync; no gate acceptance or authority flip',sourcePin:proposal.sourceHead,bindingHashEncoding:recipe,claims:[],registryGaps:[],sourceBindings:rows};
 for(const o of outputs)fs.writeFileSync(o.path,o.content);
 fs.writeFileSync(P+'/ledger/decisions/s13-resync-a.json',JSON.stringify(shard,null,2)+'\n');
 fs.writeFileSync(R+'/binding-refresh.json',JSON.stringify({...proposal,outputs:outputs.map(({content,...r})=>r),bindingHashEncoding:recipe},null,2)+'\n');
 console.log(JSON.stringify({status:'rendered',refreshedBindings:refresh.length,shards:outputs.length,sourceBindings:rows.length}));
}
