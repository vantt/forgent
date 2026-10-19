#!/usr/bin/env python3
"""Pilot-specific author decisions, pinned source replay, and one diff per file.
Not a general mapping engine. Review the explicit decisions against whole files.
"""
import sys
sys.dont_write_bytecode=True
import collections, copy, importlib.util, json, pathlib, re
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('check',P/'step-03-check.py');m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
v=m.resolver
PIN='ae141550c2e022310de7a0efea757580c0b2479f'
def eid(n):return 'maps-j-'+str(n).zfill(5)
def write(path,obj):path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
# The immutable first-round records are retained before replacement, never refreshed on rerun.
archive=P/'step-03-records-r1';archive.mkdir(exist_ok=True)
for b in m.SETS:
 src=P/'step-03-records'/('batch-'+b+'.jsonl');dest=archive/src.name
 if not dest.exists():dest.write_bytes(src.read_bytes())
r1=[json.loads(l) for b in m.SETS for l in (archive/('batch-'+b+'.jsonl')).read_text().splitlines()]
inv={e['edgeId']:e for e in m.census()['entries']}
c=m.Checker(PIN)
# Explicit per-edge destinations selected from the pinned live passages, not advisory census actions.
patches={}
def patch(ids,path,section=None,locators=()):
 for n in ids:patches[eid(n)]=(path,section,list(locators))
platform='docs/platform/'
runner=platform+'runner/spec.md';rules=platform+'runner/subcomponents/h-6979005beaf7/spec.md'
work=platform+'work-state/spec.md';pack=platform+'packaging-distribution/spec.md'
cli=platform+'work-state/contracts/cli-io-contract.md';con=platform+'agent-confinement/spec.md'
drift=platform+'decision-citation-drift/spec.md';dec=platform+'runner/decisions/h-36d872fbb0e5.md'
patch([7239],pack,'9. Instruction Composition',['RUL102'])
patch([7976,8020,8149,8195,8243],pack)
patch([7977,8150],pack,'3.3 Dev Checkout Channel',['Dev checkout shell helpers'])
patch([7988,7989,7990,7995,8010,8021,8022,8023,8024,8025,8026,8027,8032,8033,8040,8161,8162,8163,8168,8183,8196,8197,8198,8199,8200,8201,8202,8205,8208,8209,8210,8217,8333],runner)
patch([7991,8030,8053,8092,8094,8098,8109,8164,8206,8379],work)
patch([7985,8158,8355],drift)
patch([7996,8169],platform+'claude-plugin/spec.md')
patch([7997,8170],platform+'herdr-web-dashboard/spec.md')
patch([8011,8184],con)
patch([8034,8212],platform+'observe/spec.md')
patch([7992,8165],cli,'3. Output Direction Unified Envelope')
patch([7993,8166],cli,'7. Machine-Readable Verb Registry')
patch([7994,8167],work,'11. Business Rules',['RUL60'])
patch([8031,8207],work,'11. Business Rules',['RUL45'])
patch([8008,8181],rules,'Business Rules',['RUL53'])
patch([8009,8182],rules,'Business Rules',['RUL93'])
patch([8016,8189],rules,'Business Rules',['RUL89'])
patch([8017,8192],rules,'Business Rules',['RUL84'])
patch([8078,8082],rules,'Business Rules',['RUL74','RUL75'])
patch([8058],rules,'Business Rules',['RUL65b'])
patch([8059],rules,'Business Rules',['RUL75'])
patch([8054,8255],con,'9.2',['§9.2'])
patch([8074,8334],platform+'system-overview/spec.md')
# 08334 points to the porting lifecycle, while 08074 points to its area-map entry.
patch([8334],platform+'distillery/spec.md')
patch([8227],platform+'agent-coordination/decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md')
patch([8232],platform+'agent-confinement/contracts/confinement-authority-v1.md')
patch([8248,8256],platform+'agent-coordination/architecture/dispatch-control-plane.md')
patch([8260],platform+'agent-coordination/architecture/work-integration.md')
patch([8331],platform+'runner/operations/h-51f5cd7279fd.md','Cổng duyệt PR nội bộ',['Cổng duyệt PR nội bộ'])
patch([8332],work,'7. Pull Door Take And Return',['Cửa pull giao–nhận việc'])
patch([8191,8375],dec,'Lịch sử quyết định retired',['0048','0049'])
patch([8056],dec,'0005',['0005'])
# Registry successors, exact record rather than inferred slug.
for n in [7998,8096,8102,8110,8171,8223,8224,8231]:
 e=inv[eid(n)];matches=v.aliases(PIN,e['normalizedReference'].split('#')[0]);paths={a['entry']['currentPath'] for a in matches if 'currentPath' in a['entry']};assert len(paths)==1,(n,paths)
 patch([n],paths.pop())

