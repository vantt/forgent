// One-shot complete renders from retained-source sections; never changes a retained source.
// Run before binding generation. This is documentation migration evidence, not product code.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {extractMarkdownConservationUnits as extract} from '../../../../../scripts/generate-doc-inventory.mjs';
const P='plans/260925-documentation-authority-unification';
const R=P+'/reports/phase-09/resync-a';
if(fs.existsSync(R+'/carrier-renders.json'))throw Error('One-shot carrier render already recorded; use verify-resync.mjs to replay evidence, not rebuild-carriers.mjs.');
const read=p=>fs.readFileSync(p,'utf8');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const units=p=>{const s=read(p),ls=s.split('\n');return extract(s).map(u=>({...u,content:ls.slice(u.startLine-1,u.endLine).join('\n').trim()}));};
const routes={
 'docs/specs/seat-binding.md':'docs/platform/seat-binding/spec.md',
 'docs/specs/workflow.md':'docs/platform/workflow/spec.md',
 'docs/specs/confinement-authority.md':'docs/platform/agent-confinement/spec.md',
 'docs/architect/agent-coordination/architecture/dispatch-control-plane.md':'docs/platform/agent-coordination/architecture/dispatch-control-plane.md'
};
function rebase(text,source,target){return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g,(all,label,ref)=>{
 if(/^(?:[a-z]+:|#|\/)/i.test(ref))return all;
 const [p,anchor]=ref.split('#');const resolved=path.posix.normalize(path.posix.join(path.posix.dirname(source),p));
 return '['+label+']('+path.posix.relative(path.posix.dirname(target),routes[resolved]||resolved)+(anchor?'#'+anchor:'')+')';
});}
const renders=[];
// The historical holder has no implementation corrections: its prior edits were link-only.
// Render the complete source history, including seven newly settled records, keeping its candidate envelope.
const source='docs/specs/runner.md',target='docs/platform/runner/decisions/h-36d872fbb0e5.md';
const marker='## Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)';
const before=read(target);let envelope=before.slice(0,before.indexOf(marker));
envelope=envelope.replace('The verbatim carried retired heading holds 12 current decision records: 0047, 0052 and 0055–0064; partly superseded clauses keep their dated historical meaning (including 0062 R3_PENDING_WORK_CALLERS, superseded by 0063).','The retained history is re-synced to the source HEAD recorded in resync-a/receipt.json, including D-ADR0056/0059/0070/0071/0072 and the controller-death and Git notes. Dated superseded clauses remain history, not current behavior.');
const after=envelope+rebase(read(source).slice(read(source).indexOf(marker)),source,target);
fs.writeFileSync(target,after);renders.push({source,target,kind:'complete historical-section render',beforeSha256:hash(before),afterSha256:hash(after)});
// Render complete documents, changing only named carried native blocks. Existing truth corrections
// elsewhere in each file remain byte-identical. Input anchors refer to the pre-render candidates.
const selections=[
 ['unheaded-block-71','docs/platform/runner/subcomponents/h-6979005beaf7/spec.md','unheaded-block-14'],
 ['unheaded-block-93','docs/platform/runner/subcomponents/h-6979005beaf7/spec.md','unheaded-block-36'],
 ['unheaded-block-132','docs/platform/runner/architecture/h-69197b459754.md','unheaded-block-18'],
];
for(const file of [...new Set(selections.map(x=>x[1]))]){
 const original=read(file),lines=original.split('\n'),edits=selections.filter(x=>x[1]===file).map(([sa,,ta])=>{
  const s=units(source).find(u=>u.anchor===sa),t=units(file).find(u=>u.anchor===ta);if(!s||!t)throw Error('missing explicit render unit');
  return {s,t,content:rebase(s.content,source,file)};
 }).sort((a,b)=>b.t.startLine-a.t.startLine);
 for(const e of edits)lines.splice(e.t.startLine-1,e.t.endLine-e.t.startLine+1,e.content);
 const output=lines.join('\n');fs.writeFileSync(file,output);
 renders.push({source,target:file,kind:'complete render retaining all non-selected bytes',sourceAnchors:edits.map(e=>e.s.anchor),beforeSha256:hash(original),afterSha256:hash(output)});
}
// The new Git custody section has no former holder. It remains inside the runner architecture,
// referring to (not copying) the Git authority, and is copied once only.
const custody='## Custody lease extension (2026-10-18, Git phase 04)';
const src=read(source),start=src.indexOf(custody),end=src.indexOf(marker,start);
const f='docs/platform/runner/architecture/h-69197b459754.md',old=read(f);
if(!old.includes(custody))fs.writeFileSync(f,old.trimEnd()+'\n\n'+rebase(src.slice(start,end).trim(),source,f)+'\n');
fs.writeFileSync(R+'/carrier-renders.json',JSON.stringify(renders,null,2)+'\n');
console.log(JSON.stringify({renders:renders.length,custodyHolder:f}));
