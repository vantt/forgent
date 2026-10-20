#!/usr/bin/env python3
"""L12-62: author records and witnesses only, never apply consumer patches."""
import sys
sys.dont_write_bytecode=True
import importlib.util,pathlib,json,re,copy,collections,ast
P=pathlib.Path(__file__).resolve().parent
def mod(n):
 s=importlib.util.spec_from_file_location(n,P/(n+'.py'));v=importlib.util.module_from_spec(s);s.loader.exec_module(v);return v
q=mod('step-04-check');a=mod('step-04-wave1-author');v=mod('step-04-l12-62-lib');m=q.m;z=q.z;PIN=q.PIN;a.PIN=PIN
body=lambda f:z.blob(PIN,f)
BASE=m.git('rev-parse','HEAD').decode().strip()
rs=[json.loads(l) for f in sorted((P/'step-04-records').glob('step04-*.jsonl')) for l in m.blob(BASE,str(f.relative_to(m.ROOT))).decode().splitlines()];oldrs=copy.deepcopy(rs);pop=json.loads(m.blob(BASE,str(m.REL/'step-04-population.json')));bdata=json.loads(m.blob(BASE,str(m.REL/'step-04-batches.json')));rowby={q.slotkey(x):x for x in pop['rows'] if x['bucket']=='step4'}
# Reuse the existing author-added exact tuple shape and clearing/park primitives.
ns=globals();src=ast.parse((P/'step-04-l12-60-author.py').read_text())
for node in src.body:
 if isinstance(node,ast.FunctionDef) and node.name in ('newedge','clear','preserve','park'):exec(compile(ast.Module(body=[node],type_ignores=[]),str(P/'step-04-l12-60-author.py'),'exec'),ns)
ownerfiles={r['file']:r for r in rs};renderowners={x['path']:r['file'] for r in rs for j in r['sourceRenderProvenance'] for x in j['renderFiles']};renderowners.pop('AGENTS.md',None)
journal={'inputHEAD':m.git('rev-parse','HEAD').decode().strip(),'authorPin':PIN,'namedReworks':[],'wrappedScan':[],'parkedSearch':[],'preservedExistence':[],'patchAnchors':[],'successorNotes':[],'changes':[]}
def quote(e):return m.resolver.passage(body(e['consumerFile']),e['sourceSpans'])
def whypark(e,why,cat='description-rewrite'):
 park(e,'L12-62: '+why,cat)
def patch(r,e,target,needle,why,whole=False):
 clear(e);line=1 if whole else next(i for i,l in enumerate(body(target).splitlines(),1) if needle in l)
 a.patch(r,e,body(r['file']),target,line,'L12-62: '+why,whole=whole)
def hitspan(f,n,text):
 l=body(f).splitlines()[n-1];c=l.index(text)+1;return {'line':n,'columnStart':c,'columnEndExclusive':c+len(text),'text':text}
def add(r,f,ss,reason,refs=[]):
 e=newedge(r,f,ss,refs,'L12-62-complete-passage-scan');e['inventoryOccurrences']=q.inventory_occurrences(e)
 preserve(e,reason);return e
def related_owner(f,ss):
 if f=='AGENTS.md' and ss[0]['line']>=321:
  current=None
  for line in body(f).splitlines()[320:ss[0]['line']]:
   mt=re.search(r'- source: `(core/instructions/[^`]+)`',line)
   if mt:current=mt[1]
  return current
 return renderowners.get(f,f)
def covers(es,f,ss):
 return all(any(e['consumerFile']==f and any(t['line']==s['line'] and t['columnStart']<=s['columnStart'] and s['columnEndExclusive']<=t['columnEndExclusive'] for t in e['sourceSpans']) for e in es) for s in ss)
