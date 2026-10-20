"""Option B exact windows, including every admitted literal and every tuple rejection."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,hashlib,subprocess,collections,importlib.util,copy,difflib
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
sha=lambda b:hashlib.sha256(b.encode() if isinstance(b,str) else b).hexdigest()
def read(n):return json.loads((P/n).read_text())
def save(n,d):(P/n).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
sp=importlib.util.spec_from_file_location('s5',P/'step-05-check.py');m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
rs=[r for f in sorted((P/'step-05-records').glob('generators-*.jsonl')) for r in map(json.loads,f.read_text().splitlines())];pilot=m.load();PIN=read('step-05-seam4-selection.json')['inputCommit']
# Refresh pilot canonical full projections including any fragmented receipt.
receipts=read('step-05-pilot-parity-receipts.json')['receipts'];specs=read('step-05-pilot-cutover-specs.json')['patches'];items=[]
for r in pilot:
 base={'file':r['file'],'recordPath':str(P.relative_to(ROOT)/'step-05-records'/(r['seamIds'][0]+'.jsonl')),'sourceSha256':r['sourceSha256'],'seam':r['seamIds'][0]}
 ls=m.pinned(r['authorInputCommit'],r['file']).splitlines(True)
 for start in range(0,len(ls),250):items.append({**base,'kind':'source-context','startLine':start+1,'endLine':min(start+250,len(ls)),'text':''.join(ls[start:start+250])})
 items.append({**base,'kind':'record-metadata','value':{k:v for k,v in r.items() if k not in ['references','dynamicTraces','priorRecordRefs']}})
 for k in ['references','dynamicTraces','priorRecordRefs']:
  for i,e in enumerate(r[k]):items.append({**base,'kind':k,'index':i,'value':e})
for r in receipts:items.append({'kind':'receipt','seam':r['seam'],'value':r})
def expand(items,threshold=250000):
 out=[]
 for ordinal,item in enumerate(items):
  raw=json.dumps(item,ensure_ascii=False,indent=2)
  if len(raw.encode())>threshold:
   chunks=[raw[i:i+40000] for i in range(0,len(raw),40000)]
   out.extend({'kind':'item-fragment','fragmentOf':ordinal,'fragment':i,'fragments':len(chunks),'completeItemSha256':sha(raw),'file':item.get('file'),'text':chunk} for i,chunk in enumerate(chunks))
  else:out.append(item)
 return out

def partition(items,key):
 parts=[];current=[]
 for it in items:
  raw=json.dumps({'inputCommit':PIN,'part':9999,key:current+[it]},ensure_ascii=False,indent=2)+'\n'
  if current and (len(raw.encode())>390000 or len(current)>=60):parts.append(current);current=[]
  current.append(it)
 if current:parts.append(current)
 return parts
parts=partition(expand(items),'items');ix=read('step-05-pilot-review-index.json');ix['parts']=[]
for i,part in enumerate(parts,1):
 name=f'step-05-pilot-p{i:02}.json';save(name,{'inputCommit':ix['inputCommit'],'part':i,'items':part});raw=(P/name).read_bytes();files=sorted({x['file'] for x in part if x.get('file')})
 ix['parts'].append({'part':i,'payload':name,'payloadSha256':sha(raw),'bytes':len(raw),'files':files,'fileRecords':len(files),'items':len(part),'report':f'review-a38-step-05-pilot-p{i:02}.md','reviewStatus':'pending'})
ix['closureNote']='L12-71 canonical refresh only; historical reviews remain attached to their original payload commit. Changed records reviewed in seam4 request.';save('step-05-pilot-review-index.json',ix)
# Historical rr projections still checked against their current canonical record projections.
ix=read('step-05-pilot-rereview-index.json');its=[it for p in ix['parts'] for it in read(p['payload'])['records']];byfile={r['file']:r for r in pilot};specby={s['file']:s for s in specs}
for it in its:
 r=byfile[it['file']];it['record']=next(e for e in r[it['kind']] if e.get('id',e.get('referenceId'))==it['id'])
 if 'cutoverSpecification' in it or it['record']['disposition']=='patch':it['cutoverSpecification']={k:v for k,v in specby[it['file']].items() if k not in ['symbolOrPassage','oldText','newText','expectedOutputSets','intentionalBehaviorDeltas']}
parts=partition(its,'records');ix['parts']=[]
for i,part in enumerate(parts,1):
 name=f'step-05-pilot-rr-p{i:02}.json';save(name,{'inputCommit':ix['inputCommit'],'part':i,'records':part});raw=(P/name).read_bytes()
 ix['parts'].append({'part':i,'payload':name,'sha256':sha(raw),'bytes':len(raw),'files':sorted({x['file'] for x in part}),'records':len(part),'report':f'review-a38-step-05-pilot-rr-p{i:02}.md'})
save('step-05-pilot-rereview-index.json',ix)
# New actual review request: ±40 pinned physical lines for all seam4 occurrences.
def window(item,r,a,b=None):
 b=b or a;ls=m.pinned(r['authorInputCommit'],r['file']).splitlines();a=min(max(1,a),len(ls));b=min(max(a,b),len(ls));start=max(1,a-40);end=min(len(ls),b+40)
 item.update(inputCommit=r['authorInputCommit'],sourceSha256=r['sourceSha256'],startLine=a,endLine=b,window={'startLine':start,'endLine':end,'text':'\n'.join(ls[start-1:end])})
 return item
items=[]
for r in rs:
 f=r['file'];items.append({'kind':'record-metadata','file':f,'record':{key:r[key] for key in ['file','authorInputCommit','sourceSha256','sourceMode','wholeFileRead','wholeFileReadEvidence','subBatch','generated','sourceRenderProvenance','receiptIds','supplementalSource']}})
 for k in ['references','dynamicTraces','authorAddedReferences']:
  for e in r[k]:
   id=e.get('referenceId',e.get('id'));it={'kind':k,'file':f,'id':id,'record':e}
   if r['wholeFileRead']:
    spans=e.get('sourceSpans');a=min(s['line'] for s in spans) if spans else e.get('currentLine') or e.get('currentPassage',{}).get('startLine',1);b=max(s['line'] for s in spans) if spans else a
    window(it,r,a,b)
   else:it['window']=None;it['constituents']=r['wholeFileReadEvidence']['constituents']
   items.append(it)
 # Source slots may be outside literal census; retain every inherited source disposition.
 for i,e in enumerate(r['inheritedSourceSlots']):
  covered={j['edgeId'] for ref in r['references'] for j in ref.get('physicalPriorJoins',[])}
  if e['edge']['edgeId'] in covered or e['edge']['disposition'] not in ['patch','parked']:continue
  spans=e['edge'].get('sourceSpans',[])
  if not spans or not r['wholeFileRead']:continue
  ls=m.pinned(r['authorInputCommit'],f).splitlines();n=spans[0]['line'];token=spans[0]['text'];note=None
  if n>len(ls) or token not in ls[n-1]:
   hits=[j for j,l in enumerate(ls,1) if token in l]
   if len(hits)==1:n=hits[0]
   else:n=min(max(1,n),len(ls));note='Inherited source binding requires final Step7 relocation; old span is provenance only, current window is explicitly a locator hint.'
  it={'kind':'inheritedSourceSlots','file':f,'index':i,'record':e,'relocationNote':note};window(it,r,n,n+max(s['line'] for s in spans)-min(s['line'] for s in spans));items.append(it)
# Include every pilot field changed since input pin; preserves old text notes as historical reports.
changes=[]
for r in pilot:
 path='step-05-records/'+r['seamIds'][0]+'.jsonl';oldrows=list(map(json.loads,m.pinned(PIN,str(P.relative_to(ROOT)/path)).splitlines()));old=next(x for x in oldrows if x['file']==r['file'])
 for k in ['references','dynamicTraces']:
  previous={e.get('referenceId',e.get('id')):e for e in old[k]}
  for e in r[k]:
   id=e.get('referenceId',e.get('id'))
   if previous[id]==e:continue
   change={'file':r['file'],'field':k,'id':id,'changedFields':sorted(key for key in set(e)|set(previous[id]) if e.get(key)!=previous[id].get(key))};changes.append(change)
   it={'kind':'pilot-closure','field':k,'file':r['file'],'id':id,'record':e,'change':change};spans=e.get('sourceSpans');a=min(s['line'] for s in spans) if spans else e['currentLine'];b=max(s['line'] for s in spans) if spans else a;window(it,r,a,b);items.append(it)
for s in read('step-05-seam4-cutover-specs.json')['patches']+specs:
 if s['file'] not in {c['file'] for c in changes} and s not in read('step-05-seam4-cutover-specs.json')['patches']:continue
 items.append({'kind':'cutover-specification' if s in read('step-05-seam4-cutover-specs.json')['patches'] else 'pilot-cutover-specification','file':s['file'],'record':s})
# Output and receipts are split mechanically only when a single evidence item exceeds the bound.
for receipt in read('step-05-seam4-parity-receipts.json')['receipts']:items.append({'kind':'receipt','id':receipt['id'],'record':receipt})
expanded=expand(items);parts=partition(expanded,'records');ix={'inputCommit':PIN,'method':'Owner option B, 100% admitted refs + every tuple/rejection + inherited source slots + all pilot closure changes; exact ±40 pinned source lines. Oversize evidence streams by digest-bound item fragments.','limits':{'records':60,'utf8Bytes':400000},'parts':[],'logicalItems':len(items),'streamedItems':len(expanded),'pilotChanges':changes,'canonicalFiles':[{'path':str(f.relative_to(ROOT)),'sha256':sha(f.read_bytes())} for f in sorted((P/'step-05-records').glob('generators-*.jsonl'))]}
for i,part in enumerate(parts,1):
 name=f'step-05-seam4-p{i:02}.json';save(name,{'inputCommit':PIN,'part':i,'records':part});raw=(P/name).read_bytes();ix['parts'].append({'part':i,'payload':name,'sha256':sha(raw),'bytes':len(raw),'records':len(part),'files':sorted({x['file'] for x in part if x.get('file')}),'report':f'review-a38-step-05-s4-p{i:02}.md','status':'pending'})
save('step-05-seam4-review-index.json',ix);save('step-05-seam4-pilot-changes.json',{'inputCommit':PIN,'changes':changes,'files':len({x['file'] for x in changes}),'ids':len(changes)})
print(json.dumps({'seam4Parts':len(parts),'logicalItems':len(items),'streamedItems':len(expanded),'maxBytes':max(x['bytes'] for x in ix['parts']),'maxRecords':max(x['records'] for x in ix['parts']),'pilotChangedIds':len(changes)}))