parks={}
def park(ids,reason,dependency=None):
 for n in ids:parks[eid(n)]=(reason,dependency or reason)
park([7965,8138], 'P8-DOC-GAP-02: curated docs/specs/platform-foundations.md has no approved Phase 6 destination; preserve its complete projection before retiring specs.')
park([7981,8004,8007,8028,8029,8154,8177,8180,8203,8204], 'P8-DOC-GAP-02: enduser-docs authoring/index specification has no approved live destination; carry the exact documentation contract before deletion.')
park([8107], 'P8-DOC-GAP-02: decision 0014 narrative is only in docs/specs/platform-foundations.md; candidate live narrative destination is missing. docs/decisions/index.md and docs/knowledge/decisions-index/decision-record.md are indexes, not the narrative.')
park([7972,8003,8145,8176], 'Legacy docs/specs/ tree description needs a whole-row semantic rewrite at Phase 9; a directory substitution cannot conserve its state-layer and audience distinction.')
park([7984,8062,8064,8066,8068,8070,8157,8353,8354], 'Step 5 checker/runtime default-root and scan-scope parity for docs/specs is unproved; documented scope must move with the real reader/default, not a citation substitution.')
park([7977,8150], 'Exact §Dev checkout shell helpers heading exists only inside Retained Distribution Source Detail. Live packaging-distribution/spec.md §3.3 Dev Checkout Channel is a narrower channel summary, not the cited shell helper contract; carry the helper passage into a live section.')
park([7979,8152], 'Description needs rewrite: the source explicitly labels the pointer “legacy spec”. Live setup/doctor content exists in packaging-distribution/spec.md §6 Doctor, Fix, And Legacy Setup and contracts/setup-doctor-registry.md; a path-only patch would leave that legacy-authority gloss false. Rewrite that whole gloss at the Phase 9 row change.')
park([8012,8185,8230], 'Exact confinement §13.1 confined-pane-accounts recipe is absent from live agent-confinement/spec.md; its only full holder is docs/platform/agent-confinement/history/rollout-and-settled-facts.md carriage. Carry that recipe before retargeting.')
park([8013,8186], 'Legacy architect README has only docs/platform/system-architecture/history/architect-readme.md carriage; no live architect-index successor conserves that portal.')
park([8014,8187], 'L12-30(3): architecture-intent whole-file candidate is Agent carriage preserving complete frozen source; same kind as the domainization conservation carrier. No live non-carriage whole-file design target; carry live intent before repointing.')
park([8015,8188], 'L12-30(3): docs/platform/domainization/architecture/domainization.md declares Source snapshot retained; no live non-carriage whole-file domainization successor. Carry live design before repointing.')
park([8019,8194], 'Description needs rewrite: the adjacent “5 tệp” list names legacy host-invocation files absent from the candidate directory; retargeting the path alone leaves the description false. Rewrite the complete list from candidate contents at Phase 9.')
park([8018,8193], 'Legacy agent-coordination tree description names historical contracts/vocabulary/roadmap structure; description needs rewrite with live versus retired-engine boundaries, not a directory substitution.')
park([8190,8254,8329,8330], 'Workflow carry into the candidate tree (L12-27/L12-30(9)); docs/specs/workflow.md must survive before docs/specs/** retires. Preserve decision spelling in its provenance consumers until the carry is resolved.')
park([8228], 'L12-30(3): docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md declares Source snapshot retained. Its §3.3/§4/§14 H1 passages are carriage, not a live proposal contract; carry those cited sections into a live target.')
park([8257], 'Exact coordination-session contract survives only under docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md; live restored coordination files do not provide that retired contract.')
park([8261], 'ADR-010 interactive/headless parity and isolation narrative survives only under docs/platform/agent-coordination/history/retired-engine; a live candidate decision for that claim is missing.')
park([8376], 'Legacy physical-identifier retention sentence requires its own approved L10 move; description needs rewrite after workflow carry, not a runner path substitution.')
park([8377], 'D-ADR0070 official decision record is absent from candidate runner decisions; only the legacy runner decision-history contains it. Carry that exact record before redirecting the official-record citation.')
park([8378], 'No single exact file covers 0047/0048/0049 and RUL84/RUL89/RUL94/RUL95; decision and business-rule holders are separate. Workflow carry into the candidate tree must re-resolve this combined current-spec pointer.')
# Live evidence links whose paths never existed are dead navigation (not placeholders).
park([8349], 'Dead live evidence link: docs/history/install-coexistence/reports/canary-run.md never existed in author-pin Git ancestry and no successor was found; baseline as pre-existing broken at Phase 9.')
park([8241], 'Dead live evidence pointer: docs/history/p50-workflow-induct/reports/p50-workflow-induct-6.md never existed in author-pin Git ancestry and no successor was found; baseline as pre-existing broken at Phase 9.')
# This closed, past-action reference stays history, even though located above decision history.
placeholders={eid(n) for n in [8085,8088,8342,8341]}
rows={eid(n) for n in [1905,1906,7955,7969,7970,8136,8142,8143,7958,7959,7960,7961]}
okfiles={'README.md','docs/doc-governance.md','docs/platform-foundations.md','docs/specs/confinement-authority.md','docs/specs/platform-foundations.md','docs/specs/fgos-plugin.md','docs/specs/observe.md'}

