#!/usr/bin/env python3
"""Apply L12-39 across all authored records; no consumer edits."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,re,copy,collections
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('prior',P/'step-03-wave3-r2-author.py');prior=importlib.util.module_from_spec(sp);sp.loader.exec_module(prior)
a3=prior.a3;m=prior.m;PIN=prior.PIN;c=prior.c
m.SETS=tuple(f'{i:03}' for i in range(1,72))
def save(n,o):(P/n).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def main():
 rs=m.records();before=copy.deepcopy(rs);hits=collections.defaultdict(list)
 for r in rs:
  if r.get('retiresWithTree'):continue
  body=m.blob(PIN,r['file']).decode();cov=r['checks']['coverage']
  for e in r['edges']:
   key=e['edgeId'];short=key.removeprefix('maps-j-');path=(c.entries.get(key) or e.get('authorAddedEdge'))['normalizedReference'].split('#')[0]
   if short in ('04295','04296','04297','04306','04307','04308'):
    prior.reset(e);a3.preserve(r,e,path,body,'L12-39(6): explicit Document history (compound-learn capture linkage) preserves original docPath and doc-sources capture identity, including quoted work.outcome. These are historical coordinates.');hits['document-history-preserve'].append(key)
   if '0001-event-log-la-su-that.md' in e['matchedExpression'] and e.get('blockedCategory')=='lead-ruling':
    prior.reset(e);a3.park(r,e,'docs/decisions/0001-event-log-la-su-that.md',body,'Dead link: deleted 0001 event-log doctrine citation. Number and title search found no promoted candidate decision narrative holder; existing event-store/laws discussions are principles or incidental citations, not the deleted 0001 decision narrative. Retain the historical spelling until a holder is explicitly carried.','dead-link')
    cov.setdefault('extraLocatorSearches',{})[key]=[{'query':q,'result':m.resolver.query(PIN,q),'category':'partial-holder','note':'Title search: general event-log doctrine appears, but no 0001 decision narrative heading.'} for q in ('event-log-la-su-that','Nhật ký sự kiện là sự thật','0001')];hits['deleted-0001-dead-link'].append(key)
   if short=='01705':
    e['reason']='L12-39 record-text correction: preserve this dated distillery analysis citation. '+a3.facts(e,path)+' The report was merged into beehive.md; this is historical provenance, not a live location claim. Non-executable successor note: docs/distillery/sources/beehive.md.';hits['01705-removal-fact'].append(key)
   if path=='docs/architecture-manifest.json':
    e['reason']=e['reason'].replace('exists at author pin; tree retires at Phase 9','exists at author pin; root authority is retained at Phase 9').replace('tree retires at Phase 9','root authority is retained at Phase 9')
    if short in ('04250','04253'):e['reason']+=' L12-39: retained root authority; verbatim candidate copy at docs/platform/contracts/architecture-manifest.json.';hits['retained-root-wording'].append(key)
   if e.get('disposition')=='preserve' and re.match(r'(?:repo/)?docs/decisions/\d{4}',path):
    wanted=m.removed_decision_holders(PIN,e,path);number=re.search(r'/decisions/(\d{4})',path)[1];allholders=m.decision_narrative_holders(PIN,number)
    reason=e['reason']
    # Remove old computed notes including their enclosing numeric subheadings.
    for note in m.successor_notes(reason):
     clean=note.rstrip('.')
     if clean.split('#')[0] in {x.split('#')[0] for x in allholders}:
      reason=re.sub(r' (?:Non-executable (?:file-level )?successor note|successor note):\s*`?'+re.escape(note)+r'`?\.?','',reason,flags=re.I)
    for holder in wanted:reason+=' Non-executable successor note: '+holder+'.'
    if number=='0035' and not wanted:reason+=' L12-39(1): source title is mission boundary; runner 0035 mutation-gate is a numeric collision, not a successor. Narrative remains docs/specs/platform-foundations.md, P8-DOC-GAP-02 carry required.'
    if reason!=e['reason']:e['reason']=reason;hits['number-title-successor'].append(key)
  # Source-computed supplemental scan, including previously omitted deleted basenames.
  old={tuple(x['span'].values()):x for x in cov.get('legacyScan',{}).get('candidates',[])}
  candidates=[]
  for span in m.scan_candidates(PIN,r['file'],[s for key in r['inventoryEdgeIds'] for s in c.entries[key]['physicalSpans']]):
   item=old.get(tuple(span.values()))
   match=next((e for e in r['edges'] if e.get('authorAddedEdge') and e['sourceSpans']==[span]),None)
   if match:item={'span':span,'edgeId':match['edgeId']}
   if item is None:
    exemption=m.coverage_exemption(r['file'],body,span)
    if exemption:item={'span':span,'excludedReason':exemption}
    else:
     assert re.fullmatch(r'00\d{2}-[\w-]+\.md',span['text']),span
     key='author-wave4c-'+r['file'].replace('/','-')+'-L'+str(span['line'])+'C'+str(span['columnStart']);path='docs/decisions/'+span['text']
     e={k:None for k in m.EDGE_FIELDS};e.update(edgeId=key,sourceSpans=[span],matchedExpression=span['text'],disposition='preserve',timing='none',reason='',unitId=m.unit_id(body,[span]),authorAddedEdge={'normalizedReference':path,'discoveryReason':'L12-39 deleted decision basename scan','searchMethod':'step-03-check.py scan_candidates'})
     if path=='docs/decisions/0000-index.md' and r['file'].startswith('docs/knowledge/'):
      a3.preserve(r,e,path,body,'L12-39(7): exact completed checker-output/fix evidence: '+repr(m.adjacent_passage(body,[span]))+'. Non-executable successor note: docs/decisions/index.md.')
     elif path=='docs/decisions/0000-index.md':
      a3.park(r,e,path,body,'Description needs rewrite: the live candidate comparison calls the deleted manual 0000-index.md the current fgOS index, contrasting it with a generated upstream index. Rewrite this entire row against the real retained generated docs/decisions/index.md and its owner before redirecting.','description-rewrite')
     else:a3.park(r,e,path,body,'Dead link: deleted decision basename has no promoted narrative holder for the stated title. Carry its narrative before redirecting.','dead-link')
     r['edges'].append(e);cov['authorAddedEdgeIds'].append(key);item={'span':span,'edgeId':key};hits['supplemental-decision-edge'].append(key)
   elif not item.get('edgeId') and m.coverage_exemption(r['file'],body,span):item['excludedReason']=m.coverage_exemption(r['file'],body,span)
   candidates.append(item)
  cov['legacyScan']['candidates']=candidates
  if r['file']=='docs/specs/work-state.md':
   for i,e in enumerate(r['edges']):
    if not re.search(r'\bRUL10\b',m.adjacent_passage(body,e['sourceSpans'])):
     r['edges'][i]={k:e[k] for k in ('edgeId','sourceSpans','matchedExpression')};r['edges'][i].update(retiresWithTree=True,reason='L12-39(2): outside the carried RUL10 passage; retires with docs/specs tree, no per-edge disposition or patch.')
     if e.get('authorAddedEdge'):r['edges'][i]['authorAddedEdge']=e['authorAddedEdge']
     for section in ('anchors','relativeResolution','labelForm'):r['checks'][section].pop(e['edgeId'],None)
     for section in ('descriptionTruth','writerTrace','resolutionSearches'):cov.get(section,{}).pop(e['edgeId'],None)
     hits['work-state-edge-retirement'].append(e['edgeId'])
   r['diff']='';r['authoringRules'].append('L12-39(2): carry only RUL10; other edges retire')
  else:prior.rebuild(r,body)
 changes=[];outfiles=set()
 for old,r in zip(before,rs):
  oldes={e['edgeId']:e for e in old['edges']}
  for e in r['edges']:
   oe=oldes.get(e['edgeId'])
   if oe==e:continue
   outcome=oe is None or any(e.get(k)!=oe.get(k) for k in ('disposition','target','anchor','timing','retiresWithTree'))
   changes.append({'file':r['file'],'set':r['reviewSet'],'edgeId':e['edgeId'],'kind':'outcome' if outcome else 'record-text','before':oe,'after':e})
   if outcome:outfiles.add(r['file'])
 for b in m.SETS:(P/'step-03-records'/f'batch-{b}.jsonl').write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs if r['reviewSet']=='batch-'+b))
 save('step-03-wave4b-r2-changes.json',{'pin':PIN,'scannedFiles':len(rs),'scannedEdges':sum(m.edge_count(r) for r in rs),'ruleHits':dict(hits),'outcomeChanges':sum(x['kind']=='outcome' for x in changes),'recordTextChanges':sum(x['kind']=='record-text' for x in changes),'outcomeChangedFiles':sorted(outfiles),'changes':changes,'semanticAcceptance':'Pending independent review; no consumer edit.'})
 print(json.dumps({'files':len(rs),'changes':len(changes),'outcomeFiles':len(outfiles),'hits':{k:len(v) for k,v in hits.items()}}))
if __name__=='__main__':main()
