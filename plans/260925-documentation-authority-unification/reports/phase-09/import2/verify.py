"""Read-only current-byte proof; output to stdout. Uses the two unchanged frozen extractors.
Run: python3 -B plans/260925-documentation-authority-unification/reports/phase-09/import2/verify.py
"""
import copy,hashlib,json,re,subprocess,sys
from pathlib import Path
P=Path('plans/260925-documentation-authority-unification');O=P/'reports/phase-09/import2'
sys.path.insert(0,str(P/'reports/phase-09/ledgerfix'))
from bindings import documents,rows,effective,supersessions,at,digest,sha,KEYS
load=lambda p:json.loads(Path(p).read_text())
proof=load(O/'binding-refresh.json')
if 'textCatalog' in proof:
 pool=proof.pop('textCatalog')
 for key,text in pool.items():assert sha(text)==key,'corrupt text witness'
 def expand(x):
  if isinstance(x,dict):
   if set(x)=={'textRefSha256'}:return pool[x['textRefSha256']]
   return {k:expand(v) for k,v in x.items()}
  if isinstance(x,list):return [expand(v) for v in x]
  return x
 proof=expand(proof)
docs=documents();links=supersessions(docs)
source=load(P/'ledger/decisions/s16-import2-resync.json');candidatePaths=set(proof['incomingPlatformPaths']+proof['authoredCandidatePaths']);paths=set(candidatePaths)
paths.update(r['sourcePath'] for r in source['sourceBindings'])
cat=json.loads(subprocess.check_output(['node',str(O/'extract-units.mjs')],input=json.dumps({'paths':sorted(paths)}).encode()))
assert cat['extractors']==proof['extractors'];cat=cat['catalog']
fields=['anchor','unitKind','title','textDigest','startLine','endLine','ancestry'];w=lambda u:{k:u.get(k) for k in fields}
def check(row):
 assert all(k in row for k in KEYS)
 us=cat[row['targetOwner']]['units'];matched=[u for u in us if u['anchor']==row['targetAnchor'] and u['textDigest']==row['targetUnitDigest']]
 assert len(matched)==1,(row['targetOwner'],row['targetAnchor'])
 u=matched[0];assert row['targetAncestry']==u['ancestry'],'ancestry'
 if 'bindingSha256' in row:assert row['bindingSha256']==digest(row),'serialization'
 if 'placement' in row:
  i=us.index(u);assert row['placement']=={'selected':w(u),'previous':w(us[i-1]) if i else None,'next':w(us[i+1]) if i+1<len(us) else None,'content':u['text']},'placement'
 return u
for r in proof['checks']:
 row=at(docs[r['shard']],r['pointer']);assert {k:row[k] for k in KEYS}==r['target'];check(row)
for c in proof['changes']:
 row=at(docs[c['shard']],c['pointer']);assert row==c['after'];assert row['reviewStatus']=='pending'
 for key in ['preimage','current']:
  e=c[key];u=e['selected'];assert u['textDigest']
for o in proof['outputs']:assert sha(Path(o['path']).read_bytes())==o['afterSha256'],o['path']
for row in source['sourceBindings']:
 check(row)
 actual=[u for u in cat[row['sourcePath']]['units'] if u['anchor']==row['sourceAnchor'] and u['textDigest']==row['sourceUnitDigest']]
 assert len(actual)==1 and actual[0]['text']==row['sourceContent'],'stale source'
 for member in row['members']:check(member)
# Check *every* effective current binding in the affected files, not just the author list.
checked=0;historical=0
for f,d in docs.items():
 for ptr,row in rows(d):
  if row.get('targetOwner') not in candidatePaths or not row.get('targetAnchor'):continue
  if effective(f,ptr,row,docs,links)[:2]!=(f,ptr):historical+=1;continue
  check(row);checked+=1
# Every partial carry touched here points to a fresh complete source-line residual.
import difflib
res=load(O/'partial-carry-residuals.json')['rows']
for i,e in enumerate(res):
 row=at(docs[e['file']],'/'+ '/'.join(e['keys']));assert row['residualRef']==str(O/'partial-carry-residuals.json')+'#/rows/'+str(i)
 u=check(row);assert e['primaryTarget']=={k:row[k] for k in KEYS}
 sl=e['sourceWitness']['text'].splitlines();tl=u['text'].splitlines();ops=[list(v) for v in difflib.SequenceMatcher(None,sl,tl,autojunk=False).get_opcodes()]
 changed=[{'sourceLineInUnit':j+1,'text':sl[j]} for tag,a,b,c,d in ops if tag in ['replace','delete'] for j in range(a,b) if sl[j].strip()]
 assert e['opcodes']==ops and e['changedSourceLines']==changed
 assert e['residualText']=='\n'.join(v['text'] for v in changed) and e['residualSha256']==sha(e['residualText'])
 assert e['A34Accepted'] is False and e['outOfScopeProposalOnly'] is False
