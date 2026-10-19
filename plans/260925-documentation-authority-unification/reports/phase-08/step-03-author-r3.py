#!/usr/bin/env python3
"""Round 3 record authoring at immutable pin; writes plan artifacts only, never consumers.
Reuses pinned listAnchors, resolver, source spans and complete diff form from Step 3.
"""
import sys
sys.dont_write_bytecode=True
import copy,collections,importlib.util,json,pathlib,re
P=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('step03_check',P/'step-03-check.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
v=m.resolver
PIN='ae141550c2e022310de7a0efea757580c0b2479f'
c=m.Checker(PIN)
def write(name,obj):(P/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
def eid(n):return 'maps-j-'+str(n).zfill(5)
r2=[json.loads(l) for b in m.SETS for l in (P/'step-03-records-r2'/('batch-'+b+'.jsonl')).read_text().splitlines()]
rs=copy.deepcopy(r2);changes_by_rule=collections.defaultdict(set);reads=[]
runhist='Mục dưới đây giữ bối cảnh thiết kế lịch sử của Step 08.'
coord='docs/platform/agent-coordination/'
runner_dec='docs/platform/runner/decisions/h-36d872fbb0e5.md'
layout=('Description needs rewrite: the “5 tệp” list does not match the candidate layout. '
 'legacy-cli-transition.md and external-provider-protocol.md exist under docs/platform/host-invocation-routing/architecture/; '
 'host-invocation-provider-routing.md became architecture/provider-routing.md; node-to-rust-component-migration.md became architecture/node-to-rust-migration.md; '
 'rust-cli-and-proof-components-plan.md was not found in the candidate tree. Two moved under architecture/, two renamed, one not found; rewrite the entire list at Phase 9 before a path-only retarget.')

def mark(rule,e):changes_by_rule[rule].add(e['edgeId'])
def park(e,why,dep='Phase 9 source-row correction or missing-passage carry'):
 e.update(disposition='parked',diffHunk=None,target=None,anchor=None,timing='none',reason='L12-30(1,2,5,6), L12-31: '+why,blockedReason=why,dependency=dep)
def strip_patch_checks(r,e):
 for k in ['anchors','relativeResolution','labelForm']:r['checks'][k].pop(e['edgeId'],None)
 for k in ['writerTrace','resolutionSearches']:r['checks']['coverage'].get(k,{}).pop(e['edgeId'],None)

def bind_patch(r,e,target,terms=None,hint=None):
 body=m.blob(PIN,target).decode();e.update(disposition='patch',target=target,anchor=None,timing='Phase 9',blockedReason=None,dependency=None)
 e['reason']='L12-26(1,7), L12-30(7), L12-31(1,6): exact live candidate holder '+target+'; Phase 9 specification only; full source unit and description conserved.'
 proof={'targetCommit':PIN,'targetDigest':m.sha(body),'sourceLocatorTokens':terms or [],'locatorScopeReason':'Bare area pointer unless explicit target locator tokens are listed; source binding assessed in whole-file context.'}
 if hint:
  a=next(a for a in m.heading_sections(PIN,target) if hint.casefold() in body.splitlines()[a['startLine']-1].casefold())
  e['anchor']=a['githubSlug'] if e['matchedExpression'].startswith(('[','![')) else a['anchor'];proof['passage']=a['body']
 r['checks']['anchors'][e['edgeId']]=proof
 r['checks']['coverage'].setdefault('writerTrace',{})[e['edgeId']]='read-only citation; no writer/default-root/schema/identity change'
 r['checks']['labelForm'][e['edgeId']]={'status':'complete original link/path form conserved'}

def precise(r,e):
 proof=r['checks']['anchors'][e['edgeId']]
 if e['target'] in c.dirs:
  proof['enclosingHeadingProof']={'kind':'directory','reason':'whole-directory reference, no heading'};return
 aa=m.heading_sections(PIN,e['target']);body=m.blob(PIN,e['target']).decode();terms=proof.get('sourceLocatorTokens',[])
 if not e['anchor']:
  proof['enclosingHeadingProof']={'kind':'whole-file','reason':'locator-free file/area pointer; no heading citation asserted','targetDigest':m.sha(body)};return
 current=next(a for a in aa if e['anchor'] in (a['anchor'],a['githubSlug']))
 # H1 citations with rule/decision locators move to the deepest common enclosing section.
 if current['level']==1 and terms:
  fits=[a for a in aa if all(m.locator_present(t,a['body']) for t in terms)]
  if fits:
   chosen=max(fits,key=lambda a:(a['level'],-(a['sectionEndLine']-a['startLine'])))
   if chosen['startLine']!=current['startLine']:
    e['anchor']=chosen['githubSlug'] if e['matchedExpression'].startswith(('[','![')) else chosen['anchor'];proof['passage']=chosen['body'];current=chosen
    e['reason']+=' L12-31(1): most specific common enclosing heading #'+e['anchor']+'.';mark('L12-31(1)',e)
 # Explicit target proof records locator line sets and child-holder check using real API.
 locs=[]
 for token in terms:
  effective=proof.get('locatorCorrespondence',{}).get('target') if proof.get('locatorCorrespondence',{}).get('source')==token else token
  nums=[n for n,l in enumerate(body.splitlines(),1) if current['startLine']<=n<=current['sectionEndLine'] and m.locator_present(effective,l)]
  locs.append({'token':token,'targetToken':effective,'lines':nums})
 proof['enclosingHeadingProof']={'tool':'scripts/list-doc-anchors.mjs:listAnchors','targetCommit':PIN,'anchor':current['anchor'],'githubSlug':current['githubSlug'],'heading':body.splitlines()[current['startLine']-1],'startLine':current['startLine'],'sectionEndLine':current['sectionEndLine'],'locatorLines':locs,
  'narrowerCommonHolders':[{'anchor':a['anchor'],'startLine':a['startLine']} for a in aa if a['level']>current['level'] and current['startLine']<a['startLine']<=current['sectionEndLine'] and terms and all(m.locator_present(t,a['body']) for t in terms)],
  'reason':'Smallest enclosing section holding all scoped locators; translated-heading correspondence is explicit when needed.' if terms else 'The explicit section citation is its own holder; no narrower target locator is asserted.'}
 assert not proof['enclosingHeadingProof']['narrowerCommonHolders'],e['edgeId']

def assess_receipt(result,e):
 assessment=e['blockedReason'] if e['disposition']=='parked' else ('Selected live holder '+str(e['target']) if e['disposition']=='patch' else 'Migration-state row flip, no path substitution')
 receipt=v.witness(result,assessment)
 for q,g in zip(result['queries'],receipt['hitGroups']):
  live=[h for h in q['hits'] if not h['carriage']];carriage=[h for h in q['hits'] if h['carriage']]
  grouped=[]
  for path in sorted({h['file'] for h in live}):
   hits=[h for h in live if h['file']==path]
   if e['disposition']=='patch':
    why='selected exact holder; scoped claim proof recorded in checks.anchors' if path==e['target'] else 'other file: matching citation/partial or sibling content, not the selected exact source-unit holder'
   elif e['disposition']=='phase9-row-flip':why='status-row evidence only; not a path-substitution instruction'
   elif any(t in e['blockedReason'].casefold() for t in ['description needs rewrite','parity','default','workflow carry','gap-02','dead live','dead link']):why='locator occurrence does not satisfy the source-row description/carry/parity/evidence dependency stated below'
   else:why='locator or legacy citation occurs here; this is not the full missing source claim named below (distinguish mention from the exact narrative/contract)'
   grouped.append({'file':path,'hitCount':len(hits),'lines':[h['line'] for h in hits],
    'firstHit':hits[0]['text'].strip()[:240],'assessment':why})
  g['liveAssessment']=('Query '+repr(q['query'])+': no live hits at this pin; '+assessment if not live else
    'Query '+repr(q['query'])+': '+str(len(live))+' live hits; '+json.dumps(grouped,ensure_ascii=False,separators=(',',':'))+'. Source-unit verdict: '+assessment)
  g['carriageAssessment']='Query '+repr(q['query'])+': '+str(len(carriage))+' excluded snapshot/history hits: '+', '.join(h['file']+':'+str(h['line']) for h in carriage)+'. L12-30(3): these source-carriage locations cannot become live targets.'
 return receipt

# Complete source traversal and supplemental occurrence discovery, independent of advisory actions.
for r in rs:
 f=r['file'];before=m.blob(PIN,f).decode();lines=before.splitlines();cov=r['checks']['coverage'];cov['authorAddedEdgeIds']=[]
 inv_spans=[s for e in r['edges'] for s in e['sourceSpans']]
 candidates=m.scan_candidates(PIN,f,inv_spans);scan=[]
 reads.append({'file':f,'pin':PIN,'bytes':len(before.encode()),'lines':len(lines),'sha256':m.sha(before),'orderedWholeFileChunks':[{'firstLine':n+1,'lastLine':min(n+80,len(lines)),'sha256':m.sha('\n'.join(lines[n:n+80]))} for n in range(0,len(lines),80)],'search':'Every line traversed; full legacy-root paths and bare basenames of all committed retiring-tree Markdown files; source spans excluded only when already inventoried. Each remaining candidate is joined or explicitly excluded in checks.coverage.legacyScan.'})
 for span in candidates:
  token=span['text'];n=span['line'];base=token.split(':')[0];item={'span':span}
  # These common names refer to current candidate layout or retained root files, not retiring legacy sources.
  excluded=None
  if f=='docs/doc-governance.md':excluded='Generic filename in candidate platform/component directory layout (docs/platform/...); not a citation to a retiring docs/architect or docs/specs file.'
  elif f=='docs/reading-map.md' and n==61:excluded='Related platform anchors: docs/platform/vision.md and docs/platform/platform-foundations.md in the candidate reading order, not legacy specs.'
  elif base=='README.md' and not (f in ['docs/reading-map.md','docs/specs/reading-map.md'] and n in [163,44]):excluded='Retained repository README.md (package/install or implementation pointer); not retiring legacy README.'
  elif f=='docs/specs/runner.md' and base=='agent-report.md':excluded='Illustrative output filename in completed decision context; not any of the verification source files sharing this basename.'
  if excluded:item['excludedReason']=excluded;scan.append(item);continue
  key='author-r3-'+f.removesuffix('.md').replace('/','-')+'-L'+str(n)+'C'+str(span['columnStart'])
  legacy=base;why=None;target=None;terms=[];hint=None
  e={'edgeId':key,'sourceSpans':[span],'matchedExpression':token,'disposition':'preserve','diffHunk':None,'reason':'','target':None,'anchor':None,'timing':'none','blockedReason':None,'dependency':None}
  if f in ['docs/reading-map.md','docs/specs/reading-map.md']:
   if base in ['README.md','coordination-session.md','flow-definition.md']:
    legacy='docs/architect/agent-coordination/'+('' if base=='README.md' else 'contracts/')+base
    why='Description needs rewrite for historical coordination tree and live versus retired-engine boundaries (same complete source row as 08018/08193). '+base+' is named as a portal/contract in that live navigation row; carry/rewrite the row before retargeting. Non-executable successor note: '+coord+'history/retired-engine/.'
   else:
    legacy='docs/architect/host-invocation-routing/'+base;why=layout
  elif f=='docs/specs/confinement-authority.md':
   if base=='P04.md':
    legacy='docs/architect/agent-coordination/verification/confinement-authority-implementation/P04.md'
    e['reason']='L12-26(5), L12-31(2,5,6): exists at author pin; tree retires at Phase 9; preserved as completed fixture-migration lineage. Source quotes “chỉ di trú sang backend reference ở dạng fixture” and “Đã hoàn thành một phần (P04)”. Non-executable successor note: '+coord+'verification/confinement-authority-implementation/P04.md.'
   else:
    legacy='docs/specs/runner.md'
    if n in [582,1359]:why='RUL105 (an invocation declares the login store it reads) has no live or carriage hit across the candidate roots at the author pin; legacy runner source exists but the exact new rule needs carry into the candidate tree before this citation can redirect.'
    else:target='docs/platform/runner/subcomponents/h-6979005beaf7/spec.md';terms=['RUL80' if n==1360 else 'RUL78'];hint='Business Rules'
  elif f=='docs/specs/system-overview.md':
   legacy='docs/specs/'+base
   if n==83:
    e['reason']='L12-26(5), L12-31(2,5,6): exists at author pin; tree retires at Phase 9; preserved as retired decision history. Region quote: “Các ADR dưới đây được di dời nguyên văn từ `docs/decisions/` (tsk-1lv-4) -- corpus đó đã retired”. No approved candidate destination (P8-DOC-GAP-02).'
   elif base in ['platform-foundations.md','enduser-docs-authoring.md','enduser-docs-index.md']:
    why='P8-DOC-GAP-02: '+legacy+' exists at author pin but has no approved Phase 6 carry destination; carry its complete content before docs/specs/** retires. Bare area pointer cannot invent an owner.'
   elif base=='workflow.md':why='Workflow carry into the candidate tree (L12-27/L12-30(9)); '+legacy+' exists at author pin; no candidate workflow spec exists yet.'
   elif base=='fgos-plugin.md':why='Description needs rewrite: the area-list gloss says “12 verb wrapper”, but the live candidate docs/platform/claude-plugin/spec.md explicitly states /fgOS:check is not shipped. The same-named twelve-entry legacy list includes an unshipped check; correct the count/description before retargeting the area pointer.'
   else:target='docs/platform/'+{'distribution.md':'packaging-distribution'}.get(base,base[:-3])+'/spec.md'
  elif f=='docs/specs/workflow.md':
   legacy='docs/specs/runner.md';why='D-ADR0070 narrative is absent from candidate runner decisions; this bare runner.md sentence explicitly cites that official decision. Carry the exact record before redirecting (same claim as 08377); workflow carry must re-resolve its source coordinates.'
  elif f=='docs/specs/work-state.md':
   legacy='docs/specs/work-state.md'
   e['reason']='L12-26(5), L12-31(2,5,6): exists at author pin; tree retires at Phase 9; preserved as retired decision self-reference. Region quote: “Các ADR dưới đây được di dời nguyên văn từ `docs/decisions/` (tsk-1lv-4)”. Non-executable successor note: docs/platform/work-state/spec.md; historical line numbers are not a new live navigation assertion.'
  elif f=='docs/specs/runner.md':
   if base.startswith('docs/'):
    legacy=base
    if n==3356:e['reason']='L12-26(3,5), L12-31(5,6): retained directory exists at author pin: '+legacy+'; preserved as retired decision history, region quote: “Các ADR dưới đây được di dời nguyên văn từ `docs/decisions/` (tsk-1lv-4)”.'
    else:raise AssertionError((f,n,token))
   elif base=='runner.md':
    legacy='docs/specs/runner.md'
    # Current vocabulary's line coordinates are stale and self-targeting; never fabricate a live current anchor.
    why='Description needs rewrite: live vocabulary reference '+token+' is a legacy self-reference with stale line coordinates; the cited historical ADR line range must be reconciled with the live candidate decision holder before the retiring source can be removed. Non-executable successor note: '+runner_dec+'.'
   else:
    legacy='docs/architect/dispatch-control-plane-redesign.md'
    why='Description needs rewrite: '+token+' is a source line-coordinate citation in the live vocabulary table; approved candidate dispatch-control-plane.md is the successor but the exact old line claim must be mapped, not dropped. Non-executable successor note: '+coord+'architecture/dispatch-control-plane.md.'
  elif f=='docs/specs/decision-citation-drift.md':
   legacy=base;why='Step 5 CLI-default parity: --decisions-dir default docs/decisions must be assessed with the real checker reader/default; no isolated text edit. The retained directory exists at author pin.'
  elif f=='docs/specs/distribution.md':
   legacy=base;why='Step 5 shipped-file allowlist parity: '+legacy+' is part of the documented runtime package allowlist; retained directory exists at author pin, but the installed-file inventory and reader contract must be verified together before changing this behavioral string.'
  else:raise AssertionError((f,n,token))
  if f=='docs/specs/runner.md' and ':' in token and n<1320:
   lo=int(token.split(':')[1].split('-')[0]);source_lines=m.blob(PIN,legacy).decode().splitlines()
   why+=' Pinned cited line '+str(lo)+': '+(source_lines[lo-1] if lo<=len(source_lines) else '(outside file; '+str(len(source_lines))+' source lines)')+'.'
  e['authorAddedEdge']={'normalizedReference':legacy,'discoveryReason':'L12-31(6): complete-file supplemental search found this occurrence outside every inventory source span.','searchMethod':'Pinned whole-file lexical scan of full legacy roots and bare basenames from both retiring trees; contextual owner resolution recorded per edge.'}
  if why:
   source_path=re.sub(r':\d+(?:[-–]\d+)?$','',legacy)
   if source_path in c.tree or source_path.rstrip('/') in c.dirs:why+=' Source target exists at author pin: '+source_path+'.'
   park(e,why)
  elif target:bind_patch(r,e,target,terms,hint)
  else:assert e['reason'],(f,n,token)
  e['reason']+=' Source: '+f+':'+str(n)+'.';r['edges'].append(e);cov['authorAddedEdgeIds'].append(key);item['edgeId']=key;scan.append(item);mark('L12-31(6)',e)
 cov['legacyScan']={'pin':PIN,'method':'step-03-check.py:scan_candidates; pinned retiring-tree basename set + complete legacy-root references, across every source line; exclusions only for contextual nonlegacy names already pointing at current/retained roots. No inventory regeneration.','candidates':scan}
 for e in r['edges']:
  key=e['edgeId'];inv=c.entries.get(key);legacy=inv['normalizedReference'].split('#')[0] if inv else e['authorAddedEdge']['normalizedReference']
  if key in [eid(8215),eid(8218),eid(8244)]:
   park(e,'Dead live navigation: '+legacy+' never existed in Git ancestry of author pin. Present-tense “tại” / “xem” / Pointers reference lacks the report; supply the actual evidence or correct this source row. Baseline as pre-existing broken at Phase 9.','Missing evidence report or source-row correction');mark('L12-31(3)',e)
  if key in [eid(8019),eid(8194)]:park(e,layout);mark('L12-30(5,6)',e)
  if key in [eid(8271),eid(8287)]:
   number='0025' if key==eid(8271) else '0030';a=next(a for a in m.heading_sections(PIN,runner_dec) if a['level']==3 and a['body'].startswith('### '+number+' '))
   e['reason']='L12-30(5), L12-31(4): historical short id of decision record removed at 4722361ae with no successor file: '+legacy+'. Non-executable successor note: D-ADR'+number+' narrative at '+runner_dec+'#'+a['anchor']+'. Source spelling preserved in retired decision body.';mark('L12-31(4)',e)
  if e['disposition']=='preserve':
   # Retiring-tree factual wording, including braced multi-root spellings.
   retiring=legacy.startswith(('docs/specs/','docs/architect/')) or key==eid(8325)
   if retiring:
    role='retired history self-reference' if legacy.startswith('docs/specs/') and f==re.sub(r':\d+.*','',legacy) else 'retired history / lineage'
    fact='exists at author pin; tree retires at Phase 9' if re.sub(r':\d+(?:[-–]\d+)?$','',legacy) in c.tree or legacy.rstrip('/') in c.dirs or key==eid(8325) else 'resolved source-coordinate path is absent at author pin; tree retires at Phase 9'
    prev=e['reason'];e['reason']='L12-26(5,8), L12-31(2): '+fact+'; preserved as '+role+'. '+re.sub(r'(?i)retained','historical',prev)
    if key==eid(8250):e['reason']+=' Non-executable successor note: '+coord+'architecture/work-integration.md.'
    mark('L12-31(2)',e)
   if retiring:
    notes={'docs/specs/runner.md':'docs/platform/runner/spec.md','docs/specs/work-state.md':'docs/platform/work-state/spec.md','docs/specs/distribution.md':'docs/platform/packaging-distribution/spec.md','docs/specs/confinement-authority.md':'docs/platform/agent-confinement/spec.md','docs/specs/reading-map.md':'docs/reading-map.md','docs/architect/documentation-system-design.md':'docs/doc-governance.md','docs/architect/agent-coordination':'docs/platform/agent-coordination/README.md'}
    normalized=re.sub(r':\d+(?:[-–]\d+)?$','',legacy).rstrip('/')
    successor=notes.get(normalized)
    if successor:e['reason']+=' Non-executable file-level successor note: '+successor+'; no new historical locator correspondence is asserted.'
    elif key in [eid(8251),eid(8252)]:e['reason']+=' No live non-carriage successor to this retired coordination contract/ADR; the history/retired-engine copy is conservation only.'
   # Fill true state facts on earlier accepted preserves too, not just named review edges.
   if not re.search(r'exist|removed|committed|pattern|retained path',e['reason'],re.I):
    source_path=re.sub(r':\d+(?:[-–]\d+)?$','',legacy)
    if source_path in c.tree or source_path.rstrip('/') in c.dirs:
     e['reason']+=' L12-30(5): retained path exists at author pin: '+source_path+'.'
    elif any(t in source_path for t in '*<{'):
     directory=re.split(r'[*<{]',source_path)[0].rstrip('/');directory=directory if directory in c.dirs else str(pathlib.PurePosixPath(directory).parent)
     e['reason']+=' L12-30(4,5): illustrative pattern; '+('retained directory exists at author pin: '+directory if directory in c.dirs else 'no concrete executable target')+'.'
    else:
     history=m.git('log',PIN,'--format=%H','--',source_path).decode().splitlines()
     if history:e['reason']+=' L12-30(5): target removed at '+history[0]+'; original source spelling remains provenance: '+source_path+'.'
     else:e['reason']+=' L12-30(5): target never existed in Git ancestry of author pin: '+source_path+'.'
     if key==eid(8124):e['reason']+=' The source explicitly says “ban đầu định vị sống” and the corpus retired before this record was implemented; this intended 0035 mission-boundary location is not the unrelated runner decision 0035. Its narrative has P8-DOC-GAP-02, no approved candidate destination.'
    mark('L12-30(5)',e)
   # State exact framing for decisions and the deliberately retired CoordinationSession body.
   n=e['sourceSpans'][0]['line'];prefix=lines[:n]
   if f=='docs/specs/runner.md' and 1387<=n<=1440:
    e['reason']+=' L12-31(5) region quote: “'+runhist+'”';mark('L12-31(5)',e)
   elif any(x.startswith('## Lịch sử quyết định retired') for x in prefix):
    frame=next((x for x in lines if x.startswith('Các ADR dưới đây được di dời nguyên văn')), next(x for x in prefix if x.startswith('## Lịch sử quyết định retired')))
    e['reason']+=' L12-31(5) region quote: “'+frame+'”';mark('L12-31(5)',e)
   # Never-existing past-action preserves must cite the marker rather than infer history from path.
   if 'never existed' in e['reason'] and 'illustrative' not in e['reason']:
    markers={eid(5091):'**Claimed.** F4 — 2026-07-16',eid(8037):'benchmark lịch sử ngoài suite (F4)',eid(8038):'**Truth correction:** package.json:28 (scripts.test); git ls-tree e7393ea3c',eid(8219):'forgent workshop',eid(8235):'forgent workshop',eid(8236):'forgent workshop',eid(8351):'**Đã đóng:**'}
    if key in [eid(8219),eid(8236)]:
     e['reason']=e['reason'].replace('dated completed-action evidence','external forgent-workshop provenance (L12-21 upstream/external-project rule; no fgOS owner)')
    if key in markers:
     assert markers[key] in before,(key,markers[key]);e['reason']+=' L12-31(3,5) explicit past-action/audit marker: “'+markers[key]+'”.';mark('L12-31(3)',e)
    if key==eid(8358):e['reason']+=' Broken by relocation into verbatim history, not a new pre-existing legacy link failure; non-executable successor note: docs/platform/work-state/decisions/retired-decision-history.md (ADR 0012 narrative).';mark('L12-26(10)',e)
  if e['disposition']=='patch':
   if key in [eid(8058),eid(8059)]:
    proof=r['checks']['anchors'][key];proof['sourceLocatorTokens']=['RUL65b' if key==eid(8058) else 'RUL75']
    proof['passage']=next(a['body'] for a in m.heading_sections(PIN,e['target']) if a['anchor']=='business-rules')
   precise(r,e)
  elif e['disposition']=='parked':strip_patch_checks(r,e)
  # Refresh every non-preserve witness and bind a distinct judgement to each query's actual locations.
  if e['disposition']!='preserve':
   result=v.resolve(PIN,legacy,v.passage(before,e['sourceSpans']));receipt=assess_receipt(result,e)
   if e['disposition']=='parked':e['searchWitness']=receipt
   else:cov.setdefault('resolutionSearches',{})[key]=receipt
   mark('L12-31(7)',e)
 # Full file diff, including the author-added units, kept in source coordinates.
 edits=[]
 for e in r['edges']:
  if e['disposition']!='patch':continue
  replacement=m.form(e['matchedExpression'],f,e['target'],e['anchor'])
  r['checks']['relativeResolution'][e['edgeId']]={'replacement':replacement,'resolvedTarget':e['target'],'targetCommit':PIN,'authorityStatus':'cutover-patch-only'}
  a,b=m.bounds(before,e['sourceSpans'])[0];edits.append((a,b,replacement))
 after=before
 for a,b,replacement in sorted(set(edits),reverse=True):after=after[:a]+replacement+after[b:]
 r['diff']=m.make_diff(f,before,after)
 for e in r['edges']:
  if e['disposition']=='patch':
   n=e['sourceSpans'][0]['line'];hs=[h for h in m.hunks(r['diff']) if (lambda mm:int(mm[1])<=n<int(mm[1])+int(mm[2] or 1))(re.match(r'@@ -(\d+)(?:,(\d+))?',h))];assert len(hs)==1,(f,e['edgeId']);e['diffHunk']=hs[0].splitlines()[0]
 r['authoringRules']=['A51','L12-21..L12-31','L12-31 rulings 1–8 applied across complete source; Phase 9 record specifications only']
 print(f,collections.Counter(e['disposition'] for e in r['edges']),'added',len(cov['authorAddedEdgeIds']),flush=True)
for b in m.SETS:(P/'step-03-records'/('batch-'+b+'.jsonl')).write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs if r['reviewSet']=='batch-'+b))
manifest=m.manifest_view(rs,PIN);manifest['round']=3;manifest['round2Archive']='step-03-records-r2'
manifest['recordFiles']=[{'path':str(m.REL/'step-03-records'/('batch-'+b+'.jsonl')),'sha256':m.sha((P/'step-03-records'/('batch-'+b+'.jsonl')).read_bytes())} for b in m.SETS]
write('step-03-pilot-manifest.json',manifest)
write('step-03-r3-whole-file-reads.json',{'pin':PIN,'limit':'Ordered traversal and search receipts are accounting evidence; independent semantic full-file review remains required.','files':reads})
def edge_proof(r,key):
 return {k:r['checks'][k].get(key) for k in ['anchors','relativeResolution','labelForm']} | {k:r['checks']['coverage'].get(k,{}).get(key) for k in ['writerTrace','locatorScope','resolutionSearches']}
