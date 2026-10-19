#!/usr/bin/env python3
"""Bounded wave-4c authoring: batch 072 only, records not consumer edits."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,re,copy,collections,time,posixpath
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('a3',P/'step-03-wave3-author.py');a3=importlib.util.module_from_spec(sp);sp.loader.exec_module(a3)
m=a3.m;PIN=a3.PIN;SETS=('072',);m.SETS=SETS;c=m.Checker(PIN);a3.c=c;a3.a.c=c

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
 key=e['edgeId'];short=key.removeprefix('maps-j-');n=e['sourceSpans'][0]['line'];context=m.adjacent_passage(body,e['sourceSpans'])
 if m.history_at(body,n,r['file']):
  preserve(r,e,path,body,'L12-39(6): preserve original docPath/doc-sources identities inside explicit Document history; exact capture spellings are immutable evidence.');return
 if short in ('04320','04345','04353'):
  a3.park(r,e,path,body,'Lead ruling required: this exact completed repro/grep/captured work-description identity is historical source evidence under L12-26(5), but the live-class renamed-alias predicate rejects a preserve outside an explicit history heading. Its registry holder '+str(next((a['entry'].get('currentPath') for a in m.resolver.aliases(PIN,path)),None))+' is '+('the consumer itself, so patching would create a self pointer and change the historical identity.' if short in ('04320','04353') else 'the renamed navigation holder, but replacing the spelling would falsify which original file the old grep returned.')+' Keep this edge non-executable pending a bounded Lead ruling.','lead-ruling');return
 if short in ('04319','04327','04344','04380','04381','04382'):
  note='docs/platform/runner/spec.md' if path=='docs/specs/runner.md' else 'docs/platform/packaging-distribution/spec.md' if path=='docs/specs/distribution.md' else 'docs/platform/work-state/spec.md' if path=='docs/specs/work-state.md' else None
  preserve(r,e,path,body,'Preserve explicitly completed source evidence, not a present-tense read instruction: '+repr(context)+('. Non-executable successor note: '+note+'.' if note else ''));return
 if short=='04334':
  target='docs/knowledge/how-to-run-a-state-writing-fgos-verb-from-inside-a-picked-wo/run-a-state-verb-from-inside-a-worktree.md';h=next(h for h in m.heading_sections(PIN,target) if h['sample'].startswith('A fourth case:'))
  a3.anchored_patch(r,e,path,body,target,h['anchor'],nums=[152,154,155,156,157,158,181,182],assessment='The source describes the earlier eight-verb set and the subsequent schedule addition, not eight as the current count. The exact fourth case records the same tsk-3u2 schedule fix and --dir remedy, then adds three later verbs. Source chronology remains true.');return
 if short=='04341':
  a3.park(r,e,path,body,'Description needs rewrite: this Related item still describes the local recovery as blocked to proposed, although the source itself corrects that command to awaiting-approval. The sibling holder correctly supports blocked to doing; rewrite the complete comparison with the actual current status names before redirecting.','description-rewrite');return
 if short in ('04368','04371'):
  a3.park(r,e,path,body,'Description needs rewrite: the RUL6 holder at docs/platform/runner/subcomponents/h-6979005beaf7/spec.md now explicitly withholds git grants from workers and uses the changed invocation boundary. This superseded synthetic-tier recipe still binds old allowedTools/config and git grants to that rule. Reconcile the historical/current security framing before redirecting the body and Related citations.','description-rewrite');return
 if short=='04342':
  target='docs/platform/packaging-distribution/spec.md'
  a3.park(r,e,path,body,'Description needs rewrite: the actual plugin mirror contract in '+target+' Data Dictionary row 4b distinguishes byte-identical plugin/agents mirrors from generated Claude thin redirects. The source D4 description claims the older blanket byte-identical mirror invariant. Restate the full invariant and test scope together.','description-rewrite');return
 if short=='04323':
  target='docs/platform/work-state/spec.md';patch(r,e,path,body,target,'Data Dictionary','Data Dictionary row 4 is the full status domain including wontfix. The source names that complete domain and formal transition reference, with no obsolete status count or edge enumeration asserted in this Related item.');return
 if short=='04339':
  a3.park(r,e,path,body,'Phase 9 carry: the exact cited Install Behaviors subsection exists only in Retained Distribution Source Detail in docs/platform/packaging-distribution/spec.md. The live Install Channels overview is not that subsection. Carry/reconcile the exact behavior into an accepted live passage before redirecting this section-specific pointer.','phase9-carry');return
 if path.startswith('docs/decisions/'):
  number=re.search(r'/decisions/(\d{4})',path)[1];holders=m.decision_narrative_holders(PIN,number);assert len(holders)==1,(key,holders)
  target,anchor=holders[0].split('#',1)
  a3.anchored_patch(r,e,path,body,target,anchor,assessment='The exact decision '+number+' narrative states the Native-First Dispatch Doctrine: a CLI cannot invoke the live Task tool, so the caller supplies the reasoning/verdict and uses the registered executor boundary. The source names this doctrine, not a different decision of the same number. Its phase/example chronology is explicitly historical.');return
 aliases={a['entry']['currentPath'] for a in m.resolver.aliases(PIN,path) if a['entry'].get('currentPath')}
 if path not in c.tree|c.dirs and aliases:
  assert len(aliases)==1,(key,aliases);target=aliases.pop();assert target!=r['file'],(key,target)
  assessments={
   '04328':'The complete decomposed-root guide states that child branches merge into the root branch and the root still needs its own closeout. This contrasts correctly with targets merging directly into main in the source milestone guide.',
   '04329':'The complete approve guide covers approve full-suite verify-fail-post-merge, separately from return item-scoped verify. The cited clause is the whole failure guide, not its historical proposed status spelling.',
   '04332':'The whole return guide covers unrelated verification failures and the real branch-source worktree/dependency gaps, distinct from the source no-new-commits closeout case.',
   '04335':'The complete executor-aware dispatch explanation states why a call site names its own executor entry; this is precisely the whole-system mechanism named in this Related clause.',
   '04336':'The complete skill wiring guide is about a skill consumer dispatching through an existing executor, distinct from configuring a named-agent executor here.',
   '04337':'The complete headless function wiring guide is about a function consumer dispatching through an executor, distinct from configuring that executor here.',
   '04340':'The whole footprint explanation records the automatic split dropping a locked decision from every child footprint; the source contrasts that known failure with manual planning omitting footprint entirely.',
   '04367':'The whole headless-function guide provides the explicit executorId plus command/args call-site boundary named by this source supersession banner, independently of the obsolete recipe retained below.',
   '04384':'The whole explanation records the repoRoot/worktree mismatch in readLockedContext causing locked verify overwrite; the source names that complementary bug, not a replacement for caller-verdict flags.',
   '04387':'The complete repoRoot/verify-overwrite explanation supplies the sibling incident explicitly named in this Related item.',
   '04393':'The whole recovery guide states the different spawnSync git ENOENT/worktree cwd failure; the source correctly excludes it from the posix_spawn /bin/sh harness error.',
   '04398':'The whole recovery guide covers the repo-owned spawnSync git ENOENT incident, correctly contrasted with this unrelated hook /bin/sh error.'
  }
  if short=='04352':
   patch(r,e,path,body,target,'2. Prepend','Step 2 states prepend npm install to the verify command because the disposable checkout has no node_modules, matching the dependency failure, matching this exact tsk-slq/yaml dependency half of the historical two-block fix.');return
  assert short in assessments,(key,path,target);patch(r,e,path,body,target,None,assessments[short]);return
 assert not path.startswith(('docs/specs/','docs/architect/')),(key,path)
 preserve(r,e,path,body,'Retained source/history artifact or documented placeholder under a retained root; complete adjacent context: '+repr(context)+'. No documentation authority move is asserted.')

def main():
 rs=[];reads=[]
 for file,b in m.population().items():
  raw=m.blob(PIN,file);old=m.blob(m.INVENTORY,file);assert raw==old;body=raw.decode();ls=body.splitlines();invs=[e for e in c.entries.values() if e['consumerPath']==file]
  r=dict(file=file,inventoryInputCommit=m.INVENTORY,authorInputCommit=PIN,inventoryFileDigest=m.sha(old),digest=m.sha(raw),inventoryEdgeIds=[e['edgeId'] for e in invs],diff='',edges=[],checks={'coverage':{'authorAddedEdgeIds':[]},'anchors':{},'relativeResolution':{},'labelForm':{}},reviewSet='batch-'+b,authoringRules=['A51','L12-10','L12-21..L12-39; full authoring rules digest'])
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
 save('step-03-wave4c-whole-file-reads.json',{'pin':PIN,'files':reads,'sourceBytes':sum(x['bytes'] for x in reads),'method':'Complete immutable source bytes read; every inventory span bound; supplemental full-file scan and context considered. Author traversal is not independent review.'})
 save('step-03-wave4c-population.json',{'pin':PIN,'completedBatches':list(SETS),'pendingBatches':[f'{i:03}' for i in range(73,83)],'stopReason':'Turn budget: stop after whole batch 072; do not claim 073–082 authored.','files':len(rs),'inventoryEdges':sum(len(r['inventoryEdgeIds']) for r in rs),'addedEdges':sum(len(r['checks']['coverage']['authorAddedEdgeIds']) for r in rs),'edges':sum(len(r['edges']) for r in rs),'patchedFiles':sum(bool(r['diff']) for r in rs),'dispositions':dict(collections.Counter(e['disposition'] for r in rs for e in r['edges'])),'parks':dict(collections.Counter(e['blockedCategory'] for r in rs for e in r['edges'] if e['disposition']=='parked')),'reviewAcceptance':'pending independent A51 review'})
 print(json.dumps({'files':len(rs),'edges':sum(len(r['edges']) for r in rs)}))
if __name__=='__main__':main()