@__import__('functools').lru_cache(None)
def state(path):
 path=re.sub(r':\d+(?:[-–]\d+)?$','',path.removeprefix('repo/'))
 if any(x in path for x in ('*','<','{')):
  directory=re.split(r'[*<{]',path)[0].rstrip('/')
  if directory not in c.dirs:directory=str(pathlib.PurePosixPath(directory).parent)
  return 'illustrative pattern; retained directory '+directory+' exists' if directory in c.dirs else 'illustrative pattern, not a concrete link'
 if path in c.tree or path.rstrip('/') in c.dirs:return 'retained path exists at author pin: '+path
 log=m.git('log',PIN,'--format=%H','--',path).decode().splitlines()
 if not log:return 'target never existed in Git ancestry of author pin: '+path
 successors=sorted({a['entry']['currentPath'] for a in v.aliases(PIN,path) if 'currentPath' in a['entry']})
 if successors:return 'target removed at '+log[0]+'; registry successor '+', '.join(successors)+'; source spelling retained as provenance: '+path
 return 'target removed at '+log[0]+' with no successor established: '+path

def section(path,hint,markdown=False):
 aa=[a for a in m.anchors(PIN,path) if a['kind']=='heading']
 hits=[a for a in aa if hint.casefold() in a['heading'].casefold()] if aa and 'heading' in aa[0] else []
 if not hits:
  ls=m.blob(PIN,path).decode().splitlines()
  hits=[a for a in aa if hint.casefold() in ls[a['startLine']-1].casefold()]
 assert hits,(path,hint)
 a=hits[0];ls=m.blob(PIN,path).decode().splitlines();start=a['startLine'];level=len(re.match(r'^(#+)',ls[start-1])[1])
 end=next((i for i in range(start,len(ls)) if re.match(r'^#{1,'+str(level)+r'} ',ls[i])),len(ls))
 return a['githubSlug'] if markdown else a['anchor'],'\n'.join(ls[start-1:end])

