#!/usr/bin/env python3
"""Apply L12-36 coverage closeout; no consumer writes or diff changes."""
import sys
sys.dont_write_bytecode=True
import importlib.util,json,pathlib,copy,re,collections
P=pathlib.Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('c',P/'step-03-check.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
PIN='ae141550c2e022310de7a0efea757580c0b2479f'
m.SETS=tuple([f'{i:03}' for i in range(1,34)]+['040','041']);c=m.Checker(PIN)
def write(name,x):(P/name).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def supplemental(f,body,span,legacy):
 key='author-L12-36-'+f.removesuffix('.md').replace('/','-')+'-L'+str(span['line'])+'C'+str(span['columnStart'])
 declaration=m.carriage_declaration(body,span['line'])
 reason='L12-36(1–3): inside literal carriage (L12-26(5)); declaration: '+declaration[1] if declaration else 'L12-36 full-scan closeout: retained root '+legacy+' exists at author pin; this docs/ placement-tree leaf conserves its current navigation spelling.'
 if f.endswith('legacy/README.md'):
  target='docs/platform/agent-coordination/'+('vision.md' if span['line']==246 else 'history/retired-engine/intent-preservation-ledger.md');assert target in c.tree
  reason+=' Non-executable successor note: '+target+'.'
 return dict(edgeId=key,sourceSpans=[span],matchedExpression=span['text'],disposition='preserve',diffHunk=None,reason=reason,target=None,anchor=None,timing='none',blockedReason=None,dependency=None,blockedCategory=None,dependencyCategory=None,unitId=m.unit_id(body,[span]),authorAddedEdge={'normalizedReference':legacy,'discoveryReason':'L12-36 checker-run declared-source/stated-parent table and fenced-tree scan','searchMethod':'step-03-check.py:scan_candidates / candidate_targets at pinned Git tree'})
def main():
 rs=[json.loads(line) for b in m.SETS for line in m.blob('1e3b1e3b65a7d98f91d12ecaae0262ae6924377d',str(m.REL/'step-03-records'/('batch-'+b+'.jsonl'))).decode().splitlines()];added=[];notes=[];proof=[]
 for r in rs:
  if r.get('retiresWithTree'):
   inv=[s for k in r['inventoryEdgeIds'] for s in c.entries[k]['physicalSpans']];scan=m.scan_candidates(PIN,r['file'],inv)
   proof.append({'file':r['file'],'scanCandidates':len(scan),'scanSha256':m.sha(json.dumps(scan,ensure_ascii=False,sort_keys=True)),'coverage':'L12-34(2) file-level retirement; per-edge authoring removed; complete inventory and pre-ruling supplemental ids conserved.'});continue
  f=r['file'];body=m.blob(PIN,f).decode();cov=r['checks']['coverage'];old={json.dumps(x['span'],sort_keys=True):x for x in cov['legacyScan']['candidates']}
  scan=m.scan_candidates(PIN,f,[s for k in r['inventoryEdgeIds'] for s in c.entries[k]['physicalSpans']]);items=[]
  for span in scan:
   item=copy.deepcopy(old.get(json.dumps(span,sort_keys=True),{'span':span}));targets=m.candidate_targets(f,body,span);hits=[t for t in targets if m.legacy_reference_target(t) and t in c.tree|c.dirs]
   required=bool(hits and (m.carriage_declaration(body,span['line']) or span['text'].endswith('/') or m.stated_contexts(body)[span['line']]['parents'] or m.stated_contexts(body)[span['line']]['leaf']))
   if not item.get('edgeId') and (required or f=='docs/doc-governance.md' and span['line']==50):
    e=supplemental(f,body,span,hits[0]);e['authorAddedEdge']['resolvedReferences']=hits
    if '{' in span['text']:
     e['authorAddedEdge']['normalizedReference']=m.stated_contexts(body)[span['line']]['parents'][-1]+'/'+span['text'];e['reason']+=' Complete brace-list source unit covers all three members without splitting its literal carriage bytes.'
    r['edges'].append(e);cov['authorAddedEdgeIds'].append(e['edgeId']);item={'span':span,'edgeId':e['edgeId']};added.append({'file':f,'edgeId':e['edgeId'],'span':span,'resolvedPaths':hits,'disposition':'preserve'})
   elif not item.get('edgeId') and not item.get('excludedReason'):
    item['excludedReason']='Actual stated-parent/source coordinates do not resolve to a retiring/legacy path; readings: '+repr(targets)
   items.append(item)
  cov['legacyScan']['candidates']=items;cov['legacyScan']['method']+='; L12-36 section-scoped stated parents, indentation-scoped fences, brace cells and explicit snapshot Source coordinates'
  for e in r['edges']:
   n=e['sourceSpans'][0]['line'];decl=m.carriage_declaration(body,n)
   if f.endswith('retired-engine/legacy/README.md') and n==222:decl=m.carriage_declaration(body,225)
   if decl and (decl[1] not in e['reason'] or e.get('targetFacts') or re.search(r'\bexist(?:s|ed|ing|ence)?\b|\b(?:absent|missing|present)\b|removed at|renamed at|not found',e['reason'].replace(decl[1],''),re.I)):
    reason='L12-36(2), L12-35(4): inside literal carriage (L12-26(5)); declaration: '+decl[1]
    for target in m.successor_notes(e['reason']):
     target=target.rstrip('.')
     if target in c.tree|c.dirs and target!=f:reason+=' Non-executable successor note: '+target+'.'
    notes.append({'file':f,'edgeId':e['edgeId'],'beforeReason':e['reason'],'afterReason':reason});e['reason']=reason;e.pop('targetFacts',None)
  proof.append({'file':f,'scanCandidates':len(scan),'joined':sum('edgeId' in i for i in items),'excluded':sum('excludedReason' in i for i in items),'scanSha256':m.sha(json.dumps(scan,ensure_ascii=False,sort_keys=True))})
 for b in m.SETS:
  (P/'step-03-records'/('batch-'+b+'.jsonl')).write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs if r['reviewSet']=='batch-'+b))
 line_audit=[]
 for r in rs:
  f=r['file']
  if f.endswith('retired-engine/legacy/README.md'):wanted={246,249}
  elif f=='docs/platform/proposals/component-authority-boundary-map.md':wanted=set(range(633,646))|set(range(687,696))|set(range(705,711))
  else:continue
  body=m.blob(PIN,f).decode();scan=m.scan_candidates(PIN,f,[])
  for span in scan:
   if span['line'] not in wanted:continue
   hits=[t for t in m.candidate_targets(f,body,span) if m.legacy_reference_target(t) and t in c.tree|c.dirs]
   joins=[e['edgeId'] for e in r['edges'] if any(s['line']==span['line'] and s['columnStart']<=span['columnStart'] and span['columnEndExclusive']<=s['columnEndExclusive'] for s in e['sourceSpans'])]
   if hits:assert joins,(f,span,hits)
   line_audit.append({'file':f,'span':span,'resolvedRetiringOrLegacyPaths':hits,'edgeIds':joins,'required':bool(hits)})
 write('step-03-wave1-closeout.json',{'pin':PIN,'ruling':'L12-36(1–3)','filesScanned':len(proof),'retirementRecords':sum(bool(r.get('retiresWithTree')) for r in rs),'addedEdges':added,'addedEdgeCount':len(added),'recordTextOnly':notes,'scanProof':proof,'namedLineCoverage':line_audit,'diffChanges':0,'existingEdgeOutcomeChanges':0,'checker':'step-03-wave1-closeout-check-result.json','probe':'step-03-wave2-probes-result.json','limits':'Record-only author closeout; no further semantic review required by L12-36(3); independent wave-2 review and runner-commit accounting remain Lead-owned.'})
if __name__=='__main__':main()