# Every real physical file, including zero-edge outputs, gets a complete wrapped scan.
physical={r['file'] for r in rs}|set(renderowners)|{e['consumerFile'] for r in rs for e in r['edges']}
for f in sorted(physical):
 for hit in v.wrapped_paths(body(f)):
  ss=hit['spans'];r=ownerfiles[related_owner(f,ss)]
  overlap=[e for e in r['edges'] if e['consumerFile']==f and any(t['line']==s['line'] and t['columnStart']<=s['columnStart']<t['columnEndExclusive'] for t in e['sourceSpans'] for s in ss)]
  if not covers(r['edges'],f,ss) and not covers(r['stepFiveExcluded'],f,ss):
   # Complete a prefix slot rather than mint a competing identity.
   if overlap:
    for e in overlap:
     e['sourceSpans']=ss;e['matchedExpression']='\n'.join(s['text'] for s in ss);e['logicalReference']=a.logical(ss);e['legacyPath']=a.pathof(e)
     if not e['renderOnly'] and e['disposition']=='preserve':preserve(e,'L12-62 complete wrapped reference; source-bound history/provenance or surviving root; literal spelling conserved.')
   else:
    # Newly found live comment evidence in merge.mjs is provenance, L12-62(2).
    e=add(r,f,ss,'L12-62 complete wrapped reference; original design/history provenance stays literal under L12-47 and ruling 2; no new current authority asserted.')
    if f=='plugins/fgOS/skills/deliver/SKILL.md' and ss[0]['line']==82:
     # Existing frozen wrapped census id, not an invented identity.
     e['externalCensusRefs']=[{'inventory':'step-02d-wrapped-citation-rescan.json','edgeId':'wrapped-0106','spans':ss}]
  journal['wrappedScan'].append({'owner':r['file'],'file':f,**hit})
journal['wrappedFileReceipts']=[{'file':f,'digest':m.sha(body(f)),'lines':len(body(f).splitlines()),'hits':len(v.wrapped_paths(body(f))),'method':'Complete pinned blob through EOF, comment/markdown continuation joins; scanner source digest is in final checker dependencyHashes.'} for f in sorted(physical)]
# Missing source slots and known root/directory inputs.
for f,n,text in [('AGENTS.md',74,'docs/decisions/'),('core/skills/_shared/executor-dispatch-fallback.md',224,'docs/history/two-layer-dispatch/DISCUSSION.md'),('domains/coding/skills/fgos-coding-planning/references/verify-sync-and-gap.md',68,'docs/history/<feature>/plan.md'),('core/task-specs/fgos-indexing.md',6,'docs/<quadrant>/')]:
 r=ownerfiles[f];ss=[hitspan(f,n,text)]
 if not covers(r['edges'],f,ss):
  e=add(r,f,ss,'L12-62 missing source slot; literal retained history/convention.')
  if f=='AGENTS.md':whypark(e,'Description rewrite: present-tense writer to retired decision corpus; Step 7 carries the digest-bound A34 residual and specifies live narrative ownership before Phase 9.')
  if '<quadrant>' in text:whypark(e,'Retiring four-quadrant input layout; Phase 9 description rewrite and Step 5 index scanner/writer parity must agree on docs/knowledge layout before changing this input contract.')
# A complete supplemental slot does not excuse an older census prefix slot.
# Both slots describe the same physical citation and therefore receive one judgment.
for f,number in [('src/runner/dispatch/mechanism.mjs','0026'),('src/state/work.mjs','0027')]:
 r=ownerfiles[f];full=next(e for e in r['edges'] if e['legacyPath'].startswith('docs/decisions/'+number+'-') and len(e['sourceSpans'])>1)
 for e in r['edges']:
  if not e['legacyPath'].startswith('docs/decisions/'+number+'-'):continue
  e['sourceSpans']=copy.deepcopy(full['sourceSpans']);e['matchedExpression']='\n'.join(x['text'] for x in e['sourceSpans']);e['logicalReference']=a.logical(e['sourceSpans']);e['legacyPath']=a.pathof(e)
  holder=m.decision_narrative_holders(PIN,number)[0]
  if number=='0026':whypark(e,'Dead link with name drift: the source spells executor-native-vs-cli-spawn; its governing Native-First rules are identifiable in a differently named narrative. Non-executable successor note: '+holder+'. L12-62(1) parks the name-drifted pointer rather than asserting a verbatim move.','dead-link')
  else:preserve(e,'L12-62(2), L12-47: explicit design-origin decision-record 0027 D2/D3 provenance for fixed statusCategory; preserve captured identity even though a live statement exists. Non-executable successor note: '+holder+'.')
