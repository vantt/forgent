#!/usr/bin/env python3
"""Read-only complete step-02h → step-02i diff and review-finding joins; stdout JSON."""
import sys
sys.dont_write_bytecode=True
import json,importlib.util,collections,re
from pathlib import Path
r=Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('p',r/'step-02i-packet.py');p=importlib.util.module_from_spec(s);s.loader.exec_module(p)
h=p.load('step-02h-census-maps-portals-prose.json');c=p.load('step-02i-census-maps-portals-prose.json');joins=p.source_join(h['entries'],c['entries'])
fields=('normalizedReference','matchedExpression','rule','role','desiredOwner','desiredAnchor','cutoverAction','cutoverPatch','successorNote','carriagePolicy')
def trim(e):return {k:e.get(k) for k in fields}
rows=[]
for b in h['entries']:
 ns=joins[b['edgeId']]
 if not ns or any(p.enc(trim(b))!=p.enc(trim(n)) for n in ns):rows.append({'beforeRowId':b['edgeId'],'consumerPath':b['consumerPath'],'line':b['line'],'before':trim(b),'after':[{'edgeId':n['edgeId'],**trim(n)} for n in ns]})
known={n['edgeId'] for ns in joins.values() for n in ns};new=[e for e in c['entries'] if e['edgeId'] not in known]
findings=[]
mb={m['mappingId']:m for m in p.load('step-02h-distinct-mappings.json')['entries']};eb={e['edgeId']:e for e in h['entries']}
for file in sorted(r.glob('review-a38-step-02h-map-part-*.md')):
 for line in file.read_text().splitlines():
  if not line.startswith('|') or not re.search(r'\|\s*(?:rework|needs-Lead-judgment)\b',line):continue
  ids=list(dict.fromkeys(re.findall(r'(?:maps-h-\d{5}|mapping-h-(?:mapping-h-)?\d{4})',line)))
  resolved=[]
  for id in ids:
   id=id.replace('mapping-h-mapping-h-','mapping-h-')
   if id in mb:resolved+=mb[id]['edgeIds']
   elif id in eb:resolved.append(id)
  findings.append({'review':file.name,'sourceFinding':line[:4000],'beforeRowIds':sorted(set(resolved)),'afterRowIds':sorted({n['edgeId'] for id in resolved for n in joins[id]}),'status':'L12-25 parser disposition proposed; A50 independent re-review pending'})
obj={'baseline':'step-02h','inputHEAD':c['inputHEAD'],'join':'same committed consumer physical spans, overlapping columns; never row-number identity','fieldsCompared':fields,'changedSourceRows':len(rows),'newSourceUnits':new,'changes':rows,'reviewFindings':findings,'witnessDefectDiff':p.fifth_round_diff(c),'limits':'Witness counts are exact on explicitly listed real defects. Complete changed-field ledger is unsampled. Independent semantic acceptance remains pending.'}
print(json.dumps(obj,ensure_ascii=False,sort_keys=True))
