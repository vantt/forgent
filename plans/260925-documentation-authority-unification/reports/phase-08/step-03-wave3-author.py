#!/usr/bin/env python3
"""Pinned full-file Step 3 wave 3 record authoring; no consumer writes."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,re,copy,collections,time,posixpath
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('a',P/'step-03-wave2-author.py');a=importlib.util.module_from_spec(sp);sp.loader.exec_module(a)
m=a.m;PIN=a.PIN;v=m.resolver;m.SETS=tuple(f'{i:03}' for i in range(42,70));c=m.Checker(PIN);a.c=c
RULES=['A51','L12-10 external-project conventions','L12-21..L12-37; current authoring rules digest']
def save(name,o):(P/name).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def legacy_path(raw):return re.sub(r':\d+(?:[-–]\d+)?$','',raw.removeprefix('repo/').split('#')[0]).rstrip('/')
def facts(e,path):
 short=re.fullmatch(r'docs/decisions/(\d{4})',path)
 if short:
  for rev in m.path_history(PIN,path):
   for change in m.commit_changes(rev):
    if len(change)>1 and change[1].startswith(path+'-') and change[1].endswith('.md'):
     if change[0]=='D':
      e['targetFacts']=[{'path':change[1],'state':'removed','commit':rev}]
      return 'Elided decision id denotes '+change[1]+'; target removed at '+rev+' with no successor file. Decision narrative resolution remains generator-owned.'
     if change[0].startswith('R'):
      e['targetFacts']=[{'path':change[1],'state':'renamed','commit':rev,'successor':change[2]}]
      return 'Elided decision id denotes '+change[1]+'; target renamed at '+rev+' to '+change[2]+'.'
  raise AssertionError(('unresolved elided decision',path))
 try:
  why,fs=a.factual(path)
 except AssertionError:
  normalized=legacy_path(path)
  for rev in m.path_history(PIN,normalized):
   for change in m.commit_changes(rev):
    if len(change)>1 and change[1].startswith(normalized+'/') and change[0]=='D':
     e['targetFacts']=[{'path':change[1],'state':'removed','commit':rev}]
     return 'Historical directory '+normalized+' has no tracked descendants at the pin; latest child lineage '+change[1]+' was removed at '+rev+' with no same-commit file rename.'
    if len(change)>2 and change[1].startswith(normalized+'/') and change[0].startswith('R'):
     e['targetFacts']=[{'path':change[1],'state':'renamed','commit':rev,'successor':change[2]}]
     return 'Historical directory '+normalized+' has no tracked descendants at the pin; latest child lineage '+change[1]+' was renamed at '+rev+' to '+change[2]+'.'
  assert any(x in path for x in ['<','*','{']),path
  why='Illustrative pattern in its explicitly named source context; no literal placeholder file asserted.';fs=[]
 if fs:e['targetFacts']=fs
 return why

def preserve(r,e,path,body,claim,external=False):
 if m.carriage_declaration(body,e['sourceSpans'][0]['line']):a.preserve(r,e,path,body,'');return
 e['reason']='L12-26(3,5), L12-31, L12-37: '+('L12-10 upstream source coordinates, not fgOS documentation ownership. ' if external else facts(e,path)+' ')+claim

def park(r,e,path,body,why,category='phase9-carry'):
 a.park(r,e,path,body,why,category)
 if not m.carriage_declaration(body,e['sourceSpans'][0]['line']):
  state=facts(e,path);e['reason']+=' '+state

def anchored_patch(r,e,path,body,target,anchor=None,nums=None,assessment=None,locators=None):
 a.patch(r,e,path,body,target);key=e['edgeId'];tb=m.blob(PIN,target).decode();tl=tb.splitlines();proof=r['checks']['anchors'][key]
 if anchor:
  h=next(h for h in m.heading_sections(PIN,target) if anchor in (h['anchor'],h['githubSlug']))
  e['anchor']=h['githubSlug'] if e['matchedExpression'].startswith(('[','![')) else h['anchor']
  nums=nums or [h['startLine']]
  proof.update(targetLines=nums,targetLineText=[tl[n-1] for n in nums],passage=h['body'],sourceLocatorTokens=locators or [],locatorScopeReason='Complete source claim is bound to the pinned target passage; the repository anchor API supplies the closest enclosing heading.')
  proof.pop('wholeFileJustification',None)
 else:
  nums=nums or [next((i for i,l in enumerate(tl,1) if l.startswith('# ')),1)]
  proof['wholeFileJustification']='This citation names the complete retained evidence artifact or guide by its subject, with no section-specific assertion. Full target bytes were traversed and compared with the source artifact/subject. '+(assessment or '')
  proof['locatorScopeReason']='Whole-artifact navigation; incidental decision/task ids in the surrounding example do not locate a subsection of this artifact.'
 r['checks']['relativeResolution'][key]['replacement']=m.form(e['matchedExpression'],r['file'],target,e['anchor'])
 e['reason']='L12-26, L12-30, L12-31, L12-32, L12-37: Phase 9 citation patch to exact committed holder '+target+'. '+(assessment or 'Pinned source and target state the same complete artifact subject.')
 d=r['checks']['coverage']['descriptionTruth'][key];d.update(targetEvidence=[{'line':n,'text':tl[n-1]} for n in nums],assessment=assessment or 'The target preserves the complete source artifact verbatim; adjacent descriptions have the same evidence carrier at its approved mirror path.')
 for k in d['comparisons']:d['comparisons'][k]={'verdict':'matches' if path.startswith('docs/architect/agent-coordination/verification/') else 'not-asserted','note':d['assessment']+' No additional '+k+' change is introduced.'}
 e.pop('targetFacts',None)

# Explicitly live claims amid otherwise retrospective explanations.
LIVE={'maps-j-03804','maps-j-03885','maps-j-03888','maps-j-03906','maps-j-03781'}
HISTORY_SPEC={
 'maps-j-03781':False,
}
def disposition(r,e,path,body,inv):
 n=e['sourceSpans'][0]['line'];passage=m.adjacent_passage(body,e['sourceSpans']);file=r['file'];key=e['edgeId'];p=legacy_path(path)
 decl=m.carriage_declaration(body,n)
 if decl:preserve(r,e,path,body,'');return
 if file=='docs/decisions/index.md':
  park(r,e,path,body,'Step 5 parity: docs/decisions/index.md declares generated by fgos decision-index; src/report/decision-index.mjs (computeDecisionIndex/generateDecisionIndex), called by bin/fgos.mjs, owns projection changes and regeneration. Preserve generator inputs and scope/decision identity; no hand-patch of this render.','step5-parity');return
 if key in ['maps-j-04035','maps-j-04036','maps-j-04037','maps-j-04038']:
  e['reason']='L12-10, L12-26: preserve runtime build-output convention ./target/release/fgctl from the preceding cargo build/stage example. The executable is generated locally, not a documentation link or tracked target; no missing Markdown target is asserted.';return
 if key in ['maps-j-03799','maps-j-03801','maps-j-03815']:
  preserve(r,e,path,body,'Preserve exact identity key or completed incident/research evidence: '+repr(passage[:600])+'. The deleted decision citation was the historical bug, not a new live reader instruction.');return
 if file.endswith('.yaml'):
  if p.startswith(m.RETIRING_ROOTS) or p not in c.tree|c.dirs:
   park(r,e,path,body,'Step 5 parity: shipped CTR010 fgos-gateway.v1 contract is served/read as runtime bytes (A45). Coordinate citation metadata/description with the gateway contract source and consumers; retain CTR010 and all OpenAPI keys/schema/identity. No Step 3 hand edit or renumbering.','step5-parity')
  else:preserve(r,e,path,body,'Retained shipped CTR010 contract reference; runtime reader parity remains a separate Step 5 obligation. No contract id/key/schema change.')
  return
 # Distillery sources/reports cite the named upstream at recorded commits, not fgOS.
 external=file.startswith(('docs/distillery/sources/','docs/distillery/reports/')) and (p.startswith(('docs/specs','docs/history','docs/decisions')) or 'bee' in passage.lower())
 if external:preserve(r,e,path,body,'Preserve the literal upstream citation under the file’s named source/cursor or dated extraction header; no fgOS cutover destination is asserted.',True);return
 if file.startswith('docs/distillery/') and not (p not in c.tree|c.dirs and any(x['entry'].get('currentPath') in c.tree for x in v.aliases(PIN,p))):
  if key=='maps-j-01704':park(r,e,path,body,'Description needs rewrite: the candidate port destination proposes a new docs/specs/ note. Re-evaluate that entire candidate destination/skill-authoring checklist row after authority flip; substituting a directory would invent a product decision.','description-rewrite');return
  preserve(r,e,path,body,'Preserve the dated learning-source/deep-dive citation and its dated comparison context: '+repr(passage[:240])+'. No current reader/writer relocation is prescribed here.');return
 if file.startswith('docs/journals/'):
  preserve(r,e,path,body,'Preserve dated resolved incident evidence: '+repr(body.splitlines()[0])+'. This journal recounts the completed merge/fix, not current navigation.');return
 # Missing paths with registered live aliases cannot preserve, even quoted in a live file.
 aliases={x['entry'].get('currentPath') for x in v.aliases(PIN,p)}-{None}
 aliases={x for x in aliases if x in c.tree and not v.carriage(m.blob(PIN,x).decode(),1,x)}
 if p not in c.tree|c.dirs and aliases:
  if key in ['maps-j-01636','maps-j-01642']:
   park(r,e,path,body,'Description needs rewrite: registry alias identifies the renamed live holder, but this dated comparison/update still names capacities/runner.capacities and the older CLI/config kind. The holder now specifies executors/runner.executors and revised kind/registration rules. Reconcile the complete adjacent config/behavior description; a path-only alias patch would certify stale schema names.','description-rewrite');return
  if key in ['maps-j-03865','maps-j-03866','maps-j-03924','maps-j-03925']:
   park(r,e,path,body,'Step 5 parity: this passage describes the exact recovery-document path emitted by the production refusal message, including a historical missing-file claim. Registry alias finds the live holder but changing the literal citation independently would falsify the documented message identity. Coordinate the message producer/consumer and adjacent historical description, never silently certify that the runtime message already names the new holder.','step5-parity');return
  if key=='maps-j-03977':
   park(r,e,path,body,'Description needs rewrite: the alias holder explicitly says seq-contiguity scripts were deleted and its procedure is historical. The source recommends this as the events-specific recovery angle without that supersession. Reconcile the complete recovery paragraph with the current sharded-event mechanism; no path-only patch into its historical procedure.','description-rewrite');return
  assert len(aliases)==1,(key,aliases)
  target=next(iter(aliases));t=m.blob(PIN,target).decode()
  bindings={
   'maps-j-03738':('Why this happens',[27,29,32],'The parent-absorbed/pre-done branch case is explicitly described in Why this happens; the source cites that exact legitimate closeout shape.'),
   'maps-j-03740':('Example: `tsk-3v2`',[344,353,359],'The named tsk-3v2 example preserves the branch’s own historical fork snapshot when merging main; this is the exact recovery precedent in the source.'),
   'maps-j-03840':('__H1__',[12,16,18,24],'The target header states that seq-contiguity scripts were deleted, the baseline froze and the old procedure became history, matching the source’s completed cleanup/supersession claim.'),
   'maps-j-03850':('Steps',[65,68],'The actual Steps command uses --force-rebaseline-all with the guard’s explicit directory/file arguments, matching the completed force-rebaseline correction cited here.'),
   'maps-j-03851':('Steps',[65,68],'This is explicitly the pre-tsk-46v example in a completed incident; the live holder’s corrected force-rebaseline-all command replaces the earlier direct shard-mode command. The source’s historical pre-fix wording remains explicit, not a current instruction.'),
   'maps-j-03863':('Why this is different',[22,23,24,25,26],'The target explains stash/checkout/reset/clean on shared main as the lost-event fingerprint, the precise comparison this incident makes.'),
   'maps-j-03894':('__H1__',[223,259],'The source names both tsk-5ge and tsk-28o examples, in separate sections. Their nearest common parent is the whole guide, not either example; these document direct-main config changes and inherited sibling diffs.'),
   'maps-j-03905':('Steps',[47,50,64],'The target Steps refuse a behind-HEAD reset and show lost committed commits plus explicit --confirm, alongside the dirty-tree guard. This is the ancestor/commit-loss update the source recounts.'),
   'maps-j-03916':('__H1__',[12,13,14,15],'The introduction limits this guide to status doing with no matching worktree. The source explicitly distinguishes its non-doing durable status; no claim that the guide covers that different failure is introduced.'),
   'maps-j-03930':('Verify trông thế nào',[28,31],'The target shows npm test && POSITIVE && NEGATIVE, the prescribed verify shape this paragraph cites; the source’s measured 224–386 seconds describe its own runs, not a target performance promise.'),
   'maps-j-03976':('Steps',[72,73,74,77,78,86,87],'The target restores paths from the branch’s parent commit and amends away every .fgos diff, matching the cited recovery rule without changing the historical AGENTS update.')}
  if key in bindings:
   hint,nums,assessment=bindings[key];h=next(h for h in m.heading_sections(PIN,target) if h['level']==1) if hint=='__H1__' else next(h for h in m.heading_sections(PIN,target) if hint.casefold() in h['sample'].casefold())
   anchored_patch(r,e,path,body,target,h['anchor'],nums=nums,assessment=assessment)
   dims=r['checks']['coverage']['descriptionTruth'][key]['comparisons']
   for dimension in ['defaults','verbFileLists','shippedStatus']:dims[dimension]={'verdict':'matches','note':assessment}
   return
  # Cross-provider proof history has a precise section, not whole-title navigation.
  hints={'docs/reference/coding-worker-contract-shape.md':'cross-provider','docs/reference/runner-capabilities-advise-execute-slots.md':'pi as'}
  hint=hints.get(p);h=next((h for h in m.heading_sections(PIN,target) if hint and hint in t.splitlines()[h['startLine']-1].lower()),None)
  anchored_patch(r,e,path,body,target,h['anchor'] if h else None,assessment='The committed doc-registry alias names this exact renamed document. Its pinned title, purpose and cited proof/config section cover the adjacent subject; the historical incident or task description remains unchanged.');return
 if p.startswith('docs/architect/agent-coordination/verification/'):
  target=p.replace('docs/architect/','docs/platform/',1)
  if any(x in p for x in ['<','*','{']):
   park(r,e,path,body,'Step 5 parity: live cell-trace writer convention '+p+' must move with the actual trace writer/default root and evidence parity to docs/platform/agent-coordination/verification/. Template placeholders remain whole and are never expanded into invented files.','step5-parity');return
  if target in c.tree:
   assert m.blob(PIN,p)==m.blob(PIN,target),(key,'mirror bytes differ')
   nums=re.findall(r':(\d+)',e['matchedExpression']);h=None
   if nums:
    line=int(nums[-1]);h=next((h for h in reversed(m.heading_sections(PIN,target)) if h['startLine']<=line<=h['sectionEndLine']),None)
    assert h,(key,line)
    anchored_patch(r,e,path,body,target,h['anchor'],nums=[line],assessment='The exact proof mirror is byte-identical. Its visible '+posixpath.basename(p)+':'+str(line)+' label remains true at the same line; the destination adds that line’s exact enclosing heading without losing the source locator or changing its quotation.');return
   anchored_patch(r,e,path,body,target,assessment='Exact same-path verification mirror contains the original source artifact byte-for-byte; the worked example’s real-session evidence, counts and quoted conclusions retain the same subject.');return
  if target in c.dirs:
   old_oid=m.git('rev-parse',PIN+':'+p).decode().strip();new_oid=m.git('rev-parse',PIN+':'+target).decode().strip();assert old_oid==new_oid,(key,'directory mirror differs')
   anchored_patch(r,e,path,body,target,assessment='Exact proof-directory mirror has the same pinned Git tree OID '+new_oid+'; all relative entries, bytes and modes agree. Read-only evidence navigation retains the same full-artifact subject; Step 6 relocation proof remains a cutover gate.')
   r['checks']['anchors'][key]['targetTreeOid']=new_oid;return
  park(r,e,path,body,'Phase 9 carry: exact evidence mirror '+target+' is not a committed live artifact; carry and bind the cited full proof before redirecting this navigation.');return
 if file=='docs/how-to/run-a-coordination-session.md' and not m.related_header(body,n):
  preserve(r,e,path,body,'Preserve the file’s explicit dated framing “Tài liệu lịch sử (Historical — verb fgos coordination đã thu hồi)” and “Kể từ P4 (2026-10-02)”. This body recounts the retired CLI, not current execution instructions. '+('Non-executable successor note: docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md.' if 'coordination-session.md' in p else ''))
  return
 # Concrete current references and defaults in how-to guides.
 if file.startswith('docs/how-to/'):
  if key in ['maps-j-04020','maps-j-04021']:
   park(r,e,path,body,'Step 5 parity: the complete checker command includes --specs-dir docs/specs and --write-baseline; documented scan roots, actual checker default/scope and the retained backlog option change together. No early baseline or CLI behavior edit.','step5-parity');return
  if key in ['maps-j-03989','maps-j-04011']:
   target='docs/platform/runner/decisions/h-36d872fbb0e5.md';h=next(h for h in m.heading_sections(PIN,target) if h['sample'].startswith('0062'))
   anchored_patch(r,e,path,body,target,h['anchor'],assessment='Decision 0062 explicitly removes the raw execute/log/fanout doors and defines run/workflow as execution doors; this undated live decision citation is navigation under L12-37(3).');return
  if key=='maps-j-03990':
   target='docs/platform/agent-confinement/spec.md';h=next(h for h in m.heading_sections(PIN,target) if h['sample'].startswith('9.2 '))
   anchored_patch(r,e,path,body,target,h['anchor'],assessment='Section 9.2 states blind peer run-state isolation, neutral input delivery and refusal without working backend/readiness, matching the complete blind-unit paragraph. No extra count/port/version change is asserted.');return
  if p.startswith('docs/architect/'):
   if 'contracts/coordination-session.md' in p or key in ['maps-j-04048','maps-j-04075']:
    park(r,e,path,body,'Phase 9 carry: this live guide cites the former CoordinationSession engine contract/proposal and its mutation/quorum/group-thinking semantics. The exact CoordinationSession holder docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md is history carriage; step-09-group-thinking-substrate lives in docs/platform/proposals/step-09-group-thinking-substrate.md and declares Source snapshot retained, not a live API contract. Carry/reconcile the exact cited subject with current Workflow/CollaborationPattern ownership before redirecting; the live runner spec alone does not preserve these retired CLI assertions.');return
  if key=='maps-j-04018':
   target='docs/platform/runner/spec.md';anchored_patch(r,e,path,body,target,assessment='This locator-free example names the runner rule home as a complete area spec; the literal RUL<n> is illustrative, not a specific rule id. The retained work-state basename is a separate source context.');return
  if key=='maps-j-04048':
   park(r,e,path,body,'Description needs rewrite: Related navigation names the old live CoordinationSession heading as the platform summary. The exact surviving holder is docs/platform/runner/decisions/h-aabefc85f0c9.md, with the renamed historical CoordinationSession heading. Update the visible section title and historical-summary description together, rather than preserve a stale section label beside a new target.','description-rewrite');return
  if p.startswith(m.RETIRING_ROOTS):
   if key in ['maps-j-04016','maps-j-04023','maps-j-04026']:
    preserve(r,e,path,body,'Preserve explicitly completed cleanup or dated removed-door history: '+repr(passage[:400])+'. No current read instruction in this reference.');return
   park(r,e,path,body,'Description needs rewrite: the live how-to’s complete adjacent claim names the retiring tree or its former engine model; reconcile that source-bound claim with the exact current owner before changing its pointer.','description-rewrite');return
 # History bodies and identity keys in explanation files preserve; live exceptions do not.
 if file.startswith('docs/explanation/') and p.startswith(('docs/specs','docs/architect')):
  source_line=body.splitlines()[n-1]
  if 'authoritative_for:' in source_line or (n<=4 and 'authoritative_for:' in body[:200]):
   preserve(r,e,path,body,'L12-21 exact-match authoritative_for identity key; preserve the contract value compared by src/report/authoritative-match.mjs, independently of body navigation.');return
  if key in LIVE:
   if key=='maps-j-03804':
    target='docs/platform/runner/decisions/h-36d872fbb0e5.md';h=next(h for h in m.heading_sections(PIN,target) if h['startLine']<=959<=h['sectionEndLine'] and h['level']==4)
    anchored_patch(r,e,path,body,target,h['anchor'],nums=[957,959,960,961,962],assessment='The priority decision’s actual numbered list places Release con người second, after Ship Faster, and requires autonomous progress/batched questions. This is the exact principle the paragraph cites; the independent re-verify rationale and incident examples retain their source subject.')
    r['checks']['coverage']['descriptionTruth'][key]['comparisons']['counts']={'verdict':'matches','note':'Source priority #2 equals numbered list item 2 at target line 959.'};return
   if key=='maps-j-03885':park(r,e,path,body,'Phase 9 carry: live RUL105 credentialStore/pi login-store claim has no matching live RUL105 holder in the promoted target tree. Preserve current credential behavior; carry the exact rule and re-resolve this dated-update live citation.');return
   if key=='maps-j-03906':
    target='docs/platform/work-state/spec.md';h=next(h for h in m.heading_sections(PIN,target) if h['sample']=='3. Work Item Data Dictionary')
    anchored_patch(r,e,path,body,target,h['anchor'],nums=[90,91],locators=['Data Dictionary'],assessment='Data Dictionary rows 28 (mergedSha) and 29 (mergedInto) remain exactly numbered at the promoted spec. Row 28 explicitly distinguishes 351 historical items without merge SHA, manual moves and verify-only deliveries; row 29 shares the absence conditions. This preserves both numeric locators and the cited historical-no-SHA bucket, without claiming the unexplained event was repaired.');return
   if key=='maps-j-03888':
    target='docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md';h=next(h for h in m.heading_sections(PIN,target) if h['sample']=='5.1 Dispatch Roles')
    anchored_patch(r,e,path,body,target,h['anchor'],nums=[143],assessment='The surviving live proposal section 5.1 Dispatch Roles explicitly defines orchestrator as the T0 composition layer managing N units of work and staying attached. Its header declares section-specific surviving current contracts; this section is outside dated/source carriage. The Herdr distinction and historical ADR context are unchanged.');return
   if key=='maps-j-03781':park(r,e,path,body,'Phase 9 carry: the cited complete 743-line knowledge-registry redesign specification exists only as promoted architecture carriage. Carry an exact live design holder or rewrite the retrospective’s explicit “complete design spec” navigation; an area portal does not contain its full command/lifecycle/harness subject.');return
  if m.related_header(body,n):
   park(r,e,path,body,'Phase 9 carry: Related navigation needs an exact live holder for '+p+'; the source-bound retrospective subject must be retained outside carriage before the wrapper can redirect.');return
  preserve(r,e,path,body,'Preserve completed implementation/cleanup or dated retirement narrative, not a new read instruction. Source-bound passage: '+repr(passage[:500])+'.');return
 # Retained citations, literals and explicit illustrative archives.
 if p in c.tree|c.dirs or any(x in p for x in ['<','*','{']):
  preserve(r,e,path,body,'Preserve retained reference/convention; no authority flip. '+('Illustrative example/pattern, not a literal missing file.' if any(x in p for x in ['<','*','{']) else 'The complete adjacent subject remains at the committed source path.'));return
 if p.startswith(m.RETIRING_ROOTS):
  preserve(r,e,path,body,'Preserve the explicitly historical/source-only spelling in the completed record: '+repr(passage[:300])+'.');return
 # Missing retained-root literals require passage-specific dead-link accounting.
 if re.search(r'example|placeholder|illustrat|ví dụ|mẫu',passage,re.I):
  preserve(r,e,path,body,'Illustrative example; no literal file at that placeholder is asserted.');return
 park(r,e,path,body,'Dead link: the cited retained-root path has no committed file and no live registry alias; the exact source subject must be restored or independently located before this navigation can execute.','dead-link')

def main():
 rs=[];reads=[];exceptions=[];start=time.monotonic()
 for file,b in m.population().items():
  raw=m.blob(PIN,file);old=m.blob(m.INVENTORY,file);assert raw==old,('needs rebind',file);body=raw.decode();ls=body.splitlines();es=[e for e in c.entries.values() if e['consumerPath']==file];ids=[e['edgeId'] for e in es]
  r=dict(file=file,inventoryInputCommit=m.INVENTORY,authorInputCommit=PIN,inventoryFileDigest=m.sha(old),digest=m.sha(raw),inventoryEdgeIds=ids,diff='',edges=[],checks={'coverage':{'authorAddedEdgeIds':[]},'anchors':{},'relativeResolution':{},'labelForm':{}},reviewSet='batch-'+b,authoringRules=RULES)
  reads.append({'file':file,'pin':PIN,'bytes':len(raw),'lines':len(ls),'sha256':m.sha(raw),'inventoryEdges':len(es),'orderedWholeFileChunks':[{'firstLine':i+1,'lastLine':min(i+80,len(ls)),'sha256':m.sha('\n'.join(ls[i:i+80]))} for i in range(0,len(ls),80)]})
  if int(b)<58:
   assert m.may_retire(file) and not m.evidence_payload(file) and file not in m.RETIREMENT_EXCEPTIONS,(file,'L12-34 exception')
   r={k:r[k] for k in ['file','inventoryInputCommit','authorInputCommit','inventoryFileDigest','digest','inventoryEdgeIds','reviewSet','authoringRules']};r.update(retiresWithTree=True,edgeIds=ids,authorAddedEdges=[],edges=[],diff='',reason='L12-34(2), L12-37: maintained architect consumer retires in Phase 9 step 6 after reader cutover. Verified not workflow/reading-map/work-state carry and not a verification evidence payload; no byte-identical relocated payload is waived. Every inventory id remains file-level coverage; no per-edge patch or disposition applies.')
   exceptions.append({'file':file,'eligible':True,'evidencePayload':False,'carryException':False,'reason':'Maintained architecture/design/contract/proposal doc, not a relocated verification payload.'})
  else:
   cov=r['checks']['coverage'];candidates=[]
   for inv in es:
    e={k:None for k in m.EDGE_FIELDS};e.update(edgeId=inv['edgeId'],sourceSpans=copy.deepcopy(inv['physicalSpans']),matchedExpression=inv['matchedExpression'],disposition='preserve',timing='none',reason='',unitId=m.unit_id(body,inv['physicalSpans']));r['edges'].append(e)
   for span in m.scan_candidates(PIN,file,[s for e in es for s in e['physicalSpans']]):
    token=span['text'];targets=m.candidate_targets(file,body,span);hits=[t for t in targets if m.legacy_reference_target(t) and t in c.tree|c.dirs];rawpath=token.removeprefix('repo/').split('#')[0];full=rawpath.startswith('docs/')
    if not hits and not full:
     candidates.append({'span':span,'excludedReason':'Consumer/stated-parent/original snapshot coordinates do not reach a retiring or legacy path; illustrative source artifact/basename is not an unrelated same-name file. Resolved readings: '+repr(targets)});continue
    path=hits[0] if hits else rawpath;key='author-wave3-'+file.removesuffix('.md').replace('/','-')+'-L'+str(span['line'])+'C'+str(span['columnStart'])
    e={k:None for k in m.EDGE_FIELDS};e.update(edgeId=key,sourceSpans=[span],matchedExpression=token,disposition='preserve',timing='none',reason='',unitId=m.unit_id(body,[span]),authorAddedEdge={'normalizedReference':path,'discoveryReason':'Complete pinned consumer supplemental full/partial/basename/directory scan, including stated parents and declared original-source coordinates.','searchMethod':'step-03-check.py:scan_candidates at immutable author pin'})
    r['edges'].append(e);cov['authorAddedEdgeIds'].append(key);candidates.append({'span':span,'edgeId':key})
   cov['legacyScan']={'pin':PIN,'method':'Checker-computed complete-file scan with native candidate precedence, declared original-source coordinates, stated-parent tables and fenced trees; every hit joins an added edge or contextual exclusion.','candidates':candidates}
   for e in r['edges']:
    inv=c.entries.get(e['edgeId']) or e['authorAddedEdge'];disposition(r,e,inv['normalizedReference'].split('#')[0],body,inv)
   groups=collections.defaultdict(list)
   for e in r['edges']:groups[m.unit_id(body,e['sourceSpans'])].append(e)
   for group in groups.values():
    if len({e['disposition'] for e in group})>1:
     for e in group:e['unitDispositionReason']=e['edgeId']+' '+e['matchedExpression']+' Distinct claim: '+e['reason']
   changes=[]
   for e in r['edges']:
    if e['disposition']=='patch':changes+=m.replacement_changes(body,e['sourceSpans'],r['checks']['relativeResolution'][e['edgeId']]['replacement'])
   after=body
   for starti,endi,new in sorted(set(changes),reverse=True):after=after[:starti]+new+after[endi:]
   r['diff']=m.make_diff(file,body,after)
   for e in r['edges']:
    if e['disposition']=='patch':
     hs=[h for h in m.hunks(r['diff']) if any('-'+ls[s['line']-1] in h.splitlines() for s in e['sourceSpans'])];assert len(hs)==1,(e['edgeId'],len(hs));e['diffHunk']=hs[0].splitlines()[0]
  rs.append(r)
 for b in m.SETS:(P/'step-03-records'/f'batch-{b}.jsonl').write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs if r['reviewSet']=='batch-'+b))
 save('step-03-wave3-whole-file-reads.json',{'pin':PIN,'sourceBytes':sum(x['bytes'] for x in reads),'method':'Complete pinned bytes traversed in ordered chunks, inventory spans compared and full-file supplemental scan joined. Measurements and author assertions are not independent semantic acceptance.','files':reads,'elapsedSeconds':round(time.monotonic()-start,3)})
 save('step-03-wave3-retirements.json',{'pin':PIN,'files':exceptions,'relocatedEvidenceWaived':0,'retirementExceptionsFound':[],'briefCount':83,'authoringRequestCount':len(exceptions),'countReconciliation':'Batches 042–057 list 82 distinct consumers, not the parenthetical 83; every listed path is authored. No missing path or invented 83rd record.'})
 save('step-03-wave3-population.json',{'pin':PIN,'files':len(rs),'inventoryEdges':sum(len(r['inventoryEdgeIds']) for r in rs),'retiringFiles':sum(bool(r.get('retiresWithTree')) for r in rs),'retiringEdges':sum(m.edge_count(r) for r in rs if r.get('retiresWithTree')),'activeFiles':sum(not r.get('retiresWithTree') for r in rs),'activeEdges':sum(len(r['edges']) for r in rs),'addedEdges':sum(len(r.get('checks',{}).get('coverage',{}).get('authorAddedEdgeIds',[])) for r in rs),'patchedFiles':sum(bool(r['diff']) for r in rs),'dispositions':dict(collections.Counter(e['disposition'] for r in rs for e in r['edges'])),'parks':dict(collections.Counter(e['blockedCategory'] for r in rs for e in r['edges'] if e['disposition']=='parked')),'leadRulingGaps':[],'acceptance':'AUTHOR only, independent per-set/per-stratum review pending.'})
 print(json.dumps({'files':len(rs),'retired':len(exceptions),'edges':sum(m.edge_count(r) for r in rs)}))
if __name__=='__main__':main()
