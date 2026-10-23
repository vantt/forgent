// Read-only evidence replay. It neither writes registry identities nor accepts a gate.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {extractMarkdownConservationUnits} from '../../../../../scripts/generate-doc-inventory.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../../..');
const plan='plans/260925-documentation-authority-unification';
const out=path.join(root,plan,'reports/phase-09/carries');
const read=p=>fs.readFileSync(path.resolve(root,p),'utf8');
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
// Source parity strips Markdown heading depth, link destinations and whitespace only.
const normalize=t=>t.replace(/^#{1,6} /,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/\s+/g,' ').trim();
const parity=json(`${plan}/reports/phase-09/carries/source-parity.json`);
for(const r of parity){
 const s=units(r.sourcePath).find(u=>u.anchor===r.sourceAnchor&&u.textDigest===r.sourceUnitDigest);assert.ok(s,'fresh current source');
 if(r.status==='current-complete-unit-present')assert.ok(r.targets.some(t=>{const u=units(t.path).find(v=>v.anchor===t.anchor);return u&&normalize(u.text).includes(normalize(s.text));}));
 else {assert.equal(r.status,'accounted-selected-design-not-implementation');assert.equal(r.sourceAnchor,'unheaded-block-7');assert.ok(r.accounting?.rationale);const b=r.accounting.binding;checkBinding(b);assert.ok(units(b.targetOwner).find(u=>u.anchor===b.targetAnchor).text.includes('Source checkouts support explicit `dev:<rev>` activation'));}
}
const sourceHeadings=json(`${plan}/reports/phase-09/carries/source-heading-parity.json`);
for(const h of sourceHeadings){
 const us=units(h.sourcePath),s=us.find(u=>u.anchor===h.sourceAnchor&&u.textDigest===h.sourceUnitDigest);assert.ok(s,'current source heading');assert.equal(s.title,h.title);
 const members=[];for(const u of us.slice(us.indexOf(s)+1)){if(u.unitKind==='heading')break;members.push(u.anchor);}assert.deepEqual(members,h.directSourceBlocks);
 assert.ok(h.targets.length);for(const t of h.targets){const u=units(t.path).find(u=>u.anchor===t.anchor&&u.textDigest===t.targetUnitDigest);assert.ok(u);assert.equal(u.title,h.title);assert.equal(u.level,t.level);}
 for(const anchor of members)assert.ok(parity.some(p=>p.sourcePath===h.sourcePath&&p.sourceAnchor===anchor),'direct section block accounted');
}
const foundation=read('docs/platform/platform-foundations.md');
const expectedLaw=read('test/docs/rul104-law.txt').trim();assert.equal(foundation.match(/^- \*\*RUL104 \(tốt hơn, không to hơn\)\.\*\* (.+)$/m)?.[1],expectedLaw);
for(const id of ['0035','0054','0062'])assert.match(foundation,new RegExp('^### '+id+' —','m'));
assert.match(read('docs/platform/work-state/decisions/retired-decision-history.md'),/^### 0032 — Multi-role Team Harness/m);
for(const p of ['docs/platform/platform-foundations.md','docs/platform/work-state/decisions/retired-decision-history.md'])assert.equal((read(p).match(/^## Lịch sử quyết định retired từ docs\/decisions\/ \(tsk-1lv-4\)$/gm)??[]).length,1);
console.log(JSON.stringify({status:'pass',claims:44,candidateUnits:shard.unitCarries.length,refreshedDecisions:refresh.rows.length,droppedClaims:17,pointerFiles:packet.patches.length,currentSourceUnits:parity.length+sourceHeadings.length,sourceParityQualification:'link destinations/heading depth not certified by normalized text; the sole textual delta is dev-source implementation-status qualification; see source-parity.json',reviewStatus:'pending; no gate accepted'},null,2));
