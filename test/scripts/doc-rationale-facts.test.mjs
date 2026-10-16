import test from 'node:test';
import assert from 'node:assert/strict';
import {auditRationaleFacts} from '../../scripts/doc-rationale-facts.mjs';
const source={path:'docs/source.md',anchor:'s',level:2,text:'## S',sectionText:'## S\nlost body\n[x](a.md)',textDigest:'a'.repeat(64)};
const target={path:'docs/target.md',anchor:'t',level:2,text:'## S',sectionText:'## S\nkept body\n[x](b.md)',textDigest:'b'.repeat(64)};
const audit=(r,extra={})=>auditRationaleFacts(r,{source,target,registeredLabels:['A25','L10-26'],accountOf:()=> 'SHA256; 0 changed spellings.',...extra});
test('independent facts reject a generator-consistent invented label and equal section claim',()=>{
 const findings=audit('Whole direct section equal; depth 2 → 2; 1 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Existing correction labels A25 at immutable account abc:shard.json;');
 assert.ok(findings.some(f=>f.type==='section-equality'));
 assert.ok(findings.some(f=>f.type==='section-lines'));
 assert.ok(findings.some(f=>f.type==='account-label-absent'));
});
test('independent facts reject wrong removed and added line arrays',()=>{
 assert.ok(audit('Section accounting (other): Exact normalized nonblank line delta: removed []; added [].').some(f=>f.type==='section-line-witnesses'));
});
test('independent facts recompute link counts from the actual bound sections',()=>{
 assert.ok(audit('Links: source 0, target 2; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.').some(f=>f.type==='link-counts'));
});
test('independent facts accept actual delta and a real account label',()=>{
 const r='Whole direct section differs; depth 2 → 2; 1 distinct link changes; normalized line order differs; 1 removed and 1 added nonblank lines after heading/link/correction normalization.\nLinks: source 1, target 1; 1 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nSection accounting (existing-labelled-successor-correction): Existing correction labels L10-26 at immutable account abc:shard.json; Exact normalized nonblank line delta: removed ["lost body"]; added ["kept body"].';
 assert.deepEqual(audit(r,{accountOf:()=> 'L10-26 exact section account'}),[]);
});
test('independent equal-section facts reject replacement wording',()=>{
 assert.ok(audit('Section accounting (x): This records replacement.',{target:source}).some(f=>f.type==='equal-section-replacement'));
});
test('independent facts verify a named live carrier by whole lines',()=>{
 const r='Section accounting (split): Removed direct-section lines have distinct live carrier witnesses docs/platform/history.md#retained. Exact normalized nonblank line delta: removed ["lost body"]; added ["kept body"].';
 assert.ok(audit(r,{carrierOf:()=>({...source,text:'lost body extra',sectionText:'## S\nlost body extra'})}).some(f=>f.type==='removed-line-not-carried'));
 assert.deepEqual(audit(r,{carrierOf:()=>({...source,path:'docs/platform/history.md',anchor:'retained'})}),[]);
});

test('independent reverse carrier audit rejects reviewer fence, brace, separator and link-placeholder witnesses',()=>{
 const s={path:'docs/source.md',anchor:'s',text:'```js\nconst substance = true;\n}\n```\n|---|---|\n[Boundary](boundary.md)'},t={path:'docs/platform/spec.md',anchor:'t',text:'new body'};
 const carriers={real:'```js\nconst substance = true;\n}\n```\n|---|---|\n[Boundary](boundary.md)',fences:'```js\n}\n```\n|---|---|',link:'[Other](other.md)',exactlink:'[Boundary](boundary.md)',substring:'prefix const substance = true; suffix'};
 const rationale='Section accounting (split): Removed direct-section lines have distinct live carrier witnesses '+Object.keys(carriers).map(k=>'docs/platform/history.md#'+k).join(', ')+'. Added lines are explicit candidate declarations.';
 const f=auditRationaleFacts(rationale,{source:s,target:t,carrierOf:(path,anchor)=>({path,anchor,text:carriers[anchor]})});
 assert.deepEqual(f.filter(f=>f.type==='carrier-without-substantive-removed-line').map(f=>f.anchor),['fences','link','exactlink','substring']);
 assert.equal(f.filter(f=>f.type==='removed-line-not-carried').length,0);
 const missing=auditRationaleFacts('Section accounting (split): Removed direct-section lines have distinct live carrier witnesses docs/platform/history.md#missing. Added lines.',{source:s,target:t,carrierOf:()=>null});
 assert.ok(missing.some(f=>f.type==='carrier-without-substantive-removed-line'&&f.anchor==='missing'));
});
test('independent reverse carrier audit uses the raw link spelling inside substantive prose',()=>{
 const source={path:'docs/source.md',anchor:'s',text:'Read [Boundary](boundary.md) here.'},target={path:'docs/platform/spec.md',anchor:'t',text:'new body'};
 const rationale='Section accounting (split): Removed direct-section lines have distinct live carrier witnesses docs/platform/history.md#link. Added lines.';
 const result=spell=>auditRationaleFacts(rationale,{source,target,carrierOf:(path,anchor)=>({path,anchor,text:spell})});
 assert.ok(result('Read [Other](other.md) here.').some(f=>f.type==='carrier-without-substantive-removed-line'));
 assert.deepEqual(result(source.text),[]);
});
