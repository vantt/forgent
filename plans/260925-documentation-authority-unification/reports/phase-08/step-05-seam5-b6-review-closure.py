"""L12-83 author corrections. Only report records change; pinned consumers stay read-only."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,copy,re,subprocess,hashlib,difflib,functools,importlib.util,collections
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def read(f):return json.loads((P/f).read_text())
def save(f,x):(P/f).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def sha(x):return hashlib.sha256(x.encode() if isinstance(x,str) else x).hexdigest()
@functools.lru_cache(None)
def blob(pin,f):return subprocess.check_output(['git','show',pin+':'+f],cwd=ROOT,text=True)
def items(r):return r['references']+r['dynamicTraces']+r.get('authorAddedReferences',[])
def ident(e):return e.get('referenceId',e.get('id'))
def expr(e):return e.get('matchedExpression') or e.get('pathOperand') or e.get('originalTuple',[None]*5)[4] or ''
def line(e):return e.get('currentLine') or (e.get('sourceSpans') or [{}])[0].get('line',0)
def clean(x):return re.sub(r'(?:\\n|\n)\s*(?://|\*)?\s*','',x)
def norm(x):return re.sub(r"['\"]\s*,\s*['\"]",'/',clean(x))
def diff(f,a,b):return ''.join(difflib.unified_diff(a.splitlines(True),b.splitlines(True),fromfile='a/'+f,tofile='b/'+f))
def module(n,f):
 s=importlib.util.spec_from_file_location(n,P/f);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m

def main():
 records={f.name:[json.loads(l) for l in f.open()] for f in sorted((P/'step-05-records').glob('*.jsonl'))};before=copy.deepcopy(records);by={r['file']:r for rs in records.values() for r in rs};ids={ident(e):(r,e) for r in by.values() for e in items(r)}
 receiptfiles=['step-05-pilot-parity-receipts.json','step-05-seam4-parity-receipts.json','step-05-seam5-parity-receipts.json','step-05-seam5-batch2-judgment-receipts.json','step-05-seam5-batch3-judgment-receipt.json']+[f'step-05-seam5-batch{b}-parity-receipts.json' for b in range(4,8)]
 rcs={f:read(f) for f in receiptfiles};rcby={r['id']:r for o in rcs.values() for r in o.get('receipts',[o])};initialrc=copy.deepcopy(rcs)
 # Verify every corrected source before classifying it; full checker owns all other pins.
 def verify(r):
  body=blob(r['authorInputCommit'],r['file']);assert sha(body)==r['sourceSha256'];return body
 changes={};patchids=set();notes=[]
 def patch(id,target,why):
  r,e=ids[id];verify(r);e.update(admission='ADMIT',nonDocumentUse=None,disposition='patch',timing='phase9',target=target,anchor=None,proposedReplacement=target,blockedReason=None,blockedCategory=None,dependency=None,dependencyCategory=None,reason=why)
  e['resolverWitness']={'inputCommit':r['authorInputCommit'],'readOnly':True,'scope':'Verified live holder for this exact source passage','path':target,'targetSha256':sha(blob(r['authorInputCommit'],target)),'treeRetires':False,'evidence':why};e['parityObligation']='R22: replay exact pinned current and candidate; all assertions remain. Phase 9 owns composed cutover parity.'
  patchids.add(id);return r,e
 # Both whole proof files exist byte-identically; preserve the wrap and both home filenames.
 for id in ['reference-004378','reference-004379']:
  r,e=ids[id];body=verify(r);oldbase='docs/architect/agent-coordination/verification/visibility-herdr/proofs/';newbase=oldbase.replace('docs/architect/','docs/platform/')
  names=['permission-posture-findings.md'] if id.endswith('378') else ['agent-in-session-findings.md','permission-posture-findings.md']
  witnesses=[]
  for name in names:
   a=oldbase+'2026-09-06-isolation/'+name;z=newbase+'2026-09-06-isolation/'+name;raw=blob(r['authorInputCommit'],a);assert raw==blob(r['authorInputCommit'],z) and 'Canonical: No' not in raw;witnesses.append({'source':a,'target':z,'sha256':sha(raw),'byteIdentical':True})
  patch(id,witnesses[0]['target'],'L12-83/R8: evidence pointer has a byte-identical live proof holder; both filenames in the worker-home comment resolve under the replacement directory.')
  # Per-span replacements preserve physical wraps, never concatenate or drop a filename.
  e['sourceSpanReplacements']=[s['text'].replace(oldbase,newbase) for s in e['sourceSpans']];e['holderMembers']=witnesses;changes[r['file']]=[(oldbase,newbase)]
 # Direct rollup read needs the holder frontmatter, independently of generator membership.
 target='docs/knowledge/how-to-check-a-root-item-s-progress-with-fgos-rollup/check-rollup-progress.md';r,e=ids['dynamic-021552'];holder=blob(r['authorInputCommit'],target)
 assert all(x in holder for x in ['type: how-to','source_capture_ids:','doc-fgos-rollup-howto','framework:','mode: how-to'])
 old="path.join(REPO_ROOT, 'docs', 'how-to', 'check-rollup-progress.md')";new="path.join(REPO_ROOT, '"+target+"')";patch('dynamic-021552',target,'L12-83: direct real-file frontmatter read at L386; verified holder carries type: how-to and source_capture_ids doc-fgos-rollup-howto. No generator output is read by this assertion.');e['proposedReplacement']=new;e.pop('owningGeneratorParks',None)
 changes[r['file']]=[(old,new)]
 for id in ['reference-004312']:
  rr,z=patch(id,target,'L12-83: L385 baseline title moves atomically with direct frontmatter read dynamic-021552; assertion text and all cases unchanged.');changes[r['file']].append((z['matchedExpression'],target));z['coCutDependency']={'file':r['file'],'itemIds':['dynamic-021552'],'rule':'Atomic direct-read and title update; generator parks remain separate.'}
 # Resolved fixture and candidate-only witnesses; L50 consumes the exact parked constant.
 for id in ['reference-004376','reference-004377']:
  r,e=ids[id];verify(r);e['reason']='L12-83/R8: dated confinement-authority citation; docs/specs tree retires. docs/platform/agent-confinement/spec.md and contracts/confinement-authority-v1.md are Canonical: No candidate carriers, so no eligible live holder patch is authorized.';e['resolverWitness']['scope']=e['reason'];e['resolverWitness']['treeRetires']=True
 r,e=ids['reference-004352'];e['reason']='L12-83: comment names parked REAL_DEMO_DOC_PATH at L35, reference-004353/dynamic-021577. Preserve capture provenance until the generator alias/state-fixture co-cut resolves; the independent L386 frontmatter read is patched separately.';e['coCutDependency']={'file':r['file'],'itemIds':['reference-004353','dynamic-021577','dynamic-021584'],'rule':'Comment and addOutcome docPath consume the parked L35 capture constant.'}
 r,e=ids['dynamic-021584'];e['reason']='L12-83: scalar docPath: REAL_DEMO_DOC_PATH at L50 consumes the parked L35 constant; covered by reference-004353/dynamic-021577 co-cut, no independent path construction.';e['coCutDependency']=copy.deepcopy(ids['reference-004352'][1]['coCutDependency'])
 # Explicit comment-only reflow removes stubs without changing line count.
 for id in ['reference-003965','reference-004241']:
  r,e=ids[id];body=verify(r);oldspec=next(s for s in read('step-05-seam5-batch6-cutover-specs.json')['patches'] if s['file']==r['file']);candidate=oldspec['newText'];ls=candidate.splitlines(True)
  if id.endswith('3965'):
   assert ls[925].strip()=='// .';ls[924]=ls[924].rstrip('\n')+'.\n';ls[925]='\n'
  else:
   assert ls[113].strip().startswith('// ) --');ls[112]=ls[112].rstrip('\n')+')\n';ls[113]=ls[113].replace('// ) --','// --',1)
  changes[r['file']]=[(body,''.join(ls))];e['reason']+=' L12-83: clean wrapped comment and remove stub; comment-only co-cut has no CHANGELOG prerequisite.'
 # Every original comment-pointer under retiring roots, even when the old path still exists.
 trees={};audit=[]
 for r in by.values():
  if '; ' in r['file'] or not r.get('wholeFileRead'):continue
  for e in items(r):
   sp=e.get('sourceSpans') or []
   if not sp:continue
   x=clean(expr(e)).split('#')[0].rstrip(').')
   if not x.startswith(('docs/specs/','docs/architect/')) or not x.endswith('.md'):continue
   body=verify(r);ls=body.splitlines();n=sp[0]['line']
   if not ls[n-1].lstrip().startswith(('//','/*','*')):continue
   pin=r['authorInputCommit']
   if pin not in trees:trees[pin]=subprocess.check_output(['git','ls-tree','-r','--name-only',pin,'--','docs/platform','docs/knowledge','docs/reference','docs/tutorials'],cwd=ROOT,text=True).splitlines()
   exact=x.replace('docs/architect/','docs/platform/',1) if x.startswith('docs/architect/') else ''
   candidates=[exact] if exact in trees[pin] else [t for t in trees[pin] if t.endswith('/'+pathlib.PurePosixPath(x).name) and '/proposals/' not in t]
   eligible=[]
   for t in candidates:
    text=blob(pin,t)
    if 'Canonical: No' in text:continue
    try:old=blob(pin,x)
    except subprocess.CalledProcessError:old=None
    same=old==text if old is not None else False
    # Basename alone is not same-passage proof: require byte equality or unique
    # substantive lines in common, excluding all metadata/header/navigation.
    content=lambda z:{s.strip() for s in (z or '').splitlines() if len(s.strip())>45 and not s.startswith(('#','- **','>','<!--'))}
    common=sorted(content(old)&content(text))
    if same or len(common)>=3:eligible.append((t,same,common))
   row={'file':r['file'],'id':ident(e),'oldPath':x,'eligibleHolders':[t for t,_,_ in eligible],'dispositionBefore':e['disposition']}
   if len(eligible)==1 and e['disposition']!='patch':
    t,same,common=eligible[0];patch(ident(e),t,'L12-83/R8 sweep: retiring-tree comment has verified '+('byte-identical' if same else 'same-passage')+' live holder; dated provenance is retained by navigation to that holder.');e['holderPassageProof']={'byteIdentical':same,'sharedSubstantiveLines':common,'sourceSha256':sha(blob(pin,x)),'targetSha256':sha(blob(pin,t))}
    # Preserve wrap by replacing the first path span, leaving continuation blank.
    replacements=[t]+['' for _ in sp[1:]];e['sourceSpanReplacements']=replacements
    candidate=body
    offsets=[sum(len(s)+1 for s in ls[:s0['line']-1])+s0['columnStart']-1 for s0 in sp]
    for s0,pos,z in reversed(list(zip(sp,offsets,replacements))):candidate=candidate[:pos]+z+candidate[pos+len(s0['text']):]
    changes.setdefault(r['file'],[]).append((body,candidate))
   row['dispositionAfter']=e['disposition'];audit.append(row)
 # Notes accepted by Lead, including the exact marker/regex blockers.
 r,e=ids['reference-004034'];why=r['file']+': work-state NARRATIVE_TARGETS member feeds the L84-88 exact retired-section marker loop and L79-81 Team Harness 0032 assertion (regex at L81; review L80 spelling refers to the runner assertion). retired-decision-history.md has the 12 ### id headings but lacks the required retired-section marker and ### 0032 — Multi-role Team Harness. Decide marker carriage and collision-topic heading before rebinding this shared array member.';e['blockedReason']=e['reason']=why;e['dependency']='work-state-marker-loop-and-0032-topic-regex';e['searchWitness']['assessment']=why
 r,e=ids['reference-004047'];e['blockedReason']=e['blockedReason'].replace('/^### 0032','/### 0032');e['reason']=e['reason'].replace('/^### 0032','/### 0032');e['searchWitness']['assessment']=e['blockedReason']
 r,e=ids['dynamic-018736'];e['successorNote']=ids['reference-004038'][1]['successorNote']
 r,e=ids['reference-004036'];e['reason']='L12-83/R26: dated architecture-map provenance comment; retention-or-move decision remains open with reader reference-004035. Root file is outside retiring docs/architect and docs/specs trees.';e['resolverWitness']['treeRetires']=False;e['resolverWitness']['scope']=e['reason']
 # Sweep unresolved S2 placeholders to source-grounded provenance determinations.
 placeholder=[]
 for r in by.values():
  for e in items(r):
   if 'pending source-grounded S2 holder check' not in e.get('reason',''):continue
   body=verify(r);src=body.splitlines()[line(e)-1];x=clean(expr(e));why='L12-83: pinned comment describes '+('the fixture path/constant used by this test; preserve until its owning fixture co-cut changes.' if '/how-to/' in x and '/reclaim.md' in x or 'fixture' in e.get('role','') else 'the existing corpus or root directory, not a unique movable document holder; preserve dated context.')
   if x.startswith(('docs/specs/','docs/architect/')):why='L12-83/R8: dated scope/proposal provenance; docs/specs or docs/architect tree retires. No eligible same-passage canonical live holder was found in the complete pinned holder sweep.';e.setdefault('resolverWitness',{})['treeRetires']=True
   e['reason']=why;e.setdefault('resolverWitness',{})['scope']=why;placeholder.append({'file':r['file'],'id':ident(e),'line':line(e),'source':src,'resolution':why})
 # R26 paths: Phase 6 proposals plus the live decision-index alias (explicit Lead ruling).
 move=read('step-05-cutover-move-set.json');proposed={x['oldPath']:x for x in move['paths'] if not x['oldPath'].startswith(('docs/specs/','docs/architect/','docs/decisions/00')) and (any('phase-06/' in z['source'] for z in x['moves']) or x['oldPath']=='docs/decisions/index.md')}
 proposed['docs/enduser-docs-index.json']={'oldPath':'docs/enduser-docs-index.json','moves':[],'note':'No standalone path move is declared by the pinned move set. Generated manifest must regenerate with parked alias-membership dynamic-009788/dynamic-009791; Lead explicitly joins its reader/output helpers.'}
 units={path:{'path':path,'proposedTarget':sorted({z['to'].split('#')[0] for z in x['moves']}),'proposalEvidence':x,'disposition':'parked','decisionDependency':'Phase 9 retention-or-move decision for '+path,'readers':[],'coChanges':[],'readerRecordIds':[]} for path,x in proposed.items()}
 # Each actual operation retains its own passage-specific blocker; a common unit
 # is an explicit shared decision, never fabricated claim correspondence.
 def park(r,e,path,reason):
  verify(r);unit=units[path];prior=e.get('blockedReason');why=r['file']+': '+reason
  if prior and prior not in why:why+=' Existing proof obligation: '+prior
  e.update(admission='ADMIT',nonDocumentUse=None,disposition='parked',timing='phase9',target=None,anchor=None,diffHunk=None,blockedReason=why,blockedCategory='proposed-move-decision',dependency=unit['decisionDependency'],dependencyCategory='phase9-retention-or-move',reason='L12-83/R26: '+why,r26Unit=path)
  e['parityObligation']='Resolve '+unit['decisionDependency']+' as one co-cut; preserve this operation and all owning assertions. Confirmed move patches only when the target carries its exact read content.'
  e['resolverWitness']={'inputCommit':r['authorInputCommit'],'readOnly':True,'scope':'Current pinned operation; proposed move is undecided, no retained-target assertion','treeRetires':False,'path':path}
  if 'originalTuple' in e:
   e['stateExportDependency']=unit['decisionDependency'];e['blockedSeams']=['step7-final-assembly','phase9'];e.setdefault('pathOperand',expr(e));e.setdefault('pathOperandWitness',copy.deepcopy(e.get('operationWitness',{})))
  if e.get('searchWitness'):e['searchWitness']['assessment']=why
  elif r['file'].startswith(('test/','apps/fgos-gateway/web/')):
   batch=4 if r['subBatch']=='judgment-batch-4' else 5 if r['file']=='test/report/enduser-index.test.mjs' else 6
   sf=f'step-05-seam5-batch{batch}-search-evidence.json';s=read(sf);e['searchWitness']={'pin':r['authorInputCommit'],'roots':s['roots'],'evidenceFile':str((P/sf).relative_to(ROOT)),'evidenceSha256':sha((P/sf).read_bytes()),'assessment':why}
  return prior
 # Actual document reads/default destinations; labels and comments are co-change only.
 for r in by.values():
  f=r['file']
  if '; ' in f:continue
  for e in items(r):
   x=norm(expr(e));hits=[path for path in units if path in x]
   # Literal root-directory scans actually read the index at the pin.
   if f=='test/docs/decisions-corpus-retired.test.mjs' and ident(e) in ['reference-004039','reference-004041','dynamic-018734','dynamic-018735']:hits.append('docs/decisions/index.md')
   if f=='src/report/decision-index.mjs' and ident(e) in ['dynamic-009758','dynamic-009767']:hits.append('docs/decisions/index.md')
   if f=='src/setup/instruction-registry.mjs' and ident(e)=='dynamic-014002':hits.append('docs/architecture-manifest.json')
   if f=='src/setup/registrations.mjs' and ident(e) in ['dynamic-014334','dynamic-014335','dynamic-014336','dynamic-014337']:hits.append('docs/decisions/index.md')
   if f=='src/report/enduser-index-generate.mjs' and ident(e)=='dynamic-009769':hits.append('docs/enduser-docs-index.json')
   if not hits:continue
   body=verify(r);n=line(e);src=body.splitlines()[n-1] if n else '';role=e.get('role','');comment=src.lstrip().startswith(('//','/*','*'));title=bool(re.match(r'\s*(?:test|it)\(',src));synthetic=e.get('admission')!='ADMIT' or 'synthetic' in role or 'fixture' in role;generated=r.get('generated')
   for path in sorted(set(hits)):
    kind='reader';reason='This pinned '+role+' operation depends on the exact '+path+' input/default destination; decide retention or content-carrying move together with every listed caller and proof.'
    if generated or comment or title or synthetic:kind='co-change'
    # Classifier strings and comments are vocabulary, not reads.
    if f in ['scripts/generate-shipped-path-inventory.mjs','scripts/install-git-hooks.mjs','scripts/next-doc-id.mjs']:kind='co-change'
    if e['disposition']=='patch':kind='co-change'
    # The fixture destination shares the real copy operation; it parks atomically.
    if f in ['test/scripts/check-doc-candidate-status.test.mjs','test/scripts/check-doc-constitution.test.mjs'] and e.get('admission')=='ADMIT' and path=='docs/doc-governance.md':kind='reader';reason='The copyFileSync source reads real doc-governance bytes into the gate fixture; source and destination expressions must co-cut with governanceBaselineFields and validateConstitution.'
    if f=='test/report/enduser-index.test.mjs' and ident(e) in ['reference-004305','reference-004307']:kind='reader';reason='The comment asserts docs/decisions holds only index.md; it must follow the index retention-or-move decision rather than preserve a future-stale directory claim.'
    if kind=='reader':park(r,e,path,reason)
    else:e.setdefault('r26CoCutUnits',[]);e['r26CoCutUnits']=sorted(set(e['r26CoCutUnits']+[path]))
    loc={'file':f,'id':ident(e),'recordFile':next('step-05-records/'+fn for fn,rs in records.items() if r in rs),'line':n,'role':role,'admission':e.get('admission'),'disposition':e['disposition'],'inputCommit':r['authorInputCommit'],'sourceSha256':r['sourceSha256'],'operation':expr(e),'sourceLine':src}
    units[path]['readers' if kind=='reader' else 'coChanges'].append(loc)
 # Helper returns product manifest suffix under a tmp root: admit (R16), join
 # alias generator park, and carry callers as the very same output unit.
 r,e=ids['dynamic-017973'];verify(r);e.update(admission='ADMIT',nonDocumentUse=None,role='document-path-product-output',pathOperand=e['operationWitness']['text'],pathOperandWitness=copy.deepcopy(e['operationWitness']));park(r,e,'docs/enduser-docs-index.json','docsIndexManifestPath returns the fixed product manifest suffix. Post-merge existsSync/read assertions in L187-216 and generator dynamic-009788 alias membership must change together when the manifest moves or regenerates.');e['owningGeneratorParks']=[{'file':'src/report/enduser-index-generate.mjs','id':'dynamic-009788'}]
 unit=units['docs/enduser-docs-index.json'];unit['readers'].append({'file':r['file'],'id':ident(e),'recordFile':'step-05-records/tests-judgment-batch6.jsonl','line':line(e),'role':e['role'],'admission':'ADMIT','disposition':'parked','inputCommit':r['authorInputCommit'],'sourceSha256':r['sourceSha256'],'operation':expr(e),'sourceLine':blob(r['authorInputCommit'],r['file']).splitlines()[line(e)-1]});unit['generatorDependency']=['dynamic-009788','dynamic-009791'];unit['decisionDependency']='Phase 9 retention-or-move decision for docs/enduser-docs-index.json';unit['proposalNote']=proposed['docs/enduser-docs-index.json']['note']
 # Co-change fixture directories feeding the quadrant scan, regardless of R21
 # rejection; these are not reclassified as real repository documents.
 for r in by.values():
  for e in items(r):
   id=ident(e);x=norm(expr(e))
   if r['file']=='test/report/enduser-index.test.mjs' and (id in [f'dynamic-{n:06}' for n in range(21521,21539)] or 'docs/how-to/' in x and e.get('admission')=='REJECT'):
    e['generatorCoCutDependency']={'file':'src/report/enduser-index-generate.mjs','itemIds':['dynamic-009788','dynamic-009791'],'rule':'Fixture quadrant names and manifest output co-change with alias scan-set; R21 rejection stays.'};notes.append({'file':r['file'],'id':id,'dependency':e['generatorCoCutDependency']})
 # Finish unit identities and freeze exact membership; empty proposals remain
 # visible so the all-path sweep does not silently imply readers exist.
 for path,u in units.items():
  u['readerRecordIds']=[x['id'] for x in u['readers']];u['coCutPaths']=sorted({x['file'] for x in u['readers']+u['coChanges']});u['readerCount']=len(u['readers']);u['status']='decision-open' if u['readers'] else 'no actual reader in authored Step 5; co-changes only' if u['coChanges'] else 'no authored Step 5 occurrence'
 # Build exact changed patch files. Existing patches compose from their own
 # source bytes, never from working-tree consumer content.
 m=module('closurePilot','step-05-check.py');newSpecs=[]
 oldspecs=[s for sf in P.glob('step-05*cutover-specs.json') if 'b6-review' not in sf.name for s in read(sf.name).get('patches',[])]
 for f,pairs in changes.items():
  r=by[f];body=verify(r);prior=next((s for s in oldspecs if s['file']==f),None);candidate=prior['newText'] if prior else body
  for a,z in pairs:
   if a==body:candidate=z
   else:
    assert a in candidate,(f,a);candidate=candidate.replace(a,z)
  r.update(diff=diff(f,body,candidate),rollbackDiff=diff(f,candidate,body),expectedAfterSha256=sha(candidate));commentOnly=all(t.lstrip().startswith(('//','/*','*')) or not t.strip() for c in difflib.SequenceMatcher(None,body.splitlines(),candidate.splitlines(),autojunk=False).get_opcodes() if c[0]!='equal' for t in body.splitlines()[c[1]:c[2]])
  co=set(r.get('coCutPaths',[]))|{f}
  if commentOnly:co.discard('CHANGELOG.md')
  else:co.add('CHANGELOG.md')
  greps=[]
  for e in items(r):
   if e['disposition']!='patch':continue
   e['diffHunk']=r['diff'];old=clean(expr(e));
   if old.startswith('docs/') and '\\' not in old:
    g=m.test_grep(r['authorInputCommit'],old);greps.append(g);co.update(h['file'] for h in g['matches'])
  r['coCutPaths']=sorted(co);rc=rcby[r['receiptIds'][0]]
  substitutions=[(body,candidate)]
  spec={'inputCommit':r['authorInputCommit'],'file':f,'sourceSha256':r['sourceSha256'],'mode':r['sourceMode'],'symbolOrPassage':'L12-83 pinned review closure','oldText':body,'newText':candidate,'sourceSpans':[s for e in items(r) if e['disposition']=='patch' for s in e.get('sourceSpans',[])],'diff':r['diff'],'expectedAfterSha256':r['expectedAfterSha256'],'targetOwner':next(e['target'] for e in items(r) if e['disposition']=='patch'),'claimAnchorProof':{'holders':[e.get('resolverWitness',{}) for e in items(r) if e['disposition']=='patch']},'receiptId':r['receiptIds'][0],'coCutPaths':r['coCutPaths'],'expectedOutputSets':[],'testTargets':[f],'intentionalBehaviorDeltas':['Only verified comment navigation changes.' if commentOnly else 'Direct rollup frontmatter read and L385 title rebind to the verified holder; assertion semantics and every case remain.'],'prerequisites':['Step 7 final-pin composition','Phase 9 full-suite parity'],'order':'Atomic with the listed source/test co-cut','rollbackDiff':r['rollbackDiff'],'timing':'phase9','readiness':'pending independent review and Phase 9 full-suite proof','coCutTestGreps':greps,'substitutions':substitutions,'commentOnly':commentOnly,'ruling':'L12-83'}
  rc['candidateInputs']=copy.deepcopy(rc['currentInputs']);rc['candidateInputs'][0].update(sha256=sha(candidate),bytes=len(candidate.encode()));rc['cutoverSpecifications']=[spec];rc['coCutPaths']=r['coCutPaths'];rc['coCutTestGreps']=greps;rc['comparison']['intentionalDeltas']=spec['intentionalBehaviorDeltas'];newSpecs.append(spec)
 # Recompute per-record/receipt park inventories after every correction.
 for r in by.values():
  if r['file'] not in rcby and not r.get('receiptIds'):continue
  r['parked']=[{'id':ident(e),'blockedReason':e['blockedReason'],'dependency':e.get('dependency')} for e in items(r) if e['disposition']=='parked']
  for rid in r.get('receiptIds',[]):
   if rid in rcby:
    rc=rcby[rid];group=[z for z in by.values() if rid in z.get('receiptIds',[])];rc['blockedBy']=list(dict.fromkeys(e['blockedReason'] for z in group for e in items(z) if e['disposition']=='parked'))
 # Write only genuinely changed shards and receipts; old census identities stay.
 changed=[]
 for fn,rs in records.items():
  for a,z in zip(before[fn],rs):
   if a==z:continue
   old={ident(e):e for e in items(a)};delta=[{'id':ident(e),'beforeDisposition':old.get(ident(e),{}).get('disposition'),'afterDisposition':e['disposition'],'admissionChanged':old.get(ident(e),{}).get('admission')!=e.get('admission')} for e in items(z) if old.get(ident(e))!=e]
   changed.append({'file':z['file'],'recordFile':'step-05-records/'+fn,'beforeSha256':sha(json.dumps(a,ensure_ascii=False,separators=(',',':'))),'afterSha256':sha(json.dumps(z,ensure_ascii=False,separators=(',',':'))),'dispositionChanged':any(x['beforeDisposition']!=x['afterDisposition'] for x in delta) or a.get('diff')!=z.get('diff'),'changes':delta})
  if rs!=before[fn]:(P/'step-05-records'/fn).write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs))
 for fn,o in rcs.items():
  if o!=initialrc[fn]:save(fn,o)
 save('step-05-seam5-b6-review-cutover-specs.json',{'patches':newSpecs})
 save('step-05-proposed-move-read-units.json',{'ruling':'L12-83/R26','moveSetPath':'step-05-cutover-move-set.json','moveSetSha256':sha((P/'step-05-cutover-move-set.json').read_bytes()),'units':list(units.values()),'unitCount':len(units),'unitsWithReaders':sum(bool(u['readers']) for u in units.values()),'readerCount':sum(u['readerCount'] for u in units.values()),'readerFiles':len({x['file'] for u in units.values() for x in u['readers']}),'scope':'All canonical Step 5 shards, seams 1–5. Proposed paths with no reader remain explicit. Fixture/title/comments are co-change entries, not fabricated reads. Manifest output coupling is explicit even though no standalone move target is in the pinned map.'})
 save('step-05-seam5-b6-review-closure.json',{'ruling':'L12-83','reports':[f'review-a38-step-05-s5-b6-p{i:02}.md' for i in range(1,17)],'changedRecords':changed,'retiringCommentSweep':audit,'resolvedPlaceholderReasons':placeholder,'fixtureGeneratorCoChanges':notes,'counts':{'changedRecords':len(changed),'dispositionChanged':sum(x['dispositionChanged'] for x in changed),'labelOnly':sum(not x['dispositionChanged'] for x in changed),'newPatchFiles':len(newSpecs),'retiringCommentOccurrences':len(audit),'sweepNewPatches':sum(x['dispositionBefore']!='patch' and x['dispositionAfter']=='patch' for x in audit),'placeholderReasonsResolved':len(placeholder)},'independentReview':'pending Lead; author correction is not acceptance'})
 print('closure',len(changed),'units',len(units),'readers',sum(u['readerCount'] for u in units.values()),flush=True)
if __name__=='__main__':main()
