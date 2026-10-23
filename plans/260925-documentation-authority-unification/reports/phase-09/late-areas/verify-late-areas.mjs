// Read-only author verification; no git writes, CLI mutations, services or gate acceptance.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {extractMarkdownConservationUnits as extract} from '../../../../../scripts/generate-doc-inventory.mjs';
import {anchorExists} from '../../../../../scripts/list-doc-anchors.mjs';
import {checkCandidateMetadata,relativeLinkTargets,classifyDocumentStatus} from '../../../../../scripts/check-doc-candidate-status.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../../..');
const P='plans/260925-documentation-authority-unification', R=P+'/reports/phase-09/late-areas';
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const shard=json(P+'/ledger/decisions/s12-late-areas.json'), carriage=json(R+'/carriage.json');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
const rows=shard.unitCarries.filter(r=>r.kind==='source-unit-carriage');
const rebindings=shard.unitCarries.filter(r=>r.kind==='existing-target-rebinding');
assert.deepEqual(shard.claims,[],'additive records do not duplicate native disposition decisions');
assert.deepEqual(shard.registryGaps,[],'no invented registry-gap decisions');
const identities=json(P+'/reports/phase-06/working-identity-registry.json').units;
for(const row of rows){
 if(row.nativeClaimRef)assert(identities.some(i=>i.claimId===row.nativeClaimRef&&i.sourcePath===row.sourcePath&&i.sourceUnitDigest===row.sourceUnitDigest));
 else assert.equal(row.identityStatus,'unregistered-current-digest');
}
const witnesses=new Set();let equal=0,adapted=0;
function full(text){const stack=[];return extract(text).map(u=>{if(u.unitKind==='heading'){while(stack.length&&stack.at(-1).level>=u.level)stack.pop();stack.push(u);}return {...u,ancestry:stack.map(h=>h.title),content:text.split('\n').slice(u.startLine-1,u.endLine).join('\n').trim()};});}
function binding(row){const value=Object.fromEntries(['targetOwner','targetAnchor','targetUnitDigest','targetAncestry'].sort().map(k=>[k,row[k]??null]));assert.equal(sha(JSON.stringify(value)+'\n'),row.bindingSha256);}
for(const d of carriage.documents){
 assert.equal(sha(read(d.source)),d.sourceSha256,'source drift '+d.source);
 assert.equal(sha(read(d.target)),d.targetSha256,'candidate drift '+d.target);
 const sourceUnits=full(read(d.source));const matches=rows.filter(r=>r.sourcePath===d.source);
 assert.equal(matches.length,sourceUnits.length);assert.equal(d.sourceUnits,sourceUnits.length);
 for(const u of sourceUnits){
  const found=matches.filter(r=>r.sourceAnchor===u.anchor&&r.sourceUnitDigest===u.textDigest);
  assert.equal(found.length,1,'exactly one source binding '+u.anchor);
  const row=found[0],key=row.sourcePath+'#'+row.sourceAnchor;assert(!witnesses.has(key));witnesses.add(key);
  assert.equal(row.sourceContent,u.content);assert.deepEqual(row.sourceAncestry,u.ancestry);
  const target=full(read(row.targetOwner)).find(t=>t.anchor===row.targetAnchor);
  assert(target);assert.equal(target.textDigest,row.targetUnitDigest);assert.equal(target.content,row.placement.content);assert.deepEqual(target.ancestry,row.targetAncestry);
  assert(anchorExists(read(row.targetOwner),row.targetAnchor));binding(row);
  if(u.textDigest===target.textDigest)equal++;else adapted++;
  assert.equal(row.reviewStatus,'pending');
 }
 if(d.target!== 'docs/platform/work-state/contracts/knowledge-registry.md'){
  let expected=read(d.source);
  for(const change of carriage.linkChanges.filter(c=>c.source===d.source)){
   const lines=expected.split('\n');
   const line=lines[change.line-1];assert(line.includes(']('+change.original+')'));
   lines[change.line-1]=line.replaceAll(']('+change.original+')',']('+change.target+')');expected=lines.join('\n');
  }
  const withoutHeader=read(d.target).replace(/^(# .+)\n+```txt\n[\s\S]*?\n```\n\n/m,'$1\n\n');
  assert.equal(withoutHeader,expected,'complete prose equality, except enumerated link edits');
 }else{
  const source=read(d.source), end=source.indexOf('\n---\n',4)+5;
  const fm=source.slice(0,end).trimEnd(), body=source.slice(end).trimStart();
  const section=body.split('\n').map(l=>/^#{1,5} /.test(l)?'#'+l:l).join('\n'), first=section.indexOf('\n');
  const expected=section.slice(0,first)+'\n\n```yaml\n'+fm+'\n```\n'+section.slice(first);
  assert(read(d.target).includes(expected),'full end-user source carriage, metadata and prose');
 }
}
for(const row of rebindings){
 binding(row);const target=full(read(row.targetOwner)).find(u=>u.anchor===row.targetAnchor);assert(target);assert.equal(target.textDigest,row.targetUnitDigest);assert.deepEqual(target.ancestry,row.targetAncestry);assert.equal(target.content,row.after.content);
 const prior=json(row.supersedesBinding.shard)[row.supersedesBinding.collection][row.supersedesBinding.index];
 assert.equal(prior.targetUnitDigest,row.supersedesBinding.targetUnitDigest);assert.equal(prior.targetAnchor,row.supersedesBinding.targetAnchor);
 const original=full(git('show',shard.sourcePin+':'+row.targetOwner)).find(u=>u.anchor===prior.targetAnchor);
 assert.equal(original.textDigest,prior.targetUnitDigest);
}
const knowledge='docs/platform/work-state/contracts/knowledge-registry.md';
const oldKnowledge=git('show',shard.sourcePin+':'+knowledge);
const beforeAppend=read(knowledge).split('\n## End-user documentation carriage\n')[0].replace(/^(# .+)\n+```txt\n[\s\S]*?\n```\n\n/m,'$1\n\n');
assert.equal(beforeAppend,oldKnowledge,'all existing registry prose and constraints retained');
const component='docs/platform/component-boundary.md';let expectedComponent=git('show',shard.sourcePin+':'+component);
const oldLines=expectedComponent.split('\n');const expectedLines=oldLines.map(line=>{
 if(line.startsWith('| Workflow ('))return line.replaceAll('](../specs/workflow.md)','](workflow/spec.md)').replace('[../specs/workflow.md]','[workflow/spec.md]');
 if(line.startsWith('| Seat Binding ('))return line.replaceAll('](../specs/seat-binding.md)','](seat-binding/spec.md)').replace('[../specs/seat-binding.md]','[seat-binding/spec.md]');
 return line;
});
assert.equal(read(component),expectedLines.join('\n'),'only links in two authorized component rows changed');
const board=json(P+'/transitional-switchboard.json'),constitution=json(P+'/minimum-constitution.json');
const targets=[...new Set(carriage.documents.map(d=>d.target))];
const metadata=checkCandidateMetadata({files:targets,readFile:read,switchboard:board,constitution,repoRoot:root});
assert.deepEqual(metadata.findings,[]);
for(const target of targets)assert.equal(classifyDocumentStatus(target,board),'candidate');
const originalBoard=JSON.parse(git('show',shard.sourcePin+':'+P+'/transitional-switchboard.json'));
const restored=structuredClone(board);restored.areas=restored.areas.filter(a=>!['Seat Binding','Workflow'].includes(a.area));
for(const area of restored.areas)for(const key of ['currentRoutes','scopedRoutes'])for(const row of area[key]||[])if(row.route==='docs/specs/enduser-docs-authoring.md'||row.route==='docs/specs/enduser-docs-index.md'){delete row.candidateSuccessor;delete row.successorStatus;delete row.authority;}
assert.deepEqual(restored,originalBoard,'all other switchboard rows and statuses retained');
const routes=[];
for(const area of board.areas)for(const row of area.currentRoutes||[])if(row.candidateSuccessor){
 const [file,anchor]=row.candidateSuccessor.split('#');assert(fs.existsSync(path.join(root,file)));if(anchor)assert(anchorExists(read(file),anchor));routes.push(row);
}
for(const d of carriage.documents)assert(routes.some(r=>r.route===d.source&&r.candidateSuccessor.split('#')[0]===d.target),'explicit successor route '+d.source);
const links=[];
for(const file of targets)for(const rel of relativeLinkTargets(read(file))){const target=path.posix.normalize(path.posix.join(path.posix.dirname(file),rel));assert(fs.existsSync(path.join(root,target)),target);assert(!/^(docs\/specs|docs\/architect)\//.test(target),'new relative link into retiring tree '+target);links.push({file,rel,target});}
const result={version:1,status:'author-verification-pass; independent review pending',sourcePin:shard.sourcePin,sourceUnits:rows.length,equalNativeDigests:equal,adaptedNativeDigests:adapted,registeredIdentityRefs:rows.filter(r=>r.nativeClaimRef).length,currentIdentityGaps:shard.nativeIdentityGaps.length,additiveRebindings:rebindings.length,candidateMetadata:metadata,successorRoutes:routes.length,checkedRelativeLinks:links.length,checks:['one current binding per native source unit including front matter and heading context','source and target complete unit digests, content, ancestry and binding hashes','verbatim full-source reconstruction except enumerated header/link/heading-depth adaptations','old registry prose unchanged after removing added candidate header','only Seat Binding and Workflow row links changed in component-boundary','switchboard statuses and unrelated rows unchanged; explicit successor files and anchors resolve','all new candidate markdown links resolve without retiring-tree destinations'],needsWrites:[]};
console.log(JSON.stringify(result,null,2));
