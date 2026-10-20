"""Bounded judgment authoring. Classifications are author claims for window review;
mechanical verification never substitutes for independent semantic review.
"""
import sys
sys.dont_write_bytecode=True
import pathlib,json,re,subprocess,collections,importlib.util,copy,difflib
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
s=importlib.util.spec_from_file_location('bulk',P/'step-05-seam5-bulk-rules.py');b=importlib.util.module_from_spec(s);s.loader.exec_module(b)
PIN='5eb9dc609f303fc9d54377f866b5e8caf9a5d129'
selection=json.loads((P/'step-05-seam5-batch4-selection.json').read_text())
def dump(f,o):(P/f).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def relative(f):return str((P/f).relative_to(ROOT))
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT).decode()
def mode(f):return git('ls-tree',PIN,'--',f).split()[0]
def pininput(f):
 raw=b.body(PIN,f);return {'path':f,'inputCommit':PIN,'sha256':b.sha(raw),'bytes':len(raw.encode()),'mode':mode(f),'provenance':'immutable git object; source bytes only, no test execution or authority promotion'}
def witness(ls,line,expr):
 k=ls[line-1].find(expr.split('\n')[0]);assert k>=0,(line,expr)
 return {'line':line,'columnStart':k+1,'columnEndExclusive':k+1+len(expr.split('\n')[0]),'text':expr.split('\n')[0]}
def span(ls,line,radius=3):
 a=max(1,line-radius);z=min(len(ls),line+radius);return {'startLine':a,'endLine':z,'text':'\n'.join(ls[a-1:z])}
def ownership(ls):
 starts=[i for i,t in enumerate(ls,1) if re.match(r'\s*(?:test|it)\s*(?:\.\w+)?\(',t)];out=[]
 for j,a in enumerate(starts):
  z=starts[j+1]-1 if j+1<len(starts) else len(ls)
  assertions=[{'line':i,'text':ls[i-1]} for i in range(a,z+1) if re.search(r'\bassert\.\w+\(|\bexpect\(',ls[i-1])]
  out.append({'declarationLine':a,'declaration':ls[a-1],'assertions':assertions})
 return out

# The carried scan-set gaps have different actual dependencies, not line/id disguises.
DEAD='test/runner/dead-vocabulary-guard.test.mjs'
BLOCKS={
 'collect':'Recursive collectFiles receives both source and document directories; preserve recursion and extension filtering while proving the exact retired-tree reader set against promoted counterparts.',
 'doc-array':'The docDirs union supplies the Phase 1-3 dead-symbol scan; establish the complete Markdown read-set correspondence and history/rule exemptions before replacing any retiring directory.',
 'p1spec':'The Phase 1-3 specs directory walk must continue covering the same carried contracts with the existing history-heading and RUL69/70/72 exclusions.',
 'p1platform':'The Phase 1-3 retained platform contracts walk shares the docDirs read set; prove post-promotion contract content coverage jointly with retiring spec/architect roots.',
 'p1architect':'The Phase 1-3 architect contracts walk needs exact successor contract file membership, rather than merely a replacement directory that exists.',
 'p5':'The P5 scan must cover FlowDefinition, CoordinationProtocol, DemandFacts and the retired facades across promoted Markdown while retaining the unchanged rule/history exemptions.',
 'gateway-expanded':'The gateway files array expands each declared root through walk before checking every line; bind the resulting deduplicated file set after specs retirement and keep the component-boundary carriage conflict visible.',
 'gateway-root':'The gateway/plugin walk currently includes the retiring specs tree alongside source roots; prove its complete successor file set without introducing a history skip into this stricter guard.',
 'gateway-walk':'The recursive gateway walk reaches carried component-boundary text and the retiring specs branch; retain its skipDirs/extension policy while resolving the carriage location conflict.',
 'component':'P7-DOC-GAP-05: component-boundary README/repo-layout source-carriage regions quote retired gateway/plugin names. At promotion relocate those complete units into history/provenance or retire them with legacy sources; do not rewrite carried wording or weaken the guard.'}