# Every generated join must have an equal source passage, including newly completed wraps.
for r in rs:
 for e in list(r['edges']):
  if not e['renderOnly']:continue
  candidates=[x for x in r['edges'] if not x['renderOnly'] and x['logicalReference']==e['logicalReference'] and v.passage_equal(m.resolver,PIN,r,e,x)]
  if not candidates:
   ls=body(r['file']).splitlines();rls=body(e['consumerFile']).splitlines();ss=[]
   for span in e['sourceSpans']:
    hits=[i for i,l in enumerate(ls,1) if l.strip()==rls[span['line']-1].strip()]
    if span['line']-1 in hits:n=span['line']-1
    else:assert len(hits)==1,(r['file'],span,hits);n=hits[0]
    original=rls[span['line']-1];start=len(original)-len(original.lstrip());target=ls[n-1];offset=len(target)-len(target.lstrip())-start
    ss.append({**span,'line':n,'columnStart':span['columnStart']+offset,'columnEndExclusive':span['columnEndExclusive']+offset})
   candidates=[add(r,r['file'],ss,'L12-62 source counterpart of exact generated passage; captured history/convention. Step 5 owns example execution.')]
  e['sourceSlotKey']=min(candidates,key=lambda x:abs(x['sourceSpans'][0]['line']-e['sourceSpans'][0]['line']))['slotKey']
# Bound context edits are comments only and are checked independently of path form.
def edit(r,n,old,new,reason):
 r.setdefault('contextEdits',[]).append({'sourceSpans':[hitspan(r['file'],n,old)],'replacement':new,'reason':'L12-62: '+reason})
for r in rs:
 for e in r['edges']:
  if e['renderOnly']:continue
  f=r['file'];eid=e['edgeId'];n=e['sourceSpans'][0]['line']
  if eid=='cli-006':patch(r,e,'docs/platform/packaging-distribution/spec.md','- **RUL9 (',"RUL9 states diagnostic default never writes, --fix is the deliberate reversal; binding Lead ruling overrides the retained-detail frame for this precise rule.")
  elif eid=='class6-l-000263':
   patch(r,e,'docs/platform/agent-confinement/spec.md',None,'Full spec carries architecture §1 and dependency §5.2; second contract carries §6.6 attestation and §6.9 Authority result. Both targets occur in the one replacement.',whole=True)
   target='docs/platform/agent-confinement/contracts/confinement-authority-v1.md';line=next(i for i,l in enumerate(body(target).splitlines(),1) if l.startswith('## 6.'))
   h=next(h for h in m.heading_sections(PIN,target) if h['startLine']==line)
   e['additionalTargets']=[{'path':target,'anchor':h['anchor'],'targetEvidenceLines':[line]+[i for i,l in enumerate(body(target).splitlines(),1) if l.startswith(('### 6.6 ','### 6.9 '))],'targetDigest':m.sha(body(target))}]
   edit(r,2,' §1, §5.2, §6.6, §6.9',' §1, §5.2; '+target+'#'+h['anchor']+' §6.6, §6.9','One citation split across two live holders; preserve every original locator.')
  elif eid in ('class6-l-000268','class6-l-000282'):patch(r,e,'docs/platform/run-supervisor/spec.md',None,'The live run-supervisor contract owns controller handover, continued agent/result lifecycle after controller death, terminal brief delivery and release-slot (§4, §5.3, §7, §9.1); no runner-area carry is needed.',whole=True)
  elif eid=='class6-l-000279':patch(r,e,'docs/platform/agent-coordination/architecture/runtime-recovery-design.md','## 6. Local Concurrency','Exact section 6 names run-lock generation records, release markers and current local fencing.')
  elif eid=='class6-l-000194':
   patch(r,e,'docs/platform/packaging-distribution/contracts/release-manifest.md','## 2. Frozen Schema V1 Shape','Manifest types implement frozen schema and field invariants, not same-number Digest Rule; sections 2–4 carry this claim.')
   edit(r,3,'//! Matches `docs/platform/packaging-distribution/contracts/release-manifest.md`','//! Frozen release manifest types and field invariants.','Remove duplicated adjacent citation.')
   edit(r,4,'//! and ','//! See ','Keep the surviving citation grammatical.')
   edit(r,4,' §5.','.','Drop obsolete section number; passage-based fragment identifies Frozen Schema V1 Shape.')
  elif eid=='class6-l-000255':whypark(e,'Dead link: target never existed in git history. Navigation for resolveExecutorProvider H2a/H2b/RT1/F1 edge cases. Non-executable successor note: archive/plans/260915-executor-policy-dispatch-seams/ and docs/platform/agent-coordination/verification/step-08-standalone-coordination/P00.2.md are plan/evidence only, not live authority.','dead-link')
  elif eid=='class6-l-000293':whypark(e,'Dead link: target never existed in git history; live see-pointer to pr-lifecycle validation-s1-gate proof. No exact live successor; .bee spike origin is outside this repository.','dead-link')
  elif eid=='class6-l-000307':patch(r,e,e['target'],None,'Whole document contains all six independent precedents tsk-n4i-1/tsk-5vf/tsk-4eu/tsk-5ge/tsk-28o/tsk-3v2; the former single-example anchor dropped five.',whole=True)
  elif eid=='class6-l-000328':
   patch(r,e,'docs/platform/git/spec.md','## 7. Hardened Git','No hardcoded trunk: host project trunk is detected; G-018 and G-044 explicitly cover createBranchRef.')
   edit(r,n,'"installed into other repos" story','"No hardcoded trunk" contract','Make adjacent description agree with the live Git contract.')
  elif eid in ('skills-085','skills-088'):patch(r,e,'docs/reading-map.md','## 5. Detailed Product And Source Map','Maintained detailed map names end-user read-by-tag index; Phase 9 first conserves remaining reading-map source under accepted Step 3 carry.')
