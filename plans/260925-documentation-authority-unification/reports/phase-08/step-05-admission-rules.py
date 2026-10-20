"""L12-72 semantic-record invariants shared by all four authored seams.
Source intervals describe operations, not the ±3/40 context windows. Adjacent
independent expressions (e.g. a role label and currentPath) are not one operand.
"""
import re,collections,json,pathlib,importlib.util,itertools,functools
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
CATEGORIES={'root-only','scalar-pass-through','state-event-store','non-document-fs-probe','clone-directory','cargo-output-directory','accumulator','guard','text-label-join','table-row-serialization','finding-path-field','caller-data-formatting','comment-or-type','config-or-metadata','generated-data-text'}
RULES={'a-passage-agreement':'All pairs of overlapping operation intervals on the same line/passage agree in admission and effective disposition; independent adjacent expressions have distinct source intervals.','b-real-blocker':'No listed boilerplate or verbatim blocker shared by parks in different files; every park names the missing input/obligation for its own file.','c-render-owner':'Every generated source-copy reference/tuple derives its disposition from the exact source owner; a park cites an actually parked source owner.','d-own-operand':'Each admitted dynamic tuple has its exact document-yielding sub-expression pathOperand in its pinned passage; every rejection names a closed R5 nonDocumentUse category.','e-retired-successor':'Preserved retired decision citations carry a live successorNote with a real heading anchor.'}
def idof(e):return e.get('referenceId',e.get('id'))
def allitems(r):return r['references']+r['dynamicTraces']+r.get('authorAddedReferences',[])
def intervals(e):
 if 'originalTuple' in e:
  w=e.get('operationWitness');return [w] if w else []
 return [{'line':s['line'],'columnStart':s['columnStart'],'columnEndExclusive':s['columnEndExclusive']} for s in e.get('sourceSpans',[])]
def pairs(r):
 # ALL pair combinations, including dynamic–dynamic, never first-match joins.
 for a,b in itertools.combinations(allitems(r),2):
  if any(x['line']==y['line'] and x['columnStart']<y['columnEndExclusive'] and y['columnStart']<x['columnEndExclusive'] for x in intervals(a) for y in intervals(b)):
   yield a,b

def effective(e):return e.get('sourceOwnerDisposition',e['disposition']) if e['disposition']=='render-join' else e['disposition']
@functools.lru_cache(None)
def prior_record(path,line):return json.loads((ROOT/path).read_text().splitlines()[line-1])
def owner(locator,by):
 r=by[locator['file']]
 if locator['kind']=='step5':return next(e for e in allitems(r) if idof(e)==locator['id'])
 if locator['kind']=='inheritedSourceSlots':return r['inheritedSourceSlots'][locator['index']]['edge']
 record=prior_record(locator['recordFile'],locator['recordLine']);return next(e for e in record['edges'] if e.get('slotKey')==locator['slotKey'])
def retired(e):
 text=e.get('matchedExpression') or (e.get('originalTuple') or [None]*5)[4] or ''
 return bool(re.search(r'docs/decisions/\d{4}-|\b0000-index\.md',text))