PARK_LINES={14:'collect',56:'doc-array',57:'p1spec',58:'p1platform',59:'p1architect',461:'p5',529:'gateway-walk',539:'gateway-root',541:'gateway-expanded',543:'component'}
# Root-group metadata is not itself a document-valued operand when its census
# tuple stops before the independent docs constructor later on that line.
REJECT_PARTIAL={'dynamic-023881','dynamic-023889','dynamic-023891','dynamic-023845','dynamic-023858','dynamic-023866','dynamic-023879'}
ADMIT_DEAD={14:"path.join(dir, entry.name)",56:"path.join(REPO_ROOT, 'docs', 'specs')",57:"path.join(REPO_ROOT, 'docs', 'specs')",58:"path.join(REPO_ROOT, 'docs', 'platform', 'agent-coordination', 'contracts')",59:"path.join(REPO_ROOT, 'docs', 'architect', 'agent-coordination', 'contracts')",424:"path.join(REPO_ROOT, 'AGENTS.md')",461:"path.join(REPO_ROOT, d)",463:"path.join(REPO_ROOT, 'AGENTS.md')",465:"path.join(REPO_ROOT, 'README.md')",529:'path.join(dir, entry.name)',539:"path.join('docs', 'specs')",541:'path.join(REPO_ROOT, d)',542:"path.join(REPO_ROOT, 'AGENTS.md')",543:"path.join(REPO_ROOT, 'docs', 'platform', 'component-boundary.md')"}
# Per-file final semantic reasoning, not inferred from census role hints.
NOTES={
 'doc-review-authorship':'Constructed sourcePath metadata and temporary committed plans/** review reports exercise independent reviewer/ancestry checks; real source fixture is bare source.md, outside census roots.',
 'doc-global-closure':'In-memory global-closure row fixtures; path/anchor/digest identities test exact comparison, not real repository documents.',
 'doc-corpus-decisions':'Corpus inventory rows are constructed data; the only committed fixture report lives under plans/**. No old source document is read.',
 'doc-decision-conservation':'Synthetic coverage maps and unitsOf callbacks exercise exact source-prefix coverage and returned uncovered paths; no real legacy source claim is substituted.',
 'doc-decision-exact':'Synthetic source/target pair and temporary committed unit lookup preserve exact-text/ancestry and refusal cases. The example source tree is created by this test.',
 'doc-decision-mirrors':'Synthetic mirror inventory and temporary committed target bytes exercise blob/anchor/unit-digest proof. Example source/target names remain test data.',
 'doc-decision-review':'Constructed review rows, fake commit/digests and unitsOf callbacks test review sensitivity and bindings; sourcePath is fixture metadata, not an on-disk reader.',
 'doc-link-pass':'Test-owned alias fixtures and link strings are renderer input/expected output. Old specs/architect spellings intentionally remain to test source-link preservation and targeted rewrite behavior.',
 'doc-restoration-proofs':'Temporary git fixture owns restored target bytes and the two Brief. sources; deferred/duplicate cases need these source names unchanged.',
 'knowledge-classifier':'In-memory authoritative_for example plus mkdtemp docs/how-to fixtures; complete fixture bodies and no-write assertions stay unchanged.',
 'verify-phase-02':'Injected diffNames callback supplies the forbidden docs/specs/runner.md path; this is a negative diff-policy case, not a reader or replacement target.',
 'project-agents':'Historical tsk-slq risk-map citation; operations target throwaway YAML/config trees and generated agent Markdown outside census roots.',
 'fgos-intake-3':'Synthetic docsRef input is compared to both folded state and CLI list output; docs/history/p50-workflow-induct/ is not read as a real directory.',
 'fgos-intake-6':'Synthetic submit docsRef round-trip compares CLI list output; docs/history/some-feature/ is intentionally a fixture path.',
 'fgos-intake-4':'Comments record the dated tsk-40m migration and legacy-doing clamps; executable tests only exercise temporary Work state.',
 'fgos-edit-2':'Historical mergeAfter and supersededBy guard provenance; comments are not document path operands.',
 'fgos-intake-7':'Historical evidence-discipline design citation; real traceability probes target the temporary .fgos event log.',
 'fgos-read-2':'Historical ready --step wiring citation; read operations target temporary event/state fixtures.',
 'fgos-read-5':'Historical conflicts cross-step wiring citation; generated CLI state and footprints are synthetic.',
 'domain-fields':'Historical ADR0027/domain-fields design provenance; tests exercise temporary store payloads and schema objects.',
 'compound-learn-done-gate':'Dated tsk-40m redesign provenance; sequential status-chain assertions and learning generation stay intact.',
 'status-category':'L3/ADR0027 and tsk-40m provenance; tests assert write-time category stamping and replay semantics without reading those documents.',
 'working-tree-clean-unified':'Retired ADR0022 choke-point provenance; temporary repositories test subtree/whole-repo cleanliness with identical prefix rules.',
 'fsm':'Dated tsk-40m migration context; all legal/illegal edge, ask-template and CAS assertions remain exactly as pinned.',
 'dispatch-worker-session':'Dated 2026-09-06 isolation proof citation; source uses pure env/socket functions, not a live proof-directory reader.',
 'codex-cli-glm-cli-live-executors':'Dated historical smoke-proof locators. Owning live tests are identified only; never imported/run here because module scope reads local secrets.',
 'dir-resolution':'Historical worktree-dir-resolution research citation; its owning tests use temporary main/worktree/HOME fixtures. No CLI is run in this records turn.',
 'uninstall-wiring':'Historical uninstall CONTEXT D2-D4 provenance; owning tests use disposable hook directories. No setup/uninstall is run here.',
 'App':'S01 source comment identifies dated tsk-51i auth test provenance; fetch/localStorage fixtures assert UI auth states, never read the screen document.'}