# Semantic conservation: exact new text exists in its sole current holder, not only a hash.
dist=Path('docs/specs/distribution.md').read_text();spec=Path('docs/platform/packaging-distribution/spec.md').read_text()
for prefix in ['- **RUL108','- **2026-10-23 — Terminal setup','- **2026-10-23 — Every YAML']:
 line=next(l for l in dist.splitlines() if l.startswith(prefix));assert spec.count(line)==1,prefix
assert '**Superseded on 2026-10-23 by RUL108' in spec
oldpolicy=Path('docs/platform/packaging-distribution/decisions/vendored-yaml-parser.md').read_text()
assert 'npm pack js-yaml' not in oldpolicy and 'not current maintenance instructions' in oldpolicy
legacy=Path('docs/specs/reading-map.md').read_text();navigation=Path('docs/reading-map.md').read_text()
for prefix in ['- `docs/platform/terminal-control/spec.md`','- `docs/platform/git/spec.md`','- `docs/platform/yaml-document/spec.md`']:
 line=next(l for l in legacy.splitlines() if l.startswith(prefix));assert navigation.count(line)==1,prefix
# Protected transition banner and both knowledge fixes must not be overwritten by source import.
oldnav=subprocess.check_output(['git','show',proof['sourceHEAD']+':docs/reading-map.md']).decode()
assert navigation.split('## 3. Transitional Note',1)[1].split('## 4. Related Files',1)[0]==oldnav.split('## 3. Transitional Note',1)[1].split('## 4. Related Files',1)[0]
assert navigation.count('fgos-coding-knowledge')==oldnav.count('fgos-coding-knowledge')
# No original exception rationale, kind, or approval is rewritten; only the four digest values.
p='scripts/check-legacy-docs-ratchet.exceptions.json';before=json.loads(subprocess.check_output(['git','show',proof['sourceHEAD']+':'+p]));after=load(p)
assert len(before['exceptions'])==len(after['exceptions']);ratchet=[]
for b,a in zip(before['exceptions'],after['exceptions']):
 if b!=a:
  cp=dict(a);cp['expectedDigest']=b['expectedDigest'];assert cp==b
  assert a['expectedDigest']==sha(Path(a['path']).read_bytes());ratchet.append(a['path'])
assert len(ratchet)==4
# Negative probes prove rejection of stale digest, wrong neighbours, parents-only and wrong recipe.
probe=next(at(docs[c['shard']],c['pointer']) for c in proof['changes'] if c['after'].get('placement') and c['after'].get('bindingSha256'))
negatives=[]
for name,mutate in [('stale digest',lambda x:x.update(targetUnitDigest='0'*64)),('wrong neighbour',lambda x:x['placement'].update(previous=None)),('parents-only ancestry',lambda x:x.update(targetAncestry=x['targetAncestry'][:-1])),('wrong serialization',lambda x:x.update(bindingSha256=sha(json.dumps({k:x[k] for k in KEYS},sort_keys=True,ensure_ascii=False))))]:
 bad=copy.deepcopy(probe);mutate(bad)
 if name=='parents-only ancestry':bad['bindingSha256']=digest(bad)
 try:check(bad)
 except (AssertionError,KeyError):negatives.append(name)
 else:raise AssertionError('negative probe accepted: '+name)
drift=load(P/'reports/phase-09/late-areas/legacy-drift.json');assert drift['counts']['missingChangedUnits']==0
assert all(not r['missingCarriage'] for r in drift['records'])
print(json.dumps({'status':'pass','authorSourcePin':proof['sourceHEAD'],'effectiveBindingsChecked':checked,'historicalOverlayPredecessorsNotRewritten':historical,'preimageAuthenticatedBindings':len(proof['checks']),'refreshedRows':len(proof['changes']),'freshSourceBindings':len(source['sourceBindings']),'partialCarryResiduals':len(res),'ratchetDigestRefreshes':ratchet,'legacyFiles':len(drift['records']),'missingCurrentUnits':0,'negativeProbesRejected':negatives,'independentReview':'pending; no gate acceptance or authority flip'},ensure_ascii=False,indent=2))
