#!/usr/bin/env python3
"""Bounded wave-4 authoring: batch 070 only, records not consumer edits."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,re,copy,collections,time,posixpath
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('a3',P/'step-03-wave3-author.py');a3=importlib.util.module_from_spec(sp);sp.loader.exec_module(a3)
m=a3.m;PIN=a3.PIN;SETS=('070',);m.SETS=SETS;c=m.Checker(PIN);a3.c=c;a3.a.c=c

def save(name,o):(P/name).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def path_for(e):return (c.entries.get(e['edgeId']) or e['authorAddedEdge'])['normalizedReference'].split('#')[0]
def preserve(r,e,path,body,why):
 normalized=a3.legacy_path(path)
 if re.match(r'^docs/decisions/\d{4}-(?:\.\.\.)',normalized):state=a3.facts(e,normalized[:19])
 else:state=a3.facts(e,path)
 e['reason']='A51, L12-26, L12-38: '+state.replace(' Decision narrative resolution remains generator-owned.','')+' '+why
 for holder in m.removed_decision_holders(PIN,e,path):e['reason']+=' Non-executable successor note: '+holder+'.'
def patch(r,e,path,body,target,hint=None,assessment=''):
 h=next((h for h in m.heading_sections(PIN,target) if hint and hint.casefold() in h['sample'].casefold()),None)
 assert not hint or h,(e['edgeId'],target,hint)
 a3.anchored_patch(r,e,path,body,target,h['anchor'] if h else None,assessment=assessment)
 if not hint:
  d=r['checks']['coverage']['descriptionTruth'][e['edgeId']]
  d['assessment']=assessment
  for k in d['comparisons']:d['comparisons'][k]={'verdict':'not-asserted','note':'No '+k+' assertion is introduced about this target. '+assessment}
def alias_patch(r,e,path,body,hint,assessment):
 aliases={a['entry']['currentPath'] for a in m.resolver.aliases(PIN,path) if a['entry'].get('currentPath')};assert len(aliases)==1,(e['edgeId'],aliases)
 patch(r,e,path,body,aliases.pop(),hint,assessment)
def disposition(r,e,path,body):
 key=e['edgeId'];short=key.removeprefix('maps-j-');n=e['sourceSpans'][0]['line'];passage=m.adjacent_passage(body,e['sourceSpans'])
 if r['file']=='docs/knowledge/decisions-index/decision-record.md':
  preserve(r,e,path,body,'L12-26(4): frozen rename copy at 4ee0e3a3c, no generator owns this snapshot despite its generated header. Historical decision-index row stays literal; no hand rewrite or runtime projection inference.');return
 if short in ('04123','04129','04229','04230','04233','04235','04251','04255','04256'):
  hint,assessment={
   '04123':('Why this exists','The section states next-free-integer IDs have no cross-branch coordination and two branches collide. The Related paragraph cites this complete collision trap; its historical 0029 example is unchanged.'),
   '04129':(None,'The complete live reference states register/remove retired and providers declared in runner.executors.<id> as config entries. The source “Current shape” points to that complete config reference, separately from its historical example sections 2/5/6.'),
   '04229':(None,'The complete explanation contrasts an exact-match code-side test with unguarded enumerable doc prose, then records the later two-way guard. The source explicitly distinguishes this set-drift pattern from conceptual model drift, without claiming the guard remains absent today.'),
   '04230':("Why this doesn't happen automatically",'This section states child merges advance the root branch without closing the root state. The source’s flat tsk-2qz example has exactly that topology; neither new nested-topology claims nor test-count promises are introduced.'),
   '04233':('Verify trông thế nào','The target prescribes npm test plus POSITIVE and NEGATIVE checks, proving new prose exists and old prose is gone. This matches the source’s explicit two-sided EnterWorktree/fgos pick versus never-claims grep example.'),
   '04235':(None,'The complete cook explanation records the same early-stage worktree gap, pick+EnterWorktree caller fix, and separately scoped discover follow-up. The citation is to that entire sibling incident, not its final delivery count or a specific subsection.'),
   '04251':(None,'The source names tsk-1m0’s doctor check for stale end-user indexing as a completed recurrence. The complete renamed explanation is exactly that doctor check/fix design; module-layer analysis remains the source’s own independent evidence.'),
   '04255':(None,'The complete worker-slot design defines one occupied rootTask seat per slot, engine-owned occupancy, execution/admin lanes, gate rather than ranker and overflow. This source is its read-port implementation; no unrelated field is introduced.'),
   '04256':(None,'Related navigation names D1-D10 of the whole worker-slot design implemented by this verb/gate. Those decisions span multiple sections, so the complete design document is the actual cited subject.')
  }[short];alias_patch(r,e,path,body,hint,assessment);return
 if short in ('04144','04145'):
  a3.park(r,e,path,body,'Description needs rewrite: the complete Related item groups these guides as traps involving “missing --dir, a wrong repo-root resolver”. The milestone guide supports the missing --dir claim; the decomposed-root guide instead explains branch/topology and dependency-install failures, without the claimed repo-root-resolver defect. Rewrite this grouped description from the actual guide facts before redirecting either member of this source unit.','description-rewrite');return
 if short=='04227':
  a3.park(r,e,path,body,'Description needs rewrite: the source quotes the old sibling explanation as asserting “two orthogonal axes”, but its registry-alias holder now explicitly says “two-tier tree, not two independent axes”. A rename-only patch would make the historical description false for the current target. Preserve the point-in-time quote and independently rewrite its citation framing together.','description-rewrite');return
 if short=='04231':
  target='docs/platform/runner/decisions/h-36d872fbb0e5.md';patch(r,e,path,body,target,'0022 —','Decision 0022 contains the full ranked three-candidate survey: take/pick eligibility, duplicated clean-tree checks and six createWorktree callers. These match the table’s three rows and high/medium/medium-low risk order; no fixes are claimed applied.');return
 if short in ('04238','04242','04245','04247'):
  a3.park(r,e,path,body,'P8-DOC-GAP-01: participant prose still instructs retired wx/dead-pid events.lock. L12-17 makes cutover depend on the separately owned rewrite against Holder-lock §15 withStateTx plus A47 carry of RUL10 bổ chú 3 into docs/platform/work-state/spec.md before the RUL10 redirect. No bare citation change can certify the protocol.','GAP-01');return
 if short=='04239':
  a3.park(r,e,path,body,'Description needs rewrite: this live reading instruction calls the source a ~215KB spec and implies its scattered event-lock protocol remains the full contract. Reconcile that file-size/scope description and P8-DOC-GAP-01 protocol guidance with the carried RUL10 holder, rather than preserve a live pointer into the retiring tree.','description-rewrite');return
 if e.get('authorAddedEdge') and '/decisions/' in path and r['file'].endswith('/fgos-participant-contract.md'):
  number=re.search(r'/decisions/(\d{4})',path)[1];holders=m.decision_narrative_holders(PIN,number)
  if number=='0014' and not holders:
   a3.park(r,e,path,body,'P8-DOC-GAP-02: removed decision 0014’s schema/protocol-not-library narrative survives in legacy docs/specs/platform-foundations.md, but no candidate decisions heading carries it. Carry that exact architecture claim into an accepted live holder before redirecting this moved relative decision link; packaging history mentions the principle only incidentally.','GAP-02');return
  assert len(holders)==1,(number,holders)
  target,anchor=holders[0].split('#',1);h=next(h for h in m.heading_sections(PIN,target) if h['anchor']==anchor)
  if number=='0011':h=next(h for h in m.heading_sections(PIN,target) if h['sample']=='0011 Decision')
  a3.anchored_patch(r,e,path,body,target,h['anchor'],assessment='The source cites '+('0014’s schema/protocol rather than library architecture' if number=='0014' else '0011’s explicit version-in-contract-identifier commitment')+'. The exact pinned narrative holds this principle; the source’s separate literal v3/envelope table and RUL10 protocol remain independently retained/blocked.');return
 if short=='04228' or e.get('authorAddedEdge') and path=='docs/specs/system-overview.md':
  preserve(r,e,path,body,'Preserve the completed tsk-15d correction of the old “only T2 work” claim; the source explicitly says it “was already stale” and “left a note ... so a future reader would not rediscover” the settled question. Non-executable successor note: docs/platform/system-overview/spec.md.');return
 if path=='docs/history/fgos-marketing-domain-foundation/DISCUSSION.md':
  preserve(r,e,path,body,'Source lineage explicitly says this old discussion was cleaned up and the live decision record is this document, using verbatim copied D1-D18 event-record quotes. It is not a current read instruction.');return
 if c.renamed_alias_holders(r,e):raise AssertionError(('unhandled alias',key,path))
 preserve(r,e,path,body,'Preserve source evidence or retained navigation in its complete adjacent context: '+repr(passage[:600])+'. No current authority relocation is prescribed by this retained-root citation.')

def main():
 rs=[];reads=[]
 for file,b in m.population().items():
  raw=m.blob(PIN,file);old=m.blob(m.INVENTORY,file);assert raw==old;body=raw.decode();ls=body.splitlines();invs=[e for e in c.entries.values() if e['consumerPath']==file]
  r=dict(file=file,inventoryInputCommit=m.INVENTORY,authorInputCommit=PIN,inventoryFileDigest=m.sha(old),digest=m.sha(raw),inventoryEdgeIds=[e['edgeId'] for e in invs],diff='',edges=[],checks={'coverage':{'authorAddedEdgeIds':[]},'anchors':{},'relativeResolution':{},'labelForm':{}},reviewSet='batch-'+b,authoringRules=['A51','L12-10','L12-21..L12-38; full authoring rules digest'])
  for inv in invs:
   e={k:None for k in m.EDGE_FIELDS};e.update(edgeId=inv['edgeId'],sourceSpans=copy.deepcopy(inv['physicalSpans']),matchedExpression=inv['matchedExpression'],disposition='preserve',timing='none',reason='',unitId=m.unit_id(body,inv['physicalSpans']));r['edges'].append(e)
  candidates=[];cov=r['checks']['coverage']
  for span in m.scan_candidates(PIN,file,[s for e in invs for s in e['physicalSpans']]):
   token=span['text'];link=re.fullmatch(r'!?\[[^\]]+\]\(([^)]+)\)',token);origin=m.relative_decision_origin(PIN,file,(link[1] if link else token).split('#')[0]);targets=m.candidate_targets(file,body,span);hits=[t for t in targets if m.legacy_reference_target(t) and t in c.tree|c.dirs]
   if token=='system-overview.md' and any(path_for(e)=='docs/specs/system-overview.md' for e in r['edges']):hits=['docs/specs/system-overview.md']
   full=token.removeprefix('repo/').startswith('docs/')
   if not origin and not hits and not full:
    candidates.append({'span':span,'excludedReason':m.coverage_exemption(file,body,span) or 'No retiring/legacy documentation referent from actual consumer or stated-parent coordinates; resolved readings '+repr(targets)+'. Bare code/config/artifact names are not unrelated legacy documents.'});continue
   path=origin or (hits[0] if hits else token.removeprefix('repo/').split('#')[0]);key='author-wave4-'+file.removesuffix('.md').replace('/','-')+'-L'+str(span['line'])+'C'+str(span['columnStart'])
   e={k:None for k in m.EDGE_FIELDS};e.update(edgeId=key,sourceSpans=[span],matchedExpression=token,disposition='preserve',timing='none',reason='',unitId=m.unit_id(body,[span]),authorAddedEdge={'normalizedReference':path,'discoveryReason':'Complete pinned source traversal; literal legacy scan, source-bound shorthand and committed registry original coordinates for moved relative decision links.','searchMethod':'step-03-check.py:scan_candidates plus explicit per-file context at author pin'});r['edges'].append(e);cov['authorAddedEdgeIds'].append(key);candidates.append({'span':span,'edgeId':key})
  cov['legacyScan']={'pin':PIN,'method':'Complete pinned full/partial/basename/directory/link scan including registry original coordinates for moved numeric decision links. Every hit joins an edge or a contextual exclusion.','candidates':candidates}
  for e in r['edges']:disposition(r,e,path_for(e),body)
  groups=collections.defaultdict(list)
  for e in r['edges']:groups[m.unit_id(body,e['sourceSpans'])].append(e)
  for group in groups.values():
   if len({e['disposition'] for e in group})>1:
    for e in group:e['unitDispositionReason']=e['edgeId']+' '+e['matchedExpression']+' Distinct claim: '+e['reason']
  edits=[]
  for e in r['edges']:
   if e['disposition']=='patch':edits+=m.replacement_changes(body,e['sourceSpans'],r['checks']['relativeResolution'][e['edgeId']]['replacement'])
  after=body
  for a,b,new in sorted(set(edits),reverse=True):after=after[:a]+new+after[b:]
  r['diff']=m.make_diff(file,body,after)
  for e in r['edges']:
   if e['disposition']=='patch':
    hs=[h for h in m.hunks(r['diff']) if any('-'+ls[s['line']-1] in h.splitlines() for s in e['sourceSpans'])];assert len(hs)==1;e['diffHunk']=hs[0].splitlines()[0]
  rs.append(r);reads.append({'file':file,'pin':PIN,'bytes':len(raw),'lines':len(ls),'sha256':m.sha(raw),'inventoryEdges':len(invs),'orderedWholeFileChunks':[{'firstLine':i+1,'lastLine':min(i+80,len(ls)),'sha256':m.sha('\n'.join(ls[i:i+80]))} for i in range(0,len(ls),80)]})
 for b in SETS:(P/'step-03-records'/f'batch-{b}.jsonl').write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs if r['reviewSet']=='batch-'+b))
 save('step-03-wave4-whole-file-reads.json',{'pin':PIN,'files':reads,'sourceBytes':sum(x['bytes'] for x in reads),'method':'Complete immutable source bytes read; every inventory span bound; supplemental full-file scan and context considered. Author traversal is not independent review.'})
 save('step-03-wave4-population.json',{'pin':PIN,'completedBatches':list(SETS),'pendingBatches':[f'{i:03}' for i in range(71,83)],'stopReason':'Turn budget: stop after whole batch 070; do not claim 071–082 authored.','files':len(rs),'inventoryEdges':sum(len(r['inventoryEdgeIds']) for r in rs),'addedEdges':sum(len(r['checks']['coverage']['authorAddedEdgeIds']) for r in rs),'edges':sum(len(r['edges']) for r in rs),'patchedFiles':sum(bool(r['diff']) for r in rs),'dispositions':dict(collections.Counter(e['disposition'] for r in rs for e in r['edges'])),'parks':dict(collections.Counter(e['blockedCategory'] for r in rs for e in r['edges'] if e['disposition']=='parked')),'reviewAcceptance':'pending independent A51 review'})
 print(json.dumps({'files':len(rs),'edges':sum(len(r['edges']) for r in rs)}))
if __name__=='__main__':main()