def basename(f):return pathlib.PurePosixPath(f).name.replace('.test.mjs','').replace('.test.tsx','')
def classification(f,ls,line,expr,identity=None,dynamic=False):
 key=basename(f);note=NOTES.get(key,'Pinned source/test filesystem plumbing, scalar interpolation or diagnostic label; no document operation in this expression.')
 l=ls[line-1];comment=l.lstrip().startswith(('//','/*','*'))
 if f==DEAD:
  if not comment and identity not in REJECT_PARTIAL and line in ADMIT_DEAD:
   operand=ADMIT_DEAD[line]
   if line==461 and expr.startswith('searchDirs'):operand="'docs/specs'"
   group=PARK_LINES.get(line)
   if group:return ('ADMIT','parked',None,operand,DEAD+': '+BLOCKS[group],group)
   return ('ADMIT','preserve',None,operand,'Real retained root-document constructor feeds the dead-symbol read, not a label.',None)
  if comment:return ('REJECT','preserve','comment-or-type',None,'Dated guard/scan provenance; retiring trees are not described as retained.',None)
  cat='text-label-join' if expr.startswith('`') or 'join(' in expr and not re.search(r'path\.|REPO_ROOT|dir,',expr) else 'state-event-store' if '.fgos' in expr else 'root-only' if 'REPO_ROOT =' in expr else 'non-document-fs-probe'
  return ('REJECT','preserve',cat,None,'Guard source/config plumbing or diagnostic/regex serialization; no document-valued operand. '+expr[:160],None)
 if f=='test/architecture.test.mjs':
  if dynamic and line==24:return ('ADMIT','preserve',None,expr,'Real architecture-manifest read at module initialization; L12-60(6) and L12-71 residual ruling retain docs/architecture-manifest.json. Alias proposal is not authority to move it.',None)
  return ('REJECT','preserve','comment-or-type' if comment else 'text-label-join' if expr.startswith('`') else 'non-document-fs-probe',None,'Architecture source/import graph and synthetic lexer/guard fixtures; the real document read is owned separately at line 24.',None)
 if comment:return ('REJECT','preserve','comment-or-type',None,note+' Dated provenance is preserved even where the referenced tree retires.',None)
 if key in ['fgos-intake-3','fgos-intake-6'] and 'docs/history/' in expr:return ('ADMIT','preserve',None,expr,note,None)
 if key=='doc-link-pass' and 'docs/' in expr:return ('ADMIT','preserve',None,expr,note,None)
 if key=='doc-decision-exact' and not dynamic and line==10:return ('ADMIT','preserve',None,expr,note,None)
 if key=='doc-restoration-proofs' and not dynamic and line==57:return ('ADMIT','preserve',None,expr,note,None)
 if key=='doc-decision-conservation' and 'docs/' in expr:return ('ADMIT','preserve',None,expr,note,None)
 if key in ['doc-decision-exact','doc-decision-mirrors','doc-restoration-proofs'] and dynamic and re.search(r'path\.join\([^,]+,\s*(?:source|target|owner|f\.owner)\)',expr):return ('ADMIT','preserve',None,expr,note,None)
 if key=='knowledge-classifier' and (not dynamic and 'docs/how-to/reclaim.md' in expr or dynamic and line in [32,33,36,40]):
  op={32:"path.join(tmpDir, 'docs')",33:"path.join(docsDir, 'how-to')"}.get(line,expr)
  return ('ADMIT','preserve',None,op,note,None)
 # All remaining fixtures name paths as input metadata or labels, never a
 # navigation replacement. Real doc constructors were explicitly selected above.
 cat='text-label-join' if expr.startswith('`') else 'config-or-metadata' if 'docs/' in expr or 'path:' in expr or 'sourcePath' in expr else 'state-event-store' if '.fgos' in expr or 'events.jsonl' in expr else 'root-only' if re.search(r'import\.meta|__dirname',expr) else 'non-document-fs-probe' if re.search(r'join\(|resolve\(|new URL',expr) else 'scalar-pass-through'
 return ('REJECT','preserve',cat,None,note,None)

