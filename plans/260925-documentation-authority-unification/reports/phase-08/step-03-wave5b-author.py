#!/usr/bin/env python3
"""Batch 083–085 record authoring using the unchanged checker/resolver/author primitives."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,copy,collections,re
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('w',P/'step-03-wave5a-author.py');w=importlib.util.module_from_spec(sp);sp.loader.exec_module(w)
m=w.m;a=w.a3;PIN=w.PIN;SETS=('083','084','085');m.SETS=SETS;c=w.c

def save(n,o):(P/n).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def preserve(r,e,path,body,reason):
 if m.carriage_declaration(body,e['sourceSpans'][0]['line']):a.preserve(r,e,path,body,'')
 else:w.preserve(r,e,path,body,reason)
def park(r,e,path,body,reason,category='description-rewrite'):
 a.park(r,e,path,body,reason,category)

def disposition(r,e,path,body):
 n=e['sourceSpans'][0]['line'];key=e['edgeId'];context=m.adjacent_passage(body,e['sourceSpans']);line=body.splitlines()[n-1]
 if m.carriage_declaration(body,n):preserve(r,e,path,body,'');return
 if m.related_header(body,n) and path.startswith(m.RETIRING_ROOTS):
  if path=='docs/specs/runner.md':a.a.patch(r,e,path,body,'docs/platform/runner/spec.md');return
  if path=='docs/specs/confinement-authority.md':
   if r['file']=='docs/platform/agent-confinement/spec.md':
    park(r,e,path,body,'Description needs rewrite: Related names this area spec through its retiring source identity. The candidate spec is this consumer itself, so a redirect would create a self pointer (L12-40(2)); remove/consolidate the Related item as a whole at cutover.');return
   target='docs/platform/agent-confinement/spec.md'
   w.patch(r,e,path,body,target,assessment='The Related entry names the confinement authority subject without a section or behavior claim. The candidate area spec covers the one-door authority, threat axes, backend ownership, rollout limits and contract companions; this is whole-area related reading, separate from original-source Provenance.');return
  if path=='docs/architect/agent-coordination/documentation-standardization-plan.md':
   park(r,e,path,body,'Description needs rewrite: Related names the retired documentation standardization plan. Its exact surviving holder docs/platform/agent-coordination/history/documentation-migration/documentation-standardization-plan.md declares a verbatim source snapshot and historical non-authority policy. Consolidate/rewrite the complete migration navigation item at cutover; no live pointer into source carriage.');return
  raise AssertionError(('Related unresolved',r['file'],key,path))
 if key=='maps-j-05127':
  target='docs/platform/runner/subcomponents/h-6979005beaf7/spec.md';h=next(h for h in reversed(m.heading_sections(PIN,target)) if h['startLine']<=162<=h['sectionEndLine'])
  a.anchored_patch(r,e,path,body,target,h['anchor'],nums=[162,167,168,169,170,171,172],locators=['RUL75'],assessment='Pinned RUL75 states source renewal occurs once in a copy fgOS holds and renewed private-home credentials are written back. Its introduction and write-back detail preserve the exact three-part RUL75 gloss in the adjacent source paragraph, with the same opt-in boundary and SQLite snapshot mechanism. Additional local confinement provisioning details remain local elaboration; this citation does not attribute a second rule to the RUL75 introduction.');return
 if key in ('maps-j-05152','maps-j-05160'):
  park(r,e,path,body,'Description needs rewrite: the live implementation-evidence citation embeds the old runner.md line coordinate '+e['matchedExpression']+'. Its '+('0049 Work-boundary' if key.endswith('152') else 'Unit mutation-admission')+' subject has a decision holder in docs/platform/runner/decisions/h-36d872fbb0e5.md, but a bare path replacement would retain the wrong old line locator. Rewrite the complete source locator and evidence claim against the exact decision passage at cutover.');return
 if key=='maps-j-05136':
  target='docs/platform/runner/decisions/h-36d872fbb0e5.md';h=next(h for h in m.heading_sections(PIN,target) if h['sample'].startswith('0062 —'))
  a.anchored_patch(r,e,path,body,target,h['anchor'],nums=[1718,1721,1722],assessment='Decision 0062 removes the raw dispatch execute/log/fanout doors and makes fgos run/workflow the execution doors. The complete adjacent source paragraph says execute --assignment was removed along with that raw execute door while decide --for/--work remain adapter compatibility; the cited decision has that exact scope.');return
 if key=='maps-j-05123':
  e.update(disposition='phase9-row-flip',timing='Phase 9',reason='L12-35(2): complete migration-state row 7 flips at Phase 9. It says the confinement component and CTR011 are registered in the candidate map while legacy docs/architecture-map.md changes only at cutover; retain the A45 CTR010/CTR011 distinction and replace the entire candidate-versus-legacy status claim with the accepted post-cutover map state.',dependency='Phase 9 map/registry cutover after A45 and conservation/review; no contract renumbering or early map edit.');return
 if 'Provenance:' in line or re.match(r'^\*\*Source:\*\*|^Source:',line):
  preserve(r,e,path,body,'L12-47, L12-34(4): original Source/Provenance lineage is literal, separate from Related/current reading. This header identifies the original input document and its recorded import pin; it does not instruct a current read.');return
 if key in ('maps-j-05168','maps-j-05216','maps-j-05218'):
  preserve(r,e,path,body,'L12-35(3): Superseded-by retirement framing records the original runtime-owner source identity; separate Related navigation redirects independently. Non-executable successor note: docs/platform/runner/spec.md.');return
 if path.startswith(m.RETIRING_ROOTS):
  assert m.history_scope(r['file'],body,n),(r['file'],key,path,context)
  preserve(r,e,path,body,'L12-38: history file records the original settled rollout/provisioning rule identity, not present navigation. '+repr(context)+' Non-executable successor note: docs/platform/runner/subcomponents/h-6979005beaf7/spec.md.');return
 preserve(r,e,path,body,'L12-26: surviving retained-root or candidate-native citation keeps its complete path/link form. This entry introduces no authority-status, writer or schema change. Adjacent source: '+repr(context))

def finish(r,body):
 cov=r['checks']['coverage'];ls=body.splitlines()
 for e in r['edges']:
  if e['disposition']=='parked':
   # Reuse the resolver's compact count/hash witness for complete adjacent context.
   # This supplements, without replacing, the required physical-span witness.
   context=m.adjacent_passage(body,e['sourceSpans']);path=w.path_for(e)
   extra=m.resolver.witness(m.resolver.resolve(PIN,path,context),e['reason'])
   for g in extra['hitGroups']:g['category']='partial-holder' if g['liveCount'] else 'carriage' if g['carriageCount'] else 'dead'
   m.verify_witness(extra,PIN,path,context)
   cov.setdefault('adjacentResolutionSearches',{})[e['edgeId']]=extra
   cov.get('extraLocatorSearches',{}).pop(e['edgeId'],None)
 groups=collections.defaultdict(list)
 for e in r['edges']:groups[m.unit_id(body,e['sourceSpans'])].append(e)
 for group in groups.values():
  if len({e['disposition'] for e in group})>1:
   for e in group:e['unitDispositionReason']=e['edgeId']+' '+e['matchedExpression']+' Distinct claim: '+e['reason']
 edits=[]
 for e in r['edges']:
  if e['disposition']=='patch':edits+=m.replacement_changes(body,e['sourceSpans'],r['checks']['relativeResolution'][e['edgeId']]['replacement'])
 after=body
 for x,y,new in sorted(set(edits),reverse=True):after=after[:x]+new+after[y:]
 r['diff']=m.make_diff(r['file'],body,after)
 for e in r['edges']:
  if e['disposition']=='patch':
   hs=[h for h in m.hunks(r['diff']) if any('-'+ls[s['line']-1] in h.splitlines() for s in e['sourceSpans'])];assert len(hs)==1;e['diffHunk']=hs[0].splitlines()[0]

def fix04939():
 p=P/'step-03-records/batch-081.jsonl';before=p.read_bytes();rs=[json.loads(l) for l in before.decode().splitlines()]
 if any(e['edgeId']=='maps-j-04939' and e['disposition']=='parked' and 'L12-49' in e['reason'] for r in rs for e in r['edges']):return
 old=copy.deepcopy(rs)
 for r in rs:
  e=next((e for e in r['edges'] if e['edgeId']=='maps-j-04939'),None)
  if not e:continue
  body=m.blob(PIN,r['file']).decode();e.update(target=None,anchor=None,timing='none',diffHunk=None)
  park(r,e,'docs/how-to/wire-a-skills-classify-step-through-an-agent-executor-executor.md',body,'Description needs rewrite (L12-49): source says the classify-step guide shows the ad-hoc task id shape (<scope>#p<n>, invalid against ID_PATTERN). The registry knowledge-tree holder has no such text; that shape lives in core/skills/_shared/executor-dispatch-fallback.md. Reconcile the whole adjacent attribution before redirecting the dead how-to path, as for 04485.')
  for section in ('anchors','relativeResolution','labelForm'):r['checks'][section].pop(e['edgeId'],None)
  for section in ('descriptionTruth','writerTrace','resolutionSearches'):r['checks']['coverage'].get(section,{}).pop(e['edgeId'],None)
  finish(r,body)
 p.write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs))
 changed=[]
 for x,y in zip(old,rs):
  if x!=y:
   assert [e for e in x['edges'] if e['edgeId']!='maps-j-04939']==[e for e in y['edges'] if e['edgeId']!='maps-j-04939']
   changed.append({'file':y['file'],'beforeRecordSha256':m.sha(json.dumps(x,ensure_ascii=False,separators=(',',':'))+'\n'),'afterRecordSha256':m.sha(json.dumps(y,ensure_ascii=False,separators=(',',':'))+'\n'),'beforeEdge':next(e for e in x['edges'] if e['edgeId']=='maps-j-04939'),'afterEdge':{k:v for k,v in next(e for e in y['edges'] if e['edgeId']=='maps-j-04939').items() if k!='searchWitness'},'beforeDiff':x['diff'],'afterDiff':y['diff'],'otherEdgesByteEquivalent':True,'supplementalLocatorSearches':'coverage.adjacentResolutionSearches; compact existing-resolver witness independently replayed.'})
 assert len(changed)==1
 save('step-03-wave5b-ruling-changes.json',{'rule':'L12-49','beforeSha256':m.sha(before),'afterSha256':m.sha(p.read_bytes()),'changes':changed})

def main():
 fix04939();rs=[];reads=[]
 for file,b in m.population().items():
  raw=m.blob(PIN,file);old=m.blob(m.INVENTORY,file);assert raw==old;body=raw.decode();ls=body.splitlines();invs=[e for e in c.entries.values() if e['consumerPath']==file]
  r=dict(file=file,inventoryInputCommit=m.INVENTORY,authorInputCommit=PIN,inventoryFileDigest=m.sha(old),digest=m.sha(raw),inventoryEdgeIds=[e['edgeId'] for e in invs],diff='',edges=[],checks={'coverage':{'authorAddedEdgeIds':[]},'anchors':{},'relativeResolution':{},'labelForm':{}},reviewSet='batch-'+b,authoringRules=['A51','L12-10','L12-21..L12-49; full authoring rules digest, including Source provenance L12-47'])
  for inv in invs:
   e={k:None for k in m.EDGE_FIELDS};e.update(edgeId=inv['edgeId'],sourceSpans=copy.deepcopy(inv['physicalSpans']),matchedExpression=inv['matchedExpression'],disposition='preserve',timing='none',reason='',unitId=m.unit_id(body,inv['physicalSpans']));r['edges'].append(e)
  cov=r['checks']['coverage'];candidates=[]
  for span in m.scan_candidates(PIN,file,[s for e in invs for s in e['physicalSpans']]):
   exempt=m.coverage_exemption(file,body,span);token=span['text'];link=re.fullmatch(r'!?\[[^\]]+\]\(([^)]+)\)',token);rawpath=(link[1] if link else token).split('#')[0];origin=m.relative_decision_origin(PIN,file,rawpath);targets=m.candidate_targets(file,body,span);hits=[t for t in targets if m.legacy_reference_target(t) and t in c.tree|c.dirs]
   if exempt or (not origin and not hits and not rawpath.removeprefix('repo/').startswith('docs/')):
    candidates.append({'span':span,'excludedReason':exempt or 'Actual consumer/stated-parent coordinates do not resolve to a retiring legacy document. Candidate-native/code/artifact referents are not unrelated legacy basename matches. Resolved readings '+repr(targets)});continue
   path=origin or (hits[0] if hits else rawpath.removeprefix('repo/'));key='author-wave5b-'+file.removesuffix('.md').replace('/','-')+'-L'+str(span['line'])+'C'+str(span['columnStart'])
   e={k:None for k in m.EDGE_FIELDS};e.update(edgeId=key,sourceSpans=[span],matchedExpression=token,disposition='preserve',timing='none',reason='',unitId=m.unit_id(body,[span]),authorAddedEdge={'normalizedReference':path,'discoveryReason':'Complete pinned source traversal plus supplemental literal/link/stated-parent and original source coordinates.','searchMethod':'Unchanged step-03-check.py scan_candidates/candidate_targets at fixed author pin'});r['edges'].append(e);cov['authorAddedEdgeIds'].append(key);candidates.append({'span':span,'edgeId':key})
  cov['legacyScan']={'pin':PIN,'method':'Full immutable source traversal and unchanged complete-file full/partial/basename/directory/link scan; carriage/history exemptions retain exact rule text; every other legacy reading joins an edge.','candidates':candidates}
  for e in r['edges']:disposition(r,e,w.path_for(e),body)
  finish(r,body);rs.append(r);reads.append({'file':file,'pin':PIN,'bytes':len(raw),'lines':len(ls),'sha256':m.sha(raw),'inventoryEdges':len(invs),'orderedWholeFileChunks':[{'firstLine':i+1,'lastLine':min(i+80,len(ls)),'sha256':m.sha('\n'.join(ls[i:i+80]))} for i in range(0,len(ls),80)]})
 for b in SETS:(P/'step-03-records'/f'batch-{b}.jsonl').write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs if r['reviewSet']=='batch-'+b))
 save('step-03-wave5b-whole-file-reads.json',{'pin':PIN,'files':reads,'sourceBytes':sum(x['bytes'] for x in reads),'method':'Complete immutable source-byte traversal, exact inventory spans, supplemental scan and per-edge adjacent-source/target assessment; not independent acceptance.'})
 save('step-03-wave5b-population.json',{'pin':PIN,'completedBatches':list(SETS),'pendingAssignedBatches':[f'{i:03}' for i in range(86,126)],'stopReason':'Whole-file authoring/context budget boundary after 085. Batches 086–125 remain unauthored; no partial next batch.','files':len(rs),'inventoryEdges':sum(len(r['inventoryEdgeIds']) for r in rs),'addedEdges':sum(len(r['edges'])-len(r['inventoryEdgeIds']) for r in rs),'edges':sum(len(r['edges']) for r in rs),'patchedFiles':sum(bool(r['diff']) for r in rs),'dispositions':dict(collections.Counter(e['disposition'] for r in rs for e in r['edges'])),'parks':dict(collections.Counter(e['blockedCategory'] for r in rs for e in r['edges'] if e['disposition']=='parked')),'reviewAcceptance':'pending independent A51 review'})
 print(json.dumps({'files':len(rs),'edges':sum(len(r['edges']) for r in rs)}))
if __name__=='__main__':main()
