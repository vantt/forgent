import test from 'node:test';
import assert from 'node:assert/strict';
import { bindByContent, updateRationale, targetCollisions, replayLinks } from '../../scripts/doc-binding-repair.mjs';
const unit=(anchor,text,ancestry=[])=>({anchor,text,textDigest:text,ancestry});
test('inserted paragraphs move anchors without substituting neighbouring text',()=>{
 const before=[unit('block-1','A'),unit('block-2','B')],now=[unit('block-1','new'),unit('block-2','A'),unit('block-3','B')];
 assert.equal(bindByContent({targetAnchor:'block-2',targetUnitDigest:'B'},before,now).anchor,'block-3');
});
test('identical footers keep their occurrence within the prior content sequence',()=>{
 const before=[unit('b1','A'),unit('b2','footer'),unit('b3','B'),unit('b4','footer')];
 const now=[unit('b1','new'),unit('b2','A'),unit('b3','footer'),unit('b4','B'),unit('b5','footer')];
 assert.equal(bindByContent({targetAnchor:'b4',targetUnitDigest:'footer'},before,now).anchor,'b5');
});
test('ambiguous or absent content fails closed instead of retaining old anchor',()=>{
 assert.throws(()=>bindByContent({targetAnchor:'b1',targetUnitDigest:'A'},[],[unit('b1','B')]),/content/);
});
test('unchanged bindings never overwrite truthful rationale',()=>{
 const row={targetOwner:'a',targetAnchor:'b',targetUnitDigest:'x',rationale:'Retain in place.'};
 assert.equal(updateRationale(row,{...row},'Boilerplate'),row.rationale);
 assert.throws(()=>updateRationale(row,{...row,targetUnitDigest:'y'},''),/specific/);
});
test('ownership check reports two distinct claims at one target',()=>{
 assert.equal(targetCollisions([{claimId:'a',targetOwner:'p',targetAnchor:'b'},{claimId:'b',targetOwner:'p',targetAnchor:'b'}]).length,1);
});
test('position-exact link replay rejects swapped table cells despite string presence',()=>{
 const before='| [Legacy source](old.md) | [Candidate](new.md) |';
 assert.deepEqual(replayLinks(before,before,[]),[]);
 assert.equal(replayLinks(before,'| [Legacy source](new.md) | [Candidate](old.md) |',[]).length,2);
 assert.deepEqual(replayLinks(before,'| [Legacy source](old.md) | [Candidate](better.md) |',[{line:1,index:1,label:'Candidate',before:'new.md',after:'better.md'}]),[]);
});
test('stale prior anchor uses reviewed ancestry to distinguish repeated footer text',()=>{
 const row={targetAnchor:'b2',targetUnitDigest:'footer',targetAncestry:['second']};
 const current=[unit('b2','footer',['first']),unit('b4','footer',['second'])];
 assert.equal(bindByContent(row,[unit('b1','footer',['first']),unit('b3','footer',['second'])],current).anchor,'b4');
});
test('expanding digest prefixes or shifting an unchanged content anchor preserves rationale',()=>{
 const before={sourceUnitDigest:'s'.repeat(32),targetOwner:'p',targetAnchor:'b2',targetUnitDigest:'a'.repeat(32),rationale:'Whole source retained.'};
 assert.equal(updateRationale(before,{...before,sourceUnitDigest:'s'.repeat(64),targetAnchor:'b3',targetUnitDigest:'a'.repeat(64)},'Untrue target changed boilerplate'),before.rationale);
});
test('repeated content with a stale anchor and no ancestry is rejected rather than taking occurrence one',()=>{
 const before=[unit('b1','footer'),unit('b2','other'),unit('b3','footer')];
 assert.throws(()=>bindByContent({targetAnchor:'b2',targetUnitDigest:'footer'},before,[unit('b2','footer'),unit('b4','footer')]),/content/);
});
