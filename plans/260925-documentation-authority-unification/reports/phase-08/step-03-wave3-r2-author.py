#!/usr/bin/env python3
"""L12-38 corrections to records only; preserve historical review freezes."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,copy,collections,re
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('a3',P/'step-03-wave3-author.py');a3=importlib.util.module_from_spec(sp);sp.loader.exec_module(a3)
m=a3.m;PIN=a3.PIN;c=m.Checker(PIN);a3.c=c;a3.a.c=c
m.SETS=tuple(f'{i:03}' for i in range(1,70))
def save(name,o):(P/name).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def reset(e):
 e.update(disposition='preserve',target=None,anchor=None,timing='none',diffHunk=None,blockedReason=None,dependency=None,blockedCategory=None,dependencyCategory=None)
 e.pop('searchWitness',None)
def rebuild(r,body):
 changes=[]
 for e in r['edges']:
  if e['disposition']=='patch':changes+=m.replacement_changes(body,e['sourceSpans'],r['checks']['relativeResolution'][e['edgeId']]['replacement'])
 after=body
 for a,b,new in sorted(set(changes),reverse=True):after=after[:a]+new+after[b:]
 r['diff']=m.make_diff(r['file'],body,after);ls=body.splitlines()
 for e in r['edges']:
  if e['disposition']=='patch':
   hs=[h for h in m.hunks(r['diff']) if any('-'+ls[s['line']-1] in h.splitlines() for s in e['sourceSpans'])];assert len(hs)==1,(e['edgeId'],len(hs));e['diffHunk']=hs[0].splitlines()[0]
 groups=collections.defaultdict(list)
 for e in r['edges']:groups[m.unit_id(body,e['sourceSpans'])].append(e)
 for group in groups.values():
  if len({e['disposition'] for e in group})>1:
   for e in group:e['unitDispositionReason']=e['edgeId']+' '+e['matchedExpression']+' Distinct claim: '+e['reason']

def main():
 rs=m.records();before=copy.deepcopy(rs);hits=collections.defaultdict(list)
 dead={'04595':'docs/history/rename-fgos-executing-to-fgos-code-implement/CONTEXT.md','04596':'docs/knowledge/how-to-smoke-test-fgos-coding-implement-with-a-trivial-verif/smoke-test-fgos-code-implement-with-a-trivial-item.md','04693':'docs/history/doctor-check-enduser-docs-index-stale/plan.md'}
 for r in rs:
  if r.get('retiresWithTree'):continue
  body=m.blob(PIN,r['file']).decode();cov=r['checks']['coverage']
  for item in cov.get('legacyScan',{}).get('candidates',[]):
   if not item.get('edgeId') and m.coverage_exemption(r['file'],body,item['span']):
    item['excludedReason']=m.coverage_exemption(r['file'],body,item['span']);hits['rule5-exclusion-text'].append({'file':r['file'],'line':item['span']['line']})
  for e in r['edges']:
   key=e['edgeId'];short=key.removeprefix('maps-j-');n=e['sourceSpans'][0]['line'];legacy=(c.entries.get(key) or e.get('authorAddedEdge'))['normalizedReference'].split('#')[0]
   if short in ('04514','04517','01699'):
    reset(e);e.pop('targetFacts',None);number='0020' if short=='01699' else '0062';target='docs/platform/runner/decisions/h-36d872fbb0e5.md';h=next(h for h in m.heading_sections(PIN,target) if h['level']==3 and h['sample'].startswith(number+' '))
    a3.anchored_patch(r,e,legacy,body,target,h['anchor'],assessment={'0020':'Decision 0020 prohibits symlink/copy of .fgos into worker worktrees, explicitly without locks or isolation. The porting-log row distinguishes this settled narrow scope from the still-candidate broader isolation axis.','0062':'Decision 0062 removes raw dispatch execute/log/fanout doors and routes execution through run/workflow Units. The live source cites that exact removed-door decision; no dated-history preserve applies.'}[number]);hits['rule1-live-decision'].append(key)
   elif short in dead:
    reset(e);holder=dead[short];assert holder in c.tree
    a3.park(r,e,legacy,body,'Dead link: this live pointer never existed at the author pin ancestry. The existing name-drifted holder has no alias for this exact spelling; do not guess a patch. Non-executable successor note: '+holder+'.','dead-link');hits['rule2-dead-link'].append(key)
   elif short in ('01702','03890','03891','06511'):
    reset(e)
    why={'01702':'Description needs rewrite: the live candidate row’s Đích column names the removed hand-maintained docs/decisions/0000-index.md, while the comparison describes a generated complete-by-construction index. Restate the destination and its generation/ownership claim together. Non-executable successor note: docs/decisions/index.md.', '03890':'Description needs rewrite: the present-tense heading “Where the doc lives now” names a retiring architect location. Rewrite the complete move/location account at cutover, keeping commit ba7b62ac as historical evidence.', '03891':'Description needs rewrite: the present-tense heading “Where the doc lives now” names a retiring architect location. Rewrite the complete move/location account at cutover, keeping commit ba7b62ac as historical evidence.', '06511':'Description needs rewrite: the shipped live prompt says “read docs/specs/reading-map.md and the owning area spec”. Restate both the root reading-map destination and the owning candidate area spec together; L12-38(6) overrules the external-project inference.'}[short]
    a3.park(r,e,legacy,body,why,'description-rewrite');hits['rule3-or6-description'].append(key)
   elif short in ('08367','08368'):
    reset(e);a3.preserve(r,e,legacy,body,'L12-38(4): this source unit lies in the retired-decision region introduced by “relocated verbatim”; its seven-versus-ten status comparison is point-in-time history, not a current description to rewrite. Non-executable successor note: docs/knowledge/fgos-triage-table-columns/triage-table-columns.md.');hits['rule4-region-history'].append(key)
   # All preserved removed decision ids, including short/elided forms, get computed holders.
   if e['disposition']=='preserve':
    for holder in m.removed_decision_holders(PIN,e,legacy):
     if holder not in m.successor_notes(e['reason']):e['reason']+=' Non-executable successor note: '+holder+'.';hits['rule3-narrative-note'].append({'file':r['file'],'edgeId':key,'holder':holder})
    # Dated decision-citation preserves retain the spelling, with a record-only successor.
    context=' '.join(body.splitlines()[max(0,n-5):n+2])
    if legacy=='docs/specs/runner.md' and m.history_scope(r['file'],body,n) and re.search(r'decision\s+0062',context,re.I) and not m.carriage_declaration(body,n):
     holder=m.decision_narrative_holders(PIN,'0062')[0]
     if holder not in m.successor_notes(e['reason']):e['reason']+=' Non-executable successor note: '+holder+'.';hits['rule1-history-note'].append(key)
   # Review text corrections; no source/diff change.
   if short=='04515':e['reason']=e['reason'].replace('specific evidence is enclosed by the actual extractor heading.','the whole-reference Field/check/refusal claim spans multiple sections, whose nearest common parent is the recorded H1.')
   if short=='04818':e['reason']+=' Non-executable successor note: docs/knowledge/coding-domain-s-role-holder-axis-and-task-spec-ontology/why-coding-domain-has-a-role-holder-axis-and-task-spec-ontology.md. The rewrite owner must verify the “Workflow hierarchy: domain → N workflows” claim there.'
   if short=='04940':e['reason']+=' The decision-citation blocker is the narrowed current-routing doctrine; the shared-fragment spelling is adjacent context, not another legacy docs edge.'
   if short in ('05979','05984','05989','05993','05997'):e['unitId']=m.unit_id(body,e['sourceSpans'])
   if short in ('06035','06047'):
    a3.preserve(r,e,legacy,body,'L12-37(5), L12-38: preserve wrapper dated retirement framing before Literal Snapshot: '+repr(body.splitlines()[n-1])+'. Non-executable successor note: docs/platform/runner/decisions/h-aabefc85f0c9.md.')
   if short in ('08343','08347'):e['reason']=e['reason'].replace('dated completed-action evidence','retained-path navigation').replace('dated completed-action','retained-path navigation')
   if r['file']=='docs/distillery/comparison-matrix.md':
    e['reason']=e['reason'].replace('dated learning-source/deep-dive citation and its dated comparison context','living matrix reference to a retained source file')
   if short in ('01804','01805','01806','01807','01841','01845','01863','01875','01700','01703'):
    if short in ('01863','01700'):
     e.pop('targetFacts',None);e['reason']='L12-10, L12-38: preserve the forgent workshop topology token ./repo; this is not a documentation path or an assertion about docs/distillery/repo.'
    elif short=='01703':
     e.pop('targetFacts',None);e['reason']='L12-10, L12-38: preserve beehive’s upstream generated docs/decisions/index.md coordinate in the dated comparison; not the fgOS retained index or its generation contract.'
    else:
     a3.preserve(r,e,legacy,body,'L12-38(7): preserve the dated fgOS-side distillery analysis observation, not an upstream coordinate or current navigation. Source marker: '+repr(body.splitlines()[n-1][:700])+'.')
   if short in ('01732','01777','01792','01883','01884','01885','01886','01894'):
    e.pop('targetFacts',None);e['reason']='L12-10, L12-38: preserve upstream source/runtime coordinates in the explicitly named external repository analysis. This does not assert an fgOS path state or a dated marker on this individual Where entry.'
  rebuild(r,body)
 changes=[];outcome_files=[];text_files=[]
 for old,r in zip(before,rs):
  if old==r:continue
  oldby={e['edgeId']:e for e in old['edges']};out=False
  for e in r['edges']:
   olde=oldby[e['edgeId']]
   if e!=olde:
    outcome=any(e.get(k)!=olde.get(k) for k in ('disposition','target','anchor','timing')) or old['checks'].get('relativeResolution',{}).get(e['edgeId'],{}).get('replacement')!=r['checks'].get('relativeResolution',{}).get(e['edgeId'],{}).get('replacement')
    changes.append({'file':r['file'],'set':r['reviewSet'],'edgeId':e['edgeId'],'kind':'outcome' if outcome else 'record-text','before':olde,'after':e});out|=outcome
  (outcome_files if out else text_files).append(r['file'])
 for b in m.SETS:(P/'step-03-records'/f'batch-{b}.jsonl').write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs if r['reviewSet']=='batch-'+b))
 save('step-03-wave3-r2-changes.json',{'pin':PIN,'scannedFiles':len(rs),'scannedEdges':sum(m.edge_count(r) for r in rs),'ruleHits':dict(hits),'outcomeChanges':sum(x['kind']=='outcome' for x in changes),'recordTextChanges':sum(x['kind']=='record-text' for x in changes),'outcomeChangedFiles':sorted(set(outcome_files)),'textOnlyFiles':sorted(set(text_files)),'changes':changes,'coverageExclusions':'All history/carriage exempt exclusions now state L12-38(5), rather than false unrelated-file inference; existing added preserve edges retained.','reviewAcceptance':'pending; author corrections only'})
 print(json.dumps({'files':len(rs),'outcomeChanges':sum(x['kind']=='outcome' for x in changes),'textChanges':sum(x['kind']=='record-text' for x in changes),'outcomeFiles':outcome_files,'hits':{k:len(v) for k,v in hits.items()}}))
if __name__=='__main__':main()