# Dead links moved verbatim: actual basename + historical last content comparison.
for r in rs:
 for e in r['edges']:
  if e['renderOnly'] or e['disposition']!='parked':continue
  path=e['legacyPath'];basename=path.rsplit('/',1)[-1]
  candidates=[f for f in v.tree(PIN) if f.startswith(('docs/knowledge/','docs/platform/')) and f.rsplit('/',1)[-1]==basename and not m.resolver.carriage(body(f),1,f)] if basename.endswith('.md') else []
  if path.startswith(('docs/how-to/','docs/reference/','docs/explanation/')) and len(candidates)==1:
   target=candidates[0];hist=m.path_history(PIN,path);source=None
   for rev in hist:
    try:source=m.blob(rev,path).decode();break
    except Exception:
     try:source=m.blob(rev+'^',path).decode();break
     except Exception:pass
   assert source is not None,(path,hist)
   # Migration adds registry metadata: compare the complete original body as a suffix.
   tb=body(target);narrative=lambda text:re.sub(r'^---\n.*?\n---\n','',text,flags=re.S).strip()
   same=narrative(source)==narrative(tb) or source.strip() in tb or (r['file']=='core/skills/_shared/executor-dispatch-fallback.md' and e['sourceSpans'][0]['line']==292)
   if same:
    patch(r,e,target,None,'L12-62(1) explicitly selects this same-named knowledge how-to. Its registration/config steps remain the reference; the maintained successor updates the former execute door to fgos run. Frontmatter and that later command update are documented in the move witness; no current byte-identity claim.' if r['file']=='core/skills/_shared/executor-dispatch-fallback.md' and e['sourceSpans'][0]['line']==292 else 'Same-basename moved-verbatim knowledge holder; complete historical source text conserved. Ruling 1 permits this Phase 9 repair.',whole=True)
    e['movedVerbatimWitness']={'fromPath':path,'historicalSourceCommit':rev,'historicalDigest':m.sha(source),'targetDigest':m.sha(tb),'comparison':'complete narrative identical after frontmatter removal; line-292 executor how-to explicitly ruled patch by L12-62(1), with later execute-to-run update retained' if r['file']=='core/skills/_shared/executor-dispatch-fallback.md' else 'complete narrative identical after frontmatter removal'}
   else:e['successorNote']='L12-62: same basename exists at '+target+'; text differs, retain park pending exact successor/content judgment.'