rs=[];reads=[];resolution_rows=[]
for old in r1:
 f=old['file'];before=m.blob(PIN,f).decode();assert m.blob(m.INVENTORY,f)==before.encode();lines=before.splitlines()
 # Traverse the complete file in order; retain bounded chunk hashes, no omitted middle.
 chunks=[{'firstLine':i+1,'lastLine':min(i+80,len(lines)),'sha256':m.sha('\n'.join(lines[i:i+80]))} for i in range(0,len(lines),80)]
 reads.append({'file':f,'bytes':len(before.encode()),'lines':len(lines),'sha256':m.sha(before),'orderedWholeFileChunks':chunks})
 r={k:copy.deepcopy(old[k]) for k in ['file','inventoryInputCommit','authorInputCommit','inventoryFileDigest','digest','inventoryEdgeIds','reviewSet']}
 r.update(diff='',edges=[],checks={'coverage':{'wholeFileBytes':len(before.encode()),'wholeFileLines':len(lines),'binding':'identical complete file bytes at inventory and author pins; every original physical span retained','rebindings':{},'writerTrace':{},'locatorScope':{},'resolutionSearches':{}},'anchors':{},'relativeResolution':{},'labelForm':{}},authoringRules=['A51','L12-21..L12-30','L12-30 rulings 1–9; Phase 9 patch specifications only'])
 for oe in old['edges']:
  key=oe['edgeId'];i=inv[key];spans=copy.deepcopy(i['physicalSpans']);source=v.passage(before,spans);legacy=i['normalizedReference'].split('#')[0]
  e={'edgeId':key,'sourceSpans':spans,'matchedExpression':i['matchedExpression'],'disposition':'preserve','diffHunk':None,'reason':'','target':None,'anchor':None,'timing':'none','blockedReason':None,'dependency':None}
  if key in patches:
   target,hint,locs=patches[key];anchor=None;body=m.blob(PIN,target).decode();ps=body
   if hint:anchor,ps=section(target,hint,e['matchedExpression'].startswith(('[','![')))
   # Exact numeric section locators are kept in surrounding text, which may use translated titles.
   if locs and not hint:raise AssertionError(key)
   proof={'targetCommit':PIN,'targetDigest':m.sha(body),'sourceLocatorTokens':locs,
          'locatorScopeReason':'Per-edge scope: the complete physical passage is searched; unrelated locator hints inherited from sibling citations/glosses do not constrain this file pointer.'}
   scoped={
    7977:'Old shell-helper heading maps to live §3.3 Dev Checkout Channel, which documents sourcing the same helper; literal old title remains only in carriage.',
    8150:'Old shell-helper heading maps to live §3.3 Dev Checkout Channel, which documents sourcing the same helper; literal old title remains only in carriage.',
    7998:'The same source line cites gateway product decision 0014 before the separate UI/wireframe layout pointer; 0014 is not a locator on this layout reference. Registry alias binds the exact layout document.',
    8171:'The same source line cites gateway product decision 0014 before the separate UI/wireframe layout pointer; 0014 is not a locator on this layout reference. Registry alias binds the exact layout document.',
    8011:'This is the initial whole-file confinement spec pointer; §13.1 belongs to the later private-home recipe citation (08012), which remains parked separately.',
    8184:'This is the initial whole-file confinement spec pointer; §13.1 belongs to the later private-home recipe citation (08185), which remains parked separately.',
    8056:'ADR-0005 is headed 0005 in the live decision file. The source D3/D4 clause labels remain verbatim; this pointer targets the complete Runner isolation decision, not an area portal.',
    8224:'RUL64 and decision 0032 identify the enclosing runner rule; the cited gate-bypass explanation moved via the registry alias and retains its own complete design content, without adopting those rule ids as target headings.',
    8231:'RUL11 and curated capability catalog describe the enclosing policy gloss. Registry aliases identify the exact moved configuration reference; no target heading with those policy labels is asserted.',
    8232:'The enclosing RUL77 paragraph includes RUL76/88/90 and decisions 0061/0062. This citation specifically asserts direct executor calls require a capability anchor and must not infer it from executor.for, held in confinement-authority-v1.md:148-149; it does not cite a target RUL77 heading.',
    8256:'The quoted Từ vựng dispatch hiện hành is an internal runner-section cross-reference before the separate bare dispatch-control-plane pointer; it is not a heading locator on the latter.',
    8332:'The quoted Cửa pull giao–nhận việc title is translated to live §7 Pull Door Take And Return, which contains the take/return contract.',
    8379:'The source labels this as Lifecycle Work and universal tail, a whole-file current lifecycle pointer. The dated 0027 decision number is kept; its narrative remains in retired decision history, not an executable target.'
   }
   if int(key.rsplit('-',1)[1]) in scoped:proof['locatorScopeReason']=scoped[int(key.rsplit('-',1)[1])]
   if hint or locs:proof['passage']=ps
   if key in {eid(7977),eid(8150)}:proof['locatorCorrespondence']={'source':'Dev checkout shell helpers','target':'Dev Checkout Channel','reason':'L12-30(3): live dev-checkout section documents sourcing scripts/fgos-shell-integration.sh; the old heading is inside carriage.'}
   if key==eid(8332):proof['locatorCorrespondence']={'source':'Cửa pull giao–nhận việc','target':'Pull Door Take And Return','reason':'L12-30 live §7 is the translated take/return door, with take/return contract in the section.'}
   if key in {eid(8054),eid(8255)}:proof['sourceLocatorTokens']=['9.2']
   e.update(disposition='patch',target=target,anchor=anchor,timing='Phase 9',reason='L12-26(1,2,7), L12-30(1,7): exact live '+('locator passage' if hint else 'file/area pointer')+' at '+target+('#'+anchor if anchor else '')+'; complete label and locator spelling retained; candidate becomes authority only at cutover.')
   r['checks']['anchors'][key]=proof
   replacement=m.form(e['matchedExpression'],f,target,anchor)
   r['checks']['relativeResolution'][key]={'replacement':replacement,'resolvedTarget':target,'targetCommit':PIN,'authorityStatus':'cutover-patch-only'}
   r['checks']['coverage']['writerTrace'][key]='read-only citation; no writer/default-root/schema/identity change'
   r['checks']['labelForm'][key]={'status':'complete original link/path form conserved'}
  elif key in parks:
   why,dep=parks[key];e.update(disposition='parked',reason='L12-30: '+why,timing='none',blockedReason=why,dependency=dep)
  elif key in rows:
   if oe['disposition']=='phase9-row-flip':e.update({k:copy.deepcopy(oe[k]) for k in ['disposition','reason','dependency','timing']})
   else:e.update(disposition='phase9-row-flip',timing='Phase 9',reason='L12-26(6), L12-30: whole retained-root status row flip. Change the shared lead-in “During migration, the existing roots remain active” to “The following user-documentation roots remain active after the authority flip”. Keep all four existing directory paths; no path substitution.',dependency='Phase 9 authority flip; retained-root status verification')
  else:
   facts=state(legacy)
   if key in placeholders or any(x in legacy for x in ('<','*','NNNN','000N')):
    e['reason']='L12-30(4,5), L12-26(9,10): illustrative example or pattern; '+facts+'; preserve spelling, exclude placeholder from broken-link baseline.'
   elif key in {eid(8340)}:e['reason']='L12-30(4): illustrative example; '+facts
   elif True:
    n=spans[0]['line']
    source_history=('Lịch sử quyết định retired' in '\n'.join(lines[:n]) or (f=='docs/specs/runner.md' and 1387<=n<=1440))
    lineage=key in {eid(1902),eid(1904),eid(1909),eid(7953),eid(7963)}
    role='historical decision/provenance' if source_history or lineage else ('dated completed-action evidence' if legacy.startswith('docs/history/') or key==eid(8351) else 'retained navigation')
    if legacy.startswith(('docs/specs/','docs/architect/')) and not source_history and not lineage:
     raise AssertionError(('unclassified retiring pointer',key))
    e['reason']='L12-26(3,5,8), L12-30(5): '+role+'; '+facts+'; preserve exact source spelling.'
   successor=v.aliases(PIN,re.sub(r':\d+(?:[-–]\d+)?$','',legacy))
   paths=sorted({a['entry']['currentPath'] for a in successor if 'currentPath' in a['entry']})
   if paths:e['reason']+=' Non-executable successor note: '+', '.join(paths)+'.'
   if key in {eid(8367),eid(8368)}:e['reason']+=' Non-executable successor: docs/knowledge/fgos-triage-table-columns/triage-table-columns.md (move 126a8ae51); decision-provenance spelling retained.'
  e['reason']+=' Source: '+f+':'+str(spans[0]['line'])+'.'
  if e['disposition']!='preserve':
   result=v.resolve(PIN,legacy,source)
   assessment=(e['blockedReason']+' Every live hit listed here is a citation, partial holder or semantic/parity-blocked candidate, not an executable replacement for this exact source unit; carriage hits are excluded separately.') if e['disposition']=='parked' else ('Selected '+str(e['target'])+'; other hits are sibling citations, unrelated rules or carriage; see exact target passage binding.' if e['disposition']=='patch' else 'Whole migration-state row, not a missing-target claim; retained paths have status-only flip.')
   # Full candidate hits are emitted by the resolver; compact witness binds every hit by hash.
   receipt=v.witness(result,assessment)
   if e['disposition']=='parked':e['searchWitness']=receipt
   else:r['checks']['coverage']['resolutionSearches'][key]=receipt
   resolution_rows.append({'edgeId':key,**receipt})
  r['edges'].append(e)
 # Preserve the seven previously ok records, changing only notes or reasons where L12-30 applies.
 if f in okfiles:
  new=r;r=copy.deepcopy(old)
  for idx,e in enumerate(r['edges']):
   if f=='docs/platform-foundations.md' and e['edgeId']==eid(5091):r['edges'][idx]=new['edges'][idx]
   if f=='docs/doc-governance.md' and e['edgeId'] in {eid(1904),eid(1909)}:
    e['reason']+=' L12-30(3,5): retained legacy path exists; candidate documentation-system-design.md declares Source snapshot retained and is not a live patch target.'
  if any(e['disposition']=='patch' for e in r['edges']):
   for e in r['edges']:
    if e['disposition']=='patch':r['checks']['coverage'].setdefault('resolutionSearches',{})[e['edgeId']]=new['checks']['coverage']['resolutionSearches'][e['edgeId']]
  # Existing records retain their accepted locator proofs and exact hunks.
 if f in ['docs/specs/platform-foundations.md','docs/specs/enduser-docs-authoring.md','docs/specs/enduser-docs-index.md']:
  r['checks']['coverage']['carryObligation']='P8-DOC-GAP-02: no approved Phase 6 destination; do not delete docs/specs source without carrying its complete content; no destination invented by this record.'
 if f=='docs/specs/workflow.md':r['checks']['coverage']['carryObligation']='L12-27/L12-30(9): carry workflow into the candidate tree before docs/specs/** retires. Diffs here are Phase 9 source-coordinate specs; carry step must re-resolve all relative links at the eventual destination.'
 if f not in okfiles:
  changes=[]
  for e in r['edges']:
   if e['disposition']=='patch':
    a,b=m.bounds(before,e['sourceSpans'])[0];changes.append((a,b,r['checks']['relativeResolution'][e['edgeId']]['replacement']))
  after=before
  for a,b,replacement in sorted(set(changes),reverse=True):after=after[:a]+replacement+after[b:]
  r['diff']=m.make_diff(f,before,after)
  # Match each changed source line to the final shared hunk, not to incremental diffs.
  for e in r['edges']:
   if e['disposition']=='patch':
    line=e['sourceSpans'][0]['line']
    hs=[h for h in m.hunks(r['diff']) if (lambda mm:int(mm[1])<=line<int(mm[1])+int(mm[2] or 1))(re.match(r'@@ -(\d+)(?:,(\d+))?',h))]
    assert len(hs)==1,(f,e['edgeId']);e['diffHunk']=hs[0].splitlines()[0]
 rs.append(r)
 print('authored',f,dict(collections.Counter(e['disposition'] for e in r['edges'])),flush=True)
