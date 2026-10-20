#!/usr/bin/env python3
"""Pinned wave-5a authoring: batches 079–082, records not consumer edits."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,re,copy,collections,time,posixpath
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('a3',P/'step-03-wave3-author.py');a3=importlib.util.module_from_spec(sp);sp.loader.exec_module(a3)
m=a3.m;PIN=a3.PIN;SETS=('079','080','081','082');m.SETS=SETS;c=m.Checker(PIN);a3.c=c;a3.a.c=c

def save(name,o):(P/name).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def path_for(e):return (c.entries.get(e['edgeId']) or e['authorAddedEdge'])['normalizedReference'].split('#')[0]
def preserve(r,e,path,body,why):
 state=a3.facts(e,path)
 e['reason']='A51, L12-26, L12-38: '+state.replace(' Decision narrative resolution remains generator-owned.','')+' '+why
 for holder in sorted(set(m.removed_decision_holders(PIN,e,path))|{a['entry']['currentPath'] for a in m.resolver.aliases(PIN,path) if a['entry'].get('currentPath') and a['entry']['currentPath']!=r['file'] and a['entry']['currentPath']!=path}):
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
 '04846':(None,'Target introduction names exactly the two tsk-64h/tsk-2t5 delivered-but-unmerged cases and the complete recovery guide. Source cites that incident artifact, not a new status-write recipe.'),
 '04847':(None,'The entire guide is the recovery playbook for delivered-but-unmerged work; the source Related gloss names exactly that incident class, not the section-specific fix algorithm.'),
 '04848':(None,'The complete explanation covers the root-vs-main drift window and sync-root action. Related explicitly distinguishes that branch-tree drift from manually marking an unmerged item delivered, agreeing with the target introduction and incident.'),
 '04857':('What it does','Target explicitly unwires owned git hooks and only reports the shell-rc line. This is exactly the two-part shipped wiring reversal attributed to child tsk-4iv-1; package removal remains a separate child in the source.'),
 '04858':(None,'Target complete spike documents the npm/Linux/macOS real self-removal experiment, explicitly leaves pnpm/yarn/Windows unproven, and separately records the follow-up false-success guard. Source describes the spike outcome and its deliberately narrow scope, not a claim that the subsequent guard has not shipped.'),
 '04868':(None,'The complete Gate-bypass config reference documents config level, CLI, coverage, completeness and gate wiring: exactly the mechanism shape this introductory pointer contrasts with design rationale. No particular old gate count is asserted by this pointer.'),
 '04876':(None,'This citation identifies the complete worker-slot occupancy feature after tsk-2sj. The target defines that engine-owned occupancy and its post-merge review history; source three herdr guard defects belong to the separate local explanation, not a claimed target defect count.'),
 '04884':(None,'The entire lifecycle explanation traces creation of coding-classify-intake, the deferred consumer removal tsk-4ns and deletion tsk-49u. Source expressly directs the reader to that full follow-on story; no current classifier existence is asserted.'),
 '04885':('Why this is rejected','Target states ADR0020 block-tree guard rejects any .fgos diff before merge because worker snapshots can overwrite main store. Source invokes precisely that guard as the reason config work was split out; its own plan/dependency decisions are source history.'),
 '04894':('A sixth case:','The sixth-case section explicitly contrasts resolveRepoRoot/current checkout with resolveMainCheckoutRoot/git-common-dir in the session hook and checks git-hooks callers separately. Source cites the same generic wrong-root failure class while clearly distinguishing its own comparison bug from a state write.'),
 '04896':(None,'The entire guide is the already-existing verify-fail-post-merge diagnosis/retry playbook contrasted with unrecoverable block reasons in the source. Target real example demonstrates two-block recovery and diagnosis of unrelated failures; no extra retry rule is imported here.'),
 '04900':(None,'Related names the complete existing verify-fail-post-merge playbook that this historical item wired into merge-loop. Source says unmodified for that completed change, not that target will never receive later examples.')
}
ASSESS.update({
 '04904':(None,'Target whole safe-reset guide covers full-tree status, committed ancestry loss and refusal/explicit confirmation before resetting main. Source expressly borrows that combined discipline for a different claim worktree, and explicitly disclaims main-guard coverage of that target. Those three checks span Before you start, Steps and Scope note; the whole guide is their common parent.'),
 '04914':('Real example','The exact real example quotes D5: executor.dispatch zero, initial fanout hypothesis checked and retracted, actual cause manual concurrent approvals. This matches the source separate D5 lesson from the same design discussion.'),
 '04916':(None,'The entire CAS-reread explanation documents a separate tsk-3jh optimization from the same instability scan. Related names that complete sibling fix, without importing its own measured counts or current state-reader contract.'),
 '04923':(None,'The complete tsk-2qc explanation is the install/setup reliability design and child rollout; source introductory see pointer identifies the whole parent item during which partial decompose was discovered, not a particular install recipe.'),
 '04931':(None,'The full follow-up tsk-45f explanation describes the purpose/for/capability field split and its reconciliation. Source explicitly names that narrower next-day follow-up to its own registry unification, consistent with target intro and Root cause.')
})

ASSESS.update({
 '04936':(None,'Target complete session-isolation explanation records tsk-49a correction that runner/session overlap was never found in real events, while abandoned human/session claims still require better liveness. Related names that exact correction and contrasts the actual liveness gap.'),
 '04939':(None,'The complete classify-step guide defines ad-hoc task identity and the executor mechanism; source cites it alongside the fallback fragment as the vocabulary example. No obsolete execute command is introduced into the source by this path patch.'),
 '04948':(None,'The whole sibling citation-format explanation documents gloss enforcement, baseline ratchet and the scope split with tsk-1lv. Source identifies that complete sibling mechanism in a historical cross-branch collision, not a current default-root recipe.'),
 '04961':(None,'The complete tsk-4mx explanation is the atomic-write half and prerequisite for the incremental snapshot. Source names that complete dependency artifact, not a lock-scope claim that the target explicitly disproves.'),
 '04962':(None,'Related identifies the complete tsk-4mx atomic-write prerequisite; target explicitly separates atomic rename from the already-correct lock scope. Source makes no contrary lock assertion.'),
 '04969':(None,'The complete verify guide catalogs false green structural greps, wrong branch resolution and correct test surfaces. Source draws a category analogy for Rust verify rather than claiming this guide directly specifies a Rust test or its own five rounds.'),
 '04978':(None,'The complete dated tsk-66l guide records the manual same-decision-ID collision occurrence this explanation automated. Its purpose and Steps distinguish insertions from edits and use next-free main IDs; source cites that complete historical occurrence, not a new post-retirement writer recipe.'),
 '04983':(None,'Related names the entire tsk-66l by-hand collision occurrence as the precedent for automation. This is an original incident artifact, with no assertion that standalone decision-file allocation remains the current mechanism.'),
 '04985':(None,'The entire prior tsk-3yl explanation documents isAlreadyMerged and its real verify fixes. Related names that whole prior fix as a precedent for checking real content, without importing any current check implementation.'),
 '04991':(None,'The complete external-plugin-install explanation explicitly grounds the fix in fgOS serving other projects and workflows. Source cites that mission boundary for a different item, not the other item exact install resolution mechanism.'),
 '04994':('D10 then D9','D7 in this combined target section is the CLI chokepoint: all reads/writes through the CLI, no direct state imports. Source names D7 and applies that same principle to PATCH editing; no route count or verb list is newly asserted.'),
 '04996':(None,'The full launch guide documents pane split then pane run, claude launch and skill prompt delivery. Source points to the full mechanics replacing an unparameterizable manifest action, and explicitly says row-to-pane-to-Claude behavior remains unchanged.'),
 '05003':(None,'The entire CTR010 reference defines the versioned gateway HTTP API and static bundle serving through that gateway. Source cites that complete API contract, not a new endpoint list; the retained YAML stays the separate executable contract.'),
 '05004':(None,'The complete architecture explanation establishes one gateway/orchestrator process, CLI chokepoint and D8 separate dashboard client. Source realignment invokes that architectural subject together with CTR010; its precise static-serving changes are local source facts.'),
 '05005':(None,'The full web dashboard layout is the cited UI-spec/userflow and visual-language artifact for P0b. Source treats it as a separate gated artifact produced by the owner, without asserting a new rendering or runtime contract.'),
 '05006':(None,'The full TUI dashboard layout/action queues reference is the prior cited design artifact. Source explicitly distinguishes that predecessor from the web layout, with its own task/verify history outside the target claim.'),
 '05011':(None,'The whole Iron Law evidence contract defines proof gathered by an agent and acknowledged by a different human operator. Source names that exact complete evidence artifact consumed by the trunk gate; no unreviewed self-ack is implied.'),
 '05012':(None,'The complete retrospective-gate explanation covers engine decision tagging across its follow-up fixes. Source class-level gloss invokes that engine-tagging discipline only, not an assertion that the retrospective gate writes this Iron Law record.'),
 '05013':('The other 11 locked decisions','The D10 item in the target says the judge-purpose naming collision was harmless, while a later issue deleted orphaned entries. Source explicitly contrasts those two different findings, preserving target historical interpretation.'),
 '05023':('The decision: neither','The exact block-tree decision section says remove worker .fgos and reject any worker diff touching it before trust. Source applies that same one-door-write boundary to a data fix, separating actual operator data mutation from the code branch.'),
 '05024':(None,'The complete guide is the concrete fgos-write-rejected recovery recipe and direct-main state/config fix precedent. Related names the whole rejection class, without reintroducing any obsolete verification or status name from its historical examples.'),
 '05032':('A mechanical check is only as live as the artifact','The exact tsk-5hg section proves hasOpenItems was sound but producers omitted Outstanding questions, causing fail-closed bypass. Source explicitly contrasts that fail-closed precedent with its own fail-open Locked decisions reader gap.'),
 '05035':('A mechanical check is only as live as the artifact','The tsk-5hg producer/reader mismatch section is exactly the lesson named: writer convention and real artifacts need their own guard, not just confidence in reader logic. Source proposes its own check, not changes to gate bypass.')
})

ASSESS.update({
 '05042':(None,'The complete release-on-exit explanation defines different hook versus merge callers, the sequential-commit lock gap, and opt-in releaseOnExit default false. Source attributes exactly that prior hook lifetime decision; its 180s/shorter-TTL change is source historical context, not a new target default claim.'),
 '05043':(None,'Related cites the whole prior release-on-exit decision, which explains why hooks must retain the lock between sequential commits. Source explicitly calls it the earlier decision this child verified, rather than making a fresh current Holder-lock guarantee.'),
 '05049':('The narrowed same-id-twice stop rule','The target section explains consolidation: retry belongs to the reason-specific playbook once it exists and generic stuck-twice only covers reasons with no playbook. Source exact old/new string drift concerns the SKILL.md verify identity, not a claim those literal strings appear in this guide; the guide is the complete later behavioral rewrite being identified.'),
 '05055':('D7: lock merge by target ref','Exact D7 states merge contention keyed by resolved target ref, no global concurrency cap, engine waits per ref. Source names this precise tsk-xyr target-ref lock as the tested feature; its later self-recognition defect belongs to the source new test, not a target assertion.'),
 '05073':(None,'The full rankImpact reference gives the real blocks-based ordering reused by derived impact. Related names that complete pre-existing derivation, with no new count/default claim about its sort keys.'),
 '05074':(None,'The entire pipeline reference maps stages/status, verbs, actors and handoffs, including rough classify and refined plan compute points. Related names that broader pipeline, not a newly current independent judge or driver recipe.'),
 '05077':('The two options,','The target options section contrasts drain-only aliases with migrating existing items when a natural destination exists. Source expressly draws an analogy to replacing a two-slot geometry rule, not an assertion that stage migration changes layout.'),
 '05078':('Output shape','The pinned execution.items field documents one row per currently running item. Source F5 contrasts an old no-growing-row claim with that growing execution.items set; this agrees with the output table, without changing ceiling/default behavior.'),
 '05079':(None,'Related names the complete read-only slots output reference, which separates displaying occupancy from enforcement. This matches the cited read-only half of the worker-slot design.'),
 '05083':('Steps','Target Steps computes waves of frontier items whose declared footprints do not overlap. Source uses exactly that advisory parallel-scheduling capability as the contrast to actual post-dispatch touched-file attestation; it makes no stronger enforcement claim.')
})

def historical_section(r,e,body,heading,marker):
 line=next(i for i,l in enumerate(body.splitlines(),1) if l=='## '+heading)
 e['historyRegion']={'heading':heading,'line':line,'marker':marker}

def disposition(r,e,path,body):
 short=e['edgeId'].removeprefix('maps-j-');context=m.adjacent_passage(body,e['sourceSpans'])
 if m.history_at(body,e['sourceSpans'][0]['line'],r['file']) or m.captured_evidence_at(body,e['sourceSpans'][0]['line']):
  preserve(r,e,path,body,'L12-40: original captured source/output identity; actual framing '+repr(context));return
 if short=='05058':
  a3.park(r,e,path,body,'Description needs rewrite: source allowance says evidence may be added later before done. Candidate RUL58 explicitly requires evidence before delivered, three closing stages earlier. Text-only clauses at authorship are still allowed, but redirecting the whole gloss would misstate the cutoff. Reconcile that complete timing claim before patching.','description-rewrite');return
 if short=='05075':
  a3.a.park(r,e,path,body,'Description needs rewrite: exact old decision 0026 lines 73-87 assert historical helper/rootTask vocabulary. The moved decision narrative has no preserved line correspondence; map the complete capacity/helper distinction to its exact candidate passage before replacing the locator.','description-rewrite');return
 if short=='05068':
  target='docs/platform/work-state/spec.md';h=next(h for h in m.heading_sections(PIN,target) if h['startLine']<=67<=h['sectionEndLine'] and h['sample'].endswith('Work Item Data Dictionary'))
  a3.anchored_patch(r,e,path,body,target,h['anchor'],nums=[67],assessment='Pinned Data Dictionary row 6 explicitly lists risk as free text. Source invokes exactly that row and absent urgency as separate measured producer gaps; the 476/482/98.8% figures are its own real-data measurement, not target dataset counts.');return
 if short in ('04942','04946'):
  a3.park(r,e,path,body,'Description needs rewrite: this is a live generic narrative-authority contract for docs/specs/<area>.md. Candidate ownership is split across area spec/subcomponent/decision holders; replacing the prefix would falsely claim one universal narrative layout. Rewrite the complete authority statement at cutover, not a template path alone.','description-rewrite');return
 if short=='04967':
  a3.park(r,e,path,body,'Phase 9 carry: the title-matched 0027 decision and its Audit reader list survive only in retiring docs/specs/work-state.md; the current candidate work-state/spec.md does not carry that audit. Carry the full reader audit to a real candidate decision holder before redirecting this exact Audit locator.','phase9-carry');return
 if short=='04986':
  a3.park(r,e,path,body,'P8-DOC-GAP-02: full 0014 architecture narrative is only in retiring specs/platform-foundations.md. Existing knowledge explanation is an implementation account, not the complete titled decision/model-3 narrative. Carry before redirecting the architecture-decision citation.','GAP-02');return
 if short in ('04979','04981'):
  a3.park(r,e,path,body,'Step 5 parity: source describes current classifier/auto-resolver operating on docs/decisions/0000-index.md. This retired decision-index contract needs actual merge reader/writer tracing and replacement behavior; a path-only rewrite cannot retain the collision semantics.','step5-parity');return
 if short=='05025':
  a3.park(r,e,path,body,'Description needs rewrite: Related recommends a recipe for the underlying events.jsonl conflict, but the alias holder explicitly says Superseded, events.jsonl frozen, shard writes instead and old tools removed. Rewrite the complete present-use recommendation before redirecting.','description-rewrite');return
 if short=='04970':
  historical_section(r,e,body,'The stale triage-table doc gap (`tsk-38t-8`) — independent of the category decision','so it shipped as its own')
  preserve(r,e,path,body,'L12-46: exact document edited by completed child tsk-38t-8, not present navigation. '+repr(context));return
 if short in ('05017','05019'):
  historical_section(r,e,body,'Pointer maintenance (`tsk-4ah`)','No other content')
  preserve(r,e,path,body,'L12-46: completed pointer maintenance preserves the actual edited source-file identity. '+repr(context));return
 if short in ('05027','05028'):
  preserve(r,e,path,body,'L12-40(2): original docPath/compound command identity points to this very consumer through its registry alias; preserve captured lookup, no self-navigation patch. '+repr(context));return
 if short=='05015':
  preserve(r,e,path,body,'Preserve explicitly removed historical allowlist guide identity and its old step-3 procedure, not an operative current recipe; source itself says guide and guard were removed. '+repr(context));return
 if short=='05016':
  target='docs/platform/runner/decisions/h-36d872fbb0e5.md';h=next(h for h in m.heading_sections(PIN,target) if h['sample'].startswith('0031 —'))
  a3.anchored_patch(r,e,path,body,target,h['anchor'],assessment='Exact 0031 titled narrative retires the orchestrator word guard after 0029 assigned its new meaning, preserving launcher for the one-item role. This agrees with the complete adjacent source gloss; no naming reversal is invented.');return
 if short=='04997':
  target='docs/platform/work-state/spec.md';h=next(h for h in m.heading_sections(PIN,target) if h['sample'].endswith('Business Rules'))
  a3.anchored_patch(r,e,path,body,target,h['anchor'],nums=[1065],assessment='Pinned RUL25 explicitly says frontier excludes a root while any descendant is not done, then root enters frontier and its own verify is the integration proof; no separate batch-close write. This matches all source root/frontier/integration claims.');return
 if short=='04989':
  a3.park(r,e,path,body,'Description needs rewrite: source says RUL40 stays unchanged and uses only PaneOrchestrator chrome. Candidate RUL40 was explicitly re-scoped to permit herdr agent API as transport/failure detector while refusing status as truth. A path-only rewrite would leave the unchanged/only-port gloss misleading.','description-rewrite');return
 if short in ('04849','04851'):
  a3.park(r,e,path,body,'P8-DOC-GAP-02: full 0035 mission/config/Iron Law narrative remains only in retiring specs/platform-foundations.md. Root platform-foundations.md is the locked laws, not this area-spec narrative. Carry complete content to a real candidate authority before redirecting this citation.','GAP-02');return
 if short=='04843':
  a3.park(r,e,path,body,'Step 5 parity: source describes the citation checker losing its decision-directory input on retirement. Default roots, scan population and baseline behavior require traced reader parity before changing this behavioral statement.','step5-parity');return
 if short=='04925':
  historical_section(r,e,body,'The root cause was a write path, not a merge accident','34 of the 36 missing files were later recovered')
  preserve(r,e,path,body,'L12-46: original recovered/regrown document identity in the completed orphaned-document recovery account. '+repr(context));return
 if short=='04898':
  a3.park(r,e,path,body,'Description needs rewrite: source names RUL34/RUL37 and exact old lines 530-531/598-603 as human-acknowledgement requirements. A candidate spec path alone would drop exact passage/line correspondence and the quoted legacy rule mapping. Reconcile the complete locator and rule gloss with the current Iron Law contract before redirecting.','description-rewrite');return
 if short in ('04850','04861','04886','04927','04928'):
  number={'04850':'0030','04861':'0020','04886':'0025','04927':'0020','04928':'0026'}[short];target='docs/platform/runner/decisions/h-36d872fbb0e5.md';h=next(h for h in m.heading_sections(PIN,target) if h['sample'].startswith(number+' —'))
  assessment={'04850':'0030 orders Ship Faster, Release con người, DoD, Polish Sau DoD, precisely the four priorities source contrasts with the mission classification axis.','04861':'0020 documents block-tree: remove worker .fgos and reject its diffs, preserve driver-session symlinks. These are the three concrete alternatives and boundary source describes.','04927':'0020 states the no-.fgos worker boundary this Related constraint names, without any added runtime root or hint behavior.', '04928':'0026 Native-First Dispatch rule 2 distinguishes same-provider soul work from purpose-targeted CLI spawning; source cites precisely the default native fallback branch rather than claiming all purpose lookups use it.', '04886':'0025 defines Ship Faster before Polish with bounded stabilization: source explicitly cites that dated priority rationale for accepting force after stabilization, without changing later 0030 ordering.'}[short]
  a3.anchored_patch(r,e,path,body,target,h['anchor'],assessment=assessment);return
 if short in ('04863','04864','04865','04866','04867'):
  historical_section(r,e,body,'The other six items this rollup tracked','All eight targets are `done`.')
  preserve(r,e,path,body,'L12-46: completed rollup member identity in the tracked-items section; all eight targets explicitly done. '+repr(context));return
 if short=='04870':
  historical_section(r,e,body,'A bare-word marker scan created a perverse incentive to obfuscate (`tsk-3i8`)','**The landed fix**:')
  preserve(r,e,path,body,'L12-46: preserve original tsk-3dt reproduction document identity in this completed scan-regression/fix section. '+repr(context));return
 if short in ASSESS:
  hint,assessment=ASSESS[short];alias_patch(r,e,path,body,hint,assessment);return
 if path.startswith(('docs/history/','docs/distillery/')) or path in ('docs/distribution-vision.md','docs/backlog.md','docs/specs','docs/decisions','docs/platform-foundations.md','docs/contracts/fgos-gateway-api-v1.yaml') or path.startswith('docs/ui-spec/') or path.startswith('docs/distribution-vision.md:') or path=='docs/history' or path=='docs/operator-runbook-herdr-cockpit.md' or path.startswith('docs/decisions/') or path.startswith('docs/specs/'):
  preserve(r,e,path,body,'Preserve original source, audit/verification input or past-event decision identity; actual source role: '+repr(context)+'.')
  if path.startswith('docs/specs/') and path.endswith('runner.md'):e['reason']+=' Non-executable successor note: docs/platform/runner/spec.md.'
  return
 if short=='04883':
  preserve(r,e,path,body,'Preserve immutable verification-proof directory identity; byte-identical evidence relocation/conservation is a Phase 9 obligation, not a live authority rewrite. '+repr(context));return
 raise AssertionError((short,path,context))

NEEDLES={
'04846':['tsk-64h','tsk-2t5'],'04847':['Some items reach','orphaned items'],'04848':['drift window','sync-root <root-id>'],
'04857':['Git hooks','Shell-rc source line'],'04858':['npm uninstall -g','pnpm, yarn','Windows'],
'04868':['level','canAutoApprove','Completeness scan'],'04876':['A worker slot','Occupancy is engine state'],
'04884':['tsk-4ns','tsk-49u','deleted'],'04885':['refuses','ADR0020','diff','main checkout'],
'04894':['resolveRepoRoot','resolveMainCheckoutRoot','git-hooks.mjs'],'04896':['failure','unrelated','retry'],'04900':['failure','unrelated','retry'],
'04904':['full `git status`','committed commits','refuses','main checkout specifically'],
'04914':['D5','zero','retracted','manual'],'04916':['tsk-3jh','instability','Only one'],
'04923':['tsk-2qc','install','setup'],'04931':['tsk-45f','capacity.for','capacity.capability'],
'04936':['tsk-49a','indefinite','no genuine'],'04939':['ad-hoc','<scope>','ID_PATTERN'],
'04948':['baseline','tsk-1lv','tsk-37i'],'04961':['atomic','tsk-4mx','lock scope'],'04962':['atomic','tsk-4mx','lock scope'],
'04969':['grep','branch','test'],'04978':['tsk-66l','different','next-free'],'04983':['tsk-66l','different','next-free'],
'04985':['isAlreadyMerged','real','verify'],'04991':['other projects','Mission','not forgentX'],
'04994':['D7','CLI','directly'],'04996':['pane split','pane run','claude'],
'05003':['static','HTTP','CTR010'],'05004':['D7','D8','CLI'],
'05005':['userflow','layout','P0b'],'05006':['layout','queue','work item'],
'05011':['human','acknowledge','proof'],'05012':['engine','kind','decision'],
'05013':['D10','collision','harmless'],'05023':['block-tree','.fgos','reject'],
'05024':['fgos-write-rejected','main','direct'],'05032':['tsk-5hg','heading','fail-closed'],'05035':['tsk-5hg','heading','fail-closed'],
'05042':['releaseOnExit','sequential','never'],'05043':['releaseOnExit','sequential','never'],
'05049':['generic','playbook','retry'],'05055':['target','slot','lock'],'05073':['blocks','impact'],
'05074':['classify','plan','refined'],'05077':['alias','migrat','natural'],
'05078':['execution.items','one row','running'],'05079':['execution.items','ceiling','read-only'],'05083':['footprint','wave','frontier']}
DIMENSIONS={'04850':['verbFileLists'],'04861':['verbFileLists'],'04857':['verbFileLists','shippedStatus'],'04858':['verbFileLists','shippedStatus'],'04894':['verbFileLists'],'04994':['verbFileLists'],'04997':['verbFileLists','shippedStatus'],'05078':['verbFileLists'],'05083':['verbFileLists']}

def augment_proofs(rs):
 for r in rs:
  for e in r['edges']:
   if e['disposition']!='patch':continue
   short=e['edgeId'].removeprefix('maps-j-');proof=r['checks']['anchors'][e['edgeId']];truth=r['checks']['coverage']['descriptionTruth'][e['edgeId']];tl=m.blob(PIN,e['target']).decode().splitlines()
   nums={x['line'] for x in truth['targetEvidence']}
   for i,line in enumerate(tl,1):
    if any(t.casefold() in line.casefold() for t in NEEDLES.get(short,[])):nums.add(i)
   if e['anchor']:
    h=next(h for h in m.heading_sections(PIN,e['target']) if e['anchor'] in (h['anchor'],h['githubSlug']));nums={n for n in nums if h['startLine']<=n<=h['sectionEndLine']}
   # Compact evidence: at most 18 content lines plus existing precise-heading evidence.
   nums=sorted(nums)[:18]
   truth['targetEvidence']=[{'line':n,'text':tl[n-1]} for n in nums]
   for d in DIMENSIONS.get(short,[]):truth['comparisons'][d]={'verdict':'matches','note':truth['assessment']+' Specific target claim lines quoted above bind this asserted dimension.'}

def main():
 rs=[];reads=[]
 for file,b in m.population().items():
  raw=m.blob(PIN,file);old=m.blob(m.INVENTORY,file);assert raw==old;body=raw.decode();ls=body.splitlines();invs=[e for e in c.entries.values() if e['consumerPath']==file]
  r=dict(file=file,inventoryInputCommit=m.INVENTORY,authorInputCommit=PIN,inventoryFileDigest=m.sha(old),digest=m.sha(raw),inventoryEdgeIds=[e['edgeId'] for e in invs],diff='',edges=[],checks={'coverage':{'authorAddedEdgeIds':[]},'anchors':{},'relativeResolution':{},'labelForm':{}},reviewSet='batch-'+b,authoringRules=['A51','L12-10','L12-21..L12-46; full authoring rules digest'])
  for inv in invs:
   e={k:None for k in m.EDGE_FIELDS};e.update(edgeId=inv['edgeId'],sourceSpans=copy.deepcopy(inv['physicalSpans']),matchedExpression=inv['matchedExpression'],disposition='preserve',timing='none',reason='',unitId=m.unit_id(body,inv['physicalSpans']));r['edges'].append(e)
  candidates=[];cov=r['checks']['coverage']
  for span in m.scan_candidates(PIN,file,[s for e in invs for s in e['physicalSpans']]):
   token=span['text'];link=re.fullmatch(r'!?\[[^\]]+\]\(([^)]+)\)',token);origin=m.relative_decision_origin(PIN,file,(link[1] if link else token).split('#')[0]);targets=m.candidate_targets(file,body,span);hits=[t for t in targets if m.legacy_reference_target(t) and t in c.tree|c.dirs]
   full=token.removeprefix('repo/').startswith('docs/')
   if not origin and not hits and not full:
    candidates.append({'span':span,'excludedReason':m.coverage_exemption(file,body,span) or 'No retiring/legacy documentation referent from actual consumer or stated-parent coordinates; resolved readings '+repr(targets)+'. Bare code/config/artifact names are not unrelated legacy documents.'});continue
   path=origin or (hits[0] if hits else token.removeprefix('repo/').split('#')[0]);key='author-wave5a-'+file.removesuffix('.md').replace('/','-')+'-L'+str(span['line'])+'C'+str(span['columnStart'])
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
   needles=[]  # Compact claim-specific quotes are added by augment_proofs below.
   nums=sorted(set((proof['targetLines'] or [next((i for i,l in enumerate(tl,1) if l.startswith('# ')),1)])+[i for i,line in enumerate(tl,1) if any(term in line for term in needles)]))
   if proof.get('passage'):
    heading=next(h for h in m.heading_sections(PIN,e['target']) if h['anchor']==e['anchor'] or h['githubSlug']==e['anchor'])
    nums=[i for i in nums if heading['startLine']<=i<=heading['sectionEndLine']]
   if e['anchor']:proof.update(targetLines=nums,targetLineText=[tl[i-1] for i in nums])
   truth['targetEvidence']=[{'line':i,'text':tl[i-1]} for i in nums]
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
 augment_proofs(rs)
 for b in SETS:(P/'step-03-records'/f'batch-{b}.jsonl').write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs if r['reviewSet']=='batch-'+b))
 save('step-03-wave5a-whole-file-reads.json',{'pin':PIN,'files':reads,'sourceBytes':sum(x['bytes'] for x in reads),'method':'Complete immutable source bytes read; every inventory span bound; supplemental full-file scan and context considered. Author traversal is not independent review.'})
 save('step-03-wave5a-population.json',{'pin':PIN,'completedBatches':list(SETS),'pendingBatches':[f'{i:03}' for i in range(83,131)],'stopReason':'Whole-file authoring budget boundary after batch 082; batches 083 onward remain unauthored.','files':len(rs),'inventoryEdges':sum(len(r['inventoryEdgeIds']) for r in rs),'addedEdges':sum(len(r['checks']['coverage']['authorAddedEdgeIds']) for r in rs),'edges':sum(len(r['edges']) for r in rs),'patchedFiles':sum(bool(r['diff']) for r in rs),'dispositions':dict(collections.Counter(e['disposition'] for r in rs for e in r['edges'])),'parks':dict(collections.Counter(e['blockedCategory'] for r in rs for e in r['edges'] if e['disposition']=='parked')),'reviewAcceptance':'pending independent A51 review'})
 print(json.dumps({'files':len(rs),'edges':sum(len(r['edges']) for r in rs)}))
if __name__=='__main__':main()