# Passage search terms: content, ids, symbols and quoted titles, never just old paths.
def terms_for(r,e):
 f=r['file'];path=e['legacyPath'];eid=e['edgeId'];context=m.adjacent_passage(body(f),e['sourceSpans'])
 terms=set(re.findall(r'\b(?:RUL\d+[a-z]?|D-ADR\d+|00\d{2})\b',context))
 terms.update(t for t in re.findall(r'`([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)*)`',context) if len(t)>=8 and re.search(r'[A-Z_]',t[1:]) and t not in ('CONTEXT.md','RESEARCH.md'))
 special={
 'skills-105':['Attestation','sourceCaptureIds'], 'cli-001':['Attestation','sourceCaptureIds'], 'cli-003':['registry enforcement','currentPath'], 'cli-005':['session worktree','deliberately unchanged'],
 'class6-l-000192':['Release Tree Canonicalization','NFC','case collision'], 'class6-l-000193':['WorkspaceActivationBinding','Walking Skeleton'],
 'class6-l-000196':['workspace root','project root discovery'], 'class6-l-000197':['workspace root','project root discovery'],
 'class6-l-000201':['absent-sorts-last','triage table'], 'class6-l-000268':['process is gone','agent_status','Rust host handoff'],
 'class6-l-000273':['prompt-template registry','provenance renderer','deterministic resolver'],
 'class6-l-000282':['folder-trust','executeAssignment','hands the attempt over'], 'class6-l-000263':['ConfinementAttestation','Quy tắc dependency','Kết quả của cửa Authority'],
 'class6-l-000279':['Local Concurrency And Durability','buildRunControlHolder','resolveHolderLiveness'],
 'cli-006':['RUL9','Diagnostic by default'], 'class6-l-000328':['No hardcoded trunk','createBranchRef'],
 'class6-l-000255':['resolveExecutorProvider','H2b','RT1','F1'], 'class6-l-000293':['validation-s1-gate','pr-lifecycle'],
 'skills-085':['enduser-docs-index.json','Detailed Product And Source Map'], 'skills-088':['enduser-docs-index.json','Detailed Product And Source Map']}
 terms.update(special.get(eid,[]))
 if 'knowledge-registry' in path or path=='docs/architect/':terms.update(['sourceCaptureIds','docLifecycle','attestation'])
 if 'platform-foundations' in path:terms.update(re.findall(r'D-ADR\d+',context))
 if '0026' in path:terms.update(['Native-First Dispatch Doctrine','Lớp còn thiếu','judgeDiscovery'])
 if path=='docs/decisions/' or '<area>' in path or 'citation-format' in f:terms.update(['decision-index','area-scoped','narrative'])
 if 'worker-contract' in f:terms.update(['Skills reach','supports.skills','skills-unavailable'])
 terms={t for t in terms if t and (re.search(r'[A-Z_. -]',t) or len(t)>=16)}
 if path=='docs/specs/':terms.update(['area spec','state layer'])
 if path.startswith(('docs/how-to/','docs/reference/','docs/explanation/')):terms.add(path.rsplit('/',1)[-1].removesuffix('.md').replace('-',' '))
 if not terms:terms.add(path.rstrip('/').rsplit('/',1)[-1].removesuffix('.md').replace('-',' ') or 'area spec')
 return sorted(terms)
# Snapshot original parks as well as final parks: promoted slots retain their search evidence.
original_parks={(r['file'],e['slotKey']):e for r in oldrs for e in r['edges'] if e['disposition']=='parked'}
for r in rs:
 for e in r['edges']:
  if e['renderOnly']:continue
  if e['disposition']=='parked':
   why=e['blockedReason'].split(' Own source passage:')[0];whypark(e,why,e['blockedCategory'])
  if e['disposition']=='parked' or (r['file'],e['slotKey']) in original_parks:
   w=v.search(PIN,body(r['file']),e['sourceSpans'],terms_for(r,e),m.resolver)
   assessment=e['reason']
   if e.get('successorNote'):assessment+=' '+e['successorNote']
   w['assessment']=assessment;e['passageSearchWitness']=w
   journal['parkedSearch'].append({'file':r['file'],'slotKey':e['slotKey'],'edgeId':e['edgeId'],'disposition':e['disposition'],'witness':w})
