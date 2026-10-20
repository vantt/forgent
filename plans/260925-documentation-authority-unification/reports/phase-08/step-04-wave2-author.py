#!/usr/bin/env python3
"""Serial source-owner authoring, report-only; never applies consumer diffs."""
import sys
sys.dont_write_bytecode=True
import importlib.util,pathlib,json,re,collections,time
P=pathlib.Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('a',P/'step-04-wave1-author.py');a=importlib.util.module_from_spec(s);s.loader.exec_module(a)
q=a.q;m=q.m
PIN='d4a07d57c4d146b482d4a9e632dc02d8df42af79';q.PIN=PIN;a.PIN=PIN
SETS=q.BATCHES[16:];a.SETS=SETS
BASE=a.disposition

def point(r,e,body,target,term,why):
 lines=m.blob(PIN,target).decode().splitlines();hits=[i for i,l in enumerate(lines,1) if term in l];assert len(hits)==1,(target,term,hits)
 a.patch(r,e,body,target,hits[0],why)
 proof=r['checks']['anchors'][e['slotKey']]
 # Preserve actual target heading coordinates, not the legacy section number.
 proof['locatorScopeReason']=why
 for kind,v in r['checks']['coverage']['descriptionTruth'][e['slotKey']]['comparisons'].items():
  v['note']=why+' Source claim checked in its complete adjacent comment/unit.'

def preserved(e,body,why):
 a.preserve(e,body);e['reason']='A51, L12-10/26/38/40/46/58: '+why+' Exact passage: '+repr(m.resolver.passage(body,e['sourceSpans']))
 if e['legacyPath'].startswith(('docs/specs/','docs/architect/')):e['reason']+=' Exists at author pin; tree retires at Phase 9; preserve the historical evidence/lineage spelling, with no current-authority acceptance.'

