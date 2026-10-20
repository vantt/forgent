#!/usr/bin/env python3
"""Author only the assigned new records; no consumer, checker or prior artifact writes."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,types,tempfile,json,copy,re,collections,posixpath
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('w',P/'step-03-wave5b-author.py');w=importlib.util.module_from_spec(sp);sp.loader.exec_module(w)
m=w.m;a=w.a;PIN=w.PIN;c=w.c
original_path=pathlib.Path
m.resolver.pathlib=types.SimpleNamespace(Path=lambda x:original_path('/tmp/fgos-work/wave5g/anchor-cache' if str(x)=='/tmp/fgos-work/step03-anchor-cache' else x))
original_tmp=tempfile.TemporaryDirectory
def scoped_tmp(*args,**kwargs):
 if str(kwargs.get('dir'))=='/tmp/fgos-work':kwargs['dir']='/tmp/fgos-work/wave5g'
 return original_tmp(*args,**kwargs)
m.tempfile.TemporaryDirectory=scoped_tmp

def save(n,o):(P/n).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def preserve(r,e,path,body,why):
 if m.carriage_declaration(body,e['sourceSpans'][0]['line']):a.a.preserve(r,e,path,body,'');return
 w.w.preserve(r,e,path,body,why)
 known={'docs/specs/work-state.md':'docs/platform/work-state/spec.md','docs/specs/runner.md':'docs/platform/runner/spec.md','docs/specs/confinement-authority.md':'docs/platform/agent-confinement/spec.md','docs/specs/distillery.md':'docs/platform/distillery/spec.md','docs/specs/distribution.md':'docs/platform/packaging-distribution/spec.md','docs/specs/reading-map.md':'docs/reading-map.md','docs/specs/observe.md':'docs/platform/observe/spec.md'}
 holder=known.get(re.sub(r':\d+(?:[-–]\d+)?$','',path))
 if holder and holder!=r['file'] and ('Non-executable successor note: '+holder) not in e['reason']:e['reason']+=' Non-executable successor note: '+holder+'.'
 # Never describe retained root files as retiring via docs/architect prefix collision.
 if not path.startswith(('docs/specs/','docs/architect/')):e['reason']=e['reason'].replace('; tree retires at Phase 9','')
 # Alias notes cannot point to the consumer itself.
 for note in m.successor_notes(e['reason']):
  if m.path_identity(note) in {m.path_identity(r['file']),m.path_identity(path)}:e['reason']=e['reason'].replace(' Non-executable successor note: '+note,'')
def park(r,e,path,body,why,category='description-rewrite'):
 a.park(r,e,path,body,why,category)
def patch(r,e,path,body,target,hint=None,assessment='',nums=None):
 hs=[h for h in m.heading_sections(PIN,target) if hint and hint.casefold() in h['sample'].casefold()]
 h=max(hs,key=lambda h:h['level']) if hs else None
 assert not hint or h,(e['edgeId'],target,hint)
 a.anchored_patch(r,e,path,body,target,h['anchor'] if h else None,nums=nums,assessment=assessment)
 correspondences={'maps-j-07614':('ADR-0005','0005 — Runner & cô lập worker','The source ADR-prefixed identifier and Vietnamese title identify the exact 0005 heading; the prefix is a citation convention, not a separate decision.'),'maps-j-07732':('curated capability catalog','The curated `runner.capabilities` catalog','The source quoted catalog label names this explicit runner.capabilities catalog heading and its declared-name/alias validation. RUL11 is the local enclosing rule, not a locator attributed to the external reference.'),'maps-j-07807':('Cửa pull giao–nhận việc','7. Pull Door Take And Return','The source Vietnamese pull-door title and target English heading refer to the same take/return section; pinned content verifies same frontier, clean-tree/advanced-HEAD/verify, claim ownership and head markers.')}
 if e['edgeId'] in correspondences:
  old_locator,new_locator,why=correspondences[e['edgeId']];proof=r['checks']['anchors'][e['edgeId']]
  proof['sourceLocatorTokens']=[old_locator];proof['locatorCorrespondence']={'source':old_locator,'target':new_locator,'reason':why};proof['locatorScopeReason']=why
 # L12-51(5): one physical link, update the root-path label and relative destination.
 old=e['matchedExpression'];mat=re.fullmatch(r'(!?)\[([^\]]+)\]\(([^)]+)\)',old,re.S)
 if mat and mat[2].strip('`').startswith('docs/') and m.normalize(r['file'],mat[3])==mat[2].strip('`').split('#')[0]:
  dest=m.form(old,r['file'],target,e['anchor']);newlabel=target+('#'+e['anchor'] if e['anchor'] else '')
  if mat[2].startswith('`'):newlabel='`'+newlabel+'`'
  r['checks']['relativeResolution'][e['edgeId']]['replacement']=mat[1]+'['+newlabel+']('+re.fullmatch(r'!?\[[^\]]+\]\(([^)]+)\)',dest,re.S)[1]+')'

def row(r,e,body,why):
 e.update(disposition='phase9-row-flip',timing='Phase 9',reason='L12-35(2): whole migration-state row flip at Phase 9. '+why,dependency='Phase 9 authority cutover after conservation, independent review and accepted map/owner parity; no early edit.')

def disposition(r,e,path,body):
 n=e['sourceSpans'][0]['line'];line=body.splitlines()[n-1];key=e['edgeId'];context=m.adjacent_passage(body,e['sourceSpans']);file=r['file'];decl=m.carriage_declaration(body,n)
 if key=='maps-j-07786':
  park(r,e,path,body,'Lead ruling: wrapper Related is under the H1 source-carriage declaration, while the Related predicate still treats the metadata bullet as navigation. Decide the boundary before giving this edge an executable or preserved outcome; inside literal carriage (L12-26(5)); declaration: '+decl[1],'lead-ruling');return
 if decl:preserve(r,e,path,body,'');return
 if m.unit_id(body,e['sourceSpans']).startswith('canonical-'):
  row(r,e,body,'Replace the complete candidate/current-source owner and status claim for '+path+' with the reviewed post-cutover owner. Retain source lineage separately; candidate metadata does not itself certify truth.');return
 if 'Provenance:' in line or re.match(r'^\*\*Source:\*\*|^Source:',line):
  preserve(r,e,path,body,'L12-47: original Source/Provenance spelling and its import lineage remain literal; this is separate from Related navigation.');return
 # Legacy-source footer is still navigation in Related; a self/duplicate destination cannot execute.
 related=m.related_header(body,n) or ('Legacy source:' in e['matchedExpression']) or (n>1100 and file=='docs/platform/work-state/spec.md' and path=='docs/specs/work-state.md')
 if related and path.startswith(('docs/specs/','docs/architect/')):
  holder={'docs/specs/work-state.md':'docs/platform/work-state/spec.md','docs/specs/runner.md':'docs/platform/runner/spec.md','docs/specs/observe.md':'docs/platform/observe/spec.md','docs/specs/system-overview.md':'docs/platform/system-overview/spec.md','docs/specs/distribution.md':'docs/platform/packaging-distribution/spec.md'}.get(path)
  if holder:
   if holder==file or holder in body or 'Legacy source:' in e['matchedExpression']:
    park(r,e,path,body,'Description needs rewrite (L12-34(4), L12-40(2)): this Related/Legacy-source item names '+path+'; its live holder '+holder+' is '+('this consumer itself' if holder==file else 'already represented by candidate navigation or explicitly labelled as the legacy source')+'. Consolidate the complete duplicate/source-labelled navigation item at cutover; preserve the separate original Provenance line.');return
   patch(r,e,path,body,holder,assessment='Whole-area Related navigation names the same '+path.rsplit('/',1)[-1]+' subject; the target spec is its exact live area owner. No section, runtime default or count is asserted.');return
  aliases={x['entry'].get('currentPath') for x in m.resolver.aliases(PIN,path)}-{None}
  if len(aliases)==1:
   holder=next(iter(aliases))
   park(r,e,path,body,'Description needs rewrite (L12-34(4)): Related names the legacy source '+path+'; its mapped holder '+holder+' is the consumer or a source conservation carrier. Consolidate source lineage and live related reading before redirecting this legacy-source item.');return
 if key in ('maps-j-07582','maps-j-07583'):
  preserve(r,e,path,body,'L12-38, L12-51(3): the dated past-event entry '+('“2026-10-16 — Hai cách khởi động”' if key.endswith('582') else '“2026-10-18 — Controller chết”')+' records the original runner decision source for the supervisor replacement/adopt/resume design. Preserve original source identity as dated decision evidence, separate from the live decision-table read.');return
 if key=='maps-j-07585':
  park(r,e,path,body,'Phase 9 carry: this live runner-decision table entry concerns the Rust Run Supervisor replacement and explicit resume/adopt policy recorded 2026-10-16/18 in this spec. The candidate runner decision collection carries the earlier detached-run-supervisor vocabulary account, not the full newer supervisor/adopt/resume decision. Carry and bind that exact runner decision before redirecting this live reading pointer; a whole-area spec link would lose the decision subject.','phase9-carry');return
 if file=='docs/platform/runner/decisions/h-36d872fbb0e5.md' and path.startswith('docs/decisions/') and any(m.path_identity(h)==file for h in m.removed_decision_holders(PIN,e,path)):
  park(r,e,path,body,'Lead ruling: this original deleted-decision identity is inside the actual “Các ADR dưới đây được di dời nguyên văn” history account. The computed narrative holder is a section of this same consumer: preserve requires that successor note, while successor-not-self rejects it. Decide how record-only intra-document narrative correspondence should be expressed without an executable self pointer.','lead-ruling');return
 if key=='maps-j-07724':
  target='docs/knowledge/why-the-iron-law-evidence-contract-gathers-proof-but-never-a/iron-law-evidence-contract-stays-human-gated.md'
  patch(r,e,path,body,target,'Why evidence-only',assessment='The exact cited condition is a second independent party actually looking at safety evidence (target lines 45–48), and not agent self-acknowledgement. RUL37 explicitly supersedes the older who-types procedure locally; this citation preserves only the independent human decision condition, not the older target sentence requiring the human to type.',nums=[33,44,45,46,47,48]);return
 if key=='maps-j-07725':
  park(r,e,path,body,'Description needs rewrite: RUL64 attributes an explicit never-touch-Iron-Law config boundary to gate-bypass-design.md. Its renamed knowledge holder describes a hard-gate floor and reuse of HEAVY_KEYWORDS for another purpose, but does not state this specific ironLaw.level-versus-gateBypass configuration prohibition. Rewrite the complete attribution against the actual config decision before redirecting.');return
 if key=='maps-j-07732':
  patch(r,e,path,body,'docs/knowledge/forgentx-repo-s-tool-registry-configuration/forgentx-tool-registry-configuration.md','The curated',assessment='The catalog section explicitly defines runner.capabilities entries and aliases, shared validation for capability/for, and rejection of undeclared names. That is the precise curated-catalog claim cited here. The source documents its own for-array/for.includes evolution, without asserting that the reference defines that algorithm.',nums=[48,50,51,54,55,56,60,61,62]);return
 if line.startswith('> Added in candidate:'):
  preserve(r,e,path,body,'L12-40, L12-51(1): original conservation/correction evidence under the explicit “Added in candidate: Metadata and map-based placement scaffolding” framing, with source line coordinates and prior review provenance. Preserve the source locator; it is not current navigation.');return
 if file=='docs/platform/runner/architecture/h-7af1f0242611.md' and n>27 and path.startswith('docs/specs/'):
  park(r,e,path,body,'Description needs rewrite: the dispatch vocabulary row embeds a historical runner.md line-number coordinate for its ADR/definition. Reconcile the exact named definition and old line span with its current candidate decision/vocabulary holder; a file redirect would preserve a stale locator. This is the same fourteen vocabulary-coordinate park class retained by L12-32(6), not a missing-area claim.');return
 if file=='docs/platform/runner/decisions/h-aabefc85f0c9.md' and n>=25:
  preserve(r,e,path,body,'L12-35(3), L12-38: the actual heading “CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)” frames this former schema/runtime account as retirement history. Preserve that original source identity; do not revive the retired session engine.');return
 if key in ('maps-j-07593',):
  preserve(r,e,path,body,'L12-38: explicit dated retirement marker “removed in 2180b4e72; this slice describes the retired engine” frames the original CoordinationSession quorum/retry/cancellation source. This is a former-engine account, not a current contract redirect. Non-executable successor note: docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md.');return
 if key in ('maps-j-07591','maps-j-07612'):
  target='docs/platform/agent-confinement/spec.md'
  patch(r,e,path,body,target,'9.2',assessment='Section 9.2 explicitly defines opt-in hostRead blind, masked peer run roots/socket/private homes, isolated process view, own round plus outbox, per-role byte/SHA-256 input copying, unit.json inputMap and fail-closed refusal. It matches the complete adjacent blind-role/handoff claim and its default-off boundary.',nums=[454,456,458,459,462,464,467,468,478,481,486,499,500,501,502]);return
 if key=='maps-j-07592':
  park(r,e,path,body,'Description needs rewrite: the complete dispatch-policy paragraph directs the reader to “Từ vựng dispatch hiện hành” above, but the candidate split placed that vocabulary in architecture/h-7af1f0242611.md, outside this consumer. The live dispatch-control-plane.md is the correct external invariant holder, yet changing only its path would leave that explicit sibling locator false. Rewrite the whole adjacent local-vocabulary/external-control-plane reference together before redirecting.');return
 if key in ('maps-j-07596','maps-j-07597'):
  park(r,e,path,body,'Description needs rewrite: this complete Work-boundary paragraph couples the retired CoordinationSession engine, its old read-only standalone proof and deferred mutation stop gate with current Work authority. The live work-integration.md preserves the Work-verb boundary but explicitly replaces stage with workflowStep; ADR-010 survives only under retired-engine history. Reconcile the entire old-engine/proof/current-authority paragraph before redirecting its grouped references.');return
 if key=='maps-j-07611':
  patch(r,e,path,body,'docs/platform/work-state/spec.md','3. Work Item Data Dictionary',assessment='The handoff table directs backlog-creating skills to the Work schema, while its separate verb/output cells retain one-door add and no direct event writes. The candidate Data Dictionary owns the complete Work record shape, not a new write channel.');return
 if key=='maps-j-07614':
  target='docs/platform/runner/decisions/h-36d872fbb0e5.md'
  patch(r,e,path,body,target,'0005 —',assessment='The exact 0005 Runner and worker-isolation ADR contains D3 prompt/verify/untrusted proposal discipline and D4 isolated disposable branch plus independent approval. Those two clauses span its Decision subsection; the citation identifies that titled ADR as a whole alongside the retained L4 law.',nums=[30,44,46,51,55]);return
 if key in ('maps-j-07728','maps-j-07729'):
  if key=='maps-j-07729':
   preserve(r,e,path,body,'L12-35(3), L12-40: the sentence labels this the re-scope rationale and evidence of the dated 2026-09-06 RUL40 change, with explicit old superseded chrome-only wording. Preserve that original investigation identity; its candidate is source conservation, not executable authority. Non-executable successor note: docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md.');return
  target='docs/platform/agent-coordination/decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md'
  patch(r,e,path,body,target,assessment='This RUL40 paragraph attributes the lifecycle/receipt/liveness rule to ADR-011: result file wins over transport status, herdr is transport/failure detector, unknown does not become absent, and pane closure differs by outcome. Those claims span Decision and Consequences, so the complete titled ADR is the subject. The separate re-scope investigation remains historical evidence, and local four-pane cockpit details are not claims newly assigned to this ADR.');return
 if key=='maps-j-07731':
  park(r,e,path,body,'Step 5 parity: source links credential provisioning/private homes/accounts and doctor confined-pane-accounts to old §13.1. That exact provisioning section has moved to history while candidate confinement/spec.md keeps a pointer and settled facts. Trace the active provisioning/config/doctor consumers and carry the full §13.1 content before revising this operational recipe; no citation-only redirect to a historical appendix.','step5-parity');return
 if key=='maps-j-07733':
  preserve(r,e,path,body,'L12-35(3), L12-51(3): the parenthetical “already said” records the original confinement rule used as evidence for the dated RUL77 supersession; its first clause is expressly ĐÃ BỊ THAY by RUL90/0062 and later paragraphs record the 0061 follow-up. Preserve this original past-source spelling rather than infer current raw execute support. Non-executable successor note: docs/platform/agent-confinement/spec.md.');return
 if key=='maps-j-07747':
  park(r,e,path,body,'Description needs rewrite: this implementation pointer describes scripts/install-git-hooks.mjs via package prepare and npm dependency installs lacking git. The promoted packaging owner uses staged Rust host activation/setup/doctor; reconcile the complete historical prepare-versus-current-install claim and its live script owner before redirecting the distribution citation.');return
 if key=='maps-j-07877':
  row(r,e,body,'The table row calls the retained root platform-foundations.md the Legacy full law source. At cutover its path stays unchanged and its role is the authoritative locked L1–L10 law text; replace that whole row role/status, not the retained link.');return
 if path=='docs/specs/herdr-web-dashboard.md' and file.startswith('docs/platform/ui-spec/'):
  target='docs/platform/herdr-web-dashboard/spec.md'
  hints={'07821':('View the taskboard','The target taskboard operation specifies a board rather than a flat table, status grouping/coloured state and quick actions without opening each item, exactly the item-card rationale.'),'07822':('Retire a work item','The operation explicitly states no delete operation and append-only history, and requires retirement wording so a user is not promised erasure.'),'07825':('Answer a parked question','The target specifies answer in place, via the gateway one-door answer verb, explicitly refusing to send the person to a terminal; the modal repeats that contract.'),'07828':('Approve a merge','The operation specifies approve as the only dashboard operation changing trunk; the modal confirmation protects that same consequence and R8 exposure.'),'07831':('Behaviors & Operations','The combined modal invokes Add a work item and Edit a work item, two sibling operations. Both create/edit through the existing verb and use the same lifecycle validation; their nearest common parent is Behaviors & Operations.'),'07834':('Sign in','The target sign-in operation establishes a browser session before landing on the taskboard; R3 explicitly forbids anonymous reads. The screen asks for the same single machine token, without adding an identity channel.'),'07837':('View the taskboard','The target taskboard is the landing board after sign-in, explicitly grouped by status, with quick actions, filters/regroup controls and the Monday.com/ClickUp reference. These are the complete adjacent board claims.'),'07841':("View a task's detail",'The target explicitly calls task detail the core deliverable and says the taskboard exists mainly to reach it; the source repeats exactly that relationship.'),'07846':('Data Dictionary','The target questions-needing-answer entry explicitly covers both ask and gate-approve questions; this screen shows the same union and no new question channel.'),'07855':('Business Rules','The target has the complete R1–R11 business-rule set. Source UI frontmatter/VR-RULE-DRIFT describes its own mapping checker, while the product-rule ownership belongs to this exact target section.'),'07858':('Edge Cases Settled','The target item-never-parked case expressly says the empty question/answer timeline is normal. The source ST-NEVER-PARKED catalogue repeats that exact settled case.')}
  short=key.removeprefix('maps-j-')
  if short in ('07869','07847'):
   patch(r,e,path,body,target,assessment='The UI overview attributes product behavior and open gaps to the complete dashboard area spec; all surfaces/rules trace to that complete product owner. This is whole-spec ownership, no single subsection or new implementation claim.');return
  assert short in hints,(key,context)
  hint,assessment=hints[short]
  # Bind complete operation lines, not only its heading.
  h=max((h for h in m.heading_sections(PIN,target) if hint.casefold() in h['sample'].casefold()),key=lambda h:h['level'])
  tl=m.blob(PIN,target).decode().splitlines();nums=[h['startLine']]
  nums += [i for i in range(h['startLine']+1,min(h['sectionEndLine'],h['startLine']+36)+1) if tl[i-1].strip() and not tl[i-1].startswith('#')][:15]
  patch(r,e,path,body,target,hint,assessment,nums=nums);return
 if key=='maps-j-07814':
  patch(r,e,path,body,'docs/reading-map.md',assessment='L12-21: the exact operative first-read map is the retained root docs/reading-map.md. The remaining terminal-control spec/contracts/measurement pointers are separate retained inputs, unchanged by this map redirect.');return
 if key=='maps-j-07815':
  park(r,e,path,body,'Step 5 parity: the DoD instruction prescribes writing repo-wide decisions into docs/decisions/, whose numbered corpus is removed and surviving index is a generated projection. Trace the actual decision capture/writer and narrative ownership before rewriting the complete learning destination, never invent a directory write alias.','step5-parity');return
 if key=='maps-j-07806':
  target='docs/platform/runner/operations/h-51f5cd7279fd.md';hint='Cổng duyệt PR nội bộ'
  h=max((h for h in m.heading_sections(PIN,target) if hint in h['sample']),key=lambda h:h['level']);tl=m.blob(PIN,target).decode().splitlines()
  nums=[h['startLine']]+[i for i in range(h['startLine']+1,h['sectionEndLine']+1) if any(x in tl[i-1] for x in ('review <id>','approve <id>','reject <id>','verify-fail','awaiting-approval → blocked'))][:10]
  patch(r,e,path,body,target,hint,'The complete approval-gate operation covers review diff, approve merge-or-verify and reject without revert for runner/pull/legacy sources. Its failure branch records blocked with a reason, matching this source cross-area gate summary; all three verbs belong to this operation, not Actors & Access.',nums);return
 if key in ('maps-j-07807','maps-j-07808'):
  target='docs/platform/work-state/spec.md' if key.endswith('807') else 'docs/platform/runner/spec.md';hint='7. Pull Door' if key.endswith('807') else None
  patch(r,e,path,body,target,hint,'The work-state Pull Door section defines same-frontier take, clean tree plus advanced HEAD plus real verification on return, and durable headAtTake/headAtReturn metadata. Runner supplies startup recovery that respects this externally owned claim. These separate owner citations jointly explain one pull-door range; no new lifecycle or approval actor is introduced.');return
 if key=='maps-j-07809':
  patch(r,e,path,body,'docs/platform/distillery/spec.md','Purpose','The target Purpose explicitly limits this spec to porting lifecycle and excludes source discovery, cross-source comparison and candidate ranking. This agrees with every capability in the adjacent source scope sentence.');return
 if file.startswith('docs/platform/system-architecture/') and path.startswith('docs/architect/'):
  if '/history/' in file:
   if m.related_header(body,n):
    park(r,e,path,body,'Description needs rewrite (L12-34(4)): wrapper Related points to the retired architect portal, whose surviving mapped copy is this same history consumer. Remove/consolidate this self-related source item while retaining its separate provenance; source-carriage links below remain literal.');return
   preserve(r,e,path,body,'L12-38: explicit history/source-carriage evidence preserves original architect source identity.');return
  mirrors={
   'docs/architect/architecture-intent.md':'docs/platform/system-architecture/architecture/architecture-intent.md',
   'docs/architect/system-vision-trong-mem-ngoai-cung.md':'docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md',
   'docs/architect/workspace-topology.md':'docs/platform/system-architecture/architecture/workspace-topology.md',
   'docs/architect/workspace-topology-audit.md':'docs/platform/system-architecture/architecture/workspace-topology-audit.md'}
  target=mirrors.get(path)
  if target:
   if target==file:
    park(r,e,path,body,'Description needs rewrite (L12-34(4), L12-40(2)): metadata Related names the source whose promoted owner is this consumer itself. Remove/consolidate this self-related item, keeping original Provenance and cutover metadata as separate source units.');return
   park(r,e,path,body,'Phase 9 carry: Related names the complete system vision, but its exact candidate '+target+' is a whole-source Architecture carrier (Purpose Preserve the complete; Writer type Agent carriage). It is not an executable live target under L12-30(3). Establish the accepted live vision holder before redirecting this Related pointer.','phase9-carry');return
  mirror=path.replace('docs/architect/','docs/platform/',1)
  if mirror in c.tree:
   tb=m.blob(PIN,mirror).decode()
   if m.resolver.carriage(tb,1,mirror):
    park(r,e,path,body,'Phase 9 carry: this live Related/evidence item names '+path+'; exact candidate mirror '+mirror+' is explicitly history/source conservation, not live authority. Carry/accept the complete '+path.rsplit('/',1)[-1]+' subject into a live holder before redirecting; do not turn the old architecture intent into a current retired-engine claim.','phase9-carry');return
   patch(r,e,path,body,mirror,assessment='The source names the complete '+path.rsplit('/',1)[-1]+' artifact as related/evidence reading. The exact same-path candidate preserves that complete artifact subject and its original design limits; no narrower rule or new runtime claim is attributed.');return
  park(r,e,path,body,'Phase 9 carry: the architecture intent names '+path+' as live Related/evidence reading. The current candidate split retains old coordination plans/contracts through retired-engine history, not an accepted current authority for this whole subject. Resolve that exact architecture/design intent into a live holder before redirecting; keep its evidence role separate from current runtime claims.','phase9-carry');return
 if path=='docs/specs/platform-foundations.md':
  park(r,e,path,body,'P8-DOC-GAP-02: this area-spec/decision citation names the full platform-foundations spec narrative, not the retained root L1–L10 law text. The complete content must be carried to an accepted live holder before the retiring spec is redirected or deleted.','GAP-02');return
 if path=='docs/specs/workflow.md':
  park(r,e,path,body,'Workflow carry: the complete workflow spec must be carried into the candidate tree under L12-27 before redirecting this citation. Carry must re-resolve all source-coordinate links; no invented candidate destination.','workflow-carry');return
 if path in ('docs/specs/enduser-docs-authoring.md','docs/specs/enduser-docs-index.md'):
  park(r,e,path,body,'P8-DOC-GAP-02: complete '+path.rsplit('/',1)[-1]+' source must be carried before the retiring spec is deleted. No accepted candidate owner carries that full write-side/read-side contract; do not invent a destination or waive capture/linkage conservation.','GAP-02');return
 if file=='docs/platform/system-overview/spec.md' and path=='docs/specs/fgos-plugin.md':
  park(r,e,path,body,'Description needs rewrite: the area-map bullet asserts 12 verb wrappers, including the old plugin shape. Candidate claude-plugin/spec.md explicitly marks unshipped check behavior; reconcile this whole count/list/shipped-state claim before redirecting to that owner.');return
 if file=='docs/platform/system-overview/spec.md' and path=='docs/specs/distribution.md':
  park(r,e,path,body,'Description needs rewrite: this area-map bullet defines distribution as npm install via GitHub. The promoted packaging-distribution owner covers Rust-host release staging/activation, setup/doctor and Node compatibility. Rewrite the complete installation/ownership description instead of endorsing an obsolete npm-only scope with a path substitution.');return
 if file=='docs/platform/system-overview/spec.md' and path=='docs/specs/decision-citation-drift.md':
  patch(r,e,path,body,'docs/platform/decision-citation-drift/spec.md','Spec: Decision','The target Purpose defines detection of superseded decision citations in backlog/spec prose, with no automatic rewrite; the source area-map gloss states precisely that detect-only subject. Default-root behavior stays with Step 5, not changed here.');return
 if file=='docs/platform/system-overview/spec.md' and e.get('authorAddedEdge') and path in ('docs/specs/work-state.md','docs/specs/runner.md','docs/specs/distillery.md'):
  target={'docs/specs/work-state.md':'docs/platform/work-state/spec.md','docs/specs/runner.md':'docs/platform/runner/spec.md','docs/specs/distillery.md':'docs/platform/distillery/spec.md'}[path]
  patch(r,e,path,body,target,assessment='The complete area-map bullet names this component and its observable scope, without a subsection locator. The live target spec owns that entire same component; original bare basename resolves from the old spec source coordinates, and its replacement keeps consumer-relative link form.');return
 if key in ('maps-j-07895','maps-j-07896','maps-j-07897'):
  park(r,e,path,body,'Step 5 parity: the complete test/checker-scope statement asserts npm test does not read docs/specs/*.md while check-decision-citation-drift scans docs/specs separately. Trace actual test/default-root/checker consumers and revise this whole sentence together; a path-only replacement cannot prove those runtime claims.','step5-parity');return
 if key in ('maps-j-07903','maps-j-07907'):
  park(r,e,path,body,'P8-DOC-GAP-02: full title-matched 0014 human/fgOS interaction architecture narrative remains in retiring specs/platform-foundations.md; the knowledge explanation is an implementation account, not the complete locked decision. Carry the full architecture narrative before redirecting this citation.','GAP-02');return
 if key=='maps-j-07908':
  patch(r,e,path,body,'docs/platform/work-state/decisions/retired-decision-history.md','7. ADR 0011',assessment='The titled 0011 decision explicitly assigns every contract a <name>/v<N> token and separates compatibility from implementation. This source calls it the version decision; the adjacent 0014 architecture and runtime-envelope references have their own distinct blockers.');return
 if key in ('maps-j-07904','maps-j-07905'):
  target='docs/platform/work-state/spec.md' if path.endswith('work-state.md') else 'docs/platform/runner/spec.md'
  patch(r,e,path,body,target,assessment='The introductory sentence excludes implementation detail already documented in the complete work-state and runner area specs. The target owns that same whole-area detail; the three str46 slices are historical source authorship, not a target count or claim that 0014 is carried.');return
 if key=='maps-j-07909':
  park(r,e,path,body,'Description needs rewrite: the reference bundles §envelope, §Sổ verb máy-đọc and §Danh tính người ghi under work-state.md, but those full input/output details are now this consumer cli-io-contract.md itself (sections 2, 3 and 7). A redirect would create a self pointer; rewrite the complete references unit using local section links and exact ownership.');return
 if key=='maps-j-07910':
  patch(r,e,path,body,'docs/platform/runner/subcomponents/h-6979005beaf7/spec.md','Business Rules',assessment='Pinned RUL61 specifies the stdout runner envelope: one raw pure-JSON line per action, reserved stdout, diagnostics on stderr and no second CLI envelope. This is the complete runner-stdout claim attributed by this reference.',nums=[next(i for i,l in enumerate(m.blob(PIN,'docs/platform/runner/subcomponents/h-6979005beaf7/spec.md').decode().splitlines(),1) if '**RUL61' in l)]);return
 if key=='maps-j-07949':
  preserve(r,e,path,body,'L12-41(3), L12-31(8): explicit completed-action marker “Đã đóng” / “từng liệt ở đây, nay đã sửa” records the original store-atomic-rmw evidence directory. Preserve the same disposition as 08351; this is not a current reading pointer.');return
 if m.history_scope(file,body,n) or (m.captured_evidence_at(body,n) and not m.related_header(body,n)):
  preserve(r,e,path,body,'L12-38, L12-40: original history/captured identity, framed by '+repr(context)+'. No current-authority endorsement.');return
 if not path.startswith(('docs/specs/','docs/architect/')):
  preserve(r,e,path,body,'L12-26: surviving retained-root/native citation or explicitly illustrative source convention stays literal. Actual complete source unit: '+repr(context));return
 raise AssertionError(('unresolved',file,key,path,n,context))

def build(batch):
 m.SETS=(batch,);rs=[];reads=[]
 for file,b in m.population().items():
  raw=m.blob(PIN,file);old=m.blob(m.INVENTORY,file);assert raw==old;body=raw.decode();ls=body.splitlines();invs=[e for e in c.entries.values() if e['consumerPath']==file]
  r=dict(file=file,inventoryInputCommit=m.INVENTORY,authorInputCommit=PIN,inventoryFileDigest=m.sha(old),digest=m.sha(raw),inventoryEdgeIds=[e['edgeId'] for e in invs],diff='',edges=[],checks={'coverage':{'authorAddedEdgeIds':[]},'anchors':{},'relativeResolution':{},'labelForm':{}},reviewSet='batch-'+b,authoringRules=['A51','L12-21..L12-51; full digest including Source provenance L12-47 and whole-link L12-51(5)'])
  for inv in invs:
   e={k:None for k in m.EDGE_FIELDS};e.update(edgeId=inv['edgeId'],sourceSpans=copy.deepcopy(inv['physicalSpans']),matchedExpression=inv['matchedExpression'],disposition='preserve',timing='none',reason='',unitId=m.unit_id(body,inv['physicalSpans']));r['edges'].append(e)
  cov=r['checks']['coverage'];candidates=[]
  for span in m.scan_candidates(PIN,file,[s for e in invs for s in e['physicalSpans']]):
   exempt=m.coverage_exemption(file,body,span);token=span['text'];link=re.fullmatch(r'!?\[[^\]]+\]\(([^)]+)\)',token);rawpath=(link[1] if link else token).split('#')[0];origin=m.relative_decision_origin(PIN,file,rawpath);targets=m.candidate_targets(file,body,span);hits=[t for t in targets if m.legacy_reference_target(t) and t in c.tree|c.dirs]
   if exempt or (not origin and not hits and not rawpath.removeprefix('repo/').startswith('docs/')):
    candidates.append({'span':span,'excludedReason':exempt or 'Actual consumer/stated-parent coordinates do not resolve to a retiring legacy document. Candidate-native/code/artifact referents are not unrelated legacy basename matches. Resolved readings '+repr(targets)});continue
   path=origin or (hits[0] if hits else rawpath.removeprefix('repo/'));key='author-wave5g-'+file.removesuffix('.md').replace('/','-')+'-L'+str(span['line'])+'C'+str(span['columnStart'])
   e={k:None for k in m.EDGE_FIELDS};e.update(edgeId=key,sourceSpans=[span],matchedExpression=token,disposition='preserve',timing='none',reason='',unitId=m.unit_id(body,[span]),authorAddedEdge={'normalizedReference':path,'discoveryReason':'Complete immutable source traversal plus supplemental literal/link/stated-parent and original-source coordinates.','searchMethod':'Unchanged step-03-check.py scan_candidates/candidate_targets at fixed author pin'});r['edges'].append(e);cov['authorAddedEdgeIds'].append(key);candidates.append({'span':span,'edgeId':key})
  cov['legacyScan']={'pin':PIN,'method':'Full immutable source traversal and unchanged complete-file full/partial/basename/directory/link scan; every legacy reading joins an edge or a source-bound contextual exclusion.','candidates':candidates}
  for e in r['edges']:disposition(r,e,w.w.path_for(e),body)
  w.finish(r,body)
  fs=c.check_record(r)
  if fs:print(json.dumps({'file':file,'failures':fs,'edgeCount':len(r['edges'])},ensure_ascii=False),flush=True)
  rs.append(r);reads.append({'file':file,'pin':PIN,'bytes':len(raw),'lines':len(ls),'sha256':m.sha(raw),'inventoryEdges':len(invs),'orderedWholeFileChunks':[{'firstLine':i+1,'lastLine':min(i+80,len(ls)),'sha256':m.sha('\n'.join(ls[i:i+80]))} for i in range(0,len(ls),80)]})
 (P/'step-03-records'/f'batch-{batch}.jsonl').write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs))
 save('step-03-wave5g-reads-'+batch+'.json',{'pin':PIN,'files':reads,'method':'Full pinned source-byte traversal, exact inventory spans, supplemental scan and per-edge context assessment. Author traversal is not independent review.'})
 print(json.dumps({'completed':batch,'files':len(rs),'edges':sum(len(r['edges']) for r in rs)}),flush=True)
 return rs
if __name__=='__main__':build(sys.argv[1])