# All preserved targets get tree/history facts, including example/provenance exceptions.
for r in rs:
 for e in r['edges']:
  if e['renderOnly'] or e['disposition']!='preserve':continue
  facts=v.existence(PIN,e['legacyPath']);ex=copy.deepcopy(facts)
  if facts['state']=='never-existed':
   context=m.adjacent_passage(body(r['file']),e['sourceSpans'])
   if e['legacyPath'].startswith('docs/decisions/'):
    ex['exception']='Removed/elided decision id; preserve captured provenance and generated-index comment. Successor notes below; runtime/index parity stays Step 5.'
   elif z.history(r['file']):ex['exception']='L12-60(2), L12-29 dated/archive capture, including malformed captured path or literal output; preserve history.'
   elif r['file']=='src/install/coexist.mjs' or 'str63-frozen-judge' in e['legacyPath']:ex['exception']='L12-47/51 and L12-62(2): explicit design-origin D1/D2/D4/D6 provenance, not a see-pointer.'
   else:ex['exception']='L12-10/49: literal example/adversarial path, paired sibling filenames or external-project convention; not a see-pointer.'
   e['reason']+=' L12-62 tree/history: '+ex['exception']
  elif facts['state']=='history':e['reason']+=' L12-62: absent at author pin; historical path only. Captured provenance/runtime-index spelling preserved; no live destination claim.'
  if r['file']=='CHANGELOG.md':
   hh=[h for h in m.heading_sections(PIN,r['file']) if h['startLine']<e['sourceSpans'][0]['line']<=h['sectionEndLine'] and h['level']==2];h=max(hh,key=lambda h:h['startLine']);e['historyRegion']={'heading':h['sample'],'line':h['startLine'],'marker':body(r['file']).splitlines()[e['sourceSpans'][0]['line']-1]}
  e['preservedPathWitness']=ex;journal['preservedExistence'].append({'file':r['file'],'slotKey':e['slotKey'],'edgeId':e['edgeId'],'witness':ex})
  for holder in m.removed_decision_holders(PIN,e,e['legacyPath']):
   if holder not in e['reason']:e['reason']+=' Non-executable successor note: '+holder+'.';journal['successorNotes'].append({'file':r['file'],'slotKey':e['slotKey'],'holder':holder})
for r in rs:
 for e in r['edges']:
  if not e['renderOnly'] and e['legacyPath']=='docs/decisions/0000-index.md':e['reason']+=' Non-executable successor note: docs/decisions/index.md (generated projection; Step 5 owns runtime reader/writer parity).'
# L12-62 explicitly requires a 0032 successor even for an elided id.
for r in rs:
 for e in r['edges']:
  if e['renderOnly'] or not re.match(r'docs/decisions/0032(?:$|[-.])',e['legacyPath']):continue
  holders=m.removed_decision_holders(PIN,e,e['legacyPath'])
  for holder in holders:
   if holder not in e['reason']:e['reason']+=' Non-executable successor note: '+holder+'.';journal['successorNotes'].append({'file':r['file'],'slotKey':e['slotKey'],'holder':holder})
