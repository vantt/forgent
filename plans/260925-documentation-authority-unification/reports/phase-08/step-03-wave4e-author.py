#!/usr/bin/env python3
"""Bounded wave-4e authoring: batch 075, records not consumer edits."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,re,copy,collections,time,posixpath
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('a3',P/'step-03-wave3-author.py');a3=importlib.util.module_from_spec(sp);sp.loader.exec_module(a3)
m=a3.m;PIN=a3.PIN;SETS=('075',);m.SETS=SETS;c=m.Checker(PIN);a3.c=c;a3.a.c=c

def save(name,o):(P/name).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def path_for(e):return (c.entries.get(e['edgeId']) or e['authorAddedEdge'])['normalizedReference'].split('#')[0]
def preserve(r,e,path,body,why):
 state=a3.facts(e,path)
 e['reason']='A51, L12-26, L12-38: '+state.replace(' Decision narrative resolution remains generator-owned.','')+' '+why
 for holder in m.removed_decision_holders(PIN,e,path):
  if 'Non-executable successor note: '+holder not in e['reason']:e['reason']+=' Non-executable successor note: '+holder+'.'
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
# Per-edge decisions from complete batch-075 consumer reads, then exact target passages.
ASSESS={
 '04571':(None,'Source cites the direct-main .fgos fix precedent for tsk-5ge/5vf/4eu. The target whole family records these main-only state/config cases; the source names three separately headed examples, whose nearest common parent is the whole guide.'),
 '04573':('Example: `tsk-53n`','The tsk-53n example explicitly records a narrowed schema-test verify exposing unrelated red tests. Source cites that exact same discovered-while-doing-something-else precedent, preserving its historical kind/args assertions as source history.'),
 '04577':(None,'The complete architecture document defines one daemon with gateway/orchestrator modules, CLI-only core access and the versioned public API. This is the architecture the source names; CTR010 YAML and all contract identities remain literal.'),
 '04578':('D10 then D9','D9 in the target specifies exactly two MCP tools search/execute against the gateway API and D7 chokepoint. The source explicitly attributes that pattern, with its separate Rust-native refinement bound to its own retained D1 source.'),
 '04582':('The label mechanism:','The target quotes D5: session-called helper skill with capability gate, not adapter polling, and silent exit outside herdr. These are the exact scope, mechanism and portability claims this source paragraph attributes to the worker-slot design.'),
 '04586':(None,'The complete tsk-3mv-1 synthesis describes decision-ID collision auto-resolution with its Iron Law proof and shared-index preconditions. Related names that complete child synthesis without asserting a new current index-writer recipe.'),
 '04587':(None,'The complete tsk-3mv-2 synthesis documents the once-per-id verify-fail-post-merge self-diagnosis playbook and existing repeat-block stop rule. Related names exactly that child synthesis.'),
 '04602':(None,'The complete tsk-3wr-2 explanation is the real-duplication versus superficial-similarity discriminator, exactly the subject of this Related item; no target count or current engine contract is asserted.'),
 '04603':(None,'The complete tsk-3wr-3 reference contains the before/after test-suite legibility and dedup counts. Source cites that whole measurement artifact; the source own earlier first-reference-file anecdote remains historical.'),
 '04604':(None,'The complete guide diagnoses an unrelated verify failure and restores the blocked item to doing before return, exactly the recovery actually used in step 5. This Related item makes no lock-diagnosis claim.'),
 '04620':(None,'The complete survey explains decision duplication above shared primitives, with claimWork as an existing shared primitive. This is precisely the broader survey contrasted with this source narrow leaf guard.'),
 '04621':(None,'The complete isolation-axis explanation records worker checkout separation and refusal of .fgos changes. The source cites per-item worktree isolation as the premise for removing an unrelated shared-tree cleanliness requirement; it does not assert that worker and driver store protocols coincide.'),
 '04622':(None,'The complete guide unifies return and approve clean-tree checks, the exact sibling subject named by Related. No changed status name or additional clean-tree promise is introduced.'),
 '04624':('D1: exactly one gate','The exact D1 passage merges planApprove/validateApprove into the validating gate and makes planning hand off without a gate. Source names that redesign as the reason the old planApprove key has no live writer; its separate real-verify fallback discussion remains its own scope.'),
 '04632':(None,'The complete tsk-3o3 explanation records retro-loop/retro-next as a status sweep and restores compound as the tagging verb. Source names that complete follow-up to the status-chain design, with no new TTL or count assertion about its target.'),
 '04639':(None,'The complete safely-reset guide documents the real main-checkout-reset guard built after tsk-3au data loss. This is the code-level consequence counterpart named by Related, separate from the non-destructive branch-bypass reminder.')
}
def disposition(r,e,path,body):
 short=e['edgeId'].removeprefix('maps-j-');context=m.adjacent_passage(body,e['sourceSpans']);n=e['sourceSpans'][0]['line']
 if m.history_at(body,n,r['file']) or m.captured_evidence_at(body,n):
  preserve(r,e,path,body,'L12-40: preserve the original captured output/source identity, with actual framing '+repr(context));return
 if short=='04599':
  a3.park(r,e,path,body,'Description needs rewrite: the source recommends this guide for distinguishing a stale main-checkout lock from a live lock. Its actual alias holder diagnoses unrelated return verify failures, re-runs a failing test and retries blocked -> doing; it has no stale/live lock procedure. Reconcile this complete recommendation before redirecting; the accurate Related recovery pointer is a separate claim.','description-rewrite');return
 if short in ('04583','04589'):
  target='docs/platform/runner/subcomponents/h-6979005beaf7/spec.md';nums=[52] if short=='04583' else [52,53,54]
  h=next(h for h in m.heading_sections(PIN,target) if h['sample']=='Business Rules')
  a3.anchored_patch(r,e,path,body,target,h['anchor'],nums=nums,assessment='The exact pinned RUL25 states that only the complete root proposal lands the feature once; RUL26 preserves root affinity and RUL27 checks post-merge drift. '+('Source invokes only the complete-root-once invariant.' if short=='04583' else 'Related explicitly names all three fan-out rules; all are adjacent in Business Rules.'));return
 if short=='04633':
  target='docs/platform/runner/decisions/h-36d872fbb0e5.md';h=next(h for h in m.heading_sections(PIN,target) if h['sample'].startswith('0025 —'))
  a3.anchored_patch(r,e,path,body,target,h['anchor'],nums=[511,515,519,521],assessment='The exact 0025 product-priority narrative states Ship Faster means no guessing and less friction, and DoD means reproducible proof plus evidence-linked documentation. Source invokes that discipline for quoting the locked decision and measuring actual events, without changing the separate current 0030 priority order.');return
 if short in ASSESS:
  hint,assessment=ASSESS[short];alias_patch(r,e,path,body,hint,assessment);return
 if path.startswith(('docs/specs/','docs/architect/')):
  note=' Non-executable successor note: '+('docs/platform/work-state/spec.md' if path.endswith('work-state.md') else 'docs/platform/runner/spec.md')+'.'
  preserve(r,e,path,body,'Preserve completed historical spec-edit/audit identity, not a current read instruction. Exact completed-action framing: '+repr(context)+note);return
 if path.startswith('docs/history/') or path.startswith('docs/distillery/') or path=='docs/distribution-vision.md' or path=='docs/contracts/fgos-gateway-api-v1.yaml':
  preserve(r,e,path,body,'Preserve retained source/design/evidence reference with complete source claim '+repr(context)+'. No retiring authority redirect; CTR010 runtime reader parity stays in Step 5.' if path.endswith('.yaml') else 'Preserve retained source/design/evidence reference with complete source claim '+repr(context)+'. This record changes no state writer or document identity.');return
 if path in ('docs/explanation/','docs/how-to/*','docs/reference/','docs/reference'):
  preserve(r,e,path,body,'Preserve the original directory/glob label of a completed synthesis/audit, not a new writer root. Exact historical framing: '+repr(context)+'. Non-executable successor note: docs/knowledge/.');return
 if short=='04572':
  preserve(r,e,path,body,'Preserve completed tsk-4fk discovery and tsk-2uo historical-guard evidence: '+repr(context)+'. No current live navigation or removal of the historical guard record.');return
 raise AssertionError((short,path,context))

def main():
 rs=[];reads=[]
 for file,b in m.population().items():
  raw=m.blob(PIN,file);old=m.blob(m.INVENTORY,file);assert raw==old;body=raw.decode();ls=body.splitlines();invs=[e for e in c.entries.values() if e['consumerPath']==file]
  r=dict(file=file,inventoryInputCommit=m.INVENTORY,authorInputCommit=PIN,inventoryFileDigest=m.sha(old),digest=m.sha(raw),inventoryEdgeIds=[e['edgeId'] for e in invs],diff='',edges=[],checks={'coverage':{'authorAddedEdgeIds':[]},'anchors':{},'relativeResolution':{},'labelForm':{}},reviewSet='batch-'+b,authoringRules=['A51','L12-10','L12-21..L12-41; full authoring rules digest'])
  for inv in invs:
   e={k:None for k in m.EDGE_FIELDS};e.update(edgeId=inv['edgeId'],sourceSpans=copy.deepcopy(inv['physicalSpans']),matchedExpression=inv['matchedExpression'],disposition='preserve',timing='none',reason='',unitId=m.unit_id(body,inv['physicalSpans']));r['edges'].append(e)
  candidates=[];cov=r['checks']['coverage']
  for span in m.scan_candidates(PIN,file,[s for e in invs for s in e['physicalSpans']]):
   token=span['text'];link=re.fullmatch(r'!?\[[^\]]+\]\(([^)]+)\)',token);origin=m.relative_decision_origin(PIN,file,(link[1] if link else token).split('#')[0]);targets=m.candidate_targets(file,body,span);hits=[t for t in targets if m.legacy_reference_target(t) and t in c.tree|c.dirs]
   full=token.removeprefix('repo/').startswith('docs/')
   if not origin and not hits and not full:
    candidates.append({'span':span,'excludedReason':m.coverage_exemption(file,body,span) or 'No retiring/legacy documentation referent from actual consumer or stated-parent coordinates; resolved readings '+repr(targets)+'. Bare code/config/artifact names are not unrelated legacy documents.'});continue
   path=origin or (hits[0] if hits else token.removeprefix('repo/').split('#')[0]);key='author-wave4e-'+file.removesuffix('.md').replace('/','-')+'-L'+str(span['line'])+'C'+str(span['columnStart'])
   e={k:None for k in m.EDGE_FIELDS};e.update(edgeId=key,sourceSpans=[span],matchedExpression=token,disposition='preserve',timing='none',reason='',unitId=m.unit_id(body,[span]),authorAddedEdge={'normalizedReference':path,'discoveryReason':'Complete pinned source traversal; literal legacy scan, source-bound shorthand and committed registry original coordinates for moved relative decision links.','searchMethod':'step-03-check.py:scan_candidates plus explicit per-file context at author pin'});r['edges'].append(e);cov['authorAddedEdgeIds'].append(key);candidates.append({'span':span,'edgeId':key})
  cov['legacyScan']={'pin':PIN,'method':'Complete pinned full/partial/basename/directory/link scan including registry original coordinates for moved numeric decision links. Every hit joins an edge or a contextual exclusion.','candidates':candidates}
  for e in r['edges']:disposition(r,e,path_for(e),body)
  # Physical-span witnesses remain unchanged; full adjacent locator searches are additive.
  for e in r['edges']:
   key=e['edgeId'];short=key.removeprefix('maps-j-')
   if e['disposition']=='parked':
    context=m.adjacent_passage(body,e['sourceSpans']);covered={q['query'] for q in e['searchWitness']['queries']};queries=set(m.resolver.tokens(context))-covered
    queries-={q['query'] for q in cov.get('extraLocatorSearches',{}).get(key,[])}
    if queries:cov.setdefault('extraLocatorSearches',{}).setdefault(key,[]).extend([{'query':q,'result':m.resolver.query(PIN,q),'category':'partial-holder' if m.resolver.query(PIN,q)['liveHitCount'] else 'carriage' if m.resolver.query(PIN,q)['hitCount'] else 'dead','note':'Complete adjacent-unit locator search; any matching token/heading alone cannot cure this specific source-description or operative-writer mismatch: '+e['reason']} for q in sorted(queries)])
  for e in r['edges']:
   if e['disposition']!='patch':continue
   key=e['edgeId'];proof=r['checks']['anchors'][key];truth=cov['descriptionTruth'][key];tl=m.blob(PIN,e['target']).decode().splitlines()
   # Bind actual claim lines as well as the enclosing heading; full-file targets keep full-file scope.
   needles={
    '04571':['direct, single-parent','tsk-5vf','tsk-4eu','tsk-5ge'],
    '04573':['unrelated pre-existing red','already red *before*','narrowed verify:'],
    '04577':['one process per machine','only through the CLI','D10**'],
    '04578':['exactly two MCP tools','still funneled through D7'],
    '04582':['D5: Co che','capability-gate','exit `0` silently'],
    '04586':['ONLY conflicted path','link target','failing-test-first'],
    '04587':['at most once per id','stop immediately'],
    '04602':['one shared, generic place','independently-written code'],
    '04603':['1554','53.6s','147 (31 files)'],
    '04604':['recovery path','Move it back to','fgos move <id> --to doing'],
    '04620':['higher-level *decision*','already* single'],
    '04621':['git worktree add','block-tree'],
    '04622':['per-item','scope =','one-line delegate'],
    '04624':['planApprove','hands off'],
    '04632':['restored verb keeps','self-sweeps'],
    '04639':['main-checkout-reset --sha','tsk-3au']
   }.get(key.removeprefix('maps-j-'),[])
   nums=sorted(set(proof['targetLines']+[i for i,line in enumerate(tl,1) if any(term in line for term in needles)]))
   if proof.get('passage'):
    heading=next(h for h in m.heading_sections(PIN,e['target']) if h['anchor']==e['anchor'] or h['githubSlug']==e['anchor'])
    nums=[i for i in nums if heading['startLine']<=i<=heading['sectionEndLine']]
   if e['anchor']:proof.update(targetLines=nums,targetLineText=[tl[i-1] for i in nums])
   truth['targetEvidence']=[{'line':i,'text':tl[i-1]} for i in nums]
   for dimension in {'04578':['counts','verbFileLists'],'04582':['verbFileLists','shippedStatus'],'04583':['counts'],'04589':['verbFileLists'],'04624':['verbFileLists','shippedStatus'],'04639':['shippedStatus']}.get(key.removeprefix('maps-j-'),[]):
    truth['comparisons'][dimension]={'verdict':'matches','note':truth['assessment']+' Actual claim lines are bound above; this dimension agrees with that exact cited subject, rather than incidental source-incident counts.'}
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
 save('step-03-wave4e-whole-file-reads.json',{'pin':PIN,'files':reads,'sourceBytes':sum(x['bytes'] for x in reads),'method':'Complete immutable source bytes read; every inventory span bound; supplemental full-file scan and context considered. Author traversal is not independent review.'})
 save('step-03-wave4e-population.json',{'pin':PIN,'completedBatches':list(SETS),'pendingBatches':[f'{i:03}' for i in range(76,83)],'stopReason':'Whole-file authoring budget boundary after batch 075; batches 076–082 remain unauthored.','files':len(rs),'inventoryEdges':sum(len(r['inventoryEdgeIds']) for r in rs),'addedEdges':sum(len(r['checks']['coverage']['authorAddedEdgeIds']) for r in rs),'edges':sum(len(r['edges']) for r in rs),'patchedFiles':sum(bool(r['diff']) for r in rs),'dispositions':dict(collections.Counter(e['disposition'] for r in rs for e in r['edges'])),'parks':dict(collections.Counter(e['blockedCategory'] for r in rs for e in r['edges'] if e['disposition']=='parked')),'reviewAcceptance':'pending independent A51 review'})
 print(json.dumps({'files':len(rs),'edges':sum(len(r['edges']) for r in rs)}))
if __name__=='__main__':main()
