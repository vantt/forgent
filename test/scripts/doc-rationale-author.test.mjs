import test from 'node:test';
import assert from 'node:assert/strict';
import * as h from '../../scripts/doc-binding-repair.mjs';
const unit=(anchor,text='same')=>({path:'source.md',anchor,text,textDigest:'a'.repeat(64),startLine:1,endLine:1});
test('frozen reviewed rationale survives regeneration until a binding changes',()=>{
 const row={claimId:'c',sourceUnitDigest:'aaa',targetOwner:null,targetAnchor:null,rationale:'deliberate full rationale'};
 assert.equal(h.frozenRationale(row,[{...row}]),row.rationale);
 assert.equal(h.frozenRationale({...row,sourceUnitDigest:'bbb'},[{...row}]),null);
 const located={...row,sourcePath:'source.md',sourceAnchor:'first',targetAncestry:['old']};
 assert.equal(h.frozenRationale({...located,sourceAnchor:'second'},[located]),null);
 assert.equal(h.frozenRationale({...located,targetAncestry:['new']},[located]),null);
});
test('identical source occurrences require their own anchor or authenticated historical ordinal',()=>{
 const before=[unit('block-1'),unit('block-2')],current=[unit('block-7'),unit('block-8')];
 const row={claimId:'second',sourceAnchor:'block-2',sourceUnitDigest:'a'.repeat(64)};
 assert.equal(h.resolveSourceOccurrence(row,current,before).anchor,'block-8');
 assert.throws(()=>h.resolveSourceOccurrence(row,current,[]),/ambiguous/i);
 assert.throws(()=>h.auditSourceOccurrences([{claimId:'one',source:current[0]},{claimId:'two',source:current[0]}]),/distinct/i);
});
test('heading comparison uses complete direct section and detects unlabelled payload loss',()=>{
 const source={...unit('s','## Same'),level:2,sectionText:'## Same\nold body'},target={...unit('t','#### Same'),level:4,sectionText:'#### Same\nnew body'};
 const result=h.describeSectionChange(source,target,[]);
 assert.equal(result.equal,false);assert.equal(result.depthChanged,true);
 assert.deepEqual(result.unexplainedRemoved,['old body']);assert.deepEqual(result.unexplainedAdded,['new body']);
 const labelled=h.describeSectionChange(source,target,[{before:'old body',after:'new body'}]);
 assert.deepEqual(labelled.unexplainedRemoved,[]);assert.deepEqual(labelled.unexplainedAdded,[]);
});
test('heading body equality and link rebases are explained independently of depth',()=>{
 const source={...unit('s','## Same'),level:2,sectionText:'## Same\n[ref](old.md)'},target={...unit('t','#### Same'),level:4,sectionText:'#### Same\n[ref](../old.md)'};
 const result=h.describeSectionChange(source,target,[]);
 assert.equal(result.equal,false);assert.equal(result.depthChanged,true);assert.equal(result.linkChanges,1);
 assert.deepEqual(result.unexplainedRemoved,[]);assert.deepEqual(result.unexplainedAdded,[]);
});
test('correction before must occur in its own bound source or identify an intermediate witness',()=>{
 const c={id:'fix',before:'intermediate',after:'final'};
 assert.throws(()=>h.validateCorrection(c,unit('s','original'),unit('t','final')),/before/i);
 assert.doesNotThrow(()=>h.validateCorrection({...c,before:'original'},unit('s','original'),unit('t','final')));
 assert.throws(()=>h.validateCorrection({...c,intermediate:true},unit('s','original'),unit('t','final')),/witness/i);
});
test('removed and added unrelated links are two changes and repeated changes are distinct pairs',()=>{
 const source={path:'docs/source.md',text:'[old](old.md)'},target={path:'docs/target.md',text:'[new](new.md)'};
 const links=h.describeBindingLinks(source,target);
 assert.equal(links.changes.length,2);assert.equal(links.changes.filter(c=>!c.after).length,1);assert.equal(links.changes.filter(c=>!c.before).length,1);
 const repeated=h.describeBindingLinks({...source,text:'[x](old.md) [x](old.md)'},{...target,text:'[x](new.md) [x](new.md)'});
 assert.equal(repeated.changes.length,1);assert.equal(repeated.changes[0].occurrences,2);
});
test('whole-section audit cannot clear an unexplained delta with a generic reason',()=>{
 const d={unexplainedRemoved:['lost body'],unexplainedAdded:[]};
 assert.ok(h.checkSectionExplanation(d,{kind:'supersede',reason:'successor differs'}).length);
 assert.deepEqual(h.checkSectionExplanation(d,{kind:'split',removedWitnesses:[{text:'lost body',path:'restored.md',anchor:'restored'}],addedWitnesses:[]}),[]);
 assert.ok(h.checkSectionExplanation(d,{kind:'split',removedWitnesses:[{text:'wrong body',path:'restored.md',anchor:'restored'}]}).length);
});
test('whole-section comparison reports reordered lines even with identical line multisets',()=>{
 const source={...unit('s','## Same'),level:2,sectionText:'## Same\nfirst\nsecond'},target={...unit('t','## Same'),level:2,sectionText:'## Same\nsecond\nfirst'};
 const d=h.describeSectionChange(source,target,[]);
 assert.equal(d.equal,false);assert.equal(d.normalizedOrderEqual,false);
});
test('whole-section normalization applies complete corrections before overlapping fragments',()=>{
 const source={...unit('s','## Same'),level:2,sectionText:'## Same\nold start old end'},target={...unit('t','## Same'),level:2,sectionText:'## Same\nnew start new end'};
 const d=h.describeSectionChange(source,target,[{before:'old start',after:'new start'},{before:'old start old end',after:'new start new end'}]);
 assert.deepEqual(d.unexplainedRemoved,[]);assert.deepEqual(d.unexplainedAdded,[]);
});
test('a repository directory trailing slash is a spelling change with the same destination',()=>{
 const d=h.describeBindingLinks({path:'docs/source.md',text:'[guide](user/)'},{path:'docs/platform/target.md',text:'[guide](../user)'});
 assert.equal(d.changes.length,1);assert.equal(d.changes[0].before,d.changes[0].after);
});
test('secondary section-accounting carriers do not masquerade as the primary source anchor',()=>{
 const source=unit('primary'),text='Source source.md#primary.\nSection accounting (split): source.md#secondary carries the remainder.';
 assert.deepEqual(h.checkLegacyRationale(text,{source,target:null}),[]);
 assert.ok(h.checkLegacyRationale(text.replace('#primary','#wrong'),{source,target:null}).length);
});