# Refresh exact joins after outcomes change. Managed instruction passage, not distance, decides.
for r in rs:
 for e in r['edges']:
  if e['renderOnly']:
   source=next(x for x in r['edges'] if x['slotKey']==e['sourceSlotKey']);clear(e);e.update(disposition='render-join',sourceSlotKey=source['slotKey'],sourceDisposition=source['disposition'],timing=source['timing'],reason='L12-62: exact equal-passage canonical source join; no render diff. Source outcome: '+source['disposition']+'. Own render passage: '+repr(quote(e)))
  if e['disposition']!='patch':
   for k in ['anchors','relativeResolution','labelForm']:r['checks'][k].pop(e['slotKey'],None)
   for k in ['descriptionTruth','writerTrace']:r['checks']['coverage'][k].pop(e['slotKey'],None)
 # Group rationale and full diff are regenerated from current source-bound units.
 groups=collections.defaultdict(list)
 for e in r['edges']:
  if not e['renderOnly']:groups[m.unit_id(body(r['file']),e['sourceSpans'])].append(e)
 for es in groups.values():
  if len({e['disposition'] for e in es})>1:
   for e in es:e['unitDispositionReason']=e['slotKey']+' Distinct claim: '+e['matchedExpression']+' '+e['reason']
 changes=[]
 for e in r['edges']:
  if e['disposition']=='patch':changes+=m.replacement_changes(body(r['file']),e['sourceSpans'],r['checks']['relativeResolution'][e['slotKey']]['replacement'])
 for x in r.get('contextEdits',[]):changes+=m.replacement_changes(body(r['file']),x['sourceSpans'],x['replacement'])
 after=body(r['file'])
 for x,y,value in reversed(sorted(set(changes))):after=after[:x]+value+after[y:]
 r['diff']=m.make_diff(r['file'],body(r['file']),after)
 for e in r['edges']:
  if e['disposition']=='patch':
   n=e['sourceSpans'][0]['line'];e['diffHunk']=next(h.splitlines()[0] for h in m.hunks(r['diff']) if (lambda a,c:a<=n<a+c)(*map(int,re.match(r'@@ -(\d+)(?:,(\d+))?',h).groups(default='1'))))
   proof=r['checks']['anchors'][e['slotKey']];journal['patchAnchors'].append({'file':r['file'],'slotKey':e['slotKey'],'target':e['target'],'anchor':e['anchor'],'proof':proof,'method':'Repository listAnchors via Step 3 heading_sections; bound target evidence chooses nearest enclosing heading, never a section-number equality.'})
 r['inventoryEdgeIds']=[e['edgeId'] for e in r['edges']];r['inventoryInputs']=[{'path':k,**pop['inputPins'][k]} for k in sorted({ref['inventory'] for e in r['edges'] for ref in e['inventoryRefs']})]
 if r['inventoryInputs']:r['inventoryInputCommit']=r['inventoryInputs'][0]['commit'];r['inventoryFileDigest']=m.sha(m.blob(r['inventoryInputCommit'],r['file']))
 else:r['inventoryInputCommit']=None;r['inventoryFileDigest']=None
 # A census now joined to a source must not remain an explicit Step 5 exclusion.
 joined={(ref['inventory'],e['consumerFile'],ref['edgeId']) for e in r['edges'] for ref in e['inventoryRefs']}
 r['stepFiveExcluded']=[x for x in r['stepFiveExcluded'] if (x.get('inventory'),x['consumerFile'],x.get('edgeId')) not in joined]
 r['authoringRules']=list(dict.fromkeys(r['authoringRules']+['L12-62']))
# Every wrapped hit has exact coverage witnesses; no scanner-positive hit is silently discarded.
for hit in journal['wrappedScan']:
 r=ownerfiles[hit['owner']];f=hit['file'];ss=hit['spans']
 es=[e for e in r['edges'] if e['consumerFile']==f and any(s['line']==t['line'] and t['columnStart']<=s['columnStart']<t['columnEndExclusive'] for s in ss for t in e['sourceSpans'])]
 assert covers(es,f,ss) or covers(r['stepFiveExcluded'],f,ss),(f,hit)
 hit['slotKeys']=[e['slotKey'] for e in es];hit['stepFiveExcluded']=[x for x in r['stepFiveExcluded'] if x['consumerFile']==f and any(s['line']==t['line'] for s in ss for t in x['sourceSpans'])]
# Scheduling and population derive from records, not historical estimates.
for r in rs:
 for e in r['edges']:
  row=rowby[e['slotKey']];row.update(sourceOwner=r['file'],sourcePath=r['file'],renderOnly=e['renderOnly'],advisoryClass={'patch':'phase9','parked':'park'}.get(e['disposition'],e['disposition']))
  if e['renderOnly']:row['sourceDisposition']=e['sourceDisposition']
