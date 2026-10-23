// Read-only proposal: every source/target unit includes full content for human delta review.
import fs from 'node:fs';import path from 'node:path';
import {extractMarkdownConservationUnits as extract} from '../../../../../scripts/generate-doc-inventory.mjs';
const scratch='/tmp/fgos-work/w2-d1b';
const sources=['docs/specs/work-state.md','docs/specs/runner.md','docs/specs/distribution.md','docs/architect/packaging-distribution/runtime-identity-and-activation.md'];
export const normalize=s=>s.replace(/^#{1,6} /,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/\s+/g,' ').trim();
export function units(p){const s=fs.readFileSync(p,'utf8'),ls=s.split('\n'),stack=[];return extract(s).map(u=>{if(u.unitKind==='heading'){while(stack.length&&stack.at(-1).level>=u.level)stack.pop();stack.push(u);}return {...u,path:p,ancestry:stack.map(h=>h.title),content:ls.slice(u.startLine-1,u.endLine).join('\n').trim()};});}
const words=s=>new Set(normalize(s).split(/\s+/));
const overlap=(a,b)=>{let n=0;for(const w of a)if(b.has(w))n++;return 2*n/(a.size+b.size);};
const list=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?list(d+'/'+e.name):e.name.endsWith('.md')?[d+'/'+e.name]:[]);
const previous=JSON.parse(fs.readFileSync(scratch+'/matches.json'));
const rows=[];
for(const source of sources){const area=source.includes('work-state')?'work-state':source.includes('runner')?'runner':'packaging-distribution';
 const candidates=list('docs/platform/'+area).flatMap(units).map(u=>({...u,normalized:normalize(u.content),words:words(u.content)}));
 for(const s of units(source)){
  const norm=normalize(s.content),ws=words(s.content);const same=candidates.filter(t=>t.unitKind===s.unitKind || (s.unitKind!=='heading' && t.unitKind!=='heading'));
  const exact=same.filter(t=>t.normalized===norm);const old=previous.find(r=>r.source===source&&r.anchor===s.anchor);
  // Context disambiguates repeated Bối cảnh/Quyết định headings and boilerplate paragraphs.
  const context=t=>{let n=0;for(const a of s.ancestry)if(t.ancestry.includes(a))n+=1;return n;};
  const pool=exact.length?exact:same;const ranked=pool.map(t=>({t,score:exact.length?1:overlap(ws,t.words),context:context(t)})).sort((a,b)=>b.score-a.score||b.context-a.context||((b.t.path===old?.target)-(a.t.path===old?.target))||a.t.path.localeCompare(b.t.path));
  const chosen=ranked[0];rows.push({sourcePath:source,sourceAnchor:s.anchor,sourceUnitDigest:s.textDigest,sourceAncestry:s.ancestry,sourceContent:s.content,unitKind:s.unitKind,targetOwner:chosen.t.path,targetAnchor:chosen.t.anchor,targetUnitDigest:chosen.t.textDigest,targetAncestry:chosen.t.ancestry,targetContent:chosen.t.content,score:chosen.score,equivalentText:exact.length>0});
 }
}
// Explicit structural adapters for translated work-state headings: use the holder of the
// first direct payload, not lexical similarity between Vietnamese and English headings.
for(let i=0;i<rows.length;i++){
 const r=rows[i];if(r.sourcePath!=='docs/specs/work-state.md'||r.unitKind!=='heading'||r.equivalentText)continue;
 let chosen;
 if(r.sourceAnchor==='spec-work-state-tầng-quản-việc-của-forgent')chosen=units('docs/platform/work-state/spec.md').find(u=>u.unitKind==='heading');
 else if(r.sourceAnchor==='visuals')chosen=units('docs/platform/work-state/spec.md').find(u=>u.title?.includes('Presentation Surface'));
 else {
  let j=i+1;while(j<rows.length&&rows[j].sourcePath===r.sourcePath&&rows[j].unitKind==='heading')j++;
  const payload=rows[j];if(payload?.sourcePath===r.sourcePath){const us=units(payload.targetOwner),at=us.findIndex(u=>u.anchor===payload.targetAnchor);chosen=us.slice(0,at).reverse().find(u=>u.unitKind==='heading');}
 }
 if(chosen){Object.assign(r,{targetOwner:chosen.path,targetAnchor:chosen.anchor,targetUnitDigest:chosen.textDigest,targetAncestry:chosen.ancestry,targetContent:chosen.content,score:1,structuralAdaptation:true});}
}
// Two source paragraphs were replaced, not carried verbatim, by these explicitly named holders.
for(const [sa,file,ta] of [
 ['unheaded-block-28','docs/platform/runner/operations/h-51f5cd7279fd.md','unheaded-block-16'],
 ['unheaded-block-109','docs/platform/runner/contracts/h-b3eb60fb4d2b.md','unheaded-block-7']
]){const r=rows.find(r=>r.sourcePath==='docs/specs/runner.md'&&r.sourceAnchor===sa),t=units(file).find(t=>t.anchor===ta);Object.assign(r,{targetOwner:file,targetAnchor:ta,targetUnitDigest:t.textDigest,targetAncestry:t.ancestry,targetContent:t.content,explicitDisposition:true});}
fs.writeFileSync(scratch+'/proposed-carriage.json',JSON.stringify(rows,null,2)+'\n');
fs.writeFileSync(scratch+'/semantic-deltas.txt',rows.filter(r=>!r.equivalentText).map(r=>`${r.sourcePath}#${r.sourceAnchor} -> ${r.targetOwner}#${r.targetAnchor} (${r.score.toFixed(3)})\nSOURCE: ${r.sourceContent}\nTARGET: ${r.targetContent}\n`).join('\n'));
console.log(JSON.stringify({units:rows.length,equivalent:rows.filter(r=>r.equivalentText).length,semanticDeltas:rows.filter(r=>!r.equivalentText).length,lowMatches:rows.filter(r=>r.score<0.5).map(r=>[r.sourcePath,r.sourceAnchor,r.unitKind,r.targetOwner,r.targetAnchor,r.score])},null,2));
