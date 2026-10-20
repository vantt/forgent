"""Bind cross-census generated occurrences to original Step3 slots by pinned physical content."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,hashlib,subprocess,difflib,functools,collections
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
sha=lambda b:hashlib.sha256(b.encode() if isinstance(b,str) else b).hexdigest()
@functools.lru_cache(None)
def body(pin,file):return subprocess.check_output(['git','show',pin+':'+file],cwd=ROOT).decode()
@functools.lru_cache(None)
def linemap(old,new,file):
 out={}
 for a,b,n in difflib.SequenceMatcher(None,body(old,file).splitlines(),body(new,file).splitlines(),autojunk=False).get_matching_blocks():
  for k in range(n):out[a+k+1]=b+k+1
 return out
counts=collections.Counter()
for f in sorted((P/'step-05-records').glob('generators-*.jsonl')):
 rs=list(map(json.loads,f.read_text().splitlines()))
 for r in rs:
  own=r['file'];slots=r['inheritedSourceSlots']
  for e in r['references']:
   e['physicalPriorJoins']=[]
   for entry in slots:
    old=entry['edge'];pr=next(x for x in r['priorRecordRefs'] if x['recordFile']==entry['recordFile'] and x['recordLine']==entry['recordLine'])
    if not pr.get('authorInputCommit') or not old.get('sourceSpans'):continue
    mp=linemap(pr['authorInputCommit'],r['authorInputCommit'],own)
    overlaps=[(a,b) for a in old['sourceSpans'] for b in e['sourceSpans'] if mp.get(a['line'])==b['line'] and a['columnStart']<b['columnEndExclusive'] and b['columnStart']<a['columnEndExclusive'] and (a['text'] in b['text'] or b['text'] in a['text'])]
    if overlaps:
     e['physicalPriorJoins'].append({'recordFile':entry['recordFile'],'recordSha256':entry['recordSha256'],'recordLine':entry['recordLine'],'edgeId':old['edgeId'],'slotKey':old.get('slotKey'),'disposition':old['disposition'],'sourceSpans':old['sourceSpans'],'inputCommit':pr['authorInputCommit'],'join':'exact physical content via pinned unchanged-line mapping; original ids unchanged'})
   counts['referencesWithPrior']+=bool(e['physicalPriorJoins']);counts['qualifiedPriorJoins']+=len(e['physicalPriorJoins'])
 f.write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs))
(P/'step-05-seam4-prior-join-result.json').write_text(json.dumps(dict(counts),indent=2)+'\n');print(json.dumps(dict(counts)))
