"""R27/R28: apply the nine batch-7 review rulings to records only."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,copy,subprocess,hashlib,functools,importlib.util,re
P=pathlib.Path(__file__).resolve().parent; ROOT=P.parents[3]
def read(f):return json.loads((P/f).read_text())
def save(f,x):(P/f).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def sha(x):return hashlib.sha256((x.encode() if isinstance(x,str) else x)).hexdigest()
def items(r):return r['references']+r['dynamicTraces']+r.get('authorAddedReferences',[])
def ident(e):return e.get('referenceId',e.get('id'))
@functools.lru_cache(None)
def body(rpin,f):return subprocess.check_output(['git','show',rpin+':'+f],cwd=ROOT,text=True)
def module(n,f):
 s=importlib.util.spec_from_file_location(n,P/f);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m

def main():
 records={f.name:[json.loads(l) for l in f.open()] for f in sorted((P/'step-05-records').glob('*.jsonl'))};before=copy.deepcopy(records);by={r['file']:r for rs in records.values() for r in rs};ids={ident(e):(r,e) for r in by.values() for e in items(r)}
 def source(r):return body(r['authorInputCommit'],r['file'])
 def reject(id,cat,why):
  r,e=ids[id];e.update(admission='REJECT',disposition='preserve',nonDocumentUse=cat,pathOperand=None,role='non-document-operation',reason='L12-85/R27/R28: '+why,blockedReason=None,blockedCategory=None,dependency=None,dependencyCategory=None,stateExportDependency=None,blockedSeams=[],timing='none',target=None,anchor=None,diffHunk=None)
  e.pop('r26Unit',None);e.pop('pathOperandWitness',None);e['rejectedAsUnrelatedReason']=e['reason']+' Own operand: '+repr(e.get('originalTuple',[None]*5)[4]);e['reason']=e['rejectedAsUnrelatedReason'];return r,e
 def witness(r,e,operand):
  n=e.get('currentLine') or e['sourceSpans'][0]['line'];ls=source(r).splitlines();k=ls[n-1].index(operand)
  e.update(pathOperand=operand,pathOperandWitness={'line':n,'columnStart':k+1,'columnEndExclusive':k+len(operand)+1,'text':operand})
 def park(id,path,why,operand=None):
  r,e=ids[id];dep='Phase 9 retention-or-move decision for '+path;e.update(admission='ADMIT',disposition='parked',nonDocumentUse=None,role='emitted-document-path' if 'output' in why or 'message' in why else 'document-reader',timing='phase9',diffHunk=None,blockedReason=r['file']+': '+why,blockedCategory='proposed-move-decision',dependency=dep,dependencyCategory='phase9-retention-or-move',r26Unit=path,reason='L12-85/R28: '+why,resolverWitness={'inputCommit':r['authorInputCommit'],'path':path,'scope':'Proposed move unresolved; pin-bound reader/output unit','treeRetires':False})
  if 'originalTuple' in e:
   e.update(stateExportDependency=dep,blockedSeams=['phase9','step7-final-assembly'])
   if operand:witness(r,e,operand)
  return r,e
 def added(file,n,operand,id,prototype=None):
  r=by[file];ls=source(r).splitlines();k=ls[n-1].index(operand);base=copy.deepcopy(prototype or next(e for e in items(r) if 'referenceId' in e))
  base.update(referenceId=id,inventoryOrigins=[],originalSourceSpans=[],sourceSpans=[{'line':n,'columnStart':k+1,'columnEndExclusive':k+len(operand)+1,'text':operand}],matchedExpression=operand,passage='\n'.join(ls[max(0,n-3):n+2]),passageSpan={'startLine':max(1,n-2),'endLine':min(len(ls),n+2)},receiptId=r['receiptIds'][0]);base.pop('r26Unit',None);r.setdefault('authorAddedReferences',[]).append(base);ids[id]=(r,base);return r,base
 # Review p01: fixed-path probes, messages, outputs and missing help slot.
 r,e=added('src/cli/command-registry.mjs',861,'docs/enduser-docs-index.json','author-s67-command-registry-manifest-861');park(ident(e),'docs/enduser-docs-index.json','Emitted decision-index help output names the same generated manifest as L1725; co-cut both help slots with its generator and path decision.')
 for id,path,operand in [
 ('author-s4-fix2-70cc3f725650c613','docs/decisions/index.md',None),('dynamic-014343','docs/decisions/index.md','result.path'),('dynamic-014344','docs/decisions/index.md','result.path'),
 ('author-s4-fix2-2a45460821f48dec','docs/enduser-docs-index.json',None),('dynamic-014318','docs/enduser-docs-index.json','manifestPathFor(root)'),('dynamic-014329','docs/enduser-docs-index.json','manifestRelPath'),('dynamic-014330','docs/enduser-docs-index.json','manifestRelPath'),
 ('dynamic-013986','docs/architecture-manifest.json','manifestPath'),('dynamic-013987','docs/architecture-manifest.json','manifestPath'),
 ('dynamic-009759','docs/decisions/index.md','path.relative(repoRoot, indexPath)'),('dynamic-009760','docs/decisions/index.md','path.relative(repoRoot, indexPath)'),
 ('dynamic-009772','docs/enduser-docs-index.json','path.relative(repoRoot, manifestPath)'),('dynamic-009773','docs/enduser-docs-index.json','path.relative(repoRoot, manifestPath)')]:
  r,e=ids[id];park(id,path,'Pinned probe/message/result output carries '+path+' from its owning path provider; resolve with every reader and emitted output in the one R26 unit.',operand)
 reject('dynamic-014342','caller-data-formatting','The skipped error message formats err.message; its fixed-path refusal is owned by decision-index dynamic-009758, not this scalar formatter.')
 reject('dynamic-014002','scalar-pass-through','options.manifestPath is scalar option pass-through; default construction at L458 is already owned by dynamic-013983..013985.')
 # p02: basename and caller-data diagnostics are not fixed document-path outputs.
 for id in ['dynamic-021544','dynamic-021550','dynamic-021551']:reject(id,'caller-data-formatting','Diagnostic formats '+('entry.docPath manifest caller data' if id.endswith('544') else 'file basename from readdir')+'; it constructs no fixed document root. Real reads retain their parks.')
 for id in ['reference-004321','reference-004346']:park(id,'docs/decisions/index.md','Baseline title at L316 follows the same parked alias/membership reader as L373 title; title changes only with the owning generator/read unit.')
 r,e=ids['dynamic-021543'];e['dependency']='enduser-index-alias-membership-and-explanation-move';e['dependencyCategory']='generator-cutover'
 for id in ['dynamic-021516','dynamic-021517','dynamic-021518','dynamic-021519']:
  r,e=ids[id];e['reason']='L12-85: real docs/tutorials rename-aside/read/restore operation. The move-set has zero tutorials entries; no index/frontmatter assertion is attributed to this passage.'
 # p03: hidden governanceBaselineFields real reads must join governance unit.
 f='test/scripts/check-doc-candidate-status.test.mjs';r=by[f]
 for n in [94,163]:
  src=source(r).splitlines()[n-1]
  print('governance slot',n,src)
  if 'governanceBaselineFields(REPO_ROOT)' in src:
   operand='governanceBaselineFields(REPO_ROOT)';id='author-s67-governance-baseline-'+str(n);added(f,n,operand,id);park(id,'docs/doc-governance.md','governanceBaselineFields(REPO_ROOT) calls the production governance-file reader while constructing this candidate-status test input; include the transitive real read and unchanged assertions.')
 # p09: provenance header never shares the L31 enumeration park.
 for id in ['reference-004039','reference-004041']:
  r,e=ids[id];e.update(disposition='preserve',timing='none',blockedReason=None,blockedCategory=None,dependency=None,dependencyCategory=None,role='dated-provenance',reason='L12-85: dated header comment witnesses the retired docs/decisions corpus; only DECISIONS_DIR code enumeration dynamic-018734/018735 parks.');e.pop('r26Unit',None);e.setdefault('resolverWitness',{}).update(treeRetires=True,scope='Tree-retires dated provenance, no retained-directory claim')
 # p07/R27: non-docs Markdown reads are cutover-neutral, explicitly label target.
 r,e=reject('dynamic-027077','non-census-document-read','Real read of core/skills/fgos-fanout/references/wave-dispatch-mechanics.md; L160 asserts command wording. Every proposed move path is under docs/. This source read is cutover-neutral under R27, not root-only.');e['realReadPath']='core/skills/fgos-fanout/references/wave-dispatch-mechanics.md';e['owningAssertion']={'line':160,'text':source(r).splitlines()[159]}
 # p04/p05/p06/p08/p09: uniform synthetic comparison labels within named families.
 familyfiles={'test/cli/knowledge-verbs.test.mjs','test/cli/run-verb.test.mjs','test/cli/fgos-approve-6.test.mjs','test/runner/assignment-runresult.test.mjs','test/runner/commit-unit-work.test.mjs','test/runner/execution/handoff-refs.test.mjs','test/runner/execution/run-sync.test.mjs','test/runner/execution/run.test.mjs','test/workflow/workflow-runner.test.mjs'}
 for f in familyfiles:
  if f not in by:continue
  r=by[f]
  for e in items(r):
   x=e.get('matchedExpression') or e.get('originalTuple',[None]*5)[4] or '';n=e.get('currentLine') or (e.get('sourceSpans') or [{}])[0].get('line',0);src=source(r).splitlines()[n-1] if n else ''
   if e['disposition']=='preserve' and 'docs/' in x and not src.lstrip().startswith(('//','/*','*')):
    reject(ident(e),'config-or-metadata','Test-owned temporary synthetic document/scope fixture or its echoed result; preserve exact fixture spelling. Own source: '+repr(src))
 for id,why in [('dynamic-038625','src/state/store.mjs checkPlanEvidence reads docs/history/<id>/plan.md; docs/history has zero move-set paths'),('dynamic-038626','src/state/store.mjs checkPlanEvidence consumes this same synthetic plan fixture; docs/history has zero move-set paths'),('dynamic-037264','src/state/knowledge-registry.mjs validates the docs/ prefix of this test-created docPath'),('dynamic-037265','src/state/knowledge-registry.mjs consumes this temporary docs/ convention fixture')]:
  r,e=ids[id];e['reason']='L12-85: synthetic convention fixture consumed by '+why+'. Preserve; not an unrelated fs probe.';e['nonDocumentUse']='config-or-metadata'
 # R28 comments co-change uniformly ADMIT/preserve; directory fixtures stay preserve.
 manifest=read('step-05-proposed-move-read-units.json');units={u['path']:u for u in manifest['units']}
 for r in by.values():
  for e in items(r):
   if e.get('r26CoCutUnits'):
    n=e.get('currentLine') or (e.get('sourceSpans') or [{}])[0].get('line',0);src=source(r).splitlines()[n-1] if n else ''
    if src.lstrip().startswith(('//','/*','*')) and 'referenceId' in e:
     e.update(admission='ADMIT',nonDocumentUse=None,role='comment-provenance');e['reason']='L12-85/R28: comment pointer co-changes with '+', '.join(e['r26CoCutUnits'])+' if its proposed move is confirmed; preserve current bytes pending that decision.'
 # Explicit fixture-directory/comment membership missed by old textual path match.
 for f,ns in [('apps/fgos-gateway/src/gateway.rs',[1248,1740]),('apps/fgos-gateway/src/mcp.rs',[528,545,562])]:
  for e in items(by[f]):
   n=e.get('currentLine') or (e.get('sourceSpans') or [{}])[0].get('line',0)
   if n in ns:e['r26CoCutUnits']=sorted(set(e.get('r26CoCutUnits',[])+['docs/contracts/fgos-gateway-api-v1.yaml']))
 # Regenerate exact pin-bound unit locators, preserving existing co-change entries.
 locs={r['file']:('step-05-records/'+fn) for fn,rs in records.items() for r in rs}
 for u in units.values():u['readers']=[];u['coChanges']=[]
 for r in by.values():
  for e in items(r):
   paths=([e['r26Unit']] if e.get('r26Unit') else [])+e.get('r26CoCutUnits',[])
   for path in set(paths):
    n=e.get('currentLine') or (e.get('sourceSpans') or [{}])[0].get('line',0)
    loc={'file':r['file'],'id':ident(e),'recordFile':locs[r['file']],'line':n,'role':e.get('role'),'admission':e.get('admission'),'disposition':e['disposition'],'inputCommit':r['authorInputCommit'],'sourceSha256':r['sourceSha256'],'operation':e.get('matchedExpression') or e.get('pathOperand') or e.get('originalTuple',[None]*5)[4],'sourceLine':source(r).splitlines()[n-1]}
    u=units[path];u['readers' if e.get('r26Unit')==path else 'coChanges'].append(loc)
 for u in units.values():
  u['readerCount']=len(u['readers']);u['readerRecordIds']=[e['id'] for e in u['readers']];u['coCutPaths']=sorted({e['file'] for e in u['readers']+u['coChanges']})
 manifest.update(ruling='L12-85/R26/R27/R28',units=list(units.values()),unitsWithReaders=sum(bool(u['readers']) for u in units.values()),readerCount=sum(u['readerCount'] for u in units.values()),readerFiles=len({e['file'] for u in units.values() for e in u['readers']}));save('step-05-proposed-move-read-units.json',manifest)
 changes=[]
 for fn,rs in records.items():
  for a,z in zip(before[fn],rs):
   z['parked']=[{'id':ident(e),'blockedReason':e['blockedReason'],'dependency':e.get('dependency')} for e in items(z) if e['disposition']=='parked'] if a!=z else z['parked']
   if a==z:continue
   old={ident(e):e for e in items(a)};delta=[{'id':ident(e),'beforeDisposition':old.get(ident(e),{}).get('disposition'),'afterDisposition':e['disposition'],'admissionChanged':old.get(ident(e),{}).get('admission')!=e.get('admission')} for e in items(z) if old.get(ident(e))!=e];changes.append({'file':z['file'],'recordFile':'step-05-records/'+fn,'beforeSha256':sha(json.dumps(a,ensure_ascii=False,separators=(',',':'))),'afterSha256':sha(json.dumps(z,ensure_ascii=False,separators=(',',':'))),'dispositionChanged':any(d['beforeDisposition']!=d['afterDisposition'] for d in delta),'changes':delta})
  if rs!=before[fn]:(P/'step-05-records'/fn).write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs))
 save('step-05-seam67-task0-closure.json',{'ruling':'L12-85','reports':[f'review-a38-step-05-s5-b7-p{i:02}.md' for i in range(1,10)],'changedRecords':changes,'counts':{'files':len(changes),'items':sum(len(e['changes']) for e in changes),'dispositionChangedFiles':sum(e['dispositionChanged'] for e in changes),'labelOnlyFiles':sum(not e['dispositionChanged'] for e in changes)},'seam8Carries':[{'file':'src/state/store.mjs','line':615,'operation':'checkPlanEvidence docs/history/<id>/plan.md','coupledTests':['test/cli/fgos-approve-6.test.mjs','test/state/state-cutover.test.mjs'],'moveSetPaths':0,'obligation':'Seam 8 must own the production reader; no relocation implied.'},{'file':'scripts/generate-doc-inventory.mjs','operation':'docs/specs + docs/architect roots','coupledTests':['test/scripts/check-doc-constitution.test.mjs docs/specs/fixture.md'],'obligation':'Seam 8 confirm existing seam 4 ownership and atomic fixture co-change.'}],'independentReview':'pending Lead'})
 print('task0',len(changes),'files',sum(len(e['changes']) for e in changes),'items')
if __name__=='__main__':main()