for b in m.SETS:
 (P/'step-03-records'/('batch-'+b+'.jsonl')).write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs if r['reviewSet']=='batch-'+b))
manifest=m.manifest_view(rs,PIN)
manifest['recordFiles']=[{'path':str(m.REL/'step-03-records'/('batch-'+b+'.jsonl')),'sha256':m.sha((P/'step-03-records'/('batch-'+b+'.jsonl')).read_bytes())} for b in m.SETS]
manifest['round']=2;manifest['round1Archive']='step-03-records-r1';write(P/'step-03-pilot-manifest.json',manifest)
write(P/'step-03-r2-whole-file-reads.json',{'pin':PIN,'files':reads})
(P/'step-03-r2-resolution-witnesses.jsonl').write_text(''.join(json.dumps(x,ensure_ascii=False,separators=(',',':'))+'\n' for x in resolution_rows))
changes=[]
for old,new in zip(r1,rs):
 oldes={e['edgeId']:e for e in old['edges']}
 changes.append({'file':new['file'],'set':new['reviewSet'],'before':dict(collections.Counter(e['disposition'] for e in old['edges'])),'after':dict(collections.Counter(e['disposition'] for e in new['edges'])),
                 'dispositionChanged':[e['edgeId'] for e in new['edges'] if oldes[e['edgeId']]['disposition']!=e['disposition']],
                 'recordChanged':[e['edgeId'] for e in new['edges'] if oldes[e['edgeId']]!=e],
                 'recordOnlyChanges':[k for k in new if k!='edges' and new[k]!=old.get(k)]})
write(P/'step-03-r2-changes.json',{'pin':PIN,'files':changes,'before':dict(collections.Counter(e['disposition'] for r in r1 for e in r['edges'])),'after':dict(collections.Counter(e['disposition'] for r in rs for e in r['edges']))})