delta=[]
for old,new in zip(r2,rs):
 oe={e['edgeId']:e for e in old['edges']}
 delta.append({'file':new['file'],'set':new['reviewSet'],'before':dict(collections.Counter(e['disposition'] for e in old['edges'])),'after':dict(collections.Counter(e['disposition'] for e in new['edges'])),
 'dispositionChanged':[e['edgeId'] for e in new['edges'] if e['edgeId'] in oe and oe[e['edgeId']]['disposition']!=e['disposition']],
 'recordChanged':[e['edgeId'] for e in new['edges'] if e['edgeId'] in oe and (oe[e['edgeId']]!=e or edge_proof(old,e['edgeId'])!=edge_proof(new,e['edgeId']))],
 'edgeObjectChanged':[e['edgeId'] for e in new['edges'] if e['edgeId'] in oe and oe[e['edgeId']]!=e],
 'edgeProofChanged':[e['edgeId'] for e in new['edges'] if e['edgeId'] in oe and edge_proof(old,e['edgeId'])!=edge_proof(new,e['edgeId'])],
 'authorAddedEdge':[{'edgeId':e['edgeId'],'normalizedReference':e['authorAddedEdge']['normalizedReference'],'sourceSpans':e['sourceSpans'],'disposition':e['disposition']} for e in new['edges'] if e.get('authorAddedEdge')],
 'recordOnlyChanges':[k for k in new if k!='edges' and new[k]!=old.get(k)]})
write('step-03-r3-changes.json',{'pin':PIN,'files':delta,'edgesByRuling':{k:sorted(v) for k,v in sorted(changes_by_rule.items())},'before':dict(collections.Counter(e['disposition'] for r in r2 for e in r['edges'])),'after':dict(collections.Counter(e['disposition'] for r in rs for e in r['edges']))})