refs=collections.defaultdict(list);dyn=collections.defaultdict(list)
for e in b.rows('step-05-population-references.jsonl'):refs[e['file']].append(e)
for e in b.rows('step-05-population-dynamic.jsonl'):dyn[e['file']].append(e)
# Immutable park search: proposed aliases never alone prove the scan set.
roots=['docs/platform','docs/knowledge','docs/reference','docs/tutorials'];queries=[]
for term in ['Phase 1-3','FlowDefinition','CoordinationProtocol','README source carriage','repo-layout-vision source carriage','herdr-plugin']:
 cmd=['git','grep','-n','-F',term,PIN,'--',*roots];pr=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True)
 queries.append({'query':term,'command':cmd,'exit':pr.returncode,'matches':pr.stdout.splitlines(),'stdoutSha256':b.sha(pr.stdout)})
lookup=[]
for file in ['plans/260925-documentation-authority-unification/alias-table.json','plans/260925-documentation-authority-unification/reports/phase-06/draft-alias-merged-step10.json','docs/doc-registry.json']:
 text=b.body(PIN,file);data=json.loads(text);items=data.get('entries',data.get('docs',[]));matches=[e for e in items if any(x in json.dumps(e) for x in ['docs/specs/','docs/architect/agent-coordination/','docs/platform/component-boundary.md'])];lookup.append({'path':file,'sha256':b.sha(text),'matches':matches})
