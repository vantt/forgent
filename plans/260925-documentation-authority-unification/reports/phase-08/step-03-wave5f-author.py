#!/usr/bin/env python3
"""Pinned per-consumer records 105–113; source traversal, existing resolver and checker primitives."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,re,copy,collections,posixpath,argparse
P=pathlib.Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('q',P/'step-03-wave5f-common.py');q=importlib.util.module_from_spec(s);s.loader.exec_module(q)
m=q.m;a=q.a;w=q.w;c=q.c;PIN=q.PIN
NEW=tuple(f'{i:03}' for i in range(105,114))
def preserve(r,e,path,body,why):
 if m.carriage_declaration(body,e['sourceSpans'][0]['line']):a.a.preserve(r,e,path,body,'');return
 if path.removeprefix('repo/').startswith(('docs/specs/','docs/architect/')):
  # Source spans and the full pinned file carry the exact quotation; reasons describe its role.
  for marker in ('Source role:','Adjacent role:'):
   why=why.split(marker,1)[0]
 w.preserve(r,e,path,body,why)
 # The inherited factual helper predates the exact tree-prefix boundary.
 if not path.removeprefix('repo/').startswith(('docs/specs/','docs/architect/')):e['reason']=e['reason'].replace('; tree retires at Phase 9','')
def park(r,e,path,body,why,category='description-rewrite'):
 a.a.park(r,e,path,body,why,category)
def rowflip(r,e,body,replacement):
 e.update(disposition='phase9-row-flip',timing='Phase 9',reason='L12-26(6), L12-35(2): complete migration-state row/status group flips only at Phase 9. Source: '+m.adjacent_passage(body,e['sourceSpans'])+' Replacement: '+replacement+' Retained path spellings remain literal; no early authority promotion.',dependency='Phase 9 owner approval, accepted conservation, coordinated reading-map merge, GAP-02 carry and Step 5 reader/writer parity.')
def patch(r,e,path,body,target,hint=None,assessment=''):
 if target==r['file']:
  park(r,e,path,body,'Description needs rewrite: the live Related/navigation item redirects to this consumer itself. Remove/consolidate the entire self pointer at cutover, preserving Source provenance separately (L12-40(2)).');return
 w.patch(r,e,path,body,target,hint,assessment)
def alias_patch(r,e,path,body,assessment):
 aliases={x['entry']['currentPath'] for x in m.resolver.aliases(PIN,path) if x['entry'].get('currentPath')}
 assert len(aliases)==1,(e['edgeId'],path,aliases)
 patch(r,e,path,body,aliases.pop(),assessment=assessment)

def source_column(body,e):
 line=body.splitlines()[e['sourceSpans'][0]['line']-1]
 if not line.startswith('|'):return False
 ls=body.splitlines();n=e['sourceSpans'][0]['line']-1;start=n
 while start and ls[start-1].startswith('|'):start-=1
 headers=ls[start].split('|');column=line[:e['sourceSpans'][0]['columnStart']-1].count('|')
 return column<len(headers) and bool(re.search(r'\b(?:source|original|provenance|evidence)\b',headers[column],re.I))

def disposition(r,e,path,body):
 f=r['file'];n=e['sourceSpans'][0]['line'];line=body.splitlines()[n-1];key=e['edgeId'];context=m.adjacent_passage(body,e['sourceSpans']);canonical=a.legacy_path(path)
 if m.carriage_declaration(body,n):preserve(r,e,path,body,'');return
 if f=='docs/platform/platform-foundations.md' and (48<=n<=58 or n in (30,41,42) or m.unit_id(body,e['sourceSpans']).startswith('canonical-')):
  rowflip(r,e,body,'docs/platform-foundations.md retains exclusive full binding law wording, rationale and review thresholds. This page is promoted orientation/summary; retire the specs projection only after full non-law narrative carry (GAP-02). Retain law root paths without changing locked law text.');return
 # Live wrapper Related is distinct from captured source metadata and provenance.
 if m.related_header(body,n) and canonical.startswith(m.RETIRING_ROOTS):
  targets={'docs/specs/runner.md':'docs/platform/runner/spec.md','docs/specs/observe.md':'docs/platform/observe/spec.md','docs/specs/distribution.md':'docs/platform/packaging-distribution/spec.md','docs/architect/workspace-topology.md':'docs/platform/system-architecture/architecture/workspace-topology.md','docs/architect/packaging-distribution/history/distribution-baseline.md':'docs/platform/packaging-distribution/history/distribution-baseline.md'}
  if canonical=='docs/specs/platform-foundations.md':
   park(r,e,path,body,'P8-DOC-GAP-02: this Related item names the whole curated platform-foundations area spec, whose full decision narrative has no accepted complete candidate holder. Root laws and the candidate summary cannot replace that full subject; carry before redirect.','GAP-02');return
  if f.startswith('docs/platform/proposals/') and canonical not in targets:
   if canonical=='docs/architect/documentation-system-design.md':
    park(r,e,path,body,'Description needs rewrite: Related names the original documentation design; its retained carrier is source-only history. Reconcile the complete Related subject with the actual live full-horizon proposal without self navigation or promotion of carriage.');return
   target='docs/platform/proposals/'+posixpath.basename(canonical)
   if target==f:
    park(r,e,path,body,'Description needs rewrite: Related names this proposal through its original retiring source identity. The exact candidate is the consumer itself; remove/consolidate the Related item at cutover, preserving the separate Provenance/Source relationship.');return
   if target in c.tree and not m.resolver.carriage(m.blob(PIN,target).decode(),1,target):
    patch(r,e,path,body,target,assessment='Related names this complete proposal as a companion, without asserting a particular implementation or section; its candidate-native holder retains the full proposal subject.');return
   park(r,e,path,body,'Phase 9 carry: the Related original proposal has only source-snapshot carriage, not a separate live authority. Keep original lineage separately and reconcile the full Related subject before reader cutover.','phase9-carry');return
  if canonical=='docs/architect/workspace-topology.md':
   park(r,e,path,body,'Phase 9 carry: Related names the complete Workspace Topology architecture. Its exact docs/platform/system-architecture/architecture/workspace-topology.md holder declares Agent carriage and preservation of the complete frozen source, not live authority. Carry/promote and bind the full topology contract before redirecting this reading item.','phase9-carry');return
  assert canonical in targets,('Related',key,canonical)
  patch(r,e,path,body,targets[canonical],assessment='This Related item names the whole area specification/topology, separate from original Source provenance. The exact candidate retains that complete area contract; no subsection, count, shipped-status or runtime default is asserted by this reading list.');return
 if re.search(r'^(?:Provenance:|Source type:|\*\*Source:\*\*|Source relationship:|Source:)',line) or line.startswith('Conserved from ') or 'Source: `' in line or 'verbatim restoration of' in line or 'complete source units from' in line or 'exact earlier source unit from' in line:
  preserve(r,e,path,body,'L12-47, L12-51(1): original Source/Provenance lineage and conservation input are literal, not a current navigation instruction. Source role: '+repr(context));return
 if m.history_scope(f,body,n) or m.captured_evidence_at(body,n):
  preserve(r,e,path,body,'L12-38/L12-40: actual historical source region or captured command/schema/metadata records original identity, separate from wrapper Related and live prose. Source role: '+repr(context));return
 if source_column(body,e) or (line.startswith('| source ') or line.startswith('| old ') or line.startswith('| Source ')):
  preserve(r,e,path,body,'L12-25/L12-26: this Source/Evidence column or explicitly labelled source relationship binds the original design/proof input; it is provenance, not an instruction to adopt retiring authority. Source role: '+repr(context));return
 if f.startswith('docs/platform/host-invocation-routing/'):
  if key=='maps-j-07161':
   rowflip(r,e,body,'The retired keep-legacy disposition is complete. Retiring maintained host-invocation sources are removed after conservation; original inputs remain provenance/evidence at their declared holders, without retaining the old tree as live compatibility.');return
  if canonical.startswith(('docs/platform/','docs/history/')) or canonical in ('docs/architecture-map.md','docs/architecture-manifest.json','docs/doc-governance.md','docs/reading-map.md'):
   preserve(r,e,path,body,'L12-26(3): existing candidate-native or retained source/proof reference remains literal. Adjacent role: '+repr(context));return
  if canonical.startswith('docs/architect/'):
   preserve(r,e,path,body,'L12-26(5), L12-51(1): explicitly named historical source/proof input of the host migration and preservation ledger, not current reading authority. Adjacent role: '+repr(context));return
 if f=='docs/platform/intent-preservation-ledger.md':
  if key=='maps-j-07172':
   park(r,e,path,body,'P8-DOC-GAP-02: the PF-I001 mission reopening evidence names the full D-ADR0035 narrative in platform-foundations area spec, beyond root locked laws. Carry complete mission/config/Iron Law narrative to an accepted real holder before redirect.','GAP-02');return
  if key=='maps-j-07180':
   target='docs/platform/runner/subcomponents/h-6979005beaf7/spec.md';tl=m.blob(PIN,target).decode().splitlines();nums=[i for i,l in enumerate(tl,1) if l.startswith('- **RUL104 ')];assert nums
   h=next(h for h in reversed(m.heading_sections(PIN,target)) if all(h['startLine']<=n<=h['sectionEndLine'] for n in nums))
   a.anchored_patch(r,e,path,body,target,h['anchor'],nums=nums,locators=['RUL104'],assessment='PF-I022 cites RUL104 as the deferred automatic-resume contract. The exact rule retains manual --resume after controller death and the unit-control single-taker guarantee; automatic detection/continuation is explicitly deferred until proven and authorized. The ledger likewise says awaiting-resume still needs explicit --resume; no claim of unattended implementation is introduced.');return
 if f=='docs/platform/migration-authoring-rules.md' and canonical.startswith(('docs/specs','docs/architect')):
  if key in ('maps-j-07182','maps-j-07183','maps-j-07184','maps-j-07185'):
   rowflip(r,e,body,'After accepted cutover, update only the single declared current owner from the promoted route table. No dual authoring or maintained compatibility source remains in retired roots; preserve original evidence separately.');return
  park(r,e,path,body,'Step 5 parity: this rule describes the legacy-docs ratchet actual roots, baseline, exceptions and non-authority payload exemptions. Retire/reconcile the entire rule together with scripts/check-legacy-docs-ratchet.mjs population/default roots and conservation behavior; no path-only policy claim.','step5-parity');return
 if f=='docs/platform/observe/spec.md' and canonical.startswith(('docs/reference/','docs/how-to/')):
  if n==22:
   preserve(r,e,path,body,'L12-26(5): candidate correction metadata records the exact old relative-link spellings rebased in the earlier conservation action; it is lineage, not current reading.');return
  if canonical in c.tree:
   preserve(r,e,path,body,'L12-26(3): the named eval rubric remains a retained current artifact at its exact path; no alias or target change.');return
  alias_patch(r,e,path,body,'The complete current artifact is the named eval rubric / blind comparison how-to, respectively. The source recommends those whole artifacts beside independently owned versioned contract filenames; it asserts no changed rubric score, command flag, observation schema or implementation status about the target.');return
 if f=='docs/platform/packaging-distribution/reports/track-closeout.md':
  preserve(r,e,path,body,'L12-51(1): this verification closeout records the completed panel merge, exact link/read-through proof inputs and errata. These are original evidence identities, not a new navigation/default-root recipe. '+repr(context));return
 if f.startswith('docs/platform/packaging-distribution/'):
  if key in ('maps-j-07342','maps-j-07343','maps-j-07344'):
   park(r,e,path,body,'Description needs rewrite: the current install/init paragraph cites RUL15/RUL16 through the retiring distribution spec identity, while those rules are already in this consumer. Consolidate the complete rule gloss and internal locator at cutover; no self-file redirect or changed Windows/download semantics.');return
  if f.endswith('/verification/source-preservation-audit.md') and (n in (56,57) or n>=109):
   preserve(r,e,path,body,'L12-51(1): exact legacy source names in the completed P9 removal/errata finding; recorded proof inputs keep their original identities under L12-51(1). '+repr(context));return
  if key=='maps-j-07234':
   patch(r,e,path,body,'docs/reading-map.md',assessment='Coordinator Setup asks for the whole reading map before packet work. The root reading map is the merge destination for specs reading-map at Phase 9 and retains whole-project reader orientation; the whole-map read is not a section-specific contract.');return
  if key=='maps-j-07235':
   rowflip(r,e,body,'After accepted conservation and reader cutover, retire maintained packaging-distribution architect sources; retain provenance/evidence at declared holders. Do not add redirects or retain maintained compatibility docs in the retired tree.');return
  if key=='maps-j-07237':
   target='docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md'
   patch(r,e,path,body,target,assessment='The complete runtime-identity architecture distinguishes Distribution Pin from active activation binding. The distribution-pin verification row invokes that whole distinction, whose full definition and lifecycle span the contract, rather than a new status or runtime root.');return
  if canonical.startswith(('docs/history/','docs/platform/')) or canonical in ('docs/distribution-vision.md','docs/coexistence.md','docs/architecture-manifest.json'):
   preserve(r,e,path,body,'L12-26(3): retained root/current candidate or original evidence path. No authority/writer/schema/default-root change. Adjacent role: '+repr(context));return
  raise AssertionError(('packaging live',key,canonical,context))
 if f=='docs/platform/platform-foundations.md':
  if key in ('maps-j-07431','maps-j-07432'):
   park(r,e,path,body,'Description needs rewrite: this live paragraph says all platform decision narratives reside in docs/specs/<area>.md. Post-cutover narratives are split among explicit area decision/subcomponent holders; reconcile the complete index/narrative-authority statement without inventing a universal template destination.');return
  if m.unit_id(body,e['sourceSpans']).startswith('canonical-') or n in (30,41,42):
   rowflip(r,e,body,'docs/platform-foundations.md retains exclusive full binding law wording, rationale and review thresholds. This candidate page is the promoted orientation/summary; retire the specs projection only after full non-law narrative carry (GAP-02), and do not duplicate or rewrite locked laws.');return
  if canonical=='docs/specs/platform-foundations.md':
   park(r,e,path,body,'P8-DOC-GAP-02: Spec projection navigation names the complete platform-foundations area spec, including historical decision narratives. Root laws are retained; the full non-law projection subject needs accepted carry before retirement.','GAP-02');return
  preserve(r,e,path,body,'L12-26: retained locked-law root or preserved original full-source region identity; law wording, thresholds and retained paths remain unchanged. '+repr(context));return
 if f=='docs/platform/process/spec.md' and canonical=='docs/specs/runner.md':
  patch(r,e,path,body,'docs/platform/runner/spec.md',assessment='The table describes whole runner context for the Node leaf and its callers; the complete runner spec owns that caller area. Actual process facts remain this component contract. No caller count, process guarantee, version or signal behavior is asserted about the target.');return
 if f.startswith('docs/platform/proposals/'):
  if key in ('maps-j-07493','maps-j-07494'):
   rowflip(r,e,body,'| H1 — Platform authority unification | Platform readers/writers use declared promoted owners and retained root authorities; maintained specs/architect trees retire after accepted conservation | Atomic cutover complete; remaining verification and closeout stay in plans/260925-documentation-authority-unification/plan.md. H2/H3 remain separate deferred horizons. |');return
  if key in ('maps-j-07495','maps-j-07496'):
   rowflip(r,e,body,'After accepted atomic cutover, each platform claim has one declared owner in the promoted topology or a retained root authority. Retiring maintained trees no longer provide live authority; source provenance/history remains separate. This states the whole post-cutover topology without promoting H2/H3.');return
  if canonical=='docs/explanation/new-random.md':
   preserve(r,e,path,body,'L12-26: explicitly illustrative invalid old-writer/self-named path in the attestation failure example; no literal existing document or current navigation target is asserted. '+repr(context));return
  if key in ('maps-j-07536','maps-j-07537'):
   park(r,e,path,body,'P8-DOC-GAP-02: current read/write side user-authoring/index specs have no full accepted Phase 6 candidate destination. Preserve user/platform profile boundaries; carry complete subject before redirecting these operative read pointers.','GAP-02');return
  if key=='maps-j-07468' or key=='maps-j-07552':
   patch(r,e,path,body,'docs/reading-map.md',assessment='The live reading context asks for the complete project Reading Map. specs reading-map merges into root docs/reading-map.md before retirement; no subsection/line coordinate or additional behavior is asserted.');return
  if key in ('maps-j-07506','maps-j-07507'):
   preserve(r,e,path,body,'L12-40: illustrative sourcePaths identity in the proposed schema example records the original input, not a new writer destination. '+repr(context));return
  if key=='maps-j-07531' or key=='maps-j-07534':raise AssertionError('example handled above')
  if key=='maps-j-07551':
   park(r,e,path,body,'Step 5 parity: A0.0 asks to write the baseline and inventory report under a retiring architect proposal convention. Coordinate the actual plan/report authoring convention and consumers; this is a proposed output path, not a citation rewrite.','step5-parity');return
  if key=='maps-j-07553':
   patch(r,e,path,body,'docs/platform/runner/spec.md',assessment='A0 baseline Files to inspect first names the whole runner spec, whose candidate area holder is the complete same subject. No particular legacy line, route, config default or shipped implementation is asserted by this reading list.');return
  if key=='maps-j-07554':
   park(r,e,path,body,'Dead link: optional Files to inspect first names docs/specs/work.md if present, but that exact path has no committed live holder. Work-state is a different concrete filename; reconcile the optional subject explicitly rather than invent a target alias.','dead-link');return
  if key in ('maps-j-07555','maps-j-07556','maps-j-07557'):
   target={'maps-j-07555':'docs/platform/packaging-distribution/spec.md','maps-j-07556':'docs/platform/system-architecture/architecture/workspace-topology.md','maps-j-07557':'docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md'}[key]
   if m.resolver.carriage(m.blob(PIN,target).decode(),1,target):
    park(r,e,path,body,'Phase 9 carry: this Files to inspect first entry needs the entire '+canonical+' subject, but its exact candidate is source-only architecture carriage. Reconcile a real live full-subject owner before redirect.','phase9-carry');return
   patch(r,e,path,body,target,assessment='Files to inspect first names this complete area spec/architecture, not a particular paragraph or implementation truth. The exact candidate retains that full subject; source remains a proposal and confers no execution authority.');return
  if key=='maps-j-07547':
   target=canonical.replace('docs/architect/','docs/platform/',1)
   if target in c.tree:
    assert m.blob(PIN,target)==m.blob(PIN,canonical)
    patch(r,e,path,body,target,assessment='The exact step-09 MVP6–MVP9 evidence index mirror is byte-identical at the pin. Source points to the full index, not an implemented capability claim; evidence conservation remains required.');return
   park(r,e,path,body,'Phase 9 carry: the exact Step-09 MVP6–MVP9 evidence index has no committed mirror; carry and bind the full proof before redirect.','phase9-carry');return
  if canonical.startswith(('docs/specs','docs/architect')):
   park(r,e,path,body,'Description needs rewrite: this live proposal passage names a retiring topology/source arrangement or an obsolete current design/read target. Reconcile the complete adjacent recommendation and its exact owner rather than a path substitution into source carriage. Source claim: '+repr(context));return
  if canonical.startswith(('docs/how-to/','docs/explanation/','docs/reference/')) and canonical not in c.tree:
   alias_patch(r,e,path,body,'The live proposal points to the complete companion guide/history artifact by its original subject. The committed registry alias identifies its exact complete holder; no legacy section/line or new current implementation claim is imported.');return
 if canonical.startswith('docs/history/') and any(x in canonical for x in ('<','*','{')):
  preserve(r,e,path,body,'L12-10/L12-26: retained history/report topology convention, with literal placeholder intact and no invented concrete file. No authority or writer-root migration is proposed. '+repr(context));return
 if canonical in c.tree|c.dirs and not canonical.startswith(('docs/specs/','docs/architect/')):
  preserve(r,e,path,body,'L12-26(3): retained-root or candidate-native artifact remains at its committed path. Adjacent role: '+repr(context));return
 raise AssertionError(('unresolved',f,key,path,context))

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--first',type=int,default=105);ap.add_argument('--last',type=int,default=113);args=ap.parse_args();sets=tuple(f'{i:03}' for i in range(args.first,args.last+1));assert set(sets)<=set(NEW);m.SETS=sets
 rs=[];reads=[]
 for file,b in m.population().items():
  if rs and rs[-1]['reviewSet']!='batch-'+b:
   previous=rs[-1]['reviewSet'].removeprefix('batch-');q.write(previous,[r for r in rs if r['reviewSet']=='batch-'+previous])
  raw=m.blob(PIN,file);old=m.blob(m.INVENTORY,file);assert raw==old;body=raw.decode();ls=body.splitlines();invs=[e for e in c.entries.values() if e['consumerPath']==file]
  r=dict(file=file,inventoryInputCommit=m.INVENTORY,authorInputCommit=PIN,inventoryFileDigest=m.sha(old),digest=m.sha(raw),inventoryEdgeIds=[e['edgeId'] for e in invs],diff='',edges=[],checks={'coverage':{'authorAddedEdgeIds':[]},'anchors':{},'relativeResolution':{},'labelForm':{}},reviewSet='batch-'+b,authoringRules=['A51','L12-10','L12-21..L12-51; complete current authoring digest'])
  for inv in invs:
   e={k:None for k in m.EDGE_FIELDS};e.update(edgeId=inv['edgeId'],sourceSpans=copy.deepcopy(inv['physicalSpans']),matchedExpression=inv['matchedExpression'],disposition='preserve',timing='none',reason='',unitId=m.unit_id(body,inv['physicalSpans']));r['edges'].append(e)
  cov=r['checks']['coverage'];candidates=[]
  for span in m.scan_candidates(PIN,file,[s for e in invs for s in e['physicalSpans']]):
   exempt=m.coverage_exemption(file,body,span);token=span['text'];link=re.fullmatch(r'!?\[[^\]]+\]\(([^)]+)\)',token);rawpath=(link[1] if link else token).split('#')[0];origin=m.relative_decision_origin(PIN,file,rawpath);targets=m.candidate_targets(file,body,span);hits=[t for t in targets if m.legacy_reference_target(t) and t in c.tree|c.dirs]
   native=[t for t in targets if t.startswith('docs/platform/') and t in c.tree|c.dirs]
   native_precedence=bool(native and not m.carriage_declaration(body,span['line']) and not origin and not rawpath.removeprefix('repo/').startswith('docs/') and not rawpath.endswith('/') and not m.stated_contexts(body)[span['line']]['parents'] and not m.stated_contexts(body)[span['line']]['leaf'])
   if native_precedence and not exempt:
    candidates.append({'span':span,'excludedReason':'L12-34(5–7): outside source carriage, the actual candidate-native reference takes precedence over unrelated same-basename legacy source coordinates. Existing native readings '+repr(native)});continue
   if exempt or (not origin and not hits and not rawpath.removeprefix('repo/').startswith('docs/')):
    candidates.append({'span':span,'excludedReason':exempt or 'Actual consumer/stated-parent coordinates do not resolve a legacy documentation referent; candidate-native/code/artifact names are not unrelated basename matches. Resolved readings '+repr(targets)});continue
   path=origin or (hits[0] if hits else rawpath.removeprefix('repo/'));key='author-wave5f-'+file.removesuffix('.md').replace('/','-')+'-L'+str(span['line'])+'C'+str(span['columnStart'])
   e={k:None for k in m.EDGE_FIELDS};e.update(edgeId=key,sourceSpans=[span],matchedExpression=token,disposition='preserve',timing='none',reason='',unitId=m.unit_id(body,[span]),authorAddedEdge={'normalizedReference':path,'discoveryReason':'Complete pinned traversal plus supplemental literal/link/stated-parent/original source coordinate scan.','searchMethod':'Existing step-03-check.py scan_candidates/candidate_targets at fixed author pin'});r['edges'].append(e);cov['authorAddedEdgeIds'].append(key);candidates.append({'span':span,'edgeId':key})
  cov['legacyScan']={'pin':PIN,'method':'Complete pinned source traversal; existing full/partial/basename/directory/link and stated-parent scan, including original-source carriage coordinates. Every candidate joins an edge or source-bound contextual exclusion.','candidates':candidates}
  for e in r['edges']:disposition(r,e,q.path_for(e),body)
  q.finish(r,body);rs.append(r);reads.append({'file':file,'pin':PIN,'bytes':len(raw),'lines':len(ls),'sha256':m.sha(raw),'inventoryEdges':len(invs),'orderedWholeFileChunks':[{'firstLine':i+1,'lastLine':min(i+80,len(ls)),'sha256':m.sha('\n'.join(ls[i:i+80]))} for i in range(0,len(ls),80)]})
  print(json.dumps({'file':file,'edges':len(r['edges']),'dispositions':dict(collections.Counter(e['disposition'] for e in r['edges']))}),flush=True)
 for b in sets:q.write(b,[r for r in rs if r['reviewSet']=='batch-'+b])
 q.save('step-03-wave5f-whole-file-reads-'+sets[0]+'-'+sets[-1]+'.json',{'pin':PIN,'files':reads,'method':'Complete immutable byte traversal and source-unit assessment; inventory binding plus supplemental scan; author traversal is not independent acceptance.'})
if __name__=='__main__':main()
