#!/usr/bin/env python3
"""Pinned record authoring for the six skills/prompts scheduling sets, never consumers.
Reuse Step 3 resolver, anchors, source grouping, scanner and diff form.
"""
import sys
sys.dont_write_bytecode=True
import importlib.util,pathlib,json,re,collections,time,copy,posixpath
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('c',P/'step-03-check.py');m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
PIN='ae141550c2e022310de7a0efea757580c0b2479f';m.SETS=tuple(f'{i:03}' for i in range(34,40));c=m.Checker(PIN);v=m.resolver
RULES=['A51','L12-10 external-project conventions','L12-21..L12-36; current authoring rules digest']
def write(name,obj):(P/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
def witness(legacy,body,spans,why):
 result=v.resolve(PIN,legacy,v.passage(body,spans));w=v.witness(result,why)
 for g,q in zip(w['hitGroups'],result['queries']):
  g['category']='carriage' if not q['liveHitCount'] and q['hitCount'] else 'citation-only' if q['liveHitCount'] else 'dead';g['note']=why
 return w

def factual(path):
 path=path.removeprefix('repo/').split('#')[0];path=re.sub(r':\d+(?:[-–]\d+)?$','',path).rstrip('/')
 if any(x in path for x in ['<','*','{']):
  root=re.split(r'[<*{]',path)[0].rstrip('/');assert root in c.tree|c.dirs,(path,root)
  return 'Illustrative convention/pattern under committed directory '+root+'; no literal placeholder file is asserted.',[]
 if path in c.tree|c.dirs:return 'Source path exists at author pin: '+path+('; tree retires at Phase 9' if path.startswith(('docs/specs','docs/architect')) else '; current retained path stays literal')+'.',[{'path':path,'state':'exists'}]
 hist=m.path_history(PIN,path)
 if not hist:return 'Source path never existed in author-pin ancestry: '+path+'.',[{'path':path,'state':'never-existed'}]
 for rev in hist:
  changes=m.commit_changes(rev)
  renamed=next((r for r in changes if r[0].startswith('R') and r[1]==path),None)
  if renamed:return 'Source path renamed at '+rev+' to '+renamed[2]+'; original source spelling conserved.',[{'path':path,'state':'renamed','commit':rev,'successor':renamed[2]}]
  if ['D',path] in changes:return 'Source path removed at '+rev+' with no successor file: '+path+'.',[{'path':path,'state':'removed','commit':rev}]
 raise AssertionError(('unresolved history',path))

def preserve(r,e,legacy,body,claim):
 decl=m.carriage_declaration(body,e['sourceSpans'][0]['line'])
 if decl:e['reason']='L12-26(5), L12-35(4), L12-36: inside literal carriage (L12-26(5)); declaration: '+decl[1]
 else:
  facts,structured=factual(legacy);e['reason']='L12-26, L12-31, L12-35: '+facts+' '+claim
  if structured:e['targetFacts']=structured

def park(r,e,legacy,body,why,category='phase9-carry'):
 e.update(disposition='parked',blockedCategory=category,dependencyCategory=category,reason='L12-30, L12-32, L12-34: '+why,blockedReason=why,dependency=why)
 e['searchWitness']=witness(legacy,body,e['sourceSpans'],why)

def patch(r,e,legacy,body,target):
 target_body=m.blob(PIN,target).decode();key=e['edgeId'];e.update(disposition='patch',target=target,timing='Phase 9',reason='L12-34(4): wrapper Related navigation to the exact live whole-file area spec '+target+'; no subject/section locator is asserted by this list entry. Phase 9 patch specification only.')
 cov=r['checks']['coverage'];r['checks']['anchors'][key]={'targetCommit':PIN,'targetDigest':m.sha(target_body),'sourceLocatorTokens':[],'targetLines':[],'wholeFileJustification':'This Related list entry names the complete runner area spec as related reading; it asserts no section, count, version, runtime default or historical CoordinationSession claim. Separate Source/Superseded-by/retirement framing entries preserve independently.','locatorScopeReason':'Whole-file Related spec navigation, not a scoped business-rule or retirement narrative citation.'}
 cov.setdefault('writerTrace',{})[key]='read-only citation; no writer/default-root/schema/identity change'
 cov.setdefault('resolutionSearches',{})[key]=witness(legacy,body,e['sourceSpans'],e['reason'])
 r['checks']['labelForm'][key]={'status':'complete original link/path form conserved'}
 r['checks']['relativeResolution'][key]={'replacement':m.form(e['matchedExpression'],r['file'],target,None),'resolvedTarget':target,'targetCommit':PIN,'authorityStatus':'cutover-patch-only'}
 cov.setdefault('descriptionTruth',{})[key]={'sourcePassage':v.passage(body,e['sourceSpans']),'adjacentPassage':m.adjacent_passage(body,e['sourceSpans']),'targetCommit':PIN,'target':target,'targetDigest':m.sha(target_body),'comparisons':{k:{'verdict':'not-asserted','note':'The wrapper Related list names the runner spec only; '+k+' is not an assertion of this navigation entry. Historical retirement assertions are in separate source-bound units.'} for k in ['counts','ports','defaults','verbFileLists','versions','shippedStatus']},'assessment':'Pinned target is the live runner spec (title and metadata); this whole-file navigation entry adds no other descriptive claim.','targetEvidence':[{'line':1,'text':target_body.splitlines()[0]}]}

# These live references use committed doc-registry aliases, not prefix mapping.
ALIASED_LIVE={
 'maps-j-03973':('Watch out for: running', [74,90,94]),
 'maps-j-04126':('A third case:', [117,120,129,135]),
 'maps-j-04497':(None, []),
 'maps-j-04498':(None, []),
 'maps-j-04515':('executor cross-provider governance', [13,23,54]),
 'maps-j-04516':('A tool-registry entry is never', [210,215,219,223,238,240]),
 'maps-j-04735':('The same root cause, one call site earlier', [73,77,83]),
 'maps-j-04787':(None, []),
 'maps-j-04788':('Root cause:', [19,24,29,35]),
}

def alias_patch(r,e,legacy,body):
 aliases=v.aliases(PIN,legacy);paths={a['entry']['currentPath'] for a in aliases if a['entry'].get('currentPath')}
 assert len(paths)==1,(e['edgeId'],paths)
 target=paths.pop();assert target in c.tree and not v.carriage(m.blob(PIN,target).decode(),1,target)
 patch(r,e,legacy,body,target)
 key=e['edgeId'];hint,nums=ALIASED_LIVE[key];t=m.blob(PIN,target).decode();tl=t.splitlines();proof=r['checks']['anchors'][key]
 if hint:
  h=next(h for h in m.heading_sections(PIN,target) if hint.casefold() in tl[h['startLine']-1].casefold())
  # The field contract covers Field/check conditions/violation, so H1 is
  # the actual nearest common parent of the three pinned sections.
  assert all(h['startLine']<=n<=h['sectionEndLine'] for n in nums),(key,h,nums)
  e['anchor']=h['anchor'];proof.update(targetLines=nums,targetLineText=[tl[n-1] for n in nums],passage=h['body'],sourceLocatorTokens=[],locatorScopeReason='Complete adjacent claim is bound to pinned evidence lines; smallest enclosing extractor heading for those lines, using scripts/list-doc-anchors.mjs.')
  proof.pop('wholeFileJustification',None)
 else:
  proof['wholeFileJustification']='This navigation names the complete how-to/explanation by its subject (caller search, shared-fragment reuse, or install/tag policy), without claiming a particular rule, heading, version or operation within it; the whole document is the reusable subject. Pinned title, introductory purpose and all headings were read.'
  nums=[next(i for i,l in enumerate(tl,1) if l.startswith('# '))]
 replacement=m.form(e['matchedExpression'],r['file'],target,e['anchor']);r['checks']['relativeResolution'][key]['replacement']=replacement
 e['reason']='L12-26, L12-30, L12-32: committed doc-registry alias identifies the exact renamed live document; retarget this operative citation in its original path/label form to '+target+'; '+('specific evidence is enclosed by the actual extractor heading.' if hint else 'the citation names the complete guide/explanation as a reusable subject, with no section assertion.')+' Phase 9 specification only.'
 cov=r['checks']['coverage'];d=cov['descriptionTruth'][key]
 d['targetEvidence']=[{'line':n,'text':tl[n-1]} for n in nums]
 d['assessment']='The source’s complete adjacent paragraph/list item was compared with this exact renamed document and the pinned evidence. '+{
 'maps-j-03973':'The warning describes the already-committed fallback scramble; the target Watch out for section records the same timing failure and reconstruction cost.',
 'maps-j-04126':'The source explicitly cites the third case: a writer using an independent cwd root despite --dir. The target third-case section binds both writer and resolved root.',
 'maps-j-04515':'Field, check conditions and violation sections jointly state boolean allowCrossProvider, absence default and refusal. sensitiveData is expressly the rejected historical alternative in the source, not the target field.',
 'maps-j-04516':'The target explicitly retires automatic executor presence gating and requires an explicit caller query; the documented --status present flag is preserved.',
 'maps-j-04735':'The source names the sibling approve crash (tsk-5zg); the target same-root-cause section names that exact earlier caller and fatal branch error.',
 'maps-j-04788':'The target root-cause section explains missing dev skills in plugin-only installs; no docs or source checkout is assumed available in the caller project.',
 'maps-j-04818':'The target unification section explains domain/workflow/stage relationships and the skillMap/roleGraph domain ownership claimed in this source.'
 }.get(key,'The source names this complete reusable guide or explanation; no narrower locator or unrelated runtime status is asserted.')
 d['comparisons']={dimension:{'verdict':('matches' if dimension in ['defaults','verbFileLists','shippedStatus'] and key in ['maps-j-04126','maps-j-04515','maps-j-04516','maps-j-04788'] else 'not-asserted'),'note':d['assessment'] if dimension in ['defaults','verbFileLists','shippedStatus'] else 'The adjacent claim asserts no '+dimension+' about this target. Historical task ids are provenance, not versions/counts.'} for dimension in ['counts','ports','defaults','verbFileLists','versions','shippedStatus']}
 cov['resolutionSearches'][key]=witness(legacy,body,e['sourceSpans'],e['reason'])

def main():
 rs=[];reads=[];generated=[];start=time.monotonic()
 for file,b in m.population().items():
  began=time.monotonic();raw=m.blob(PIN,file);body=raw.decode();old=m.blob(m.INVENTORY,file);assert raw==old,'needs passage correspondence journal: '+file
  es=[e for e in c.entries.values() if e['consumerPath']==file];ids=[e['edgeId'] for e in es]
  generated_source=re.search(r'<!--[^\n]*(?:generated.from|source:)\s*`?((?:core/skills|domains/[^/]+/skills)/[^`\s>]+)',body,re.I)
  generated_path=file.startswith(('.agents/skills/','.claude/skills/')) or bool(re.match(r'plugins/.*/skills/',file))
  assert not generated_path and not generated_source,'Generated records need source-verified generated-render park: '+file
  generated.append({'file':file,'pin':PIN,'digest':m.sha(raw),'generatedSurface':False,'canonicalSkillSource':False,'evidence':'Consumer is a documentation file; no generated-from/source header or generated-wrapper marker; skill paths mentioned in prose do not make this document a render.'})
  r=dict(file=file,inventoryInputCommit=m.INVENTORY,authorInputCommit=PIN,inventoryFileDigest=m.sha(old),digest=m.sha(raw),inventoryEdgeIds=ids,diff='',edges=[],checks={'coverage':{'authorAddedEdgeIds':[]},'anchors':{},'relativeResolution':{},'labelForm':{}},reviewSet='batch-'+b,authoringRules=RULES)
  ls=body.splitlines();read={'file':file,'pin':PIN,'bytes':len(raw),'lines':len(ls),'sha256':m.sha(raw),'inventoryEdges':len(es),'orderedWholeFileChunks':[{'firstLine':i+1,'lastLine':min(i+80,len(ls)),'sha256':m.sha('\n'.join(ls[i:i+80]))} for i in range(0,len(ls),80)]}
  if m.may_retire(file):
   r={k:r[k] for k in ['file','inventoryInputCommit','authorInputCommit','inventoryFileDigest','digest','inventoryEdgeIds','reviewSet','authoringRules']};r.update(retiresWithTree=True,edgeIds=ids,authorAddedEdges=[],edges=[],diff='',reason='L12-34(2): Maintained playbook/prompt under the retiring architect tree; Phase 9 step 6 deletes this maintained consumer after reader cutover. Not a relocated byte-identical proof payload. No per-edge disposition or patch is applied; all inventory ids remain file-level coverage. No supplemental ids existed for these previously unauthored sets.')
  else:
   cov=r['checks']['coverage'];candidates=[]
   for inv in es:
    e={key:None for key in m.EDGE_FIELDS};e.update(edgeId=inv['edgeId'],sourceSpans=copy.deepcopy(inv['physicalSpans']),matchedExpression=inv['matchedExpression'],disposition='preserve',timing='none',reason='',unitId=m.unit_id(body,inv['physicalSpans']));r['edges'].append(e)
   for span in m.scan_candidates(PIN,file,[s for e in es for s in e['physicalSpans']]):
    token=span['text'];targets=m.candidate_targets(file,body,span);hits=[t for t in targets if m.legacy_reference_target(t) and t in c.tree|c.dirs]
    rawpath=token.removeprefix('repo/').split('#')[0];full=rawpath.startswith('docs/')
    if not hits and not full:
     candidates.append({'span':span,'excludedReason':'Actual consumer, stated-parent and declared snapshot source coordinates do not reach a retiring/legacy path; '+('illustrative manual artifact filename, not the unrelated retiring proof filename sharing its basename. ' if token.endswith('.md') else '')+'Resolved readings: '+repr(targets)});continue
    legacy=hits[0] if hits else rawpath
    key='author-wave2-'+file.removesuffix('.md').replace('/','-')+'-L'+str(span['line'])+'C'+str(span['columnStart'])
    e={key:None for key in m.EDGE_FIELDS};e.update(edgeId=key,sourceSpans=[span],matchedExpression=token,disposition='preserve',timing='none',reason='',unitId=m.unit_id(body,[span]),authorAddedEdge={'normalizedReference':legacy,'discoveryReason':'Complete-file supplemental legacy scan including stated-parent tables and fenced trees, and snapshot dual coordinates','searchMethod':'step-03-check.py:scan_candidates at immutable Git pin'})
    r['edges'].append(e);cov['authorAddedEdgeIds'].append(key);candidates.append({'span':span,'edgeId':key})
   cov['legacyScan']={'pin':PIN,'method':'Checker-run complete-file legacy full/partial/basename/directory scan with stated parents, fenced trees, brace cells and original-source snapshot readings; each hit joins an edge or a source-coordinate exclusion.','candidates':candidates}
   for e in r['edges']:
    legacy=(c.entries.get(e['edgeId']) or e['authorAddedEdge'])['normalizedReference'].split('#')[0];n=e['sourceSpans'][0]['line'];line=ls[n-1];decl=m.carriage_declaration(body,n)
    if decl:preserve(r,e,legacy,body,'');continue
    if m.related_header(body,n) and legacy.startswith(m.RETIRING_ROOTS):
     if legacy=='docs/specs/runner.md':patch(r,e,legacy,body,'docs/platform/runner/spec.md')
     elif e['edgeId']=='maps-j-05724':park(r,e,legacy,body,'Phase 9 carry review of duplicate Related entry: mapped historical snapshot is this consumer itself; consolidate the entry at cutover while keeping its separate provenance.')
     elif e['edgeId']=='maps-j-07250':park(r,e,legacy,body,'Phase 9 carry of live domainization collection navigation: docs/platform/domainization/README.md and spec.md are absent; architecture/domainization.md is a declared whole-source carriage, not a live area portal. Carry the actual domainization collection subject before redirecting this Related entry.')
     else:raise AssertionError(('unhandled Related',file,e['edgeId'],legacy))
    elif e['edgeId'] in ALIASED_LIVE:alias_patch(r,e,legacy,body)
    elif e['edgeId']=='maps-j-06494':
     e.update(disposition='phase9-row-flip',timing='Phase 9',reason='L12-35(2): whole migration-status row/paragraph flips: “This target directory preserves operational and bootstrap material from” / “It is navigationally promoted, but remains non-normative”. Replace the migration state of the playbooks directory after cutover; do not merely substitute its legacy source path.',dependency='Phase 9 complete migration paragraph cutover after source conservation; contracts, architecture, decisions and runtime keep their respective claims.')
     cov.setdefault('resolutionSearches',{})[e['edgeId']]=witness(legacy,body,e['sourceSpans'],e['reason'])
    elif e['edgeId']=='maps-j-03947':park(r,e,legacy,body,'Description needs rewrite: the live D1 process/build-time artifact list names the retiring docs/specs tree as a category; restate the category/authority distinction for the promoted structure as a complete list item at cutover, preserving its retained history/decision/backlog/how-to references. A directory substitution alone cannot express that distinction.','description-rewrite')
    elif e['edgeId']=='maps-j-04818':park(r,e,legacy,body,'Description needs rewrite: the adjacent claim says the cited sibling architecture work covers domain-to-many-workflows and domain-level skillMap/roleGraph ownership. The committed alias leads to the capability/executor/capacity explanation, whose sections cover capability vocabulary, config registry and dispatch, not this domain/workflow hierarchy. Reconcile the description and actual hierarchy holder together; a rename-only citation would assert unsupported content.','description-rewrite')
    elif e['edgeId']=='maps-j-04940':park(r,e,legacy,body,'Description needs rewrite: the live “escape valve” paragraph attributes current routing to the historical Native-First doctrine and an old .claude/skills/_shared path. The 0026 narrative is available in runner decisions, but its rule 2 was narrowed by 0033 and bind/config own current routing. Reconcile the entire current-governance claim and shared-fragment citation together before retargeting the wrapped decision path.','description-rewrite')
    else:
     claim='Preserve retained citation/convention spelling; it is outside retiring trees and carries no authority flip.'
     if e['edgeId'] in ['maps-j-03951','maps-j-04520','maps-j-04835']:
      claim='Preserve historical QA/implementation evidence: '+{'maps-j-03951':'the design explicitly labels this “Safety and QA process (D2/D5)” and describes the tests used by each tsk-56w child, rather than newly prescribing a migrated document layout.', 'maps-j-04520':'the Related entry explicitly identifies “real gaps hit while returning the sibling items” that built the mechanism; this is evidence lineage for the completed wiring.', 'maps-j-04835':'the path is inside the verbatim historical “D5: Quy trình đảm bảo chất lượng” quotation; keep the quoted decision text unchanged.'}[e['edgeId']]
      successors=[a['entry']['currentPath'] for a in v.aliases(PIN,legacy) if a['entry'].get('currentPath')]
      if successors:claim+=' Non-executable successor note: '+successors[0]+'.'
     if legacy.startswith(('docs/specs','docs/architect')):
      if e['edgeId']=='maps-j-06511':claim='L12-10: shipped reusable manual prompt says “The repository’s own agent instructions ... when present”; this is a target-project repository convention, not a fixed fgOS source-checkout reader. Keep the external-project example unchanged. Non-executable fgOS successor note: docs/reading-map.md.'
      elif e['edgeId']=='maps-j-06502':claim='Preserve the explicitly historical “frozen docs/architect/ tree” contrast; the operative write destination is already the current platform verification owner. No stale writer root is retargeted.'
      elif e['edgeId'] in ['maps-j-04834','maps-j-04836']:claim='Preserve the historical design/finished migration source spelling: “D1: Ranh giới trích dẫn” and “description was edited down to the 12 real non-skill files”; these describe the tsk-56w/tsk-2sp design at that time, not the promoted tree. Non-executable successor note: docs/platform/packaging-distribution/spec.md.'
      elif 'Provenance:' in line or line.startswith('Source:'):claim='Preserve Source/Provenance lineage independently from operative Related navigation.'
      elif 'Superseded by:' in line or 'retired' in line or 'removed' in '\n'.join(ls[max(0,n-4):n+2]).lower():claim='L12-35(3): preserve dated retirement/removed-door framing (“coordination engine was retired” or “removed ... decision 0062”), not a current read instruction. Non-executable successor note: docs/platform/runner/decisions/h-36d872fbb0e5.md.'
      elif e['edgeId']=='maps-j-04626':claim='Preserve completed adoption evidence, framed “before this fix ... after, a plugin-only install works too”; the citation identifies the spec updated by that past fix, not a new live area read. Non-executable successor note: docs/platform/packaging-distribution/spec.md.'
      else:raise AssertionError(('unhandled retiring reference',file,e['edgeId'],legacy,line))
     preserve(r,e,legacy,body,claim)
   # Concrete distinct claims, bound to every member of a mixed source unit.
   groups=collections.defaultdict(list)
   for e in r['edges']:groups[m.unit_id(body,e['sourceSpans'])].append(e)
   for group in groups.values():
    if len({e['disposition'] for e in group})>1:
     for e in group:e['unitDispositionReason']=e['edgeId']+' '+e['matchedExpression']+' Distinct claim: '+(e['reason'] if e['disposition']=='parked' else 'This independently names '+str(e['target'])+' as the live operative citation, with evidence in descriptionTruth; unrelated source-history citations keep their own spelling.' if e['disposition']=='patch' else 'This retained history/decision/backlog or how-to citation or explicitly quoted historical source has its own provenance; it is independent of the sibling operative reference or retiring-tree category.')
   changes=[]
   for e in r['edges']:
    if e['disposition']=='patch':
     a,b=m.bounds(body,e['sourceSpans'])[0];changes.append((a,b,r['checks']['relativeResolution'][e['edgeId']]['replacement']))
   after=body
   for a,b,replacement in sorted(set(changes),reverse=True):after=after[:a]+replacement+after[b:]
   r['diff']=m.make_diff(file,body,after)
   for e in r['edges']:
    if e['disposition']=='patch':
     rlines=[h for h in m.hunks(r['diff']) if any('-'+ls[s['line']-1] in h.splitlines() for s in e['sourceSpans'])];assert len(rlines)==1;e['diffHunk']=rlines[0].splitlines()[0]
  rs.append(r);read['addedEdges']=len(r.get('checks',{}).get('coverage',{}).get('authorAddedEdgeIds',[]));read['initialTraversalAndResolutionSeconds']=round(time.monotonic()-began,4);reads.append(read)
 for b in m.SETS:(P/'step-03-records'/('batch-'+b+'.jsonl')).write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs if r['reviewSet']=='batch-'+b))
 write('step-03-wave2-whole-file-reads.json',{'pin':PIN,'method':'Read complete pinned bytes in ordered chunks; inventory bindings + full-file checker scan; source context and dispositions are independently reviewable, not semantic acceptance.','files':reads,'sourceBytes':sum(r['bytes'] for r in reads),'authorElapsedSeconds':round(time.monotonic()-start,3)})
 write('step-03-wave2-generated-surfaces.json',{'pin':PIN,'checkedFiles':len(generated),'files':generated,'generatedRenderParks':[],'canonicalSkillSourceRecords':[],'limits':'These six accepted scheduling sets contain documentation consumers only. No .agents/skills, plugins/**/skills, .claude/skills or core/skills consumer is in this 60-file inventory. Skill paths discussed by docs are not imported as consumers; generated/source coordination for other classes remains Step 5. No synthetic generated-render park or source mapping is invented.'})
 write('step-03-wave2-population.json',{'pin':PIN,'files':len(rs),'inventoryEdges':sum(len(r['inventoryEdgeIds']) for r in rs),'retiringFiles':sum(bool(r.get('retiresWithTree')) for r in rs),'retiringEdges':sum(len(r['edgeIds']) for r in rs if r.get('retiresWithTree')),'activeFiles':sum(not r.get('retiresWithTree') for r in rs),'activeEdges':sum(len(r['edges']) for r in rs),'addedEdges':sum(read['addedEdges'] for read in reads),'patchedFiles':sum(bool(r['diff']) for r in rs),'dispositions':dict(collections.Counter(e['disposition'] for r in rs for e in r['edges'])),'parks':dict(collections.Counter(e['blockedCategory'] for r in rs for e in r['edges'] if e['disposition']=='parked')),'leadRulingGaps':[],'acceptance':'AUTHOR only; independent A51 per-set and per-stratum review pending; no self-acceptance.'})
if __name__=='__main__':main()