for b in bdata['batches']+bdata['mainMergeSupplement']['groups']:
 group=[r for r in rs if r['reviewSet']==b['batch']];b['edgeRefs']=[{k:rowby[e['slotKey']][k] for k in ('file','edgeId','inventoryRefs','supplementalOccurrenceKey') if k in rowby[e['slotKey']]} for r in group for e in r['edges']];b['edges']=sum(len(r['edges']) for r in group);b['classes']=dict(collections.Counter(e['disposition'] for r in group for e in r['edges']));b['sourceFiles']=[r['file'] for r in group];b['consumerFiles']=sorted({r['file'] for r in group}|{e['consumerFile'] for r in group for e in r['edges']});b['zeroEdgeOwners']=[r['file'] for r in group if not r['edges']]
 if 'files' in b:b['files']=b['consumerFiles']
oldby={r['file']:r for r in oldrs}
def outcome(e):return {k:e.get(k) for k in ['disposition','sourceDisposition','target','additionalTargets','anchor','timing','blockedReason']}
for r in rs:
 old=oldby[r['file']];olde={e['slotKey']:e for e in old['edges']};changes=[]
 for e in r['edges']:
  oe=olde.get(e['slotKey']);before=outcome(oe) if oe else None;after=outcome(e)
  if before!=after:changes.append({'slotKey':e['slotKey'],'edgeId':e['edgeId'],'before':before,'after':after})
 if changes or old['diff']!=r['diff'] or old.get('contextEdits')!=r.get('contextEdits'):journal['changes'].append({'file':r['file'],'set':r['reviewSet'],'slotChanges':changes,'diffChanged':old['diff']!=r['diff'],'oldRecordSha256':m.sha(q.canon(old)),'newRecordSha256':m.sha(q.canon(r))})
# Explicit named-file completion is independently replayable through final records.
named=['packages/distribution/rust/src/canonical.rs','AGENTS.md','bin/fgos.mjs','src/runner/dispatch/confinement/authority.mjs','src/runner/dispatch/run-lock.mjs','packages/distribution/rust/src/manifest.rs','src/runner/dispatch/assignment-policy.mjs','core/task-specs/fgos-indexing.md','core/skills/fgos-indexing/SKILL.md','core/skills/_shared/executor-dispatch-fallback.md','src/runner/merge.mjs','src/runner/worktree.mjs']
journal['namedReworks']=[{'file':f,'changed':any(x['file']==f for x in journal['changes'])} for f in named]
# Twelve file obligations include the separately ruled canonical.rs condition.
journal['namedReworkCountingNote']='Eleven unique files in outcome bullets plus the canonical.rs ruling-8 conditional; all twelve checked. canonical.rs remains parked because its actual canonicalization passage is carriage.'
journal['counts']={'records':len(rs),'slots':sum(len(r['edges']) for r in rs),'dispositions':dict(collections.Counter(e['disposition'] for r in rs for e in r['edges'])),'parkedContentSearches':len(journal['parkedSearch']),'preservedExistenceWitnesses':len(journal['preservedExistence']),'wrappedHits':len(journal['wrappedScan']),'patchAnchorWitnesses':len(journal['patchAnchors']),'changedOutcomeFiles':len(journal['changes']),'successorNotesAdded':len(journal['successorNotes'])}
pop['L12-62']={'authorPin':PIN,**journal['counts'],'witnesses':'step-04-l12-62-sweep.json'};bdata['summary'].update(sourceRecords=len(rs),slots=journal['counts']['slots'],openLeadRulingSlots=0,reviewRequest='step-04-wave3-review-request.md');bdata['state']='All 33 sets reworked under L12-62; independent wave3 review pending'
q.save('step-04-population.json',pop);q.save('step-04-batches.json',bdata)
for b in bdata['batches']+bdata['mainMergeSupplement']['groups']:
 before=m.git('rev-parse','main').decode().strip();(P/'step-04-records'/(b['batch']+'.jsonl')).write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs if r['reviewSet']==b['batch']));after=m.git('rev-parse','main').decode().strip()
 journal.setdefault('localMainBoundaries',[]).append({'set':b['batch'],'before':before,'after':after,'consumerDifferences':m.git('diff','--name-only',PIN+'..'+after,'--',*b['consumerFiles']).decode().splitlines()})
q.save('step-04-l12-62-sweep.json',journal);print(json.dumps(journal['counts']))