search={'inputCommit':PIN,'roots':roots,'queries':queries,'aliasLookups':lookup,'assessment':'Individual promoted claims and proposed aliases do not prove equality of recursively scanned Markdown file sets or its history policy; P7-DOC-GAP-05 already records a concrete carried-name conflict.','carriedGap':{'path':'plans/260925-documentation-authority-unification/reports/phase-07/owner-answers.md','sha256':b.sha(b.body(PIN,'plans/260925-documentation-authority-unification/reports/phase-07/owner-answers.md')),'lines':[564,577]}}
dump('step-05-seam5-batch4-search-evidence.json',search)
rs=[];receipts=[];readset=[]
for f in selection['files']:
 body=b.body(PIN,f);ls=body.splitlines();digest=b.sha(body);key=basename(f);receiptId='real-file-tests-goldens-batch4-'+key;own=ownership(ls);assert own,f
 source=pininput(f);proofcmd=('env -u CLAUDE_CODE_SESSION_ID node --test '+f) if f.endswith('.mjs') else 'env -u CLAUDE_CODE_SESSION_ID npm --prefix apps/fgos-gateway/web test -- src/App.test.tsx'
 r={'file':f,'authorInputCommit':PIN,'sourceSha256':digest,'sourceMode':mode(f),'censusOrigins':sorted({o['inventory'] for x in refs[f] for o in x['origins']}|{o for x in dyn[f] for o in x['inventories']}),'priorRecordRefs':[],'seamIds':['real-file-tests-goldens'],'subBatch':'judgment-batch-4','wholeFileRead':True,'wholeFileReadEvidence':{'bytes':len(body.encode()),'lines':len(ls),'sha256':digest,'method':'Complete pinned git blob through EOF; original expression, full-file lexical closure and owning assertions recorded.'},'references':[],'dynamicTraces':[],'authorAddedReferences':[],'diff':None,'rollbackDiff':None,'expectedAfterSha256':digest,'coCutPaths':[],'receiptIds':[receiptId],'protectedPins':{},'parked':[],'review':{'status':'pending','reviewer':None,'report':None},'generated':False,'owningProofs':own,'authorAssessment':NOTES.get(key,'Exact guard read set and assertions are recorded separately.'),'carryJoins':[]}
 def add(e,line,expr,identity,dynamic=False):
  admission,disp,cat,operand,why,group=classification(f,ls,line,expr,identity,dynamic)
  e.update({'admission':admission,'disposition':disp,'role':'real-document-reader' if f==DEAD and admission=='ADMIT' or f=='test/architecture.test.mjs' and admission=='ADMIT' else 'synthetic-fixture' if admission=='ADMIT' else 'non-document-operation','nonDocumentUse':cat,'reason':why,'target':None,'anchor':None,'timing':'phase9' if disp=='parked' else 'none','diffHunk':None,'blockedCategory':'read-set-parity' if disp=='parked' else None,'blockedReason':why if disp=='parked' else None,'dependency':group if disp=='parked' else None,'dependencyCategory':'step5-parity' if disp=='parked' else None,'successorNote':None,'aliasWriteCheck':{'destinationIsAlias':False,'evidence':'Synthetic test input is not a production writer destination; no patch or alias activation proposed.'},'receiptId':receiptId,'parityObligation':'R22: preserve all owning assertions; Phase 9 full suite owns parity. '+('Resolve the precise scan-set/carriage dependency before landing.' if disp=='parked' else 'No per-file replay required for preserve.'),'proofCommand':proofcmd})
  if dynamic:
   e['pathOperand']=operand
   if operand:e['pathOperandWitness']=witness(ls,next(i for i in range(e['currentPassage']['startLine'],e['currentPassage']['endLine']+1) if operand.split('\n')[0] in ls[i-1]),operand)
  if admission=='ADMIT':
   e['resolverWitness']={'inputCommit':PIN,'readOnly':True,'expression':operand or expr,'scope':'actual real reader' if e['role']=='real-document-reader' else 'test-owned synthetic input/output; no lookup of proposed alias authorizes writing','treeRetires':bool(re.search(r'docs/specs|docs/architect',expr))}
   if e['role']=='synthetic-fixture':e['fixtureProvenance']={'inputCommit':PIN,'sourceFile':f,'sourceSha256':digest,'mode':r['sourceMode'],'origin':'test-authored input at immutable source pin','readSet':[],'owningTests':own}
  if disp=='parked':
   e['searchWitness']={'pin':PIN,'roots':roots,'evidenceFile':relative('step-05-seam5-batch4-search-evidence.json'),'evidenceSha256':b.sha((P/'step-05-seam5-batch4-search-evidence.json').read_bytes()),'assessment':why,'queries':[q['query'] for q in queries],'aliasLookupSources':[q['path'] for q in lookup]}
   r['parked'].append({'id':identity,'blockedReason':why,'dependency':group})
  if key=='domain-fields' and line==1 and expr=='docs/':
   second='decisions/0027-domain-so-huu-status-doan-truoc-delivered-supersede-base-';third='workflow-model-d1-d3.md'
   e['matchedExpression']='docs/'+second+third;e['sourceSpans'] += [witness(ls,2,second),witness(ls,3,third)]
   e['successorNote']='docs/platform/work-state/decisions/retired-decision-history.md#12-adr-0027-domain-owns-the-pre-delivered-status-vocabulary'
  if 'docs/decisions/0022-' in expr:e['successorNote']='docs/platform/runner/decisions/h-36d872fbb0e5.md#0022--khảo-sát-choke-point-fgos-quyết-định-lặplệch-xuyên-clirunnerskill'
  if b.a.plans_only(r,e):e['admission']='REJECT';e['nonDocumentUse']='plans-report-artifact';e['pathOperand']=None;e.pop('pathOperandWitness',None);e['reason']='R11: plans/** vocabulary or review-report fixture artifact, outside census documentation roots.'
  return e
 for x in refs[f]:
  ss=x['sourceSpans'];line=ss[0]['line'];ps=span(ls,line);e={'referenceId':x['id'],'inventoryOrigins':x['origins'],'originalSourceSpans':ss,'sourceSpans':ss,'matchedExpression':x['expression'],'passage':ps['text'],'passageSpan':{k:v for k,v in ps.items() if k!='text'}};r['references'].append(add(e,line,x['expression'],x['id']))
 for x in dyn[f]:
  w=b.witness(body,x['callSite']);history=None;opls=ls
  if w is None:
   originPin=json.loads((P/x['inventories'][0]).read_text())['inputCommit'];original=b.body(originPin,f);ow=b.witness(original,x['callSite']);assert ow,(f,x['id']);oldls=original.splitlines()
   for tag,a1,a2,z1,z2 in difflib.SequenceMatcher(None,oldls,ls,autojunk=False).get_opcodes():
    if tag=='equal' and a1<=ow['line']-1<a2:
     newline=z1+ow['line']-a1;w=dict(ow,line=newline);break
   if w is None:
    assert x['callSite'][4] not in body,(f,x['id'])
    w=ow;history={'inputCommit':originPin,'sourceSha256':b.sha(original),'mode':git('ls-tree',originPin,'--',f).split()[0],'reason':'Census tuple belonged to a test declaration removed before this author pin; preserve original identity and historical label, no current operation or parity case is invented.','diffCommand':['git','diff',originPin,PIN,'--',f],'diff':git('diff',originPin,PIN,'--',f)};opls=oldls
  line=w['line'];ps=span(opls,line,4)
  # Array-value witness at line 56 needs the complete document constructors.
  if f==DEAD and line==56:ps=span(ls,line,5)
  e={'id':x['id'],'originalTuple':x['callSite'],'inventoryOrigins':x['inventories'],'currentLine':line,'currentPassage':ps,'caller':{'line':ps['startLine'],'declaration':opls[ps['startLine']-1]},'operationWitness':{k:v for k,v in w.items() if k!='expression'},'inputs':[],'targetSetOrConstruction':x['callSite'][4],'stateExportDependency':None,'fixtureProvenance':None,'rejectedAsUnrelatedReason':None,'blockedSeams':[]};r['dynamicTraces'].append(add(e,line,x['callSite'][4],x['id'],True))
  if history:e['historicalOnly']=history;e['reason']=history['reason'];e['admission']='REJECT';e['nonDocumentUse']='text-label-join';e['pathOperand']=None;e['role']='historical-test-label'
 # Full lexical closure includes post-census docs tokens, diagnostic examples,
 # test/docs self-locators and split comment path starts. Never mint census ids.
 for line,text in enumerate(ls,1):
  for mt in re.finditer(r'docs/[^\s`"\',;]*',text):
   if any(s['line']==line and s['columnStart']<=mt.start()+1<s['columnEndExclusive'] for e in r['references'] for s in e['sourceSpans']):continue
   sp={'line':line,'columnStart':mt.start()+1,'columnEndExclusive':mt.end()+1,'text':mt[0]};ps=span(ls,line);identity='author-s5-b4-'+key+'-'+str(line)+'-'+str(mt.start()+1)
   e={'referenceId':identity,'sourceSpans':[sp],'matchedExpression':mt[0],'passage':ps['text'],'passageSpan':{k:v for k,v in ps.items() if k!='text'}};r['authorAddedReferences'].append(add(e,line,mt[0],identity))
 if f==DEAD:
  r['carryJoins']=[e for e in b.rows('step-05-dynamic-carries.jsonl') if e['file']==f]
  r['readSetConstruction']=[{'line':i,'text':ls[i-1]} for i in [9,12,14,19,56,57,58,59,61,87,100,102,107,120,447,461,462,473,486,488,493,519,523,526,529,531,532,539,541,542,543,556,559,560,562,569]]
 if f=='test/architecture.test.mjs':
  inp=pininput('docs/architecture-manifest.json');r['protectedPins'][inp['path']]=inp['sha256'];r['realReadInputs']=[inp]
  r['readSetConstruction']=[{'line':i,'text':ls[i-1]} for i in [23,24,25,26,40,41,125,126,129,131,136,137,138,141,144,145,170]]
 if f.endswith('App.test.tsx'):
  runner=pininput('apps/fgos-gateway/web/package.json');assert json.loads(b.body(PIN,runner['path']))['scripts']['test']=='vitest run';r['protectedPins'][runner['path']]=runner['sha256'];r['realReadInputs']=[runner];r['testRunnerWitness']={'input':runner,'script':'test','command':'vitest run','cwd':'apps/fgos-gateway/web'}
 inputs=[source]+r.get('realReadInputs',[])
 items=r['references']+r['dynamicTraces']+r['authorAddedReferences']
 receipt={'id':receiptId,'seam':'real-file-tests-goldens','inputCommit':PIN,'currentInputs':inputs,'candidateInputs':inputs,'comparison':{'currentOutputSet':[],'candidateOutputSet':[],'normalization':'none; no outputs produced and no replay claimed','comparedFields':['exact conserved claim/assertion mapping','real-file read set','whole worker prompt bytes','golden/source co-edit','immutable fixture mode/hash/origin'],'intentionalDeltas':[],'unexpectedDeltas':[],'assertionOwnership':own,'realReadSet':r.get('readSetConstruction',[]),'fixtureSource':source,'candidateScope':'unchanged pinned source only; no candidate output or passing full-suite claim'},'proofs':[{'command':proofcmd,'owningBehavior':'Exact test declarations/assertion lines in assertionOwnership','exit':None,'logPath':None,'logSha256':None,'status':'not-run','reason':'R22: no Phase 9 patch in this file; Phase 9 full suite owns preserve/park parity.'}],'blockedBy':list(dict.fromkeys(e['blockedReason'] for e in items if e['disposition']=='parked')),'cutoverSpecifications':[],'readiness':'pending independent window review and Phase 9 full suite; record closure only','review':{'status':'pending','reviewer':None,'report':None}}
 receipts.append(receipt);rs.append(r);readset.append({'file':f,'pin':PIN,'sha256':digest,'bytes':len(body.encode()),'lines':len(ls)})
(P/'step-05-records/tests-judgment-batch4.jsonl').write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs))
dump('step-05-seam5-batch4-parity-receipts.json',{'receipts':receipts});dump('step-05-seam5-batch4-whole-file-reads.json',readset);dump('step-05-seam5-batch4-cutover-specs.json',{'patches':[],'reason':'All selected passages preserve or park. R22 does not require patch replay for either disposition.'})
print('judgment',len(rs),'refs',sum(len(r['references']) for r in rs),'tuples',sum(len(r['dynamicTraces']) for r in rs),'added',sum(len(r['authorAddedReferences']) for r in rs))