def disposition(r,e,body):
 f=e['consumerFile'];eid=e['edgeId'];path=e['legacyPath'];passage=m.resolver.passage(body,e['sourceSpans'])
 if eid is None:
  e['censusAdmission']='pending Lead; exact supplemental tuple only'
  a.park(e,body,'Lead ruling needed: admit the exact L12-57 supplemental occurrence tuple to the census before executable source authoring. No Step 2 id exists and none is invented. '+('Worker skills/bind citation needs a content-bound successor at Step 7.' if 'ak-cook' in f else 'Dated plan/report evidence is otherwise preserve; its census admission remains pending.'),'lead-ruling');return
 if e['renderOnly']:
  return BASE(r,e,body)
 if f=='CHANGELOG.md' or f.startswith(('plans/','docs/history/')):
  preserved(e,body,'Dated release/plan/report or implementation evidence retains its original citation identity (captured evidence). No active navigation or cutover acceptance is inferred.');return
 if eid in ['class6-l-000200','class6-l-000201','class6-l-000294','class6-l-000307','class6-l-000313','class6-l-000317','class6-l-000332','class6-l-000422']:
  if eid=='class6-l-000201':
   a.park(e,body,'Description needs rewrite: the renamed triage-table holder records absent goalTier as a dash but does not assert that an absent priority sorts LAST. Preserve the intended sort behavior while locating the precise ordering rationale before redirecting this analogy.','description-rewrite');return
  specs={
   'class6-l-000200':('docs/knowledge/fgos-triage-table-columns/triage-table-columns.md','| `status` | `status` |','The renamed reference explicitly says raw status is rendered as-is. This proves the raw-literal field claim, without adding any status/column behavior.'),
   'class6-l-000294':('docs/knowledge/how-to-resolve-an-fgos-approve-merge-conflict-caused-by-two/resolve-a-decision-id-collision-merge-conflict-on-approve.md','- This is a *content-agnostic* conflict:','The renamed how-to Before you start explains independent next-free decision ids and same-position index collisions. Preserve the original evidence, with its canonical navigation path.'),
   'class6-l-000307':('docs/knowledge/how-to-fix-a-fgos-write-rejected-merge-block-on-a-fgos-chang/fix-fgos-write-rejected-merge-block.md','## Example: `tsk-3v2`','The renamed how-to retains the named independent precedents and frozen-state wall. The tsk-3v2 example precisely distinguishes inherited branch state from the different decision-index collision case.'),
   'class6-l-000313':('docs/knowledge/how-to-fix-a-fgos-write-rejected-merge-block-on-a-fgos-chang/fix-fgos-write-rejected-merge-block.md','## Example: `tsk-3v2`','The tsk-3v2 example explicitly restores the target branch own frozen pre-merge state; this is the recovery analogy used in the source comment.'),
   'class6-l-000317':('docs/knowledge/why-mergerunneritem-takes-a-separate-lockroot-param/why-mergerunneritem-takes-a-separate-lockroot-param.md','## The fix — a separate `lockRoot` parameter','The fix section explains that worktrees strip their state directory and that lockRoot must remain the real checkout while repoRoot remains the git operation worktree. The comment retains this distinct-root rationale.'),
   'class6-l-000332':('docs/knowledge/how-to-safely-git-reset-hard-the-main-checkout/safely-reset-the-main-checkout.md','## Before you start','The existing guard guidance requires full-tree status before destructive reset. The source explicitly adapts that discipline to a different claim worktree target, without claiming identical guard implementation.'),
   'class6-l-000422':('docs/knowledge/why-gate-bypass-is-shaped-the-way-it-is/gate-bypass-design.md','## Why the skip criterion is mechanical, not a confidence read','The renamed design describes a mechanical criterion, contrasting it with interpretive confidence. The source still rejects risk keyword negation rather than widening that lexical gate.')}
  target,term,why=specs[eid];point(r,e,body,target,term,why);return
 if not path.startswith(('docs/specs/','docs/architect/','docs/distribution-vision.md')):
  # Retained roots, portable conventions and runtime-looking examples are
  # unchanged; real readers/writers remain in Step 5 custody.
  return BASE(r,e,body)
 if f=='core/skills/_shared/citation-format.md':
  a.park(e,body,'Description needs rewrite: the tier convention assumes one docs/specs/<area>.md rule owner, or names the citation checker scan roots. The split candidate holder model and Step 5 checker-root parity must preserve area-suffix semantics and external-project conventions before this complete statement can change.','description-rewrite');return
 if eid in ['skills-084','skills-087']:
  point(r,e,body,'docs/platform/runner/subcomponents/h-6979005beaf7/spec.md','- **RUL45','Exact RUL45 live rule treats submitted title/description as untrusted data and forbids raw shell interpolation; retain that rule, without a runtime change.');return
 if eid in ['skills-085','skills-088']:
  a.park(e,body,'P8-DOC-GAP-02: end-user pointer conservation in the reading-map and index/registry reader-writer parity in the behavioral-consumer step must settle the exact one-bullet update contract. Alias lookup does not establish a write destination, and the rest of the reading-map must remain intact.','GAP-02');return
 if eid=='class6-l-000194':
  point(r,e,body,'docs/platform/packaging-distribution/contracts/release-manifest.md','`artifactDigest` is the canonical manifest/tree identity.','The existing named release-manifest contract already owns the canonical manifest digest rule. Legacy §5 now corresponds to live §5 Digest Rule; preserve the adjacent schema contract citation.');return
 if eid in ['class6-l-000192','class6-l-000195']:
  a.park(e,body,'Phase 9 carry: legacy ReleaseManifest §5 includes NFC normalization, lexicographic ordering, case collisions and full digest rules. The candidate release-manifest live Digest/Safety Rules are narrower; the exact normalization table remains under Retained Runtime Identity And Activation Source Detail. Carry that complete rule before redirecting this §5 claim.','phase9-carry');return
 if eid=='class6-l-000193':
  a.park(e,body,'Phase 9 carry: init module cites the combined original §3 roots, §6 activation transaction and §14 walking skeleton pipeline. These sections are split across repository-runtime-layout, activation-binding and retained architecture detail; no single live passage proves the complete acquire/stage/verify/preflight/publish/tail claim. Carry/reconcile the whole citation rather than substituting a generic area spec.','phase9-carry');return
 if eid in ['class6-l-000196','class6-l-000197']:
  a.park(e,body,'Phase 9 carry: the exact distribution line-297 git-common-dir root discovery rule appears in candidate packaging-distribution retained Distribution Source Detail (around line 797), not its live root-binding contract. Carry this git-common-dir versus show-toplevel distinction before replacing the numeric locator.','phase9-carry');return
 if eid in ['class6-l-000253','class6-l-000316','class6-l-000408','class6-l-000449','class6-l-000452','class6-l-000453','class6-l-000456','class6-l-000458','class6-l-000459','class6-l-000460']:
  preserved(e,body,'The comment names tsk-40m/D2 and the original implemented claim redesign or dated hard-cut, explaining why the old durable work.move leg/marker no longer applies. This is implementation lineage, not an instruction to adopt the retired proposal as authority. Candidate proposal docs/platform/proposals/doing-coordination-redesign.md is a non-canonical source snapshot, not an executable replacement.');return
 if eid=='class6-l-000261':
  preserved(e,body,'The explicit "previously documented-only" clause records the old executor-profile target-vocabulary location before the Phase C additive implementation. Preserve that past-location fact and its deliberately unchanged behavior distinction.');return
 if eid in ['class6-l-000263','class6-l-000264','class6-l-000265','class6-l-000266']:
  target='docs/platform/agent-confinement/contracts/confinement-authority-v1.md'
  if eid=='class6-l-000264':term='### 6.2 Nơi đặt policy';why='Backend registry citation maps the original policy/backend placement §6.2–6.2.1 to its exact nested registry trust-boundary contract, retaining all adjacent machine-local schema claims.'
  elif eid=='class6-l-000265':term='## 6. Canonical contracts';why='Policy vocabulary/normalization cite the canonical policy shape and placement contract (§6.1–6.2), retained in this full parent contract section; live rule numbers are unchanged.'
  elif eid=='class6-l-000266':term='## 6. Canonical contracts';why='Confinement request construction cites both §6.4 plan and §6.10 version/evolution; their nearest common parent is the canonical-contract section. Both original numbered locators remain within it.'
  else:
   a.park(e,body,'Phase 9 carry: this confinement module combines original §1/§5.2/§6.6/§6.9 or §6.4/§6.10 across separate spec and contract holders. Resolve the entire multi-section citation and the Phase 02 rule claims before redirecting it; a single narrow contract heading would omit part of the original locator.','phase9-carry');return
  point(r,e,body,target,term,why);return
 if eid in ['class6-l-000268','class6-l-000282']:
  a.park(e,body,'Phase 9 carry: the comment describes the newer supervisor-owned terminal attempt and detached handover/gate lifecycle. The candidate runner spec/subcomponent is older and lacks this complete executeAssignment terminal transport boundary. Carry the supervisor handover rule before redirecting the exact maintained comment.','phase9-carry');return
 if eid=='class6-l-000273':
  a.park(e,body,'Phase 9 carry: original FlowDefinition contract supports operation prompt-template registry, deterministic resolver and bounded provenance renderer. The candidate flow-definition is under agent-coordination/history/retired-engine/files/contracts and cannot establish this live contract; reconcile the exact maintained operation-template claim into a live holder.','phase9-carry');return
 if eid=='class6-l-000279':
  a.park(e,body,'Phase 9 carry: the run-admission lock cites runtime-recovery-design section 6 Local Concurrency And Durability. The candidate retains this design as source detail, while the current kernel-lock rule RUL101 addresses a different lock. Carry the exact admission/fencing contract; do not conflate them.','phase9-carry');return
 if eid=='class6-l-000285':
  preserved(e,body,'The comment explicitly calls the credential relay "named as open" and frames it as WHAT THIS DOES NOT SOLVE, with dated measured private-HOME limitations. Preserve that original unimplemented proposal evidence; candidate docs/platform/proposals/coordination-worker-provider-boundary.md remains a non-canonical snapshot.');return
 if eid=='class6-l-000328':
  a.park(e,body,'Phase 9 carry: the installed-into-other-repositories story in distribution-vision supports host-specific trunk names, not a hardcoded main fallback. Its whole distribution vision remains a carry dependency of docs/platform/vision.md; current generic platform vision alone does not prove this exact external-host trunk claim.','phase9-carry');return
 if eid and eid.startswith('class6-l-') and int(eid.rsplit('-',1)[1]) in range(438,446):
  a.park(e,body,'Phase 9 carry: knowledge-registry-redesign '+passage.strip()+' is held in non-canonical docs/platform/proposals/knowledge-registry-redesign.md source snapshot. Carry this exact framework/role/doc identity, lifecycle or attestation rule into a live registry holder and prove schema/reader parity in the behavioral-consumer step before redirecting the comment.','phase9-carry');return
 if eid=='class6-l-000447':
  point(r,e,body,'docs/platform/work-state/spec.md','| 6 | risk |','The candidate Data Dictionary retains risk as free text. That exact field-6 row supports the existing fallback, with no changed risk enum or runtime behavior.');return
 if eid=='class6-l-000448':
  point(r,e,body,'docs/platform/work-state/spec.md','- **RUL27','The live RUL27 states settlement is keyed to leaving the first stage, not its arrival edge; it explicitly preserves past settlement meaning when a stage is inserted.');return
 if eid=='class6-l-000461':
  a.park(e,body,'Description needs rewrite: decision scope is free text but the source illustrates area scope with docs/specs/<area>.md, a retiring monolithic area layout. Candidate decisions split across area holders; keep the free-text/public meaning and trace Step 5 decision-index grouping before specifying a truthful replacement example.','description-rewrite');return
 return BASE(r,e,body)

