// Read-only proof at current candidate bytes; no git/native mutation or CLI staging.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {read,json,sha,normalize,units,binding} from './units.mjs';
import {anchorExists} from '../../../../../scripts/list-doc-anchors.mjs';
import {checkCandidateMetadata} from '../../../../../scripts/check-doc-candidate-status.mjs';
const P='plans/260925-documentation-authority-unification',R=P+'/reports/phase-09/resync-b',shardPath=P+'/ledger/decisions/s14-resync-b.json';
const shard=json(shardPath),cache=new Map(),sourceCache=new Map();
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:64*1024*1024});
const get=p=>{if(!cache.has(p))cache.set(p,units(p));return cache.get(p);};
const source=p=>{if(!sourceCache.has(p))sourceCache.set(p,units(p,git('show',shard.sourcePin+':'+p)));return sourceCache.get(p);};
const pointer=(x,p)=>p.slice(1).split('/').reduce((v,k)=>v[k.replaceAll('~1','/').replaceAll('~0','~')],x);
function target(b){
 const u=get(b.targetOwner).find(u=>u.anchor===b.targetAnchor&&u.textDigest===b.targetUnitDigest);
 assert(u,'missing current target '+b.targetOwner+'#'+b.targetAnchor);
 const expected=binding(u);for(const k of Object.keys(expected))assert.deepEqual(b[k],expected[k],k+' mismatch');
 assert.equal(b.reviewStatus,'pending','author proof must not accept itself');return u;
}
const counts={};
for(const b of shard.unitCarries){
 const s=source(b.sourcePath).find(u=>u.anchor===b.sourceAnchor&&u.textDigest===b.sourceUnitDigest);
 assert(s,'missing pinned source '+b.sourcePath+'#'+b.sourceAnchor);assert.equal(s.content,b.sourceContent);assert.deepEqual(s.ancestry,b.sourceAncestry);
 const t=target(b),kind=b.disposition.kind;assert(kind!=='review-required');assert(b.disposition.reason.length>20);
 counts[kind]=(counts[kind]||0)+1;
 if(kind==='equivalent-current-content')assert.equal(normalize(t.content),normalize(s.content));
 if(kind==='source-content-in-candidate-envelope'||kind==='existing-literal-history')assert(normalize(t.content).includes(normalize(s.content)));
 if(kind==='existing-literal-history')assert(t.path.includes('/history/retired-engine/')&&t.content.startsWith('~~~~text\n'));
 if(kind==='post-retirement-edit-not-carried')assert(!t.content.startsWith('~~~~text\n'),'disposition witness, not a fake literal carry');
}
for(const b of shard.bindingRefresh){
 const t=target(b),p=b.supersedesBinding,old=pointer(json(p.shard),p.pointer);
 assert.equal(old.targetOwner,p.targetOwner);assert.equal(old.targetAnchor,p.targetAnchor);assert.equal(old.targetUnitDigest,p.targetUnitDigest);
 if(!b.conditionalTargetMaterialized){const u=source(old.targetOwner).find(u=>u.anchor===old.targetAnchor&&u.textDigest===old.targetUnitDigest);assert(u,'not a real preimage');assert.equal(sha(u.content),b.preimageContentSha256);}
 assert(t);
}
for(const h of shard.alreadySupersededHistoricalBindings){
 const prior=pointer(json(h.resolvedVia.shard),h.resolvedVia.pointer),p=prior.supersedesBinding;
 assert.equal(p.shard,h.shard);assert.equal(p.pointer||'/'+p.collection+'/'+p.index,h.pointer);assert.equal(p.targetAnchor,h.targetAnchor);assert.equal(p.targetUnitDigest,h.targetUnitDigest);
}
for(const w of shard.targetUnitWitnesses){const u=get(w.targetOwner).find(u=>u.anchor===w.anchor&&u.textDigest===w.unitDigest);assert(u);assert.equal(u.startLine,w.startLine);assert.equal(u.endLine,w.endLine);assert.equal(sha(u.content),w.contentSha256);assert.deepEqual(u.ancestry,w.ancestry);}
for(const d of shard.changedDocuments){assert.equal(sha(read(d.path)),d.afterSha256);assert.equal(sha(git('show',shard.sourcePin+':'+d.path)),d.beforeSha256);}
// Literal history stays byte-identical, even when a later source edit is adjudicated.
const history=[...new Set(shard.unitCarries.map(b=>b.targetOwner).filter(p=>p.includes('/history/retired-engine/')))];
for(const p of history)assert.equal(read(p),git('show',shard.sourcePin+':'+p));
const map='docs/reading-map.md',before=git('show',shard.sourcePin+':'+map),after=read(map),marker='## 5. Detailed Product And Source Map';
assert.equal(before.slice(0,before.indexOf(marker)),after.slice(0,after.indexOf(marker)),'L11-25 routing/banner prefix');
for(const prefix of ['- `domains/coding/AGENTS.md`','- `docs/how-to/`'])assert.equal(before.split('\n').find(l=>l.startsWith(prefix)),after.split('\n').find(l=>l.startsWith(prefix)),'compounding/knowledge entry retained');
const foundations='docs/platform/platform-foundations.md';
assert.deepEqual(read(foundations).split('\n').filter(l=>/^- \*\*RUL/.test(l)),git('show',shard.sourcePin+':'+foundations).split('\n').filter(l=>/^- \*\*RUL/.test(l)),'locked Business Rules unchanged');
for(const p of ['docs/platform/seat-binding/spec.md','docs/platform/workflow/spec.md']){
 const t=read(p);assert(t.startsWith('# Spec:'));assert(t.indexOf('Design status: Candidate')<t.indexOf('```yaml\n---\narea:'));assert.equal((t.match(/^area:/gm)||[]).length,1);
 const src=source(p.includes('seat-binding')?'docs/specs/seat-binding.md':'docs/specs/workflow.md')[0].content;
 assert(t.includes('```yaml\n'+src+'\n```'),'verbatim source YAML retained in fence');
}
assert.equal((read('docs/platform/work-state/contracts/knowledge-registry.md').match(/^Document type: Contract$/gm)||[]).length,1);
assert(!read('docs/platform/component-boundary.md').includes('../specs/workflow.md'));
assert(!/\]\(\.\.\/specs\/enduser-docs-(?:authoring|index)\.md/.test(read('docs/platform/component-boundary.md')));
const newLinks=[];
for(const d of shard.changedDocuments){
 const before=git('show',shard.sourcePin+':'+d.path),after=read(d.path);
 const linkRegex=/\[[^\]]*\]\(([^)\s]+)\)/g;
 const old=new Set([...before.matchAll(linkRegex)].map(m=>m[1]));
 for(const [,dest]of after.matchAll(linkRegex)){
  if(old.has(dest)||/^[a-z]+:|^#|^\//i.test(dest))continue;
  const [file,fragment]=dest.split('#'),resolved=path.posix.normalize(path.posix.join(path.posix.dirname(d.path),file));
  assert(fs.existsSync(resolved),'new link missing '+resolved);if(fragment)assert(anchorExists(read(resolved),fragment),'new fragment missing '+resolved+'#'+fragment);
  newLinks.push({file:d.path,destination:dest,resolved});
 }
}
const switchboard=json(P+'/transitional-switchboard.json'),constitution=json(P+'/minimum-constitution.json');
const pure=checkCandidateMetadata({files:shard.changedDocuments.map(d=>d.path),readFile:read,switchboard,constitution,repoRoot:process.cwd()});
// Existing links may be queued for cutover; reject newly introduced findings, not historical baselines.
const oldPure=checkCandidateMetadata({files:shard.changedDocuments.map(d=>d.path),readFile:p=>git('show',shard.sourcePin+':'+p),switchboard,constitution,repoRoot:process.cwd()});
const oldFindings=new Set(oldPure.findings.map(f=>JSON.stringify(f)));const introduced=pure.findings.filter(f=>!oldFindings.has(JSON.stringify(f)));assert.deepEqual(introduced,[],'introduced metadata/link findings');
const scan=json(R+'/legacy-drift.json');assert(scan.records.every(r=>(r.counts?.missingCurrent||0)===0));assert.equal(scan.counts.missingChangedUnits,0);
for(const r of scan.records){if(r.sourceSha256)assert.equal(sha(git('show',scan.head+':'+r.sourcePath)),r.sourceSha256);for(const t of r.candidateSuccessors)assert.equal(sha(read(t.path)),t.sha256);}
const baseline=json(R+'/baseline-resolution.json'),oldScan=json(baseline.baselineInput);
assert.equal(baseline.baselineMissing,594);assert.equal(baseline.rows.length,594);
for(const b of baseline.rows){
 const current=scan.records.find(r=>r.sourcePath===b.sourcePath),old=oldScan.records.find(r=>r.sourcePath===b.sourcePath);
 assert.equal(current.sourceSha256,old.sourceSha256,'legacy source drift after baseline');
 assert(old.missingCarriage.some(u=>u.sourceAnchor===b.sourceAnchor&&u.sourceUnitDigest===b.sourceUnitDigest));
 const u=current.units.find(u=>u.sourceAnchor===b.sourceAnchor&&u.sourceUnitDigest===b.sourceUnitDigest);
 assert.equal(u.status,b.finalStatus);assert.deepEqual(u.exactMatches,b.exactMatches);assert.deepEqual(u.adaptedBindings,b.adaptedBindings);
}
if(process.argv.includes('--scan'))execFileSync(process.execPath,[R+'/replay-scan.mjs','--check'],{stdio:['ignore','pipe','inherit']});
console.log(JSON.stringify({status:'pass',sourcePin:shard.sourcePin,sourceBindings:shard.unitCarries.length,rebindings:shard.bindingRefresh.length,priorHistoricalRowsResolved:shard.alreadySupersededHistoricalBindings.length,historyFilesUnchanged:history.length,dispositions:counts,newLinks,metadata:{counts:pure.counts,findings:pure.findings,newFindings:introduced},scanner:{files:scan.records.length,missingCurrent:scan.records.reduce((n,r)=>n+(r.counts?.missingCurrent||0),0),missingChanged:scan.counts.missingChangedUnits},limitations:['Author proof only; independent review pending.','Explicit-adapted-binding includes disposition witnesses; not every unit is literal or live carriage.','No runtime, Rust freshness, cutover or gate acceptance asserted.']},null,2));
