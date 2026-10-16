import test from 'node:test';
import assert from 'node:assert/strict';
import { generateBindingRationale, checkBindingRationale } from '../../scripts/doc-binding-repair.mjs';
const digest=c=>c.repeat(64);
const facts=()=>({disposition:'supersede',reason:'Replace the historical behavior with the labelled correction.',source:{path:'docs/old.md',anchor:'old',startLine:12,endLine:14,text:'## Old\n[ref](other.md)\nold behavior',sectionText:'## Old\n[ref](other.md)\nold behavior',textDigest:digest('a'),level:2},target:{path:'docs/platform/new.md',anchor:'new',startLine:31,endLine:33,text:'### New\n[ref](../other.md)\ndurable status',sectionText:'### New\n[ref](../other.md)\ndurable status',textDigest:digest('b'),level:3},lastReviewed:{commit:'abc123',targetUnitDigest:digest('b')},links:{sourceCount:1,targetCount:1,changes:[{index:0,before:'docs/other.md',after:'docs/other.md',beforeSpelling:'other.md',afterSpelling:'../other.md',beforeLabel:'ref',afterLabel:'ref'}]},corrections:[{id:'U3',before:'old behavior',after:'durable status',evidence:'src/state/store.mjs:1388-1420'}]});
test('rationale is rebuilt from bound facts without appending false old text',()=>{
 const f=facts(),text=generateBindingRationale({...f,rationale:'byte-identical pending native rebind'});
 assert.match(text,/docs\/old.md:12-14#old/);assert.match(text,/docs\/platform\/new.md:31-33#new/);
 assert.match(text,/U3/);assert.match(text,/durable status/);assert.match(text,/2 → 3/);
 assert.match(text,/unchanged since last reviewed/);assert.doesNotMatch(text,/byte-identical|pending native rebind/);
 assert.deepEqual(checkBindingRationale(text,f),[]);
});
test('full unit digest decides equality, including heading section payload',()=>{
 const f=facts();f.target.text=f.source.text;
 assert.match(generateBindingRationale(f),/Source and target unit digests differ/);
 f.target.textDigest=f.source.textDigest;
 assert.match(generateBindingRationale(f),/Source and target unit digests equal/);
});
test('last review comparison accepts digest prefix expansion and reports changes',()=>{
 const f=facts();f.lastReviewed.targetUnitDigest=digest('b').slice(0,32);
 assert.match(generateBindingRationale(f),/unchanged since last reviewed/);
 f.lastReviewed.targetUnitDigest=digest('c');assert.match(generateBindingRationale(f),/changed since last reviewed/);
 f.lastReviewed=null;assert.match(generateBindingRationale(f),/No prior reviewed target digest available/);
});
test('link count distinguishes actual destination changes from spelling rebases',()=>{
 const f=facts();let t=generateBindingRationale(f);
 assert.match(t,/Links: source 1, target 1; 1 changed spellings\/labels, 0 destination changes/);
 f.links.changes[0].after='docs/platform/other.md';t=generateBindingRationale(f);
 assert.match(t,/1 destination changes/);assert.match(t,/docs\/other.md → docs\/platform\/other.md/);
});
test('consistency flags changed ranges, anchors, equality and reviewed digest assertions',()=>{
 const f=facts(),t=generateBindingRationale(f);
 for(const altered of [t.replace(':12-14#old',':10-12#old'),t.replace('#new','#stale'),t.replace('digests differ','digests equal'),t.replace('unchanged since last reviewed','changed since last reviewed')]) assert.ok(checkBindingRationale(altered,f).length);
});
test('historical witness and no-target retain do not invent current source ranges',()=>{
 const f=facts();f.source={...f.source,commit:'old-pin'};f.target=null;f.corrections=[];f.lastReviewed=null;f.links={sourceCount:1,targetCount:0,changes:[]};f.reason='The instruction file remains its existing owner.';
 const t=generateBindingRationale(f);assert.match(t,/historical witness at old-pin/);assert.match(t,/Target: none/);assert.doesNotMatch(t,/pending independent review/);
});
test('missing or mismatched binding evidence fails rather than inventing facts',()=>{
 const f=facts();delete f.source.textDigest;assert.throws(()=>generateBindingRationale(f),/source/);
 const g=facts();g.reason='';assert.throws(()=>generateBindingRationale(g),/reason/);
});
test('legacy consistency checks contextual ranges, anchors and equality without mistaking header citations for bound spans',async()=>{
 const {checkLegacyRationale}=await import('../../scripts/doc-binding-repair.mjs');const f=facts();
 assert.ok(checkLegacyRationale('The whole unit docs/old.md#old (source lines 10-12) is carried at docs/platform/new.md#stale (candidate lines 20-22). The full native unit digest is equal.',f).length>=3);
 assert.deepEqual(checkLegacyRationale('Source lines 3–19 record historical metadata. The whole unit docs/old.md#old (source lines 12-14) is carried at docs/platform/new.md#new (candidate lines 31-33).',f),[]);
 assert.ok(checkLegacyRationale('Body is carried byte-identical (checked line by line, no link rewrite).',f).length);
});
test('legacy audit understands unicode anchors, same-file successors and explicitly quoted prior rationales',async()=>{
 const {checkLegacyRationale}=await import('../../scripts/doc-binding-repair.mjs');const f=facts();
 f.source.anchor='ranh-giới';assert.deepEqual(checkLegacyRationale('docs/old.md#ranh-giới',f),[]);
 f.target.path=f.source.path;assert.deepEqual(checkLegacyRationale('Source docs/old.md#ranh-giới replaced by docs/old.md#new',f),[]);
 assert.deepEqual(checkLegacyRationale('Current historical snapshot. Prior rationale: selected unit is byte-equal; docs/old.md#older',f),[]);
});
test('unavailable historical text remains an explicit witness limit without invented line numbers',()=>{
 const f=facts();f.corrections=[];f.source={path:'AGENTS.md',anchor:'old-heading',textDigest:digest('a'),unavailable:true};f.target=null;f.links={sourceCount:null,targetCount:0,changes:[]};f.lastReviewed=null;
 const t=generateBindingRationale(f);assert.match(t,/historical text\/line witness unavailable/);assert.match(t,/AGENTS.md#old-heading/);assert.doesNotMatch(t,/AGENTS.md:1/);
});
test('link alignment counts inserted provenance separately from repointed links',async()=>{
 const {describeBindingLinks}=await import('../../scripts/doc-binding-repair.mjs');
 const s={path:'docs/old.md',text:'[A](a.md) [B](b.md)'};
 const t={path:'docs/platform/new.md',text:'[original source](../old.md) [A](../a.md) [B](new-b.md)'};
 const f=describeBindingLinks(s,t);assert.equal(f.sourceCount,2);assert.equal(f.targetCount,3);
 assert.equal(f.changes.filter(x=>x.before&&x.after&&x.before!==x.after).length,1);
 assert.equal(f.changes.filter(x=>!x.before).length,1);
 assert.ok(f.changes.some(x=>x.before==='docs/b.md'&&x.after==='docs/platform/new-b.md'));
 const renamed=describeBindingLinks({path:'docs/old.md',text:'[docs/doc-governance.md](doc-governance.md)'},{path:'docs/platform/new.md',text:'[docs/platform/governance.md](governance.md)'});
 assert.equal(renamed.changes.length,2);assert.ok(renamed.changes.some(c=>c.after==='docs/platform/governance.md')); // unrelated removal and addition remain distinct
});
test('bound related citations include their actual lines and exact text',()=>{
 const f=facts();f.references=[{path:'docs/platform/component-boundary.md',line:46,text:'Draft authority map'}];
 const text=generateBindingRationale(f);assert.match(text,/component-boundary.md:46/);assert.match(text,/Draft authority map/);
 assert.ok(checkBindingRationale(text.replace(':46',':40'),f).length);
});
test('review entry snapshots use the committed row for both after and currentDecision',async()=>{
 const {reviewEntryFromCommittedRow}=await import('../../scripts/doc-binding-repair.mjs');
 const row={claimId:'claim_a',sourceUnitDigest:'a'.repeat(64),rationale:'final rationale',authoredBy:'author'};
 const entry={claimId:'claim_a',after:{rationale:'intermediate'},currentDecision:{rationale:'intermediate'}};
 const result=reviewEntryFromCommittedRow(entry,row,'abc123');
 assert.deepEqual(result.after,row);assert.deepEqual(result.currentDecision,row);
 assert.equal(result.currentContentCommit,'abc123');assert.equal(result.authorSession,'author');
 assert.equal(reviewEntryFromCommittedRow({...entry,after:'old rationale'},row,'abc123').after,'final rationale');
 assert.throws(()=>reviewEntryFromCommittedRow(entry,row,''),/commit/);
 assert.throws(()=>reviewEntryFromCommittedRow(entry,{...row,claimId:'other'},'abc123'),/claim/);
});
test('legacy citation audit distinguishes described links from the unit binding itself',async()=>{
 const {checkLegacyRationale}=await import('../../scripts/doc-binding-repair.mjs');const f=facts();
 assert.deepEqual(checkLegacyRationale('Link 1: resolved docs/old.md#another-unit → docs/platform/new.md#linked-unit.\nSource docs/old.md#old.',f),[]);
 assert.ok(checkLegacyRationale('Source docs/old.md#stale.',f).length);
});
test('residual sibling references are checked as residual facts rather than the primary unit anchor',async()=>{
 const {checkLegacyRationale}=await import('../../scripts/doc-binding-repair.mjs');const f=facts();
 assert.deepEqual(checkLegacyRationale('Source docs/old.md#old. Recorded residual: docs/old.md#sibling (claim_other).',f),[]);
 assert.ok(checkLegacyRationale('Source docs/old.md#stale. Recorded residual: docs/old.md#sibling.',f).length);
});
test('a historical target is never presented as a current target or as no mapped copy',()=>{
 const f=facts();f.target={...f.target,commit:'historical-pin'};
 let text=generateBindingRationale(f);assert.match(text,/Target:.*historical witness at historical-pin/);
 f.corrections=[];f.target={path:'docs/platform/new.md',anchor:'removed',textDigest:digest('b'),unavailable:true};f.links.targetCount=null;
 text=generateBindingRationale(f);assert.match(text,/Target:.*historical text\/line witness unavailable/);assert.doesNotMatch(text,/Target: none/);
});
test('declared historical target identity disambiguates same-file source and successor references',async()=>{
 const {checkLegacyRationale}=await import('../../scripts/doc-binding-repair.mjs');const f=facts();
 assert.deepEqual(checkLegacyRationale('Account for docs/old.md#old under docs/old.md#removed-target.',{source:f.source,target:null,targetIdentity:{path:'docs/old.md',anchor:'removed-target'}}),[]);
 assert.ok(checkLegacyRationale('Source docs/old.md#wrong.',{source:f.source,target:null,targetIdentity:{path:'docs/old.md',anchor:'removed-target'}}).length);
});
test('overlapping labelled corrections are composed to current bound text before selection',async()=>{
 const {bindingCorrections}=await import('../../scripts/doc-binding-repair.mjs');
 const target={path:'docs/platform/spec.md',text:'id optional; required title, kind'};
 const records=[{path:target.path,id:'U8 id',before:'id required',after:'id optional; required title'},{path:target.path,id:'U8 flags',before:'required title',after:'required title, kind'}];
 const corrections=bindingCorrections(target,records);assert.equal(corrections.length,2);
 assert.equal(corrections[0].after,target.text);assert.deepEqual(corrections[0].composedWith,['U8 flags']);
 assert.equal(bindingCorrections({...target,text:'unrelated'},records).length,0);
});
