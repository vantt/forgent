"""L12-81 pinned review closure and exhaustive S1/S2/S3 record sweeps."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,subprocess,re,copy,hashlib,difflib,importlib.util
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def read(f):return json.loads((P/f).read_text())
def save(f,o):(P/f).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def sha(x):return hashlib.sha256(x.encode() if isinstance(x,str) else x).hexdigest()
def blob(pin,f):return subprocess.check_output(['git','show',pin+':'+f],cwd=ROOT,text=True)
def items(r):return r.get('references',[])+r.get('dynamicTraces',[])+r.get('authorAddedReferences',[])
def ident(e):return e.get('referenceId',e.get('id'))
def expr(e):return e.get('matchedExpression',e.get('originalTuple',[None]*5)[4])
def line(e):return e.get('sourceSpans',[{}])[0].get('line',e.get('currentLine'))
def clean(x):return re.sub(r'(?:\\n|\n)\s*(?://|\*)?\s*','',x)
def diff(f,a,b):return ''.join(difflib.unified_diff(a.splitlines(True),b.splitlines(True),fromfile='a/'+f,tofile='b/'+f))
def admit(r,e,why,role='comment-provenance'):
 e.update(admission='ADMIT',nonDocumentUse=None,role=role,reason=why);e.pop('fixtureProvenance',None)
 e['resolverWitness']={'inputCommit':r['authorInputCommit'],'readOnly':True,'expression':expr(e),'scope':'actual '+role,'treeRetires':bool(re.search(r'docs/specs|docs/architect',clean(expr(e)))),'evidence':why}
 if 'originalTuple' in e:e['pathOperand']=expr(e);e['pathOperandWitness']=e['operationWitness'].copy()
def inheritpark(r,e,donor,why=None):
 admit(r,e,why or donor['reason'],'real-document-reader')
 for k in ['disposition','timing','blockedCategory','blockedReason','dependency','dependencyCategory','searchWitness','parityObligation','owningGeneratorParks']:
  if k in donor:e[k]=copy.deepcopy(donor[k])
 if why:e['blockedReason']=e['reason']=why;e['searchWitness']['assessment']=why
files=['tests-real-file.jsonl','tests-real-file-batch3.jsonl','tests-judgment-batch4.jsonl','tests-judgment-batch5.jsonl','tests-judgment-batch6.jsonl']
records={fn:[json.loads(l) for l in (P/'step-05-records'/fn).read_text().splitlines()] for fn in files};before=copy.deepcopy(records);by={r['file']:r for rs in records.values() for r in rs};byid={ident(e):(r,e) for r in by.values() for e in items(r)}
# Explicit review changes, all spans verified first.
for r in by.values():
 body=blob(r['authorInputCommit'],r['file']);assert sha(body)==r['sourceSha256'];ls=body.splitlines()
 for e in items(r):
  for w in e.get('sourceSpans',[]):assert ls[w['line']-1][w['columnStart']-1:w['columnEndExclusive']-1]==w['text']
for id in ['reference-004363','reference-004391','reference-004382','reference-004392','reference-004362','reference-004364']:
 r,e=byid[id];admit(r,e,'L12-81/R6/L12-72: document path carried in worker context or asserted product prompt/input digest; exact synthetic fixture preserved, never claimed retained.','document-path-comparison')
r,e=byid['reference-004381'];e['successorNote']='docs/platform/runner/decisions/h-36d872fbb0e5.md#0026--native-first-dispatch-doctrine';assert '### 0026 — Native-First Dispatch Doctrine' in blob(r['authorInputCommit'],e['successorNote'].split('#')[0]);e['resolverWitness']['scope']='dated retired ADR0026 comment; live heading successor'
for id in ['dynamic-023508','dynamic-023509']:
 r,e=byid[id];e['reason']='L12-81: bare docs token is a write-scope label, not a document path; preserve prompt scope serialization.';e['nonDocumentUse']='config-or-metadata'
for id in ['dynamic-021547','dynamic-021548','dynamic-021549','reference-004308','reference-004343','dynamic-021550','dynamic-021551']:
 r,e=byid[id];donor=byid['dynamic-021542'][1];why='L12-81: real docs/decisions enumeration contains only index.md at the pin, and the move set relocates it to docs/knowledge/decisions-index/decision-record.md. Resolve alias membership with generator dynamic-009788/dynamic-009791; preserve files.length > 0 and every frontmatter type: explanation assertion in lines 373-383, including their title/diagnostics.';inheritpark(r,e,donor,why)
r,e=byid['reference-004332'];inheritpark(r,e,byid['reference-004345'][1])
# Fixed-root assertion diagnostics join existing runner/system-overview patches.
for id in ['dynamic-018740','dynamic-018744']:
 r,e=byid[id];admit(r,e,'L12-81/R16: prints fixed NARRATIVE_TARGETS document paths. Same patch unit as reference-004033/reference-004037; printed path changes with those members. Parked work-state/foundations/architecture-map remain Step 7/Phase 9 blockers, so no post-retirement green claim.','document-path-diagnostic');e.update(disposition='patch',timing='phase9',target='docs/platform/runner/decisions/h-36d872fbb0e5.md',proposedReplacement='NARRATIVE_TARGETS rebound output',diffHunk=r['diff']);e['patchOutputDependency']=['reference-004033','reference-004037'];e['parityObligation']='R22: existing current/candidate decisions-corpus replay owns printed-path delta; parked members block cutover until Step 7.'
# Add the split-line loop pointer, keeping both physical source spans.
r=by['test/runner/loop.test.mjs'];ls=blob(r['authorInputCommit'],r['file']).splitlines();assert 'docs/' in ls[785] and 'architect/doing-coordination-redesign.md' in ls[786]
sp=[]
for n,t in [(786,'docs/'),(787,'architect/doing-coordination-redesign.md')]:
 k=ls[n-1].index(t);sp.append({'line':n,'columnStart':k+1,'columnEndExclusive':k+len(t)+1,'text':t})
donor=copy.deepcopy(byid['reference-004411'][1]);donor.update(referenceId='author-s5-b6-loop-split-786',sourceSpans=sp,matchedExpression='docs/\narchitect/doing-coordination-redesign.md',passage='\n'.join(ls[782:790]),passageSpan={'startLine':783,'endLine':790});donor.pop('originalSourceSpans',None);donor.pop('inventoryOrigins',None);donor['resolverWitness']['treeRetires']=True;donor['reason']='L12-81: split-line dated tsk-40m pointer; docs/architect tree retires; proposals/doing-coordination-redesign.md is non-canonical, preserve provenance.';r['authorAddedReferences'].append(donor)
# S1: every prior spec co-cut list, not just named review files.
s1=[];changes={};couplings={};oldpointers={}
def change(r,e,old,new,source=None,why='L12-81/S2: dead comment pointer has a unique verified live holder; comment-only navigation repair.'):
 admit(r,e,why,'comment-navigation' if 'comment' in why else 'document-path-comparison');e.update(disposition='patch',timing='phase9',target=new,proposedReplacement=new,anchor=None);changes.setdefault(r['file'],[]).append((old,new));oldpointers.setdefault(r['file'],set()).add(clean(expr(e)));couplings.setdefault(r['file'],set()).update([r['file'],'CHANGELOG.md']+([source] if source else []));e['parityObligation']='R22: current/candidate pinned replay required; full post-retirement parity remains Phase 9.'
for sf in sorted(P.glob('step-05*cutover-specs.json')):
 if 'batch6' in sf.name:continue
 data=read(sf.name)
 for spec in data.get('patches',[]):
  for edit in spec.get('coCutTestEdits',[]):
   f=edit['file'];row={'specFile':sf.name,'source':spec['file'],'test':f,'sourceReferenceId':edit.get('referenceId'),'substitutions':len(edit.get('substitutions',[])),'disposition':edit.get('disposition'),'matches':edit.get('grepMatches',[])}
   if f not in by:row['resolution']='Outside closed batch; queued owning test, exact prior co-cut retained for next batch';s1.append(row);continue
   r=by[f];body=blob(r['authorInputCommit'],f);ls=body.splitlines();pairs=edit.get('substitutions',[])
   actual=[]
   for old,new in pairs:
    if re.match(r'\s*(?:test|it)\(',old):
     row['resolution']='S3 baseline title preserved; explicit co-cut dependency';continue
    if old not in body:row['resolution']='Prior-pin line drift: Step 7 must rebase exact old test assertion; not silently substituted';continue
    n=body[:body.index(old)].count('\n')+1
    hits=[e for e in items(r) if line(e)==n]
    if not hits:
     oldptr=edit.get('oldPointer','');text=oldptr if oldptr in ls[n-1] else ls[n-1].strip();k=ls[n-1].index(text);e=copy.deepcopy(r['references'][0]) if r['references'] else {'receiptId':r['receiptIds'][0],'proofCommand':'env -u CLAUDE_CODE_SESSION_ID node --test '+f,'parityObligation':'R22','aliasWriteCheck':{'destinationIsAlias':False,'evidence':'comparison'}}
     for k0 in ['inventoryOrigins','originalSourceSpans','referenceId']:e.pop(k0,None)
     e.update(referenceId='author-s5-b6-cocut-'+str(n),sourceSpans=[{'line':n,'columnStart':k+1,'columnEndExclusive':k+len(text)+1,'text':text}],matchedExpression=text,passage='\n'.join(ls[max(0,n-4):min(len(ls),n+3)]),passageSpan={'startLine':max(1,n-3),'endLine':min(len(ls),n+3)});r['authorAddedReferences'].append(e);hits=[e]
    for e in hits:change(r,e,old,new,spec['file'],'L12-81/S1: byte comparison of patched source output; test and source are one atomic Phase 9 patch, with exact assertion retained.')
    actual.append(n)
   row['patchedAssertionLines']=actual
   if actual:row['resolution']='Exact assertion substitutions joined to source in both directions'
   if not pairs:row['resolution']='No output assertion substitution: pure fixture/provenance or parked real-reader dependency, preserved as originally judged'
   s1.append(row)
# S2 over ALL closed seam5 judgments including this new batch, normalize wraps.
s2=[];trees={}
for r in by.values():
 pin=r['authorInputCommit'];body=blob(pin,r['file']);ls=body.splitlines()
 if pin not in trees:trees[pin]=subprocess.check_output(['git','ls-tree','-r','--name-only',pin,'--','docs/platform','docs/knowledge','docs/reference','docs/tutorials'],cwd=ROOT,text=True).splitlines()
 for e in items(r):
  if not ls[line(e)-1].lstrip().startswith(('//','/*','*')):continue
  x=clean(expr(e));x=x.split('#')[0].split(':')[0].rstrip(').')
  if not x.startswith('docs/') or not x.endswith('.md'):continue
  exists=subprocess.run(['git','cat-file','-e',pin+':'+x],cwd=ROOT,stderr=subprocess.DEVNULL).returncode==0
  hits=[f for f in trees[pin] if f.endswith('/'+pathlib.PurePosixPath(x).name) and '/proposals/' not in f]
  if exists or len(hits)!=1:continue
  target=hits[0];holder=blob(pin,target)
  if 'Canonical: No' in holder:continue
  old=expr(e)
  # Wrapped comments retain their line count and comment prefix; target is
  # placed on the first line, continuation becomes an empty comment suffix.
  spans=e['sourceSpans'];candidate=body
  if len(spans)==1:oldtoken=spans[0]['text'];newtoken=target
  else:
   a=spans[0];z=spans[-1];aa=sum(len(t)+1 for t in ls[:a['line']-1])+a['columnStart']-1;zz=sum(len(t)+1 for t in ls[:z['line']-1])+z['columnEndExclusive']-1;oldtoken=body[aa:zz];newtoken=target+''.join('\n'+re.match(r'\s*(?://|\*)?\s*',ls[s['line']-1])[0] for s in spans[1:])
  assert oldtoken in body
  change(r,e,oldtoken,newtoken);e['target']=e['proposedReplacement']=target;e['resolverWitness']['liveHolder']={'path':target,'sha256':sha(holder),'inputCommit':pin,'uniqueEligibleBasenameHolder':True,'oldAbsent':True};s2.append({'file':r['file'],'id':ident(e),'oldPath':x,'target':target,'targetSha256':sha(holder)})
# S3 every moving-path title lists the owning co-cut even when its label preserves.
move=read('step-05-cutover-move-set.json');moving=set()
def paths(o):
 if isinstance(o,dict):
  for k,v in o.items():
   if isinstance(v,str) and v.startswith('docs/'):moving.add(v)
   else:paths(v)
 elif isinstance(o,list):
  for v in o:paths(v)
paths(move);s3=[]
for r in by.values():
 ls=blob(r['authorInputCommit'],r['file']).splitlines()
 for e in items(r):
  n=line(e);x=clean(expr(e))
  if not re.match(r'\s*(?:test|it)\(',ls[n-1]) or not any(p in x or x.rstrip('/') in p for p in moving if len(x)>8):continue
  if e['disposition']=='preserve':
   e['coCutDependency']={'file':r['file'],'itemIds':[ident(z) for z in items(r) if z['disposition'] in ['patch','parked']],'rule':'Preserve test title baseline; move this title only with its owning patched/parked test at Step 7/Phase 9.'};e['reason']+=' L12-81/S3: baseline title co-cuts with the explicit owning test dependency.';s3.append({'file':r['file'],'id':ident(e),'coCut':e['coCutDependency']})
# Exact title dependencies explicitly named by the Lead, including split tokens.
for id,ids in [('reference-004312',['dynamic-021552','reference-004330']),('reference-004321',['dynamic-021542','dynamic-021543']),('reference-004346',['dynamic-021542','dynamic-021543']),('reference-004372',['reference-004373'])]:
 r,e=byid[id];e['coCutDependency']={'file':r['file'],'itemIds':ids,'rule':'Preserve baseline title, co-cut only with its owning parked test.'};e['reason']+=' L12-81/S3: explicit co-cut '+','.join(ids)+'.'
# Build complete patch specs/receipts; no product diff is applied to disk.
sp=importlib.util.spec_from_file_location('checker',P/'step-05-check.py');m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
specs=[]
receiptFiles=['step-05-seam5-batch2-judgment-receipts.json','step-05-seam5-batch3-judgment-receipt.json','step-05-seam5-batch4-parity-receipts.json','step-05-seam5-batch5-parity-receipts.json','step-05-seam5-batch6-parity-receipts.json']
rcs={fn:read(fn) for fn in receiptFiles};receiptby={e['id']:e for rc in rcs.values() for e in rc.get('receipts',[rc])}
for f,pairs in changes.items():
 r=by[f];body=blob(r['authorInputCommit'],f);candidate=body
 for a,z in dict.fromkeys(pairs):
  if a in candidate:candidate=candidate.replace(a,z)
 assert candidate!=body
 r.update(diff=diff(f,body,candidate),rollbackDiff=diff(f,candidate,body),expectedAfterSha256=sha(candidate),coCutPaths=sorted(couplings[f]))
 for e in items(r):
  if e['disposition']=='patch':e['diffHunk']=r['diff']
 greps=[m.test_grep(r['authorInputCommit'],p) for p in sorted(oldpointers[f]) if p and '\n' not in p and '\\' not in p]
 for g in greps:r['coCutPaths']=sorted(set(r['coCutPaths'])|{hit['file'] for hit in g['matches']})
 spec={'inputCommit':r['authorInputCommit'],'file':f,'sourceSha256':r['sourceSha256'],'mode':r['sourceMode'],'symbolOrPassage':'L12-81 pinned test assertion/comment navigation co-cut','oldText':body,'newText':candidate,'sourceSpans':[s for e in items(r) if e['disposition']=='patch' for s in e.get('sourceSpans',[])],'diff':r['diff'],'expectedAfterSha256':r['expectedAfterSha256'],'targetOwner':next(e['target'] for e in items(r) if e['disposition']=='patch'),'claimAnchorProof':{'holders':[e.get('resolverWitness',{}) for e in items(r) if e['disposition']=='patch']},'receiptId':r['receiptIds'][0],'coCutPaths':r['coCutPaths'],'expectedOutputSets':[],'testTargets':[f],'intentionalBehaviorDeltas':['Only approved navigation pointers and byte-exact asserted path output change; no assertion weakening.'],'prerequisites':['Step 7 final-pin composition','Phase 9 full-suite parity'],'order':'Atomic with every named source owner and test','rollbackDiff':r['rollbackDiff'],'timing':'phase9','readiness':'pending independent review and Phase 9 full suite','coCutTestGreps':greps,'substitutions':list(dict.fromkeys(pairs))};specs.append(spec)
 receipt=receiptby[r['receiptIds'][0]];receipt['candidateInputs']=copy.deepcopy(receipt['currentInputs']);receipt['candidateInputs'][0].update(sha256=sha(candidate),bytes=len(candidate.encode()));receipt['cutoverSpecifications']=[spec];receipt['coCutPaths']=r['coCutPaths'];receipt['coCutTestGreps']=greps;receipt['comparison']['intentionalDeltas']=spec['intentionalBehaviorDeltas']
for r in by.values():
 r['parked']=[{'id':ident(e),'blockedReason':e['blockedReason'],'dependency':e['dependency']} for e in items(r) if e['disposition']=='parked'];receipt=receiptby[r['receiptIds'][0]];receipt['blockedBy']=list(dict.fromkeys(e['blockedReason'] for e in items(r) if e['disposition']=='parked'))
# Reverse co-cut links on existing source records/specs/receipts, preserving their
# pinned output/grep decisions; this is a dependency join, not a second patch.
reverse=[]
for f,owners in couplings.items():
 for owner in owners:
  if owner in [f,'CHANGELOG.md']:continue
  reverse.append({'source':owner,'test':f})
for sf in P.glob('step-05*cutover-specs.json'):
 if 'batch6' in sf.name:continue
 data=read(sf.name);dirty=False
 for s in data.get('patches',[]):
  for pair in reverse:
   if s['file']==pair['source'] and pair['test'] not in s['coCutPaths']:s['coCutPaths'].append(pair['test']);dirty=True
 if dirty:save(sf.name,data)
# Existing source records already enumerate the same test owners; audit below
# records reverse membership independently rather than rewriting prior hashes.
for fn,rs in records.items():(P/'step-05-records'/fn).write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs))
for fn,rc in rcs.items():save(fn,rc)
save('step-05-seam5-batch6-cutover-specs.json',{'patches':specs})
changesjournal=[]
for fn,rs in records.items():
 if fn.endswith('batch6.jsonl'):continue
 for a,z in zip(before[fn],rs):
  if a!=z:
   old={ident(e):e for e in items(a)};delta=[{'id':ident(e),'before':old.get(ident(e)),'after':e} for e in items(z) if old.get(ident(e))!=e];changesjournal.append({'file':z['file'],'recordFile':'step-05-records/'+fn,'beforeSha256':sha(json.dumps(a,ensure_ascii=False,separators=(',',':'))),'afterSha256':sha(json.dumps(z,ensure_ascii=False,separators=(',',':'))),'dispositionChanged':any(d['before'] is None or d['before']['disposition']!=d['after']['disposition'] for d in delta),'changes':delta})
save('step-05-seam5-batch6-review-closure.json',{'ruling':'L12-81','reviewReports':[f'review-a38-step-05-s5-b5-p0{i}.md' for i in range(1,7)],'changedRecords':changesjournal,'S1':s1,'S2':s2,'S3':s3,'reverseCoCuts':reverse,'policy':'Author closure only; tests red until parks settle are Step 7/Phase 9 blockers. R24 windows cover admitted plus docs-bearing judgment rejects; neutral/mechanical/docs-free rejects remain checker owned.'})
print('S1',len(s1),'assertion lines',sum(len(x.get('patchedAssertionLines',[])) for x in s1),'S2',len(s2),'S3',len(s3),'patch files',len(specs),'changed old',len(changesjournal))