def check(rs,context=None):
 by={r['file']:r for r in (context or rs)};errors=[];counts=collections.Counter();blocks=collections.defaultdict(set)
 for r in (context or rs):
  for e in allitems(r):
   if e.get('disposition')=='parked':blocks[e.get('blockedReason')].add(r['file'])
 def test(rule,loc,fn):
  counts[rule]+=1
  try:assert fn()
  except Exception as exc:errors.append({'rule':rule,'where':loc,'error':str(exc) or 'condition false'})
 for r in rs:
  f=r['file']
  for a,b in pairs(r):test('a-passage-agreement',f+':'+str(idof(a))+'/'+str(idof(b)),lambda a=a,b=b:(a['admission'],effective(a))==(b['admission'],effective(b)))
  for e in allitems(r):
   loc=f+':'+str(idof(e))
   if e.get('disposition')=='parked':
    def blocker(e=e):
     b=e.get('blockedReason') or ''
     return bool(b and f in b and len(blocks[b])==1 and not re.search(r'depends on supplied roots|no bounded artifact/export supplied|preserve gate bytes|exact source slot / source-data parity must own',b,re.I))
    test('b-real-blocker',loc,blocker)
   if r.get('generated') and r.get('sourceRenderProvenance',{}).get('sourceFile'):
    def render(e=e):
     o=owner(e['sourceOwner'],by);disp=o['disposition']
     if 'originalTuple' not in e:
      assert e['disposition']==('parked' if disp=='parked' else 'render-join')
      assert e['sourceOwnerDisposition']==disp
     else:assert (e['admission'],e['disposition'])==(o['admission'],disp)
     if e['disposition']=='parked':assert e['sourceOwner']['file'] in e['blockedReason'] and disp=='parked'
     return True
    test('c-render-owner',loc,render)
   if 'originalTuple' in e:
    def operand(e=e):
     if e['admission']=='REJECT':return e.get('nonDocumentUse') in CATEGORIES and not e.get('pathOperand')
     p=e.get('pathOperand');c=e.get('currentPassage',{}).get('text','');w=e.get('pathOperandWitness',{})
     
     if not(p and p.strip() and p in c and w.get('text')==p and w.get('line') is not None and e.get('nonDocumentUse') is None):return False
     lines=c.splitlines();n=w['line']-e['currentPassage']['startLine'];assert 0<=n<len(lines)
     assert lines[n][w['columnStart']-1:w['columnEndExclusive']-1]==p.split('\n')[0]
     return True
    test('d-own-operand',loc,operand)
   if e.get('disposition') in ['preserve','render-join'] and retired(e):
    def successor(e=e):
     note=e.get('successorNote');assert isinstance(note,str) and note
     path,sep,anchor=note.partition('#');file=ROOT/path;assert file.is_file()
     if sep:
      def slug(s):return re.sub(r'\s','-',re.sub(r'[^\w\s-]','',s.lstrip('# ').lower()))
      headings=[h for h in file.read_text().splitlines() if h.startswith('#') and slug(h)==anchor];assert headings
      text=e.get('matchedExpression') or (e.get('originalTuple') or [None]*5)[4] or ''
      code=re.search(r'docs/decisions/(\d{4})-',text)
      if code and code[1]!='0000':assert any(re.search(r'\b'+code[1]+r'\b',h) for h in headings),'successor heading must own the cited decision id'
     return True
    test('e-retired-successor',loc,successor)
 return {'rules':RULES,'checks':dict(counts),'failures':errors,'failureCount':len(errors)}

def review_obligations(rs,index,test,rule,sha,read):
 """R1 replaces full-evidence current projections with Lead window re-review.
 Historical packets remain hash-bound historical evidence. Current canonical
 changes are bound to the complete re-review list; no acceptance is inferred.
 """
 for part in index['parts']:
  def integrity(part=part):
   raw=(P/part['payload']).read_bytes()
   expected=part.get('sha256',part.get('payloadSha256'))
   assert sha(raw)==expected and len(raw)==part['bytes']<=400000
   d=json.loads(raw);items=d.get('records',d.get('items',[]))
   if 'records' in d:assert len(items)==part['records']<=60
  test(rule,'historical packet '+part['payload'],integrity)
 listing=read('step-05-seam4-rereview-list.json');listed={x['file']:x for x in listing['canonicalRecords']}
 for r in rs:
  def bind(r=r):
   assert sha(json.dumps(r,ensure_ascii=False,separators=(',',':')))==listed[r['file']]['recordSha256']
   if listed[r['file']]['itemsChanged'] and not r.get('generated'):assert r['file'] in listing['sourceRecords']
   assert listing['reviewStatus']=='pending Lead repack and independent semantic review'
  test(rule,'current re-review obligation '+r['file'],bind)