def blank(row):
 if row['edgeId'] is not None:return a.blank(row)
 ss=q.spans(row);e={'edgeId':None,'slotKey':q.slotkey(row),'inventoryRefs':[],'inventoryOccurrences':[],'supplementalOccurrenceKey':row['supplementalOccurrenceKey'],'consumerFile':row['file'],'renderOnly':q.isrender(row),'slotSourceSpans':ss,'sourceSpans':ss,'matchedExpression':'\n'.join(x['text'] for x in ss),'logicalReference':a.logical(ss),'disposition':'preserve','diffHunk':None,'reason':'','target':None,'anchor':None,'timing':'none','blockedReason':None,'dependency':None,'blockedCategory':None,'dependencyCategory':None}
 e['legacyPath']=a.pathof(e);return e

def main():
 times=[]
 for b in SETS:
  start=time.monotonic();main_before=m.git('rev-parse','main').decode().strip();rows=q.manifest_rows(b);owners=sorted(set(q.record_owner(x) for x in rows));rs=[]
  for file in b['consumerFiles']:a.fullread(file)
  for file in owners:
   body=a.fullread(file);rr=[x for x in rows if q.record_owner(x)==file];inputs=[{'path':k,**q.POP['inputPins'][k]} for k in sorted({ref['inventory'] for row in rr for ref in row['inventoryRefs']})]
   r={'file':file,'inventoryInputCommit':inputs[0]['commit'] if inputs else None,'inventoryInputs':inputs,'authorInputCommit':PIN,'inventoryFileDigest':m.sha(m.blob(inputs[0]['commit'],file)) if inputs else None,'digest':m.sha(body),'inventoryEdgeIds':[x['edgeId'] for x in rr],'diff':'','edges':[],'checks':{'coverage':{'writerTrace':{},'descriptionTruth':{},'scope':'Every frozen slot, qualified original census occurrence or explicitly pending supplemental tuple. Other buckets remain Step 3/5; no new census id.'},'anchors':{},'relativeResolution':{},'labelForm':{}},'reviewSet':b['batch'],'authoringRules':['A51','L12-7','L12-10','L12-21..L12-59'],'sourceRenderProvenance':q.provenance(file),'wholeFileRead':a.READS[file]}
   if not inputs:r['censusAdmission']='pending Lead; exact supplemental tuple only'
   for row in rr:
    e=blank(row);disposition(r,e,m.blob(PIN,e['consumerFile']).decode());r['edges'].append(e)
   for e in r['edges']:
    if not e['renderOnly']:continue
    source=next((x for x in r['edges'] if not x['renderOnly'] and x['logicalReference']==e['logicalReference']),None)
    if source:
     e['sourceSlotKey']=source['slotKey'];e['disposition']=source['disposition'];e['timing']=source['timing'];e['reason']+=' Canonical source disposition: '+source['reason']
     if source['disposition']=='parked':
      for k in ['blockedCategory','dependencyCategory','blockedReason','dependency']:e[k]=source[k]
   for e in r['edges']:
    if not e['renderOnly'] and e['disposition']=='preserve':
     for holder in m.removed_decision_holders(PIN,e,e['legacyPath']):
      e['reason']+=' Non-executable successor note: '+holder+'.'
   groups=collections.defaultdict(list)
   for e in r['edges']:
    if not e['renderOnly']:groups[m.unit_id(body,e['sourceSpans'])].append(e)
   for unit,es in groups.items():
    if len({e['disposition'] for e in es})>1:
     for e in es:e['unitDispositionReason']=e['slotKey']+' Distinct claim: '+e['matchedExpression']+': '+e['reason']
   changes=[]
   for e in r['edges']:
    if not e['renderOnly'] and e['disposition']=='patch':changes.extend(m.replacement_changes(body,e['sourceSpans'],r['checks']['relativeResolution'][e['slotKey']]['replacement']))
   after=body
   for x,y,value in reversed(sorted(set(changes))):after=after[:x]+value+after[y:]
   r['diff']=m.make_diff(file,body,after)
   for e in r['edges']:
    if not e['renderOnly'] and e['disposition']=='patch':
     n=e['sourceSpans'][0]['line'];e['diffHunk']=next(h.splitlines()[0] for h in m.hunks(r['diff']) if (lambda a,c:a<=n<a+c)(*map(int,re.match(r'@@ -(\d+)(?:,(\d+))?',h).groups(default='1'))))
   rs.append(r)
  (P/'step-04-records'/(b['batch']+'.jsonl')).write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs))
  main_after=m.git('rev-parse','main').decode().strip();assert main_before==main_after
  times.append({'batch':b['batch'],'localMainBefore':main_before,'localMainAfter':main_after,'localMainChangesAgainstPin':m.git('diff','--name-only',PIN+'..'+main_after,'--',*b['consumerFiles']).decode().splitlines(),'elapsedSeconds':round(time.monotonic()-start,3),'canonicalFiles':len(rs),'slots':len(rows)})
  print(b['batch'],len(rs),len(rows),flush=True)
  with (P/'progress.md').open('a') as f:f.write('\n- Wave 2 authored '+b['batch']+': '+str(len(rs))+' source records / '+str(len(rows))+' slots; mechanical and independent checks pending.\n')
 q.save('step-04-wave2-whole-file-reads.json',list(a.READS.values()));q.save('step-04-wave2-author-times.json',times)
if __name__=='__main__':main()
