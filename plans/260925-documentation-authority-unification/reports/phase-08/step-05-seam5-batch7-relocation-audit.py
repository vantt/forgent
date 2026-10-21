"""Audit exact original occurrence ancestry, rather than matching repeated scalar text."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,subprocess,functools,difflib,hashlib,collections
P=pathlib.Path(__file__).resolve().parent
@functools.lru_cache(None)
def inventory_pin(f):return json.loads((P/f).read_text())['inputCommit']
@functools.lru_cache(None)
def body(pin,f):return subprocess.check_output(['git','show',pin+':'+f],text=True)
@functools.lru_cache(None)
def mapping(oldpin,newpin,f):
 old=body(oldpin,f).splitlines();new=body(newpin,f).splitlines();out={}
 if old==new:return {i:i for i in range(1,len(old)+1)}
 for tag,a,z,c,d in difflib.SequenceMatcher(None,old,new,autojunk=False).get_opcodes():
  if tag=='equal':out.update({i+1:c+i-a+1 for i in range(a,z)})
 return out
def check(records=None):
 rs=[json.loads(l) for l in (P/'step-05-records/tests-judgment-batch7.jsonl').read_text().splitlines()] if records is None else records
 differences=[];counts=collections.Counter()
 for r in rs:
  f=r['file'];newpin=r['authorInputCommit'];new=body(newpin,f).splitlines()
  for e in r['dynamicTraces']:
   oldpin=inventory_pin(e['inventoryOrigins'][0]);old=body(oldpin,f).splitlines();n=e['originalTuple'][0];expr=e['originalTuple'][4].split('\n')[0]
   # Same exact origin witness that the census records (both line and column).
   start=e['originalTuple'][1]-1
   assert old[n-1][start:start+len(expr)]==expr,(f,e['id'])
   m=mapping(oldpin,newpin,f);expected=m.get(n)
   if expected:
    counts['equal-line-ancestry']+=1
    if e.get('historicalOnly') or e['currentLine']!=expected:
     differences.append({'file':f,'id':e['id'],'originalLine':n,'recordedCurrentLine':e['currentLine'],'expectedCurrentLine':expected,'originalText':old[n-1],'expectedText':new[expected-1]})
   else:counts['changed-or-removed-line']+=1
 out={'scope':'All 10529 original tuple occurrences; identical scalar text elsewhere is never an ancestry witness','counts':dict(counts),'differences':differences,'differenceCount':len(differences)}
 return out

if __name__=='__main__':
 out=check();(P/'step-05-seam5-batch7-relocation-audit.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out,ensure_ascii=False));sys.exit(bool(out['differences']))
