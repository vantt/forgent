#!/usr/bin/env python3
"""L12-37 corrections; patch records only, never consumer bytes."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,copy,collections
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('a',P/'step-03-wave2-author.py');a=importlib.util.module_from_spec(sp);sp.loader.exec_module(a)
m=a.m;PIN=a.PIN;m.SETS=tuple(f'{i:03}' for i in range(1,42))
def save(name,o):(P/name).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def rebuild(r):
 body=m.blob(PIN,r['file']).decode();changes=[]
 for e in r['edges']:
  if e['disposition']=='patch':changes+=m.replacement_changes(body,e['sourceSpans'],r['checks']['relativeResolution'][e['edgeId']]['replacement'])
 after=body
 for start,end,new in sorted(set(changes),reverse=True):after=after[:start]+new+after[end:]
 r['diff']=m.make_diff(r['file'],body,after)
 for e in r['edges']:
  if e['disposition']=='patch':
   hs=[h for h in m.hunks(r['diff']) if any('-'+body.splitlines()[s['line']-1] in h.splitlines() for s in e['sourceSpans'])]
   assert len(hs)==1,(e['edgeId'],len(hs));e['diffHunk']=hs[0].splitlines()[0]
def main():
 rs=[json.loads(line) for b in m.SETS for line in m.blob('HEAD',str(m.REL/'step-03-records'/f'batch-{b}.jsonl')).decode().splitlines()];before=copy.deepcopy(rs);c=m.Checker(PIN);hits=[]
 for r in rs:
  body=m.blob(PIN,r['file']).decode()
  for e in r['edges']:
   key=e['edgeId'];inv=c.entries.get(key) or e.get('authorAddedEdge');legacy=inv['normalizedReference'].split('#')[0]
   holders=c.renamed_alias_holders(r,e)
   if holders:
    hits.append({'file':r['file'],'edgeId':key,'legacy':legacy,'liveAliasHolders':holders})
    if key in ['maps-j-08367','maps-j-08368']:
     a.park(r,e,legacy,body,'Description needs rewrite: the paragraph claims the triage document has seven statuses versus ten in code, but its committed renamed holder already lists ten statuses in the status table and enumeration. Reconcile the stale seven-versus-ten claim before changing the citation.','description-rewrite')
    else:
     hints={'maps-j-03951':('Steps',[19,25,32,39,43]),'maps-j-04520':('Real example: two genuine gaps',[111,113,116]),'maps-j-04835':('Verify trông thế nào',[28,30,32,45,48])}
     hint,nums=hints[key];a.ALIASED_LIVE[key]=(hint,nums);a.alias_patch(r,e,legacy,body)
     e.pop('targetFacts',None)
   if key=='maps-j-06509':
    sibling=next(x for rr in rs for x in rr['edges'] if x['edgeId']=='maps-j-05130');owner=next(rr for rr in rs if any(x['edgeId']=='maps-j-05130' for x in rr['edges']))
    a.patch(r,e,legacy,body,sibling['target']);e['anchor']=sibling['anchor'];e['reason']='L12-37(3): undated live decision 0062 navigation; exact door-removal decision holder, Phase 9 patch specification.'
    r['checks']['anchors'][key]=copy.deepcopy(owner['checks']['anchors'][sibling['edgeId']]);r['checks']['relativeResolution'][key]['replacement']=m.form(e['matchedExpression'],r['file'],e['target'],e['anchor'])
    d=r['checks']['coverage']['descriptionTruth'][key];sd=owner['checks']['coverage']['descriptionTruth'][sibling['edgeId']];d.update(targetEvidence=copy.deepcopy(sd['targetEvidence']),assessment='Decision 0062 explicitly removes the raw dispatch execute door, matching this undated transition sentence; the separate current run invocation sentence is unchanged.')
    e.pop('targetFacts',None)
   if key=='maps-j-06502':
    a.park(r,e,legacy,body,'Description needs rewrite: the live sentence contrasts the current verification writer with the frozen docs/architect/ tree, which disappears at Phase 9. Restate the complete object/contrast while keeping the already-current verification writer literal.','description-rewrite')
   if r['reviewSet']=='batch-038' and 'h-36d872fbb0e5.md' in e['reason'] and e['disposition']=='preserve':
    passage=m.resolver.passage(body,e['sourceSpans'])
    if 'CoordinationSession' in passage:
     e['reason']='L12-31, L12-35(3), L12-37(5): Source path exists at author pin: docs/specs/runner.md; tree retires at Phase 9. Preserve the explicitly dated retirement framing '+repr(passage)+'. Non-executable successor note: docs/platform/runner/decisions/h-aabefc85f0c9.md.'
    elif 'Superseded by:' in passage:
     e['reason']='L12-35(3), L12-37(6): Source path exists at author pin: docs/specs/runner.md; tree retires at Phase 9. Preserve the history wrapper’s separate “Superseded by: Current execution ownership” line. Non-executable successor note: docs/platform/runner/spec.md.'
  # Refresh concrete distinct-claim reasons if a corrected member changes a unit.
  groups=collections.defaultdict(list)
  for e in r['edges']:groups[m.unit_id(body,e['sourceSpans'])].append(e)
  for group in groups.values():
   prior=next(x for x in before if x['file']==r['file']);old_edges={x['edgeId']:x for x in prior['edges']}
   if len({e['disposition'] for e in group})>1 and any(e!=old_edges[e['edgeId']] for e in group):
    for e in group:e['unitDispositionReason']=e['edgeId']+' '+e['matchedExpression']+' Distinct claim: '+e['reason']
  rebuild(r)
 changes=[]
 for old,new in zip(before,rs):
  oe={e['edgeId']:e for e in old['edges']}
  for e in new['edges']:
   prev=oe[e['edgeId']]
   if e!=prev or any(old.get('checks',{}).get(k,{}).get(e['edgeId'])!=new.get('checks',{}).get(k,{}).get(e['edgeId']) for k in ['anchors','relativeResolution','labelForm']):
    outcome=any(prev.get(k)!=e.get(k) for k in ['disposition','target','anchor','timing'])
    changes.append({'file':new['file'],'set':new['reviewSet'],'edgeId':e['edgeId'],'kind':'outcome' if outcome else 'record-text','before':prev,'after':e,'diffChanged':old['diff']!=new['diff']})
 for b in m.SETS:(P/'step-03-records'/f'batch-{b}.jsonl').write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs if r['reviewSet']=='batch-'+b))
 save('step-03-wave2-r2-changes.json',{'pin':PIN,'rule':'L12-37','scannedRecords':len(rs),'scannedCoverageEdges':sum(m.edge_count(r) for r in rs),'renamedAliasPreserveHits':hits,'outcomeChanges':sum(x['kind']=='outcome' for x in changes),'recordTextChanges':sum(x['kind']=='record-text' for x in changes),'outcomeChangedFiles':sorted({x['file'] for x in changes if x['kind']=='outcome'}),'changes':changes,'checkerChanges':['body Related lists count as navigation','renamed-alias preserve outside carriage/history fails','wrapped reference destinations distribute across all pinned spans; no token dropped','wrapped units require unique, non-overlapping consecutive physical spans and preserve continuation indentation/comment prefixes','normalize repo/ and path:line before alias lookup','citation-specific evidence anchors use repository GitHub slugs for Markdown and extractor anchors for plain references'],'consumerEdits':0})
 print(json.dumps({'hits':len(hits),'changes':len(changes),'outcomes':sum(x['kind']=='outcome' for x in changes)}))
if __name__=='__main__':main()
