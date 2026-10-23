// One-shot authoring proposal; additive overlays leave prior shards/reviews historical.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {read,json,sha,normalize,units,binding,recipe,walk} from './units.mjs';
const P='plans/260925-documentation-authority-unification',R=P+'/reports/phase-09/resync-b';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:64*1024*1024});
const input=json('/tmp/fgos-work/w2-d7/mapping-proposal.json'),adjudications=json(R+'/adjudications.json');
const cache=new Map(),get=p=>{if(!cache.has(p))cache.set(p,units(p));return cache.get(p);};
const carries=input.rows.map(r=>{
 const a=adjudications[r.sourcePath+'#'+r.sourceAnchor];
 const owner=a?.targetOwner||r.targetOwner;
 const t=get(owner).find(u=>a?.targetSelector==='literal-snapshot'?u.content.startsWith('~~~~text\n'):u.anchor===(a?.targetAnchor||r.targetAnchor));
 if(!t)throw Error('missing mapped target '+r.sourcePath+'#'+r.sourceAnchor);
 const disposition=a?Object.fromEntries(Object.entries(a).filter(([k])=>!k.startsWith('target'))):r.disposition;
 if(disposition.kind==='review-required')throw Error('unadjudicated '+r.sourcePath+'#'+r.sourceAnchor);
 return {sourcePath:r.sourcePath,sourceAnchor:r.sourceAnchor,sourceUnitDigest:r.sourceUnitDigest,sourceAncestry:r.sourceAncestry,sourceContent:r.sourceContent,unitKind:r.unitKind,...binding(t),disposition,reviewStatus:'pending'};
});
const changed=git('diff','--name-only','--','docs').trim().split('\n').filter(Boolean);
const all=changed.flatMap(get),oldCache=new Map();
function oldUnits(p){if(!oldCache.has(p))oldCache.set(p,units(p,git('show','HEAD:'+p)));return oldCache.get(p);}
const words=s=>new Set(normalize(s).split(/\s+/));
const overlap=(a,b)=>{let n=0;for(const w of a)if(b.has(w))n++;return 2*n/(a.size+b.size);};
const choices=new Map();
function choose(x){
 const key=JSON.stringify([x.targetOwner,x.targetAnchor,x.targetUnitDigest]);if(choices.has(key))return choices.get(key);
 const old=oldUnits(x.targetOwner).find(u=>u.anchor===x.targetAnchor&&u.textDigest===x.targetUnitDigest);
 if(!old)return null; // Already-stale historical placements are separately reported, never guessed.
 const ns=normalize(old.content),ws=words(old.content);
 let pool=all.filter(u=>u.unitKind===old.unitKind);
 if(x.targetOwner.includes('/agent-confinement/history/')&&old.ancestry.some(a=>a.startsWith('13.1 ')))pool=get('docs/platform/agent-confinement/spec.md').filter(u=>u.unitKind===old.unitKind&&u.ancestry.some(a=>a.startsWith('13.1 ')));
 let ranked=pool.map(t=>({t,score:t.textDigest===old.textDigest?3:normalize(t.content)===ns?2:overlap(ws,words(t.content)),context:t.ancestry.filter(a=>old.ancestry.includes(a)).length})).sort((a,b)=>b.score-a.score||b.context-a.context||((b.t.path===old.path)-(a.t.path===old.path))||((b.t.anchor===old.anchor)-(a.t.anchor===old.anchor)));
 let chosen={...ranked[0],old};
 if(/^---\narea: (seat-binding|workflow)\n/.test(old.content))chosen={t:get(old.path).find(u=>u.content.startsWith('```yaml\n---\narea:')),score:1,old,reason:'Legacy YAML front matter is conserved verbatim inside the provenance fence below the candidate header; coverage is no longer active candidate metadata.'};
 if(old.content.startsWith('**Gắn home với tiến trình'))chosen={t:get(old.path).find(u=>u.content.startsWith('**Home thuộc về attempt')),score:1,old,reason:'The 2026-10-15 process/pane binding is superseded by attempt-owned home on 2026-10-18, not retained as current.'};
 if(old.content.startsWith('Reaper và recovery hỏi đúng herdr session')||old.content.startsWith('Added in candidate — verbatim binding addition'))chosen={t:get(old.path).find(u=>u.content.startsWith('**Home thuộc về attempt')),score:1,old,reason:'The obsolete pane/reaper binding and its carriage annotation are retired with process-owned home; attempt ownership is the sole maintained rule.'};
 choices.set(key,chosen);return chosen;
}
const refresh=[],stale=[];
for(const n of fs.readdirSync(P+'/ledger/decisions').filter(n=>n.endsWith('.json')&&n!=='s14-resync-b.json').sort()){
 const file=P+'/ledger/decisions/'+n,data=json(file);
 walk(data,(x,pointer)=>{
  if(!changed.includes(x.targetOwner)||!x.targetAnchor||!x.targetUnitDigest)return;
  const chosen=choose(x);
  if(!chosen){stale.push({shard:file,pointer,targetOwner:x.targetOwner,targetAnchor:x.targetAnchor,targetUnitDigest:x.targetUnitDigest,reason:'Not a current HEAD placement. Historical stale row; do not reinterpret its anchor as current bytes.'});return;}
  const {t,old,score}=chosen,b=binding(t);
  const identityChanged=Object.keys(b).some(k=>JSON.stringify(b[k])!==JSON.stringify(x[k]));
  const locationChanged=x.placement&&(x.placement.selected?.startLine!==t.startLine||x.placement.selected?.endLine!==t.endLine);
  if(!identityChanged&&!locationChanged)return;
  refresh.push({supersedesBinding:{shard:file,pointer,targetOwner:x.targetOwner,targetAnchor:x.targetAnchor,targetUnitDigest:x.targetUnitDigest,bindingSha256:x.bindingSha256??null},...b,preimageContentSha256:sha(old.content),matchScore:score,reason:chosen.reason||(score>=2?'Full unit content preserved; refresh current digest, self-inclusive ancestry and placement.':'Changed candidate envelope or relocated/adapted clause; explicit before/after witness is retained for review.'),reviewStatus:'pending'});
 });
}
// Join prior overlays by physical row locator + old anchor/digest, never by a stale hash.
const priorOverlays=[];
for(const n of fs.readdirSync(P+'/ledger/decisions').filter(n=>n.endsWith('.json')&&n!=='s14-resync-b.json')){
 const file=P+'/ledger/decisions/'+n;walk(json(file),(row,pointer)=>{if(row.supersedesBinding)priorOverlays.push({file,pointer,row});});
}
for(const s of stale){
 const prior=priorOverlays.find(({row})=>{const p=row.supersedesBinding;return p.shard===s.shard&&(p.pointer||'/'+p.collection+'/'+p.index)===s.pointer&&p.targetAnchor===s.targetAnchor&&p.targetUnitDigest===s.targetUnitDigest;});
 if(prior){s.resolvedVia={shard:prior.file,pointer:prior.pointer,targetOwner:prior.row.targetOwner,targetAnchor:prior.row.targetAnchor,targetUnitDigest:prior.row.targetUnitDigest};s.reason='Historical predecessor already superseded by the identified D6 overlay. Its current placement is refreshed separately when changed; old review acceptance is not inherited.';}
 else if(s.shard.endsWith('/s3-host-invocation-boundary-gaps.json')&&s.pointer==='/registryGaps/4'){
  const t=get('docs/platform/agent-confinement/spec.md').find(u=>u.content.startsWith('1. `credentialStore:'));
  refresh.push({supersedesBinding:{...s,reason:undefined},...binding(t),matchScore:1,reason:'Previously conditional G0-fix credential-store target is now materialized in live spec §13.1. The complete current invocation/login/trust clause, not the stale ordinal, determines placement.',reviewStatus:'pending',conditionalTargetMaterialized:true});
  s.resolvedVia={shard:P+'/ledger/decisions/s14-resync-b.json',pointer:'/bindingRefresh/'+(refresh.length-1)};
 }else throw Error('Unresolved preexisting stale binding '+s.shard+s.pointer);
}
const targetUnits=new Map();
for(const b of [...carries,...refresh]){const u=get(b.targetOwner).find(u=>u.anchor===b.targetAnchor&&u.textDigest===b.targetUnitDigest);if(!u)throw Error('stale new binding');const key=u.path+'#'+u.anchor;targetUnits.set(key,{targetOwner:u.path,anchor:u.anchor,unitKind:u.unitKind,unitDigest:u.textDigest,ancestry:u.ancestry,startLine:u.startLine,endLine:u.endLine,contentSha256:sha(u.content)});}
const proposal={version:1,sourcePin:input.sourcePin,bindingHashEncoding:recipe,unitCarries:carries,bindingRefresh:refresh,alreadyStaleHistoricalBindings:stale,targetUnits:[...targetUnits.values()],changedDocuments:changed.map(path=>({path,beforeSha256:sha(git('show','HEAD:'+path)),afterSha256:sha(read(path))}))};
fs.writeFileSync('/tmp/fgos-work/w2-d7/bindings-proposal.json',JSON.stringify(proposal,null,2)+'\n');
console.log(JSON.stringify({carries:carries.length,refresh:refresh.length,staleHistorical:stale.length,lowRefresh:refresh.filter(r=>r.matchScore<1).map(r=>[r.supersedesBinding,r.targetOwner,r.targetAnchor,r.matchScore])},null,2));
