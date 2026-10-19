#!/usr/bin/env python3
"""Bounded wave-4c authoring: batches 073–074, records not consumer edits."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,re,copy,collections,time,posixpath
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('a3',P/'step-03-wave3-author.py');a3=importlib.util.module_from_spec(sp);sp.loader.exec_module(a3)
m=a3.m;PIN=a3.PIN;SETS=('073','074');m.SETS=SETS;c=m.Checker(PIN);a3.c=c;a3.a.c=c

def save(name,o):(P/name).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def path_for(e):return (c.entries.get(e['edgeId']) or e['authorAddedEdge'])['normalizedReference'].split('#')[0]
def preserve(r,e,path,body,why):
 normalized=a3.legacy_path(path)
 if re.match(r'^docs/decisions/\d{4}-(?:\.\.\.)',normalized):state=a3.facts(e,normalized[:19])
 else:state=a3.facts(e,path)
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
# Every exceptional source claim below was read in complete consumer context.
PARKS={
 '04399':'The live introductory comparison recommends manual seq-conflict repair without saying the target now explicitly supersedes that procedure: the event log is a frozen baseline and contiguity scripts are deleted (tsk-3tp). Rewrite this present-tense recovery recommendation and its historical scope before redirecting.',
 '04402':'The Related item presents the old seq-reconciliation procedure as a current sibling procedure; the exact alias holder declares everything below its supersession header historical, with the scripts deleted. Rewrite this recommendation with that scope before redirecting.',
 '04409':'The whole Related item calls these siblings procedures for specific conflicting content types. The seq-repair sibling now marks its entire procedure historical; the decision-id sibling still instructs editing the deleted manual 0000-index. Rewrite the complete grouped recommendation from those actual current scopes before redirecting either edge.',
 '04410':'The whole Related item calls these siblings procedures for specific conflicting content types. The seq-repair sibling now marks its entire procedure historical; the decision-id sibling still instructs editing the deleted manual 0000-index. Rewrite the complete grouped recommendation from those actual current scopes before redirecting either edge.',
 '04435':'The live entry condition names the removed manual docs/decisions/0000-index.md and its row conflicts. The retained docs/decisions/index.md is generator-owned, not that hand-edited row contract. Rewrite the complete recovery entry condition and steps against the real index owner before redirecting.',
 '04449':'The Related gloss still claims blocked -> proposed is the same recovery edge as step 5. The live recovery edge is awaiting-approval (L12-31 and L12-40 do not authorize certifying proposed). Rewrite the whole source status/recipe comparison before redirecting to the diagnose guide.',
 '04450':'The Related item attributes the STR72 supersedes/superseded_by renumbering convention to the removed manual 0000-index. The retained generated index is not that original manual convention or editable source. Rewrite the recipe and its convention ownership together; no path-only redirect can keep this description true.',
 '04451':'The live comparison says the alias holder covers a recoverable seq merge break. That holder explicitly says the baseline is frozen, seq-contiguity scripts are deleted, and its old procedure is historical. Rewrite this recommendation with the actual historical scope, not just the path.',
 '04455':'The Related recommendation calls the seq merge procedure a current recoverable sibling runbook, while its holder explicitly supersedes that whole procedure. Rewrite its scope with the sharded-event mechanism before redirecting.',
 '04466':'This source specifically locates the schedule missing-warning fix in its Update (tsk-3u2) section. The actual committed Update section describes parent/mergeAfter cycle detection, with no STORE_MISSING_WARNING_VERBS or --dir warning fix. Reconcile the exact claimed passage; redirecting to this unrelated subsection would certify a false description.',
 '04472':'This Related item calls the schedule guide the STORE_MISSING_WARNING_VERBS instance generalized by case four. The guide documents scheduling and cycle detection, not that warning-verb fix. Rewrite the cited claim or carry the missing exact warning account before redirecting.',
}
ASSESS={
 '04531':(None,'The complete overlap explanation records tentative children sharing a declared file, the overlap gate before creation, and live-session judgments declining same-footprint splits. This source contrasts that collision reason with its distinct lifecycle-overhead reason; no claim that overlap detects cost is introduced.'),
 '04532':(None,'The Related item names the complete footprint-collision explanation as the other half of why not split. The target explains exactly that mechanism, independent of the source four-file example and its historical vocabulary.'),
 '04536':(None,'The complete catchup guide covers blocked merge reasons and running from the current worktree with --dir. This is the underlying recipe named here; no narrower section or new status name is asserted in Related.'),
 '04537':(None,'The complete sibling guide covers when catchup cannot reconcile and the already-caught-up historical bug. This Related item names that opposite recovery direction, without asserting catchup still has the fixed nothing-to-commit bug.'),
 '04538':(None,'The complete approve diagnosis guide separates genuine red post-merge verify from unrelated failures; this Related item names that whole sibling subject and introduces no obsolete proposed recovery command.'),
 '04559':('Where the semantic rule was placed','The exact section lists plugins submit and fgos-submit-assist as the two submitting skills, with a separate decompose prompt path. Source says the same two skills are named as parallel submitting doors, not that the target has only two total placements.'),
 '04560':('Real example','The target Real example records tsk-3wr-1 test-description rename passing twice then return failing amid concurrent checkpoint work. This is the concrete concurrent interference instance the source measured runtime paragraph cites, not a new performance guarantee.'),
 '04561':(None,'The complete audit explanation states the discriminator: shared generic mechanism versus independently wired code. This source names it as the method used by the same tsk-3wr-2 lineage; the target audit figures are historical and no new current-suite count is claimed.'),
 '04563':('A third round','The third-round section records tsk-18k release/renew stale-holder deletion and the shipped pid identity instead of nonce, plus atomic git update-ref. These are the same three facts in the source audit row; the older earlier-round rejected pid alternative is explicitly superseded there.'),
 '04564':(None,'This audit row links the complete family-of-fixes document, which contains distinct mechanism/prune/rebase/root-sha/canceled-child cases, including the tsk-4bh canceled/wontfix skip. The whole family is the named subject, not only the first prune section.'),
 '04565':('Follow-up:','The exact tsk-11v follow-up implements deps-edge sequencing in footprintOverlapAmong before overlap comparison. The source row accurately distinguishes that earlier separate fix from its path-normalization finding; it does not conflate their mechanisms.'),
 '04569':(None,'This source introduction names the whole interface-daemon architecture as the base design reviewed by the dated gateway audit. The target defines one process with two modules and gateway as CLI spawn choke point, matching that whole design subject.'),
 '04570':(None,'This source introduction names the complete CTR010 API reference as the base contract reviewed by the gateway audit. The target identifies docs/contracts/fgos-gateway-api-v1.yaml and CTR010 fgos-gateway.v1, with daemon and MCP implementation scope. No renumbering or schema change is introduced.'),
 '04400':('Two candidate causes','The exact root-cause B bullet records git tracking in shared main and whole-tree checkout/reset discarding uncommitted appends. The source explicitly recalls that known historical root cause and broadens its trigger, without claiming the old seq mechanism remains current.'),
 '04401':('Two candidate causes','The Related item names root cause B as the broader explanation of the recorded loss incident. This exact section describes shared-main git tracking and losing appends; the later supersession is separate and does not change the historical cause being cited.'),
 '04404':(None,'The complete approve-diagnosis guide separates unrelated existing failures, load flakes and real merge defects. Source step 3 explicitly applies that diagnostic distinction before retrying catchup; it does not claim catchup is approve or copy its old status recipe.'),
 '04405':(None,'The guide is the whole diagnostic subject named in Related: why approve post-merge verification failed, before retrying catchup. No count, version, subsection or status transition is asserted in this item.'),
 '04406':(None,'The complete sibling guide distinguishes real conflicts from catchup on already-caught-up branches; this Related item names that whole residual-conflict subject without a version or operation-specific assertion.'),
 '04407':('Real example','The target Real example names tsk-2z3 and the exact test/install-packaging.test.mjs e2e load flake; the source names that specific independently repeated example and its rerun remedy.'),
 '04408':(None,'This Related item names the complete sibling guide for unrelated flaky full-suite verify without a preceding conflict. The target introduction and steps have precisely that scope, without asserting obsolete status names in this item.'),
 '04416':('The real incident','The target incident records approve tsk-1wd-1 reclaiming the root checkout while its commits survived. This source explicitly contrasts that leaf-merge reclaim trigger with claim creation failure; the target confirms that different trigger and same state/orphan shape.'),
 '04417':('1. Pick your operation','The operation table states claim checkout cleanup belongs to claim-port.mjs claimWork. This is the exact ownership assertion in the source Related gloss, independently of the historical command recipe in the consumer.'),
 '04424':(None,'The target supersession header describes frozen baseline, per-writer shards and deletion of the contiguity mechanism. The source supersession header names precisely that whole replacement mechanism and separately retains its old procedure as history.'),
 '04427':('Why this is rejected','The exact rejection section says worker branch commits may not carry .fgos and the trusted CLI writes via repoRoot. The source old seq procedure explicitly stays historical, and cites the same one-door rejection reasoning, not a claim that hand-renumbering remains current.'),
 '04429':(None,'Related names the complete guide for an already committed worker .fgos diff. That is the exact target introduction and repair scope; the surrounding seq-check entry is expressly marked deleted.'),
 '04447':('The shape being auto-resolved','The target precondition requires the only conflicted path to be the index; this source audit explains why a larger manual multi-file conflict bypassed it. The cited precondition matches, without changing the historical filenames and 0032 collision evidence.'),
 '04453':(None,'The source explicitly says the union-merge doctor check/script were retired with tsk-3tp after the frozen-baseline/shard change. The target supersession header records the same replacement, with no claim that the removed seq check still runs.'),
 '04457':('Steps','The first three target steps declare runner.executors, same-entry capability registration and decide then fgos run. These match the source step 1 config/registration call and expressly replace the older execute entry; no path-only schema change is needed for this source unit.'),
 '04460':('Steps','Related points to config/registration steps 1–3; the actual steps use runner.executors and same-entry capability plus decide/run. This source item names that precedent, rather than the stale execute claim elsewhere in the consumer.'),
 '04461':(None,'The complete guide describes the decide mechanism and its three branches, then shared-fragment reuse. The source names that complete dispatch-decision subject; its own obsolete execute prose is a separate unit, not a claim introduced by this pointer.'),
 '04469':(None,'The complete stuck-lock recovery guide is distinct from the source store-root boundary bug, as the Related gloss says; no claim that a stale lock is this incident or that unlock always clears a live holder is introduced.'),
 '04470':('2. Register','The exact registration section lists read-verb flags and warns about writers like docs-index whose root must derive from --dir. This matches the source assertion that a read-only flag recipe alone would miss a real file writer and now flags that case.'),
 '04473':('Update (`tsk-5iv`)','The exact update reproduces reset targeting the worktree instead of shared main and fixes it by git common-dir. The source Related item correctly contrasts a wrong resolved root with a missing-store warning, from the same review round.'),
 '04476':(None,'The complete guide covers clearing stale/dead/corrupt locks without forcing a live holder. The source contrasts this lock recovery subject with destructive reset, which is exactly the different scope of the target.'),
 '04485':('The trap:','The target trap section states the root must gather its child DAG before root landing, including non-partial root closeout. This is the source exact all-children-first invariant; the source does not claim an arbitrary leaf is a root.'),
 '04486':(None,'The complete dedicated merge-conflict playbook retries catchup before asking a person and escalates surviving real conflict. Source lists that dedicated playbook as already tried, accurately distinct from its timeout/unclassified playbooks.'),
 '04494':(None,'Related names the complete decision-id collision blocker guide as a different approve incident that also used acknowledge-iron-law. Those historical incidents and flag are actually recorded; this item does not recommend its obsolete manual index-edit procedure.'),
 '04502':(None,'The complete stuck-lock guide distinguishes a fresh live holder from stale/dead/corrupt lock and refuses unlock for a live session. This source introduction explicitly addresses the complementary genuinely-active case.'),
 '04503':('Steps','Target step 3 checks the live-held refusal and actual lock age/TTL before deciding whether to wait. The source specifically invokes step 3 to distinguish a live holder from orphaned state; the exact claimed step matches.'),
 '04505':(None,'The target whole guide includes ambiguous/corrupt lock recovery through unlock. The source names that separate case, without extending its own --wait to ambiguous failures.'),
 '04506':(None,'The complete guide is the stale/dead/corrupt recovery counterpart to this live-holder wait guide. Related accurately says it distinguishes those cases; no TTL numeric promise or current executor assertion is introduced.'),
 '04509':(None,'The whole skill-wiring guide explicitly distinguishes task-dispatch consumers from headless functions. The source introductory contrast names that complete counterpart, not its own removed judge functions as still live.'),
 '04510':('A tool-registry entry is never','The exact section says resolver presence gating retired at tsk-5tm-1 D1 and a caller explicitly queries --status present. This is the precise presence-gate scope the source step 2 states.'),
 '04511':(None,'The complete explanation documents why executor-aware dispatch exists and what its cluster proved, including the headless judge wiring. The source Related gloss names exactly that whole historical cluster explanation.'),
 '04512':(None,'The complete target is the task-dispatch skill counterpart to this headless-function guide, exactly the relationship named in this Related item. No stale kind/presence-test rule is asserted by the pointer itself.'),
 '04524':(None,'The whole root-cause explanation describes underscore helper stripping that broke both shell functions and why naive subprocess/source tests missed it. That is the specific sibling root cause this doctor-check guide detects.')
}
def disposition(r,e,path,body):
 short=e['edgeId'].removeprefix('maps-j-');n=e['sourceSpans'][0]['line'];context=m.adjacent_passage(body,e['sourceSpans'])
 if m.history_at(body,n,r['file']) or m.captured_evidence_at(body,n):
  # Operative commands below are recipe writes, not captured output.
  if short in ('04437','04438','04439','04440'):
   if short in ('04439','04440'):
    a3.park(r,e,path,body,'Step 5 parity: this operative scratch-merge recipe edits/adds the removed manual docs/decisions/0000-index.md. The retained index is generated by fgos decision-index, so transfer this writer recipe with the actual index owner/reader contract rather than rewrite an output path.','step5-parity');return
  else:
   preserve(r,e,path,body,'L12-40 and L12-39(6): preserve original captured output or explicit Document history identity. Exact source unit: '+repr(context))
   for a in m.resolver.aliases(PIN,path):
    holder=a['entry'].get('currentPath')
    if holder and holder!=r['file'] and 'Non-executable successor note: '+holder not in e['reason']:e['reason']+=' Non-executable successor note: '+holder+'.'
   return
 if short in ('04444','04445'):
  real='docs/decisions/'+('0032-cong-iron-law-chi-hoi-o-ranh-gioi-trunk-them-muc-warn.md' if short=='04444' else '0032-multi-role-team-harness-role-holder-axis-va-handoff.md')
  if short=='04444':
   why='Lead ruling required: this source elides the Iron Law trunk-boundary 0032 filename, whose actual deleted file is '+real+'. Its real title-matched holder is docs/platform/runner/decisions/h-36d872fbb0e5.md (0032 Cổng Iron Law). The current L12-39 predicate instead requires the multi-role-team-harness 0032 note from the sibling filename in the same paragraph. Naming that different narrative would falsify this edge, while correcting the title predicate exceeds this turn’s L12-40-only checker authorization. Keep this exact source identity non-executable pending the bounded Lead ruling; no missing-target claim is made.'
   a3.park(r,e,path,body,why,'lead-ruling');e['reason']='A51, L12-39, L12-40 scope ceiling: '+why+' '+a3.facts(e,real)
   cov=r['checks']['coverage'];cov.setdefault('extraLocatorSearches',{})[e['edgeId']]=[{'query':q,'result':m.resolver.query(PIN,q),'category':'partial-holder','note':'Iron Law versus Team Harness are separate narratives despite the shared historical number; the precise title/filename is the binding.'} for q in ('0032','Cổng Iron Law','Multi-role Team Harness')]
  else:
   preserve(r,e,real,body,'The elided source spelling denotes this actual removed Multi-role Team Harness decision, not a never-existing literal ellipsis file. Preserve the dated 2026-08-16 audit capture and keep its own narrative successor separate from Iron Law.')
  return
 if short=='04438':
  e['reason']='L12-26 illustrative regex prefix: docs/decisions/00 is only the literal prefix of ^docs/decisions/00[0-9]+- in the complete grep expression. The committed docs/decisions/ directory is retained; no file named 00 is asserted.';return
 if short=='04546':
  a3.park(r,e,path,body,'Description needs rewrite: L12-26(4) established docs/backlog.md is hand-maintained and no bee backlog renderer owns it. This live recipe says it is generated from absent .bee/backlog.jsonl and therefore impossible to edit here. P8-DOC-GAP-03 owns reconciliation of that false generator/ownership claim; retaining the path cannot certify the adjacent instruction.','description-rewrite');return
 if short in ('04551','04552','04553'):
  preserve(r,e,path,body,'Preserve explicit completed drift/guard evidence from tsk-2ta-2, tsk-4y2 and quoted f14f1175 commit, not an instruction to keep a retiring spec as runtime authority. Exact historical source unit: '+repr(context)+'. Non-executable successor note: docs/platform/packaging-distribution/spec.md. Step 5 owns actual checker input parity.');return
 if e.get('authorAddedEdge') and r['file'].endswith('tiny-multi-file-edits-stay-one-item-when-split-overhead-exceeds-the-work.md') and path.startswith('docs/specs/'):
  note='P8-DOC-GAP-02: the enduser-docs candidate holder still needs carry; no invented successor.' if 'enduser-docs-' in path else 'Non-executable successor note: '+('docs/reading-map.md' if path.endswith('reading-map.md') else 'docs/platform/system-overview/spec.md')+'.'
  preserve(r,e,path,body,'Preserve completed tsk-3j1 four-file footprint identity: "a docs task touching four small, distinct spec files" and the quoted locked one-piece reasoning. '+note);return
 if short in PARKS:a3.park(r,e,path,body,'Description needs rewrite: '+PARKS[short],'description-rewrite');return
 if short=='04403':
  target='docs/platform/work-state/spec.md'
  hs=[h for h in m.heading_sections(PIN,target) if h['startLine']<=1073<=h['sectionEndLine']];h=max(hs,key=lambda h:h['level'])
  a3.anchored_patch(r,e,path,body,target,h['anchor'],nums=[1073,1074],assessment='Exact RUL33 states blocked -> awaiting-approval catchup without doing; RUL34 keeps branch markers distinct. The source names those rules for that precise difference from return on doing. No current claim that proposed is the status is introduced.');return
 if short in ('04463','04467','04475','04462','04491','04493'):
  number={'04463':'0020','04467':'0020','04475':'0021','04462':'0026','04491':'0022','04493':'0022'}[short];target,anchor=m.decision_narrative_holders(PIN,number)[0].split('#',1)
  hint='2. Kiểm tra working-tree' if number=='0022' else number+' —'
  patch(r,e,path,body,target,hint,{'0020':'The exact 0020 narrative blocks a worker checkout from carrying its own .fgos store, matching this source rationale. This is the historical named decision identity, not a new current session-symlink contract.','0021':'The exact 0021 decision describes wiring the shared main-checkout commit lock through doctor/setup. This matches the source contrast with a destructive reset guard, not a claim that the lock prevents reset.','0026':'The exact Native-First Dispatch Doctrine states live Task access belongs to the caller, not a bare Node CLI. Source names this governing doctrine without changing the later execute recipe elsewhere.','0022':'Candidate two records identical exclusion/prefix logic with differing subtree versus whole-repo status pathspec. The source intro names exactly that surveyed duplication, The same exact section records Đã sửa with commit 3dad0c2 and scope subtree/whole-repo, so the Related resolution gloss also matches.'}[number]);return
 if short=='04492':
  preserve(r,e,path,body,'Preserve explicitly completed provenance: "Item choke-point-workingtree-clean-duplication, from ... ranked candidate #2, confirmed ... and merged it". Non-executable successor note: '+m.decision_narrative_holders(PIN,'0022')[0]+'.');return
 if short=='04420':
  preserve(r,e,path,body,'Preserve explicit historical reversal: "This is a deliberate reversal" of the old RUL9/RUL11 no-write/no-fix claims; redirecting to current distribution behavior would falsify what was reversed. Non-executable successor note: docs/platform/packaging-distribution/spec.md.');return
 if short=='04446':
  preserve(r,e,path,body,'Preserve completed audit conflict-file evidence: "other, real file conflicts at the same time" during the 2026-08-16 tsk-60r4 audit. Non-executable successor note: docs/platform/packaging-distribution/spec.md.');return
 if short in ASSESS:
  hint,assessment=ASSESS[short];alias_patch(r,e,path,body,hint,assessment);return
 if path=='docs/decisions/0000-index.md':
  preserve(r,e,path,body,'Preserve explicit completed conflict evidence from tsk-66l: '+repr(context)+'. Non-executable successor note: docs/decisions/index.md.');return
 # All remaining identities are retained history artifacts/directories or explicit dated glob evidence.
 assert not (path not in c.tree|c.dirs and m.resolver.aliases(PIN,path)),(short,path)
 preserve(r,e,path,body,'Preserve retained source/provenance/illustrative convention with its complete source unit: '+repr(context)+'. This reference introduces no moved authority or current reader redirect.'+(' Any 0023 product-priority narrative note applies only to the explicitly contrasted main-branch priority record, not to the tsk-66l draft status-rename identity.' if short=='04441' else ''))

def main():
 rs=[];reads=[]
 for file,b in m.population().items():
  raw=m.blob(PIN,file);old=m.blob(m.INVENTORY,file);assert raw==old;body=raw.decode();ls=body.splitlines();invs=[e for e in c.entries.values() if e['consumerPath']==file]
  r=dict(file=file,inventoryInputCommit=m.INVENTORY,authorInputCommit=PIN,inventoryFileDigest=m.sha(old),digest=m.sha(raw),inventoryEdgeIds=[e['edgeId'] for e in invs],diff='',edges=[],checks={'coverage':{'authorAddedEdgeIds':[]},'anchors':{},'relativeResolution':{},'labelForm':{}},reviewSet='batch-'+b,authoringRules=['A51','L12-10','L12-21..L12-40; full authoring rules digest'])
  for inv in invs:
   e={k:None for k in m.EDGE_FIELDS};e.update(edgeId=inv['edgeId'],sourceSpans=copy.deepcopy(inv['physicalSpans']),matchedExpression=inv['matchedExpression'],disposition='preserve',timing='none',reason='',unitId=m.unit_id(body,inv['physicalSpans']));r['edges'].append(e)
  candidates=[];cov=r['checks']['coverage']
  for span in m.scan_candidates(PIN,file,[s for e in invs for s in e['physicalSpans']]):
   token=span['text'];link=re.fullmatch(r'!?\[[^\]]+\]\(([^)]+)\)',token);origin=m.relative_decision_origin(PIN,file,(link[1] if link else token).split('#')[0]);targets=m.candidate_targets(file,body,span);hits=[t for t in targets if m.legacy_reference_target(t) and t in c.tree|c.dirs]
   if token=='system-overview.md' and any(path_for(e)=='docs/specs/system-overview.md' for e in r['edges']):hits=['docs/specs/system-overview.md']
   if file.endswith('tiny-multi-file-edits-stay-one-item-when-split-overhead-exceeds-the-work.md') and token in ('reading-map.md','system-overview.md','enduser-docs-authoring.md','enduser-docs-index.md'):
    hits=['docs/specs/'+token]
   full=token.removeprefix('repo/').startswith('docs/')
   if not origin and not hits and not full:
    candidates.append({'span':span,'excludedReason':m.coverage_exemption(file,body,span) or 'No retiring/legacy documentation referent from actual consumer or stated-parent coordinates; resolved readings '+repr(targets)+'. Bare code/config/artifact names are not unrelated legacy documents.'});continue
   path=origin or (hits[0] if hits else token.removeprefix('repo/').split('#')[0]);key='author-wave4d-'+file.removesuffix('.md').replace('/','-')+'-L'+str(span['line'])+'C'+str(span['columnStart'])
   e={k:None for k in m.EDGE_FIELDS};e.update(edgeId=key,sourceSpans=[span],matchedExpression=token,disposition='preserve',timing='none',reason='',unitId=m.unit_id(body,[span]),authorAddedEdge={'normalizedReference':path,'discoveryReason':'Complete pinned source traversal; literal legacy scan, source-bound shorthand and committed registry original coordinates for moved relative decision links.','searchMethod':'step-03-check.py:scan_candidates plus explicit per-file context at author pin'});r['edges'].append(e);cov['authorAddedEdgeIds'].append(key);candidates.append({'span':span,'edgeId':key})
  cov['legacyScan']={'pin':PIN,'method':'Complete pinned full/partial/basename/directory/link scan including registry original coordinates for moved numeric decision links. Every hit joins an edge or a contextual exclusion.','candidates':candidates}
  for e in r['edges']:disposition(r,e,path_for(e),body)
  # Physical-span witnesses remain unchanged; full adjacent locator searches are additive.
  for e in r['edges']:
   key=e['edgeId'];short=key.removeprefix('maps-j-')
   if e['disposition']=='parked':
    context=m.adjacent_passage(body,e['sourceSpans']);covered={q['query'] for q in e['searchWitness']['queries']};queries=set(m.resolver.tokens(context))-covered
    if short=='04435':
     exclusions={'blocked':'quoted status enum, not a section locator','merge-conflict':'quoted failure reason, not a section locator','next free':'quoted allocator phrase, not a section locator'}
     cov.setdefault('locatorTokenExclusions',{})[key]=exclusions;queries-=set(exclusions)
    queries-={q['query'] for q in cov.get('extraLocatorSearches',{}).get(key,[])}
    if short in ('04466','04472'):queries.update(['Update (tsk-3u2)','STORE_MISSING_WARNING_VERBS','tsk-3u2'])
    if short=='04450':queries.add('STR72')
    if queries:cov.setdefault('extraLocatorSearches',{}).setdefault(key,[]).extend([{'query':q,'result':m.resolver.query(PIN,q),'category':'partial-holder' if m.resolver.query(PIN,q)['liveHitCount'] else 'carriage' if m.resolver.query(PIN,q)['hitCount'] else 'dead','note':'Complete adjacent-unit locator search; any matching token/heading alone cannot cure this specific source-description or operative-writer mismatch: '+e['reason']} for q in sorted(queries)])
   evidence={'04400':[109,110,111,112,113,114,115,116,117],'04401':[109,110,111,112,113,114,115,116,117],'04417':[22,24],'04447':[21,22,23,24,25,26,27,28,29,30,31],'04491':[366,367,368,369,370,371,373,374,376,377,378,379,380,381],'04493':[366,367,368,369,370,371,373,374,376,377,378,379,380,381],'04503':[45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60],'04510':[210,215,219,223,238,240],'04563':[176,177,178,179,180,181,182,183,184,203,204,205,206,207,208],'04565':[77,78,79,80]}.get(short)
   if evidence and e['disposition']=='patch':
    target=e['target'];tl=m.blob(PIN,target).decode().splitlines();proof=r['checks']['anchors'][key];proof.update(targetLines=evidence,targetLineText=[tl[n-1] for n in evidence]);r['checks']['coverage']['descriptionTruth'][key]['targetEvidence']=[{'line':n,'text':tl[n-1]} for n in evidence]
  for e in r['edges']:
   if e['disposition']=='patch':
    truth=cov['descriptionTruth'][e['edgeId']]
    for dimension in {'04417': ['verbFileLists'], '04447': ['counts', 'verbFileLists'], '04457': ['counts', 'verbFileLists', 'shippedStatus'], '04460': ['counts', 'verbFileLists'], '04503': ['verbFileLists'], '04510': ['defaults', 'verbFileLists', 'shippedStatus'], '04531': ['counts', 'verbFileLists'], '04532': ['verbFileLists'], '04563': ['verbFileLists', 'shippedStatus'], '04565': ['verbFileLists', 'shippedStatus']}.get(e['edgeId'].removeprefix('maps-j-'),[]):
     truth['comparisons'][dimension]={'verdict':'matches','note':truth['assessment']+' Checked the complete adjacent source unit against the pinned target evidence, including this asserted dimension.'}
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
 save('step-03-wave4d-whole-file-reads.json',{'pin':PIN,'files':reads,'sourceBytes':sum(x['bytes'] for x in reads),'method':'Complete immutable source bytes read; every inventory span bound; supplemental full-file scan and context considered. Author traversal is not independent review.'})
 save('step-03-wave4d-population.json',{'pin':PIN,'completedBatches':list(SETS),'pendingBatches':[f'{i:03}' for i in range(75,83)],'stopReason':'Turn budget: stop after whole batch 074; do not claim 075–082 authored.','files':len(rs),'inventoryEdges':sum(len(r['inventoryEdgeIds']) for r in rs),'addedEdges':sum(len(r['checks']['coverage']['authorAddedEdgeIds']) for r in rs),'edges':sum(len(r['edges']) for r in rs),'patchedFiles':sum(bool(r['diff']) for r in rs),'dispositions':dict(collections.Counter(e['disposition'] for r in rs for e in r['edges'])),'parks':dict(collections.Counter(e['blockedCategory'] for r in rs for e in r['edges'] if e['disposition']=='parked')),'reviewAcceptance':'pending independent A51 review'})
 print(json.dumps({'files':len(rs),'edges':sum(len(r['edges']) for r in rs)}))
if __name__=='__main__':main()
