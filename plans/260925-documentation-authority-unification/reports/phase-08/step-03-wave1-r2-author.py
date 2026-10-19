#!/usr/bin/env python3
"""Reproduce L12-34 authored records from committed pre-ruling records; plan writes only."""
import sys
sys.dont_write_bytecode=True
import json,copy,re,pathlib,importlib.util,collections,posixpath
P=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('m',P/'step-03-check.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
PIN='ae141550c2e022310de7a0efea757580c0b2479f';c=m.Checker(PIN);v=m.resolver
old=[json.loads(line) for batch in tuple([f'{i:03}' for i in range(1,34)]+['040','041']) for line in m.blob('04913b160eac95a199718176ca75780573a3573d',str(m.REL/'step-03-records'/('batch-'+batch+'.jsonl'))).decode().splitlines()];rs=copy.deepcopy(old)
def legacy(e):return (c.entries.get(e['edgeId']) or e.get('authorAddedEdge',{}))['normalizedReference'].split('#')[0]
def witness(r,e):
 result=v.resolve(PIN,legacy(e),v.passage(m.blob(PIN,r['file']).decode(),e['sourceSpans']))
 receipt=v.witness(result,e['reason'])
 for g,q in zip(receipt['hitGroups'],result['queries']):
  g['category']='carriage' if not q['liveHitCount'] else ('citation-only' if e['disposition']=='parked' else 'partial-holder')
  g['note']=e['reason']
 return receipt

def drop(r,e):
 for k in ['anchors','relativeResolution','labelForm']:r['checks'][k].pop(e['edgeId'],None)
 for k in ['writerTrace','resolutionSearches','descriptionTruth','locatorScope']:r['checks']['coverage'].get(k,{}).pop(e['edgeId'],None)
 e.pop('searchWitness',None)
def preserve(r,e,why):
 drop(r,e);e.update(disposition='preserve',diffHunk=None,target=None,anchor=None,timing='none',blockedReason=None,dependency=None,blockedCategory=None,dependencyCategory=None,reason='L12-34: '+why)
def park(r,e,why,category='description-rewrite'):
 drop(r,e);e.update(disposition='parked',diffHunk=None,target=None,anchor=None,timing='none',blockedCategory=category,dependencyCategory=category,reason='L12-34: '+why,blockedReason=why,dependency=why);e['searchWitness']=witness(r,e)
def row(r,e,why):
 drop(r,e);e.update(disposition='phase9-row-flip',diffHunk=None,target=None,anchor=None,timing='Phase 9',blockedReason=None,dependencyCategory=None,blockedCategory=None,dependency='Phase 9 complete row/status-unit cutover after conservation; retained roots keep their paths.',reason='L12-34(3): whole row/status unit flips: '+why);r['checks']['coverage'].setdefault('resolutionSearches',{})[e['edgeId']]=witness(r,e)
def patch(r,e,target):
 drop(r,e);t=m.blob(PIN,target).decode();before=m.blob(PIN,r['file']).decode()
 e.update(disposition='patch',target=target,anchor=None,timing='Phase 9',blockedReason=None,dependency=None,blockedCategory=None,dependencyCategory=None,reason='L12-34(4): wrapper Related navigation to exact live whole-file holder '+target+'; provenance stays in its separate source line; Phase 9 specification only.')
 cov=r['checks']['coverage'];key=e['edgeId']
 r['checks']['anchors'][key]={'targetCommit':PIN,'targetDigest':m.sha(t),'sourceLocatorTokens':[],'targetLines':[],'wholeFileJustification':'The Related entry names the complete area document, without a subject/section locator; the area spec is the live holder of that whole subject.','locatorScopeReason':'Whole-file Related area pointer; surrounding provenance is a separate edge.'}
 cov.setdefault('writerTrace',{})[key]='read-only citation; no writer/default-root/schema/identity change'
 r['checks']['labelForm'][key]={'status':'complete original link/path form conserved'}
 cov.setdefault('descriptionTruth',{})[key]={'sourcePassage':v.passage(before,e['sourceSpans']),'adjacentPassage':m.adjacent_passage(before,e['sourceSpans']),'targetCommit':PIN,'target':target,'targetDigest':m.sha(t),'comparisons':{k:{'verdict':'not-asserted','note':'Related header names the whole subject; no '+k+' assertion. Separate provenance/implementation/status fields are not retargeted.'} for k in ['counts','ports','defaults','verbFileLists','versions','shippedStatus']},'assessment':'Live Related pointer only; target subject checked against title and area metadata. No adjacent numeric/version/shipped claim is asserted by the Related list.','targetEvidence':[{'line':1,'text':t.splitlines()[0]}]}
 cov.setdefault('resolutionSearches',{})[key]=witness(r,e)

retired=[]
for idx,r in enumerate(rs):
 f=r['file'];before=m.blob(PIN,f).decode();cov=r['checks']['coverage']
 if m.may_retire(f):
  rr={k:r[k] for k in ['file','inventoryInputCommit','authorInputCommit','inventoryFileDigest','digest','inventoryEdgeIds','reviewSet']}
  rr.update(retiresWithTree=True,edgeIds=[e['edgeId'] for e in r['edges']],authorAddedEdges=[{k:e[k] for k in ['edgeId','sourceSpans','matchedExpression','authorAddedEdge']} for e in r['edges'] if e.get('authorAddedEdge')],edges=[],diff='',authoringRules=['A51','L12-34(2)'],reason='Maintained consumer under the retiring tree; Phase 9 step 6 deletes this file after reader cutover. Inventory and already-discovered supplemental ids remain coverage; per-edge patch specifications are superseded, not applied. This maintained file is not a relocated byte-identical evidence payload.')
  rs[idx]=rr;retired.append({'file':f,'set':r['reviewSet'],'inventoryEdges':len(r['inventoryEdgeIds']),'addedEdges':len(rr['authorAddedEdges']),'edges':len(rr['edgeIds'])});continue
 # explicit decision permitted by brief: keep all work-state records, not a
 # partial diff with no fragment applicability contract in the existing schema.
 if f=='docs/specs/work-state.md':r['authoringRules'].append('L12-34(2): whole-file full-record fallback. Current record/diff contract has no fragment application boundary, so all 39 edges remain rather than declaring non-RUL10 fragments independently applicable. RUL10 passage and citations must carry under L12-17; no file-level retirement waiver.')
 for e in r['edges']:
  key=e['edgeId'];n=e['sourceSpans'][0]['line'];leg=legacy(e)
  if key in ['maps-j-05092','maps-j-05093']:
   preserve(r,e,'retained root exists at author pin: '+leg+'; Related navigation survives Phase 9 at the same path.')
  if key in ['maps-j-06578','maps-j-07213','maps-j-07214','maps-j-07766','maps-j-07780']:
   row(r,e,'Migration authority/status assertion, including retained-root dependencies; same unit as sibling status references. Replace the complete status description after promotion/conservation, without claiming deletion of retained roots.')
  if key=='maps-j-07881':preserve(r,e,'exists at author pin; tree retires at Phase 9; preserved as Provenance/header lineage. Non-executable successor note: docs/platform/work-state/spec.md.')
  if key=='maps-j-07891':preserve(r,e,'retained source exists at author pin: docs/work-item-lifecycle-vision.md; source lineage only. Non-executable successor note: docs/platform/vision.md.')
  if f=='docs/architecture-map.md' and key in ['maps-j-01246','maps-j-01250','maps-j-01252','maps-j-01256']:
   park(r,e,'Description needs rewrite: '+('A45 CTR010 row must reconcile the contract id and defined-in cell with candidate CTR010 Gateway / CTR011 confinement-authority.v1 before cutover.' if key=='maps-j-01250' else 'present-tense legacy docs/specs organisation or canonical reading-path assertion must be rewritten as a complete source unit for Phase 9; whole-file historical framing does not cover this live statement.'))
  if m.related_header(before,n) and leg.startswith(m.RETIRING_ROOTS):
   # Use reviewed exact successor where available; never select a carriage
   # holder merely because the mapped file exists.
   match=re.search(r'Non-executable (?:file-level )?successor note: ([^\s;,]+)',e['reason'])
   target=match[1].rstrip('.') if match else None
   if key=='maps-j-07953':target='docs/reading-map.md'
   if key=='maps-j-01904':target='docs/doc-governance.md'
   if not target and leg.startswith('docs/specs/'):
    area=leg.rsplit('/',1)[-1][:-3];target='docs/platform/'+{'fgos-plugin':'claude-plugin','distribution':'packaging-distribution'}.get(area,area)+'/spec.md'
   header=before[:before.find('```',before.find('```')+3)+3] if before.startswith('#') and '```' in before else before[:1800]
   if target==f or target and target in header:
    park(r,e,'Phase 9 carry review of duplicate Related entry: the live holder '+str(target)+' is the consumer itself or already listed; remove or consolidate this entry at cutover, preserving provenance separately.','phase9-carry')
   elif target in c.tree and not v.carriage(m.blob(PIN,target).decode(),1,target):patch(r,e,target)
   else:park(r,e,'Phase 9 carry of a live exact holder for Related subject '+leg+'; mapped holder '+str(target)+' is carriage-only or absent, so it cannot be an executable navigation target.','phase9-carry')
  # Remove meaningless self-successor annotations everywhere.
  e['reason']=re.sub(r'Non-executable (?:file-level )?successor note: '+re.escape(leg.rstrip('/'))+r'/?\.(?: |$)','',e['reason'])
  if 'docs/tutorials/'==leg.rstrip('/')+'/':
   e['reason']=e['reason'].replace('not present','a tracked placeholder directory')+' L12-34(8): docs/tutorials/ exists at the author pin with tracked .gitkeep only; docs/user/tutorials/ is absent. Correct the stale absence description in the whole migration status unit at cutover.'
  if f=='docs/user/README.md' and key in ['maps-j-08493','maps-j-08494','maps-j-08495','maps-j-08496']:
   e['reason']='L12-34(3,8): whole migration row status flip; retained '+leg+' exists at author pin and its path survives. docs/tutorials/ contains .gitkeep only; proposed docs/user/tutorials/ does not exist. This is a status correction, not directory creation or a path-retirement claim.'
   e['targetFacts']=[{'path':leg.rstrip('/'),'state':'exists'}]
  if key=='maps-j-06959':e['reason']='L12-34(8): Source type / promoted-from provenance; glob is a pattern, not a literal file. Committed directory docs/architect/host-invocation-routing exists at author pin; tree retires at Phase 9. Non-executable successor note: docs/platform/host-invocation-routing/README.md.'
  if key in ['maps-j-07816','maps-j-07817']:e['reason']='L12-34(8): retained docs/ui-spec/00-overview.md exists at author pin; '+('provenance' if key.endswith('816') else 'Related pointer to retained root')+'; no generated-output assertion is made by this span.'
  if key=='maps-j-03978':e['reason']='L12-34(8): retained root docs/doc-governance.md exists at author pin; unchanged navigation.'
  if key=='maps-j-06585':e['reason']=e['reason'].replace('docs/platform/agent-confinement/README.md','docs/platform/agent-confinement/contracts/confinement-authority-v1.md')
  # Removed decisions elided in source are abbreviations of real records.
  if key in ['maps-j-01259','maps-j-06594']:
   path='docs/decisions/0017-dong-audit-he-id-ten-goi.md';e['targetFacts']=[{'path':path,'state':'removed','commit':'4722361ae'}]
   e['reason']='L12-34(8): source token abbreviates '+path+'; removed at 4722361ae with no successor file; preserved as decision-history source spelling. Non-executable narrative-holder note: '+f+' (retired decision 0017 section).'
  if f=='docs/architecture-map.md' and e['disposition']=='preserve':
   # The root remains live. Only the actual version/changelog and retired
   # decision units are historical; retained current paths stand on existence.
   facts=e.get('targetFacts',[])
   if n<80 and leg.startswith('docs/decisions/'):
    e['reason']='L12-34(7,8): preserved as version/changelog decision citation; the source explicitly says “nâng v0.3 / nâng v0.5 / nâng v0.6” or “Changelog”, not present-tense navigation. '
   elif n>=585:
    e['reason']='L12-34(7,8): preserved inside the retired-decision region, framed by “Các ADR dưới đây được di dời nguyên văn từ `docs/decisions/` (tsk-1lv-4, D5) -- corpus đó đã retired”. '
   elif key in ['maps-j-01258','maps-j-01259']:
    e['reason']='L12-34(7,8): preserved as source citation in the identifier-audit boundary summary (“chốt tại”), not an operative reader or legacy-tree authority statement. '
   elif key=='author-wave1-docs-architecture-map-L41C27' or n==41:
    e['reason']='L12-34(7): preserved as version-change source-set identity (“Thêm §12: quan hệ với”), not a current canonical read instruction. '
   else:e['reason']='L12-34(7,8): retained root/current file reference outside the retiring trees; source path exists at author pin and survives at its current path. '
   removed=next((fact for fact in facts if fact['state']=='removed'),None)
   if removed:e['reason']+='Source record '+removed['path']+' removed at '+removed['commit']+' with no successor file. '
   elif leg.startswith(m.RETIRING_ROOTS):e['reason']+='Source target exists at author pin; tree retires at Phase 9; source spelling remains historical. '
   elif leg.rstrip('/') in c.tree|c.dirs:e['reason']+='Path exists at author pin: '+leg+'. '
   narrative_id={'maps-j-01237':'0010','maps-j-01238':'0012','maps-j-01239':'0013','maps-j-01240':'0015','maps-j-01241':'0017','maps-j-01242':'0012','maps-j-01243':'0013','maps-j-01244':'0015','maps-j-01258':'0004','maps-j-01259':'0017'}.get(key)
   if narrative_id:
    if narrative_id in ['0010','0015','0017']:holder='docs/architecture-map.md, retired decision '+narrative_id+' section'
    else:holder='docs/platform/work-state/decisions/retired-decision-history.md, section '+{'0004':'4. ADR 0004 Scope And Non-Goals','0012':'8. ADR 0012 Unified Typed-Edge Graph Model','0013':'9. ADR 0013 Report-Not-Write Channel For Discovered-From'}[narrative_id]
    e['reason']+='Non-executable narrative-holder note: '+holder+'.'
   if key=='maps-j-01266':e['reason']+='The removed 0000-index.md is the old hand-written index, not a decision narrative. Non-executable successor note: docs/decisions/index.md (generated retained index).'
   if n==41 and 'reading-map.md'==e['matchedExpression']:e['reason']+='Non-executable successor note: docs/reading-map.md.'
 # Stray resolution receipt belonged to excluded candidate-local link.
 cov.get('resolutionSearches',{}).pop('author-wave1-docs-platform-work-state-README-L62C185',None)
 # Re-run new scan and preserve prior exact-span contextual exclusions. Each new
 # resolving relative form becomes a real edge; ambiguous layout tokens retain
 # a context-specific exclusion (never silently mapped to a retired basename).
 invspans=[s for key in r['inventoryEdgeIds'] for s in c.entries[key]['physicalSpans']]
 prior={(x['span']['line'],x['span']['columnStart'],x['span']['columnEndExclusive']):x for x in cov.get('legacyScan',{}).get('candidates',[])}
 candidates=m.scan_candidates(PIN,f,invspans);items=[]
 for span in candidates:
  k=(span['line'],span['columnStart'],span['columnEndExclusive']);existing=next((e for e in r['edges'] if e.get('authorAddedEdge') and e['sourceSpans']==[span]),None)
  force_root_map=f=='docs/architecture-map.md' and span['text']=='reading-map.md' and span['line'] in [41,735]
  vocabulary_ref='orchestration-vocabulary-map-' in f and span['text']=='dispatch-control-plane-redesign.md'
  if existing:items.append({'span':span,'edgeId':existing['edgeId']});continue
  if k in prior and not force_root_map and not vocabulary_ref:items.append(prior[k]);continue
  token=span['text'];link=re.fullmatch(r'!?\[[^\]]+\]\(([^)]+)\)',token);destination=link[1] if link else token;raw=re.sub(r':\d+(?:[-–]\d+)?$','',destination.split('#')[0]);area='/'.join(f.split('/')[:3]) if f.startswith('docs/platform/') else posixpath.dirname(f)
  roots=m.reference_roots(f,before);targets=[posixpath.normpath(posixpath.join(root,raw)) for root in roots]
  local_roots=[posixpath.dirname(f)]+(['/'.join(f.split('/')[:3])] if f.startswith('docs/platform/') else [])
  if any((t in c.tree or t in c.dirs) and not t.startswith(m.RETIRING_ROOTS) for t in [posixpath.normpath(posixpath.join(root,raw)) for root in local_roots]):targets=[]
  targets=[t for t in dict.fromkeys(targets) if t.startswith(m.RETIRING_ROOTS) and (t in c.tree or t in c.dirs)]
  if vocabulary_ref:targets=['docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md']
  if force_root_map:targets=['docs/specs/reading-map.md']
  if not targets:
   items.append({'span':span,'excludedReason':'Full-file contextual scan: '+token+' is a candidate-local layout/proposed filename or retained root, not a path resolving from this consumer directory/area root to an existing retiring file.'});continue
  leg=targets[0];key='author-wave1-r2-'+f[:-3].replace('/','-')+'-L'+str(span['line'])+'C'+str(span['columnStart'])
  e={'edgeId':key,'sourceSpans':[span],'matchedExpression':token,'authorAddedEdge':{'normalizedReference':leg,'discoveryReason':'L12-34(5,7): resolving tree-relative/backticked sibling or root-map reading-map reference.','searchMethod':'Checker-run full-file scan; consumer-directory and area-root resolution against pinned Git tree.'},'disposition':'preserve','diffHunk':None,'target':None,'anchor':None,'timing':'none','blockedReason':None,'dependency':None,'blockedCategory':None,'dependencyCategory':None,'reason':''}
  if f=='docs/architecture-map.md':preserve(r,e,'exists at author pin; tree retires at Phase 9; preserved as '+('decision history, in decision 0017 narrative' if span['line']==735 else 'source-set identity in the architecture-map version description')+'. Non-executable successor note: docs/reading-map.md.')
  else:preserve(r,e,'exists at author pin; tree retires at Phase 9; preserved as literal source-carriage path '+leg+'. Source framing: “Original source metadata and text follow” / “Full source text follows”; no executable current claim is inferred.')
  r['edges'].append(e);items.append({'span':span,'edgeId':key})
 # Superseded substring scan items (now absorbed in a complete relative unit)
 # must not keep orphan added edges.
 joined={x['edgeId'] for x in items if x.get('edgeId')}
 for e in list(r['edges']):
  if e.get('authorAddedEdge') and e['edgeId'] not in joined:
   raise AssertionError(('lost existing supplemental edge',f,e['edgeId']))
 cov['authorAddedEdgeIds']=[e['edgeId'] for e in r['edges'] if e.get('authorAddedEdge')]
 cov['legacyScan']={'method':'L12-32(4), L12-34(5): whole pinned file; full/partial legacy roots, retiring basenames, tree-relative and backticked sibling paths resolving from consumer directory or area root. Every hit joined or contextually excluded.','pin':PIN,'candidates':items}
 for e in r['edges']:e['unitId']=m.unit_id(before,e['sourceSpans']);e.pop('unitDispositionReason',None)
 groups=collections.defaultdict(list)
 for e in r['edges']:groups[e['unitId']].append(e)
 for unit,es in groups.items():
  if len({e['disposition'] for e in es})>1:
   for e in es:e['unitDispositionReason']='L12-34(3): '+('historical/source locator or retained-root dependency remains literal; sibling current navigation has an independent target/description blocker: '+e['reason'] if e['disposition']=='preserve' else 'independent source claim: '+e['reason'])
 # rebuild complete diffs and exact hunk binding
 edits=[]
 for e in r['edges']:
  if e['disposition']!='patch':continue
  replacement=m.form(e['matchedExpression'],f,e['target'],e['anchor']);r['checks']['relativeResolution'][e['edgeId']]={'replacement':replacement,'resolvedTarget':e['target'],'targetCommit':PIN,'authorityStatus':'cutover-patch-only'}
  a,b=m.bounds(before,e['sourceSpans'])[0];edits.append((a,b,replacement))
 after=before
 for a,b,value in sorted(set(edits),reverse=True):after=after[:a]+value+after[b:]
 r['diff']=m.make_diff(f,before,after)
 for e in r['edges']:
  if e['disposition']=='patch':
   n=e['sourceSpans'][0]['line'];h=next(h for h in m.hunks(r['diff']) if (lambda mm:int(mm[1])<=n<int(mm[1])+int(mm[2] or 1))(re.match(r'@@ -(\d+)(?:,(\d+))?',h)));e['diffHunk']=h.splitlines()[0]
 r['authoringRules'].append('L12-34(1–8): retirement exceptions, migration units, Related wrapper navigation, complete relative scan, live root-map seam and factual notes applied; independent semantic review pending.')
for b in sorted({r['reviewSet'] for r in rs}):
 (P/'step-03-records'/(b+'.jsonl')).write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs if r['reviewSet']==b))
(P/'step-03-wave1-r2-retirements.json').write_text(json.dumps({'pin':PIN,'files':retired,'fileCount':len(retired),'edges':sum(x['edges'] for x in retired),'workStateFallback':'Full records retained for entire docs/specs/work-state.md; existing per-file diff schema has no fragment applicability contract. RUL10 passage and citing edges remain under L12-17 carry. No non-RUL10 patch is applied in Step 3.','evidenceExceptions':'No relocated non-authority evidence payload occurs in this 96-file authored population. Maintained verification README indexes and the vocabulary design-history document are maintained consumers, not proof payloads.'},ensure_ascii=False,indent=2)+'\n')
print('records',len(rs),'retired',len(retired),sum(x['edges'] for x in retired),'active',sum(not r.get('retiresWithTree') for r in rs),sum(len(r['edges']) for r in rs))
