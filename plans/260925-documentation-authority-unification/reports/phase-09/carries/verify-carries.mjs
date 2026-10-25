// Read-only evidence replay. It neither writes registry identities nor accepts a gate.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {extractMarkdownConservationUnits} from '../../../../../scripts/generate-doc-inventory.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../../..');
const plan='plans/260925-documentation-authority-unification';
const out=path.join(root,plan,'reports/phase-09/carries');
// Placements and unapplied patch packets are historical authoring witnesses.
// Replay them at their immutable authoring commit, then authenticate their
// current ledger successors separately; never confuse the two byte domains.
const witnessPin=execFileSync('git',['log','--diff-filter=A','--format=%H','--',`${plan}/reports/phase-09/carries/binding-refresh.json`],{cwd:root,encoding:'utf8'}).trim();
assert.match(witnessPin,/^[a-f0-9]{40}$/);
let historical=true;
const read=p=>historical ? execFileSync('git',['show',`${witnessPin}:${p}`],{cwd:root,encoding:'utf8',maxBuffer:50*1024*1024}) : fs.readFileSync(path.resolve(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const shard=json(`${plan}/ledger/decisions/s11-preflip-carries.json`);
const cache=new Map();
function units(p){
 if(cache.has(p))return cache.get(p);
 const content=read(p),lines=content.split(/\r?\n/),us=extractMarkdownConservationUnits(content);let stack=[];
 for(const u of us){
  if(u.unitKind==='heading'){while(stack.length&&stack.at(-1).level>=u.level)stack.pop();stack.push(u);}
  u.ancestry=stack.map(v=>v.title);u.text=lines.slice(u.startLine-1,u.endLine).join('\n').trim();
 }
 cache.set(p,us);return us;
}
function checkBinding(row){
 const keys=['targetOwner','targetAnchor','targetUnitDigest','targetAncestry'].sort();
 const payload=Object.fromEntries(keys.map(k=>[k,row[k]]));
 assert.equal(hash(JSON.stringify(payload)+'\n'),row.bindingSha256,'compact sorted four-key + LF hash');
 const matches=units(row.targetOwner).filter(u=>u.anchor===row.targetAnchor&&u.textDigest===row.targetUnitDigest);
 assert.equal(matches.length,1,`${row.targetOwner}#${row.targetAnchor}: unique current unit`);
 assert.deepEqual(matches[0].ancestry,row.targetAncestry);return matches[0];
}
function checkPlacement(binding){
 const u=checkBinding(binding),us=units(binding.targetOwner),i=us.indexOf(u),p=binding.placement;
 assert.equal(u.text,p.content,'full content witness');
 for(const key of ['anchor','unitKind','title','textDigest','startLine','endLine','ancestry'])assert.deepEqual(u[key]??null,p.selected[key]??null);
 for(const [key,n] of [['previous',i-1],['next',i+1]]){
  const current=us[n];
  if(!current){assert.equal(p[key],null);continue;}
  for(const k of ['anchor','unitKind','title','textDigest','startLine','endLine','ancestry'])assert.deepEqual(current[k]??null,p[key][k]??null,'neighbor '+key+' '+k);
 }
}
assert.equal(shard.conservedClaims.length,44);
const gate=json(`${plan}/reports/phase-08/step-08-preflip-gates.json`);
const expected=gate.l12_96Composition.filter(f=>[14,15,16,18].includes(f.familyNumber)).flatMap(f=>f.members.map(m=>m.id)).sort();
assert.deepEqual(shard.conservedClaims.map(c=>c.id).sort(),expected);
for(const c of shard.conservedClaims){assert.equal(c.reviewStatus,'pending');assert.ok(c.sourceOccurrence);for(const b of c.bindings)checkPlacement(b);}
for(const c of shard.unitCarries){assert.equal(c.reviewStatus,'pending');checkPlacement(c);}
const refresh=json(`${plan}/reports/phase-09/carries/binding-refresh.json`);
for(const r of refresh.rows){
 const current=json(r.shard)[r.collection][r.index];assert.deepEqual(current,r.after,'saved rebind must equal live decision');
 assert.equal(current.reviewStatus,'pending');checkPlacement({...current,placement:r.placement});
 for(const b of current.additionalBindings??[])checkBinding(b);
 assert.ok(!current.reviewedBy&&!current.reviewedAt&&!current.reviewBindingSha256,'old review cannot approve new binding');
}
const dropped=json(`${plan}/dropped-claims-register.json`);
assert.equal(dropped.entries.length,17);
for(const e of dropped.entries){assert.equal(e.preflipDisposition.reviewStatus,'pending');checkPlacement({...e.preflipDisposition.binding,placement:e.preflipDisposition.placement});assert.ok(!e.status.startsWith('dropped-needs-'));}
assert.equal(dropped.entries[0].reviewedDisposition.decision,'restored');
// Exact, zero-fuzz unified diff replay. No invocation of git apply and no source writes.
function applyDiff(text,diff){
 const input=text.match(/[^\n]*\n|[^\n]+$/g)??[],lines=diff.match(/[^\n]*\n|[^\n]+$/g)??[];let cursor=0,result=[];
 for(let i=0;i<lines.length;){
  const m=/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(lines[i]);
  if(!m){i++;continue;}
  const at=Number(m[1])===0?0:Number(m[1])-1;assert.ok(at>=cursor);result.push(...input.slice(cursor,at));cursor=at;i++;
  while(i<lines.length&&!lines[i].startsWith('@@ ')){
   const line=lines[i++],kind=line[0];if(kind==='\\')continue;
   assert.ok([' ','+','-'].includes(kind));const body=line.slice(1);
   if(kind!=='+' ){assert.equal(input[cursor],body,'exact patch preimage');cursor++;}
   if(kind!=='-')result.push(body);
  }
 }
 result.push(...input.slice(cursor));return result.join('');
}
const packet=json(`${plan}/reports/phase-09/carries/pointer-patches.json`);
for(const p of packet.patches){
 const before=read(p.path);assert.equal(hash(before),p.beforeSha256,'source drift: '+p.path);
 assert.equal(hash(p.forwardDiff),p.forwardSha256);assert.equal(hash(p.rollbackDiff),p.rollbackSha256);
 const after=applyDiff(before,p.forwardDiff);assert.equal(hash(after),p.expectedAfterSha256);assert.equal(applyDiff(after,p.rollbackDiff),before);assert.equal(p.applied,false);
}
assert.ok(!fs.existsSync(path.join(root,'src/runner/dispatch/assignment-policy.mjs')),'removed consumer not resurrected');
// Check live successors using the canonical supersession traversal and existing
// dual extractors, not an alternate JS approximation of ledger identity.
const currentBindings=JSON.parse(execFileSync('python3',['-B','-c',`
import json,runpy,sys
from pathlib import Path
P=Path('${plan}')
sys.path.insert(0,str(P/'reports/phase-09/ledgerfix'))
from bindings import documents,rows,supersessions,effective,at,digest
D=documents(); L=supersessions(D)
origins=[(str(P/'ledger/decisions/s11-preflip-carries.json'),p,r) for p,r in rows(D[str(P/'ledger/decisions/s11-preflip-carries.json')])]
refresh=json.loads((P/'reports/phase-09/carries/binding-refresh.json').read_text())
for r in refresh['rows']:
 f=r['shard'];p='/'+r['collection']+'/'+str(r['index']);origins.append((f,p,at(D[f],p)))
current=[effective(f,p,r,D,L) for f,p,r in origins]
extract=runpy.run_path(str(P/'reports/phase-09/rebind/rebind.py'))['extract']
cat=extract(dict(paths=sorted({r['targetOwner'] for f,p,r in current})))['catalog']
for f,p,r in current:
 us=[u for u in cat[r['targetOwner']]['units'] if u['anchor']==r['targetAnchor'] and u['textDigest']==r['targetUnitDigest']]
 assert len(us)==1,(f,p)
 u=us[0];assert r['targetAncestry']==u['ancestry']+([u['title']] if u['unitKind']=='heading' else []),(f,p,'ancestry')
 assert r['bindingSha256']==digest(r),(f,p,'hash')
print(json.dumps(dict(status='pass',origins=len(origins),currentBindings=len(current))))
`],{cwd:root,encoding:'utf8',maxBuffer:50*1024*1024}));
assert.equal(currentBindings.status,'pass');
historical=false;cache.clear();
const liveDropped=json(`${plan}/dropped-claims-register.json`);
assert.equal(liveDropped.entries.length,17);
for(const e of liveDropped.entries){assert.equal(e.preflipDisposition.reviewStatus,'pending');const u=checkBinding(e.preflipDisposition.binding);assert.equal(u.text,e.preflipDisposition.placement.content,'unchanged restored passage at current binding');assert.ok(!e.status.startsWith('dropped-needs-'));}
// Source parity strips Markdown heading depth, link destinations and whitespace only.
const normalize=t=>t.replace(/^#{1,6} /,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/\s+/g,' ').trim();
const parity=json(`${plan}/reports/phase-09/carries/source-parity.json`);
for(const r of parity){
 const s=units(r.sourcePath).find(u=>u.anchor===r.sourceAnchor&&u.textDigest===r.sourceUnitDigest);assert.ok(s,'fresh current source');
 if(r.status==='current-complete-unit-present')assert.ok(r.targets.some(t=>{const u=units(t.path).find(v=>v.anchor===t.anchor);return u&&normalize(u.text).includes(normalize(s.text));}),r.sourcePath+'#'+r.sourceAnchor);
 else if(r.status==='current-complete-unit-split-present'){
  const texts=r.targets.map(t=>{const u=units(t.path).find(v=>v.anchor===t.anchor&&v.textDigest===t.targetUnitDigest);assert.ok(u);return u.text;});
  assert.equal(normalize(texts.join('\n')),normalize(s.text),'complete split unit, no omitted text');
 }
 else if(r.status==='accounted-current-source-adaptation'){
  const a=r.accounting;assert.ok(a.rationale);const u=checkBinding(a.binding);
  assert.equal(r.targets.length,1);assert.deepEqual(r.targets[0],{path:a.binding.targetOwner,anchor:a.binding.targetAnchor,targetUnitDigest:a.binding.targetUnitDigest});
  assert.equal(hash(a.forwardDiff),a.forwardSha256);assert.equal(hash(a.rollbackDiff),a.rollbackSha256);
  assert.equal(applyDiff(s.text+'\n',a.forwardDiff),u.text+'\n','exact authored adaptation, not equality');
  assert.equal(applyDiff(u.text+'\n',a.rollbackDiff),s.text+'\n','complete source recovered');
  assert.equal(a.reviewStatus,'pending');
 }
 else {
  assert.equal(r.status,'accounted-selected-design-not-implementation');assert.equal(r.sourceAnchor,'unheaded-block-7');assert.ok(r.accounting?.rationale);
  const b=r.accounting.binding;
  historical=true;cache.clear();checkBinding(b);
  historical=false;cache.clear();
  // An ordinal moved, but this whole compound table is byte-identical. Require
  // a unique full digest AND ancestry, not a guessed current ordinal.
  const matches=units(b.targetOwner).filter(u=>u.textDigest===b.targetUnitDigest);
  assert.equal(matches.length,1);assert.deepEqual(matches[0].ancestry,b.targetAncestry);
  assert.ok(matches[0].text.includes('Source checkouts support explicit `dev:<rev>` activation'));
 }
}
// Preserve the original heading/direct-block census at the authoring pin.
// The same contract is also checked against live rows and working-tree bytes.
const currentParity=parity;
historical=true;cache.clear();
const originalParity=json(`${plan}/reports/phase-09/carries/source-parity.json`);
const sourceHeadings=json(`${plan}/reports/phase-09/carries/source-heading-parity.json`);
for(const h of sourceHeadings){
 const us=units(h.sourcePath),s=us.find(u=>u.anchor===h.sourceAnchor&&u.textDigest===h.sourceUnitDigest);assert.ok(s,'current source heading');assert.equal(s.title,h.title);
 const members=[];for(const u of us.slice(us.indexOf(s)+1)){if(u.unitKind==='heading')break;members.push(u.anchor);}assert.deepEqual(members,h.directSourceBlocks);
 assert.ok(h.targets.length);for(const t of h.targets){const u=units(t.path).find(u=>u.anchor===t.anchor&&u.textDigest===t.targetUnitDigest);assert.ok(u);assert.equal(u.title,h.title);assert.equal(u.level,t.level);}
 for(const anchor of members)assert.ok(originalParity.some(p=>p.sourcePath===h.sourcePath&&p.sourceAnchor===anchor),'direct section block accounted at authoring pin');
}
historical=false;cache.clear();
const liveHeadings=json(`${plan}/reports/phase-09/carries/source-heading-parity.json`);
let liveSectionBlocks=0;
for(const sourcePath of new Set([...sourceHeadings,...liveHeadings].map(h=>h.sourcePath))){
 assert.deepEqual(liveHeadings.filter(h=>h.sourcePath===sourcePath).map(h=>h.sourceAnchor),units(sourcePath).filter(u=>u.unitKind==='heading').map(u=>u.anchor),'live heading census: '+sourcePath);
}
for(const h of liveHeadings){
 const us=units(h.sourcePath),s=us.find(u=>u.unitKind==='heading'&&u.anchor===h.sourceAnchor&&u.textDigest===h.sourceUnitDigest);
 assert.ok(s,'live source heading: '+h.sourcePath+'#'+h.sourceAnchor);
 assert.equal(s.title,h.title);assert.equal(s.level,h.sourceLevel);assert.equal(s.sectionPayloadDigest,h.sourceDirectPayloadDigest);
 const members=[];for(const u of us.slice(us.indexOf(s)+1)){if(u.unitKind==='heading')break;members.push(u);}
 assert.deepEqual(members.map(u=>u.anchor),h.directSourceBlocks,'live direct section membership: '+h.sourcePath+'#'+h.sourceAnchor);
 assert.ok(h.targets.length);
 for(const t of h.targets){const u=units(t.path).find(u=>u.unitKind==='heading'&&u.anchor===t.anchor&&u.textDigest===t.targetUnitDigest);assert.ok(u,'live target heading: '+t.path+'#'+t.anchor);assert.equal(u.title,h.title);assert.equal(u.level,t.level);assert.equal(u.sectionPayloadDigest,t.directPayloadDigest);}
 for(const u of members){assert.ok(currentParity.some(p=>p.sourcePath===h.sourcePath&&p.sourceAnchor===u.anchor&&p.sourceUnitDigest===u.textDigest),'live direct section block unaccounted: '+h.sourcePath+'#'+u.anchor);liveSectionBlocks++;}
}
// A path-scoped duty is disclosure, not a rebased patch or permission to apply.
// Collect all live drift before failing, so a new drift cannot hide other paths.
const livePacket=json(`${plan}/reports/phase-09/carries/pointer-patches.json`);
const finalPinDuties=json(`${plan}/reports/phase-09/carries/final-pin-duties.json`);
assert.equal(finalPinDuties.version,1);assert.ok(Array.isArray(finalPinDuties.pointerPatchDrift));
const dutyPaths=new Set();
for(const d of finalPinDuties.pointerPatchDrift){
 assert.equal(typeof d.path,'string');assert.ok(d.reason?.trim());assert.ok(!dutyPaths.has(d.path),'duplicate final-pin duty: '+d.path);dutyPaths.add(d.path);
 assert.equal(livePacket.patches.filter(p=>p.path===d.path&&p.applied===false).length,1,'duty must name one unapplied patch');
}
const livePointerPatchDrift=livePacket.patches.filter(p=>p.applied===false).flatMap(p=>{
 const file=path.resolve(root,p.path),actual=fs.existsSync(file)?hash(fs.readFileSync(file)):null;
 return actual===p.beforeSha256?[]:[{path:p.path,beforeSha256:p.beforeSha256,liveSha256:actual,finalPinDuty:finalPinDuties.pointerPatchDrift.find(d=>d.path===p.path)??null}];
});
if(livePointerPatchDrift.some(d=>!d.finalPinDuty))console.error(JSON.stringify({livePointerPatchDrift}));
assert.deepEqual(livePointerPatchDrift.filter(d=>!d.finalPinDuty).map(d=>d.path),[],'unlisted live pointer-patch drift; all drift: '+livePointerPatchDrift.map(d=>d.path).join(', '));
assert.deepEqual([...dutyPaths].filter(p=>!livePointerPatchDrift.some(d=>d.path===p)),[],'stale final-pin duty: listed path does not drift');
const foundation=read('docs/platform/platform-foundations.md');
const expectedLaw=read('test/docs/rul104-law.txt').trim();assert.equal(foundation.match(/^- \*\*RUL104 \(tốt hơn, không to hơn\)\.\*\* (.+)$/m)?.[1],expectedLaw);
for(const id of ['0035','0054','0062'])assert.match(foundation,new RegExp('^### '+id+' —','m'));
assert.match(read('docs/platform/work-state/decisions/retired-decision-history.md'),/^### 0032 — Multi-role Team Harness/m);
for(const p of ['docs/platform/platform-foundations.md','docs/platform/work-state/decisions/retired-decision-history.md'])assert.equal((read(p).match(/^## Lịch sử quyết định retired từ docs\/decisions\/ \(tsk-1lv-4\)$/gm)??[]).length,1);
console.log(JSON.stringify({status:'pass',claims:44,candidateUnits:shard.unitCarries.length,refreshedDecisions:refresh.rows.length,droppedClaims:17,pointerFiles:packet.patches.length,currentSourceUnits:currentParity.length,historicalHeadingWitnesses:sourceHeadings.length,liveHeadingRows:liveHeadings.length,liveSectionBlocks,livePointerPatchDrift,finalPinDuties,witnessPin,currentLedgerSuccessors:currentBindings,sourceParityQualification:'Current rows require exact source anchor/digest and normalized full-source inclusion at a named current target. Split/adapted rows also check target digests; explicit zero-fuzz adaptations are not false equality. Original heading census, placement and unapplied patch witnesses replay at witnessPin. Live heading census, direct-section block coverage and pointer-patch drift also check working-tree bytes; only explicitly listed final-pin duties permit drift. Patch recomposition and authority/cutover acceptance are not certified.',reviewStatus:'pending; no gate accepted'},null,2));
